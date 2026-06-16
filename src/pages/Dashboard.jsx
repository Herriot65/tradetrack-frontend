import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Layers, Plus } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WorkspaceFormDialog from "@/components/dashboard/WorkspaceFormDialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useWorkspace } from "@/workspaces/useWorkspace";

function WorkspaceCard({ workspace }) {
  return (
    <Link to={`/workspace/${workspace.id}`}>
      <Card className="group border-zinc-800/60 bg-zinc-950/50 ring-zinc-800/40 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Layers className="size-3.5" />
            </div>
            <CardTitle className="text-sm font-medium">{workspace.name}</CardTitle>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Open workspace analytics</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-950/50 ring-zinc-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
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
  const { workspaces, loading, createWorkspace } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (name) => {
    const created = await createWorkspace({ name });
    navigate(`/workspace/${created.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user?.first_name ? `Welcome back, ${user.first_name}` : "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Select a workspace to view analytics, or create a new one.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Workspace
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Workspaces"
            value={workspaces.length}
            loading={loading}
          />
        </div>

        {/* Workspace grid */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Workspaces
          </h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-xl" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
                <Layers className="size-5 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No workspaces yet</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  A workspace is an isolated trading environment with its own trades
                  and analytics.
                </p>
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create your first workspace
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} />
              ))}
            </div>
          )}
        </div>
      </div>

      <WorkspaceFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Workspace"
        onSubmit={handleCreate}
      />
    </DashboardLayout>
  );
}
