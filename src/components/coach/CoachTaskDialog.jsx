import { getUserTimezone } from "@/lib/timezone";
import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CoachConfiguration, { defaultConfiguration, fieldClass, localDate } from "./CoachConfiguration";
import { saveCoachTask } from "@/api/coach.api";

export const apiError = (error) => {
  const data = error?.response?.data;
  if (!data) return error.message || "Something went wrong. Please try again.";
  if (typeof data.detail === "string") return data.detail;
  return Object.entries(data).map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`).join(" · ");
};

export default function CoachTaskDialog({ journalId, task, seed, onClose, onSaved }) {
  const [value, setValue] = useState(() => task || { title: "", instructions: seed?.instructions || "", configuration: { ...defaultConfiguration(), ...seed?.configuration, period: seed?.configuration?.period === "custom" ? "week" : seed?.configuration?.period || "week", trade_id: undefined }, frequency: "weekly", start_date: localDate(seed?.configuration?.timezone || getUserTimezone()), local_time: "18:00", timezone: seed?.configuration?.timezone || getUserTimezone(), enabled: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, next) => setValue(previous => ({ ...previous, [key]: next }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { title, instructions, configuration, frequency, start_date, local_time, timezone, enabled } = value;
      await saveCoachTask(journalId, { title, instructions, configuration, frequency, start_date, local_time, timezone, enabled }, task?.id);
      onSaved(); onClose();
    } catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarClock className="size-5 text-primary" />{task ? "Edit coaching task" : "Schedule a coaching task"}</DialogTitle><DialogDescription>Give your coach any instruction. Results will appear in this task’s history.</DialogDescription></DialogHeader>
    <form onSubmit={save} className="space-y-5">
      <label className="block text-xs font-medium">Task name<input required maxLength={100} className={`${fieldClass} mt-2`} value={value.title} onChange={e => set("title", e.target.value)} placeholder="My pre-session preparation" /></label>
      <label className="block text-xs font-medium">What should the coach do?<textarea required rows={3} maxLength={4000} className={`${fieldClass} mt-2 resize-y`} value={value.instructions} onChange={e => set("instructions", e.target.value)} placeholder="Ask me three questions to prepare for my session. Focus on patience and following my plan." /></label>
      <CoachConfiguration scheduled value={value.configuration} onChange={next => set("configuration", next)} />
      <div className="grid grid-cols-2 gap-4">
        <label className="text-xs font-medium">Repeat<select className={`${fieldClass} mt-2`} value={value.frequency} onChange={e => set("frequency", e.target.value)}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
        <label className="text-xs font-medium">{value.frequency === "once" ? "Date" : "Start date"}<input type="date" required className={`${fieldClass} mt-2`} value={value.start_date} onChange={e => set("start_date", e.target.value)} /></label>
        <label className="text-xs font-medium">Time<input type="time" required className={`${fieldClass} mt-2`} value={value.local_time} onChange={e => set("local_time", e.target.value)} /></label>
        <label className="text-xs font-medium">Timezone<input required maxLength={64} className={`${fieldClass} mt-2`} value={value.timezone} onChange={e => set("timezone", e.target.value)} list="coach-timezones" /><datalist id="coach-timezones">{["UTC", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"].map(zone => <option key={zone} value={zone} />)}</datalist></label>
      </div>
      <p className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">{value.frequency === "once" ? "Once" : `Every ${value.frequency === "daily" ? "day" : value.frequency === "weekly" ? "week" : "month"}`} at {value.local_time.slice(0, 5)} ({value.timezone}), starting {value.start_date}.<br />Uses fresh data from the selected rolling period. Automatic runs require the server scheduler.</p>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={value.enabled} onChange={e => set("enabled", e.target.checked)} />Enable task</label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" type="button" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} type="submit">{busy && <Loader2 className="size-4 animate-spin" />}Save task</Button></div>
    </form>
  </DialogContent></Dialog>;
}
