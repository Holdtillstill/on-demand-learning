// @ts-nocheck
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getOrCreateLocalLearnerId, LOCAL_LEARNER_ID_KEY } from "./learnerIdentity";

const testLearnerId = "guest-test-learner";

function readStaticJson(path: string) {
  return JSON.parse(readFileSync(join(process.cwd(), "public/static-api", path), "utf8"));
}

const staticJson = {
  "/static-api/platform-academy-catalog.json": readStaticJson("platform-academy-catalog.json"),
  "/static-api/platform-academy-roadmap.json": readStaticJson("platform-academy-roadmap.json"),
  "/static-api/platform-academy-labs.json": readStaticJson("platform-academy-labs.json"),
  "/static-api/platform-academy-resources.json": readStaticJson("platform-academy-resources.json"),
  "/static-api/platform-academy-interview-prep.json": readStaticJson("platform-academy-interview-prep.json")
} as Record<string, unknown>;

function jsonResponse(payload: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json" },
      status: 200
    })
  );
}

function textResponse(payload: string, contentType = "text/plain") {
  return Promise.resolve(
    new Response(payload, {
      headers: { "content-type": contentType },
      status: 200
    })
  );
}

function setupAcademyFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const rawUrl = String(input);
      const pathname = rawUrl.startsWith("http") ? new URL(rawUrl).pathname : rawUrl.split("?")[0];

      if (pathname in staticJson) return jsonResponse(staticJson[pathname]);
      if (pathname.startsWith("/static-api/lessons/")) {
        return jsonResponse(readStaticJson(pathname.replace("/static-api/", "")));
      }
      if (pathname.endsWith("/packet.md")) {
        return textResponse("# Lab packet\n\nGenerated test packet for the selected lab.\n");
      }
      if (pathname.endsWith("/workspace-bundle.zip")) {
        return textResponse("workspace bundle", "application/zip");
      }

      return jsonResponse([]);
    })
  );
}

function setupBrowserApis() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  });

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn(() => Promise.resolve())
    }
  });

  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0)
  });

  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
}

function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

async function expectRouteHeading(name: string) {
  await waitFor(() => {
    expect(screen.getAllByRole("heading", { name }).length).toBeGreaterThan(0);
  });
}

async function waitForAcademyContent() {
  return screen.findByRole("region", { name: "Platform Academy content" }, { timeout: 5000 });
}

