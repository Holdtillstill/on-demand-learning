import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { getOrCreateLocalLearnerId, LOCAL_LEARNER_ID_KEY } from "./learnerIdentity";

function jsonResponse(payload: unknown) {
  const body = JSON.stringify(payload);
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "content-type": "application/json" }),
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(payload)
  } as Response);
}

function htmlResponse() {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers({ "content-type": "text/html" }),
    text: () => Promise.resolve("<!doctype html><html><body>SPA fallback</body></html>"),
    json: () => Promise.reject(new SyntaxError("Unexpected token '<'"))
  } as Response);
}

function isLabsIndexUrl(url: string) {
  return url.endsWith("/api/platform-academy/labs") || url.startsWith("/static-api/platform-academy-labs.json");
}

function isStaticOrApi(url: string, apiPath: string, staticPath: string) {
  return url.includes(apiPath) || url.startsWith(staticPath);
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
  promise: "Practice Kubernetes, EKS, Helm, ArgoCD, and SRE with local lessons, labs, resources, and interview drills.",
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
      lab_tier: "full",
      portfolio_grade: true,
      portfolio_focus: "Kubernetes Service routing",
      scenario: "A Service exists but traffic returns 503.",
      skills: ["service selectors", "EndpointSlices"],
      prerequisites: ["A local Kubernetes cluster."],
      setup_commands: ["kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml"],
      setup_self_check_commands: ["bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --run-analyzer"],
      commands: ["kubectl describe svc checkout -n payments"],
      practice_steps: ["Compare the Service selector with Pod labels."],
      expected_evidence: ["The Service selector does not match the Pod labels."],
      validation_commands: [
        "bash labs/platform-academy/trace-service-to-pod/validate.sh",
        "kubectl apply -f labs/platform-academy/trace-service-to-pod/fixed.yaml"
      ],
      cleanup_commands: ["bash labs/platform-academy/trace-service-to-pod/cleanup.sh"],
      no_cluster_fallback: ["Review start.yaml and find the selector mismatch."],
      artifact_paths: [
        "labs/platform-academy/trace-service-to-pod/triage-notes.md",
        "labs/platform-academy/trace-service-to-pod/start.yaml",
        "labs/platform-academy/trace-service-to-pod/fixed.yaml",
        "labs/platform-academy/trace-service-to-pod/evidence-template.md",
        "labs/platform-academy/trace-service-to-pod/validate.sh",
        "labs/platform-academy/trace-service-to-pod/cleanup.sh"
      ],
      learner_artifact_paths: [
        "labs/platform-academy/trace-service-to-pod/triage-notes.md",
        "labs/platform-academy/trace-service-to-pod/start.yaml",
        "labs/platform-academy/trace-service-to-pod/fixed.yaml",
        "labs/platform-academy/trace-service-to-pod/evidence-template.md",
        "labs/platform-academy/trace-service-to-pod/validate.sh",
        "labs/platform-academy/trace-service-to-pod/cleanup.sh"
      ],
      workspace_archive_name: "trace-service-to-pod-learner-workspace.zip",
      workspace_root: "trace-service-to-pod",
      workspace_quickstart_commands: [
        "unzip trace-service-to-pod-learner-workspace.zip",
        "cd trace-service-to-pod",
        "./setup.sh",
        "# Fill evidence.md with your investigation notes",
        "./validate.sh --files-only",
        "./validate.sh",
        "./cleanup.sh"
      ],
      cluster_workspace_commands: [
        "From the full repo, create/select a disposable context: bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod",
        "From this extracted bundle, after a disposable context is selected: ./setup.sh --preflight",
        "Create the broken lab state: ./setup.sh --cluster",
        "After filling evidence.md, verify files, evidence, and cluster state: ./validate.sh --cluster",
        "Clean up the lab namespace/resources: ./cleanup.sh",
        "No app namespace or Pods need to exist before setup; setup creates or recreates the lab namespace."
      ],
      worksheet_prompts: ["What evidence proves the Service selector mismatch?"],
      rubric: ["Captures selector, Pod label, EndpointSlice, and cleanup evidence."],
      validation_checks: ["Expected evidence captured"],
      checklist: ["Read the Service selector."],
      course_slug: "platform-kubernetes-fundamentals",
      lesson_id: 202
    }
  ]
};

const labSubmission = {
  id: 77,
  user_id: "guest-test-learner",
  lab_slug: "trace-service-to-pod",
  worksheet_answers: {},
  checked_items: {},
  status: "in_progress",
  score: 0,
  completed_checks: 0,
  total_checks: 2,
  answered_prompts: 0,
  total_prompts: 1,
  evidence_terms: [],
  rubric_feedback: [
    {
      criterion: "Captures selector, Pod label, EndpointSlice, and cleanup evidence.",
      status: "missing",
      feedback: "Capture command output before marking this done.",
      evidence_terms: []
    }
  ],
  created_at: "2026-05-28T00:00:00",
  updated_at: "2026-05-28T00:00:00"
};

const labSubmissionIndex = {
  ...labSubmission,
  worksheet_answers: {
    "worksheet-0": "EndpointSlice is empty because the Service selector app=checkout does not match Pod label app=checkout-api."
  },
  score: 50,
  completed_checks: 1,
  answered_prompts: 1,
  evidence_terms: ["endpointslice", "selector"],
  rubric_feedback: [
    {
      criterion: "Captures selector, Pod label, EndpointSlice, and cleanup evidence.",
      status: "passes",
      feedback: "The note includes concrete evidence.",
      evidence_terms: ["endpointslice", "selector"]
    }
  ]
};

