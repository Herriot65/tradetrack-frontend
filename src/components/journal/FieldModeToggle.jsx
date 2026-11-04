export default function FieldModeToggle({label,options,value,onChange}) {
  return <div role="group" aria-label={label} className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
    {options.map(option=><button key={option.value} type="button" aria-label={option.title || option.label} title={option.title || option.label} aria-pressed={value===option.value} disabled={option.disabled} onClick={()=>onChange(option.value)} className={`flex h-5 min-w-6 items-center justify-center rounded px-1.5 text-[10px] leading-none outline-none transition-colors focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-30 ${value===option.value?"bg-zinc-700/70 text-zinc-100":"text-zinc-500 hover:text-zinc-200"}`}>{option.icon || option.label}</button>)}
  </div>;
}
