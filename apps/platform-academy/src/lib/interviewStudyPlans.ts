import type { PlatformInterviewStudyPlan } from "../types";

export type InterviewStudyPlan = PlatformInterviewStudyPlan;

const INTERVIEW_STUDY_PLAN_STORAGE_KEY = "platform-academy-interview-study-plans-v1";

export const STUDY_PLANS_RESTORED_EVENT = "platform-academy-study-plans-restored";

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function readInterviewStudyPlans(): InterviewStudyPlan[] {
  try {
    const raw = globalThis.localStorage?.getItem(INTERVIEW_STUDY_PLAN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const plan = item as Partial<InterviewStudyPlan>;
        const questionIds = Array.isArray(plan.questionIds) ? plan.questionIds.filter((questionId): questionId is string => typeof questionId === "string") : [];
        if (typeof plan.id !== "string" || typeof plan.name !== "string") return null;
        return {
          id: plan.id,
          name: plan.name.trim() || "Interview study plan",
          questionIds: uniqueStrings(questionIds),
          createdAt: typeof plan.createdAt === "string" ? plan.createdAt : new Date().toISOString(),
          updatedAt: typeof plan.updatedAt === "string" ? plan.updatedAt : new Date().toISOString()
        };
      })
      .filter((plan): plan is InterviewStudyPlan => Boolean(plan))
      .slice(0, 25);
  } catch {
    return [];
  }
}

export function writeInterviewStudyPlans(plans: InterviewStudyPlan[]) {
  try {
    globalThis.localStorage?.setItem(INTERVIEW_STUDY_PLAN_STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // Local storage can be unavailable in private browsing modes.
  }
}

export function makeInterviewStudyPlanId() {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
