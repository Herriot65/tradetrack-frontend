import { useEffect, useId, useState } from "react";
import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectField from "@/components/ui/select-field";
import { getCoachSettings, saveCoachSettings } from "@/api/coach.api";

const MODEL_SUGGESTIONS = {
  openai: ["gpt-4.1-mini", "gpt-4.1"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
  groq: ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"],
};
const errorMessage = error => {
  const data = error.response?.data;
  // Never display arbitrary response text that might echo a submitted secret.
  if (data?.api_key) return t("Enter a valid API key without spaces.");
  if (data?.model) return t("Enter a valid model name.");
  return t("Unable to update AI Coach settings. Please try again.");
};

export default function AICoachSettings() {
  useLanguage();
  const id = useId();
  const [saved, setSaved] = useState(null);
  const [provider, setProvider] = useState("server");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadVersion, setLoadVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getCoachSettings(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setSaved(data);
      setProvider(data.provider);
      setModel(data.provider === "server" ? data.server_model : data.providers.find(item => item.id === data.provider)?.model || "");
      setError("");
    }).catch(() => {
      if (!controller.signal.aborted) setError(t("Unable to load AI Coach settings."));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loadVersion]);

  const selected = saved?.providers.find(item => item.id === provider);
  const hasKey = provider === "server" ? saved?.server_configured : selected?.has_key;
  const dirty = saved && (provider !== saved.provider || (provider !== "server" && model !== selected?.model) || Boolean(apiKey));

  function chooseProvider(value) {
    setProvider(value);
    setModel(value === "server" ? saved.server_model : saved.providers.find(item => item.id === value)?.model || "");
    setApiKey("");
    setError("");
    setNotice("");
  }

  async function save(event, removeKey = false) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await saveCoachSettings({ provider, ...(provider === "server" ? {} : {
        model: model.trim(), ...(removeKey ? { remove_key: true } : apiKey.trim() ? { api_key: apiKey.trim() } : {}),
      }) });
      setSaved(data);
      setModel(provider === "server" ? data.server_model : data.providers.find(item => item.id === provider)?.model || "");
      setApiKey("");
      setNotice(t(removeKey ? "Saved API key removed." : "AI Coach settings saved."));
      window.dispatchEvent(new Event("coach:settings-changed"));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return <section aria-labelledby={`${id}-title`} className="space-y-4">
    <div>
      <h2 id={`${id}-title`} className="text-base font-medium">{t("AI Coach")}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("Choose a provider, model and API key for all your journals and scheduled coaching tasks.")}</p>
    </div>
    {loading ? <p role="status" className="text-sm text-muted-foreground">{t("Loading AI Coach settings…")}</p> : saved ? <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <div className="space-y-2">
          <label htmlFor={`${id}-provider`} className="text-sm">{t("AI provider")}</label>
          <SelectField id={`${id}-provider`} label={t("AI provider")} value={provider} onValueChange={chooseProvider} disabled={busy} allowClear={false} options={[
            { value: "server", label: t("Use server default") },
            ...saved.providers.map(item => ({ value: item.id, label: item.label })),
          ]} />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-model`} className="text-sm">{t("AI model")}</label>
          <Input id={`${id}-model`} value={model} onChange={event => { setModel(event.target.value); setNotice(""); }} disabled={provider === "server"} list={`${id}-models`} maxLength={150} autoComplete="off" spellCheck={false} required={provider !== "server"} aria-describedby={`${id}-model-help`} />
          <datalist id={`${id}-models`}>{[...new Set([...(MODEL_SUGGESTIONS[provider] || []), selected?.model].filter(Boolean))].map(name => <option key={name} value={name} />)}</datalist>
          <p id={`${id}-model-help`} className="text-xs leading-5 text-muted-foreground">{t("Choose a suggested model or enter its exact ID. Screenshots require a model with vision support.")}</p>
        </div>
        {provider !== "server" && <div className="space-y-2">
          <label htmlFor={`${id}-key`} className="text-sm">{t("API key")}</label>
          <Input id={`${id}-key`} type="password" value={apiKey} onChange={event => { setApiKey(event.target.value); setNotice(""); }} placeholder={t(selected?.has_key ? "Leave blank to keep your saved key" : "Paste your provider API key")} autoComplete="new-password" spellCheck={false} autoCapitalize="none" maxLength={2048} aria-describedby={`${id}-key-help`} />
          <p id={`${id}-key-help`} className="text-xs leading-5 text-muted-foreground">{t("Keys are encrypted on the server and never shown again. API usage is billed by your provider.")}</p>
        </div>}
        <p className="text-xs text-muted-foreground">{dirty ? t("Save to apply your changes.") : t(hasKey ? "API key configured." : "No API key configured for this provider.")}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !dirty}>{t(busy ? "Saving…" : "Save AI settings")}</Button>
          {provider !== "server" && selected?.has_key && <Button type="button" variant="outline" onClick={event => save(event, true)}>{t("Remove saved key")}</Button>}
        </div>
      </fieldset>
    </form> : <Button type="button" variant="outline" onClick={() => { setLoading(true); setLoadVersion(value => value + 1); }}>{t("Try again")}</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
  </section>;
}
