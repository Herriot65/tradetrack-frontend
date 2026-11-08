import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Check, ChevronDown, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useJournal } from "@/journals/useJournal";

import JournalFormDialog from "./JournalFormDialog";

export default function JournalSwitcher({ compact = false }) {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const showingAll = location.pathname === "/dashboard";
  const {
    journals,
    activeJournal,
    selectJournal,
    createJournal,
    deleteJournal,
  } = useJournal();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleCreate = async (payload) => {
    const created = await createJournal(payload);
    navigate(`/journal/${created.id}?tab=overview`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteJournal(activeJournal.id);
      setDeleteOpen(false);
      navigate("/dashboard");
    } catch (err) {
      setDeleteError(err?.response?.data?.detail ?? err.message ?? "Failed to delete journal");
    } finally {
      setDeleting(false);
    }
  };

  if (!activeJournal && journals.length === 0) {
    return (
      <>
        <Button variant="outline" size="sm" aria-label={t("New Journal")} className={cn("min-w-0 shrink", compact && "w-full px-0")} onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" /><span className={cn("truncate", compact && "hidden")}>{t("New Journal")}</span></Button>
        <JournalFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('min-w-0 w-full justify-between gap-2', compact && 'px-0 justify-center')}
            aria-label={t("Switch journal")}
          >
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", compact && "hidden")}>{showingAll ? t("All journals") : activeJournal?.name ?? t("All journals")}</span>
            <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground", compact && "hidden")} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t("Journals")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
            <Check className={cn("size-3.5 shrink-0", showingAll ? "opacity-100" : "opacity-0")} />{t("All journals")}</DropdownMenuItem>
          <DropdownMenuSeparator />

          {journals.map((j) => (
            <DropdownMenuItem
              key={j.id}
              onClick={() => {
                selectJournal(j);
                navigate(`/journal/${j.id}${location.pathname.startsWith("/journal/") ? location.search : "?tab=overview"}`);
              }}
              className="gap-2"
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  !showingAll && activeJournal?.id === j.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{j.name}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />{t("New journal")}</DropdownMenuItem>

          {!showingAll && activeJournal && journals.length > 1 && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-3.5" />{t("Delete this journal")}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <JournalFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete “")}{activeJournal.name}&rdquo;?</DialogTitle>
            <DialogDescription>{t("All trades and analytics in this journal will be permanently deleted. This action cannot be undone.")}</DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>{t("Cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
