import { lazy, Suspense } from 'react';
import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
const RichNotesInput = lazy(() => import('./RichNotesInput'));
export default function RichNotesEditor(props) {
  useLanguage();
  return <Suspense fallback={<p role="status" className="p-3 text-sm text-muted-foreground">{t('Loading notes editor…')}</p>}><RichNotesInput {...props}/></Suspense>;
}
