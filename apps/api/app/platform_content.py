# ruff: noqa: E501

PLATFORM_ACADEMY_ERA = "Platform Academy"


def platform_lesson(
    title: str,
    summary: str,
    body: str,
    lab: str,
    terms: list[tuple[str, str, str, str]],
    flashcards: list[tuple[str, str, str]],
) -> dict:
    return {
        "title": title,
        "summary": summary,
        "body_simplified": body.strip(),
        "body_traditional": body.strip(),
        "pinyin": lab.strip(),
        "audio_url": None,
        "video_url": None,
        "vocabulary": terms,
        "flashcards": flashcards,
    }


PLATFORM_COURSES = [
    {
        "slug": "platform-kubernetes-foundations",
        "title": "Kubernetes Foundations for Platform Engineers",
        "era": PLATFORM_ACADEMY_ERA,
        "level": "Intermediate",
        "category": "Kubernetes",
        "description": "Build the production mental model for Pods, Deployments, Services, Ingress, config, probes, and resource signals.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Control Loops, Pods, Deployments, and Services",
                "Learn how Kubernetes reconciles desired state and how traffic reaches replaceable Pods.",
                """
## What matters in production
Kubernetes is a reconciliation system. You declare desired state, controllers compare it with observed state, and the cluster keeps moving toward the declaration. Senior operators debug by following ownership: Deployment to ReplicaSet to Pod, Service to EndpointSlice, Ingress to controller-specific load balancer.
- Treat Pods as disposable runtime state. Change the Deployment, not an owned Pod.
- Use labels as the contract between workload, Service, dashboards, alerts, and deployment automation.
- A Service with zero endpoints is usually a selector, readiness, or rollout problem, not a networking mystery.
- Ingress is a routing API. The behavior still depends on the installed controller, such as AWS Load Balancer Controller, NGINX, or Traefik.

## Inspection commands
$ kubectl get deploy,rs,pods -n payments -l app=checkout -o wide
$ kubectl describe deploy -n payments checkout
$ kubectl get svc,endpointslice -n payments -l app=checkout
$ kubectl describe ingress -n payments checkout
Look for desired/current/ready counts, old ReplicaSets with nonzero Pods, Pods not marked Ready, EndpointSlices missing Pod IPs, and Ingress events from the controller.

## Design checks
- Every Deployment should set stable app labels and a selector that will not need to change later.
- Every Service selector should match labels on ready Pods.
- Every public route should have TLS ownership, DNS ownership, and a documented rollback path.
                """,
                """
Scenario: Checkout returns 503 after a rollout.
Checklist:
- Compare Deployment desired, updated, available, and unavailable counts.
- Confirm the Service selector matches Pod labels.
- Confirm ready Pods appear in EndpointSlices.
- Read Ingress events before blaming DNS.
Commands:
$ kubectl rollout status deploy/checkout -n payments
$ kubectl get pods -n payments -l app=checkout --show-labels
$ kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
                """,
                [
                    ("Reconciliation", "Reconciliation", "Controller loop", "The controller pattern that moves actual state toward declared desired state."),
                    ("Pod", "Pod", "Workload runtime", "The smallest schedulable Kubernetes unit, normally owned by a higher-level controller."),
                    ("Deployment", "Deployment", "Workload controller", "A controller that manages ReplicaSets and rollout history for stateless Pods."),
                    ("Service", "Service", "Stable networking", "A stable virtual endpoint that selects ready Pods through labels."),
                    ("EndpointSlice", "EndpointSlice", "Service backend signal", "The object that shows which Pod IPs are currently backing a Service."),
                ],
                [
                    ("Why should you change a Deployment instead of editing an owned Pod?", "The Deployment controller will replace or overwrite the Pod to match the declared template.", "platform"),
                    ("A Service has no endpoints. What are the first three checks?", "Selector labels, Pod readiness, and EndpointSlice objects/events.", "platform"),
                    ("What does Ingress define, and what still depends on the controller?", "Ingress defines HTTP routing intent; load balancer behavior, annotations, and implementation details depend on the controller.", "platform"),
                ],
            ),
            platform_lesson(
                "Configuration, Secrets, and Safe Rollouts",
                "Separate runtime configuration from images without turning every release into a hidden production change.",
                """
## Configuration contract
Images should be immutable. Runtime differences belong in ConfigMaps, Secrets, downward API fields, or external configuration systems. The production skill is knowing which changes restart Pods, which values are sensitive, and which settings should be promoted through review.
- ConfigMaps are for non-sensitive configuration. They are not a feature flag platform by themselves.
- Kubernetes Secrets are base64-encoded API objects, not encryption by magic. Use encryption at rest, RBAC, and a secret delivery pattern such as External Secrets, Sealed Secrets, or a cloud secret manager integration.
- Environment variables are simple but usually require a Pod restart to refresh. Mounted volumes can update, but applications must reload safely.
- Do not store generated credentials from Helm charts in Git unless the secret lifecycle is deliberate.

## Inspection commands
$ kubectl get configmap,secret -n payments
$ kubectl describe pod -n payments checkout-abc123
$ kubectl get deploy -n payments checkout -o jsonpath='{.spec.template.spec.containers[0].env}'
$ kubectl rollout history deploy/checkout -n payments
Look for missing keys, wrong namespace, stale Pod templates, restarts after config changes, and whether the secret source is auditable.

## Rollout practice
- Add checksum annotations when ConfigMap or Secret changes should restart Pods.
- Keep values that vary by environment outside the image.
- Prefer one release path that can promote dev to stage to prod with explicit overrides and review.
                """,
                """
Scenario: A new feature flag is enabled in staging but not appearing in Pods.
Checklist:
- Verify the ConfigMap key exists in the workload namespace.
- Check whether the Deployment template changed after the config update.
- Confirm the application reload model: restart required or live reload supported.
- Review whether the value belongs in ConfigMap, Secret, or an external provider.
Commands:
$ kubectl get cm checkout-config -n payments -o yaml
$ kubectl rollout restart deploy/checkout -n payments
$ kubectl logs deploy/checkout -n payments --since=10m
                """,
                [
                    ("ConfigMap", "ConfigMap", "Configuration", "A Kubernetes object for non-sensitive key-value or file-style configuration."),
                    ("Secret", "Secret", "Sensitive data", "A Kubernetes object for sensitive values that still needs RBAC, encryption, and lifecycle controls."),
                    ("External Secrets", "External Secrets", "Secret integration", "A common controller pattern for syncing cloud secret manager values into Kubernetes."),
                    ("Checksum annotation", "Checksum annotation", "Rollout trigger", "A Pod template annotation used to restart workloads when rendered config changes."),
                    ("Downward API", "Downward API", "Pod metadata", "A mechanism for exposing Pod metadata and resource fields to containers."),
                ],
                [
                    ("Why is a Kubernetes Secret not enough by itself?", "It is an API object that needs encryption at rest, RBAC, auditability, and a rotation strategy.", "platform"),
                    ("When do ConfigMap changes restart Pods automatically?", "Usually they do not; you need a template change, rollout restart, or app-level reload support.", "platform"),
                    ("Why add a checksum annotation to a Helm-rendered Deployment?", "To change the Pod template when config changes so Kubernetes performs a rollout.", "platform"),
                ],
            ),
            platform_lesson(
                "Probes, Resources, and Failure Signals",
                "Use health checks and resource requests to make failures visible without creating restart storms.",
                """
## Probes as traffic and restart contracts
Readiness decides whether a Pod receives Service traffic. Liveness decides whether the kubelet restarts a container. Startup gives slow applications time to boot before liveness begins. Mixing these up causes outages.
- Readiness should fail when the instance cannot serve user traffic.
- Liveness should fail only when restarting is likely to help.
- Startup probes protect slow boot paths from premature liveness restarts.
- Resource requests drive scheduling. Limits shape runtime behavior and can create OOMKilled events or CPU throttling.

## Debug signals
$ kubectl describe pod -n payments checkout-abc123
$ kubectl logs -n payments checkout-abc123 --previous
$ kubectl top pod -n payments
$ kubectl get events -n payments --sort-by=.lastTimestamp
Look for CrashLoopBackOff, OOMKilled, readiness probe failures, image pull errors, throttling symptoms, unschedulable Pods, and PDBs blocking voluntary disruption.

## Production defaults
- Set CPU and memory requests for every container.
- Use limits deliberately; memory limits are often useful, CPU limits can create latency through throttling.
- Alert on user symptoms first, then use container restarts and saturation as diagnostic signals.
                """,
                """
Scenario: API Pods are in CrashLoopBackOff after a config release.
Checklist:
- Read the previous container logs before the next restart overwrites context.
- Check Last State, exit code, reason, and probe failures.
- Compare resource limits with observed memory and CPU usage.
- Decide whether rollback, config fix, or probe tuning is the safest first action.
Commands:
$ kubectl get pods -n payments
$ kubectl describe pod -n payments checkout-abc123
$ kubectl logs -n payments checkout-abc123 --previous
                """,
                [
                    ("Readiness probe", "Readiness probe", "Traffic gate", "A check that removes an unready Pod from Service endpoints."),
                    ("Liveness probe", "Liveness probe", "Restart signal", "A check that restarts a container when failure means restart is useful."),
                    ("Startup probe", "Startup probe", "Boot guard", "A check that delays liveness until slow startup completes."),
                    ("Requests", "Requests", "Scheduling", "CPU and memory guarantees used by the scheduler to place Pods."),
                    ("CrashLoopBackOff", "CrashLoopBackOff", "Failure state", "A repeated container crash with increasing restart backoff."),
                ],
                [
                    ("What is the difference between readiness and liveness?", "Readiness controls traffic; liveness controls restarts.", "platform"),
                    ("What is the first log command for CrashLoopBackOff?", "kubectl logs POD --previous, because the current container may have just restarted.", "platform"),
                    ("Why can CPU limits hurt latency?", "CPU throttling can delay request handling even when the node still has unused CPU capacity.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-eks-production-blueprint",
        "title": "EKS Production Blueprint",
        "era": PLATFORM_ACADEMY_ERA,
        "level": "Advanced",
        "category": "EKS",
        "description": "Design an EKS cluster with VPC/CNI choices, IAM boundaries, node capacity, add-ons, private access, and cost guardrails.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "VPC, CNI, and API Endpoint Design",
                "Make networking choices that avoid IP exhaustion, accidental exposure, and expensive traffic paths.",
                """
## EKS networking decisions
EKS runs the Kubernetes control plane for you, but the worker networking design is yours. The Amazon VPC CNI assigns VPC-routable IPs to Pods, which makes security group and routing behavior familiar but turns subnet sizing into a platform constraint.
- Use at least three Availability Zones for production node groups when the application requires zone fault tolerance.
- Size private subnets for Pod growth, not just node count.
- Watch VPC CNI warm IP or prefix behavior; IP exhaustion looks like unschedulable Pods or CNI allocation errors.
- Prefer private worker nodes. Public nodes expand the patching and exposure surface.
- Public API endpoints are convenient; private or restricted endpoints are safer for regulated environments but require access paths for operators and automation.

## Inspection commands
$ kubectl -n kube-system get ds aws-node
$ kubectl -n kube-system logs ds/aws-node -c aws-node --since=20m
$ kubectl describe node ip-10-0-12-34.ec2.internal
$ aws eks describe-cluster --name prod-platform --query 'cluster.resourcesVpcConfig'
Look for subnet capacity, endpoint access flags, CNI errors, node security groups, and whether NAT Gateway traffic is part of the steady-state cost profile.

## Tradeoffs
- Secondary IPv4 CIDRs and prefix delegation can buy Pod density, but they should be modeled before a launch.
- Private endpoint access improves control plane exposure, but you need VPN, Direct Connect, bastion, or CI runners inside the network.
- Security groups for Pods can narrow blast radius but add complexity and scale considerations.
                """,
                """
Scenario: New Pods stay Pending during a traffic spike.
Checklist:
- Confirm whether the scheduler says insufficient CPU/memory or CNI/IP allocation failure.
- Check VPC CNI logs and available subnet IPs.
- Compare max Pods per node with instance type and CNI mode.
- Decide whether to scale nodes, add subnets, enable prefix delegation, or redesign CIDR allocation.
Commands:
$ kubectl describe pod -n payments pending-pod
$ kubectl -n kube-system logs ds/aws-node -c aws-node --since=15m
$ kubectl get nodes -o wide
                """,
                [
                    ("Amazon VPC CNI", "Amazon VPC CNI", "EKS networking", "The EKS networking plugin that assigns VPC IP addresses to Pods."),
                    ("Prefix delegation", "Prefix delegation", "Pod density", "A VPC CNI mode that assigns IP prefixes to ENIs to increase Pod IP capacity."),
                    ("Private endpoint", "Private endpoint", "Control plane access", "An EKS API endpoint mode reachable from the VPC instead of the public internet."),
                    ("Multi-AZ", "Multi-AZ", "Resilience", "A design that spreads nodes and workloads across Availability Zones."),
                    ("NAT Gateway cost", "NAT Gateway cost", "Cost guardrail", "A common EKS cost source when private nodes pull images or call external services."),
                ],
                [
                    ("Why does VPC sizing matter more on EKS than on many self-managed clusters?", "The VPC CNI commonly gives Pods VPC IPs, so Pod scale consumes subnet addresses.", "platform"),
                    ("What is a key tradeoff of a private EKS API endpoint?", "Lower exposure, but operators and automation need network access into the VPC.", "platform"),
                    ("What symptom can indicate CNI IP exhaustion?", "Pods remain Pending with events or aws-node logs showing IP allocation failure.", "platform"),
                ],
            ),
            platform_lesson(
                "IAM, OIDC, IRSA, and Workload Boundaries",
                "Map Kubernetes service accounts to AWS permissions without handing every Pod the node role.",
                """
## Identity model
The node IAM role is too broad for application permissions. Workloads should receive scoped AWS permissions through a Kubernetes service account boundary. On EKS, common patterns include IAM Roles for Service Accounts (IRSA), which uses the cluster OIDC issuer and web identity federation, and EKS Pod Identity where it fits your organization.
- Give each controller and application only the AWS actions it needs.
- Bind IAM permissions to a named service account and namespace.
- Restrict instance metadata access where possible so Pods cannot fall back to node credentials.
- Review add-on permissions: AWS Load Balancer Controller, ExternalDNS, cert-manager DNS solvers, autoscalers, and secret controllers all need cloud access.

## Inspection commands
$ kubectl get sa -n payments checkout -o yaml
$ kubectl describe pod -n payments checkout-abc123 | grep -A4 Service Account
$ aws iam get-role --role-name payments-checkout-irsa
$ aws iam get-policy-version --policy-arn arn:aws:iam::123456789012:policy/payments-checkout --version-id v1
Look for service account annotations, trust policy conditions on namespace and service account, broad wildcard permissions, and accidental use of default service accounts.

## Least privilege checklist
- One service account per workload identity boundary.
- Trust policy limits subject to system:serviceaccount:NAMESPACE:NAME.
- No application Pods should need AdministratorAccess or the node instance profile.
- CloudTrail should make workload AWS calls attributable to the intended role.
                """,
                """
Scenario: ExternalDNS updates every hosted zone in the account.
Checklist:
- Find the service account used by the controller.
- Read the IAM policy and trust policy, not just the Kubernetes manifest.
- Scope permissions by hosted zone ARN where possible.
- Confirm the controller cannot assume the node role through IMDS.
Commands:
$ kubectl get deploy -n external-dns external-dns -o jsonpath='{.spec.template.spec.serviceAccountName}'
$ kubectl get sa -n external-dns external-dns -o yaml
$ aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=ChangeResourceRecordSets
                """,
                [
                    ("IRSA", "IRSA", "AWS identity", "IAM Roles for Service Accounts, a pattern for giving Pods scoped AWS permissions through service accounts."),
                    ("OIDC issuer", "OIDC issuer", "Federation", "The cluster identity provider used by IAM to validate projected service account tokens."),
                    ("Trust policy", "Trust policy", "IAM boundary", "The IAM document that defines who can assume a role."),
                    ("IMDS", "IMDS", "Node credentials", "The EC2 metadata service that can expose node role credentials if not restricted."),
                    ("Service account", "Service account", "Workload identity", "The Kubernetes identity attached to Pods and used for RBAC and cloud identity mapping."),
                ],
                [
                    ("What should an IRSA trust policy constrain?", "The cluster OIDC provider and the service account subject, including namespace and name.", "platform"),
                    ("Why is the node role dangerous as an application permission source?", "Any compromised Pod may gain broad node-level AWS permissions if metadata access is open.", "platform"),
                    ("Name two EKS controllers that commonly need AWS IAM permissions.", "AWS Load Balancer Controller, ExternalDNS, cert-manager DNS solver, Karpenter, or External Secrets.", "platform"),
                ],
            ),
            platform_lesson(
                "Node Groups, Karpenter, Add-ons, and Cost Guardrails",
                "Choose capacity and cluster add-ons that make scaling predictable without making the bill invisible.",
                """
## Capacity architecture
Managed node groups are predictable and integrate cleanly with EKS lifecycle operations. Karpenter adds faster, workload-aware provisioning and consolidation, but it must be treated as a production controller with its own disruption, permissions, and instance selection policy.
- Use managed node groups for stable baseline capacity, system workloads, or conservative operations.
- Use Karpenter NodePools when workload diversity, bin packing, Spot, or faster right-sizing matters.
- Separate system and application capacity with taints, labels, and topology spread constraints.
- Pin and upgrade add-ons deliberately: VPC CNI, CoreDNS, kube-proxy, EBS CSI, AWS Load Balancer Controller, ExternalDNS, cert-manager, metrics-server, and observability agents.

## Inspection commands
$ kubectl get nodes -L karpenter.sh/nodepool,node.kubernetes.io/instance-type,topology.kubernetes.io/zone
$ kubectl get pods -A -o wide --field-selector spec.nodeName=NODE_NAME
$ kubectl -n karpenter logs deploy/karpenter --since=30m
$ kubectl get pdb -A
Look for single-AZ concentration, expensive oversized nodes, system Pods on preemptible capacity, missing PDBs, and consolidation blocked by disruption budgets.

## Cost guardrails
- Require resource requests so autoscalers can make rational decisions.
- Use labels for team, service, environment, and cost center.
- Set allowed instance families and CPU/memory ranges for dynamic provisioners.
- Track idle requested CPU/memory, over-provisioning, NAT transfer, load balancer count, and unattached volumes.
                """,
                """
Scenario: The cluster scaled out during a batch job and never scaled back in.
Checklist:
- Check whether Pods still request capacity or PDBs block disruption.
- Look for node consolidation events and reasons.
- Compare requested resources with actual usage.
- Review NodePool constraints, Spot/on-demand split, and expire-after policy.
Commands:
$ kubectl get nodes --show-labels
$ kubectl get pdb -A
$ kubectl -n karpenter logs deploy/karpenter --since=1h | grep -i consolidation
                """,
                [
                    ("Managed node group", "Managed node group", "EKS capacity", "An AWS-managed EC2 node group integrated with EKS lifecycle operations."),
                    ("Karpenter", "Karpenter", "Autoscaling", "A Kubernetes-native node provisioning controller commonly used for fast, workload-aware capacity."),
                    ("NodePool", "NodePool", "Karpenter policy", "A Karpenter capacity policy describing scheduling, constraints, and disruption behavior."),
                    ("PodDisruptionBudget", "PodDisruptionBudget", "Availability", "A policy that limits voluntary disruption for matching Pods."),
                    ("Cluster add-on", "Cluster add-on", "Operations", "A component such as CNI, CoreDNS, CSI, or controller that must be versioned and upgraded."),
                ],
                [
                    ("When are managed node groups a better default than Karpenter?", "Stable baseline capacity, system workloads, and teams that value simpler lifecycle operations.", "platform"),
                    ("What can block Karpenter consolidation?", "PDBs, Pod constraints, disruption policy, required capacity, or NodePool constraints.", "platform"),
                    ("Name three EKS cost signals to watch.", "Idle requested resources, NAT data processing, load balancer count, orphaned volumes, and oversized nodes.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-helm-production",
        "title": "Helm in Production",
        "era": PLATFORM_ACADEMY_ERA,
        "level": "Intermediate",
        "category": "Helm",
        "description": "Build charts that are reviewable, testable, rollback-aware, and safe for multi-environment delivery.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Chart Anatomy, Values Layering, and Template Contracts",
                "Design charts so platform teams can review intent before Kubernetes receives YAML.",
                """
## Chart contract
A good chart is an API. The values file is the input surface, templates are the implementation, and rendered manifests are the release artifact. Senior chart authors optimize for boring upgrades and readable diffs.
- Keep values names stable, explicit, and documented.
- Prefer values that match decisions operators actually need to make: image, resources, replicas, service, ingress, env, probes, tolerations, and autoscaling.
- Avoid deeply nested optional values unless the grouping reduces real complexity.
- Quote strings deliberately and handle YAML type coercion.
- Namespace helper templates, because named templates are globally visible inside a render.

## Inspection commands
$ helm lint charts/checkout
$ helm template checkout charts/checkout -f values/stage.yaml > rendered.yaml
$ helm diff upgrade checkout charts/checkout -n payments -f values/prod.yaml
$ kubeconform -strict rendered.yaml
Look for unexpected nulls, missing required values, unstable names, selector changes, and rendered resources that differ from the reviewer's mental model.

## Design checks
- Values should not require editing templates for normal environment promotion.
- Helpers should own labels and names so selectors are consistent.
- Defaults should be safe for local dev, but production overlays should be explicit.
                """,
                """
Scenario: A chart works in dev but renders broken prod YAML.
Checklist:
- Render with the exact prod values stack.
- Diff rendered manifests against the previous release.
- Validate the rendered YAML with a Kubernetes schema tool.
- Add required checks for values that cannot safely default.
Commands:
$ helm template checkout charts/checkout -f values/base.yaml -f values/prod.yaml --debug
$ helm lint charts/checkout
                """,
                [
                    ("values.yaml", "values.yaml", "Chart API", "The default input values consumed by Helm templates."),
                    ("_helpers.tpl", "_helpers.tpl", "Template helper", "A common file for named template helpers such as names and labels."),
                    ("helm template", "helm template", "Render", "A command that renders chart YAML locally before it reaches the cluster."),
                    ("helm diff", "helm diff", "Review", "A plugin workflow for comparing the intended release with live state."),
                    ("required", "required", "Template guard", "A Helm function that fails rendering when a necessary value is missing."),
                ],
                [
                    ("Why should a chart be treated like an API?", "Values are the input contract other teams rely on, and breaking them breaks delivery.", "platform"),
                    ("What is the value of helm template in CI?", "It renders manifests locally so schema checks and review can happen before cluster access.", "platform"),
                    ("Why namespace Helm helper templates?", "Named templates are globally visible, so generic names can collide with dependencies.", "platform"),
                ],
            ),
            platform_lesson(
                "Upgrade Safety, Rollbacks, Hooks, and CRDs",
                "Avoid common Helm release failures: immutable selectors, unsafe hooks, and CRD lifecycle surprises.",
                """
## Upgrade risk
Helm tracks release history, but Kubernetes still enforces API rules. A rendered change can be syntactically valid and operationally unsafe.
- Deployment selectors are effectively immutable. Changing selector labels often requires a migration plan, not a normal upgrade.
- CRDs are cluster-scoped APIs. Installing, upgrading, and deleting them requires a different risk model than namespaced workloads.
- Hooks can run Jobs before or after releases, but hook failure and cleanup policy must be deliberate.
- Rollback is not time travel. External state, databases, CRDs, and generated credentials may not roll back cleanly.

## Inspection commands
$ helm history checkout -n payments
$ helm status checkout -n payments
$ helm get manifest checkout -n payments
$ kubectl get crd | grep example.com
Look for selector drift, hook Jobs stuck in the namespace, CRD ownership ambiguity, release history limits, and values that generate new secrets on every install.

## Release discipline
- Use --atomic where rollback on failed upgrade is useful, but still understand what cannot roll back.
- Set --history-max so release metadata does not grow forever.
- Separate CRD delivery from app delivery for important platforms.
- Test upgrade paths, not just fresh installs.
                """,
                """
Scenario: A Helm upgrade fails because a Deployment selector changed.
Checklist:
- Stop retrying the same upgrade without a migration plan.
- Compare old and new rendered selectors.
- Decide whether to preserve labels, create a new Deployment name, or run a staged migration.
- Document whether rollback is safe for the release.
Commands:
$ helm get manifest checkout -n payments > old.yaml
$ helm template checkout charts/checkout -f values/prod.yaml > new.yaml
$ diff -u old.yaml new.yaml | grep -A4 -B4 selector
                """,
                [
                    ("Immutable selector", "Immutable selector", "Upgrade safety", "A Kubernetes selector field that cannot be changed in place for resources like Deployments."),
                    ("Helm hook", "Helm hook", "Release lifecycle", "An annotated resource that runs during a specific Helm release phase."),
                    ("CRD", "CRD", "API extension", "A CustomResourceDefinition that extends the Kubernetes API and needs careful lifecycle management."),
                    ("helm rollback", "helm rollback", "Recovery", "A command that returns a release to a previous revision where Kubernetes and external state allow it."),
                    ("--atomic", "--atomic", "Failure behavior", "A Helm upgrade flag that rolls back a failed release when possible."),
                ],
                [
                    ("Why can a Helm upgrade fail even when templates render?", "The Kubernetes API may reject immutable field changes or invalid live transitions.", "platform"),
                    ("Why are CRDs risky inside app charts?", "They define cluster-wide APIs and their upgrade/delete lifecycle may not match one application release.", "platform"),
                    ("What is a rollback limitation?", "External state, databases, generated secrets, and CRDs may not return to the prior state.", "platform"),
                ],
            ),
            platform_lesson(
                "Chart Testing, Security, and Supply Chain Review",
                "Add CI checks that catch broken manifests, risky images, and accidental privilege before release.",
                """
## Production chart checks
Chart quality is not just whether Helm can install it once. Production checks combine render tests, schema validation, policy checks, security scanning, and release diffing.
- lint the chart and render every supported values layer.
- validate rendered manifests against Kubernetes schemas.
- enforce policy for privileged containers, hostPath, hostNetwork, missing requests, and broad RBAC.
- pin image tags or digests; avoid floating latest-style tags.
- review chart dependencies and provenance when consuming third-party charts.

## Inspection commands
$ helm dependency build charts/checkout
$ helm lint charts/checkout
$ helm template checkout charts/checkout -f values/prod.yaml | kubectl apply --dry-run=server -f -
$ trivy config rendered.yaml
Look for dependency drift, insecure Pod specs, missing resource requests, cluster-admin roles, and chart archives that cannot be traced to source.

## CI pattern
- Render once, then run multiple validators against the rendered artifact.
- Store representative values files for dev, stage, and prod.
- Add a policy exception process so teams do not bypass the pipeline.
                """,
                """
Scenario: A third-party chart asks for cluster-admin.
Checklist:
- Read the rendered ClusterRole and ClusterRoleBinding.
- Identify which controller actions actually need cluster scope.
- Prefer documented narrow values or a forked/internal chart if the public defaults are too broad.
- Record the risk acceptance if you must ship broad permissions.
Commands:
$ helm template vendor charts/vendor -f values/prod.yaml > rendered.yaml
$ grep -n \"ClusterRole\\|cluster-admin\\|hostNetwork\\|privileged\" rendered.yaml
                """,
                [
                    ("Schema validation", "Schema validation", "CI check", "Checking rendered manifests against Kubernetes API schemas before applying."),
                    ("Policy as code", "Policy as code", "Guardrail", "Automated checks that reject risky Kubernetes configuration."),
                    ("Chart dependency", "Chart dependency", "Supply chain", "A chart requirement pulled from another repository or package."),
                    ("Provenance", "Provenance", "Supply chain", "Metadata and signatures used to trace and verify chart packages."),
                    ("Server dry-run", "Server dry-run", "Validation", "A Kubernetes API validation mode that checks requests without persisting them."),
                ],
                [
                    ("Why render once in CI and validate the rendered artifact?", "Every validator sees the exact YAML intended for release.", "platform"),
                    ("Name three chart security checks.", "Privileged containers, hostPath, broad RBAC, missing requests, floating image tags, and unsafe capabilities.", "platform"),
                    ("Why review third-party chart dependencies?", "They can introduce privileged resources, generated secrets, risky defaults, or unreviewed supply chain changes.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-gitops-argocd",
        "title": "GitOps with ArgoCD",
        "era": PLATFORM_ACADEMY_ERA,
        "level": "Advanced",
        "category": "ArgoCD",
        "description": "Operate ArgoCD with app-of-apps, sync waves, health, drift management, secrets, promotion, and rollback discipline.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "App-of-Apps, Projects, and Repository Boundaries",
                "Structure ArgoCD so cluster bootstrapping is reviewable and tenant boundaries are enforceable.",
                """
## GitOps operating model
ArgoCD continuously compares desired state in Git with live cluster state. A strong design makes ownership obvious: which repo owns which environment, which project can deploy to which namespace, and which bootstrap app installs platform dependencies.
- App-of-apps is useful for cluster bootstrap, but the parent app becomes a powerful root of trust.
- AppProjects should restrict source repos, destinations, and allowed resource kinds.
- Separate platform components from tenant applications when ownership, blast radius, and review paths differ.
- Avoid one giant application where a small diff can hide a risky cluster-wide change.

## Inspection commands
$ argocd app list
$ argocd app get platform-root
$ kubectl get applications -n argocd
$ kubectl get appproject -n argocd platform -o yaml
Look for broad wildcard destinations, apps with auto-prune enabled unintentionally, cluster-scoped resources in tenant projects, and parent apps that can create anything anywhere.

## Design checks
- Bootstrap order should be explicit: CRDs, controllers, policies, then workloads.
- Team repos should not be able to deploy into platform namespaces.
- Production changes should be tied to reviewable commits, not UI-only mutations.
                """,
                """
Scenario: A tenant app can deploy ClusterRoles.
Checklist:
- Inspect the AppProject allowed cluster resources.
- Review source repo and destination namespace allowlists.
- Decide whether cluster-scoped resources belong in a platform app instead.
- Add a regression test or policy for project boundaries.
Commands:
$ kubectl get appproject -n argocd tenant-a -o yaml
$ argocd app get tenant-a-checkout
                """,
                [
                    ("Application", "Application", "ArgoCD unit", "The ArgoCD resource that points to desired manifests and a destination cluster/namespace."),
                    ("AppProject", "AppProject", "Boundary", "An ArgoCD resource that restricts sources, destinations, and resource permissions."),
                    ("App-of-apps", "App-of-apps", "Bootstrap pattern", "A parent ArgoCD Application that manages child Application resources."),
                    ("Destination", "Destination", "Deploy target", "The cluster and namespace where ArgoCD applies resources."),
                    ("Root of trust", "Root of trust", "Governance", "The repository or application path that can affect large parts of the platform."),
                ],
                [
                    ("Why is AppProject design important?", "It limits which repos, namespaces, clusters, and resource kinds an application can manage.", "platform"),
                    ("What is the main risk of app-of-apps?", "The parent app can become a broad root of trust with large blast radius.", "platform"),
                    ("Why avoid UI-only production changes?", "They bypass Git review and can be overwritten or hidden from the desired-state record.", "platform"),
                ],
            ),
            platform_lesson(
                "Sync Waves, Health, Pruning, and Drift",
                "Use sync order and health checks intentionally instead of hoping all manifests apply at once.",
                """
## Sync behavior
ArgoCD applies resources in phases and waves. This is critical when CRDs must exist before custom resources, controllers must be healthy before workloads, or migrations must run before app Pods.
- Sync waves control ordering through annotations.
- Health checks decide whether an app is Healthy, Progressing, Degraded, or stuck.
- Pruning deletes live resources removed from Git. It is powerful and dangerous.
- Self-heal corrects live drift back to Git, but it can also fight emergency manual changes.
- ignoreDifferences should be narrow and documented; broad ignores hide real drift.

## Inspection commands
$ argocd app diff checkout-prod
$ argocd app sync checkout-prod --preview-changes
$ argocd app history checkout-prod
$ kubectl describe application -n argocd checkout-prod
Look for pending waves, unhealthy dependencies, resources pruned unexpectedly, ignored fields masking drift, and manual cluster changes that should become commits.

## Production policy
- Enable auto-sync only with clear prune and self-heal expectations.
- Use sync windows or approval gates for high-risk environments.
- Keep rollback guidance tied to Git revisions, Helm release history, database compatibility, and feature flags.
                """,
                """
Scenario: ArgoCD reports OutOfSync after an HPA changes replicas.
Checklist:
- Run argocd app diff and identify the field causing drift.
- Decide whether that field should be owned by Git or by a controller.
- If ignored, scope ignoreDifferences to the exact group, kind, name, and field.
- Document why ignoring the field is safe.
Commands:
$ argocd app diff checkout-prod
$ kubectl get hpa,deploy -n payments checkout -o yaml
                """,
                [
                    ("Sync wave", "Sync wave", "Apply order", "An ArgoCD annotation-based ordering mechanism for sync operations."),
                    ("Pruning", "Pruning", "Deletion", "Deleting live resources that no longer exist in desired state."),
                    ("Self-heal", "Self-heal", "Drift correction", "Automatically reapplying Git desired state when live state changes."),
                    ("ignoreDifferences", "ignoreDifferences", "Diff control", "A scoped ArgoCD setting for ignoring specific live-vs-desired differences."),
                    ("Health check", "Health check", "Release status", "ArgoCD logic that determines whether resources are healthy enough for the app state."),
                ],
                [
                    ("When should pruning be treated carefully?", "Whenever deleting removed Git resources could destroy shared, stateful, or manually migrated infrastructure.", "platform"),
                    ("What makes ignoreDifferences dangerous?", "Broad ignores can hide real drift and let production diverge from Git.", "platform"),
                    ("Why do sync waves matter for CRDs?", "Custom resources cannot apply correctly until their CRDs and often their controllers exist.", "platform"),
                ],
            ),
            platform_lesson(
                "Secrets, Multi-Environment Promotion, and Rollback",
                "Promote the same intent across environments while keeping secrets and rollback reality visible.",
                """
## Promotion model
GitOps does not remove release engineering; it makes it inspectable. A production promotion should answer what changed, which environment values changed, which secrets are referenced, and how rollback would work.
- Keep base manifests or charts shared, with environment overlays or values that are reviewable.
- Do not commit plaintext secrets. Use External Secrets, Sealed Secrets, SOPS, or another documented encryption/sync approach.
- Promotion by Git commit or pull request is easier to audit than clicking sync in a UI.
- Rollback may mean reverting a Git commit, syncing a prior chart version, or disabling a feature flag while data migrations remain forward-only.

## Inspection commands
$ git diff main..release/prod -- environments/prod
$ argocd app history checkout-prod
$ argocd app rollback checkout-prod REVISION
$ kubectl get externalsecret,sealedsecret -A
Look for environment-only drift, secret references that do not exist, generated chart passwords, rollback steps that ignore database state, and missing post-incident commits.

## Release readiness
- Every app should name its secret source and rotation owner.
- Every production app should have a rollback note for config-only, image, chart, and database-backed changes.
- Promotion should preserve the same artifact when possible: image digest, chart version, and reviewed values.
                """,
                """
Scenario: Production needs rollback after an ArgoCD sync.
Checklist:
- Identify whether the failed change was image, config, chart, CRD, or data migration.
- Check app history and Git commits.
- Disable auto-sync if manual rollback would otherwise be overwritten.
- Prefer reverting the Git change, then sync, when Git should remain the source of truth.
Commands:
$ argocd app history checkout-prod
$ argocd app get checkout-prod
$ git log --oneline -- environments/prod/checkout
                """,
                [
                    ("Environment overlay", "Environment overlay", "Promotion", "Environment-specific values or patches applied over a shared base."),
                    ("ExternalSecret", "ExternalSecret", "Secret sync", "A controller-managed object that pulls secrets from an external provider into Kubernetes."),
                    ("SealedSecret", "SealedSecret", "Encrypted secret", "An encrypted secret manifest that can be stored in Git and decrypted by a cluster controller."),
                    ("Promotion", "Promotion", "Release flow", "Moving a reviewed artifact and config from one environment to the next."),
                    ("Rollback", "Rollback", "Recovery", "Returning service behavior to a known-good state while respecting external state and Git ownership."),
                ],
                [
                    ("Why is reverting Git often better than only clicking rollback?", "Git remains the desired-state record and ArgoCD will not fight the recovery.", "platform"),
                    ("Name three safe secret patterns for GitOps.", "External Secrets, Sealed Secrets, SOPS-encrypted secrets, or cloud secret manager references.", "platform"),
                    ("Why can a database migration limit rollback?", "The old application version may not understand new or changed data schema.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-observability-sre",
        "title": "Observability and SRE for Kubernetes",
        "era": PLATFORM_ACADEMY_ERA,
        "level": "Advanced",
        "category": "SRE",
        "description": "Build dashboards, alerts, SLOs, and runbooks that point operators toward user impact and likely causes.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "RED, USE, and Kubernetes Golden Signals",
                "Choose metrics that separate user symptoms from infrastructure causes.",
                """
## Measurement model
Good observability starts with the question: what pain does the user feel? RED metrics cover request Rate, Error rate, and Duration for request-driven services. USE covers Utilization, Saturation, and Errors for resources. Kubernetes adds control plane, scheduler, kubelet, node, and workload signals.
- Use RED for APIs, workers with job metrics, and ingress traffic.
- Use USE for nodes, disks, queues, network interfaces, and database connections.
- Track desired vs available replicas, restart rate, pending Pods, unschedulable reasons, and HPA behavior.
- Do not page on every container restart. Page on user-impacting symptoms or imminent capacity failure.

## Inspection commands
$ kubectl top nodes
$ kubectl top pods -A
$ kubectl get deploy -A
$ kubectl get events -A --sort-by=.lastTimestamp
Look for saturation, scheduling pressure, rollout availability, crash patterns, and whether the symptom is service-level or only component-level.

## Dashboard rule
One dashboard should answer: are users hurt, where is the blast radius, what changed, and which dependency is saturated?
                """,
                """
Scenario: Latency increased after a deployment.
Checklist:
- Check request p95/p99 and error rate by route or service.
- Compare deployment time with rollout, restart, and HPA events.
- Check CPU throttling, memory pressure, database pool saturation, and queue depth.
- Move from symptom dashboard to workload and dependency dashboards.
Commands:
$ kubectl rollout history deploy/checkout -n payments
$ kubectl get hpa,pods -n payments
                """,
                [
                    ("RED metrics", "RED metrics", "Service signals", "Rate, Errors, and Duration for request-oriented services."),
                    ("USE metrics", "USE metrics", "Resource signals", "Utilization, Saturation, and Errors for infrastructure resources."),
                    ("Golden signals", "Golden signals", "Reliability", "Latency, traffic, errors, and saturation, commonly used for service health."),
                    ("Saturation", "Saturation", "Capacity", "A signal that a resource has more demand than it can serve promptly."),
                    ("Blast radius", "Blast radius", "Impact", "The scope of users, services, regions, or clusters affected by a problem."),
                ],
                [
                    ("When should a container restart page someone?", "When it correlates with user impact or a high-risk service failure, not as a standalone noisy signal.", "platform"),
                    ("What does RED measure?", "Request rate, error rate, and duration.", "platform"),
                    ("What does USE measure?", "Utilization, saturation, and errors for resources.", "platform"),
                ],
            ),
            platform_lesson(
                "SLOs, Error Budgets, and Alert Fatigue",
                "Turn reliability goals into alerts that protect users without exhausting operators.",
                """
## SLO thinking
An SLO is a target for user experience over a window, such as 99.9 percent successful checkout requests over 30 days. Error budget is the tolerated unreliability. Alerting should track burn rate, not every technical twitch.
- Define SLIs from user-visible behavior: success ratio, latency threshold, freshness, durability, or correctness.
- Page on fast burn of the error budget; ticket on slower burn or non-urgent risk.
- Separate symptom alerts from cause dashboards.
- Every page should have a runbook, owner, severity, and known false-positive notes.

## Inspection commands
$ kubectl get prometheusrule -A
$ kubectl get alertmanagerconfig -A
$ kubectl get servicemonitor,podmonitor -A
Look for alerts without for durations, alerts tied only to causes, missing labels for routing, and dashboards that cannot confirm user impact.

## Alert review
- Remove or downgrade alerts that do not require immediate human action.
- Add grouping and inhibition so one outage does not generate 40 pages.
- Alert on SLO burn, saturation exhaustion, and failed automation where delay increases risk.
                """,
                """
Scenario: On-call gets paged 20 times for one dependency outage.
Checklist:
- Identify which alerts are symptoms and which are causes.
- Group by service, cluster, and severity.
- Add inhibition so downstream symptom pages do not duplicate root-cause pages.
- Keep a symptom page if it best represents user impact.
Commands:
$ kubectl get prometheusrule -A -o yaml
                """,
                [
                    ("SLI", "SLI", "Measurement", "A service level indicator, the metric that represents user experience."),
                    ("SLO", "SLO", "Target", "A service level objective, the reliability target for an SLI over a window."),
                    ("Error budget", "Error budget", "Risk", "The amount of unreliability allowed before the SLO is missed."),
                    ("Burn rate", "Burn rate", "Alerting", "How quickly a service consumes its error budget."),
                    ("Inhibition", "Inhibition", "Alert routing", "Suppressing related alerts when a higher-level alert already explains the issue."),
                ],
                [
                    ("Why page on burn rate instead of raw error count?", "Burn rate reflects how quickly the SLO is being consumed and better maps to user impact.", "platform"),
                    ("What should every page include?", "Owner, severity, runbook, routing labels, and a condition that needs immediate human action.", "platform"),
                    ("What is the difference between a symptom and cause alert?", "A symptom alert tells users are hurt; a cause alert points to a likely technical reason.", "platform"),
                ],
            ),
            platform_lesson(
                "Runbooks, Incident Labs, Logs, and Traces",
                "Write operational playbooks that reduce time to diagnosis during Kubernetes incidents.",
                """
## Runbook structure
A useful runbook is executable under stress. It starts with impact, gives fast confirmation steps, includes rollback or mitigation options, and states when to escalate.
- Start with: user impact, alert meaning, dashboard links, and likely causes.
- Give commands that are safe to run read-only first.
- Include mitigation choices: rollback, scale, disable feature, fail over, drain node, or pause sync.
- End with post-incident actions: permanent fix, alert tuning, docs update, and owner.

## Inspection commands
$ kubectl get pods -n payments
$ kubectl describe pod -n payments POD
$ kubectl logs -n payments deploy/checkout --since=15m
$ kubectl get events -n payments --sort-by=.lastTimestamp
For traces, start from a slow request and follow service hops. For logs, search by request ID, trace ID, pod, and deploy version.

## Incident practice
- Keep labs local-first: kind, Docker Compose, or dry-run manifests.
- Practice read-only diagnosis before destructive commands.
- Turn repeated incidents into platform automation or safer defaults.
                """,
                """
Scenario: A canary release causes checkout failures.
Checklist:
- Confirm user impact through RED dashboard.
- Identify the deployed version and rollout timestamp.
- Compare logs and traces by version.
- Roll back or pause ArgoCD sync if GitOps would reapply the bad state.
- Write the post-incident action before closing.
Commands:
$ kubectl rollout undo deploy/checkout -n payments
$ argocd app get checkout-prod
$ argocd app set checkout-prod --sync-policy none
                """,
                [
                    ("Runbook", "Runbook", "Operations", "A repeatable guide for diagnosing and mitigating a known class of incident."),
                    ("Trace ID", "Trace ID", "Observability", "An identifier that connects spans across service calls for one request."),
                    ("Request ID", "Request ID", "Logs", "An identifier used to connect logs for one user request or API call."),
                    ("Mitigation", "Mitigation", "Incident response", "An action that reduces user impact before or while root cause is fixed."),
                    ("Post-incident review", "Post-incident review", "Learning", "A structured review that turns incidents into system improvements."),
                ],
                [
                    ("What should a runbook put before root cause theory?", "User impact, alert meaning, fast confirmation, and safe first checks.", "platform"),
                    ("Why use request IDs and trace IDs together?", "They connect logs and distributed traces for the same user path.", "platform"),
                    ("What is a mitigation?", "An action that reduces user impact even before the root cause is permanently fixed.", "platform"),
                ],
            ),
        ],
    },
]


PLATFORM_TRACKS = [
    {
        "slug": "kubernetes",
        "title": "Kubernetes Operator Track",
        "role": "Platform engineer moving from kubectl user to production debugger",
        "summary": "Master the object relationships and failure signals that explain most workload incidents.",
        "course_slug": "platform-kubernetes-foundations",
        "outcomes": [
            "Trace traffic from Ingress to Service to EndpointSlice to Pod.",
            "Diagnose CrashLoopBackOff, readiness failures, and rollout stalls.",
            "Set health checks and resources that improve reliability instead of creating noise.",
        ],
    },
    {
        "slug": "eks",
        "title": "EKS Architect Track",
        "role": "Engineer designing AWS-backed Kubernetes platforms",
        "summary": "Make VPC, IAM, node, add-on, and cost choices before production traffic exposes them.",
        "course_slug": "platform-eks-production-blueprint",
        "outcomes": [
            "Explain VPC CNI IP capacity and private endpoint tradeoffs.",
            "Design scoped workload identity with service accounts and IAM roles.",
            "Choose managed node groups, Karpenter, and add-ons with cost guardrails.",
        ],
    },
    {
        "slug": "helm",
        "title": "Helm Release Engineer Track",
        "role": "Developer or platform owner shipping repeatable Kubernetes releases",
        "summary": "Turn charts into stable APIs with rendered diffs, upgrade tests, and security checks.",
        "course_slug": "platform-helm-production",
        "outcomes": [
            "Render and review every environment before applying it.",
            "Avoid immutable selector, CRD, hook, and rollback traps.",
            "Add chart linting, schema validation, and policy checks to CI.",
        ],
    },
    {
        "slug": "argocd",
        "title": "GitOps Operator Track",
        "role": "Platform engineer owning ArgoCD at team or cluster scale",
        "summary": "Use ArgoCD boundaries, sync behavior, and promotion discipline without hiding drift.",
        "course_slug": "platform-gitops-argocd",
        "outcomes": [
            "Design app-of-apps and AppProjects with clear blast-radius boundaries.",
            "Use sync waves, health, prune, self-heal, and ignoreDifferences deliberately.",
            "Promote and roll back changes while keeping Git the source of truth.",
        ],
    },
    {
        "slug": "sre",
        "title": "Kubernetes SRE Track",
        "role": "Operator turning metrics, alerts, and runbooks into lower incident cost",
        "summary": "Build dashboards and alerts around user impact, not random component movement.",
        "course_slug": "platform-observability-sre",
        "outcomes": [
            "Separate RED service symptoms from USE resource causes.",
            "Define SLOs and burn-rate alerts that reduce alert fatigue.",
            "Write runbooks that guide diagnosis, mitigation, and follow-up.",
        ],
    },
]


PLATFORM_ROADMAP = [
    {
        "sequence": 1,
        "title": "Workload Debugger",
        "role": "You can explain how traffic reaches Pods and why a rollout failed.",
        "focus": "Kubernetes foundations: control loops, services, config, probes, and resources.",
        "course_slugs": ["platform-kubernetes-foundations"],
        "checkpoints": [
            "Inspect a rollout from Deployment to ReplicaSet to Pod.",
            "Find why a Service has no ready endpoints.",
            "Debug CrashLoopBackOff with previous logs and Pod events.",
        ],
    },
    {
        "sequence": 2,
        "title": "AWS Cluster Designer",
        "role": "You can defend EKS network, identity, and capacity choices before launch.",
        "focus": "EKS blueprint: VPC CNI, endpoint access, IRSA, node groups, Karpenter, add-ons, and cost.",
        "course_slugs": ["platform-eks-production-blueprint"],
        "checkpoints": [
            "Model subnet IP capacity for Pod growth.",
            "Scope a workload IAM role to one namespace and service account.",
            "Compare managed node groups and Karpenter for a workload mix.",
        ],
    },
    {
        "sequence": 3,
        "title": "Release System Builder",
        "role": "You can ship Kubernetes changes through reviewable rendered artifacts.",
        "focus": "Helm release safety: chart API design, diffs, immutable fields, CRDs, hooks, rollback, and CI.",
        "course_slugs": ["platform-helm-production"],
        "checkpoints": [
            "Render dev, stage, and prod values and compare the diff.",
            "Detect selector drift before upgrade.",
            "Reject a risky chart through policy checks.",
        ],
    },
    {
        "sequence": 4,
        "title": "GitOps Platform Owner",
        "role": "You can run ArgoCD without giving every app cluster-admin shaped power.",
        "focus": "ArgoCD operating model: app-of-apps, projects, sync waves, drift, secrets, promotion, and rollback.",
        "course_slugs": ["platform-gitops-argocd"],
        "checkpoints": [
            "Design AppProject boundaries for tenant apps.",
            "Trace an OutOfSync field and decide whether to own or ignore it.",
            "Roll back through Git while respecting auto-sync and external state.",
        ],
    },
    {
        "sequence": 5,
        "title": "Reliability Lead",
        "role": "You can turn incidents into better SLOs, alerts, dashboards, and runbooks.",
        "focus": "SRE practice: RED/USE, SLOs, burn rates, alert routing, logs, traces, and runbook drills.",
        "course_slugs": ["platform-observability-sre"],
        "checkpoints": [
            "Build a dashboard that starts with user impact.",
            "Convert noisy cause alerts into symptom-first burn-rate alerts.",
            "Write a runbook with safe diagnostics and mitigation choices.",
        ],
    },
]


PLATFORM_LABS = [
    {
        "slug": "debug-crashloopbackoff",
        "title": "Debug CrashLoopBackOff without guessing",
        "track": "Kubernetes",
        "difficulty": "Intermediate",
        "estimated_minutes": 35,
        "course_slug": "platform-kubernetes-foundations",
        "lesson_title": "Probes, Resources, and Failure Signals",
        "scenario": "A checkout API crashes after a config release and the restart loop is hiding the original error.",
        "skills": ["Pod inspection", "previous logs", "events", "resource limits", "rollback decision"],
        "commands": [
            "kubectl describe pod -n payments checkout-abc123",
            "kubectl logs -n payments checkout-abc123 --previous",
            "kubectl get events -n payments --sort-by=.lastTimestamp",
        ],
        "checklist": [
            "Capture previous logs before another restart.",
            "Identify exit code, reason, and probe failure pattern.",
            "Compare resource limits with observed memory and CPU pressure.",
            "Choose rollback, config fix, or probe tuning as the first mitigation.",
        ],
    },
    {
        "slug": "design-eks-irsa",
        "title": "Design an EKS workload identity boundary",
        "track": "EKS",
        "difficulty": "Advanced",
        "estimated_minutes": 45,
        "course_slug": "platform-eks-production-blueprint",
        "lesson_title": "IAM, OIDC, IRSA, and Workload Boundaries",
        "scenario": "ExternalDNS needs Route 53 access without giving every Pod the node role.",
        "skills": ["service accounts", "OIDC trust", "IAM policy review", "CloudTrail attribution"],
        "commands": [
            "kubectl get sa -n external-dns external-dns -o yaml",
            "aws iam get-role --role-name external-dns-irsa",
            "aws iam get-policy-version --policy-arn POLICY_ARN --version-id v1",
        ],
        "checklist": [
            "Bind permissions to one namespace and service account.",
            "Scope Route 53 permissions to the required hosted zones where possible.",
            "Confirm Pods cannot silently use the node role.",
            "Verify AWS calls are attributable to the intended role.",
        ],
    },
    {
        "slug": "validate-helm-chart",
        "title": "Validate a Helm chart like a release artifact",
        "track": "Helm",
        "difficulty": "Intermediate",
        "estimated_minutes": 40,
        "course_slug": "platform-helm-production",
        "lesson_title": "Chart Testing, Security, and Supply Chain Review",
        "scenario": "A vendor chart renders successfully but may create privileged resources and broad RBAC.",
        "skills": ["helm template", "linting", "schema validation", "policy review", "RBAC inspection"],
        "commands": [
            "helm dependency build charts/vendor",
            "helm lint charts/vendor",
            "helm template vendor charts/vendor -f values/prod.yaml > rendered.yaml",
            "kubectl apply --dry-run=server -f rendered.yaml",
        ],
        "checklist": [
            "Render with the exact production values stack.",
            "Search for privileged, hostNetwork, hostPath, and cluster-admin.",
            "Validate rendered resources before cluster mutation.",
            "Record exceptions instead of bypassing the pipeline.",
        ],
    },
    {
        "slug": "trace-argocd-drift",
        "title": "Trace an ArgoCD drift report",
        "track": "ArgoCD",
        "difficulty": "Advanced",
        "estimated_minutes": 35,
        "course_slug": "platform-gitops-argocd",
        "lesson_title": "Sync Waves, Health, Pruning, and Drift",
        "scenario": "ArgoCD reports OutOfSync because a controller modified a live field.",
        "skills": ["argocd diff", "ignoreDifferences", "controller ownership", "Git source of truth"],
        "commands": [
            "argocd app diff checkout-prod",
            "kubectl get deploy,hpa -n payments checkout -o yaml",
            "kubectl describe application -n argocd checkout-prod",
        ],
        "checklist": [
            "Identify the exact field causing drift.",
            "Decide whether Git or a live controller should own the field.",
            "Scope ignoreDifferences narrowly if ignoring is correct.",
            "Document the ownership decision near the Application manifest.",
        ],
    },
    {
        "slug": "write-slo-runbook",
        "title": "Write an SLO-backed Kubernetes runbook",
        "track": "SRE",
        "difficulty": "Intermediate",
        "estimated_minutes": 50,
        "course_slug": "platform-observability-sre",
        "lesson_title": "SLOs, Error Budgets, and Alert Fatigue",
        "scenario": "Checkout latency is burning the monthly SLO and on-call needs a fast, low-noise response path.",
        "skills": ["SLI selection", "burn-rate alerting", "dashboard design", "incident mitigation", "post-incident action"],
        "commands": [
            "kubectl get prometheusrule -A",
            "kubectl rollout history deploy/checkout -n payments",
            "kubectl get events -n payments --sort-by=.lastTimestamp",
        ],
        "checklist": [
            "Name the user-visible SLI and SLO window.",
            "Separate symptom page from diagnostic cause panels.",
            "List safe read-only commands first.",
            "Add mitigation choices and escalation criteria.",
        ],
    },
]


PLATFORM_COURSE_SLUGS = [course["slug"] for course in PLATFORM_COURSES]
