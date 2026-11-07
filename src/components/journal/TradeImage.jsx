import { Expand, Loader2, Trash2 } from 'lucide-react';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';

// A readable image document rather than a cropped thumbnail. Preserve the
// complete chart and its aspect ratio at every available panel width.
export default function TradeImage({src, label, onOpen, onRemove, busy = false, deleting = false}) {
  useLanguage();
  return <figure className="min-w-0 overflow-hidden rounded-lg border border-border bg-card" data-trade-image>
    <button type="button" disabled={busy || deleting} onClick={onOpen}
      aria-label={t('View {image} full screen', {image: label})}
      className="relative block w-full cursor-zoom-in bg-background p-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
      <img src={src} alt={label} decoding="async" className="block h-auto w-full object-contain"/>
      {busy && <span className="absolute inset-0 flex items-center justify-center bg-background/60"><Loader2 aria-label={t('Uploading screenshot')} className="size-6 animate-spin"/></span>}
    </button>
    <figcaption className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{label}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" disabled={busy || deleting} onClick={onOpen} className="flex min-h-10 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Expand aria-hidden="true" className="size-3.5"/>{t('Full screen')}</button>
        {onRemove && <button type="button" disabled={busy || deleting} onClick={onRemove} aria-label={t('Remove {image}', {image:label})} className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">{deleting ? <Loader2 className="size-4 animate-spin"/> : <Trash2 aria-hidden="true" className="size-4"/>}</button>}
      </div>
    </figcaption>
  </figure>;
}
