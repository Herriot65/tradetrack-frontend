import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Fragment, useRef, useState } from "react";
import { ImagePlus, Plus, X, Maximize2, Minimize2 } from "lucide-react";
import RichNotesEditor from "@/components/notes/RichNotesEditor";
import { documentFromText } from "@/lib/noteDocument";
import { flattenImageRows, imageRows, placeImage } from "@/lib/imageLayout";
import { useImagePlacement } from "@/hooks/useImagePlacement";
import TradeImage from "./TradeImage";
import ImageLightbox from "./ImageLightbox";

export const DEFAULT_SECTIONS = [
  { id: "before", title: "Before / Market Entry", text: "", images: [] },
  { id: "during", title: "During",                text: "", images: [] },
  { id: "after",  title: "After",                 text: "", images: [] },
];

function placementTargets(sections, sourceSectionId, sourceImageId) {
  return sections.flatMap((section,index) => {
    const title = DEFAULT_SECTIONS.some(item=>item.id===section.id&&item.title===section.title) ? t(section.title) : section.title;
    const label = sections.filter(item=>item.title===section.title).length>1 ? `${title} · ${t('Section {number}',{number:index+1})}` : title;
    const images = section.images.flatMap((image,i)=>section.id===sourceSectionId && image.id===sourceImageId ? [] : [{value:JSON.stringify([section.id,image.id]),sectionId:section.id,imageId:image.id,label:`${label} · ${t('Image {number}',{number:i+1})}`}]);
    return [...images,{value:JSON.stringify([section.id,null]),sectionId:section.id,imageId:null,label:`${label} · ${t('End of section')}`}];
  });
}

// ─── Single section ───────────────────────────────────────────────────────────

