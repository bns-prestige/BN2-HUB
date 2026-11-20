import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyTicketMessage } from "@/lib/ticket-notifications";

export const dynamic="force-dynamic";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const message=String(body.body??"").trim();
 if(message.length<2||message.length>5000)return NextResponse.json({error:"Le message doit contenir entre 2 et 5000 caractères."},{status:400});
 const {data:ticket,error:ticketError}=await supabase.from("support_tickets").select("id,organization_id,ticket_number,title").eq("id",id).maybeSingle();
 if(ticketError||!ticket)return NextResponse.json({error:"ticket_not_found"},{status:404});
 const {data:membership}=await supabase.from("organization_members").select("id").eq("organization_id",ticket.organization_id).eq("user_id",user.id).eq("status","active").maybeSingle();
 const role=String(user.app_metadata?.role??"");
 const isStaff=["bn2_owner","bn2_admin","bn2_staff","bn2_agent"].includes(role);
 if(!membership&&!isStaff)return NextResponse.json({error:"forbidden"},{status:403});
 const {data:created,error}=await supabase.from("ticket_messages").insert({
  ticket_id:ticket.id,organization_id:ticket.organization_id,sender_id:user.id,body:message,is_internal:false,
 }).select("id,body,created_at,sender_id").single();
 if(error||!created)return NextResponse.json({error:error?.message??"message_create_failed"},{status:400});
 const email=await notifyTicketMessage(ticket.organization_id,ticket,message,user.id);
 return NextResponse.json({message:created,emailSent:email.sent},{status:201});
}
