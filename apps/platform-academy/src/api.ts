import type {
  Course,
  Lesson,
  PlatformAcademyCatalog,
  PlatformAcademyRoadmap,
  PlatformActivity,
  PlatformActivityInput,
  PlatformInterviewPrepIndex,
  PlatformLab,
  PlatformLearnerStateExport,
  PlatformLearnerStateImportResult,
  PlatformLabSubmission,
  PlatformLabSubmissionInput,
  PlatformResources,
  Progress,
  UserDashboard
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const USE_STATIC_API_FALLBACK = API_BASE.trim() === "";
const STATIC_API_BASE = "/static-api";

class NonJsonResponseError extends Error {
  constructor(path: string, contentType: string, preview: string) {
    const responseKind = contentType || "non-JSON";
    const suffix = preview ? `: ${preview}` : "";
    super(`API returned ${responseKind} for ${path}${suffix}`);
    this.name = "NonJsonResponseError";
  }
}

function staticJsonPath(path: string): string | null {
  const [pathname] = path.split("?");
  const exactRoutes: Record<string, string> = {
    "/api/platform-academy/catalog": `${STATIC_API_BASE}/platform-academy-catalog.json`,
    "/api/platform-academy/roadmap": `${STATIC_API_BASE}/platform-academy-roadmap.json`,
    "/api/platform-academy/resources": `${STATIC_API_BASE}/platform-academy-resources.json`,
    "/api/platform-academy/interview-prep": `${STATIC_API_BASE}/platform-academy-interview-prep.json`,
    "/api/platform-academy/labs": `${STATIC_API_BASE}/platform-academy-labs.json`
  };
  if (exactRoutes[pathname]) return exactRoutes[pathname];

  const lessonMatch = pathname.match(/^\/api\/lessons\/([^/]+)$/);
  if (lessonMatch) return `${STATIC_API_BASE}/lessons/${encodeURIComponent(decodeURIComponent(lessonMatch[1]))}.json`;

  return null;
}

function staticAssetPath(path: string): string | null {
  const [pathname] = path.split("?");
  const labPacketMatch = pathname.match(/^\/api\/platform-academy\/labs\/([^/]+)\/packet$/);
  if (labPacketMatch) return `${STATIC_API_BASE}/labs/${encodeURIComponent(decodeURIComponent(labPacketMatch[1]))}/packet.md`;

  const workspaceBundleMatch = pathname.match(/^\/api\/platform-academy\/labs\/([^/]+)\/workspace-bundle$/);
  if (workspaceBundleMatch) return `${STATIC_API_BASE}/labs/${encodeURIComponent(decodeURIComponent(workspaceBundleMatch[1]))}/workspace-bundle.zip`;

  return null;
}

function fallbackUrl(apiPath: string): string {
  const assetPath = USE_STATIC_API_FALLBACK ? staticAssetPath(apiPath) : null;
  return assetPath ?? `${API_BASE}${apiPath}`;
}

function decodeRouteValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function emptyDashboard(userId: string): UserDashboard {
  return {
    user_id: userId,
    xp: { total: 0, lesson_completion_xp: 0, quiz_xp: 0, review_xp: 0 },
    daily_goal: { target_xp: 50, earned_xp_today: 0, met: false },
    streak: { current_days: 0, freeze_available: true, last_activity_date: null },
    achievements: [],
    completed_lessons: 0,
    due_reviews: 0
  };
}

function emptyLabSubmission(labSlug: string, userId: string): PlatformLabSubmission {
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    user_id: userId,
    lab_slug: labSlug,
    worksheet_answers: {},
    checked_items: {},
    status: "in_progress",
    score: 0,
    completed_checks: 0,
    total_checks: 0,
    answered_prompts: 0,
    total_prompts: 0,
    evidence_terms: [],
    rubric_feedback: [],
    created_at: now,
    updated_at: now
  };
}

function localGetFallback<T>(path: string): T | undefined {
  const [pathname, queryString = ""] = path.split("?");

  const progressMatch = pathname.match(/^\/api\/progress\/([^/]+)$/);
  if (progressMatch) return [] as T;

  const activityMatch = pathname.match(/^\/api\/platform-academy\/activity\/([^/]+)$/);
  if (activityMatch) return [] as T;

  const labSubmissionsMatch = pathname.match(/^\/api\/platform-academy\/lab-submissions\/([^/]+)$/);
  if (labSubmissionsMatch) return [] as T;

  const labSubmissionMatch = pathname.match(/^\/api\/platform-academy\/labs\/([^/]+)\/submission\/([^/]+)$/);
  if (labSubmissionMatch) {
    return emptyLabSubmission(decodeRouteValue(labSubmissionMatch[1]), decodeRouteValue(labSubmissionMatch[2])) as T;
  }

  const dashboardMatch = pathname.match(/^\/api\/users\/([^/]+)\/dashboard$/);
  if (dashboardMatch) {
    void queryString;
    return emptyDashboard(decodeRouteValue(dashboardMatch[1])) as T;
  }

  const stateExportMatch = pathname.match(/^\/api\/platform-academy\/state\/([^/]+)\/export$/);
  if (stateExportMatch) {
    return {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      source_user_id: decodeRouteValue(stateExportMatch[1]),
      progress: [],
      activity: [],
      lab_submissions: []
    } as T;
  }

  return undefined;
}

