import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

// items: Array of { id, image_url?, preview?, uploading?, deleting? }
export default function TradeScreenshots({ items = [], onUpload, onDelete }) {
  const inputRef = useRef(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  function processFiles(files) {
    Array.from(files).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) return;
      if (file.size > MAX_BYTES) return;
      onUpload(file);
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded border border-zinc-800 bg-zinc-900"
            >
              <img
                src={item.image_url ?? item.preview}
                alt="Trade screenshot"
                className="h-28 w-full cursor-zoom-in object-cover"
                onClick={() => !item.uploading && setLightboxSrc(item.image_url ?? item.preview)}
              />
              {item.uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70">
                  <Loader2 className="size-5 animate-spin text-zinc-300" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={item.deleting}
                  className="absolute right-1 top-1 hidden rounded bg-zinc-900/80 p-0.5 text-zinc-300 hover:text-white group-hover:flex disabled:opacity-50"
                  aria-label="Remove screenshot"
                >
                  {item.deleting
                    ? <Loader2 className="size-3 animate-spin" />
                    : <X className="size-3" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-md border border-dashed px-4 py-3 transition-colors ${
          dragOver
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-zinc-800 bg-zinc-900/20"
        }`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ImagePlus className="size-3.5" />
          {items.length > 0 ? "Add more screenshots" : "Upload screenshots"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => { processFiles(e.target.files); e.target.value = ""; }}
        />
        <p className="mt-1 text-center text-[10px] text-zinc-700">
          PNG, JPEG, WebP · max 10 MB · drag-and-drop or click
        </p>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
