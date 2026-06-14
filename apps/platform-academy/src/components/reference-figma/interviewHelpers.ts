import {
  STUDY_PLANS_RESTORED_EVENT,
  readInterviewStudyPlans,
  uniqueStrings,
  writeInterviewStudyPlans,
} from "../../lib/interviewStudyPlans";

export type ReferenceInterviewQuestion = {
  id: number;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  practiced: boolean;
};

export type ReferenceInterviewPack = {
  slug: string;
  title: string;
  domain: string;
  level: string;
  docsToRead: string[];
  relatedLabs: string[];
  strongSignals: string[];
  redFlags: string[];
  practiceTask: string;
  questions: ReferenceInterviewQuestion[];
};

export type ReferenceAnswerWriteup = {
  scenario: string;
  outline: string[];
  strongSignals: string[];
  redFlags: string[];
  practiceTask: string;
};

function referenceQuestionIds(pack: ReferenceInterviewPack) {
  return pack.questions.map((_, index) => `${pack.slug}:${index + 1}`);
}

export function referenceStudyPlanExists(pack: ReferenceInterviewPack) {
  const questionIds = referenceQuestionIds(pack);
  if (questionIds.length === 0) return false;
  return readInterviewStudyPlans().some((plan) => questionIds.every((questionId) => plan.questionIds.includes(questionId)));
}

