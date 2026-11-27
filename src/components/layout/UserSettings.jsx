import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/ui/select-field";
import { reauthenticate, logoutAllDevices } from "@/api/auth.api";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { PasswordInput } from "@/components/forms/PasswordInput";
import ThemeToggle from "./ThemeToggle";
import AICoachSettings from "@/components/coach/AICoachSettings";
export default function UserSettings({onClose}) {
  useLanguage();
  const {user,updatePreferences,resetSession} = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [password, setPassword] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [zone,setZone] = useState(user?.timezone || "browser");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const zones = [...new Set(["UTC", user?.timezone, ...(Intl.supportedValuesOf?.("timeZone") || [])].filter(Boolean))];
  async function save() {
    setBusy(true);setError("");
    try {await updatePreferences({timezone:zone==="browser"?"":zone});onClose();}
    catch(error) {setError(error.response?.data?.timezone?.[0] || error.message);}
    finally {setBusy(false);}
  }
  async function signOutEverywhere(credentials) {
    setSecurityBusy(true);setSecurityError("");
    try {
      await reauthenticate(credentials);
      await logoutAllDevices();
      resetSession();
      onClose();
    } catch (error) {
      setSecurityError(error.response?.data?.detail || "Unable to sign out all devices. Check your connection and try again.");
    } finally {setSecurityBusy(false);}
  }
  return <Dialog open onOpenChange={value=>!value&&!busy&&!securityBusy&&onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto border border-zinc-800 bg-zinc-950">
    <DialogHeader><DialogTitle>{t("Account settings")}</DialogTitle><DialogDescription>{t("Choose your appearance and the timezone used for trades.")}</DialogDescription></DialogHeader>
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("Appearance")}</p>
      <ThemeToggle />
      <p className="text-xs text-muted-foreground">{t("Saved in this browser. System follows your device’s theme.")}</p>
    </div>
    <SelectField label={t("Timezone")} value={zone} onValueChange={setZone} options={[{value:"browser",label:`${t("Browser")} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`},...zones.map(value=>({value,label:value.replaceAll("_"," ")}))]} allowClear={false}/>
    <div className="border-t border-border pt-4"><AICoachSettings /></div>
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium">{t("Security")}</p>
      {!confirmSignOut ? <Button type="button" variant="outline" onClick={()=>setConfirmSignOut(true)}>{t("Sign out all devices")}</Button> : <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("Confirm your identity to sign out on every device, including this one.")}</p>
        <GoogleSignIn onCredential={credential=>signOutEverywhere({credential})} />
        <label htmlFor="confirm-password" className="text-sm">{t("Password")}</label>
        <PasswordInput id="confirm-password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" />
        <Button type="button" disabled={securityBusy || !password} onClick={()=>signOutEverywhere({password})}>{securityBusy?t("Signing out..."):t("Confirm and sign out all devices")}</Button>
        {securityError&&<p role="alert" className="text-sm text-destructive">{t(securityError)}</p>}
      </div>}
    </div>
    {error&&<p role="alert" className="text-red-400">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy || securityBusy} onClick={onClose}>{t("Cancel")}</Button><Button type="button" disabled={busy || securityBusy} onClick={save}>{busy?t("Saving..."):t("Save preferences")}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
