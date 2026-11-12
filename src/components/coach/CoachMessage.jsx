import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scopeSummary } from "./coachConfiguration";

export default function CoachMessage({ message, onEvidence, onFollowUp, onSchedule, disabled }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const isUser = message.role === "user";
  const evidence = message.evidence || [];
  const pieces = message.content.split(/(\[Trade #\d+\])/g);
  async function copy() {
    try { await navigator.clipboard.writeText(message.content); setCopied(true); setCopyError(""); }
    catch { setCopyError("Copy isn't available in this browser. You can select and copy the text instead."); }
  }
  return <article className={isUser ? "ml-auto max-w-[95%] rounded-2xl bg-secondary p-4 sm:max-w-[90%]" : "max-w-full"}>
    <div className="mb-2 flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{isUser ? "You" : <><Sparkles className="size-3.5 text-primary" />Nexora Coach</>}</p>{!isUser && <Button variant="ghost" size="sm" onClick={copy} aria-label={copied ? "Answer copied" : "Copy answer"}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button>}</div>
    <div className="whitespace-pre-wrap break-words text-sm leading-7">{pieces.map((part, index) => {
      const match = part.match(/^\[Trade #(\d+)\]$/);
      const trade = match && evidence.find(item => item.id === Number(match[1]));
      return trade ? <button type="button" key={index} className="rounded bg-primary/10 px-1.5 text-primary underline decoration-primary/30 underline-offset-4" onClick={() => onEvidence(trade)}>{part}</button> : part;
    })}</div>
    {isUser && message.configuration && <p className="mt-2 text-[11px] text-muted-foreground">{scopeSummary(message.configuration)}</p>}
    {evidence.length > 0 && <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Supporting trades ({evidence.length})</summary><div className="mt-2 flex flex-wrap gap-2">{evidence.map(trade => <button type="button" key={trade.id} className="rounded-md border border-border px-2.5 py-2 hover:text-primary" onClick={() => onEvidence(trade)}>#{trade.id} · {trade.symbol}</button>)}</div></details>}
    {message.screenshots > 0 && <p className="mt-2 text-xs text-muted-foreground">{message.screenshots} attached screenshot(s) analyzed</p>}
    {!isUser && onFollowUp && <div className="mt-4 flex flex-wrap gap-2" aria-label="Continue this conversation">
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => onFollowUp("Explain the last answer in simpler terms. Keep it brief and use the same evidence.")}>Explain simply</Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => onFollowUp("Turn the last answer into one realistic action I can take before my next session. Make it specific and within my control.")}>Give me one next step</Button>
      {onSchedule && <Button variant="ghost" size="sm" onClick={onSchedule}>Schedule this</Button>}
    </div>}
    {copyError && <p role="status" className="mt-2 text-xs text-muted-foreground">{copyError}</p>}
  </article>;
}
