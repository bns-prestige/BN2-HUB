export type Bn2EmailMessage = {
 to:string[];
 subject:string;
 html:string;
 text?:string;
 replyTo?:string;
};

export async function sendBn2Email(message:Bn2EmailMessage):Promise<{sent:boolean;id?:string;error?:string;reason?:"not_configured"}>{
 const apiKey=process.env.RESEND_API_KEY;
 const from=process.env.BN2_FROM_EMAIL;
 if(!apiKey||!from)return {sent:false,reason:"not_configured"};
 const response=await fetch("https://api.resend.com/emails",{
  method:"POST",
  headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
  body:JSON.stringify({
   from,to:message.to,subject:message.subject,html:message.html,
   text:message.text,reply_to:message.replyTo,
  }),
  cache:"no-store",
 });
 const result=await response.json().catch(()=>({}));
 if(!response.ok)return {sent:false,error:typeof result.message==="string"?result.message:"Email provider rejected the request."};
 return {sent:true,id:typeof result.id==="string"?result.id:undefined};
}
