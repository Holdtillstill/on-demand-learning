import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getOrCreateLocalLearnerId, LOCAL_LEARNER_ID_KEY } from "./learnerIdentity";

function jsonResponse(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload)
  } as Response);
}

const course = {
  id: 101,
  slug: "platform-kubernetes-fundamentals",
  title: "Kubernetes Fundamentals",
  era: "Platform Academy",
  level: "Fresher / Beginner",
  category: "Kubernetes",
  description: "Start from containers and learn how Pods, Deployments, Services, namespaces, labels, and probes fit together.",
  subscription_tier: "free",
  lessons: [
    { id: 201, course_id: 101, title: "Containers, Images, and Pods", summary: "Understand the unit Kubernetes runs.", sequence: 1 },
    { id: 202, course_id: 101, title: "Services, Labels, Selectors, and Namespaces", summary: "Connect traffic to Pods.", sequence: 2 }
  ]
};

const catalog = {
  title: "Platform Academy",
  promise: "Learn Kubernetes, EKS, Helm, ArgoCD, and SRE through production platform scenarios you can practice locally.",
  total_courses: 1,
  total_lessons: 2,
  levels: [
    {
      slug: "fresher",
      title: "Fresher / Beginner",
      level_group: "Fresher",
      audience: "New Kubernetes learners.",
      total_courses: 1,
      total_lessons: 2,
      courses: [course]
    },
    {
      slug: "intermediate",
      title: "Intermediate",
      level_group: "Intermediate",
      audience: "Engineers learning EKS, Helm, and GitOps.",
      total_courses: 0,
      total_lessons: 0,
      courses: []
    },
    {
      slug: "advanced",
      title: "Advanced",
      level_group: "Advanced",
      audience: "Platform owners designing production systems.",
      total_courses: 0,
      total_lessons: 0,
      courses: []
    }
  ],
  tracks: [
    {
      slug: "kubernetes-fundamentals",
      title: "Kubernetes Fundamentals Track",
      role: "Fresher learner building the mental model.",
      summary: "Start with objects and signals.",
      level_group: "Fresher",
      audience: "Learners new to Kubernetes.",
      outcomes: ["Trace a Service to Pods."],
      course
    }
  ],
  labs: [
    {
      slug: "trace-service-to-pod",
      title: "Trace Service traffic to ready Pods",
      track: "Kubernetes",
      difficulty: "Fresher / Beginner",
      level_group: "Fresher",
      estimated_minutes: 30,
      scenario: "A Service exists but traffic returns 503.",
      skills: ["service selectors", "EndpointSlices"],
      commands: ["kubectl describe svc checkout -n payments"],
      checklist: ["Read the Service selector."],
      course_slug: "platform-kubernetes-fundamentals",
      lesson_id: 202
    }
  ]
};

const lesson201 = {
  id: 201,
  course_id: 101,
  title: "Containers, Images, and Pods",
  summary: "Understand the unit Kubernetes runs.",
  sequence: 1,
  body_simplified: "## Pod model\nKubernetes schedules Pods, not bare containers.",
  body_traditional: "## Pod model\nKubernetes schedules Pods, not bare containers.",
  pinyin: "- Inspect Pods\n$ kubectl get pods -A",
  audio_url: null,
  video_url: null,
  course_slug: "platform-kubernetes-fundamentals",
  course_category: "Kubernetes",
  course_era: "Platform Academy",
  vocabulary: [{ id: 2, simplified: "Pod", traditional: "Pod", pinyin: "pod", definition: "Smallest schedulable Kubernetes workload." }],
  flashcards: [{ id: 2, lesson_id: 201, prompt: "What does Kubernetes schedule?", answer: "Pods.", pinyin: "", difficulty: "beginner" }]
};

const lesson202 = {
  id: 202,
  course_id: 101,
  title: "Services, Labels, Selectors, and Namespaces",
  summary: "Connect traffic to Pods.",
  sequence: 2,
  body_simplified: "## Service routing\nServices select ready Pods by label.",
  body_traditional: "## Service routing\nServices select ready Pods by label.",
  pinyin: "- Compare selector labels\n$ kubectl describe svc checkout -n payments",
  audio_url: null,
  video_url: null,
  course_slug: "platform-kubernetes-fundamentals",
  course_category: "Kubernetes",
  course_era: "Platform Academy",
  vocabulary: [{ id: 1, simplified: "Service", traditional: "Service", pinyin: "service", definition: "Stable cluster networking abstraction." }],
  flashcards: [{ id: 1, lesson_id: 202, prompt: "What connects a Service to Pods?", answer: "Selectors and labels.", pinyin: "", difficulty: "beginner" }]
};

