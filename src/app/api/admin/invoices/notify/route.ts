import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBn2Email } from "@/lib/email";

export const dynamic="force-dynamic";
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));}

export async function POST(request:Request){
 const session=await createClient();
 const {data:{user},error:authError}=await session.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 if(!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role??"")))return NextResponse.json({error:"forbidden"},{status:403});
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const invoiceId=String(body.invoiceId??"");
 const event=String(body.event??"");
 if(!invoiceId||!["issued","payment"].includes(event))return NextResponse.json({error:"invalid_request"},{status:400});
 const admin=createAdminClient();
 const {data:invoice,error}=await admin.from("service_invoices").select("id,invoice_number,organization_id,status,currency,issue_date,due_date,total,organizations(name,legal_name,billing_email,contact_email)").eq("id",invoiceId).single();
 if(error||!invoice)return NextResponse.json({error:"invoice_not_found"},{status:404});
 const organization=Array.isArray(invoice.organizations)?invoice.organizations[0]:invoice.organizations;
 const recipientIds=new Set<string>();
 const {data:members}=await admin.from("organization_members").select("user_id").eq("organization_id",invoice.organization_id).eq("status","active");
 for(const item of members??[])recipientIds.add(item.user_id);
 const {data:profiles}=await admin.from("profiles").select("id,email").in("id",[...recipientIds]);
 const emails=new Set<string>();
 for(const profile of profiles??[])if(profile.email)emails.add(profile.email.trim().toLowerCase());
 const billingEmail=organization?.billing_email||organization?.contact_email;
 if(billingEmail)emails.add(billingEmail.trim().toLowerCase());
 if(!emails.size)return NextResponse.json({emailSent:0,reason:"no_recipient"});
 const paymentAmount=Number(body.amount??0);
 const subject=event==="issued"?"Nouvelle facture "+invoice.invoice_number+" · BN2 Consulting":"Paiement enregistré · "+invoice.invoice_number;
 const bodyText=event==="issued"
  ?"Une nouvelle facture est disponible pour "+(organization?.name??"votre entreprise")+". Montant : "+Number(invoice.total).toLocaleString("fr-BE",{style:"currency",currency:invoice.currency})+". Échéance : "+(invoice.due_date??"—")+"."
  :"Un paiement de "+paymentAmount.toLocaleString("fr-BE",{style:"currency",currency:invoice.currency})+" a été enregistré pour la facture "+invoice.invoice_number+".";
 const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL??"https://bn-2-hub.vercel.app").replace(/\/$/,"");
 let sent=0;
 for(const email of emails){
  const result=await sendBn2Email({to:[email],subject,html:"<div style='font-family:Arial,sans-serif;color:#17253b;max-width:560px;margin:auto;padding:28px'><strong style='color:#1768d2;letter-spacing:2px'>BN2 CONSULTING</strong><h1 style='font-size:21px'>"+(event==="issued"?"Une facture est disponible":"Paiement enregistré")+"</h1><p>"+escapeHtml(bodyText)+"</p><p><a href='"+siteUrl+"/portal' style='display:inline-block;background:#1768d2;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px'>Ouvrir mon portail client</a></p></div>",text:bodyText+" "+siteUrl+"/portal"});
  if(result.sent)sent++;
 }
 return NextResponse.json({emailSent:sent});
}
