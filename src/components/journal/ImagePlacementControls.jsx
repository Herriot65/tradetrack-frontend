import SelectField from "@/components/ui/select-field";
import {useId,useState} from 'react';
import {translate as t} from '@/i18n/language';
import {Button} from '@/components/ui/button';

export default function ImagePlacementControls({targets,onPlace}) {
  const id=useId();
  const [target,setTarget]=useState('');
  const [placement,setPlacement]=useState('below');
  const destination=targets.find(item=>item.value===target);
  const selectClass='min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-2 text-xs';
  return <div className="mt-2 space-y-2 border-t border-border pt-3">
    <label className="block text-xs" htmlFor={`${id}-target`}>{t('Move to')}</label>
    <SelectField id={`${id}-target`} className={selectClass} value={target} onValueChange={next=>{setTarget(next);setPlacement('below');}} allowClear={false} placeholder="Choose a destination" options={targets} />
    <label className="block text-xs" htmlFor={`${id}-placement`}>{t('Placement')}</label>
    <SelectField id={`${id}-placement`} className={selectClass} value={placement} disabled={destination?.imageId == null} onValueChange={setPlacement} allowClear={false} options={['above','below','left','right'].map(value=>({value,label:t({above:'Above',below:'Below',left:'Beside on the left',right:'Beside on the right'}[value])}))} />
    <Button type="button" size="sm" className="min-h-11 w-full" disabled={!destination} onClick={()=>onPlace({...destination,placement})}>{t('Move image')}</Button>
  </div>;
}