async function parseJsonResponse<T>(response: Response, path: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = JSON.parse(text) as { detail?: unknown };
      detail = typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail);
    } catch {
      detail = text.trim() || response.statusText;
    }
    throw new Error(`${response.status} ${detail}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const preview = text.trim().replace(/\s+/g, " ").slice(0, 80);
    throw new NonJsonResponseError(path, contentType, preview || String(error));
  }
}

async function fetchJson<T>(url: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  return parseJsonResponse<T>(response, path);
}

async function getJson<T>(path: string): Promise<T> {
  try {
    return await fetchJson<T>(`${API_BASE}${path}`, path, { cache: "no-store" });
  } catch (error) {
    if (!USE_STATIC_API_FALLBACK) throw error;

    const localFallback = localGetFallback<T>(path);
    if (localFallback !== undefined) return localFallback;

    const staticPath = staticJsonPath(path);
    if (!staticPath) throw error;
    return fetchJson<T>(staticPath, path, { cache: "force-cache" });
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await fetchJson<T>(`${API_BASE}${path}`, path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    if (!USE_STATIC_API_FALLBACK) throw error;

    const now = new Date().toISOString();
    const payload = body as Record<string, unknown>;
    if (path === "/api/progress") {
      return { id: Date.now(), updated_at: now, ...payload } as T;
    }
    if (path === "/api/platform-academy/activity") {
      return { id: Date.now(), updated_at: now, ...payload } as T;
    }
    const labSubmissionMatch = path.match(/^\/api\/platform-academy\/labs\/([^/]+)\/submission$/);
    if (labSubmissionMatch) {
      const worksheetAnswers = (payload.worksheet_answers ?? {}) as Record<string, string>;
      const checkedItems = (payload.checked_items ?? {}) as Record<string, boolean>;
      const completedChecks = Object.values(checkedItems).filter(Boolean).length;
      const answeredPrompts = Object.values(worksheetAnswers).filter((value) => String(value).trim()).length;
      return {
        id: Date.now(),
        user_id: String(payload.user_id ?? "demo-user"),
        lab_slug: decodeRouteValue(labSubmissionMatch[1]),
        worksheet_answers: worksheetAnswers,
        checked_items: checkedItems,
        status: (payload.status as PlatformLabSubmission["status"]) ?? "in_progress",
        score: completedChecks + answeredPrompts > 0 ? 25 : 0,
        completed_checks: completedChecks,
        total_checks: Math.max(completedChecks, Object.keys(checkedItems).length),
        answered_prompts: answeredPrompts,
        total_prompts: Math.max(answeredPrompts, Object.keys(worksheetAnswers).length),
        evidence_terms: [],
        rubric_feedback: [],
        created_at: now,
        updated_at: now
      } as T;
    }
    if (path === "/api/platform-academy/state/import") {
      return {
        user_id: String(payload.target_user_id ?? "demo-user"),
        progress_imported: 0,
        activity_imported: 0,
        lab_submissions_imported: 0
      } as T;
    }
    throw error;
  }
}

export const api = {
  catalog: () => getJson<PlatformAcademyCatalog>("/api/platform-academy/catalog"),
  roadmap: () => getJson<PlatformAcademyRoadmap>("/api/platform-academy/roadmap"),
  resources: () => getJson<PlatformResources>("/api/platform-academy/resources"),
  interviewPrep: () => getJson<PlatformInterviewPrepIndex>("/api/platform-academy/interview-prep"),
  labs: () => getJson<PlatformLab[]>("/api/platform-academy/labs"),
  labPacketUrl: (slug: string) => fallbackUrl(`/api/platform-academy/labs/${encodeURIComponent(slug)}/packet`),
  labBundleUrl: (slug: string) => `${API_BASE}/api/platform-academy/labs/${encodeURIComponent(slug)}/bundle`,
  labWorkspaceBundleUrl: (slug: string) => fallbackUrl(`/api/platform-academy/labs/${encodeURIComponent(slug)}/workspace-bundle`),
  course: (id: string) => getJson<Course>(`/api/courses/${id}`),
  lesson: (id: string) => getJson<Lesson>(`/api/lessons/${id}`),
  progress: (userId = "demo-user") => getJson<Progress[]>(`/api/progress/${encodeURIComponent(userId)}`),
  activity: (userId = "demo-user") => getJson<PlatformActivity[]>(`/api/platform-academy/activity/${encodeURIComponent(userId)}`),
  labSubmissions: (userId = "demo-user") => getJson<PlatformLabSubmission[]>(`/api/platform-academy/lab-submissions/${encodeURIComponent(userId)}`),
  labSubmission: (slug: string, userId = "demo-user") =>
    getJson<PlatformLabSubmission>(`/api/platform-academy/labs/${encodeURIComponent(slug)}/submission/${encodeURIComponent(userId)}`),
  dashboard: (userId = "demo-user", domain = "all") =>
    getJson<UserDashboard>(`/api/users/${encodeURIComponent(userId)}/dashboard?domain=${encodeURIComponent(domain)}`),
  saveProgress: (lessonId: number, completed: boolean, score: number, userId = "demo-user") =>
    postJson<Progress>("/api/progress", { user_id: userId, lesson_id: lessonId, completed, score }),
  saveActivity: (activity: PlatformActivityInput, userId = "demo-user") =>
    postJson<PlatformActivity>("/api/platform-academy/activity", { user_id: userId, state: "completed", ...activity }),
  saveLabSubmission: (slug: string, submission: PlatformLabSubmissionInput, userId = "demo-user") =>
    postJson<PlatformLabSubmission>(`/api/platform-academy/labs/${encodeURIComponent(slug)}/submission`, {
      user_id: userId,
      status: "in_progress",
      ...submission
    }),
  exportLearnerState: (userId = "demo-user") => getJson<PlatformLearnerStateExport>(`/api/platform-academy/state/${encodeURIComponent(userId)}/export`),
  importLearnerState: (state: PlatformLearnerStateExport, userId = "demo-user") =>
    postJson<PlatformLearnerStateImportResult>("/api/platform-academy/state/import", { target_user_id: userId, state })
};
