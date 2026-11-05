import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Layers, Pencil, Plus, Trash2 } from "lucide-react";

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
import { useWorkspace } from "@/workspaces/useWorkspace";

import WorkspaceFormDialog from "./WorkspaceFormDialog";

export default function WorkspaceSwitcher() {
  useLanguage();
  const navigate = useNavigate();
  const {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useWorkspace();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWorkspace(activeWorkspace.id);
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(
        err?.response?.data?.detail ?? err.message ?? "Failed to delete workspace"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />{t("Create Workspace")}</Button>

        <WorkspaceFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title={t("Create Workspace")}
          onSubmit={async (name) => {
            const created = await createWorkspace({ name });
            navigate(`/workspace/${created.id}`);
          }}
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
            className="max-w-[220px] gap-1.5"
            aria-label={t("Switch workspace")}
          >
            <Layers className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{activeWorkspace.name}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t("Workspaces")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => {
                selectWorkspace(ws);
                navigate(`/workspace/${ws.id}`);
              }}
              className="gap-2"
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  activeWorkspace.id === ws.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{ws.name}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil className="size-3.5" />{t("Rename workspace")}</DropdownMenuItem>

          {workspaces.length > 1 && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-3.5" />{t("Delete workspace")}</DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />{t("New workspace")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("New Workspace")}
        onSubmit={async (name) => {
          const created = await createWorkspace({ name });
          navigate(`/workspace/${created.id}`);
        }}
      />

      <WorkspaceFormDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={t("Rename Workspace")}
        defaultName={activeWorkspace.name}
        onSubmit={(name) => renameWorkspace(activeWorkspace.id, name)}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Delete “")}{activeWorkspace.name}&rdquo;?</DialogTitle>
            <DialogDescription>{t("All trades and analytics in this workspace will be permanently deleted. This action cannot be undone.")}</DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >{t("Cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("Deleting…") : t("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