const lesson201 = {
  id: 201,
  course_id: 101,
  title: "Containers, Images, and Pods",
  summary: "Understand the unit Kubernetes runs.",
  sequence: 1,
  body: "## Pod model\nKubernetes schedules Pods, not bare containers.",
  practice_notes: "- Inspect Pods\n$ kubectl get pods -A",
  audio_url: null,
  video_url: null,
  course_slug: "platform-kubernetes-fundamentals",
  course_category: "Kubernetes",
  course_era: "Platform Academy",
  terms: [{ id: 2, term: "Pod", context: "pod", definition: "Smallest schedulable Kubernetes workload." }],
  flashcards: [{ id: 2, lesson_id: 201, prompt: "What does Kubernetes schedule?", answer: "Pods.", hint: "", difficulty: "beginner" }]
};

const lesson202 = {
  id: 202,
  course_id: 101,
  title: "Services, Labels, Selectors, and Namespaces",
  summary: "Connect traffic to Pods.",
  sequence: 2,
  body: "## Service routing\nServices select ready Pods by label.",
  practice_notes: "- Compare selector labels\n$ kubectl describe svc checkout -n payments",
  audio_url: null,
  video_url: null,
  course_slug: "platform-kubernetes-fundamentals",
  course_category: "Kubernetes",
  course_era: "Platform Academy",
  terms: [{ id: 1, term: "Service", context: "service", definition: "Stable cluster networking abstraction." }],
  flashcards: [{ id: 1, lesson_id: 202, prompt: "What connects a Service to Pods?", answer: "Selectors and labels.", hint: "", difficulty: "beginner" }]
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
  types: ["cheatsheet", "runbook", "project brief", "official reference"],
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
    },
    {
      slug: "kubernetes-official-reference",
      title: "Kubernetes Official Reference",
      domain: "Kubernetes",
      level_group: "Fresher",
      resource_type: "official reference",
      estimated_minutes: 25,
      summary: "Curated official docs reading path for Kubernetes operations.",
      outcomes: ["Anchor answers in official Kubernetes docs."],
      prerequisites: ["Kubernetes object basics"],
      safety_level: "local-safe",
      commands: ["kubectl explain pod"],
      artifacts: ["official source trail"],
      related_lessons: [201, 202],
      related_labs: ["trace-service-to-pod"],
      next_steps: ["Pair docs with a lab"],
      source_url: "https://kubernetes.io/docs/tasks/debug/",
      source_label: "Kubernetes official debugging docs",
      reviewed_at: "2026-05-20"
    }
  ]
};

const interviewPrep = {
  domains: ["Kubernetes"],
  levels: ["Fresher"],
  total_questions: 2,
  packs: [
    {
      slug: "kubernetes-debugging-interview-pack",
      title: "Kubernetes Debugging Interview Pack",
      domain: "Kubernetes",
      level_group: "Fresher",
      focus: "Service routing, rollouts, Pods, probes, requests, and safe kubectl evidence collection.",
      related_course_slug: "platform-kubernetes-fundamentals",
      related_labs: ["trace-service-to-pod"],
      official_sources: [{ label: "Kubernetes official debugging docs", url: "https://kubernetes.io/docs/tasks/debug/" }],
      questions: [
        {
          question: "A Service returns 503 after a label cleanup. Walk me through your diagnosis.",
          scenario: "A deployment is running, the Service exists, and users get intermittent 503s.",
          answer_outline: ["Read the Service selector.", "Compare Pod labels.", "Inspect EndpointSlices."],
          strong_signals: ["Mentions EndpointSlices"],
          red_flags: ["Deletes Pods first"],
          practice_task: "Use the trace-service-to-pod lab."
        },
        {
          question: "What evidence do you collect before restarting a failing workload?",
          scenario: "On-call wants to restart checkout during an incident.",
          answer_outline: ["Capture describe output.", "Save previous logs."],
          strong_signals: ["Preserves previous logs"],
          red_flags: ["Restarts before evidence"],
          practice_task: "Write a restart decision note."
        }
      ]
    }
  ]
};

const testLearnerId = "guest-test-learner";

function localProgressKey(userId = testLearnerId) {
  return `platform-academy-progress-v1:${userId}`;
}

function localActivityKey(userId = testLearnerId) {
  return `platform-academy-activity-v1:${userId}`;
}

function localLabSubmissionsKey(userId = testLearnerId) {
  return `platform-academy-lab-submissions-v1:${userId}`;
}

function seedLocalProgress(records: unknown[], userId = testLearnerId) {
  localStorage.setItem(localProgressKey(userId), JSON.stringify(records));
}

function readLocalProgress(userId = testLearnerId) {
  return JSON.parse(localStorage.getItem(localProgressKey(userId)) ?? "[]") as Array<Record<string, unknown>>;
}

function readLocalActivity(userId = testLearnerId) {
  return JSON.parse(localStorage.getItem(localActivityKey(userId)) ?? "[]") as Array<Record<string, unknown>>;
}

