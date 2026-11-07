import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useRef, useState } from "react";
import { ImagePlus, Plus, X, Maximize2, Minimize2 } from "lucide-react";
import TradeImage from "./TradeImage";
import ImageLightbox from "./ImageLightbox";

export const DEFAULT_SECTIONS = [
  { id: "before", title: "Before / Market Entry", text: "", images: [] },
  { id: "during", title: "During",                text: "", images: [] },
  { id: "after",  title: "After",                 text: "", images: [] },
];

// ─── Single section ───────────────────────────────────────────────────────────

function NoteSection({
  section,
  canRemove,
  isEditingTitle,
  onStartRename,
  onFinishRename,
  onRemove,
  onTextChange,
  onAddImages,
  onRemoveImage,
  onImageClick,
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
      className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/20"
      onPaste={handlePaste}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); readFiles(e.dataTransfer.files); }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-2">
        {isEditingTitle ? (
          <input
            autoFocus
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
      <textarea
        value={section.text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Notes for ${section.title.toLowerCase()}… (paste an image here)`}
        rows={3}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
      />

      {/* Full-width, uncropped chart documents */}
      {section.images.length > 0 && <div className="space-y-4 px-3 pb-3">
        {section.images.map(img => <TradeImage key={img.id} src={img.preview} label={img.name}
          onOpen={() => onImageClick(img.preview)} onRemove={() => onRemoveImage(img.id)} />)}
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
    update(sectionId, { images: s.images.filter((i) => i.id !== imgId) });
  }

  function removeSection(id) {
    const s = sections.find((sec) => sec.id === id);
    if (s) s.images.forEach((img) => { if (img.file) URL.revokeObjectURL(img.preview); });
    onChange(sections.filter((sec) => sec.id !== id));
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-5 text-muted-foreground">{t("Paste, drop or upload screenshots. Each image shows the complete chart.")}</p>
        {onToggleWide && <button type="button" aria-pressed={wide} onClick={onToggleWide} className="hidden min-h-10 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground md:flex">
          {wide ? <Minimize2 aria-hidden="true" className="size-3.5"/> : <Maximize2 aria-hidden="true" className="size-3.5"/>}
          {wide ? t("Standard width") : t("Wide review")}
        </button>}
      </div>
      <div className="space-y-4">
        {sections.map((s) => (
          <NoteSection
            key={s.id}
            section={s}
            canRemove={sections.length > 1}
            isEditingTitle={editingId === s.id}
            onStartRename={() => setEditingId(s.id)}
            onFinishRename={(v) => finishRename(s.id, v)}
            onRemove={() => removeSection(s.id)}
            onTextChange={(text) => update(s.id, { text })}
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

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
