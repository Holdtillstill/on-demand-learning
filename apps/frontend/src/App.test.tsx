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

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the Zhongwen navigation", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText("Zhongwen Cloud")).toBeInTheDocument();
    expect(screen.getByText("Catalog")).toBeInTheDocument();
    expect(screen.getByText("Platform Academy")).toBeInTheDocument();
    expect(screen.getByText("Admin Upload")).toBeInTheDocument();
  });

  it("renders Platform Academy tracks and labs from the API", async () => {
    const catalog = {
      title: "Platform Academy",
      promise: "Learn Kubernetes through production platform scenarios.",
      total_courses: 1,
      total_lessons: 3,
      tracks: [
        {
          slug: "kubernetes",
          title: "Kubernetes Operator Track",
          role: "Platform engineer moving from kubectl user to production debugger",
          summary: "Master workload signals.",
          outcomes: ["Trace traffic from Ingress to Pod."],
          course: {
            id: 101,
            slug: "platform-kubernetes-foundations",
            title: "Kubernetes Foundations for Platform Engineers",
            era: "Platform Academy",
            level: "Intermediate",
            category: "Kubernetes",
            description: "Production Kubernetes foundations.",
            subscription_tier: "free",
            lessons: [
              { id: 201, course_id: 101, title: "Control Loops", summary: "Debug object ownership.", sequence: 1 },
              { id: 202, course_id: 101, title: "Configuration", summary: "Manage runtime config.", sequence: 2 },
              { id: 203, course_id: 101, title: "Failure Signals", summary: "Read probe and resource failures.", sequence: 3 }
            ]
          }
        }
      ],
      labs: [
        {
          slug: "debug-crashloopbackoff",
          title: "Debug CrashLoopBackOff without guessing",
          track: "Kubernetes",
          difficulty: "Intermediate",
          estimated_minutes: 35,
          scenario: "A checkout API crashes after a config release.",
          skills: ["Pod inspection", "previous logs"],
          commands: ["kubectl describe pod checkout", "kubectl logs checkout --previous"],
          checklist: ["Capture previous logs.", "Identify exit code."],
          course_slug: "platform-kubernetes-foundations",
          lesson_id: 203
        }
      ]
    };
    const roadmap = {
      stages: [
        {
          sequence: 1,
          title: "Workload Debugger",
          role: "You can explain why a rollout failed.",
          focus: "Kubernetes foundations.",
          course_slugs: ["platform-kubernetes-foundations"],
          checkpoints: ["Inspect a rollout."]
        }
      ]
    };
    const dashboard = {
      user_id: "demo-user",
      xp: { total: 0, lesson_completion_xp: 0, quiz_xp: 0, review_xp: 0 },
      daily_goal: { target_xp: 50, earned_xp_today: 0, met: false },
      streak: { current_days: 0, freeze_available: false, last_activity_date: null },
      achievements: [],
      completed_lessons: 0,
      due_reviews: 0
    };

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/platform-academy/catalog")) return jsonResponse(catalog);
        if (url.includes("/api/platform-academy/roadmap")) return jsonResponse(roadmap);
        if (url.includes("/api/progress/demo-user")) return jsonResponse([]);
        if (url.includes("/api/users/demo-user/dashboard")) return jsonResponse(dashboard);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter initialEntries={["/platform-academy"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("Kubernetes Operator Track")).toBeInTheDocument();
    expect(screen.getByText("Debug CrashLoopBackOff without guessing")).toBeInTheDocument();
    expect(screen.getByText("Start the academy")).toBeInTheDocument();
  });
});
