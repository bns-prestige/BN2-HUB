"use client";

import { FormEvent,useCallback,useEffect,useMemo,useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Banknote,CheckCircle2,ChevronDown,Download,FilePlus2,Plus,Receipt,Trash2,Wallet } from "lucide-react";

type Organization={id:string;name:string};
type Contract={id:string;organization_id:string;name:string;contract_number:string|null};
type Invoice={id:string;invoice_number:string;organization_id:string;contract_id:string|null;status:string;currency:string;issue_date:string;due_date:string|null;subtotal:number;tax_total:number;total:number;notes:string|null;organizations:{name?:string}|{name?:string}[]|null};
type InvoiceItem={id:string;invoice_id:string;description:string;quantity:number;unit_price:number;tax_rate:number;line_total:number};
type Payment={id:string;invoice_id:string;amount:number;method:string;status:string;reference:string|null;paid_at:string|null};
type LineDraft={description:string;quantity:string;unit_price:string;tax_rate:string};
const emptyLine:LineDraft={description:"",quantity:"1",unit_price:"0",tax_rate:"21"};
function clientName(value:Invoice["organizations"]){return Array.isArray(value)?value[0]?.name??"Client":value?.name??"Client";}
function money(value:number,currency="EUR"){return Number(value??0).toLocaleString("fr-BE",{style:"currency",currency});}
function html(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]??char));}

