import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

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
      next_steps: ["Practice a lab"]
    }
  ]
};

const dashboard = {
  user_id: "demo-user",
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
      if (url.includes("/api/progress/demo-user")) {
        return jsonResponse([{ id: 1, user_id: "demo-user", lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }]);
      }
      if (url.includes("/api/users/demo-user/dashboard")) return jsonResponse(dashboard);
      return jsonResponse([]);
    })
  );
}

describe("Platform Academy app", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the standalone academy dashboard from mocked API data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) return jsonResponse(resources);
        if (url.includes("/api/progress/demo-user")) return jsonResponse([{ id: 1, user_id: "demo-user", lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }]);
        if (url.includes("/api/users/demo-user/dashboard")) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Cloud Native Platform Academy")).toBeInTheDocument();
    expect(screen.getByText("Kubernetes Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Fresher / Beginner")).toBeInTheDocument();
    expect(screen.getByText("Continue learning")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
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
        if (url.includes("/api/progress/demo-user")) return jsonResponse([]);
        if (url.includes("/api/users/demo-user/dashboard")) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter initialEntries={["/resources"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Resource library for comprehensive platform mastery")).toBeInTheDocument();
    expect(screen.getByText("Kubernetes Debugging Cheatsheet")).toBeInTheDocument();
    expect(screen.getByText("FinOps")).toBeInTheDocument();
  });

  it("renders roadmap stages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/platform-academy/resources")) return jsonResponse(resources);
        if (url.includes("/api/progress/demo-user")) return jsonResponse([]);
        if (url.includes("/api/users/demo-user/dashboard")) return jsonResponse(dashboard);
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
});
