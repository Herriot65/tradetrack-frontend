import { z } from "zod";
import { parseTradeDateTime } from "../lib/tradeDateTime.js";

const numOrNull = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().nullable().optional()
);

export const tradeSchema = z.object({
  asset:                z.string().min(1, "Asset is required"),
  side:                 z.enum(["BUY", "SELL"], { required_error: "Side is required" }),
  entry_datetime:       z.string().min(1, "Entry date/time is required").refine(value => !value || !!parseTradeDateTime(value), "Enter a valid date and time"),
  exit_datetime:        z.string().nullable().optional().refine(value => !value || !!parseTradeDateTime(value), "Enter a valid date and time"),
  risk_percent:         numOrNull,
  pnl_r:                numOrNull,
  commission:           numOrNull,
  swap:                 numOrNull,
  reference_timeframe:   z.string().max(10).nullable().optional(),
  trade_score:           z.preprocess(value => value === "" || value == null ? null : Number(value), z.number().int("Use a whole number").min(0, "Score must be between 0 and 10").max(10, "Score must be between 0 and 10").nullable().optional()),
  opportunity_timeframe: z.string().nullable().optional(),
  entry_timeframe:      z.string().nullable().optional(),
  trend_direction:      z.string().nullable().optional(),
  setup:                z.string().nullable().optional(),
  session:              z.string().nullable().optional(),
  status:               z.enum(["WIN", "LOSS", "BE"]).nullable().optional(),
  emotions:             z.array(z.string()).min(1, "At least one emotion is required"),
  mistakes:             z.array(z.string()),
  notes:                z.string().nullable().optional(),
}).refine(values => {
  const entry = parseTradeDateTime(values.entry_datetime);
  const exit = parseTradeDateTime(values.exit_datetime);
  return !entry || !exit || exit > entry;
}, { path: ["exit_datetime"], message: "Exit date/time must be after entry date/time" });
