import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WEB_BASE = normalizeBase(process.env.WEB_BASE || process.env.PLATFORM_WEB_BASE || "https://platform-academy.bozhi.dev");
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const SETTLE_MS = Number(process.env.SMOKE_SETTLE_MS || 1000);

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const routes = [
  { path: "/", heading: "Platform Engineering Readiness", markers: ["Curriculum", "CONTINUE LESSON", "READINESS SCORE"] },
  { path: "/dashboard/home", heading: "Platform Engineering Readiness", markers: ["Curriculum", "CONTINUE LESSON", "READINESS SCORE"] },
  { path: "/roadmap", heading: "Platform Engineering Roadmap", markers: ["Platform Engineering Roadmap", "All levels"] },
  { path: "/labs", heading: "Lab Queue", markers: ["Lab Queue", "Open workbook"] },
  { path: "/labs/trace-service-to-pod", heading: "Lab Workbook", markers: ["Trace Service traffic to ready Pods", "Workbook", "Evidence"] },
  { path: "/resources", heading: "Resource Index", markers: ["Resource Index", "330 resources", "All domains"] },
  { path: "/resources/linux-project-brief", heading: "Resource Detail", markers: ["Linux Portfolio Project Brief", "Operator workflow"] },
  { path: "/courses/platform-kubernetes-fundamentals/lessons/1", heading: "Lesson Reader", markers: ["platform-kubernetes-fundamentals", "Lesson 1"] },
  { path: "/interview-prep", heading: "Interview Prep", markers: ["Interview Prep", "Question queue", "Answer write-up"] },
  { path: "/missing-route", heading: "Page not found", markers: ["Page not found", "Open dashboard"] },
];

const forbiddenMarkers = [
  "Platform Academy is unavailable.",
  "Unexpected token",
  "Resource library",
  "320 matches",
  "22 visible packs",
];

function normalizeBase(value) {
  return value.replace(/\/+$/, "");
}

function shouldIgnoreFailedRequest(request) {
  try {
    const url = new URL(request.url());
    return url.pathname === "/favicon.ico" || request.resourceType() === "image" || request.resourceType() === "font";
  } catch {
    return false;
  }
}

async function allVisibleText(page) {
  return page.evaluate(() => {
    const shadowText = Array.from(document.querySelectorAll(".reference-figma-screen"))
      .map((host) => host.shadowRoot?.querySelector(".figma-shadow-root")?.innerText || "")
      .join("\n");
    return `${document.body.innerText}\n${shadowText}`.replace(/\s+/g, " ").trim();
  });
}

async function checkRoute(context, viewport, route) {
  const page = await context.newPage();
  const issues = [];

  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`console: ${message.text().slice(0, 300)}`);
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${String(error.message || error).slice(0, 300)}`);
  });
  page.on("request", (request) => {
    if (request.url().includes("/api/events") || request.url().includes("on-demand-demos.bozhi.dev")) {
      issues.push(`unexpected telemetry request: ${request.method()} ${request.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (!shouldIgnoreFailedRequest(request)) {
      issues.push(`request failed: ${request.url()} ${request.failure()?.errorText || ""}`.trim());
    }
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400 && !response.url().endsWith("/favicon.ico")) issues.push(`bad response: ${status} ${response.url()}`);
  });

  const response = await page.goto(`${WEB_BASE}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: TIMEOUT_MS,
  });
  if (!response || response.status() < 200 || response.status() >= 400) {
    issues.push(`navigation: expected 2xx, got ${response?.status() || "no response"}`);
  }

  await page.waitForTimeout(SETTLE_MS);
  const heading = await page.locator("main > h1#app-route-heading").textContent({ timeout: TIMEOUT_MS }).catch(() => "");
  if ((heading || "").trim() !== route.heading) issues.push(`heading mismatch: expected ${route.heading}, got ${heading || "empty"}`);

  const text = await allVisibleText(page);
  for (const marker of route.markers) {
    if (!text.includes(marker)) issues.push(`missing marker: ${marker}`);
  }
  for (const marker of forbiddenMarkers) {
    if (text.includes(marker)) issues.push(`unexpected legacy marker: ${marker}`);
  }

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (horizontalOverflow > 2) issues.push(`horizontal overflow: ${horizontalOverflow}px`);

  const accessibilityIssues = await seriousAccessibilityViolations(page);
  issues.push(...accessibilityIssues.map((issue) => `accessibility: ${issue}`));

  await page.close();
  if (issues.length) {
    throw new Error(`${viewport.name} ${route.path}\n${issues.join("\n")}`);
  }
}

async function seriousAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact || ""))
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} node(s))`);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      colorScheme: "dark",
      userAgent: "platform-academy-static-browser-smoke/1.0",
      viewport: { width: viewport.width, height: viewport.height },
    });
    for (const route of routes) {
      await checkRoute(context, viewport, route);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(
  `Platform Academy static browser smoke passed for ${WEB_BASE} across ${routes.length} route(s), ${viewports.length} viewport(s), no telemetry requests, and serious/critical accessibility checks.`
);
