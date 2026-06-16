import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EquityCurveChart from "@/components/dashboard/EquityCurveChart";
import KpiCards from "@/components/dashboard/KpiCards";
import PnlBySetupChart from "@/components/dashboard/PnlBySetupChart";
import RecentTradesTable from "@/components/dashboard/RecentTradesTable";
import WinLossChart from "@/components/dashboard/WinLossChart";
import { useWorkspace } from "@/workspaces/useWorkspace";

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspaces, activeWorkspace, selectWorkspace, loading } = useWorkspace();

  useEffect(() => {
    if (loading) return;

    const ws = workspaces.find((w) => String(w.id) === workspaceId);
    if (ws) {
      selectWorkspace(ws);
    } else if (workspaces.length > 0) {
      navigate(`/workspace/${workspaces[0].id}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [workspaceId, workspaces, loading, navigate, selectWorkspace]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {activeWorkspace?.name ?? "Workspace"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Performance overview and recent activity
          </p>
        </div>

        <KpiCards />

        <div className="grid gap-6 lg:grid-cols-2">
          <EquityCurveChart />
          <WinLossChart />
        </div>

        <PnlBySetupChart />

        <RecentTradesTable />
      </div>
    </DashboardLayout>
  );
}
