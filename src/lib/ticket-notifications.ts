import { createAdminClient } from "@/lib/supabase/admin";
import { sendBn2Email } from "@/lib/email";

type TicketNotice={id:string;ticket_number:string;title:string;description:string;priority:string;category:string};
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));}

export async function notifyTicketCreated(organizationId:string,ticket:TicketNotice,actorId:string){
 const admin=createAdminClient();
 const [membersResult,staffResult,orgResult,usersResult]=await Promise.all([
  admin.from("organization_members").select("user_id").eq("organization_id",organizationId).eq("status","active"),
  admin.from("staff_members").select("user_id,permissions").in("employment_status",["invited","active"]),
  admin.from("organizations").select("name").eq("id",organizationId).maybeSingle(),
  admin.auth.admin.listUsers({page:1,perPage:1000}),
 ]);
 const userIds=new Set<string>();
 for(const item of membersResult.data??[])userIds.add(item.user_id);
 for(const item of staffResult.data??[])if((item.permissions as Record<string,boolean>|null)?.["tickets.read"])userIds.add(item.user_id);
 for(const item of usersResult.data?.users??[])if(["bn2_owner","bn2_admin"].includes(String(item.app_metadata?.role??"")))userIds.add(item.id);
 userIds.add(actorId);
 const ids=[...userIds];
 if(!ids.length)return {sent:0,reason:"no_recipients"};
 const {data:profiles}=await admin.from("profiles").select("id,email,full_name").in("id",ids);
 const emails=[...new Set((profiles??[]).map(profile=>profile.email?.trim().toLowerCase()).filter((email):email is string=>Boolean(email)))];
 if(!emails.length)return {sent:0,reason:"no_email_addresses"};
 const organizationName=orgResult.data?.name??"votre entreprise";
 let sent=0;
 const failures:string[]=[];
 for(const email of emails){
  const result=await sendBn2Email({
   to:[email],subject:"Nouvelle demande "+ticket.ticket_number+" · BN2 Consulting",
   html:"<div style='font-family:Arial,sans-serif;color:#17253b;max-width:560px;margin:auto;padding:28px'><strong style='color:#1768d2;letter-spacing:2px'>BN2 CONSULTING</strong><h1 style='font-size:21px'>Demande de support enregistrée</h1><p>Une demande a été enregistrée pour <strong>"+escapeHtml(organizationName)+"</strong>.</p><p><strong>"+escapeHtml(ticket.ticket_number)+" · "+escapeHtml(ticket.title)+"</strong></p><p>Catégorie : "+escapeHtml(ticket.category)+"<br>Priorité : "+escapeHtml(ticket.priority)+"</p><p>"+escapeHtml(ticket.description)+"</p><p>Connectez-vous à BN2 HUB pour consulter le suivi.</p></div>",
   text:"Demande "+ticket.ticket_number+" - "+ticket.title+" ("+organizationName+"). Connectez-vous à BN2 HUB pour le suivi.",
  });
  if(result.sent)sent++;else if(result.error)failures.push(result.error);
 }
 return {sent,reason:failures[0]};
}
