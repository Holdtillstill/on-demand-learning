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
const LOCAL_PROGRESS_PREFIX = "platform-academy-progress-v1:";
const LOCAL_ACTIVITY_PREFIX = "platform-academy-activity-v1:";
const LOCAL_LAB_SUBMISSIONS_PREFIX = "platform-academy-lab-submissions-v1:";
const LAB_FEEDBACK_STOPWORDS = new Set([
  "and",
  "are",
  "before",
  "check",
  "checks",
  "command",
  "commands",
  "evidence",
  "expected",
  "for",
  "from",
  "lab",
  "labs",
  "mark",
  "notes",
  "run",
  "should",
  "step",
  "steps",
  "that",
  "the",
  "this",
  "use",
  "uses",
  "using",
  "validation",
  "when",
  "with",
  "workflow"
]);

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

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function progressFromRecord(value: unknown, userId: string): Progress | null {
  const record = safeRecord(value);
  const lessonId = safeNumber(record.lesson_id, Number.NaN);
  if (!Number.isInteger(lessonId)) return null;
  return {
    id: safeNumber(record.id, Date.now()),
    user_id: typeof record.user_id === "string" ? record.user_id : userId,
    lesson_id: lessonId,
    completed: Boolean(record.completed),
    score: safeNumber(record.score, 0),
    updated_at: typeof record.updated_at === "string" ? record.updated_at : new Date().toISOString()
  };
}

