import { labs } from "./v1/data";

export const REFERENCE_PROGRESS_EVENT = "platform-academy-reference-progress";
export const INTERVIEW_STATE_KEY = "platform-academy-v2-interview-state";
export const LAB_STATE_PREFIX = "platform-academy-v2-lab:";

export type ReferenceProgressSnapshot = {
  submittedLabSlugs: string[];
  practicedQuestionIds: number[];
};

type StoredLabState = {
  submitted?: boolean;
};

type StoredInterviewState = {
  practicedIds?: number[];
};

export function labStateKey(slug: string) {
  return `${LAB_STATE_PREFIX}${slug}`;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function notifyReferenceProgressChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REFERENCE_PROGRESS_EVENT));
}

export function readReferenceProgressSnapshot(): ReferenceProgressSnapshot {
  if (typeof window === "undefined") {
    return { submittedLabSlugs: [], practicedQuestionIds: [] };
  }

  const submittedLabSlugs = labs
    .filter((lab) => readJson<StoredLabState>(labStateKey(lab.slug))?.submitted === true)
    .map((lab) => lab.slug);
  const interviewState = readJson<StoredInterviewState>(INTERVIEW_STATE_KEY);
  const practicedQuestionIds = Array.from(
    new Set((interviewState?.practicedIds ?? []).filter((id): id is number => Number.isInteger(id) && id > 0))
  );

  return { submittedLabSlugs, practicedQuestionIds };
}

export function clearReferenceProgressStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(INTERVIEW_STATE_KEY);
    for (const lab of labs) window.localStorage.removeItem(labStateKey(lab.slug));
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(LAB_STATE_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Reset should keep moving even when browser storage is restricted.
  }
  notifyReferenceProgressChanged();
}
