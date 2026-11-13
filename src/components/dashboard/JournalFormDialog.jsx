import SelectField from "@/components/ui/select-field";
import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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

export default function JournalFormDialog({ open, onOpenChange, onSubmit }) {
  useLanguage();
  const {
    register,
    handleSubmit,
    reset,
    control,
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

  const breakEvenMethod = useWatch({ control, name: "breakEvenMethod" });

  useEffect(() => {
    if (open)
      reset({
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
          <DialogTitle>{t("New Journal")}</DialogTitle>
          <DialogDescription className="sr-only">{t("Configure your new trading journal.")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {errors.root && <FormErrorBanner message={errors.root.message} />}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="journal-name">{t("Journal Name")}</Label>
            <Input
              id="journal-name"
              placeholder={t("e.g. FTMO Challenge, Personal Account")}
              autoFocus
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Journal Type */}
          <div className="space-y-1.5">
            <Label htmlFor="journal-type">{t("Journal Type")}</Label>
            <Controller name="journalType" control={control} render={({field}) => <SelectField id="journal-type" {...field} onValueChange={field.onChange} allowClear={false} aria-invalid={!!errors.journalType} options={[{value:"trading",label:t("Trading Journal")},{value:"backtest",label:t("Backtest Journal")}]} />} />
            <FieldError message={errors.journalType?.message} />
          </div>

          {/* Starting Capital + Currency (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="starting-capital">{t("Starting Capital")}</Label>
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
              <Label htmlFor="currency">{t("Currency")}</Label>
              <Controller name="currency" control={control} render={({field}) => <SelectField id="currency" {...field} onValueChange={field.onChange} allowClear={false} aria-invalid={!!errors.currency} options={CURRENCIES} />} />
              <FieldError message={errors.currency?.message} />
            </div>
          </div>

          {/* Break-Even Method */}
          <div className="space-y-1.5">
            <Label htmlFor="break-even-method">{t("Break-Even Method")}</Label>
            <Controller name="breakEvenMethod" control={control} render={({field}) => <SelectField id="break-even-method" {...field} onValueChange={field.onChange} allowClear={false} aria-invalid={!!errors.breakEvenMethod} options={[{value:"ratio",label:t("Ratio Based")},{value:"profit",label:t("Profit Based")}]} />} />
            <FieldError message={errors.breakEvenMethod?.message} />
          </div>

          {/* BE Threshold — label adapts to selected method */}
          <div className="space-y-1.5">
            <Label htmlFor="break-even-value">
              {breakEvenMethod === "profit" ? t("BE Threshold (currency)") : t("BE Threshold (R)")}
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
            >{t("Cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Creating…") : t("Create Journal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
