import { useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/ui/select-field";
export default function UserSettings({onClose}) {
  const {user,updatePreferences} = useAuth();
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
  return <Dialog open onOpenChange={value=>!value&&!busy&&onClose()}><DialogContent className="border border-zinc-800 bg-zinc-950">
    <DialogHeader><DialogTitle>Account settings</DialogTitle><DialogDescription>Choose the timezone used to enter and display your trades.</DialogDescription></DialogHeader>
    <SelectField label="Timezone" value={zone} onValueChange={setZone} options={[{value:"browser",label:`Browser (${Intl.DateTimeFormat().resolvedOptions().timeZone})`},...zones.map(value=>({value,label:value.replaceAll("_"," ")}))]} allowClear={false}/>
    {error&&<p role="alert" className="text-red-400">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="button" disabled={busy} onClick={save}>{busy?"Saving...":"Save preferences"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
