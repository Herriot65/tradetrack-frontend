import { useSyncExternalStore } from "react";
import { getLanguage, setLanguage, subscribeLanguage, translate } from "./language.js";

export function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, () => "en-US");
  return { language, setLanguage, t: translate };
}
