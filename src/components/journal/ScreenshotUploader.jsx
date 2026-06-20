import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

// screenshots: Array<{ id: number, name: string, preview: string }>
// onChange: (screenshots) => void

export default function ScreenshotUploader({ screenshots = [], onChange }) {
  const inputRef = useRef(null);

  function handleFiles(files) {
    const newItems = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = { id: Date.now() + Math.random(), name: file.name, preview: e.target.result };
        onChange([...screenshots, ...newItems, item]);
      };
      reader.readAsDataURL(file);
      newItems.push({ id: Date.now() + Math.random(), name: file.name, preview: "" });
    });
  }

  function remove(id) {
    onChange(screenshots.filter((s) => s.id !== id));
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-5 transition-colors hover:border-zinc-600 hover:bg-zinc-900/60"
      >
        <ImagePlus className="size-5 text-zinc-600" />
        <p className="text-xs text-zinc-600">
          Click or drag an image to attach a screenshot
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {screenshots.map((s) => (
            <div key={s.id} className="group relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
              {s.preview ? (
                <img src={s.preview} alt={s.name} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-zinc-600">Loading…</div>
              )}
              <button
                type="button"
                onClick={() => remove(s.id)}
                className="absolute right-1 top-1 hidden rounded bg-zinc-900/80 p-0.5 text-zinc-300 hover:text-white group-hover:flex"
              >
                <X className="size-3.5" />
              </button>
              <p className="truncate px-1.5 py-1 text-[10px] text-zinc-500">{s.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
