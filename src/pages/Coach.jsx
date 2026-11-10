import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, CalendarClock, Check, ChevronRight, CircleHelp, Clock3, FileText, Loader2, MessageSquare, Pause, Play, Plus, RotateCcw, Settings2, Sparkles, Target, Trash2 } from "lucide-react";
import { fetchTrade } from "@/api/trades.api";
import { effectiveStatus } from "@/lib/analytics";
import { getUserTimezone } from "@/lib/timezone";
import TradeDetailPanel from "@/components/journal/TradeDetailPanel";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CoachConfiguration from "@/components/coach/CoachConfiguration";
import { defaultConfiguration, apiError } from "@/components/coach/coachConfiguration.js";
import CoachTaskDialog from "@/components/coach/CoachTaskDialog";
import { askCoach, coachStatus, listCoachTasks, saveCoachTask, deleteCoachTask, runCoachTask, coachTaskHistory } from "@/api/coach.api";
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";

const suggestions = [
  { icon: FileText, title: "Review my week", text: "Understand your performance and patterns", prompt: "Review my trading over the selected period. Highlight what went well, recurring mistakes, and one useful next action." },
  { icon: Target, title: "Prepare for my session", text: "Start with a clear intention", prompt: "Help me prepare for my next trading session. Ask me three focused questions about my plan, risk limits, and mindset. Don't assume you know my trading rules." },
  { icon: CircleHelp, title: "Understand my losses", text: "Look at the evidence behind your results", prompt: "Examine my losing trades in the selected period. Use my notes and tags to identify supported patterns, distinguish interpretations from facts, and suggest one improvement." },
  { icon: MessageSquare, title: "Reflect on my trading", text: "Make space for a better decision", prompt: "Help me reflect on my recent trading. Read my journal notes and ask me one useful question to explore my decision-making." },
];

export default function Coach() {
  const { activeJournal, loading } = useJournal();
  const { user } = useAuth();
  // Remount all journal-specific state so no conversation or task leaks into
  // another journal, including when an earlier request is still in flight.
  return <AppShell>{loading ? <p className="text-muted-foreground">Loading your journal…</p> : !activeJournal ? <div className="nx-surface p-10 text-center"><Sparkles className="mx-auto mb-4 size-8 text-primary" /><h1 className="text-xl font-medium">Your trading coach</h1><p className="my-3 text-sm text-muted-foreground">Create a journal to start working with your coach.</p><Button asChild><Link to="/dashboard">Go to journals</Link></Button></div> : <CoachWorkspace key={`${user?.id}:${activeJournal.id}`} journal={activeJournal} accountTimezone={user?.timezone || getUserTimezone()} />}</AppShell>;
}

