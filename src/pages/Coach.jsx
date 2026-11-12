import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp, CalendarClock, Check, ChevronRight, Clock3, Download, FileText,
  Loader2, MessageSquare, Pause, Play, Plus, RotateCcw, Search, Settings2,
  ShieldCheck, Sparkles, Square, Target, Trash2, X,
} from "lucide-react";
import { fetchTrade } from "@/api/trades.api";
import { effectiveStatus } from "@/lib/analytics";
import { getUserTimezone } from "@/lib/timezone";
import TradeDetailPanel from "@/components/journal/TradeDetailPanel";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CoachConfiguration from "@/components/coach/CoachConfiguration";
import CoachMessage from "@/components/coach/CoachMessage";
import CoachTradePicker from "@/components/coach/CoachTradePicker";
import CoachTaskDialog from "@/components/coach/CoachTaskDialog";
import {
  COACH_STARTERS, PERIODS, TRADE_SCOPES, defaultConfiguration, apiError,
  configurationError, localDate, scheduleSummary, scopeSummary,
} from "@/components/coach/coachConfiguration.js";
import {
  askCoach, coachStatus, listCoachTasks, saveCoachTask,
  deleteCoachTask, runCoachTask, coachTaskHistory,
} from "@/api/coach.api";
import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";

const STARTER_ICONS = [FileText, Target, Search, ShieldCheck, MessageSquare, Check];

export default function Coach() {
  const { activeJournal, loading, error } = useJournal();
  const { user } = useAuth();
  return <AppShell>
    {loading ? <p role="status" className="text-muted-foreground">Loading your journal…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : !activeJournal ? (
      <div className="nx-surface p-10 text-center">
        <Sparkles className="mx-auto mb-4 size-8 text-primary" />
        <h1 className="text-xl font-medium">Your trading coach</h1>
        <p className="my-3 text-sm text-muted-foreground">Create a journal to start working with your coach.</p>
        <Button asChild><Link to="/dashboard">Go to journals</Link></Button>
      </div>
    ) : <CoachWorkspace key={`${user?.id}:${activeJournal.id}`} journal={activeJournal} accountTimezone={user?.timezone || getUserTimezone()} />}
  </AppShell>;
}

