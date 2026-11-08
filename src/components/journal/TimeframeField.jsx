import { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Star, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTimeframeFavorites } from '@/hooks/useTimeframeFavorites';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
import { useSetupOptions } from '@/hooks/useSetupOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function TimeframeField({ id, label, value, onValueChange, onBlur, ref }) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const { options, add, remove } = useSetupOptions("timeframes");
  const [adding, setAdding] = useState(false), [name, setName] = useState(''), [error, setError] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const cancelRef = useRef(null), removeTriggerRef = useRef(null), addRef = useRef(null);
  function addTimeframe() {
    const next = name.trim().toUpperCase();
    if (!next || next.length > 10 || next === '__NOT_SET__') return setError(t('Enter a name of 1–{max} characters.', {max:10}));
    if (options.some(option => option.value.toUpperCase() === next)) return setError(t('This option already exists.'));
    if (options.length >= 100) return setError(t('You can have up to 100 options.'));
    add({value:next, label:next});setName('');setError('');setAdding(false);
    requestAnimationFrame(() => addRef.current?.focus());
  }
  const timeframes = useMemo(() => options.map(option => option.value), [options]);
  const { favorites, toggleFavorite } = useTimeframeFavorites(id, timeframes);
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
    {/* The portaled list needs its own modal scroll boundary inside the trade sheet. */}
    <Popover modal open={open} onOpenChange={next=>{setOpen(next);if(!next){setAdding(false);setName('');setError('');}}}>
      <PopoverTrigger asChild>
        <button ref={ref} id={id} type="button" aria-label={label} onBlur={onBlur}
          className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-background/50 px-3 text-left text-[13px] text-zinc-100 outline-none transition-colors hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-primary/15">
          <span className={value ? '' : 'text-zinc-500'}>{value || t('Select timeframe')}</span><ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-zinc-500"/>
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label={t('{field} options', {field: label})} align="start" sideOffset={6}
        className="z-50 w-[260px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain touch-pan-y rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none"
        style={{maxHeight:'min(380px, var(--radix-popover-content-available-height))'}}>
        <p className="px-2 pb-2 text-xs leading-5 text-muted-foreground">{t('Star timeframes to show quick choices above the field.')}</p>
        <button type="button" aria-pressed={!value} onClick={() => select('')} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-secondary"><Check aria-hidden="true" className={cn('size-3.5', value && 'invisible')}/>{t('Not set')}</button>
        <div className="mt-1 border-t border-border pt-1">{timeframes.map(timeframe => <div key={timeframe} className="flex items-center gap-1">
          <button type="button" aria-label={t('Select {timeframe}', {timeframe})} aria-pressed={value === timeframe} onClick={() => select(timeframe)}
            className={cn('flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-secondary', value === timeframe && 'bg-primary/10 text-primary')}>
            <Check aria-hidden="true" className={cn('size-3.5', value !== timeframe && 'invisible')}/>{timeframe}
          </button>
          <button type="button" aria-label={t('Favorite {timeframe}', {timeframe})} aria-pressed={favorites.includes(timeframe)} onClick={() => toggleFavorite(timeframe)}
            className={cn('flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-secondary', favorites.includes(timeframe) ? 'text-[#facc15]' : 'text-muted-foreground')}>
            <Star aria-hidden="true" className="size-4" fill={favorites.includes(timeframe) ? 'currentColor' : 'none'}/>
          </button>
          <button type="button" aria-label={t('Remove {option}', {option:timeframe})}
            onClick={event=>{removeTriggerRef.current=event.currentTarget;setPendingRemoval(timeframe);}}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 aria-hidden="true" className="size-4"/>
          </button>
        </div>)}</div>
        <p className="px-2 pt-2 text-[11px] leading-5 text-muted-foreground">{t('Favorites are saved in this browser.')}</p>
        <div className="sticky -bottom-2 -mx-2 mt-2 border-t border-border bg-popover p-2">
          {adding ? <div className="space-y-2">
            <label htmlFor={`${id}-new`} className="sr-only">{t('New option')}</label>
            <Input autoFocus id={`${id}-new`} value={name} maxLength={10} onChange={event=>{setName(event.target.value);setError('');}}
              onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addTimeframe();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setAdding(false);addRef.current?.focus();}}}/>
            {error&&<p role="alert" className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={()=>{setAdding(false);setName('');setError('');requestAnimationFrame(()=>addRef.current?.focus());}}>{t('Cancel')}</Button><Button type="button" disabled={!name.trim()} onClick={addTimeframe}>{t('Add')}</Button></div>
          </div> : <button ref={addRef} type="button" onClick={()=>setAdding(true)} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-secondary"><Plus aria-hidden="true" className="size-4"/>{t('Add')}</button>}
        </div>
        <Dialog open={!!pendingRemoval} onOpenChange={next=>!next&&setPendingRemoval(null)}>
          <DialogContent role="alertdialog" showCloseButton={false}
            onOpenAutoFocus={event=>{event.preventDefault();cancelRef.current?.focus();}}
            onCloseAutoFocus={event=>{event.preventDefault();(removeTriggerRef.current?.isConnected?removeTriggerRef.current:addRef.current)?.focus();}}>
            <DialogHeader><DialogTitle>{t('Remove “{option}”?',{option:pendingRemoval??''})}</DialogTitle>
              <DialogDescription>{t('This removes the option from your choices in this browser. Saved trades will keep their existing values.')}</DialogDescription></DialogHeader>
            <div className="flex justify-end gap-2"><Button ref={cancelRef} type="button" variant="outline" onClick={()=>setPendingRemoval(null)}>{t('Cancel')}</Button>
              <Button type="button" variant="destructive" onClick={()=>{remove(pendingRemoval);setPendingRemoval(null);}}>{t('Remove option')}</Button></div>
          </DialogContent>
        </Dialog>
      </PopoverContent>
    </Popover>
  </div>;
}
