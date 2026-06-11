import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EquityCurveChart from "@/components/dashboard/EquityCurveChart";
import KpiCards from "@/components/dashboard/KpiCards";
import PnlBySetupChart from "@/components/dashboard/PnlBySetupChart";
import RecentTradesTable from "@/components/dashboard/RecentTradesTable";
import WinLossChart from "@/components/dashboard/WinLossChart";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
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
