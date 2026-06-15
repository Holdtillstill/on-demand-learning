import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const WEB_BASE = normalizeBase(process.env.WEB_BASE || process.env.PLATFORM_WEB_BASE || "http://127.0.0.1:5180");
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR || "";
const VIEWPORTS = parseViewports(process.env.SMOKE_VIEWPORTS || "desktop,mobile");

const EXPECTED_COURSES = readPositiveInteger("SMOKE_EXPECTED_COURSES", "EXPECTED_COURSES", 21);
const EXPECTED_LESSONS = readPositiveInteger("SMOKE_EXPECTED_LESSONS", "EXPECTED_LESSONS", 84);
const EXPECTED_LABS = readPositiveInteger("SMOKE_EXPECTED_LABS", "EXPECTED_LABS", 21);
const EXPECTED_PORTFOLIO_LABS = readPositiveInteger("SMOKE_EXPECTED_PORTFOLIO_LABS", "EXPECTED_PORTFOLIO_LABS", 21);
const EXPECTED_RESOURCES = readPositiveInteger("SMOKE_EXPECTED_RESOURCES", "EXPECTED_RESOURCES", 330);
const EXPECTED_INTERVIEW_PACKS = readPositiveInteger("SMOKE_EXPECTED_INTERVIEW_PACKS", "EXPECTED_INTERVIEW_PACKS", 29);
const EXPECTED_INTERVIEW_QUESTIONS = readPositiveInteger("SMOKE_EXPECTED_INTERVIEW_QUESTIONS", "EXPECTED_INTERVIEW_QUESTIONS", 268);

const routes = [
  {
    path: "/",
    heading: "Platform Engineering Readiness",
    shadow: ["Curriculum", "CONTINUE LESSON", "READINESS SCORE"]
  },
  {
    path: "/dashboard/home",
    heading: "Platform Engineering Readiness",
    shadow: ["Curriculum", "CONTINUE LESSON", "READINESS SCORE"]
  },
  {
    path: "/roadmap",
    heading: "Platform Engineering Roadmap",
    shadow: ["Platform Engineering Roadmap", "All levels", "Linux Operator Foundations"]
  },
  {
    path: "/labs",
    heading: "Lab Queue",
    shadow: ["Level", "All levels", "Open workbook"]
  },
  {
    path: "/labs/trace-service-to-pod",
    heading: "Lab Workbook",
    shadow: ["Trace Service traffic to ready Pods", "Brief", "Console", "Workbook", "Evidence", "Rubric"]
  },
  {
    path: "/interview-prep",
    heading: "Interview Prep",
    shadow: ["Interview Prep", "Question queue", "Answer write-up", "Docs to read", "Related labs"]
  },
  {
    path: "/resources",
    heading: "Resource Index",
    shadow: ["Resource Index", `${EXPECTED_RESOURCES} resources`, "All domains", "All levels", "All types"]
  },
  {
    path: "/resources/linux-project-brief",
    heading: "Resource Detail",
    shadow: ["Linux Portfolio Project Brief", "Operator workflow", "Evidence prompts"]
  },
  {
    path: "/courses/platform-kubernetes-fundamentals/lessons/1",
    heading: "Lesson Reader",
    shadow: ["platform-kubernetes-fundamentals", "Lesson 1"]
  },
  {
    path: "/missing-route",
    heading: "Page not found",
    shadow: []
  }
];

const legacyText = [
  "Resource library",
  "320 matches",
  "22 visible packs",
  "Platform Academy is unavailable.",
  "Unexpected token",
  "Loading lesson..."
];

function normalizeBase(value) {
  return value.replace(/\/+$/, "");
}

