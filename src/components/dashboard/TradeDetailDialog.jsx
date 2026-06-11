import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  formatDateTime,
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

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{children}</span>
    </div>
  );
}

export default function TradeDetailDialog({ trade, open, onOpenChange }) {
  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {trade.asset}
            <Badge
              variant="outline"
              className={cn(getSideBadgeClass(trade.side))}
            >
              {SIDE_LABELS[trade.side] ?? trade.side}
            </Badge>
            <Badge
              variant="outline"
              className={cn(getStatusBadgeClass(trade.status))}
            >
              {STATUS_LABELS[trade.status] ?? trade.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatTradePeriod(trade.entry_datetime, trade.exit_datetime)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <DetailRow label="Setup">{trade.setup}</DetailRow>
          <DetailRow label="Trend">
            {TREND_LABELS[trade.trend_direction] ?? trade.trend_direction}
          </DetailRow>
          <DetailRow label="Opportunity TF">
            {TIMEFRAME_LABELS[trade.opportunity_timeframe] ??
              trade.opportunity_timeframe}
          </DetailRow>
          <DetailRow label="Entry TF">
            {TIMEFRAME_LABELS[trade.entry_timeframe] ?? trade.entry_timeframe}
          </DetailRow>
          <DetailRow label="Session">{trade.session}</DetailRow>
          <DetailRow label="Risk %">{formatNumber(trade.risk_percent)}%</DetailRow>
          <DetailRow label="PnL (R)">
            <span className={cn(getPnlClass(trade.pnl_r))}>
              {formatR(trade.pnl_r)}
            </span>
          </DetailRow>

          {(trade.emotion || trade.notes) && <Separator />}

          {trade.emotion && (
            <DetailRow label="Emotion">{trade.emotion}</DetailRow>
          )}
          {trade.notes && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Notes</span>
              <p className="text-sm leading-relaxed text-foreground/90">
                {trade.notes}
              </p>
            </div>
          )}

          <Separator />

          <DetailRow label="Created">
            {formatDateTime(trade.created_at)}
          </DetailRow>
          <DetailRow label="Updated">
            {formatDateTime(trade.updated_at)}
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}
