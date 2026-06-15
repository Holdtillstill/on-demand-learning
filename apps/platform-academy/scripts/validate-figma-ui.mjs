import { chromium } from "playwright";

const WEB_BASE = (process.env.WEB_BASE || process.env.PLATFORM_WEB_BASE || "http://127.0.0.1:5180").replace(/\/+$/, "");
const HEADLESS = process.env.UI_HEADLESS !== "false";
const TIMEOUT = Number(process.env.UI_TIMEOUT_MS || 20000);
const DESKTOP = { width: 1280, height: 820 };
const MOBILE = { width: 390, height: 844 };
const THEME_KEY = "platform-academy-theme";
const API_FALLBACK_BASES = [
  process.env.SMOKE_API_BASE,
  process.env.VITE_API_BASE_URL,
  "http://127.0.0.1:8000",
  "http://localhost:8000",
]
  .filter(Boolean)
  .map((base) => String(base).replace(/\/+$/, ""));

const routeExpectations = [
  { path: "/dashboard/home", text: ["Curriculum", "CONTINUE LESSON", "READINESS SCORE"], figma: true },
  { path: "/", text: ["Curriculum", "CONTINUE LESSON", "READINESS SCORE"], figma: true },
  { path: "/roadmap", text: ["Platform Engineering Roadmap", "All levels", "Linux Operator Foundations"], figma: true },
  { path: "/labs", text: ["Level", "All levels", "Open workbook"], figma: true },
  { path: "/labs/trace-service-to-pod", text: ["Trace Service traffic to ready Pods", "Brief", "Console", "Workbook", "Evidence", "Rubric"], figma: true },
  { path: "/interview-prep", text: ["Interview Prep", "Question queue", "Answer write-up", "Docs to read", "Related labs"], figma: true },
  { path: "/resources", text: ["Resource Index", "330 resources", "All domains", "All levels", "All types"], figma: true },
  { path: "/resources/linux-project-brief", text: ["Linux Portfolio Project Brief", "Operator workflow", "Evidence prompts"], figma: true },
  { path: "/courses/platform-kubernetes-fundamentals", text: ["platform-kubernetes-fundamentals", "Lesson 1"], figma: true },
  { path: "/courses/platform-kubernetes-fundamentals/lessons/1", text: ["platform-kubernetes-fundamentals", "Lesson 1"], figma: true },
  { path: "/lessons/1", text: ["Lesson 1"], figma: true },
  { path: "/missing-route", text: ["Page not found"], figma: false },
];

const routeRenderMarkers = {
  "/dashboard/home": "READINESS SCORE",
  "/": "READINESS SCORE",
  "/roadmap": "Platform Engineering Roadmap",
  "/labs": "Open workbook",
  "/labs/trace-service-to-pod": "Trace Service traffic to ready Pods",
  "/interview-prep": "Question queue",
  "/resources": "Resource Index",
  "/resources/linux-project-brief": "Linux Portfolio Project Brief",
  "/courses/platform-kubernetes-fundamentals": "Lesson 1",
  "/courses/platform-kubernetes-fundamentals/lessons/1": "Lesson 1",
  "/lessons/1": "Lesson 1",
};

const results = [];
const failures = [];
const browserErrors = [];
let ignoredBrowserErrorCount = 0;
let pendingExpectedApiResourceFailures = 0;

function url(path) {
  return `${WEB_BASE}${path}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function step(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, status: "pass", ms: Date.now() - started });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ name, message });
    results.push({ name, status: "fail", ms: Date.now() - started, message });
  }
}

function rectFor(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    left: Math.round(rect.left * 10) / 10,
    top: Math.round(rect.top * 10) / 10,
    width: Math.round(rect.width * 10) / 10,
    height: Math.round(rect.height * 10) / 10,
  };
}

function visible(element) {
  if (!(element instanceof HTMLElement)) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function isExpectedApiFallbackEndpoint(message) {
  const value = String(message || "");
  if (value.includes("/api/events") || value.includes("on-demand-demos.bozhi.dev")) return false;
  const hitsLocalApiBase = API_FALLBACK_BASES.some((base) => value.includes(base));
  if (!hitsLocalApiBase) return false;
  return value.includes("/api/platform-academy/") || value.includes("/api/users/") || value.includes("/api/progress/");
}

function isExpectedApiFallbackNoise(message) {
  const lower = String(message || "").toLowerCase();
  if (!isExpectedApiFallbackEndpoint(message)) return false;
  return (
    lower.includes("cors policy") ||
    lower.includes("access to fetch") ||
    lower.includes("requestfailed") ||
    lower.includes("net::err_failed") ||
    lower.includes("failed to fetch")
  );
}

function isGenericExpectedResourceFailure(message) {
  const lower = String(message || "").toLowerCase();
  return lower.includes("failed to load resource") && lower.includes("net::err_failed");
}

function recordBrowserError(message, options = {}) {
  if (isExpectedApiFallbackNoise(message)) {
    ignoredBrowserErrorCount += 1;
    if (options.pendingResourceFailure) pendingExpectedApiResourceFailures += 1;
    return;
  }
  if (pendingExpectedApiResourceFailures > 0 && isGenericExpectedResourceFailure(message)) {
    pendingExpectedApiResourceFailures -= 1;
    ignoredBrowserErrorCount += 1;
    return;
  }
  browserErrors.push(message);
}

async function setTheme(page, theme) {
  await page.evaluate((nextTheme) => {
    localStorage.setItem("platform-academy-theme", nextTheme);
  }, theme);
}

async function goto(page, path, { theme = "dark", viewport = DESKTOP, waitForFigma = true } = {}) {
  await page.setViewportSize(viewport);
  await setTheme(page, theme).catch(() => undefined);
  await page.goto(url(path), { waitUntil: "domcontentloaded", timeout: TIMEOUT });
  let currentTheme = await page.evaluate(() => document.documentElement.dataset.paTheme || "");
  if (currentTheme !== theme && await page.locator(".theme-toggle-button").isVisible().catch(() => false)) {
    await page.locator(".theme-toggle-button").click();
    await page.waitForFunction((nextTheme) => document.documentElement.dataset.paTheme === nextTheme, theme, { timeout: TIMEOUT });
    currentTheme = await page.evaluate(() => document.documentElement.dataset.paTheme || "");
  }
  assert(currentTheme === theme, `Expected ${theme} theme after navigation, got ${currentTheme || "(missing)"}`);
  if (waitForFigma) await waitForFigmaRender(page, path);
  const closeButton = page.getByLabel("Close profile and recovery");
  if (await closeButton.isVisible().catch(() => false)) await closeButton.click();
  await page.waitForTimeout(150);
}

function expectedTextForPath(path) {
  return [routeRenderMarkers[path] || routeExpectations.find((route) => route.path === path)?.text?.[0]].filter(Boolean);
}

async function waitForFigmaRender(page, path) {
  const expected = expectedTextForPath(path);
  await page.waitForSelector(".reference-figma-screen", { timeout: TIMEOUT });
  try {
    await page.waitForFunction(({ expectedText }) => {
      const host = document.querySelector(".reference-figma-screen");
      const root = host?.shadowRoot?.querySelector(".figma-shadow-root");
      const child = root?.firstElementChild;
      if (!(root instanceof HTMLElement) || !(child instanceof HTMLElement)) return false;
      const rect = child.getBoundingClientRect();
      const text = (root.textContent || "").replace(/\s+/g, " ").trim();
      return rect.width > 0 && rect.height > 0 && text.length > 0 && expectedText.every((value) => text.includes(value));
    }, { expectedText: expected }, { timeout: TIMEOUT });
  } catch (error) {
    const detail = await page.evaluate(({ expectedText }) => {
      const host = document.querySelector(".reference-figma-screen");
      const root = host?.shadowRoot?.querySelector(".figma-shadow-root");
      const child = root?.firstElementChild;
      const rect = child instanceof HTMLElement ? child.getBoundingClientRect() : null;
      const text = (root?.textContent || "").replace(/\s+/g, " ").trim();
      return {
        currentPath: window.location.pathname,
        theme: document.documentElement.dataset.paTheme || "",
        expectedText,
        childRect: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        text: text.slice(0, 240),
      };
    }, { expectedText: expected }).catch(() => null);
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Timed out waiting for Figma render for ${path}: ${reason}; state=${JSON.stringify(detail)}`);
  }
}

