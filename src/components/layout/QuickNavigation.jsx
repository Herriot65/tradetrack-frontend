import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function QuickNavigation({ destinations, suspended = false }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const input = useRef(null);
  const list = useRef(null);
  useEffect(() => {
    const shortcut = event => {
      if (suspended) return;
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.repeat) return;
      if (event.target.closest('input,textarea,select,[contenteditable="true"], [role="dialog"]')) return;
      event.preventDefault(); setSearch(''); setOpen(true);
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [suspended]);
  const filtered = destinations.filter(item => t(item.label).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  function navigateResults(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const links = [...list.current.querySelectorAll('a')];
    if (!links.length) return;
    event.preventDefault();
    const current = links.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : current < 0 ? (event.key === 'ArrowUp' ? links.length - 1 : 0) : (current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links[next].focus();
  }
  return <Dialog open={open} onOpenChange={value => {setOpen(value); if(value)setSearch('');}}>
    <DialogTrigger asChild><button type="button" className="nx-quick-nav-trigger" aria-label={t('Quick navigation')} aria-keyshortcuts="Control+k Meta+k"><Search size={14}/><span>{t('Go to…')}</span><kbd>⌘ / Ctrl K</kbd></button></DialogTrigger>
    <DialogContent className="nx-quick-nav sm:max-w-lg" onOpenAutoFocus={event=>{event.preventDefault();input.current?.focus();}}>
      <DialogHeader><DialogTitle>{t('Quick navigation')}</DialogTitle><DialogDescription>{t('Jump to a section of your workspace.')}</DialogDescription></DialogHeader>
      <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input ref={input} className="pl-9" value={search} onChange={event=>setSearch(event.target.value)} aria-label={t('Find a section')} placeholder={t('Find a section')} onKeyDown={event=>{if(['ArrowDown','ArrowUp'].includes(event.key))navigateResults(event);}}/></div>
      <nav ref={list} className="nx-quick-results" aria-label={t('Navigation results')} onKeyDown={navigateResults}>
        {filtered.map(({label,href,icon:Icon})=><Link key={label} to={href} onClick={()=>setOpen(false)}><span className="nx-quick-icon"><Icon size={16} aria-hidden="true"/></span><span>{t(label)}</span><ArrowUpRight size={14} aria-hidden="true"/></Link>)}
        {!filtered.length && <div className="nx-quick-empty" role="status"><Search size={24}/><p>{t('No sections found')}</p><button type="button" onClick={()=>{setSearch('');input.current?.focus();}}>{t('Clear search')}</button></div>}
      </nav>
      <p className="nx-quick-hint">{t('Use ↑ ↓ to navigate, Enter to open, Esc to close.')}</p>
    </DialogContent>
  </Dialog>;
}
