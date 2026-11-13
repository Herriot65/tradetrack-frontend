import { removableFields } from "@/hooks/useEntryFieldPreferences";
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EntryFieldActions({id, label, settings, onEditOptions, children, active, onRename, onRequestRemove, disabled=false, maxNameLength=60}) {
 const [mode, setMode] = useState(null);
 const [name, setName] = useState('');
 const current = settings?.label(id, label) ?? label;
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const canRemove=!!onRequestRemove || removableFields.has(id);
 const close = () => {if(!busy){setMode(null);setError('');}};
 const save = async () => {
  if(!name.trim()||busy)return;
  setBusy(true);setError('');
  try {if(onRename)await onRename(name.trim());else settings.change(id,{label:name.trim()});setMode(null);}
  catch(err) {const data=err?.response?.data;setError(data?Object.values(data).flat().join(' '):err.message || 'Failed to rename field.');}
  finally {setBusy(false);}
 };
 if (!active) return children ?? null;
 return <div className="flex shrink-0 items-center gap-1">
  {children}
  <button type="button" disabled={disabled||busy} aria-label={`Edit ${current} field`} title="Edit field" onClick={() => {setName(current);setMode('edit');}} className="flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"><Pencil className="size-3.5" /></button>
  {canRemove && <button type="button" disabled={disabled||busy} aria-label={`Remove ${current} field`} title="Remove field" onClick={() => onRequestRemove ? onRequestRemove() : setMode('remove')} className="flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-400/10 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"><Trash2 className="size-3.5" /></button>}
  <Dialog open={mode !== null} onOpenChange={open => !open && close()}>
   <DialogContent className="sm:max-w-sm">
    <DialogHeader><DialogTitle>{mode === 'remove' ? `Remove ${current}?` : 'Edit field'}</DialogTitle><DialogDescription>{mode === 'remove' ? 'Remove this field from your trade entry? Saved trade values are kept. You can restore it from the section header.' : (onRename ? 'Choose a name for this field. Saved trade values are kept.' : removableFields.has(id) ? 'Choose a name that fits your trading journal.' : 'You can rename this field. It stays in your entry because it is used for trade records or calculations.')}</DialogDescription></DialogHeader>
    {mode === 'edit' && <div className="space-y-3"><label className="text-xs text-muted-foreground" htmlFor={`field-name-${id}`}>Field name</label><Input id={`field-name-${id}`} autoFocus value={name} disabled={busy} maxLength={maxNameLength} onChange={event => setName(event.target.value)} onKeyDown={event => {if(event.key === 'Enter'){event.preventDefault();event.stopPropagation();save();}}} />{onEditOptions && <button type="button" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => {close();onEditOptions();}}>Edit dropdown options</button>}</div>}
    {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>{mode === 'remove' ? <Button type="button" variant="destructive" onClick={() => {settings.change(id, {visible:false});close();}}>Remove field</Button> : <Button type="button" disabled={!name.trim()||busy} onClick={save}>Save name</Button>}</DialogFooter>
   </DialogContent>
  </Dialog>
 </div>;
}