function activityFromRecord(value: unknown, userId: string): PlatformActivity | null {
  const record = safeRecord(value);
  if (typeof record.target_type !== "string" || typeof record.target_id !== "string") return null;
  return {
    id: safeNumber(record.id, Date.now()),
    user_id: typeof record.user_id === "string" ? record.user_id : userId,
    target_type: record.target_type,
    target_id: record.target_id,
    state: typeof record.state === "string" ? record.state : "completed",
    updated_at: typeof record.updated_at === "string" ? record.updated_at : new Date().toISOString()
  };
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

function localListStorageKey(prefix: string, userId: string) {
  return `${prefix}${userId}`;
}

function readLocalList<T>(prefix: string, userId: string, parser: (value: unknown, userId: string) => T | null): T[] {
  try {
    const raw = globalThis.localStorage?.getItem(localListStorageKey(prefix, userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map((item) => parser(item, userId)).filter((item): item is T => Boolean(item)) : [];
  } catch {
    return [];
  }
}

function writeLocalList<T>(prefix: string, userId: string, records: T[]) {
  try {
    globalThis.localStorage?.setItem(localListStorageKey(prefix, userId), JSON.stringify(records));
  } catch {
    // Browser-local persistence is best effort.
  }
}

function readLocalProgress(userId: string): Progress[] {
  return readLocalList(LOCAL_PROGRESS_PREFIX, userId, progressFromRecord);
}

function writeLocalProgress(userId: string, progress: Progress[]) {
  writeLocalList(LOCAL_PROGRESS_PREFIX, userId, progress);
}

function persistLocalProgress(saved: Progress) {
  const current = readLocalProgress(saved.user_id).filter((item) => item.lesson_id !== saved.lesson_id);
  writeLocalProgress(saved.user_id, [saved, ...current]);
}

function readLocalActivity(userId: string): PlatformActivity[] {
  return readLocalList(LOCAL_ACTIVITY_PREFIX, userId, activityFromRecord);
}

function writeLocalActivity(userId: string, activity: PlatformActivity[]) {
  writeLocalList(LOCAL_ACTIVITY_PREFIX, userId, activity);
}

function persistLocalActivity(saved: PlatformActivity) {
  const current = readLocalActivity(saved.user_id).filter((item) => item.target_type !== saved.target_type || item.target_id !== saved.target_id);
  writeLocalActivity(saved.user_id, [saved, ...current]);
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

function normalizedLabFeedbackText(value: string) {
  return value.toLowerCase().replace(/_/g, "-");
}

function labFeedbackSourceStrings(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(labFeedbackSourceStrings);
  if (typeof value === "object") return Object.values(value).flatMap(labFeedbackSourceStrings);
  return [String(value)];
}

function labFeedbackTerms(lab: PlatformLab): string[] {
  const sources = [
    lab.scenario,
    lab.skills,
    lab.expected_evidence,
    lab.validation_commands,
    lab.commands,
    lab.worksheet_prompts,
    lab.rubric,
    lab.validation_checks,
    lab.learner_artifact_paths,
    lab.artifact_paths
  ].flatMap(labFeedbackSourceStrings);
  const terms = new Set<string>();
  for (const source of sources) {
    for (const match of source.toLowerCase().matchAll(/[a-zA-Z0-9][a-zA-Z0-9./:_=-]{2,}/g)) {
      const token = match[0].replace(/^[./:_=-]+|[./:_=-]+$/g, "");
      if (token && (token.length >= 4 || ["app", "pod", "svc"].includes(token)) && !LAB_FEEDBACK_STOPWORDS.has(token)) {
        terms.add(token);
      }
    }
  }
  return Array.from(terms).sort((left, right) => right.length - left.length || left.localeCompare(right));
}

function labTrackedCheckIds(lab: PlatformLab) {
  return new Set([
    ...(lab.worksheet_prompts ?? []).map((_, index) => `worksheet-${index}`),
    ...(lab.validation_checks ?? []).map((_, index) => `validation-${index}`)
  ]);
}

function labAnsweredPromptCount(lab: PlatformLab, worksheetAnswers: Record<string, string>) {
  return (lab.worksheet_prompts ?? []).filter((_, index) => worksheetAnswers[`worksheet-${index}`]?.trim()).length;
}

function labCompletedCheckCount(lab: PlatformLab, checkedItems: Record<string, boolean>) {
  return Array.from(labTrackedCheckIds(lab)).filter((itemId) => checkedItems[itemId]).length;
}

function localLabFeedback(lab: PlatformLab, checkedItems: Record<string, boolean>, worksheetAnswers: Record<string, string>) {
  const rubricItems = lab.rubric ?? [];
  const validationItems = lab.validation_checks ?? [];
  const answerText = Object.values(worksheetAnswers)
    .filter((value) => value.trim())
    .join("\n");
  const normalizedAnswer = normalizedLabFeedbackText(answerText);
  const answeredPrompts = labAnsweredPromptCount(lab, worksheetAnswers);
  const completedValidation = validationItems.filter((_, index) => checkedItems[`validation-${index}`]).length;
  const completedChecks = labCompletedCheckCount(lab, checkedItems);
  const matchedTerms = labFeedbackTerms(lab).filter((term) => normalizedAnswer.includes(term));
  const hasAction = ["apply", "block", "cleanup", "decision", "escalate", "fix", "fixed", "owner", "risk", "rollback", "validate"].some((term) =>
    normalizedAnswer.includes(term)
  );
  const hasSafety = ["local", "sandbox", "dry-run", "no-cluster", "cleanup", "shared", "production"].some((term) => normalizedAnswer.includes(term));

  const statusFeedback = (index: number): { status: string; feedback: string; evidence_terms: string[] } => {
    if (index === 0) {
      if (answeredPrompts === 0) return { status: "missing", feedback: "Add a note that names the starting state, scope, or safety boundary.", evidence_terms: [] };
      if (hasSafety || answerText.length >= 80) {
        return { status: "strong", feedback: "Starting state is documented with enough context to guide a safe run.", evidence_terms: matchedTerms.slice(0, 4) };
      }
      return {
        status: "passes",
        feedback: "Starting state is present; add scope or safety boundary detail for a stronger note.",
        evidence_terms: matchedTerms.slice(0, 3)
      };
    }
    if (index === 1) {
      if (matchedTerms.length >= 4) {
        return { status: "strong", feedback: "The note names multiple lab-specific evidence terms.", evidence_terms: matchedTerms.slice(0, 6) };
      }
      if (matchedTerms.length >= 2) {
        return {
          status: "passes",
          feedback: "The note includes concrete evidence, but could cite one more command or file signal.",
          evidence_terms: matchedTerms.slice(0, 4)
        };
      }
      if (answeredPrompts) {
        return { status: "needs-evidence", feedback: "The note is present but does not cite enough lab-specific evidence.", evidence_terms: matchedTerms.slice(0, 2) };
      }
      return { status: "missing", feedback: "Capture command output, file excerpts, or expected evidence before marking this done.", evidence_terms: [] };
    }
    if (index === 2) {
      if (hasAction && matchedTerms.length >= 2) {
        return { status: "strong", feedback: "The decision includes action language and ties back to evidence.", evidence_terms: matchedTerms.slice(0, 5) };
      }
      if (hasAction || answerText.length >= 100) {
        return {
          status: "passes",
          feedback: "A decision is present; connect it to owner, risk, validation, or rollback to improve it.",
          evidence_terms: matchedTerms.slice(0, 3)
        };
      }
      return { status: "needs-evidence", feedback: "Add the smallest safe action, owner, risk, validation, or rollback path.", evidence_terms: matchedTerms.slice(0, 2) };
    }
    if (validationItems.length > 0 && completedValidation === validationItems.length && completedChecks >= (lab.worksheet_prompts ?? []).length + validationItems.length) {
      return { status: "strong", feedback: "All worksheet and validation checks are marked complete.", evidence_terms: matchedTerms.slice(0, 4) };
    }
    if (completedValidation > 0) {
      return { status: "passes", feedback: "Some validation is complete; finish remaining checks or document the fallback path.", evidence_terms: matchedTerms.slice(0, 3) };
    }
    return { status: "missing", feedback: "Run validation, cleanup, or no-cluster fallback and mark the matching checks.", evidence_terms: [] };
  };

  return {
    evidence_terms: matchedTerms.slice(0, 10),
    rubric_feedback: rubricItems.map((criterion, index) => ({ criterion, ...statusFeedback(index) }))
  };
}

async function readStaticLabs(): Promise<PlatformLab[]> {
  return fetchJson<PlatformLab[]>(`${STATIC_API_BASE}/platform-academy-labs.json`, "/api/platform-academy/labs", { cache: "force-cache" });
}

async function staticLabBySlug(slug: string): Promise<PlatformLab | undefined> {
  try {
    const labs = await readStaticLabs();
    return labs.find((lab) => lab.slug === slug);
  } catch {
    return undefined;
  }
}

function scoreLocalLabSubmission(submission: PlatformLabSubmission, lab?: PlatformLab): PlatformLabSubmission {
  if (!lab) return submission;
  const worksheetAnswers = safeStringMap(submission.worksheet_answers);
  const checkedItems = safeBooleanMap(submission.checked_items);
  const totalPrompts = (lab.worksheet_prompts ?? []).length;
  const totalChecks = totalPrompts + (lab.validation_checks ?? []).length;
  const completedChecks = labCompletedCheckCount(lab, checkedItems);
  const answeredPrompts = labAnsweredPromptCount(lab, worksheetAnswers);
  const scoreUnits = totalChecks + totalPrompts;
  const feedback = localLabFeedback(lab, checkedItems, worksheetAnswers);
  return {
    ...submission,
    worksheet_answers: worksheetAnswers,
    checked_items: checkedItems,
    completed_checks: completedChecks,
    total_checks: totalChecks,
    answered_prompts: answeredPrompts,
    total_prompts: totalPrompts,
    score: scoreUnits ? Math.round(((completedChecks + answeredPrompts) / scoreUnits) * 100) : 0,
    evidence_terms: feedback.evidence_terms,
    rubric_feedback: feedback.rubric_feedback
  };
}

function localDashboard(userId: string): UserDashboard {
  const progress = readLocalProgress(userId).filter((item) => item.completed);
  const activity = readLocalActivity(userId);
  const total = progress.reduce((sum, item) => sum + Math.max(0, item.score * 20), 0);
  return {
    user_id: userId,
    xp: { total, lesson_completion_xp: total, quiz_xp: 0, review_xp: 0 },
    daily_goal: { target_xp: 50, earned_xp_today: total, met: total >= 50 },
    streak: { current_days: progress.length || activity.length ? 1 : 0, freeze_available: true, last_activity_date: null },
    achievements: [],
    completed_lessons: progress.length,
    due_reviews: 0
  };
}

async function localGetFallback<T>(path: string): Promise<T | undefined> {
  const [pathname, queryString = ""] = path.split("?");

  const progressMatch = pathname.match(/^\/api\/progress\/([^/]+)$/);
  if (progressMatch) return readLocalProgress(decodeRouteValue(progressMatch[1])) as T;

  const activityMatch = pathname.match(/^\/api\/platform-academy\/activity\/([^/]+)$/);
  if (activityMatch) return readLocalActivity(decodeRouteValue(activityMatch[1])) as T;

  const labSubmissionsMatch = pathname.match(/^\/api\/platform-academy\/lab-submissions\/([^/]+)$/);
  if (labSubmissionsMatch) {
    const userId = decodeRouteValue(labSubmissionsMatch[1]);
    const labs = await readStaticLabs().catch(() => []);
    return readLocalLabSubmissions(userId).map((submission) => scoreLocalLabSubmission(submission, labs.find((lab) => lab.slug === submission.lab_slug))) as T;
  }

  const labSubmissionMatch = pathname.match(/^\/api\/platform-academy\/labs\/([^/]+)\/submission\/([^/]+)$/);
  if (labSubmissionMatch) {
    const labSlug = decodeRouteValue(labSubmissionMatch[1]);
    const userId = decodeRouteValue(labSubmissionMatch[2]);
    const lab = await staticLabBySlug(labSlug);
    return scoreLocalLabSubmission(readLocalLabSubmissions(userId).find((submission) => submission.lab_slug === labSlug) ?? emptyLabSubmission(labSlug, userId), lab) as T;
  }

  const dashboardMatch = pathname.match(/^\/api\/users\/([^/]+)\/dashboard$/);
  if (dashboardMatch) {
    void queryString;
    return localDashboard(decodeRouteValue(dashboardMatch[1])) as T;
  }

  const stateExportMatch = pathname.match(/^\/api\/platform-academy\/state\/([^/]+)\/export$/);
  if (stateExportMatch) {
    const userId = decodeRouteValue(stateExportMatch[1]);
    return {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      source_user_id: userId,
      progress: readLocalProgress(userId),
      activity: readLocalActivity(userId),
      lab_submissions: learnerStateLabSubmissions(userId)
    } as T;
  }

  return undefined;
}

async function localPostFallback<T>(path: string, body: unknown): Promise<T | undefined> {
  const now = new Date().toISOString();
  const payload = body as Record<string, unknown>;
  if (path === "/api/progress") {
    const saved: Progress = {
      id: Date.now(),
      user_id: String(payload.user_id ?? "demo-user"),
      lesson_id: safeNumber(payload.lesson_id, 0),
      completed: Boolean(payload.completed),
      score: safeNumber(payload.score, 0),
      updated_at: now
    };
    persistLocalProgress(saved);
    return saved as T;
  }
  if (path === "/api/platform-academy/activity") {
    const saved: PlatformActivity = {
      id: Date.now(),
      user_id: String(payload.user_id ?? "demo-user"),
      target_type: String(payload.target_type ?? "activity"),
      target_id: String(payload.target_id ?? Date.now()),
      state: String(payload.state ?? "completed"),
      updated_at: now
    };
    persistLocalActivity(saved);
    return saved as T;
  }
  const labSubmissionMatch = path.match(/^\/api\/platform-academy\/labs\/([^/]+)\/submission$/);
  if (labSubmissionMatch) {
    const labSlug = decodeRouteValue(labSubmissionMatch[1]);
    const worksheetAnswers = safeStringMap(payload.worksheet_answers);
    const checkedItems = safeBooleanMap(payload.checked_items);
    const base = emptyLabSubmission(labSlug, String(payload.user_id ?? "demo-user"));
    const saved = scoreLocalLabSubmission(
      {
        ...base,
        worksheet_answers: worksheetAnswers,
        checked_items: checkedItems,
        status: payload.status === "submitted" ? "submitted" : "in_progress",
        created_at: base.created_at,
        updated_at: now
      },
      await staticLabBySlug(labSlug)
    );
    persistLocalLabSubmission(saved);
    return saved as T;
  }
  if (path === "/api/platform-academy/state/import") {
    const targetUserId = String(payload.target_user_id ?? "demo-user");
    const state = safeRecord(payload.state);
    const progress = Array.isArray(state.progress)
      ? state.progress.map((item) => progressFromRecord(item, targetUserId)).filter((item): item is Progress => Boolean(item))
      : [];
    const activity = Array.isArray(state.activity)
      ? state.activity.map((item) => activityFromRecord(item, targetUserId)).filter((item): item is PlatformActivity => Boolean(item))
      : [];
    const labSubmissions = Array.isArray(state.lab_submissions)
      ? state.lab_submissions
          .map((submission) => labSubmissionFromRecord({ ...(submission as Record<string, unknown>), user_id: targetUserId }, targetUserId))
          .filter((submission): submission is PlatformLabSubmission => Boolean(submission))
      : [];
    writeLocalProgress(targetUserId, progress);
    writeLocalActivity(targetUserId, activity);
    writeLocalLabSubmissions(targetUserId, labSubmissions);
    return {
      user_id: targetUserId,
      progress_imported: progress.length,
      activity_imported: activity.length,
      lab_submissions_imported: labSubmissions.length
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
  if (USE_STATIC_API_FALLBACK) {
    const localFallback = await localGetFallback<T>(path);
    if (localFallback !== undefined) return localFallback;

    const staticPath = staticJsonPath(path);
    if (staticPath) return fetchJson<T>(staticPath, path, { cache: "force-cache" });
  }

  return fetchJson<T>(`${API_BASE}${path}`, path, { cache: "no-store" });
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (USE_STATIC_API_FALLBACK) {
    const localFallback = await localPostFallback<T>(path, body);
    if (localFallback !== undefined) return localFallback;
  }

  return fetchJson<T>(`${API_BASE}${path}`, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
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
