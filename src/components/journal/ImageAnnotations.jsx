import {useId} from 'react';
export default function ImageAnnotations({items=[]}) {
  const marker=useId().replaceAll(':','');
  return <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
    <defs><marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>
    {items.map((item,index)=>item.type==='arrow'?<line key={index} x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke={item.color} strokeWidth=".7" markerEnd={`url(#${marker})`}/>:<rect key={index} x={Math.min(item.x1,item.x2)} y={Math.min(item.y1,item.y2)} width={Math.abs(item.x2-item.x1)} height={Math.abs(item.y2-item.y1)} stroke={item.color} fill={item.color} fillOpacity=".2" strokeWidth=".5"/>)}
  </svg>;
}