async function shadowText(page) {
  return page.locator(".reference-figma-screen").evaluate((host) => {
    return host.shadowRoot?.querySelector(".figma-shadow-root")?.innerText || "";
  });
}

async function hostEval(page, fn, arg) {
  return page.locator(".reference-figma-screen").evaluate(fn, arg);
}

async function clickRole(page, role, name, options = {}) {
  const locator = page.getByRole(role, { name, exact: options.exact ?? false }).first();
  await locator.waitFor({ state: "visible", timeout: TIMEOUT });
  await locator.click({ timeout: TIMEOUT });
}

async function clickText(page, text) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: "visible", timeout: TIMEOUT });
  await locator.click({ timeout: TIMEOUT });
}

async function expectPath(page, expected) {
  const path = new URL(page.url()).pathname;
  if (expected instanceof RegExp) assert(expected.test(path), `Expected path to match ${expected}, got ${path}`);
  else assert(path === expected, `Expected path ${expected}, got ${path}`);
}

async function expectShadowIncludes(page, values) {
  const text = await shadowText(page);
  for (const value of values) assert(text.includes(value), `Expected shadow text to include "${value}"`);
  return text;
}

async function activeChipTexts(page) {
  return page.locator('button[data-active="true"]').evaluateAll((elements) =>
    elements.map((element) => (element.textContent || "").replace(/\s+/g, " ").trim())
  );
}

