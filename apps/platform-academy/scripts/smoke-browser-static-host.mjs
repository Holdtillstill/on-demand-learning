import { chromium } from "@playwright/test";

const WEB_BASE = normalizeBase(process.env.WEB_BASE || process.env.PLATFORM_WEB_BASE || "https://platform-academy.bozhi.dev");
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const SETTLE_MS = Number(process.env.SMOKE_SETTLE_MS || 1000);

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const routes = [
  { path: "/", markers: ["Platform Academy", "Curriculum", "Lab inventory", "Interview bank"] },
  { path: "/dashboard/home", markers: ["Platform Academy", "Curriculum", "Lab inventory", "Interview bank"] },
  { path: "/roadmap", markers: ["Roadmap from kubectl basics to running platforms", "Checkpoints"] },
  { path: "/labs", markers: ["Labs for incidents and architecture reviews", "Evidence journal"] },
  { path: "/labs/trace-service-to-pod", markers: ["Trace Service traffic to ready Pods", "GUIDED LAB RUN SEQUENCE"] },
  { path: "/resources", markers: ["Resource library", "320 matches"] },
  { path: "/interview-prep", markers: ["Interview prep", "22 visible packs"] },
  { path: "/missing-route", markers: ["Page not found", "Open dashboard"] },
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

async function checkRoute(context, viewport, route) {
  const page = await context.newPage();
  const issues = [];

  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`console: ${message.text().slice(0, 300)}`);
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${String(error.message || error).slice(0, 300)}`);
  });
  page.on("requestfailed", (request) => {
    if (!shouldIgnoreFailedRequest(request)) {
      issues.push(`request failed: ${request.url()} ${request.failure()?.errorText || ""}`.trim());
    }
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) issues.push(`bad response: ${status} ${response.url()}`);
  });

  await page.route("https://on-demand-demos.bozhi.dev/api/events", (eventRoute) => {
    eventRoute.fulfill({ status: 202, contentType: "application/json", body: "{}" });
  });

  const response = await page.goto(`${WEB_BASE}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: TIMEOUT_MS,
  });
  if (!response || response.status() < 200 || response.status() >= 400) {
    issues.push(`navigation: expected 2xx, got ${response?.status() || "no response"}`);
  }

  await page.waitForTimeout(SETTLE_MS);
  const bodyText = await page.locator("body").innerText({ timeout: TIMEOUT_MS }).catch(() => "");
  for (const marker of route.markers) {
    if (!bodyText.includes(marker)) issues.push(`missing marker: ${marker}`);
  }
  for (const badText of ["Platform Academy is unavailable.", "Unexpected token"]) {
    if (bodyText.includes(badText)) issues.push(`unexpected text: ${badText}`);
  }

  await page.close();
  if (issues.length) {
    throw new Error(`${viewport.name} ${route.path}\n${issues.join("\n")}`);
  }
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

console.log(`Platform Academy static browser smoke passed for ${WEB_BASE} across ${routes.length} route(s) and ${viewports.length} viewport(s).`);
