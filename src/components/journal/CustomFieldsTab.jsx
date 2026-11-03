import { Layers } from "lucide-react";
import { useTradeCustomFields } from "@/hooks/useTradeCustomFields";
import { TRADE_SECTIONS, CUSTOM_FIELD_TYPES } from "@/lib/tradeCustomFields";
import { Button } from "@/components/ui/button";
export default function CustomFieldsTab({journalId,active}) {
  const {fields,loading,error,refetch}=useTradeCustomFields(journalId,{enabled:active});
  if(loading) return <p className="py-10 text-sm text-zinc-500">Loading custom fields...</p>;
  if(error) return <div role="alert" className="flex items-center gap-3 text-sm text-zinc-400">{error}<Button size="sm" variant="outline" onClick={refetch}>Retry</Button></div>;
  return <div className="space-y-6">
    <div><h2 className="text-lg font-medium text-zinc-100">Custom fields</h2><p className="mt-1 text-sm text-zinc-500">Add fields below any section of the trade form. They are available on every trade in this journal.</p></div>
    {!fields.length?<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 py-14 text-center"><Layers className="size-6 text-zinc-600"/><p className="text-sm text-zinc-400">No custom fields yet</p><p className="text-xs text-zinc-500">Open New Trade and choose Add custom field in a section.</p></div>:TRADE_SECTIONS.map(section=>{
      const definitions=fields.filter(field=>field.section===section.value);
      return !definitions.length?null:<section key={section.value} className="overflow-hidden rounded-xl border border-zinc-800"><h3 className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm font-medium text-zinc-200">{section.label}</h3><div className="divide-y divide-zinc-800/60">{definitions.map(field=><div key={field.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="text-zinc-300">{field.label}</span><span className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-500">{CUSTOM_FIELD_TYPES.find(type=>type.value===field.field_type)?.label}</span></div>)}</div></section>;
    })}
  </div>;
}