async function resetBrowserProgress(page) {
  await page.goto(url("/dashboard/home"), { waitUntil: "domcontentloaded", timeout: TIMEOUT }).catch(() => undefined);
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

async function dashboardProgressReadout(page) {
  const dashboardText = normalizeText(await shadowText(page));
  const shellText = normalizeText(await page.getByLabel("Progress").innerText());
  const scoreMatch = dashboardText.match(/READINESS SCORE\s+(\d+)\s*\/100/i);
  const labsMatch = shellText.match(/Labs\s*(\d+)\/(\d+)/i);
  const resourcesMatch = shellText.match(/Resources\s*(\d+)\/(\d+)/i);
  const interviewMatch = shellText.match(/Interview Qs\s*(\d+)\/(\d+)/i);
  assert(scoreMatch, `Could not read readiness score from dashboard text: ${dashboardText.slice(0, 200)}`);
  assert(labsMatch, `Could not read lab progress from shell text: ${shellText}`);
  assert(resourcesMatch, `Could not read resource progress from shell text: ${shellText}`);
  assert(interviewMatch, `Could not read interview progress from shell text: ${shellText}`);
  return {
    readinessScore: Number(scoreMatch[1]),
    labs: `${labsMatch[1]}/${labsMatch[2]}`,
    resources: `${resourcesMatch[1]}/${resourcesMatch[2]}`,
    interview: `${interviewMatch[1]}/${interviewMatch[2]}`,
  };
}

async function visibleControlLabels(page) {
  return hostEval(page, (host) => {
    const root = host.shadowRoot;
    if (!root) return [];
    return Array.from(root.querySelectorAll("button, a, [role='button']"))
      .filter((element) => {
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        label: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("title") || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((entry) => entry.label);
  });
}

async function captureLayout(page, path, theme, viewport = DESKTOP) {
  await goto(page, path, { theme, viewport, waitForFigma: true });
  return page.evaluate(() => {
    function rectForPage(element) {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left * 10) / 10,
        top: Math.round(rect.top * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      };
    }

    const shellSelectors = [
      ".product-shell",
      ".product-topline",
      ".product-body",
      ".product-sidebar",
      ".product-frame",
      ".mobile-product-nav",
      ".reference-figma-screen",
    ];
    const shell = {};
    for (const selector of shellSelectors) shell[selector] = rectForPage(document.querySelector(selector));

    const host = document.querySelector(".reference-figma-screen");
    const root = host?.shadowRoot;
    const shadowRoot = root?.querySelector(".figma-shadow-root");
    const shadowChild = shadowRoot?.firstElementChild;
    const shadow = {
      root: rectForPage(shadowRoot),
      child: rectForPage(shadowChild),
      childCount: shadowChild?.children.length || 0,
      children: shadowChild ? Array.from(shadowChild.children).slice(0, 12).map((element, index) => ({
        index,
        tag: element.tagName,
        className: String(element.getAttribute("class") || "").slice(0, 120),
        rect: rectForPage(element),
      })) : [],
    };

    const ignoredTreeTags = new Set(["svg", "path", "circle", "rect", "line", "polyline"]);
    const normalizePageText = (value) => (value || "").replace(/\s+/g, " ").trim();
    const visibleForPage = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const pathFor = (element) => {
      const parts = [];
      let node = element;
      while (node && node.nodeType === 1 && node !== document.documentElement) {
        const parent = node.parentElement;
        const siblings = parent ? Array.from(parent.children).filter((child) => child.tagName === node.tagName) : [];
        parts.unshift(`${node.tagName.toLowerCase()}:nth-${siblings.indexOf(node) + 1}`);
        node = parent;
      }
      return parts.join(">");
    };
    const shellTree = Array.from(document.querySelectorAll([
      ".product-topline",
      ".product-topline *",
      ".product-sidebar",
      ".product-sidebar *",
      ".mobile-product-nav",
      ".mobile-product-nav *",
    ].join(", ")))
      .filter((element) => {
        if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false;
        if (ignoredTreeTags.has(element.tagName.toLowerCase())) return false;
        if (element.closest(".visually-hidden")) return false;
        return visibleForPage(element);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          path: pathFor(element),
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          text: normalizePageText(element.textContent),
          rect: {
            left: Math.round(rect.left * 100) / 100,
            top: Math.round(rect.top * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
          },
          style: {
            display: style.display,
            flex: style.flex,
            gap: style.gap,
            marginTop: style.marginTop,
            padding: style.padding,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            textTransform: style.textTransform,
          },
        };
      });

    return {
      path: location.pathname,
      theme: document.documentElement.dataset.paTheme || "",
      viewport: { width: innerWidth, height: innerHeight },
      shell,
      shellTree,
      shadow,
    };
  });
}

function compareRects(label, darkRect, lightRect, tolerance = 1.5) {
  if (!darkRect && !lightRect) return;
  assert(Boolean(darkRect && lightRect), `${label} exists in only one theme`);
  for (const key of ["left", "top", "width", "height"]) {
    const delta = Math.abs(darkRect[key] - lightRect[key]);
    assert(delta <= tolerance, `${label}.${key} changed by ${delta}px (${darkRect[key]} -> ${lightRect[key]})`);
  }
}

function compareLayout(route, dark, light) {
  assert(dark.theme === "dark", `${route} dark capture did not render dark theme`);
  assert(light.theme === "light", `${route} light capture did not render light theme`);
  for (const selector of Object.keys(dark.shell)) {
    compareRects(`${route} ${selector}`, dark.shell[selector], light.shell[selector]);
  }
  compareRects(`${route} shadow root`, dark.shadow.root, light.shadow.root);
  compareRects(`${route} shadow child`, dark.shadow.child, light.shadow.child);
  assert(dark.shadow.childCount === light.shadow.childCount, `${route} shadow child count changed ${dark.shadow.childCount} -> ${light.shadow.childCount}`);
  for (let i = 0; i < Math.min(dark.shadow.children.length, light.shadow.children.length); i += 1) {
    compareRects(`${route} shadow child ${i}`, dark.shadow.children[i].rect, light.shadow.children[i].rect);
  }
  compareShellTree(route, dark.shellTree, light.shellTree);
}

function compareShellTree(route, darkTree, lightTree) {
  assert(darkTree.length === lightTree.length, `${route} visible shell element count changed ${darkTree.length} -> ${lightTree.length}`);
  for (let index = 0; index < darkTree.length; index += 1) {
    const darkNode = darkTree[index];
    const lightNode = lightTree[index];
    const label = `${route} shell element ${index} ${darkNode.text || darkNode.className || darkNode.tag}`;
    for (const key of ["tag", "className", "text"]) {
      assert(darkNode[key] === lightNode[key], `${label}.${key} changed ${JSON.stringify(darkNode[key])} -> ${JSON.stringify(lightNode[key])}`);
    }
    for (const key of Object.keys(darkNode.style)) {
      assert(darkNode.style[key] === lightNode.style[key], `${label}.style.${key} changed ${JSON.stringify(darkNode.style[key])} -> ${JSON.stringify(lightNode.style[key])}`);
    }
    for (const key of ["left", "top", "width", "height"]) {
      const delta = Math.abs(darkNode.rect[key] - lightNode.rect[key]);
      assert(delta <= 0.35, `${label}.rect.${key} changed by ${delta}px (${darkNode.rect[key]} -> ${lightNode.rect[key]})`);
    }
  }
}

function parseRgb(value) {
  const match = String(value || "").match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = 1] = match[1].split(",").map((part) => Number(part.trim()));
  if ([r, g, b, a].some((item) => !Number.isFinite(item))) return null;
  return { r, g, b, a };
}

function relativeLuminance(value) {
  const color = parseRgb(value);
  if (!color) return null;
  if (color.a === 0) return 1;
  const channels = [color.r, color.g, color.b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

async function validateRouteLoads(page) {
  for (const route of routeExpectations) {
    await step(`route loads ${route.path}`, async () => {
      await goto(page, route.path, { theme: "dark", waitForFigma: route.figma });
      if (route.figma) await expectShadowIncludes(page, route.text);
      else {
        const body = await page.locator("body").innerText({ timeout: TIMEOUT });
        for (const expected of route.text) assert(body.includes(expected), `Expected page to include "${expected}"`);
      }
    });
  }
}

async function validateLayoutParity(page) {
  for (const route of routeExpectations.filter((item) => item.figma)) {
    await step(`dark/light desktop layout parity ${route.path}`, async () => {
      const dark = await captureLayout(page, route.path, "dark", DESKTOP);
      const light = await captureLayout(page, route.path, "light", DESKTOP);
      compareLayout(route.path, dark, light);
    });
    await step(`dark/light mobile layout parity ${route.path}`, async () => {
      const dark = await captureLayout(page, route.path, "dark", MOBILE);
      const light = await captureLayout(page, route.path, "light", MOBILE);
      compareLayout(`${route.path} mobile`, dark, light);
    });
  }
}

async function validateLightThemeBadgePalette(page) {
  const badgeClassFragments = [
    "px-1.5 py-0.5 rounded-sm",
    "px-1.5 py-px rounded-sm",
    "absolute flex items-center justify-center rounded-sm",
    "inline-block px-1.5 py-px rounded-sm whitespace-nowrap",
    "inline-block px-1.5 py-px rounded-sm",
  ];

  await step("light theme tag badges use light backgrounds", async () => {
    const offenders = [];
    let checked = 0;

    for (const route of routeExpectations.filter((item) => item.figma)) {
      await goto(page, route.path, { theme: "light", viewport: DESKTOP });
      const badges = await hostEval(page, (host, fragments) => {
        const root = host.shadowRoot;
        if (!root) return [];
        return Array.from(root.querySelectorAll("*"))
          .map((element) => {
            if (!(element instanceof HTMLElement)) return null;
            const className = String(element.getAttribute("class") || "");
            const matches =
              fragments.some((fragment) => className.includes(fragment)) ||
              (className.includes("rounded-sm") && (className.includes("px-1.5") || className.includes("py-px") || className.includes("py-0.5")));
            if (!matches) return null;
            const rect = element.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return null;
            const style = getComputedStyle(element);
            return {
              text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
              className,
              background: style.backgroundColor,
              color: style.color,
            };
          })
          .filter(Boolean);
      }, badgeClassFragments);

      checked += badges.length;
      for (const badge of badges) {
        const luminance = relativeLuminance(badge.background);
        if (luminance !== null && luminance < 0.35 && badge.background !== "rgba(0, 0, 0, 0)" && badge.background !== "transparent") {
          offenders.push({ route: route.path, luminance: Math.round(luminance * 1000) / 1000, ...badge });
        }
      }
    }

    assert(checked > 0, "No rounded-sm tag badges were found to validate");
    assert(offenders.length === 0, `Light theme has dark tag badge backgrounds: ${JSON.stringify(offenders.slice(0, 12))}`);
  });
}

async function validateSemanticHardening(page) {
  await step("routes expose real h1 and focusable Figma content region", async () => {
    for (const route of routeExpectations.filter((item) => item.figma)) {
      await goto(page, route.path, { theme: "dark", viewport: DESKTOP });
      const heading = normalizeText(await page.locator("main > h1#app-route-heading").textContent({ timeout: TIMEOUT }));
      assert(heading.length > 0, `${route.path} is missing the app-level h1`);
      const region = await hostEval(page, (host) => {
        const mount = host.shadowRoot?.querySelector(".figma-shadow-root");
        return {
          role: mount?.getAttribute("role") || "",
          label: mount?.getAttribute("aria-label") || "",
          tabIndex: mount instanceof HTMLElement ? mount.tabIndex : null,
        };
      });
      assert(region.role === "region", `${route.path} shadow mount role mismatch: ${region.role}`);
      assert(region.label === "Platform Academy content", `${route.path} shadow mount aria-label mismatch: ${region.label}`);
      assert(region.tabIndex === 0, `${route.path} shadow mount is not keyboard-focusable`);
    }
  });

  await step("main internal scroll regions are keyboard focusable", async () => {
    const expectedRegions = [
      { path: "/labs", labels: ["Lab queue", "Selected lab preview"] },
      { path: "/interview-prep", labels: ["Interview pack list", "Interview practice details"] },
      { path: "/resources/linux-project-brief", labels: ["Resource detail content"] },
    ];

    for (const route of expectedRegions) {
      await goto(page, route.path, { theme: "dark", viewport: DESKTOP });
      const labels = await hostEval(page, (host) => {
        const root = host.shadowRoot;
        if (!root) return [];
        return Array.from(root.querySelectorAll("[role='region'][tabindex='0']"))
          .filter((element) => element instanceof HTMLElement)
          .map((element) => element.getAttribute("aria-label") || "");
      });
      for (const label of route.labels) assert(labels.includes(label), `${route.path} missing focusable region "${label}"`);
    }
  });

  await step("mobile resource index uses cards instead of the desktop table", async () => {
    await goto(page, "/resources", { theme: "dark", viewport: MOBILE });
    const layout = await hostEval(page, (host) => {
      const root = host.shadowRoot;
      const card = root?.querySelector("[data-resource-card='true']");
      const table = root?.querySelector(".hidden.md\\:block");
      return {
        cards: root?.querySelectorAll("[data-resource-card='true']").length || 0,
        cardDisplay: card instanceof HTMLElement ? getComputedStyle(card).display : "",
        tableDisplay: table instanceof HTMLElement ? getComputedStyle(table).display : "",
      };
    });
    assert(layout.cards > 0, "Mobile resources did not render resource cards");
    assert(layout.cardDisplay !== "none", `Mobile resource cards are hidden (${layout.cardDisplay})`);
    assert(layout.tableDisplay === "none", `Desktop resource table is still visible on mobile (${layout.tableDisplay})`);
  });

  await step("key product routes avoid nested interactive controls", async () => {
    const selector = [
      "button button",
      "button [role='button']",
      "[role='button'] button",
      "a button",
      "button a",
    ].join(",");
    const routes = ["/labs", "/interview-prep", "/resources", "/resources/linux-project-brief"];
    for (const route of routes) {
      await goto(page, route, { theme: "dark", viewport: DESKTOP });
      const offenders = await page.evaluate((nestedSelector) => {
        function isVisible(element) {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        }
        function collect(root, scope) {
          return Array.from(root.querySelectorAll(nestedSelector))
            .filter((element) => element instanceof HTMLElement && isVisible(element))
            .map((element) => ({
              scope,
              tag: element.tagName.toLowerCase(),
              label: (element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
            }));
        }
        const pageOffenders = collect(document, "document");
        const shadowOffenders = Array.from(document.querySelectorAll(".reference-figma-screen"))
          .flatMap((host) => host.shadowRoot ? collect(host.shadowRoot, "shadow") : []);
        return [...pageOffenders, ...shadowOffenders];
      }, selector);
      assert(offenders.length === 0, `${route} has nested interactive controls: ${JSON.stringify(offenders.slice(0, 8))}`);
    }
  });
}

async function validateShell(page) {
  await step("topbar links navigate", async () => {
    await goto(page, "/dashboard/home", { theme: "dark" });
    await clickRole(page, "link", "Lab Queue", { exact: true });
    await expectPath(page, "/labs");
    await clickRole(page, "link", "Resource Index", { exact: true });
    await expectPath(page, "/resources");
  });

  await step("topbar omits duplicated route labels", async () => {
    for (const route of ["/resources", "/roadmap", "/labs", "/interview-prep"]) {
      await goto(page, route, { theme: "dark", viewport: DESKTOP, waitForFigma: false });
      const desktopBreadcrumb = normalizeText(await page.locator(".topline-breadcrumb").textContent({ timeout: TIMEOUT }));
      await goto(page, route, { theme: "light", viewport: MOBILE, waitForFigma: false });
      const mobileBreadcrumb = normalizeText(await page.locator(".topline-breadcrumb").textContent({ timeout: TIMEOUT }));
      for (const breadcrumb of [desktopBreadcrumb, mobileBreadcrumb]) {
        assert(!/resource index|roadmap|lab queue|interview prep/i.test(breadcrumb), `${route} duplicated route label in topbar: ${breadcrumb}`);
      }
    }
  });

  await step("theme toggle keeps route and layout-critical state", async () => {
    await goto(page, "/labs", { theme: "dark" });
    await page.getByRole("button", { name: "Advanced", exact: true }).first().click();
    const before = { path: new URL(page.url()).pathname, active: await activeChipTexts(page), theme: await page.evaluate(() => document.documentElement.dataset.paTheme || "") };
    await page.locator(".theme-toggle-button").click();
    await page.waitForTimeout(250);
    const after = { path: new URL(page.url()).pathname, active: await activeChipTexts(page), theme: await page.evaluate(() => document.documentElement.dataset.paTheme || "") };
    assert(before.path === after.path, `Theme switch changed route ${before.path} -> ${after.path}`);
    assert(before.active.includes("Advanced") && after.active.includes("Advanced"), "Theme switch lost selected Advanced filter");
    assert(before.theme === "dark" && after.theme === "light", `Theme switch did not toggle dark -> light (${before.theme} -> ${after.theme})`);
  });

  await step("profile recovery modal key/copy/restore/export/import/reset flows", async () => {
    await goto(page, "/dashboard/home", { theme: "dark" });
    const initialLearner = await page.evaluate(() => localStorage.getItem("platform-academy-learner-id") || "");

    await page.getByLabel("Open profile and recovery").click();
    await page.getByRole("dialog", { name: "Profile & Recovery" }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    await page.getByText("Copied!", { exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByLabel("Close profile and recovery").click();

    await page.getByLabel("Open guest recovery key").click();
    await page.getByRole("textbox", { name: "Restore from key" }).fill("not-a-valid-key");
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    await page.getByText("Enter a valid guest recovery key.").waitFor({ state: "visible", timeout: TIMEOUT });

    await page.getByRole("tab", { name: "Export", exact: true }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: TIMEOUT }),
      page.getByRole("button", { name: "Export profile.json", exact: true }).click(),
    ]);
    assert((await download.suggestedFilename()).endsWith("-state.json"), "Export did not produce a state JSON download");
    await download.delete().catch(() => undefined);

    await page.getByRole("tab", { name: "Import", exact: true }).click();
    await page.getByLabel("Or paste JSON directly").fill("{}");
    await page.getByRole("button", { name: "Import pasted JSON", exact: true }).click();
    await page.locator(".recovery-message.error").waitFor({ state: "visible", timeout: TIMEOUT });

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: TIMEOUT }),
      page.getByRole("button", { name: /Drop profile\.json here/ }).click(),
    ]);
    await fileChooser.setFiles({ name: "invalid-profile.json", mimeType: "application/json", buffer: Buffer.from("{}") });
    await page.locator(".recovery-message.error").waitFor({ state: "visible", timeout: TIMEOUT });

    await page.getByRole("tab", { name: "Reset", exact: true }).click();
    await page.getByRole("button", { name: "Reset profile", exact: true }).click();
    await page.getByText("Are you absolutely sure?").waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: "Reset profile", exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Reset profile", exact: true }).click();
    await page.getByRole("button", { name: "Yes, reset everything", exact: true }).click();
    await page.getByRole("dialog", { name: "Profile & Recovery" }).waitFor({ state: "hidden", timeout: TIMEOUT });
    const resetLearner = await page.evaluate(() => localStorage.getItem("platform-academy-learner-id") || "");
    assert(resetLearner && resetLearner !== initialLearner, "Reset profile did not create a new local learner id");

    await page.getByLabel("Import profile backup").click();
    await page.getByRole("dialog", { name: "Profile & Recovery" }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("tabpanel").getByText("Import a profile JSON", { exact: false }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByLabel("Close profile and recovery").click();

    await page.getByLabel("Export profile").click();
    await page.getByRole("tabpanel").getByText("Export profile.json", { exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByLabel("Close profile and recovery").click();
  });

  await step("mobile bottom nav is dark and navigates", async () => {
    await goto(page, "/dashboard/home", { theme: "dark", viewport: MOBILE });
    await page.locator('.mobile-product-nav a[href="/labs"]').click();
    await expectPath(page, "/labs");
    await page.waitForFunction(() => {
      const active = document.querySelector(".mobile-product-nav a.active") ?? document.querySelector(".mobile-product-nav a[aria-current='page']");
      return (active?.textContent || "").replace(/\s+/g, " ").trim() === "Labs";
    }, { timeout: TIMEOUT });
    const nav = await page.evaluate(() => {
      const element = document.querySelector(".mobile-product-nav");
      const active = element?.querySelector("a.active") ?? element?.querySelector("a[aria-current='page']");
      const sidebar = document.querySelector(".product-sidebar");
      const frame = document.querySelector(".product-frame");
      const sidebarRect = sidebar?.getBoundingClientRect();
      const frameRect = frame?.getBoundingClientRect();
      const sidebarStyle = sidebar ? getComputedStyle(sidebar) : null;
      return {
        bg: element ? getComputedStyle(element).backgroundColor : "",
        activeBg: active ? getComputedStyle(active).backgroundColor : "",
        activeColor: active ? getComputedStyle(active).color : "",
        activeText: (active?.textContent || "").replace(/\s+/g, " ").trim(),
        sidebarDisplay: sidebarStyle?.display || "",
        sidebarWidth: sidebarRect ? Math.round(sidebarRect.width) : null,
        frameLeft: frameRect ? Math.round(frameRect.left) : null,
      };
    });
    assert(nav.bg === "rgb(6, 8, 16)", `Mobile nav dark background mismatch: ${nav.bg}`);
    assert(nav.activeBg === "rgb(13, 15, 23)", `Mobile nav active background mismatch: ${nav.activeBg}`);
    assert(nav.activeText === "Labs", `Expected mobile active Labs, got ${nav.activeText}`);
    assert(nav.sidebarDisplay === "none" && nav.sidebarWidth === 0, `Mobile sidebar should be hidden, got display=${nav.sidebarDisplay} width=${nav.sidebarWidth}`);
    assert(nav.frameLeft === 0, `Mobile frame should start at viewport left, got ${nav.frameLeft}`);
  });
}

async function validateDashboard(page) {
  await step("dashboard cards and controls navigate", async () => {
    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    await clickText(page, "CONTINUE LESSON");
    await expectPath(page, /\/courses\/.+\/lessons\/\d+$/);

    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Advanced", exact: true }).first().click();
    const active = await activeChipTexts(page);
    assert(active.includes("Advanced"), "Dashboard Advanced filter did not become active");

    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    await clickText(page, "START PRACTICE");
    await expectPath(page, "/interview-prep");

    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    await clickText(page, "Kubernetes Fundamentals");
    await expectPath(page, /\/courses\/.+\/lessons\/\d+$/);
  });
}

async function validateRoadmap(page) {
  await step("roadmap filters, expand/collapse, and course buttons work", async () => {
    await goto(page, "/roadmap", { theme: "dark", viewport: DESKTOP });
    await expectShadowIncludes(page, ["All levels", "Fresher", "Intermediate", "Advanced"]);
    const text = await shadowText(page);
    assert(!/\b(ALL|FRES|INTER|ADVA)\b/.test(text), "Roadmap still contains old abbreviated filter labels");

    await page.getByRole("button", { name: "Advanced", exact: true }).first().click();
    await expectShadowIncludes(page, ["Production EKS Architect"]);

    await page.getByRole("button", { name: "All levels", exact: true }).first().click();
    await clickText(page, "Linux Operator Foundations");
    await expectShadowIncludes(page, ["Linux and Command Line Foundations"]);
    await page.getByRole("button", { name: "Linux and Command Line Foundations", exact: true }).first().click();
    await expectPath(page, /\/courses\/.+\/lessons\/\d+$/);
  });
}

async function validateLabs(page) {
  await step("labs queue filters, star, selection, and workbook navigation work", async () => {
    await goto(page, "/labs", { theme: "dark", viewport: DESKTOP });
    await page.locator("button[aria-label^='Star']").first().click();
    assert(await page.locator("button[aria-pressed='true']").count() > 0, "Star button did not toggle aria-pressed");

    await page.getByRole("button", { name: "Advanced", exact: true }).first().click();
    await page.getByRole("button", { name: "File-only", exact: true }).first().click();
    await page.getByRole("button", { name: "Not started", exact: true }).first().click();
    const active = await activeChipTexts(page);
    for (const expected of ["Advanced", "File-only", "Not started"]) {
      assert(active.includes(expected), `Labs filter ${expected} did not become active`);
    }
    await expectShadowIncludes(page, ["File-only", "Not started"]);

    await page.getByRole("button", { name: "Open workbook", exact: true }).click();
    await page.waitForURL(/\/labs\/[^/]+$/, { timeout: TIMEOUT });
    await expectPath(page, /\/labs\/[^/]+$/);
  });

  await step("lab detail tabs and actions work", async () => {
    await goto(page, "/labs/trace-service-to-pod", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "labs", exact: true }).click();
    await expectPath(page, "/labs");

    await goto(page, "/labs/trace-service-to-pod", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Kubernetes Field Cheatsheet", exact: true }).click();
    await expectPath(page, "/resources/kubernetes-cheatsheet");

    await goto(page, "/labs/trace-service-to-pod", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Console", exact: true }).click();
    await page.getByLabel("Copy validation command 1").click();
    await page.getByLabel("Copy validation command 1").locator("svg").first().waitFor({ state: "visible", timeout: TIMEOUT }).catch(() => undefined);

    await page.getByRole("button", { name: "Workbook", exact: true }).click();
    await page.locator("textarea").first().fill("Validated service selector and ready endpoints.");
    await page.getByRole("button", { name: "Save progress", exact: true }).click();
    await page.waitForTimeout(1200);
    await expectShadowIncludes(page, ["saved"]);

    await page.getByRole("button", { name: "Evidence", exact: true }).click();
    await page.getByRole("button", { name: /Attach pod-running-output/ }).click();
    await expectShadowIncludes(page, ["pod-running-output attached"]);
    await page.getByRole("button", { name: /Remove pod-running-output/ }).click();
    await expectShadowIncludes(page, ["pod-running-output removed"]);

    await page.getByRole("button", { name: "Rubric", exact: true }).click();
    await expectShadowIncludes(page, ["Namespace and cluster setup"]);

    await page.getByRole("button", { name: "Submit lab", exact: true }).click();
    await page.getByRole("button", { name: "Submitted", exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });

    await page.getByRole("button", { name: "Download lab packet", exact: true }).click();
    await page.locator("p").filter({ hasText: /Packet (fallback )?ready/i }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Copy packet", exact: true }).click();
    const rawHref = await page.getByRole("link", { name: "Open raw", exact: true }).getAttribute("href");
    assert(Boolean(rawHref), "Open raw link did not expose an href");
    await page.getByRole("button", { name: "Close lab packet preview", exact: true }).click();
    await page.getByText("Copy packet", { exact: true }).waitFor({ state: "hidden", timeout: TIMEOUT });
  });
}

async function validateResources(page) {
  await step("resources filters, search, pagination, modal, and open-resource work", async () => {
    await goto(page, "/resources", { theme: "dark", viewport: DESKTOP });
    const search = page.getByPlaceholder("search by title, tag, or keyword…");
    await search.fill("kubernetes");
    await expectShadowIncludes(page, ["kubernetes"]);
    await search.fill("");
    await page.getByRole("button", { name: "AWS IAM", exact: true }).click();
    await page.getByRole("button", { name: "Advanced", exact: true }).click();
    await page.getByRole("button", { name: "Runbook", exact: true }).click();
    let active = await activeChipTexts(page);
    for (const expected of ["AWS IAM", "Advanced", "Runbook"]) assert(active.includes(expected), `Resource filter ${expected} did not become active`);

    await page.getByRole("button", { name: "All domains", exact: true }).click();
    await page.getByRole("button", { name: "All levels", exact: true }).click();
    await page.getByRole("button", { name: "All types", exact: true }).click();
    await page.getByRole("button", { name: "Go to resource page 2", exact: true }).click();
    active = await activeChipTexts(page);
    assert(active.includes("2"), "Resources pagination page 2 did not become active");

    await goto(page, "/resources", { theme: "dark", viewport: DESKTOP });
    await clickText(page, "Linux Field Cheatsheet");
    await page.getByText("OPEN RESOURCE", { exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Close resource preview", exact: true }).click();
    await page.getByText("OPEN RESOURCE", { exact: true }).waitFor({ state: "hidden", timeout: TIMEOUT });

    await clickText(page, "Linux Field Cheatsheet");
    await page.getByRole("button", { name: "OPEN RESOURCE", exact: true }).click();
    await expectPath(page, "/resources/linux-cheatsheet");
  });

  await step("resource detail buttons work", async () => {
    await goto(page, "/resources/linux-project-brief", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Copy citation", exact: true }).click();
    await page.getByText("Copied", { exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Mark reviewed", exact: true }).click();
    await page.getByRole("button", { name: "Reviewed", exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("link", { name: "Resource index", exact: true }).click();
    await expectPath(page, "/resources");

    await goto(page, "/resources/linux-project-brief", { theme: "dark", viewport: DESKTOP });
    const related = page.getByRole("button").filter({ hasText: /Linux|Kubernetes|Shell|failure/i }).last();
    await related.click();
    await expectPath(page, /\/labs\/[^/]+$/);
  });
}

async function validateInterview(page) {
  await step("interview filters, downloads, queue, study-plan, and navigation work", async () => {
    await goto(page, "/interview-prep", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Advanced", exact: true }).click();
    let active = await activeChipTexts(page);
    assert(active.includes("Advanced"), "Interview Advanced filter did not become active");
    await page.getByRole("button", { name: "All levels", exact: true }).click();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: TIMEOUT }),
      page.getByRole("button", { name: "Cram sheet", exact: true }).last().click(),
    ]);
    assert((await download.suggestedFilename()).endsWith(".md"), "Cram sheet did not download markdown");
    await download.delete().catch(() => undefined);

    await clickText(page, "Kubernetes Debugging Interview Pack");
    await page.getByRole("button", { name: "Study plan", exact: true }).click();
    await page.getByText(/saved as a study plan|study plan updated/i).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByRole("button", { name: "Mark complete", exact: true }).click();
    await page.getByText(/practice task marked complete|practice task already complete/i).waitFor({ state: "visible", timeout: TIMEOUT });
    await page.getByLabel("Mark question 3 practiced").click();
    await expectShadowIncludes(page, ["1/9 practiced"]);

    await page.getByRole("button", { name: "Kubernetes Deployments", exact: true }).click();
    await expectPath(page, /\/courses\/.+\/lessons\/\d+$/);
    await goto(page, "/interview-prep", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Trace Service traffic to ready Pods", exact: true }).click();
    await expectPath(page, "/labs/trace-service-to-pod");
  });

  await step("interview mobile detail pane and links work", async () => {
    await goto(page, "/interview-prep", { theme: "dark", viewport: MOBILE });
    await page.getByRole("button", { name: "Select interview pack: Kubernetes Debugging Interview Pack", exact: true }).click();
    await expectShadowIncludes(page, ["Question queue", "Answer write-up", "Docs to read", "Related labs"]);

    await page.getByRole("button", { name: "Kubernetes Deployments", exact: true }).click();
    await expectPath(page, /\/courses\/.+\/lessons\/\d+$/);

    await goto(page, "/interview-prep", { theme: "dark", viewport: MOBILE });
    await page.getByRole("button", { name: "Select interview pack: Kubernetes Debugging Interview Pack", exact: true }).click();
    await page.getByRole("button", { name: "Trace Service traffic to ready Pods", exact: true }).click();
    await expectPath(page, "/labs/trace-service-to-pod");
  });
}

async function validateReadinessProgress(page) {
  await step("readiness score updates after completing a lab and interview question", async () => {
    await resetBrowserProgress(page);
    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    const baseline = await dashboardProgressReadout(page);
    assert(baseline.readinessScore === 0, `Expected reset readiness 0, got ${baseline.readinessScore}`);
    assert(baseline.labs === "0/21", `Expected reset labs 0/21, got ${baseline.labs}`);
    assert(baseline.resources === "0/330", `Expected reset resources 0/330, got ${baseline.resources}`);
    assert(baseline.interview === "0/268", `Expected reset interview 0/268, got ${baseline.interview}`);

    await goto(page, "/labs/trace-service-to-pod", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Submit lab", exact: true }).click();
    await page.getByRole("button", { name: "Submitted", exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });

    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    const afterLab = await dashboardProgressReadout(page);
    assert(afterLab.readinessScore === 12, `Expected readiness 12 after one lab, got ${afterLab.readinessScore}`);
    assert(afterLab.labs === "1/21", `Expected labs 1/21 after submit, got ${afterLab.labs}`);
    assert(afterLab.resources === "0/330", `Expected resources to remain 0/330 after lab, got ${afterLab.resources}`);
    assert(afterLab.interview === "0/268", `Expected interview to remain 0/268 after lab, got ${afterLab.interview}`);

    await goto(page, "/interview-prep", { theme: "dark", viewport: DESKTOP });
    await clickText(page, "Kubernetes Debugging Interview Pack");
    await page.getByLabel("Mark question 1 practiced").click();
    await expectShadowIncludes(page, ["1/9 practiced"]);

    await goto(page, "/dashboard/home", { theme: "dark", viewport: DESKTOP });
    const afterInterview = await dashboardProgressReadout(page);
    assert(afterInterview.readinessScore === 14, `Expected readiness 14 after one lab and one interview question, got ${afterInterview.readinessScore}`);
    assert(afterInterview.labs === "1/21", `Expected labs to remain 1/21 after interview, got ${afterInterview.labs}`);
    assert(afterInterview.resources === "0/330", `Expected resources to remain 0/330 after interview, got ${afterInterview.resources}`);
    assert(afterInterview.interview === "1/268", `Expected interview 1/268 after practicing one question, got ${afterInterview.interview}`);
  });
}

async function validateLesson(page) {
  await step("lesson reader buttons and tabs work", async () => {
    await goto(page, "/courses/platform-kubernetes-fundamentals/lessons/1", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "Next lesson", exact: true }).click();
    await expectPath(page, "/courses/platform-kubernetes-fundamentals/lessons/2");
    await page.getByRole("button", { name: "Previous lesson", exact: true }).click();
    await expectPath(page, "/courses/platform-kubernetes-fundamentals/lessons/1");

    await page.getByRole("button", { name: "Mark complete", exact: true }).click();
    await page.getByText("Lesson marked complete", { exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });

    await page.getByRole("button", { name: /OPEN RELATED LAB/i }).click();
    await expectPath(page, /\/labs\/[^/]+$/);

    await goto(page, "/courses/platform-kubernetes-fundamentals/lessons/1", { theme: "dark", viewport: DESKTOP });
    await page.getByRole("button", { name: "GLOSSARY", exact: true }).click();
    await page.getByRole("button", { name: "GLOSSARY", exact: true }).click();
    await clickText(page, "tap to reveal");
    await expectShadowIncludes(page, ["Pods"]);
    await page.getByRole("button", { name: "NEXT →", exact: true }).click();
    await page.getByRole("button", { name: "← PREV", exact: true }).click();
    await page.getByLabel("Reset flashcard").click();
    await page.getByText("tap to reveal", { exact: true }).waitFor({ state: "visible", timeout: TIMEOUT });

    const copyButtons = page.getByLabel(/Copy operator commands/i);
    if (await copyButtons.count()) await copyButtons.first().click();

    await clickText(page, "course");
    await expectPath(page, /^\/(?:dashboard\/home)?$/);
  });
}

async function validateNoDeadControls(page) {
  await step("visible controls have labels on main V2 routes", async () => {
    for (const route of routeExpectations.filter((item) => item.figma)) {
      await goto(page, route.path, { theme: "dark", viewport: DESKTOP });
      const controls = await visibleControlLabels(page);
      const unlabeled = controls.filter((control) => !control.label || control.label === "×");
      assert(unlabeled.length === 0, `${route.path} has unlabeled visible controls: ${JSON.stringify(unlabeled)}`);
    }
  });
}

async function run() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ acceptDownloads: true, viewport: DESKTOP });
  const page = await context.newPage();

  page.on("pageerror", (error) => recordBrowserError(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") recordBrowserError(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    const urlValue = request.url();
    if (failure?.errorText === "net::ERR_ABORTED") return;
    if (urlValue.endsWith("/favicon.ico")) return;
    recordBrowserError(`requestfailed: ${request.method()} ${urlValue} ${failure?.errorText || ""}`.trim(), {
      pendingResourceFailure: true,
    });
  });

  await validateRouteLoads(page);
  await validateLayoutParity(page);
  await validateLightThemeBadgePalette(page);
  await validateSemanticHardening(page);
  await validateShell(page);
  await validateDashboard(page);
  await validateRoadmap(page);
  await validateLabs(page);
  await validateResources(page);
  await validateInterview(page);
  await validateReadinessProgress(page);
  await validateLesson(page);
  await validateNoDeadControls(page);

  await browser.close();

  const summary = {
    base: WEB_BASE,
    passed: results.filter((item) => item.status === "pass").length,
    failed: failures.length,
    browserErrors,
    ignoredBrowserErrorCount,
    results,
    failures,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (failures.length || browserErrors.length) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
