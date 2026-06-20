import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import JournalFormDialog from "@/components/dashboard/JournalFormDialog";
import AppShell from "@/components/layout/AppShell";

const JOURNAL_TYPE_LABEL = {
  trading: "Trading Journal",
  backtest: "Backtest Journal",
};

function JournalCard({ journal, onDelete }) {
  const typeLabel = JOURNAL_TYPE_LABEL[journal.journalType] ?? "Journal";
  const meta = [
    typeLabel,
    journal.currency,
    journal.startingCapital
      ? `$${Number(journal.startingCapital).toLocaleString()}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="group cursor-pointer border-zinc-800/60 bg-zinc-950/50 ring-zinc-800/40 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <BookOpen className="size-3.5" />
          </div>
          <CardTitle className="text-sm font-medium">{journal.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(journal); }}
            className="invisible group-hover:visible rounded p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label={`Delete ${journal.name}`}
          >
            <Trash2 className="size-3.5" />
          </button>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}


function OnboardingHero({ userName, onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <BookOpen className="size-7 text-emerald-400" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
        {userName ? `Welcome, ${userName}!` : "Welcome to TradeTrack!"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        A journal is your personal trading environment — it holds your trades,
        analytics, and settings all in one place.
      </p>

      {/* Steps */}
      <div className="mt-8 grid w-full max-w-lg gap-3 text-left sm:grid-cols-3">
        {[
          { step: "1", title: "Create a journal", desc: "Set your starting capital, currency, and break-even method." },
          { step: "2", title: "Log your trades",  desc: "Record entries, exits, emotions, and setups as you trade." },
          { step: "3", title: "Track your edge",  desc: "See your equity curve, win rate, and performance heatmap." },
        ].map(({ step, title, desc }) => (
          <div key={step} className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4">
            <div className="mb-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
              {step}
            </div>
            <p className="text-xs font-semibold text-zinc-200">{title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button className="mt-8" onClick={onCreateClick}>
        <Plus className="size-4" />
        Create your first journal
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { journals, loading, createJournal, deleteJournal } = useJournal();
  const [createOpen,      setCreateOpen]      = useState(false);
  const [journalToDelete, setJournalToDelete] = useState(null);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState(null);

  const handleCreate = async (payload) => {
    const created = await createJournal(payload);
    navigate(`/journal/${created.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!journalToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteJournal(journalToDelete.id);
      setJournalToDelete(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.detail ?? err.message ?? "Failed to delete journal");
    } finally {
      setDeleting(false);
    }
  };

  const hasJournals = !loading && journals.length > 0;

  return (
    <AppShell>
      <div className="space-y-8">

        {/* Page header — only shown when journals exist */}
        {(loading || hasJournals) && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {user?.first_name ? `Welcome back, ${user.first_name}` : "Your Journals"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Select a journal to view your trades and analytics.
              </p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New Journal
            </Button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Onboarding — shown only on first visit with no journals */}
        {!loading && journals.length === 0 && (
          <OnboardingHero
            userName={user?.first_name}
            onCreateClick={() => setCreateOpen(true)}
          />
        )}

        {/* Journal grid — shown only when journals exist */}
        {hasJournals && (
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Journals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {journals.map((j) => (
                <div key={j.id} onClick={() => navigate(`/journal/${j.id}`)}>
                  <JournalCard journal={j} onDelete={setJournalToDelete} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <JournalFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <Dialog
        open={!!journalToDelete}
        onOpenChange={(v) => { if (!v) { setJournalToDelete(null); setDeleteError(null); } }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{journalToDelete?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              All trades, analytics, and catalog data in this journal will be permanently deleted.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setJournalToDelete(null); setDeleteError(null); }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
