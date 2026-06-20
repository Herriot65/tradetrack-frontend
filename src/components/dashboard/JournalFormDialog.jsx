import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/FieldError";
import { FormErrorBanner } from "@/components/forms/FormErrorBanner";
import { journalSchema } from "@/schemas/journalSchema";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"];

const selectClass =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50";

export default function JournalFormDialog({ open, onOpenChange, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      name: "",
      journalType: "trading",
      startingCapital: "",
      currency: "USD",
      breakEvenMethod: "ratio",
      breakEvenValue: "",
    },
  });

  const breakEvenMethod = watch("breakEvenMethod");

  useEffect(() => {
    if (open) reset({
      name: "",
      journalType: "trading",
      startingCapital: "",
      currency: "USD",
      breakEvenMethod: "ratio",
      breakEvenValue: "",
    });
  }, [open, reset]);

  const submit = async (values) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      const message =
        err?.response?.data?.name?.[0] ??
        err?.response?.data?.detail ??
        err.message ??
        "Something went wrong";
      setError("root", { message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Journal</DialogTitle>
          <DialogDescription className="sr-only">
            Configure your new trading journal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {errors.root && <FormErrorBanner message={errors.root.message} />}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="journal-name">Journal Name</Label>
            <Input
              id="journal-name"
              placeholder="e.g. FTMO Challenge, Personal Account"
              autoFocus
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Journal Type */}
          <div className="space-y-1.5">
            <Label htmlFor="journal-type">Journal Type</Label>
            <select
              id="journal-type"
              className={selectClass}
              {...register("journalType")}
            >
              <option value="trading">Trading Journal</option>
              <option value="backtest">Backtest Journal</option>
            </select>
            <FieldError message={errors.journalType?.message} />
          </div>

          {/* Starting Capital + Currency (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="starting-capital">Starting Capital</Label>
              <Input
                id="starting-capital"
                type="number"
                min="0"
                step="any"
                placeholder="10000"
                aria-invalid={!!errors.startingCapital}
                {...register("startingCapital")}
              />
              <FieldError message={errors.startingCapital?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className={selectClass}
                {...register("currency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <FieldError message={errors.currency?.message} />
            </div>
          </div>

          {/* Break-Even Method */}
          <div className="space-y-1.5">
            <Label htmlFor="break-even-method">Break-Even Method</Label>
            <select
              id="break-even-method"
              className={selectClass}
              {...register("breakEvenMethod")}
            >
              <option value="ratio">Ratio Based</option>
              <option value="profit">Profit Based</option>
            </select>
            <FieldError message={errors.breakEvenMethod?.message} />
          </div>

          {/* BE Threshold — label adapts to selected method */}
          <div className="space-y-1.5">
            <Label htmlFor="break-even-value">
              {breakEvenMethod === "profit" ? "BE Threshold (currency)" : "BE Threshold (R)"}
            </Label>
            <Input
              id="break-even-value"
              type="number"
              min="0"
              step="any"
              placeholder={breakEvenMethod === "profit" ? "10" : "0.5"}
              aria-invalid={!!errors.breakEvenValue}
              {...register("breakEvenValue")}
            />
            <FieldError message={errors.breakEvenValue?.message} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create Journal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
