"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { ArrowLeft, Bot, ChevronRight, Clock3, MessageCircle, Plus, Send, ShieldCheck, Sparkles, Square, UserRound } from "lucide-react";
import "./assistant.css";

type Conversation = { id:string; title:string; channel:string; status:string; updated_at:string };
type StoredMessage = { id:string; role:"user"|"assistant"; content:string; created_at:string };

export default function ClientAssistantPage() {
  const [conversations,setConversations] = useState<Conversation[]>([]);
  const [conversationId,setConversationId] = useState("");
  const conversationIdRef = useRef("");
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(true);
  const [switching,setSwitching] = useState(false);
  const [errorMessage,setErrorMessage] = useState("");

  const { messages, sendMessage, status, setMessages, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/assistant/chat",
      body: () => ({ conversationId: conversationIdRef.current }),
    }),
  });

  const refreshConversations = useCallback(async () => {
    const response = await fetch("/api/assistant/conversations", { cache:"no-store" });
    if (!response.ok) throw new Error("Impossible de charger l'historique.");
    const result = await response.json() as { conversations:Conversation[] };
    setConversations(result.conversations ?? []);
    return result.conversations ?? [];
  }, []);

  const openConversation = useCallback(async (id:string) => {
    setSwitching(true); setErrorMessage(""); conversationIdRef.current=id; setConversationId(id);
    try {
      const response = await fetch("/api/assistant/conversations/"+id, { cache:"no-store" });
      if (!response.ok) throw new Error("Cette conversation n'est pas disponible.");
      const result = await response.json() as { messages:StoredMessage[] };
      const restored:UIMessage[] = (result.messages ?? []).map((message) => ({
        id:message.id,
        role:message.role,
        parts:[{type:"text",text:message.content}],
      }));
      setMessages(restored);
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Erreur de chargement.");
    } finally { setSwitching(false); setLoading(false); }
  }, [setMessages]);

  const createConversation = useCallback(async () => {
    setErrorMessage(""); setSwitching(true);
    try {
      const response = await fetch("/api/assistant/conversations", { method:"POST" });
      if (!response.ok) throw new Error("Impossible de démarrer une conversation.");
      const result = await response.json() as { conversation:Conversation };
      conversationIdRef.current=result.conversation.id;
      setConversationId(result.conversation.id);
      setMessages([]);
      await refreshConversations();
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Erreur de création.");
    } finally { setSwitching(false); setLoading(false); }
  }, [refreshConversations, setMessages]);

  useEffect(() => {
    async function initialise() {
      try {
        const list=await refreshConversations();
        if (list[0]) await openConversation(list[0].id);
        else await createConversation();
      } catch (cause) {
        setErrorMessage(cause instanceof Error ? cause.message : "Connexion impossible.");
        setLoading(false);
      }
    }
    void initialise();
  }, [createConversation, openConversation, refreshConversations]);

  useEffect(() => {
    if (status === "ready" && conversationId) {
      void refreshConversations().catch(() => undefined);
    }
  }, [status,conversationId,refreshConversations]);

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text=input.trim();
    if (!text || status!=="ready" || !conversationId || switching) return;
    setErrorMessage("");
    sendMessage({text});
    setInput("");
  }

  return <main className="bn2-assistant-shell">
    <header className="bn2-assistant-topbar">
      <Link href="/portal" className="bn2-assistant-back"><ArrowLeft size={16}/> Retour au portail</Link>
      <div className="bn2-assistant-brand"><span><Bot size={18}/></span><div><strong>BN2 Assistant</strong><small>ASSISTANCE INFORMATIQUE</small></div></div>
      <div className="bn2-assistant-secure"><ShieldCheck size={15}/> Espace sécurisé</div>
    </header>
    <div className="bn2-assistant-layout">
      <aside className="bn2-assistant-sidebar">
        <button className="bn2-assistant-new" onClick={() => void createConversation()} disabled={switching}><Plus size={16}/> Nouvelle conversation</button>
        <div className="bn2-assistant-history-label">HISTORIQUE</div>
        <div className="bn2-assistant-history">
          {conversations.map((conversation) => <button key={conversation.id} className={"bn2-assistant-history-item "+(conversation.id===conversationId?"active":"")} onClick={() => void openConversation(conversation.id)} disabled={switching}>
            <MessageCircle size={15}/><span>{conversation.title || "Nouvelle conversation"}</span><ChevronRight size={14}/>
          </button>)}
          {!conversations.length && <p className="bn2-assistant-empty-history">Vos conversations apparaîtront ici.</p>}
        </div>
        <div className="bn2-assistant-sidebar-foot"><ShieldCheck size={15}/><span>Vos échanges restent liés à votre compte et à votre entreprise.</span></div>
      </aside>
      <section className="bn2-assistant-main">
        <div className="bn2-assistant-heading">
          <div><div className="bn2-assistant-eyebrow"><Sparkles size={13}/> ASSISTANCE INTELLIGENTE BN2</div><h1>Comment puis-je vous aider ?</h1><p>Posez librement votre question. L&apos;assistant s&apos;appuie sur les consignes et les ressources validées par BN2.</p></div>
          <div className="bn2-assistant-live"><span/> Assistant disponible</div>
        </div>
        <div className="bn2-assistant-messages">
          {loading || switching ? <div className="bn2-assistant-loading"><span/> Préparation de votre espace...</div> : messages.length===0 ? <div className="bn2-assistant-welcome">
            <div className="bn2-assistant-welcome-icon"><Bot size={27}/></div><h2>Bonjour, je suis BN2 Assistant.</h2><p>Je peux vous aider pour vos questions informatiques, vos outils professionnels et les services suivis par BN2.</p>
            <div className="bn2-assistant-suggestions">
              {["Je n'arrive plus à me connecter à Outlook","Mon Wi-Fi ne fonctionne plus","Comment partager un fichier OneDrive ?"].map((suggestion) => <button key={suggestion} onClick={() => {setInput(suggestion);}}>{suggestion}<ChevronRight size={15}/></button>)}
            </div>
          </div> : messages.map((message) => <article className={"bn2-assistant-message "+(message.role==="user"?"from-user":"from-assistant")} key={message.id}>
            <div className="bn2-assistant-message-avatar">{message.role==="user"?<UserRound size={16}/>:<Bot size={17}/>}</div>
            <div className="bn2-assistant-message-body"><div className="bn2-assistant-message-name">{message.role==="user"?"Vous":"BN2 Assistant"}</div>{message.parts.map((part,index)=>part.type==="text"?<p key={index}>{part.text}</p>:null)}</div>
          </article>)}
          {(status==="submitted" || status==="streaming") && <div className="bn2-assistant-message from-assistant"><div className="bn2-assistant-message-avatar"><Bot size={17}/></div><div className="bn2-assistant-message-body"><div className="bn2-assistant-message-name">BN2 Assistant</div><div className="bn2-assistant-typing"><i/><i/><i/></div></div></div>}
          <div className="bn2-assistant-bottom-anchor"/>
        </div>
        {(errorMessage || error) && <div className="bn2-assistant-error">{errorMessage || "La réponse n'a pas pu être générée. Réessayez dans quelques instants."}</div>}
        <form className="bn2-assistant-composer" onSubmit={submit}>
          <textarea value={input} onChange={event=>setInput(event.target.value)} placeholder="Écrivez votre question ici..." rows={2} disabled={loading || switching || !conversationId || status!=="ready"} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();event.currentTarget.form?.requestSubmit();}}}/>
          <div className="bn2-assistant-composer-footer"><span><Clock3 size={13}/> Les réponses peuvent nécessiter une vérification par BN2.</span>
            {status==="submitted" || status==="streaming" ? <button type="button" className="bn2-assistant-stop" onClick={()=>stop()}><Square size={13}/> Arrêter</button> : <button type="submit" disabled={!input.trim() || !conversationId || loading || switching}><Send size={15}/> Envoyer</button>}
          </div>
        </form>
        <p className="bn2-assistant-disclaimer">L&apos;assistant peut se tromper. Ne partagez jamais de mot de passe, code de vérification ou information bancaire.</p>
      </section>
    </div>
  </main>;
}
