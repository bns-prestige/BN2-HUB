"use client";
import { FormEvent,useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck } from "lucide-react";

export default function SetPasswordPage(){
 const router=useRouter();
 const [password,setPassword]=useState("");
 const [confirm,setConfirm]=useState("");
 const [error,setError]=useState("");
 const [saving,setSaving]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  if(password.length<12){setError("Utilisez au moins 12 caractères.");return;}
  if(password!==confirm){setError("Les deux mots de passe ne correspondent pas.");return;}
  setSaving(true);
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setError("Votre invitation a expiré. Demandez un nouveau lien à BN2.");setSaving(false);return;}
  const {error:updateError}=await supabase.auth.updateUser({password});
  if(updateError){setError(updateError.message);setSaving(false);return;}
  await supabase.auth.refreshSession();
  router.replace(["bn2_staff","bn2_agent"].includes(String(user.app_metadata?.role??""))?"/staff":"/");
  router.refresh();
 }
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f3f6fb",fontFamily:"Manrope,Arial,sans-serif",padding:20}}>
  <form onSubmit={submit} style={{width:"min(100%,420px)",background:"#fff",border:"1px solid #e4eaf2",borderRadius:18,padding:30,boxShadow:"0 15px 50px #1c355410"}}>
   <div style={{width:42,height:42,borderRadius:13,background:"#edf4ff",color:"#1768d2",display:"grid",placeItems:"center"}}><ShieldCheck size={20}/></div>
   <h1 style={{fontSize:22,margin:"18px 0 7px",color:"#17253b"}}>Sécurisez votre accès</h1>
   <p style={{fontSize:12,color:"#7b899c",lineHeight:1.7,margin:"0 0 22px"}}>Choisissez un mot de passe personnel pour accéder à l'espace de travail BN2.</p>
   <label style={{display:"grid",gap:8,fontSize:11,fontWeight:800,color:"#4e5f76"}}>Nouveau mot de passe<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} style={{padding:12,border:"1px solid #dfe6ef",borderRadius:9,fontSize:12}}/></label>
   <label style={{display:"grid",gap:8,fontSize:11,fontWeight:800,color:"#4e5f76",marginTop:15}}>Confirmer le mot de passe<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)} style={{padding:12,border:"1px solid #dfe6ef",borderRadius:9,fontSize:12}}/></label>
   {error&&<p style={{color:"#a33e36",fontSize:11,margin:"12px 0"}}>{error}</p>}
   <button disabled={saving} style={{marginTop:20,width:"100%",border:0,borderRadius:9,padding:12,background:"#1768d2",color:"#fff",fontWeight:900,fontSize:11}}>{saving?"Activation...":"Activer mon compte"}</button>
  </form>
 </main>;
}