import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border text-[13px] font-medium leading-none tracking-[-0.01em] outline-none select-none transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary/50 bg-primary text-primary-foreground shadow-sm hover:border-primary hover:bg-primary/90 active:bg-primary/80",
        outline:
          "border-border bg-card text-foreground hover:border-zinc-600 hover:bg-secondary aria-expanded:bg-secondary",
        secondary: "border-transparent bg-secondary text-foreground hover:bg-zinc-700/60",
        ghost:
          "border-transparent text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive hover:border-destructive/40 hover:bg-destructive/20",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5",
        xs: "h-6 gap-1 px-2 text-[11px] [&_svg]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg]:size-3",
        "icon-sm": "size-8 [&_svg]:size-3.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { Button, buttonVariants };
