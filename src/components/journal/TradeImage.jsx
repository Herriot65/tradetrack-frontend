import { useRef } from 'react';
import { imageWidth } from '@/lib/noteDocument';
import { Expand, Loader2, Trash2 } from 'lucide-react';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';

// A readable image document rather than a cropped thumbnail. Preserve the
// complete chart and its aspect ratio at every available panel width.
export default function TradeImage({src, label, onOpen, onRemove, busy = false, deleting = false, width = 100, onResize}) {
  useLanguage();
  const frame = useRef(null);
  const size = imageWidth(width);
  function resize(event) {
    const figure=frame.current;
    const parent=figure?.parentElement.getBoundingClientRect();
    if(parent&&onResize)onResize(imageWidth((event.clientX-figure.getBoundingClientRect().left)/parent.width*100));
  }
  return <figure className="relative min-w-0 overflow-hidden rounded-lg border border-border bg-card" data-trade-image>
    <div ref={frame} style={{width:`${size}%`}} className="relative">
    <button type="button" disabled={busy || deleting} onClick={onOpen}
      aria-label={t('View {image} full screen', {image: label})}
      className="relative block w-full cursor-zoom-in bg-background p-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
      <img src={src} alt={label} decoding="async" className="block h-auto w-full object-contain"/>
      {busy && <span className="absolute inset-0 flex items-center justify-center bg-background/60"><Loader2 aria-label={t('Uploading screenshot')} className="size-6 animate-spin"/></span>}
    </button>
    {onResize && <button type="button" aria-label={t('Drag to resize {image}',{image:label})}
      onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>event.currentTarget.hasPointerCapture(event.pointerId)&&resize(event)}
      onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
      onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();onResize(imageWidth(size+(event.key==='ArrowRight'?5:-5)));}}}
      className="absolute bottom-0 right-0 size-6 cursor-ew-resize rounded-tl border-l border-t border-border bg-secondary text-muted-foreground" style={{touchAction:'none'}}>↔</button>}
    </div>
    {onResize && <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
      <label className="text-xs text-muted-foreground">{t('Image width')} <input type="range" min="25" max="100" step="1" aria-label={t('Width of {image}',{image:label})} value={size} onChange={event=>onResize(imageWidth(event.target.value))} className="w-28 max-w-full align-middle"/></label>
      <output className="text-xs tabular-nums">{size}%</output>
      <button type="button" onClick={()=>onResize(100)} className="min-h-9 rounded px-2 text-xs text-muted-foreground hover:bg-secondary">{t('Reset size')}</button>
    </div>}
    <figcaption className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{label}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" disabled={busy || deleting} onClick={onOpen} className="flex min-h-10 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Expand aria-hidden="true" className="size-3.5"/>{t('Full screen')}</button>
        {onRemove && <button type="button" disabled={busy || deleting} onClick={onRemove} aria-label={t('Remove {image}', {image:label})} className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">{deleting ? <Loader2 className="size-4 animate-spin"/> : <Trash2 aria-hidden="true" className="size-4"/>}</button>}
      </div>
    </figcaption>

  </figure>;
}
