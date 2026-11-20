import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyTicketStatusChanged } from "@/lib/ticket-notifications";

export const dynamic="force-dynamic";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 const role=String(user.app_metadata?.role??"");
 if(!["bn2_owner","bn2_admin","bn2_staff","bn2_agent"].includes(role))return NextResponse.json({error:"forbidden"},{status:403});
 if(!["bn2_owner","bn2_admin"].includes(role)){
  const {data:staff}=await supabase.from("staff_members").select("permissions,employment_status").eq("user_id",user.id).maybeSingle();
  if(!staff||!["invited","active"].includes(staff.employment_status)||(staff.permissions as Record<string,boolean>|null)?.["tickets.manage"]!==true)
   return NextResponse.json({error:"ticket_management_forbidden"},{status:403});
 }
 const {data:ticket,error:findError}=await supabase.from("support_tickets").select("id,organization_id,ticket_number,title,status,created_by,assigned_to").eq("id",id).maybeSingle();
 if(findError||!ticket)return NextResponse.json({error:"ticket_not_found"},{status:404});
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const update:Record<string,unknown>={};
 if(typeof body.status==="string"&&["new","waiting_bn2","in_progress","waiting_customer","resolved","closed"].includes(body.status))update.status=body.status;
 if(typeof body.assignedTo==="string"){
  if(body.assignedTo){
   const {data:assignee}=await supabase.from("staff_members").select("user_id").eq("user_id",body.assignedTo).in("employment_status",["invited","active"]).maybeSingle();
   if(!assignee)return NextResponse.json({error:"invalid_assignee"},{status:400});
   update.assigned_to=body.assignedTo;
  }else update.assigned_to=null;
 }
 if(!Object.keys(update).length)return NextResponse.json({error:"no_valid_changes"},{status:400});
 const {data:updated,error:updateError}=await supabase.from("support_tickets").update(update).eq("id",id).select("id,status,assigned_to").single();
 if(updateError)return NextResponse.json({error:updateError.message},{status:400});
 if(typeof update.status==="string"&&update.status!==ticket.status){
  await notifyTicketStatusChanged(ticket.organization_id,{ticket_number:ticket.ticket_number,title:ticket.title,status:String(update.status)},user.id);
 }
 return NextResponse.json({ticket:updated});
}
