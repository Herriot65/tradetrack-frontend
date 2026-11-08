import { useState } from 'react';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
import { useJournalAnalytics } from '@/hooks/useJournalAnalytics';
import { formatDateLabel, formatRatio, formatValue } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SelectField from '@/components/ui/select-field';
import KpiRow from '@/components/analytics/KpiRow';
import EquitySection from '@/components/analytics/EquitySection';
import AnalyticsCard, { CardHeading, SegmentedControl } from '@/components/analytics/AnalyticsCard';
import TradeDetailPanel from './TradeDetailPanel';
import '@/components/analytics/analytics.css';
export default function OverviewTab({
  journal,
  jLoading,
  onNavigate,
  syntheticEnabled
}) {
  useLanguage();
  const [range, setRange] = useState('ALL');
  const [unit, setUnit] = useState('R');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const {
    analytics,
    unitOptions,
    loading,
    error,
    refetch,
    hasData,
    hasRangeData
  } = useJournalAnalytics({
    journal,
    range,
    unit
  });
  const summary = analytics.summary;
  if (jLoading || loading) return <div aria-busy="true" aria-label={t('Loading overview')} className="space-y-6"><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map(key => <Skeleton key={key} className="h-36 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /></div>;
  if (error) return <div role="alert" className="nx-surface p-8"><p className="text-sm">{t('Failed to load analytics')}</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={refetch}>{t('Retry')}</Button></div>;
  return <div className="analytics-page space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{t('Your account at a glance.')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40"><SelectField label={t('Overview date range')} allowClear={false} value={range} onValueChange={setRange} options={[{
            value: 'ALL',
            label: t('All time')
          }, {
            value: 'YTD',
            label: t('Year to date')
          }, {
            value: '3M',
            label: t('Last 3 months')
          }, {
            value: '12M',
            label: t('Last 12 months')
          }]} /></div>
        <SegmentedControl label={t('Overview display unit')} value={analytics.unit} options={unitOptions} onChange={setUnit} />
      </div>
    </div>
    {syntheticEnabled && <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t('Sample data is enabled')}</p>}
    {!hasData || !hasRangeData ? <div className="nx-surface px-6 py-16 text-center"><BarChart3 aria-hidden="true" className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-4 text-lg font-medium">{t(hasData ? 'No trades in this range' : 'No data yet')}</h2><p className="mt-2 text-sm text-muted-foreground">{t(hasData ? 'Try a longer date range or clear the active filters.' : 'Log your trades to start reviewing your performance.')}</p><Button className="mt-5" variant="outline" onClick={() => hasData ? setRange('ALL') : onNavigate('trades')}>{t(hasData ? 'All time' : 'Open journal')}<ArrowRight className="size-4" /></Button></div> : <>
      <KpiRow summary={summary} unit={analytics.unit} summaryOnly />
      <div className="nx-overview-grid grid items-start gap-6">
        <EquitySection analytics={analytics} compact />
        <AnalyticsCard>
          <CardHeading title={t('Performance summary')} />
          <dl className="divide-y divide-border px-5 pb-3 pt-3">
            {[[t('Total trades'), summary.totalTrades], [t('Winning trades'), summary.wins], [t('Losing trades'), summary.losses], [t('Break-even trades'), summary.breakEven], [t('Average R'), formatValue(summary.avgR, 'R')], [t('Payoff ratio'), formatRatio(summary.payoff)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-4 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>)}
          </dl>
          <div className="border-t border-border p-4"><Button className="w-full" variant="ghost" onClick={() => onNavigate('analytics')}>{t('Explore analytics')}<ArrowRight className="size-4" /></Button></div>
        </AnalyticsCard>
      </div>
      <AnalyticsCard>
        <CardHeading title={t('Recent trades')} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('trades')}>{t('View journal')}<ArrowRight className="size-4" /></Button>} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">{t('Recent closed trades')}</caption>
            <thead className="border-y border-border text-xs text-muted-foreground"><tr>{['Date', 'Symbol', 'Direction', 'Result', 'Net result'].map(label => <th scope="col" key={label} className="whitespace-nowrap px-5 py-3 font-medium">{t(label)}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">{analytics.recentTrades.slice(0, 5).map(trade => <tr key={trade.id} className="hover:bg-secondary/40"><td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatDateLabel(trade.date)}</td><td className="px-5 py-4"><button type="button" className="rounded font-medium hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label={t('Review trade {id}', {
                    id: trade.id
                  })} onClick={() => setSelectedTrade(trade)}>{trade.assetLabel}</button></td><td className="px-5 py-4 text-muted-foreground">{t(trade.sideLabel === 'BUY' ? 'Long' : 'Short')}</td><td className="px-5 py-4">{t(trade.status === 'WIN' ? 'Win' : trade.status === 'LOSS' ? 'Loss' : 'Break even')}</td><td className={`whitespace-nowrap px-5 py-4 font-medium tabular-nums ${trade.value > 0 ? 'text-profit' : trade.value < 0 ? 'text-loss' : 'text-muted-foreground'}`}>{formatValue(trade.value, analytics.unit)}</td></tr>)}</tbody>
          </table>
        </div>
      </AnalyticsCard>
    </>}
    <TradeDetailPanel trade={selectedTrade ? {
      ...selectedTrade,
      _derivedStatus: selectedTrade.status
    } : null} open={!!selectedTrade} onClose={() => setSelectedTrade(null)} />
  </div>;
}
