"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "../login/login.css";

export default function InitialSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(Boolean(data.user)));
  }, []);

  async function signup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin + "/auth/callback?next=/setup" },
      });
      if (signupError) throw signupError;
      if (data.session) setUser(true);
      else setMessage("Compte créé. Confirmez votre adresse e-mail, puis revenez sur cette page pour terminer l'activation propriétaire.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création du compte impossible.");
    } finally { setLoading(false); }
  }

  async function claim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user: current } } = await supabase.auth.getUser();
      if (!current) throw new Error("Connectez-vous avec le compte que vous venez de créer.");
      const { error: claimError } = await supabase.rpc("claim_initial_bn2_owner", { bootstrap_token: token.trim() });
      if (claimError) throw new Error(claimError.message);
      await supabase.auth.refreshSession();
      setMessage("Accès propriétaire activé. Ouverture de BN2 HUB...");
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activation impossible.");
    } finally { setLoading(false); }
  }

  return <main className="bn2-login"><section className="bn2-login-card">
    <div className="bn2-login-brand"><span>BN2</span><div><strong>BN2 HUB</strong><small>INITIALISATION SÉCURISÉE</small></div></div>
    <div className="bn2-login-icon"><ShieldCheck size={23}/></div>
    <p className="bn2-login-eyebrow">PREMIÈRE CONFIGURATION</p>
    <h1>Activer l'espace propriétaire.</h1>
    <p className="bn2-login-subtitle">Créez le premier compte BN2, puis validez le code de configuration à usage unique.</p>
    {!user ? <form onSubmit={signup}>
      <label>Nom complet<input value={name} onChange={e=>setName(e.target.value)} required minLength={2} placeholder="Votre nom"/></label>
      <label>Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="vous@bn2consulting.be"/></label>
      <label>Mot de passe<input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} placeholder="10 caractères minimum"/></label>
      <button type="submit" disabled={loading}><UserPlus size={16}/> {loading ? "Création..." : "Créer le premier compte"}</button>
    </form> : <form onSubmit={claim}>
      <label>Code propriétaire à usage unique<div className="bn2-login-input"><KeyRound size={17}/><input value={token} onChange={e=>setToken(e.target.value)} required autoComplete="off" placeholder="Code fourni par BN2"/></div></label>
      <button type="submit" disabled={loading}>{loading ? "Activation..." : "Activer l'accès propriétaire"}</button>
    </form>}
    {error && <div className="bn2-login-error">{error}</div>}
    {message && <div className="bn2-login-error" style={{borderColor:"#cfe8dc",background:"#f2fbf6",color:"#17633f"}}>{message}</div>}
    <p className="bn2-login-footnote">Cette activation n'est possible que pour le premier utilisateur et ne peut être utilisée qu'une seule fois.</p>
  </section><footer>BN2 HUB <span>•</span> Une solution BN2 Consulting</footer></main>;
}
