import { Pencil } from 'lucide-react';
export default function EntrySectionHeader({section, title, active, onToggle}) {
 return <div className="mb-3 flex items-center justify-between gap-3">
  <h3 className="text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-200">{title}</h3>
  <button type="button" aria-label={active ? `Done customizing ${title}` : `Customize ${title}`} aria-pressed={active} title={`Customize ${title}`} onClick={() => onToggle(active ? null : section)} className="flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">{active ? 'Done' : <Pencil className="size-3.5" />}</button>
 </div>;
}
