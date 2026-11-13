import SelectField from "@/components/ui/select-field";
import DateField from "@/components/ui/date-field";
import { SECTION_OPTIONS, fieldClass } from "./coachConfiguration.js";

export default function CoachConfiguration({ value, onChange, scheduled = false }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-xs font-medium">Data period
        <SelectField label="Data period" className="mt-2" value={value.period} onValueChange={next => set("period", next)} allowClear={false} options={[{value:"day",label:"Today"},{value:"week",label:"Last 7 days"},{value:"month",label:"Last 30 days"},...(!scheduled ? [{value:"custom",label:"Custom dates"}] : [])]} />
      </label>
      <label className="space-y-2 text-xs font-medium">Response length
        <SelectField label="Response length" className="mt-2" value={value.detail} onValueChange={next => set("detail", next)} allowClear={false} options={[{value:"brief",label:"Brief"},{value:"detailed",label:"Detailed"}]} />
      </label>
    </div>
    {value.period === "custom" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="text-xs">From<DateField label="From" required max={value.end_date} className="mt-2" value={value.start_date || ""} onChange={next => set("start_date", next)} /></label>
      <label className="text-xs">Through<DateField label="Through" required min={value.start_date} className="mt-2" value={value.end_date || ""} onChange={next => set("end_date", next)} /></label>
    </div>}
    <fieldset><legend className="text-xs font-medium">Report sections</legend>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">Optional. Leave empty for a natural answer to your question.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-full border border-primary/30 px-3 py-1.5 text-xs text-primary" onClick={() => set("sections", value.sections.length === SECTION_OPTIONS.length ? [] : SECTION_OPTIONS.map(([key]) => key))}>Full report</button>
        {SECTION_OPTIONS.map(([key, label]) => <button key={key} type="button" aria-pressed={value.sections.includes(key)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${value.sections.includes(key) ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`} onClick={() => set("sections", value.sections.includes(key) ? value.sections.filter(item => item !== key) : [...value.sections, key])}>{label}</button>)}
      </div>
    </fieldset>
    <label className="block text-xs font-medium">Current goal <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-2`} maxLength={1000} value={value.goal} onChange={e => set("goal", e.target.value)} placeholder="e.g. Follow my entry checklist on every trade" /></label>
    <label className="block text-xs font-medium">Instrument <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-2`} maxLength={50} value={value.instrument} onChange={e => set("instrument", e.target.value)} placeholder="All instruments, or enter a symbol" /></label>
    {!scheduled && <label className="block text-xs font-medium">Trade ID <span className="font-normal text-muted-foreground">(optional)</span><input type="number" min="1" className={`${fieldClass} mt-2`} value={value.trade_id || ""} onChange={e => { const next = { ...value }; if (e.target.value) next.trade_id = Number(e.target.value); else delete next.trade_id; onChange(next); }} placeholder="Limit analysis to one trade" /></label>}
    <label className="flex items-start gap-3 text-xs"><input type="checkbox" className="mt-0.5 accent-primary" checked={value.screenshots} onChange={e => set("screenshots", e.target.checked)} /><span>Allow screenshot analysis<p className="mt-1 text-muted-foreground">The coach can inspect up to three relevant attached images per response.</p></span></label>
  </div>;
}
