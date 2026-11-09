import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { fields } from '@/hooks/useEntryFieldPreferences';
export default function EntryFieldPreferences({section, settings}) {
 const [open, setOpen] = useState(false);
 const hidden = fields[section].filter(([id]) => !settings.visible(id));
 if (!hidden.length) return null;
 return <div className="mb-3">
  <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200"><RotateCcw className="size-3" />Restore fields ({hidden.length})</button>
  {open && <div className="mt-2 flex flex-wrap gap-2">{hidden.map(([id, label]) => <button key={id} type="button" onClick={() => settings.change(id, {visible:true})} className="rounded-md border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-600 hover:text-white">Restore {settings.label(id,label)}</button>)}</div>}
 </div>;
}