describe("Platform Academy app", () => {
  beforeEach(() => {
    localStorage.setItem(LOCAL_LEARNER_ID_KEY, testLearnerId);
    document.documentElement.removeAttribute("data-pa-theme");
    setupBrowserApis();
    setupAcademyFetch();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.removeAttribute("data-pa-theme");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates and reuses a browser-local guest learner id", () => {
    localStorage.clear();

    const learnerId = getOrCreateLocalLearnerId();

    expect(learnerId).toMatch(/^guest-[a-z0-9]+$/i);
    expect(localStorage.getItem(LOCAL_LEARNER_ID_KEY)).toBe(learnerId);
    expect(getOrCreateLocalLearnerId()).toBe(learnerId);
  });

  it("renders the rebuilt dashboard shell from static academy snapshots", async () => {
    renderApp("/");

    await expectRouteHeading("Platform Engineering Readiness");
    await waitForAcademyContent();

    expect(screen.getByRole("region", { name: "Platform Academy content" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Open guest recovery key" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lab Queue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resource Index" })).toBeInTheDocument();
    expect(screen.getAllByText(/readiness score/i).length).toBeGreaterThan(0);
    expect(fetch).toHaveBeenCalledWith("/static-api/platform-academy-catalog.json", expect.objectContaining({ cache: "force-cache" }));
  });

  it("uses the Figma status screen while academy data is loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    renderApp("/");

    expect(screen.getByRole("heading", { name: "Loading workspace" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Preparing your dashboard");
    expect(document.querySelector(".reference-figma-screen")).toBeInTheDocument();
    expect(document.querySelector(".state-panel")).not.toBeInTheDocument();
  });

  it.each([
    ["/roadmap", "Platform Engineering Roadmap", "Platform Academy content"],
    ["/labs", "Lab Queue", "Lab queue"],
    ["/interview-prep", "Interview Prep", "Interview pack list"],
    ["/resources", "Resource Index", "Platform Academy content"],
    ["/resources/linux-project-brief", "Resource Detail", "Resource detail content"],
    ["/labs/trace-service-to-pod", "Lab Workbook", "Platform Academy content"],
    ["/courses/platform-kubernetes-fundamentals/lessons/1", "Lesson Reader", "Platform Academy content"]
  ])("exposes semantic page structure for %s", async (path, heading, regionName) => {
    renderApp(path);

    await expectRouteHeading(heading);
    await waitForAcademyContent();

    expect(await screen.findByRole("region", { name: regionName })).toHaveAttribute("tabindex", "0");
  });

  it("keeps route content mounted while switching light and dark themes", async () => {
    renderApp("/resources");
    await expectRouteHeading("Resource Index");
    await waitForAcademyContent();

    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));

    await waitFor(() => expect(document.documentElement.dataset.paTheme).toBe("light"));
    expect(screen.getAllByRole("heading", { name: "Resource Index" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    await waitFor(() => expect(document.documentElement.dataset.paTheme).toBe("dark"));
    expect(screen.getAllByRole("heading", { name: "Resource Index" }).length).toBeGreaterThan(0);
  });

  it("supports profile recovery copy, restore, import error, and reset flows", async () => {
    renderApp("/");
    await expectRouteHeading("Platform Engineering Readiness");
    await waitForAcademyContent();

    fireEvent.click(screen.getByRole("button", { name: "Open guest recovery key" }));
    const dialog = await screen.findByRole("dialog", { name: "Profile & Recovery" });

    fireEvent.click(within(dialog).getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testLearnerId));

    fireEvent.change(within(dialog).getByLabelText("Restore from key"), { target: { value: "guest-abcdef123456" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(localStorage.getItem(LOCAL_LEARNER_ID_KEY)).toBe("guest-abcdef123456"));

    fireEvent.click(screen.getByRole("button", { name: "Import profile backup" }));
    const importDialog = await screen.findByRole("dialog", { name: "Profile & Recovery" });
    fireEvent.change(within(importDialog).getByLabelText(/Or paste JSON directly/i), { target: { value: "{ nope" } });
    fireEvent.click(within(importDialog).getByRole("button", { name: "Import pasted JSON" }));

    expect(await within(importDialog).findByText("Profile import failed. Paste an exported Platform Academy JSON backup.")).toBeInTheDocument();

    fireEvent.click(within(importDialog).getByRole("tab", { name: "Reset" }));
    fireEvent.click(within(importDialog).getByRole("button", { name: "Reset profile" }));
    fireEvent.click(within(importDialog).getByRole("button", { name: "Yes, reset everything" }));

    await waitFor(() => {
      expect(localStorage.getItem(LOCAL_LEARNER_ID_KEY)).toMatch(/^guest-[a-z0-9]{12}$/i);
      expect(localStorage.getItem(LOCAL_LEARNER_ID_KEY)).not.toBe("guest-abcdef123456");
    });
  });

  it("shows active resource filters, opens previews, and navigates to resource details", async () => {
    renderApp("/resources");
    await expectRouteHeading("Resource Index");
    await waitForAcademyContent();

    const linuxFilter = await screen.findByRole("button", { name: "Linux" });
    fireEvent.click(linuxFilter);
    expect(linuxFilter).toHaveAttribute("aria-pressed", "true");

    const projectPreviews = await screen.findAllByRole("button", { name: "Open resource preview: Linux Portfolio Project Brief" });
    fireEvent.click(projectPreviews[0]);

    const previewDialog = await screen.findByRole("dialog", { name: "Linux Portfolio Project Brief" });
    fireEvent.click(within(previewDialog).getByRole("button", { name: /open resource/i }));

    expect(await screen.findByRole("heading", { name: "Linux Portfolio Project Brief" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark reviewed" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Saved to this local profile as reviewed.");
  });

  it("supports lab queue filters, star state, and workbook navigation", async () => {
    renderApp("/labs");
    await expectRouteHeading("Lab Queue");
    await waitForAcademyContent();

    const fresherFilter = screen.getAllByRole("button", { name: "Fresher" })[0];
    fireEvent.click(fresherFilter);
    expect(fresherFilter).toHaveAttribute("aria-pressed", "true");

    const starButton = await screen.findByRole("button", { name: "Star Trace Service traffic to ready Pods" });
    fireEvent.click(starButton);
    expect(starButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Open workbook: Trace Service traffic to ready Pods" }));
    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
  });

  it("supports lab detail packet, workbook save, evidence attach, and submit actions", async () => {
    renderApp("/labs/trace-service-to-pod");
    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    await waitForAcademyContent();

    fireEvent.click(screen.getByRole("button", { name: "Download lab packet" }));
    await waitFor(() => expect(screen.getAllByText(/Packet ready|Packet fallback ready/).length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: "Close lab packet preview" }));

    fireEvent.click(screen.getByRole("button", { name: "Workbook" }));
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "selector mismatch evidence" } });
    fireEvent.click(screen.getByRole("button", { name: "Save progress" }));
    await waitFor(() => expect(screen.getByText(/saved/i)).toBeInTheDocument(), { timeout: 2500 });

    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
    const attachButton = screen.getByRole("button", { name: "Attach pod-running-output" });
    fireEvent.click(attachButton);
    expect(await screen.findByRole("button", { name: "Remove pod-running-output" })).toBeInTheDocument();
    expect(screen.getAllByText("attached to evidence map").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Submit lab" }));
    expect(await screen.findByRole("button", { name: "Submitted" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(screen.getByLabelText("Progress")).toHaveTextContent("Labs1/21"));
    expect(screen.getByLabelText("Progress")).toHaveTextContent("Interview Qs0/268");
  });

  it("shows interview answer write-ups and persists practiced/study-plan state", async () => {
    renderApp("/interview-prep");
    await expectRouteHeading("Interview Prep");
    await waitForAcademyContent();

    expect(await screen.findByRole("region", { name: "Interview pack list" })).toHaveAttribute("tabindex", "0");
    expect(await screen.findByRole("region", { name: "Interview practice details" })).toHaveAttribute("tabindex", "0");

    const firstQuestion = await screen.findByRole("button", {
      name: "Select question 1: A Service returns 503 after a label cleanup. Walk me through your diagnosis."
    });
    fireEvent.click(firstQuestion);
    expect(screen.getByText("Answer write-up")).toBeInTheDocument();
    expect(screen.getByText("Answer outline")).toBeInTheDocument();

    const practicedButton = screen.getByRole("button", { name: /Mark question 1 (?:not )?practiced/ });
    const previousPracticedState = practicedButton.getAttribute("aria-pressed");
    fireEvent.click(practicedButton);
    expect(practicedButton).toHaveAttribute("aria-pressed", previousPracticedState === "true" ? "false" : "true");
    await waitFor(() => expect(screen.getByLabelText("Progress")).toHaveTextContent("Interview Qs1/268"));

    fireEvent.click(screen.getByRole("button", { name: "Study plan" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Kubernetes Debugging Interview Pack saved as a study plan");
  });
});
