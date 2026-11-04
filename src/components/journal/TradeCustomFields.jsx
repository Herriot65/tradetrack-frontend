import { useState } from "react";
import { Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/ui/select-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TRADE_SECTIONS, CUSTOM_FIELD_TYPES, customFieldOptions } from "@/lib/tradeCustomFields";

function AddField({section,onCreate,onClose,allowSection=false}) {
  const [label,setLabel]=useState("");
  const [type,setType]=useState("text");
  const [options,setOptions]=useState("");
  const [selectedSection,setSelectedSection]=useState(section ?? TRADE_SECTIONS[0].value);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const targetSection=section ?? selectedSection;
  const sectionLabel=TRADE_SECTIONS.find(item=>item.value===targetSection)?.label;
  async function submit(event) {
    event.preventDefault();event.stopPropagation();
    if(!label.trim()) {setError("Enter a field name.");return;}
    const choices=type==="select"?customFieldOptions(options):[];
    if(type==="select"&&!choices.length) {setError("Add at least one dropdown option.");return;}
    setBusy(true);setError("");
    try {await onCreate({section:targetSection,label:label.trim(),field_type:type,options:choices});onClose();}
    catch(error) { const data=error?.response?.data;setError(data ? Object.values(data).flat().join(" ") : error.message); }
    finally {setBusy(false);}
  }
  return <DialogContent className="max-h-[90dvh] max-w-[calc(100vw-24px)] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-sm">
    <DialogHeader><DialogTitle>Add field to {sectionLabel}</DialogTitle><DialogDescription>Available on all trades in this journal. Its value is saved separately for each trade.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      {allowSection&&<div className="space-y-1.5"><label htmlFor="custom-field-section" className="text-xs text-zinc-400">Section</label><SelectField id="custom-field-section" label="Section" value={selectedSection} onValueChange={setSelectedSection} options={TRADE_SECTIONS.map(item=>({value:item.value,label:item.label}))} allowClear={false}/></div>}
      <div className="space-y-1.5"><label htmlFor="custom-field-label" className="text-xs text-zinc-400">Field name</label><Input id="custom-field-label" autoFocus maxLength={80} value={label} onChange={event=>setLabel(event.target.value)} placeholder="e.g. Market condition" className="h-10 border-zinc-800 bg-zinc-900/60"/></div>
      <div className="space-y-1.5"><label htmlFor="custom-field-type" className="text-xs text-zinc-400">Field type</label><SelectField id="custom-field-type" label="Field type" value={type} onValueChange={setType} options={CUSTOM_FIELD_TYPES} allowClear={false}/></div>
      {type==="select"&&<div className="space-y-1.5"><label htmlFor="custom-field-options" className="text-xs text-zinc-400">Options</label><textarea id="custom-field-options" rows={4} value={options} onChange={event=>setOptions(event.target.value)} placeholder={"Trending\nRanging\nVolatile"} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40"/><p className="text-[11px] text-zinc-500">One option per line, or separate with commas.</p></div>}
      {error&&<p role="alert" className="text-xs text-red-400">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy?"Adding...":"Add field"}</Button></DialogFooter>
    </form>
  </DialogContent>;
}

export function AddCustomFieldButton({onCreate,disabled}) {
  const [adding,setAdding]=useState(false);
  return <>
    <button type="button" disabled={disabled} onClick={()=>setAdding(true)} className="flex min-h-9 items-center gap-1.5 rounded-lg border border-dashed border-zinc-800 px-3 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"><Plus className="size-3.5"/>Add custom field</button>
    <Dialog open={adding} onOpenChange={setAdding}>{adding&&<AddField allowSection onCreate={onCreate} onClose={()=>setAdding(false)}/>}</Dialog>
  </>;
}

export default function TradeCustomFields({section,fields,control,errors,onCreate,onRemove,disabled,showAdd=true}) {
  const [adding,setAdding]=useState(false);
  const [removing,setRemoving]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [removeError,setRemoveError]=useState("");
  async function remove(definition) {
    setRemoving(definition.id);setRemoveError("");
    try {await onRemove(definition.id);setDeleteTarget(null);} catch(error) {setRemoveError(error.message || "Failed to delete field.");}
    finally {setRemoving(null);}
  }
  const definitions=fields.filter(field=>field.section===section);
  const label=TRADE_SECTIONS.find(item=>item.value===section)?.label;
  return <div className="mt-4 space-y-3">
    {definitions.length>0&&<div className="trade-custom-fields-grid grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
      {definitions.map(definition=><div key={definition.id} className="min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`custom-${definition.id}`} className="block text-xs font-medium text-zinc-400">{definition.label}</label>
          {onRemove&&<button type="button" aria-label={`Delete custom field ${definition.label}`} disabled={disabled||removing!==null} onClick={()=>{setRemoveError("");setDeleteTarget(definition);}} className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 className="size-3.5"/></button>}
        </div>
        <Controller name={`custom_fields.${definition.id}`} control={control} defaultValue="" render={({field})=>{
          const props={id:`custom-${definition.id}`,"aria-label":definition.label,onBlur:field.onBlur,ref:field.ref};
          if(definition.field_type==="select") return <SelectField {...props} label={definition.label} value={field.value} onValueChange={field.onChange} options={definition.options} placeholder="Select an option"/>;
          if(definition.field_type==="boolean") return <SelectField {...props} label={definition.label} value={field.value===""||field.value==null?"":String(field.value)} onValueChange={value=>field.onChange(value===""?null:value==="true")} options={[{value:"true",label:"Yes"},{value:"false",label:"No"}]} placeholder="Select yes or no"/>;
          return <Input {...props} type={definition.field_type==="number"?"number":"text"} step={definition.field_type==="number"?"any":undefined} maxLength={definition.field_type==="text"?2000:undefined} value={field.value??""} onChange={event=>field.onChange(definition.field_type==="number"?(event.target.value===""?null:Number(event.target.value)):event.target.value)} className="h-10 border-zinc-800 bg-zinc-900/60 text-sm focus-visible:ring-zinc-400/40"/>;
        }}/>
        {errors?.custom_fields?.[definition.id]?.message&&<p className="text-xs text-red-400">{errors.custom_fields[definition.id].message}</p>}
      </div>)}
    </div>}
    <Dialog open={deleteTarget!==null} onOpenChange={open=>{if(!open&&removing===null)setDeleteTarget(null);}}>
      <DialogContent showCloseButton={removing===null} className="border border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete custom field?</DialogTitle>
          <DialogDescription>Delete “{deleteTarget?.label}” and its saved values from all trades in this journal? This cannot be undone.</DialogDescription>
        </DialogHeader>
        {removeError&&<p role="alert" className="text-xs text-red-400">{removeError}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={removing!==null} onClick={()=>setDeleteTarget(null)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={removing!==null} onClick={()=>deleteTarget&&remove(deleteTarget)}>{removing!==null?"Deleting...":"Delete field"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {showAdd&&<>
      <button type="button" disabled={disabled} aria-label={`Add custom field to ${label}`} onClick={()=>setAdding(true)} className="flex min-h-9 items-center gap-1.5 rounded-lg border border-dashed border-zinc-800 px-3 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"><Plus className="size-3.5"/>Add custom field</button>
      <Dialog open={adding} onOpenChange={setAdding}>{adding&&<AddField section={section} onCreate={onCreate} onClose={()=>setAdding(false)}/>}</Dialog>
    </>}
  </div>;
}
