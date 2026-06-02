import type {
  PlatformAcademyCatalog,
  PlatformAcademyRoadmap,
  PlatformActivity,
  PlatformInterviewPrepIndex,
  PlatformLabSubmission,
  PlatformResources,
  Progress,
  UserDashboard
} from "../types";

export type AcademyData = {
  catalog: PlatformAcademyCatalog;
  roadmap: PlatformAcademyRoadmap;
  resources: PlatformResources;
  resourcesLoaded: boolean;
  interviewPrep: PlatformInterviewPrepIndex;
  interviewPrepLoaded: boolean;
  progress: Progress[];
  activity: PlatformActivity[];
  labSubmissions: PlatformLabSubmission[];
  dashboard: UserDashboard;
};

export type AcademyCoreData = Omit<AcademyData, "resources" | "resourcesLoaded" | "interviewPrep" | "interviewPrepLoaded">;
