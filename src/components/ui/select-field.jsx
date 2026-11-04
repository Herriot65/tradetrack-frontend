import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY = "__not_set__";

export default function SelectField({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  allowClear = true,
  clearLabel = "Not set",
  label,
  className,
  ...triggerProps
}) {
  const selected = value == null ? "" : String(value);
  return (
    <SelectPrimitive.Root
      value={selected || EMPTY}
      onValueChange={(next) => onValueChange(next === EMPTY ? "" : next)}
    >
      <SelectPrimitive.Trigger
        aria-label={label}
        {...triggerProps}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-background/50 px-3 text-left text-[13px] text-zinc-100 outline-none transition-colors hover:border-zinc-600 focus-visible:ring-2 focus-visible:border-primary/60 focus-visible:ring-primary/15 disabled:opacity-50 [&>span:first-child]:truncate",
          className,
        )}
      >
        <SelectPrimitive.Value>
          {selected ? (
            (options.find(
              (option) => String(typeof option === "object" ? option.value : option) === selected,
            )?.label ?? selected)
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon>
          <ChevronDown className="size-3.5 shrink-0 text-zinc-500" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className="z-[80] max-h-[min(280px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1 text-[13px] text-zinc-200 shadow-xl"
        >
          <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-zinc-500">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>
            {(allowClear ? [{ value: EMPTY, label: clearLabel }, ...options] : options).map(
              (option) => {
                const item = typeof option === "object" ? option : { value: option, label: option };
                return (
                  <SelectPrimitive.Item
                    key={item.value}
                    value={String(item.value)}
                    disabled={item.disabled}
                    className="relative flex min-h-9 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                  >
                    <SelectPrimitive.ItemIndicator className="absolute left-2">
                      <Check className="size-3.5" />
                    </SelectPrimitive.ItemIndicator>
                    <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                );
              },
            )}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-zinc-500">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
