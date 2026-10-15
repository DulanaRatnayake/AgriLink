"use client";

import { useCallback } from "react";
import { useAppStore } from "../state/app-store";
import { translate, type TranslationKey } from "./translations";

export function useTranslation() {
  const { language } = useAppStore();
  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );
  return { t, language };
}
