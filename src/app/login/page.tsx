"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("error")) setNotice("Accès refusé ou lien de connexion expiré. Réessayez ou contactez BN2."); }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.user) throw new Error("Adresse e-mail ou mot de passe incorrect.");
      const role = data.user.app_metadata?.role;
      if (role === "bn2_owner" || role === "bn2_admin") {
        router.replace("/");
      } else if (role === "bn2_staff" || role === "bn2_agent") {
        const { data: staff } = await supabase.from("staff_members").select("employment_status").eq("user_id",data.user.id).maybeSingle();
        if (!staff || !["invited","active"].includes(staff.employment_status)) {
          await supabase.auth.signOut();
          throw new Error("Votre accès employé n'est pas actif. Contactez BN2 Consulting.");
        }
        router.replace("/staff");
      } else {
        const { data: membership, error: membershipError } = await supabase
          .from("organization_members").select("id").eq("user_id", data.user.id).eq("status", "active").limit(1).maybeSingle();
        if (membershipError || !membership) {
          await supabase.auth.signOut();
          throw new Error("Aucun accès client actif n'est associé à ce compte. Contactez BN2 Consulting.");
        }
        router.replace("/portal");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="bn2-login">
    <section className="bn2-login-card">
      <div className="bn2-login-brand"><span>BN2</span><div><strong>BN2 HUB</strong><small>CONSULTING PLATFORM</small></div></div>
      <div className="bn2-login-icon"><ShieldCheck size={23}/></div>
      <p className="bn2-login-eyebrow">ESPACE SÉCURISÉ</p>
      <h1>Bienvenue.</h1>
      <p className="bn2-login-subtitle">Connectez-vous à votre espace BN2 Consulting.</p>
      {notice && <div className="bn2-login-error">{notice}</div>}
      {error && <div className="bn2-login-error">{error}</div>}
      <form onSubmit={submit}>
        <label>Adresse e-mail<div className="bn2-login-input"><Mail size={17}/><input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nom@entreprise.be"/></div></label>
        <label>Mot de passe<div className="bn2-login-input"><LockKeyhole size={17}/><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Votre mot de passe"/></div></label>
        <button type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
      </form>
      <p className="bn2-login-footnote">Accès réservé aux utilisateurs invités par BN2 Consulting.</p>
    </section>
    <footer>BN2 HUB <span>•</span> Une solution BN2 Consulting</footer>
  </main>;
}
