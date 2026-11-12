import { getUserTimezone } from "@/lib/timezone";
import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CoachConfiguration from "./CoachConfiguration";
import { TASK_TEMPLATES, defaultConfiguration, fieldClass, localDate, apiError, scheduleSummary, configurationError } from "./coachConfiguration.js";
import { saveCoachTask } from "@/api/coach.api";

export default function CoachTaskDialog({ journalId, task, seed, onClose, onSaved }) {
  const [value, setValue] = useState(() => task || {
    title: seed?.title || "", instructions: seed?.instructions || "",
    configuration: { ...defaultConfiguration(), ...seed?.configuration, period: seed?.configuration?.period === "custom" ? "week" : seed?.configuration?.period || "week", trade_id: undefined },
    frequency: "weekly", start_date: localDate(seed?.configuration?.timezone || getUserTimezone()), local_time: "18:00", timezone: seed?.configuration?.timezone || getUserTimezone(), enabled: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState("");
  const set = (key, next) => setValue(previous => ({ ...previous, [key]: next }));
  function useTemplate(id) {
    setTemplate(id);
    const item = TASK_TEMPLATES.find(option => option.id === id);
    if (item) setValue(previous => ({ ...previous, title: item.title, instructions: item.instructions, frequency: item.frequency, local_time: item.local_time, configuration: { ...previous.configuration, ...item.configuration, trade_status: "all" } }));
  }
  async function save(event) {
    event.preventDefault();
    const invalid = configurationError(value.configuration);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError("");
    try {
      const { title, instructions, configuration, frequency, start_date, local_time, timezone, enabled } = value;
      await saveCoachTask(journalId, { title, instructions, configuration, frequency, start_date, local_time, timezone, enabled }, task?.id);
      onSaved(); onClose();
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarClock className="size-5 text-primary" />{task ? "Edit coaching task" : "Schedule a coaching task"}</DialogTitle><DialogDescription>Prepare, reflect, check a goal, or ask for something else. Completed results appear here in Scheduled tasks.</DialogDescription></DialogHeader>
    <form onSubmit={save} className="space-y-5">
      {!task && <label className="block text-xs font-medium">Start with a template<select aria-label="Start with a template" className={`${fieldClass} mt-2`} value={template} onChange={e => useTemplate(e.target.value)}><option value="">Custom task</option>{TASK_TEMPLATES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
      <label className="block text-xs font-medium">Task name<input required maxLength={100} className={`${fieldClass} mt-2`} value={value.title} onChange={e => set("title", e.target.value)} placeholder="My pre-session preparation" /></label>
      <label className="block text-xs font-medium">What should the coach do?<textarea required rows={3} maxLength={4000} className={`${fieldClass} mt-2 resize-y`} value={value.instructions} onChange={e => set("instructions", e.target.value)} placeholder="Ask me three questions to prepare for my session. Focus on patience and following my plan." /></label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">Repeat<select aria-label="Repeat" className={`${fieldClass} mt-2`} value={value.frequency} onChange={e => set("frequency", e.target.value)}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
        <label className="text-xs font-medium">{value.frequency === "once" ? "Date" : "Start date"}<input type="date" required className={`${fieldClass} mt-2`} value={value.start_date} onChange={e => set("start_date", e.target.value)} /></label>
        <label className="text-xs font-medium">Time<input type="time" required className={`${fieldClass} mt-2`} value={value.local_time} onChange={e => set("local_time", e.target.value)} /></label>
        <label className="text-xs font-medium">Timezone<input required maxLength={64} className={`${fieldClass} mt-2`} value={value.timezone} onChange={e => set("timezone", e.target.value)} list="coach-timezones" /><datalist id="coach-timezones">{["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"].map(zone => <option key={zone} value={zone} />)}</datalist></label>
      </div>
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-3"><p className="text-xs font-medium">Your schedule</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{scheduleSummary(value)}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Uses fresh journal data each time. Results appear in this app; no email or push notification is sent.</p></div>
      <details className="rounded-xl border border-border p-3"><summary className="cursor-pointer text-xs font-medium">Customize data & output</summary><div className="mt-4"><CoachConfiguration scheduled value={value.configuration} onChange={next => set("configuration", next)} /></div></details>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={value.enabled} onChange={e => set("enabled", e.target.checked)} />Enable task</label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" type="button" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} type="submit">{busy && <Loader2 className="size-4 animate-spin" />}Save task</Button></div>
    </form>
  </DialogContent></Dialog>;
}