const roadmap = {
  stages: [
    {
      sequence: 1,
      title: "Kubernetes Object Mental Model",
      role: "You can explain objects.",
      focus: "Fresher fundamentals.",
      level_group: "Fresher",
      course_slugs: ["platform-kubernetes-fundamentals"],
      checkpoints: ["Trace a Deployment to a Pod."]
    }
  ]
};

const resources = {
  domains: ["Kubernetes", "EKS", "Terraform", "FinOps"],
  types: ["cheatsheet", "runbook", "project brief"],
  resources: [
    {
      slug: "kubernetes-debugging-cheatsheet",
      title: "Kubernetes Debugging Cheatsheet",
      domain: "Kubernetes",
      level_group: "Fresher",
      resource_type: "cheatsheet",
      estimated_minutes: 20,
      summary: "Command map for first-response debugging.",
      outcomes: ["Choose the right kubectl command."],
      prerequisites: ["Kubernetes object basics"],
      safety_level: "local-safe",
      commands: ["kubectl get pods -A"],
      artifacts: ["debugging checklist"],
      related_lessons: [201],
      related_labs: ["trace-service-to-pod"],
      next_steps: ["Practice a lab"],
      source_url: "https://kubernetes.io/docs/tasks/debug/",
      source_label: "Kubernetes official debugging docs",
      reviewed_at: "2026-05-20"
    }
  ]
};

const testLearnerId = "guest-test-learner";

const dashboard = {
  user_id: testLearnerId,
  xp: { total: 20, lesson_completion_xp: 20, quiz_xp: 0, review_xp: 0 },
  daily_goal: { target_xp: 50, earned_xp_today: 20, met: false },
  streak: { current_days: 1, freeze_available: false, last_activity_date: "2026-05-28" },
  achievements: [],
  completed_lessons: 1,
  due_reviews: 0
};

function stubAcademyFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
      if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
      if (url.includes("/api/platform-academy/resources")) return jsonResponse(resources);
      if (url.includes("/api/lessons/201")) return jsonResponse(lesson201);
      if (url.includes("/api/lessons/202")) return jsonResponse(lesson202);
      if (url.includes(`/api/progress/${testLearnerId}`)) {
        return jsonResponse([{ id: 1, user_id: testLearnerId, lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }]);
      }
      if (url.includes(`/api/users/${testLearnerId}/dashboard`)) return jsonResponse(dashboard);
      if (url.endsWith("/api/progress")) {
        return jsonResponse({ id: 2, user_id: testLearnerId, lesson_id: 202, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" });
      }
      return jsonResponse([]);
    })
  );
}

