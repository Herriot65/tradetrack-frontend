import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

const DEFAULT_SECTIONS = [
  { id: "before", title: "Before / Market Entry", text: "", images: [] },
  { id: "during", title: "During",                text: "", images: [] },
  { id: "after",  title: "After",                 text: "", images: [] },
];

export { DEFAULT_SECTIONS };

// ─── Single section ───────────────────────────────────────────────────────────

function NoteSection({ section, canRemove, onRemove, onTextChange, onAddImages, onRemoveImage }) {
  const inputRef = useRef(null);

  function readFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onAddImages([{ id: Date.now() + Math.random(), name: file.name, preview: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAddImages([{ id: Date.now() + Math.random(), name: "pasted-image.png", preview: ev.target.result }]);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    readFiles(e.dataTransfer.files);
  }

  return (
    <div
      className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/20"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {section.title}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label={`Remove ${section.title} section`}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Text input */}
      <textarea
        value={section.text}
        onChange={(e) => onTextChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={`Notes for ${section.title.toLowerCase()}… (paste an image here)`}
        rows={3}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
      />

      {/* Image previews */}
      {section.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          {section.images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded border border-zinc-800 bg-zinc-900"
            >
              <img src={img.preview} alt={img.name} className="h-28 w-full object-cover" />
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

      {/* Upload button */}
      <div className="border-t border-zinc-800/40 px-3 py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ImagePlus className="size-3.5" />
          Upload image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => readFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

// ─── Editor (all sections) ────────────────────────────────────────────────────

export default function TradeNotesEditor({ sections, onChange }) {
  function update(id, patch) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function remove(id) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function addImages(id, newImages) {
    const s = sections.find((s) => s.id === id);
    if (!s) return;
    update(id, { images: [...s.images, ...newImages] });
  }

  function removeImage(sectionId, imageId) {
    const s = sections.find((s) => s.id === sectionId);
    if (!s) return;
    update(sectionId, { images: s.images.filter((i) => i.id !== imageId) });
  }

  return (
    <div className="space-y-2">
      {sections.map((s) => (
        <NoteSection
          key={s.id}
          section={s}
          canRemove={sections.length > 1}
          onRemove={() => remove(s.id)}
          onTextChange={(text) => update(s.id, { text })}
          onAddImages={(imgs) => addImages(s.id, imgs)}
          onRemoveImage={(imgId) => removeImage(s.id, imgId)}
        />
      ))}
    </div>
  );
}
