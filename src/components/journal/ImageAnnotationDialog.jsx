import {useRef,useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {translate as t} from '@/i18n/language';
import ImageAnnotations from './ImageAnnotations';
export default function ImageAnnotationDialog({image,onSave,onClose}) {
  const [items,setItems]=useState(image.annotations??[]),[redo,setRedo]=useState([]),[caption,setCaption]=useState(image.caption??''),[tool,setTool]=useState('arrow'),[color,setColor]=useState('#facc15'),[drawing,setDrawing]=useState(null);
  const start=useRef(null);
  function point(event) {const rect=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100))};}
  function end(event) {
    if(!start.current)return;
    const p=point(event),item={type:tool,color,x1:start.current.x,y1:start.current.y,x2:p.x,y2:p.y};
    if(Math.hypot(item.x2-item.x1,item.y2-item.y1)>1&&items.length<100){setItems([...items,item]);setRedo([]);}
    start.current=null;setDrawing(null);
  }
  return <Dialog open onOpenChange={value=>!value&&onClose()}><DialogContent className="sm:max-w-3xl">
    <DialogHeader><DialogTitle>{t('Annotate image')}</DialogTitle><DialogDescription>{t('Choose a tool and drag on the image. Your original image stays unchanged.')}</DialogDescription></DialogHeader>
    <div className="flex flex-wrap items-center gap-2">
      {['arrow','highlight'].map(value=><button key={value} type="button" aria-pressed={tool===value} onClick={()=>setTool(value)} className={`min-h-11 rounded-md border px-3 ${tool===value?'border-primary text-primary':'border-border'}`}>{t(value==='arrow'?'Arrow':'Highlight')}</button>)}
      <label className="flex min-h-11 items-center gap-2 text-xs">{t('Annotation color')}<input type="color" aria-label={t('Annotation color')} value={color} onChange={e=>setColor(e.target.value)}/></label>
      <Button type="button" variant="outline" disabled={!items.length} onClick={()=>{setRedo([...redo,items.at(-1)]);setItems(items.slice(0,-1));}}>{t('Undo annotation')}</Button>
      <Button type="button" variant="outline" disabled={!redo.length} onClick={()=>{setItems([...items,redo.at(-1)]);setRedo(redo.slice(0,-1));}}>{t('Redo annotation')}</Button>
    </div>
    <div role="img" aria-label={t('Annotation canvas')} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'&&items.length<100){e.preventDefault();setItems([...items,{type:tool,color,x1:25,y1:25,x2:75,y2:75}]);setRedo([]);}}} className="relative mx-auto w-fit max-w-full cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-primary" style={{touchAction:'none'}}
      onPointerDown={e=>{e.preventDefault();const p=point(e);start.current=p;e.currentTarget.setPointerCapture(e.pointerId);setDrawing({type:tool,color,x1:p.x,y1:p.y,x2:p.x,y2:p.y});}}
      onPointerMove={e=>{if(start.current){const p=point(e);setDrawing({type:tool,color,x1:start.current.x,y1:start.current.y,x2:p.x,y2:p.y});}}}
      onPointerUp={end} onPointerCancel={()=>{start.current=null;setDrawing(null);}}>
      <img src={image.preview} alt="" draggable={false} className="block max-h-[48dvh] max-w-full object-contain"/>
      <ImageAnnotations items={drawing?[...items,drawing]:items}/>
    </div>
    <label className="space-y-1 text-xs">{t('Image caption')}<input aria-label={t('Image caption')} maxLength={300} value={caption} onChange={e=>setCaption(e.target.value)} className="block min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"/></label>
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t('Cancel')}</Button><Button type="button" onClick={()=>onSave({annotations:items,caption:caption.trim()})}>{t('Apply annotations')}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