describe("Platform Academy app", () => {
  beforeEach(() => {
    localStorage.setItem(LOCAL_LEARNER_ID_KEY, testLearnerId);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
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

  it("renders the standalone academy dashboard from mocked API data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) return jsonResponse(resources);
        if (url.includes(`/api/progress/${testLearnerId}`)) return jsonResponse([{ id: 1, user_id: testLearnerId, lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }]);
        if (url.includes(`/api/users/${testLearnerId}/dashboard`)) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();
    expect(screen.getByText("Production learning workspace")).toBeInTheDocument();
    expect(screen.getAllByText("Kubernetes Fundamentals").length).toBeGreaterThan(0);
    expect(screen.getByText("Track pipeline")).toBeInTheDocument();
    expect(screen.getByText("Readiness gates")).toBeInTheDocument();
    expect(screen.getByText(testLearnerId)).toBeInTheDocument();
    expect(screen.getByText("Guest workspace")).toBeInTheDocument();
    expect(screen.getByText("Browser-local progress")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/progress/${testLearnerId}`));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/users/${testLearnerId}/dashboard`));
  });

  it("regenerates the local guest profile and reloads progress for the new id", async () => {
    const requestedProgressIds: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        const progressMatch = url.match(/\/api\/progress\/([^/]+)$/);
        const dashboardMatch = url.match(/\/api\/users\/([^/]+)\/dashboard$/);

        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) return jsonResponse(resources);
        if (progressMatch) {
          requestedProgressIds.push(decodeURIComponent(progressMatch[1]));
          return jsonResponse([]);
        }
        if (dashboardMatch) return jsonResponse({ ...dashboard, user_id: decodeURIComponent(dashboardMatch[1]), completed_lessons: 0 });
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start a new local guest workspace/i }));

    const regeneratedLearnerId = localStorage.getItem(LOCAL_LEARNER_ID_KEY) ?? "";
    expect(regeneratedLearnerId).toMatch(/^guest-[a-z0-9]+$/i);
    expect(regeneratedLearnerId).not.toBe(testLearnerId);
    await waitFor(() => expect(requestedProgressIds).toContain(regeneratedLearnerId));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/users/${regeneratedLearnerId}/dashboard`));
  });

  it("renders a comprehensive resources library", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) {
          return jsonResponse({
            domains: ["Kubernetes", "EKS", "Terraform", "FinOps"],
            types: ["cheatsheet", "runbook", "project brief"],
            resources: [
              {
                slug: "kubernetes-debugging-cheatsheet",
                title: "Kubernetes Debugging Cheatsheet",
                domain: "Kubernetes",
                level_group: "Fresher",
                resource_type: "cheatsheet",
                estimated_minutes: 20,
                summary: "Command map for first-response debugging.",
                outcomes: ["Choose the right kubectl command."],
                prerequisites: ["Kubernetes object basics"],
                safety_level: "local-safe",
                commands: ["kubectl get pods -A"],
                artifacts: ["debugging checklist"],
                related_lessons: [201],
                related_labs: ["trace-service-to-pod"],
                next_steps: ["Practice a lab"]
              }
            ]
          });
        }
        if (url.includes(`/api/progress/${testLearnerId}`)) return jsonResponse([]);
        if (url.includes(`/api/users/${testLearnerId}/dashboard`)) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter initialEntries={["/resources"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Resource library" })).toBeInTheDocument();
    expect(screen.getByText("Runbooks, projects, rubrics, references")).toBeInTheDocument();
    expect(screen.queryByText(/Codex gap audit/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Kubernetes Debugging Cheatsheet").length).toBeGreaterThan(0);
    expect(screen.getByText("Library index")).toBeInTheDocument();
  });

  it("renders roadmap stages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) return jsonResponse(resources);
        if (url.includes(`/api/progress/${testLearnerId}`)) return jsonResponse([]);
        if (url.includes(`/api/users/${testLearnerId}/dashboard`)) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter initialEntries={["/roadmap"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Kubernetes Object Mental Model")).toBeInTheDocument();
    expect(screen.getByText("Trace a Deployment to a Pod.")).toBeInTheDocument();
  });

  it("renders the design exploration index", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/designs"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Ten visual systems for Platform Academy.")).toBeInTheDocument();
    expect(screen.getByText("Benchmarked in May 2026 against official docs, cloud learning hubs, hands-on lab platforms, and certification simulators.")).toBeInTheDocument();
    expect(screen.getByText("Cinematic Cloud Control Room")).toBeInTheDocument();
    expect(screen.getByText("Terminal Ops Cockpit")).toBeInTheDocument();
    expect(screen.getByText("Resource Magazine Library")).toBeInTheDocument();
  });

  it.each([
    ["/designs/1", "Platform readiness board"],
    ["/designs/3", "academyctl session --profile sre"],
    ["/designs/5", "Learning signals for platform operators."],
    ["/designs/7", "Curriculum health dashboard."],
    ["/designs/10", "Runbooks, briefs, and references for every platform domain."]
  ])("renders design route %s", async (route, expectedText) => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("renders design evidence and lab validation surfaces", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/designs/3"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Verification gates")).toBeInTheDocument();
    expect(screen.getByText("1 labs")).toBeInTheDocument();
    expect(screen.getByText("30 min average drill")).toBeInTheDocument();
    expect(screen.getByText(/kubectl describe svc checkout -n payments/)).toBeInTheDocument();
  });

  it("copies command snippets from lab and resource detail command surfaces", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    const copyButton = await screen.findByRole("button", { name: /copy runbook commands/i });
    fireEvent.click(copyButton);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("kubectl describe svc checkout -n payments"));
    expect(screen.getByRole("button", { name: /copied runbook commands/i })).toBeInTheDocument();
  });

  it("saves lesson progress under the browser-local guest id", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/lessons/202"]}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /mark complete/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /progress saved/i })).toBeInTheDocument());

    const fetchMock = vi.mocked(fetch);
    const postCall = fetchMock.mock.calls.find(([input, init]) => {
      const requestInit = init as RequestInit | undefined;
      return String(input).endsWith("/api/progress") && requestInit?.method === "POST";
    });
    expect(postCall).toBeDefined();

    const requestInit = postCall?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      user_id: testLearnerId,
      lesson_id: 202,
      completed: true,
      score: 1
    });
  });

  it("offers direct next lesson navigation from lesson pages", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/lessons/201"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Containers, Images, and Pods" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next lesson services, labels, selectors, and namespaces/i })).toHaveAttribute("href", "/lessons/202");
  });

  it("automatically saves lesson progress after the learner scrolls to the bottom", async () => {
    stubAcademyFetch();
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1600 });
    Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 600 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 980 });

    render(
      <MemoryRouter initialEntries={["/lessons/202"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Services, Labels, Selectors, and Namespaces" })).toBeInTheDocument();
    fireEvent.scroll(window);

    await waitFor(() => expect(screen.getByRole("button", { name: /progress saved/i })).toBeInTheDocument());
    fireEvent.scroll(window);
    const fetchMock = vi.mocked(fetch);
    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(([input, init]) => String(input).endsWith("/api/progress") && (init as RequestInit | undefined)?.method === "POST");
      expect(postCalls).toHaveLength(1);
    });
    const postCall = fetchMock.mock.calls.find(([input, init]) => String(input).endsWith("/api/progress") && (init as RequestInit | undefined)?.method === "POST");
    expect(postCall).toBeDefined();
    expect(JSON.parse(String((postCall?.[1] as RequestInit).body))).toMatchObject({ user_id: testLearnerId, lesson_id: 202, completed: true });
  });

  it("loads additional resource pages instead of requiring filter refinement", async () => {
    const manyResources = Array.from({ length: 40 }, (_, index) => ({
      ...resources.resources[0],
      slug: `kubernetes-debugging-cheatsheet-${index + 1}`,
      title: `Kubernetes Debugging Cheatsheet ${index + 1}`
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) return jsonResponse({ ...resources, resources: manyResources });
        if (url.includes(`/api/progress/${testLearnerId}`)) return jsonResponse([]);
        if (url.includes(`/api/users/${testLearnerId}/dashboard`)) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter initialEntries={["/resources"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("36 shown / 40 matching artifacts")).toBeInTheDocument();
    expect(screen.queryByText("Kubernetes Debugging Cheatsheet 40")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /load 4 more resources/i }));
    expect(screen.getByText("40 shown / 40 matching artifacts")).toBeInTheDocument();
    expect(screen.getByText("Kubernetes Debugging Cheatsheet 40")).toBeInTheDocument();
  });

  it("renders official source URLs and reviewed dates on resource detail pages", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/resources/kubernetes-debugging-cheatsheet"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Kubernetes Debugging Cheatsheet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /kubernetes official debugging docs/i })).toHaveAttribute(
      "href",
      "https://kubernetes.io/docs/tasks/debug/"
    );
    expect(screen.getByText("Reviewed May 20, 2026")).toBeInTheDocument();
  });

  it("covers lab and lesson detail routes with linked artifacts", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open linked lesson/i })).toHaveAttribute("href", "/lessons/202");
    expect(screen.getByRole("link", { name: /kubernetes debugging cheatsheet/i })).toHaveAttribute("href", "/resources/kubernetes-debugging-cheatsheet");

    cleanup();
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/lessons/202"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Services, Labels, Selectors, and Namespaces" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /trace service traffic to ready pods/i })).toHaveAttribute("href", "/labs/trace-service-to-pod");
    expect(screen.getByRole("link", { name: /kubernetes debugging cheatsheet/i })).toHaveAttribute("href", "/resources/kubernetes-debugging-cheatsheet");
  });
});
