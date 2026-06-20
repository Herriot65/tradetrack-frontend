import { z } from "zod";

const numOrNull = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().nullable().optional()
);

export const tradeSchema = z.object({
  asset:                z.string().min(1, "Asset is required"),
  side:                 z.enum(["BUY", "SELL"], { required_error: "Side is required" }),
  entry_datetime:       z.string().min(1, "Entry date/time is required"),
  exit_datetime:        z.string().nullable().optional(),
  risk_percent:         numOrNull,
  pnl_r:                numOrNull,
  commission:           numOrNull,
  swap:                 numOrNull,
  opportunity_timeframe: z.string().nullable().optional(),
  entry_timeframe:      z.string().nullable().optional(),
  trend_direction:      z.string().nullable().optional(),
  setup:                z.string().nullable().optional(),
  session:              z.string().nullable().optional(),
  status:               z.enum(["WIN", "LOSS", "BE", "OPEN"]).nullable().optional(),
  emotions:             z.array(z.string()).min(1, "At least one emotion is required"),
  mistakes:             z.array(z.string()),
  notes:                z.string().nullable().optional(),
});
