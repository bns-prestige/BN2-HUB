import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBn2Email } from "@/lib/email";

export const dynamic="force-dynamic";
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));}

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 if(!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role??"")))return NextResponse.json({error:"forbidden"},{status:403});
 let body:Record<string,unknown>;
 try{body=await request.json();}catch{return NextResponse.json({error:"invalid_json"},{status:400});}
 const email=String(body.email??"").trim().toLowerCase();
 const fullName=String(body.fullName??"").trim();
 const organization=String(body.organization??"").trim();
 const actionLink=String(body.actionLink??"");
 const existingAccount=body.existingAccount===true;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!organization)return NextResponse.json({error:"invalid_recipient"},{status:400});
 const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL??"https://bn-2-hub.vercel.app").replace(/\/$/,"");
 let link=siteUrl+"/login";
 if(!existingAccount){
  try{const parsed=new URL(actionLink);if(parsed.hostname!=="almzypjgccucdkwnpldy.supabase.co")throw new Error("invalid invite host");link=actionLink;}
  catch{return NextResponse.json({error:"invalid_invitation_link"},{status:400});}
 }
 const greeting=fullName?"Bonjour "+escapeHtml(fullName)+",":"Bonjour,";
 const subject=existingAccount?"Votre accès au portail "+organization+" est activé":"Votre invitation au portail "+organization;
 const html="<!doctype html><html lang='fr'><body style='margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#17253b;padding:32px 14px'><div style='max-width:560px;margin:auto;background:#fff;border:1px solid #e3eaf2;border-radius:16px;padding:32px'><div style='font-size:13px;font-weight:900;letter-spacing:2px;color:#1768d2'>BN2 CONSULTING</div><h1 style='font-size:22px;margin:22px 0 14px'>"+(existingAccount?"Votre accès est prêt":"Bienvenue sur BN2 HUB")+"</h1><p style='font-size:14px;line-height:1.7'>"+greeting+"</p><p style='font-size:14px;line-height:1.7'>"+(existingAccount?"Votre accès à l'espace client":"Vous avez été invité à rejoindre l'espace client")+" <strong>"+escapeHtml(organization)+"</strong>.</p><p style='margin:28px 0'><a href='"+escapeHtml(link)+"' style='display:inline-block;background:#1768d2;color:#fff;text-decoration:none;padding:13px 20px;border-radius:9px;font-size:13px;font-weight:700'>"+(existingAccount?"Ouvrir mon portail":"Activer mon accès")+"</a></p><p style='font-size:12px;color:#75849a;line-height:1.7'>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href='"+escapeHtml(link)+"'>"+escapeHtml(link)+"</a></p><hr style='border:0;border-top:1px solid #edf0f5;margin:28px 0'><p style='font-size:11px;color:#8996a8'>Message automatique envoyé par BN2 Consulting. Ne répondez pas à cet e-mail.</p></div></body></html>";
 const result=await sendBn2Email({to:[email],subject,html,text:greeting+"\nVotre accès à "+organization+" est prêt.\n"+link+"\n\nBN2 Consulting"});
 if(!result.sent)return NextResponse.json({sent:false,reason:result.reason,error:result.error??"Email sending is not configured."},{status:503});
 await supabase.from("audit_logs").insert({actor_id:user.id,action:"client_invitation_email_sent",entity_type:"organization_member",details:{email,organization}});
 return NextResponse.json({sent:true,emailId:result.id});
}
