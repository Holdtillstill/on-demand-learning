import type {
  Course,
  Lesson,
  PlatformAcademyCatalog,
  PlatformAcademyRoadmap,
  PlatformActivity,
  PlatformActivityInput,
  PlatformInterviewPrepIndex,
  PlatformLab,
  PlatformResources,
  Progress,
  UserDashboard
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      detail = typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail);
    } catch {
      detail = response.statusText;
    }
    throw new Error(`${response.status} ${detail}`);
  }
  return response.json();
}

export const api = {
  catalog: () => getJson<PlatformAcademyCatalog>("/api/platform-academy/catalog"),
  roadmap: () => getJson<PlatformAcademyRoadmap>("/api/platform-academy/roadmap"),
  resources: () => getJson<PlatformResources>("/api/platform-academy/resources"),
  interviewPrep: () => getJson<PlatformInterviewPrepIndex>("/api/platform-academy/interview-prep"),
  labs: () => getJson<PlatformLab[]>("/api/platform-academy/labs"),
  course: (id: string) => getJson<Course>(`/api/courses/${id}`),
  lesson: (id: string) => getJson<Lesson>(`/api/lessons/${id}`),
  progress: (userId = "demo-user") => getJson<Progress[]>(`/api/progress/${encodeURIComponent(userId)}`),
  activity: (userId = "demo-user") => getJson<PlatformActivity[]>(`/api/platform-academy/activity/${encodeURIComponent(userId)}`),
  dashboard: (userId = "demo-user", domain = "all") =>
    getJson<UserDashboard>(`/api/users/${encodeURIComponent(userId)}/dashboard?domain=${encodeURIComponent(domain)}`),
  saveProgress: (lessonId: number, completed: boolean, score: number, userId = "demo-user") =>
    postJson<Progress>("/api/progress", { user_id: userId, lesson_id: lessonId, completed, score }),
  saveActivity: (activity: PlatformActivityInput, userId = "demo-user") =>
    postJson<PlatformActivity>("/api/platform-academy/activity", { user_id: userId, state: "completed", ...activity })
};
