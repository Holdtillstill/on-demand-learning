import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = join(ROOT, "src/components/reference-figma/v1/data.ts");
const PUBLIC_ROOT = join(ROOT, "public");

const RESOURCE_TYPE_LABELS = {
  "architecture-diagram": "architecture diagram",
  "cost-review": "cost review",
  "decision-record": "decision record",
  "failure-mode-drill": "failure mode drill",
  "interview-prep": "interview prep",
  "lab-worksheet": "lab worksheet",
  "official-reference": "official reference",
  "portfolio-artifact": "portfolio artifact",
  "production-readiness": "production readiness checklist",
  "project-brief": "project brief",
  "security-review": "security review",
  "troubleshooting-guide": "troubleshooting guide"
};

const DOMAIN_SOURCES = {
  "AWS IAM": { label: "AWS IAM User Guide", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html" },
  "AWS Operations": { label: "AWS Documentation", url: "https://docs.aws.amazon.com/" },
  ArgoCD: { label: "Argo CD documentation", url: "https://argo-cd.readthedocs.io/en/stable/" },
  "CI/CD": { label: "GitHub Actions documentation", url: "https://docs.github.com/en/actions" },
  Career: { label: "Google SRE workbook", url: "https://sre.google/workbook/table-of-contents/" },
  "Cloud Native": { label: "CNCF landscape and glossary", url: "https://www.cncf.io/" },
  Docker: { label: "Docker documentation", url: "https://docs.docker.com/" },
  EKS: { label: "Amazon EKS User Guide", url: "https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html" },
  FinOps: { label: "FinOps Foundation framework", url: "https://www.finops.org/framework/" },
  Helm: { label: "Helm documentation", url: "https://helm.sh/docs/" },
  "Incident Response": { label: "Google SRE incident response", url: "https://sre.google/sre-book/managing-incidents/" },
  Kubernetes: { label: "Kubernetes documentation", url: "https://kubernetes.io/docs/" },
  kubectl: { label: "kubectl reference", url: "https://kubernetes.io/docs/reference/kubectl/" },
  Linux: { label: "Linux man-pages", url: "https://man7.org/linux/man-pages/" },
  Networking: { label: "Kubernetes networking docs", url: "https://kubernetes.io/docs/concepts/services-networking/" },
  Observability: { label: "OpenTelemetry documentation", url: "https://opentelemetry.io/docs/" },
  "Platform Engineering": { label: "CNCF Platforms White Paper", url: "https://tag-app-delivery.cncf.io/whitepapers/platforms/" },
  SRE: { label: "Google SRE book", url: "https://sre.google/sre-book/table-of-contents/" },
  Security: { label: "Kubernetes security docs", url: "https://kubernetes.io/docs/concepts/security/" },
  Terraform: { label: "Terraform documentation", url: "https://developer.hashicorp.com/terraform/docs" }
};

const DOC_SOURCES = {
  "Amazon EKS Best Practices Guide": "https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html",
  "Amazon EKS User Guide": "https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html",
  "Amazon VPC CNI for EKS": "https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html",
  "AWS IAM User Guide": "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html",
  "AWS Well-Architected Framework": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
  "CNCF Platforms Whitepaper": "https://tag-app-delivery.cncf.io/whitepapers/platforms/",
  "Docker Documentation": "https://docs.docker.com/",
  "EKS Pod Identity": "https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html",
  "Google SRE Golden Signals Interview Brief": "https://sre.google/sre-book/monitoring-distributed-systems/",
  "Helm Documentation": "https://helm.sh/docs/",
  "Kubernetes Debug Pods": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/",
  "Kubernetes Deployments": "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
  "Kubernetes Documentation": "https://kubernetes.io/docs/",
  "Kubernetes Services": "https://kubernetes.io/docs/concepts/services-networking/service/",
  "OpenTelemetry Documentation": "https://opentelemetry.io/docs/",
  "Terraform State": "https://developer.hashicorp.com/terraform/language/state"
};

const COURSE_BY_DOMAIN = {
  "AWS IAM": "platform-aws-iam-for-eks",
  "AWS Operations": "platform-aws-operations",
  ArgoCD: "platform-helm-argocd-delivery",
  "CI/CD": "platform-ci-cd-release-engineering",
  Docker: "platform-docker-image-delivery",
  EKS: "platform-eks-operations",
  Helm: "platform-helm-argocd-delivery",
  Kubernetes: "platform-kubernetes-fundamentals",
  Linux: "platform-linux-operator-foundations",
  Networking: "platform-networking-foundations",
  Observability: "platform-observability-sre",
  SRE: "platform-observability-sre",
  Security: "platform-security-multitenancy",
  Terraform: "platform-terraform-aws-infrastructure"
};

const COMMAND_BY_DOMAIN = {
  "AWS IAM": "aws sts get-caller-identity && aws iam simulate-principal-policy --help",
  "AWS Operations": "aws sts get-caller-identity && aws eks list-clusters",
  ArgoCD: "argocd app list && kubectl get applications.argoproj.io -A",
  Docker: "docker image ls && docker inspect <image>",
  EKS: "aws eks describe-cluster --name <cluster> && kubectl get nodes -o wide",
  Helm: "helm template ./chart && helm diff upgrade --allow-unreleased <release> ./chart",
  Kubernetes: "kubectl get events -A --sort-by=.lastTimestamp | tail -20",
  kubectl: "kubectl get pods -A -o wide && kubectl explain pod.spec",
  Linux: "ps aux | head && journalctl --since '15 min ago'",
  Networking: "ip route && kubectl get svc,endpointslices -A",
  Observability: "kubectl top pods -A && kubectl logs --tail=100 deploy/<name>",
  Terraform: "terraform plan -out=tfplan && terraform show -json tfplan",
};

function extractJsonArray(source, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find ${marker}`);

  const equalsIndex = source.indexOf("=", markerIndex);
  if (equalsIndex < 0) throw new Error(`Could not find assignment for ${exportName}`);

  const start = source.indexOf("[", equalsIndex);
  if (start < 0) throw new Error(`Could not find array start for ${exportName}`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, index + 1));
    }
  }
  throw new Error(`Could not find array end for ${exportName}`);
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sourceForDomain(domain) {
  return DOMAIN_SOURCES[domain] ?? { label: `${domain} official documentation`, url: "https://kubernetes.io/docs/" };
}

function sourceForDoc(label, domain) {
  return { label, url: DOC_SOURCES[label] ?? sourceForDomain(domain).url };
}

function resourceTypeLabel(type) {
  return RESOURCE_TYPE_LABELS[type] ?? type.replace(/-/g, " ");
}

function relatedLabSlugsForResource(resource, labs) {
  const tagSet = new Set(resource.tags.map(normalize));
  const direct = labs
    .filter((lab) => tagSet.has(normalize(lab.slug)) || tagSet.has(normalize(lab.title)))
    .map((lab) => lab.slug);
  if (direct.length) return unique(direct);

  const domain = normalize(resource.domain);
  return labs
    .filter((lab) => normalize(`${lab.track} ${lab.title} ${lab.skills.join(" ")}`).includes(domain))
    .slice(0, 2)
    .map((lab) => lab.slug);
}

function buildResourcePayload(resources, labs) {
  const mappedResources = resources.map((resource) => {
    const typeLabel = resourceTypeLabel(resource.type);
    const primarySource = sourceForDomain(resource.domain);
    const relatedLabs = relatedLabSlugsForResource(resource, labs);
    return {
      slug: resource.slug,
      title: resource.title,
      domain: resource.domain,
      level_group: resource.level,
      resource_type: typeLabel,
      estimated_minutes: resource.duration,
      summary: resource.summary,
      outcomes: [
        `Explain the core ${resource.domain} mental model in operational language.`,
        "Choose read-only evidence before making changes.",
        "Convert notes into a portfolio-ready artifact."
      ],
      prerequisites: [
        "Review the related Platform Academy lesson or lab.",
        "Use a local sandbox or approved environment.",
        `Skim ${primarySource.label} for current terminology.`
      ],
      safety_level: resource.tags.some((tag) => normalize(tag) === "local safe") || resource.level === "Fresher" ? "local-safe" : "read-only / sandbox-first",
      commands: [
        "# Start with read-only evidence and write down the hypothesis before mutation.",
        COMMAND_BY_DOMAIN[resource.domain] ?? "printf '%s\\n' 'collect evidence before making changes'"
      ],
      artifacts: unique([
        `${resource.domain} ${typeLabel} notes`,
        `${resource.domain} evidence checklist`,
        ...resource.tags.slice(0, 2).map((tag) => `${tag} artifact`)
      ]),
      related_lessons: [],
      related_labs: relatedLabs,
      next_steps: [
        "Open the related lab and collect evidence against a controlled scenario.",
        "Turn the findings into a short README section.",
        "Practice explaining the tradeoff and verification path aloud."
      ],
      source_takeaways: [
        `${typeLabel} content should stay anchored to ${primarySource.label}.`,
        "Prefer source-of-truth changes over live-only fixes."
      ],
      study_tasks: [
        `Summarize ${resource.title} in five bullets.`,
        "Write one command, one expected signal, and one unsafe action to avoid."
      ],
      interview_prompts: [
        `How would you use ${resource.title} during a production incident?`,
        `What evidence would change your mind in a ${resource.domain} troubleshooting path?`
      ],
      official_sources: [primarySource],
      source_url: primarySource.url,
      source_label: primarySource.label,
      reviewed_at: "2026-06-14"
    };
  });

  return {
    domains: unique(mappedResources.map((resource) => resource.domain)).sort(),
    types: unique(mappedResources.map((resource) => resource.resource_type)).sort(),
    resources: mappedResources
  };
}

function relatedLabSlugsForPack(pack, labs) {
  const titles = new Set(pack.relatedLabs.map(normalize));
  const direct = labs.filter((lab) => titles.has(normalize(lab.title))).map((lab) => lab.slug);
  if (direct.length) return unique(direct);
  const domain = normalize(pack.domain);
  return labs
    .filter((lab) => normalize(`${lab.track} ${lab.title} ${lab.skills.join(" ")}`).includes(domain))
    .slice(0, 2)
    .map((lab) => lab.slug);
}

function answerOutlineFor(pack, question) {
  const text = normalize(question.question);
  if (text.includes("service") || text.includes("selector") || text.includes("503")) {
    return [
      "Compare the Service selector with Ready Pod labels in the same namespace.",
      "Inspect EndpointSlices before assuming a network outage.",
      "Check readiness and rollout state to separate routing from workload health.",
      "Make the durable fix in the source manifest or chart."
    ];
  }
  if (text.includes("rollout") || text.includes("replica")) {
    return [
      "Read Deployment desired, updated, ready, available, and unavailable counts.",
      "Follow the chain from Deployment to ReplicaSet to Pods.",
      "Use events and rollout history to decide pause, rollback, or template fix.",
      "Verify user-impact recovery and document the source-of-truth change."
    ];
  }
  if (text.includes("probe") || text.includes("readiness") || text.includes("liveness")) {
    return [
      "Explain readiness as traffic eligibility and liveness as restart behavior.",
      "Use startup probes to protect slow-starting applications.",
      "Connect probe mistakes to empty endpoints, restart storms, or delayed rollouts.",
      "Tune probes from application behavior, not arbitrary timeouts."
    ];
  }
  return [
    "Clarify the symptom, scope, owner, and risk before recommending a fix.",
    `Name the ${pack.domain} objects, signals, and commands that produce evidence.`,
    "Separate facts from hypotheses and preserve evidence before mutation.",
    "Close with verification, rollback, and the durable source-of-truth change."
  ];
}

function buildInterviewPayload(packs, labs) {
  const mappedPacks = packs.map((pack) => {
    const officialSources = pack.docsToRead.length
      ? pack.docsToRead.map((label) => sourceForDoc(label, pack.domain))
      : [sourceForDomain(pack.domain)];
    return {
      slug: pack.slug,
      title: pack.title,
      domain: pack.domain,
      level_group: pack.level,
      focus: `${pack.domain} scenarios, evidence collection, tradeoffs, and portfolio-ready answers.`,
      related_course_slug: COURSE_BY_DOMAIN[pack.domain] ?? "platform-kubernetes-fundamentals",
      related_labs: relatedLabSlugsForPack(pack, labs),
      official_sources: officialSources,
      questions: pack.questions.map((question, index) => ({
        question: question.question,
        scenario: `Interview scenario ${index + 1} for ${pack.title}: answer with evidence, tradeoffs, and a safe next action.`,
        answer_outline: answerOutlineFor(pack, question),
        strong_signals: unique(pack.strongSignals).slice(0, 5),
        red_flags: unique(pack.redFlags).slice(0, 5),
        practice_task: index === 0 ? pack.practiceTask : "Record a two-minute answer and rewrite it into four evidence-backed bullets."
      }))
    };
  });

  return {
    domains: unique(mappedPacks.map((pack) => pack.domain)).sort(),
    levels: unique(mappedPacks.map((pack) => pack.level_group)).sort(),
    total_questions: mappedPacks.reduce((total, pack) => total + pack.questions.length, 0),
    packs: mappedPacks
  };
}

async function writeJson(relativePath, payload) {
  const outputPath = join(PUBLIC_ROOT, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
}

const source = await readFile(DATA_PATH, "utf8");
const labs = extractJsonArray(source, "labs");
const resources = extractJsonArray(source, "resources");
const interviewPacks = extractJsonArray(source, "interviewPacks");

const resourcesPayload = buildResourcePayload(resources, labs);
const interviewPayload = buildInterviewPayload(interviewPacks, labs);

await writeJson("static-api/platform-academy-resources.json", resourcesPayload);
await writeJson("api/platform-academy/resources", resourcesPayload);
await writeJson("static-api/platform-academy-interview-prep.json", interviewPayload);
await writeJson("api/platform-academy/interview-prep", interviewPayload);

console.log(
  `Synced reference static API: ${resourcesPayload.resources.length} resources, ${interviewPayload.packs.length} interview packs, ${interviewPayload.total_questions} questions.`
);
