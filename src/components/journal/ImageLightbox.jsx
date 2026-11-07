import { translate as t } from '@/i18n/language';
import { useLanguage } from '@/i18n/useLanguage';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';

export default function ImageLightbox({src,onClose}) {
  useLanguage();
  if (!src) return null;
  return <Dialog.Root open onOpenChange={open=>!open&&onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm"/>
      <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-[100] flex items-center justify-center p-4 outline-none"
        onEscapeKeyDown={event=>event.stopPropagation()}
        onClick={event=>event.target===event.currentTarget&&onClose()}>
        <Dialog.Title className="sr-only">{t('Screenshot')}</Dialog.Title>
        <img src={src} alt={t('Screenshot')} className="max-h-[90dvh] max-w-[95vw] rounded-lg object-contain shadow-2xl"/>
        <Dialog.Close asChild><button type="button" aria-label={t('Close image viewer')} className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white"><X className="size-5"/></button></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
