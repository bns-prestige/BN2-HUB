import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyTicketCreated } from "@/lib/ticket-notifications";

export const dynamic="force-dynamic";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const organizationId=String(body.organizationId??"");
 const title=String(body.title??"").trim();
 const description=String(body.description??"").trim();
 const category=String(body.category??"Autre demande").trim();
 const priority=String(body.priority??"normal");
 if(!organizationId||title.length<3||description.length<5||!["low","normal","high","urgent"].includes(priority))
  return NextResponse.json({error:"Vérifiez l'objet, la description et la priorité."},{status:400});
 const {data:membership,error:membershipError}=await supabase.from("organization_members").select("id").eq("organization_id",organizationId).eq("user_id",user.id).eq("status","active").maybeSingle();
 if(membershipError||!membership)return NextResponse.json({error:"organization_access_denied"},{status:403});
 const {data:ticket,error}=await supabase.from("support_tickets").insert({
  organization_id:organizationId,created_by:user.id,title,description,category,priority,
 }).select("id,ticket_number,title,category,status,priority,created_at,description").single();
 if(error||!ticket)return NextResponse.json({error:error?.message??"ticket_create_failed"},{status:400});
 const email=await notifyTicketCreated(organizationId,ticket,user.id);
 return NextResponse.json({ticket,emailSent:email.sent},{status:201});
}