function NoteSection({
  section,
  canRemove,
  isEditingTitle,
  onStartRename,
  onFinishRename,
  onRemove,
  onTextChange,
  onResizeImage,
  onAddImages,
  onRemoveImage,
  onImageClick,
  sections,
  placement,
  onPlaceImage,
}) {
  useLanguage();
  const fileInputRef  = useRef(null);

  function readFiles(files) {
    const images = Array.from(files).filter(file => file?.type.startsWith("image/"));
    if (images.length) onAddImages(images.map(file => ({ id: crypto.randomUUID(), name: file.name || "pasted-image.png", preview: URL.createObjectURL(file), file })));
  }

  function handlePaste(event) {
    const files = Array.from(event.clipboardData?.items ?? [])
      .filter(item => item.type.startsWith("image/"))
      .map(item => item.getAsFile()).filter(Boolean);
    if (!files.length) return;
    event.preventDefault();
    readFiles(files);
  }

  return (
    <div
      data-note-section={section.id}
      className="overflow-hidden rounded-lg border border-border bg-card"
      onPaste={handlePaste}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); readFiles(e.dataTransfer.files); }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-2">
        {isEditingTitle ? (
          <input
            autoFocus
            maxLength={100}
            defaultValue={DEFAULT_SECTIONS.some(item => item.id === section.id && item.title === section.title) ? t(section.title) : section.title}
            className="flex-1 bg-transparent text-[11px] font-semibold uppercase tracking-wider text-zinc-200 outline-none"
            onBlur={(e) => onFinishRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onFinishRename(e.target.value); }
              if (e.key === "Escape") onFinishRename(null);
            }}
          />
        ) : (
          <button
            type="button"
            title={t("Click to rename")}
            onClick={onStartRename}
            className="flex-1 truncate text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {DEFAULT_SECTIONS.some(item => item.id === section.id && item.title === section.title) ? t(section.title) : section.title}
          </button>
        )}
        {canRemove && !isEditingTitle && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label={`Remove ${section.title} section`}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Text */}
      <RichNotesEditor embedded hasImages={section.images.length > 0} label={t("Notes for {section}", {section: section.title})} value={section.content ?? documentFromText(section.text)} onChange={(content,text) => onTextChange(text,content)} />

      {/* Row breaks keep manual placements independent of image width. */}
      {(section.images.length > 0 || placement.drag) && <div className="trade-note-images px-3 pb-3">
        {section.images.map((img,index) => <Fragment key={img.id}>
          {index>0 && img.startRow && <span className="trade-image-break" aria-hidden="true"/>}
          <TradeImage src={img.preview} label={img.name} width={img.width ?? 100} onResize={width => onResizeImage(img.id,width)}
            onOpen={() => onImageClick(img.preview)} onRemove={() => onRemoveImage(img.id)}
            arrangement={{imageId:String(img.id),dragging:placement.drag?.source.sectionId===section.id && String(placement.drag.source.imageId)===String(img.id),
              onPointerDown:event=>placement.start(event,{sectionId:section.id,imageId:img.id}),onPointerMove:placement.move,onPointerUp:placement.end,onLostPointerCapture:placement.cancel,
              consumeClick:placement.consumeClick,allowKeyboard:placement.allowKeyboard,
              targets:placementTargets(sections,section.id,img.id),
              onPlace:target=>onPlaceImage({sectionId:section.id,imageId:img.id},target)}}>
            {placement.drag && !(placement.drag.source.sectionId===section.id && String(placement.drag.source.imageId)===String(img.id)) && <div className="trade-image-dropzones" aria-hidden="true">
              {['above','left','right','below'].map(mode=><div key={mode} data-image-drop data-section-id={section.id} data-image-id={String(img.id)} data-placement={mode}
                data-active={placement.drag.over?.sectionId===section.id && String(placement.drag.over.imageId)===String(img.id) && placement.drag.over.placement===mode}
                className={`trade-image-dropzone trade-image-dropzone-${mode}`}>{t({above:'Above',below:'Below',left:'Left',right:'Right'}[mode])}</div>)}
            </div>}
          </TradeImage>
        </Fragment>)}
        {placement.drag && <div data-image-drop data-section-id={section.id} data-image-id="" data-placement="below" className="trade-image-drop-end" data-active={placement.drag.over?.sectionId===section.id && placement.drag.over.imageId==null}>{t(section.images.length?'Place at end of section':'Place image here')}</div>}
      </div>}

      {/* Upload */}
      <div className="border-t border-zinc-800/40 px-3 py-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ImagePlus className="size-3.5" />{t("Upload image")}</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { readFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export default function TradeNotesEditor({ sections, onChange, onDeleteImage, onToggleWide, wide = false }) {
  useLanguage();
  const [editingId,   setEditingId]   = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const editorRef = useRef(null);
  const [announcement,setAnnouncement] = useState('');
  const [placementError,setPlacementError] = useState('');
  function arrange(source,target) {
    const result=placeImage(sections,source,target);
    setPlacementError(result.full?t('A row can contain up to four images. Place this image above or below instead.'):'');
    if(!result.changed)return false;
    onChange(result.sections);setAnnouncement('');
    requestAnimationFrame(()=>{
      setAnnouncement(t('Image moved.'));
      const control=editorRef.current?.querySelector(`[data-note-image-id="${CSS.escape(String(source.imageId))}"] [data-image-arrange]`);
      control?.focus({preventScroll:true});control?.scrollIntoView({block:'nearest'});
    });
    return true;
  }
  const placement=useImagePlacement(arrange);


  function update(id, patch) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function finishRename(id, value) {
    if (value && value.trim()) update(id, { title: value.trim() });
    setEditingId(null);
  }

  function addSection() {
    const id = `section-${Date.now()}`;
    onChange([...sections, { id, title: "New Section", text: "", images: [] }]);
    setEditingId(id);
  }

  function addImages(id, newImgs) {
    const s = sections.find((s) => s.id === id);
    if (s) update(id, { images: [...s.images, ...newImgs] });
  }

  function removeImage(sectionId, imgId) {
    const s = sections.find((s) => s.id === sectionId);
    if (!s) return;
    const img = s.images.find((i) => i.id === imgId);
    if (img?.file) URL.revokeObjectURL(img.preview);
    if (img?.screenshotId && onDeleteImage) onDeleteImage(img.screenshotId);
    update(sectionId, { images: flattenImageRows(imageRows(s.images).map(row=>row.filter(image=>image.id!==imgId))) });
  }

  function removeSection(id) {
    const s = sections.find((sec) => sec.id === id);
    if (s) s.images.forEach((img) => { if (img.file) URL.revokeObjectURL(img.preview); });
    onChange(sections.filter((sec) => sec.id !== id));
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-5 text-muted-foreground">{t("Paste or upload screenshots. Drag the grip to arrange; tap it for options.")}</p>
        {onToggleWide && <button type="button" aria-pressed={wide} onClick={onToggleWide} className="hidden min-h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground md:flex">
          {wide ? <Minimize2 aria-hidden="true" className="size-3.5"/> : <Maximize2 aria-hidden="true" className="size-3.5"/>}
          {wide ? t("Standard width") : t("Wide review")}
        </button>}
      </div>
      <div ref={editorRef} className="space-y-4">
        {sections.map((s) => (
          <NoteSection
            key={s.id}
            section={s}
            sections={sections}
            placement={placement}
            onPlaceImage={arrange}
            canRemove={sections.length > 1}
            isEditingTitle={editingId === s.id}
            onStartRename={() => setEditingId(s.id)}
            onFinishRename={(v) => finishRename(s.id, v)}
            onRemove={() => removeSection(s.id)}
            onTextChange={(text,content) => update(s.id, { text, content })}
            onResizeImage={(id,width) => update(s.id,{images:s.images.map(image => image.id===id?{...image,width}:image)})}
            onAddImages={(imgs) => addImages(s.id, imgs)}
            onRemoveImage={(imgId) => removeImage(s.id, imgId)}
            onImageClick={setLightboxSrc}
          />
        ))}

        <button
          type="button"
          onClick={addSection}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-800 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-400"
        >
          <Plus className="size-3.5" />{t("Add section")}</button>
      </div>

      <p role="status" className="sr-only">{announcement}</p>
      {placementError && <p role="alert" className="mt-2 text-xs text-muted-foreground">{placementError}</p>}
      {placement.drag && <div aria-hidden="true" className="pointer-events-none fixed z-[90] rounded-md border border-primary/50 bg-popover px-3 py-2 text-xs shadow-lg" style={{left:Math.min(placement.drag.x+12,innerWidth-160),top:Math.max(8,placement.drag.y-44)}}>{t('Move screenshot')}</div>}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
