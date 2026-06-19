import { z } from "zod";

export const journalSchema = z.object({
  name: z.string().min(1, "Journal name is required"),
  journalType: z.enum(["trading", "backtest"], {
    required_error: "Journal type is required",
  }),
  startingCapital: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be a positive number"),
  currency: z.string().min(1, "Currency is required"),
  breakEvenMethod: z.enum(["ratio", "profit"], {
    required_error: "Break-even method is required",
  }),
});
