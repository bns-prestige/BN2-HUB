import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export async function GET(){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
  if(!["bn2_staff","bn2_agent"].includes(String(user.app_metadata?.role??"")))return NextResponse.json({error:"forbidden"},{status:403});
  const {data:staff,error:staffError}=await supabase.from("staff_members")
    .select("id,employee_number,department,job_title,employment_status,permissions,started_on")
    .eq("user_id",user.id).maybeSingle();
  if(staffError||!staff||!["invited","active"].includes(staff.employment_status))return NextResponse.json({error:"staff_access_inactive"},{status:403});
  const permissions=(staff.permissions??{}) as Record<string,boolean>;
  const [profileResult,ticketResult,interventionResult]=await Promise.all([
    supabase.from("profiles").select("full_name,email").eq("id",user.id).maybeSingle(),
    permissions["tickets.read"]?supabase.from("support_tickets").select("id,ticket_number,title,status,priority,created_at,organization_id,organizations(name)").eq("assigned_to",user.id).order("created_at",{ascending:false}).limit(30):Promise.resolve({data:[],error:null}),
    permissions["interventions.read"]?supabase.from("interventions").select("id,title,status,scheduled_start,location,organization_id,organizations(name)").eq("assigned_to",user.id).order("scheduled_start",{ascending:true}).limit(30):Promise.resolve({data:[],error:null}),
  ]);
  if(ticketResult.error||interventionResult.error)return NextResponse.json({error:"workload_load_failed"},{status:500});
  return NextResponse.json({staff,profile:profileResult.data,tickets:ticketResult.data??[],interventions:interventionResult.data??[]},{headers:{"Cache-Control":"private, no-store"}});
}