function CoachWorkspace({ journal, accountTimezone }) {
  const formatDate = value => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short", timeZone: accountTimezone }) : "No upcoming run";
  const [tab, setTab] = useState("chat");
  const [outputConfiguration, setConfiguration] = useState(() => defaultConfiguration(accountTimezone));
  const configuration = { ...outputConfiguration, timezone: accountTimezone };
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [taskDialog, setTaskDialog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskBusy, setTaskBusy] = useState(null);
  const [history, setHistory] = useState(null);
  const [evidenceTrade, setEvidenceTrade] = useState(null);
  const bottom = useRef(null);
  const controller = useRef(null);
  const requestBusy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const abort = new AbortController();
    controller.current = abort;
    coachStatus(journal.id).then(value => { if (!abort.signal.aborted) setStatus(value); }).catch(err => { if (!abort.signal.aborted) setError(apiError(err)); });
    listCoachTasks(journal.id).then(value => { if (!abort.signal.aborted) setTasks(value); }).catch(err => { if (!abort.signal.aborted) setTaskError(apiError(err)); }).finally(() => { if (!abort.signal.aborted) setTasksLoading(false); });
    return () => { mounted.current = false; controller.current?.abort(); abort.abort(); };
  }, [journal.id]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);

  async function reloadTasks() {
    try { const value = await listCoachTasks(journal.id); if (mounted.current) { setTasks(value); setTaskError(""); } }
    catch (err) { if (mounted.current) setTaskError(apiError(err)); }
  }
  async function send(prompt = input) {
    if (!prompt.trim() || requestBusy.current) return;
    requestBusy.current = true;
    const request = new AbortController(); controller.current = request;
    const instruction = prompt.trim();
    setInput(instruction); setError(""); setBusy(true);
    try {
      const response = await askCoach(journal.id, { instructions: instruction, configuration, history: messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 8000) })) }, request.signal);
      if (!mounted.current) return;
      setMessages(previous => [...previous, { role: "user", content: instruction, configuration: structuredClone(configuration) }, { role: "assistant", content: response.output, evidence: response.evidence, screenshots: response.screenshots_analyzed }]);
      setInput("");
    } catch (err) { if (mounted.current && !request.signal.aborted) setError(apiError(err)); }
    finally { requestBusy.current = false; if (mounted.current) setBusy(false); }
  }
  async function taskAction(id, action) {
    setTaskBusy(id); setTaskError("");
    try { await action(); await reloadTasks(); }
    catch (err) { if (mounted.current) setTaskError(apiError(err)); }
    finally { if (mounted.current) setTaskBusy(null); }
  }
  async function showHistory(task) {
    setTaskBusy(task.id);
    try { const runs = await coachTaskHistory(journal.id, task.id); if (mounted.current) setHistory({ task, runs }); }
    catch (err) { if (mounted.current) setTaskError(apiError(err)); }
    finally { if (mounted.current) setTaskBusy(null); }
  }
  async function openEvidence(trade) {
    setEvidenceTrade({ loading: true, id: trade.id });
    try {
      const data = await fetchTrade(journal.id, trade.id);
      const detail = { ...data, _derivedStatus: effectiveStatus(data), emotion: (data.emotions || []).map(item => item.label).join(", "), mistake: (data.mistakes || []).map(item => item.label).join(", ") };
      if (mounted.current) setEvidenceTrade(previous => previous?.id === trade.id ? detail : previous);
    } catch (err) { if (mounted.current) setEvidenceTrade(previous => previous?.id === trade.id ? { error: apiError(err), id: trade.id } : previous); }
  }
  const lastUser = [...messages].reverse().find(item => item.role === "user");
  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="nx-eyebrow text-primary">YOUR TRADING COMPANION</p><h1 className="mt-2 text-3xl font-medium tracking-tight">AI Coach<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">A clearer perspective on your trading, one conversation at a time.</p></div>
      <Button variant="outline" onClick={() => setTaskDialog({})}><Plus className="size-4" />Create a task</Button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="flex gap-2">{[["chat", "Conversation", MessageSquare], ["tasks", "Scheduled tasks", CalendarClock]].map(([key, label, Icon]) => <Button key={key} variant={tab === key ? "secondary" : "ghost"} onClick={() => setTab(key)} aria-pressed={tab === key}><Icon className="size-4" />{label}{key === "tasks" && tasks.length > 0 && <span className="rounded bg-primary/10 px-1.5 text-xs text-primary">{tasks.length}</span>}</Button>)}</div>
      <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-1.5 rounded-full ${status?.configured ? "bg-emerald-500" : "bg-amber-500"}`} />{journal.name} · {status === null ? "Checking connection" : status.configured ? "AI configured" : "Setup required"}</span>
    </div>
    {status && !status.configured && <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm"><Settings2 className="mt-0.5 size-4 shrink-0 text-amber-500" /><div><p className="font-medium">Connect AI to bring your coach to life</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your server needs an AI API key before conversations or tasks can run. You can configure and save coaching tasks now.</p></div></div>}
    {tab === "chat" ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <section className="nx-surface flex min-h-[580px] min-w-0 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3"><span className="flex items-center gap-2 text-xs font-medium"><Sparkles className="size-4 text-primary" />Coach conversation</span><Button variant="ghost" size="sm" disabled={busy || !messages.length} onClick={() => { setMessages([]); setError(""); }}><RotateCcw className="size-3.5" />New chat</Button></div>
        <div className="max-h-[65vh] flex-1 space-y-6 overflow-y-auto px-5 py-8 sm:px-8" aria-live="polite" aria-busy={busy}>
          {!messages.length && <div className="mx-auto max-w-xl py-5"><span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Sparkles className="size-6" /></span><h2 className="text-2xl font-medium tracking-tight">What would you like to work on?</h2><p className="mb-7 mt-3 text-sm leading-6 text-muted-foreground">Explore a trade, prepare for your session, or talk through a pattern. Start anywhere.</p><div className="grid gap-3 sm:grid-cols-2">{suggestions.map(({ icon: Icon, title, text, prompt }) => <button key={title} className="group rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50" disabled={busy} onClick={() => setInput(prompt)}><Icon className="mb-3 size-4 text-primary" /><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span></button>)}</div></div>}
          {messages.map((message, index) => <article key={index} className={message.role === "user" ? "ml-auto max-w-[90%] rounded-2xl bg-secondary p-4" : "max-w-full"}><p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">{message.role === "user" ? "You" : <><Sparkles className="size-3.5 text-primary" />Nexora Coach</>}</p><div className="whitespace-pre-wrap break-words text-sm leading-7">{message.content}</div>{message.evidence?.length > 0 && <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Supporting trades ({message.evidence.length})</summary><div className="mt-2 flex flex-wrap gap-2">{message.evidence.map(trade => <button type="button" key={trade.id} className="rounded-md border border-border px-2 py-1 hover:text-primary" onClick={() => openEvidence(trade)}>#{trade.id} · {trade.symbol}</button>)}</div></details>}{message.screenshots > 0 && <p className="mt-2 text-xs text-muted-foreground">{message.screenshots} screenshot(s) analyzed</p>}</article>)}
          {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Your coach is working…</p>}<div ref={bottom} />
        </div>
        <div className="border-t border-border p-4"><form onSubmit={e => { e.preventDefault(); send(); }}><label className="sr-only" htmlFor="coach-prompt">Ask your coach</label><textarea id="coach-prompt" className="min-h-24 w-full resize-y bg-transparent p-2 text-sm outline-none placeholder:text-muted-foreground" rows={3} maxLength={4000} placeholder="Ask your coach, or describe what you want to work on…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} /><div className="flex flex-wrap items-center justify-between gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setOptionsOpen(true)}><Settings2 className="size-3.5" />Adjust output</Button><div className="flex items-center gap-2"><span className="text-[11px] text-muted-foreground">{configuration.detail === "brief" ? "Brief" : "Detailed"} · {configuration.period === "day" ? "Today" : configuration.period === "week" ? "7 days" : configuration.period === "month" ? "30 days" : "Custom dates"}</span><Button type="submit" aria-label="Send message" disabled={busy || !input.trim() || !status?.configured}><ArrowUp className="size-4" /></Button></div></div></form>{error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}</div>
      </section>
      <aside className="space-y-4"><div className="nx-surface p-5"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10"><CalendarClock className="size-4 text-primary" /></span><h2 className="mt-4 text-sm font-medium">Coaching, on your schedule</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">A morning intention, a goal check-in, or a monthly report. Give your coach a task and a time.</p><Button variant="outline" className="mt-4 w-full" onClick={() => setTaskDialog({ seed: { instructions: input || lastUser?.content || "", configuration } })}>Schedule this<ChevronRight className="size-3.5" /></Button></div><div className="px-2 text-xs leading-6 text-muted-foreground"><p className="flex items-center gap-2 font-medium text-foreground"><Check className="size-3.5 text-primary" />Grounded in your journal</p><p className="mt-2">Uses your recorded trades and existing statistics. Your coach will ask when context is missing.</p><p className="mt-3">This conversation has no persistent coaching memory. New chats start fresh.</p></div></aside>
    </div> : <section className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-medium">Your coaching tasks</h2><p className="mt-1 text-xs text-muted-foreground">Any instruction, delivered on your schedule. Results stay in task history.</p></div><Button variant="ghost" size="sm" disabled={taskBusy !== null} onClick={reloadTasks}><RotateCcw className="size-3.5" />Refresh</Button></div>
      {taskError && <p role="alert" className="text-sm text-destructive">{taskError}</p>}
      {tasksLoading ? <p className="text-sm text-muted-foreground">Loading tasks…</p> : !tasks.length ? <div className="nx-surface py-16 text-center"><CalendarClock className="mx-auto mb-4 size-8 text-primary" /><h3 className="text-lg font-medium">Make coaching a habit</h3><p className="mx-auto mb-5 mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Schedule reflection questions, session preparation, goal check-ins, or your own custom task.</p><Button onClick={() => setTaskDialog({})}><Plus className="size-4" />Create your first task</Button></div> : tasks.map(task => <article key={task.id} className="nx-surface p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-medium"><span className={`size-2 rounded-full ${task.enabled ? "bg-emerald-500" : "bg-muted-foreground"}`} /><span>{task.title}</span><span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-normal text-muted-foreground">{task.enabled ? "Enabled" : "Paused"}</span></p><p className="mt-2 max-w-2xl whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">{task.instructions}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{task.frequency} · {task.local_time.slice(0, 5)} {task.timezone}</p><p className="mt-1 text-xs text-muted-foreground">Next: {formatDate(task.next_run_at)}</p></div><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={taskBusy !== null || !status?.configured} onClick={() => taskAction(task.id, async () => { const run = await runCoachTask(journal.id, task.id); if (run.status === "failed") throw new Error(run.error); })}>{taskBusy === task.id ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}Run now</Button><Button size="icon-sm" variant="ghost" aria-label={`${task.enabled ? "Pause" : "Resume"} ${task.title}`} disabled={taskBusy !== null} onClick={() => taskAction(task.id, () => saveCoachTask(journal.id, { enabled: !task.enabled }, task.id))}>{task.enabled ? <Pause className="size-4" /> : <Play className="size-4" />}</Button><Button size="icon-sm" variant="ghost" aria-label={`Edit ${task.title}`} onClick={() => setTaskDialog({ task })}><Settings2 className="size-4" /></Button><Button size="icon-sm" variant="ghost" aria-label={`Delete ${task.title}`} disabled={taskBusy !== null} onClick={() => setTaskDialog({ deleting: task })}><Trash2 className="size-4" /></Button></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3"><p className={`text-xs ${task.latest_run?.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{task.latest_run ? `Last run: ${task.latest_run.status} · ${formatDate(task.latest_run.created_at)}` : "No runs yet"}</p><Button variant="ghost" size="sm" disabled={taskBusy !== null} onClick={() => showHistory(task)}>View history<ChevronRight className="size-3.5" /></Button></div></article>)}
    </section>}
    {evidenceTrade && (evidenceTrade.loading || evidenceTrade.error ? <Dialog open onOpenChange={() => setEvidenceTrade(null)}><DialogContent><DialogHeader><DialogTitle>Trade #{evidenceTrade.id}</DialogTitle><DialogDescription>Recorded evidence from {journal.name}</DialogDescription></DialogHeader>{evidenceTrade.loading ? <p>Loading trade…</p> : <p role="alert" className="text-destructive">{evidenceTrade.error}</p>}</DialogContent></Dialog> : <TradeDetailPanel trade={evidenceTrade} open onClose={() => setEvidenceTrade(null)} />)}
    {optionsOpen && <Dialog open onOpenChange={setOptionsOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Make it useful to you</DialogTitle><DialogDescription>Choose the data and level of detail. Your question still leads the conversation.</DialogDescription></DialogHeader><CoachConfiguration value={configuration} onChange={setConfiguration} /><Button onClick={() => setOptionsOpen(false)}>Done</Button></DialogContent></Dialog>}
    {taskDialog && !taskDialog.deleting && <CoachTaskDialog journalId={journal.id} {...taskDialog} seed={taskDialog.seed || { configuration }} onClose={() => setTaskDialog(null)} onSaved={() => { reloadTasks(); setTab("tasks"); }} />}
    {taskDialog?.deleting && <Dialog open onOpenChange={() => setTaskDialog(null)}><DialogContent><DialogHeader><DialogTitle>Delete this task?</DialogTitle><DialogDescription>“{taskDialog.deleting.title}” and its run history will be deleted.</DialogDescription></DialogHeader><Button variant="destructive" disabled={taskBusy !== null} onClick={() => taskAction(taskDialog.deleting.id, async () => { await deleteCoachTask(journal.id, taskDialog.deleting.id); setTaskDialog(null); })}>Delete task</Button>{taskError && <p role="alert" className="text-xs text-destructive">{taskError}</p>}</DialogContent></Dialog>}
    {history && <Dialog open onOpenChange={() => setHistory(null)}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{history.task.title}</DialogTitle><DialogDescription>Recent task results</DialogDescription></DialogHeader>{!history.runs.length ? <p className="text-sm text-muted-foreground">No runs yet.</p> : history.runs.map(run => <article key={run.id} className="rounded-xl border border-border p-4"><p className="mb-3 text-xs text-muted-foreground">{formatDate(run.created_at)} · {run.status}</p><p className={`whitespace-pre-wrap break-words text-sm leading-7 ${run.error ? "text-destructive" : ""}`}>{run.output || run.error || "Task is running. Close and reopen history to refresh."}</p>{run.evidence?.length > 0 && <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Supporting trades ({run.evidence.length})</summary><div className="mt-2 flex flex-wrap gap-2">{run.evidence.map(trade => <button type="button" key={trade.id} className="rounded-md border border-border px-2 py-1 hover:text-primary" onClick={() => openEvidence(trade)}>#{trade.id} · {trade.symbol}</button>)}</div></details>}</article>)}</DialogContent></Dialog>}
  </div>;
}
