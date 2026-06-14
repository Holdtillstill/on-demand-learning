export type ReferenceLevel = "Fresher" | "Intermediate" | "Advanced";

export type ReferenceDashboardProgress = {
  currentLesson: {
    courseTitle: string;
    lessonTitle: string;
    lessonNum: number;
    completedCount: number;
    total: number;
    progressPct: number;
    lessonId: number;
  };
  currentLabSlug?: string;
  currentLabLabel: string;
  currentLabStateLabel: string;
  currentLabCompletedSteps: number;
  currentLabTotalSteps?: number;
  completedLessons: number;
  completedLabs: number;
  savedResources: number;
  practicedQuestions: number;
  readinessScore: number;
  readinessMessage: string;
  levelCompleted: Record<ReferenceLevel, number>;
  levelTotals: Record<ReferenceLevel, number>;
  courseProgressBySlug: Record<string, number>;
  earnedBadgeIds: string[];
};

export const defaultReferenceDashboardProgress: ReferenceDashboardProgress = {
  currentLesson: {
    courseTitle: "Kubernetes Networking Deep Dive",
    lessonTitle: "Network Policy Enforcement Patterns",
    lessonNum: 3,
    completedCount: 3,
    total: 4,
    progressPct: 60,
    lessonId: 7
  },
  currentLabLabel: "Lab In Progress",
  currentLabStateLabel: "In Progress",
  currentLabCompletedSteps: 0,
  completedLessons: 7,
  completedLabs: 1,
  savedResources: 12,
  practicedQuestions: 28,
  readinessScore: 34,
  readinessMessage: "Complete 3 more labs and 2 interview packs to reach 50.",
  levelCompleted: {
    Fresher: 1,
    Intermediate: 0,
    Advanced: 0
  },
  levelTotals: {
    Fresher: 6,
    Intermediate: 6,
    Advanced: 9
  },
  courseProgressBySlug: {},
  earnedBadgeIds: ["k8s", "eks"]
};