function CoachWorkspace({ journal, accountTimezone }) {
  const formatDate = (value, zone = accountTimezone) => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short", timeZone: zone }) : "No upcoming run";
  const [tab, setTab] = useState("chat");
  const [outputConfiguration, setConfiguration] = useState(() => defaultConfiguration(accountTimezone));
  const configuration = { ...outputConfiguration, timezone: accountTimezone };
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [taskDialog, setTaskDialog] = useState(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskBusy, setTaskBusy] = useState(null);
  const [history, setHistory] = useState(null);
  const [evidenceTrade, setEvidenceTrade] = useState(null);
  const bottom = useRef(null);
  const promptRef = useRef(null);
  const controller = useRef(null);
  const mounted = useRef(true);
  const requestBusy = useRef(false);
  const previousScope = useRef(null);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    coachStatus(journal.id).then(value => { if (!cancelled) setStatus(value); }).catch(err => { if (!cancelled) setStatusError(apiError(err)); }).finally(() => { if (!cancelled) setStatusLoading(false); });
    listCoachTasks(journal.id).then(value => { if (!cancelled) setTasks(value); }).catch(err => { if (!cancelled) setTaskError(apiError(err)); }).finally(() => { if (!cancelled) setTasksLoading(false); });
    return () => { mounted.current = false; cancelled = true; controller.current?.abort(); };
  }, [journal.id]);
  useEffect(() => {
    if (messages.length || busy) bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  async function retryConnection() {
    setStatusError(""); setStatusLoading(true);
    try { const value = await coachStatus(journal.id); if (mounted.current) setStatus(value); }
    catch (err) { if (mounted.current) setStatusError(apiError(err)); }
    finally { if (mounted.current) setStatusLoading(false); }
  }
  async function reloadTasks() {
    try { const value = await listCoachTasks(journal.id); if (mounted.current) { setTasks(value); setTaskError(""); } }
    catch (err) { if (mounted.current) setTaskError(apiError(err)); }
  }
  function clearTrade() {
    const restore = previousScope.current || {};
    previousScope.current = null;
    setSelectedTrade(null);
    setConfiguration(previous => { const next = { ...previous, ...restore }; delete next.trade_id; return next; });
  }
  function chooseStarter(starter) {
    clearTrade(); setConfiguration(previous => ({ ...previous, ...starter.configuration, trade_id: undefined }));
    setInput(starter.prompt); setError(""); setNotice("");
    promptRef.current?.focus();
  }
  function chooseTrade(trade) {
    if (!configuration.trade_id) previousScope.current = { ...configuration };
    const date = localDate(accountTimezone, new Date(trade.entry_datetime));
    setConfiguration(previous => ({ ...previous, period: "custom", start_date: date, end_date: date, trade_id: trade.id, trade_status: "all", instrument: "" }));
    setSelectedTrade(trade); setPickerOpen(false);
    setInput(`Help me understand this ${trade.asset?.symbol || trade.asset} ${trade.side} trade. Use my journal notes and distinguish my decision quality from the outcome. What did I do well and what is one thing to improve?`);
    setError(""); promptRef.current?.focus();
  }
  async function send(prompt = input) {
    if (!prompt.trim() || requestBusy.current || !status?.configured) return;
    const invalid = configurationError(configuration);
    if (invalid) { setError(invalid); setOptionsOpen(true); return; }
    requestBusy.current = true;
    const request = new AbortController(); controller.current = request;
    const instruction = prompt.trim();
    const sentConfiguration = structuredClone(configuration);
    setInput(instruction); setPendingPrompt(instruction); setError(""); setNotice(""); setBusy(true);
    try {
      const response = await askCoach(journal.id, { instructions: instruction, configuration: sentConfiguration, history: messages.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 8000) })) }, request.signal);
      if (!mounted.current || request.signal.aborted || controller.current !== request) return;
      setMessages(previous => [...previous, { role: "user", content: instruction, configuration: sentConfiguration }, { role: "assistant", content: response.output, evidence: response.evidence, screenshots: response.screenshots_analyzed }]);
      setInput("");
    } catch (err) { if (mounted.current && !request.signal.aborted) setError(apiError(err)); }
    finally {
      if (controller.current === request) {
        requestBusy.current = false;
        if (mounted.current) { setBusy(false); setPendingPrompt(""); }
      }
    }
  }
  function stopWaiting(event) {
    // This button becomes the submit button after the state update. Suppress
    // the click default so stopping never submits the question a second time.
    event.preventDefault();
    controller.current?.abort();
    controller.current = null;
    requestBusy.current = false;
    setBusy(false); setInput(pendingPrompt); setPendingPrompt("");
    setNotice("Stopped waiting. Your question is still here. The current request may still finish on the server.");
  }
  function downloadChat() {
    const text = [`Nexora Coach — ${journal.name}`, `Downloaded ${formatDate(new Date())} (${accountTimezone})`, "", ...messages.flatMap(message => [message.role === "user" ? "You" : "Nexora Coach", message.content, message.configuration ? scopeSummary(message.configuration) : "", ""])].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `coaching-conversation-${localDate(accountTimezone)}.txt`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Conversation downloaded. Keep the file somewhere private.");
  }
  async function taskAction(id, action) {
    setTaskBusy(id); setTaskError("");
    try { await action(); await reloadTasks(); }
    catch (err) { if (mounted.current) { await reloadTasks(); if (mounted.current) setTaskError(err.response ? apiError(err) : err.message || apiError(err)); } }
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
  const lastAssistantIndex = messages.findLastIndex(item => item.role === "assistant");
  const scheduleCurrent = () => setTaskDialog({ seed: { instructions: input || lastUser?.content || "", configuration } });

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="nx-eyebrow text-primary">YOUR TRADING COMPANION</p><h1 className="mt-2 text-3xl font-medium tracking-tight">AI Coach<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">Build better trading habits with evidence from your journal.</p></div>
      <Button variant="outline" onClick={() => setTaskDialog({})}><Plus />Create a task</Button>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="flex flex-wrap gap-2">{[["chat", "Conversation", MessageSquare], ["tasks", "Scheduled tasks", CalendarClock]].map(([key, label, Icon]) => <Button key={key} variant={tab === key ? "secondary" : "ghost"} onClick={() => setTab(key)} aria-pressed={tab === key}><Icon />{label}{key === "tasks" && tasks.length > 0 && <span className="rounded bg-primary/10 px-1.5 text-xs text-primary">{tasks.length}</span>}</Button>)}</div>
      <span className="max-w-full break-words text-xs text-muted-foreground">{journal.name} · {statusLoading ? "Connecting…" : statusError ? "Connection unavailable" : status?.configured ? "Coach ready" : "Setup in progress"}</span>
    </div>
    {statusError && <div role="alert" className="nx-surface p-4"><p className="text-sm">We couldn't connect to your coach.</p><p className="mt-1 text-xs text-muted-foreground">{statusError}</p><Button className="mt-3" variant="outline" disabled={statusLoading} onClick={retryConnection}>Try connection again</Button></div>}
    {status && !status.configured && <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-sm font-medium">Your coach is being set up</p><p className="mt-1 text-xs leading-5 text-muted-foreground">You can explore the tools and save coaching tasks now. Conversations and task runs will be available when setup is complete.</p></div>}

    {tab === "chat" ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
      <section className="nx-surface flex h-[560px] min-h-[500px] min-w-0 flex-col overflow-hidden lg:h-[calc(100dvh-280px)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"><span className="flex items-center gap-2 text-xs font-medium"><Sparkles className="size-4 text-primary" />Coach conversation</span><div className="flex gap-1"><Button variant="ghost" size="sm" disabled={!messages.length} onClick={downloadChat}><Download />Save chat</Button><Button variant="ghost" size="sm" disabled={busy || !messages.length} onClick={() => setNewChatOpen(true)}><RotateCcw />New chat</Button></div></div>
        <div className="space-y-3 border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Analysis period">{PERIODS.map(([key, label]) => <button key={key} type="button" disabled={busy || !!configuration.trade_id} aria-pressed={configuration.period === key} className={`rounded-lg px-3 py-2 text-xs transition-colors disabled:opacity-50 ${configuration.period === key ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-secondary"}`} onClick={() => { setConfiguration(previous => ({ ...previous, period: key })); if (key === "custom") setOptionsOpen(true); }}>{label}</button>)}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setPickerOpen(true)}><Search />{selectedTrade ? "Change trade" : "Choose a trade"}</Button>
            {selectedTrade ? <button type="button" disabled={busy} className="flex max-w-full items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-xs text-primary" onClick={clearTrade} aria-label="Clear selected trade"><span className="truncate">{selectedTrade.asset?.symbol || selectedTrade.asset} · Trade #{selectedTrade.id}</span><X className="size-3.5 shrink-0" /></button> : <select className="min-w-0 max-w-full rounded-lg border border-border bg-background px-2 py-2 text-xs" aria-label="Trades to include" disabled={busy} value={configuration.trade_status || "all"} onChange={event => setConfiguration(previous => ({ ...previous, trade_status: event.target.value }))}>{TRADE_SCOPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}
          </div>
          <p className="break-words text-[11px] leading-5 text-muted-foreground">Analyzing: {scopeSummary(configuration)}{configuration.screenshots ? " · screenshots allowed" : ""}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-7" aria-live="polite" aria-busy={busy}>
          {!messages.length && !busy && <div className="mx-auto max-w-xl py-2">
            <h2 className="text-2xl font-medium tracking-tight">What would you like to work on?</h2><p className="mb-5 mt-2 text-sm leading-6 text-muted-foreground">Choose a starting point, select a trade, or ask your own question.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">{COACH_STARTERS.map((starter, index) => { const Icon = STARTER_ICONS[index]; return <button key={starter.id} className="rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary" onClick={() => chooseStarter(starter)}><span className="flex items-start gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block text-sm font-medium">{starter.title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{starter.description}</span></span></span></button>; })}</div>
          </div>}
          {messages.map((message, index) => <CoachMessage key={index} message={message} onEvidence={openEvidence} disabled={busy || !status?.configured} onFollowUp={index === lastAssistantIndex ? prompt => { setInput(prompt); promptRef.current?.focus(); } : undefined} onSchedule={index === lastAssistantIndex ? () => setTaskDialog({ seed: { instructions: messages[index - 1]?.content || "", configuration: messages[index - 1]?.configuration || configuration } }) : undefined} />)}
          {busy && <><CoachMessage message={{ role: "user", content: pendingPrompt, configuration }} onEvidence={openEvidence} /><p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Your coach is working with your request…</p></>}
          <div ref={bottom} />
        </div>
        <div className="border-t border-border p-4">
          <form onSubmit={event => { event.preventDefault(); send(); }}>
            <label className="sr-only" htmlFor="coach-prompt">Ask your coach</label>
            <textarea ref={promptRef} id="coach-prompt" className="min-h-24 w-full resize-y rounded-lg bg-transparent p-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60" rows={3} maxLength={4000} disabled={busy} placeholder="For example: Am I taking more risk after a losing trade?" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />
            <div className="flex flex-wrap items-center justify-between gap-2"><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setOptionsOpen(true)}><Settings2 />Adjust output</Button><div className="flex items-center gap-2"><span className="text-[11px] text-muted-foreground">{configuration.detail === "brief" ? "Brief answer" : "Detailed answer"}</span>{busy ? <Button type="button" variant="outline" size="sm" onClick={stopWaiting}><Square />Stop waiting</Button> : <Button type="submit" aria-label="Send message" disabled={!input.trim() || !status?.configured}><ArrowUp /></Button>}</div></div>
          </form>
          {error && <div role="alert" className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"><p className="text-xs leading-5 text-destructive">{error}</p><Button className="mt-2" size="sm" variant="outline" disabled={busy || !status?.configured || !input.trim()} onClick={() => send()}>Try again</Button></div>}
          {notice && <p role="status" className="mt-3 text-xs leading-5 text-muted-foreground">{notice}</p>}
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">Chats aren't saved after you leave or refresh. Use Save chat to keep a copy.</p>
        </div>
      </section>
      <aside className="hidden space-y-4 lg:block">
        <div className="nx-surface p-5"><CalendarClock className="size-5 text-primary" /><h2 className="mt-4 text-sm font-medium">Build a coaching routine</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Prepare before your session, reflect afterwards, or check a goal each week.</p><Button variant="outline" className="mt-4 w-full" onClick={scheduleCurrent}>Schedule this<ChevronRight /></Button></div>
        <div className="nx-surface p-5"><Target className="size-5 text-primary" /><h2 className="mt-3 text-sm font-medium">One habit to work on</h2><p className="mt-2 break-words text-xs leading-6 text-muted-foreground">{configuration.goal || "Give your coach a goal, such as waiting for confirmation or following a risk limit."}</p><Button variant="ghost" size="sm" className="mt-2" disabled={busy} onClick={() => setOptionsOpen(true)}>{configuration.goal ? "Edit goal" : "Set a goal"}</Button></div>
        <div className="px-2 text-xs leading-6 text-muted-foreground"><p className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="size-4 text-primary" />Your journal is the evidence</p><p className="mt-2">Open supporting trades to check an observation. The coach can help with your process; it doesn't have live market data or place trades.</p></div>
      </aside>
    </div> : <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-medium">Your coaching tasks</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Prepare, reflect, or follow a goal. Completed results appear in each task's history.</p></div><Button variant="ghost" size="sm" disabled={taskBusy !== null} onClick={reloadTasks}><RotateCcw />Refresh</Button></div>
      {taskError && <p role="alert" className="text-sm text-destructive">{taskError}</p>}
      {tasksLoading ? <p role="status" className="text-sm text-muted-foreground">Loading tasks…</p> : !tasks.length ? <div className="nx-surface px-5 py-12 text-center"><CalendarClock className="mx-auto mb-4 size-8 text-primary" /><h3 className="text-lg font-medium">Make coaching a habit</h3><p className="mx-auto mb-5 mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start with session preparation, an end-of-day reflection, or a weekly discipline check. You can customize every instruction.</p><Button onClick={() => setTaskDialog({})}><Plus />Create your first task</Button></div> : tasks.map(task => {
        const completed = !task.enabled && task.frequency === "once" && task.latest_run?.status === "completed";
        return <article key={task.id} className="nx-surface p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-medium">{task.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] ${task.enabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{completed ? "Completed" : task.enabled ? "Scheduled" : "Paused"}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">{task.instructions}</p><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Clock3 className="mt-0.5 size-3.5 shrink-0" /><span className="break-words">{scheduleSummary(task)}</span></p><p className="mt-1 text-xs leading-5 text-muted-foreground">Next: {formatDate(task.next_run_at, task.timezone)}{task.next_run_at ? ` (${task.timezone})` : ""}</p></div>
          <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={taskBusy !== null || !status?.configured} onClick={() => taskAction(task.id, async () => { const run = await runCoachTask(journal.id, task.id); if (mounted.current) setHistory({ task, runs: [run] }); })}>{taskBusy === task.id ? <Loader2 className="animate-spin" /> : <Play />}Run now</Button>{!completed && <Button size="icon-sm" variant="ghost" aria-label={`${task.enabled ? "Pause" : "Resume"} ${task.title}`} disabled={taskBusy !== null} onClick={() => taskAction(task.id, () => saveCoachTask(journal.id, { enabled: !task.enabled }, task.id))}>{task.enabled ? <Pause /> : <Play />}</Button>}<Button size="icon-sm" variant="ghost" aria-label={`Edit ${task.title}`} disabled={taskBusy !== null} onClick={() => setTaskDialog({ task })}><Settings2 /></Button><Button size="icon-sm" variant="ghost" aria-label={`Delete ${task.title}`} disabled={taskBusy !== null} onClick={() => setTaskDialog({ deleting: task })}><Trash2 /></Button></div>
        </div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"><p className={`text-xs ${task.latest_run?.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{task.latest_run ? `Last run: ${task.latest_run.status} · ${formatDate(task.latest_run.created_at)}` : "No runs yet. Use Run now to try this task."}</p><Button variant="ghost" size="sm" disabled={taskBusy !== null} onClick={() => showHistory(task)}>View history<ChevronRight /></Button></div></article>;
      })}
    </section>}

    {pickerOpen && <CoachTradePicker journalId={journal.id} timezone={accountTimezone} onSelect={chooseTrade} onClose={() => setPickerOpen(false)} />}
    {evidenceTrade && (evidenceTrade.loading || evidenceTrade.error ? <Dialog open onOpenChange={() => setEvidenceTrade(null)}><DialogContent><DialogHeader><DialogTitle>Trade #{evidenceTrade.id}</DialogTitle><DialogDescription>Recorded evidence from {journal.name}</DialogDescription></DialogHeader>{evidenceTrade.loading ? <p role="status">Loading trade…</p> : <div><p role="alert" className="text-destructive">{evidenceTrade.error}</p><Button className="mt-3" variant="outline" onClick={() => openEvidence(evidenceTrade)}>Try again</Button></div>}</DialogContent></Dialog> : <TradeDetailPanel trade={evidenceTrade} open onClose={() => setEvidenceTrade(null)} />)}
    {optionsOpen && <Dialog open onOpenChange={setOptionsOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Make it useful to you</DialogTitle><DialogDescription>Choose what your coach looks at and how much it says.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={event => { event.preventDefault(); const invalid = configurationError(configuration); if (invalid) { setError(invalid); return; } setError(""); setOptionsOpen(false); }}><CoachConfiguration value={configuration} onChange={setConfiguration} />{configurationError(configuration) && <p role="alert" className="text-xs text-destructive">{configurationError(configuration)}</p>}<Button type="submit">Done</Button></form></DialogContent></Dialog>}
    {taskDialog && !taskDialog.deleting && <CoachTaskDialog journalId={journal.id} {...taskDialog} seed={taskDialog.seed || { configuration }} onClose={() => setTaskDialog(null)} onSaved={() => { reloadTasks(); setTab("tasks"); }} />}
    {taskDialog?.deleting && <Dialog open onOpenChange={() => setTaskDialog(null)}><DialogContent><DialogHeader><DialogTitle>Delete this task?</DialogTitle><DialogDescription>“{taskDialog.deleting.title}” and its results will be permanently removed.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" disabled={taskBusy !== null} onClick={() => setTaskDialog(null)}>Keep task</Button><Button variant="destructive" disabled={taskBusy !== null} onClick={() => taskAction(taskDialog.deleting.id, async () => { await deleteCoachTask(journal.id, taskDialog.deleting.id); setTaskDialog(null); })}>Delete task</Button></div>{taskError && <p role="alert" className="text-xs text-destructive">{taskError}</p>}</DialogContent></Dialog>}
    {newChatOpen && <Dialog open onOpenChange={setNewChatOpen}><DialogContent><DialogHeader><DialogTitle>Start a fresh conversation?</DialogTitle><DialogDescription>This will clear the current chat. Download a copy first if you want to keep it.</DialogDescription></DialogHeader><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={downloadChat}><Download />Save chat</Button><Button onClick={() => { setMessages([]); setInput(""); setError(""); setNotice(""); setNewChatOpen(false); }}>Start new chat</Button></div></DialogContent></Dialog>}
    {history && <Dialog open onOpenChange={() => setHistory(null)}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{history.task.title}</DialogTitle><DialogDescription>Recent task results · {accountTimezone}</DialogDescription></DialogHeader>{!history.runs.length ? <p className="text-sm text-muted-foreground">No results yet. Run this task now or wait for its scheduled time.</p> : history.runs.map(run => <article key={run.id} className="rounded-xl border border-border p-4"><p className="mb-3 text-xs text-muted-foreground">{formatDate(run.created_at)} · {run.status}</p>{run.output ? <CoachMessage message={{ role: "assistant", content: run.output, evidence: run.evidence }} onEvidence={openEvidence} /> : <p className={`text-sm leading-6 ${run.error ? "text-destructive" : "text-muted-foreground"}`}>{run.error ? "This run didn't finish. Your task is saved; close this window and use Run now to try again." : "Your coach is still working. Close and reopen history to check for a result."}</p>}</article>)}</DialogContent></Dialog>}
  </div>;
}
