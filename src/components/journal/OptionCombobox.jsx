import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, MoreHorizontal, Plus, Star, Trash2, X } from 'lucide-react';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';

export default function OptionCombobox({ value, onChange, options = [], onCreate, onUpdate, onDelete,
  label = 'Options', placeholder = 'Select or type…', multiple = false, uppercase = false,
  favorites, onToggleFavorite, maxLength = 100, id, onBlur, ref, buttonRole = 'combobox', translateOptions = false }) {
  useLanguage();
  const [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null), [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [active, setActive] = useState(-1);
  const searchRef = useRef(null), triggerRef = useRef(null), containerRef = useRef(null), panelRef = useRef(null), listId = useId();
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({preventScroll:true});
    panelRef.current?.scrollIntoView({block:"nearest"});
  }, [open]);
  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!busy && !event.composedPath().includes(containerRef.current)) {
        setOpen(false);setQuery('');setEditing(null);setError('');setActive(-1);onBlur?.();
      }
    }
    function escape(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();event.stopPropagation();
      if (!busy) {setOpen(false);setQuery('');setEditing(null);setError('');setActive(-1);onBlur?.();triggerRef.current?.focus({preventScroll:true});}
    }
    document.addEventListener('keydown',escape);
    document.addEventListener('click',outside);
    return () => {document.removeEventListener('click',outside);document.removeEventListener('keydown',escape);};
  }, [open,busy,onBlur]);
  const items = options.map(option => typeof option === 'string' ? { value: option, label: option } : option);
  const display = item => translateOptions ? t(item.label) : item.label;
  const selected = multiple ? (value ?? []) : [value];
  const trimmed = (uppercase ? query.toUpperCase() : query).trim();
  const matches = items.filter(item => display(item).toLowerCase().includes(trimmed.toLowerCase()));
  const exact = items.find(item => [item.value, display(item)].some(text => String(text).toLowerCase() === trimmed.toLowerCase()));
  const canCreate = !!onCreate && !!trimmed && !exact;
  const validDraft = draft.trim() && !items.some(item => item.value !== editing?.value && [item.value,item.label].some(text => String(text).toLowerCase() === draft.trim().toLowerCase()));
  function changeOpen(next) { if (busy) return; setOpen(next); setQuery(''); setEditing(null); setError(''); setActive(-1); if (!next) onBlur?.(); }
  function select(next) {
    onChange(multiple ? (selected.includes(next) ? selected.filter(item => item !== next) : [...selected,next]) : next);
    setQuery(''); setActive(-1);
    if (!multiple) {setOpen(false);onBlur?.();} else searchRef.current?.focus();
  }
  async function run(action) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err?.response?.data?.detail || err?.message || t('Unable to save option. Please try again.')); }
    finally { setBusy(false); }
  }
  function create() { if (canCreate) return run(async () => { await onCreate(trimmed); select(trimmed); }); }
  function save() { if(validDraft) return run(async()=>{await onUpdate(editing.value,draft.trim());if(selected.includes(editing.value))onChange(multiple?selected.map(item=>item===editing.value?draft.trim():item):draft.trim());setEditing(null);setQuery('');}); }
  function remove() { return run(async()=>{await onDelete(editing.value);if(selected.includes(editing.value))onChange(multiple?selected.filter(item=>item!==editing.value):'');setEditing(null);setQuery('');}); }
  const choices = [...matches.map(item => () => select(item.value)), ...(canCreate ? [create] : [])];
  function keyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && choices.length) {
      event.preventDefault(); const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
      setActive(next); document.getElementById(`${listId}-${next}`)?.scrollIntoView({block:'nearest'});
    } else if (event.key === 'Enter') {
      event.preventDefault(); event.stopPropagation();
      if (busy) return;
      if (active >= 0 && choices[active]) choices[active]();
      else if (exact) select(exact.value);
      else if (canCreate) create();
      else if (matches[0]) select(matches[0].value);
    }
  }
  const buttonClass='min-h-11 rounded-md px-2 text-sm hover:bg-zinc-800 disabled:opacity-40';
  return <div ref={containerRef} data-option-picker={label} className="min-w-0 space-y-2" onKeyDown={event => {
    if(event.key==='Tab' && open) {
      requestAnimationFrame(()=>{if(!containerRef.current?.contains(document.activeElement))changeOpen(false);});
    }
    if(event.key==='Escape' && open) {
      event.preventDefault();event.stopPropagation();changeOpen(false);triggerRef.current?.focus({preventScroll:true});
    }
  }}>
    {multiple && selected.length > 0 && <div className="flex flex-wrap gap-1.5">{selected.map(item => <span key={item} className="inline-flex max-w-full items-center gap-1 rounded-md bg-zinc-800 px-2 text-xs text-zinc-200"><span className="min-w-0 break-words [overflow-wrap:anywhere]">{item}</span><button type="button" aria-label={`Deselect ${item}`} onClick={() => onChange(selected.filter(next => next !== item))} className="flex size-8 shrink-0 items-center justify-center"><X className="size-3"/></button></span>)}</div>}
    <button ref={element=>{triggerRef.current=element;if(typeof ref==='function')ref(element);else if(ref)ref.current=element;}} id={id} type="button" role={buttonRole} aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?`${listId}-panel`:undefined} onClick={()=>changeOpen(!open)} onBlur={onBlur}
        className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-background/50 px-3 py-2 text-left text-[13px] text-zinc-100 outline-none hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-primary/30">
        <span className={`min-w-0 truncate ${!value || multiple ? 'text-zinc-500' : ''}`}>{!multiple && value ? display(items.find(item => item.value === value) ?? {label:value}) : t(placeholder)}</span><ChevronDown className="size-3.5 shrink-0 text-zinc-500"/>
      </button>
      {open && <div ref={panelRef} id={`${listId}-panel`} role="dialog" aria-label={`${label} options`} data-option-panel
        className="flex max-h-[min(360px,55dvh)] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-100 shadow-sm">
        {editing ? <div className="space-y-2 overflow-y-auto p-1">
          <label className="block text-xs text-zinc-400" htmlFor={`${listId}-edit`}>{t('Edit option')}</label>
          <input id={`${listId}-edit`} autoFocus aria-label="Option name" maxLength={maxLength} value={draft} disabled={busy} onChange={event => setDraft(uppercase ? event.target.value.toUpperCase() : event.target.value)} onKeyDown={event => {if(event.key==='Enter'){event.preventDefault();event.stopPropagation();save();}}} className="h-10 w-full min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm outline-none focus:ring-1 focus:ring-primary"/>
          <div className="flex gap-2"><button type="button" disabled={busy||!validDraft} onClick={save} className={`${buttonClass} flex-1 bg-primary/15 text-primary`}>{t('Save')}</button><button type="button" disabled={busy} onClick={()=>{setEditing(null);setError('');}} className={`${buttonClass} flex-1`}>{t('Cancel')}</button></div>
          {onDelete && <button type="button" disabled={busy} onClick={remove} className={`${buttonClass} flex w-full items-center gap-2 text-red-400`}><Trash2 className="size-4"/>{t('Delete')}</button>}
        </div> : <>
          <input ref={searchRef} role="combobox" aria-label={`Search ${label}`} aria-controls={listId} aria-expanded="true" aria-activedescendant={active>=0?`${listId}-${active}`:undefined} autoComplete="off" placeholder={t('Search or create…')} value={query} maxLength={maxLength} onChange={event=>{setQuery(uppercase?event.target.value.toUpperCase():event.target.value);setActive(-1);setError('');}} onKeyDown={keyDown} className="mb-1 h-11 w-full shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm outline-none focus:ring-1 focus:ring-primary/50"/>
          <div id={listId} role="listbox" aria-label={label} aria-multiselectable={multiple||undefined} className="min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
            {!multiple && <button type="button" disabled={busy} onClick={()=>select('')} className={`${buttonClass} w-full text-left text-zinc-500`}>{t('Not set')}</button>}
            {matches.map((item,index)=><div key={item.value} className={`flex min-w-0 items-center rounded-md ${active===index?'bg-zinc-800':''}`}>
              <button id={`${listId}-${index}`} type="button" role={favorites ? undefined : "option"} aria-selected={favorites ? undefined : selected.includes(item.value)} aria-label={favorites?`Select ${item.value}`:undefined} disabled={busy} onClick={()=>select(item.value)} className={`${buttonClass} flex min-w-0 flex-1 items-center gap-2 py-2 text-left`}><Check className={`size-3.5 shrink-0 ${selected.includes(item.value)?'text-primary':'invisible'}`}/><span className="min-w-0 break-words [overflow-wrap:anywhere]">{display(item)}</span></button>
              {favorites && <button type="button" aria-label={`Favorite ${item.value}`} aria-pressed={favorites.includes(item.value)} onClick={()=>onToggleFavorite(item.value)} className={`flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-zinc-800 ${favorites.includes(item.value)?'text-[#facc15]':'text-zinc-500'}`}><Star className="size-4" fill={favorites.includes(item.value)?'currentColor':'none'}/></button>}
              {onUpdate && <button type="button" aria-label={`Actions for ${item.label}`} disabled={busy} onClick={()=>{setEditing(item);setDraft(item.label);setError('');}} className="flex size-11 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"><MoreHorizontal className="size-4"/></button>}
            </div>)}
            {canCreate && <button id={`${listId}-${matches.length}`} type="button" disabled={busy} onClick={create} className={`${buttonClass} flex w-full items-center gap-2 border-t border-zinc-800 py-2 text-left text-primary ${active===matches.length?'bg-zinc-800':''}`}><Plus className="size-4 shrink-0"/><span className="min-w-0 break-words [overflow-wrap:anywhere]">{busy?t('Creating…'):`${t('Create')} “${trimmed}”`}</span></button>}
            {!matches.length&&!canCreate&&<p className="p-3 text-xs text-zinc-500">{t('No options found')}</p>}
          </div>
        </>}
        {error && <p role="alert" className="shrink-0 break-words p-2 text-xs text-red-400">{error}</p>}
      </div>}
  </div>;
}
