export type Level = 'Fresher' | 'Intermediate' | 'Advanced';
export type LabRuntime = 'cluster' | 'file-only';
export type LabStatus = 'not-started' | 'in-progress' | 'strong-evidence' | 'submitted';
export type ResourceType =
  | 'cheatsheet' | 'runbook' | 'lab-worksheet' | 'project-brief'
  | 'interview-prep' | 'official-reference' | 'architecture-diagram'
  | 'template' | 'assessment' | 'troubleshooting-guide' | 'decision-record'
  | 'production-readiness' | 'failure-mode-drill' | 'security-review'
  | 'cost-review' | 'portfolio-artifact';

export interface Course {
  id: number;
  slug: string;
  title: string;
  track: string;
  level: Level;
  lessons: number;
  labs: number;
  duration: number;
  progress: number;
  description: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface Lab {
  id: number;
  slug: string;
  title: string;
  track: string;
  level: Level;
  duration: number;
  portfolioGrade: boolean;
  runtime: LabRuntime;
  tier: 'core' | 'portfolio';
  status: LabStatus;
  scenario: string;
  skills: string[];
  validationCommands: string[];
  expectedEvidence: string[];
  checklist: ChecklistItem[];
  relatedResources: { id: number; title: string }[];
}

export interface Resource {
  id: number;
  slug: string;
  title: string;
  type: ResourceType;
  level: Level;
  domain: string;
  duration: number;
  summary: string;
  tags: string[];
}

export interface InterviewQuestion {
  id: number;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  practiced: boolean;
}

export interface InterviewPack {
  id: number;
  slug: string;
  title: string;
  domain: string;
  level: Level;
  questionCount: number;
  duration: number;
  docsToRead: string[];
  relatedLabs: string[];
  strongSignals: string[];
  redFlags: string[];
  practiceTask: string;
  questions: InterviewQuestion[];
}

export interface LessonDetail {
  id: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  courseTrack: string;
  level: Level;
  title: string;
  summary: string;
  sequence: number;
  totalLessons: number;
  duration: number;
  body: string;
  practiceNotes: string;
  terms: { term: string; def: string }[];
  flashcards: { q: string; a: string }[];
}

export interface RoadmapStage {
  id: number;
  title: string;
  level: Level;
  role: string;
  focus: string;
  checkpoints: string[];
  courses: string[];
  completed: boolean;
  inProgress: boolean;
}

export const courses: Course[] = [
  {
    "id": 1,
    "slug": "platform-kubernetes-fundamentals",
    "title": "Kubernetes Fundamentals",
    "track": "Kubernetes",
    "level": "Fresher",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 100,
    "description": "Start from containers and learn how Pods, Deployments, Services, namespaces, labels, and probes fit together."
  },
  {
    "id": 2,
    "slug": "platform-kubectl-debugging-basics",
    "title": "kubectl Debugging Basics",
    "track": "kubectl",
    "level": "Fresher",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 75,
    "description": "Build a safe first-response workflow for describe, logs, events, exec, Pending, CrashLoopBackOff, ImagePullBackOff, and probes."
  },
  {
    "id": 3,
    "slug": "platform-cloud-native-foundations",
    "title": "Cloud Native Foundations",
    "track": "Cloud Native",
    "level": "Fresher",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 25,
    "description": "Learn Docker images, registries, YAML, configuration, basic networking, and resource requests before touching production clusters."
  },
  {
    "id": 10,
    "slug": "platform-linux-command-line-foundations",
    "title": "Linux and Command Line Foundations",
    "track": "Linux",
    "level": "Fresher",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Learn the shell, files, processes, permissions, logs, and package basics every Kubernetes operator needs before touching clusters."
  },
  {
    "id": 11,
    "slug": "platform-networking-fundamentals",
    "title": "Networking Foundations for Kubernetes",
    "track": "Networking",
    "level": "Fresher",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 50,
    "description": "Build the TCP/IP, DNS, HTTP, TLS, load-balancing, and firewall mental model needed for Kubernetes and AWS troubleshooting."
  },
  {
    "id": 16,
    "slug": "platform-docker-image-supply-chain",
    "title": "Docker Image and Supply Chain Operations",
    "track": "Docker",
    "level": "Fresher",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Build production-ready container images with clear runtime contracts, multi-stage builds, immutable promotion, scanning, SBOMs, and safe registry habits."
  },
  {
    "id": 4,
    "slug": "platform-eks-operations",
    "title": "EKS Operations",
    "track": "EKS",
    "level": "Intermediate",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Operate common EKS building blocks: VPC CNI, IP exhaustion, managed node groups, Fargate vs EC2, IRSA/OIDC, add-ons, and ALB controller."
  },
  {
    "id": 5,
    "slug": "platform-helm-application-delivery",
    "title": "Helm for Application Delivery",
    "track": "Helm",
    "level": "Intermediate",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Build charts that are reviewable, testable, rollback-aware, and safe for multi-environment delivery."
  },
  {
    "id": 6,
    "slug": "platform-argocd-gitops",
    "title": "ArgoCD GitOps",
    "track": "ArgoCD",
    "level": "Intermediate",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Operate GitOps with app-of-apps, projects, sync waves, pruning, drift, secrets, and multi-environment promotion."
  },
  {
    "id": 12,
    "slug": "platform-terraform-aws-infrastructure",
    "title": "Terraform for AWS Platform Infrastructure",
    "track": "Terraform",
    "level": "Intermediate",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Learn reproducible infrastructure workflows for VPCs, EKS modules, state, plans, reviews, drift, and environment promotion."
  },
  {
    "id": 13,
    "slug": "platform-aws-iam-for-eks",
    "title": "AWS IAM for EKS and Platform Teams",
    "track": "AWS IAM",
    "level": "Intermediate",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Learn IAM policies, roles, trust relationships, STS, IRSA, Pod Identity, and least-privilege reviews for EKS workloads."
  },
  {
    "id": 17,
    "slug": "platform-aws-operations-foundations",
    "title": "AWS Operations Foundations for Platform Engineers",
    "track": "AWS Operations",
    "level": "Intermediate",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Operate AWS-backed platforms through Well-Architected thinking, CloudWatch signals, VPC request paths, load balancer health, backups, and change safety."
  },
  {
    "id": 7,
    "slug": "platform-production-eks-architecture",
    "title": "Production EKS Architecture",
    "track": "EKS",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Design private clusters, endpoint access, Karpenter, multi-AZ capacity, cost guardrails, and cluster upgrade plans."
  },
  {
    "id": 8,
    "slug": "platform-kubernetes-security-multitenancy",
    "title": "Kubernetes Security and Multi-tenancy",
    "track": "Security",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Design RBAC, network policies, Pod Security Standards, admission controls, secrets strategy, and tenant boundaries."
  },
  {
    "id": 9,
    "slug": "platform-sre-observability-kubernetes",
    "title": "SRE and Observability for Kubernetes",
    "track": "SRE",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Build dashboards, alerts, SLOs, burn-rate rules, logs/traces, and runbooks that start from user impact."
  },
  {
    "id": 14,
    "slug": "platform-cicd-release-engineering",
    "title": "CI/CD and Release Engineering",
    "track": "CI/CD",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Build safe pipelines for container builds, tests, image signing, environment promotion, progressive delivery, and rollback."
  },
  {
    "id": 15,
    "slug": "platform-engineering-product-operating-model",
    "title": "Platform Engineering Operating Model",
    "track": "Platform Engineering",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Learn how platform teams define golden paths, service ownership, paved-road APIs, SLOs, cost guardrails, and internal developer experience."
  },
  {
    "id": 18,
    "slug": "platform-observability-telemetry-engineering",
    "title": "Observability and Telemetry Engineering",
    "track": "Observability",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Design metrics, logs, traces, OpenTelemetry pipelines, Prometheus alerts, dashboards, and ownership rules that reduce incident time instead of creating telemetry noise."
  },
  {
    "id": 19,
    "slug": "platform-incident-response-reliability",
    "title": "Incident Response and Reliability Leadership",
    "track": "Incident Response",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Practice incident command, severity, mitigation, communications, timelines, postmortems, corrective actions, and game days for platform roles."
  },
  {
    "id": 20,
    "slug": "platform-finops-kubernetes-aws",
    "title": "FinOps for Kubernetes and AWS Platforms",
    "track": "FinOps",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Learn cost visibility, ownership, right-sizing, Kubernetes waste, AWS EKS cost drivers, guardrails, and finance-friendly tradeoff communication."
  },
  {
    "id": 21,
    "slug": "platform-career-job-search-sprint",
    "title": "Platform Engineering Job Search Sprint",
    "track": "Career",
    "level": "Advanced",
    "lessons": 4,
    "labs": 1,
    "duration": 100,
    "progress": 0,
    "description": "Turn learning into interview-ready proof: skill gap maps, portfolio narratives, resume bullets, recruiter screens, STAR stories, and a 30-day prep operating plan."
  }
];

export const labs: Lab[] = [
  {
    "id": 1,
    "slug": "trace-service-to-pod",
    "title": "Trace Service traffic to ready Pods",
    "track": "Kubernetes",
    "level": "Fresher",
    "duration": 30,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "submitted",
    "scenario": "A Service exists but traffic returns 503 because labels and readiness do not line up.",
    "skills": [
      "service selectors",
      "EndpointSlices",
      "labels",
      "readiness",
      "namespace scope"
    ],
    "validationCommands": [
      "bash labs/platform-academy/trace-service-to-pod/validate.sh",
      "bash labs/platform-academy/trace-service-to-pod/validate.sh --evidence /tmp/trace-service-evidence.md",
      "bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --cluster",
      "python3 labs/platform-academy/trace-service-to-pod/service_route_analyzer.py --start labs/platform-academy/trace-service-to-pod/start.yaml --fixed labs/platform-academy/trace-service-to-pod/fixed.yaml --transcript labs/platform-academy/trace-service-to-pod/broken-evidence.txt",
      "kubectl apply -f labs/platform-academy/trace-service-to-pod/fixed.yaml"
    ],
    "expectedEvidence": [
      "The triage notes rule out Pod readiness, Service port wiring, node pressure, and a live-only patch.",
      "The Service selector starts as app=checkout.",
      "The checkout Pods are labeled app=checkout-api.",
      "EndpointSlice output has no ready checkout backend addresses until the selector is fixed.",
      "The local analyzer reports Service routing analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Read the Service selector.",
        "completed": true
      },
      {
        "id": 2,
        "text": "Compare selector keys with current Pod labels.",
        "completed": true
      },
      {
        "id": 3,
        "text": "Confirm EndpointSlices contain ready Pod IPs.",
        "completed": true
      },
      {
        "id": 4,
        "text": "Fix source manifests rather than only live objects.",
        "completed": true
      }
    ],
    "relatedResources": [
      {
        "id": 49,
        "title": "Kubernetes Field Cheatsheet"
      },
      {
        "id": 50,
        "title": "Kubernetes Production Runbook"
      },
      {
        "id": 51,
        "title": "Kubernetes Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 2,
    "slug": "debug-crashloop-imagepull",
    "title": "Separate CrashLoopBackOff from ImagePullBackOff",
    "track": "kubectl",
    "level": "Fresher",
    "duration": 35,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "in-progress",
    "scenario": "A rollout produced failing Pods, and you need to determine whether the image cannot pull or the app crashes after start.",
    "skills": [
      "describe",
      "previous logs",
      "events",
      "image pull secrets",
      "exit codes"
    ],
    "validationCommands": [
      "bash labs/platform-academy/debug-crashloop-imagepull/validate.sh",
      "bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --evidence /tmp/crashloop-imagepull-evidence.md",
      "bash labs/platform-academy/run-lab.sh validate debug-crashloop-imagepull --cluster",
      "python3 labs/platform-academy/debug-crashloop-imagepull/failure_mode_analyzer.py --start labs/platform-academy/debug-crashloop-imagepull/start.yaml --fixed labs/platform-academy/debug-crashloop-imagepull/fixed.yaml --transcript labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt",
      "kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/fixed.yaml"
    ],
    "expectedEvidence": [
      "The triage notes show restarting Pods and increasing resources are not supported by the evidence.",
      "The checkout-crash Pod reaches CrashLoopBackOff and has previous logs that say missing DB_URL.",
      "The checkout-pull Pod reaches ErrImagePull or ImagePullBackOff and has image pull events.",
      "Previous logs are useful for CrashLoopBackOff but not for a container that never pulled.",
      "The local analyzer reports CrashLoop/ImagePull analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Identify the exact Pod phase and event reason.",
        "completed": true
      },
      {
        "id": 2,
        "text": "Use previous logs only for containers that started and crashed.",
        "completed": true
      },
      {
        "id": 3,
        "text": "Inspect image reference and pull secret for registry failures.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Choose config fix, image fix, or rollback based on evidence.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 65,
        "title": "kubectl Field Cheatsheet"
      },
      {
        "id": 66,
        "title": "kubectl Production Runbook"
      },
      {
        "id": 67,
        "title": "kubectl Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 3,
    "slug": "review-yaml-before-apply",
    "title": "Review Kubernetes YAML before apply",
    "track": "Cloud Native",
    "level": "Fresher",
    "duration": 30,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "strong-evidence",
    "scenario": "A vendor manifest needs review before it reaches any cluster.",
    "skills": [
      "manifest reading",
      "dry-run",
      "resource scope",
      "security search",
      "namespace review"
    ],
    "validationCommands": [
      "bash labs/platform-academy/review-yaml-before-apply/validate.sh",
      "bash labs/platform-academy/review-yaml-before-apply/validate.sh --evidence /tmp/yaml-review-evidence.md",
      "python3 labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py --vendor labs/platform-academy/review-yaml-before-apply/vendor.yaml --safe labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml",
      "grep -n \"ClusterRole\\|privileged\\|hostPath\\|stringData\" labs/platform-academy/review-yaml-before-apply/vendor.yaml",
      "grep -n \"allowPrivilegeEscalation\\|readOnlyRootFilesystem\" labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml"
    ],
    "expectedEvidence": [
      "The triage notes rule out dry-run-only approval, namespace-only isolation, sandbox-first apply, and harmless-placeholder assumptions.",
      "The vendor manifest contains a ClusterRole that can list/watch secrets.",
      "The Deployment asks for privileged mode and a hostPath mount.",
      "The Secret contains placeholder stringData that should not be committed with real credentials.",
      "The local analyzer reports YAML manifest risk analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "List every resource kind and namespace.",
        "completed": true
      },
      {
        "id": 2,
        "text": "Find cluster-scoped permissions and risky Pod settings.",
        "completed": true
      },
      {
        "id": 3,
        "text": "Run client dry-run or schema validation.",
        "completed": true
      },
      {
        "id": 4,
        "text": "Record questions before approving the manifest.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 81,
        "title": "Cloud Native Field Cheatsheet"
      },
      {
        "id": 82,
        "title": "Cloud Native Production Runbook"
      },
      {
        "id": 83,
        "title": "Cloud Native Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 4,
    "slug": "diagnose-eks-ip-exhaustion",
    "title": "Diagnose EKS Pod IP exhaustion",
    "track": "EKS",
    "level": "Intermediate",
    "duration": 45,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "New Pods remain Pending during scale-out and events mention CNI allocation failures.",
    "skills": [
      "VPC CNI",
      "subnet sizing",
      "aws-node logs",
      "scheduler events",
      "prefix delegation"
    ],
    "validationCommands": [
      "bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh",
      "bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh --evidence /tmp/eks-ip-exhaustion-evidence.md",
      "python3 labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py --snapshot labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
      "grep -n \"not an application restart problem\" labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out app restarts, CPU/memory tuning, blind node scaling, and unreviewed live CIDR/CNI changes.",
      "Events include FailedCreatePodSandBox with failed IP assignment.",
      "One subnet has only seven available IPv4 addresses.",
      "Nodes are near maxPods and prefix delegation is disabled.",
      "The local analyzer reports EKS IP exhaustion analysis passed.",
      "The remediation plan separates app, platform, network, and release ownership."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Separate CPU/memory scheduling failure from CNI IP allocation failure.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Read aws-node logs for allocation errors.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Compare subnet capacity with expected Pod growth.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Decide whether to add capacity, enable prefix delegation, or redesign CIDRs.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 97,
        "title": "EKS Field Cheatsheet"
      },
      {
        "id": 98,
        "title": "EKS Production Runbook"
      },
      {
        "id": 99,
        "title": "EKS Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 5,
    "slug": "validate-helm-release-artifact",
    "title": "Validate a Helm release artifact",
    "track": "Helm",
    "level": "Intermediate",
    "duration": 40,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "A chart renders successfully but may change immutable selectors or create unsafe resources.",
    "skills": [
      "helm lint",
      "helm template",
      "helm diff",
      "dry-run",
      "selector review"
    ],
    "validationCommands": [
      "bash labs/platform-academy/validate-helm-release-artifact/validate.sh",
      "bash labs/platform-academy/validate-helm-release-artifact/validate.sh --evidence /tmp/helm-release-evidence.md",
      "python3 labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py --before labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml --after labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml --safe labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml --notes labs/platform-academy/validate-helm-release-artifact/review-notes.md",
      "grep -n \"app: checkout\" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml",
      "grep -n \"privileged: true\" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml"
    ],
    "expectedEvidence": [
      "The triage notes rule out render-success approval, diff-only approval, mutable-tag promotion, apply-then-fix rollback, and unapproved LoadBalancer exposure.",
      "The Deployment selector changes between rendered versions.",
      "The image changes from digest-pinned to the mutable latest tag.",
      "The rendered output introduces privileged mode and a LoadBalancer.",
      "The local analyzer reports Helm release artifact analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Render the exact production values stack.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Compare selectors and labels with the previous release.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Validate rendered YAML before mutation.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Document rollback limitations.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 161,
        "title": "Helm Field Cheatsheet"
      },
      {
        "id": 162,
        "title": "Helm Production Runbook"
      },
      {
        "id": 163,
        "title": "Helm Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 6,
    "slug": "trace-argocd-drift",
    "title": "Trace an ArgoCD drift report",
    "track": "ArgoCD",
    "level": "Intermediate",
    "duration": 35,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "ArgoCD reports OutOfSync because a controller modified a live field.",
    "skills": [
      "argocd diff",
      "ignoreDifferences",
      "controller ownership",
      "self-heal",
      "Git source of truth"
    ],
    "validationCommands": [
      "bash labs/platform-academy/trace-argocd-drift/validate.sh",
      "bash labs/platform-academy/trace-argocd-drift/validate.sh --evidence /tmp/argocd-drift-evidence.md",
      "python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py --desired labs/platform-academy/trace-argocd-drift/desired.yaml --live labs/platform-academy/trace-argocd-drift/live.yaml --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt",
      "grep -n \"replicas: 9\" labs/platform-academy/trace-argocd-drift/live.yaml",
      "grep -n \"spec.replicas\" labs/platform-academy/trace-argocd-drift/ownership-decision.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out force-sync, global self-heal disablement, whole-Deployment ignore, and assuming all OutOfSync status is human drift.",
      "The ArgoCD app report marks checkout OutOfSync and selfHeal enabled.",
      "Git wants three replicas while live state has nine.",
      "The live object carries autoscaling metadata.",
      "The ownership decision should mention a narrow replicas-only ignore rule.",
      "The analyzer confirms the ignore rule is scoped to checkout in payments and only /spec/replicas."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Identify the exact field causing drift.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Decide whether Git or a live controller should own the field.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Scope ignoreDifferences narrowly if ignoring is correct.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Document the ownership decision near the Application manifest.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 177,
        "title": "ArgoCD Field Cheatsheet"
      },
      {
        "id": 178,
        "title": "ArgoCD Production Runbook"
      },
      {
        "id": 179,
        "title": "ArgoCD Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 7,
    "slug": "design-production-eks-review",
    "title": "Run a production EKS architecture review",
    "track": "EKS Architecture",
    "level": "Advanced",
    "duration": 55,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "You need to review whether a proposed EKS platform is resilient and cost-aware before launch.",
    "skills": [
      "multi-AZ",
      "storage scope",
      "cost labels",
      "Karpenter constraints",
      "upgrade readiness"
    ],
    "validationCommands": [
      "bash labs/platform-academy/design-production-eks-review/validate.sh",
      "bash labs/platform-academy/design-production-eks-review/validate.sh --evidence /tmp/production-eks-review-evidence.md",
      "python3 labs/platform-academy/design-production-eks-review/production_review_analyzer.py --review labs/platform-academy/design-production-eks-review/cluster-review.md --launch labs/platform-academy/design-production-eks-review/launch-review.md",
      "grep -n \"Block production launch\" labs/platform-academy/design-production-eks-review/launch-review.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out endpoint-only approval, missing-PDB deferral, snapshot-only recovery proof, and deferred cost labels.",
      "One worker has a missing PDB.",
      "Postgres uses zonal storage with snapshot restore expectations.",
      "One apps node lacks a cost label.",
      "The local analyzer reports Production EKS review analysis passed.",
      "The launch review blocks production until reliability, cost, and upgrade gaps are owned."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Confirm critical replicas spread across zones.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Identify zonal storage and recovery expectations.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Review cost labels, idle requests, load balancers, and NAT traffic.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Use the local analyzer to verify launch blockers, owners, and validation criteria.",
        "completed": false
      }
    ],
    "relatedResources": []
  },
  {
    "id": 8,
    "slug": "audit-tenant-boundaries",
    "title": "Audit Kubernetes tenant boundaries",
    "track": "Security",
    "level": "Advanced",
    "duration": 50,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "A shared cluster needs a tenant access review before onboarding another team.",
    "skills": [
      "RBAC",
      "can-i",
      "network policy",
      "pod security",
      "secret access"
    ],
    "validationCommands": [
      "bash labs/platform-academy/audit-tenant-boundaries/validate.sh",
      "bash labs/platform-academy/audit-tenant-boundaries/validate.sh --evidence /tmp/tenant-boundaries-evidence.md",
      "bash labs/platform-academy/run-lab.sh validate audit-tenant-boundaries --cluster",
      "bash labs/platform-academy/audit-tenant-boundaries/validate.sh --cluster",
      "python3 labs/platform-academy/audit-tenant-boundaries/tenant_boundary_analyzer.py --broken labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml --fixed labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml --review labs/platform-academy/audit-tenant-boundaries/review.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out temporary admin, secret debugging, policy-object presence, and dry-run approval shortcuts.",
      "A temporary ClusterRoleBinding grants cluster-admin.",
      "The Role can list and watch secrets.",
      "The NetworkPolicy allows all egress.",
      "The local analyzer reports Tenant boundary analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Test representative user and service account permissions.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Find cluster-admin and wildcard bindings.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Confirm default-deny or documented network boundaries.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Review secret access and exception ownership.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 209,
        "title": "Security Field Cheatsheet"
      },
      {
        "id": 210,
        "title": "Security Production Runbook"
      },
      {
        "id": 211,
        "title": "Security Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 9,
    "slug": "write-slo-backed-runbook",
    "title": "Write an SLO-backed Kubernetes runbook",
    "track": "SRE",
    "level": "Advanced",
    "duration": 50,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "Checkout latency is burning the monthly SLO and on-call needs a fast, low-noise response path.",
    "skills": [
      "SLI selection",
      "burn-rate alerting",
      "dashboard design",
      "incident mitigation",
      "post-incident action"
    ],
    "validationCommands": [
      "bash labs/platform-academy/write-slo-backed-runbook/validate.sh",
      "bash labs/platform-academy/write-slo-backed-runbook/validate.sh --evidence /tmp/slo-runbook-evidence.md",
      "python3 labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py --signals labs/platform-academy/write-slo-backed-runbook/signals.md --rule labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml --runbook labs/platform-academy/write-slo-backed-runbook/completed-runbook.md --decision labs/platform-academy/write-slo-backed-runbook/incident-decision.md",
      "grep -n \"Collect read-only evidence first\" labs/platform-academy/write-slo-backed-runbook/incident-decision.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out rollback-first response, revision-correlation proof, threshold-only evidence, and ownerless follow-up.",
      "The alert pages on a checkout 5xx ratio over 2%.",
      "The signals connect rollout revision 43 with readiness flapping.",
      "The runbook template separates evidence, mitigation, and follow-up.",
      "The local analyzer reports SLO runbook analysis passed.",
      "The completed runbook ties rollback criteria to revision 43 and post-mitigation validation."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Name the user-visible SLI and SLO window.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Separate symptom page from diagnostic cause panels.",
        "completed": false
      },
      {
        "id": 3,
        "text": "List safe read-only commands first.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Add mitigation choices and escalation criteria.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 225,
        "title": "SRE Field Cheatsheet"
      },
      {
        "id": 226,
        "title": "SRE Production Runbook"
      },
      {
        "id": 227,
        "title": "SRE Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 10,
    "slug": "inspect-linux-failure-evidence",
    "title": "Inspect Linux failure evidence",
    "track": "Linux",
    "level": "Fresher",
    "duration": 35,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "submitted",
    "scenario": "A container exits repeatedly and you need to decide whether it is an app crash, permission issue, or resource kill.",
    "skills": [
      "processes",
      "exit codes",
      "logs",
      "permissions",
      "evidence notes"
    ],
    "validationCommands": [
      "bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh",
      "bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh --evidence /tmp/linux-failure-evidence.md",
      "python3 labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py --describe labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt --previous-log labs/platform-academy/inspect-linux-failure-evidence/previous.log --id-output labs/platform-academy/inspect-linux-failure-evidence/id-output.txt --remediation labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md",
      "grep -n \"Running as root: hides the permission bug\" labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out memory pressure, restart-count-only diagnosis, running as root, and live chmod fixes.",
      "The previous container exited with code 126.",
      "Previous logs show Permission denied.",
      "The process runs as uid 10001.",
      "The remediation note rejects memory tuning and root runtime as first fixes.",
      "The local analyzer reports Linux failure evidence analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Capture Last State and exit code.",
        "completed": true
      },
      {
        "id": 2,
        "text": "Compare logs with process and permission assumptions.",
        "completed": true
      },
      {
        "id": 3,
        "text": "Separate OOMKilled, permission denied, and application exception symptoms.",
        "completed": true
      },
      {
        "id": 4,
        "text": "Write the next safest diagnostic command before proposing a fix.",
        "completed": true
      }
    ],
    "relatedResources": [
      {
        "id": 1,
        "title": "Linux Field Cheatsheet"
      },
      {
        "id": 2,
        "title": "Linux Production Runbook"
      },
      {
        "id": 3,
        "title": "Linux Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 11,
    "slug": "trace-network-path",
    "title": "Trace an HTTP request across the network path",
    "track": "Networking",
    "level": "Fresher",
    "duration": 40,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "Users see intermittent 503 responses and you need to locate whether the error starts at DNS, ALB, Ingress, Service, or Pod readiness.",
    "skills": [
      "DNS",
      "HTTP status",
      "TLS",
      "Ingress",
      "Service endpoints"
    ],
    "validationCommands": [
      "bash labs/platform-academy/trace-network-path/validate.sh",
      "bash labs/platform-academy/trace-network-path/validate.sh --evidence /tmp/network-path-evidence.md",
      "python3 labs/platform-academy/trace-network-path/network_path_analyzer.py --handoff labs/platform-academy/trace-network-path/incident-handoff.md --evidence labs/platform-academy/trace-network-path/network-evidence.md --broken labs/platform-academy/trace-network-path/ingress-service.yaml --fixed labs/platform-academy/trace-network-path/fixed-ingress-service.yaml",
      "bash labs/platform-academy/run-lab.sh validate trace-network-path --cluster",
      "bash labs/platform-academy/trace-network-path/validate.sh --cluster"
    ],
    "expectedEvidence": [
      "The incident handoff names the checkout health path impact and safety boundary.",
      "The hop trace records DNS, ALB, Ingress, Service, and Pod owner notes.",
      "The client receives a 503 from awselb.",
      "One target is unhealthy with response code mismatch.",
      "The Service targetPort is web while the Pod port is named http.",
      "The local analyzer reports Network path analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Resolve the hostname and confirm the expected endpoint.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Identify which hop emits the HTTP status code.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Compare Service endpoints with Pod readiness.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Document whether the next owner is DNS, ingress, app, or platform networking.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 17,
        "title": "Networking Field Cheatsheet"
      },
      {
        "id": 18,
        "title": "Networking Production Runbook"
      },
      {
        "id": 19,
        "title": "Networking Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 12,
    "slug": "review-terraform-eks-plan",
    "title": "Review a Terraform EKS plan",
    "track": "Terraform",
    "level": "Intermediate",
    "duration": 50,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "A Terraform plan changes node groups, security groups, and IAM roles before a production EKS upgrade.",
    "skills": [
      "terraform plan",
      "state",
      "replacement risk",
      "IAM diff",
      "cost review"
    ],
    "validationCommands": [
      "bash labs/platform-academy/review-terraform-eks-plan/validate.sh",
      "bash labs/platform-academy/review-terraform-eks-plan/validate.sh --evidence /tmp/terraform-eks-plan-evidence.md",
      "python3 labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py --plan labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
      "grep -n \"must be replaced\" labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
      "grep -n \"0.0.0.0/0\\|eks:\\*\" labs/platform-academy/review-terraform-eks-plan/tfplan.txt"
    ],
    "expectedEvidence": [
      "The triage notes rule out saved-plan approval, low-risk replacement assumptions, one-subnet coverage, public HTTPS ingress, and broad EKS IAM.",
      "The node group replacement loses multi-AZ subnet coverage.",
      "A public 0.0.0.0/0 security group rule is added.",
      "An IAM policy grants eks:* on all resources.",
      "The analyzer reports a do-not-approve decision with blocking risk signals."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Find create, update, replace, and destroy actions.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Call out IAM and security group blast radius.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Identify validation and rollback steps.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Estimate cost impact before approval.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 113,
        "title": "Terraform Field Cheatsheet"
      },
      {
        "id": 114,
        "title": "Terraform Production Runbook"
      },
      {
        "id": 115,
        "title": "Terraform Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 13,
    "slug": "debug-irsa-access-denied",
    "title": "Debug IRSA AccessDenied for a Pod",
    "track": "AWS IAM",
    "level": "Intermediate",
    "duration": 45,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "A workload can start but AWS SDK calls fail with AccessDenied after a service-account change.",
    "skills": [
      "IRSA",
      "service accounts",
      "trust policy",
      "CloudTrail",
      "STS"
    ],
    "validationCommands": [
      "bash labs/platform-academy/debug-irsa-access-denied/validate.sh",
      "bash labs/platform-academy/debug-irsa-access-denied/validate.sh --evidence /tmp/irsa-access-denied-evidence.md",
      "python3 labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py --serviceaccount labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml --trust-policy labs/platform-academy/debug-irsa-access-denied/trust-policy.json --fixed-trust-policy labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json --cloudtrail-event labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json --permission-policy labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json",
      "grep -n \"namespace: payments\" labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml",
      "grep -n \"system:serviceaccount:default:checkout\" labs/platform-academy/debug-irsa-access-denied/trust-policy.json"
    ],
    "expectedEvidence": [
      "The triage notes rule out restarts, token rotation, bucket-policy-only changes, wildcard trust, and broad S3 permissions.",
      "The ServiceAccount is payments/checkout.",
      "The workload log shows AWS_ROLE_ARN for payments-checkout-readonly and an SDK AccessDenied on PutObject.",
      "The trust policy subject allows default/checkout instead.",
      "CloudTrail denies s3:PutObject through the readonly role.",
      "The simulator proves the fixed trust subject and least-privilege policy allow the captured request without broad S3 scope."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Match service account annotation or Pod Identity association to the expected role.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Review trust policy subject, audience, and OIDC provider.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Confirm the denied action and resource in CloudTrail or SDK output.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Decide whether the fix belongs in Kubernetes, IAM trust, or IAM permissions.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 129,
        "title": "AWS IAM Field Cheatsheet"
      },
      {
        "id": 130,
        "title": "AWS IAM Production Runbook"
      },
      {
        "id": 131,
        "title": "AWS IAM Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 14,
    "slug": "design-safe-release-pipeline",
    "title": "Design a safe Kubernetes release pipeline",
    "track": "CI/CD",
    "level": "Advanced",
    "duration": 55,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "A team wants push-to-prod for a Kubernetes service, and you need to add the minimum gates that protect users without blocking every release.",
    "skills": [
      "quality gates",
      "artifact promotion",
      "smoke tests",
      "canary",
      "rollback"
    ],
    "validationCommands": [
      "bash labs/platform-academy/design-safe-release-pipeline/validate.sh",
      "bash labs/platform-academy/design-safe-release-pipeline/validate.sh --evidence /tmp/release-pipeline-evidence.md",
      "python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py --unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml --safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml --checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md --decision labs/platform-academy/design-safe-release-pipeline/decision-record.md",
      "grep -n \"environment: production\" labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml"
    ],
    "expectedEvidence": [
      "The triage notes rule out green-build-only approval, SHA-tag-only promotion, late scans, approval without artifacts, and rollback without digest.",
      "The sample pipeline deploys from main directly to production.",
      "The build step does not promote by digest.",
      "The checklist requires scan, smoke, rollback, and approval gates.",
      "The local analyzer reports Safe release pipeline analysis passed.",
      "The safe pipeline adds staging, manifest validation, policy checks, canary, and rollback criteria."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Define build, test, render, scan, deploy, smoke, and SLO gates.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Promote immutable image digests rather than rebuilding per environment.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Name automatic rollback criteria and manual approval points.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Threat-model who can deploy and where secrets live.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 193,
        "title": "CI/CD Field Cheatsheet"
      },
      {
        "id": 194,
        "title": "CI/CD Production Runbook"
      },
      {
        "id": 195,
        "title": "CI/CD Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 15,
    "slug": "create-platform-golden-path",
    "title": "Create a service golden path",
    "track": "Platform Engineering",
    "level": "Advanced",
    "duration": 60,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "Your platform team needs a self-service path for launching a new service with CI, Terraform, Helm, ArgoCD, dashboards, and runbooks.",
    "skills": [
      "golden path",
      "service template",
      "production readiness",
      "developer experience",
      "platform metrics"
    ],
    "validationCommands": [
      "bash labs/platform-academy/create-platform-golden-path/validate.sh",
      "bash labs/platform-academy/create-platform-golden-path/validate.sh --evidence /tmp/golden-path-evidence.md",
      "python3 labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py --start-template labs/platform-academy/create-platform-golden-path/service-template.md --ready-template labs/platform-academy/create-platform-golden-path/ready-service-template.md --catalog labs/platform-academy/create-platform-golden-path/catalog-info.yaml --fixed-catalog labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml --decision labs/platform-academy/create-platform-golden-path/decision-record.md",
      "grep -n \"Adoption Metrics\" labs/platform-academy/create-platform-golden-path/ready-service-template.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out generated-files readiness, catalog-only ownership, smooth-first-run confidence, and optional metadata.",
      "The template generates Dockerfile, Helm, CI, ArgoCD, dashboard, runbook, and catalog files.",
      "The catalog file still has missing PagerDuty and SLO annotations.",
      "The first-run flow ends with production readiness review.",
      "The local analyzer reports Golden path readiness analysis passed.",
      "The ready template defines inputs, secure defaults, launch gates, and adoption metrics."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Define required inputs and generated artifacts.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Include observability, ownership, security, and rollback defaults.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Document the first-run developer experience.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Pick adoption and reliability metrics to review after launch.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 289,
        "title": "Platform Engineering Field Cheatsheet"
      },
      {
        "id": 290,
        "title": "Platform Engineering Production Runbook"
      },
      {
        "id": 291,
        "title": "Platform Engineering Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 16,
    "slug": "review-docker-image-supply-chain",
    "title": "Review a Docker image supply chain",
    "track": "Docker",
    "level": "Fresher",
    "duration": 45,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "A team wants to promote an image tagged `latest` to production, and you need to prove which artifact will actually run.",
    "skills": [
      "Dockerfile review",
      "multi-stage builds",
      "image digests",
      "registry promotion",
      "SBOM review"
    ],
    "validationCommands": [
      "bash labs/platform-academy/review-docker-image-supply-chain/validate.sh",
      "bash labs/platform-academy/review-docker-image-supply-chain/validate.sh --evidence /tmp/docker-supply-chain-evidence.md",
      "python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py --dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile --inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json --history labs/platform-academy/review-docker-image-supply-chain/history.txt --hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile --promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md",
      "grep -n \"Immutable image digest\" labs/platform-academy/review-docker-image-supply-chain/promotion-note.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out latest-tag freshness, deleted-secret-layer confidence, runtime-only non-root controls, post-promotion scans, and rollback tags without digest.",
      "The image uses the mutable latest tag and has no RepoDigests.",
      "No runtime user is configured.",
      "API_TOKEN appears in Dockerfile, inspect metadata, and history.",
      "The local analyzer reports Docker supply-chain analysis passed.",
      "The promotion note requires digest, SBOM, scan, non-root runtime, and rollback evidence."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Identify base image, runtime user, entrypoint, exposed port, and copied files.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Compare tag-based release notes with immutable digest evidence.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Check whether build-only tools or secrets reached the runtime image.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Write a promotion note with digest, scan status, SBOM location, and rollback image.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 33,
        "title": "Docker Field Cheatsheet"
      },
      {
        "id": 34,
        "title": "Docker Production Runbook"
      },
      {
        "id": 35,
        "title": "Docker Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 17,
    "slug": "debug-aws-alb-health-path",
    "title": "Debug an AWS ALB health path",
    "track": "AWS Operations",
    "level": "Intermediate",
    "duration": 50,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "An ALB target group turns unhealthy after a Kubernetes deployment and users see intermittent 503 responses.",
    "skills": [
      "CloudWatch",
      "ALB target health",
      "Route 53",
      "security groups",
      "EndpointSlices"
    ],
    "validationCommands": [
      "bash labs/platform-academy/debug-aws-alb-health-path/validate.sh",
      "bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --evidence /tmp/alb-health-path-evidence.md",
      "python3 labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py --target-health labs/platform-academy/debug-aws-alb-health-path/target-health.json --events labs/platform-academy/debug-aws-alb-health-path/events.txt --broken labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml --fixed labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml",
      "bash labs/platform-academy/run-lab.sh validate debug-aws-alb-health-path --cluster",
      "bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --cluster"
    ],
    "expectedEvidence": [
      "The triage notes rule out DNS, security group, Pod recreation, and console-only ALB changes as first fixes.",
      "One target is unhealthy with Target.ResponseCodeMismatch.",
      "Ingress healthcheck path is /healthz.",
      "Service targetPort web does not match the Pod port named http.",
      "The local analyzer reports ALB health path analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Confirm which target group and health path are failing.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Compare ALB target health with Kubernetes readiness and EndpointSlices.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Check security group and subnet assumptions before changing application code.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Write the owner and next action for AWS networking, ingress controller, or app team.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 145,
        "title": "AWS Operations Field Cheatsheet"
      },
      {
        "id": 146,
        "title": "AWS Operations Production Runbook"
      },
      {
        "id": 147,
        "title": "AWS Operations Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 18,
    "slug": "design-opentelemetry-signal-path",
    "title": "Design an OpenTelemetry signal path",
    "track": "Observability",
    "level": "Advanced",
    "duration": 55,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "Checkout latency is hard to debug because metrics, logs, and traces disagree and no one owns the telemetry path.",
    "skills": [
      "OpenTelemetry",
      "context propagation",
      "sampling",
      "Prometheus rules",
      "telemetry cost"
    ],
    "validationCommands": [
      "bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh",
      "bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence /tmp/otel-signal-path-evidence.md",
      "python3 labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py --collector labs/platform-academy/design-opentelemetry-signal-path/collector.yaml --logs labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt --rule labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml --safe-rule labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml --decision labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md",
      "grep -n \"Owner Map\" labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out header-deletion-only confidence, one-good-trace confidence, customer-level grouping, and simulator-only proof.",
      "Collector drops authorization headers.",
      "One log line has trace_id=missing.",
      "The latency alert groups by customer_email, creating high cardinality risk.",
      "The safe rule removes customer_email and the decision record assigns signal owners.",
      "The local analyzer reports OpenTelemetry signal path analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Map the user symptom to metric, log, trace, and Kubernetes event evidence.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Check service names, route labels, trace IDs in logs, and sampling policy.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Flag high-cardinality labels and sensitive attributes.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Use the local analyzer to verify the signal path, safer alert, and owner map.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 241,
        "title": "Observability Field Cheatsheet"
      },
      {
        "id": 242,
        "title": "Observability Production Runbook"
      },
      {
        "id": 243,
        "title": "Observability Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 19,
    "slug": "run-incident-commander-tabletop",
    "title": "Run an incident commander tabletop",
    "track": "Incident Response",
    "level": "Advanced",
    "duration": 60,
    "portfolioGrade": true,
    "runtime": "cluster",
    "tier": "portfolio",
    "status": "submitted",
    "scenario": "A canary release causes elevated checkout errors and the team needs coordinated mitigation, communication, and timeline discipline.",
    "skills": [
      "incident command",
      "severity",
      "stakeholder communication",
      "timeline",
      "mitigation"
    ],
    "validationCommands": [
      "bash labs/platform-academy/run-incident-commander-tabletop/validate.sh",
      "bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence /tmp/incident-commander-evidence.md",
      "python3 labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py --signals labs/platform-academy/run-incident-commander-tabletop/signals.md --roles labs/platform-academy/run-incident-commander-tabletop/roles.md --timeline labs/platform-academy/run-incident-commander-tabletop/timeline.md --brief labs/platform-academy/run-incident-commander-tabletop/commander-brief.md --completed-timeline labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md",
      "grep -n \"Rollback revision 43\" labs/platform-academy/run-incident-commander-tabletop/commander-brief.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out waiting for root cause, delaying communications, rollback without criteria, and late timeline writing.",
      "The incident is SEV-2 with checkout 5xx impact.",
      "Rollback to revision 42 is identified as an option.",
      "The tabletop requires commander, operations, communications, and planning roles.",
      "The commander brief sets mitigation criteria and a 15-minute stakeholder update.",
      "The local analyzer reports Incident commander tabletop analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Assign incident commander, operations, communications, and planning roles.",
        "completed": true
      },
      {
        "id": 2,
        "text": "Write impact, severity, current mitigation, and next update time.",
        "completed": true
      },
      {
        "id": 3,
        "text": "Record timeline entries for alerts, deploys, commands, decisions, and handoff.",
        "completed": true
      },
      {
        "id": 4,
        "text": "Use the local analyzer to verify severity, roles, mitigation, updates, and timeline handoff.",
        "completed": true
      }
    ],
    "relatedResources": [
      {
        "id": 257,
        "title": "Incident Response Field Cheatsheet"
      },
      {
        "id": 258,
        "title": "Incident Response Production Runbook"
      },
      {
        "id": 259,
        "title": "Incident Response Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 20,
    "slug": "audit-eks-cost-drivers",
    "title": "Audit EKS cost drivers",
    "track": "FinOps",
    "level": "Advanced",
    "duration": 60,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "Cloud spend jumped after a platform migration, and you need to separate real growth from Kubernetes and AWS waste.",
    "skills": [
      "FinOps",
      "Kubernetes requests",
      "EKS cost drivers",
      "NAT costs",
      "telemetry spend"
    ],
    "validationCommands": [
      "bash labs/platform-academy/audit-eks-cost-drivers/validate.sh",
      "bash labs/platform-academy/audit-eks-cost-drivers/validate.sh --evidence /tmp/eks-cost-evidence.md",
      "python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py --usage labs/platform-academy/audit-eks-cost-drivers/usage.csv --services labs/platform-academy/audit-eks-cost-drivers/services.txt --storage labs/platform-academy/audit-eks-cost-drivers/storage.txt --recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md",
      "grep -n \"Expected Savings\" labs/platform-academy/audit-eks-cost-drivers/recommendations.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out utilization-only deletion, unknown-owner deletion, age-only cleanup, and savings without rollback.",
      "Checkout and worker CPU requests are far above usage.",
      "Default namespace has abandoned load balancer and storage entries.",
      "Some resources have unknown owner metadata.",
      "The local analyzer reports EKS cost driver analysis passed and quick-win monthly exposure.",
      "The recommendation table includes savings, reliability risk, and rollback."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Rank compute, storage, load balancer, NAT, data transfer, and telemetry hypotheses.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Compare requested resources with actual usage and restart/OOM evidence.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Map each recommendation to an owner, expected savings, reliability risk, and rollback.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Decide which savings are quick wins and which require architecture changes.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 273,
        "title": "FinOps Field Cheatsheet"
      },
      {
        "id": 274,
        "title": "FinOps Production Runbook"
      },
      {
        "id": 275,
        "title": "FinOps Evidence Lab Worksheet"
      }
    ]
  },
  {
    "id": 21,
    "slug": "build-platform-career-proof-pack",
    "title": "Build a platform career artifact pack",
    "track": "Career",
    "level": "Advanced",
    "duration": 75,
    "portfolioGrade": true,
    "runtime": "file-only",
    "tier": "portfolio",
    "status": "not-started",
    "scenario": "You need interview-ready artifacts that show your platform skills are practical, current, and credible.",
    "skills": [
      "portfolio",
      "resume bullets",
      "STAR stories",
      "job description analysis",
      "mock interview prep"
    ],
    "validationCommands": [
      "bash labs/platform-academy/build-platform-career-proof-pack/validate.sh",
      "bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence /tmp/career-proof-evidence.md",
      "python3 labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py --skills labs/platform-academy/build-platform-career-proof-pack/job-skills.txt --inventory labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md --proof labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md --bullets labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md --star labs/platform-academy/build-platform-career-proof-pack/star-stories.md",
      "grep -n \"Release Safety\" labs/platform-academy/build-platform-career-proof-pack/star-stories.md"
    ],
    "expectedEvidence": [
      "The triage notes rule out lab-count claims, duty-only bullets, weak STAR stories, context-free screenshots, and unredacted claims.",
      "Target roles repeatedly mention Kubernetes, AWS, Terraform, CI/CD, observability, SRE, and security.",
      "The evidence inventory names five candidate artifacts and missing evidence to collect.",
      "The README template forces problem, commands, validation, rollback, and STAR talking points.",
      "The completed artifact pack includes a README artifact section, resume bullets, and STAR stories.",
      "The local analyzer reports Career artifact pack analysis passed."
    ],
    "checklist": [
      {
        "id": 1,
        "text": "Choose five target job descriptions and extract repeated skill demands.",
        "completed": false
      },
      {
        "id": 2,
        "text": "Turn one lab into a README artifact section with commands, evidence, tradeoffs, and rollback.",
        "completed": false
      },
      {
        "id": 3,
        "text": "Write resume bullets for implementation, operations, and business impact.",
        "completed": false
      },
      {
        "id": 4,
        "text": "Use the local analyzer to verify that every career claim is backed by artifacts, commands, validation, and public-safe notes.",
        "completed": false
      }
    ],
    "relatedResources": [
      {
        "id": 305,
        "title": "Career Field Cheatsheet"
      },
      {
        "id": 306,
        "title": "Career Production Runbook"
      },
      {
        "id": 307,
        "title": "Career Evidence Lab Worksheet"
      }
    ]
  }
];

export const resources: Resource[] = [
  {
    "id": 1,
    "slug": "linux-cheatsheet",
    "title": "Linux Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 20,
    "summary": "A compact operator map for Linux: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Linux",
      "cheatsheet",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 2,
    "slug": "linux-runbook",
    "title": "Linux Production Runbook",
    "type": "runbook",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 35,
    "summary": "An incident-ready procedure for Linux with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Linux",
      "runbook",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 3,
    "slug": "linux-lab-worksheet",
    "title": "Linux Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Linux with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Linux",
      "lab worksheet",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 4,
    "slug": "linux-project-brief",
    "title": "Linux Portfolio Project Brief",
    "type": "project-brief",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 60,
    "summary": "A scoped portfolio project for Linux with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Linux",
      "project brief",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 5,
    "slug": "linux-interview-prep",
    "title": "Linux Interview Drill Packet",
    "type": "interview-prep",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Linux: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Linux",
      "interview prep",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 6,
    "slug": "linux-official-reference",
    "title": "Linux Official Reading Path",
    "type": "official-reference",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 25,
    "summary": "A curated official-source reading path for Linux, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Linux",
      "official reference",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 7,
    "slug": "linux-architecture-diagram",
    "title": "Linux Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 40,
    "summary": "A diagram brief for Linux that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Linux",
      "architecture diagram",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 8,
    "slug": "linux-template",
    "title": "Linux Operating Template",
    "type": "template",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 30,
    "summary": "A reusable template for Linux reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Linux",
      "template",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 9,
    "slug": "linux-assessment",
    "title": "Linux Practical Assessment",
    "type": "assessment",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 35,
    "summary": "A graded practical assessment for Linux covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Linux",
      "assessment",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 10,
    "slug": "linux-troubleshooting-guide",
    "title": "Linux Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 40,
    "summary": "A troubleshooting map for Linux that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Linux",
      "troubleshooting guide",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 11,
    "slug": "linux-decision-record",
    "title": "Linux Architecture Decision Record",
    "type": "decision-record",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Linux: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Linux",
      "decision record",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 12,
    "slug": "linux-production-readiness-checklist",
    "title": "Linux Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 45,
    "summary": "A launch checklist for Linux covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Linux",
      "production readiness checklist",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 13,
    "slug": "linux-failure-mode-drill",
    "title": "Linux Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 50,
    "summary": "A guided failure drill for Linux with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Linux",
      "failure mode drill",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 14,
    "slug": "linux-security-review",
    "title": "Linux Security Review Workbook",
    "type": "security-review",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 50,
    "summary": "A security workbook for Linux covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Linux",
      "security review",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 15,
    "slug": "linux-cost-review",
    "title": "Linux Cost and Capacity Review",
    "type": "cost-review",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 45,
    "summary": "A cost review for Linux connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Linux",
      "cost review",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 16,
    "slug": "linux-portfolio-artifact",
    "title": "Linux Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Fresher",
    "domain": "Linux",
    "duration": 55,
    "summary": "A portfolio builder for Linux that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Linux",
      "portfolio artifact",
      "local-safe",
      "inspect-linux-failure-evidence"
    ]
  },
  {
    "id": 17,
    "slug": "networking-cheatsheet",
    "title": "Networking Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 20,
    "summary": "A compact operator map for Networking: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Networking",
      "cheatsheet",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 18,
    "slug": "networking-runbook",
    "title": "Networking Production Runbook",
    "type": "runbook",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 35,
    "summary": "An incident-ready procedure for Networking with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Networking",
      "runbook",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 19,
    "slug": "networking-lab-worksheet",
    "title": "Networking Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Networking with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Networking",
      "lab worksheet",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 20,
    "slug": "networking-project-brief",
    "title": "Networking Portfolio Project Brief",
    "type": "project-brief",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 60,
    "summary": "A scoped portfolio project for Networking with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Networking",
      "project brief",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 21,
    "slug": "networking-interview-prep",
    "title": "Networking Interview Drill Packet",
    "type": "interview-prep",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Networking: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Networking",
      "interview prep",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 22,
    "slug": "networking-official-reference",
    "title": "Networking Official Reading Path",
    "type": "official-reference",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 25,
    "summary": "A curated official-source reading path for Networking, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Networking",
      "official reference",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 23,
    "slug": "networking-architecture-diagram",
    "title": "Networking Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 40,
    "summary": "A diagram brief for Networking that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Networking",
      "architecture diagram",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 24,
    "slug": "networking-template",
    "title": "Networking Operating Template",
    "type": "template",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 30,
    "summary": "A reusable template for Networking reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Networking",
      "template",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 25,
    "slug": "networking-assessment",
    "title": "Networking Practical Assessment",
    "type": "assessment",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 35,
    "summary": "A graded practical assessment for Networking covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Networking",
      "assessment",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 26,
    "slug": "networking-troubleshooting-guide",
    "title": "Networking Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 40,
    "summary": "A troubleshooting map for Networking that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Networking",
      "troubleshooting guide",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 27,
    "slug": "networking-decision-record",
    "title": "Networking Architecture Decision Record",
    "type": "decision-record",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Networking: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Networking",
      "decision record",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 28,
    "slug": "networking-production-readiness-checklist",
    "title": "Networking Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 45,
    "summary": "A launch checklist for Networking covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Networking",
      "production readiness checklist",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 29,
    "slug": "networking-failure-mode-drill",
    "title": "Networking Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 50,
    "summary": "A guided failure drill for Networking with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Networking",
      "failure mode drill",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 30,
    "slug": "networking-security-review",
    "title": "Networking Security Review Workbook",
    "type": "security-review",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 50,
    "summary": "A security workbook for Networking covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Networking",
      "security review",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 31,
    "slug": "networking-cost-review",
    "title": "Networking Cost and Capacity Review",
    "type": "cost-review",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 45,
    "summary": "A cost review for Networking connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Networking",
      "cost review",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 32,
    "slug": "networking-portfolio-artifact",
    "title": "Networking Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Fresher",
    "domain": "Networking",
    "duration": 55,
    "summary": "A portfolio builder for Networking that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Networking",
      "portfolio artifact",
      "local-safe",
      "trace-network-path"
    ]
  },
  {
    "id": 33,
    "slug": "docker-cheatsheet",
    "title": "Docker Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 20,
    "summary": "A compact operator map for Docker: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Docker",
      "cheatsheet",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 34,
    "slug": "docker-runbook",
    "title": "Docker Production Runbook",
    "type": "runbook",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 35,
    "summary": "An incident-ready procedure for Docker with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Docker",
      "runbook",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 35,
    "slug": "docker-lab-worksheet",
    "title": "Docker Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Docker with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Docker",
      "lab worksheet",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 36,
    "slug": "docker-project-brief",
    "title": "Docker Portfolio Project Brief",
    "type": "project-brief",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 60,
    "summary": "A scoped portfolio project for Docker with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Docker",
      "project brief",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 37,
    "slug": "docker-interview-prep",
    "title": "Docker Interview Drill Packet",
    "type": "interview-prep",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Docker: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Docker",
      "interview prep",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 38,
    "slug": "docker-official-reference",
    "title": "Docker Official Reading Path",
    "type": "official-reference",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 25,
    "summary": "A curated official-source reading path for Docker, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Docker",
      "official reference",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 39,
    "slug": "docker-architecture-diagram",
    "title": "Docker Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 40,
    "summary": "A diagram brief for Docker that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Docker",
      "architecture diagram",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 40,
    "slug": "docker-template",
    "title": "Docker Operating Template",
    "type": "template",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 30,
    "summary": "A reusable template for Docker reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Docker",
      "template",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 41,
    "slug": "docker-assessment",
    "title": "Docker Practical Assessment",
    "type": "assessment",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 35,
    "summary": "A graded practical assessment for Docker covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Docker",
      "assessment",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 42,
    "slug": "docker-troubleshooting-guide",
    "title": "Docker Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 40,
    "summary": "A troubleshooting map for Docker that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Docker",
      "troubleshooting guide",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 43,
    "slug": "docker-decision-record",
    "title": "Docker Architecture Decision Record",
    "type": "decision-record",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Docker: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Docker",
      "decision record",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 44,
    "slug": "docker-production-readiness-checklist",
    "title": "Docker Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 45,
    "summary": "A launch checklist for Docker covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Docker",
      "production readiness checklist",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 45,
    "slug": "docker-failure-mode-drill",
    "title": "Docker Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 50,
    "summary": "A guided failure drill for Docker with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Docker",
      "failure mode drill",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 46,
    "slug": "docker-security-review",
    "title": "Docker Security Review Workbook",
    "type": "security-review",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 50,
    "summary": "A security workbook for Docker covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Docker",
      "security review",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 47,
    "slug": "docker-cost-review",
    "title": "Docker Cost and Capacity Review",
    "type": "cost-review",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 45,
    "summary": "A cost review for Docker connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Docker",
      "cost review",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 48,
    "slug": "docker-portfolio-artifact",
    "title": "Docker Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Fresher",
    "domain": "Docker",
    "duration": 55,
    "summary": "A portfolio builder for Docker that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Docker",
      "portfolio artifact",
      "local-safe",
      "review-docker-image-supply-chain"
    ]
  },
  {
    "id": 49,
    "slug": "kubernetes-cheatsheet",
    "title": "Kubernetes Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 20,
    "summary": "A compact operator map for Kubernetes: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Kubernetes",
      "cheatsheet",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 50,
    "slug": "kubernetes-runbook",
    "title": "Kubernetes Production Runbook",
    "type": "runbook",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 35,
    "summary": "An incident-ready procedure for Kubernetes with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Kubernetes",
      "runbook",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 51,
    "slug": "kubernetes-lab-worksheet",
    "title": "Kubernetes Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Kubernetes with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Kubernetes",
      "lab worksheet",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 52,
    "slug": "kubernetes-project-brief",
    "title": "Kubernetes Portfolio Project Brief",
    "type": "project-brief",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 60,
    "summary": "A scoped portfolio project for Kubernetes with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Kubernetes",
      "project brief",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 53,
    "slug": "kubernetes-interview-prep",
    "title": "Kubernetes Interview Drill Packet",
    "type": "interview-prep",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Kubernetes: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Kubernetes",
      "interview prep",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 54,
    "slug": "kubernetes-official-reference",
    "title": "Kubernetes Official Reading Path",
    "type": "official-reference",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 25,
    "summary": "A curated official-source reading path for Kubernetes, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Kubernetes",
      "official reference",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 55,
    "slug": "kubernetes-architecture-diagram",
    "title": "Kubernetes Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 40,
    "summary": "A diagram brief for Kubernetes that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Kubernetes",
      "architecture diagram",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 56,
    "slug": "kubernetes-template",
    "title": "Kubernetes Operating Template",
    "type": "template",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 30,
    "summary": "A reusable template for Kubernetes reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Kubernetes",
      "template",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 57,
    "slug": "kubernetes-assessment",
    "title": "Kubernetes Practical Assessment",
    "type": "assessment",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 35,
    "summary": "A graded practical assessment for Kubernetes covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Kubernetes",
      "assessment",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 58,
    "slug": "kubernetes-troubleshooting-guide",
    "title": "Kubernetes Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 40,
    "summary": "A troubleshooting map for Kubernetes that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Kubernetes",
      "troubleshooting guide",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 59,
    "slug": "kubernetes-decision-record",
    "title": "Kubernetes Architecture Decision Record",
    "type": "decision-record",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Kubernetes: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Kubernetes",
      "decision record",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 60,
    "slug": "kubernetes-production-readiness-checklist",
    "title": "Kubernetes Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 45,
    "summary": "A launch checklist for Kubernetes covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Kubernetes",
      "production readiness checklist",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 61,
    "slug": "kubernetes-failure-mode-drill",
    "title": "Kubernetes Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 50,
    "summary": "A guided failure drill for Kubernetes with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Kubernetes",
      "failure mode drill",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 62,
    "slug": "kubernetes-security-review",
    "title": "Kubernetes Security Review Workbook",
    "type": "security-review",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 50,
    "summary": "A security workbook for Kubernetes covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Kubernetes",
      "security review",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 63,
    "slug": "kubernetes-cost-review",
    "title": "Kubernetes Cost and Capacity Review",
    "type": "cost-review",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 45,
    "summary": "A cost review for Kubernetes connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Kubernetes",
      "cost review",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 64,
    "slug": "kubernetes-portfolio-artifact",
    "title": "Kubernetes Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Fresher",
    "domain": "Kubernetes",
    "duration": 55,
    "summary": "A portfolio builder for Kubernetes that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Kubernetes",
      "portfolio artifact",
      "local-safe",
      "trace-service-to-pod"
    ]
  },
  {
    "id": 65,
    "slug": "kubectl-cheatsheet",
    "title": "kubectl Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 20,
    "summary": "A compact operator map for kubectl: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "kubectl",
      "cheatsheet",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 66,
    "slug": "kubectl-runbook",
    "title": "kubectl Production Runbook",
    "type": "runbook",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 35,
    "summary": "An incident-ready procedure for kubectl with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "kubectl",
      "runbook",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 67,
    "slug": "kubectl-lab-worksheet",
    "title": "kubectl Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing kubectl with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "kubectl",
      "lab worksheet",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 68,
    "slug": "kubectl-project-brief",
    "title": "kubectl Portfolio Project Brief",
    "type": "project-brief",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 60,
    "summary": "A scoped portfolio project for kubectl with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "kubectl",
      "project brief",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 69,
    "slug": "kubectl-interview-prep",
    "title": "kubectl Interview Drill Packet",
    "type": "interview-prep",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 30,
    "summary": "A scenario-driven interview pack for kubectl: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "kubectl",
      "interview prep",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 70,
    "slug": "kubectl-official-reference",
    "title": "kubectl Official Reading Path",
    "type": "official-reference",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 25,
    "summary": "A curated official-source reading path for kubectl, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "kubectl",
      "official reference",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 71,
    "slug": "kubectl-architecture-diagram",
    "title": "kubectl Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 40,
    "summary": "A diagram brief for kubectl that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "kubectl",
      "architecture diagram",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 72,
    "slug": "kubectl-template",
    "title": "kubectl Operating Template",
    "type": "template",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 30,
    "summary": "A reusable template for kubectl reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "kubectl",
      "template",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 73,
    "slug": "kubectl-assessment",
    "title": "kubectl Practical Assessment",
    "type": "assessment",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 35,
    "summary": "A graded practical assessment for kubectl covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "kubectl",
      "assessment",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 74,
    "slug": "kubectl-troubleshooting-guide",
    "title": "kubectl Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 40,
    "summary": "A troubleshooting map for kubectl that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "kubectl",
      "troubleshooting guide",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 75,
    "slug": "kubectl-decision-record",
    "title": "kubectl Architecture Decision Record",
    "type": "decision-record",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 35,
    "summary": "An ADR-style decision exercise for kubectl: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "kubectl",
      "decision record",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 76,
    "slug": "kubectl-production-readiness-checklist",
    "title": "kubectl Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 45,
    "summary": "A launch checklist for kubectl covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "kubectl",
      "production readiness checklist",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 77,
    "slug": "kubectl-failure-mode-drill",
    "title": "kubectl Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 50,
    "summary": "A guided failure drill for kubectl with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "kubectl",
      "failure mode drill",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 78,
    "slug": "kubectl-security-review",
    "title": "kubectl Security Review Workbook",
    "type": "security-review",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 50,
    "summary": "A security workbook for kubectl covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "kubectl",
      "security review",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 79,
    "slug": "kubectl-cost-review",
    "title": "kubectl Cost and Capacity Review",
    "type": "cost-review",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 45,
    "summary": "A cost review for kubectl connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "kubectl",
      "cost review",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 80,
    "slug": "kubectl-portfolio-artifact",
    "title": "kubectl Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Fresher",
    "domain": "kubectl",
    "duration": 55,
    "summary": "A portfolio builder for kubectl that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "kubectl",
      "portfolio artifact",
      "local-safe",
      "debug-crashloop-imagepull"
    ]
  },
  {
    "id": 81,
    "slug": "cloud-native-cheatsheet",
    "title": "Cloud Native Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 20,
    "summary": "A compact operator map for Cloud Native: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Cloud Native",
      "cheatsheet",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 82,
    "slug": "cloud-native-runbook",
    "title": "Cloud Native Production Runbook",
    "type": "runbook",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 35,
    "summary": "An incident-ready procedure for Cloud Native with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Cloud Native",
      "runbook",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 83,
    "slug": "cloud-native-lab-worksheet",
    "title": "Cloud Native Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Cloud Native with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Cloud Native",
      "lab worksheet",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 84,
    "slug": "cloud-native-project-brief",
    "title": "Cloud Native Portfolio Project Brief",
    "type": "project-brief",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 60,
    "summary": "A scoped portfolio project for Cloud Native with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Cloud Native",
      "project brief",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 85,
    "slug": "cloud-native-interview-prep",
    "title": "Cloud Native Interview Drill Packet",
    "type": "interview-prep",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Cloud Native: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Cloud Native",
      "interview prep",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 86,
    "slug": "cloud-native-official-reference",
    "title": "Cloud Native Official Reading Path",
    "type": "official-reference",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 25,
    "summary": "A curated official-source reading path for Cloud Native, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Cloud Native",
      "official reference",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 87,
    "slug": "cloud-native-architecture-diagram",
    "title": "Cloud Native Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 40,
    "summary": "A diagram brief for Cloud Native that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Cloud Native",
      "architecture diagram",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 88,
    "slug": "cloud-native-template",
    "title": "Cloud Native Operating Template",
    "type": "template",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 30,
    "summary": "A reusable template for Cloud Native reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Cloud Native",
      "template",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 89,
    "slug": "cloud-native-assessment",
    "title": "Cloud Native Practical Assessment",
    "type": "assessment",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 35,
    "summary": "A graded practical assessment for Cloud Native covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Cloud Native",
      "assessment",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 90,
    "slug": "cloud-native-troubleshooting-guide",
    "title": "Cloud Native Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 40,
    "summary": "A troubleshooting map for Cloud Native that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Cloud Native",
      "troubleshooting guide",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 91,
    "slug": "cloud-native-decision-record",
    "title": "Cloud Native Architecture Decision Record",
    "type": "decision-record",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Cloud Native: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Cloud Native",
      "decision record",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 92,
    "slug": "cloud-native-production-readiness-checklist",
    "title": "Cloud Native Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 45,
    "summary": "A launch checklist for Cloud Native covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Cloud Native",
      "production readiness checklist",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 93,
    "slug": "cloud-native-failure-mode-drill",
    "title": "Cloud Native Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 50,
    "summary": "A guided failure drill for Cloud Native with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Cloud Native",
      "failure mode drill",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 94,
    "slug": "cloud-native-security-review",
    "title": "Cloud Native Security Review Workbook",
    "type": "security-review",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 50,
    "summary": "A security workbook for Cloud Native covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Cloud Native",
      "security review",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 95,
    "slug": "cloud-native-cost-review",
    "title": "Cloud Native Cost and Capacity Review",
    "type": "cost-review",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 45,
    "summary": "A cost review for Cloud Native connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Cloud Native",
      "cost review",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 96,
    "slug": "cloud-native-portfolio-artifact",
    "title": "Cloud Native Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Fresher",
    "domain": "Cloud Native",
    "duration": 55,
    "summary": "A portfolio builder for Cloud Native that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Cloud Native",
      "portfolio artifact",
      "local-safe",
      "review-yaml-before-apply"
    ]
  },
  {
    "id": 97,
    "slug": "eks-cheatsheet",
    "title": "EKS Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 20,
    "summary": "A compact operator map for EKS: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "EKS",
      "cheatsheet",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 98,
    "slug": "eks-runbook",
    "title": "EKS Production Runbook",
    "type": "runbook",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 35,
    "summary": "An incident-ready procedure for EKS with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "EKS",
      "runbook",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 99,
    "slug": "eks-lab-worksheet",
    "title": "EKS Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing EKS with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "EKS",
      "lab worksheet",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 100,
    "slug": "eks-project-brief",
    "title": "EKS Portfolio Project Brief",
    "type": "project-brief",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 60,
    "summary": "A scoped portfolio project for EKS with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "EKS",
      "project brief",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 101,
    "slug": "eks-interview-prep",
    "title": "EKS Interview Drill Packet",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 30,
    "summary": "A scenario-driven interview pack for EKS: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "EKS",
      "interview prep",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 102,
    "slug": "eks-official-reference",
    "title": "EKS Official Reading Path",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 25,
    "summary": "A curated official-source reading path for EKS, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "EKS",
      "official reference",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 103,
    "slug": "eks-architecture-diagram",
    "title": "EKS Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 40,
    "summary": "A diagram brief for EKS that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "EKS",
      "architecture diagram",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 104,
    "slug": "eks-template",
    "title": "EKS Operating Template",
    "type": "template",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 30,
    "summary": "A reusable template for EKS reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "EKS",
      "template",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 105,
    "slug": "eks-assessment",
    "title": "EKS Practical Assessment",
    "type": "assessment",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 35,
    "summary": "A graded practical assessment for EKS covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "EKS",
      "assessment",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 106,
    "slug": "eks-troubleshooting-guide",
    "title": "EKS Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 40,
    "summary": "A troubleshooting map for EKS that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "EKS",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 107,
    "slug": "eks-decision-record",
    "title": "EKS Architecture Decision Record",
    "type": "decision-record",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 35,
    "summary": "An ADR-style decision exercise for EKS: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "EKS",
      "decision record",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 108,
    "slug": "eks-production-readiness-checklist",
    "title": "EKS Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 45,
    "summary": "A launch checklist for EKS covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "EKS",
      "production readiness checklist",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 109,
    "slug": "eks-failure-mode-drill",
    "title": "EKS Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 50,
    "summary": "A guided failure drill for EKS with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "EKS",
      "failure mode drill",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 110,
    "slug": "eks-security-review",
    "title": "EKS Security Review Workbook",
    "type": "security-review",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 50,
    "summary": "A security workbook for EKS covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "EKS",
      "security review",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 111,
    "slug": "eks-cost-review",
    "title": "EKS Cost and Capacity Review",
    "type": "cost-review",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 45,
    "summary": "A cost review for EKS connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "EKS",
      "cost review",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 112,
    "slug": "eks-portfolio-artifact",
    "title": "EKS Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Intermediate",
    "domain": "EKS",
    "duration": 55,
    "summary": "A portfolio builder for EKS that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "EKS",
      "portfolio artifact",
      "read-only / sandbox-first",
      "diagnose-eks-ip-exhaustion"
    ]
  },
  {
    "id": 113,
    "slug": "terraform-cheatsheet",
    "title": "Terraform Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 20,
    "summary": "A compact operator map for Terraform: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Terraform",
      "cheatsheet",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 114,
    "slug": "terraform-runbook",
    "title": "Terraform Production Runbook",
    "type": "runbook",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 35,
    "summary": "An incident-ready procedure for Terraform with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Terraform",
      "runbook",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 115,
    "slug": "terraform-lab-worksheet",
    "title": "Terraform Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Terraform with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Terraform",
      "lab worksheet",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 116,
    "slug": "terraform-project-brief",
    "title": "Terraform Portfolio Project Brief",
    "type": "project-brief",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 60,
    "summary": "A scoped portfolio project for Terraform with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Terraform",
      "project brief",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 117,
    "slug": "terraform-interview-prep",
    "title": "Terraform Interview Drill Packet",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Terraform: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Terraform",
      "interview prep",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 118,
    "slug": "terraform-official-reference",
    "title": "Terraform Official Reading Path",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 25,
    "summary": "A curated official-source reading path for Terraform, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Terraform",
      "official reference",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 119,
    "slug": "terraform-architecture-diagram",
    "title": "Terraform Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 40,
    "summary": "A diagram brief for Terraform that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Terraform",
      "architecture diagram",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 120,
    "slug": "terraform-template",
    "title": "Terraform Operating Template",
    "type": "template",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 30,
    "summary": "A reusable template for Terraform reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Terraform",
      "template",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 121,
    "slug": "terraform-assessment",
    "title": "Terraform Practical Assessment",
    "type": "assessment",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 35,
    "summary": "A graded practical assessment for Terraform covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Terraform",
      "assessment",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 122,
    "slug": "terraform-troubleshooting-guide",
    "title": "Terraform Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 40,
    "summary": "A troubleshooting map for Terraform that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Terraform",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 123,
    "slug": "terraform-decision-record",
    "title": "Terraform Architecture Decision Record",
    "type": "decision-record",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Terraform: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Terraform",
      "decision record",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 124,
    "slug": "terraform-production-readiness-checklist",
    "title": "Terraform Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 45,
    "summary": "A launch checklist for Terraform covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Terraform",
      "production readiness checklist",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 125,
    "slug": "terraform-failure-mode-drill",
    "title": "Terraform Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 50,
    "summary": "A guided failure drill for Terraform with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Terraform",
      "failure mode drill",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 126,
    "slug": "terraform-security-review",
    "title": "Terraform Security Review Workbook",
    "type": "security-review",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 50,
    "summary": "A security workbook for Terraform covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Terraform",
      "security review",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 127,
    "slug": "terraform-cost-review",
    "title": "Terraform Cost and Capacity Review",
    "type": "cost-review",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 45,
    "summary": "A cost review for Terraform connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Terraform",
      "cost review",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 128,
    "slug": "terraform-portfolio-artifact",
    "title": "Terraform Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Intermediate",
    "domain": "Terraform",
    "duration": 55,
    "summary": "A portfolio builder for Terraform that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Terraform",
      "portfolio artifact",
      "read-only / sandbox-first",
      "review-terraform-eks-plan"
    ]
  },
  {
    "id": 129,
    "slug": "aws-iam-cheatsheet",
    "title": "AWS IAM Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 20,
    "summary": "A compact operator map for AWS IAM: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "AWS IAM",
      "cheatsheet",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 130,
    "slug": "aws-iam-runbook",
    "title": "AWS IAM Production Runbook",
    "type": "runbook",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 35,
    "summary": "An incident-ready procedure for AWS IAM with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "AWS IAM",
      "runbook",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 131,
    "slug": "aws-iam-lab-worksheet",
    "title": "AWS IAM Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing AWS IAM with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "AWS IAM",
      "lab worksheet",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 132,
    "slug": "aws-iam-project-brief",
    "title": "AWS IAM Portfolio Project Brief",
    "type": "project-brief",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 60,
    "summary": "A scoped portfolio project for AWS IAM with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "AWS IAM",
      "project brief",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 133,
    "slug": "aws-iam-interview-prep",
    "title": "AWS IAM Interview Drill Packet",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 30,
    "summary": "A scenario-driven interview pack for AWS IAM: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "AWS IAM",
      "interview prep",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 134,
    "slug": "aws-iam-official-reference",
    "title": "AWS IAM Official Reading Path",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 25,
    "summary": "A curated official-source reading path for AWS IAM, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "AWS IAM",
      "official reference",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 135,
    "slug": "aws-iam-architecture-diagram",
    "title": "AWS IAM Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 40,
    "summary": "A diagram brief for AWS IAM that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "AWS IAM",
      "architecture diagram",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 136,
    "slug": "aws-iam-template",
    "title": "AWS IAM Operating Template",
    "type": "template",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 30,
    "summary": "A reusable template for AWS IAM reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "AWS IAM",
      "template",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 137,
    "slug": "aws-iam-assessment",
    "title": "AWS IAM Practical Assessment",
    "type": "assessment",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 35,
    "summary": "A graded practical assessment for AWS IAM covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "AWS IAM",
      "assessment",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 138,
    "slug": "aws-iam-troubleshooting-guide",
    "title": "AWS IAM Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 40,
    "summary": "A troubleshooting map for AWS IAM that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "AWS IAM",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 139,
    "slug": "aws-iam-decision-record",
    "title": "AWS IAM Architecture Decision Record",
    "type": "decision-record",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 35,
    "summary": "An ADR-style decision exercise for AWS IAM: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "AWS IAM",
      "decision record",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 140,
    "slug": "aws-iam-production-readiness-checklist",
    "title": "AWS IAM Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 45,
    "summary": "A launch checklist for AWS IAM covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "AWS IAM",
      "production readiness checklist",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 141,
    "slug": "aws-iam-failure-mode-drill",
    "title": "AWS IAM Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 50,
    "summary": "A guided failure drill for AWS IAM with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "AWS IAM",
      "failure mode drill",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 142,
    "slug": "aws-iam-security-review",
    "title": "AWS IAM Security Review Workbook",
    "type": "security-review",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 50,
    "summary": "A security workbook for AWS IAM covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "AWS IAM",
      "security review",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 143,
    "slug": "aws-iam-cost-review",
    "title": "AWS IAM Cost and Capacity Review",
    "type": "cost-review",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 45,
    "summary": "A cost review for AWS IAM connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "AWS IAM",
      "cost review",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 144,
    "slug": "aws-iam-portfolio-artifact",
    "title": "AWS IAM Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Intermediate",
    "domain": "AWS IAM",
    "duration": 55,
    "summary": "A portfolio builder for AWS IAM that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "AWS IAM",
      "portfolio artifact",
      "read-only / sandbox-first",
      "debug-irsa-access-denied"
    ]
  },
  {
    "id": 145,
    "slug": "aws-operations-cheatsheet",
    "title": "AWS Operations Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 20,
    "summary": "A compact operator map for AWS Operations: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "AWS Operations",
      "cheatsheet",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 146,
    "slug": "aws-operations-runbook",
    "title": "AWS Operations Production Runbook",
    "type": "runbook",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 35,
    "summary": "An incident-ready procedure for AWS Operations with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "AWS Operations",
      "runbook",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 147,
    "slug": "aws-operations-lab-worksheet",
    "title": "AWS Operations Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing AWS Operations with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "AWS Operations",
      "lab worksheet",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 148,
    "slug": "aws-operations-project-brief",
    "title": "AWS Operations Portfolio Project Brief",
    "type": "project-brief",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 60,
    "summary": "A scoped portfolio project for AWS Operations with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "AWS Operations",
      "project brief",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 149,
    "slug": "aws-operations-interview-prep",
    "title": "AWS Operations Interview Drill Packet",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 30,
    "summary": "A scenario-driven interview pack for AWS Operations: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "AWS Operations",
      "interview prep",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 150,
    "slug": "aws-operations-official-reference",
    "title": "AWS Operations Official Reading Path",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 25,
    "summary": "A curated official-source reading path for AWS Operations, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "AWS Operations",
      "official reference",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 151,
    "slug": "aws-operations-architecture-diagram",
    "title": "AWS Operations Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 40,
    "summary": "A diagram brief for AWS Operations that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "AWS Operations",
      "architecture diagram",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 152,
    "slug": "aws-operations-template",
    "title": "AWS Operations Operating Template",
    "type": "template",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 30,
    "summary": "A reusable template for AWS Operations reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "AWS Operations",
      "template",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 153,
    "slug": "aws-operations-assessment",
    "title": "AWS Operations Practical Assessment",
    "type": "assessment",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 35,
    "summary": "A graded practical assessment for AWS Operations covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "AWS Operations",
      "assessment",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 154,
    "slug": "aws-operations-troubleshooting-guide",
    "title": "AWS Operations Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 40,
    "summary": "A troubleshooting map for AWS Operations that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "AWS Operations",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 155,
    "slug": "aws-operations-decision-record",
    "title": "AWS Operations Architecture Decision Record",
    "type": "decision-record",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 35,
    "summary": "An ADR-style decision exercise for AWS Operations: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "AWS Operations",
      "decision record",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 156,
    "slug": "aws-operations-production-readiness-checklist",
    "title": "AWS Operations Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 45,
    "summary": "A launch checklist for AWS Operations covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "AWS Operations",
      "production readiness checklist",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 157,
    "slug": "aws-operations-failure-mode-drill",
    "title": "AWS Operations Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 50,
    "summary": "A guided failure drill for AWS Operations with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "AWS Operations",
      "failure mode drill",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 158,
    "slug": "aws-operations-security-review",
    "title": "AWS Operations Security Review Workbook",
    "type": "security-review",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 50,
    "summary": "A security workbook for AWS Operations covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "AWS Operations",
      "security review",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 159,
    "slug": "aws-operations-cost-review",
    "title": "AWS Operations Cost and Capacity Review",
    "type": "cost-review",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 45,
    "summary": "A cost review for AWS Operations connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "AWS Operations",
      "cost review",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 160,
    "slug": "aws-operations-portfolio-artifact",
    "title": "AWS Operations Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Intermediate",
    "domain": "AWS Operations",
    "duration": 55,
    "summary": "A portfolio builder for AWS Operations that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "AWS Operations",
      "portfolio artifact",
      "read-only / sandbox-first",
      "debug-aws-alb-health-path"
    ]
  },
  {
    "id": 161,
    "slug": "helm-cheatsheet",
    "title": "Helm Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 20,
    "summary": "A compact operator map for Helm: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Helm",
      "cheatsheet",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 162,
    "slug": "helm-runbook",
    "title": "Helm Production Runbook",
    "type": "runbook",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 35,
    "summary": "An incident-ready procedure for Helm with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Helm",
      "runbook",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 163,
    "slug": "helm-lab-worksheet",
    "title": "Helm Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Helm with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Helm",
      "lab worksheet",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 164,
    "slug": "helm-project-brief",
    "title": "Helm Portfolio Project Brief",
    "type": "project-brief",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 60,
    "summary": "A scoped portfolio project for Helm with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Helm",
      "project brief",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 165,
    "slug": "helm-interview-prep",
    "title": "Helm Interview Drill Packet",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Helm: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Helm",
      "interview prep",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 166,
    "slug": "helm-official-reference",
    "title": "Helm Official Reading Path",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 25,
    "summary": "A curated official-source reading path for Helm, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Helm",
      "official reference",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 167,
    "slug": "helm-architecture-diagram",
    "title": "Helm Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 40,
    "summary": "A diagram brief for Helm that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Helm",
      "architecture diagram",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 168,
    "slug": "helm-template",
    "title": "Helm Operating Template",
    "type": "template",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 30,
    "summary": "A reusable template for Helm reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Helm",
      "template",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 169,
    "slug": "helm-assessment",
    "title": "Helm Practical Assessment",
    "type": "assessment",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 35,
    "summary": "A graded practical assessment for Helm covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Helm",
      "assessment",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 170,
    "slug": "helm-troubleshooting-guide",
    "title": "Helm Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 40,
    "summary": "A troubleshooting map for Helm that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Helm",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 171,
    "slug": "helm-decision-record",
    "title": "Helm Architecture Decision Record",
    "type": "decision-record",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Helm: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Helm",
      "decision record",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 172,
    "slug": "helm-production-readiness-checklist",
    "title": "Helm Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 45,
    "summary": "A launch checklist for Helm covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Helm",
      "production readiness checklist",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 173,
    "slug": "helm-failure-mode-drill",
    "title": "Helm Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 50,
    "summary": "A guided failure drill for Helm with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Helm",
      "failure mode drill",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 174,
    "slug": "helm-security-review",
    "title": "Helm Security Review Workbook",
    "type": "security-review",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 50,
    "summary": "A security workbook for Helm covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Helm",
      "security review",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 175,
    "slug": "helm-cost-review",
    "title": "Helm Cost and Capacity Review",
    "type": "cost-review",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 45,
    "summary": "A cost review for Helm connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Helm",
      "cost review",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 176,
    "slug": "helm-portfolio-artifact",
    "title": "Helm Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 55,
    "summary": "A portfolio builder for Helm that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Helm",
      "portfolio artifact",
      "read-only / sandbox-first",
      "validate-helm-release-artifact"
    ]
  },
  {
    "id": 177,
    "slug": "argocd-cheatsheet",
    "title": "ArgoCD Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 20,
    "summary": "A compact operator map for ArgoCD: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "ArgoCD",
      "cheatsheet",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 178,
    "slug": "argocd-runbook",
    "title": "ArgoCD Production Runbook",
    "type": "runbook",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 35,
    "summary": "An incident-ready procedure for ArgoCD with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "ArgoCD",
      "runbook",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 179,
    "slug": "argocd-lab-worksheet",
    "title": "ArgoCD Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing ArgoCD with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "ArgoCD",
      "lab worksheet",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 180,
    "slug": "argocd-project-brief",
    "title": "ArgoCD Portfolio Project Brief",
    "type": "project-brief",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 60,
    "summary": "A scoped portfolio project for ArgoCD with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "ArgoCD",
      "project brief",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 181,
    "slug": "argocd-interview-prep",
    "title": "ArgoCD Interview Drill Packet",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 30,
    "summary": "A scenario-driven interview pack for ArgoCD: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "ArgoCD",
      "interview prep",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 182,
    "slug": "argocd-official-reference",
    "title": "ArgoCD Official Reading Path",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 25,
    "summary": "A curated official-source reading path for ArgoCD, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "ArgoCD",
      "official reference",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 183,
    "slug": "argocd-architecture-diagram",
    "title": "ArgoCD Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 40,
    "summary": "A diagram brief for ArgoCD that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "ArgoCD",
      "architecture diagram",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 184,
    "slug": "argocd-template",
    "title": "ArgoCD Operating Template",
    "type": "template",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 30,
    "summary": "A reusable template for ArgoCD reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "ArgoCD",
      "template",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 185,
    "slug": "argocd-assessment",
    "title": "ArgoCD Practical Assessment",
    "type": "assessment",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 35,
    "summary": "A graded practical assessment for ArgoCD covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "ArgoCD",
      "assessment",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 186,
    "slug": "argocd-troubleshooting-guide",
    "title": "ArgoCD Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 40,
    "summary": "A troubleshooting map for ArgoCD that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "ArgoCD",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 187,
    "slug": "argocd-decision-record",
    "title": "ArgoCD Architecture Decision Record",
    "type": "decision-record",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 35,
    "summary": "An ADR-style decision exercise for ArgoCD: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "ArgoCD",
      "decision record",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 188,
    "slug": "argocd-production-readiness-checklist",
    "title": "ArgoCD Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 45,
    "summary": "A launch checklist for ArgoCD covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "ArgoCD",
      "production readiness checklist",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 189,
    "slug": "argocd-failure-mode-drill",
    "title": "ArgoCD Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 50,
    "summary": "A guided failure drill for ArgoCD with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "ArgoCD",
      "failure mode drill",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 190,
    "slug": "argocd-security-review",
    "title": "ArgoCD Security Review Workbook",
    "type": "security-review",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 50,
    "summary": "A security workbook for ArgoCD covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "ArgoCD",
      "security review",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 191,
    "slug": "argocd-cost-review",
    "title": "ArgoCD Cost and Capacity Review",
    "type": "cost-review",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 45,
    "summary": "A cost review for ArgoCD connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "ArgoCD",
      "cost review",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 192,
    "slug": "argocd-portfolio-artifact",
    "title": "ArgoCD Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 55,
    "summary": "A portfolio builder for ArgoCD that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "ArgoCD",
      "portfolio artifact",
      "read-only / sandbox-first",
      "trace-argocd-drift"
    ]
  },
  {
    "id": 193,
    "slug": "ci-cd-cheatsheet",
    "title": "CI/CD Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 20,
    "summary": "A compact operator map for CI/CD: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "CI/CD",
      "cheatsheet",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 194,
    "slug": "ci-cd-runbook",
    "title": "CI/CD Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 35,
    "summary": "An incident-ready procedure for CI/CD with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "CI/CD",
      "runbook",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 195,
    "slug": "ci-cd-lab-worksheet",
    "title": "CI/CD Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing CI/CD with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "CI/CD",
      "lab worksheet",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 196,
    "slug": "ci-cd-project-brief",
    "title": "CI/CD Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 60,
    "summary": "A scoped portfolio project for CI/CD with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "CI/CD",
      "project brief",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 197,
    "slug": "ci-cd-interview-prep",
    "title": "CI/CD Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 30,
    "summary": "A scenario-driven interview pack for CI/CD: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "CI/CD",
      "interview prep",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 198,
    "slug": "ci-cd-official-reference",
    "title": "CI/CD Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 25,
    "summary": "A curated official-source reading path for CI/CD, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "CI/CD",
      "official reference",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 199,
    "slug": "ci-cd-architecture-diagram",
    "title": "CI/CD Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 40,
    "summary": "A diagram brief for CI/CD that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "CI/CD",
      "architecture diagram",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 200,
    "slug": "ci-cd-template",
    "title": "CI/CD Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 30,
    "summary": "A reusable template for CI/CD reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "CI/CD",
      "template",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 201,
    "slug": "ci-cd-assessment",
    "title": "CI/CD Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 35,
    "summary": "A graded practical assessment for CI/CD covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "CI/CD",
      "assessment",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 202,
    "slug": "ci-cd-troubleshooting-guide",
    "title": "CI/CD Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 40,
    "summary": "A troubleshooting map for CI/CD that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "CI/CD",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 203,
    "slug": "ci-cd-decision-record",
    "title": "CI/CD Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 35,
    "summary": "An ADR-style decision exercise for CI/CD: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "CI/CD",
      "decision record",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 204,
    "slug": "ci-cd-production-readiness-checklist",
    "title": "CI/CD Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 45,
    "summary": "A launch checklist for CI/CD covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "CI/CD",
      "production readiness checklist",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 205,
    "slug": "ci-cd-failure-mode-drill",
    "title": "CI/CD Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 50,
    "summary": "A guided failure drill for CI/CD with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "CI/CD",
      "failure mode drill",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 206,
    "slug": "ci-cd-security-review",
    "title": "CI/CD Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 50,
    "summary": "A security workbook for CI/CD covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "CI/CD",
      "security review",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 207,
    "slug": "ci-cd-cost-review",
    "title": "CI/CD Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 45,
    "summary": "A cost review for CI/CD connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "CI/CD",
      "cost review",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 208,
    "slug": "ci-cd-portfolio-artifact",
    "title": "CI/CD Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "CI/CD",
    "duration": 55,
    "summary": "A portfolio builder for CI/CD that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "CI/CD",
      "portfolio artifact",
      "read-only / sandbox-first",
      "design-safe-release-pipeline"
    ]
  },
  {
    "id": 209,
    "slug": "security-cheatsheet",
    "title": "Security Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "Security",
    "duration": 20,
    "summary": "A compact operator map for Security: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Security",
      "cheatsheet",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 210,
    "slug": "security-runbook",
    "title": "Security Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "Security",
    "duration": 35,
    "summary": "An incident-ready procedure for Security with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Security",
      "runbook",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 211,
    "slug": "security-lab-worksheet",
    "title": "Security Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "Security",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Security with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Security",
      "lab worksheet",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 212,
    "slug": "security-project-brief",
    "title": "Security Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "Security",
    "duration": 60,
    "summary": "A scoped portfolio project for Security with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Security",
      "project brief",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 213,
    "slug": "security-interview-prep",
    "title": "Security Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "Security",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Security: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Security",
      "interview prep",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 214,
    "slug": "security-official-reference",
    "title": "Security Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "Security",
    "duration": 25,
    "summary": "A curated official-source reading path for Security, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Security",
      "official reference",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 215,
    "slug": "security-architecture-diagram",
    "title": "Security Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "Security",
    "duration": 40,
    "summary": "A diagram brief for Security that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Security",
      "architecture diagram",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 216,
    "slug": "security-template",
    "title": "Security Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "Security",
    "duration": 30,
    "summary": "A reusable template for Security reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Security",
      "template",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 217,
    "slug": "security-assessment",
    "title": "Security Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "Security",
    "duration": 35,
    "summary": "A graded practical assessment for Security covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Security",
      "assessment",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 218,
    "slug": "security-troubleshooting-guide",
    "title": "Security Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "Security",
    "duration": 40,
    "summary": "A troubleshooting map for Security that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Security",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 219,
    "slug": "security-decision-record",
    "title": "Security Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "Security",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Security: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Security",
      "decision record",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 220,
    "slug": "security-production-readiness-checklist",
    "title": "Security Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "Security",
    "duration": 45,
    "summary": "A launch checklist for Security covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Security",
      "production readiness checklist",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 221,
    "slug": "security-failure-mode-drill",
    "title": "Security Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "Security",
    "duration": 50,
    "summary": "A guided failure drill for Security with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Security",
      "failure mode drill",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 222,
    "slug": "security-security-review",
    "title": "Security Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "Security",
    "duration": 50,
    "summary": "A security workbook for Security covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Security",
      "security review",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 223,
    "slug": "security-cost-review",
    "title": "Security Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "Security",
    "duration": 45,
    "summary": "A cost review for Security connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Security",
      "cost review",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 224,
    "slug": "security-portfolio-artifact",
    "title": "Security Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "Security",
    "duration": 55,
    "summary": "A portfolio builder for Security that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Security",
      "portfolio artifact",
      "read-only / sandbox-first",
      "audit-tenant-boundaries"
    ]
  },
  {
    "id": 225,
    "slug": "sre-cheatsheet",
    "title": "SRE Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 20,
    "summary": "A compact operator map for SRE: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "SRE",
      "cheatsheet",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 226,
    "slug": "sre-runbook",
    "title": "SRE Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 35,
    "summary": "An incident-ready procedure for SRE with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "SRE",
      "runbook",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 227,
    "slug": "sre-lab-worksheet",
    "title": "SRE Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing SRE with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "SRE",
      "lab worksheet",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 228,
    "slug": "sre-project-brief",
    "title": "SRE Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 60,
    "summary": "A scoped portfolio project for SRE with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "SRE",
      "project brief",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 229,
    "slug": "sre-interview-prep",
    "title": "SRE Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 30,
    "summary": "A scenario-driven interview pack for SRE: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "SRE",
      "interview prep",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 230,
    "slug": "sre-official-reference",
    "title": "SRE Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 25,
    "summary": "A curated official-source reading path for SRE, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "SRE",
      "official reference",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 231,
    "slug": "sre-architecture-diagram",
    "title": "SRE Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 40,
    "summary": "A diagram brief for SRE that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "SRE",
      "architecture diagram",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 232,
    "slug": "sre-template",
    "title": "SRE Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 30,
    "summary": "A reusable template for SRE reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "SRE",
      "template",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 233,
    "slug": "sre-assessment",
    "title": "SRE Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 35,
    "summary": "A graded practical assessment for SRE covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "SRE",
      "assessment",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 234,
    "slug": "sre-troubleshooting-guide",
    "title": "SRE Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 40,
    "summary": "A troubleshooting map for SRE that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "SRE",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 235,
    "slug": "sre-decision-record",
    "title": "SRE Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 35,
    "summary": "An ADR-style decision exercise for SRE: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "SRE",
      "decision record",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 236,
    "slug": "sre-production-readiness-checklist",
    "title": "SRE Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 45,
    "summary": "A launch checklist for SRE covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "SRE",
      "production readiness checklist",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 237,
    "slug": "sre-failure-mode-drill",
    "title": "SRE Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 50,
    "summary": "A guided failure drill for SRE with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "SRE",
      "failure mode drill",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 238,
    "slug": "sre-security-review",
    "title": "SRE Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 50,
    "summary": "A security workbook for SRE covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "SRE",
      "security review",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 239,
    "slug": "sre-cost-review",
    "title": "SRE Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 45,
    "summary": "A cost review for SRE connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "SRE",
      "cost review",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 240,
    "slug": "sre-portfolio-artifact",
    "title": "SRE Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "SRE",
    "duration": 55,
    "summary": "A portfolio builder for SRE that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "SRE",
      "portfolio artifact",
      "read-only / sandbox-first",
      "write-slo-backed-runbook"
    ]
  },
  {
    "id": 241,
    "slug": "observability-cheatsheet",
    "title": "Observability Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 20,
    "summary": "A compact operator map for Observability: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Observability",
      "cheatsheet",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 242,
    "slug": "observability-runbook",
    "title": "Observability Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 35,
    "summary": "An incident-ready procedure for Observability with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Observability",
      "runbook",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 243,
    "slug": "observability-lab-worksheet",
    "title": "Observability Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Observability with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Observability",
      "lab worksheet",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 244,
    "slug": "observability-project-brief",
    "title": "Observability Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 60,
    "summary": "A scoped portfolio project for Observability with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Observability",
      "project brief",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 245,
    "slug": "observability-interview-prep",
    "title": "Observability Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Observability: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Observability",
      "interview prep",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 246,
    "slug": "observability-official-reference",
    "title": "Observability Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 25,
    "summary": "A curated official-source reading path for Observability, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Observability",
      "official reference",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 247,
    "slug": "observability-architecture-diagram",
    "title": "Observability Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 40,
    "summary": "A diagram brief for Observability that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Observability",
      "architecture diagram",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 248,
    "slug": "observability-template",
    "title": "Observability Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 30,
    "summary": "A reusable template for Observability reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Observability",
      "template",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 249,
    "slug": "observability-assessment",
    "title": "Observability Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 35,
    "summary": "A graded practical assessment for Observability covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Observability",
      "assessment",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 250,
    "slug": "observability-troubleshooting-guide",
    "title": "Observability Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 40,
    "summary": "A troubleshooting map for Observability that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Observability",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 251,
    "slug": "observability-decision-record",
    "title": "Observability Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Observability: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Observability",
      "decision record",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 252,
    "slug": "observability-production-readiness-checklist",
    "title": "Observability Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 45,
    "summary": "A launch checklist for Observability covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Observability",
      "production readiness checklist",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 253,
    "slug": "observability-failure-mode-drill",
    "title": "Observability Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 50,
    "summary": "A guided failure drill for Observability with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Observability",
      "failure mode drill",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 254,
    "slug": "observability-security-review",
    "title": "Observability Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 50,
    "summary": "A security workbook for Observability covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Observability",
      "security review",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 255,
    "slug": "observability-cost-review",
    "title": "Observability Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 45,
    "summary": "A cost review for Observability connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Observability",
      "cost review",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 256,
    "slug": "observability-portfolio-artifact",
    "title": "Observability Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "Observability",
    "duration": 55,
    "summary": "A portfolio builder for Observability that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Observability",
      "portfolio artifact",
      "read-only / sandbox-first",
      "design-opentelemetry-signal-path"
    ]
  },
  {
    "id": 257,
    "slug": "incident-response-cheatsheet",
    "title": "Incident Response Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 20,
    "summary": "A compact operator map for Incident Response: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Incident Response",
      "cheatsheet",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 258,
    "slug": "incident-response-runbook",
    "title": "Incident Response Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 35,
    "summary": "An incident-ready procedure for Incident Response with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Incident Response",
      "runbook",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 259,
    "slug": "incident-response-lab-worksheet",
    "title": "Incident Response Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Incident Response with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Incident Response",
      "lab worksheet",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 260,
    "slug": "incident-response-project-brief",
    "title": "Incident Response Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 60,
    "summary": "A scoped portfolio project for Incident Response with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Incident Response",
      "project brief",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 261,
    "slug": "incident-response-interview-prep",
    "title": "Incident Response Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Incident Response: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Incident Response",
      "interview prep",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 262,
    "slug": "incident-response-official-reference",
    "title": "Incident Response Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 25,
    "summary": "A curated official-source reading path for Incident Response, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Incident Response",
      "official reference",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 263,
    "slug": "incident-response-architecture-diagram",
    "title": "Incident Response Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 40,
    "summary": "A diagram brief for Incident Response that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Incident Response",
      "architecture diagram",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 264,
    "slug": "incident-response-template",
    "title": "Incident Response Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 30,
    "summary": "A reusable template for Incident Response reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Incident Response",
      "template",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 265,
    "slug": "incident-response-assessment",
    "title": "Incident Response Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 35,
    "summary": "A graded practical assessment for Incident Response covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Incident Response",
      "assessment",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 266,
    "slug": "incident-response-troubleshooting-guide",
    "title": "Incident Response Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 40,
    "summary": "A troubleshooting map for Incident Response that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Incident Response",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 267,
    "slug": "incident-response-decision-record",
    "title": "Incident Response Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Incident Response: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Incident Response",
      "decision record",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 268,
    "slug": "incident-response-production-readiness-checklist",
    "title": "Incident Response Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 45,
    "summary": "A launch checklist for Incident Response covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Incident Response",
      "production readiness checklist",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 269,
    "slug": "incident-response-failure-mode-drill",
    "title": "Incident Response Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 50,
    "summary": "A guided failure drill for Incident Response with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Incident Response",
      "failure mode drill",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 270,
    "slug": "incident-response-security-review",
    "title": "Incident Response Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 50,
    "summary": "A security workbook for Incident Response covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Incident Response",
      "security review",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 271,
    "slug": "incident-response-cost-review",
    "title": "Incident Response Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 45,
    "summary": "A cost review for Incident Response connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Incident Response",
      "cost review",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 272,
    "slug": "incident-response-portfolio-artifact",
    "title": "Incident Response Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "Incident Response",
    "duration": 55,
    "summary": "A portfolio builder for Incident Response that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Incident Response",
      "portfolio artifact",
      "read-only / sandbox-first",
      "run-incident-commander-tabletop"
    ]
  },
  {
    "id": 273,
    "slug": "finops-cheatsheet",
    "title": "FinOps Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 20,
    "summary": "A compact operator map for FinOps: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "FinOps",
      "cheatsheet",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 274,
    "slug": "finops-runbook",
    "title": "FinOps Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 35,
    "summary": "An incident-ready procedure for FinOps with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "FinOps",
      "runbook",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 275,
    "slug": "finops-lab-worksheet",
    "title": "FinOps Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing FinOps with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "FinOps",
      "lab worksheet",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 276,
    "slug": "finops-project-brief",
    "title": "FinOps Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 60,
    "summary": "A scoped portfolio project for FinOps with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "FinOps",
      "project brief",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 277,
    "slug": "finops-interview-prep",
    "title": "FinOps Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 30,
    "summary": "A scenario-driven interview pack for FinOps: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "FinOps",
      "interview prep",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 278,
    "slug": "finops-official-reference",
    "title": "FinOps Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 25,
    "summary": "A curated official-source reading path for FinOps, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "FinOps",
      "official reference",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 279,
    "slug": "finops-architecture-diagram",
    "title": "FinOps Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 40,
    "summary": "A diagram brief for FinOps that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "FinOps",
      "architecture diagram",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 280,
    "slug": "finops-template",
    "title": "FinOps Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 30,
    "summary": "A reusable template for FinOps reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "FinOps",
      "template",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 281,
    "slug": "finops-assessment",
    "title": "FinOps Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 35,
    "summary": "A graded practical assessment for FinOps covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "FinOps",
      "assessment",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 282,
    "slug": "finops-troubleshooting-guide",
    "title": "FinOps Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 40,
    "summary": "A troubleshooting map for FinOps that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "FinOps",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 283,
    "slug": "finops-decision-record",
    "title": "FinOps Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 35,
    "summary": "An ADR-style decision exercise for FinOps: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "FinOps",
      "decision record",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 284,
    "slug": "finops-production-readiness-checklist",
    "title": "FinOps Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 45,
    "summary": "A launch checklist for FinOps covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "FinOps",
      "production readiness checklist",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 285,
    "slug": "finops-failure-mode-drill",
    "title": "FinOps Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 50,
    "summary": "A guided failure drill for FinOps with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "FinOps",
      "failure mode drill",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 286,
    "slug": "finops-security-review",
    "title": "FinOps Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 50,
    "summary": "A security workbook for FinOps covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "FinOps",
      "security review",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 287,
    "slug": "finops-cost-review",
    "title": "FinOps Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 45,
    "summary": "A cost review for FinOps connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "FinOps",
      "cost review",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 288,
    "slug": "finops-portfolio-artifact",
    "title": "FinOps Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "FinOps",
    "duration": 55,
    "summary": "A portfolio builder for FinOps that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "FinOps",
      "portfolio artifact",
      "read-only / sandbox-first",
      "audit-eks-cost-drivers"
    ]
  },
  {
    "id": 289,
    "slug": "platform-engineering-cheatsheet",
    "title": "Platform Engineering Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 20,
    "summary": "A compact operator map for Platform Engineering: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Platform Engineering",
      "cheatsheet",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 290,
    "slug": "platform-engineering-runbook",
    "title": "Platform Engineering Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 35,
    "summary": "An incident-ready procedure for Platform Engineering with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Platform Engineering",
      "runbook",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 291,
    "slug": "platform-engineering-lab-worksheet",
    "title": "Platform Engineering Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Platform Engineering with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Platform Engineering",
      "lab worksheet",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 292,
    "slug": "platform-engineering-project-brief",
    "title": "Platform Engineering Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 60,
    "summary": "A scoped portfolio project for Platform Engineering with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Platform Engineering",
      "project brief",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 293,
    "slug": "platform-engineering-interview-prep",
    "title": "Platform Engineering Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Platform Engineering: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Platform Engineering",
      "interview prep",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 294,
    "slug": "platform-engineering-official-reference",
    "title": "Platform Engineering Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 25,
    "summary": "A curated official-source reading path for Platform Engineering, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Platform Engineering",
      "official reference",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 295,
    "slug": "platform-engineering-architecture-diagram",
    "title": "Platform Engineering Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 40,
    "summary": "A diagram brief for Platform Engineering that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Platform Engineering",
      "architecture diagram",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 296,
    "slug": "platform-engineering-template",
    "title": "Platform Engineering Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 30,
    "summary": "A reusable template for Platform Engineering reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Platform Engineering",
      "template",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 297,
    "slug": "platform-engineering-assessment",
    "title": "Platform Engineering Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 35,
    "summary": "A graded practical assessment for Platform Engineering covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Platform Engineering",
      "assessment",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 298,
    "slug": "platform-engineering-troubleshooting-guide",
    "title": "Platform Engineering Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 40,
    "summary": "A troubleshooting map for Platform Engineering that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Platform Engineering",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 299,
    "slug": "platform-engineering-decision-record",
    "title": "Platform Engineering Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Platform Engineering: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Platform Engineering",
      "decision record",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 300,
    "slug": "platform-engineering-production-readiness-checklist",
    "title": "Platform Engineering Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 45,
    "summary": "A launch checklist for Platform Engineering covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Platform Engineering",
      "production readiness checklist",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 301,
    "slug": "platform-engineering-failure-mode-drill",
    "title": "Platform Engineering Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 50,
    "summary": "A guided failure drill for Platform Engineering with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Platform Engineering",
      "failure mode drill",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 302,
    "slug": "platform-engineering-security-review",
    "title": "Platform Engineering Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 50,
    "summary": "A security workbook for Platform Engineering covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Platform Engineering",
      "security review",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 303,
    "slug": "platform-engineering-cost-review",
    "title": "Platform Engineering Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 45,
    "summary": "A cost review for Platform Engineering connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Platform Engineering",
      "cost review",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 304,
    "slug": "platform-engineering-portfolio-artifact",
    "title": "Platform Engineering Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "Platform Engineering",
    "duration": 55,
    "summary": "A portfolio builder for Platform Engineering that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Platform Engineering",
      "portfolio artifact",
      "read-only / sandbox-first",
      "create-platform-golden-path"
    ]
  },
  {
    "id": 305,
    "slug": "career-cheatsheet",
    "title": "Career Field Cheatsheet",
    "type": "cheatsheet",
    "level": "Advanced",
    "domain": "Career",
    "duration": 20,
    "summary": "A compact operator map for Career: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
    "tags": [
      "Career",
      "cheatsheet",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 306,
    "slug": "career-runbook",
    "title": "Career Production Runbook",
    "type": "runbook",
    "level": "Advanced",
    "domain": "Career",
    "duration": 35,
    "summary": "An incident-ready procedure for Career with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
    "tags": [
      "Career",
      "runbook",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 307,
    "slug": "career-lab-worksheet",
    "title": "Career Evidence Lab Worksheet",
    "type": "lab-worksheet",
    "level": "Advanced",
    "domain": "Career",
    "duration": 45,
    "summary": "A hands-on worksheet for practicing Career with scenario setup, expected observations, evidence prompts, and grading criteria.",
    "tags": [
      "Career",
      "lab worksheet",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 308,
    "slug": "career-project-brief",
    "title": "Career Portfolio Project Brief",
    "type": "project-brief",
    "level": "Advanced",
    "domain": "Career",
    "duration": 60,
    "summary": "A scoped portfolio project for Career with goals, architecture, acceptance criteria, operational proof, and README prompts.",
    "tags": [
      "Career",
      "project brief",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 309,
    "slug": "career-interview-prep",
    "title": "Career Interview Drill Packet",
    "type": "interview-prep",
    "level": "Advanced",
    "domain": "Career",
    "duration": 30,
    "summary": "A scenario-driven interview pack for Career: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
    "tags": [
      "Career",
      "interview prep",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 310,
    "slug": "career-official-reference",
    "title": "Career Official Reading Path",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "Career",
    "duration": 25,
    "summary": "A curated official-source reading path for Career, organized by concept, operational decision, practice task, and interview-ready takeaway.",
    "tags": [
      "Career",
      "official reference",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 311,
    "slug": "career-architecture-diagram",
    "title": "Career Architecture Review Diagram",
    "type": "architecture-diagram",
    "level": "Advanced",
    "domain": "Career",
    "duration": 40,
    "summary": "A diagram brief for Career that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
    "tags": [
      "Career",
      "architecture diagram",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 312,
    "slug": "career-template",
    "title": "Career Operating Template",
    "type": "template",
    "level": "Advanced",
    "domain": "Career",
    "duration": 30,
    "summary": "A reusable template for Career reviews, launch notes, handoffs, and incident follow-up.",
    "tags": [
      "Career",
      "template",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 313,
    "slug": "career-assessment",
    "title": "Career Practical Assessment",
    "type": "assessment",
    "level": "Advanced",
    "domain": "Career",
    "duration": 35,
    "summary": "A graded practical assessment for Career covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
    "tags": [
      "Career",
      "assessment",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 314,
    "slug": "career-troubleshooting-guide",
    "title": "Career Symptom-to-Signal Guide",
    "type": "troubleshooting-guide",
    "level": "Advanced",
    "domain": "Career",
    "duration": 40,
    "summary": "A troubleshooting map for Career that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
    "tags": [
      "Career",
      "troubleshooting guide",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 315,
    "slug": "career-decision-record",
    "title": "Career Architecture Decision Record",
    "type": "decision-record",
    "level": "Advanced",
    "domain": "Career",
    "duration": 35,
    "summary": "An ADR-style decision exercise for Career: context, options, tradeoffs, decision, consequences, and revisit triggers.",
    "tags": [
      "Career",
      "decision record",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 316,
    "slug": "career-production-readiness-checklist",
    "title": "Career Production Readiness Checklist",
    "type": "production-readiness",
    "level": "Advanced",
    "domain": "Career",
    "duration": 45,
    "summary": "A launch checklist for Career covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
    "tags": [
      "Career",
      "production readiness checklist",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 317,
    "slug": "career-failure-mode-drill",
    "title": "Career Failure Mode Drill",
    "type": "failure-mode-drill",
    "level": "Advanced",
    "domain": "Career",
    "duration": 50,
    "summary": "A guided failure drill for Career with injected symptoms, expected signals, mitigation choices, and learning questions.",
    "tags": [
      "Career",
      "failure mode drill",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 318,
    "slug": "career-security-review",
    "title": "Career Security Review Workbook",
    "type": "security-review",
    "level": "Advanced",
    "domain": "Career",
    "duration": 50,
    "summary": "A security workbook for Career covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
    "tags": [
      "Career",
      "security review",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 319,
    "slug": "career-cost-review",
    "title": "Career Cost and Capacity Review",
    "type": "cost-review",
    "level": "Advanced",
    "domain": "Career",
    "duration": 45,
    "summary": "A cost review for Career connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
    "tags": [
      "Career",
      "cost review",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 320,
    "slug": "career-portfolio-artifact",
    "title": "Career Portfolio Artifact Builder",
    "type": "portfolio-artifact",
    "level": "Advanced",
    "domain": "Career",
    "duration": 55,
    "summary": "A portfolio builder for Career that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
    "tags": [
      "Career",
      "portfolio artifact",
      "read-only / sandbox-first",
      "build-platform-career-proof-pack"
    ]
  },
  {
    "id": 321,
    "slug": "official-kubernetes-debug-profiles",
    "title": "Kubernetes Debug Profiles and Ephemeral Containers",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "Kubernetes",
    "duration": 18,
    "summary": "Official Kubernetes debugging reference for ephemeral containers, copied Pods, node debug sessions, and profile-aware kubectl debug workflows.",
    "tags": [
      "kubectl debug",
      "ephemeral containers",
      "troubleshooting",
      "2026 interviews",
      "Kubernetes",
      "official reference"
    ]
  },
  {
    "id": 322,
    "slug": "official-eks-pod-identity",
    "title": "Amazon EKS Pod Identity Interview Brief",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "EKS",
    "duration": 20,
    "summary": "AWS guidance on mapping IAM roles to Kubernetes service accounts, credential isolation, agent behavior, limits, and operational caveats.",
    "tags": [
      "pod identity",
      "iam",
      "least privilege",
      "2026 interviews",
      "EKS",
      "official reference"
    ]
  },
  {
    "id": 323,
    "slug": "official-eks-access-entries",
    "title": "EKS Access Entries and Authorization Policies",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "EKS",
    "duration": 18,
    "summary": "Current EKS access-entry model for IAM principals, Kubernetes RBAC groups, namespace-scoped access policies, and eventual consistency.",
    "tags": [
      "access entries",
      "rbac",
      "iam",
      "2026 interviews",
      "EKS",
      "official reference"
    ]
  },
  {
    "id": 324,
    "slug": "official-argocd-sync-faq",
    "title": "Argo CD Sync, Drift, and Health FAQ",
    "type": "troubleshooting-guide",
    "level": "Intermediate",
    "domain": "ArgoCD",
    "duration": 16,
    "summary": "Argo CD operational FAQ covering OutOfSync causes, Helm templating behavior, cluster connectivity checks, and reconciliation cadence.",
    "tags": [
      "gitops",
      "sync",
      "drift",
      "health",
      "ArgoCD",
      "troubleshooting guide"
    ]
  },
  {
    "id": 325,
    "slug": "official-helm-chart-dev-tips",
    "title": "Helm Chart Development Tips for Interviews",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "Helm",
    "duration": 15,
    "summary": "Helm chart guidance around template functions, includes, required values, validation, and production-quality chart review.",
    "tags": [
      "helm",
      "templates",
      "values",
      "lint",
      "Helm",
      "official reference"
    ]
  },
  {
    "id": 326,
    "slug": "official-terraform-automation",
    "title": "Terraform Safe Change and Versioning Brief",
    "type": "official-reference",
    "level": "Advanced",
    "domain": "Terraform",
    "duration": 15,
    "summary": "HashiCorp Terraform overview and best-practice entry points for safe infrastructure change, versioned workflows, and adoption at scale.",
    "tags": [
      "iac",
      "plan",
      "state",
      "workflow",
      "Terraform",
      "official reference"
    ]
  },
  {
    "id": 327,
    "slug": "official-sre-golden-signals",
    "title": "Google SRE Golden Signals Interview Brief",
    "type": "interview-prep",
    "level": "Intermediate",
    "domain": "SRE",
    "duration": 15,
    "summary": "A compact guide to latency, traffic, errors, saturation, alert quality, and when a human should be paged.",
    "tags": [
      "slo",
      "monitoring",
      "alerts",
      "golden signals",
      "SRE",
      "interview prep"
    ]
  },
  {
    "id": 328,
    "slug": "official-opentelemetry-developer-start",
    "title": "OpenTelemetry Developer Observability Starter",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "Observability",
    "duration": 18,
    "summary": "OpenTelemetry developer guidance for generating traces, metrics, and logs through automatic instrumentation and API usage.",
    "tags": [
      "otel",
      "traces",
      "metrics",
      "logs",
      "Observability",
      "official reference"
    ]
  },
  {
    "id": 329,
    "slug": "official-kubernetes-network-policies",
    "title": "Kubernetes NetworkPolicy Operational Review",
    "type": "official-reference",
    "level": "Intermediate",
    "domain": "Networking",
    "duration": 16,
    "summary": "Official model for ingress and egress isolation, selectors, IP blocks, and the requirement for a CNI that actually enforces policies.",
    "tags": [
      "networkpolicy",
      "cni",
      "zero trust",
      "egress",
      "Networking",
      "official reference"
    ]
  },
  {
    "id": 330,
    "slug": "official-pod-security-admission",
    "title": "Pod Security Admission and Standards Brief",
    "type": "security-review",
    "level": "Advanced",
    "domain": "Security",
    "duration": 18,
    "summary": "Kubernetes namespace-level Pod Security Admission modes, privileged/baseline/restricted levels, and workload-template review implications.",
    "tags": [
      "pod security",
      "admission",
      "restricted",
      "namespace labels",
      "Security",
      "security review"
    ]
  }
];

export const interviewPacks: InterviewPack[] = [
  {
    "id": 1,
    "slug": "kubernetes-debugging-interview-pack",
    "title": "Kubernetes Debugging Interview Pack",
    "domain": "Kubernetes",
    "level": "Fresher",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Kubernetes Deployments",
      "Kubernetes Debug Pods",
      "Kubernetes Services"
    ],
    "relatedLabs": [
      "Trace Service traffic to ready Pods",
      "Separate CrashLoopBackOff from ImagePullBackOff"
    ],
    "strongSignals": [
      "Mentions EndpointSlices",
      "Checks readiness before blaming networking",
      "Keeps fix in source of truth",
      "Follows Deployment -> ReplicaSet -> Pod",
      "Differentiates rollback from data recovery"
    ],
    "redFlags": [
      "Deletes Pods first",
      "Changes random labels live",
      "Skips namespace and selector comparison",
      "Only scales replicas",
      "Confuses Service routing with rollout health"
    ],
    "practiceTask": "Use the trace-service-to-pod lab and write a four-command evidence note.",
    "questions": [
      {
        "id": 1,
        "question": "A Service returns 503 after a label cleanup. Walk me through your diagnosis.",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 2,
        "question": "A rollout is stuck with unavailable replicas. Which objects do you inspect?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 3,
        "question": "How do readiness, liveness, and startup probes differ operationally?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 4,
        "question": "A Pod is Pending. What are the highest-value signals?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 5,
        "question": "What evidence do you collect before restarting a failing workload?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 6,
        "question": "Which portfolio artifact would you show for Kubernetes?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 7,
        "question": "How would you build a seven-day crash plan for Kubernetes interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 8,
        "question": "How do you answer when an interviewer challenges your Kubernetes recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 9,
        "question": "What are the common false positives or misleading signals in Kubernetes?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 2,
    "slug": "eks-operations-interview-pack",
    "title": "EKS Operations Interview Pack",
    "domain": "EKS",
    "level": "Intermediate",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Amazon EKS User Guide",
      "Amazon VPC CNI for EKS",
      "Amazon EKS Best Practices Guide"
    ],
    "relatedLabs": [
      "Diagnose EKS Pod IP exhaustion",
      "Run a production EKS architecture review"
    ],
    "strongSignals": [
      "Knows Pods consume VPC IPs with VPC CNI",
      "Checks subnet headroom",
      "Avoids one-size-fits-all scaling",
      "Mentions DaemonSet constraints",
      "Discusses workload fit"
    ],
    "redFlags": [
      "Only adds replicas",
      "Blames CoreDNS first",
      "Ignores subnet/AZ placement",
      "Says one model fits all",
      "Ignores logging/monitoring agents"
    ],
    "practiceTask": "Model Pod IP demand for three node groups and write a scale-out risk note.",
    "questions": [
      {
        "id": 10,
        "question": "Pods are Pending and CNI logs mention IP allocation. What is your path?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 11,
        "question": "When would you choose Fargate, managed node groups, or EC2 nodes?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 12,
        "question": "An Ingress exists but no ALB appears. What do you inspect?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 13,
        "question": "How do you run EKS add-ons as production components?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 14,
        "question": "What EKS signals matter during a cluster upgrade readiness review?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 15,
        "question": "Which portfolio artifact would you show for EKS?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 16,
        "question": "How would you build a seven-day crash plan for EKS interviews?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 17,
        "question": "How do you answer when an interviewer challenges your EKS recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 18,
        "question": "What are the common false positives or misleading signals in EKS?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 3,
    "slug": "workload-identity-iam-interview-pack",
    "title": "AWS IAM and Workload Identity Interview Pack",
    "domain": "AWS IAM",
    "level": "Intermediate",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "EKS Pod Identity",
      "AWS IAM User Guide"
    ],
    "relatedLabs": [
      "Debug IRSA AccessDenied for a Pod",
      "Audit Kubernetes tenant boundaries"
    ],
    "strongSignals": [
      "Finds actual principal",
      "Separates trust and permissions",
      "Uses CloudTrail evidence",
      "Mentions IMDS exposure",
      "Connects identity to service account"
    ],
    "redFlags": [
      "Adds AdministratorAccess",
      "Only checks Kubernetes YAML",
      "Ignores conditions and boundaries",
      "Says network isolation is enough",
      "Shares one role per cluster"
    ],
    "practiceTask": "Write an AccessDenied decision tree from Pod to IAM policy.",
    "questions": [
      {
        "id": 19,
        "question": "A Pod gets AccessDenied from AWS after a service account change. How do you debug?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 20,
        "question": "Why avoid broad node instance profile permissions for Pods?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 21,
        "question": "How do you review an AWS controller IAM policy before production?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 22,
        "question": "Explain allow, explicit deny, conditions, and permission boundaries in IAM.",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 23,
        "question": "How do EKS Pod Identity and IRSA change operations?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 24,
        "question": "Which portfolio artifact would you show for AWS IAM?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 25,
        "question": "How would you build a seven-day crash plan for AWS IAM interviews?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 26,
        "question": "How do you answer when an interviewer challenges your AWS IAM recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 27,
        "question": "What are the common false positives or misleading signals in AWS IAM?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 4,
    "slug": "helm-gitops-interview-pack",
    "title": "Helm and GitOps Delivery Interview Pack",
    "domain": "Helm / ArgoCD",
    "level": "Intermediate",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Helm Values Best Practices",
      "Argo CD Projects",
      "Argo CD Sync Waves"
    ],
    "relatedLabs": [
      "Validate a Helm release artifact",
      "Trace an ArgoCD drift report"
    ],
    "strongSignals": [
      "Calls values an API",
      "Mentions docs and type clarity",
      "Considers consumers",
      "Reviews rendered manifests",
      "Checks selectors/immutable fields"
    ],
    "redFlags": [
      "Adds arbitrary nested knobs",
      "No docs",
      "Tests only with one values file",
      "Approves because helm lint passes",
      "No previous-release comparison"
    ],
    "practiceTask": "Document ten values for an internal app chart.",
    "questions": [
      {
        "id": 28,
        "question": "What makes a Helm chart values file a good API?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 29,
        "question": "How do you review a Helm upgrade before it hits production?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 30,
        "question": "How would you restrict tenant deployments in ArgoCD?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 31,
        "question": "When does ignoreDifferences help, and when is it dangerous?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 32,
        "question": "What can go wrong with auto-sync, prune, and rollback?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 33,
        "question": "Which portfolio artifact would you show for Helm / ArgoCD?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 34,
        "question": "How would you build a seven-day crash plan for Helm / ArgoCD interviews?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 35,
        "question": "How do you answer when an interviewer challenges your Helm / ArgoCD recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 36,
        "question": "What are the common false positives or misleading signals in Helm / ArgoCD?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 5,
    "slug": "terraform-platform-interview-pack",
    "title": "Terraform Platform Infrastructure Interview Pack",
    "domain": "Terraform",
    "level": "Intermediate",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Terraform State",
      "Terraform Plan"
    ],
    "relatedLabs": [
      "Review a Terraform EKS plan",
      "Run a production EKS architecture review"
    ],
    "strongSignals": [
      "Explains mapping and locking",
      "Mentions backend/workspace",
      "Cares about sensitive data",
      "Reads plan beyond green/red",
      "Mentions blast radius"
    ],
    "redFlags": [
      "Says state is just cache",
      "Runs apply locally in prod",
      "No lock concern",
      "Approves if plan exits 0",
      "No replacement awareness"
    ],
    "practiceTask": "Write a production Terraform backend safety checklist.",
    "questions": [
      {
        "id": 37,
        "question": "What is Terraform state and why does locking matter?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 38,
        "question": "How do you review a Terraform plan for EKS changes?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 39,
        "question": "What makes an infrastructure module reusable but still safe?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 40,
        "question": "How do you handle drift in Terraform-managed infrastructure?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 41,
        "question": "Which Terraform changes are highest risk for an EKS platform?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 42,
        "question": "Which portfolio artifact would you show for Terraform?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 43,
        "question": "How would you build a seven-day crash plan for Terraform interviews?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 44,
        "question": "How do you answer when an interviewer challenges your Terraform recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 45,
        "question": "What are the common false positives or misleading signals in Terraform?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 6,
    "slug": "security-multitenancy-interview-pack",
    "title": "Kubernetes Security and Multi-tenancy Interview Pack",
    "domain": "Security",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Kubernetes Network Policies",
      "Kubernetes Pod Security Standards"
    ],
    "relatedLabs": [
      "Audit Kubernetes tenant boundaries"
    ],
    "strongSignals": [
      "Checks CNI enforcement",
      "Keeps DNS in mind",
      "Rolls out gradually",
      "Uses can-i",
      "Separates Role from ClusterRole"
    ],
    "redFlags": [
      "Applies cluster-wide deny at once",
      "No dependency inventory",
      "Assumes policy works everywhere",
      "Uses cluster-admin for convenience",
      "No service-account review"
    ],
    "practiceTask": "Write a namespace default-deny migration plan.",
    "questions": [
      {
        "id": 46,
        "question": "How do you roll out default-deny NetworkPolicy safely?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 47,
        "question": "What does least privilege mean in Kubernetes RBAC?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 48,
        "question": "Which Pod settings should admission policy block or review?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 49,
        "question": "How do you design secrets boundaries in a shared cluster?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 50,
        "question": "How would you separate tenants in a Kubernetes platform?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 51,
        "question": "Which portfolio artifact would you show for Security?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 52,
        "question": "How would you build a seven-day crash plan for Security interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 53,
        "question": "How do you answer when an interviewer challenges your Security recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 54,
        "question": "What are the common false positives or misleading signals in Security?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 7,
    "slug": "sre-observability-interview-pack",
    "title": "SRE and Observability Interview Pack",
    "domain": "SRE",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Google SRE SLOs",
      "Prometheus Alerting Practices"
    ],
    "relatedLabs": [
      "Write an SLO-backed Kubernetes runbook"
    ],
    "strongSignals": [
      "User-visible first",
      "Defines numerator/denominator",
      "Connects to error budget",
      "Urgent/actionable/user-impact",
      "Separates page from ticket"
    ],
    "redFlags": [
      "Picks CPU as the SLI",
      "No measurement window",
      "No user impact",
      "Pages on every warning",
      "No action path"
    ],
    "practiceTask": "Define availability and latency SLIs for checkout.",
    "questions": [
      {
        "id": 55,
        "question": "How do you choose an SLI for an API?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 56,
        "question": "What makes an alert page-worthy?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 57,
        "question": "Explain burn-rate alerting in practical terms.",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 58,
        "question": "What should a Kubernetes incident runbook contain?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 59,
        "question": "How do logs, metrics, and traces complement each other?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 60,
        "question": "Which portfolio artifact would you show for SRE?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 61,
        "question": "How would you build a seven-day crash plan for SRE interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 62,
        "question": "How do you answer when an interviewer challenges your SRE recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 63,
        "question": "What are the common false positives or misleading signals in SRE?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 8,
    "slug": "platform-system-design-interview-pack",
    "title": "Platform Engineering System Design Interview Pack",
    "domain": "Platform Engineering",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "CNCF Platforms Whitepaper",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Create a service golden path",
      "Design a safe Kubernetes release pipeline"
    ],
    "strongSignals": [
      "Product thinking",
      "Security and observability defaults",
      "Measures outcomes",
      "Covers people and systems",
      "Includes cost/security/reliability"
    ],
    "redFlags": [
      "Only scaffolds code",
      "No ownership/runbook",
      "No adoption metric",
      "Only checks manifests",
      "No owner"
    ],
    "practiceTask": "Sketch the first-run experience for creating a new service.",
    "questions": [
      {
        "id": 64,
        "question": "Design a golden path for a new Kubernetes service.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 65,
        "question": "What belongs in a production readiness review?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 66,
        "question": "How do you decide when to build platform automation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 67,
        "question": "How would you measure platform success?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 68,
        "question": "How do you handle exceptions to the golden path?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 69,
        "question": "Which portfolio artifact would you show for Platform Engineering?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 70,
        "question": "How would you build a seven-day crash plan for Platform Engineering interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 71,
        "question": "How do you answer when an interviewer challenges your Platform Engineering recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 72,
        "question": "What are the common false positives or misleading signals in Platform Engineering?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 9,
    "slug": "linux-operator-interview-pack",
    "title": "Linux Operator Troubleshooting Interview Pack",
    "domain": "Linux",
    "level": "Fresher",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "GNU Bash Reference Manual",
      "GNU Coreutils Manual",
      "systemd journalctl manual"
    ],
    "relatedLabs": [
      "Inspect Linux failure evidence",
      "Separate CrashLoopBackOff from ImagePullBackOff"
    ],
    "strongSignals": [
      "Separates process state from log text",
      "Checks permissions and disk",
      "Creates a concise evidence note",
      "Uses last state and previous logs",
      "Knows 137/OOM path"
    ],
    "redFlags": [
      "Restarts repeatedly",
      "Greps one error and stops",
      "Does not identify the service owner",
      "Only increases replicas",
      "Ignores limits"
    ],
    "practiceTask": "Use the Linux evidence lab and write a five-command failure note.",
    "questions": [
      {
        "id": 73,
        "question": "A Linux service fails after deploy and logs are noisy. What is your evidence order?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 74,
        "question": "How do exit codes and signals show up in Kubernetes troubleshooting?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 75,
        "question": "A process cannot read its config file. How do you debug without weakening permissions?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 76,
        "question": "What shell pipeline would you use to turn event noise into an answer?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 77,
        "question": "How do you tell disk pressure, log growth, and image storage apart?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 78,
        "question": "Which portfolio artifact would you show for Linux?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 79,
        "question": "How would you build a seven-day crash plan for Linux interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 80,
        "question": "How do you answer when an interviewer challenges your Linux recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 81,
        "question": "What are the common false positives or misleading signals in Linux?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 10,
    "slug": "networking-debugging-interview-pack",
    "title": "Networking Debugging Interview Pack",
    "domain": "Networking",
    "level": "Fresher",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "MDN HTTP Overview",
      "MDN Domain Names",
      "Kubernetes Services"
    ],
    "relatedLabs": [
      "Trace an HTTP request across the network path",
      "Trace Service traffic to ready Pods"
    ],
    "strongSignals": [
      "Draws the path",
      "Uses vantage points",
      "Classifies the symptom before changing anything",
      "Tests FQDN and namespace",
      "Checks EndpointSlices separately"
    ],
    "redFlags": [
      "Only checks app logs",
      "Blames DNS for every failure",
      "No owner per hop",
      "Edits CoreDNS first",
      "Ignores namespace search path"
    ],
    "practiceTask": "Use the network path lab and annotate each hop with command, signal, and owner.",
    "questions": [
      {
        "id": 82,
        "question": "A request times out. How do you locate the failing hop?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 83,
        "question": "How do you separate DNS failure from Service routing failure?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 84,
        "question": "What do 404, 502, 503, and timeout usually tell you in an Ingress path?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 85,
        "question": "How would you design a minimal allowlist for frontend to API to database?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 86,
        "question": "A TLS handshake fails only in production. What do you inspect?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 87,
        "question": "Which portfolio artifact would you show for Networking?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 88,
        "question": "How would you build a seven-day crash plan for Networking interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 89,
        "question": "How do you answer when an interviewer challenges your Networking recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 90,
        "question": "What are the common false positives or misleading signals in Networking?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 11,
    "slug": "docker-image-delivery-interview-pack",
    "title": "Docker and Image Delivery Interview Pack",
    "domain": "Docker",
    "level": "Fresher",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Dockerfile Best Practices",
      "Docker Multi-stage Builds",
      "Docker Reference"
    ],
    "relatedLabs": [
      "Review Kubernetes YAML before apply",
      "Design a safe Kubernetes release pipeline"
    ],
    "strongSignals": [
      "Mentions multi-stage builds",
      "Runs non-root",
      "Balances size, cache, and provenance",
      "Explains tag mutability",
      "Promotes tested artifacts"
    ],
    "redFlags": [
      "Ships build tools in runtime",
      "Uses latest everywhere",
      "Runs as root without reason",
      "Trusts latest",
      "Rebuilds separately per environment"
    ],
    "practiceTask": "Review a Dockerfile for base image, user, layers, copied files, and cache behavior.",
    "questions": [
      {
        "id": 91,
        "question": "What makes a Dockerfile production-friendly?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 92,
        "question": "Why deploy by image digest instead of only by tag?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 93,
        "question": "How do you reason about image vulnerability scan results?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 94,
        "question": "What can go wrong when copying files into a container image?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 95,
        "question": "How would you structure local, CI, and production image workflows?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 96,
        "question": "Which portfolio artifact would you show for Docker?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 97,
        "question": "How would you build a seven-day crash plan for Docker interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 98,
        "question": "How do you answer when an interviewer challenges your Docker recommendation?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 99,
        "question": "What are the common false positives or misleading signals in Docker?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 12,
    "slug": "cicd-release-engineering-interview-pack",
    "title": "CI/CD Release Engineering Interview Pack",
    "domain": "CI/CD",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "GitHub Actions Security",
      "GitHub Actions OIDC",
      "Deployments and Environments"
    ],
    "relatedLabs": [
      "Design a safe Kubernetes release pipeline",
      "Validate a Helm release artifact"
    ],
    "strongSignals": [
      "Covers artifact and manifest gates",
      "Promotes digest",
      "Measures delivery and reliability",
      "Short-lived credentials",
      "Scopes trust claims"
    ],
    "redFlags": [
      "Only adds a deploy job",
      "No post-deploy validation",
      "No rollback path",
      "Keeps static keys forever",
      "Allows any branch to deploy"
    ],
    "practiceTask": "Create a quality-gate matrix for dev, stage, and production.",
    "questions": [
      {
        "id": 100,
        "question": "Design a deployment pipeline for a Kubernetes service.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 101,
        "question": "Why use OIDC for cloud deploy credentials in CI?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 102,
        "question": "How do you secure self-hosted runners?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 103,
        "question": "What makes a canary release safe enough to automate?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 104,
        "question": "How do you make rollback reliable in a pipeline?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 105,
        "question": "Which portfolio artifact would you show for CI/CD?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 106,
        "question": "How would you build a seven-day crash plan for CI/CD interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 107,
        "question": "How do you answer when an interviewer challenges your CI/CD recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 108,
        "question": "What are the common false positives or misleading signals in CI/CD?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 13,
    "slug": "production-eks-architecture-interview-pack",
    "title": "Production EKS and AWS Architecture Interview Pack",
    "domain": "EKS",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Amazon EKS Best Practices Guide",
      "Amazon VPC CNI Best Practices",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Run a production EKS architecture review",
      "Diagnose EKS Pod IP exhaustion"
    ],
    "strongSignals": [
      "Designs access paths",
      "Includes break-glass",
      "Tests failure modes",
      "Checks topology spread and storage",
      "Models AZ loss"
    ],
    "redFlags": [
      "Locks out CI/on-call",
      "No audit path",
      "Treats private endpoint as complete security",
      "Counts replicas only",
      "Ignores zonal storage"
    ],
    "practiceTask": "Draw a private EKS access diagram with normal and emergency paths.",
    "questions": [
      {
        "id": 109,
        "question": "How would you design access to a private EKS endpoint?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 110,
        "question": "How do you review multi-AZ resilience for EKS workloads?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 111,
        "question": "What guardrails would you put around Karpenter or dynamic node provisioning?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 112,
        "question": "How do you plan an EKS upgrade for a platform with many tenants?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 113,
        "question": "How do you balance NAT gateway, load balancer, and node costs against reliability?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 114,
        "question": "Which portfolio artifact would you show for EKS?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 115,
        "question": "How would you build a seven-day crash plan for EKS interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 116,
        "question": "How do you answer when an interviewer challenges your EKS recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 117,
        "question": "What are the common false positives or misleading signals in EKS?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 14,
    "slug": "incident-response-interview-pack",
    "title": "Incident Response and Postmortem Interview Pack",
    "domain": "Incident Response",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "Google SRE Managing Incidents",
      "Google Incident Management Guide",
      "Google SRE Postmortem Culture"
    ],
    "relatedLabs": [
      "Write an SLO-backed Kubernetes runbook"
    ],
    "strongSignals": [
      "Assigns roles",
      "Separates diagnosis and mitigation",
      "Communicates predictably",
      "Compares mitigation tradeoffs",
      "Checks data compatibility"
    ],
    "redFlags": [
      "Everyone debugs at once",
      "No impact statement",
      "No timeline",
      "Always rolls back",
      "Always scales"
    ],
    "practiceTask": "Draft the first ten minutes of an incident channel transcript.",
    "questions": [
      {
        "id": 118,
        "question": "How do you structure an incident response when checkout is down?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 119,
        "question": "How do you decide between rollback, failover, scaling, and feature disablement?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 120,
        "question": "What makes a postmortem useful rather than performative?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 121,
        "question": "How do you keep runbooks current?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 122,
        "question": "What would you practice in a platform game day?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 123,
        "question": "Which portfolio artifact would you show for Incident Response?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 124,
        "question": "How would you build a seven-day crash plan for Incident Response interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 125,
        "question": "How do you answer when an interviewer challenges your Incident Response recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 126,
        "question": "What are the common false positives or misleading signals in Incident Response?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 15,
    "slug": "finops-capacity-interview-pack",
    "title": "FinOps and Platform Capacity Interview Pack",
    "domain": "FinOps",
    "level": "Advanced",
    "questionCount": 9,
    "duration": 36,
    "docsToRead": [
      "AWS Cost Optimization Pillar",
      "AWS Cost Optimization Foundation",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Run a production EKS architecture review",
      "Review a Terraform EKS plan"
    ],
    "strongSignals": [
      "Uses ownership allocation",
      "Protects SLO tradeoffs",
      "Distinguishes waste from resilience",
      "Connects requests to bin-packing",
      "Mentions throttling and OOM"
    ],
    "redFlags": [
      "Cuts replicas blindly",
      "No owner labels",
      "Ignores data transfer/NAT",
      "Sets everything tiny",
      "Ignores load testing"
    ],
    "practiceTask": "Create a cost review worksheet for one namespace.",
    "questions": [
      {
        "id": 127,
        "question": "How do you start a Kubernetes cost review without harming reliability?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 128,
        "question": "How do requests and limits affect both cost and reliability?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 129,
        "question": "Where do hidden AWS costs appear around EKS?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 130,
        "question": "When is spot capacity appropriate for platform workloads?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 131,
        "question": "How do you create cost accountability without making teams afraid to use the platform?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 132,
        "question": "Which portfolio artifact would you show for FinOps?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 133,
        "question": "How would you build a seven-day crash plan for FinOps interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 134,
        "question": "How do you answer when an interviewer challenges your FinOps recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 135,
        "question": "What are the common false positives or misleading signals in FinOps?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 16,
    "slug": "career-recruiter-screen-interview-pack",
    "title": "DevOps and SRE Recruiter Screen Pack",
    "domain": "Career",
    "level": "Intermediate",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "CNCF Platforms Whitepaper",
      "Google SRE Service Level Objectives",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Create a service golden path",
      "Write an SLO-backed Kubernetes runbook"
    ],
    "strongSignals": [
      "Specific scope",
      "Evidence-backed outcome",
      "Clear target role",
      "Calm concise framing",
      "Forward-looking"
    ],
    "redFlags": [
      "Tool list with no ownership",
      "Apologetic layoff framing",
      "No production examples",
      "Blames people",
      "Sounds ashamed"
    ],
    "practiceTask": "Write and rehearse a 120-second background answer with one metric and one incident or project artifact.",
    "questions": [
      {
        "id": 136,
        "question": "Give me your two-minute DevOps/SRE background.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 137,
        "question": "Why are you looking now, and how do you discuss a layoff?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 138,
        "question": "What roles are you best matched for?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 139,
        "question": "What compensation and availability answer keeps you moving forward?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 140,
        "question": "Tell me about your strongest platform project.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 141,
        "question": "What is your biggest current skill gap?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 142,
        "question": "How do you communicate during incidents?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 143,
        "question": "What questions do you ask the interviewer?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 144,
        "question": "Which portfolio artifact would you show for Career?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 145,
        "question": "How would you build a seven-day crash plan for Career interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 146,
        "question": "How do you answer when an interviewer challenges your Career recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 147,
        "question": "What are the common false positives or misleading signals in Career?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 17,
    "slug": "behavioral-star-sre-interview-pack",
    "title": "Behavioral STAR Stories for SRE and DevOps Pack",
    "domain": "Career",
    "level": "Intermediate",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "Google SRE Managing Incidents",
      "Google SRE Postmortem Culture",
      "CNCF Platforms Whitepaper"
    ],
    "relatedLabs": [
      "Write an SLO-backed Kubernetes runbook",
      "Create a service golden path"
    ],
    "strongSignals": [
      "Impact and mitigation",
      "Personal ownership",
      "Learning loop",
      "Toil and risk quantified",
      "Guardrails"
    ],
    "redFlags": [
      "Blames one person",
      "No result",
      "Only describes commands",
      "Automated for novelty",
      "No owner"
    ],
    "practiceTask": "Write a 3-minute incident story and a 30-second summary version.",
    "questions": [
      {
        "id": 148,
        "question": "Tell me about a production incident you handled.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 149,
        "question": "Describe a time you automated toil.",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 150,
        "question": "Tell me about a time you disagreed with a senior engineer or manager.",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 151,
        "question": "Give an example of learning a new tool quickly.",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 152,
        "question": "Tell me about a mistake you made.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 153,
        "question": "How do you handle being on call?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 154,
        "question": "How do you explain technical risk to non-engineers?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 155,
        "question": "What makes you a strong teammate during a job transition?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 156,
        "question": "Which portfolio artifact would you show for Career?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 157,
        "question": "How would you build a seven-day crash plan for Career interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 158,
        "question": "How do you answer when an interviewer challenges your Career recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 159,
        "question": "What are the common false positives or misleading signals in Career?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 18,
    "slug": "live-troubleshooting-pairing-interview-pack",
    "title": "Live Troubleshooting and Pairing Interview Pack",
    "domain": "Platform Engineering",
    "level": "Advanced",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "Kubernetes Debugging Tasks",
      "Terraform Plan Command",
      "Prometheus Alerting Practices"
    ],
    "relatedLabs": [
      "Trace Service traffic to ready Pods",
      "Separate CrashLoopBackOff from ImagePullBackOff",
      "Review a Terraform EKS plan"
    ],
    "strongSignals": [
      "Clarifies scope",
      "Read-only first",
      "Explains reasoning aloud",
      "Concept over memorization",
      "Uses help safely"
    ],
    "redFlags": [
      "Runs random commands",
      "Goes silent",
      "Mutates without permission",
      "Bluffs wrong syntax",
      "Panics"
    ],
    "practiceTask": "Practice a five-minute troubleshooting monologue for a Service 503.",
    "questions": [
      {
        "id": 160,
        "question": "How do you start a live troubleshooting exercise when the prompt is vague?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 161,
        "question": "What do you say when you do not know the exact command?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 162,
        "question": "How do you avoid rabbit holes in a live debug?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 163,
        "question": "How would you review a Terraform plan live?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 164,
        "question": "How do you debug AccessDenied in a pairing interview?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 165,
        "question": "How do you debug a noisy alert in a live interview?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 166,
        "question": "How do you communicate partial progress in a live exercise?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 167,
        "question": "How do you close a troubleshooting exercise strongly?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 168,
        "question": "Which portfolio artifact would you show for Platform Engineering?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 169,
        "question": "How would you build a seven-day crash plan for Platform Engineering interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 170,
        "question": "How do you answer when an interviewer challenges your Platform Engineering recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 171,
        "question": "What are the common false positives or misleading signals in Platform Engineering?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 19,
    "slug": "aws-core-operations-interview-pack",
    "title": "AWS Core Operations Interview Pack",
    "domain": "AWS Operations",
    "level": "Intermediate",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "Amazon CloudWatch User Guide",
      "Amazon VPC User Guide",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Run a production EKS architecture review",
      "Diagnose EKS Pod IP exhaustion"
    ],
    "strongSignals": [
      "Connects ALB and Kubernetes signals",
      "Checks health path/port",
      "Looks at security groups",
      "Clear network path",
      "Separates DNS/routing/firewall"
    ],
    "redFlags": [
      "Only checks Pods",
      "Changes health check blindly",
      "Ignores target group reason",
      "Says private subnet has no internet by magic",
      "Ignores route tables"
    ],
    "practiceTask": "Create an ALB unhealthy-target checklist with AWS and Kubernetes evidence.",
    "questions": [
      {
        "id": 172,
        "question": "An ALB has unhealthy targets after a deploy. What do you inspect?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 173,
        "question": "Explain private subnet egress to a developer.",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 174,
        "question": "What CloudWatch alarms would you page on for a production API?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 175,
        "question": "How do you investigate intermittent DNS issues in AWS?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 176,
        "question": "How do you review backup and restore readiness?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 177,
        "question": "How do you reason about autoscaling in AWS and Kubernetes together?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 178,
        "question": "What does Well-Architected thinking add to day-to-day operations?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 179,
        "question": "How do you debug AWS quota or throttling issues?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 180,
        "question": "Which portfolio artifact would you show for AWS Operations?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 181,
        "question": "How would you build a seven-day crash plan for AWS Operations interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 182,
        "question": "How do you answer when an interviewer challenges your AWS Operations recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 183,
        "question": "What are the common false positives or misleading signals in AWS Operations?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 20,
    "slug": "observability-telemetry-design-interview-pack",
    "title": "Observability and Telemetry Design Interview Pack",
    "domain": "Observability",
    "level": "Advanced",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "OpenTelemetry Signals",
      "Prometheus Alerting Practices",
      "Amazon CloudWatch User Guide"
    ],
    "relatedLabs": [
      "Write an SLO-backed Kubernetes runbook"
    ],
    "strongSignals": [
      "User-journey first",
      "Combines signals",
      "Owner and runbook",
      "Knows signal strengths",
      "Hypothesis-driven"
    ],
    "redFlags": [
      "Collects everything",
      "No SLI",
      "No alert action",
      "Says logs are enough",
      "No trace use case"
    ],
    "practiceTask": "Create an observability launch checklist for checkout.",
    "questions": [
      {
        "id": 184,
        "question": "Design observability for a new checkout service.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 185,
        "question": "When do metrics, logs, and traces each change your next action?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 186,
        "question": "How do you control metric cardinality?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 187,
        "question": "How do you design tracing for a microservice path?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 188,
        "question": "How do you make dashboards useful during incidents?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 189,
        "question": "How do you handle observability for batch jobs and queues?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 190,
        "question": "How do you migrate from vendor-specific telemetry to OpenTelemetry?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 191,
        "question": "How do you test whether monitoring itself works?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 192,
        "question": "Which portfolio artifact would you show for Observability?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 193,
        "question": "How would you build a seven-day crash plan for Observability interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 194,
        "question": "How do you answer when an interviewer challenges your Observability recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 195,
        "question": "What are the common false positives or misleading signals in Observability?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 21,
    "slug": "terraform-live-review-interview-pack",
    "title": "Terraform Live Plan Review Interview Pack",
    "domain": "Terraform",
    "level": "Intermediate",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "Terraform State",
      "Terraform Plan Command",
      "Terraform Modules"
    ],
    "relatedLabs": [
      "Review a Terraform EKS plan",
      "Run a production EKS architecture review"
    ],
    "strongSignals": [
      "Environment check",
      "Risk prioritization",
      "Decision summary",
      "Separates harmless from risky unknowns",
      "Links to blast radius"
    ],
    "redFlags": [
      "Reads linearly only",
      "Ignores backend",
      "No blast-radius framing",
      "Ignores unknowns",
      "Applies to see what happens"
    ],
    "practiceTask": "Practice a two-minute spoken plan scan using risk buckets.",
    "questions": [
      {
        "id": 196,
        "question": "Walk me through your first two minutes with a Terraform plan.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 197,
        "question": "How do unknown values affect plan review?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 198,
        "question": "When would you use import, moved blocks, or state surgery?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 199,
        "question": "How do you review Terraform changes from a security perspective?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 200,
        "question": "How do you structure Terraform environments for promotion?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 201,
        "question": "What should policy-as-code catch before apply?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 202,
        "question": "How do you handle a failed apply?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 203,
        "question": "How do you explain Terraform risk to a non-IaC interviewer?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 204,
        "question": "Which portfolio artifact would you show for Terraform?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 205,
        "question": "How would you build a seven-day crash plan for Terraform interviews?",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 206,
        "question": "How do you answer when an interviewer challenges your Terraform recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 207,
        "question": "What are the common false positives or misleading signals in Terraform?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 22,
    "slug": "kubernetes-platform-system-design-drill-pack",
    "title": "Kubernetes Platform System Design Drill Pack",
    "domain": "Kubernetes",
    "level": "Advanced",
    "questionCount": 12,
    "duration": 48,
    "docsToRead": [
      "Kubernetes Documentation",
      "CNCF Platforms Whitepaper",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Run a production EKS architecture review",
      "Create a service golden path"
    ],
    "strongSignals": [
      "Clarifies requirements",
      "Combines technical and operating model",
      "Measures outcomes",
      "Self-service with guardrails",
      "Ownership metadata"
    ],
    "redFlags": [
      "Only draws clusters",
      "No tenancy/security",
      "No support model",
      "Manual ticket queue only",
      "No quotas/RBAC"
    ],
    "practiceTask": "Draw a platform architecture with tenant, control-plane, data-plane, and ownership boundaries.",
    "questions": [
      {
        "id": 208,
        "question": "Design a Kubernetes platform for 30 product teams.",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 209,
        "question": "How would you design namespace onboarding?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 210,
        "question": "How do you design upgrade strategy for shared clusters?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 211,
        "question": "How do you choose between one shared cluster and many clusters?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 212,
        "question": "How do you design platform observability as a product capability?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 213,
        "question": "How would you make cost visible without blocking delivery?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 214,
        "question": "How do you design break-glass access?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 215,
        "question": "How do you handle platform deprecation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 216,
        "question": "Which portfolio artifact would you show for Kubernetes?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 217,
        "question": "How would you build a seven-day crash plan for Kubernetes interviews?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 218,
        "question": "How do you answer when an interviewer challenges your Kubernetes recommendation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 219,
        "question": "What are the common false positives or misleading signals in Kubernetes?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 23,
    "slug": "kubernetes-live-troubleshooting-2026",
    "title": "2026 Kubernetes Live Troubleshooting Loop",
    "domain": "Kubernetes",
    "level": "Intermediate",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "Kubernetes Debug Running Pods",
      "kubectl Quick Reference",
      "Kubernetes Network Policies"
    ],
    "relatedLabs": [
      "Trace Service traffic to ready Pods",
      "Separate CrashLoopBackOff from ImagePullBackOff"
    ],
    "strongSignals": [
      "Starts read-only",
      "Uses EndpointSlices and events",
      "Knows when kubectl debug is appropriate",
      "Separates CNI enforcement from policy YAML",
      "Preserves evidence before mutation"
    ],
    "redFlags": [
      "Deletes Pods first",
      "Confuses Service and Ingress failures",
      "Assumes NetworkPolicy is enforced without checking CNI",
      "Restarts before collecting previous logs"
    ],
    "practiceTask": "Run a 20-minute mock incident: collect service, pod, event, and EndpointSlice evidence before proposing one reversible fix.",
    "questions": [
      {
        "id": 220,
        "question": "A live service returns intermittent 503s. What is your first five-minute evidence path?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 221,
        "question": "When would you use kubectl debug with an ephemeral container instead of exec?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 222,
        "question": "A NetworkPolicy was applied but traffic still flows. What do you verify before editing YAML?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 223,
        "question": "How do you avoid losing evidence before restarting a CrashLooping workload?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 224,
        "question": "A Pod is healthy but the Service has no ready backends. Walk the object chain.",
        "difficulty": "easy",
        "practiced": false
      },
      {
        "id": 225,
        "question": "What should a live troubleshooting answer include before proposing mutation?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 226,
        "question": "How do you prove whether a failure belongs to app code, config, image registry, CNI, or platform?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 24,
    "slug": "eks-identity-access-2026",
    "title": "2026 EKS Identity and Access Loop",
    "domain": "EKS",
    "level": "Advanced",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "Amazon EKS Pod Identity",
      "EKS Access Entries",
      "EKS Add-on Pod Identity"
    ],
    "relatedLabs": [
      "IRSA AccessDenied investigation",
      "EKS add-on upgrade runbook"
    ],
    "strongSignals": [
      "Scopes IAM to service accounts",
      "Mentions Pod Identity agent and IMDS caveats",
      "Separates IAM auth from Kubernetes authorization",
      "Accounts for eventual consistency",
      "Validates with CloudTrail and pod environment"
    ],
    "redFlags": [
      "Gives cluster-admin broadly",
      "Treats containers as a hard security boundary",
      "Ignores hostNetwork IMDS access",
      "Creates access changes in a hot path"
    ],
    "practiceTask": "Design an EKS identity evidence note for a pod that can list S3 buckets in dev but fails in staging.",
    "questions": [
      {
        "id": 227,
        "question": "How would you explain EKS Pod Identity to a team currently using node instance roles?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 228,
        "question": "A pod still gets AccessDenied after a Pod Identity association. What do you inspect?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 229,
        "question": "How do EKS access entries interact with Kubernetes RBAC groups and access policies?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 230,
        "question": "What risks remain if a pod uses hostNetwork while Pod Identity is configured?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 231,
        "question": "How would you migrate from aws-auth ConfigMap habits to access entries safely?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 232,
        "question": "What evidence proves an EKS add-on is using the intended IAM role?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 233,
        "question": "Where can eventual consistency bite you in EKS identity automation?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 25,
    "slug": "gitops-drift-helm-argocd-2026",
    "title": "2026 GitOps Drift and Helm/ArgoCD Loop",
    "domain": "Helm / ArgoCD",
    "level": "Intermediate",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "Argo CD FAQ",
      "Helm Chart Development Tips",
      "Helm Cheat Sheet"
    ],
    "relatedLabs": [
      "ArgoCD Application Deployment",
      "Helm Chart Authoring"
    ],
    "strongSignals": [
      "Treats Git as source of truth",
      "Understands Helm as templating under Argo CD",
      "Investigates normalized resource diffs",
      "Uses sync and health separately",
      "Knows polling versus webhooks"
    ],
    "redFlags": [
      "Runs helm upgrade behind Argo CD",
      "Ignores generated manifests",
      "Disables diff without explaining why",
      "Confuses healthy with synced"
    ],
    "practiceTask": "Take one Argo CD OutOfSync example and write a diff triage note with source, generated manifest, live state, and fix owner.",
    "questions": [
      {
        "id": 234,
        "question": "An Argo CD app is OutOfSync immediately after sync. What are plausible causes?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 235,
        "question": "Why might helm ls not show an app deployed by Argo CD from a Helm chart?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 236,
        "question": "How do you troubleshoot an Argo CD cluster connection failure?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 237,
        "question": "When do you use a diff customization, and what evidence keeps it from hiding real drift?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 238,
        "question": "How would you structure Helm values so dev and prod differ safely?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 239,
        "question": "What should a production chart lint/review gate catch before merge?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 240,
        "question": "How do polling and webhooks affect GitOps reconciliation expectations?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 26,
    "slug": "observability-slo-otel-2026",
    "title": "2026 Observability, SLO, and OpenTelemetry Loop",
    "domain": "Observability",
    "level": "Advanced",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "Google SRE Monitoring Distributed Systems",
      "OpenTelemetry Getting Started for Developers",
      "Prometheus Alerting Rules"
    ],
    "relatedLabs": [
      "Build a Golden Signals Dashboard",
      "Prometheus Alertmanager Routing"
    ],
    "strongSignals": [
      "Uses user-facing SLOs",
      "Separates symptoms from causes",
      "Names latency traffic errors saturation",
      "Connects traces metrics and logs",
      "Tunes pages around actionability"
    ],
    "redFlags": [
      "Alerts on every CPU spike",
      "No user impact model",
      "Treats dashboards as incident response",
      "Cannot explain cardinality risk"
    ],
    "practiceTask": "Build one alert review table: signal, SLO impact, owner, runbook, silence rule, and dashboard link.",
    "questions": [
      {
        "id": 241,
        "question": "Which golden signal would page you first for a checkout API, and why?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 242,
        "question": "How do you turn noisy metrics into an actionable SLO alert?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 243,
        "question": "Where do traces help when metrics already show high latency?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 244,
        "question": "How would you instrument a service with OpenTelemetry without blocking delivery?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 245,
        "question": "What does saturation mean for Kubernetes workloads and nodes?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 246,
        "question": "How do you prevent high-cardinality labels from hurting Prometheus?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 247,
        "question": "What belongs in an incident dashboard versus a long-term capacity dashboard?",
        "difficulty": "easy",
        "practiced": false
      }
    ]
  },
  {
    "id": 27,
    "slug": "terraform-platform-delivery-2026",
    "title": "2026 Terraform Platform Delivery Loop",
    "domain": "Terraform",
    "level": "Advanced",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "Terraform Developer Documentation",
      "Terraform Style Guide",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Terraform EKS Infrastructure",
      "Drift detection and plan review"
    ],
    "strongSignals": [
      "Reviews plan before apply",
      "Understands state and locking",
      "Designs modules around ownership boundaries",
      "Handles import and drift deliberately",
      "Keeps secrets out of state where possible"
    ],
    "redFlags": [
      "Applies from laptop without review",
      "Edits state casually",
      "Overmodules everything",
      "Cannot explain blast radius"
    ],
    "practiceTask": "Write a plan-review checklist for an EKS module change that touches node groups, IAM, networking, and add-ons.",
    "questions": [
      {
        "id": 248,
        "question": "What makes a Terraform plan safe enough to apply in production?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 249,
        "question": "How do you handle drift discovered outside the normal pipeline?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 250,
        "question": "When would you import existing infrastructure instead of recreating it?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 251,
        "question": "How do you design modules that are reusable without hiding critical decisions?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 252,
        "question": "What should be locked, reviewed, or policy-checked before apply?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 253,
        "question": "How do secrets end up in state, and what do you do about it?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 254,
        "question": "How would you build preview environments without letting cost run away?",
        "difficulty": "medium",
        "practiced": false
      }
    ]
  },
  {
    "id": 28,
    "slug": "platform-product-loop-2026",
    "title": "2026 Platform Product Interview Loop",
    "domain": "Platform Engineering",
    "level": "Advanced",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "CNCF Platform Engineering Maturity Model",
      "CNCF Platforms White Paper",
      "AWS Well-Architected Framework"
    ],
    "relatedLabs": [
      "Internal developer platform golden path",
      "Production readiness review"
    ],
    "strongSignals": [
      "Talks to internal users",
      "Measures adoption and friction",
      "Balances paved roads with escape hatches",
      "Defines service ownership",
      "Treats platform as a product"
    ],
    "redFlags": [
      "Builds tools before discovery",
      "Mandates one path for every team",
      "No success metrics",
      "Ignores migration support"
    ],
    "practiceTask": "Draft a one-page platform feature brief with target team, current friction, golden path, guardrails, and adoption metric.",
    "questions": [
      {
        "id": 255,
        "question": "How do you decide whether a platform team should build a new golden path?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 256,
        "question": "What metrics prove an internal platform is helping instead of adding process?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 257,
        "question": "How do you handle a team that needs an exception to the paved road?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 258,
        "question": "What should be self-service, and what should remain reviewed by humans?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 259,
        "question": "How do you collect developer feedback without turning every request into a feature?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 260,
        "question": "How would you roll out a new deployment template across many teams?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 261,
        "question": "What is the difference between platform reliability and application reliability ownership?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  },
  {
    "id": 29,
    "slug": "kubernetes-security-admission-2026",
    "title": "2026 Kubernetes Security Admission Loop",
    "domain": "Security",
    "level": "Advanced",
    "questionCount": 7,
    "duration": 35,
    "docsToRead": [
      "Kubernetes Pod Security Admission",
      "Kubernetes Security Checklist",
      "Kubernetes Security Context"
    ],
    "relatedLabs": [
      "Review Kubernetes YAML before apply",
      "Cloud Security Posture"
    ],
    "strongSignals": [
      "Uses namespace-level PSA modes",
      "Knows baseline versus restricted",
      "Reviews workload templates early",
      "Limits RBAC verbs",
      "Understands seccomp and runtime user"
    ],
    "redFlags": [
      "Uses privileged containers casually",
      "Gives create pods without admission controls",
      "Runs latest tags in production",
      "Ignores namespace labels"
    ],
    "practiceTask": "Review a manifest for root user, privileged mode, hostPath, RBAC verbs, image tag, and namespace Pod Security labels.",
    "questions": [
      {
        "id": 262,
        "question": "How would you roll out Pod Security Admission without breaking every team?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 263,
        "question": "What is the difference between warn, audit, and enforce modes?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 264,
        "question": "Why is create pods a sensitive RBAC permission even if the user cannot SSH to nodes?",
        "difficulty": "hard",
        "practiced": false
      },
      {
        "id": 265,
        "question": "What securityContext fields do you look for in a production workload review?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 266,
        "question": "How do memory limits and requests relate to security and node stability?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 267,
        "question": "What evidence would make you block a vendor manifest before apply?",
        "difficulty": "medium",
        "practiced": false
      },
      {
        "id": 268,
        "question": "How do you pair Pod Security Standards with external admission policy?",
        "difficulty": "hard",
        "practiced": false
      }
    ]
  }
];

export const lessonDetails: LessonDetail[] = [
  {
    "id": 1,
    "courseId": 1,
    "courseSlug": "platform-kubernetes-fundamentals",
    "courseTitle": "Kubernetes Fundamentals",
    "courseTrack": "Kubernetes",
    "level": "Fresher",
    "title": "Containers, Images, and Pods",
    "summary": "Understand the unit Kubernetes actually runs and why images should be immutable.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.525,
    "body": "## Plain-English model\nA container image is a packaged filesystem plus a startup command. A container is a running instance of that image. Kubernetes does not schedule a bare container; it schedules a Pod. A Pod is a small wrapper around one or more containers that share networking and lifecycle.\n- Build images once and promote the same image through environments.\n- Put environment differences in configuration, not in a different hand-built image.\n- Treat Pods as disposable. If a Pod dies, the controller creates a replacement.\n- Use one main application container per Pod unless sidecars solve a clear shared lifecycle problem.\n\n## Local-safe inspection\n$ kubectl get pods -A\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl get pod POD_NAME -n NAMESPACE -o yaml\nInspect the image, command, args, restart count, service account, labels, and events. If you do not have a cluster, read a sample Pod manifest and identify the same fields.\n\n## Common mistakes\nBeginners often debug by editing a live Pod. That change disappears because a Deployment owns the Pod template. Change the controller or chart instead.",
    "practiceNotes": "Scenario: A teammate says \"the container is broken\" after a Pod restarts.\nChecklist:\n- Confirm the image name and tag or digest.\n- Read restart count and Last State in the Pod description.\n- Check whether a Deployment, Job, or StatefulSet owns the Pod.\n- Decide whether the fix belongs in the image, manifest, or runtime config.\nCommands:\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl get pod POD_NAME -n NAMESPACE -o jsonpath='{.metadata.ownerReferences}'",
    "terms": [
      {
        "term": "Image",
        "def": "An immutable package that contains application code, filesystem layers, and startup metadata."
      },
      {
        "term": "Container",
        "def": "A running process created from an image with isolated filesystem, process, and network settings."
      },
      {
        "term": "Pod",
        "def": "The smallest schedulable Kubernetes object, usually wrapping one application container."
      },
      {
        "term": "Sidecar",
        "def": "A helper container that shares the Pod lifecycle, such as a proxy or log shipper."
      },
      {
        "term": "Restart count",
        "def": "The number of times kubelet restarted a container inside the Pod."
      }
    ],
    "flashcards": [
      {
        "q": "What is the difference between an image and a container?",
        "a": "An image is the package; a container is a running instance of that package."
      },
      {
        "q": "Why should you avoid editing an owned Pod directly?",
        "a": "The controller will recreate Pods from its template and your live edit will not become durable."
      },
      {
        "q": "What should you inspect first after a Pod restart?",
        "a": "Describe the Pod and check Last State, restart count, events, and logs."
      }
    ]
  },
  {
    "id": 2,
    "courseId": 1,
    "courseSlug": "platform-kubernetes-fundamentals",
    "courseTitle": "Kubernetes Fundamentals",
    "courseTrack": "Kubernetes",
    "level": "Fresher",
    "title": "Deployments, ReplicaSets, and Rollouts",
    "summary": "Learn how Kubernetes keeps the desired number of application Pods running.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.291666666666668,
    "body": "## Controller chain\nA Deployment owns ReplicaSets, and ReplicaSets own Pods. You normally change the Deployment. Kubernetes creates a new ReplicaSet when the Pod template changes, then gradually shifts Pods during a rollout.\n- Desired replicas means how many Pods should exist.\n- Available replicas means how many are ready enough to serve traffic.\n- Rollouts can pause, fail, or get stuck if Pods cannot become Ready.\n- Rollback uses Deployment revision history, but it cannot undo database or external state changes.\n\n## Inspection commands\n$ kubectl get deploy,rs,pods -n payments -l app=checkout\n$ kubectl describe deploy checkout -n payments\n$ kubectl rollout status deploy/checkout -n payments\n$ kubectl rollout history deploy/checkout -n payments\nLook for desired/current/ready counts, old ReplicaSets still serving Pods, unavailable replicas, and rollout events.\n\n## Beginner production habit\nBefore changing replicas or images, ask what will happen to traffic and whether the application can run two versions at the same time.",
    "practiceNotes": "Scenario: A new image was released but users still hit the old version.\nChecklist:\n- Confirm the Deployment image changed.\n- Compare new and old ReplicaSet Pod counts.\n- Check whether new Pods are Ready.\n- Read rollout events before changing random fields.\nCommands:\n$ kubectl describe deploy checkout -n payments\n$ kubectl get rs -n payments -l app=checkout\n$ kubectl rollout status deploy/checkout -n payments",
    "terms": [
      {
        "term": "Deployment",
        "def": "A controller that manages rollout history and ReplicaSets for stateless workloads."
      },
      {
        "term": "ReplicaSet",
        "def": "A controller that keeps a matching set of Pods at the requested replica count."
      },
      {
        "term": "Rollout",
        "def": "The process of moving from one Pod template revision to another."
      },
      {
        "term": "Available replicas",
        "def": "The count of Pods that are ready and available according to Deployment rules."
      },
      {
        "term": "Rollback",
        "def": "Returning a Deployment to an earlier Pod template revision."
      }
    ],
    "flashcards": [
      {
        "q": "What object should you normally update for a stateless app release?",
        "a": "The Deployment, because it owns the rollout and Pod template."
      },
      {
        "q": "What does kubectl rollout status tell you?",
        "a": "Whether the Deployment rollout has completed, is progressing, or is stuck."
      },
      {
        "q": "Why is rollback not a complete time machine?",
        "a": "It changes Kubernetes objects, but external state like databases may not roll back."
      }
    ]
  },
  {
    "id": 3,
    "courseId": 1,
    "courseSlug": "platform-kubernetes-fundamentals",
    "courseTitle": "Kubernetes Fundamentals",
    "courseTrack": "Kubernetes",
    "level": "Fresher",
    "title": "Services, Labels, Selectors, and Namespaces",
    "summary": "Connect stable traffic names to replaceable Pods using labels and selectors.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.316666666666666,
    "body": "## Traffic contract\nPods come and go, so applications should not call Pod IPs directly. A Service gives a stable virtual endpoint and selects Ready Pods by label. Namespaces give a boundary for names, RBAC, quotas, and team ownership.\n- Labels are key-value metadata used by Services, dashboards, alerts, and automation.\n- Selectors must match the labels on the Pods you intend to receive traffic.\n- A Service with no endpoints is usually a selector or readiness problem.\n- Namespaces are not a hard security boundary by themselves, but they are the starting point for tenancy.\n\n## Inspection commands\n$ kubectl get svc,endpointslice -n payments\n$ kubectl get pods -n payments --show-labels\n$ kubectl describe svc checkout -n payments\n$ kubectl get all -n payments -l app=checkout\nLook for selector mismatch, no ready endpoint addresses, wrong namespace, and inconsistent app labels.\n\n## Failure mode\nChanging Deployment labels without updating a Service selector can route traffic to zero Pods.",
    "practiceNotes": "Scenario: Checkout returns 503 after a label cleanup.\nChecklist:\n- Read the Service selector.\n- Read Pod labels from the current ReplicaSet.\n- Confirm EndpointSlices contain ready Pod IPs.\n- Fix the selector or labels in the source manifest, not only live state.\nCommands:\n$ kubectl describe svc checkout -n payments\n$ kubectl get pods -n payments -l app=checkout --show-labels\n$ kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout",
    "terms": [
      {
        "term": "Service",
        "def": "A stable Kubernetes endpoint that selects ready Pods by label."
      },
      {
        "term": "Label",
        "def": "A key-value pair used for grouping, selecting, and organizing objects."
      },
      {
        "term": "Selector",
        "def": "A rule that matches labels on target objects."
      },
      {
        "term": "EndpointSlice",
        "def": "The object showing which Pod IPs currently back a Service."
      },
      {
        "term": "Namespace",
        "def": "A named scope for Kubernetes objects, policies, and team boundaries."
      }
    ],
    "flashcards": [
      {
        "q": "What connects a Service to Pods?",
        "a": "The Service selector matches labels on Ready Pods."
      },
      {
        "q": "What should you check when a Service has no endpoints?",
        "a": "Selector, Pod labels, Pod readiness, and EndpointSlices in the same namespace."
      },
      {
        "q": "Why do namespaces matter for beginners?",
        "a": "They scope names and become the place for RBAC, quotas, and team ownership."
      }
    ]
  },
  {
    "id": 4,
    "courseId": 1,
    "courseSlug": "platform-kubernetes-fundamentals",
    "courseTitle": "Kubernetes Fundamentals",
    "courseTrack": "Kubernetes",
    "level": "Fresher",
    "title": "Config, Secrets, Requests, and Probes",
    "summary": "Learn the basic knobs that make workloads configurable, schedulable, and safe to receive traffic.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.15,
    "body": "## Runtime contract\nKubernetes separates image, configuration, scheduling needs, and health checks. Beginners should learn these early because many incidents come from missing or confused settings.\n- ConfigMaps hold non-sensitive configuration.\n- Secrets hold sensitive values but still need RBAC, encryption at rest, and rotation.\n- Resource requests tell the scheduler what CPU and memory the Pod needs.\n- Readiness controls traffic. Liveness controls restart. Startup protects slow boot.\n\n## Inspection commands\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl get cm,secret -n payments\n$ kubectl top pod -n payments\n$ kubectl get events -n payments --sort-by=.lastTimestamp\nLook for missing config keys, wrong secret names, Pending Pods due to insufficient resources, failed readiness probes, and OOMKilled restarts.\n\n## Tradeoff\nLiveness probes should be conservative. A bad liveness probe can turn a slow dependency into a restart storm.",
    "practiceNotes": "Scenario: Pods start but never receive traffic.\nChecklist:\n- Read readiness probe failures in Pod events.\n- Check application logs for missing config.\n- Confirm requests fit available node capacity.\n- Do not loosen probes until you know whether the app can serve users.\nCommands:\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl logs checkout-abc123 -n payments --since=10m",
    "terms": [
      {
        "term": "ConfigMap",
        "def": "A Kubernetes object for non-sensitive runtime configuration."
      },
      {
        "term": "Secret",
        "def": "A Kubernetes object for sensitive values that still needs access control and rotation."
      },
      {
        "term": "Request",
        "def": "The CPU or memory amount used by the scheduler to place a Pod."
      },
      {
        "term": "Readiness probe",
        "def": "A check that decides whether a Pod should receive Service traffic."
      },
      {
        "term": "Liveness probe",
        "def": "A check that restarts a container when restart is likely to help."
      }
    ],
    "flashcards": [
      {
        "q": "What is the difference between readiness and liveness?",
        "a": "Readiness controls traffic; liveness controls restarts."
      },
      {
        "q": "Are Kubernetes Secrets automatically a complete security solution?",
        "a": "No. They still need RBAC, encryption at rest, audit, and rotation."
      },
      {
        "q": "Why do resource requests matter?",
        "a": "The scheduler uses requests to place Pods on nodes with enough capacity."
      }
    ]
  },
  {
    "id": 5,
    "courseId": 2,
    "courseSlug": "platform-kubectl-debugging-basics",
    "courseTitle": "kubectl Debugging Basics",
    "courseTrack": "kubectl",
    "level": "Fresher",
    "title": "The Read-Only First Response Loop",
    "summary": "Use get, describe, logs, and events before making changes.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.091666666666665,
    "body": "## Debugging loop\nGood Kubernetes debugging starts with observation. The safe loop is: list the object, describe the object, read logs, inspect events, then form a hypothesis.\n- `kubectl get` shows current state and names.\n- `kubectl describe` shows status, events, mounts, probes, and scheduling details.\n- `kubectl logs` shows application output.\n- Events explain what Kubernetes attempted and why it failed.\n\n## Commands to practice\n$ kubectl get pods -n payments -o wide\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl logs checkout-abc123 -n payments --since=15m\n$ kubectl get events -n payments --sort-by=.lastTimestamp\nCapture evidence before deleting Pods or restarting Deployments. Restarts can destroy useful previous logs.\n\n## Signal to inspect\nLook for Status, Ready, Restarts, Last State, Events, node placement, image name, service account, and volume mount failures.",
    "practiceNotes": "Scenario: An app is unhealthy and someone wants to restart it immediately.\nChecklist:\n- Save `describe pod` output.\n- Save recent and previous logs if restarts happened.\n- Save namespace events sorted by time.\n- Only restart after you understand whether restart is a mitigation or evidence loss.\nCommands:\n$ kubectl logs checkout-abc123 -n payments --previous\n$ kubectl get events -n payments --sort-by=.lastTimestamp",
    "terms": [
      {
        "term": "kubectl get",
        "def": "Shows object names and high-level status."
      },
      {
        "term": "kubectl describe",
        "def": "Shows detailed object state and events."
      },
      {
        "term": "Event",
        "def": "A Kubernetes record explaining scheduling, pulling, probing, or controller activity."
      },
      {
        "term": "Previous logs",
        "def": "Logs from a previously terminated container instance."
      },
      {
        "term": "Read-only diagnosis",
        "def": "Collecting evidence before making mutating changes."
      }
    ],
    "flashcards": [
      {
        "q": "What four commands form the beginner debug loop?",
        "a": "get, describe, logs, and get events."
      },
      {
        "q": "Why collect previous logs before restarting?",
        "a": "The evidence from the crashed container may disappear after another restart."
      },
      {
        "q": "What do Kubernetes events usually explain?",
        "a": "Scheduling, image pulls, volume mounts, probe failures, and controller actions."
      }
    ]
  },
  {
    "id": 6,
    "courseId": 2,
    "courseSlug": "platform-kubectl-debugging-basics",
    "courseTitle": "kubectl Debugging Basics",
    "courseTrack": "kubectl",
    "level": "Fresher",
    "title": "CrashLoopBackOff and ImagePullBackOff",
    "summary": "Separate application crashes from image pull and registry problems.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.1,
    "body": "## Two different failures\nCrashLoopBackOff means the container starts and exits repeatedly. ImagePullBackOff means kubelet cannot pull the image before the container starts. Treat them differently.\n- CrashLoopBackOff: read previous logs, exit code, command, config, and probes.\n- ImagePullBackOff: inspect image name, tag, registry auth, pull secret, and network reachability.\n- ErrImagePull often appears before ImagePullBackOff.\n- A private registry usually needs an imagePullSecret or node-level registry access.\n\n## Inspection commands\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl logs checkout-abc123 -n payments --previous\n$ kubectl get secret regcred -n payments\n$ kubectl get pod checkout-abc123 -n payments -o jsonpath='{.spec.imagePullSecrets}'\nLook for `Back-off pulling image`, `unauthorized`, `not found`, nonzero exit codes, and missing environment variables.\n\n## Common mistake\nDo not fix CrashLoopBackOff by increasing replicas. You will create more broken Pods.",
    "practiceNotes": "Scenario: New Pods show ImagePullBackOff after moving to a private registry.\nChecklist:\n- Confirm the exact image reference exists.\n- Check the namespace has the expected image pull secret.\n- Check the Pod references the secret through service account or imagePullSecrets.\n- Read events for unauthorized, not found, or timeout.\nCommands:\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl get sa default -n payments -o yaml",
    "terms": [
      {
        "term": "CrashLoopBackOff",
        "def": "Repeated container exits with increasing restart delay."
      },
      {
        "term": "ImagePullBackOff",
        "def": "A repeated failure to pull the configured image."
      },
      {
        "term": "ErrImagePull",
        "def": "The initial image pull error before backoff increases."
      },
      {
        "term": "imagePullSecret",
        "def": "A secret used by kubelet to authenticate to a container registry."
      },
      {
        "term": "Exit code",
        "def": "The process status code that helps explain why a container stopped."
      }
    ],
    "flashcards": [
      {
        "q": "How do CrashLoopBackOff and ImagePullBackOff differ?",
        "a": "CrashLoopBackOff starts then crashes; ImagePullBackOff cannot pull the image."
      },
      {
        "q": "What is the first log command for CrashLoopBackOff?",
        "a": "kubectl logs POD --previous."
      },
      {
        "q": "What should you inspect for ImagePullBackOff?",
        "a": "Image name, tag, registry auth, pull secret, and events."
      }
    ]
  },
  {
    "id": 7,
    "courseId": 2,
    "courseSlug": "platform-kubectl-debugging-basics",
    "courseTitle": "kubectl Debugging Basics",
    "courseTrack": "kubectl",
    "level": "Fresher",
    "title": "Pending Pods, Scheduling, and Node Pressure",
    "summary": "Read scheduler messages instead of guessing why a Pod will not start.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.291666666666668,
    "body": "## Pending means not placed or not ready to start\nA Pending Pod may be unscheduled, waiting for volumes, blocked by image pulls, or constrained by node selectors, taints, or resource requests. The scheduler tells you a lot in events.\n- Insufficient CPU or memory means requests do not fit current nodes.\n- Untolerated taint means the Pod is not allowed on matching nodes.\n- Node selector or affinity can make the Pod too picky.\n- PVC binding can block stateful Pods before the container starts.\n\n## Inspection commands\n$ kubectl describe pod pending-pod -n payments\n$ kubectl get nodes\n$ kubectl describe node NODE_NAME\n$ kubectl get pvc -n payments\nLook for `0/3 nodes are available`, taints, node affinity, volume binding, and whether cluster autoscaler or Karpenter is expected to add capacity.\n\n## Tradeoff\nReducing requests may make the Pod schedule, but it can also hide real capacity needs and cause runtime saturation later.",
    "practiceNotes": "Scenario: A deployment rollout is stuck because new Pods stay Pending.\nChecklist:\n- Read the exact scheduler event message.\n- Compare Pod requests with allocatable node capacity.\n- Check taints, tolerations, node selectors, and PVCs.\n- Decide whether to scale capacity or correct workload constraints.\nCommands:\n$ kubectl describe pod pending-pod -n payments\n$ kubectl get nodes -o wide",
    "terms": [
      {
        "term": "Pending",
        "def": "A Pod phase before all containers are running and ready."
      },
      {
        "term": "Taint",
        "def": "A node marker that repels Pods without a matching toleration."
      },
      {
        "term": "Toleration",
        "def": "A Pod setting that allows scheduling onto nodes with matching taints."
      },
      {
        "term": "Node selector",
        "def": "A simple label-based requirement for node placement."
      },
      {
        "term": "PVC",
        "def": "A PersistentVolumeClaim requesting storage for a Pod."
      }
    ],
    "flashcards": [
      {
        "q": "Where do you find scheduler reasons for Pending Pods?",
        "a": "In `kubectl describe pod` events."
      },
      {
        "q": "What does insufficient memory usually compare?",
        "a": "Pod memory requests against allocatable node memory."
      },
      {
        "q": "Why not simply lower resource requests to schedule?",
        "a": "It can hide real capacity needs and create runtime saturation."
      }
    ]
  },
  {
    "id": 8,
    "courseId": 2,
    "courseSlug": "platform-kubectl-debugging-basics",
    "courseTitle": "kubectl Debugging Basics",
    "courseTrack": "kubectl",
    "level": "Fresher",
    "title": "Exec, Port Forward, and Probe Debugging",
    "summary": "Use interactive commands carefully and know when they are diagnostic only.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.316666666666666,
    "body": "## Interactive tools\n`kubectl exec` and `kubectl port-forward` are useful diagnostics, but they should not become the normal production operating model. Use them to confirm facts, then fix manifests, code, config, or automation.\n- Exec can check files, env, DNS lookup, and local process state inside a container.\n- Port-forward can test a Pod or Service without exposing it publicly.\n- Readiness probe failures usually mean no traffic should flow to that Pod.\n- Liveness probe failures should restart only when restart helps.\n\n## Commands to practice\n$ kubectl exec -n payments deploy/checkout -- printenv\n$ kubectl exec -n payments deploy/checkout -- nslookup payments-db\n$ kubectl port-forward -n payments svc/checkout 8080:80\n$ kubectl describe pod checkout-abc123 -n payments\nLook for probe path, port, initial delay, timeouts, DNS, config, and whether the app listens on the expected interface.\n\n## Safety note\nAvoid mutating files inside a running container as a \"fix.\" It will disappear on restart and bypass review.",
    "practiceNotes": "Scenario: Readiness probes fail after a port rename.\nChecklist:\n- Confirm the container port and probe port match.\n- Exec a local curl or wget only if the image has those tools.\n- Read app logs for bind address and startup errors.\n- Fix the manifest or chart values after confirming the mismatch.\nCommands:\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl get deploy checkout -n payments -o yaml",
    "terms": [
      {
        "term": "kubectl exec",
        "def": "Runs a command inside a container for diagnosis."
      },
      {
        "term": "Port forward",
        "def": "Forwards a local port to a Pod or Service for temporary testing."
      },
      {
        "term": "Probe timeout",
        "def": "The time Kubernetes waits for a probe response before marking it failed."
      },
      {
        "term": "Bind address",
        "def": "The address and port an application listens on inside the container."
      },
      {
        "term": "Diagnostic action",
        "def": "A temporary check used to confirm facts, not a durable fix."
      }
    ],
    "flashcards": [
      {
        "q": "When should exec be used?",
        "a": "For diagnosis, such as checking env, DNS, files, or process state."
      },
      {
        "q": "Why is editing a running container a bad fix?",
        "a": "It disappears on restart and bypasses code or manifest review."
      },
      {
        "q": "What should you compare for probe failures?",
        "a": "Probe path, port, timeout, startup time, app bind address, and logs."
      }
    ]
  },
  {
    "id": 9,
    "courseId": 3,
    "courseSlug": "platform-cloud-native-foundations",
    "courseTitle": "Cloud Native Foundations",
    "courseTrack": "Cloud Native",
    "level": "Fresher",
    "title": "Docker Images, Tags, Digests, and Registries",
    "summary": "Learn how application artifacts move from laptop to cluster.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.108333333333334,
    "body": "## Artifact path\nMost Kubernetes releases start with an image pushed to a registry. Tags are human-friendly labels. Digests are content addresses. Production systems should know exactly which image content they are running.\n- A tag like `1.4.2` can be moved unless your registry prevents it.\n- A digest identifies immutable content.\n- Registries need authentication, retention, scanning, and promotion rules.\n- Use multi-stage builds to reduce runtime image size and attack surface.\n\n## Local-safe commands\n$ docker build -t checkout:local .\n$ docker image inspect checkout:local\n$ docker tag checkout:local registry.example.com/checkout:1.4.2\n$ docker image ls\nDo not push to a real registry unless you own it. For learning, inspect Dockerfiles and image metadata locally.\n\n## Production tradeoff\nFloating tags make demos fast but make incident review painful. Digests make rollout evidence stronger.",
    "practiceNotes": "Scenario: Production and staging both say they run `latest`, but behavior differs.\nChecklist:\n- Compare image digests, not only tags.\n- Check who can retag or overwrite images.\n- Confirm the deployment record stores the digest or immutable version.\n- Decide whether promotion should copy images or promote references.\nCommands:\n$ docker image inspect checkout:local --format '{{json .RepoDigests}}'",
    "terms": [
      {
        "term": "Registry",
        "def": "A service that stores and serves container images."
      },
      {
        "term": "Tag",
        "def": "A human-friendly image reference that can point to different content over time."
      },
      {
        "term": "Digest",
        "def": "A content-addressed image identifier such as sha256."
      },
      {
        "term": "Multi-stage build",
        "def": "A build pattern that separates build tooling from the final runtime image."
      },
      {
        "term": "Artifact promotion",
        "def": "Moving a reviewed artifact through environments without rebuilding it."
      }
    ],
    "flashcards": [
      {
        "q": "Why are digests stronger evidence than tags?",
        "a": "A digest identifies exact content; a tag can be moved unless protected."
      },
      {
        "q": "What is a registry?",
        "a": "A service that stores and serves container images."
      },
      {
        "q": "Why use multi-stage builds?",
        "a": "To keep build tools out of the runtime image and reduce size and attack surface."
      }
    ]
  },
  {
    "id": 10,
    "courseId": 3,
    "courseSlug": "platform-cloud-native-foundations",
    "courseTitle": "Cloud Native Foundations",
    "courseTrack": "Cloud Native",
    "level": "Fresher",
    "title": "YAML, Manifests, and kubectl Dry Runs",
    "summary": "Read Kubernetes YAML safely and validate intent before mutation.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.075,
    "body": "## Manifest basics\nKubernetes YAML usually has apiVersion, kind, metadata, spec, and sometimes status when read from the cluster. You write desired state in spec; Kubernetes writes observed state in status.\n- Indentation matters.\n- Lists and maps are different shapes; read them carefully.\n- Use dry-run and diff before applying unfamiliar YAML.\n- Generated manifests from Helm or Kustomize should be reviewed before cluster changes.\n\n## Local-safe commands\n$ kubectl apply --dry-run=client -f manifest.yaml\n$ kubectl diff -f manifest.yaml\n$ kubectl explain deployment.spec.template.spec.containers\n$ kubectl create deployment demo --image=nginx --dry-run=client -o yaml\nIf you do not have a cluster, client dry-run and `kubectl explain` still teach object shape.\n\n## Common failure mode\nCopying YAML from a blog can create resources in the wrong namespace or with unsafe permissions.",
    "practiceNotes": "Scenario: You receive a 400-line manifest from a vendor.\nChecklist:\n- Identify every kind and namespace.\n- Search for ClusterRole, hostPath, privileged, LoadBalancer, and Secret.\n- Run client dry-run and schema validation if tools are available.\n- Ask what each cluster-scoped permission is for.\nCommands:\n$ kubectl apply --dry-run=client -f vendor.yaml\n$ grep -n \"kind:\\|namespace:\\|ClusterRole\\|privileged\\|hostPath\" vendor.yaml",
    "terms": [
      {
        "term": "Manifest",
        "def": "A YAML or JSON document describing Kubernetes resources."
      },
      {
        "term": "apiVersion",
        "def": "The API group and version used by a resource."
      },
      {
        "term": "kind",
        "def": "The Kubernetes resource type, such as Deployment or Service."
      },
      {
        "term": "spec",
        "def": "The part of an object where users declare what they want."
      },
      {
        "term": "status",
        "def": "The part of an object where controllers report what happened."
      }
    ],
    "flashcards": [
      {
        "q": "What fields appear in most Kubernetes manifests?",
        "a": "apiVersion, kind, metadata, and spec."
      },
      {
        "q": "Why use dry-run?",
        "a": "To validate or preview a change without persisting it."
      },
      {
        "q": "What should you inspect in vendor YAML?",
        "a": "Kinds, namespaces, cluster-scoped permissions, privileged settings, volumes, services, and secrets."
      }
    ]
  },
  {
    "id": 11,
    "courseId": 3,
    "courseSlug": "platform-cloud-native-foundations",
    "courseTitle": "Cloud Native Foundations",
    "courseTrack": "Cloud Native",
    "level": "Fresher",
    "title": "Config, Secrets, and Environment Promotion",
    "summary": "Separate what changes per environment from the application artifact.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.108333333333334,
    "body": "## Promotion model\nThe same app version should be able to run in dev, stage, and prod with environment-specific configuration. That does not mean every setting is safe to change casually.\n- Non-sensitive values can live in ConfigMaps or values files.\n- Sensitive values need a secret strategy, not plaintext Git commits.\n- Environment variables are simple but often require restart to update.\n- Mounted config can update, but the application must reload safely.\n\n## Inspection commands\n$ kubectl get configmap,secret -n payments\n$ kubectl describe pod checkout-abc123 -n payments\n$ kubectl rollout history deploy/checkout -n payments\nLook for missing keys, wrong namespace, stale Pod templates, and whether config changes caused a rollout.\n\n## Production tradeoff\nPutting config outside the image helps promotion, but too many unreviewed config switches can make releases unpredictable.",
    "practiceNotes": "Scenario: Staging points to the wrong payment sandbox.\nChecklist:\n- Locate the value source: values file, ConfigMap, Secret, or external provider.\n- Confirm the Pod actually received the current value.\n- Check whether a restart is required.\n- Add review around environment-specific overrides.\nCommands:\n$ kubectl get cm checkout-config -n payments -o yaml\n$ kubectl describe pod checkout-abc123 -n payments",
    "terms": [
      {
        "term": "Environment promotion",
        "def": "Moving the same application artifact across dev, stage, and prod."
      },
      {
        "term": "Override",
        "def": "An environment-specific value layered over defaults."
      },
      {
        "term": "Plaintext secret",
        "def": "A sensitive value stored unencrypted in source control or logs."
      },
      {
        "term": "Reload",
        "def": "An application updating config without a full restart."
      },
      {
        "term": "Rollout restart",
        "def": "A command that refreshes Pods from the current Deployment template."
      }
    ],
    "flashcards": [
      {
        "q": "Why keep environment config outside images?",
        "a": "The same artifact can be promoted while environment-specific values are reviewed separately."
      },
      {
        "q": "Why are plaintext secrets in Git risky?",
        "a": "They spread to history, clones, logs, and backups and are hard to rotate completely."
      },
      {
        "q": "What should you check after changing a ConfigMap?",
        "a": "Whether Pods received it and whether the app needs restart or reload."
      }
    ]
  },
  {
    "id": 12,
    "courseId": 3,
    "courseSlug": "platform-cloud-native-foundations",
    "courseTitle": "Cloud Native Foundations",
    "courseTrack": "Cloud Native",
    "level": "Fresher",
    "title": "Basic Networking and Resource Requests",
    "summary": "Build the mental model for ports, DNS, CPU, memory, and scheduling.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.15,
    "body": "## Network and capacity basics\nPods get IP addresses, Services provide stable names, and DNS lets apps call services by name. Requests describe the CPU and memory the scheduler should reserve for a Pod.\n- Container ports document what the app listens on.\n- Service ports define how other clients reach selected Pods.\n- Kubernetes DNS usually resolves `service.namespace.svc.cluster.local`.\n- CPU is compressible; memory is not. Memory pressure can kill containers.\n\n## Inspection commands\n$ kubectl get svc -A\n$ kubectl exec -n payments deploy/checkout -- nslookup payments-db\n$ kubectl top pod -n payments\n$ kubectl describe node NODE_NAME\nLook for wrong ports, DNS names, missing endpoints, CPU throttling symptoms, OOMKilled, and node pressure.\n\n## Beginner tradeoff\nTiny requests can pack many Pods onto a node but produce noisy neighbors. Huge requests can strand capacity and increase cost.",
    "practiceNotes": "Scenario: Checkout cannot reach the database Service.\nChecklist:\n- Confirm the Service exists in the expected namespace.\n- Confirm it has endpoints.\n- Confirm the application uses the right port and DNS name.\n- Check NetworkPolicy only after Service and endpoints make sense.\nCommands:\n$ kubectl get svc,endpointslice -n data\n$ kubectl exec -n payments deploy/checkout -- nslookup postgres.data.svc.cluster.local",
    "terms": [
      {
        "term": "Service DNS",
        "def": "The cluster DNS name clients use to reach a Service."
      },
      {
        "term": "Container port",
        "def": "The port an application listens on inside a container."
      },
      {
        "term": "Service port",
        "def": "The port exposed by a Service to clients."
      },
      {
        "term": "OOMKilled",
        "def": "A container termination caused by exceeding memory limits."
      },
      {
        "term": "Node pressure",
        "def": "A node condition showing resource stress such as memory, disk, or PID pressure."
      }
    ],
    "flashcards": [
      {
        "q": "What does a Service provide?",
        "a": "A stable virtual endpoint and DNS name for selected ready Pods."
      },
      {
        "q": "Why is memory different from CPU?",
        "a": "CPU can throttle; memory exhaustion can kill the container."
      },
      {
        "q": "What is the cost tradeoff of oversized requests?",
        "a": "They reserve capacity that may sit idle and increase node cost."
      }
    ]
  },
  {
    "id": 13,
    "courseId": 4,
    "courseSlug": "platform-eks-operations",
    "courseTitle": "EKS Operations",
    "courseTrack": "EKS",
    "level": "Intermediate",
    "title": "VPC CNI and IP Exhaustion",
    "summary": "Understand why Pod IPs consume subnet capacity on common EKS clusters.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.208333333333332,
    "body": "## EKS networking reality\nWith the Amazon VPC CNI, Pods commonly receive VPC-routable IP addresses. This makes routing feel AWS-native, but subnet sizing becomes a platform constraint.\n- Pod scale consumes subnet IPs, not just node IPs.\n- Warm IP or prefix settings influence how many IPs nodes reserve.\n- IP exhaustion can look like Pending Pods or CNI allocation errors.\n- Prefix delegation can improve Pod density but should be modeled before launch.\n\n## Inspection commands\n$ kubectl -n kube-system get ds aws-node\n$ kubectl -n kube-system logs ds/aws-node -c aws-node --since=20m\n$ kubectl describe pod pending-pod -n payments\n$ aws eks describe-cluster --name prod-platform --query 'cluster.resourcesVpcConfig'\nTreat AWS commands as design/inspection examples; this repo does not require AWS credentials.\n\n## Tradeoff\nLarge subnets reduce IP pressure but expand blast radius and planning mistakes. Secondary CIDRs add capacity but require routing and governance review.",
    "practiceNotes": "Scenario: Scale-out fails during a sale and Pods stay Pending.\nChecklist:\n- Read scheduler events and CNI logs.\n- Compare available subnet IPs with expected Pod growth.\n- Check max Pods per node for instance type and CNI mode.\n- Decide whether the fix is node count, subnet capacity, prefix delegation, or architecture.\nCommands:\n$ kubectl describe pod pending-pod -n payments\n$ kubectl -n kube-system logs ds/aws-node -c aws-node --since=15m",
    "terms": [
      {
        "term": "Amazon VPC CNI",
        "def": "The EKS networking plugin that assigns VPC IP addresses to Pods."
      },
      {
        "term": "Subnet capacity",
        "def": "Available IP addresses for nodes and Pods in a subnet."
      },
      {
        "term": "Prefix delegation",
        "def": "A VPC CNI mode that assigns IP prefixes to network interfaces."
      },
      {
        "term": "aws-node",
        "def": "The VPC CNI DaemonSet running on EKS worker nodes."
      },
      {
        "term": "Warm IP",
        "def": "Reserved IP capacity kept ready on a node for faster Pod startup."
      }
    ],
    "flashcards": [
      {
        "q": "Why does subnet sizing matter for EKS Pods?",
        "a": "The VPC CNI commonly assigns VPC IPs to Pods, consuming subnet addresses."
      },
      {
        "q": "What can IP exhaustion look like?",
        "a": "Pending Pods with CNI allocation errors in events or aws-node logs."
      },
      {
        "q": "What is prefix delegation used for?",
        "a": "Increasing Pod IP density per node by assigning prefixes to ENIs."
      }
    ]
  },
  {
    "id": 14,
    "courseId": 4,
    "courseSlug": "platform-eks-operations",
    "courseTitle": "EKS Operations",
    "courseTrack": "EKS",
    "level": "Intermediate",
    "title": "Managed Node Groups, Fargate, and Workload Fit",
    "summary": "Choose capacity models based on operations, isolation, and workload constraints.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.225,
    "body": "## Capacity choices\nEKS can run Pods on EC2 nodes, managed node groups, self-managed nodes, Karpenter-provisioned nodes, or Fargate profiles. Intermediate operators should know the fit, not just the names.\n- Managed node groups are a conservative default for EC2 worker lifecycle.\n- Fargate reduces node management but has constraints around DaemonSets, storage, and observability patterns.\n- EC2 nodes give more control over instance types, DaemonSets, and performance tuning.\n- Separate system and application capacity with labels, taints, and tolerations.\n\n## Inspection commands\n$ kubectl get nodes -L eks.amazonaws.com/nodegroup,topology.kubernetes.io/zone\n$ kubectl describe node NODE_NAME\n$ kubectl get pods -A -o wide --field-selector spec.nodeName=NODE_NAME\n$ kubectl get taint nodes\nLook for system Pods on risky capacity, single-AZ concentration, incompatible DaemonSets, and workloads scheduled onto the wrong node group.\n\n## Tradeoff\nFargate can reduce node toil, but EC2 nodes are often better for DaemonSet-heavy platforms and fine-grained cost control.",
    "practiceNotes": "Scenario: A logging agent never appears on Fargate-backed Pods.\nChecklist:\n- Confirm whether the workload is scheduled on Fargate or EC2 nodes.\n- Check whether the logging design depends on a node DaemonSet.\n- Choose sidecar, app-level logging, or EC2 node capacity for that workload.\n- Document the workload placement rule.\nCommands:\n$ kubectl get pod app-pod -n payments -o wide\n$ kubectl get ds -A",
    "terms": [
      {
        "term": "Managed node group",
        "def": "An AWS-managed EC2 node group integrated with EKS lifecycle operations."
      },
      {
        "term": "Fargate profile",
        "def": "A rule that schedules matching EKS Pods onto AWS Fargate."
      },
      {
        "term": "DaemonSet",
        "def": "A controller that runs one Pod on each selected node."
      },
      {
        "term": "Taint",
        "def": "A node marker that repels Pods without matching tolerations."
      },
      {
        "term": "Workload fit",
        "def": "Matching runtime needs to the right capacity model."
      }
    ],
    "flashcards": [
      {
        "q": "When are managed node groups a safe default?",
        "a": "For predictable EC2 capacity with AWS-managed lifecycle operations."
      },
      {
        "q": "Why can Fargate conflict with DaemonSet-based tooling?",
        "a": "Fargate does not expose normal worker nodes for DaemonSets in the same way EC2 does."
      },
      {
        "q": "How do you separate system and app capacity?",
        "a": "Use labels, taints, tolerations, namespaces, and scheduling policy."
      }
    ]
  },
  {
    "id": 15,
    "courseId": 4,
    "courseSlug": "platform-eks-operations",
    "courseTitle": "EKS Operations",
    "courseTrack": "EKS",
    "level": "Intermediate",
    "title": "IRSA, OIDC, and Controller Permissions",
    "summary": "Give AWS permissions to the right service account instead of every Pod.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.3,
    "body": "## Workload identity\nThe node IAM role should not be the permission source for every application. IAM Roles for Service Accounts (IRSA) uses the cluster OIDC issuer and projected service account tokens so a workload can assume a scoped IAM role.\n- Bind AWS permissions to a namespace and service account.\n- Restrict trust policies to the exact service account subject.\n- Review controllers carefully: ALB controller, ExternalDNS, cert-manager, autoscalers, and secret controllers often need AWS permissions.\n- Block or restrict node metadata fallback where possible.\n\n## Inspection commands\n$ kubectl get sa -n kube-system aws-load-balancer-controller -o yaml\n$ kubectl describe pod -n kube-system deploy/aws-load-balancer-controller\n$ aws iam get-role --role-name eks-alb-controller\n$ aws iam get-policy-version --policy-arn POLICY_ARN --version-id v1\nAWS commands are inspection examples; do not add real credentials for this local project.\n\n## Failure mode\nIf a trust policy uses broad wildcards, another service account may be able to assume permissions intended for one controller.",
    "practiceNotes": "Scenario: ExternalDNS can update more Route 53 zones than intended.\nChecklist:\n- Identify its Kubernetes service account.\n- Inspect the IAM role trust policy and permission policy.\n- Scope hosted zone permissions where possible.\n- Confirm Pods cannot silently use the node role.\nCommands:\n$ kubectl get deploy -n external-dns external-dns -o jsonpath='{.spec.template.spec.serviceAccountName}'\n$ kubectl get sa -n external-dns external-dns -o yaml",
    "terms": [
      {
        "term": "IRSA",
        "def": "IAM Roles for Service Accounts, a way to scope AWS permissions to Kubernetes service accounts."
      },
      {
        "term": "OIDC issuer",
        "def": "The identity provider EKS uses for service account token federation with IAM."
      },
      {
        "term": "Trust policy",
        "def": "The IAM policy that defines who can assume a role."
      },
      {
        "term": "Service account",
        "def": "The identity attached to Pods for Kubernetes and cloud access patterns."
      },
      {
        "term": "IMDS",
        "def": "The EC2 metadata service that can expose node role credentials if not restricted."
      }
    ],
    "flashcards": [
      {
        "q": "What should an IRSA trust policy constrain?",
        "a": "The OIDC issuer and service account subject, including namespace and name."
      },
      {
        "q": "Why avoid using the node role for app permissions?",
        "a": "A compromised Pod may gain broad node-level AWS permissions."
      },
      {
        "q": "Name two controllers that often need AWS IAM.",
        "a": "AWS Load Balancer Controller, ExternalDNS, cert-manager, External Secrets, or Karpenter."
      }
    ]
  },
  {
    "id": 16,
    "courseId": 4,
    "courseSlug": "platform-eks-operations",
    "courseTitle": "EKS Operations",
    "courseTrack": "EKS",
    "level": "Intermediate",
    "title": "Add-ons and AWS Load Balancer Controller",
    "summary": "Operate cluster add-ons as versioned platform components.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.166666666666668,
    "body": "## Add-on operating model\nEKS add-ons are not background magic. They are production components with versions, permissions, alerts, and upgrade plans.\n- Core add-ons include VPC CNI, CoreDNS, kube-proxy, and CSI drivers.\n- Common platform controllers include AWS Load Balancer Controller, ExternalDNS, cert-manager, metrics-server, and External Secrets.\n- ALB controller behavior depends on Ingress annotations, subnets, security groups, and target type.\n- Upgrade add-ons deliberately and read release notes before changing cluster versions.\n\n## Inspection commands\n$ kubectl get pods -n kube-system\n$ kubectl describe ingress checkout -n payments\n$ kubectl -n kube-system logs deploy/aws-load-balancer-controller --since=20m\n$ kubectl get ingressclass\nLook for controller events, bad annotations, missing IAM permissions, subnets not tagged for discovery, and unhealthy targets.\n\n## Tradeoff\nAutomating ALB creation improves developer speed but can create cost, security group, and public exposure risks if annotations are not governed.",
    "practiceNotes": "Scenario: An Ingress exists but no ALB appears.\nChecklist:\n- Confirm the IngressClass matches the controller.\n- Read Ingress events and controller logs.\n- Check subnet discovery tags and controller IAM permissions.\n- Confirm desired scheme, target type, and security group behavior.\nCommands:\n$ kubectl describe ingress checkout -n payments\n$ kubectl -n kube-system logs deploy/aws-load-balancer-controller --since=15m",
    "terms": [
      {
        "term": "Add-on",
        "def": "A versioned component that extends or supports cluster behavior."
      },
      {
        "term": "AWS Load Balancer Controller",
        "def": "A controller that creates AWS load balancers from Kubernetes resources."
      },
      {
        "term": "IngressClass",
        "def": "A resource that selects which controller should handle an Ingress."
      },
      {
        "term": "Target type",
        "def": "Whether load balancer targets are instance nodes or Pod IPs."
      },
      {
        "term": "Subnet discovery",
        "def": "The tag-based process controllers use to find eligible subnets."
      }
    ],
    "flashcards": [
      {
        "q": "Why treat add-ons as production components?",
        "a": "They have versions, permissions, failure modes, and upgrade risk."
      },
      {
        "q": "What should you inspect when ALB creation fails?",
        "a": "IngressClass, events, controller logs, subnet tags, IAM permissions, and annotations."
      },
      {
        "q": "What is a risk of self-service ALB annotations?",
        "a": "Developers may accidentally create public, expensive, or insecure load balancers."
      }
    ]
  },
  {
    "id": 17,
    "courseId": 5,
    "courseSlug": "platform-helm-application-delivery",
    "courseTitle": "Helm for Application Delivery",
    "courseTrack": "Helm",
    "level": "Intermediate",
    "title": "Chart Anatomy and Values as an API",
    "summary": "Design values files so teams can change intent without editing templates.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.05,
    "body": "## Chart contract\nA Helm chart is a packaging format and a small API. `values.yaml` is the input surface, templates are implementation, and rendered manifests are the release artifact.\n- Keep values names stable and meaningful.\n- Put normal environment differences in values, not template forks.\n- Keep helper templates for labels and names consistent.\n- Avoid clever templates that hide what Kubernetes will receive.\n\n## Commands\n$ helm lint charts/checkout\n$ helm template checkout charts/checkout -f values/dev.yaml\n$ helm show values charts/checkout\n$ helm dependency build charts/checkout\nInspect rendered labels, selectors, names, resource requests, probes, and service ports. The render is what reviewers should understand.\n\n## Tradeoff\nGeneric charts can reduce duplication, but overly flexible charts become hard to reason about and hard to secure.",
    "practiceNotes": "Scenario: A team asks for one chart to deploy every kind of workload.\nChecklist:\n- Identify the stable app contract: image, ports, resources, env, probes, service, ingress.\n- Keep rare features explicit and documented.\n- Render representative values before accepting the chart API.\n- Add required checks for values with no safe default.\nCommands:\n$ helm template checkout charts/checkout -f values/stage.yaml --debug",
    "terms": [
      {
        "term": "Chart",
        "def": "A package containing templates, defaults, metadata, and dependencies."
      },
      {
        "term": "values.yaml",
        "def": "The default input values consumed by Helm templates."
      },
      {
        "term": "Template",
        "def": "A file that produces Kubernetes YAML using values and functions."
      },
      {
        "term": "_helpers.tpl",
        "def": "A common place for reusable template snippets like names and labels."
      },
      {
        "term": "helm template",
        "def": "A command that renders manifests locally without installing them."
      }
    ],
    "flashcards": [
      {
        "q": "Why treat values as an API?",
        "a": "Other teams depend on value names and behavior for releases."
      },
      {
        "q": "What should reviewers inspect?",
        "a": "The rendered manifests, especially labels, selectors, resources, probes, and permissions."
      },
      {
        "q": "Why can overly generic charts be risky?",
        "a": "They hide behavior, make validation harder, and create unclear ownership."
      }
    ]
  },
  {
    "id": 18,
    "courseId": 5,
    "courseSlug": "platform-helm-application-delivery",
    "courseTitle": "Helm for Application Delivery",
    "courseTrack": "Helm",
    "level": "Intermediate",
    "title": "Values Layering, Templates, and Helpers",
    "summary": "Manage dev, stage, and prod differences without drifting releases.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.066666666666666,
    "body": "## Layering model\nHelm merges values from defaults and `-f` files. The order matters: later files override earlier files. This is powerful and dangerous if teams do not know which value wins.\n- Use a small base and explicit environment overlays.\n- Keep production overrides reviewed.\n- Use helpers for stable labels and selector fields.\n- Quote strings deliberately to avoid YAML type surprises.\n\n## Commands\n$ helm template checkout charts/checkout -f values/base.yaml -f values/prod.yaml > rendered.yaml\n$ helm lint charts/checkout\n$ grep -n \"app.kubernetes.io\" rendered.yaml\n$ helm template checkout charts/checkout --set image.tag=1.4.2\nLook for selector drift, null values, wrong environment secrets, and type coercion such as `on` becoming boolean.\n\n## Tradeoff\n`--set` is convenient in CI, but large release intent is usually clearer in reviewed values files.",
    "practiceNotes": "Scenario: Prod accidentally uses stage database settings.\nChecklist:\n- Print the exact values stack used by CI.\n- Render with base plus prod overlays locally.\n- Search rendered manifests for stage hostnames and secret names.\n- Add a values schema or required guard for high-risk settings.\nCommands:\n$ helm template checkout charts/checkout -f values/base.yaml -f values/prod.yaml --debug",
    "terms": [
      {
        "term": "Values layering",
        "def": "Merging multiple values sources where later values override earlier ones."
      },
      {
        "term": "Override",
        "def": "A value that replaces a default or base setting."
      },
      {
        "term": "YAML coercion",
        "def": "YAML interpreting unquoted strings as booleans, numbers, or null."
      },
      {
        "term": "Selector label",
        "def": "A label used by controllers and Services to match Pods."
      },
      {
        "term": "values schema",
        "def": "A JSON schema that validates Helm values before rendering or install."
      }
    ],
    "flashcards": [
      {
        "q": "Why does values file order matter?",
        "a": "Later values files override earlier ones."
      },
      {
        "q": "Where should stable labels usually live?",
        "a": "In helper templates used consistently across resources."
      },
      {
        "q": "Why quote strings in templates?",
        "a": "To avoid YAML interpreting strings as booleans, numbers, or null."
      }
    ]
  },
  {
    "id": 19,
    "courseId": 5,
    "courseSlug": "platform-helm-application-delivery",
    "courseTitle": "Helm for Application Delivery",
    "courseTrack": "Helm",
    "level": "Intermediate",
    "title": "Lint, Template, Diff, and Upgrade Safety",
    "summary": "Catch bad manifests and risky changes before the cluster sees them.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.125,
    "body": "## Release review flow\nIntermediate Helm work is about the upgrade path, not only fresh installs. A chart can render and still fail because Kubernetes rejects immutable field changes or because the change is operationally risky.\n- Run lint for chart structure.\n- Render every supported environment.\n- Diff against live or previous rendered manifests.\n- Validate schema and policy on the rendered output.\n- Watch selectors, CRDs, generated secrets, hooks, and resource deletion.\n\n## Commands\n$ helm lint charts/checkout\n$ helm template checkout charts/checkout -f values/prod.yaml > rendered.yaml\n$ helm diff upgrade checkout charts/checkout -n payments -f values/prod.yaml\n$ kubectl apply --dry-run=server -f rendered.yaml\nServer dry-run requires a cluster; use it only against safe local or approved environments.\n\n## Failure mode\nChanging Deployment selectors is not a normal upgrade. It needs a migration plan.",
    "practiceNotes": "Scenario: A chart upgrade changes selector labels.\nChecklist:\n- Compare old and new rendered selectors.\n- Preserve immutable labels where possible.\n- If identity must change, plan a new Deployment name and traffic migration.\n- Document rollback limits.\nCommands:\n$ helm get manifest checkout -n payments > old.yaml\n$ helm template checkout charts/checkout -f values/prod.yaml > new.yaml\n$ diff -u old.yaml new.yaml | grep -A4 -B4 selector",
    "terms": [
      {
        "term": "helm lint",
        "def": "A command that checks chart structure and common template issues."
      },
      {
        "term": "helm diff",
        "def": "A plugin workflow comparing intended changes with live release state."
      },
      {
        "term": "Server dry-run",
        "def": "A Kubernetes API validation mode that does not persist objects."
      },
      {
        "term": "Immutable field",
        "def": "A field Kubernetes does not allow to change in place."
      },
      {
        "term": "Release history",
        "def": "Stored Helm release revisions used for status and rollback."
      }
    ],
    "flashcards": [
      {
        "q": "Why test upgrades, not only installs?",
        "a": "Real production releases change live objects with existing state and immutable fields."
      },
      {
        "q": "What is dangerous about selector changes?",
        "a": "They can be immutable and can disconnect Services or controllers from Pods."
      },
      {
        "q": "Why validate rendered YAML?",
        "a": "Every validator sees the exact manifests intended for release."
      }
    ]
  },
  {
    "id": 20,
    "courseId": 5,
    "courseSlug": "platform-helm-application-delivery",
    "courseTitle": "Helm for Application Delivery",
    "courseTrack": "Helm",
    "level": "Intermediate",
    "title": "Rollbacks, Hooks, CRDs, and Supply Chain Checks",
    "summary": "Know what Helm can recover and what needs a separate operational plan.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.141666666666666,
    "body": "## Beyond basic upgrade\nHelm stores release history and can roll back a release, but rollback is not magic. External systems, data migrations, CRDs, and generated credentials may not return to a prior state.\n- Hooks run lifecycle Jobs but need cleanup policy and failure handling.\n- CRDs are cluster APIs and should have explicit ownership.\n- Third-party chart dependencies can introduce broad RBAC or privileged Pods.\n- Pin chart versions and review provenance when possible.\n\n## Commands\n$ helm history checkout -n payments\n$ helm status checkout -n payments\n$ helm rollback checkout REVISION -n payments\n$ helm dependency list charts/checkout\n$ grep -n \"ClusterRole\\|privileged\\|hostPath\" rendered.yaml\nUse rollback commands as practice syntax unless you are in an approved local cluster.\n\n## Tradeoff\nPutting CRDs inside app charts is convenient for demos but risky for shared platforms.",
    "practiceNotes": "Scenario: A vendor chart requests cluster-admin.\nChecklist:\n- Render the chart with your exact values.\n- Inspect ClusterRole and ClusterRoleBinding resources.\n- Ask whether the controller truly needs cluster scope.\n- Prefer narrower values, an internal fork, or an exception record with owner and review date.\nCommands:\n$ helm template vendor charts/vendor -f values/prod.yaml > rendered.yaml\n$ grep -n \"cluster-admin\\|ClusterRole\\|privileged\\|hostPath\" rendered.yaml",
    "terms": [
      {
        "term": "Helm hook",
        "def": "An annotated resource that runs during Helm release phases."
      },
      {
        "term": "CRD",
        "def": "A CustomResourceDefinition that extends the Kubernetes API."
      },
      {
        "term": "helm rollback",
        "def": "A command that returns a release to a previous revision where possible."
      },
      {
        "term": "Chart dependency",
        "def": "A chart pulled from another package or repository."
      },
      {
        "term": "Provenance",
        "def": "Metadata and signatures used to verify chart origin."
      }
    ],
    "flashcards": [
      {
        "q": "Why is rollback limited?",
        "a": "External state, migrations, CRDs, and generated secrets may not return to old state."
      },
      {
        "q": "Why are CRDs special?",
        "a": "They define cluster-wide APIs with lifecycle risk beyond one app release."
      },
      {
        "q": "What should you review in third-party charts?",
        "a": "RBAC, privileged settings, dependencies, generated secrets, and provenance."
      }
    ]
  },
  {
    "id": 21,
    "courseId": 6,
    "courseSlug": "platform-argocd-gitops",
    "courseTitle": "ArgoCD GitOps",
    "courseTrack": "ArgoCD",
    "level": "Intermediate",
    "title": "Git as Desired State and Application Basics",
    "summary": "Understand what ArgoCD compares and why Git ownership matters.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.025,
    "body": "## GitOps model\nArgoCD compares desired state in Git with live state in the cluster. An Application points to a source repo/path and a destination cluster/namespace.\n- Desired state should be reviewable in Git.\n- Live UI edits can drift from Git and be overwritten.\n- Application status separates sync state and health state.\n- A production change should map back to a commit, image digest, or chart version.\n\n## Inspection commands\n$ argocd app list\n$ argocd app get checkout-dev\n$ argocd app diff checkout-dev\n$ kubectl get applications -n argocd\nUse ArgoCD commands as learning examples; this repo does not require an ArgoCD server.\n\n## Tradeoff\nGitOps increases auditability, but a bad commit can still automate a bad production change quickly.",
    "practiceNotes": "Scenario: A Deployment was changed manually during an incident.\nChecklist:\n- Diff live state against Git.\n- Decide whether the manual change is still needed.\n- Commit the desired recovery or let ArgoCD self-heal it away.\n- Record why UI-only changes are temporary.\nCommands:\n$ argocd app diff checkout-prod\n$ kubectl get deploy checkout -n payments -o yaml",
    "terms": [
      {
        "term": "Application",
        "def": "An ArgoCD resource pointing desired manifests to a destination."
      },
      {
        "term": "Desired state",
        "def": "The configuration ArgoCD should apply from Git or another source."
      },
      {
        "term": "Live state",
        "def": "The resources currently existing in the cluster."
      },
      {
        "term": "OutOfSync",
        "def": "A state where live resources differ from desired state."
      },
      {
        "term": "Health",
        "def": "ArgoCD's assessment of whether managed resources are operational."
      }
    ],
    "flashcards": [
      {
        "q": "What does ArgoCD compare?",
        "a": "Desired state from source with live cluster state."
      },
      {
        "q": "Why avoid UI-only production changes?",
        "a": "They bypass Git review and may be overwritten by sync or self-heal."
      },
      {
        "q": "What two states should you read in ArgoCD?",
        "a": "Sync state and health state."
      }
    ]
  },
  {
    "id": 22,
    "courseId": 6,
    "courseSlug": "platform-argocd-gitops",
    "courseTitle": "ArgoCD GitOps",
    "courseTrack": "ArgoCD",
    "level": "Intermediate",
    "title": "App-of-Apps and AppProject Boundaries",
    "summary": "Bootstrap multiple apps without giving every team cluster-wide power.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.116666666666667,
    "body": "## Boundary design\nApp-of-apps uses a parent Application to manage child Application resources. It is useful for bootstrap, but it becomes a root of trust. AppProjects define which repos, destinations, and resource kinds an app may use.\n- Use AppProjects to restrict source repos and namespaces.\n- Separate platform apps from tenant apps.\n- Avoid wildcard permissions unless the blast radius is intentional.\n- Keep the bootstrap repo protected and reviewed.\n\n## Inspection commands\n$ kubectl get appproject -n argocd\n$ kubectl get appproject tenant-a -n argocd -o yaml\n$ kubectl get applications -n argocd\n$ argocd app get platform-root\nLook for wildcard destinations, cluster-scoped resources in tenant projects, and parent apps that can create anything anywhere.\n\n## Failure mode\nA tenant project that allows ClusterRole and all namespaces is effectively a platform-admin path.",
    "practiceNotes": "Scenario: A tenant app needs a ClusterRole for one feature.\nChecklist:\n- Confirm whether the feature truly needs cluster scope.\n- Move cluster-scoped resources to a platform-owned app if possible.\n- Restrict AppProject allowed kinds and destinations.\n- Add a review checklist for boundary exceptions.\nCommands:\n$ kubectl get appproject tenant-a -n argocd -o yaml",
    "terms": [
      {
        "term": "App-of-apps",
        "def": "A parent Application that manages child Applications."
      },
      {
        "term": "AppProject",
        "def": "An ArgoCD resource restricting sources, destinations, and resource permissions."
      },
      {
        "term": "Destination",
        "def": "The cluster and namespace where ArgoCD applies resources."
      },
      {
        "term": "Cluster resource",
        "def": "A resource not limited to one namespace, such as ClusterRole or CRD."
      },
      {
        "term": "Root of trust",
        "def": "A source with broad authority over platform state."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main risk of app-of-apps?",
        "a": "The parent app can become a broad root of trust."
      },
      {
        "q": "What does an AppProject restrict?",
        "a": "Source repos, destinations, and allowed resource kinds."
      },
      {
        "q": "Why separate platform and tenant apps?",
        "a": "They have different ownership, permissions, and blast radius."
      }
    ]
  },
  {
    "id": 23,
    "courseId": 6,
    "courseSlug": "platform-argocd-gitops",
    "courseTitle": "ArgoCD GitOps",
    "courseTrack": "ArgoCD",
    "level": "Intermediate",
    "title": "Sync Waves, Pruning, Self-Heal, and Drift",
    "summary": "Control apply order and decide which differences matter.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.941666666666666,
    "body": "## Sync behavior\nArgoCD sync applies desired resources. Waves and phases control order, which matters for CRDs, controllers, migrations, and workloads.\n- Sync waves order resources with annotations.\n- Pruning deletes resources removed from Git.\n- Self-heal reverts live drift back to desired state.\n- ignoreDifferences can hide expected controller-managed fields, but broad ignores hide real drift.\n\n## Inspection commands\n$ argocd app diff checkout-prod\n$ argocd app sync checkout-prod --preview-changes\n$ argocd app history checkout-prod\n$ kubectl describe application checkout-prod -n argocd\nLook for pending waves, unhealthy dependencies, prune candidates, ignored fields, and manual changes.\n\n## Tradeoff\nAuto-sync is powerful for low-risk environments, but production needs clear prune, self-heal, and approval expectations.",
    "practiceNotes": "Scenario: ArgoCD reports drift because an HPA changes replicas.\nChecklist:\n- Identify the exact field causing drift.\n- Decide whether Git or a controller owns that field.\n- If ignoring, scope ignoreDifferences to group, kind, name, and field.\n- Document the ownership decision near the Application manifest.\nCommands:\n$ argocd app diff checkout-prod\n$ kubectl get hpa,deploy -n payments checkout -o yaml",
    "terms": [
      {
        "term": "Sync wave",
        "def": "An annotation-based mechanism for ordering sync operations."
      },
      {
        "term": "Pruning",
        "def": "Deleting live resources removed from desired state."
      },
      {
        "term": "Self-heal",
        "def": "Automatically correcting live changes back to Git."
      },
      {
        "term": "ignoreDifferences",
        "def": "A scoped setting that ignores specific live-vs-desired differences."
      },
      {
        "term": "Auto-sync",
        "def": "A policy where ArgoCD syncs changes without manual approval."
      }
    ],
    "flashcards": [
      {
        "q": "Why do sync waves matter?",
        "a": "They ensure dependencies such as CRDs and controllers exist before dependent resources."
      },
      {
        "q": "What is the danger of pruning?",
        "a": "It can delete shared, stateful, or manually migrated resources if Git removes them."
      },
      {
        "q": "Why should ignoreDifferences be narrow?",
        "a": "Broad ignores can hide real production drift."
      }
    ]
  },
  {
    "id": 24,
    "courseId": 6,
    "courseSlug": "platform-argocd-gitops",
    "courseTitle": "ArgoCD GitOps",
    "courseTrack": "ArgoCD",
    "level": "Intermediate",
    "title": "Secrets, Environments, and Rollback Reality",
    "summary": "Promote changes through Git while keeping secrets and recovery honest.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.125,
    "body": "## Promotion and secrets\nGitOps makes release intent visible, but it does not make plaintext secrets acceptable or rollback automatic. A production promotion should show what changed, which environment values changed, and how recovery works.\n- Do not commit plaintext secrets.\n- Use External Secrets, Sealed Secrets, SOPS, or another documented pattern.\n- Promote the same image digest or chart version when possible.\n- Rollback may mean reverting Git, syncing a prior chart version, or disabling a feature flag.\n\n## Inspection commands\n$ git diff main..release/prod -- environments/prod\n$ argocd app history checkout-prod\n$ kubectl get externalsecret,sealedsecret -A\n$ argocd app rollback checkout-prod REVISION\nTreat rollback commands as syntax practice unless you operate an approved local ArgoCD instance.\n\n## Failure mode\nIf auto-sync remains enabled during manual rollback, ArgoCD may reapply the bad desired state.",
    "practiceNotes": "Scenario: A production sync introduced bad config.\nChecklist:\n- Identify whether the change was image, config, chart, CRD, or data.\n- Pause auto-sync if needed.\n- Prefer reverting the Git change so desired state matches recovery.\n- Note rollback limits for database or external state.\nCommands:\n$ argocd app history checkout-prod\n$ git log --oneline -- environments/prod/checkout",
    "terms": [
      {
        "term": "ExternalSecret",
        "def": "A resource that syncs values from an external secret provider."
      },
      {
        "term": "SealedSecret",
        "def": "An encrypted secret manifest decryptable by a cluster controller."
      },
      {
        "term": "SOPS",
        "def": "A tool for encrypting selected fields in files stored in Git."
      },
      {
        "term": "Promotion",
        "def": "Moving reviewed artifact and configuration through environments."
      },
      {
        "term": "Rollback",
        "def": "Returning service behavior to a known-good state while respecting external state."
      }
    ],
    "flashcards": [
      {
        "q": "Name three GitOps secret patterns.",
        "a": "External Secrets, Sealed Secrets, and SOPS-encrypted files."
      },
      {
        "q": "Why is reverting Git often the clean rollback?",
        "a": "It keeps Git as desired state so ArgoCD does not fight recovery."
      },
      {
        "q": "What can make rollback unsafe?",
        "a": "Database migrations, external state, CRDs, and generated credentials."
      }
    ]
  },
  {
    "id": 25,
    "courseId": 7,
    "courseSlug": "platform-production-eks-architecture",
    "courseTitle": "Production EKS Architecture",
    "courseTrack": "EKS",
    "level": "Advanced",
    "title": "Private Clusters, Endpoints, and Access Paths",
    "summary": "Defend how operators and automation reach the EKS API.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.166666666666668,
    "body": "## Access design\nEKS control plane endpoint settings shape how operators, CI, and incident responders reach the Kubernetes API. Public endpoints are convenient. Private or restricted endpoints reduce exposure but require planned network access.\n- Private worker nodes should be the default for production unless a strong reason exists.\n- Restrict public endpoint CIDRs if public access remains enabled.\n- Private endpoints require VPN, Direct Connect, bastion, or runners inside the VPC.\n- Break-glass access should be documented and tested before incidents.\n\n## Inspection commands\n$ aws eks describe-cluster --name prod-platform --query 'cluster.resourcesVpcConfig'\n$ kubectl config current-context\n$ kubectl auth can-i get pods -A\n$ kubectl get endpoints -n default kubernetes\nAWS commands are design examples only in this local project.\n\n## Tradeoff\nPrivate-only endpoints reduce internet exposure but can block responders if access paths or identity mappings are broken.",
    "practiceNotes": "Scenario: CI cannot deploy after the cluster endpoint was made private.\nChecklist:\n- Identify where CI runners live.\n- Confirm routing and DNS to the private endpoint.\n- Confirm IAM/Kubernetes auth mapping still works.\n- Document a break-glass access path and test it locally where possible.\nCommands:\n$ aws eks describe-cluster --name prod-platform --query 'cluster.endpoint'\n$ kubectl auth can-i create deployments -n payments",
    "terms": [
      {
        "term": "Private endpoint",
        "def": "An EKS API endpoint reachable from the VPC instead of the public internet."
      },
      {
        "term": "Public access CIDR",
        "def": "CIDR ranges allowed to reach a public EKS endpoint."
      },
      {
        "term": "Break-glass",
        "def": "A controlled emergency access path for incidents."
      },
      {
        "term": "Bastion",
        "def": "A controlled host used to reach private network resources."
      },
      {
        "term": "Auth mapping",
        "def": "The mapping between AWS identity and Kubernetes permissions."
      }
    ],
    "flashcards": [
      {
        "q": "What is the tradeoff of private EKS endpoints?",
        "a": "Lower exposure but higher need for reliable operator and automation network access."
      },
      {
        "q": "What should be tested before incidents?",
        "a": "Break-glass access, identity mapping, and network path to the API."
      },
      {
        "q": "Why restrict public endpoint CIDRs?",
        "a": "To reduce who can reach the control plane API over the internet."
      }
    ]
  },
  {
    "id": 26,
    "courseId": 7,
    "courseSlug": "platform-production-eks-architecture",
    "courseTitle": "Production EKS Architecture",
    "courseTrack": "EKS",
    "level": "Advanced",
    "title": "Karpenter, NodePools, and Disruption Budgets",
    "summary": "Use dynamic capacity without letting autoscaling surprise production.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.991666666666667,
    "body": "## Advanced capacity\nKarpenter can provision nodes quickly based on pending Pods and consolidate underused nodes. In production, it needs constraints, disruption policy, and observability.\n- Define allowed instance families, zones, capacity types, and limits.\n- Separate system workloads from dynamic application capacity.\n- Respect PodDisruptionBudgets and topology spread constraints.\n- Watch consolidation, expire-after, interruption handling, and Spot behavior.\n\n## Inspection commands\n$ kubectl get nodepool,nodeclaim\n$ kubectl get nodes -L karpenter.sh/nodepool,node.kubernetes.io/instance-type,topology.kubernetes.io/zone\n$ kubectl -n karpenter logs deploy/karpenter --since=30m\n$ kubectl get pdb -A\nLook for expensive oversized nodes, single-AZ placement, consolidation blocked by PDBs, and system Pods on risky capacity.\n\n## Tradeoff\nKarpenter improves right-sizing and speed, but unconstrained provisioning can increase cost or reduce availability during disruption.",
    "practiceNotes": "Scenario: Nodes scaled out for a batch job and never scaled in.\nChecklist:\n- Check whether Pods still request capacity.\n- Read Karpenter consolidation reasons.\n- Inspect PDBs and topology constraints.\n- Compare requested resources with actual usage.\nCommands:\n$ kubectl get nodes --show-labels\n$ kubectl get pdb -A\n$ kubectl -n karpenter logs deploy/karpenter --since=1h",
    "terms": [
      {
        "term": "Karpenter",
        "def": "A Kubernetes-native node provisioning controller."
      },
      {
        "term": "NodePool",
        "def": "A Karpenter object defining provisioning constraints and disruption policy."
      },
      {
        "term": "NodeClaim",
        "def": "A Karpenter object representing a requested node."
      },
      {
        "term": "Consolidation",
        "def": "Replacing or removing nodes to reduce waste while respecting constraints."
      },
      {
        "term": "PodDisruptionBudget",
        "def": "A policy limiting voluntary disruption for matching Pods."
      }
    ],
    "flashcards": [
      {
        "q": "What does Karpenter react to?",
        "a": "Pending Pods and scheduling requirements."
      },
      {
        "q": "What can block consolidation?",
        "a": "PDBs, topology constraints, required Pods, NodePool policy, or disruption settings."
      },
      {
        "q": "Why constrain NodePools?",
        "a": "To control cost, availability zones, instance choices, and workload isolation."
      }
    ]
  },
  {
    "id": 27,
    "courseId": 7,
    "courseSlug": "platform-production-eks-architecture",
    "courseTitle": "Production EKS Architecture",
    "courseTrack": "EKS",
    "level": "Advanced",
    "title": "Multi-AZ Design and Cost Guardrails",
    "summary": "Balance resilience, network cost, and capacity ownership.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.133333333333333,
    "body": "## Availability design\nMulti-AZ EKS design is more than placing nodes in three subnets. Workloads need topology spread, storage constraints, load balancer behavior, and failure-mode thinking.\n- Spread critical replicas across zones.\n- Know which storage is zonal and which services are regional.\n- Watch cross-AZ traffic and NAT Gateway data processing costs.\n- Use labels for team, service, environment, and cost center.\n- Track idle requested CPU/memory and orphaned cloud resources.\n\n## Inspection commands\n$ kubectl get pods -A -o wide\n$ kubectl get nodes -L topology.kubernetes.io/zone\n$ kubectl get pv,pvc -A\n$ kubectl get svc -A\nLook for all replicas in one zone, zonal volumes blocking reschedule, many LoadBalancer services, and idle requested resources.\n\n## Tradeoff\nMore zones can improve resilience, but they can expose cross-zone data transfer, storage attachment, and skewed capacity problems.",
    "practiceNotes": "Scenario: One AZ fails and a stateful app does not recover.\nChecklist:\n- Check whether replicas were spread across zones.\n- Identify whether storage was zonal.\n- Confirm PDBs and anti-affinity did not block recovery.\n- Decide whether the app needs regional storage, replicas, or documented manual recovery.\nCommands:\n$ kubectl get pods -n data -o wide\n$ kubectl get pv,pvc -n data",
    "terms": [
      {
        "term": "Topology spread",
        "def": "A constraint that spreads Pods across topology domains such as zones."
      },
      {
        "term": "Zonal storage",
        "def": "Storage that can attach only within one Availability Zone."
      },
      {
        "term": "Cross-AZ traffic",
        "def": "Network traffic crossing Availability Zones."
      },
      {
        "term": "Cost center label",
        "def": "A label used to attribute platform costs to owners."
      },
      {
        "term": "Idle request",
        "def": "Reserved CPU or memory that workloads request but do not use."
      }
    ],
    "flashcards": [
      {
        "q": "Why is multi-AZ more than subnet count?",
        "a": "Workload placement, storage scope, load balancing, and disruption policy also matter."
      },
      {
        "q": "Name two EKS cost guardrails.",
        "a": "Cost labels, idle request tracking, NAT data review, load balancer count, and orphaned volume cleanup."
      },
      {
        "q": "Why can zonal storage block recovery?",
        "a": "A volume may not attach to Pods rescheduled in another zone."
      }
    ]
  },
  {
    "id": 28,
    "courseId": 7,
    "courseSlug": "platform-production-eks-architecture",
    "courseTitle": "Production EKS Architecture",
    "courseTrack": "EKS",
    "level": "Advanced",
    "title": "Cluster Upgrades and Add-on Compatibility",
    "summary": "Plan upgrades as a compatibility project, not a button click.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.083333333333332,
    "body": "## Upgrade program\nProduction EKS upgrades touch Kubernetes API versions, managed control plane version, node versions, add-ons, controllers, CRDs, and client tooling. Advanced teams rehearse upgrades.\n- Inventory deprecated APIs before upgrading.\n- Upgrade add-ons in a supported order.\n- Roll node groups or Karpenter capacity carefully.\n- Test admission policies, controllers, and Helm charts against the target version.\n- Keep rollback and pause points clear.\n\n## Inspection commands\n$ kubectl version\n$ kubectl api-resources\n$ kubectl get crd\n$ helm list -A\n$ kubectl get pods -A | grep -E 'CrashLoopBackOff|ImagePullBackOff'\nUse version checks and manifests locally where possible; do not upgrade real clusters from this repo.\n\n## Tradeoff\nWaiting too long increases version skew and deprecated API risk. Upgrading too fast without rehearsals risks controller and workload outages.",
    "practiceNotes": "Scenario: Ingress resources use an API removed in the next cluster version.\nChecklist:\n- Search manifests and Helm renders for deprecated apiVersions.\n- Upgrade charts or manifests before the control plane upgrade.\n- Validate generated YAML against the target version.\n- Track owners for every incompatible resource.\nCommands:\n$ grep -R \"extensions/v1beta1\\|networking.k8s.io/v1beta1\" manifests/\n$ helm template checkout charts/checkout -f values/prod.yaml > rendered.yaml",
    "terms": [
      {
        "term": "Version skew",
        "def": "Differences between Kubernetes component or client versions."
      },
      {
        "term": "Deprecated API",
        "def": "An API version scheduled for removal in a later Kubernetes version."
      },
      {
        "term": "Control plane",
        "def": "The Kubernetes API and controllers managed by EKS."
      },
      {
        "term": "Node rollout",
        "def": "Replacing worker nodes with versions or images compatible with the new cluster."
      },
      {
        "term": "Pause point",
        "def": "A planned checkpoint where an upgrade can stop safely for validation."
      }
    ],
    "flashcards": [
      {
        "q": "Why inventory APIs before upgrade?",
        "a": "Removed APIs can break applies, controllers, or workloads after the upgrade."
      },
      {
        "q": "What components besides the control plane need upgrade planning?",
        "a": "Nodes, add-ons, controllers, CRDs, Helm charts, and clients."
      },
      {
        "q": "What is the risk of waiting too long?",
        "a": "Version skew grows and deprecated API removals become harder to handle."
      }
    ]
  },
  {
    "id": 29,
    "courseId": 8,
    "courseSlug": "platform-kubernetes-security-multitenancy",
    "courseTitle": "Kubernetes Security and Multi-tenancy",
    "courseTrack": "Security",
    "level": "Advanced",
    "title": "RBAC and Least Privilege",
    "summary": "Give users, workloads, and controllers the smallest permissions that still work.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.091666666666665,
    "body": "## Permission model\nKubernetes RBAC grants verbs on resources to users, groups, or service accounts. Multi-tenant platforms need role design, namespace boundaries, and auditability.\n- Prefer Role and RoleBinding inside namespaces for tenant workloads.\n- Use ClusterRole only when cluster-wide resources are needed.\n- Avoid binding tenant users to cluster-admin.\n- Review service account tokens and default service account usage.\n\n## Inspection commands\n$ kubectl auth can-i create deployments -n payments --as user@example.com\n$ kubectl get role,rolebinding -n payments\n$ kubectl get clusterrolebinding\n$ kubectl get sa -n payments\nLook for broad wildcards, cluster-admin bindings, default service account use, and controllers with more verbs than required.\n\n## Tradeoff\nToo little access blocks delivery. Too much access turns every tenant into a platform-admin risk. Build narrow roles plus a clear escalation path.",
    "practiceNotes": "Scenario: Developers need to restart Deployments but should not read Secrets.\nChecklist:\n- Create a Role with get/list/watch on workloads and patch on deployments if needed.\n- Avoid secrets verbs.\n- Test with kubectl auth can-i.\n- Document the escalation path for exceptional access.\nCommands:\n$ kubectl auth can-i get secrets -n payments --as dev@example.com\n$ kubectl auth can-i patch deployments -n payments --as dev@example.com",
    "terms": [
      {
        "term": "RBAC",
        "def": "Role-based access control for Kubernetes API actions."
      },
      {
        "term": "Role",
        "def": "A namespaced set of permissions."
      },
      {
        "term": "ClusterRole",
        "def": "A permission set that can include cluster-wide resources."
      },
      {
        "term": "RoleBinding",
        "def": "A binding that grants a Role or ClusterRole to subjects."
      },
      {
        "term": "Least privilege",
        "def": "Granting only the permissions required for the job."
      }
    ],
    "flashcards": [
      {
        "q": "When should you prefer Role over ClusterRole?",
        "a": "When permissions only need to apply inside one namespace."
      },
      {
        "q": "How do you test an RBAC decision?",
        "a": "Use `kubectl auth can-i` with the target user or service account."
      },
      {
        "q": "Why avoid default service account use?",
        "a": "It blurs workload identity and can accidentally inherit broad permissions."
      }
    ]
  },
  {
    "id": 30,
    "courseId": 8,
    "courseSlug": "platform-kubernetes-security-multitenancy",
    "courseTitle": "Kubernetes Security and Multi-tenancy",
    "courseTrack": "Security",
    "level": "Advanced",
    "title": "Network Policies and Tenant Isolation",
    "summary": "Control pod-to-pod traffic deliberately instead of trusting flat networking.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.05,
    "body": "## Network policy model\nNetworkPolicy resources define allowed ingress and egress for selected Pods, but enforcement depends on a network plugin that supports policies.\n- Start with namespace or app default-deny policies.\n- Allow only required traffic: ingress controller, dependencies, DNS, metrics, and health checks.\n- Test egress rules carefully; blocking DNS can look like many unrelated failures.\n- Document ownership of shared services.\n\n## Inspection commands\n$ kubectl get networkpolicy -A\n$ kubectl describe networkpolicy -n payments\n$ kubectl get pods -n payments --show-labels\n$ kubectl exec -n payments deploy/checkout -- nslookup kubernetes.default\nLook for policies selecting no Pods, labels that do not match, missing DNS egress, and shared namespaces without boundaries.\n\n## Tradeoff\nDefault-deny improves containment, but rollout without dependency inventory can cause outages.",
    "practiceNotes": "Scenario: After default-deny, apps cannot call DNS.\nChecklist:\n- Confirm the policy selects the Pods.\n- Add explicit egress to kube-dns/CoreDNS.\n- Test dependency traffic one service at a time.\n- Keep a rollback manifest for the policy rollout.\nCommands:\n$ kubectl get networkpolicy -n payments -o yaml\n$ kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide",
    "terms": [
      {
        "term": "NetworkPolicy",
        "def": "A Kubernetes resource controlling allowed Pod ingress and egress."
      },
      {
        "term": "Default deny",
        "def": "A policy posture that blocks traffic unless explicitly allowed."
      },
      {
        "term": "Ingress",
        "def": "Traffic entering selected Pods."
      },
      {
        "term": "Egress",
        "def": "Traffic leaving selected Pods."
      },
      {
        "term": "Policy enforcement",
        "def": "Whether the installed network plugin enforces NetworkPolicy."
      }
    ],
    "flashcards": [
      {
        "q": "What must exist for NetworkPolicy to work?",
        "a": "A network plugin that enforces NetworkPolicy."
      },
      {
        "q": "Why can blocking DNS be confusing?",
        "a": "Many dependencies fail by name and appear unrelated."
      },
      {
        "q": "What is the rollout risk of default-deny?",
        "a": "Missing dependency inventory can break service traffic."
      }
    ]
  },
  {
    "id": 31,
    "courseId": 8,
    "courseSlug": "platform-kubernetes-security-multitenancy",
    "courseTitle": "Kubernetes Security and Multi-tenancy",
    "courseTrack": "Security",
    "level": "Advanced",
    "title": "Pod Security Standards and Admission Policy",
    "summary": "Prevent risky workloads from entering the cluster.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.041666666666668,
    "body": "## Admission guardrails\nPod Security Standards define baseline and restricted policies for Pod specs. Admission controllers and policy engines can enforce guardrails before resources are persisted.\n- Restrict privileged containers, hostPath, hostNetwork, hostPID, and dangerous capabilities.\n- Require non-root where possible.\n- Enforce resource requests, approved registries, and signed images where your maturity supports it.\n- Keep exceptions explicit, owned, and time-bounded.\n\n## Inspection commands\n$ kubectl get ns --show-labels\n$ kubectl auth can-i use podsecuritypolicy\n$ kubectl get validatingadmissionpolicy\n$ kubectl get pods -A -o yaml | grep -n \"privileged\\|hostPath\\|hostNetwork\"\nPodSecurityPolicy is removed in modern Kubernetes; this check teaches history and migration awareness.\n\n## Tradeoff\nStrict policy improves safety, but unplanned enforcement can block critical controllers. Audit first, then enforce by namespace or tenant.",
    "practiceNotes": "Scenario: A monitoring agent needs hostPath and privileged access.\nChecklist:\n- Verify why host access is required.\n- Isolate the agent namespace and service account.\n- Scope RBAC and network access.\n- Create a documented exception with owner and review date.\nCommands:\n$ kubectl describe pod agent -n observability\n$ kubectl get rolebinding,clusterrolebinding -A | grep observability",
    "terms": [
      {
        "term": "Pod Security Standards",
        "def": "Kubernetes-defined baseline and restricted Pod security levels."
      },
      {
        "term": "Admission controller",
        "def": "Logic that validates or mutates API requests before persistence."
      },
      {
        "term": "hostPath",
        "def": "A volume that mounts a file or directory from the node filesystem."
      },
      {
        "term": "Privileged container",
        "def": "A container with broad host-level permissions."
      },
      {
        "term": "Exception",
        "def": "A documented allowance for a workload that cannot meet standard policy."
      }
    ],
    "flashcards": [
      {
        "q": "What do admission policies prevent?",
        "a": "Risky or non-compliant resources from entering the cluster."
      },
      {
        "q": "Why audit before enforcing strict policy?",
        "a": "To find required exceptions and avoid breaking critical workloads."
      },
      {
        "q": "Name three high-risk Pod settings.",
        "a": "privileged, hostPath, hostNetwork, hostPID, added capabilities, and running as root."
      }
    ]
  },
  {
    "id": 32,
    "courseId": 8,
    "courseSlug": "platform-kubernetes-security-multitenancy",
    "courseTitle": "Kubernetes Security and Multi-tenancy",
    "courseTrack": "Security",
    "level": "Advanced",
    "title": "Secrets Strategy and Multi-Tenant Boundaries",
    "summary": "Design secret ownership, rotation, and blast radius for shared clusters.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.225,
    "body": "## Secret operating model\nKubernetes Secrets are API objects. They need encryption at rest, RBAC, audit, rotation, and a source-of-truth strategy. In multi-tenant clusters, secret boundaries are as important as workload boundaries.\n- Keep tenant secrets in tenant namespaces.\n- Avoid broad secret list/watch permissions.\n- Use External Secrets, CSI drivers, SOPS, or Sealed Secrets based on ownership model.\n- Rotate credentials and test application reload or restart behavior.\n- Do not put secrets in logs, annotations, or rendered Helm output committed to Git.\n\n## Inspection commands\n$ kubectl get secrets -A\n$ kubectl auth can-i list secrets -n payments --as system:serviceaccount:payments:checkout\n$ kubectl get externalsecret -A\n$ kubectl describe pod checkout-abc123 -n payments\nLook for default tokens, broad secret readers, stale secret versions, and secret values exposed through env dumps.\n\n## Tradeoff\nExternal secret managers centralize rotation and audit, but add controller dependency and failure modes.",
    "practiceNotes": "Scenario: A team wants one namespace to share credentials across services.\nChecklist:\n- Split credentials by service and privilege.\n- Bind read access to exact service accounts.\n- Name rotation owner and process.\n- Verify logs and debug endpoints do not expose env secrets.\nCommands:\n$ kubectl auth can-i get secret checkout-db -n payments --as system:serviceaccount:payments:checkout\n$ kubectl get sa -n payments",
    "terms": [
      {
        "term": "Encryption at rest",
        "def": "Encrypting stored Kubernetes Secret data in the backing datastore."
      },
      {
        "term": "External Secrets",
        "def": "A controller pattern syncing external secret manager values into Kubernetes."
      },
      {
        "term": "Secret rotation",
        "def": "Replacing credentials on a defined schedule or trigger."
      },
      {
        "term": "Blast radius",
        "def": "The amount of damage or access possible after a failure or compromise."
      },
      {
        "term": "Tenant boundary",
        "def": "A policy and ownership line between teams or workloads sharing a platform."
      }
    ],
    "flashcards": [
      {
        "q": "Why is a Kubernetes Secret not enough by itself?",
        "a": "It needs encryption, RBAC, audit, rotation, and a clear source of truth."
      },
      {
        "q": "Why avoid list/watch secrets broadly?",
        "a": "It can expose every secret in the namespace to one compromised identity."
      },
      {
        "q": "What is the tradeoff of external secret managers?",
        "a": "Better central audit and rotation, but more controller and dependency failure modes."
      }
    ]
  },
  {
    "id": 33,
    "courseId": 9,
    "courseSlug": "platform-sre-observability-kubernetes",
    "courseTitle": "SRE and Observability for Kubernetes",
    "courseTrack": "SRE",
    "level": "Advanced",
    "title": "RED, USE, and Kubernetes Golden Signals",
    "summary": "Separate user symptoms from infrastructure causes.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.183333333333334,
    "body": "## Measurement model\nGood observability starts with the question: what pain does the user feel? RED metrics cover request Rate, Error rate, and Duration. USE covers Utilization, Saturation, and Errors for resources.\n- Use RED for APIs and request-driven services.\n- Use USE for nodes, disks, queues, network interfaces, and database pools.\n- Kubernetes adds desired vs available replicas, pending Pods, restarts, unschedulable reasons, and HPA behavior.\n- Page on user impact or imminent capacity exhaustion, not every component twitch.\n\n## Inspection commands\n$ kubectl top nodes\n$ kubectl top pods -A\n$ kubectl get deploy -A\n$ kubectl get events -A --sort-by=.lastTimestamp\nLook for saturation, rollout availability, crash patterns, scheduling pressure, and whether the symptom is service-level or component-level.\n\n## Dashboard rule\nOne dashboard should answer: are users hurt, where is the blast radius, what changed, and which dependency is saturated?",
    "practiceNotes": "Scenario: Latency increased after a deployment.\nChecklist:\n- Check request p95/p99 and error rate by route or service.\n- Compare deployment time with rollout, restart, and HPA events.\n- Check CPU throttling, memory pressure, database pool saturation, and queue depth.\n- Move from symptom dashboard to workload and dependency dashboards.\nCommands:\n$ kubectl rollout history deploy/checkout -n payments\n$ kubectl get hpa,pods -n payments",
    "terms": [
      {
        "term": "RED metrics",
        "def": "Rate, Errors, and Duration for request-oriented services."
      },
      {
        "term": "USE metrics",
        "def": "Utilization, Saturation, and Errors for infrastructure resources."
      },
      {
        "term": "Golden signals",
        "def": "Latency, traffic, errors, and saturation."
      },
      {
        "term": "Saturation",
        "def": "A signal that a resource has more demand than it can serve promptly."
      },
      {
        "term": "Blast radius",
        "def": "The scope of users, services, regions, or clusters affected by a problem."
      }
    ],
    "flashcards": [
      {
        "q": "When should a container restart page someone?",
        "a": "When it correlates with user impact or high-risk service failure, not as standalone noise."
      },
      {
        "q": "What does RED measure?",
        "a": "Request rate, error rate, and duration."
      },
      {
        "q": "What does USE measure?",
        "a": "Utilization, saturation, and errors for resources."
      }
    ]
  },
  {
    "id": 34,
    "courseId": 9,
    "courseSlug": "platform-sre-observability-kubernetes",
    "courseTitle": "SRE and Observability for Kubernetes",
    "courseTrack": "SRE",
    "level": "Advanced",
    "title": "Prometheus, Grafana, Logs, and Traces",
    "summary": "Connect metrics, logs, and traces without turning every tool into a silo.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.091666666666665,
    "body": "## Telemetry roles\nMetrics tell you what is happening over time. Logs provide discrete event detail. Traces connect service hops for one request. Dashboards should guide operators from symptom to likely cause.\n- Label metrics with stable dimensions, not high-cardinality user IDs.\n- Keep request IDs and trace IDs in logs.\n- Use exemplars or links where possible to jump from metrics to traces.\n- Dashboards should show deploy markers or recent changes.\n\n## Inspection commands\n$ kubectl get servicemonitor,podmonitor -A\n$ kubectl logs deploy/checkout -n payments --since=15m\n$ kubectl get pods -n observability\n$ kubectl port-forward svc/prometheus 9090:9090 -n observability\nUse local Compose Prometheus/Grafana in this repo for safe practice.\n\n## Tradeoff\nMore telemetry is not automatically better. High-cardinality metrics and noisy logs can increase cost and slow incident response.",
    "practiceNotes": "Scenario: Error rate spikes but logs are hard to connect.\nChecklist:\n- Confirm logs include request ID, trace ID, route, status, and version.\n- Check whether metrics labels align with dashboard filters.\n- Sample traces for failed requests.\n- Add deploy annotations or release labels to charts.\nCommands:\n$ kubectl logs deploy/checkout -n payments --since=15m | grep ERROR",
    "terms": [
      {
        "term": "Metric",
        "def": "A measured value over time with labels."
      },
      {
        "term": "Log",
        "def": "A textual or structured record of an event."
      },
      {
        "term": "Trace",
        "def": "A set of spans showing one request across services."
      },
      {
        "term": "Cardinality",
        "def": "The number of distinct label combinations in a metric."
      },
      {
        "term": "Request ID",
        "def": "An identifier used to connect logs for one request."
      }
    ],
    "flashcards": [
      {
        "q": "What does a trace add beyond logs?",
        "a": "It connects service hops and timing for one request."
      },
      {
        "q": "Why avoid high-cardinality labels?",
        "a": "They increase cost and can hurt metrics system performance."
      },
      {
        "q": "What IDs should logs carry?",
        "a": "Request IDs and trace IDs where possible."
      }
    ]
  },
  {
    "id": 35,
    "courseId": 9,
    "courseSlug": "platform-sre-observability-kubernetes",
    "courseTitle": "SRE and Observability for Kubernetes",
    "courseTrack": "SRE",
    "level": "Advanced",
    "title": "SLOs, Error Budgets, and Burn-Rate Alerts",
    "summary": "Turn reliability goals into alerts that protect users without exhausting operators.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.05,
    "body": "## SLO thinking\nAn SLO is a target for user experience over a window, such as 99.9 percent successful checkout requests over 30 days. Error budget is the tolerated unreliability. Alerting should track burn rate.\n- Define SLIs from user-visible behavior: success, latency, freshness, durability, or correctness.\n- Page on fast budget burn; ticket on slower risk.\n- Separate symptom alerts from cause dashboards.\n- Every page needs owner, severity, runbook, and known false-positive notes.\n\n## Inspection commands\n$ kubectl get prometheusrule -A\n$ kubectl get alertmanagerconfig -A\n$ kubectl get servicemonitor,podmonitor -A\nLook for alerts without `for` durations, missing routing labels, cause-only pages, and dashboards that cannot confirm user impact.\n\n## Tradeoff\nStrict SLOs can drive good engineering, but unrealistic targets create constant emergency mode.",
    "practiceNotes": "Scenario: On-call receives 20 pages for one dependency outage.\nChecklist:\n- Identify symptom alerts and cause alerts.\n- Group by service, cluster, and severity.\n- Add inhibition for downstream duplicate pages.\n- Keep one symptom page if it best represents user impact.\nCommands:\n$ kubectl get prometheusrule -A -o yaml",
    "terms": [
      {
        "term": "SLI",
        "def": "A service level indicator measuring user experience."
      },
      {
        "term": "SLO",
        "def": "A service level objective for an SLI over a window."
      },
      {
        "term": "Error budget",
        "def": "The amount of unreliability allowed before missing the SLO."
      },
      {
        "term": "Burn rate",
        "def": "How quickly a service consumes its error budget."
      },
      {
        "term": "Inhibition",
        "def": "Suppressing related alerts when a higher-level alert already explains the issue."
      }
    ],
    "flashcards": [
      {
        "q": "Why page on burn rate?",
        "a": "It maps alert urgency to how quickly users are consuming the error budget."
      },
      {
        "q": "What should every page include?",
        "a": "Owner, severity, runbook, routing labels, and a condition needing immediate action."
      },
      {
        "q": "What is a symptom alert?",
        "a": "An alert that directly indicates user impact."
      }
    ]
  },
  {
    "id": 36,
    "courseId": 9,
    "courseSlug": "platform-sre-observability-kubernetes",
    "courseTitle": "SRE and Observability for Kubernetes",
    "courseTrack": "SRE",
    "level": "Advanced",
    "title": "Incident Runbooks and Post-Incident Learning",
    "summary": "Write operational guides that work under pressure and improve after incidents.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.208333333333332,
    "body": "## Runbook structure\nA useful runbook is executable under stress. It starts with impact, gives safe confirmation steps, names mitigation choices, and states when to escalate.\n- Start with alert meaning and user impact.\n- Put read-only commands first.\n- Include mitigation options: rollback, scale, disable feature, fail over, drain node, or pause sync.\n- Include escalation criteria and owner.\n- End with post-incident actions: permanent fix, alert tuning, docs update, and follow-up owner.\n\n## Inspection commands\n$ kubectl get pods -n payments\n$ kubectl describe pod POD -n payments\n$ kubectl logs deploy/checkout -n payments --since=15m\n$ kubectl get events -n payments --sort-by=.lastTimestamp\nFor traces, start from a slow request and follow service hops. For logs, search by request ID, trace ID, pod, and deploy version.\n\n## Tradeoff\nRunbooks should not hide weak systems. Repeated manual mitigation should turn into safer defaults or automation.",
    "practiceNotes": "Scenario: A canary release causes checkout failures.\nChecklist:\n- Confirm user impact through RED dashboard.\n- Identify deployed version and rollout timestamp.\n- Compare logs and traces by version.\n- Roll back or pause ArgoCD sync if GitOps would reapply bad state.\n- Write the post-incident action before closing.\nCommands:\n$ kubectl rollout undo deploy/checkout -n payments\n$ argocd app get checkout-prod\n$ argocd app set checkout-prod --sync-policy none",
    "terms": [
      {
        "term": "Runbook",
        "def": "A repeatable guide for diagnosing and mitigating a known incident class."
      },
      {
        "term": "Mitigation",
        "def": "An action that reduces user impact before permanent fix."
      },
      {
        "term": "Escalation",
        "def": "Moving an incident to additional owners or higher severity."
      },
      {
        "term": "Post-incident review",
        "def": "A structured review that turns incidents into improvements."
      },
      {
        "term": "Canary",
        "def": "A limited rollout used to detect problems before full release."
      }
    ],
    "flashcards": [
      {
        "q": "What should come before root-cause theory in a runbook?",
        "a": "Impact, alert meaning, fast confirmation, and safe first checks."
      },
      {
        "q": "Why put read-only commands first?",
        "a": "They collect evidence with lower risk while responders are under pressure."
      },
      {
        "q": "What should repeated incidents become?",
        "a": "Automation, safer defaults, better alerts, or product fixes."
      }
    ]
  },
  {
    "id": 37,
    "courseId": 10,
    "courseSlug": "platform-linux-command-line-foundations",
    "courseTitle": "Linux and Command Line Foundations",
    "courseTrack": "Linux",
    "level": "Fresher",
    "title": "Shell Navigation and File Inspection",
    "summary": "Move around Linux systems and inspect files safely.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.95,
    "body": "## Mental model\nMost platform work starts with reading: paths, permissions, config files, logs, and generated artifacts. The shell is not just a typing surface; it is how you build small, repeatable investigations.\n\n## What to practice\nPractice pwd, ls, cd, find alternatives, less, wc, diff, and checksums on sample manifests and logs. Prefer read-only commands until you know the boundary.\n\n## Practice checkpoint\nGiven a mystery project directory, identify app code, deployment manifests, generated build outputs, and logs without editing anything.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Linux and Command Line Foundations",
        "def": "Learn the shell, files, processes, permissions, logs, and package basics every Kubernetes operator needs before touching clusters."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Shell Navigation and File Inspection?",
        "a": "Move around Linux systems and inspect files safely."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 38,
    "courseId": 10,
    "courseSlug": "platform-linux-command-line-foundations",
    "courseTitle": "Linux and Command Line Foundations",
    "courseTrack": "Linux",
    "level": "Fresher",
    "title": "Processes, Exit Codes, and Logs",
    "summary": "Understand running processes and what failures leave behind.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.875,
    "body": "## Mental model\nContainers make Linux processes look packaged, but PID, stdout, stderr, exit code, and signal behavior still drive Kubernetes status. A CrashLoopBackOff is often just a process repeatedly exiting.\n\n## What to practice\nPractice ps, top, env, journalctl concepts, process signals, and interpreting exit code 1 versus 137.\n\n## Practice checkpoint\nExplain whether a workload failed because the app exited, the kernel killed it, or the platform could not start it.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Linux and Command Line Foundations",
        "def": "Learn the shell, files, processes, permissions, logs, and package basics every Kubernetes operator needs before touching clusters."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Processes, Exit Codes, and Logs?",
        "a": "Understand running processes and what failures leave behind."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 39,
    "courseId": 10,
    "courseSlug": "platform-linux-command-line-foundations",
    "courseTitle": "Linux and Command Line Foundations",
    "courseTrack": "Linux",
    "level": "Fresher",
    "title": "Users, Groups, Permissions, and Sudo",
    "summary": "Reason about file access and least privilege.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.841666666666665,
    "body": "## Mental model\nLinux permissions shape container securityContext decisions, mounted volume access, SSH access, and CI runner behavior. Running everything as root hides ownership bugs and increases blast radius.\n\n## What to practice\nPractice chmod/chown concepts, mode bits, executable permissions, and why containers should use non-root users.\n\n## Practice checkpoint\nReview a Dockerfile or Pod securityContext and identify whether the app can read its config without unnecessary root privileges.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Linux and Command Line Foundations",
        "def": "Learn the shell, files, processes, permissions, logs, and package basics every Kubernetes operator needs before touching clusters."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Users, Groups, Permissions, and Sudo?",
        "a": "Reason about file access and least privilege."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 40,
    "courseId": 10,
    "courseSlug": "platform-linux-command-line-foundations",
    "courseTitle": "Linux and Command Line Foundations",
    "courseTrack": "Linux",
    "level": "Fresher",
    "title": "Text Pipelines for Operators",
    "summary": "Use grep, sort, uniq, jq, and yq-style thinking to extract evidence.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.791666666666668,
    "body": "## Mental model\nProduction debugging produces too much text. Operators need pipelines that reduce output into counts, suspicious fields, and exact resource names without deleting context.\n\n## What to practice\nPractice filtering events by reason, extracting image tags, counting namespaces, and comparing rendered YAML sections.\n\n## Practice checkpoint\nTurn raw kubectl JSON or logs into a short incident note with commands and evidence.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Linux and Command Line Foundations",
        "def": "Learn the shell, files, processes, permissions, logs, and package basics every Kubernetes operator needs before touching clusters."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Text Pipelines for Operators?",
        "a": "Use grep, sort, uniq, jq, and yq-style thinking to extract evidence."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 41,
    "courseId": 11,
    "courseSlug": "platform-networking-fundamentals",
    "courseTitle": "Networking Foundations for Kubernetes",
    "courseTrack": "Networking",
    "level": "Fresher",
    "title": "IP, Ports, and Routing Basics",
    "summary": "Understand what actually connects clients to services.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.775,
    "body": "## Mental model\nEvery request crosses source IP, destination IP, protocol, port, route, and policy decisions. Kubernetes adds abstractions, but packets still need a path.\n\n## What to practice\nPractice reading local interfaces, listening ports, service ports, targetPorts, node ports, and route-table concepts.\n\n## Practice checkpoint\nDraw how a request travels from browser to load balancer to Service to Pod containerPort.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Networking Foundations for Kubernetes",
        "def": "Build the TCP/IP, DNS, HTTP, TLS, load-balancing, and firewall mental model needed for Kubernetes and AWS troubleshooting."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of IP, Ports, and Routing Basics?",
        "a": "Understand what actually connects clients to services."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 42,
    "courseId": 11,
    "courseSlug": "platform-networking-fundamentals",
    "courseTitle": "Networking Foundations for Kubernetes",
    "courseTrack": "Networking",
    "level": "Fresher",
    "title": "DNS and Service Discovery",
    "summary": "Debug names before assuming apps are down.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.75,
    "body": "## Mental model\nMany outages look like application errors but begin as DNS failures, wrong search domains, stale records, or split-horizon assumptions.\n\n## What to practice\nPractice nslookup/dig concepts, Kubernetes service DNS names, CoreDNS role, and TTL tradeoffs.\n\n## Practice checkpoint\nGiven a connection failure, decide whether the next check is DNS, port reachability, TLS, or application logs.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Networking Foundations for Kubernetes",
        "def": "Build the TCP/IP, DNS, HTTP, TLS, load-balancing, and firewall mental model needed for Kubernetes and AWS troubleshooting."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of DNS and Service Discovery?",
        "a": "Debug names before assuming apps are down."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 43,
    "courseId": 11,
    "courseSlug": "platform-networking-fundamentals",
    "courseTitle": "Networking Foundations for Kubernetes",
    "courseTrack": "Networking",
    "level": "Fresher",
    "title": "HTTP, TLS, and Ingress",
    "summary": "Read request symptoms across L7 boundaries.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.758333333333333,
    "body": "## Mental model\nIngress, ALB, Nginx, app servers, and clients all speak in status codes, headers, certificates, and timeouts. You need to locate which hop generated the symptom.\n\n## What to practice\nPractice curl-style checks for status, headers, SNI, redirects, and health endpoints.\n\n## Practice checkpoint\nClassify 404, 502, 503, TLS handshake failure, and timeout into likely ownership areas.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Networking Foundations for Kubernetes",
        "def": "Build the TCP/IP, DNS, HTTP, TLS, load-balancing, and firewall mental model needed for Kubernetes and AWS troubleshooting."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of HTTP, TLS, and Ingress?",
        "a": "Read request symptoms across L7 boundaries."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 44,
    "courseId": 11,
    "courseSlug": "platform-networking-fundamentals",
    "courseTitle": "Networking Foundations for Kubernetes",
    "courseTrack": "Networking",
    "level": "Fresher",
    "title": "Network Policies and Firewalls",
    "summary": "Separate connectivity design from accidental openness.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.791666666666668,
    "body": "## Mental model\nSecurity groups, NACLs, Kubernetes NetworkPolicies, and service meshes all constrain traffic at different layers. Default allow is easy, but production platforms need intentional paths.\n\n## What to practice\nPractice reading allowed sources, destinations, ports, and policy selectors.\n\n## Practice checkpoint\nDesign a minimal allowed path for frontend to API to database plus DNS, then name how you would test it.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Networking Foundations for Kubernetes",
        "def": "Build the TCP/IP, DNS, HTTP, TLS, load-balancing, and firewall mental model needed for Kubernetes and AWS troubleshooting."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Network Policies and Firewalls?",
        "a": "Separate connectivity design from accidental openness."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 45,
    "courseId": 12,
    "courseSlug": "platform-terraform-aws-infrastructure",
    "courseTitle": "Terraform for AWS Platform Infrastructure",
    "courseTrack": "Terraform",
    "level": "Intermediate",
    "title": "Terraform Workflow and State",
    "summary": "Understand init, plan, apply, state, locking, and remote backends.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.816666666666666,
    "body": "## Mental model\nTerraform is an infrastructure change engine backed by state. The plan is only meaningful when provider config, variables, workspace, and state are the intended ones.\n\n## What to practice\nPractice reading plan output, state addresses, backend config, and lock behavior without applying changes.\n\n## Practice checkpoint\nExplain what could go wrong if two engineers apply against the same state or the wrong workspace.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Terraform for AWS Platform Infrastructure",
        "def": "Learn reproducible infrastructure workflows for VPCs, EKS modules, state, plans, reviews, drift, and environment promotion."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Terraform Workflow and State?",
        "a": "Understand init, plan, apply, state, locking, and remote backends."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 46,
    "courseId": 12,
    "courseSlug": "platform-terraform-aws-infrastructure",
    "courseTitle": "Terraform for AWS Platform Infrastructure",
    "courseTrack": "Terraform",
    "level": "Intermediate",
    "title": "Modules, Variables, and Environment Promotion",
    "summary": "Design reusable infrastructure without hiding risk.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.758333333333333,
    "body": "## Mental model\nGood modules expose stable inputs and outputs while keeping provider-specific complexity reviewable. Promotion means using the same module with controlled values, not copy-pasting random stacks.\n\n## What to practice\nPractice comparing dev/stage/prod tfvars, module versions, outputs, and dependency boundaries.\n\n## Practice checkpoint\nReview an EKS module call and identify which variables affect security, capacity, and cost.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Terraform for AWS Platform Infrastructure",
        "def": "Learn reproducible infrastructure workflows for VPCs, EKS modules, state, plans, reviews, drift, and environment promotion."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Modules, Variables, and Environment Promotion?",
        "a": "Design reusable infrastructure without hiding risk."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 47,
    "courseId": 12,
    "courseSlug": "platform-terraform-aws-infrastructure",
    "courseTitle": "Terraform for AWS Platform Infrastructure",
    "courseTrack": "Terraform",
    "level": "Intermediate",
    "title": "AWS VPC and EKS Resources in Terraform",
    "summary": "Connect Terraform resources to platform architecture decisions.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.858333333333334,
    "body": "## Mental model\nSubnets, route tables, NAT gateways, security groups, IAM roles, node groups, and add-ons become the substrate for EKS. Small IaC choices can create large reliability or cost outcomes.\n\n## What to practice\nPractice tracing an EKS cluster from module inputs to created AWS resources and Kubernetes bootstrap dependencies.\n\n## Practice checkpoint\nName the Terraform-owned resources involved when Pods cannot reach the internet or the API endpoint is unreachable.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Terraform for AWS Platform Infrastructure",
        "def": "Learn reproducible infrastructure workflows for VPCs, EKS modules, state, plans, reviews, drift, and environment promotion."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of AWS VPC and EKS Resources in Terraform?",
        "a": "Connect Terraform resources to platform architecture decisions."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 48,
    "courseId": 12,
    "courseSlug": "platform-terraform-aws-infrastructure",
    "courseTitle": "Terraform for AWS Platform Infrastructure",
    "courseTrack": "Terraform",
    "level": "Intermediate",
    "title": "Plan Review, Drift, and Safe Changes",
    "summary": "Turn terraform plan into an engineering review artifact.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.766666666666666,
    "body": "## Mental model\nA plan is not a rubber stamp. Replacements, broad IAM policy changes, route changes, and security group openings need explicit review and rollback thinking.\n\n## What to practice\nPractice spotting replace/destroy actions, unknown values, sensitive outputs, and drift signals.\n\n## Practice checkpoint\nWrite a plan review summary that calls out blast radius, rollback, validation, and cost impact.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Terraform for AWS Platform Infrastructure",
        "def": "Learn reproducible infrastructure workflows for VPCs, EKS modules, state, plans, reviews, drift, and environment promotion."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Plan Review, Drift, and Safe Changes?",
        "a": "Turn terraform plan into an engineering review artifact."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 49,
    "courseId": 13,
    "courseSlug": "platform-aws-iam-for-eks",
    "courseTitle": "AWS IAM for EKS and Platform Teams",
    "courseTrack": "AWS IAM",
    "level": "Intermediate",
    "title": "IAM Principals, Policies, and Evaluation",
    "summary": "Understand who can do what and why AWS denied or allowed it.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.8,
    "body": "## Mental model\nIAM decisions combine identity policies, resource policies, permission boundaries, SCPs, session policies, and explicit deny. Debugging starts by identifying the principal and action.\n\n## What to practice\nPractice reading policy statements, actions, resources, conditions, and CloudTrail access denied events.\n\n## Practice checkpoint\nExplain why a role with an apparent allow can still be denied by boundary, SCP, condition, or resource policy.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS IAM for EKS and Platform Teams",
        "def": "Learn IAM policies, roles, trust relationships, STS, IRSA, Pod Identity, and least-privilege reviews for EKS workloads."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of IAM Principals, Policies, and Evaluation?",
        "a": "Understand who can do what and why AWS denied or allowed it."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 50,
    "courseId": 13,
    "courseSlug": "platform-aws-iam-for-eks",
    "courseTitle": "AWS IAM for EKS and Platform Teams",
    "courseTrack": "AWS IAM",
    "level": "Intermediate",
    "title": "STS, AssumeRole, and Trust Policies",
    "summary": "Follow identity handoffs across accounts and automation.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.808333333333334,
    "body": "## Mental model\nTrust policies decide who can assume a role; permission policies decide what the role can do after assumption. CI, EKS controllers, and human break-glass flows depend on this separation.\n\n## What to practice\nPractice reading assume-role events, external IDs, conditions, and session names.\n\n## Practice checkpoint\nReview a cross-account deploy role and identify who can assume it and what they can change.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS IAM for EKS and Platform Teams",
        "def": "Learn IAM policies, roles, trust relationships, STS, IRSA, Pod Identity, and least-privilege reviews for EKS workloads."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of STS, AssumeRole, and Trust Policies?",
        "a": "Follow identity handoffs across accounts and automation."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 51,
    "courseId": 13,
    "courseSlug": "platform-aws-iam-for-eks",
    "courseTitle": "AWS IAM for EKS and Platform Teams",
    "courseTrack": "AWS IAM",
    "level": "Intermediate",
    "title": "IRSA and EKS Pod Identity",
    "summary": "Give Pods AWS access without node-wide secrets.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.758333333333333,
    "body": "## Mental model\nEKS workloads should not inherit broad node instance profile permissions. IRSA and Pod Identity connect Kubernetes service accounts to scoped AWS roles.\n\n## What to practice\nPractice matching service account annotations, OIDC provider, trust policy subject, and SDK credential behavior.\n\n## Practice checkpoint\nDiagnose a Pod that gets AccessDenied even though the IAM role looks correct.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS IAM for EKS and Platform Teams",
        "def": "Learn IAM policies, roles, trust relationships, STS, IRSA, Pod Identity, and least-privilege reviews for EKS workloads."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of IRSA and EKS Pod Identity?",
        "a": "Give Pods AWS access without node-wide secrets."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 52,
    "courseId": 13,
    "courseSlug": "platform-aws-iam-for-eks",
    "courseTitle": "AWS IAM for EKS and Platform Teams",
    "courseTrack": "AWS IAM",
    "level": "Intermediate",
    "title": "Least Privilege Reviews for Controllers",
    "summary": "Review powerful add-ons before production install.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.766666666666666,
    "body": "## Mental model\nControllers like ALB, external-dns, cert-manager, cluster-autoscaler, and Karpenter need AWS permissions that can affect infrastructure. Platform teams must scope and monitor them.\n\n## What to practice\nPractice comparing recommended policies to actual resource patterns and tagging conditions.\n\n## Practice checkpoint\nWrite a review note for an ALB controller policy including required actions, risky actions, and monitoring signals.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS IAM for EKS and Platform Teams",
        "def": "Learn IAM policies, roles, trust relationships, STS, IRSA, Pod Identity, and least-privilege reviews for EKS workloads."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Least Privilege Reviews for Controllers?",
        "a": "Review powerful add-ons before production install."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 53,
    "courseId": 14,
    "courseSlug": "platform-cicd-release-engineering",
    "courseTitle": "CI/CD and Release Engineering",
    "courseTrack": "CI/CD",
    "level": "Advanced",
    "title": "Pipeline Stages and Quality Gates",
    "summary": "Design pipelines that catch defects before users do.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.775,
    "body": "## Mental model\nA release pipeline should prove source quality, artifact integrity, rendered manifest safety, deployment success, and user-impact health. Speed matters, but uncontrolled speed ships incidents.\n\n## What to practice\nPractice mapping lint, unit, integration, image scan, helm template, deploy, smoke, and rollback gates.\n\n## Practice checkpoint\nDesign a pipeline for a Kubernetes app and name which failures block promotion.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "CI/CD and Release Engineering",
        "def": "Build safe pipelines for container builds, tests, image signing, environment promotion, progressive delivery, and rollback."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Pipeline Stages and Quality Gates?",
        "a": "Design pipelines that catch defects before users do."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 54,
    "courseId": 14,
    "courseSlug": "platform-cicd-release-engineering",
    "courseTitle": "CI/CD and Release Engineering",
    "courseTrack": "CI/CD",
    "level": "Advanced",
    "title": "Artifact Promotion and Supply Chain",
    "summary": "Promote trusted artifacts rather than rebuilding surprises.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.708333333333332,
    "body": "## Mental model\nThe image digest that passed tests should be the image promoted. Signing, SBOMs, provenance, and vulnerability policy make releases auditable.\n\n## What to practice\nPractice reading image tags versus digests, registry metadata, signatures, and scan reports.\n\n## Practice checkpoint\nExplain why rebuilding per environment can break reproducibility and incident rollback.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "CI/CD and Release Engineering",
        "def": "Build safe pipelines for container builds, tests, image signing, environment promotion, progressive delivery, and rollback."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Artifact Promotion and Supply Chain?",
        "a": "Promote trusted artifacts rather than rebuilding surprises."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 55,
    "courseId": 14,
    "courseSlug": "platform-cicd-release-engineering",
    "courseTitle": "CI/CD and Release Engineering",
    "courseTrack": "CI/CD",
    "level": "Advanced",
    "title": "Progressive Delivery and Rollback",
    "summary": "Release with canaries, blue/green, feature flags, and measured rollback.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.725,
    "body": "## Mental model\nProgressive delivery limits blast radius by exposing changes gradually and watching real signals. Rollback must be rehearsed before the incident.\n\n## What to practice\nPractice defining canary metrics, pause conditions, automated rollback, and ArgoCD sync behavior.\n\n## Practice checkpoint\nWrite a canary decision rule using latency, error rate, saturation, and business signal.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "CI/CD and Release Engineering",
        "def": "Build safe pipelines for container builds, tests, image signing, environment promotion, progressive delivery, and rollback."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Progressive Delivery and Rollback?",
        "a": "Release with canaries, blue/green, feature flags, and measured rollback."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 56,
    "courseId": 14,
    "courseSlug": "platform-cicd-release-engineering",
    "courseTitle": "CI/CD and Release Engineering",
    "courseTrack": "CI/CD",
    "level": "Advanced",
    "title": "Pipeline Security and Secrets",
    "summary": "Protect deploy permissions and credentials in automation.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.758333333333333,
    "body": "## Mental model\nCI/CD systems are production control planes. Runner isolation, secret scoping, OIDC federation, approvals, and audit logs prevent pipelines from becoming a backdoor.\n\n## What to practice\nPractice reviewing repo permissions, environment protection, deploy roles, and secret exposure paths.\n\n## Practice checkpoint\nThreat-model a pipeline that can deploy to prod and list the minimum guardrails before launch.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "CI/CD and Release Engineering",
        "def": "Build safe pipelines for container builds, tests, image signing, environment promotion, progressive delivery, and rollback."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Pipeline Security and Secrets?",
        "a": "Protect deploy permissions and credentials in automation."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 57,
    "courseId": 15,
    "courseSlug": "platform-engineering-product-operating-model",
    "courseTitle": "Platform Engineering Operating Model",
    "courseTrack": "Platform Engineering",
    "level": "Advanced",
    "title": "Golden Paths and Developer Experience",
    "summary": "Turn platform complexity into supported self-service workflows.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.766666666666666,
    "body": "## Mental model\nA platform is a product for internal teams. Golden paths should make the safe way the easy way while still allowing explicit exceptions.\n\n## What to practice\nPractice designing a service template with CI, Helm, observability, security defaults, and docs.\n\n## Practice checkpoint\nDescribe the first-run developer experience for launching a new service without opening a ticket.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Operating Model",
        "def": "Learn how platform teams define golden paths, service ownership, paved-road APIs, SLOs, cost guardrails, and internal developer experience."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Golden Paths and Developer Experience?",
        "a": "Turn platform complexity into supported self-service workflows."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 58,
    "courseId": 15,
    "courseSlug": "platform-engineering-product-operating-model",
    "courseTitle": "Platform Engineering Operating Model",
    "courseTrack": "Platform Engineering",
    "level": "Advanced",
    "title": "Service Ownership and Production Readiness",
    "summary": "Define what teams own before incidents happen.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.675,
    "body": "## Mental model\nProduction readiness connects ownership, runbooks, dashboards, alerts, dependencies, data handling, and support expectations. Ambiguous ownership becomes incident drag.\n\n## What to practice\nPractice building a readiness checklist and ownership metadata model.\n\n## Practice checkpoint\nReview a service and decide whether it is ready for shared-cluster production.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Operating Model",
        "def": "Learn how platform teams define golden paths, service ownership, paved-road APIs, SLOs, cost guardrails, and internal developer experience."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Service Ownership and Production Readiness?",
        "a": "Define what teams own before incidents happen."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 59,
    "courseId": 15,
    "courseSlug": "platform-engineering-product-operating-model",
    "courseTitle": "Platform Engineering Operating Model",
    "courseTrack": "Platform Engineering",
    "level": "Advanced",
    "title": "Platform APIs, Backstage, and Templates",
    "summary": "Expose infrastructure capabilities through stable interfaces.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.7,
    "body": "## Mental model\nPlatform teams should publish versioned interfaces: templates, modules, charts, APIs, scorecards, and docs. Consumers need contracts, not tribal knowledge.\n\n## What to practice\nPractice defining template inputs, outputs, validation, and lifecycle support.\n\n## Practice checkpoint\nSketch a self-service workflow for creating an EKS-backed service with Terraform, Helm, and ArgoCD.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Operating Model",
        "def": "Learn how platform teams define golden paths, service ownership, paved-road APIs, SLOs, cost guardrails, and internal developer experience."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Platform APIs, Backstage, and Templates?",
        "a": "Expose infrastructure capabilities through stable interfaces."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 60,
    "courseId": 15,
    "courseSlug": "platform-engineering-product-operating-model",
    "courseTitle": "Platform Engineering Operating Model",
    "courseTrack": "Platform Engineering",
    "level": "Advanced",
    "title": "Cost, Reliability, and Adoption Metrics",
    "summary": "Measure whether the platform is improving outcomes.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.766666666666666,
    "body": "## Mental model\nSenior platform work is judged by lead time, deployment frequency, reliability, cost efficiency, security posture, and user satisfaction. Dashboards should guide investment decisions.\n\n## What to practice\nPractice defining KPIs, cost allocation tags, idle resource reports, SLO rollups, and developer surveys.\n\n## Practice checkpoint\nCreate a quarterly platform review outline that connects technical work to business outcomes.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Operating Model",
        "def": "Learn how platform teams define golden paths, service ownership, paved-road APIs, SLOs, cost guardrails, and internal developer experience."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Cost, Reliability, and Adoption Metrics?",
        "a": "Measure whether the platform is improving outcomes."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 61,
    "courseId": 16,
    "courseSlug": "platform-docker-image-supply-chain",
    "courseTitle": "Docker Image and Supply Chain Operations",
    "courseTrack": "Docker",
    "level": "Fresher",
    "title": "Dockerfile Foundations and Runtime Contract",
    "summary": "Write Dockerfiles that make the application runtime obvious, repeatable, and inspectable.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.1,
    "body": "## Mental model\nA production Dockerfile is an operations document as much as a build recipe. Base image choice, working directory, copied files, user, exposed port, entrypoint, healthcheck, and build context all shape how the image behaves in CI, Kubernetes, and incidents.\n\n## What to practice\nPractice reading Dockerfiles for hidden assumptions: root user, broad COPY statements, unpinned package installs, secret leakage, missing CA certificates, and startup commands that differ from the app contract.\n\n## Practice checkpoint\nReview one Dockerfile and produce a runtime contract: process, port, filesystem writes, required env vars, user, health endpoint, and how to collect logs.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Docker Image and Supply Chain Operations",
        "def": "Build production-ready container images with clear runtime contracts, multi-stage builds, immutable promotion, scanning, SBOMs, and safe registry habits."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Dockerfile Foundations and Runtime Contract?",
        "a": "Write Dockerfiles that make the application runtime obvious, repeatable, and inspectable."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 62,
    "courseId": 16,
    "courseSlug": "platform-docker-image-supply-chain",
    "courseTitle": "Docker Image and Supply Chain Operations",
    "courseTrack": "Docker",
    "level": "Fresher",
    "title": "Multi-stage Builds and Image Size",
    "summary": "Separate build tooling from runtime images without losing debuggability.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.133333333333333,
    "body": "## Mental model\nMulti-stage builds let you compile or package in one stage and copy only required runtime artifacts into the final image. The goal is not just smaller images; it is fewer packages, fewer vulnerabilities, faster pulls, clearer provenance, and less accidental state.\n\n## What to practice\nPractice comparing single-stage and multi-stage outputs with image history, file listings, package inventory, and rebuild cache behavior. Look for compilers, package managers, tests, credentials, and temporary files that should not reach runtime.\n\n## Practice checkpoint\nConvert a single-stage app Dockerfile into a two-stage build and write a short note explaining size, security, cache, and rollback impact.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Docker Image and Supply Chain Operations",
        "def": "Build production-ready container images with clear runtime contracts, multi-stage builds, immutable promotion, scanning, SBOMs, and safe registry habits."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Multi-stage Builds and Image Size?",
        "a": "Separate build tooling from runtime images without losing debuggability."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 63,
    "courseId": 16,
    "courseSlug": "platform-docker-image-supply-chain",
    "courseTitle": "Docker Image and Supply Chain Operations",
    "courseTrack": "Docker",
    "level": "Fresher",
    "title": "Tags, Digests, Registries, and Promotion",
    "summary": "Promote exact image content through environments instead of relying on movable labels.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.033333333333335,
    "body": "## Mental model\nTags are convenient names, but digests identify immutable content. A release process should preserve the exact artifact that passed tests and make it easy to answer what changed, who promoted it, and how to roll back.\n\n## What to practice\nPractice tracing an image from local build to registry to Kubernetes manifest. Compare tags, digests, OCI labels, registry retention, pull secrets, and environment promotion records.\n\n## Practice checkpoint\nWrite an artifact promotion record that includes source commit, image digest, scan status, target environment, approver, deployment timestamp, and rollback digest.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Docker Image and Supply Chain Operations",
        "def": "Build production-ready container images with clear runtime contracts, multi-stage builds, immutable promotion, scanning, SBOMs, and safe registry habits."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Tags, Digests, Registries, and Promotion?",
        "a": "Promote exact image content through environments instead of relying on movable labels."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 64,
    "courseId": 16,
    "courseSlug": "platform-docker-image-supply-chain",
    "courseTitle": "Docker Image and Supply Chain Operations",
    "courseTrack": "Docker",
    "level": "Fresher",
    "title": "Image Scanning, SBOMs, and Runtime User",
    "summary": "Treat image security findings as operational risk instead of dashboard noise.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 21.075,
    "body": "## Mental model\nImage security combines vulnerability scanning, software bill of materials, base image updates, non-root runtime, least privilege, and registry governance. The platform team should define which findings block release and which become tracked risk.\n\n## What to practice\nPractice reviewing a scan result and separating exploitable runtime risk from irrelevant build-only noise. Check USER, file ownership, writable paths, package inventory, and whether scanners can map findings to actual runtime components.\n\n## Practice checkpoint\nCreate an image review checklist with severity policy, exception owner, SBOM location, runtime user, exposed ports, update cadence, and digest-based promotion evidence.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Docker Image and Supply Chain Operations",
        "def": "Build production-ready container images with clear runtime contracts, multi-stage builds, immutable promotion, scanning, SBOMs, and safe registry habits."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Image Scanning, SBOMs, and Runtime User?",
        "a": "Treat image security findings as operational risk instead of dashboard noise."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 65,
    "courseId": 17,
    "courseSlug": "platform-aws-operations-foundations",
    "courseTitle": "AWS Operations Foundations for Platform Engineers",
    "courseTrack": "AWS Operations",
    "level": "Intermediate",
    "title": "AWS Operational Excellence and Ownership",
    "summary": "Translate AWS service sprawl into owned, observable, reviewable operations.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.058333333333334,
    "body": "## Mental model\nOperational excellence means teams know who owns each workload, how changes are made, which signals matter, what risks are accepted, and how lessons improve the system. In AWS interviews, strong answers connect account structure, IAM, networking, telemetry, and recovery into one operating model.\n\n## What to practice\nPractice writing an ownership map for one service: account, region, VPC, load balancer, compute, database, DNS, alarms, runbook, deploy path, and escalation owner.\n\n## Practice checkpoint\nCreate an AWS operations readiness review with owner, blast radius, backup expectation, alarm strategy, deployment path, and break-glass notes.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS Operations Foundations for Platform Engineers",
        "def": "Operate AWS-backed platforms through Well-Architected thinking, CloudWatch signals, VPC request paths, load balancer health, backups, and change safety."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of AWS Operational Excellence and Ownership?",
        "a": "Translate AWS service sprawl into owned, observable, reviewable operations."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 66,
    "courseId": 17,
    "courseSlug": "platform-aws-operations-foundations",
    "courseTitle": "AWS Operations Foundations for Platform Engineers",
    "courseTrack": "AWS Operations",
    "level": "Intermediate",
    "title": "CloudWatch Metrics, Logs, Alarms, and Dashboards",
    "summary": "Use CloudWatch as a hypothesis tool, not a pile of disconnected alarms.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 21.058333333333334,
    "body": "## Mental model\nCloudWatch gives metrics, logs, alarms, dashboards, synthetics, application signals, and cross-account visibility. Good operators decide which signal confirms user impact, which signal explains a dependency, and which signal belongs in a ticket instead of a page.\n\n## What to practice\nPractice reviewing an alarm inventory for missing owners, no runbook, no datapoint window, noisy thresholds, duplicate cause alerts, and dashboards that cannot show user impact.\n\n## Practice checkpoint\nDesign one dashboard for an ALB-backed EKS service that starts with request count, 5xx, latency, target health, pod readiness, deploy timestamp, and dependency saturation.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS Operations Foundations for Platform Engineers",
        "def": "Operate AWS-backed platforms through Well-Architected thinking, CloudWatch signals, VPC request paths, load balancer health, backups, and change safety."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of CloudWatch Metrics, Logs, Alarms, and Dashboards?",
        "a": "Use CloudWatch as a hypothesis tool, not a pile of disconnected alarms."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 67,
    "courseId": 17,
    "courseSlug": "platform-aws-operations-foundations",
    "courseTitle": "AWS Operations Foundations for Platform Engineers",
    "courseTrack": "AWS Operations",
    "level": "Intermediate",
    "title": "VPC, Load Balancer, Route 53, and Health Paths",
    "summary": "Debug cloud connectivity by tracing one request path end to end.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.1,
    "body": "## Mental model\nA request can fail at DNS, TLS, load balancer listener, target group health, security group, subnet route, node, Service, EndpointSlice, Pod readiness, or application dependency. AWS operations skill is knowing which layer produced the symptom.\n\n## What to practice\nPractice drawing Route 53 to ALB to target group to node or Pod IP to Kubernetes Service to Pod. Include security groups, subnets, route tables, NAT, and health check paths.\n\n## Practice checkpoint\nGiven an unhealthy target group, produce a read-only investigation plan that checks AWS target health, ALB logs, security groups, Ingress events, EndpointSlices, and pod readiness.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS Operations Foundations for Platform Engineers",
        "def": "Operate AWS-backed platforms through Well-Architected thinking, CloudWatch signals, VPC request paths, load balancer health, backups, and change safety."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of VPC, Load Balancer, Route 53, and Health Paths?",
        "a": "Debug cloud connectivity by tracing one request path end to end."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 68,
    "courseId": 17,
    "courseSlug": "platform-aws-operations-foundations",
    "courseTitle": "AWS Operations Foundations for Platform Engineers",
    "courseTrack": "AWS Operations",
    "level": "Intermediate",
    "title": "Reliability Reviews, Backups, and Change Safety",
    "summary": "Protect AWS workloads with explicit recovery objectives and reversible changes.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.958333333333332,
    "body": "## Mental model\nReliability is designed through failure isolation, quotas, scaling, backups, restore tests, deployment safety, and known rollback paths. Backups without restore drills are promises, not evidence.\n\n## What to practice\nPractice defining RTO, RPO, backup ownership, restore proof, single-AZ risk, quota headroom, deployment rollback, and a game-day scenario for one platform service.\n\n## Practice checkpoint\nWrite a reliability review that explains what happens when one AZ fails, a bad deploy ships, a database restore is needed, or CloudWatch alarms become noisy.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "AWS Operations Foundations for Platform Engineers",
        "def": "Operate AWS-backed platforms through Well-Architected thinking, CloudWatch signals, VPC request paths, load balancer health, backups, and change safety."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Reliability Reviews, Backups, and Change Safety?",
        "a": "Protect AWS workloads with explicit recovery objectives and reversible changes."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 69,
    "courseId": 18,
    "courseSlug": "platform-observability-telemetry-engineering",
    "courseTitle": "Observability and Telemetry Engineering",
    "courseTrack": "Observability",
    "level": "Advanced",
    "title": "Metrics, Logs, Traces, and OpenTelemetry Signals",
    "summary": "Choose the right signal for the question under pressure.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.033333333333335,
    "body": "## Mental model\nMetrics show trends and alert conditions, logs explain discrete events, traces connect request hops, and OpenTelemetry provides a vendor-neutral model for producing and moving those signals. Interview-ready answers explain when each signal changes the next action.\n\n## What to practice\nPractice taking one latency incident and mapping which question is answered by RED metrics, which by logs, which by traces, and which by Kubernetes events.\n\n## Practice checkpoint\nCreate a signal decision table for one service: user symptom, metric panel, log field, trace span, owner, retention, and cost risk.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Observability and Telemetry Engineering",
        "def": "Design metrics, logs, traces, OpenTelemetry pipelines, Prometheus alerts, dashboards, and ownership rules that reduce incident time instead of creating telemetry noise."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Metrics, Logs, Traces, and OpenTelemetry Signals?",
        "a": "Choose the right signal for the question under pressure."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 70,
    "courseId": 18,
    "courseSlug": "platform-observability-telemetry-engineering",
    "courseTitle": "Observability and Telemetry Engineering",
    "courseTrack": "Observability",
    "level": "Advanced",
    "title": "Instrumentation, Context Propagation, and Sampling",
    "summary": "Make telemetry coherent across services without collecting everything forever.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.95,
    "body": "## Mental model\nInstrumentation must preserve context across service boundaries so a request can be followed. Sampling decides which traces to keep. Poor propagation, unbounded attributes, and inconsistent service names turn observability into expensive guesswork.\n\n## What to practice\nPractice reviewing instrumentation for service.name, environment, version, route, status, trace ID in logs, baggage boundaries, and attributes that could explode cardinality.\n\n## Practice checkpoint\nWrite an instrumentation review for a checkout path that includes propagation, sampling, semantic attributes, logs correlation, and privacy redaction.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Observability and Telemetry Engineering",
        "def": "Design metrics, logs, traces, OpenTelemetry pipelines, Prometheus alerts, dashboards, and ownership rules that reduce incident time instead of creating telemetry noise."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Instrumentation, Context Propagation, and Sampling?",
        "a": "Make telemetry coherent across services without collecting everything forever."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 71,
    "courseId": 18,
    "courseSlug": "platform-observability-telemetry-engineering",
    "courseTitle": "Observability and Telemetry Engineering",
    "courseTrack": "Observability",
    "level": "Advanced",
    "title": "Prometheus Alert Quality and Cardinality",
    "summary": "Build alerts that are actionable and metrics that stay affordable.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.983333333333334,
    "body": "## Mental model\nPrometheus-style systems reward clear metric names and stable labels. Alerts should represent urgent, actionable conditions tied to user pain or imminent resource exhaustion. High-cardinality labels and cause-only pages make systems slower and responders tired.\n\n## What to practice\nPractice reviewing a PrometheusRule for `for` duration, severity labels, owner, runbook URL, grouping, inhibition, symptom-versus-cause, and labels that include user IDs or request IDs.\n\n## Practice checkpoint\nRewrite one noisy alert into a better symptom alert with routing labels, runbook, threshold reasoning, and dashboard link.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Observability and Telemetry Engineering",
        "def": "Design metrics, logs, traces, OpenTelemetry pipelines, Prometheus alerts, dashboards, and ownership rules that reduce incident time instead of creating telemetry noise."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Prometheus Alert Quality and Cardinality?",
        "a": "Build alerts that are actionable and metrics that stay affordable."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 72,
    "courseId": 18,
    "courseSlug": "platform-observability-telemetry-engineering",
    "courseTitle": "Observability and Telemetry Engineering",
    "courseTrack": "Observability",
    "level": "Advanced",
    "title": "Dashboards, Runbooks, and Telemetry Operations",
    "summary": "Operate telemetry as a production dependency with owners and budgets.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.941666666666666,
    "body": "## Mental model\nDashboards should answer whether users are hurt, where the blast radius is, what changed, and which dependency is saturated. Telemetry platforms also need retention policy, access control, cost review, pipeline health, and incident runbooks.\n\n## What to practice\nPractice designing a dashboard hierarchy: executive symptom view, service drilldown, dependency view, Kubernetes capacity view, and deployment/change timeline.\n\n## Practice checkpoint\nCreate an observability readiness artifact with dashboards, alert inventory, log fields, trace coverage, ownership, retention, and telemetry cost guardrails.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Observability and Telemetry Engineering",
        "def": "Design metrics, logs, traces, OpenTelemetry pipelines, Prometheus alerts, dashboards, and ownership rules that reduce incident time instead of creating telemetry noise."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Dashboards, Runbooks, and Telemetry Operations?",
        "a": "Operate telemetry as a production dependency with owners and budgets."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 73,
    "courseId": 19,
    "courseSlug": "platform-incident-response-reliability",
    "courseTitle": "Incident Response and Reliability Leadership",
    "courseTrack": "Incident Response",
    "level": "Advanced",
    "title": "Incident Roles, Severity, and First Response",
    "summary": "Declare incidents early and give responders clear roles before coordination fails.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.991666666666667,
    "body": "## Mental model\nIncident response is a social and technical system. Clear incident command, operations, communications, planning, severity, and decision logging prevent freelancing during stress. Strong responders separate user impact, mitigation, diagnosis, and long-term fix.\n\n## What to practice\nPractice receiving a page and writing the first five minutes: declare or not, severity, commander, comms channel, symptom, affected users, current mitigation, next update time.\n\n## Practice checkpoint\nRun a tabletop where one person is incident commander, one handles operations, one writes comms, and one maintains the timeline.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Incident Response and Reliability Leadership",
        "def": "Practice incident command, severity, mitigation, communications, timelines, postmortems, corrective actions, and game days for platform roles."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Incident Roles, Severity, and First Response?",
        "a": "Declare incidents early and give responders clear roles before coordination fails."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 74,
    "courseId": 19,
    "courseSlug": "platform-incident-response-reliability",
    "courseTitle": "Incident Response and Reliability Leadership",
    "courseTrack": "Incident Response",
    "level": "Advanced",
    "title": "Timeline, Communications, and Mitigation",
    "summary": "Keep users and responders aligned while reducing blast radius.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.916666666666668,
    "body": "## Mental model\nDuring incidents, communication is part of mitigation. A timeline records what changed and when. Mitigation choices should stop the bleeding while preserving evidence and avoiding uncoordinated production changes.\n\n## What to practice\nPractice writing stakeholder updates that are honest about impact, action, uncertainty, next update time, and owner without dumping raw debugging details.\n\n## Practice checkpoint\nProduce a live incident document with status, impact, suspected trigger, actions taken, commands run, decisions, owners, and handoff notes.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Incident Response and Reliability Leadership",
        "def": "Practice incident command, severity, mitigation, communications, timelines, postmortems, corrective actions, and game days for platform roles."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Timeline, Communications, and Mitigation?",
        "a": "Keep users and responders aligned while reducing blast radius."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 75,
    "courseId": 19,
    "courseSlug": "platform-incident-response-reliability",
    "courseTitle": "Incident Response and Reliability Leadership",
    "courseTrack": "Incident Response",
    "level": "Advanced",
    "title": "Postmortems and Corrective Actions",
    "summary": "Turn painful failures into system improvements without blame.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.008333333333333,
    "body": "## Mental model\nA postmortem should explain impact, contributing factors, detection gaps, response behavior, mitigation, root causes, and corrective actions. The best actions reduce recurrence or impact; they are owned, dated, and reviewable.\n\n## What to practice\nPractice converting a vague action like 'be more careful' into specific work: add canary gate, tighten alert, fix dashboard, change runbook, add test, reduce timeout, improve rollback.\n\n## Practice checkpoint\nWrite a postmortem summary that includes what went well, what made response harder, action owners, and how the platform will verify improvement.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Incident Response and Reliability Leadership",
        "def": "Practice incident command, severity, mitigation, communications, timelines, postmortems, corrective actions, and game days for platform roles."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Postmortems and Corrective Actions?",
        "a": "Turn painful failures into system improvements without blame."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 76,
    "courseId": 19,
    "courseSlug": "platform-incident-response-reliability",
    "courseTitle": "Incident Response and Reliability Leadership",
    "courseTrack": "Incident Response",
    "level": "Advanced",
    "title": "Game Days and Incident Readiness",
    "summary": "Rehearse failure before the real outage writes the exam.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.933333333333334,
    "body": "## Mental model\nGame days test people, dashboards, runbooks, automation, and recovery assumptions. They should be scoped, safe, and measured. The goal is not theater; it is finding gaps while the stakes are lower.\n\n## What to practice\nPractice designing a game day for DNS failure, bad deploy, unavailable AZ, exhausted Pod IPs, or noisy alerts. Include abort criteria and customer-safety boundaries.\n\n## Practice checkpoint\nCreate an incident readiness calendar with quarterly scenarios, owners, expected evidence, and improvement backlog review.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Incident Response and Reliability Leadership",
        "def": "Practice incident command, severity, mitigation, communications, timelines, postmortems, corrective actions, and game days for platform roles."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Game Days and Incident Readiness?",
        "a": "Rehearse failure before the real outage writes the exam."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 77,
    "courseId": 20,
    "courseSlug": "platform-finops-kubernetes-aws",
    "courseTitle": "FinOps for Kubernetes and AWS Platforms",
    "courseTrack": "FinOps",
    "level": "Advanced",
    "title": "Cost Visibility, Tags, and Ownership",
    "summary": "Make cloud cost explainable before trying to optimize it.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 20.916666666666668,
    "body": "## Mental model\nFinOps starts with visibility and accountability: accounts, tags, labels, allocation rules, shared platform costs, owner reviews, and business context. A platform team needs to show not only spend, but why spend exists.\n\n## What to practice\nPractice building a cost ownership model that maps AWS account, cluster, namespace, service, owner, environment, team, and cost center.\n\n## Practice checkpoint\nCreate a cost review artifact with top drivers, owner, trend, unit metric, avoidable waste, and reliability constraints.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "FinOps for Kubernetes and AWS Platforms",
        "def": "Learn cost visibility, ownership, right-sizing, Kubernetes waste, AWS EKS cost drivers, guardrails, and finance-friendly tradeoff communication."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Cost Visibility, Tags, and Ownership?",
        "a": "Make cloud cost explainable before trying to optimize it."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 78,
    "courseId": 20,
    "courseSlug": "platform-finops-kubernetes-aws",
    "courseTitle": "FinOps for Kubernetes and AWS Platforms",
    "courseTrack": "FinOps",
    "level": "Advanced",
    "title": "Kubernetes Requests, Waste, and Right-sizing",
    "summary": "Reduce idle capacity without creating noisy neighbors or outages.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.866666666666667,
    "body": "## Mental model\nKubernetes cost is shaped by requests, limits, node shape, autoscaling, bin packing, topology constraints, DaemonSets, and workload schedules. Right-sizing is a reliability decision as well as a finance decision.\n\n## What to practice\nPractice comparing requested CPU/memory with actual usage, restart history, throttling, OOMKilled events, HPA behavior, and PDB constraints.\n\n## Practice checkpoint\nWrite a right-sizing recommendation that includes expected savings, risk, validation window, rollback plan, and owner approval.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "FinOps for Kubernetes and AWS Platforms",
        "def": "Learn cost visibility, ownership, right-sizing, Kubernetes waste, AWS EKS cost drivers, guardrails, and finance-friendly tradeoff communication."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Kubernetes Requests, Waste, and Right-sizing?",
        "a": "Reduce idle capacity without creating noisy neighbors or outages."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 79,
    "courseId": 20,
    "courseSlug": "platform-finops-kubernetes-aws",
    "courseTitle": "FinOps for Kubernetes and AWS Platforms",
    "courseTrack": "FinOps",
    "level": "Advanced",
    "title": "AWS Cost Drivers for EKS Platforms",
    "summary": "Find the cloud bill surprises that hide outside worker nodes.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 20.95,
    "body": "## Mental model\nEKS platform costs include EC2 or Fargate compute, EBS, snapshots, load balancers, NAT Gateways, cross-AZ data, logs, metrics, traces, public IPs, support, and third-party tooling. The surprise is often network or observability, not Pods.\n\n## What to practice\nPractice building a cost driver map for one EKS service from request path to compute, network, storage, and telemetry usage.\n\n## Practice checkpoint\nProduce an EKS cost investigation note that ranks compute, storage, load balancer, NAT, data transfer, and telemetry hypotheses.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "FinOps for Kubernetes and AWS Platforms",
        "def": "Learn cost visibility, ownership, right-sizing, Kubernetes waste, AWS EKS cost drivers, guardrails, and finance-friendly tradeoff communication."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of AWS Cost Drivers for EKS Platforms?",
        "a": "Find the cloud bill surprises that hide outside worker nodes."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 80,
    "courseId": 20,
    "courseSlug": "platform-finops-kubernetes-aws",
    "courseTitle": "FinOps for Kubernetes and AWS Platforms",
    "courseTrack": "FinOps",
    "level": "Advanced",
    "title": "FinOps Review Cadence and Guardrails",
    "summary": "Make cost optimization a durable operating habit instead of a panic exercise.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.891666666666666,
    "body": "## Mental model\nFinOps works when teams have a regular review cadence, guardrails, budgets, anomaly detection, exception process, and a way to evaluate savings against reliability and delivery impact.\n\n## What to practice\nPractice writing cost guardrails: required tags, namespace quotas, idle resource reports, log retention tiers, load balancer review, budget alerts, and exception expiry.\n\n## Practice checkpoint\nBuild a monthly platform FinOps review agenda with business context, technical recommendations, risks, owners, and follow-up evidence.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "FinOps for Kubernetes and AWS Platforms",
        "def": "Learn cost visibility, ownership, right-sizing, Kubernetes waste, AWS EKS cost drivers, guardrails, and finance-friendly tradeoff communication."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of FinOps Review Cadence and Guardrails?",
        "a": "Make cost optimization a durable operating habit instead of a panic exercise."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 81,
    "courseId": 21,
    "courseSlug": "platform-career-job-search-sprint",
    "courseTitle": "Platform Engineering Job Search Sprint",
    "courseTrack": "Career",
    "level": "Advanced",
    "title": "Skill Gap Map for Platform Roles",
    "summary": "Prioritize learning by role requirements instead of scattered tutorials.",
    "sequence": 1,
    "totalLessons": 4,
    "duration": 21.058333333333334,
    "body": "## Mental model\nA DevOps, SRE, or cloud engineer preparing for platform roles needs focused practice. Most platform interviews cluster around Linux, networking, Kubernetes, AWS, Terraform, CI/CD, observability, incident response, security, and communication. A gap map turns that into a weekly plan.\n\n## What to practice\nPractice collecting five target job descriptions and scoring yourself across must-have skills, nice-to-have skills, evidence you already have, and labs you need to complete.\n\n## Practice checkpoint\nCreate a gap map that chooses your next 10 study blocks and ties each block to one interview story or portfolio artifact.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Job Search Sprint",
        "def": "Turn learning into interview-ready proof: skill gap maps, portfolio narratives, resume bullets, recruiter screens, STAR stories, and a 30-day prep operating plan."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Skill Gap Map for Platform Roles?",
        "a": "Prioritize learning by role requirements instead of scattered tutorials."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 82,
    "courseId": 21,
    "courseSlug": "platform-career-job-search-sprint",
    "courseTitle": "Platform Engineering Job Search Sprint",
    "courseTrack": "Career",
    "level": "Advanced",
    "title": "Portfolio Evidence and Project Narratives",
    "summary": "Show credible operational judgment with real system artifacts.",
    "sequence": 2,
    "totalLessons": 4,
    "duration": 20.983333333333334,
    "body": "## Mental model\nPortfolio-grade proof is not a screenshot. It shows constraints, architecture, commands, decisions, validation, rollback, cost, security, and what you would improve next. The goal is credible judgment, not pretending a lab is production.\n\n## What to practice\nPractice turning a Platform Academy lab into a README section with problem, environment, commands, evidence, tradeoffs, diagram, and interview talking points.\n\n## Practice checkpoint\nProduce an artifact pack with one Kubernetes debug story, one Terraform/AWS story, one CI/CD story, one incident story, and one platform-product story.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Job Search Sprint",
        "def": "Turn learning into interview-ready proof: skill gap maps, portfolio narratives, resume bullets, recruiter screens, STAR stories, and a 30-day prep operating plan."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Portfolio Evidence and Project Narratives?",
        "a": "Show credible operational judgment with real system artifacts."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 83,
    "courseId": 21,
    "courseSlug": "platform-career-job-search-sprint",
    "courseTitle": "Platform Engineering Job Search Sprint",
    "courseTrack": "Career",
    "level": "Advanced",
    "title": "Resume Bullets, Recruiter Screens, and STAR Stories",
    "summary": "Translate engineering work into clear job-search signal.",
    "sequence": 3,
    "totalLessons": 4,
    "duration": 21.041666666666668,
    "body": "## Mental model\nRecruiters scan for keywords and scope. Technical reviewers listen for judgment. Strong prep means having concise bullets and deeper STAR stories for the same work: situation, task, action, result, tradeoffs, and what you learned.\n\n## What to practice\nPractice rewriting vague resume lines into specific platform outcomes with action, technology, scale, risk, and result. Prepare recruiter answers for layoffs, gaps, compensation, relocation, and role fit.\n\n## Practice checkpoint\nCreate a question bank of 12 STAR stories covering incidents, conflict, automation, cost, security, failed project, learning fast, and leading without authority.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Job Search Sprint",
        "def": "Turn learning into interview-ready proof: skill gap maps, portfolio narratives, resume bullets, recruiter screens, STAR stories, and a 30-day prep operating plan."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of Resume Bullets, Recruiter Screens, and STAR Stories?",
        "a": "Translate engineering work into clear job-search signal."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  },
  {
    "id": 84,
    "courseId": 21,
    "courseSlug": "platform-career-job-search-sprint",
    "courseTitle": "Platform Engineering Job Search Sprint",
    "courseTrack": "Career",
    "level": "Advanced",
    "title": "30-Day Interview Prep Operating Plan",
    "summary": "Run job search like an incident response and learning system.",
    "sequence": 4,
    "totalLessons": 4,
    "duration": 20.933333333333334,
    "body": "## Mental model\nA strong 30-day plan balances applications, networking, daily drills, mock interviews, hands-on labs, resume iteration, rest, and feedback loops. Track leading indicators so the search does not become a fog.\n\n## What to practice\nPractice scheduling blocks for Kubernetes debugging, Terraform plan review, AWS/IAM, CI/CD design, SRE incidents, behavioral stories, and company-specific prep.\n\n## Practice checkpoint\nBuild a 30-day tracker with target roles, study blocks, completed labs, mock results, applications, referrals, follow-ups, weak areas, and next actions.\n\n## Operator habit\nWrite down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.",
    "practiceNotes": "Scenario: You are the platform engineer on call for a realistic team environment.\nChecklist:\n- State the user impact in one sentence.\n- Identify the system boundary and owner.\n- Collect read-only evidence first.\n- Propose the smallest reversible change.\n- Capture what should become a dashboard, alert, runbook, or automation.\nCommands:\n$ kubectl get events -A --sort-by=.lastTimestamp\n$ kubectl describe pod POD_NAME -n NAMESPACE\n$ kubectl logs deploy/APP -n NAMESPACE --since=15m",
    "terms": [
      {
        "term": "Platform Engineering Job Search Sprint",
        "def": "Turn learning into interview-ready proof: skill gap maps, portfolio narratives, resume bullets, recruiter screens, STAR stories, and a 30-day prep operating plan."
      },
      {
        "term": "Evidence",
        "def": "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."
      },
      {
        "term": "Blast radius",
        "def": "The set of users, tenants, workloads, or systems affected by a failure or change."
      },
      {
        "term": "Rollback",
        "def": "A planned path to return to a known-good state when a change causes harm."
      },
      {
        "term": "Runbook",
        "def": "A step-by-step guide that helps responders diagnose and mitigate an incident safely."
      }
    ],
    "flashcards": [
      {
        "q": "What is the main goal of 30-Day Interview Prep Operating Plan?",
        "a": "Run job search like an incident response and learning system."
      },
      {
        "q": "Why collect evidence before changing live systems?",
        "a": "It reduces guessing, protects users, and makes the fix reviewable."
      },
      {
        "q": "What should a learner produce after each lab?",
        "a": "A clear diagnosis, a safe action plan, and a reusable note for future incidents."
      }
    ]
  }
];

export const roadmapStages: RoadmapStage[] = [
  {
    "id": 1,
    "title": "Linux Operator Foundations",
    "level": "Fresher",
    "role": "Inspect servers, containers, logs, processes, permissions, and text output from evidence.",
    "focus": "Shell fluency for every later Kubernetes and CI/CD troubleshooting workflow.",
    "checkpoints": [
      "Find relevant files and logs in a project or container filesystem.",
      "Explain process exit codes and permission failures.",
      "Build a short text pipeline that extracts incident evidence."
    ],
    "courses": [
      "Linux and Command Line Foundations"
    ],
    "completed": true,
    "inProgress": false
  },
  {
    "id": 2,
    "title": "Networking Mental Model",
    "level": "Fresher",
    "role": "You can locate failures across DNS, ports, TLS, HTTP, Ingress, Services, and policies.",
    "focus": "Practical packet-path reasoning before cloud load balancers and service meshes.",
    "checkpoints": [
      "Draw browser to ALB to Ingress to Service to Pod traffic.",
      "Classify timeout, 502, 503, TLS, and DNS symptoms.",
      "Design a minimal allowlist for a three-tier service."
    ],
    "courses": [
      "Networking Foundations for Kubernetes"
    ],
    "completed": true,
    "inProgress": false
  },
  {
    "id": 3,
    "title": "Kubernetes Object Mental Model",
    "level": "Fresher",
    "role": "You can explain how images, Pods, Deployments, Services, labels, and probes fit together.",
    "focus": "Fresher fundamentals before production debugging.",
    "checkpoints": [
      "Trace a Deployment to ReplicaSet to Pod.",
      "Find why a Service has no ready endpoints.",
      "Explain readiness, liveness, requests, ConfigMaps, and Secrets."
    ],
    "courses": [
      "Kubernetes Fundamentals"
    ],
    "completed": true,
    "inProgress": false
  },
  {
    "id": 4,
    "title": "kubectl First Responder",
    "level": "Fresher",
    "role": "You can collect evidence for common Pod failures without guessing.",
    "focus": "Read-only debugging with describe, logs, events, exec, and port-forward.",
    "checkpoints": [
      "Capture previous logs for CrashLoopBackOff.",
      "Separate ImagePullBackOff from application crashes.",
      "Read scheduler events for Pending Pods."
    ],
    "courses": [
      "kubectl Debugging Basics"
    ],
    "completed": true,
    "inProgress": false
  },
  {
    "id": 5,
    "title": "Cloud Native Base Layer",
    "level": "Fresher",
    "role": "You can reason about images, YAML, config, networking, and resource requests.",
    "focus": "Docker, registries, manifests, dry-runs, environment promotion, DNS, and capacity basics.",
    "checkpoints": [
      "Compare image tags and digests.",
      "Validate a manifest with dry-run.",
      "Explain service DNS and memory failure signals."
    ],
    "courses": [
      "Cloud Native Foundations"
    ],
    "completed": false,
    "inProgress": true
  },
  {
    "id": 6,
    "title": "Docker Image Operator",
    "level": "Fresher",
    "role": "You can review Dockerfiles, build runtime images, and promote immutable artifacts safely.",
    "focus": "Dockerfiles, multi-stage builds, tags, digests, registries, scans, SBOMs, and runtime users.",
    "checkpoints": [
      "Review a Dockerfile for runtime contract and root-user risk.",
      "Explain why multi-stage builds reduce operational and security risk.",
      "Promote an image by digest with scan, SBOM, and rollback evidence."
    ],
    "courses": [
      "Docker Image and Supply Chain Operations"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 7,
    "title": "EKS Operator",
    "level": "Intermediate",
    "role": "You can inspect the AWS-specific parts of an EKS cluster safely.",
    "focus": "VPC CNI, node options, IRSA, add-ons, and ALB controller operations.",
    "checkpoints": [
      "Diagnose CNI IP allocation failures.",
      "Compare managed node groups, Fargate, and EC2 workload fit.",
      "Review an IRSA trust policy and ALB controller events."
    ],
    "courses": [
      "EKS Operations"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 8,
    "title": "Helm Release Builder",
    "level": "Intermediate",
    "role": "You can ship Kubernetes changes through reviewable rendered artifacts.",
    "focus": "Chart APIs, values layering, lint/template/diff, upgrade safety, rollbacks, CRDs, and supply chain.",
    "checkpoints": [
      "Render dev, stage, and prod values.",
      "Detect selector drift before upgrade.",
      "Inspect third-party charts for RBAC and privileged settings."
    ],
    "courses": [
      "Helm for Application Delivery"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 9,
    "title": "GitOps Operator",
    "level": "Intermediate",
    "role": "You can run ArgoCD without hiding drift or over-granting teams.",
    "focus": "Applications, AppProjects, app-of-apps, sync waves, prune, self-heal, secrets, environments, and rollback.",
    "checkpoints": [
      "Explain desired state vs live state.",
      "Design AppProject boundaries for tenants.",
      "Handle HPA drift and rollback through Git."
    ],
    "courses": [
      "ArgoCD GitOps"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 10,
    "title": "Terraform AWS Platform Builder",
    "level": "Intermediate",
    "role": "You can review and evolve EKS infrastructure through reproducible Terraform changes.",
    "focus": "State, modules, plans, VPC, EKS, environment promotion, drift, and safe applies.",
    "checkpoints": [
      "Identify risky replacements and IAM changes in a Terraform plan.",
      "Explain backend, state locking, modules, variables, and outputs.",
      "Trace an EKS networking or node issue back to Terraform-owned AWS resources."
    ],
    "courses": [
      "Terraform for AWS Platform Infrastructure"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 11,
    "title": "AWS IAM and EKS Identity",
    "level": "Intermediate",
    "role": "You can debug and review AWS permissions for humans, CI/CD, controllers, and Pods.",
    "focus": "Policy evaluation, AssumeRole, trust policies, IRSA, Pod Identity, and least privilege.",
    "checkpoints": [
      "Trace AccessDenied from principal to policy statement and condition.",
      "Validate an IRSA or Pod Identity setup end to end.",
      "Review controller permissions for blast radius before install."
    ],
    "courses": [
      "AWS IAM for EKS and Platform Teams"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 12,
    "title": "AWS Operations Operator",
    "level": "Intermediate",
    "role": "You can trace AWS service failures from user symptom through cloud and Kubernetes signals.",
    "focus": "CloudWatch, Well-Architected operations, VPC paths, Route 53, ALB health, backups, and change safety.",
    "checkpoints": [
      "Build an AWS service ownership and readiness review.",
      "Design a CloudWatch dashboard that starts with user impact.",
      "Debug unhealthy ALB targets across AWS and Kubernetes evidence."
    ],
    "courses": [
      "AWS Operations Foundations for Platform Engineers"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 13,
    "title": "Production EKS Architect",
    "level": "Advanced",
    "role": "You can defend cluster architecture choices before production traffic exposes them.",
    "focus": "Private endpoint access, break-glass paths, Karpenter, multi-AZ design, cost guardrails, and upgrades.",
    "checkpoints": [
      "Design private endpoint access for operators and CI.",
      "Constrain Karpenter NodePools.",
      "Plan a cluster upgrade with deprecated API inventory."
    ],
    "courses": [
      "Production EKS Architecture"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 14,
    "title": "Shared Cluster Security Owner",
    "level": "Advanced",
    "role": "You can build tenant guardrails that reduce blast radius without blocking delivery.",
    "focus": "RBAC, network policy, Pod Security Standards, admission, secrets, and tenant boundaries.",
    "checkpoints": [
      "Use kubectl auth can-i to test least privilege.",
      "Roll out default-deny network policy with DNS allowances.",
      "Design a secret rotation and exception process."
    ],
    "courses": [
      "Kubernetes Security and Multi-tenancy"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 15,
    "title": "Kubernetes Reliability Lead",
    "level": "Advanced",
    "role": "You can turn observability and incidents into better engineering systems.",
    "focus": "RED/USE, Prometheus/Grafana, logs, traces, SLOs, burn rates, alert routing, and runbooks.",
    "checkpoints": [
      "Build a dashboard starting with user impact.",
      "Write a burn-rate alert that pages at the right urgency.",
      "Create a runbook with mitigation and post-incident follow-up."
    ],
    "courses": [
      "SRE and Observability for Kubernetes"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 16,
    "title": "Observability Telemetry Engineer",
    "level": "Advanced",
    "role": "You can design telemetry that helps responders act instead of merely storing more data.",
    "focus": "OpenTelemetry signals, context propagation, sampling, Prometheus alerts, cardinality, dashboards, and telemetry operations.",
    "checkpoints": [
      "Choose metrics, logs, traces, and events for one latency incident.",
      "Review instrumentation for propagation, sampling, labels, and privacy.",
      "Rewrite a noisy alert into an actionable symptom alert."
    ],
    "courses": [
      "Observability and Telemetry Engineering"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 17,
    "title": "Release Engineering Lead",
    "level": "Advanced",
    "role": "You can design CI/CD systems that promote trusted artifacts and protect production.",
    "focus": "Quality gates, supply chain, progressive delivery, rollback, and pipeline security.",
    "checkpoints": [
      "Define a pipeline with blocking gates and post-deploy smoke checks.",
      "Promote image digests with scan, signature, and SBOM evidence.",
      "Write canary and rollback rules tied to user-impact signals."
    ],
    "courses": [
      "CI/CD and Release Engineering"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 18,
    "title": "Incident Response Lead",
    "level": "Advanced",
    "role": "You can coordinate incidents, communicate clearly, mitigate safely, and turn failures into improvements.",
    "focus": "Incident command, severity, timelines, comms, mitigation, postmortems, corrective actions, and game days.",
    "checkpoints": [
      "Run the first five minutes of an incident with clear roles and update cadence.",
      "Write stakeholder and technical updates from the same incident state.",
      "Convert postmortem findings into owned, dated, verifiable corrective actions."
    ],
    "courses": [
      "Incident Response and Reliability Leadership"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 19,
    "title": "FinOps Platform Steward",
    "level": "Advanced",
    "role": "You can reduce AWS and Kubernetes waste while protecting reliability and team trust.",
    "focus": "Cost ownership, tags and labels, Kubernetes requests, EKS cost drivers, right-sizing, guardrails, and review cadence.",
    "checkpoints": [
      "Map EKS service spend across compute, network, storage, load balancing, and telemetry.",
      "Write a right-sizing recommendation with validation and rollback.",
      "Run a monthly FinOps review with owners, risks, and follow-up evidence."
    ],
    "courses": [
      "FinOps for Kubernetes and AWS Platforms"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 20,
    "title": "Platform Product Owner",
    "level": "Advanced",
    "role": "You can turn platform capabilities into golden paths that teams adopt and trust.",
    "focus": "Developer experience, service ownership, production readiness, platform APIs, cost, and adoption metrics.",
    "checkpoints": [
      "Design a new-service golden path with Terraform, Helm, ArgoCD, observability, and docs.",
      "Define ownership and production readiness for a service before launch.",
      "Measure platform value with reliability, cost, delivery, security, and developer-experience KPIs."
    ],
    "courses": [
      "Platform Engineering Operating Model"
    ],
    "completed": false,
    "inProgress": false
  },
  {
    "id": 21,
    "title": "Platform Career Sprint",
    "level": "Advanced",
    "role": "You can convert platform study into interview stories, portfolio evidence, and a focused 30-day search plan.",
    "focus": "Skill gap mapping, artifact packs, resume bullets, recruiter screens, STAR stories, mock interviews, and job-search metrics.",
    "checkpoints": [
      "Score five job descriptions against your current evidence and gaps.",
      "Turn labs into README-ready proof with commands, evidence, and tradeoffs.",
      "Prepare STAR stories for incidents, automation, cost, security, and leadership."
    ],
    "courses": [
      "Platform Engineering Job Search Sprint"
    ],
    "completed": false,
    "inProgress": false
  }
];
