import { useRef, useState } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
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
  const fileInputRef  = useRef(null);

  function readFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      onAddImages([{ id: Date.now() + Math.random(), name: file.name, preview: URL.createObjectURL(file), file }]);
    });
  }

  function handlePaste(e) {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
      i.type.startsWith("image/")
    );
    if (!item) return;
    e.preventDefault();
    const file = item.getAsFile();
    onAddImages([{ id: Date.now() + Math.random(), name: "pasted-image.png", preview: URL.createObjectURL(file), file }]);
  }

  return (
    <div
      className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/20"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); readFiles(e.dataTransfer.files); }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-2">
        {isEditingTitle ? (
          <input
            autoFocus
            defaultValue={section.title}
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
            title="Click to rename"
            onClick={onStartRename}
            className="flex-1 truncate text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {section.title}
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
        onPaste={handlePaste}
        placeholder={`Notes for ${section.title.toLowerCase()}… (paste an image here)`}
        rows={3}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
      />

      {/* Image grid */}
      {section.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          {section.images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded border border-zinc-800 bg-zinc-900">
              <img
                src={img.preview}
                alt={img.name}
                className="h-28 w-full cursor-zoom-in object-cover"
                onClick={() => onImageClick(img.preview)}
              />
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute right-1 top-1 hidden rounded bg-zinc-900/80 p-0.5 text-zinc-300 hover:text-white group-hover:flex"
              >
                <X className="size-3" />
              </button>
              <p className="truncate px-1.5 py-1 text-[10px] text-zinc-500">{img.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div className="border-t border-zinc-800/40 px-3 py-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ImagePlus className="size-3.5" />
          Upload image
        </button>
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

export default function TradeNotesEditor({ sections, onChange, onDeleteImage }) {
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
      <div className="space-y-2">
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
          <Plus className="size-3.5" />
          Add section
        </button>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
