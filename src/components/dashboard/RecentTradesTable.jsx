import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTrades } from "@/hooks/useTrades";
import {
  formatNumber,
  formatR,
  formatTradePeriod,
} from "@/lib/formatters";
import {
  getPnlClass,
  getSideBadgeClass,
  getStatusBadgeClass,
  SIDE_LABELS,
  STATUS_LABELS,
  TIMEFRAME_LABELS,
  TREND_LABELS,
} from "@/lib/tradeLabels";
import { cn } from "@/lib/utils";

import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";
import TradeDetailDialog from "./TradeDetailDialog";

const PAGE_SIZE = 20;

function TableSkeleton() {
  useLanguage();
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default function RecentTradesTable() {
  useLanguage();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, loading, error, refetch } = useTrades({ page, search });

  const trades = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleRowClick = (trade) => {
    setSelectedTrade(trade);
    setDialogOpen(true);
  };

  let tableContent;

  if (loading) {
    tableContent = <TableSkeleton />;
  } else if (error) {
    tableContent = <ErrorMessage message={error} onRetry={refetch} />;
  } else if (trades.length === 0) {
    tableContent = (
      <EmptyState
        title={search ? t("No matching trades") : t("No trades yet")}
        description={
          search
            ? t("Try a different asset or setup name.")
            : t("Log your first trade to see it here.")
        }
      />
    );
  } else {
    tableContent = (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("Trade Period")}</TableHead>
            <TableHead>{t("Asset")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("Trend")}</TableHead>
            <TableHead className="hidden xl:table-cell">{t("Opp. TF")}</TableHead>
            <TableHead className="hidden xl:table-cell">{t("Entry TF")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("Setup")}</TableHead>
            <TableHead>{t("Side")}</TableHead>
            <TableHead>{t("Status")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("Risk %")}</TableHead>
            <TableHead className="text-right">PnL (R)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow
              key={trade.id}
              className="cursor-pointer"
              onClick={() => handleRowClick(trade)}
            >
              <TableCell className="max-w-[200px] truncate text-xs">
                {formatTradePeriod(
                  trade.entry_datetime,
                  trade.exit_datetime
                )}
              </TableCell>
              <TableCell className="font-medium">{typeof trade.asset === "object" ? trade.asset?.symbol : trade.asset}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {TREND_LABELS[trade.trend_direction] ?? trade.trend_direction}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {TIMEFRAME_LABELS[trade.opportunity_timeframe] ??
                  trade.opportunity_timeframe}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {TIMEFRAME_LABELS[trade.entry_timeframe] ??
                  trade.entry_timeframe}
              </TableCell>
              <TableCell className="hidden max-w-[120px] truncate md:table-cell">
                {trade.setup}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(getSideBadgeClass(trade.side))}
                >
                  {SIDE_LABELS[trade.side] ?? trade.side}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(getStatusBadgeClass(trade.status))}
                >
                  {STATUS_LABELS[trade.status] ?? trade.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatNumber(trade.risk_percent)}%
              </TableCell>
              <TableCell
                className={cn("text-right font-medium", getPnlClass(trade.pnl_r))}
              >
                {formatR(trade.pnl_r)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <Card className="border-zinc-800/60 bg-zinc-950/50 ring-zinc-800/40">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{t("Recent Trades")}</CardTitle>
            <CardDescription>
              {totalCount > 0
                ? `${totalCount} trade${totalCount === 1 ? "" : "s"} total`
                : t("Your trade journal")}
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Search asset or setup...")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tableContent}

          {!loading && !error && totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <p className="text-xs text-muted-foreground">{t("Page") + " "}{page}{" " + t("of") + " "}{totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />{t("Previous")}</Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >{t("Next")}<ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TradeDetailDialog
        trade={selectedTrade}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
