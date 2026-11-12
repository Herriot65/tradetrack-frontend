import { PERIODS, SECTION_OPTIONS, TRADE_SCOPES, fieldClass } from "./coachConfiguration.js";

export default function CoachConfiguration({ value, onChange, scheduled = false }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="text-xs font-medium">Data period
        <select aria-label="Data period" className={`${fieldClass} mt-2`} value={value.period} onChange={e => set("period", e.target.value)}>
          {PERIODS.filter(([key]) => !scheduled || key !== "custom").map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium">Response length
        <select aria-label="Response length" className={`${fieldClass} mt-2`} value={value.detail} onChange={e => set("detail", e.target.value)}><option value="brief">Brief</option><option value="detailed">Detailed</option></select>
      </label>
    </div>
    {value.period === "custom" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="text-xs">From<input required type="date" className={`${fieldClass} mt-2`} value={value.start_date || ""} onChange={e => set("start_date", e.target.value)} /></label>
      <label className="text-xs">Through<input required type="date" min={value.start_date} className={`${fieldClass} mt-2`} value={value.end_date || ""} onChange={e => set("end_date", e.target.value)} /></label>
    </div>}
    {!value.trade_id && <label className="block text-xs font-medium">Trades to include<select aria-label="Trades to include" className={`${fieldClass} mt-2`} value={value.trade_status || "all"} onChange={e => set("trade_status", e.target.value)}>{TRADE_SCOPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
    <fieldset><legend className="text-xs font-medium">What should a report include?</legend>
      <p className="mb-3 mt-1 text-xs leading-5 text-muted-foreground">Choose sections, or leave these off to let your question guide the answer.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={value.sections.length === SECTION_OPTIONS.length} className={`rounded-full border px-3 py-2 text-xs ${value.sections.length === SECTION_OPTIONS.length ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`} onClick={() => set("sections", value.sections.length === SECTION_OPTIONS.length ? [] : SECTION_OPTIONS.map(([key]) => key))}>Full report</button>
        {SECTION_OPTIONS.map(([key, label]) => <button key={key} type="button" aria-pressed={value.sections.includes(key)} className={`rounded-full border px-3 py-2 text-xs transition-colors ${value.sections.includes(key) ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`} onClick={() => set("sections", value.sections.includes(key) ? value.sections.filter(item => item !== key) : [...value.sections, key])}>{label}</button>)}
      </div>
    </fieldset>
    <label className="block text-xs font-medium">Current goal <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-2`} maxLength={1000} value={value.goal} onChange={e => set("goal", e.target.value)} placeholder="e.g. Wait for confirmation before every entry" /><span className="mt-1 block font-normal leading-5 text-muted-foreground">Choose a habit you can control. The coach will look for supporting evidence.</span></label>
    {!value.trade_id && <label className="block text-xs font-medium">Instrument <span className="font-normal text-muted-foreground">(optional)</span><input className={`${fieldClass} mt-2`} maxLength={50} value={value.instrument} onChange={e => set("instrument", e.target.value)} placeholder="All instruments, or a symbol such as EURUSD" /></label>}
    <label className="flex items-start gap-3 text-xs"><input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" checked={value.screenshots} onChange={e => set("screenshots", e.target.checked)} /><span>Include attached screenshots<span className="mt-1 block leading-5 text-muted-foreground">Let the coach inspect up to three relevant images from your journal.</span></span></label>
  </div>;
}
