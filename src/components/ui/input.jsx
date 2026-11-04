import { cn } from "@/lib/utils";
function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input/80 bg-background/50 px-3 py-2 text-[13px] text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-500 hover:border-zinc-600 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/15 file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:text-xs file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export { Input };
