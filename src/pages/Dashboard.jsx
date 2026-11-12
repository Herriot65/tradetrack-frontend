import { getLanguage, translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowUpRight, Plus, Trash2, Layers3, FlaskConical, Sparkles } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";
import { Button } from "@/components/ui/button";
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
import DepthScene from "@/components/motion/DepthScene";
import AppShell from "@/components/layout/AppShell";

const JOURNAL_TYPE_LABEL = {
  trading: "Trading Journal",
  backtest: "Backtest Journal",
};

function JournalCard({ journal, onDelete, onOpen }) {
  useLanguage();
  const typeLabel = JOURNAL_TYPE_LABEL[journal.journalType] ?? "Journal";
  return (
    <article className="nx-surface nx-account-card group relative overflow-hidden p-5">
      <div className="mb-6 flex items-center justify-between">
        <span className="nx-account-icon flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary">
          <BookOpen className="size-[18px]" />
        </span>
        <button
          type="button"
          onClick={() => onDelete(journal)}
          className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete ${journal.name}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <p className="nx-eyebrow !text-muted-foreground">{t(typeLabel)}</p>
      <h3 className="mt-2 truncate text-[22px] font-medium tracking-[-0.04em]">{journal.name}</h3>
      <dl className="mt-6 flex items-end justify-between border-t border-border/60 pt-4">
        <div>
          <dt className="text-[10px] text-muted-foreground">{t("Starting capital")}</dt>
          <dd className="mt-1 text-[15px] font-medium tabular-nums">
            {journal.startingCapital != null
              ? Number(journal.startingCapital).toLocaleString(getLanguage(), {
                  maximumFractionDigits: 2,
                })
              : "—"}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[10px] text-muted-foreground">{t("Currency")}</dt>
          <dd className="mt-1 text-[12px] text-zinc-300">{journal.currency || "—"}</dd>
        </div>
      </dl>
      <button type="button" onClick={onOpen} aria-label={journal.name} className="nx-open-account">
        <span>{t('Open journal')}</span><ArrowUpRight className="size-4" />
      </button>
    </article>
  );
}

function OnboardingHero({ userName, onCreateClick }) {
  useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
        <BookOpen className="size-7 text-emerald-400" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
        {userName ? t("Welcome, {name}!", { name: userName }) : t("Welcome to Nexora!")}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">{t("A journal is your personal trading environment — it holds your trades, analytics, and settings all in one place.")}</p>

      {/* Steps */}
      <div className="mt-8 grid w-full max-w-lg gap-3 text-left sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Create a journal",
            desc: "Set your starting capital, currency, and break-even method.",
          },
          {
            step: "2",
            title: "Log your trades",
            desc: "Record entries, exits, emotions, and setups as you trade.",
          },
          {
            step: "3",
            title: "Track your edge",
            desc: "See your equity curve, win rate, and performance heatmap.",
          },
        ].map(({ step, title, desc }) => (
          <div key={step} className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-4">
            <div className="mb-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
              {step}
            </div>
            <p className="text-xs font-semibold text-zinc-200">{t(title)}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{t(desc)}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button className="mt-8" onClick={onCreateClick}>
        <Plus className="size-4" />{t("Create your first journal")}</Button>
    </div>
  );
}

export default function Dashboard() {
  useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { journals, loading, createJournal, deleteJournal } = useJournal();
  const [createOpen, setCreateOpen] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleCreate = async (payload) => {
    const created = await createJournal(payload);
    navigate(`/journal/${created.id}?tab=overview`);
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
          <div className="nx-page-header nx-accounts-hero">

            <div>
              <p className="nx-hero-tag"><span />{t("Your trading workspace")}</p>
              <p className="nx-welcome">{user?.first_name ? t('Welcome back, {name}.', {name: user.first_name}) : t('Welcome back.')}</p>
              <h1 className="nx-page-title">
                {t("Trading accounts")}
              </h1>
              <p className="nx-subtitle">{t("Choose an account to review your performance or manage your trades.")}</p>
              <div className="nx-hero-actions">
                <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />{t('New Journal')}</Button>
                <Button variant="ghost" onClick={() => navigate('/coach')}><Sparkles className="size-4" />{t('AI Coach')}<ArrowUpRight className="size-3.5" /></Button>
              </div>
            </div>
            <DepthScene />

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
          <OnboardingHero userName={user?.first_name} onCreateClick={() => setCreateOpen(true)} />
        )}

        {/* Journal grid — shown only when journals exist */}
        {hasJournals && (
          <div>
            <div className="nx-workspace-stats">
              {[[Layers3, 'Total accounts', journals.length], [BookOpen, 'Trading accounts', journals.filter(j => j.journalType === 'trading').length], [FlaskConical, 'Backtest accounts', journals.filter(j => j.journalType === 'backtest').length]].map(([Icon, label, value]) => <div key={label}><span className="nx-stat-icon"><Icon className="size-4" /></span><div><p>{t(label)}</p><strong>{value}</strong></div></div>)}
            </div>
            <div className="nx-section-title"><div><h2>{t('Your Journals')}</h2><p>{t('A dedicated space for every strategy.')}</p></div><span>{t('{count} accounts', {count: journals.length})}</span></div>
            <div className="nx-account-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {journals.map((j) => (
                <div key={j.id}>
                  <JournalCard
                    journal={j}
                    onDelete={setJournalToDelete}
                    onOpen={() => navigate(`/journal/${j.id}?tab=overview`)}
                  />
                </div>
              ))}
              <button type="button" className="nx-new-account" onClick={() => setCreateOpen(true)}><span><Plus className="size-5" /></span><strong>{t('New Journal')}</strong><p>{t('Set your starting capital, currency, and break-even method.')}</p></button>
            </div>
          </div>
        )}
      </div>

      <JournalFormDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />

      <Dialog
        open={!!journalToDelete}
        onOpenChange={(v) => {
          if (!v) {
            setJournalToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete “")}{journalToDelete?.name}&rdquo;?</DialogTitle>
            <DialogDescription>{t("All trades, analytics, and catalog data in this journal will be permanently deleted. This action cannot be undone.")}</DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJournalToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleting}
            >{t("Cancel")}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
