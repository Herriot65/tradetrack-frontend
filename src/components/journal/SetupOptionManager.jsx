import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {SETUP_OPTIONS,useSetupOptions} from '@/hooks/useSetupOptions';
import {translate as t} from '@/i18n/language';
import {useLanguage} from '@/i18n/useLanguage';
export default function SetupOptionManager({kind,onClose}) {
  useLanguage();
  const config=SETUP_OPTIONS[kind];const {options,add,remove,reset}=useSetupOptions(kind);
  const [name,setName]=useState(''),[error,setError]=useState('');
  function addOption() {
    const label=kind==='timeframes'?name.trim().toUpperCase():name.trim();
    const option=config.defaults.find(item=>item.label.toLowerCase()===label.toLowerCase()||item.value.toLowerCase()===label.toLowerCase())??{value:label,label};
    if(!label||label.length>config.maxLength||label==='__not_set__')return setError(t('Enter a name of 1–{max} characters.',{max:config.maxLength}));
    if(options.some(item=>item.value.toLowerCase()===option.value.toLowerCase()||item.label.toLowerCase()===label.toLowerCase()))return setError(t('This option already exists.'));
    if(options.length>=100)return setError(t('You can have up to 100 options.'));
    add(option);setName('');setError('');
  }
  return <Dialog open onOpenChange={open=>!open&&onClose()}><DialogContent className="sm:max-w-sm">
    <DialogHeader><DialogTitle>{t('Manage {field}',{field:t(config.label)})}</DialogTitle><DialogDescription>{t('Customize choices in this browser. Removing a choice does not change saved trades.')}</DialogDescription></DialogHeader>
    <div className="max-h-64 space-y-1 overflow-y-auto">{!options.length&&<p className="py-4 text-sm text-muted-foreground">{t('No options. Add one below.')}</p>}{options.map(option=><div key={option.value} className="flex items-center justify-between gap-2"><span className="min-w-0 break-words text-sm">{t(option.label)}</span><button type="button" aria-label={t('Remove {option}',{option:t(option.label)})} className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={()=>remove(option.value)}><Trash2 className="size-4"/></button></div>)}</div>
    <div className="space-y-2 border-t border-border pt-4"><label className="text-xs text-muted-foreground" htmlFor="setup-option-name">{t('New option')}</label><div className="flex gap-2"><Input autoFocus id="setup-option-name" value={name} maxLength={config.maxLength} onChange={e=>{setName(e.target.value);setError('');}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addOption();}}}/><Button type="button" onClick={addOption} disabled={!name.trim()}>{t('Add')}</Button></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>
    <div className="flex justify-between gap-2"><Button type="button" variant="ghost" onClick={()=>{reset();setError('');}}>{t('Restore defaults')}</Button><Button type="button" variant="outline" onClick={onClose}>{t('Done')}</Button></div>
  </DialogContent></Dialog>;
}
