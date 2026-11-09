import {useCallback,useEffect,useRef,useState} from 'react';

function dropAt(x,y) {
  const zone=document.elementFromPoint(x,y)?.closest('[data-image-drop]');
  if(!zone)return null;
  return {sectionId:zone.dataset.sectionId,imageId:zone.dataset.imageId || null,placement:zone.dataset.placement};
}
function scrollParent(node) {
  for(let parent=node.parentElement;parent;parent=parent.parentElement){
    if(parent.scrollHeight>parent.clientHeight && /(auto|scroll)/.test(getComputedStyle(parent).overflowY))return parent;
  }
  return null;
}
const targetKey=target=>target?JSON.stringify(target):'';
export function useImagePlacement(onPlace) {
  const candidate=useRef(null),blockClick=useRef(false);
  const [drag,setDrag]=useState(null);
  const cancel=useCallback(()=>{
    const item=candidate.current;
    candidate.current=null;
    if(item?.active)blockClick.current=true;
    if(item?.handle.hasPointerCapture(item.pointerId))item.handle.releasePointerCapture(item.pointerId);
    setDrag(null);
  },[]);
  useEffect(()=>{
    const escape=event=>{if(event.key==='Escape'&&candidate.current){event.preventDefault();event.stopPropagation();cancel();}};
    window.addEventListener('keydown',escape,true);
    return()=>window.removeEventListener('keydown',escape,true);
  },[cancel]);
  const active=!!drag;
  useEffect(()=>{
    if(!active)return;
    let frame;
    const tick=()=>{
      const item=candidate.current;
      if(!item?.active)return;
      const bounds=item.scroll?.getBoundingClientRect()??{top:0,bottom:innerHeight};
      const distance=item.y<bounds.top+48 ? -Math.ceil((bounds.top+48-item.y)/3) : item.y>bounds.bottom-48 ? Math.ceil((item.y-bounds.bottom+48)/3) : 0;
      if(distance){if(item.scroll)item.scroll.scrollTop+=Math.max(-24,Math.min(24,distance));else window.scrollBy(0,Math.max(-24,Math.min(24,distance)));}
      const over=dropAt(item.x,item.y);
      if(targetKey(over)!==targetKey(item.over)){item.over=over;setDrag({source:item.source,x:item.x,y:item.y,over});}
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[active]);
  return {
    drag,
    start(event,source){
      if(event.button!==0)return;
      event.preventDefault();blockClick.current=false;
      candidate.current={source,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,pointerId:event.pointerId,handle:event.currentTarget,scroll:scrollParent(event.currentTarget),active:false,over:null};
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    move(event){
      const item=candidate.current;if(!item)return;
      item.x=event.clientX;item.y=event.clientY;
      if(!item.active && Math.hypot(item.x-item.startX,item.y-item.startY)<6)return;
      item.active=true;item.over=dropAt(item.x,item.y);
      setDrag({source:item.source,x:item.x,y:item.y,over:item.over});
    },
    end(){
      const item=candidate.current;
      if(item?.active){const over=dropAt(item.x,item.y)??item.over;if(over)onPlace(item.source,over);}
      cancel();
    },
    cancel,
    consumeClick(){const value=blockClick.current;blockClick.current=false;return value;},
    allowKeyboard(){blockClick.current=false;},
  };
}
