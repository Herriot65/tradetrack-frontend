import { useMemo } from 'react';
import OptionCombobox from './OptionCombobox';
import { useTimeframeFavorites } from '@/hooks/useTimeframeFavorites';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
import { useSetupOptions } from '@/hooks/useSetupOptions';
import { cn } from '@/lib/utils';

export default function TimeframeField({ id, label, value, onValueChange, onBlur, ref }) {
  useLanguage();
  const { options, add, update, remove } = useSetupOptions("timeframes");
  const timeframes = useMemo(() => options.map(option => option.value), [options]);
  const { favorites, toggleFavorite } = useTimeframeFavorites(id, timeframes);
  function select(next) {
    onValueChange(next);
    onBlur?.();
  }
  return <div className="min-w-0 space-y-2">
    {favorites.length > 0 && <div role="group" aria-label={t('{field} favorites', {field: label})} className="flex flex-wrap gap-1.5">
      {favorites.map(timeframe => <button key={timeframe} type="button" aria-pressed={value === timeframe}
        onClick={() => select(timeframe)} className={cn('min-h-11 rounded-md border px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40', value === timeframe ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
        {timeframe}
      </button>)}
    </div>}
    <OptionCombobox id={id} ref={ref} label={label} buttonRole="button" value={value} onChange={select} onBlur={onBlur}
      options={options} onCreate={next => add({value:next,label:next})} onUpdate={update} onDelete={remove}
      maxLength={10} uppercase placeholder="Select timeframe" favorites={favorites} onToggleFavorite={toggleFavorite}/>
  </div>;
}
