import { chromium, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

const WEB_BASE = normalizeBase(process.env.WEB_BASE || process.env.PLATFORM_WEB_BASE || "http://localhost:8090");
const API_BASE = normalizeBase(process.env.SMOKE_API_BASE || process.env.VITE_API_BASE_URL || WEB_BASE);
const TIMEOUT_MS = readPositiveInteger("SMOKE_TIMEOUT_MS", null, 30000, { minimum: 1 });
const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR || "";
const ROUTES = [
  {
    path: "/dashboard/home",
    heading: "Platform Academy",
    visibleText: ["Curriculum", "Lab inventory", "Interview bank"],
  },
  {
    path: "/resources",
    heading: "Resource library",
    visibleText: ["Runbooks, projects, checklists, references", "Library index"],
  },
  {
    path: "/interview-prep",
    heading: "Interview prep",
    visibleText: ["Scenario questions, answer notes, docs links", "Prep packs"],
  },
  {
    path: "/labs",
    heading: "Labs for incidents and architecture reviews",
    visibleText: ["Evidence journal", "Starter incident path", "Selected lab", "Cluster setup included"],
  },
  {
    path: "/labs/trace-service-to-pod",
    heading: "Trace Service traffic to ready Pods",
    visibleText: ["Worksheet and validation state", "Learner workspace contract", "Optional cluster workflow", "Opt-in self-check commands", "Validation commands"],
  },
  {
    path: "/roadmap",
    heading: "Roadmap from kubectl basics to running platforms",
    visibleText: ["Recommended order", "Checkpoints"],
  },
];
const VIEWPORTS = parseViewports(process.env.SMOKE_VIEWPORTS || "desktop,mobile");
const DIRECT_DEEPLINKS = process.env.SMOKE_DIRECT_ROUTES !== "false";
const FAIL_ON_CONSOLE_ERROR = process.env.SMOKE_FAIL_ON_CONSOLE_ERROR === "true";
const WAIT_FOR_NETWORK_IDLE = process.env.SMOKE_WAIT_FOR_NETWORK_IDLE === "true";
const SKIP_WORKBOOK_FLOW = process.env.SMOKE_SKIP_WORKBOOK_FLOW === "true";
const SKIP_ALL_LAB_DETAILS = process.env.SMOKE_SKIP_ALL_LAB_DETAILS === "true";
const SKIP_ALL_LEARNING_ROUTES = process.env.SMOKE_SKIP_ALL_LEARNING_ROUTES === "true";
const SKIP_ALL_RESOURCE_DETAILS = process.env.SMOKE_SKIP_ALL_RESOURCE_DETAILS === "true";
const SKIP_ALL_INTERVIEW_PACKS = process.env.SMOKE_SKIP_ALL_INTERVIEW_PACKS === "true";
const EXPECTED_COURSES = readPositiveInteger("SMOKE_EXPECTED_COURSES", "EXPECTED_COURSES", 21);
const EXPECTED_LESSONS = readPositiveInteger("SMOKE_EXPECTED_LESSONS", "EXPECTED_LESSONS", 84);
const EXPECTED_LABS = readPositiveInteger("SMOKE_EXPECTED_LABS", "EXPECTED_LABS", 21);
const EXPECTED_PORTFOLIO_LABS = readPositiveInteger("SMOKE_EXPECTED_PORTFOLIO_LABS", "EXPECTED_PORTFOLIO_LABS", 16);
const EXPECTED_RESOURCES = readPositiveInteger("SMOKE_EXPECTED_RESOURCES", "EXPECTED_RESOURCES", 320);
const EXPECTED_INTERVIEW_PACKS = readPositiveInteger("SMOKE_EXPECTED_INTERVIEW_PACKS", "EXPECTED_INTERVIEW_PACKS", 22);
const EXPECTED_INTERVIEW_QUESTIONS = readPositiveInteger("SMOKE_EXPECTED_INTERVIEW_QUESTIONS", "EXPECTED_INTERVIEW_QUESTIONS", 219);
const PORTFOLIO_LAB_SLUGS = [
  "trace-service-to-pod",
  "debug-crashloop-imagepull",
  "review-yaml-before-apply",
  "validate-helm-release-artifact",
  "diagnose-eks-ip-exhaustion",
  "design-production-eks-review",
  "trace-network-path",
  "debug-aws-alb-health-path",
  "review-terraform-eks-plan",
  "debug-irsa-access-denied",
  "audit-tenant-boundaries",
  "trace-argocd-drift",
  "design-safe-release-pipeline",
  "write-slo-backed-runbook",
  "design-opentelemetry-signal-path",
  "review-docker-image-supply-chain",
];
const PORTFOLIO_LAB_SLUG_SET = new Set(PORTFOLIO_LAB_SLUGS);
const CLUSTER_LAB_SLUGS = [
  "trace-service-to-pod",
  "debug-crashloop-imagepull",
  "trace-network-path",
  "debug-aws-alb-health-path",
  "audit-tenant-boundaries",
];
const CLUSTER_LAB_SLUG_SET = new Set(CLUSTER_LAB_SLUGS);

function normalizeBase(value) {
  return value.replace(/\/+$/, "");
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function staticAssetUrl(path) {
  const packetMatch = path.match(/^\/api\/platform-academy\/labs\/([^/]+)\/packet$/);
  if (packetMatch) return `/static-api/labs/${packetMatch[1]}/packet.md`;

  const workspaceBundleMatch = path.match(/^\/api\/platform-academy\/labs\/([^/]+)\/workspace-bundle$/);
  if (workspaceBundleMatch) return `/static-api/labs/${workspaceBundleMatch[1]}/workspace-bundle.zip`;

  return "";
}

async function expectApiOrStaticAssetLinkHref(locator, path) {
  const href = await locator.getAttribute("href", { timeout: TIMEOUT_MS });
  const accepted = new Set([path, `${WEB_BASE}${path}`, apiUrl(path)]);
  const staticPath = staticAssetUrl(path);
  if (staticPath) {
    accepted.add(staticPath);
    accepted.add(`${WEB_BASE}${staticPath}`);
  }
  if (!href || !accepted.has(href)) {
    throw new Error(`Expected download link href for ${path} to be one of ${Array.from(accepted).join(", ")}, got ${href || "empty"}`);
  }
}

function readPositiveInteger(primaryName, fallbackName, defaultValue, options = {}) {
  const raw = process.env[primaryName] || (fallbackName ? process.env[fallbackName] : "") || String(defaultValue);
  const value = Number(raw);
  const minimum = options.minimum ?? 0;
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${primaryName} must be an integer >= ${minimum}, got "${raw}"`);
  }
  return value;
}

function parseViewports(value) {
  const presets = {
    desktop: { name: "desktop", width: 1440, height: 1000 },
    mobile: { name: "mobile", width: 390, height: 844 },
  };
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      if (presets[item]) return presets[item];
      const match = item.match(/^(\d+)x(\d+)$/);
      if (!match) throw new Error(`Unknown viewport "${item}". Use desktop, mobile, or WIDTHxHEIGHT.`);
      return { name: item, width: Number(match[1]), height: Number(match[2]) };
    });
}

function isSameOrigin(url) {
  return new URL(url).origin === new URL(WEB_BASE).origin;
}

function isIgnoredSameOriginUrl(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/favicon.ico" || pathname === "/api/events";
}

function isNavigationAbortedGet(request) {
  return request.method() === "GET" && request.failure()?.errorText === "net::ERR_ABORTED";
}

async function assertRoute(page, route, direct) {
  const url = `${WEB_BASE}${route.path}`;
  if (direct) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
    if (WAIT_FOR_NETWORK_IDLE) {
      await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => undefined);
    }
  } else {
    await page.evaluate((path) => {
      globalThis.history.pushState({}, "", path);
      globalThis.dispatchEvent(new PopStateEvent("popstate"));
    }, route.path);
  }
  await expect(page.getByRole("heading", { name: route.heading })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText("Platform Academy is unavailable.")).toHaveCount(0);
  for (const text of route.visibleText) {
    await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
  }
}

async function assertLearnerIdentity(page) {
  const learnerId = await page.evaluate(() => globalThis.localStorage?.getItem("platform-academy-learner-id"));
  if (!learnerId || !/^guest-[a-z0-9]+$/i.test(learnerId)) {
    throw new Error(`Expected browser-local guest learner id, got ${learnerId || "empty"}`);
  }
  return learnerId;
}

function uniqueCoursesFromCatalog(catalog) {
  const bySlug = new Map();
  for (const level of catalog.levels || []) {
    for (const course of level.courses || []) {
      if (!bySlug.has(course.slug)) bySlug.set(course.slug, course);
    }
  }
  return Array.from(bySlug.values());
}

function lessonPath(course, lesson) {
  return `/courses/${course.slug}/lessons/${lesson.sequence}`;
}

async function fetchAcademyCatalog() {
  const response = await fetch(apiUrl("/api/platform-academy/catalog"));
  if (!response.ok) {
    throw new Error(`Expected academy catalog API to return 2xx, got ${response.status}`);
  }
  const catalog = await response.json();
  const courses = uniqueCoursesFromCatalog(catalog);
  const lessons = courses.flatMap((course) => (course.lessons || []).map((lesson) => ({ course, lesson })));
  const labs = catalog.labs || [];
  if (catalog.total_courses !== EXPECTED_COURSES || courses.length !== EXPECTED_COURSES) {
    throw new Error(`Expected ${EXPECTED_COURSES} courses from catalog API, got total=${catalog.total_courses}, unique=${courses.length}`);
  }
  if (catalog.total_lessons !== EXPECTED_LESSONS || lessons.length !== EXPECTED_LESSONS) {
    throw new Error(`Expected ${EXPECTED_LESSONS} lessons from catalog API, got total=${catalog.total_lessons}, unique=${lessons.length}`);
  }
  if (labs.length !== EXPECTED_LABS) {
    throw new Error(`Expected ${EXPECTED_LABS} labs from catalog API, got ${labs.length}`);
  }
  const invalid = labs.filter((lab) => !lab.slug || !lab.title || lab.lab_tier !== "full");
  if (invalid.length) {
    throw new Error(`Expected all labs to expose slug, title, and full tier; invalid labs: ${invalid.map((lab) => lab.slug || "unknown").join(", ")}`);
  }
  const invalidWorkspaceMetadata = labs.filter(
    (lab) =>
      lab.workspace_archive_name !== `${lab.slug}-learner-workspace.zip` ||
      lab.workspace_root !== lab.slug ||
      !Array.isArray(lab.workspace_quickstart_commands) ||
      lab.workspace_quickstart_commands[0] !== `unzip ${lab.slug}-learner-workspace.zip` ||
      lab.workspace_quickstart_commands[1] !== `cd ${lab.slug}` ||
      !lab.workspace_quickstart_commands.includes("./validate.sh --files-only")
  );
  if (invalidWorkspaceMetadata.length) {
    throw new Error(
      `Expected all labs to expose downloaded workspace metadata; invalid labs: ${invalidWorkspaceMetadata.map((lab) => lab.slug || "unknown").join(", ")}`
    );
  }
  const invalidSelfCheckMetadata = labs.filter((lab) => {
    const commands = Array.isArray(lab.setup_self_check_commands) ? lab.setup_self_check_commands : [];
    return (
      !commands.length ||
      commands.some((command) => !command.includes(`run-lab.sh setup ${lab.slug}`) || !command.includes("--run-"))
    );
  });
  if (invalidSelfCheckMetadata.length) {
    throw new Error(
      `Expected all labs to expose opt-in setup self-check commands; invalid labs: ${invalidSelfCheckMetadata.map((lab) => lab.slug || "unknown").join(", ")}`
    );
  }
  const invalidClusterWorkflowMetadata = labs.filter((lab) => {
    const commands = Array.isArray(lab.cluster_workspace_commands) ? lab.cluster_workspace_commands : [];
    const text = commands.join("\n");
    if (CLUSTER_LAB_SLUG_SET.has(lab.slug)) {
      return (
        !text.includes(`bootstrap-local-cluster.sh --preflight ${lab.slug}`) ||
        !text.includes("./setup.sh --preflight") ||
        !text.includes("./setup.sh --cluster") ||
        !text.includes("./validate.sh --cluster") ||
        !text.includes("No app namespace or Pods need to exist before setup")
      );
    }
    return commands.length > 0;
  });
  if (invalidClusterWorkflowMetadata.length) {
    throw new Error(
      `Expected only cluster labs to expose optional workspace cluster workflows; invalid labs: ${invalidClusterWorkflowMetadata
        .map((lab) => lab.slug || "unknown")
        .join(", ")}`
    );
  }
  const portfolioLabs = labs.filter((lab) => lab.portfolio_grade === true);
  if (portfolioLabs.length !== EXPECTED_PORTFOLIO_LABS) {
    throw new Error(`Expected ${EXPECTED_PORTFOLIO_LABS} portfolio-grade labs from catalog API, got ${portfolioLabs.length}`);
  }
  const actualPortfolioSlugs = new Set(portfolioLabs.map((lab) => lab.slug));
  const missingPortfolioLabs = PORTFOLIO_LAB_SLUGS.filter((slug) => !actualPortfolioSlugs.has(slug));
  const unexpectedPortfolioLabs = portfolioLabs.map((lab) => lab.slug).filter((slug) => !PORTFOLIO_LAB_SLUG_SET.has(slug));
  if (missingPortfolioLabs.length || unexpectedPortfolioLabs.length) {
    throw new Error(
      `Portfolio-grade lab set mismatch; missing=${missingPortfolioLabs.join(", ") || "none"} unexpected=${unexpectedPortfolioLabs.join(", ") || "none"}`
    );
  }
  const missingFocus = portfolioLabs.filter((lab) => typeof lab.portfolio_focus !== "string" || !lab.portfolio_focus.trim());
  if (missingFocus.length) {
    throw new Error(`Expected all portfolio-grade labs to expose portfolio_focus; missing: ${missingFocus.map((lab) => lab.slug || "unknown").join(", ")}`);
  }
  return { catalog, courses, lessons, labs, portfolioLabs };
}

async function fetchResourcesCatalog() {
  const response = await fetch(apiUrl("/api/platform-academy/resources"));
  if (!response.ok) {
    throw new Error(`Expected resources API to return 2xx, got ${response.status}`);
  }
  const payload = await response.json();
  const resources = payload.resources || [];
  if (resources.length !== EXPECTED_RESOURCES) {
    throw new Error(`Expected ${EXPECTED_RESOURCES} resources from API, got ${resources.length}`);
  }
  const invalid = resources.filter((resource) => !resource.slug || !resource.title || !resource.commands?.length || !resource.artifacts?.length);
  if (invalid.length) {
    throw new Error(`Expected all resources to expose slug, title, commands, and artifacts; invalid resources: ${invalid.map((resource) => resource.slug || "unknown").join(", ")}`);
  }
  return { ...payload, resources };
}

async function fetchInterviewPrepCatalog() {
  const response = await fetch(apiUrl("/api/platform-academy/interview-prep"));
  if (!response.ok) {
    throw new Error(`Expected interview prep API to return 2xx, got ${response.status}`);
  }
  const payload = await response.json();
  const packs = payload.packs || [];
  if (packs.length !== EXPECTED_INTERVIEW_PACKS) {
    throw new Error(`Expected ${EXPECTED_INTERVIEW_PACKS} interview packs from API, got ${packs.length}`);
  }
  if (payload.total_questions !== EXPECTED_INTERVIEW_QUESTIONS) {
    throw new Error(`Expected ${EXPECTED_INTERVIEW_QUESTIONS} interview questions from API, got ${payload.total_questions}`);
  }
  const invalid = packs.filter((pack) => !pack.slug || !pack.title || !pack.questions?.length || !pack.official_sources?.length);
  if (invalid.length) {
    throw new Error(`Expected all interview packs to expose slug, title, questions, and sources; invalid packs: ${invalid.map((pack) => pack.slug || "unknown").join(", ")}`);
  }
  return { ...payload, packs };
}

async function assertHtmlDeepLink(path) {
  const response = await fetch(`${WEB_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Expected ${path} to return 2xx HTML, got ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Expected ${path} to return HTML, got ${contentType || "no content-type"}`);
  }
}

async function assertDeepLinks({ academy, resources, interviewPrep }) {
  const { courses, lessons, labs } = academy;
  const paths = new Set([
    ...ROUTES.map((route) => route.path),
    ...courses.map((course) => `/courses/${course.slug}`),
    ...lessons.map(({ course, lesson }) => lessonPath(course, lesson)),
    ...labs.map((lab) => `/labs/${lab.slug}`),
    ...resources.resources.map((resource) => `/resources/${resource.slug}`),
    ...interviewPrep.packs.map((pack) => `/interview-prep?pack=${encodeURIComponent(pack.slug)}`),
  ]);
  for (const path of paths) {
    await assertHtmlDeepLink(path);
  }
  console.log(`Verified ${paths.size} Platform Academy deep links at ${WEB_BASE}`);
}

async function assertAllCourseAndLessonRoutes(page, courses, lessons) {
  for (const [index, course] of courses.entries()) {
    if (index === 0) {
      await page.goto(`${WEB_BASE}/courses/${course.slug}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      if (WAIT_FOR_NETWORK_IDLE) {
        await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => undefined);
      }
    } else {
      await page.evaluate((path) => {
        globalThis.history.pushState({}, "", path);
        globalThis.dispatchEvent(new PopStateEvent("popstate"));
      }, `/courses/${course.slug}`);
    }
    await expect(page.getByRole("heading", { name: course.title, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("Course not found.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: `${course.lessons.length} lessons`, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  }

  for (const [index, { course, lesson }] of lessons.entries()) {
    if (index === 0) {
      await page.goto(`${WEB_BASE}${lessonPath(course, lesson)}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      if (WAIT_FOR_NETWORK_IDLE) {
        await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => undefined);
      }
    } else {
      await page.evaluate((path) => {
        globalThis.history.pushState({}, "", path);
        globalThis.dispatchEvent(new PopStateEvent("popstate"));
      }, lessonPath(course, lesson));
    }
    await expect(page.getByRole("heading", { name: lesson.title, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("Lesson outside Platform Academy.")).toHaveCount(0);
    await expect(page.getByText("Lesson unavailable.")).toHaveCount(0);
    await expect(page.getByText("Loading lesson...")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /mark complete|progress saved/i })).toBeVisible({ timeout: TIMEOUT_MS });
  }
  console.log(`Verified ${courses.length} course routes and ${lessons.length} lesson routes`);
}

async function assertAllResourceRoutes(page, resources) {
  for (const [index, resource] of resources.entries()) {
    if (index === 0) {
      await page.goto(`${WEB_BASE}/resources/${resource.slug}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      if (WAIT_FOR_NETWORK_IDLE) {
        await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => undefined);
      }
    } else {
      await page.evaluate((path) => {
        globalThis.history.pushState({}, "", path);
        globalThis.dispatchEvent(new PopStateEvent("popstate"));
      }, `/resources/${resource.slug}`);
    }
    await expect(page.getByRole("heading", { name: resource.title, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("Resource not found.")).toHaveCount(0);
    await expect(page.locator(".resource-detail-page .command-console").first()).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByRole("heading", { name: "Outcomes", exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByRole("heading", { name: "What to produce", exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  }
  console.log(`Verified ${resources.length} resource detail routes`);
}

async function assertAllInterviewPacks(page, packs) {
  for (const [index, pack] of packs.entries()) {
    if (index === 0) {
      await page.goto(`${WEB_BASE}/interview-prep?pack=${encodeURIComponent(pack.slug)}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      if (WAIT_FOR_NETWORK_IDLE) {
        await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => undefined);
      }
    } else {
      await page.evaluate((path) => {
        globalThis.history.pushState({}, "", path);
        globalThis.dispatchEvent(new PopStateEvent("popstate"));
      }, `/interview-prep?pack=${encodeURIComponent(pack.slug)}`);
    }
    await expect(page.getByRole("heading", { name: pack.title, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("No interview packs match those filters.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: `${pack.questions.length} visible / ${pack.questions.length} in this pack`, exact: true })).toBeVisible({
      timeout: TIMEOUT_MS,
    });
  }
  console.log(`Verified ${packs.length} interview prep packs`);
}

async function readDownloadedMarkdown(download, label) {
  const failure = await download.failure();
  if (failure) {
    throw new Error(`Expected ${label} download to succeed, got ${failure}`);
  }
  const path = await download.path();
  if (!path) {
    throw new Error(`Expected ${label} download to be available on disk`);
  }
  return readFile(path, "utf8");
}

async function readDownloadedJson(download, label) {
  const text = await readDownloadedMarkdown(download, label);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected ${label} download to contain JSON: ${error.message}`);
  }
}

function assertMarkdownIncludes(markdown, snippets, label) {
  const missing = snippets.filter((snippet) => !markdown.includes(snippet));
  if (missing.length) {
    throw new Error(`Expected ${label} markdown to include ${missing.map((snippet) => JSON.stringify(snippet)).join(", ")}`);
  }
}

async function assertInterviewCramSheetDownloads(page, interviewPrep) {
  const firstPack = interviewPrep.packs[0];
  const firstQuestion = firstPack?.questions?.[0];
  const firstSource = firstPack?.official_sources?.[0];
  if (!firstPack || !firstQuestion || !firstSource) {
    throw new Error("Expected interview prep smoke data to include at least one pack, question, and official source");
  }

  await page.goto(`${WEB_BASE}/interview-prep?pack=${encodeURIComponent(firstPack.slug)}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: firstPack.title, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  const [singleDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: TIMEOUT_MS }),
    page.getByRole("button", { name: /download cram sheet/i }).click(),
  ]);
  const expectedSingleFilename = `${firstPack.slug}-cram-sheet.md`;
  if (singleDownload.suggestedFilename() !== expectedSingleFilename) {
    throw new Error(`Expected active pack cram sheet filename ${expectedSingleFilename}, got ${singleDownload.suggestedFilename()}`);
  }
  const singleMarkdown = await readDownloadedMarkdown(singleDownload, "active pack cram sheet");
  assertMarkdownIncludes(
    singleMarkdown,
    [
      `# ${firstPack.title}`,
      `Domain: ${firstPack.domain}`,
      `Level: ${firstPack.level_group}`,
      firstQuestion.question,
      `Scenario: ${firstQuestion.scenario}`,
      "Official docs:",
      firstSource.label,
      firstSource.url,
      "Study links:",
    ],
    "active pack cram sheet"
  );

  await page.goto(`${WEB_BASE}/interview-prep`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Interview prep", exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  const [collectionDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: TIMEOUT_MS }),
    page.getByRole("button", { name: /download \d+ visible packs?/i }).click(),
  ]);
  const expectedCollectionFilename = "platform-academy-interview-cram-sheets.md";
  if (collectionDownload.suggestedFilename() !== expectedCollectionFilename) {
    throw new Error(`Expected visible pack cram sheet filename ${expectedCollectionFilename}, got ${collectionDownload.suggestedFilename()}`);
  }
  const collectionMarkdown = await readDownloadedMarkdown(collectionDownload, "visible pack cram sheets");
  assertMarkdownIncludes(
    collectionMarkdown,
    [
      "# Platform Academy interview cram sheets",
      `Packs: ${interviewPrep.packs.length}`,
      `Questions: ${interviewPrep.total_questions}`,
      firstPack.title,
      firstQuestion.question,
      firstSource.url,
    ],
    "visible pack cram sheets"
  );
  console.log("Verified interview cram sheet browser downloads");
}

async function assertInterviewStudyPlanBuilder(page, interviewPrep) {
  const firstPack = interviewPrep.packs[0];
  const firstQuestion = firstPack?.questions?.[0];
  const secondQuestion = firstPack?.questions?.[1];
  const firstSource = firstPack?.official_sources?.[0];
  if (!firstPack || !firstQuestion || !firstSource) {
    throw new Error("Expected interview prep smoke data to include at least one pack, question, and official source");
  }

  await page.goto(`${WEB_BASE}/interview-prep?pack=${encodeURIComponent(firstPack.slug)}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: firstPack.title, exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  await page.getByLabel("Study plan name").fill("Browser smoke interview plan");
  await page.getByRole("button", { name: /new plan/i }).click();
  await expect(page.getByRole("status")).toContainText("Study plan saved.", { timeout: TIMEOUT_MS });
  await expect(page.getByText(new RegExp(`${firstPack.questions.length} questions / 1 pack`, "i"))).toBeVisible({ timeout: TIMEOUT_MS });

  const savedPlans = await page.evaluate(() => JSON.parse(globalThis.localStorage?.getItem("platform-academy-interview-study-plans-v1") || "[]"));
  if (!Array.isArray(savedPlans) || savedPlans[0]?.name !== "Browser smoke interview plan") {
    throw new Error("Expected browser smoke study plan to be saved in localStorage");
  }
  if (savedPlans[0].questionIds?.length !== firstPack.questions.length) {
    throw new Error(`Expected study plan to include ${firstPack.questions.length} question ids, got ${savedPlans[0].questionIds?.length ?? 0}`);
  }

  const [planDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: TIMEOUT_MS }),
    page.getByRole("button", { name: /download plan/i }).click(),
  ]);
  const expectedFilename = "browser-smoke-interview-plan-study-plan.md";
  if (planDownload.suggestedFilename() !== expectedFilename) {
    throw new Error(`Expected study plan filename ${expectedFilename}, got ${planDownload.suggestedFilename()}`);
  }
  const planMarkdown = await readDownloadedMarkdown(planDownload, "custom interview study plan");
  assertMarkdownIncludes(
    planMarkdown,
    [
      "# Browser smoke interview plan study plan",
      "Packs: 1",
      `Questions: ${firstPack.questions.length}`,
      firstPack.title,
      firstQuestion.question,
      secondQuestion?.question || firstQuestion.question,
      firstSource.url,
      "Study links:",
    ],
    "custom interview study plan"
  );
  console.log("Verified interview study plan browser workflow");
}

async function assertAllLabDetailRoutes(page, labs) {
  for (const [index, lab] of labs.entries()) {
    if (index === 0) {
      await page.goto(`${WEB_BASE}/labs/${lab.slug}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      if (WAIT_FOR_NETWORK_IDLE) {
        await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => undefined);
      }
    } else {
      await page.evaluate((path) => {
        globalThis.history.pushState({}, "", path);
        globalThis.dispatchEvent(new PopStateEvent("popstate"));
      }, `/labs/${lab.slug}`);
    }
    await expect(page.getByRole("heading", { name: lab.title })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("Guided lab run sequence")).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByRole("heading", { name: "Investigate, prove, validate, clean up" })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByLabel("Evidence artifact map")).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByRole("heading", { name: "Worksheet and validation state" })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("Learner workspace contract")).toBeVisible({ timeout: TIMEOUT_MS });
    await expectApiOrStaticAssetLinkHref(page.getByRole("link", { name: /download lab packet/i }), `/api/platform-academy/labs/${encodeURIComponent(lab.slug)}/packet`);
    const workspaceDownloadLink = page.getByRole("link", { name: /download learner workspace/i });
    await expectApiOrStaticAssetLinkHref(workspaceDownloadLink, `/api/platform-academy/labs/${encodeURIComponent(lab.slug)}/workspace-bundle`);
    const downloadName = await workspaceDownloadLink.getAttribute("download", { timeout: TIMEOUT_MS });
    if (downloadName !== lab.workspace_archive_name) {
      throw new Error(`Expected ${lab.slug} learner workspace download name ${lab.workspace_archive_name}, got ${downloadName || "empty"}`);
    }
    await expect(page.getByLabel("Downloaded workspace quickstart")).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByRole("heading", { name: "Run from extracted bundle" })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText(lab.workspace_archive_name, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(page.getByText("Opt-in self-check commands").first()).toBeVisible({ timeout: TIMEOUT_MS });
    for (const command of lab.setup_self_check_commands || []) {
      await expect(page.getByText(command, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
    }
    for (const command of [
      `unzip ${lab.workspace_archive_name}`,
      `cd ${lab.workspace_root}`,
      "./validate.sh --files-only",
      "./cleanup.sh",
    ]) {
      await expect(page.getByText(command, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
    }
    if (lab.cluster_workspace_commands?.length) {
      await expect(page.getByText("Optional cluster workflow").first()).toBeVisible({ timeout: TIMEOUT_MS });
      for (const command of ["./setup.sh --preflight", "./setup.sh --cluster", "./validate.sh --cluster"]) {
        await expect(page.getByText(command, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
      }
    }
    await expect(page.getByText("Lab not found.")).toHaveCount(0);
  }
  console.log(`Verified ${labs.length} Platform Academy lab detail routes`);
}

async function assertPortfolioLabUi(page, portfolioLabs) {
  const firstPortfolioLab = portfolioLabs.find((lab) => lab.slug === "trace-service-to-pod") || portfolioLabs[0];
  if (!firstPortfolioLab?.portfolio_focus) {
    throw new Error("Expected at least one portfolio-grade lab with portfolio_focus");
  }

  await page.goto(`${WEB_BASE}/labs`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Labs for incidents and architecture reviews" })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText(`${CLUSTER_LAB_SLUGS.length} cluster-ready`, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByRole("button", { name: "Cluster setup", exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  await page.getByRole("button", { name: "Cluster setup", exact: true }).click();
  let queueRows = page.locator(".lab-queue .lab-queue-row");
  await expect(queueRows).toHaveCount(CLUSTER_LAB_SLUGS.length, { timeout: TIMEOUT_MS });
  await expect(page.getByText("Cluster setup included").first()).toBeVisible({ timeout: TIMEOUT_MS });
  await page.getByRole("button", { name: "All runtimes", exact: true }).click();
  await expect(page.getByText(`${EXPECTED_PORTFOLIO_LABS} portfolio-grade`, { exact: false }).first()).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByRole("button", { name: "Portfolio-grade", exact: true })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText(firstPortfolioLab.portfolio_focus, { exact: true }).first()).toBeVisible({ timeout: TIMEOUT_MS });

  await page.getByRole("button", { name: "Portfolio-grade", exact: true }).click();
  queueRows = page.locator(".lab-queue .lab-queue-row");
  await expect(queueRows).toHaveCount(EXPECTED_PORTFOLIO_LABS, { timeout: TIMEOUT_MS });
  for (const lab of portfolioLabs) {
    await expect(queueRows.filter({ hasText: lab.title })).toHaveCount(1, { timeout: TIMEOUT_MS });
  }
  await expect(page.getByRole("heading", { name: "Build a platform career proof pack", exact: true })).toHaveCount(0);
  await expect(page.getByText("Structurally verified lab")).toBeVisible({ timeout: TIMEOUT_MS });

  await page.goto(`${WEB_BASE}/labs/${encodeURIComponent(firstPortfolioLab.slug)}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: firstPortfolioLab.title })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText("Portfolio-grade practice")).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText(firstPortfolioLab.portfolio_focus, { exact: true }).first()).toBeVisible({ timeout: TIMEOUT_MS });
  console.log(`Verified ${portfolioLabs.length} portfolio-grade lab UI signals`);
}

async function assertLabWorkbookFlow(page) {
  await page.goto(`${WEB_BASE}/labs/trace-service-to-pod`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Worksheet and validation state" })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText("Saved to profile")).toBeVisible({ timeout: TIMEOUT_MS });
  const commandDeck = page.getByLabel("Lab phase command deck");
  await expect(commandDeck).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(commandDeck.getByRole("heading", { name: "Copy by lab phase" })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(commandDeck.getByRole("button", { name: /Setup:/ })).toHaveAttribute("aria-pressed", "true", { timeout: TIMEOUT_MS });
  await expect(commandDeck.getByText("kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml", { exact: false })).toBeVisible({ timeout: TIMEOUT_MS });
  await commandDeck.getByRole("button", { name: /Validation:/ }).click();
  await expect(commandDeck.getByText("bash labs/platform-academy/trace-service-to-pod/validate.sh", { exact: false })).toBeVisible({ timeout: TIMEOUT_MS });
  await commandDeck.getByRole("button", { name: /Closeout:/ }).click();
  await expect(commandDeck.getByText("bash labs/platform-academy/trace-service-to-pod/cleanup.sh", { exact: false })).toBeVisible({ timeout: TIMEOUT_MS });
  await commandDeck.getByRole("button", { name: /Evidence:/ }).click();
  await expect(commandDeck.getByText("kubectl describe svc checkout -n payments", { exact: false })).toBeVisible({ timeout: TIMEOUT_MS });

  await page
    .getByLabel(/Evidence note:/)
    .first()
    .fill("Service selector app=checkout does not match Pod label app=checkout-api, leaving EndpointSlice empty until the selector is fixed.");
  await page.locator(".lab-workbook-panel input[type='checkbox']").first().check();
  await page.locator(".lab-workbook-panel input[type='checkbox']").nth(1).check();

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/platform-academy/labs/trace-service-to-pod/submission") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: TIMEOUT_MS }
    ),
    page.getByRole("button", { name: /save workbook/i }).click(),
  ]);
  await expect(page.getByText("Saved to profile")).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByText(/selector/i).first()).toBeVisible({ timeout: TIMEOUT_MS });

  await page.goto(`${WEB_BASE}/labs/history`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Saved workbooks and rubric signals" })).toBeVisible({ timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeVisible({ timeout: TIMEOUT_MS });
  const [reportDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: TIMEOUT_MS }),
    page.getByRole("button", { name: /download report/i }).click(),
  ]);
  if (reportDownload.suggestedFilename() !== "platform-academy-lab-evidence.md") {
    throw new Error(`Expected lab evidence report filename platform-academy-lab-evidence.md, got ${reportDownload.suggestedFilename()}`);
  }
  const reportMarkdown = await readDownloadedMarkdown(reportDownload, "lab evidence report");
  assertMarkdownIncludes(
    reportMarkdown,
    [
      "# Platform Academy Lab Evidence",
      "Saved labs:",
      "## Trace Service traffic to ready Pods",
      "Route: /labs/trace-service-to-pod",
      "### Worksheet Notes",
      "app=checkout",
      "### Learner Artifacts",
      "labs/platform-academy/trace-service-to-pod/evidence-template.md",
      "### Rubric Follow-ups",
    ],
    "lab evidence report"
  );
}

async function assertRecoveryBackupControls(page) {
  await page.goto(`${WEB_BASE}/dashboard/home`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.getByRole("heading", { name: "Platform Academy" })).toBeVisible({ timeout: TIMEOUT_MS });
  await page.getByRole("button", { name: /open guest recovery key/i }).click();
  await expect(page.getByRole("heading", { name: "Save or restore progress" })).toBeVisible({ timeout: TIMEOUT_MS });

  const [backupDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: TIMEOUT_MS }),
    page.waitForResponse(
      (response) => response.url().includes("/api/platform-academy/state/") && response.url().endsWith("/export") && response.ok(),
      { timeout: TIMEOUT_MS }
    ),
    page.getByRole("button", { name: /export json/i }).click(),
  ]);
  await expect(page.getByText("Exported profile backup.")).toBeVisible({ timeout: TIMEOUT_MS });
  const exportedBackup = await readDownloadedJson(backupDownload, "guest profile backup");
  const exportedPlans = exportedBackup.interview_study_plans || [];
  const smokePlan = exportedPlans.find((plan) => plan.name === "Browser smoke interview plan");
  if (!smokePlan) {
    throw new Error("Expected exported profile backup to include the browser smoke interview plan");
  }
  if (!Array.isArray(smokePlan.questionIds) || smokePlan.questionIds.length === 0) {
    throw new Error("Expected exported browser smoke interview plan to include question ids");
  }

  await page.evaluate(() => globalThis.localStorage?.removeItem("platform-academy-interview-study-plans-v1"));
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().endsWith("/api/platform-academy/state/import") && response.request().method() === "POST" && response.ok(),
      { timeout: TIMEOUT_MS }
    ),
    page.locator("input[type='file']").setInputFiles({
      name: "valid-platform-academy-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exportedBackup), "utf8"),
    }),
  ]);
  await expect(page.getByRole("status")).toContainText("interview study plan", { timeout: TIMEOUT_MS });
  const restoredPlans = await page.evaluate(() => JSON.parse(globalThis.localStorage?.getItem("platform-academy-interview-study-plans-v1") || "[]"));
  if (!Array.isArray(restoredPlans) || !restoredPlans.some((plan) => plan.name === "Browser smoke interview plan")) {
    throw new Error("Expected imported profile backup to restore the browser smoke interview plan");
  }

  const invalidBackup = {
    schema_version: 1,
    exported_at: "2026-05-31T00:00:00Z",
    source_user_id: "guest-smoke",
    progress: [],
    activity: [],
    lab_submissions: [
      {
        lab_slug: "trace-service-to-pod",
        worksheet_answers: { "worksheet-0": "x".repeat(4001) },
        checked_items: {},
        status: "submitted",
      },
    ],
  };
  await page.locator("input[type='file']").setInputFiles({
    name: "invalid-platform-academy-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalidBackup), "utf8"),
  });
  await expect(page.getByRole("alert")).toContainText("Backup lab workbook fields exceed the import limit.", { timeout: TIMEOUT_MS });
}

async function assertFunctionalFlows(page) {
  await assertLabWorkbookFlow(page);
  await assertRecoveryBackupControls(page);
}

async function captureFailureScreenshot(page, viewport, routeName) {
  if (!ARTIFACT_DIR) return "";
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const safeName = routeName.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-") || "root";
  const path = `${ARTIFACT_DIR}/platform-academy-${viewport.name}-${safeName}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function main() {
  console.log(
    [
      `Platform Academy browser smoke for ${WEB_BASE}`,
      `api=${API_BASE}`,
      `viewports=${VIEWPORTS.map((viewport) => viewport.name).join(",")}`,
      `counts=courses:${EXPECTED_COURSES},lessons:${EXPECTED_LESSONS},labs:${EXPECTED_LABS},portfolio:${EXPECTED_PORTFOLIO_LABS},resources:${EXPECTED_RESOURCES},packs:${EXPECTED_INTERVIEW_PACKS},questions:${EXPECTED_INTERVIEW_QUESTIONS}`,
      `skipWorkbook=${SKIP_WORKBOOK_FLOW}`,
      `skipLabDetails=${SKIP_ALL_LAB_DETAILS}`,
      `skipLearningRoutes=${SKIP_ALL_LEARNING_ROUTES}`,
      `skipResourceDetails=${SKIP_ALL_RESOURCE_DETAILS}`,
      `skipInterviewPacks=${SKIP_ALL_INTERVIEW_PACKS}`,
    ].join(" ")
  );
  const academy = await fetchAcademyCatalog();
  const resources = await fetchResourcesCatalog();
  const interviewPrep = await fetchInterviewPrepCatalog();
  await assertDeepLinks({ academy, resources, interviewPrep });
  const browser = await chromium.launch();
  const failures = [];
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ acceptDownloads: true, viewport });
      const page = await context.newPage();
      const routeFailures = [];
      page.on("pageerror", (error) => routeFailures.push(`page error: ${error.message}`));
      page.on("requestfailed", (request) => {
        if (isSameOrigin(request.url()) && !isIgnoredSameOriginUrl(request.url())) {
          if (isNavigationAbortedGet(request)) return;
          routeFailures.push(`request failed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.trim());
        }
      });
      page.on("response", (response) => {
        if (isSameOrigin(response.url()) && !isIgnoredSameOriginUrl(response.url()) && response.status() >= 400) {
          routeFailures.push(`http error: ${response.status()} ${response.url()}`);
        }
      });
      page.on("console", (message) => {
        if (FAIL_ON_CONSOLE_ERROR && message.type() === "error") {
          routeFailures.push(`console error: ${message.text()}`);
        }
      });

      for (const [index, route] of ROUTES.entries()) {
        try {
          await assertRoute(page, route, index === 0 || DIRECT_DEEPLINKS);
        } catch (error) {
          const screenshot = await captureFailureScreenshot(page, viewport, route.path);
          const suffix = screenshot ? ` (screenshot: ${screenshot})` : "";
          routeFailures.push(`${route.path}: ${error.message}${suffix}`);
        }
      }
      await assertLearnerIdentity(page);

      if (viewport === VIEWPORTS[0]) {
        try {
          await assertPortfolioLabUi(page, academy.portfolioLabs);
          if (!SKIP_ALL_LAB_DETAILS) {
            await assertAllLabDetailRoutes(page, academy.labs);
          }
          if (!SKIP_ALL_LEARNING_ROUTES) {
            await assertAllCourseAndLessonRoutes(page, academy.courses, academy.lessons);
          }
          if (!SKIP_ALL_RESOURCE_DETAILS) {
            await assertAllResourceRoutes(page, resources.resources);
          }
          if (!SKIP_ALL_INTERVIEW_PACKS) {
            await assertAllInterviewPacks(page, interviewPrep.packs);
          }
          await assertInterviewCramSheetDownloads(page, interviewPrep);
          await assertInterviewStudyPlanBuilder(page, interviewPrep);
          if (!SKIP_WORKBOOK_FLOW) {
            await assertFunctionalFlows(page);
            console.log("Verified Platform Academy lab workbook and recovery controls");
          } else {
            console.log("Skipped Platform Academy lab workbook and recovery controls");
          }
        } catch (error) {
          const screenshot = await captureFailureScreenshot(page, viewport, "functional-flow");
          const suffix = screenshot ? ` (screenshot: ${screenshot})` : "";
          routeFailures.push(`first viewport coverage: ${error.message}${suffix}`);
        }
      }

      if (routeFailures.length) {
        failures.push(`${viewport.name}: ${routeFailures.join("; ")}`);
      } else {
        console.log(`Verified ${ROUTES.length} Platform Academy routes at ${viewport.name} (${viewport.width}x${viewport.height})`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    throw new Error(`Platform Academy browser smoke failed:\n- ${failures.join("\n- ")}`);
  }
  console.log(`Platform Academy browser smoke passed for ${WEB_BASE}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
