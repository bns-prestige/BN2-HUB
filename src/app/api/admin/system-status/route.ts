import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export async function GET(){
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return NextResponse.json({error:"unauthorized"},{status:401});
 if(!["bn2_owner","bn2_admin"].includes(String(user.app_metadata?.role??"")))return NextResponse.json({error:"forbidden"},{status:403});
 const sender=process.env.BN2_FROM_EMAIL??null;
 return NextResponse.json({emailConfigured:Boolean(process.env.RESEND_API_KEY&&sender),sender},{headers:{"Cache-Control":"private, no-store"}});
}