function seedLocalLabSubmissions(records: unknown[], userId = testLearnerId) {
  localStorage.setItem(localLabSubmissionsKey(userId), JSON.stringify(records));
}

function readLocalLabSubmissions(userId = testLearnerId) {
  return JSON.parse(localStorage.getItem(localLabSubmissionsKey(userId)) ?? "[]") as Array<Record<string, unknown>>;
}

const dashboard = {
  user_id: testLearnerId,
  xp: { total: 20, lesson_completion_xp: 20, quiz_xp: 0, review_xp: 0 },
  daily_goal: { target_xp: 50, earned_xp_today: 20, met: false },
  streak: { current_days: 1, freeze_available: false, last_activity_date: "2026-05-28" },
  achievements: [],
  completed_lessons: 1,
  due_reviews: 0
};

function stubAcademyFetch(overrides: { catalog?: typeof catalog; interviewPrep?: typeof interviewPrep; labs?: typeof catalog.labs } = {}) {
  const catalogPayload = overrides.catalog ?? catalog;
  const interviewPrepPayload = overrides.interviewPrep ?? interviewPrep;
  const labsPayload = overrides.labs ?? catalog.labs;
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalogPayload);
      if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
      if (isLabsIndexUrl(url)) return jsonResponse(labsPayload);
      if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
      if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrepPayload);
      if (isStaticOrApi(url, "/api/lessons/201", "/static-api/lessons/201.json")) return jsonResponse(lesson201);
      if (isStaticOrApi(url, "/api/lessons/202", "/static-api/lessons/202.json")) return jsonResponse(lesson202);
      if (url.includes(`/api/platform-academy/lab-submissions/${testLearnerId}`)) return jsonResponse([labSubmissionIndex]);
      if (url.includes(`/api/platform-academy/labs/trace-service-to-pod/submission/${testLearnerId}`)) return jsonResponse(labSubmission);
      if (url.endsWith("/api/platform-academy/labs/trace-service-to-pod/submission")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return jsonResponse({
          id: 77,
          lab_slug: "trace-service-to-pod",
          score: 50,
          completed_checks: Object.values(body.checked_items ?? {}).filter(Boolean).length,
          total_checks: 2,
          answered_prompts: Object.values(body.worksheet_answers ?? {}).filter((value) => String(value).trim()).length,
          total_prompts: 1,
          evidence_terms: ["endpointslice", "selector"],
          rubric_feedback: [
            {
              criterion: "Captures selector, Pod label, EndpointSlice, and cleanup evidence.",
              status: "passes",
              feedback: "The note includes concrete evidence.",
              evidence_terms: ["endpointslice", "selector"]
            }
          ],
          created_at: "2026-05-28T00:00:00",
          updated_at: "2026-05-28T00:01:00",
          ...body
        });
      }
      if (url.includes(`/api/platform-academy/activity/${testLearnerId}`)) return jsonResponse([]);
      if (url.includes(`/api/progress/${testLearnerId}`)) {
        return jsonResponse([{ id: 1, user_id: testLearnerId, lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }]);
      }
      if (url.includes(`/api/users/${testLearnerId}/dashboard`)) return jsonResponse(dashboard);
      if (url.endsWith("/api/platform-academy/activity")) {
        const body = JSON.parse(String(init?.body ?? "{}"));
        return jsonResponse({ id: 42, ...body, updated_at: "2026-05-28T00:00:00" });
      }
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
    seedLocalProgress([{ id: 1, user_id: testLearnerId, lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
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
    expect(screen.getByText("Learning state")).toBeInTheDocument();
    expect(screen.getAllByText("Kubernetes Fundamentals").length).toBeGreaterThan(0);
    expect(screen.getByText("Course list")).toBeInTheDocument();
    expect(screen.getByText("Learning checks")).toBeInTheDocument();
    expect(screen.getByText("Interview bank")).toBeInTheDocument();
    expect(screen.getByText("Interview sprint")).toBeInTheDocument();
    expect(screen.getByText("Saved progress")).toBeInTheDocument();
    expect(screen.getByText("Kubernetes Fundamentals: Containers, Images, and Pods")).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
    expect(screen.getByText(testLearnerId)).toBeInTheDocument();
    expect(screen.getByText("Guest profile")).toBeInTheDocument();
    expect(screen.getByText("Local progress")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/static-api/platform-academy-catalog.json", expect.objectContaining({ cache: "force-cache" }));
  });

  it("loads from static snapshots when same-origin API routes return the static shell", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (url.startsWith("/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (url.startsWith("/static-api/platform-academy-labs.json")) return jsonResponse(catalog.labs);
        if (url.startsWith("/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (url.startsWith("/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
        if (url.includes("/api/")) return htmlResponse();
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();
    expect(screen.queryByText("Platform Academy is unavailable.")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/static-api/platform-academy-catalog.json", expect.objectContaining({ cache: "force-cache" }));
    expect(fetch).toHaveBeenCalledWith("/static-api/platform-academy-roadmap.json", expect.objectContaining({ cache: "force-cache" }));
    expect(fetch).toHaveBeenCalledWith("/static-api/platform-academy-labs.json", expect.objectContaining({ cache: "force-cache" }));
  });

  it("renders interview preparation packs with docs links", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/interview-prep"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Interview prep" })).toBeInTheDocument();
    expect(screen.getAllByText("Kubernetes Debugging Interview Pack").length).toBeGreaterThan(0);
    expect(screen.getByText("Study links")).toBeInTheDocument();
    expect(screen.getByText("A Service returns 503 after a label cleanup. Walk me through your diagnosis.")).toBeInTheDocument();
    expect(screen.getAllByText("Good answers include").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Common mistakes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Study this").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /course: kubernetes fundamentals/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /resource: kubernetes official reference/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /lab: trace service traffic to ready pods/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /kubernetes official debugging docs/i })[0]).toHaveAttribute(
      "href",
      "https://kubernetes.io/docs/tasks/debug/"
    );

    fireEvent.click(screen.getAllByRole("button", { name: /mark practiced/i })[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: /practiced/i })).toBeInTheDocument());
    expect(readLocalActivity()).toContainEqual(expect.objectContaining({
      user_id: testLearnerId,
      target_type: "interview_question",
      target_id: "kubernetes-debugging-interview-pack:1",
      state: "completed"
    }));
  });

  it("downloads an interview cram sheet with questions, sources, and linked practice", async () => {
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:interview-cram-sheet";
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn()
    });
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/interview-prep"]}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /download cram sheet/i }));

    expect(anchorClick).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const sheet = await (createObjectURL.mock.calls[0][0] as Blob).text();
    expect(sheet).toContain("# Kubernetes Debugging Interview Pack");
    expect(sheet).toContain("A Service returns 503 after a label cleanup.");
    expect(sheet).toContain("Resource: Kubernetes Official Reference - /resources/kubernetes-official-reference");
    expect(sheet).toContain("Lab: Trace Service traffic to ready Pods - /labs/trace-service-to-pod");
    expect(sheet).toContain("Docs: Kubernetes official debugging docs - https://kubernetes.io/docs/tasks/debug/");
    expect(sheet).toContain("reviewed May 20, 2026");
  });

  it("downloads a filtered multi-pack interview cram sheet", async () => {
    const multiPackPrep = {
      ...interviewPrep,
      total_questions: 3,
      packs: [
        ...interviewPrep.packs,
        {
          ...interviewPrep.packs[0],
          slug: "kubernetes-sre-interview-pack",
          title: "Kubernetes SRE Interview Pack",
          questions: [
            {
              question: "How do you explain a probe-driven rollout stall?",
              scenario: "A rollout is healthy in CI but never becomes available in the cluster.",
              answer_outline: ["Compare readiness probe failures.", "Check rollout events.", "Tie symptoms to Service endpoints."],
              strong_signals: ["Connects readiness to traffic eligibility"],
              red_flags: ["Scales replicas blindly"],
              practice_task: "Use the trace-service-to-pod lab and write a rollout note."
            }
          ]
        }
      ]
    };
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:visible-interview-cram-sheets";
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn()
    });
    stubAcademyFetch({ interviewPrep: multiPackPrep });

    render(
      <MemoryRouter initialEntries={["/interview-prep"]}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /download 2 visible packs/i }));

    expect(anchorClick).toHaveBeenCalled();
    const sheet = await (createObjectURL.mock.calls[0][0] as Blob).text();
    expect(sheet).toContain("# Platform Academy interview cram sheets");
    expect(sheet).toContain("Packs: 2");
    expect(sheet).toContain("Questions: 3");
    expect(sheet).toContain("## Kubernetes Debugging Interview Pack");
    expect(sheet).toContain("## Kubernetes SRE Interview Pack");
    expect(sheet).toContain("How do you explain a probe-driven rollout stall?");
    expect(sheet).toContain("Resource: Kubernetes Official Reference - /resources/kubernetes-official-reference");
  });

  it("saves and downloads a custom interview study plan", async () => {
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:custom-interview-study-plan";
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn()
    });
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/interview-prep"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Interview prep" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/study plan name/i), { target: { value: "Kube service interview sprint" } });
    fireEvent.click(screen.getByRole("button", { name: /new plan/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Study plan saved."));
    expect(screen.getByText(/2 questions \/ 1 pack/i)).toBeInTheDocument();
    const savedPlans = JSON.parse(localStorage.getItem("platform-academy-interview-study-plans-v1") ?? "[]");
    expect(savedPlans[0]).toMatchObject({
      name: "Kube service interview sprint",
      questionIds: ["kubernetes-debugging-interview-pack:1", "kubernetes-debugging-interview-pack:2"]
    });

    fireEvent.click(screen.getByRole("button", { name: /download plan/i }));

    expect(anchorClick).toHaveBeenCalled();
    const sheet = await (createObjectURL.mock.calls[0][0] as Blob).text();
    expect(sheet).toContain("# Kube service interview sprint study plan");
    expect(sheet).toContain("Questions: 2");
    expect(sheet).toContain("A Service returns 503 after a label cleanup.");
    expect(sheet).toContain("What evidence do you collect before restarting a failing workload?");
    expect(sheet).toContain("Resource: Kubernetes Official Reference - /resources/kubernetes-official-reference");
    expect(sheet).toContain("Lab: Trace Service traffic to ready Pods - /labs/trace-service-to-pod");
    expect(sheet).toContain("Docs: Kubernetes official debugging docs - https://kubernetes.io/docs/tasks/debug/");
  });

  it("regenerates the local guest profile and reloads progress for the new id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
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
    await waitFor(() => expect(screen.getByText(regeneratedLearnerId)).toBeInTheDocument());
    expect(readLocalProgress(regeneratedLearnerId)).toEqual([]);
  });

  it("restores a saved guest recovery key and reloads progress", async () => {
    const restoredLearnerId = "guest-abc123def456";
    seedLocalProgress([{ id: 7, user_id: restoredLearnerId, lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }], restoredLearnerId);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open guest recovery key/i }));
    expect(screen.getByRole("dialog", { name: /save or restore progress/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/restore saved key/i), { target: { value: restoredLearnerId.toUpperCase() } });
    fireEvent.click(screen.getByRole("button", { name: /restore profile/i }));

    await waitFor(() => expect(screen.getByText(restoredLearnerId)).toBeInTheDocument());
    expect(readLocalActivity(restoredLearnerId)).toContainEqual(
      expect.objectContaining({
        user_id: restoredLearnerId,
        target_type: "guest_recovery",
        target_id: "profile-restore",
        state: "completed"
      })
    );
    expect(localStorage.getItem(LOCAL_LEARNER_ID_KEY)).toBe(restoredLearnerId);
    expect(readLocalProgress(restoredLearnerId)).toContainEqual(expect.objectContaining({ lesson_id: 201, completed: true }));
  });

  it("keeps recovery dialog focus keyboard-friendly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();
    const opener = screen.getByRole("button", { name: /open guest recovery key/i });

    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: /save or restore progress/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^close$/i })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: /save or restore progress/i })).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("exports and imports a guest profile backup from the recovery dialog", async () => {
    const exportedState = {
      schema_version: 1,
      exported_at: "2026-05-28T00:00:00",
      source_user_id: testLearnerId,
      progress: [{ lesson_id: 201, completed: true, score: 1, updated_at: "2026-05-28T00:00:00" }],
      activity: [{ target_type: "resource", target_id: "kubernetes-debugging-cheatsheet", state: "completed", updated_at: "2026-05-28T00:00:00" }],
      lab_submissions: [
        {
          lab_slug: "trace-service-to-pod",
          worksheet_answers: { "worksheet-0": "selector mismatch" },
          checked_items: { "validation-0": true },
          status: "submitted",
          updated_at: "2026-05-28T00:00:00"
        }
      ],
      interview_study_plans: [
        {
          id: "plan-kube",
          name: "Kube interview sprint",
          questionIds: ["kubernetes-debugging-interview-pack:1"],
          createdAt: "2026-05-28T00:00:00",
          updatedAt: "2026-05-28T00:00:00"
        }
      ]
    };
    const localStudyPlans = [
      {
        id: "plan-local",
        name: "Local export plan",
        questionIds: ["kubernetes-debugging-interview-pack:2"],
        createdAt: "2026-05-28T01:00:00",
        updatedAt: "2026-05-28T01:00:00"
      }
    ];
    seedLocalProgress(exportedState.progress);
    localStorage.setItem(localActivityKey(), JSON.stringify(exportedState.activity));
    seedLocalLabSubmissions(exportedState.lab_submissions);
    localStorage.setItem("platform-academy-interview-study-plans-v1", JSON.stringify(localStudyPlans));
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:platform-academy-backup";
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
        void init;
        return jsonResponse([]);
      })
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open guest recovery key/i }));
    fireEvent.click(screen.getByRole("button", { name: /export json/i }));

    await waitFor(() => expect(anchorClick).toHaveBeenCalled());
    const exportedBackup = JSON.parse(await (createObjectURL.mock.calls[0][0] as Blob).text());
    expect(exportedBackup.interview_study_plans).toEqual(localStudyPlans);
    expect(exportedBackup.progress).toContainEqual(expect.objectContaining({ lesson_id: 201, completed: true }));

    const fileInput = screen.getByLabelText(/import json/i);
    fireEvent.change(fileInput, {
      target: { files: [new File([JSON.stringify(exportedState)], "platform-academy-backup.json", { type: "application/json" })] }
    });

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Imported 1 lessons, 1 activity rows, 1 lab workbooks"));
    expect(readLocalProgress()).toContainEqual(expect.objectContaining({ lesson_id: 201, completed: true }));
    expect(readLocalActivity()).toContainEqual(expect.objectContaining({ target_type: "resource", target_id: "kubernetes-debugging-cheatsheet" }));
    expect(readLocalLabSubmissions()).toContainEqual(expect.objectContaining({ lab_slug: "trace-service-to-pod" }));
    expect(JSON.parse(localStorage.getItem("platform-academy-interview-study-plans-v1") ?? "[]")).toEqual(exportedState.interview_study_plans);
    expect(screen.getByRole("status")).toHaveTextContent("and 1 interview study plan");
  });

  it("rejects invalid guest profile backups before posting an import request", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Platform Academy" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open guest recovery key/i }));

    const fileInput = screen.getByLabelText(/import json/i);
    fireEvent.change(fileInput, {
      target: {
        files: [
          new File(
            [
              JSON.stringify({
                schema_version: 1,
                exported_at: "2026-05-28T00:00:00",
                source_user_id: testLearnerId,
                progress: [],
                activity: [],
                lab_submissions: [
                  {
                    lab_slug: "trace-service-to-pod",
                    worksheet_answers: { "worksheet-0": "x".repeat(4001) },
                    checked_items: {},
                    status: "submitted"
                  }
                ]
              })
            ],
            "invalid-platform-academy-backup.json",
            { type: "application/json" }
          )
        ]
      }
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/backup lab workbook fields exceed the import limit/i);
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith("/api/platform-academy/state/import"))).toBe(false);
  });

  it("sanitizes stale lab workbook keys before saving", async () => {
    seedLocalLabSubmissions([
      {
        ...labSubmission,
        worksheet_answers: {
          "worksheet-0": "EndpointSlice has no addresses.",
          "ghost-answer": "stale local data"
        },
        checked_items: {
          "worksheet-0": false,
          "ghost-check": true
        }
      }
    ]);
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(await screen.findByText("Saved to profile")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save workbook/i }));

    await waitFor(() => {
      expect(readLocalLabSubmissions()).toContainEqual(expect.objectContaining({ lab_slug: "trace-service-to-pod" }));
    });
    const savedWorkbook = readLocalLabSubmissions().find((submission) => submission.lab_slug === "trace-service-to-pod");
    expect(savedWorkbook).toMatchObject({
      user_id: testLearnerId,
      worksheet_answers: { "worksheet-0": "EndpointSlice has no addresses." },
      checked_items: { "worksheet-0": false }
    });
    expect(JSON.stringify(savedWorkbook)).not.toContain("ghost");
  });

  it("renders a comprehensive resources library", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) {
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
    expect(screen.getByText("Runbooks, projects, checklists, references")).toBeInTheDocument();
    expect(screen.queryByText(/implementation gap audit/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Kubernetes Debugging Cheatsheet").length).toBeGreaterThan(0);
    expect(screen.getByText("Library index")).toBeInTheDocument();
  });

  it("renders roadmap stages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse(resources);
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
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

  it("renders a not found page for unknown routes", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/missing-route"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByText("This route is not available in Platform Academy.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open dashboard" })).toHaveAttribute("href", "/dashboard/home");
    expect(screen.getByRole("link", { name: "Open labs" })).toHaveAttribute("href", "/labs");
    expect(screen.getByRole("link", { name: "Open resources" })).toHaveAttribute("href", "/resources");
  });

  it("surfaces saved workbook status in the lab queue", async () => {
    seedLocalLabSubmissions([labSubmissionIndex]);
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Labs for incidents and architecture reviews" })).toBeInTheDocument();
    expect(screen.getByLabelText("Starter path")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Incident drills" })).toBeInTheDocument();
    expect(screen.getByText("1 starter lab")).toBeInTheDocument();
    expect(screen.getByText("Service routing incident")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open starter lab: trace service traffic to ready pods/i })).toHaveAttribute(
      "href",
      "/labs/trace-service-to-pod"
    );
    expect(screen.getAllByText(/Strong evidence · \d+%|In progress · \d+%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\d+% workbook score/)).toBeInTheDocument();
    expect(screen.getByText("1 cluster-ready / 1 evidence-ready / 1 active / 1 full lab")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Portfolio-grade" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cluster setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "File-only" })).toBeInTheDocument();
    expect(screen.getAllByText("Cluster setup included").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kubernetes Service routing").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "All tiers" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guided lab" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Evidence pack" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cluster setup" }));
    expect(screen.getAllByRole("heading", { name: "Trace Service traffic to ready Pods" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "File-only" }));
    expect(screen.getByText("No labs match those filters.")).toBeInTheDocument();
  });

  it("renders the saved lab evidence journal", async () => {
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:lab-evidence-report";
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn()
    });
    seedLocalLabSubmissions([labSubmissionIndex]);
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs/history"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Saved workbooks and rubric signals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(screen.getAllByText(/\d+%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Strong: 1|Passes: 1|Missing: 1/)).toBeInTheDocument();
    expect(screen.getAllByText("endpointslice").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /open lab/i }).some((link) => link.getAttribute("href") === "/labs/trace-service-to-pod")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /download report/i }));
    expect(anchorClick).toHaveBeenCalled();
    const report = await (createObjectURL.mock.calls[0][0] as Blob).text();
    expect(report).toContain("# Platform Academy Lab Evidence");
    expect(report).toContain("Saved labs: 1");
    expect(report).toContain("Route: /labs/trace-service-to-pod");
    expect(report).toContain("### Worksheet Notes");
    expect(report).toContain("Service selector app=checkout");
    expect(report).toContain("### Learner Artifacts");
    expect(report).toContain("labs/platform-academy/trace-service-to-pod/evidence-template.md");
    expect(report).toContain("### Rubric Follow-ups");
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

    expect(readLocalProgress()).toContainEqual(expect.objectContaining({
      user_id: testLearnerId,
      lesson_id: 202,
      completed: true,
      score: 1
    }));
  });

  it("offers direct next lesson navigation from lesson pages", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/lessons/201"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Containers, Images, and Pods" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next lesson services, labels, selectors, and namespaces/i })).toHaveAttribute(
      "href",
      "/courses/platform-kubernetes-fundamentals/lessons/2"
    );
  });

  it("blocks lessons outside the Platform Academy catalog", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/lessons/1"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Lesson outside Platform Academy." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark complete/i })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/lessons/1"));
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

    await waitFor(() => {
      fireEvent.scroll(window);
      expect(readLocalProgress()).toContainEqual(expect.objectContaining({ user_id: testLearnerId, lesson_id: 202, completed: true }));
    });
    await waitFor(() => expect(screen.getByRole("button", { name: /progress saved/i })).toBeInTheDocument());
    expect(screen.getByText("Completed automatically after reading.")).toBeInTheDocument();
    fireEvent.scroll(window);
    await waitFor(() => {
      const lessonProgress = readLocalProgress().filter((item) => item.lesson_id === 202);
      expect(lessonProgress).toHaveLength(1);
      expect(lessonProgress[0]).toMatchObject({ user_id: testLearnerId, completed: true });
    });
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
        if (isStaticOrApi(url, "/api/platform-academy/catalog", "/static-api/platform-academy-catalog.json")) return jsonResponse(catalog);
        if (isStaticOrApi(url, "/api/platform-academy/roadmap", "/static-api/platform-academy-roadmap.json")) return jsonResponse(roadmap);
        if (isLabsIndexUrl(url)) return jsonResponse(catalog.labs);
        if (isStaticOrApi(url, "/api/platform-academy/resources", "/static-api/platform-academy-resources.json")) return jsonResponse({ ...resources, resources: manyResources });
        if (isStaticOrApi(url, "/api/platform-academy/interview-prep", "/static-api/platform-academy-interview-prep.json")) return jsonResponse(interviewPrep);
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

    expect(await screen.findByText("36 shown / 40 matching resources")).toBeInTheDocument();
    expect(screen.queryByText("Kubernetes Debugging Cheatsheet 40")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /load 4 more resources/i }));
    expect(await screen.findByText("Kubernetes Debugging Cheatsheet 40")).toBeInTheDocument();
    expect(screen.getByText("40 shown / 40 matching resources")).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /mark reviewed/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /review saved/i })).toBeInTheDocument());
  });

  it("hydrates lab workbooks from the labs endpoint when the catalog summary is thin", async () => {
    const catalogWithThinLabSummary = {
      ...catalog,
      labs: catalog.labs.map((lab) => ({
        ...lab,
        artifact_paths: [],
        learner_artifact_paths: [],
        worksheet_prompts: [],
        validation_checks: [],
        cleanup_commands: []
      }))
    };
    stubAcademyFetch({ catalog: catalogWithThinLabSummary, labs: catalog.labs });

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run progress by phase" })).toBeInTheDocument();
    expect(screen.getByText("triage-notes.md should be cited before diagnosis.")).toBeInTheDocument();
    expect(screen.getByText("0/1 prompts answered")).toBeInTheDocument();
    expect(screen.getByText("0/1 validation checks")).toBeInTheDocument();
  });

  it("keeps catalog lab workbook details when the labs endpoint is thin", async () => {
    const thinLabEndpointPayload = catalog.labs.map((lab) => ({
      ...lab,
      artifact_paths: [],
      learner_artifact_paths: [],
      worksheet_prompts: [],
      validation_checks: [],
      cleanup_commands: []
    }));
    stubAcademyFetch({ labs: thinLabEndpointPayload });

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run progress by phase" })).toBeInTheDocument();
    expect(screen.getByText("triage-notes.md should be cited before diagnosis.")).toBeInTheDocument();
    expect(screen.getByText("0/1 prompts answered")).toBeInTheDocument();
    expect(screen.getByText("0/1 validation checks")).toBeInTheDocument();
  });

  it("shows actionable rubric feedback before workbook save", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(await screen.findByText("Saved to profile")).toBeInTheDocument();
    expect(screen.getByText("1 Missing")).toBeInTheDocument();
    expect(screen.getByText("Criterion 1")).toBeInTheDocument();
    expect(screen.getByText("No matched evidence terms yet")).toBeInTheDocument();
    expect(screen.getByText("No matching evidence yet")).toBeInTheDocument();
    expect(screen.getByText("Update worksheet prompt 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run progress by phase" })).toBeInTheDocument();
    expect(screen.getByText("Setup ready")).toBeInTheDocument();
    expect(screen.getByText("False leads pending")).toBeInTheDocument();
    expect(screen.getByText("0/1 prompts answered")).toBeInTheDocument();
  });

  it("covers lab and lesson detail routes with linked artifacts", async () => {
    stubAcademyFetch();

    render(
      <MemoryRouter initialEntries={["/labs/trace-service-to-pod"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Trace Service traffic to ready Pods" })).toBeInTheDocument();
    expect(screen.getAllByText("Full lab").length).toBeGreaterThan(0);
    expect(screen.getByText("Guided lab run sequence")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Investigate, prove, validate, clean up" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prepare workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Investigate safely" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Validate the finding" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reset or hand off" })).toBeInTheDocument();
    expect(screen.getByText("Evidence artifact map")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learner-safe files" })).toBeInTheDocument();
    expect(screen.getByText("Self-check script")).toBeInTheDocument();
    expect(screen.getAllByText("validate.sh").length).toBeGreaterThan(0);
    expect(screen.getByText("Prerequisites")).toBeInTheDocument();
    expect(screen.getAllByText("Setup commands").length).toBeGreaterThan(0);
    expect(screen.getByText("Opt-in self-check commands")).toBeInTheDocument();
    expect(screen.getByText("bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --run-analyzer")).toBeInTheDocument();
    expect(screen.getByText("Practice steps")).toBeInTheDocument();
    expect(screen.getByText("Expected evidence")).toBeInTheDocument();
    expect(screen.getByText("Validation commands")).toBeInTheDocument();
    expect(screen.getByText("Cleanup commands")).toBeInTheDocument();
    expect(screen.getByText("No-cluster fallback")).toBeInTheDocument();
    expect(screen.getByText("Worksheet and validation state")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run progress by phase" })).toBeInTheDocument();
    expect(screen.getByText("Setup ready")).toBeInTheDocument();
    expect(screen.getByText("False leads pending")).toBeInTheDocument();
    expect(screen.getByText("0/1 validation checks")).toBeInTheDocument();
    const commandDeck = screen.getByLabelText("Lab phase command deck");
    expect(within(commandDeck).getByRole("heading", { name: "Copy by lab phase" })).toBeInTheDocument();
    expect(within(commandDeck).getByRole("button", { name: /setup: 1 command/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(commandDeck).getByText("kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml")).toBeInTheDocument();
    fireEvent.click(within(commandDeck).getByRole("button", { name: /validation: 0\/1 checks/i }));
    expect(within(commandDeck).getByText(/bash labs\/platform-academy\/trace-service-to-pod\/validate\.sh/)).toBeInTheDocument();
    fireEvent.click(within(commandDeck).getByRole("button", { name: /closeout: listed/i }));
    expect(within(commandDeck).getByText(/bash labs\/platform-academy\/trace-service-to-pod\/cleanup\.sh/)).toBeInTheDocument();
    expect(screen.getByText("Learner workspace contract")).toBeInTheDocument();
    expect(screen.getByText("Guide, evidence, verification, cleanup")).toBeInTheDocument();
    expect(screen.getByText("4 / 4 present")).toBeInTheDocument();
    expect(screen.getAllByText("Evidence").length).toBeGreaterThan(0);
    expect(screen.getByText("Validator")).toBeInTheDocument();
    expect(screen.queryByText("Solution")).not.toBeInTheDocument();
    expect(screen.queryByText("labs/platform-academy/trace-service-to-pod/solution.md")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download lab packet/i })).toHaveAttribute(
      "href",
      "/static-api/labs/trace-service-to-pod/packet.md"
    );
    expect(screen.getByRole("link", { name: /download learner workspace/i })).toHaveAttribute(
      "href",
      "/static-api/labs/trace-service-to-pod/workspace-bundle.zip"
    );
    expect(screen.getByRole("link", { name: /download learner workspace/i })).toHaveAttribute(
      "download",
      "trace-service-to-pod-learner-workspace.zip"
    );
    expect(screen.getByText("Downloaded workspace")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Run from extracted bundle" })).toBeInTheDocument();
    expect(screen.getByText(/unzip trace-service-to-pod-learner-workspace\.zip/)).toBeInTheDocument();
    expect(screen.getByText(/cd trace-service-to-pod/)).toBeInTheDocument();
    expect(screen.getAllByText(/\.\/setup\.sh/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\.\/validate\.sh --files-only/)).toBeInTheDocument();
    expect(screen.getAllByText(/\.\/cleanup\.sh/).length).toBeGreaterThan(0);
    expect(screen.getByText("Optional cluster workflow")).toBeInTheDocument();
    expect(screen.getByText(/bootstrap-local-cluster\.sh --preflight trace-service-to-pod/)).toBeInTheDocument();
    expect(screen.getByText(/\.\/setup\.sh --cluster/)).toBeInTheDocument();
    expect(screen.getByText(/\.\/validate\.sh --cluster/)).toBeInTheDocument();
    expect(screen.getByText(/No app namespace or Pods need to exist before setup/)).toBeInTheDocument();
    expect(await screen.findByText("Saved to profile")).toBeInTheDocument();
    expect(screen.getByLabelText("What evidence proves the Service selector mismatch?")).toBeInTheDocument();
    expect(screen.getByLabelText("Expected evidence captured")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Evidence note: What evidence proves the Service selector mismatch?"), {
      target: { value: "triage-notes.md False Leads ruled out first. EndpointSlice has no addresses until the selector is fixed." }
    });
    expect(screen.getByText("False leads captured")).toBeInTheDocument();
    expect(screen.getByText("1/1 prompts answered")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("What evidence proves the Service selector mismatch?"));
    fireEvent.click(screen.getByRole("button", { name: /save workbook/i }));
    await waitFor(() => expect(screen.getByText("Saved to profile")).toBeInTheDocument());
    expect(screen.getByText(/1 (Strong|Passes)/)).toBeInTheDocument();
    expect(screen.getAllByText(/Strong|Passes/).length).toBeGreaterThan(0);
    expect(screen.getByText("Matched evidence")).toBeInTheDocument();
    const savedWorkbook = readLocalLabSubmissions().find((submission) => submission.lab_slug === "trace-service-to-pod");
    expect(savedWorkbook).toMatchObject({
      user_id: testLearnerId,
      worksheet_answers: { "worksheet-0": "triage-notes.md False Leads ruled out first. EndpointSlice has no addresses until the selector is fixed." },
      checked_items: { "worksheet-0": true }
    });
    expect(screen.getByText("Rubric feedback")).toBeInTheDocument();
    expect(screen.getAllByText("labs/platform-academy/trace-service-to-pod/start.yaml").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /open linked lesson/i })).toHaveAttribute("href", "/courses/platform-kubernetes-fundamentals/lessons/2");
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
