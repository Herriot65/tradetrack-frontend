import { useContext } from "react";
import { JournalContext } from "./JournalContext";

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside JournalProvider");
  return ctx;
}
