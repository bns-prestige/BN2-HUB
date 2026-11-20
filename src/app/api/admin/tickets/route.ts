import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 if(!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role??"")))return NextResponse.json({error:"forbidden"},{status:403});
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const organizationId=String(body.organizationId??"");
 const title=String(body.title??"").trim();
 const description=String(body.description??"").trim();
 const category=String(body.category??"Autre demande").trim();
 const priority=String(body.priority??"normal");
 const allowed=["low","normal","high","urgent"];
 if(!organizationId||title.length<3||description.length<5||!allowed.includes(priority))return NextResponse.json({error:"Vérifiez l'entreprise, l'objet, la description et la priorité."},{status:400});
 const {data:ticket,error}=await supabase.from("support_tickets").insert({
  organization_id:organizationId,created_by:user.id,title,description,category,priority,
  assigned_to:typeof body.assignedTo==="string"&&body.assignedTo?body.assignedTo:null,
  due_at:typeof body.dueAt==="string"&&body.dueAt?body.dueAt:null,
 }).select("id,ticket_number,title,status,priority,created_at").single();
 if(error||!ticket)return NextResponse.json({error:error?.message??"ticket_create_failed"},{status:400});
 return NextResponse.json({ticket},{status:201});
}
