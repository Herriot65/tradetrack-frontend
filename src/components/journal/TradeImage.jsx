import { useRef, useState } from 'react';
import { imageWidth } from '@/lib/noteDocument';
import { GripVertical, Loader2, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
import './trade-image.css';
import ImagePlacementControls from './ImagePlacementControls';

// Images share the section canvas. A saved width belongs to the whole image
// block, so smaller screenshots can sit beside one another without empty cards.
export default function TradeImage({src, label, onOpen, onRemove, busy = false, deleting = false, width = 100, onResize, arrangement, caption, uploadState, onRetry, children}) {
  useLanguage();
  const frame = useRef(null);
  const drag = useRef(null);
  const size = imageWidth(width);
  const [optionsOpen,setOptionsOpen] = useState(false);
  function resize(event) {
    const figure = frame.current;
    const container = figure?.parentElement;
    if (!container || !onResize || !drag.current) return;
    const styles = getComputedStyle(container);
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const available = container.clientWidth - (Number.parseFloat(styles.paddingLeft) || 0) - (Number.parseFloat(styles.paddingRight) || 0);
    // Keep the drag stable even when this image wraps onto a different row.
    onResize(imageWidth(drag.current.size + (event.clientX - drag.current.x) / (available + gap) * 100));
  }
  return <figure ref={frame} className="relative min-w-0 max-w-full shrink-0" data-trade-image data-note-image-id={arrangement?.imageId} data-dragging={arrangement?.dragging || undefined}
    style={{width: `calc(${size}% - ${1 - size / 100} * var(--trade-image-gap, 0px))`}}>
    <div className="relative">
      <button type="button" disabled={busy || deleting} onClick={onOpen}
        aria-label={t('View {image} full screen', {image: label})}
        className="relative block w-full cursor-zoom-in bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
        <img src={src} alt={label} decoding="async" draggable={false} className="block h-auto w-full object-contain"/>
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-background/60"><Loader2 aria-label={t('Uploading screenshot')} className="size-6 animate-spin"/></span>}
      </button>
      {onResize && <button type="button" disabled={busy||deleting} aria-label={t('Drag to resize {image}',{image:label})}
        onPointerDown={event=>{event.preventDefault();drag.current={x:event.clientX,size};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event=>event.currentTarget.hasPointerCapture(event.pointerId)&&resize(event)}
        onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);drag.current=null;}}
        onLostPointerCapture={()=>{drag.current=null;}}
        onKeyDown={event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();onResize(imageWidth(size+(event.key==='ArrowRight'?5:-5)));}}}
        className="absolute bottom-0 right-0 flex size-8 cursor-ew-resize items-center justify-center rounded-tl bg-background/80 text-muted-foreground" style={{touchAction:'none'}}>↔</button>}
    </div>
    {caption && <figcaption className="break-words px-1 py-2 text-xs text-muted-foreground">{caption}</figcaption>}
    {uploadState&&<div className="space-y-1 py-2 text-xs" aria-live="polite">
      {['uploading','optimizing'].includes(uploadState.phase)&&<><span>{t(uploadState.phase==='optimizing'?'Optimizing image…':'Uploading image…')}{uploadState.percent!=null&&uploadState.phase==='uploading'?` ${uploadState.percent}%`:''}</span><progress aria-label={t('Image upload progress')} max="100" value={uploadState.percent??undefined} className="block h-1.5 w-full accent-primary"/></>}
      {uploadState.phase==='uploaded'&&<span className="text-primary">{t('Image uploaded')}</span>}
      {uploadState.size<uploadState.originalSize&&<span className="block text-muted-foreground">{t('Image optimized')}: {Math.round(uploadState.originalSize/1024)} KB → {Math.round(uploadState.size/1024)} KB</span>}
      {uploadState.phase==='failed'&&<><p role="alert" className="break-words text-red-400">{uploadState.error}</p><button type="button" onClick={onRetry} className="min-h-11 rounded border border-border px-2 hover:bg-secondary">{t('Retry this image')}</button></>}
    </div>}
    {(onResize || onRemove) && <div className="flex min-h-11 flex-wrap items-center justify-end gap-1">
      {onResize && <Popover modal open={optionsOpen} onOpenChange={setOptionsOpen}>
        <PopoverTrigger asChild><button type="button" disabled={busy||deleting} data-image-arrange={arrangement ? '' : undefined}
          aria-label={t(arrangement ? 'Image options for {image}' : 'Resize {image}',{image:label})}
          title={t(arrangement ? 'Drag to move. Click for image options.' : 'Image width')}
          onPointerDown={arrangement?.onPointerDown} onPointerMove={arrangement?.onPointerMove} onPointerUp={arrangement?.onPointerUp} onLostPointerCapture={arrangement?.onLostPointerCapture}
          onKeyDown={event=>{if(['Enter',' '].includes(event.key))arrangement?.allowKeyboard();}}
          onClick={event=>{if(arrangement?.consumeClick())event.preventDefault();}}
          style={arrangement ? {touchAction:'none'} : undefined}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
          {arrangement ? <GripVertical aria-hidden="true" className="size-4"/> : <SlidersHorizontal aria-hidden="true" className="size-4"/>}
        </button></PopoverTrigger>
        <PopoverContent aria-label={t(arrangement ? 'Image options for {image}' : 'Resize {image}',{image:label})} align="end" className="w-64 max-w-[calc(100vw-32px)]">
          <div className="flex items-center justify-between gap-3 text-xs"><span>{t('Image width')}</span><output className="tabular-nums">{size}%</output></div>
          <input type="range" min="25" max="100" step="1" aria-label={t('Width of {image}',{image:label})} value={size} onChange={event=>onResize(imageWidth(event.target.value))} className="my-3 block min-h-8 w-full"/>
          <button type="button" onClick={()=>onResize(100)} className="min-h-11 w-full rounded px-2 text-left text-xs text-muted-foreground hover:bg-secondary">{t('Reset size')}</button>
          {arrangement && <ImagePlacementControls targets={arrangement.targets} onPlace={target=>{if(arrangement.onPlace(target))setOptionsOpen(false);}}/>}
        </PopoverContent>
      </Popover>}
      {onRemove && <button type="button" disabled={busy || deleting} onClick={onRemove} aria-label={t('Remove {image}', {image:label})} className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">{deleting ? <Loader2 className="size-4 animate-spin"/> : <Trash2 aria-hidden="true" className="size-4"/>}</button>}
    </div>}
    {children}
  </figure>;
}
