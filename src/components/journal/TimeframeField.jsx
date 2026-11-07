import { useState } from 'react';
import { Check, ChevronDown, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTimeframeFavorites, TIMEFRAME_OPTIONS } from '@/hooks/useTimeframeFavorites';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/utils';

export default function TimeframeField({ id, label, value, onValueChange, onBlur, ref }) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const { favorites, toggleFavorite } = useTimeframeFavorites();
  function select(next) {
    onValueChange(next);
    onBlur?.();
    setOpen(false);
  }
  return <div className="min-w-0 space-y-2">
    {favorites.length > 0 && <div role="group" aria-label={t('{field} favorites', {field: label})} className="flex flex-wrap gap-1.5">
      {favorites.map(timeframe => <button key={timeframe} type="button" aria-pressed={value === timeframe}
        onClick={() => select(timeframe)} className={cn('min-h-11 rounded-md border px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40', value === timeframe ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
        {timeframe}
      </button>)}
    </div>}
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button ref={ref} id={id} type="button" aria-label={label} onBlur={onBlur}
          className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-background/50 px-3 text-left text-[13px] text-zinc-100 outline-none transition-colors hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-primary/15">
          <span className={value ? '' : 'text-zinc-500'}>{value || t('Select timeframe')}</span><ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-zinc-500"/>
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label={t('{field} options', {field: label})} align="start" sideOffset={6}
        className="z-50 w-[260px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none"
        style={{maxHeight:'min(380px, var(--radix-popover-content-available-height))'}}>
        <p className="px-2 pb-2 text-xs leading-5 text-muted-foreground">{t('Star timeframes to show quick choices above the field.')}</p>
        <button type="button" aria-pressed={!value} onClick={() => select('')} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-secondary"><Check aria-hidden="true" className={cn('size-3.5', value && 'invisible')}/>{t('Not set')}</button>
        <div className="mt-1 border-t border-border pt-1">{TIMEFRAME_OPTIONS.map(timeframe => <div key={timeframe} className="flex items-center gap-1">
          <button type="button" aria-label={t('Select {timeframe}', {timeframe})} aria-pressed={value === timeframe} onClick={() => select(timeframe)}
            className={cn('flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-secondary', value === timeframe && 'bg-primary/10 text-primary')}>
            <Check aria-hidden="true" className={cn('size-3.5', value !== timeframe && 'invisible')}/>{timeframe}
          </button>
          <button type="button" aria-label={t('Favorite {timeframe}', {timeframe})} aria-pressed={favorites.includes(timeframe)} onClick={() => toggleFavorite(timeframe)}
            className={cn('flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-secondary', favorites.includes(timeframe) ? 'text-primary' : 'text-muted-foreground')}>
            <Star aria-hidden="true" className="size-4" fill={favorites.includes(timeframe) ? 'currentColor' : 'none'}/>
          </button>
        </div>)}</div>
        <p className="px-2 pt-2 text-[11px] leading-5 text-muted-foreground">{t('Favorites are saved in this browser.')}</p>
      </PopoverContent>
    </Popover>
  </div>;
}
