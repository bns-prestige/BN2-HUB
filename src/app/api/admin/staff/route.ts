import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const permissionKeys = ["tickets.read","tickets.manage","interventions.read","interventions.manage","clients.read","contracts.read","assets.read","assets.manage","documents.read","documents.manage","worklogs.read","worklogs.create"] as const;

async function requireAdmin() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error:"unauthorized" }, { status:401 }) };
  if (!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role ?? ""))) {
    return { error: NextResponse.json({ error:"forbidden" }, { status:403 }) };
  }
  return { user };
}

function cleanPermissions(value:unknown) {
  const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
  return Object.fromEntries(permissionKeys.map(key=>[key,input[key]===true]));
}

export async function GET() {
  const access=await requireAdmin();
  if("error" in access)return access.error;
  const admin=createAdminClient();
  const {data:staff,error}=await admin.from("staff_members")
    .select("id,user_id,employee_number,department,job_title,employment_status,permissions,started_on,created_at")
    .order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:"staff_load_failed"},{status:500});
  const ids=(staff??[]).map(item=>item.user_id);
  const {data:profiles}=ids.length?await admin.from("profiles").select("id,full_name,email").in("id",ids):{data:[]};
  const map=new Map((profiles??[]).map(profile=>[profile.id,profile]));
  return NextResponse.json({staff:(staff??[]).map(item=>({...item,profile:map.get(item.user_id)??null}))},{headers:{"Cache-Control":"private, no-store"}});
}

export async function POST(request:Request) {
  const access=await requireAdmin();
  if("error" in access)return access.error;
  const admin=createAdminClient();
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
  const email=String(body.email??"").trim().toLowerCase();
  const fullName=String(body.fullName??"").trim();
  const department=String(body.department??"Support IT").trim();
  const jobTitle=String(body.jobTitle??"Technicien IT").trim();
  const employeeNumber=String(body.employeeNumber??"").trim()||null;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||fullName.length<2||fullName.length>120)
    return NextResponse.json({error:"Vérifiez le nom complet et l'adresse e-mail."},{status:400});

  const {data:userList,error:listError}=await admin.auth.admin.listUsers({page:1,perPage:1000});
  if(listError)return NextResponse.json({error:"auth_directory_unavailable"},{status:500});
  const existing=userList.users.find(item=>item.email?.toLowerCase()===email);
  if(existing&&["bn2_owner","bn2_admin"].includes(String(existing.app_metadata?.role??"")))
    return NextResponse.json({error:"Cette adresse appartient déjà à un administrateur BN2."},{status:409});
  if(existing){
    const {data:membership}=await admin.from("organization_members").select("id").eq("user_id",existing.id).eq("status","active").maybeSingle();
    if(membership&&!["bn2_staff","bn2_agent"].includes(String(existing.app_metadata?.role??"")))
      return NextResponse.json({error:"Cette adresse est déjà liée à un compte client. Utilisez une adresse distincte pour l'équipe BN2."},{status:409});
  }

  const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||(process.env.VERCEL_URL?"https://"+process.env.VERCEL_URL:"https://bn-2-hub-bns-prestiges-projects.vercel.app")).replace(/\/$/,"");
  const nextPath=existing?"/staff":"/auth/set-password";
  const redirectTo=siteUrl+"/auth/callback?next="+encodeURIComponent(nextPath);
  let authUser=existing;
  let inviteLink="";
  if(existing){
    const {data,error}=await admin.auth.admin.generateLink({type:"magiclink",email,options:{redirectTo}});
    if(error)return NextResponse.json({error:"Impossible de générer le lien de connexion pour ce compte."},{status:400});
    inviteLink=data.properties?.action_link??"";
  }else{
    const {data,error}=await admin.auth.admin.generateLink({type:"invite",email,options:{data:{full_name:fullName},redirectTo}});
    if(error||!data.user)return NextResponse.json({error:"Impossible de créer l'invitation. Vérifiez la configuration e-mail Supabase."},{status:400});
    authUser=data.user;
    inviteLink=data.properties?.action_link??"";
  }
  if(!authUser)return NextResponse.json({error:"Compte utilisateur introuvable."},{status:500});
  const {error:roleError}=await admin.auth.admin.updateUserById(authUser.id,{
    app_metadata:{...(authUser.app_metadata??{}),role:"bn2_staff"},
    user_metadata:{...(authUser.user_metadata??{}),full_name:fullName},
  });
  if(roleError)return NextResponse.json({error:"Impossible d'attribuer le rôle employé."},{status:500});

  const permissions=cleanPermissions(body.permissions);
  const {data:member,error:staffError}=await admin.from("staff_members").upsert({
    user_id:authUser.id,employee_number:employeeNumber,department,job_title:jobTitle,
    employment_status:"invited",permissions,created_by:access.user.id,
  },{onConflict:"user_id"}).select("id").single();
  if(staffError)return NextResponse.json({error:"La fiche employé n'a pas pu être enregistrée : "+staffError.message},{status:500});
  await admin.from("audit_logs").insert({actor_id:access.user.id,action:"staff_invited",entity_type:"staff_member",entity_id:member.id,details:{email,department,job_title:jobTitle}});
  return NextResponse.json({staffId:member.id,inviteLink,delivery:"manual_link"},{status:201});
}

export async function PATCH(request:Request) {
  const access=await requireAdmin();
  if("error" in access)return access.error;
  const admin=createAdminClient();
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
  const id=String(body.id??"");
  if(!id)return NextResponse.json({error:"staff_id_required"},{status:400});
  const {data:member,error:findError}=await admin.from("staff_members").select("id,user_id").eq("id",id).single();
  if(findError||!member)return NextResponse.json({error:"staff_not_found"},{status:404});
  const update:{department?:string;job_title?:string;employee_number?:string|null;employment_status?:"invited"|"active"|"on_leave"|"suspended"|"terminated";permissions?:Record<string,boolean>;started_on?:string|null;ended_on?:string|null;updated_at:string}={updated_at:new Date().toISOString()};
  if(typeof body.department==="string")update.department=body.department.trim().slice(0,100);
  if(typeof body.jobTitle==="string")update.job_title=body.jobTitle.trim().slice(0,120);
  if(typeof body.employeeNumber==="string")update.employee_number=body.employeeNumber.trim()||null;
  if(typeof body.status==="string"&&["invited","active","on_leave","suspended","terminated"].includes(body.status))update.employment_status=body.status;
  if(body.permissions&&typeof body.permissions==="object")update.permissions=cleanPermissions(body.permissions);
  if(typeof body.startedOn==="string")update.started_on=body.startedOn||null;
  if(typeof body.endedOn==="string")update.ended_on=body.endedOn||null;
  const {error:updateError}=await admin.from("staff_members").update(update).eq("id",id);
  if(updateError)return NextResponse.json({error:updateError.message},{status:400});
  if(typeof body.status==="string"){
    const enabled=body.status==="active"||body.status==="invited";
    const {data:userData}=await admin.auth.admin.getUserById(member.user_id);
    if(userData.user)await admin.auth.admin.updateUserById(member.user_id,{app_metadata:{...(userData.user.app_metadata??{}),role:enabled?"bn2_staff":"bn2_disabled"}});
  }
  await admin.from("audit_logs").insert({actor_id:access.user.id,action:"staff_updated",entity_type:"staff_member",entity_id:id,details:update});
  return NextResponse.json({success:true});
}
