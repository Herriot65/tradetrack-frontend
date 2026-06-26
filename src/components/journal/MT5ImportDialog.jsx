import { useRef, useState } from "react";
import { CheckCircle, Upload, X } from "lucide-react";

import { importMT5 } from "@/api/journals.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function validateFile(file, journal) {
  if (!file) return "Please select a file.";
  if (!/\.(html|htm)$/i.test(file.name)) return "File must be .html or .htm";
  if (parseFloat(journal?.startingCapital) <= 0)
    return "This journal has no starting capital set. Update it before importing.";
  return null;
}

export function MT5ImportDialog({ open, onClose, journal, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function reset() {
    setFile(null);
    setUploading(false);
    setResult(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setResult(null);
  }

  function clearFile(e) {
    e.stopPropagation();
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleImport() {
    const validationError = validateFile(file, journal);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const data = await importMT5(journal.id, file);
      setResult(data);
      if (data.trades_created > 0) {
        onSuccess?.();
      }
    } catch (err) {
      setError(
        err.response?.data?.error ??
          err.response?.data?.detail ??
          err.message ??
          "Import failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  const capitalGuard =
    journal != null && parseFloat(journal.startingCapital) <= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import MT5 Report</DialogTitle>
          <DialogDescription>
            Upload an MT5 HTML account statement to import trades into this
            journal.
          </DialogDescription>
        </DialogHeader>

        {/* Starting-capital guard */}
        {capitalGuard && (
          <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400 ring-1 ring-amber-500/20">
            This journal has no starting capital set. Update the journal
            settings before importing.
          </div>
        )}

        {/* Success summary */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="size-4 shrink-0" />
              <span className="text-sm font-medium">
                {result.trades_created === 0
                  ? `No new trades — all ${result.trades_skipped} trades were already in your journal.`
                  : "Import complete"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-zinc-900 p-3 text-sm">
              <span className="text-zinc-500">Trades created</span>
              <span className="font-medium text-zinc-200">
                {result.trades_created}
              </span>
              <span className="text-zinc-500">Duplicates skipped</span>
              <span className="font-medium text-zinc-200">
                {result.trades_skipped}
              </span>
              {result.trades_failed > 0 && (
                <>
                  <span className="text-zinc-500">Failed rows</span>
                  <span className="font-medium text-amber-400">
                    {result.trades_failed}
                  </span>
                </>
              )}
            </div>

            {result.trades_failed > 0 && result.failures?.length > 0 && (
              <div className="rounded-lg bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/20">
                <p className="mb-1.5 text-xs font-medium text-amber-400">
                  Partial failures
                </p>
                <ul className="space-y-0.5">
                  {result.failures.map((f, i) => (
                    <li key={i} className="text-xs text-zinc-400">
                      Row {f.external_id}: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* File picker — hidden after success */}
        {!result && (
          <div className="space-y-3">
            <div
              className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
                file
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={uploading || capitalGuard}
              />
              <Upload className="size-5 text-zinc-500" />
              {file ? (
                <div className="flex items-center gap-2">
                  <span className="max-w-[240px] truncate text-sm text-zinc-300">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-zinc-500 hover:text-zinc-300"
                    aria-label="Remove file"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Click to select an{" "}
                  <span className="text-zinc-300">.html</span> or{" "}
                  <span className="text-zinc-300">.htm</span> file
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || uploading || capitalGuard}
              >
                {uploading ? "Importing…" : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