function parseViewports(value) {
  const presets = {
    desktop: { name: "desktop", width: 1440, height: 1000 },
    mobile: { name: "mobile", width: 390, height: 844 }
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

function readPositiveInteger(primaryName, fallbackName, defaultValue) {
  const raw = process.env[primaryName] || process.env[fallbackName] || String(defaultValue);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${primaryName} must be a positive integer, got ${raw}`);
  }
  return value;
}

function url(path) {
  return `${WEB_BASE}${path}`;
}

function isIgnoredRequest(request) {
  try {
    const parsed = new URL(request.url());
    if (parsed.pathname === "/favicon.ico") return true;
    return ["image", "font"].includes(request.resourceType());
  } catch {
    return false;
  }
}

async function resetProgress(page) {
  await page.goto(url("/dashboard/home"), { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS }).catch(() => undefined);
  await page.evaluate(() => {
    const suffix = Math.random().toString(36).slice(2, 14).padEnd(12, "0").slice(0, 12);
    localStorage.setItem("platform-academy-learner-id", `guest-${suffix}`);
    localStorage.removeItem("platform-academy-v2-interview-state");
    localStorage.removeItem("platform-academy-interview-study-plans-v1");
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("platform-academy-v2-lab:")) localStorage.removeItem(key);
    }
  });
}

async function pageText(page) {
  return page.evaluate(() => {
    const shadowText = Array.from(document.querySelectorAll(".reference-figma-screen"))
      .map((host) => host.shadowRoot?.querySelector(".figma-shadow-root")?.innerText || "")
      .join("\n");
    return `${document.body.innerText}\n${shadowText}`.replace(/\s+/g, " ").trim();
  });
}

async function assertRoute(page, route) {
  await page.goto(url(route.path), { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await expect(page.locator("main > h1#app-route-heading")).toHaveText(route.heading, { timeout: TIMEOUT_MS });
  if (route.shadow.length) {
    await page.waitForFunction(
      (expected) => {
        const text = Array.from(document.querySelectorAll(".reference-figma-screen"))
          .map((host) => host.shadowRoot?.querySelector(".figma-shadow-root")?.innerText || "")
          .join("\n");
        return expected.every((item) => text.includes(item));
      },
      route.shadow,
      { timeout: TIMEOUT_MS }
    );
  }

  const text = await pageText(page);
  for (const marker of route.shadow) {
    if (!text.includes(marker)) throw new Error(`${route.path} missing marker: ${marker}`);
  }
  for (const marker of legacyText) {
    if (text.includes(marker)) throw new Error(`${route.path} still contains legacy marker: ${marker}`);
  }
}

async function assertResetProgressTotals(page) {
  await resetProgress(page);
  await page.goto(url("/dashboard/home"), { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  const progress = (await page.getByLabel("Progress").innerText({ timeout: TIMEOUT_MS })).replace(/\s+/g, "");
  for (const expected of [
    `Lessons0/${EXPECTED_LESSONS}`,
    `Labs0/${EXPECTED_LABS}`,
    `Resources0/${EXPECTED_RESOURCES}`,
    `InterviewQs0/${EXPECTED_INTERVIEW_QUESTIONS}`
  ]) {
    if (!progress.includes(expected)) throw new Error(`Progress rail missing ${expected}: ${progress}`);
  }
}

async function captureFailureScreenshot(page, viewport, routeName) {
  if (!ARTIFACT_DIR) return "";
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const safeName = routeName.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-") || "root";
  const path = `${ARTIFACT_DIR}/platform-academy-${viewport.name}-${safeName}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

const browser = await chromium.launch();
const failures = [];
try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      acceptDownloads: true,
      colorScheme: "dark",
      viewport
    });
    const page = await context.newPage();
    const browserIssues = [];

    page.on("console", (message) => {
      if (message.type() === "error") browserIssues.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => browserIssues.push(`pageerror: ${error.message}`));
    page.on("request", (request) => {
      if (request.url().includes("/api/events") || request.url().includes("on-demand-demos.bozhi.dev")) {
        browserIssues.push(`unexpected telemetry request: ${request.method()} ${request.url()}`);
      }
    });
    page.on("requestfailed", (request) => {
      if (request.method() === "GET" && request.failure()?.errorText === "net::ERR_ABORTED") return;
      if (!isIgnoredRequest(request)) {
        browserIssues.push(`request failed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.trim());
      }
    });
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400 && !response.url().endsWith("/favicon.ico")) {
        browserIssues.push(`bad response: ${status} ${response.url()}`);
      }
    });

    try {
      await assertResetProgressTotals(page);
      for (const route of routes) await assertRoute(page, route);
      if (browserIssues.length) throw new Error(browserIssues.join("\n"));
      console.log(`Verified ${routes.length} Platform Academy routes at ${viewport.name} (${viewport.width}x${viewport.height})`);
    } catch (error) {
      const routePath = new URL(page.url()).pathname || "unknown";
      const screenshot = await captureFailureScreenshot(page, viewport, routePath);
      const suffix = screenshot ? ` (screenshot: ${screenshot})` : "";
      failures.push(`${viewport.name}: ${error.message}${suffix}`);
    }

    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  throw new Error(`Platform Academy route smoke failed:\n- ${failures.join("\n- ")}`);
}

console.log(`Platform Academy route smoke passed for ${WEB_BASE}.`);
