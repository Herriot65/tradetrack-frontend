import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

let googleScript;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript) {
    googleScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        googleScript = undefined;
        reject(new Error("Could not load Google sign-in. Please refresh to retry."));
      };
      document.head.appendChild(script);
    });
  }
  return googleScript;
}

export default function GoogleSignIn() {
  const { language } = useLanguage();
  const container = useRef(null);
  const busy = useRef(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    loadGoogle().then(() => {
      if (!active) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!active || busy.current) return;
          busy.current = true;
          setPending(true);
          setError("");
          try {
            await loginWithGoogle(credential);
            if (active) navigate("/dashboard", { replace: true });
          } catch (err) {
            if (active) setError(err.response?.data?.detail || "Google sign-in failed. Please try again.");
          } finally {
            busy.current = false;
            if (active) setPending(false);
          }
        },
      });
      window.google.accounts.id.renderButton(container.current, {
        type: "standard", theme: "outline", size: "large", text: "continue_with", width: 320, locale: language === "fr-FR" ? "fr" : "en",
      });
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [clientId, loginWithGoogle, navigate, language]);

  if (!clientId) return null;
  return (
    <div className="mb-5 space-y-3 text-center">
      <div ref={container} className="flex justify-center" aria-label={t("Continue with Google")} hidden={pending} />
      {pending && <p role="status" className="text-sm">{t("Signing in with Google...")}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
      <p className="text-xs text-muted-foreground">{t("or continue with email")}</p>
    </div>
  );
}
