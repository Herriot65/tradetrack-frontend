import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Plus } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { useJournal } from "@/journals/useJournal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import JournalFormDialog from "@/components/dashboard/JournalFormDialog";
import AppShell from "@/components/layout/AppShell";

const JOURNAL_TYPE_LABEL = {
  trading: "Trading Journal",
  backtest: "Backtest Journal",
};

function JournalCard({ journal }) {
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
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-950/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { journals, loading, createJournal } = useJournal();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (payload) => {
    const created = await createJournal(payload);
    navigate(`/journal/${created.id}`);
  };

  return (
    <AppShell>
      <div className="space-y-8">

        {/* Page header */}
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

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Journals" value={journals.length} loading={loading} />
        </div>

        {/* Journal grid */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Journals
          </h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-xl" />
              ))}
            </div>
          ) : journals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
                <BookOpen className="size-5 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No journals yet</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  A journal is a complete trading environment with its own trades,
                  analytics, and settings.
                </p>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create your first journal
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {journals.map((j) => (
                <div
                  key={j.id}
                  onClick={() => {
                    navigate(`/journal/${j.id}`);
                  }}
                >
                  <JournalCard journal={j} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <JournalFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />
    </AppShell>
  );
}
