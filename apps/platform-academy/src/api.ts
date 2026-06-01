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
const LOCAL_LAB_SUBMISSIONS_PREFIX = "platform-academy-lab-submissions-v1:";

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

function labSubmissionStorageKey(userId: string) {
  return `${LOCAL_LAB_SUBMISSIONS_PREFIX}${userId}`;
}

function safeRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function safeStringMap(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(safeRecord(value)).map(([key, entryValue]) => [key, typeof entryValue === "string" ? entryValue : String(entryValue ?? "")])
  );
}

function safeBooleanMap(value: unknown): Record<string, boolean> {
  return Object.fromEntries(Object.entries(safeRecord(value)).map(([key, entryValue]) => [key, Boolean(entryValue)]));
}

function labSubmissionFromRecord(value: unknown, userId: string): PlatformLabSubmission | null {
  const record = safeRecord(value);
  if (typeof record.lab_slug !== "string" || !record.lab_slug.trim()) return null;
  const checkedItems = safeBooleanMap(record.checked_items);
  const worksheetAnswers = safeStringMap(record.worksheet_answers);
  const completedChecks =
    typeof record.completed_checks === "number" ? record.completed_checks : Object.values(checkedItems).filter(Boolean).length;
  const answeredPrompts =
    typeof record.answered_prompts === "number" ? record.answered_prompts : Object.values(worksheetAnswers).filter((answer) => answer.trim()).length;
  const base = emptyLabSubmission(record.lab_slug, typeof record.user_id === "string" ? record.user_id : userId);

  return {
    ...base,
    id: typeof record.id === "number" ? record.id : base.id,
    worksheet_answers: worksheetAnswers,
    checked_items: checkedItems,
    status: record.status === "submitted" ? "submitted" : "in_progress",
    score: typeof record.score === "number" ? record.score : completedChecks + answeredPrompts > 0 ? 25 : 0,
    completed_checks: completedChecks,
    total_checks: typeof record.total_checks === "number" ? record.total_checks : Math.max(completedChecks, Object.keys(checkedItems).length),
    answered_prompts: answeredPrompts,
    total_prompts: typeof record.total_prompts === "number" ? record.total_prompts : Math.max(answeredPrompts, Object.keys(worksheetAnswers).length),
    evidence_terms: Array.isArray(record.evidence_terms) ? record.evidence_terms.filter((item): item is string => typeof item === "string") : [],
    rubric_feedback: Array.isArray(record.rubric_feedback) ? (record.rubric_feedback as PlatformLabSubmission["rubric_feedback"]) : [],
    created_at: typeof record.created_at === "string" ? record.created_at : base.created_at,
    updated_at: typeof record.updated_at === "string" ? record.updated_at : base.updated_at
  };
}

function readLocalLabSubmissions(userId: string): PlatformLabSubmission[] {
  try {
    const raw = globalThis.localStorage?.getItem(labSubmissionStorageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map((item) => labSubmissionFromRecord(item, userId)).filter((item): item is PlatformLabSubmission => Boolean(item)) : [];
  } catch {
    return [];
  }
}

function writeLocalLabSubmissions(userId: string, submissions: PlatformLabSubmission[]) {
  try {
    globalThis.localStorage?.setItem(labSubmissionStorageKey(userId), JSON.stringify(submissions));
  } catch {
    // Local fallback persistence is best effort.
  }
}

function persistLocalLabSubmission(saved: PlatformLabSubmission) {
  const current = readLocalLabSubmissions(saved.user_id).filter((submission) => submission.lab_slug !== saved.lab_slug);
  writeLocalLabSubmissions(saved.user_id, [saved, ...current]);
}

function learnerStateLabSubmissions(userId: string) {
  return readLocalLabSubmissions(userId).map((submission) => ({
    lab_slug: submission.lab_slug,
    worksheet_answers: submission.worksheet_answers,
    checked_items: submission.checked_items,
    status: submission.status,
    updated_at: submission.updated_at
  }));
}

function localGetFallback<T>(path: string): T | undefined {
  const [pathname, queryString = ""] = path.split("?");

  const progressMatch = pathname.match(/^\/api\/progress\/([^/]+)$/);
  if (progressMatch) return [] as T;

  const activityMatch = pathname.match(/^\/api\/platform-academy\/activity\/([^/]+)$/);
  if (activityMatch) return [] as T;

  const labSubmissionsMatch = pathname.match(/^\/api\/platform-academy\/lab-submissions\/([^/]+)$/);
  if (labSubmissionsMatch) return readLocalLabSubmissions(decodeRouteValue(labSubmissionsMatch[1])) as T;

  const labSubmissionMatch = pathname.match(/^\/api\/platform-academy\/labs\/([^/]+)\/submission\/([^/]+)$/);
  if (labSubmissionMatch) {
    const labSlug = decodeRouteValue(labSubmissionMatch[1]);
    const userId = decodeRouteValue(labSubmissionMatch[2]);
    return (readLocalLabSubmissions(userId).find((submission) => submission.lab_slug === labSlug) ?? emptyLabSubmission(labSlug, userId)) as T;
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
      lab_submissions: learnerStateLabSubmissions(decodeRouteValue(stateExportMatch[1]))
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
      const saved = {
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
      };
      persistLocalLabSubmission(saved);
      return saved as T;
    }
    if (path === "/api/platform-academy/state/import") {
      const targetUserId = String(payload.target_user_id ?? "demo-user");
      const state = safeRecord(payload.state);
      if (Array.isArray(state.lab_submissions)) {
        writeLocalLabSubmissions(
          targetUserId,
          state.lab_submissions
            .map((submission) => labSubmissionFromRecord({ ...(submission as Record<string, unknown>), user_id: targetUserId }, targetUserId))
            .filter((submission): submission is PlatformLabSubmission => Boolean(submission))
        );
      }
      return {
        user_id: targetUserId,
        progress_imported: 0,
        activity_imported: 0,
        lab_submissions_imported: Array.isArray(state.lab_submissions) ? state.lab_submissions.length : 0
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