export function saveReferenceStudyPlan(pack: ReferenceInterviewPack) {
  const now = new Date().toISOString();
  const planId = `reference-${pack.slug}`;
  const questionIds = referenceQuestionIds(pack);
  const existingPlans = readInterviewStudyPlans();
  const existing = existingPlans.find((plan) => plan.id === planId);
  const nextPlan = {
    id: planId,
    name: `${pack.title} study plan`,
    questionIds: uniqueStrings([...(existing?.questionIds ?? []), ...questionIds]),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const nextPlans = [nextPlan, ...existingPlans.filter((plan) => plan.id !== planId)].slice(0, 25);
  writeInterviewStudyPlans(nextPlans);
  globalThis.dispatchEvent?.(new Event(STUDY_PLANS_RESTORED_EVENT));
  return { created: !existing, questionCount: nextPlan.questionIds.length };
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function uniqueItems(items: string[]) {
  return Array.from(new Set(items));
}

export function answerWriteupFor(
  pack: ReferenceInterviewPack,
  question: ReferenceInterviewQuestion,
  questionIndex: number
): ReferenceAnswerWriteup {
  const text = question.question.toLowerCase();
  const baseSignals = uniqueItems(pack.strongSignals).slice(0, 3);
  const baseFlags = uniqueItems(pack.redFlags).slice(0, 3);

  if (includesAny(text, ["503", "service", "label", "selector"])) {
    return {
      scenario: "Traffic fails after metadata or selector changes, so separate Service routing, endpoint readiness, and rollout state before changing anything.",
      outline: [
        "State the suspected contract: Service selector must match Ready Pod labels in the same namespace.",
        "Inspect Service selector, Pod labels, and EndpointSlices before touching live objects.",
        "Check readiness probes and Deployment rollout state so an empty endpoint set is not mistaken for network failure.",
        "Fix the source manifest or chart, then verify EndpointSlices contain ready backend addresses."
      ],
      strongSignals: uniqueItems(["Mentions EndpointSlices", "Compares selectors with Pod labels", "Keeps the durable fix in source control", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Edits random live labels first", "Deletes Pods before preserving evidence", ...baseFlags]).slice(0, 5),
      practiceTask: "Write the four-command evidence note from the trace-service-to-pod lab."
    };
  }

  if (includesAny(text, ["rollout", "replicas", "deployment", "replicaset"])) {
    return {
      scenario: "A rollout is not reaching availability, so follow the controller chain from Deployment to ReplicaSet to Pods.",
      outline: [
        "Read desired, updated, ready, and available replica counts from the Deployment.",
        "Compare old and new ReplicaSets, then inspect the new Pods for readiness, image, scheduling, and events.",
        "Use rollout status/history to decide whether to pause, rollback, or fix the Pod template.",
        "Name the rollback limitation: Kubernetes can revert workload config, not external data state."
      ],
      strongSignals: uniqueItems(["Follows Deployment -> ReplicaSet -> Pod", "Reads rollout events", "Differentiates rollback from recovery", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Only scales replicas", "Ignores unavailable Pod events", ...baseFlags]).slice(0, 5),
      practiceTask: "Trace one stuck rollout and write the object chain with the blocking event."
    };
  }

  if (includesAny(text, ["readiness", "liveness", "startup", "probe"])) {
    return {
      scenario: "Probe behavior changes traffic eligibility and restart behavior, so define each probe by its operational effect.",
      outline: [
        "Readiness decides whether a Pod receives Service traffic.",
        "Liveness decides whether kubelet restarts a container that appears broken.",
        "Startup protects slow-starting apps before liveness begins enforcing restarts.",
        "Tie bad probe settings to symptoms: no endpoints, restart loops, or delayed rollout availability."
      ],
      strongSignals: uniqueItems(["Connects readiness to EndpointSlices", "Connects liveness to restarts", "Mentions startup probe gating", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Treats all probes as health checks with the same consequence", "Raises timeouts without explaining symptom", ...baseFlags]).slice(0, 5),
      practiceTask: "Explain one outage twice: once as a readiness failure and once as a liveness failure."
    };
  }

  if (includesAny(text, ["pending", "schedule", "scheduler", "node"])) {
    return {
      scenario: "A Pending Pod has not been bound to a node, so read scheduler evidence before debugging the app.",
      outline: [
        "Start with describe pod and events to identify Unschedulable reasons.",
        "Check requests, limits, taints, tolerations, node selectors, affinity, and PVC binding.",
        "Compare the requested resources and constraints against available nodes.",
        "Propose the smallest safe correction and explain its capacity or policy tradeoff."
      ],
      strongSignals: uniqueItems(["Starts from scheduler events", "Checks taints and resource requests", "Separates scheduling from runtime failure", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Checks app logs for a Pod that never scheduled", "Deletes and recreates without reading events", ...baseFlags]).slice(0, 5),
      practiceTask: "Create a Pending triage table with event, constraint, owner, and fix."
    };
  }

  if (includesAny(text, ["restart", "failing", "crash", "imagepull", "logs"])) {
    return {
      scenario: "A workload is failing after start or before image pull, so capture evidence that distinguishes runtime crash from image delivery failure.",
      outline: [
        "Read Pod status, restart count, last state, events, image, and owner reference.",
        "Use current and previous logs for CrashLoopBackOff; use events for ImagePullBackOff.",
        "Check configuration, secrets, command/args, probes, and image pull credentials.",
        "Preserve the evidence before restart or rollout changes remove useful context."
      ],
      strongSignals: uniqueItems(["Uses previous logs when appropriate", "Separates CrashLoopBackOff from ImagePullBackOff", "Captures events before mutation", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Restarts first", "Confuses pull failures with application crashes", ...baseFlags]).slice(0, 5),
      practiceTask: "Write a two-column CrashLoopBackOff versus ImagePullBackOff evidence comparison."
    };
  }

  if (includesAny(text, ["portfolio", "artifact"])) {
    return {
      scenario: "The interviewer wants proof of judgment, not just vocabulary, so choose an artifact that shows evidence, decisions, and recovery.",
      outline: [
        "Show a short incident note, runbook, or lab write-up with the original symptom and constraints.",
        "Include commands, observations, false leads ruled out, and the durable fix.",
        "Name the risk you avoided and how you verified the outcome.",
        "Close with one thing you would improve in production."
      ],
      strongSignals: uniqueItems(["Shows real evidence", "Explains tradeoffs", "Connects artifact to production risk", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Only shows screenshots", "Cannot explain verification", ...baseFlags]).slice(0, 5),
      practiceTask: "Turn one lab into a one-page portfolio evidence note."
    };
  }

  if (includesAny(text, ["seven-day", "crash plan", "crash"])) {
    return {
      scenario: "A crash plan should sequence fundamentals, drills, and answer rehearsal without pretending everything can be mastered at once.",
      outline: [
        "Prioritize the highest-frequency objects, commands, and failure modes for the target role.",
        "Alternate official docs, hands-on labs, and spoken answer practice each day.",
        "Use a small question queue and mark weak answers for repeat rehearsal.",
        "Finish with a mock interview and a portfolio artifact review."
      ],
      strongSignals: uniqueItems(["Limits scope", "Includes hands-on validation", "Schedules spoken practice", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Only reads docs", "No practice evidence", ...baseFlags]).slice(0, 5),
      practiceTask: "Write a seven-day plan with one deliverable per day."
    };
  }

  if (includesAny(text, ["challenges", "recommendation"])) {
    return {
      scenario: "A challenge tests whether you can defend a recommendation while adjusting to constraints and evidence.",
      outline: [
        "Restate the goal, constraints, and risk the recommendation is meant to reduce.",
        "Give the evidence that supports your choice and one alternative you considered.",
        "Name the tradeoff and the condition that would make you choose differently.",
        "Offer a low-risk validation step before committing broadly."
      ],
      strongSignals: uniqueItems(["Names tradeoffs", "Uses evidence instead of certainty", "Gives a reversible next step", ...baseSignals]).slice(0, 5),
      redFlags: uniqueItems(["Argues from preference only", "Cannot name an alternative", ...baseFlags]).slice(0, 5),
      practiceTask: "Prepare a two-minute defense with one alternative and one rollback point."
    };
  }

  return {
    scenario: `A ${pack.domain} interview answer should turn the prompt into a repeatable diagnostic or design path with evidence, tradeoffs, and a safe next action.`,
    outline: [
      "Clarify the symptom, scope, and ownership boundary before recommending a fix.",
      `Name the ${pack.domain} objects, signals, or commands that would produce evidence.`,
      "Separate hypotheses from facts and preserve useful evidence before mutation.",
      "Close with verification, rollback, and the durable source-of-truth change."
    ],
    strongSignals: baseSignals.length ? baseSignals : ["Uses evidence", "Names tradeoffs", "Verifies the result"],
    redFlags: baseFlags.length ? baseFlags : ["Jumps to a fix", "Skips verification", "Cannot explain ownership"],
    practiceTask: questionIndex % 2 === 0 ? pack.practiceTask : "Record a two-minute answer and rewrite it into four evidence-backed bullets."
  };
}

function markdownList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None listed.";
}

export function buildReferenceCramSheet(pack: ReferenceInterviewPack) {
  return [
    `# ${pack.title}`,
    "",
    `Domain: ${pack.domain}`,
    `Level: ${pack.level}`,
    "",
    "Docs to read:",
    markdownList(pack.docsToRead),
    "",
    "Related labs:",
    markdownList(pack.relatedLabs),
    "",
    ...pack.questions.map((question, index) => {
      const writeup = answerWriteupFor(pack, question, index);
      return [
        `## ${index + 1}. ${question.question}`,
        "",
        `Difficulty: ${question.difficulty}`,
        "",
        `Scenario: ${writeup.scenario}`,
        "",
        "Answer outline:",
        markdownList(writeup.outline),
        "",
        "Strong signals:",
        markdownList(writeup.strongSignals),
        "",
        "Red flags:",
        markdownList(writeup.redFlags),
        "",
        `Practice task: ${writeup.practiceTask}`
      ].join("\n");
    })
  ].join("\n\n");
}

export function buildReferenceCramSheetCollection(title: string, packs: ReferenceInterviewPack[]) {
  return [
    `# ${title}`,
    "",
    `Packs: ${packs.length}`,
    `Questions: ${packs.reduce((total, pack) => total + pack.questions.length, 0)}`,
    "",
    ...packs.map((pack) => buildReferenceCramSheet(pack))
  ].join("\n\n");
}

export function downloadMarkdownFile(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