export default function InvoiceManager(){
 const [organizations,setOrganizations]=useState<Organization[]>([]);
 const [contracts,setContracts]=useState<Contract[]>([]);
 const [invoices,setInvoices]=useState<Invoice[]>([]);
 const [items,setItems]=useState<InvoiceItem[]>([]);
 const [payments,setPayments]=useState<Payment[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [createOpen,setCreateOpen]=useState(false);
 const [paymentInvoice,setPaymentInvoice]=useState<Invoice|null>(null);
 const [expanded,setExpanded]=useState("");
 const [organizationId,setOrganizationId]=useState("");
 const [contractId,setContractId]=useState("");
 const [issueDate,setIssueDate]=useState(new Date().toISOString().slice(0,10));
 const [dueDate,setDueDate]=useState(new Date(Date.now()+30*86400000).toISOString().slice(0,10));
 const [notes,setNotes]=useState("");
 const [lines,setLines]=useState<LineDraft[]>([{...emptyLine}]);
 const [paymentAmount,setPaymentAmount]=useState("");
 const [paymentMethod,setPaymentMethod]=useState("bank_transfer");
 const [paymentReference,setPaymentReference]=useState("");

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const supabase=createClient();
  const [orgResult,contractResult,invoiceResult,itemResult,paymentResult]=await Promise.all([
   supabase.from("organizations").select("id,name").order("name"),
   supabase.from("service_contracts").select("id,organization_id,name,contract_number").order("created_at",{ascending:false}),
   supabase.from("service_invoices").select("id,invoice_number,organization_id,contract_id,status,currency,issue_date,due_date,subtotal,tax_total,total,notes,organizations(name)").order("created_at",{ascending:false}).limit(200),
   supabase.from("service_invoice_items").select("id,invoice_id,description,quantity,unit_price,tax_rate,line_total").order("created_at"),
   supabase.from("service_payments").select("id,invoice_id,amount,method,status,reference,paid_at").order("created_at",{ascending:false}),
  ]);
  const firstError=orgResult.error??contractResult.error??invoiceResult.error??itemResult.error??paymentResult.error;
  if(firstError)setError(firstError.message);
  const invoiceRows=(invoiceResult.data??[]) as Invoice[];
  const today=new Date().toISOString().slice(0,10);
  const overdue=invoiceRows.filter(invoice=>invoice.status==="issued"&&invoice.due_date&&invoice.due_date<today).map(invoice=>invoice.id);
  if(overdue.length){
   await supabase.from("service_invoices").update({status:"overdue"}).in("id",overdue);
   invoiceRows.forEach(invoice=>{if(overdue.includes(invoice.id))invoice.status="overdue";});
  }
  setOrganizations(orgResult.data??[]);setContracts((contractResult.data??[]) as Contract[]);
  setInvoices(invoiceRows);setItems((itemResult.data??[]) as InvoiceItem[]);
  setPayments((paymentResult.data??[]) as Payment[]);setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);

 const totals=useMemo(()=>lines.reduce((acc,line)=>{
  const base=Math.max(0,Number(line.quantity)||0)*Math.max(0,Number(line.unit_price)||0);
  return {subtotal:acc.subtotal+base,tax:acc.tax+base*(Math.max(0,Number(line.tax_rate)||0)/100)};
 },{subtotal:0,tax:0}),[lines]);
 function updateLine(index:number,key:keyof LineDraft,value:string){setLines(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));}
 function resetCreate(){setOrganizationId("");setContractId("");setIssueDate(new Date().toISOString().slice(0,10));setDueDate(new Date(Date.now()+30*86400000).toISOString().slice(0,10));setNotes("");setLines([{...emptyLine}]);}

 async function createInvoice(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setNotice("");
  if(!organizationId){setError("Sélectionnez une entreprise cliente.");return;}
  const validLines=lines.filter(line=>line.description.trim()&&Number(line.quantity)>0&&Number(line.unit_price)>=0);
  if(!validLines.length){setError("Ajoutez au moins une ligne de facturation valide.");return;}
  setSaving(true);
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {data:invoice,error:invoiceError}=await supabase.from("service_invoices").insert({
   organization_id:organizationId,invoice_number:"",contract_id:contractId||null,issue_date:issueDate,due_date:dueDate||null,
   notes:notes.trim()||null,created_by:user?.id??null,status:"draft",
  }).select("id,invoice_number").single();
  if(invoiceError||!invoice){setError(invoiceError?.message??"Création de la facture impossible.");setSaving(false);return;}
  const rows=validLines.map(line=>({invoice_id:invoice.id,description:line.description.trim(),quantity:Number(line.quantity),unit_price:Number(line.unit_price),tax_rate:Number(line.tax_rate)}));
  const {error:itemsError}=await supabase.from("service_invoice_items").insert(rows);
  if(itemsError){await supabase.from("service_invoices").delete().eq("id",invoice.id);setError(itemsError.message);setSaving(false);return;}
  const {error:issueError}=await supabase.from("service_invoices").update({status:"issued"}).eq("id",invoice.id);
  if(issueError){setError(issueError.message);setSaving(false);return;}
  setNotice("Facture "+invoice.invoice_number+" créée et émise.");setCreateOpen(false);resetCreate();await load();setSaving(false);
 }

 async function recordPayment(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!paymentInvoice)return;
  const amount=Number(paymentAmount);
  if(!Number.isFinite(amount)||amount<=0){setError("Montant de paiement invalide.");return;}
  setSaving(true);setError("");
  const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
  const {error:paymentError}=await supabase.from("service_payments").insert({
   invoice_id:paymentInvoice.id,organization_id:paymentInvoice.organization_id,amount,currency:"EUR",
   method:paymentMethod,status:"succeeded",reference:paymentReference.trim()||null,paid_at:new Date().toISOString(),recorded_by:user?.id??null,
  });
  if(paymentError)setError(paymentError.message);
  else{setNotice("Paiement enregistré. Le statut de la facture est recalculé automatiquement.");setPaymentInvoice(null);setPaymentAmount("");setPaymentReference("");await load();}
  setSaving(false);
 }

 function printInvoice(invoice:Invoice){
  const invoiceItems=items.filter(item=>item.invoice_id===invoice.id);
  const w=window.open("","_blank");
  if(!w){setError("Autorisez les fenêtres pop-up pour imprimer la facture.");return;}
  const rows=invoiceItems.map(item=>"<tr><td>"+html(item.description)+"</td><td>"+item.quantity+"</td><td>"+money(item.unit_price)+"</td><td>"+item.tax_rate+"%</td><td>"+money(item.line_total)+"</td></tr>").join("");
  const note=invoice.notes?"<div class='notes'><strong>Notes</strong><p>"+html(invoice.notes)+"</p></div>":"";
  const documentHtml="<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>"+html(invoice.invoice_number)+"</title><style>body{font-family:Arial,sans-serif;color:#18263b;margin:48px}header{display:flex;justify-content:space-between;border-bottom:3px solid #1768d2;padding-bottom:24px}h1{font-size:28px;margin:0 0 8px}small{color:#68788f}table{width:100%;border-collapse:collapse;margin-top:36px}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e5eaf1;font-size:12px}th{background:#f4f7fb}.totals{margin:25px 0 0 auto;width:280px}.totals div{display:flex;justify-content:space-between;padding:8px 0}.total{font-size:18px;font-weight:bold;border-top:2px solid #17253b}.notes{margin-top:36px;font-size:12px;white-space:pre-wrap}@media print{body{margin:20mm}}</style></head><body><header><div><h1>BN2 Consulting</h1><small>Services informatiques · Belgique</small></div><div><h1>FACTURE</h1><strong>"+html(invoice.invoice_number)+"</strong><p>Émise le "+new Date(invoice.issue_date).toLocaleDateString("fr-BE")+"</p><p>Échéance : "+(invoice.due_date?new Date(invoice.due_date).toLocaleDateString("fr-BE"):"—")+"</p></div></header><h3>Facturé à</h3><strong>"+html(clientName(invoice.organizations))+"</strong><table><thead><tr><th>Description</th><th>Qté</th><th>Prix unitaire</th><th>TVA</th><th>Total TVAC</th></tr></thead><tbody>"+rows+"</tbody></table><div class='totals'><div><span>Hors TVA</span><strong>"+money(invoice.subtotal)+"</strong></div><div><span>TVA</span><strong>"+money(invoice.tax_total)+"</strong></div><div class='total'><span>Total</span><strong>"+money(invoice.total)+"</strong></div></div>"+note+"<script>window.onload=function(){window.print();};</script></body></html>";
  w.document.write(documentHtml);w.document.close();
 }

 const statusLabels:Record<string,string>={draft:"Brouillon",issued:"À payer",overdue:"En retard",paid:"Payée",cancelled:"Annulée"};
 return <div className="admin-content admin-section-content bn2-invoice-manager">
  <div className="page-heading"><div><div className="page-eyebrow">BN2 HUB <span>•</span> GESTION FINANCIÈRE</div><h1>Facturation</h1><p>Émettez vos factures, suivez les paiements et imprimez vos documents.</p></div><button className="admin-primary-button" onClick={()=>{resetCreate();setCreateOpen(true);}}><FilePlus2 size={16}/> Nouvelle facture</button></div>
  {error&&<div className="bn2-invoice-alert error">{error}</div>}{notice&&<div className="bn2-invoice-alert success"><CheckCircle2 size={15}/>{notice}</div>}
  <div className="bn2-invoice-metrics"><article><span><Receipt size={17}/></span><div><strong>{invoices.length}</strong><small>Factures</small></div></article><article><span><Wallet size={17}/></span><div><strong>{money(invoices.filter(x=>x.status!=="paid"&&x.status!=="cancelled").reduce((s,x)=>s+x.total,0))}</strong><small>Montant à recevoir</small></div></article><article><span><CheckCircle2 size={17}/></span><div><strong>{invoices.filter(x=>x.status==="paid").length}</strong><small>Factures payées</small></div></article></div>
  <section className="admin-panel bn2-invoice-panel"><div className="panel-heading"><div><h3>Factures émises</h3><p>{loading?"Chargement...":"Les montants sont calculés automatiquement à partir des lignes et paiements."}</p></div><span className="section-record-count">{invoices.length} factures</span></div>
   {invoices.length===0&&!loading?<div className="queue-empty">Aucune facture. Créez votre première facture pour commencer.</div>:<div className="table-wrap"><table className="requests-table"><thead><tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>ÉMISE LE</th><th>ÉCHÉANCE</th><th>MONTANT</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>{invoices.map(invoice=><tr key={invoice.id}><td><strong>{invoice.invoice_number}</strong></td><td>{clientName(invoice.organizations)}</td><td>{new Date(invoice.issue_date).toLocaleDateString("fr-BE")}</td><td>{invoice.due_date?new Date(invoice.due_date).toLocaleDateString("fr-BE"):"—"}</td><td><strong>{money(invoice.total,invoice.currency)}</strong></td><td><span className={"bn2-invoice-status "+invoice.status}>{statusLabels[invoice.status]??invoice.status}</span></td><td><div className="bn2-invoice-actions"><button onClick={()=>setExpanded(expanded===invoice.id?"":invoice.id)}><ChevronDown size={13}/></button><button onClick={()=>printInvoice(invoice)} title="Imprimer / enregistrer en PDF"><Download size={13}/></button>{invoice.status!=="paid"&&invoice.status!=="cancelled"&&<button onClick={()=>{setPaymentInvoice(invoice);setPaymentAmount(String(Math.max(0,Number(invoice.total)-payments.filter(p=>p.invoice_id===invoice.id&&p.status==="succeeded").reduce((s,p)=>s+Number(p.amount),0)).toFixed(2)));}} title="Enregistrer un paiement"><Banknote size={13}/></button>}</div></td></tr>)}</tbody></table></div>}
   {invoices.filter(invoice=>invoice.id===expanded).map(invoice=><div className="bn2-invoice-detail" key={invoice.id}><strong>{invoice.invoice_number} · Détails</strong><div className="table-wrap"><table><thead><tr><th>Description</th><th>Qté</th><th>PU</th><th>TVA</th><th>Total</th></tr></thead><tbody>{items.filter(item=>item.invoice_id===invoice.id).map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{item.tax_rate}%</td><td>{money(item.line_total)}</td></tr>)}</tbody></table></div><p className="bn2-invoice-payment-history">Paiements : {payments.filter(p=>p.invoice_id===invoice.id).map(p=>money(p.amount)+" · "+p.method+" · "+p.status).join(" | ")||"Aucun paiement enregistré"}</p></div>)}
  </section>
  {createOpen&&<div className="modal-backdrop" onClick={()=>setCreateOpen(false)}><form className="bn2-invoice-modal" onSubmit={createInvoice} onClick={event=>event.stopPropagation()}><div className="bn2-invoice-modal-head"><div><h2>Créer une facture</h2><p>La référence est attribuée automatiquement.</p></div><button type="button" onClick={()=>setCreateOpen(false)}>×</button></div>
   <div className="bn2-invoice-form-grid"><label>Entreprise cliente<select required value={organizationId} onChange={event=>{setOrganizationId(event.target.value);setContractId("");}}><option value="">Sélectionner...</option>{organizations.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select></label><label>Contrat associé<select value={contractId} onChange={event=>setContractId(event.target.value)}><option value="">Aucun contrat</option>{contracts.filter(contract=>contract.organization_id===organizationId).map(contract=><option key={contract.id} value={contract.id}>{contract.contract_number||contract.name}</option>)}</select></label><label>Date d&apos;émission<input type="date" required value={issueDate} onChange={event=>setIssueDate(event.target.value)}/></label><label>Date d&apos;échéance<input type="date" value={dueDate} onChange={event=>setDueDate(event.target.value)}/></label></div>
   <div className="bn2-invoice-lines-heading"><strong>Lignes de facturation</strong><button type="button" onClick={()=>setLines(current=>[...current,{...emptyLine}])}><Plus size={13}/> Ajouter une ligne</button></div>
   <div className="bn2-invoice-line-list">{lines.map((line,index)=><div className="bn2-invoice-line" key={index}><input aria-label="Description" required value={line.description} onChange={event=>updateLine(index,"description",event.target.value)} placeholder="Description du service"/><input aria-label="Quantité" type="number" min="0.01" step="0.01" required value={line.quantity} onChange={event=>updateLine(index,"quantity",event.target.value)}/><input aria-label="Prix unitaire" type="number" min="0" step="0.01" required value={line.unit_price} onChange={event=>updateLine(index,"unit_price",event.target.value)}/><select aria-label="TVA" value={line.tax_rate} onChange={event=>updateLine(index,"tax_rate",event.target.value)}><option value="0">0%</option><option value="6">6%</option><option value="12">12%</option><option value="21">21%</option></select><button type="button" disabled={lines.length===1} onClick={()=>setLines(current=>current.filter((_,i)=>i!==index))}><Trash2 size={13}/></button></div>)}</div>
   <label className="bn2-invoice-notes">Notes<textarea rows={2} value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Informations complémentaires..."/></label>
   <div className="bn2-invoice-totals"><span>Sous-total HTVA <strong>{money(totals.subtotal)}</strong></span><span>TVA <strong>{money(totals.tax)}</strong></span><span>Total TVAC <strong>{money(totals.subtotal+totals.tax)}</strong></span></div>
   <div className="bn2-invoice-modal-footer"><button type="button" className="secondary" onClick={()=>setCreateOpen(false)}>Annuler</button><button type="submit" disabled={saving||!organizations.length}>{saving?"Création...":"Créer et émettre la facture"}</button></div>
  </form></div>}
  {paymentInvoice&&<div className="modal-backdrop" onClick={()=>setPaymentInvoice(null)}><form className="bn2-invoice-payment-modal" onSubmit={recordPayment} onClick={event=>event.stopPropagation()}><div className="bn2-invoice-modal-head"><div><h2>Enregistrer un paiement</h2><p>{paymentInvoice.invoice_number} · {money(paymentInvoice.total)}</p></div><button type="button" onClick={()=>setPaymentInvoice(null)}>×</button></div><label>Montant reçu (€)<input type="number" min="0.01" step="0.01" required value={paymentAmount} onChange={event=>setPaymentAmount(event.target.value)}/></label><label>Moyen de paiement<select value={paymentMethod} onChange={event=>setPaymentMethod(event.target.value)}><option value="bank_transfer">Virement bancaire</option><option value="card">Carte bancaire</option><option value="cash">Espèces</option><option value="direct_debit">Domiciliation</option><option value="other">Autre</option></select></label><label>Référence / commentaire<input value={paymentReference} onChange={event=>setPaymentReference(event.target.value)} placeholder="Référence bancaire, note..."/></label><div className="bn2-invoice-modal-footer"><button type="button" className="secondary" onClick={()=>setPaymentInvoice(null)}>Annuler</button><button type="submit" disabled={saving}>{saving?"Enregistrement...":"Confirmer le paiement"}</button></div></form></div>}
 </div>;
}
