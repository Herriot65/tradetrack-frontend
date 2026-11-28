import { useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoachMessage({ message, onEvidence, onEdit, disabled }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [actionsVisible, setActionsVisible] = useState(false);
  const pressTimer = useRef(null);
  const isUser = message.role === "user";
  const evidence = message.evidence || [];
  const pieces = message.content.split(/(\[Trade #\d+\])/g);
  useEffect(() => () => clearTimeout(pressTimer.current), []);
  function startLongPress(event) {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    if (event.target.closest("button, a, [role=menuitem]")) return;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setActionsVisible(true), 480);
  }
  function cancelLongPress() { clearTimeout(pressTimer.current); }
  async function copy() {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setCopyError(""); }
    catch { setCopyError("Copy isn't available in this browser. You can select and copy the text instead."); }
  }
  return <article className={`coach-message relative ${isUser ? "coach-message-user" : ""}`} data-actions-visible={actionsVisible} onPointerDown={startLongPress} onPointerUp={cancelLongPress} onPointerCancel={cancelLongPress} onPointerLeave={cancelLongPress} onContextMenu={event => { event.preventDefault(); setActionsVisible(true); }}>
    {!isUser && <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5 text-primary" />Nexora Coach</div>}
    <div className={isUser ? "coach-user-bubble" : ""}>
      {!isUser && message.scope?.label && <p className="mb-2 text-xs text-muted-foreground" aria-label="Analysis scope">{message.scope.label}</p>}
      <div className="coach-message-content whitespace-pre-wrap break-words text-sm leading-7">{pieces.map((part, index) => {
      const match = part.match(/^\[Trade #(\d+)\]$/);
      const trade = match && evidence.find(item => item.id === Number(match[1]));
      return trade ? <button type="button" key={index} className="rounded bg-primary/10 px-1.5 text-primary underline decoration-primary/30 underline-offset-4" onClick={() => onEvidence(trade)}>{part}</button> : part;
      })}</div>
      {isUser && message.configuration?.trade_id && <p className="coach-user-context mt-2 text-[11px]">Trade #{message.configuration.trade_id}</p>}
      {evidence.length > 0 && <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Supporting trades ({evidence.length})</summary><div className="mt-2 flex flex-wrap gap-2">{evidence.map(trade => <button type="button" key={trade.id} className="rounded-md border border-border px-2.5 py-2 hover:text-primary" onClick={() => onEvidence(trade)}>#{trade.id} · {trade.symbol}</button>)}</div></details>}
      {message.screenshots > 0 && <p className="mt-2 text-xs text-muted-foreground">{message.screenshots} attached screenshot(s) analyzed</p>}
    </div>
    <div className="coach-message-actions" role="group" aria-label={isUser ? "Message actions" : "Answer actions"}>
      {isUser && onEdit && <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} disabled={disabled} aria-label="Edit message" title="Edit message"><Pencil /></Button>}
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={copied ? (isUser ? "Message copied" : "Answer copied") : (isUser ? "Copy message" : "Copy answer")} title={copied ? "Copied" : "Copy"}>{copied ? <Check /> : <Copy />}</Button>
      <span role="status" className="sr-only">{copied ? (isUser ? "Message copied" : "Answer copied") : ""}</span>
    </div>
    {copyError && <p role="status" className="mt-2 text-xs text-muted-foreground">{copyError}</p>}
  </article>;
}
