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


FRESHER_LEVEL = "Fresher / Beginner"
INTERMEDIATE_LEVEL = "Intermediate"
ADVANCED_LEVEL = "Advanced"


def platform_foundation_course(slug: str, title: str, level: str, category: str, description: str, lesson_specs: list[tuple[str, str, str, str, str]]) -> dict:
    lessons = []
    for lesson_title, summary, concept, practice, capstone in lesson_specs:
        lessons.append(
            platform_lesson(
                lesson_title,
                summary,
                f"""
## Mental model
{concept}

## What to practice
{practice}

## Practice checkpoint
{capstone}

## Operator habit
Write down the symptom, the evidence, the suspected owner, and the safest next command before changing any live object. This turns scattered platform knowledge into a repeatable engineering workflow.
                """,
                """
Scenario: You are the platform engineer on call for a realistic team environment.
Checklist:
- State the user impact in one sentence.
- Identify the system boundary and owner.
- Collect read-only evidence first.
- Propose the smallest reversible change.
- Capture what should become a dashboard, alert, runbook, or automation.
Commands:
$ kubectl get events -A --sort-by=.lastTimestamp
$ kubectl describe pod POD_NAME -n NAMESPACE
$ kubectl logs deploy/APP -n NAMESPACE --since=15m
                """,
                [
                    (title, title, category, description),
                    ("Evidence", "Evidence", "Debugging", "Observed facts from commands, dashboards, logs, traces, events, or cloud APIs."),
                    ("Blast radius", "Blast radius", "Reliability", "The set of users, tenants, workloads, or systems affected by a failure or change."),
                    ("Rollback", "Rollback", "Operations", "A planned path to return to a known-good state when a change causes harm."),
                    ("Runbook", "Runbook", "Operations", "A step-by-step guide that helps responders diagnose and mitigate an incident safely."),
                ],
                [
                    (f"What is the main goal of {lesson_title}?", summary, "platform"),
                    ("Why collect evidence before changing live systems?", "It reduces guessing, protects users, and makes the fix reviewable.", "platform"),
                    ("What should a learner produce after each lab?", "A clear diagnosis, a safe action plan, and a reusable note for future incidents.", "platform"),
                ],
            )
        )
    return {
        "slug": slug,
        "title": title,
        "era": PLATFORM_ACADEMY_ERA,
        "level": level,
        "category": category,
        "description": description,
        "subscription_tier": "free",
        "lessons": lessons,
    }


PLATFORM_COURSES = [
    {
        "slug": "platform-kubernetes-fundamentals",
        "title": "Kubernetes Fundamentals",
        "era": PLATFORM_ACADEMY_ERA,
        "level": FRESHER_LEVEL,
        "category": "Kubernetes",
        "description": "Start from containers and learn how Pods, Deployments, Services, namespaces, labels, and probes fit together.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Containers, Images, and Pods",
                "Understand the unit Kubernetes actually runs and why images should be immutable.",
                """
## Plain-English model
A container image is a packaged filesystem plus a startup command. A container is a running instance of that image. Kubernetes does not schedule a bare container; it schedules a Pod. A Pod is a small wrapper around one or more containers that share networking and lifecycle.
- Build images once and promote the same image through environments.
- Put environment differences in configuration, not in a different hand-built image.
- Treat Pods as disposable. If a Pod dies, the controller creates a replacement.
- Use one main application container per Pod unless sidecars solve a clear shared lifecycle problem.

## Local-safe inspection
$ kubectl get pods -A
$ kubectl describe pod POD_NAME -n NAMESPACE
$ kubectl get pod POD_NAME -n NAMESPACE -o yaml
Inspect the image, command, args, restart count, service account, labels, and events. If you do not have a cluster, read a sample Pod manifest and identify the same fields.

## Common mistakes
Beginners often debug by editing a live Pod. That change disappears because a Deployment owns the Pod template. Change the controller or chart instead.
                """,
                """
Scenario: A teammate says "the container is broken" after a Pod restarts.
Checklist:
- Confirm the image name and tag or digest.
- Read restart count and Last State in the Pod description.
- Check whether a Deployment, Job, or StatefulSet owns the Pod.
- Decide whether the fix belongs in the image, manifest, or runtime config.
Commands:
$ kubectl describe pod POD_NAME -n NAMESPACE
$ kubectl get pod POD_NAME -n NAMESPACE -o jsonpath='{.metadata.ownerReferences}'
                """,
                [
                    ("Image", "Image", "Package", "An immutable package that contains application code, filesystem layers, and startup metadata."),
                    ("Container", "Container", "Runtime", "A running process created from an image with isolated filesystem, process, and network settings."),
                    ("Pod", "Pod", "Kubernetes unit", "The smallest schedulable Kubernetes object, usually wrapping one application container."),
                    ("Sidecar", "Sidecar", "Pod pattern", "A helper container that shares the Pod lifecycle, such as a proxy or log shipper."),
                    ("Restart count", "Restart count", "Failure signal", "The number of times kubelet restarted a container inside the Pod."),
                ],
                [
                    ("What is the difference between an image and a container?", "An image is the package; a container is a running instance of that package.", "platform"),
                    ("Why should you avoid editing an owned Pod directly?", "The controller will recreate Pods from its template and your live edit will not become durable.", "platform"),
                    ("What should you inspect first after a Pod restart?", "Describe the Pod and check Last State, restart count, events, and logs.", "platform"),
                ],
            ),
            platform_lesson(
                "Deployments, ReplicaSets, and Rollouts",
                "Learn how Kubernetes keeps the desired number of application Pods running.",
                """
## Controller chain
A Deployment owns ReplicaSets, and ReplicaSets own Pods. You normally change the Deployment. Kubernetes creates a new ReplicaSet when the Pod template changes, then gradually shifts Pods during a rollout.
- Desired replicas means how many Pods should exist.
- Available replicas means how many are ready enough to serve traffic.
- Rollouts can pause, fail, or get stuck if Pods cannot become Ready.
- Rollback uses Deployment revision history, but it cannot undo database or external state changes.

## Inspection commands
$ kubectl get deploy,rs,pods -n payments -l app=checkout
$ kubectl describe deploy checkout -n payments
$ kubectl rollout status deploy/checkout -n payments
$ kubectl rollout history deploy/checkout -n payments
Look for desired/current/ready counts, old ReplicaSets still serving Pods, unavailable replicas, and rollout events.

## Beginner production habit
Before changing replicas or images, ask what will happen to traffic and whether the application can run two versions at the same time.
                """,
                """
Scenario: A new image was released but users still hit the old version.
Checklist:
- Confirm the Deployment image changed.
- Compare new and old ReplicaSet Pod counts.
- Check whether new Pods are Ready.
- Read rollout events before changing random fields.
Commands:
$ kubectl describe deploy checkout -n payments
$ kubectl get rs -n payments -l app=checkout
$ kubectl rollout status deploy/checkout -n payments
                """,
                [
                    ("Deployment", "Deployment", "Controller", "A controller that manages rollout history and ReplicaSets for stateless workloads."),
                    ("ReplicaSet", "ReplicaSet", "Replica controller", "A controller that keeps a matching set of Pods at the requested replica count."),
                    ("Rollout", "Rollout", "Release", "The process of moving from one Pod template revision to another."),
                    ("Available replicas", "Available replicas", "Readiness signal", "The count of Pods that are ready and available according to Deployment rules."),
                    ("Rollback", "Rollback", "Recovery", "Returning a Deployment to an earlier Pod template revision."),
                ],
                [
                    ("What object should you normally update for a stateless app release?", "The Deployment, because it owns the rollout and Pod template.", "platform"),
                    ("What does kubectl rollout status tell you?", "Whether the Deployment rollout has completed, is progressing, or is stuck.", "platform"),
                    ("Why is rollback not a complete time machine?", "It changes Kubernetes objects, but external state like databases may not roll back.", "platform"),
                ],
            ),
            platform_lesson(
                "Services, Labels, Selectors, and Namespaces",
                "Connect stable traffic names to replaceable Pods using labels and selectors.",
                """
## Traffic contract
Pods come and go, so applications should not call Pod IPs directly. A Service gives a stable virtual endpoint and selects Ready Pods by label. Namespaces give a boundary for names, RBAC, quotas, and team ownership.
- Labels are key-value metadata used by Services, dashboards, alerts, and automation.
- Selectors must match the labels on the Pods you intend to receive traffic.
- A Service with no endpoints is usually a selector or readiness problem.
- Namespaces are not a hard security boundary by themselves, but they are the starting point for tenancy.

## Inspection commands
$ kubectl get svc,endpointslice -n payments
$ kubectl get pods -n payments --show-labels
$ kubectl describe svc checkout -n payments
$ kubectl get all -n payments -l app=checkout
Look for selector mismatch, no ready endpoint addresses, wrong namespace, and inconsistent app labels.

## Failure mode
Changing Deployment labels without updating a Service selector can route traffic to zero Pods.
                """,
                """
Scenario: Checkout returns 503 after a label cleanup.
Checklist:
- Read the Service selector.
- Read Pod labels from the current ReplicaSet.
- Confirm EndpointSlices contain ready Pod IPs.
- Fix the selector or labels in the source manifest, not only live state.
Commands:
$ kubectl describe svc checkout -n payments
$ kubectl get pods -n payments -l app=checkout --show-labels
$ kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout
                """,
                [
                    ("Service", "Service", "Stable networking", "A stable Kubernetes endpoint that selects ready Pods by label."),
                    ("Label", "Label", "Metadata", "A key-value pair used for grouping, selecting, and organizing objects."),
                    ("Selector", "Selector", "Matching rule", "A rule that matches labels on target objects."),
                    ("EndpointSlice", "EndpointSlice", "Backends", "The object showing which Pod IPs currently back a Service."),
                    ("Namespace", "Namespace", "Scope", "A named scope for Kubernetes objects, policies, and team boundaries."),
                ],
                [
                    ("What connects a Service to Pods?", "The Service selector matches labels on Ready Pods.", "platform"),
                    ("What should you check when a Service has no endpoints?", "Selector, Pod labels, Pod readiness, and EndpointSlices in the same namespace.", "platform"),
                    ("Why do namespaces matter for beginners?", "They scope names and become the place for RBAC, quotas, and team ownership.", "platform"),
                ],
            ),
            platform_lesson(
                "Config, Secrets, Requests, and Probes",
                "Learn the basic knobs that make workloads configurable, schedulable, and safe to receive traffic.",
                """
## Runtime contract
Kubernetes separates image, configuration, scheduling needs, and health checks. Beginners should learn these early because many incidents come from missing or confused settings.
- ConfigMaps hold non-sensitive configuration.
- Secrets hold sensitive values but still need RBAC, encryption at rest, and rotation.
- Resource requests tell the scheduler what CPU and memory the Pod needs.
- Readiness controls traffic. Liveness controls restart. Startup protects slow boot.

## Inspection commands
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl get cm,secret -n payments
$ kubectl top pod -n payments
$ kubectl get events -n payments --sort-by=.lastTimestamp
Look for missing config keys, wrong secret names, Pending Pods due to insufficient resources, failed readiness probes, and OOMKilled restarts.

## Tradeoff
Liveness probes should be conservative. A bad liveness probe can turn a slow dependency into a restart storm.
                """,
                """
Scenario: Pods start but never receive traffic.
Checklist:
- Read readiness probe failures in Pod events.
- Check application logs for missing config.
- Confirm requests fit available node capacity.
- Do not loosen probes until you know whether the app can serve users.
Commands:
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl logs checkout-abc123 -n payments --since=10m
                """,
                [
                    ("ConfigMap", "ConfigMap", "Configuration", "A Kubernetes object for non-sensitive runtime configuration."),
                    ("Secret", "Secret", "Sensitive config", "A Kubernetes object for sensitive values that still needs access control and rotation."),
                    ("Request", "Request", "Scheduling", "The CPU or memory amount used by the scheduler to place a Pod."),
                    ("Readiness probe", "Readiness probe", "Traffic gate", "A check that decides whether a Pod should receive Service traffic."),
                    ("Liveness probe", "Liveness probe", "Restart gate", "A check that restarts a container when restart is likely to help."),
                ],
                [
                    ("What is the difference between readiness and liveness?", "Readiness controls traffic; liveness controls restarts.", "platform"),
                    ("Are Kubernetes Secrets automatically a complete security solution?", "No. They still need RBAC, encryption at rest, audit, and rotation.", "platform"),
                    ("Why do resource requests matter?", "The scheduler uses requests to place Pods on nodes with enough capacity.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-kubectl-debugging-basics",
        "title": "kubectl Debugging Basics",
        "era": PLATFORM_ACADEMY_ERA,
        "level": FRESHER_LEVEL,
        "category": "kubectl",
        "description": "Build a safe first-response workflow for describe, logs, events, exec, Pending, CrashLoopBackOff, ImagePullBackOff, and probes.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "The Read-Only First Response Loop",
                "Use get, describe, logs, and events before making changes.",
                """
## Debugging loop
Good Kubernetes debugging starts with observation. The safe loop is: list the object, describe the object, read logs, inspect events, then form a hypothesis.
- `kubectl get` shows current state and names.
- `kubectl describe` shows status, events, mounts, probes, and scheduling details.
- `kubectl logs` shows application output.
- Events explain what Kubernetes attempted and why it failed.

## Commands to practice
$ kubectl get pods -n payments -o wide
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl logs checkout-abc123 -n payments --since=15m
$ kubectl get events -n payments --sort-by=.lastTimestamp
Capture evidence before deleting Pods or restarting Deployments. Restarts can destroy useful previous logs.

## Signal to inspect
Look for Status, Ready, Restarts, Last State, Events, node placement, image name, service account, and volume mount failures.
                """,
                """
Scenario: An app is unhealthy and someone wants to restart it immediately.
Checklist:
- Save `describe pod` output.
- Save recent and previous logs if restarts happened.
- Save namespace events sorted by time.
- Only restart after you understand whether restart is a mitigation or evidence loss.
Commands:
$ kubectl logs checkout-abc123 -n payments --previous
$ kubectl get events -n payments --sort-by=.lastTimestamp
                """,
                [
                    ("kubectl get", "kubectl get", "List", "Shows object names and high-level status."),
                    ("kubectl describe", "kubectl describe", "Inspect", "Shows detailed object state and events."),
                    ("Event", "Event", "Cluster signal", "A Kubernetes record explaining scheduling, pulling, probing, or controller activity."),
                    ("Previous logs", "Previous logs", "Crash evidence", "Logs from a previously terminated container instance."),
                    ("Read-only diagnosis", "Read-only diagnosis", "Safe workflow", "Collecting evidence before making mutating changes."),
                ],
                [
                    ("What four commands form the beginner debug loop?", "get, describe, logs, and get events.", "platform"),
                    ("Why collect previous logs before restarting?", "The evidence from the crashed container may disappear after another restart.", "platform"),
                    ("What do Kubernetes events usually explain?", "Scheduling, image pulls, volume mounts, probe failures, and controller actions.", "platform"),
                ],
            ),
            platform_lesson(
                "CrashLoopBackOff and ImagePullBackOff",
                "Separate application crashes from image pull and registry problems.",
                """
## Two different failures
CrashLoopBackOff means the container starts and exits repeatedly. ImagePullBackOff means kubelet cannot pull the image before the container starts. Treat them differently.
- CrashLoopBackOff: read previous logs, exit code, command, config, and probes.
- ImagePullBackOff: inspect image name, tag, registry auth, pull secret, and network reachability.
- ErrImagePull often appears before ImagePullBackOff.
- A private registry usually needs an imagePullSecret or node-level registry access.

## Inspection commands
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl logs checkout-abc123 -n payments --previous
$ kubectl get secret regcred -n payments
$ kubectl get pod checkout-abc123 -n payments -o jsonpath='{.spec.imagePullSecrets}'
Look for `Back-off pulling image`, `unauthorized`, `not found`, nonzero exit codes, and missing environment variables.

## Common mistake
Do not fix CrashLoopBackOff by increasing replicas. You will create more broken Pods.
                """,
                """
Scenario: New Pods show ImagePullBackOff after moving to a private registry.
Checklist:
- Confirm the exact image reference exists.
- Check the namespace has the expected image pull secret.
- Check the Pod references the secret through service account or imagePullSecrets.
- Read events for unauthorized, not found, or timeout.
Commands:
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl get sa default -n payments -o yaml
                """,
                [
                    ("CrashLoopBackOff", "CrashLoopBackOff", "Crash state", "Repeated container exits with increasing restart delay."),
                    ("ImagePullBackOff", "ImagePullBackOff", "Image state", "A repeated failure to pull the configured image."),
                    ("ErrImagePull", "ErrImagePull", "Image event", "The initial image pull error before backoff increases."),
                    ("imagePullSecret", "imagePullSecret", "Registry auth", "A secret used by kubelet to authenticate to a container registry."),
                    ("Exit code", "Exit code", "Process signal", "The process status code that helps explain why a container stopped."),
                ],
                [
                    ("How do CrashLoopBackOff and ImagePullBackOff differ?", "CrashLoopBackOff starts then crashes; ImagePullBackOff cannot pull the image.", "platform"),
                    ("What is the first log command for CrashLoopBackOff?", "kubectl logs POD --previous.", "platform"),
                    ("What should you inspect for ImagePullBackOff?", "Image name, tag, registry auth, pull secret, and events.", "platform"),
                ],
            ),
            platform_lesson(
                "Pending Pods, Scheduling, and Node Pressure",
                "Read scheduler messages instead of guessing why a Pod will not start.",
                """
## Pending means not placed or not ready to start
A Pending Pod may be unscheduled, waiting for volumes, blocked by image pulls, or constrained by node selectors, taints, or resource requests. The scheduler tells you a lot in events.
- Insufficient CPU or memory means requests do not fit current nodes.
- Untolerated taint means the Pod is not allowed on matching nodes.
- Node selector or affinity can make the Pod too picky.
- PVC binding can block stateful Pods before the container starts.

## Inspection commands
$ kubectl describe pod pending-pod -n payments
$ kubectl get nodes
$ kubectl describe node NODE_NAME
$ kubectl get pvc -n payments
Look for `0/3 nodes are available`, taints, node affinity, volume binding, and whether cluster autoscaler or Karpenter is expected to add capacity.

## Tradeoff
Reducing requests may make the Pod schedule, but it can also hide real capacity needs and cause runtime saturation later.
                """,
                """
Scenario: A deployment rollout is stuck because new Pods stay Pending.
Checklist:
- Read the exact scheduler event message.
- Compare Pod requests with allocatable node capacity.
- Check taints, tolerations, node selectors, and PVCs.
- Decide whether to scale capacity or correct workload constraints.
Commands:
$ kubectl describe pod pending-pod -n payments
$ kubectl get nodes -o wide
                """,
                [
                    ("Pending", "Pending", "Pod phase", "A Pod phase before all containers are running and ready."),
                    ("Taint", "Taint", "Node restriction", "A node marker that repels Pods without a matching toleration."),
                    ("Toleration", "Toleration", "Pod permission", "A Pod setting that allows scheduling onto nodes with matching taints."),
                    ("Node selector", "Node selector", "Placement", "A simple label-based requirement for node placement."),
                    ("PVC", "PVC", "Storage request", "A PersistentVolumeClaim requesting storage for a Pod."),
                ],
                [
                    ("Where do you find scheduler reasons for Pending Pods?", "In `kubectl describe pod` events.", "platform"),
                    ("What does insufficient memory usually compare?", "Pod memory requests against allocatable node memory.", "platform"),
                    ("Why not simply lower resource requests to schedule?", "It can hide real capacity needs and create runtime saturation.", "platform"),
                ],
            ),
            platform_lesson(
                "Exec, Port Forward, and Probe Debugging",
                "Use interactive commands carefully and know when they are diagnostic only.",
                """
## Interactive tools
`kubectl exec` and `kubectl port-forward` are useful diagnostics, but they should not become the normal production operating model. Use them to confirm facts, then fix manifests, code, config, or automation.
- Exec can check files, env, DNS lookup, and local process state inside a container.
- Port-forward can test a Pod or Service without exposing it publicly.
- Readiness probe failures usually mean no traffic should flow to that Pod.
- Liveness probe failures should restart only when restart helps.

## Commands to practice
$ kubectl exec -n payments deploy/checkout -- printenv
$ kubectl exec -n payments deploy/checkout -- nslookup payments-db
$ kubectl port-forward -n payments svc/checkout 8080:80
$ kubectl describe pod checkout-abc123 -n payments
Look for probe path, port, initial delay, timeouts, DNS, config, and whether the app listens on the expected interface.

## Safety note
Avoid mutating files inside a running container as a "fix." It will disappear on restart and bypass review.
                """,
                """
Scenario: Readiness probes fail after a port rename.
Checklist:
- Confirm the container port and probe port match.
- Exec a local curl or wget only if the image has those tools.
- Read app logs for bind address and startup errors.
- Fix the manifest or chart values after confirming the mismatch.
Commands:
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl get deploy checkout -n payments -o yaml
                """,
                [
                    ("kubectl exec", "kubectl exec", "Interactive inspection", "Runs a command inside a container for diagnosis."),
                    ("Port forward", "Port forward", "Local tunnel", "Forwards a local port to a Pod or Service for temporary testing."),
                    ("Probe timeout", "Probe timeout", "Health setting", "The time Kubernetes waits for a probe response before marking it failed."),
                    ("Bind address", "Bind address", "Network setting", "The address and port an application listens on inside the container."),
                    ("Diagnostic action", "Diagnostic action", "Debugging", "A temporary check used to confirm facts, not a durable fix."),
                ],
                [
                    ("When should exec be used?", "For diagnosis, such as checking env, DNS, files, or process state.", "platform"),
                    ("Why is editing a running container a bad fix?", "It disappears on restart and bypasses code or manifest review.", "platform"),
                    ("What should you compare for probe failures?", "Probe path, port, timeout, startup time, app bind address, and logs.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-cloud-native-foundations",
        "title": "Cloud Native Foundations",
        "era": PLATFORM_ACADEMY_ERA,
        "level": FRESHER_LEVEL,
        "category": "Cloud Native",
        "description": "Learn Docker images, registries, YAML, configuration, basic networking, and resource requests before touching production clusters.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Docker Images, Tags, Digests, and Registries",
                "Learn how application artifacts move from laptop to cluster.",
                """
## Artifact path
Most Kubernetes releases start with an image pushed to a registry. Tags are human-friendly labels. Digests are content addresses. Production systems should know exactly which image content they are running.
- A tag like `1.4.2` can be moved unless your registry prevents it.
- A digest identifies immutable content.
- Registries need authentication, retention, scanning, and promotion rules.
- Use multi-stage builds to reduce runtime image size and attack surface.

## Local-safe commands
$ docker build -t checkout:local .
$ docker image inspect checkout:local
$ docker tag checkout:local registry.example.com/checkout:1.4.2
$ docker image ls
Do not push to a real registry unless you own it. For learning, inspect Dockerfiles and image metadata locally.

## Production tradeoff
Floating tags make demos fast but make incident review painful. Digests make rollout evidence stronger.
                """,
                """
Scenario: Production and staging both say they run `latest`, but behavior differs.
Checklist:
- Compare image digests, not only tags.
- Check who can retag or overwrite images.
- Confirm the deployment record stores the digest or immutable version.
- Decide whether promotion should copy images or promote references.
Commands:
$ docker image inspect checkout:local --format '{{json .RepoDigests}}'
                """,
                [
                    ("Registry", "Registry", "Artifact store", "A service that stores and serves container images."),
                    ("Tag", "Tag", "Image label", "A human-friendly image reference that can point to different content over time."),
                    ("Digest", "Digest", "Immutable reference", "A content-addressed image identifier such as sha256."),
                    ("Multi-stage build", "Multi-stage build", "Dockerfile pattern", "A build pattern that separates build tooling from the final runtime image."),
                    ("Artifact promotion", "Artifact promotion", "Release flow", "Moving a reviewed artifact through environments without rebuilding it."),
                ],
                [
                    ("Why are digests stronger evidence than tags?", "A digest identifies exact content; a tag can be moved unless protected.", "platform"),
                    ("What is a registry?", "A service that stores and serves container images.", "platform"),
                    ("Why use multi-stage builds?", "To keep build tools out of the runtime image and reduce size and attack surface.", "platform"),
                ],
            ),
            platform_lesson(
                "YAML, Manifests, and kubectl Dry Runs",
                "Read Kubernetes YAML safely and validate intent before mutation.",
                """
## Manifest basics
Kubernetes YAML usually has apiVersion, kind, metadata, spec, and sometimes status when read from the cluster. You write desired state in spec; Kubernetes writes observed state in status.
- Indentation matters.
- Lists and maps are different shapes; read them carefully.
- Use dry-run and diff before applying unfamiliar YAML.
- Generated manifests from Helm or Kustomize should be reviewed before cluster changes.

## Local-safe commands
$ kubectl apply --dry-run=client -f manifest.yaml
$ kubectl diff -f manifest.yaml
$ kubectl explain deployment.spec.template.spec.containers
$ kubectl create deployment demo --image=nginx --dry-run=client -o yaml
If you do not have a cluster, client dry-run and `kubectl explain` still teach object shape.

## Common failure mode
Copying YAML from a blog can create resources in the wrong namespace or with unsafe permissions.
                """,
                """
Scenario: You receive a 400-line manifest from a vendor.
Checklist:
- Identify every kind and namespace.
- Search for ClusterRole, hostPath, privileged, LoadBalancer, and Secret.
- Run client dry-run and schema validation if tools are available.
- Ask what each cluster-scoped permission is for.
Commands:
$ kubectl apply --dry-run=client -f vendor.yaml
$ grep -n \"kind:\\|namespace:\\|ClusterRole\\|privileged\\|hostPath\" vendor.yaml
                """,
                [
                    ("Manifest", "Manifest", "Desired state", "A YAML or JSON document describing Kubernetes resources."),
                    ("apiVersion", "apiVersion", "Kubernetes API", "The API group and version used by a resource."),
                    ("kind", "kind", "Resource type", "The Kubernetes resource type, such as Deployment or Service."),
                    ("spec", "spec", "Desired state", "The part of an object where users declare what they want."),
                    ("status", "status", "Observed state", "The part of an object where controllers report what happened."),
                ],
                [
                    ("What fields appear in most Kubernetes manifests?", "apiVersion, kind, metadata, and spec.", "platform"),
                    ("Why use dry-run?", "To validate or preview a change without persisting it.", "platform"),
                    ("What should you inspect in vendor YAML?", "Kinds, namespaces, cluster-scoped permissions, privileged settings, volumes, services, and secrets.", "platform"),
                ],
            ),
            platform_lesson(
                "Config, Secrets, and Environment Promotion",
                "Separate what changes per environment from the application artifact.",
                """
## Promotion model
The same app version should be able to run in dev, stage, and prod with environment-specific configuration. That does not mean every setting is safe to change casually.
- Non-sensitive values can live in ConfigMaps or values files.
- Sensitive values need a secret strategy, not plaintext Git commits.
- Environment variables are simple but often require restart to update.
- Mounted config can update, but the application must reload safely.

## Inspection commands
$ kubectl get configmap,secret -n payments
$ kubectl describe pod checkout-abc123 -n payments
$ kubectl rollout history deploy/checkout -n payments
Look for missing keys, wrong namespace, stale Pod templates, and whether config changes caused a rollout.

## Production tradeoff
Putting config outside the image helps promotion, but too many unreviewed config switches can make releases unpredictable.
                """,
                """
Scenario: Staging points to the wrong payment sandbox.
Checklist:
- Locate the value source: values file, ConfigMap, Secret, or external provider.
- Confirm the Pod actually received the current value.
- Check whether a restart is required.
- Add review around environment-specific overrides.
Commands:
$ kubectl get cm checkout-config -n payments -o yaml
$ kubectl describe pod checkout-abc123 -n payments
                """,
                [
                    ("Environment promotion", "Environment promotion", "Release flow", "Moving the same application artifact across dev, stage, and prod."),
                    ("Override", "Override", "Configuration", "An environment-specific value layered over defaults."),
                    ("Plaintext secret", "Plaintext secret", "Security risk", "A sensitive value stored unencrypted in source control or logs."),
                    ("Reload", "Reload", "Runtime behavior", "An application updating config without a full restart."),
                    ("Rollout restart", "Rollout restart", "Restart trigger", "A command that refreshes Pods from the current Deployment template."),
                ],
                [
                    ("Why keep environment config outside images?", "The same artifact can be promoted while environment-specific values are reviewed separately.", "platform"),
                    ("Why are plaintext secrets in Git risky?", "They spread to history, clones, logs, and backups and are hard to rotate completely.", "platform"),
                    ("What should you check after changing a ConfigMap?", "Whether Pods received it and whether the app needs restart or reload.", "platform"),
                ],
            ),
            platform_lesson(
                "Basic Networking and Resource Requests",
                "Build the mental model for ports, DNS, CPU, memory, and scheduling.",
                """
## Network and capacity basics
Pods get IP addresses, Services provide stable names, and DNS lets apps call services by name. Requests describe the CPU and memory the scheduler should reserve for a Pod.
- Container ports document what the app listens on.
- Service ports define how other clients reach selected Pods.
- Kubernetes DNS usually resolves `service.namespace.svc.cluster.local`.
- CPU is compressible; memory is not. Memory pressure can kill containers.

## Inspection commands
$ kubectl get svc -A
$ kubectl exec -n payments deploy/checkout -- nslookup payments-db
$ kubectl top pod -n payments
$ kubectl describe node NODE_NAME
Look for wrong ports, DNS names, missing endpoints, CPU throttling symptoms, OOMKilled, and node pressure.

## Beginner tradeoff
Tiny requests can pack many Pods onto a node but produce noisy neighbors. Huge requests can strand capacity and increase cost.
                """,
                """
Scenario: Checkout cannot reach the database Service.
Checklist:
- Confirm the Service exists in the expected namespace.
- Confirm it has endpoints.
- Confirm the application uses the right port and DNS name.
- Check NetworkPolicy only after Service and endpoints make sense.
Commands:
$ kubectl get svc,endpointslice -n data
$ kubectl exec -n payments deploy/checkout -- nslookup postgres.data.svc.cluster.local
                """,
                [
                    ("Service DNS", "Service DNS", "Discovery", "The cluster DNS name clients use to reach a Service."),
                    ("Container port", "Container port", "Application port", "The port an application listens on inside a container."),
                    ("Service port", "Service port", "Cluster port", "The port exposed by a Service to clients."),
                    ("OOMKilled", "OOMKilled", "Memory failure", "A container termination caused by exceeding memory limits."),
                    ("Node pressure", "Node pressure", "Capacity signal", "A node condition showing resource stress such as memory, disk, or PID pressure."),
                ],
                [
                    ("What does a Service provide?", "A stable virtual endpoint and DNS name for selected ready Pods.", "platform"),
                    ("Why is memory different from CPU?", "CPU can throttle; memory exhaustion can kill the container.", "platform"),
                    ("What is the cost tradeoff of oversized requests?", "They reserve capacity that may sit idle and increase node cost.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-eks-operations",
        "title": "EKS Operations",
        "era": PLATFORM_ACADEMY_ERA,
        "level": INTERMEDIATE_LEVEL,
        "category": "EKS",
        "description": "Operate common EKS building blocks: VPC CNI, IP exhaustion, managed node groups, Fargate vs EC2, IRSA/OIDC, add-ons, and ALB controller.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "VPC CNI and IP Exhaustion",
                "Understand why Pod IPs consume subnet capacity on common EKS clusters.",
                """
## EKS networking reality
With the Amazon VPC CNI, Pods commonly receive VPC-routable IP addresses. This makes routing feel AWS-native, but subnet sizing becomes a platform constraint.
- Pod scale consumes subnet IPs, not just node IPs.
- Warm IP or prefix settings influence how many IPs nodes reserve.
- IP exhaustion can look like Pending Pods or CNI allocation errors.
- Prefix delegation can improve Pod density but should be modeled before launch.

## Inspection commands
$ kubectl -n kube-system get ds aws-node
$ kubectl -n kube-system logs ds/aws-node -c aws-node --since=20m
$ kubectl describe pod pending-pod -n payments
$ aws eks describe-cluster --name prod-platform --query 'cluster.resourcesVpcConfig'
Treat AWS commands as design/inspection examples; this repo does not require AWS credentials.

## Tradeoff
Large subnets reduce IP pressure but expand blast radius and planning mistakes. Secondary CIDRs add capacity but require routing and governance review.
                """,
                """
Scenario: Scale-out fails during a sale and Pods stay Pending.
Checklist:
- Read scheduler events and CNI logs.
- Compare available subnet IPs with expected Pod growth.
- Check max Pods per node for instance type and CNI mode.
- Decide whether the fix is node count, subnet capacity, prefix delegation, or architecture.
Commands:
$ kubectl describe pod pending-pod -n payments
$ kubectl -n kube-system logs ds/aws-node -c aws-node --since=15m
                """,
                [
                    ("Amazon VPC CNI", "Amazon VPC CNI", "EKS networking", "The EKS networking plugin that assigns VPC IP addresses to Pods."),
                    ("Subnet capacity", "Subnet capacity", "IP planning", "Available IP addresses for nodes and Pods in a subnet."),
                    ("Prefix delegation", "Prefix delegation", "Pod density", "A VPC CNI mode that assigns IP prefixes to network interfaces."),
                    ("aws-node", "aws-node", "CNI DaemonSet", "The VPC CNI DaemonSet running on EKS worker nodes."),
                    ("Warm IP", "Warm IP", "CNI setting", "Reserved IP capacity kept ready on a node for faster Pod startup."),
                ],
                [
                    ("Why does subnet sizing matter for EKS Pods?", "The VPC CNI commonly assigns VPC IPs to Pods, consuming subnet addresses.", "platform"),
                    ("What can IP exhaustion look like?", "Pending Pods with CNI allocation errors in events or aws-node logs.", "platform"),
                    ("What is prefix delegation used for?", "Increasing Pod IP density per node by assigning prefixes to ENIs.", "platform"),
                ],
            ),
            platform_lesson(
                "Managed Node Groups, Fargate, and Workload Fit",
                "Choose capacity models based on operations, isolation, and workload constraints.",
                """
## Capacity choices
EKS can run Pods on EC2 nodes, managed node groups, self-managed nodes, Karpenter-provisioned nodes, or Fargate profiles. Intermediate operators should know the fit, not just the names.
- Managed node groups are a conservative default for EC2 worker lifecycle.
- Fargate reduces node management but has constraints around DaemonSets, storage, and observability patterns.
- EC2 nodes give more control over instance types, DaemonSets, and performance tuning.
- Separate system and application capacity with labels, taints, and tolerations.

## Inspection commands
$ kubectl get nodes -L eks.amazonaws.com/nodegroup,topology.kubernetes.io/zone
$ kubectl describe node NODE_NAME
$ kubectl get pods -A -o wide --field-selector spec.nodeName=NODE_NAME
$ kubectl get taint nodes
Look for system Pods on risky capacity, single-AZ concentration, incompatible DaemonSets, and workloads scheduled onto the wrong node group.

## Tradeoff
Fargate can reduce node toil, but EC2 nodes are often better for DaemonSet-heavy platforms and fine-grained cost control.
                """,
                """
Scenario: A logging agent never appears on Fargate-backed Pods.
Checklist:
- Confirm whether the workload is scheduled on Fargate or EC2 nodes.
- Check whether the logging design depends on a node DaemonSet.
- Choose sidecar, app-level logging, or EC2 node capacity for that workload.
- Document the workload placement rule.
Commands:
$ kubectl get pod app-pod -n payments -o wide
$ kubectl get ds -A
                """,
                [
                    ("Managed node group", "Managed node group", "EKS capacity", "An AWS-managed EC2 node group integrated with EKS lifecycle operations."),
                    ("Fargate profile", "Fargate profile", "Serverless Pods", "A rule that schedules matching EKS Pods onto AWS Fargate."),
                    ("DaemonSet", "DaemonSet", "Node workload", "A controller that runs one Pod on each selected node."),
                    ("Taint", "Taint", "Placement control", "A node marker that repels Pods without matching tolerations."),
                    ("Workload fit", "Workload fit", "Design choice", "Matching runtime needs to the right capacity model."),
                ],
                [
                    ("When are managed node groups a safe default?", "For predictable EC2 capacity with AWS-managed lifecycle operations.", "platform"),
                    ("Why can Fargate conflict with DaemonSet-based tooling?", "Fargate does not expose normal worker nodes for DaemonSets in the same way EC2 does.", "platform"),
                    ("How do you separate system and app capacity?", "Use labels, taints, tolerations, namespaces, and scheduling policy.", "platform"),
                ],
            ),
            platform_lesson(
                "IRSA, OIDC, and Controller Permissions",
                "Give AWS permissions to the right service account instead of every Pod.",
                """
## Workload identity
The node IAM role should not be the permission source for every application. IAM Roles for Service Accounts (IRSA) uses the cluster OIDC issuer and projected service account tokens so a workload can assume a scoped IAM role.
- Bind AWS permissions to a namespace and service account.
- Restrict trust policies to the exact service account subject.
- Review controllers carefully: ALB controller, ExternalDNS, cert-manager, autoscalers, and secret controllers often need AWS permissions.
- Block or restrict node metadata fallback where possible.

## Inspection commands
$ kubectl get sa -n kube-system aws-load-balancer-controller -o yaml
$ kubectl describe pod -n kube-system deploy/aws-load-balancer-controller
$ aws iam get-role --role-name eks-alb-controller
$ aws iam get-policy-version --policy-arn POLICY_ARN --version-id v1
AWS commands are inspection examples; do not add real credentials for this local project.

## Failure mode
If a trust policy uses broad wildcards, another service account may be able to assume permissions intended for one controller.
                """,
                """
Scenario: ExternalDNS can update more Route 53 zones than intended.
Checklist:
- Identify its Kubernetes service account.
- Inspect the IAM role trust policy and permission policy.
- Scope hosted zone permissions where possible.
- Confirm Pods cannot silently use the node role.
Commands:
$ kubectl get deploy -n external-dns external-dns -o jsonpath='{.spec.template.spec.serviceAccountName}'
$ kubectl get sa -n external-dns external-dns -o yaml
                """,
                [
                    ("IRSA", "IRSA", "AWS identity", "IAM Roles for Service Accounts, a way to scope AWS permissions to Kubernetes service accounts."),
                    ("OIDC issuer", "OIDC issuer", "Federation", "The identity provider EKS uses for service account token federation with IAM."),
                    ("Trust policy", "Trust policy", "IAM boundary", "The IAM policy that defines who can assume a role."),
                    ("Service account", "Service account", "Kubernetes identity", "The identity attached to Pods for Kubernetes and cloud access patterns."),
                    ("IMDS", "IMDS", "Node metadata", "The EC2 metadata service that can expose node role credentials if not restricted."),
                ],
                [
                    ("What should an IRSA trust policy constrain?", "The OIDC issuer and service account subject, including namespace and name.", "platform"),
                    ("Why avoid using the node role for app permissions?", "A compromised Pod may gain broad node-level AWS permissions.", "platform"),
                    ("Name two controllers that often need AWS IAM.", "AWS Load Balancer Controller, ExternalDNS, cert-manager, External Secrets, or Karpenter.", "platform"),
                ],
            ),
            platform_lesson(
                "Add-ons and AWS Load Balancer Controller",
                "Operate cluster add-ons as versioned platform components.",
                """
## Add-on operating model
EKS add-ons are not background magic. They are production components with versions, permissions, alerts, and upgrade plans.
- Core add-ons include VPC CNI, CoreDNS, kube-proxy, and CSI drivers.
- Common platform controllers include AWS Load Balancer Controller, ExternalDNS, cert-manager, metrics-server, and External Secrets.
- ALB controller behavior depends on Ingress annotations, subnets, security groups, and target type.
- Upgrade add-ons deliberately and read release notes before changing cluster versions.

## Inspection commands
$ kubectl get pods -n kube-system
$ kubectl describe ingress checkout -n payments
$ kubectl -n kube-system logs deploy/aws-load-balancer-controller --since=20m
$ kubectl get ingressclass
Look for controller events, bad annotations, missing IAM permissions, subnets not tagged for discovery, and unhealthy targets.

## Tradeoff
Automating ALB creation improves developer speed but can create cost, security group, and public exposure risks if annotations are not governed.
                """,
                """
Scenario: An Ingress exists but no ALB appears.
Checklist:
- Confirm the IngressClass matches the controller.
- Read Ingress events and controller logs.
- Check subnet discovery tags and controller IAM permissions.
- Confirm desired scheme, target type, and security group behavior.
Commands:
$ kubectl describe ingress checkout -n payments
$ kubectl -n kube-system logs deploy/aws-load-balancer-controller --since=15m
                """,
                [
                    ("Add-on", "Add-on", "Cluster component", "A versioned component that extends or supports cluster behavior."),
                    ("AWS Load Balancer Controller", "AWS Load Balancer Controller", "Ingress controller", "A controller that creates AWS load balancers from Kubernetes resources."),
                    ("IngressClass", "IngressClass", "Routing class", "A resource that selects which controller should handle an Ingress."),
                    ("Target type", "Target type", "ALB setting", "Whether load balancer targets are instance nodes or Pod IPs."),
                    ("Subnet discovery", "Subnet discovery", "AWS tagging", "The tag-based process controllers use to find eligible subnets."),
                ],
                [
                    ("Why treat add-ons as production components?", "They have versions, permissions, failure modes, and upgrade risk.", "platform"),
                    ("What should you inspect when ALB creation fails?", "IngressClass, events, controller logs, subnet tags, IAM permissions, and annotations.", "platform"),
                    ("What is a risk of self-service ALB annotations?", "Developers may accidentally create public, expensive, or insecure load balancers.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-helm-application-delivery",
        "title": "Helm for Application Delivery",
        "era": PLATFORM_ACADEMY_ERA,
        "level": INTERMEDIATE_LEVEL,
        "category": "Helm",
        "description": "Build charts that are reviewable, testable, rollback-aware, and safe for multi-environment delivery.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Chart Anatomy and Values as an API",
                "Design values files so teams can change intent without editing templates.",
                """
## Chart contract
A Helm chart is a packaging format and a small API. `values.yaml` is the input surface, templates are implementation, and rendered manifests are the release artifact.
- Keep values names stable and meaningful.
- Put normal environment differences in values, not template forks.
- Keep helper templates for labels and names consistent.
- Avoid clever templates that hide what Kubernetes will receive.

## Commands
$ helm lint charts/checkout
$ helm template checkout charts/checkout -f values/dev.yaml
$ helm show values charts/checkout
$ helm dependency build charts/checkout
Inspect rendered labels, selectors, names, resource requests, probes, and service ports. The render is what reviewers should understand.

## Tradeoff
Generic charts can reduce duplication, but overly flexible charts become hard to reason about and hard to secure.
                """,
                """
Scenario: A team asks for one chart to deploy every kind of workload.
Checklist:
- Identify the stable app contract: image, ports, resources, env, probes, service, ingress.
- Keep rare features explicit and documented.
- Render representative values before accepting the chart API.
- Add required checks for values with no safe default.
Commands:
$ helm template checkout charts/checkout -f values/stage.yaml --debug
                """,
                [
                    ("Chart", "Chart", "Helm package", "A package containing templates, defaults, metadata, and dependencies."),
                    ("values.yaml", "values.yaml", "Chart API", "The default input values consumed by Helm templates."),
                    ("Template", "Template", "Render logic", "A file that produces Kubernetes YAML using values and functions."),
                    ("_helpers.tpl", "_helpers.tpl", "Helper templates", "A common place for reusable template snippets like names and labels."),
                    ("helm template", "helm template", "Render", "A command that renders manifests locally without installing them."),
                ],
                [
                    ("Why treat values as an API?", "Other teams depend on value names and behavior for releases.", "platform"),
                    ("What should reviewers inspect?", "The rendered manifests, especially labels, selectors, resources, probes, and permissions.", "platform"),
                    ("Why can overly generic charts be risky?", "They hide behavior, make validation harder, and create unclear ownership.", "platform"),
                ],
            ),
            platform_lesson(
                "Values Layering, Templates, and Helpers",
                "Manage dev, stage, and prod differences without drifting releases.",
                """
## Layering model
Helm merges values from defaults and `-f` files. The order matters: later files override earlier files. This is powerful and dangerous if teams do not know which value wins.
- Use a small base and explicit environment overlays.
- Keep production overrides reviewed.
- Use helpers for stable labels and selector fields.
- Quote strings deliberately to avoid YAML type surprises.

## Commands
$ helm template checkout charts/checkout -f values/base.yaml -f values/prod.yaml > rendered.yaml
$ helm lint charts/checkout
$ grep -n \"app.kubernetes.io\" rendered.yaml
$ helm template checkout charts/checkout --set image.tag=1.4.2
Look for selector drift, null values, wrong environment secrets, and type coercion such as `on` becoming boolean.

## Tradeoff
`--set` is convenient in CI, but large release intent is usually clearer in reviewed values files.
                """,
                """
Scenario: Prod accidentally uses stage database settings.
Checklist:
- Print the exact values stack used by CI.
- Render with base plus prod overlays locally.
- Search rendered manifests for stage hostnames and secret names.
- Add a values schema or required guard for high-risk settings.
Commands:
$ helm template checkout charts/checkout -f values/base.yaml -f values/prod.yaml --debug
                """,
                [
                    ("Values layering", "Values layering", "Configuration", "Merging multiple values sources where later values override earlier ones."),
                    ("Override", "Override", "Configuration", "A value that replaces a default or base setting."),
                    ("YAML coercion", "YAML coercion", "Type risk", "YAML interpreting unquoted strings as booleans, numbers, or null."),
                    ("Selector label", "Selector label", "Workload identity", "A label used by controllers and Services to match Pods."),
                    ("values schema", "values schema", "Validation", "A JSON schema that validates Helm values before rendering or install."),
                ],
                [
                    ("Why does values file order matter?", "Later values files override earlier ones.", "platform"),
                    ("Where should stable labels usually live?", "In helper templates used consistently across resources.", "platform"),
                    ("Why quote strings in templates?", "To avoid YAML interpreting strings as booleans, numbers, or null.", "platform"),
                ],
            ),
            platform_lesson(
                "Lint, Template, Diff, and Upgrade Safety",
                "Catch bad manifests and risky changes before the cluster sees them.",
                """
## Release review flow
Intermediate Helm work is about the upgrade path, not only fresh installs. A chart can render and still fail because Kubernetes rejects immutable field changes or because the change is operationally risky.
- Run lint for chart structure.
- Render every supported environment.
- Diff against live or previous rendered manifests.
- Validate schema and policy on the rendered output.
- Watch selectors, CRDs, generated secrets, hooks, and resource deletion.

## Commands
$ helm lint charts/checkout
$ helm template checkout charts/checkout -f values/prod.yaml > rendered.yaml
$ helm diff upgrade checkout charts/checkout -n payments -f values/prod.yaml
$ kubectl apply --dry-run=server -f rendered.yaml
Server dry-run requires a cluster; use it only against safe local or approved environments.

## Failure mode
Changing Deployment selectors is not a normal upgrade. It needs a migration plan.
                """,
                """
Scenario: A chart upgrade changes selector labels.
Checklist:
- Compare old and new rendered selectors.
- Preserve immutable labels where possible.
- If identity must change, plan a new Deployment name and traffic migration.
- Document rollback limits.
Commands:
$ helm get manifest checkout -n payments > old.yaml
$ helm template checkout charts/checkout -f values/prod.yaml > new.yaml
$ diff -u old.yaml new.yaml | grep -A4 -B4 selector
                """,
                [
                    ("helm lint", "helm lint", "Static check", "A command that checks chart structure and common template issues."),
                    ("helm diff", "helm diff", "Release review", "A plugin workflow comparing intended changes with live release state."),
                    ("Server dry-run", "Server dry-run", "API validation", "A Kubernetes API validation mode that does not persist objects."),
                    ("Immutable field", "Immutable field", "Upgrade risk", "A field Kubernetes does not allow to change in place."),
                    ("Release history", "Release history", "Rollback data", "Stored Helm release revisions used for status and rollback."),
                ],
                [
                    ("Why test upgrades, not only installs?", "Real production releases change live objects with existing state and immutable fields.", "platform"),
                    ("What is dangerous about selector changes?", "They can be immutable and can disconnect Services or controllers from Pods.", "platform"),
                    ("Why validate rendered YAML?", "Every validator sees the exact manifests intended for release.", "platform"),
                ],
            ),
            platform_lesson(
                "Rollbacks, Hooks, CRDs, and Supply Chain Checks",
                "Know what Helm can recover and what needs a separate operational plan.",
                """
## Beyond basic upgrade
Helm stores release history and can roll back a release, but rollback is not magic. External systems, data migrations, CRDs, and generated credentials may not return to a prior state.
- Hooks run lifecycle Jobs but need cleanup policy and failure handling.
- CRDs are cluster APIs and should have explicit ownership.
- Third-party chart dependencies can introduce broad RBAC or privileged Pods.
- Pin chart versions and review provenance when possible.

## Commands
$ helm history checkout -n payments
$ helm status checkout -n payments
$ helm rollback checkout REVISION -n payments
$ helm dependency list charts/checkout
$ grep -n \"ClusterRole\\|privileged\\|hostPath\" rendered.yaml
Use rollback commands as practice syntax unless you are in an approved local cluster.

## Tradeoff
Putting CRDs inside app charts is convenient for demos but risky for shared platforms.
                """,
                """
Scenario: A vendor chart requests cluster-admin.
Checklist:
- Render the chart with your exact values.
- Inspect ClusterRole and ClusterRoleBinding resources.
- Ask whether the controller truly needs cluster scope.
- Prefer narrower values, an internal fork, or an exception record with owner and review date.
Commands:
$ helm template vendor charts/vendor -f values/prod.yaml > rendered.yaml
$ grep -n \"cluster-admin\\|ClusterRole\\|privileged\\|hostPath\" rendered.yaml
                """,
                [
                    ("Helm hook", "Helm hook", "Lifecycle", "An annotated resource that runs during Helm release phases."),
                    ("CRD", "CRD", "API extension", "A CustomResourceDefinition that extends the Kubernetes API."),
                    ("helm rollback", "helm rollback", "Recovery", "A command that returns a release to a previous revision where possible."),
                    ("Chart dependency", "Chart dependency", "Supply chain", "A chart pulled from another package or repository."),
                    ("Provenance", "Provenance", "Supply chain", "Metadata and signatures used to verify chart origin."),
                ],
                [
                    ("Why is rollback limited?", "External state, migrations, CRDs, and generated secrets may not return to old state.", "platform"),
                    ("Why are CRDs special?", "They define cluster-wide APIs with lifecycle risk beyond one app release.", "platform"),
                    ("What should you review in third-party charts?", "RBAC, privileged settings, dependencies, generated secrets, and provenance.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-argocd-gitops",
        "title": "ArgoCD GitOps",
        "era": PLATFORM_ACADEMY_ERA,
        "level": INTERMEDIATE_LEVEL,
        "category": "ArgoCD",
        "description": "Operate GitOps with app-of-apps, projects, sync waves, pruning, drift, secrets, and multi-environment promotion.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Git as Desired State and Application Basics",
                "Understand what ArgoCD compares and why Git ownership matters.",
                """
## GitOps model
ArgoCD compares desired state in Git with live state in the cluster. An Application points to a source repo/path and a destination cluster/namespace.
- Desired state should be reviewable in Git.
- Live UI edits can drift from Git and be overwritten.
- Application status separates sync state and health state.
- A production change should map back to a commit, image digest, or chart version.

## Inspection commands
$ argocd app list
$ argocd app get checkout-dev
$ argocd app diff checkout-dev
$ kubectl get applications -n argocd
Use ArgoCD commands as learning examples; this repo does not require an ArgoCD server.

## Tradeoff
GitOps increases auditability, but a bad commit can still automate a bad production change quickly.
                """,
                """
Scenario: A Deployment was changed manually during an incident.
Checklist:
- Diff live state against Git.
- Decide whether the manual change is still needed.
- Commit the desired recovery or let ArgoCD self-heal it away.
- Record why UI-only changes are temporary.
Commands:
$ argocd app diff checkout-prod
$ kubectl get deploy checkout -n payments -o yaml
                """,
                [
                    ("Application", "Application", "ArgoCD unit", "An ArgoCD resource pointing desired manifests to a destination."),
                    ("Desired state", "Desired state", "GitOps source", "The configuration ArgoCD should apply from Git or another source."),
                    ("Live state", "Live state", "Cluster state", "The resources currently existing in the cluster."),
                    ("OutOfSync", "OutOfSync", "Drift state", "A state where live resources differ from desired state."),
                    ("Health", "Health", "Readiness signal", "ArgoCD's assessment of whether managed resources are operational."),
                ],
                [
                    ("What does ArgoCD compare?", "Desired state from source with live cluster state.", "platform"),
                    ("Why avoid UI-only production changes?", "They bypass Git review and may be overwritten by sync or self-heal.", "platform"),
                    ("What two states should you read in ArgoCD?", "Sync state and health state.", "platform"),
                ],
            ),
            platform_lesson(
                "App-of-Apps and AppProject Boundaries",
                "Bootstrap multiple apps without giving every team cluster-wide power.",
                """
## Boundary design
App-of-apps uses a parent Application to manage child Application resources. It is useful for bootstrap, but it becomes a root of trust. AppProjects define which repos, destinations, and resource kinds an app may use.
- Use AppProjects to restrict source repos and namespaces.
- Separate platform apps from tenant apps.
- Avoid wildcard permissions unless the blast radius is intentional.
- Keep the bootstrap repo protected and reviewed.

## Inspection commands
$ kubectl get appproject -n argocd
$ kubectl get appproject tenant-a -n argocd -o yaml
$ kubectl get applications -n argocd
$ argocd app get platform-root
Look for wildcard destinations, cluster-scoped resources in tenant projects, and parent apps that can create anything anywhere.

## Failure mode
A tenant project that allows ClusterRole and all namespaces is effectively a platform-admin path.
                """,
                """
Scenario: A tenant app needs a ClusterRole for one feature.
Checklist:
- Confirm whether the feature truly needs cluster scope.
- Move cluster-scoped resources to a platform-owned app if possible.
- Restrict AppProject allowed kinds and destinations.
- Add a review checklist for boundary exceptions.
Commands:
$ kubectl get appproject tenant-a -n argocd -o yaml
                """,
                [
                    ("App-of-apps", "App-of-apps", "Bootstrap pattern", "A parent Application that manages child Applications."),
                    ("AppProject", "AppProject", "Boundary", "An ArgoCD resource restricting sources, destinations, and resource permissions."),
                    ("Destination", "Destination", "Deploy target", "The cluster and namespace where ArgoCD applies resources."),
                    ("Cluster resource", "Cluster resource", "Scope", "A resource not limited to one namespace, such as ClusterRole or CRD."),
                    ("Root of trust", "Root of trust", "Governance", "A source with broad authority over platform state."),
                ],
                [
                    ("What is the main risk of app-of-apps?", "The parent app can become a broad root of trust.", "platform"),
                    ("What does an AppProject restrict?", "Source repos, destinations, and allowed resource kinds.", "platform"),
                    ("Why separate platform and tenant apps?", "They have different ownership, permissions, and blast radius.", "platform"),
                ],
            ),
            platform_lesson(
                "Sync Waves, Pruning, Self-Heal, and Drift",
                "Control apply order and decide which differences matter.",
                """
## Sync behavior
ArgoCD sync applies desired resources. Waves and phases control order, which matters for CRDs, controllers, migrations, and workloads.
- Sync waves order resources with annotations.
- Pruning deletes resources removed from Git.
- Self-heal reverts live drift back to desired state.
- ignoreDifferences can hide expected controller-managed fields, but broad ignores hide real drift.

## Inspection commands
$ argocd app diff checkout-prod
$ argocd app sync checkout-prod --preview-changes
$ argocd app history checkout-prod
$ kubectl describe application checkout-prod -n argocd
Look for pending waves, unhealthy dependencies, prune candidates, ignored fields, and manual changes.

## Tradeoff
Auto-sync is powerful for low-risk environments, but production needs clear prune, self-heal, and approval expectations.
                """,
                """
Scenario: ArgoCD reports drift because an HPA changes replicas.
Checklist:
- Identify the exact field causing drift.
- Decide whether Git or a controller owns that field.
- If ignoring, scope ignoreDifferences to group, kind, name, and field.
- Document the ownership decision near the Application manifest.
Commands:
$ argocd app diff checkout-prod
$ kubectl get hpa,deploy -n payments checkout -o yaml
                """,
                [
                    ("Sync wave", "Sync wave", "Apply order", "An annotation-based mechanism for ordering sync operations."),
                    ("Pruning", "Pruning", "Deletion", "Deleting live resources removed from desired state."),
                    ("Self-heal", "Self-heal", "Drift correction", "Automatically correcting live changes back to Git."),
                    ("ignoreDifferences", "ignoreDifferences", "Diff control", "A scoped setting that ignores specific live-vs-desired differences."),
                    ("Auto-sync", "Auto-sync", "Automation", "A policy where ArgoCD syncs changes without manual approval."),
                ],
                [
                    ("Why do sync waves matter?", "They ensure dependencies such as CRDs and controllers exist before dependent resources.", "platform"),
                    ("What is the danger of pruning?", "It can delete shared, stateful, or manually migrated resources if Git removes them.", "platform"),
                    ("Why should ignoreDifferences be narrow?", "Broad ignores can hide real production drift.", "platform"),
                ],
            ),
            platform_lesson(
                "Secrets, Environments, and Rollback Reality",
                "Promote changes through Git while keeping secrets and recovery honest.",
                """
## Promotion and secrets
GitOps makes release intent visible, but it does not make plaintext secrets acceptable or rollback automatic. A production promotion should show what changed, which environment values changed, and how recovery works.
- Do not commit plaintext secrets.
- Use External Secrets, Sealed Secrets, SOPS, or another documented pattern.
- Promote the same image digest or chart version when possible.
- Rollback may mean reverting Git, syncing a prior chart version, or disabling a feature flag.

## Inspection commands
$ git diff main..release/prod -- environments/prod
$ argocd app history checkout-prod
$ kubectl get externalsecret,sealedsecret -A
$ argocd app rollback checkout-prod REVISION
Treat rollback commands as syntax practice unless you operate an approved local ArgoCD instance.

## Failure mode
If auto-sync remains enabled during manual rollback, ArgoCD may reapply the bad desired state.
                """,
                """
Scenario: A production sync introduced bad config.
Checklist:
- Identify whether the change was image, config, chart, CRD, or data.
- Pause auto-sync if needed.
- Prefer reverting the Git change so desired state matches recovery.
- Note rollback limits for database or external state.
Commands:
$ argocd app history checkout-prod
$ git log --oneline -- environments/prod/checkout
                """,
                [
                    ("ExternalSecret", "ExternalSecret", "Secret sync", "A resource that syncs values from an external secret provider."),
                    ("SealedSecret", "SealedSecret", "Encrypted secret", "An encrypted secret manifest decryptable by a cluster controller."),
                    ("SOPS", "SOPS", "Secret encryption", "A tool for encrypting selected fields in files stored in Git."),
                    ("Promotion", "Promotion", "Release flow", "Moving reviewed artifact and configuration through environments."),
                    ("Rollback", "Rollback", "Recovery", "Returning service behavior to a known-good state while respecting external state."),
                ],
                [
                    ("Name three GitOps secret patterns.", "External Secrets, Sealed Secrets, and SOPS-encrypted files.", "platform"),
                    ("Why is reverting Git often the clean rollback?", "It keeps Git as desired state so ArgoCD does not fight recovery.", "platform"),
                    ("What can make rollback unsafe?", "Database migrations, external state, CRDs, and generated credentials.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-production-eks-architecture",
        "title": "Production EKS Architecture",
        "era": PLATFORM_ACADEMY_ERA,
        "level": ADVANCED_LEVEL,
        "category": "EKS",
        "description": "Design private clusters, endpoint access, Karpenter, multi-AZ capacity, cost guardrails, and cluster upgrade plans.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "Private Clusters, Endpoints, and Access Paths",
                "Defend how operators and automation reach the EKS API.",
                """
## Access design
EKS control plane endpoint settings shape how operators, CI, and incident responders reach the Kubernetes API. Public endpoints are convenient. Private or restricted endpoints reduce exposure but require planned network access.
- Private worker nodes should be the default for production unless a strong reason exists.
- Restrict public endpoint CIDRs if public access remains enabled.
- Private endpoints require VPN, Direct Connect, bastion, or runners inside the VPC.
- Break-glass access should be documented and tested before incidents.

## Inspection commands
$ aws eks describe-cluster --name prod-platform --query 'cluster.resourcesVpcConfig'
$ kubectl config current-context
$ kubectl auth can-i get pods -A
$ kubectl get endpoints -n default kubernetes
AWS commands are design examples only in this local project.

## Tradeoff
Private-only endpoints reduce internet exposure but can block responders if access paths or identity mappings are broken.
                """,
                """
Scenario: CI cannot deploy after the cluster endpoint was made private.
Checklist:
- Identify where CI runners live.
- Confirm routing and DNS to the private endpoint.
- Confirm IAM/Kubernetes auth mapping still works.
- Document a break-glass access path and test it locally where possible.
Commands:
$ aws eks describe-cluster --name prod-platform --query 'cluster.endpoint'
$ kubectl auth can-i create deployments -n payments
                """,
                [
                    ("Private endpoint", "Private endpoint", "Control plane access", "An EKS API endpoint reachable from the VPC instead of the public internet."),
                    ("Public access CIDR", "Public access CIDR", "Exposure control", "CIDR ranges allowed to reach a public EKS endpoint."),
                    ("Break-glass", "Break-glass", "Emergency access", "A controlled emergency access path for incidents."),
                    ("Bastion", "Bastion", "Access host", "A controlled host used to reach private network resources."),
                    ("Auth mapping", "Auth mapping", "Identity", "The mapping between AWS identity and Kubernetes permissions."),
                ],
                [
                    ("What is the tradeoff of private EKS endpoints?", "Lower exposure but higher need for reliable operator and automation network access.", "platform"),
                    ("What should be tested before incidents?", "Break-glass access, identity mapping, and network path to the API.", "platform"),
                    ("Why restrict public endpoint CIDRs?", "To reduce who can reach the control plane API over the internet.", "platform"),
                ],
            ),
            platform_lesson(
                "Karpenter, NodePools, and Disruption Budgets",
                "Use dynamic capacity without letting autoscaling surprise production.",
                """
## Advanced capacity
Karpenter can provision nodes quickly based on pending Pods and consolidate underused nodes. In production, it needs constraints, disruption policy, and observability.
- Define allowed instance families, zones, capacity types, and limits.
- Separate system workloads from dynamic application capacity.
- Respect PodDisruptionBudgets and topology spread constraints.
- Watch consolidation, expire-after, interruption handling, and Spot behavior.

## Inspection commands
$ kubectl get nodepool,nodeclaim
$ kubectl get nodes -L karpenter.sh/nodepool,node.kubernetes.io/instance-type,topology.kubernetes.io/zone
$ kubectl -n karpenter logs deploy/karpenter --since=30m
$ kubectl get pdb -A
Look for expensive oversized nodes, single-AZ placement, consolidation blocked by PDBs, and system Pods on risky capacity.

## Tradeoff
Karpenter improves right-sizing and speed, but unconstrained provisioning can increase cost or reduce availability during disruption.
                """,
                """
Scenario: Nodes scaled out for a batch job and never scaled in.
Checklist:
- Check whether Pods still request capacity.
- Read Karpenter consolidation reasons.
- Inspect PDBs and topology constraints.
- Compare requested resources with actual usage.
Commands:
$ kubectl get nodes --show-labels
$ kubectl get pdb -A
$ kubectl -n karpenter logs deploy/karpenter --since=1h
                """,
                [
                    ("Karpenter", "Karpenter", "Autoscaling", "A Kubernetes-native node provisioning controller."),
                    ("NodePool", "NodePool", "Capacity policy", "A Karpenter object defining provisioning constraints and disruption policy."),
                    ("NodeClaim", "NodeClaim", "Provisioned node", "A Karpenter object representing a requested node."),
                    ("Consolidation", "Consolidation", "Cost control", "Replacing or removing nodes to reduce waste while respecting constraints."),
                    ("PodDisruptionBudget", "PodDisruptionBudget", "Availability", "A policy limiting voluntary disruption for matching Pods."),
                ],
                [
                    ("What does Karpenter react to?", "Pending Pods and scheduling requirements.", "platform"),
                    ("What can block consolidation?", "PDBs, topology constraints, required Pods, NodePool policy, or disruption settings.", "platform"),
                    ("Why constrain NodePools?", "To control cost, availability zones, instance choices, and workload isolation.", "platform"),
                ],
            ),
            platform_lesson(
                "Multi-AZ Design and Cost Guardrails",
                "Balance resilience, network cost, and capacity ownership.",
                """
## Availability design
Multi-AZ EKS design is more than placing nodes in three subnets. Workloads need topology spread, storage constraints, load balancer behavior, and failure-mode thinking.
- Spread critical replicas across zones.
- Know which storage is zonal and which services are regional.
- Watch cross-AZ traffic and NAT Gateway data processing costs.
- Use labels for team, service, environment, and cost center.
- Track idle requested CPU/memory and orphaned cloud resources.

## Inspection commands
$ kubectl get pods -A -o wide
$ kubectl get nodes -L topology.kubernetes.io/zone
$ kubectl get pv,pvc -A
$ kubectl get svc -A
Look for all replicas in one zone, zonal volumes blocking reschedule, many LoadBalancer services, and idle requested resources.

## Tradeoff
More zones can improve resilience, but they can expose cross-zone data transfer, storage attachment, and skewed capacity problems.
                """,
                """
Scenario: One AZ fails and a stateful app does not recover.
Checklist:
- Check whether replicas were spread across zones.
- Identify whether storage was zonal.
- Confirm PDBs and anti-affinity did not block recovery.
- Decide whether the app needs regional storage, replicas, or documented manual recovery.
Commands:
$ kubectl get pods -n data -o wide
$ kubectl get pv,pvc -n data
                """,
                [
                    ("Topology spread", "Topology spread", "Placement", "A constraint that spreads Pods across topology domains such as zones."),
                    ("Zonal storage", "Zonal storage", "Storage scope", "Storage that can attach only within one Availability Zone."),
                    ("Cross-AZ traffic", "Cross-AZ traffic", "Cost signal", "Network traffic crossing Availability Zones."),
                    ("Cost center label", "Cost center label", "Chargeback", "A label used to attribute platform costs to owners."),
                    ("Idle request", "Idle request", "Waste signal", "Reserved CPU or memory that workloads request but do not use."),
                ],
                [
                    ("Why is multi-AZ more than subnet count?", "Workload placement, storage scope, load balancing, and disruption policy also matter.", "platform"),
                    ("Name two EKS cost guardrails.", "Cost labels, idle request tracking, NAT data review, load balancer count, and orphaned volume cleanup.", "platform"),
                    ("Why can zonal storage block recovery?", "A volume may not attach to Pods rescheduled in another zone.", "platform"),
                ],
            ),
            platform_lesson(
                "Cluster Upgrades and Add-on Compatibility",
                "Plan upgrades as a compatibility project, not a button click.",
                """
## Upgrade program
Production EKS upgrades touch Kubernetes API versions, managed control plane version, node versions, add-ons, controllers, CRDs, and client tooling. Advanced teams rehearse upgrades.
- Inventory deprecated APIs before upgrading.
- Upgrade add-ons in a supported order.
- Roll node groups or Karpenter capacity carefully.
- Test admission policies, controllers, and Helm charts against the target version.
- Keep rollback and pause points clear.

## Inspection commands
$ kubectl version
$ kubectl api-resources
$ kubectl get crd
$ helm list -A
$ kubectl get pods -A | grep -E 'CrashLoopBackOff|ImagePullBackOff'
Use version checks and manifests locally where possible; do not upgrade real clusters from this repo.

## Tradeoff
Waiting too long increases version skew and deprecated API risk. Upgrading too fast without rehearsals risks controller and workload outages.
                """,
                """
Scenario: Ingress resources use an API removed in the next cluster version.
Checklist:
- Search manifests and Helm renders for deprecated apiVersions.
- Upgrade charts or manifests before the control plane upgrade.
- Validate generated YAML against the target version.
- Track owners for every incompatible resource.
Commands:
$ grep -R \"extensions/v1beta1\\|networking.k8s.io/v1beta1\" manifests/
$ helm template checkout charts/checkout -f values/prod.yaml > rendered.yaml
                """,
                [
                    ("Version skew", "Version skew", "Compatibility", "Differences between Kubernetes component or client versions."),
                    ("Deprecated API", "Deprecated API", "Upgrade risk", "An API version scheduled for removal in a later Kubernetes version."),
                    ("Control plane", "Control plane", "Cluster core", "The Kubernetes API and controllers managed by EKS."),
                    ("Node rollout", "Node rollout", "Capacity upgrade", "Replacing worker nodes with versions or images compatible with the new cluster."),
                    ("Pause point", "Pause point", "Upgrade control", "A planned checkpoint where an upgrade can stop safely for validation."),
                ],
                [
                    ("Why inventory APIs before upgrade?", "Removed APIs can break applies, controllers, or workloads after the upgrade.", "platform"),
                    ("What components besides the control plane need upgrade planning?", "Nodes, add-ons, controllers, CRDs, Helm charts, and clients.", "platform"),
                    ("What is the risk of waiting too long?", "Version skew grows and deprecated API removals become harder to handle.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-kubernetes-security-multitenancy",
        "title": "Kubernetes Security and Multi-tenancy",
        "era": PLATFORM_ACADEMY_ERA,
        "level": ADVANCED_LEVEL,
        "category": "Security",
        "description": "Design RBAC, network policies, Pod Security Standards, admission controls, secrets strategy, and tenant boundaries.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "RBAC and Least Privilege",
                "Give users, workloads, and controllers the smallest permissions that still work.",
                """
## Permission model
Kubernetes RBAC grants verbs on resources to users, groups, or service accounts. Multi-tenant platforms need role design, namespace boundaries, and auditability.
- Prefer Role and RoleBinding inside namespaces for tenant workloads.
- Use ClusterRole only when cluster-wide resources are needed.
- Avoid binding tenant users to cluster-admin.
- Review service account tokens and default service account usage.

## Inspection commands
$ kubectl auth can-i create deployments -n payments --as user@example.com
$ kubectl get role,rolebinding -n payments
$ kubectl get clusterrolebinding
$ kubectl get sa -n payments
Look for broad wildcards, cluster-admin bindings, default service account use, and controllers with more verbs than required.

## Tradeoff
Too little access blocks delivery. Too much access turns every tenant into a platform-admin risk. Build narrow roles plus a clear escalation path.
                """,
                """
Scenario: Developers need to restart Deployments but should not read Secrets.
Checklist:
- Create a Role with get/list/watch on workloads and patch on deployments if needed.
- Avoid secrets verbs.
- Test with kubectl auth can-i.
- Document the escalation path for exceptional access.
Commands:
$ kubectl auth can-i get secrets -n payments --as dev@example.com
$ kubectl auth can-i patch deployments -n payments --as dev@example.com
                """,
                [
                    ("RBAC", "RBAC", "Authorization", "Role-based access control for Kubernetes API actions."),
                    ("Role", "Role", "Namespaced permissions", "A namespaced set of permissions."),
                    ("ClusterRole", "ClusterRole", "Cluster permissions", "A permission set that can include cluster-wide resources."),
                    ("RoleBinding", "RoleBinding", "Grant", "A binding that grants a Role or ClusterRole to subjects."),
                    ("Least privilege", "Least privilege", "Security principle", "Granting only the permissions required for the job."),
                ],
                [
                    ("When should you prefer Role over ClusterRole?", "When permissions only need to apply inside one namespace.", "platform"),
                    ("How do you test an RBAC decision?", "Use `kubectl auth can-i` with the target user or service account.", "platform"),
                    ("Why avoid default service account use?", "It blurs workload identity and can accidentally inherit broad permissions.", "platform"),
                ],
            ),
            platform_lesson(
                "Network Policies and Tenant Isolation",
                "Control pod-to-pod traffic deliberately instead of trusting flat networking.",
                """
## Network policy model
NetworkPolicy resources define allowed ingress and egress for selected Pods, but enforcement depends on a network plugin that supports policies.
- Start with namespace or app default-deny policies.
- Allow only required traffic: ingress controller, dependencies, DNS, metrics, and health checks.
- Test egress rules carefully; blocking DNS can look like many unrelated failures.
- Document ownership of shared services.

## Inspection commands
$ kubectl get networkpolicy -A
$ kubectl describe networkpolicy -n payments
$ kubectl get pods -n payments --show-labels
$ kubectl exec -n payments deploy/checkout -- nslookup kubernetes.default
Look for policies selecting no Pods, labels that do not match, missing DNS egress, and shared namespaces without boundaries.

## Tradeoff
Default-deny improves containment, but rollout without dependency inventory can cause outages.
                """,
                """
Scenario: After default-deny, apps cannot call DNS.
Checklist:
- Confirm the policy selects the Pods.
- Add explicit egress to kube-dns/CoreDNS.
- Test dependency traffic one service at a time.
- Keep a rollback manifest for the policy rollout.
Commands:
$ kubectl get networkpolicy -n payments -o yaml
$ kubectl get pods -n kube-system -l k8s-app=kube-dns -o wide
                """,
                [
                    ("NetworkPolicy", "NetworkPolicy", "Traffic policy", "A Kubernetes resource controlling allowed Pod ingress and egress."),
                    ("Default deny", "Default deny", "Isolation", "A policy posture that blocks traffic unless explicitly allowed."),
                    ("Ingress", "Ingress", "Incoming traffic", "Traffic entering selected Pods."),
                    ("Egress", "Egress", "Outgoing traffic", "Traffic leaving selected Pods."),
                    ("Policy enforcement", "Policy enforcement", "CNI support", "Whether the installed network plugin enforces NetworkPolicy."),
                ],
                [
                    ("What must exist for NetworkPolicy to work?", "A network plugin that enforces NetworkPolicy.", "platform"),
                    ("Why can blocking DNS be confusing?", "Many dependencies fail by name and appear unrelated.", "platform"),
                    ("What is the rollout risk of default-deny?", "Missing dependency inventory can break service traffic.", "platform"),
                ],
            ),
            platform_lesson(
                "Pod Security Standards and Admission Policy",
                "Prevent risky workloads from entering the cluster.",
                """
## Admission guardrails
Pod Security Standards define baseline and restricted policies for Pod specs. Admission controllers and policy engines can enforce guardrails before resources are persisted.
- Restrict privileged containers, hostPath, hostNetwork, hostPID, and dangerous capabilities.
- Require non-root where possible.
- Enforce resource requests, approved registries, and signed images where your maturity supports it.
- Keep exceptions explicit, owned, and time-bounded.

## Inspection commands
$ kubectl get ns --show-labels
$ kubectl auth can-i use podsecuritypolicy
$ kubectl get validatingadmissionpolicy
$ kubectl get pods -A -o yaml | grep -n \"privileged\\|hostPath\\|hostNetwork\"
PodSecurityPolicy is removed in modern Kubernetes; this check teaches history and migration awareness.

## Tradeoff
Strict policy improves safety, but unplanned enforcement can block critical controllers. Audit first, then enforce by namespace or tenant.
                """,
                """
Scenario: A monitoring agent needs hostPath and privileged access.
Checklist:
- Verify why host access is required.
- Isolate the agent namespace and service account.
- Scope RBAC and network access.
- Create a documented exception with owner and review date.
Commands:
$ kubectl describe pod agent -n observability
$ kubectl get rolebinding,clusterrolebinding -A | grep observability
                """,
                [
                    ("Pod Security Standards", "Pod Security Standards", "Pod guardrails", "Kubernetes-defined baseline and restricted Pod security levels."),
                    ("Admission controller", "Admission controller", "API guardrail", "Logic that validates or mutates API requests before persistence."),
                    ("hostPath", "hostPath", "Node mount", "A volume that mounts a file or directory from the node filesystem."),
                    ("Privileged container", "Privileged container", "High-risk Pod", "A container with broad host-level permissions."),
                    ("Exception", "Exception", "Policy waiver", "A documented allowance for a workload that cannot meet standard policy."),
                ],
                [
                    ("What do admission policies prevent?", "Risky or non-compliant resources from entering the cluster.", "platform"),
                    ("Why audit before enforcing strict policy?", "To find required exceptions and avoid breaking critical workloads.", "platform"),
                    ("Name three high-risk Pod settings.", "privileged, hostPath, hostNetwork, hostPID, added capabilities, and running as root.", "platform"),
                ],
            ),
            platform_lesson(
                "Secrets Strategy and Multi-Tenant Boundaries",
                "Design secret ownership, rotation, and blast radius for shared clusters.",
                """
## Secret operating model
Kubernetes Secrets are API objects. They need encryption at rest, RBAC, audit, rotation, and a source-of-truth strategy. In multi-tenant clusters, secret boundaries are as important as workload boundaries.
- Keep tenant secrets in tenant namespaces.
- Avoid broad secret list/watch permissions.
- Use External Secrets, CSI drivers, SOPS, or Sealed Secrets based on ownership model.
- Rotate credentials and test application reload or restart behavior.
- Do not put secrets in logs, annotations, or rendered Helm output committed to Git.

## Inspection commands
$ kubectl get secrets -A
$ kubectl auth can-i list secrets -n payments --as system:serviceaccount:payments:checkout
$ kubectl get externalsecret -A
$ kubectl describe pod checkout-abc123 -n payments
Look for default tokens, broad secret readers, stale secret versions, and secret values exposed through env dumps.

## Tradeoff
External secret managers centralize rotation and audit, but add controller dependency and failure modes.
                """,
                """
Scenario: A team wants one namespace to share credentials across services.
Checklist:
- Split credentials by service and privilege.
- Bind read access to exact service accounts.
- Name rotation owner and process.
- Verify logs and debug endpoints do not expose env secrets.
Commands:
$ kubectl auth can-i get secret checkout-db -n payments --as system:serviceaccount:payments:checkout
$ kubectl get sa -n payments
                """,
                [
                    ("Encryption at rest", "Encryption at rest", "Data protection", "Encrypting stored Kubernetes Secret data in the backing datastore."),
                    ("External Secrets", "External Secrets", "Secret sync", "A controller pattern syncing external secret manager values into Kubernetes."),
                    ("Secret rotation", "Secret rotation", "Credential lifecycle", "Replacing credentials on a defined schedule or trigger."),
                    ("Blast radius", "Blast radius", "Impact scope", "The amount of damage or access possible after a failure or compromise."),
                    ("Tenant boundary", "Tenant boundary", "Isolation", "A policy and ownership line between teams or workloads sharing a platform."),
                ],
                [
                    ("Why is a Kubernetes Secret not enough by itself?", "It needs encryption, RBAC, audit, rotation, and a clear source of truth.", "platform"),
                    ("Why avoid list/watch secrets broadly?", "It can expose every secret in the namespace to one compromised identity.", "platform"),
                    ("What is the tradeoff of external secret managers?", "Better central audit and rotation, but more controller and dependency failure modes.", "platform"),
                ],
            ),
        ],
    },
    {
        "slug": "platform-sre-observability-kubernetes",
        "title": "SRE and Observability for Kubernetes",
        "era": PLATFORM_ACADEMY_ERA,
        "level": ADVANCED_LEVEL,
        "category": "SRE",
        "description": "Build dashboards, alerts, SLOs, burn-rate rules, logs/traces, and runbooks that start from user impact.",
        "subscription_tier": "free",
        "lessons": [
            platform_lesson(
                "RED, USE, and Kubernetes Golden Signals",
                "Separate user symptoms from infrastructure causes.",
                """
## Measurement model
Good observability starts with the question: what pain does the user feel? RED metrics cover request Rate, Error rate, and Duration. USE covers Utilization, Saturation, and Errors for resources.
- Use RED for APIs and request-driven services.
- Use USE for nodes, disks, queues, network interfaces, and database pools.
- Kubernetes adds desired vs available replicas, pending Pods, restarts, unschedulable reasons, and HPA behavior.
- Page on user impact or imminent capacity exhaustion, not every component twitch.

## Inspection commands
$ kubectl top nodes
$ kubectl top pods -A
$ kubectl get deploy -A
$ kubectl get events -A --sort-by=.lastTimestamp
Look for saturation, rollout availability, crash patterns, scheduling pressure, and whether the symptom is service-level or component-level.

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
                    ("Golden signals", "Golden signals", "Reliability", "Latency, traffic, errors, and saturation."),
                    ("Saturation", "Saturation", "Capacity", "A signal that a resource has more demand than it can serve promptly."),
                    ("Blast radius", "Blast radius", "Impact", "The scope of users, services, regions, or clusters affected by a problem."),
                ],
                [
                    ("When should a container restart page someone?", "When it correlates with user impact or high-risk service failure, not as standalone noise.", "platform"),
                    ("What does RED measure?", "Request rate, error rate, and duration.", "platform"),
                    ("What does USE measure?", "Utilization, saturation, and errors for resources.", "platform"),
                ],
            ),
            platform_lesson(
                "Prometheus, Grafana, Logs, and Traces",
                "Connect metrics, logs, and traces without turning every tool into a silo.",
                """
## Telemetry roles
Metrics tell you what is happening over time. Logs provide discrete event detail. Traces connect service hops for one request. Dashboards should guide operators from symptom to likely cause.
- Label metrics with stable dimensions, not high-cardinality user IDs.
- Keep request IDs and trace IDs in logs.
- Use exemplars or links where possible to jump from metrics to traces.
- Dashboards should show deploy markers or recent changes.

## Inspection commands
$ kubectl get servicemonitor,podmonitor -A
$ kubectl logs deploy/checkout -n payments --since=15m
$ kubectl get pods -n observability
$ kubectl port-forward svc/prometheus 9090:9090 -n observability
Use local Compose Prometheus/Grafana in this repo for safe practice.

## Tradeoff
More telemetry is not automatically better. High-cardinality metrics and noisy logs can increase cost and slow incident response.
                """,
                """
Scenario: Error rate spikes but logs are hard to connect.
Checklist:
- Confirm logs include request ID, trace ID, route, status, and version.
- Check whether metrics labels align with dashboard filters.
- Sample traces for failed requests.
- Add deploy annotations or release labels to charts.
Commands:
$ kubectl logs deploy/checkout -n payments --since=15m | grep ERROR
                """,
                [
                    ("Metric", "Metric", "Time series", "A measured value over time with labels."),
                    ("Log", "Log", "Event detail", "A textual or structured record of an event."),
                    ("Trace", "Trace", "Request path", "A set of spans showing one request across services."),
                    ("Cardinality", "Cardinality", "Metric scale", "The number of distinct label combinations in a metric."),
                    ("Request ID", "Request ID", "Correlation", "An identifier used to connect logs for one request."),
                ],
                [
                    ("What does a trace add beyond logs?", "It connects service hops and timing for one request.", "platform"),
                    ("Why avoid high-cardinality labels?", "They increase cost and can hurt metrics system performance.", "platform"),
                    ("What IDs should logs carry?", "Request IDs and trace IDs where possible.", "platform"),
                ],
            ),
            platform_lesson(
                "SLOs, Error Budgets, and Burn-Rate Alerts",
                "Turn reliability goals into alerts that protect users without exhausting operators.",
                """
## SLO thinking
An SLO is a target for user experience over a window, such as 99.9 percent successful checkout requests over 30 days. Error budget is the tolerated unreliability. Alerting should track burn rate.
- Define SLIs from user-visible behavior: success, latency, freshness, durability, or correctness.
- Page on fast budget burn; ticket on slower risk.
- Separate symptom alerts from cause dashboards.
- Every page needs owner, severity, runbook, and known false-positive notes.

## Inspection commands
$ kubectl get prometheusrule -A
$ kubectl get alertmanagerconfig -A
$ kubectl get servicemonitor,podmonitor -A
Look for alerts without `for` durations, missing routing labels, cause-only pages, and dashboards that cannot confirm user impact.

## Tradeoff
Strict SLOs can drive good engineering, but unrealistic targets create constant emergency mode.
                """,
                """
Scenario: On-call receives 20 pages for one dependency outage.
Checklist:
- Identify symptom alerts and cause alerts.
- Group by service, cluster, and severity.
- Add inhibition for downstream duplicate pages.
- Keep one symptom page if it best represents user impact.
Commands:
$ kubectl get prometheusrule -A -o yaml
                """,
                [
                    ("SLI", "SLI", "Measurement", "A service level indicator measuring user experience."),
                    ("SLO", "SLO", "Target", "A service level objective for an SLI over a window."),
                    ("Error budget", "Error budget", "Risk budget", "The amount of unreliability allowed before missing the SLO."),
                    ("Burn rate", "Burn rate", "Alerting", "How quickly a service consumes its error budget."),
                    ("Inhibition", "Inhibition", "Alert routing", "Suppressing related alerts when a higher-level alert already explains the issue."),
                ],
                [
                    ("Why page on burn rate?", "It maps alert urgency to how quickly users are consuming the error budget.", "platform"),
                    ("What should every page include?", "Owner, severity, runbook, routing labels, and a condition needing immediate action.", "platform"),
                    ("What is a symptom alert?", "An alert that directly indicates user impact.", "platform"),
                ],
            ),
            platform_lesson(
                "Incident Runbooks and Post-Incident Learning",
                "Write operational guides that work under pressure and improve after incidents.",
                """
## Runbook structure
A useful runbook is executable under stress. It starts with impact, gives safe confirmation steps, names mitigation choices, and states when to escalate.
- Start with alert meaning and user impact.
- Put read-only commands first.
- Include mitigation options: rollback, scale, disable feature, fail over, drain node, or pause sync.
- Include escalation criteria and owner.
- End with post-incident actions: permanent fix, alert tuning, docs update, and follow-up owner.

## Inspection commands
$ kubectl get pods -n payments
$ kubectl describe pod POD -n payments
$ kubectl logs deploy/checkout -n payments --since=15m
$ kubectl get events -n payments --sort-by=.lastTimestamp
For traces, start from a slow request and follow service hops. For logs, search by request ID, trace ID, pod, and deploy version.

## Tradeoff
Runbooks should not hide weak systems. Repeated manual mitigation should turn into safer defaults or automation.
                """,
                """
Scenario: A canary release causes checkout failures.
Checklist:
- Confirm user impact through RED dashboard.
- Identify deployed version and rollout timestamp.
- Compare logs and traces by version.
- Roll back or pause ArgoCD sync if GitOps would reapply bad state.
- Write the post-incident action before closing.
Commands:
$ kubectl rollout undo deploy/checkout -n payments
$ argocd app get checkout-prod
$ argocd app set checkout-prod --sync-policy none
                """,
                [
                    ("Runbook", "Runbook", "Operations guide", "A repeatable guide for diagnosing and mitigating a known incident class."),
                    ("Mitigation", "Mitigation", "Incident response", "An action that reduces user impact before permanent fix."),
                    ("Escalation", "Escalation", "Incident response", "Moving an incident to additional owners or higher severity."),
                    ("Post-incident review", "Post-incident review", "Learning", "A structured review that turns incidents into improvements."),
                    ("Canary", "Canary", "Release strategy", "A limited rollout used to detect problems before full release."),
                ],
                [
                    ("What should come before root-cause theory in a runbook?", "Impact, alert meaning, fast confirmation, and safe first checks.", "platform"),
                    ("Why put read-only commands first?", "They collect evidence with lower risk while responders are under pressure.", "platform"),
                    ("What should repeated incidents become?", "Automation, safer defaults, better alerts, or product fixes.", "platform"),
                ],
            ),
        ],
    },
]

PLATFORM_COURSES.extend(
    [
        platform_foundation_course(
            "platform-linux-command-line-foundations",
            "Linux and Command Line Foundations",
            FRESHER_LEVEL,
            "Linux",
            "Learn the shell, files, processes, permissions, logs, and package basics every Kubernetes operator needs before touching clusters.",
            [
                ("Shell Navigation and File Inspection", "Move around Linux systems and inspect files safely.", "Most platform work starts with reading: paths, permissions, config files, logs, and generated artifacts. The shell is not just a typing surface; it is how you build small, repeatable investigations.", "Practice pwd, ls, cd, find alternatives, less, wc, diff, and checksums on sample manifests and logs. Prefer read-only commands until you know the boundary.", "Given a mystery project directory, identify app code, deployment manifests, generated build outputs, and logs without editing anything."),
                ("Processes, Exit Codes, and Logs", "Understand running processes and what failures leave behind.", "Containers make Linux processes look packaged, but PID, stdout, stderr, exit code, and signal behavior still drive Kubernetes status. A CrashLoopBackOff is often just a process repeatedly exiting.", "Practice ps, top, env, journalctl concepts, process signals, and interpreting exit code 1 versus 137.", "Explain whether a workload failed because the app exited, the kernel killed it, or the platform could not start it."),
                ("Users, Groups, Permissions, and Sudo", "Reason about file access and least privilege.", "Linux permissions shape container securityContext decisions, mounted volume access, SSH access, and CI runner behavior. Running everything as root hides ownership bugs and increases blast radius.", "Practice chmod/chown concepts, mode bits, executable permissions, and why containers should use non-root users.", "Review a Dockerfile or Pod securityContext and identify whether the app can read its config without unnecessary root privileges."),
                ("Text Pipelines for Operators", "Use grep, sort, uniq, jq, and yq-style thinking to extract evidence.", "Production debugging produces too much text. Operators need pipelines that reduce output into counts, suspicious fields, and exact resource names without deleting context.", "Practice filtering events by reason, extracting image tags, counting namespaces, and comparing rendered YAML sections.", "Turn raw kubectl JSON or logs into a short incident note with commands and evidence."),
            ],
        ),
        platform_foundation_course(
            "platform-networking-fundamentals",
            "Networking Foundations for Kubernetes",
            FRESHER_LEVEL,
            "Networking",
            "Build the TCP/IP, DNS, HTTP, TLS, load-balancing, and firewall mental model needed for Kubernetes and AWS troubleshooting.",
            [
                ("IP, Ports, and Routing Basics", "Understand what actually connects clients to services.", "Every request crosses source IP, destination IP, protocol, port, route, and policy decisions. Kubernetes adds abstractions, but packets still need a path.", "Practice reading local interfaces, listening ports, service ports, targetPorts, node ports, and route-table concepts.", "Draw how a request travels from browser to load balancer to Service to Pod containerPort."),
                ("DNS and Service Discovery", "Debug names before assuming apps are down.", "Many outages look like application errors but begin as DNS failures, wrong search domains, stale records, or split-horizon assumptions.", "Practice nslookup/dig concepts, Kubernetes service DNS names, CoreDNS role, and TTL tradeoffs.", "Given a connection failure, decide whether the next check is DNS, port reachability, TLS, or application logs."),
                ("HTTP, TLS, and Ingress", "Read request symptoms across L7 boundaries.", "Ingress, ALB, Nginx, app servers, and clients all speak in status codes, headers, certificates, and timeouts. You need to locate which hop generated the symptom.", "Practice curl-style checks for status, headers, SNI, redirects, and health endpoints.", "Classify 404, 502, 503, TLS handshake failure, and timeout into likely ownership areas."),
                ("Network Policies and Firewalls", "Separate connectivity design from accidental openness.", "Security groups, NACLs, Kubernetes NetworkPolicies, and service meshes all constrain traffic at different layers. Default allow is easy, but production platforms need intentional paths.", "Practice reading allowed sources, destinations, ports, and policy selectors.", "Design a minimal allowed path for frontend to API to database plus DNS, then name how you would test it."),
            ],
        ),
        platform_foundation_course(
            "platform-terraform-aws-infrastructure",
            "Terraform for AWS Platform Infrastructure",
            INTERMEDIATE_LEVEL,
            "Terraform",
            "Learn reproducible infrastructure workflows for VPCs, EKS modules, state, plans, reviews, drift, and environment promotion.",
            [
                ("Terraform Workflow and State", "Understand init, plan, apply, state, locking, and remote backends.", "Terraform is an infrastructure change engine backed by state. The plan is only meaningful when provider config, variables, workspace, and state are the intended ones.", "Practice reading plan output, state addresses, backend config, and lock behavior without applying changes.", "Explain what could go wrong if two engineers apply against the same state or the wrong workspace."),
                ("Modules, Variables, and Environment Promotion", "Design reusable infrastructure without hiding risk.", "Good modules expose stable inputs and outputs while keeping provider-specific complexity reviewable. Promotion means using the same module with controlled values, not copy-pasting random stacks.", "Practice comparing dev/stage/prod tfvars, module versions, outputs, and dependency boundaries.", "Review an EKS module call and identify which variables affect security, capacity, and cost."),
                ("AWS VPC and EKS Resources in Terraform", "Connect Terraform resources to platform architecture decisions.", "Subnets, route tables, NAT gateways, security groups, IAM roles, node groups, and add-ons become the substrate for EKS. Small IaC choices can create large reliability or cost outcomes.", "Practice tracing an EKS cluster from module inputs to created AWS resources and Kubernetes bootstrap dependencies.", "Name the Terraform-owned resources involved when Pods cannot reach the internet or the API endpoint is unreachable."),
                ("Plan Review, Drift, and Safe Changes", "Turn terraform plan into an engineering review artifact.", "A plan is not a rubber stamp. Replacements, broad IAM policy changes, route changes, and security group openings need explicit review and rollback thinking.", "Practice spotting replace/destroy actions, unknown values, sensitive outputs, and drift signals.", "Write a plan review summary that calls out blast radius, rollback, validation, and cost impact."),
            ],
        ),
        platform_foundation_course(
            "platform-aws-iam-for-eks",
            "AWS IAM for EKS and Platform Teams",
            INTERMEDIATE_LEVEL,
            "AWS IAM",
            "Learn IAM policies, roles, trust relationships, STS, IRSA, Pod Identity, and least-privilege reviews for EKS workloads.",
            [
                ("IAM Principals, Policies, and Evaluation", "Understand who can do what and why AWS denied or allowed it.", "IAM decisions combine identity policies, resource policies, permission boundaries, SCPs, session policies, and explicit deny. Debugging starts by identifying the principal and action.", "Practice reading policy statements, actions, resources, conditions, and CloudTrail access denied events.", "Explain why a role with an apparent allow can still be denied by boundary, SCP, condition, or resource policy."),
                ("STS, AssumeRole, and Trust Policies", "Follow identity handoffs across accounts and automation.", "Trust policies decide who can assume a role; permission policies decide what the role can do after assumption. CI, EKS controllers, and human break-glass flows depend on this separation.", "Practice reading assume-role events, external IDs, conditions, and session names.", "Review a cross-account deploy role and identify who can assume it and what they can change."),
                ("IRSA and EKS Pod Identity", "Give Pods AWS access without node-wide secrets.", "EKS workloads should not inherit broad node instance profile permissions. IRSA and Pod Identity connect Kubernetes service accounts to scoped AWS roles.", "Practice matching service account annotations, OIDC provider, trust policy subject, and SDK credential behavior.", "Diagnose a Pod that gets AccessDenied even though the IAM role looks correct."),
                ("Least Privilege Reviews for Controllers", "Review powerful add-ons before production install.", "Controllers like ALB, external-dns, cert-manager, cluster-autoscaler, and Karpenter need AWS permissions that can affect infrastructure. Platform teams must scope and monitor them.", "Practice comparing recommended policies to actual resource patterns and tagging conditions.", "Write a review note for an ALB controller policy including required actions, risky actions, and monitoring signals."),
            ],
        ),
        platform_foundation_course(
            "platform-cicd-release-engineering",
            "CI/CD and Release Engineering",
            ADVANCED_LEVEL,
            "CI/CD",
            "Build safe pipelines for container builds, tests, image signing, environment promotion, progressive delivery, and rollback.",
            [
                ("Pipeline Stages and Quality Gates", "Design pipelines that catch defects before users do.", "A release pipeline should prove source quality, artifact integrity, rendered manifest safety, deployment success, and user-impact health. Speed matters, but uncontrolled speed ships incidents.", "Practice mapping lint, unit, integration, image scan, helm template, deploy, smoke, and rollback gates.", "Design a pipeline for a Kubernetes app and name which failures block promotion."),
                ("Artifact Promotion and Supply Chain", "Promote trusted artifacts rather than rebuilding surprises.", "The image digest that passed tests should be the image promoted. Signing, SBOMs, provenance, and vulnerability policy make releases auditable.", "Practice reading image tags versus digests, registry metadata, signatures, and scan reports.", "Explain why rebuilding per environment can break reproducibility and incident rollback."),
                ("Progressive Delivery and Rollback", "Release with canaries, blue/green, feature flags, and measured rollback.", "Progressive delivery limits blast radius by exposing changes gradually and watching real signals. Rollback must be rehearsed before the incident.", "Practice defining canary metrics, pause conditions, automated rollback, and ArgoCD sync behavior.", "Write a canary decision rule using latency, error rate, saturation, and business signal."),
                ("Pipeline Security and Secrets", "Protect deploy permissions and credentials in automation.", "CI/CD systems are production control planes. Runner isolation, secret scoping, OIDC federation, approvals, and audit logs prevent pipelines from becoming a backdoor.", "Practice reviewing repo permissions, environment protection, deploy roles, and secret exposure paths.", "Threat-model a pipeline that can deploy to prod and list the minimum guardrails before launch."),
            ],
        ),
        platform_foundation_course(
            "platform-engineering-product-operating-model",
            "Platform Engineering Operating Model",
            ADVANCED_LEVEL,
            "Platform Engineering",
            "Learn how platform teams define golden paths, service ownership, paved-road APIs, SLOs, cost guardrails, and internal developer experience.",
            [
                ("Golden Paths and Developer Experience", "Turn platform complexity into supported self-service workflows.", "A platform is a product for internal teams. Golden paths should make the safe way the easy way while still allowing explicit exceptions.", "Practice designing a service template with CI, Helm, observability, security defaults, and docs.", "Describe the first-run developer experience for launching a new service without opening a ticket."),
                ("Service Ownership and Production Readiness", "Define what teams own before incidents happen.", "Production readiness connects ownership, runbooks, dashboards, alerts, dependencies, data handling, and support expectations. Ambiguous ownership becomes incident drag.", "Practice building a readiness checklist and ownership metadata model.", "Review a service and decide whether it is ready for shared-cluster production."),
                ("Platform APIs, Backstage, and Templates", "Expose infrastructure capabilities through stable interfaces.", "Platform teams should publish versioned interfaces: templates, modules, charts, APIs, scorecards, and docs. Consumers need contracts, not tribal knowledge.", "Practice defining template inputs, outputs, validation, and lifecycle support.", "Sketch a self-service workflow for creating an EKS-backed service with Terraform, Helm, and ArgoCD."),
                ("Cost, Reliability, and Adoption Metrics", "Measure whether the platform is improving outcomes.", "Senior platform work is judged by lead time, deployment frequency, reliability, cost efficiency, security posture, and user satisfaction. Dashboards should guide investment decisions.", "Practice defining KPIs, cost allocation tags, idle resource reports, SLO rollups, and developer surveys.", "Create a quarterly platform review outline that connects technical work to business outcomes."),
            ],
        ),
    ]
)

PLATFORM_COURSES.extend(
    [
        platform_foundation_course(
            "platform-docker-image-supply-chain",
            "Docker Image and Supply Chain Operations",
            FRESHER_LEVEL,
            "Docker",
            "Build production-ready container images with clear runtime contracts, multi-stage builds, immutable promotion, scanning, SBOMs, and safe registry habits.",
            [
                (
                    "Dockerfile Foundations and Runtime Contract",
                    "Write Dockerfiles that make the application runtime obvious, repeatable, and inspectable.",
                    "A production Dockerfile is an operations document as much as a build recipe. Base image choice, working directory, copied files, user, exposed port, entrypoint, healthcheck, and build context all shape how the image behaves in CI, Kubernetes, and incidents.",
                    "Practice reading Dockerfiles for hidden assumptions: root user, broad COPY statements, unpinned package installs, secret leakage, missing CA certificates, and startup commands that differ from the app contract.",
                    "Review one Dockerfile and produce a runtime contract: process, port, filesystem writes, required env vars, user, health endpoint, and how to collect logs.",
                ),
                (
                    "Multi-stage Builds and Image Size",
                    "Separate build tooling from runtime images without losing debuggability.",
                    "Multi-stage builds let you compile or package in one stage and copy only required runtime artifacts into the final image. The goal is not just smaller images; it is fewer packages, fewer vulnerabilities, faster pulls, clearer provenance, and less accidental state.",
                    "Practice comparing single-stage and multi-stage outputs with image history, file listings, package inventory, and rebuild cache behavior. Look for compilers, package managers, tests, credentials, and temporary files that should not reach runtime.",
                    "Convert a single-stage app Dockerfile into a two-stage build and write a short note explaining size, security, cache, and rollback impact.",
                ),
                (
                    "Tags, Digests, Registries, and Promotion",
                    "Promote exact image content through environments instead of relying on movable labels.",
                    "Tags are convenient names, but digests identify immutable content. A release process should preserve the exact artifact that passed tests and make it easy to answer what changed, who promoted it, and how to roll back.",
                    "Practice tracing an image from local build to registry to Kubernetes manifest. Compare tags, digests, OCI labels, registry retention, pull secrets, and environment promotion records.",
                    "Write an artifact promotion record that includes source commit, image digest, scan status, target environment, approver, deployment timestamp, and rollback digest.",
                ),
                (
                    "Image Scanning, SBOMs, and Runtime User",
                    "Treat image security findings as operational risk instead of dashboard noise.",
                    "Image security combines vulnerability scanning, software bill of materials, base image updates, non-root runtime, least privilege, and registry governance. The platform team should define which findings block release and which become tracked risk.",
                    "Practice reviewing a scan result and separating exploitable runtime risk from irrelevant build-only noise. Check USER, file ownership, writable paths, package inventory, and whether scanners can map findings to actual runtime components.",
                    "Create an image review checklist that a hiring manager could believe: severity policy, exception owner, SBOM location, runtime user, exposed ports, update cadence, and proof of promotion by digest.",
                ),
            ],
        ),
        platform_foundation_course(
            "platform-aws-operations-foundations",
            "AWS Operations Foundations for Platform Engineers",
            INTERMEDIATE_LEVEL,
            "AWS Operations",
            "Operate AWS-backed platforms through Well-Architected thinking, CloudWatch signals, VPC request paths, load balancer health, backups, and change safety.",
            [
                (
                    "AWS Operational Excellence and Ownership",
                    "Translate AWS service sprawl into owned, observable, reviewable operations.",
                    "Operational excellence means teams know who owns each workload, how changes are made, which signals matter, what risks are accepted, and how lessons improve the system. In AWS interviews, strong answers connect account structure, IAM, networking, telemetry, and recovery into one operating model.",
                    "Practice writing an ownership map for one service: account, region, VPC, load balancer, compute, database, DNS, alarms, runbook, deploy path, and escalation owner.",
                    "Create an AWS operations readiness review with owner, blast radius, backup expectation, alarm strategy, deployment path, and break-glass notes.",
                ),
                (
                    "CloudWatch Metrics, Logs, Alarms, and Dashboards",
                    "Use CloudWatch as a hypothesis tool, not a pile of disconnected alarms.",
                    "CloudWatch gives metrics, logs, alarms, dashboards, synthetics, application signals, and cross-account visibility. Good operators decide which signal confirms user impact, which signal explains a dependency, and which signal belongs in a ticket instead of a page.",
                    "Practice reviewing an alarm inventory for missing owners, no runbook, no datapoint window, noisy thresholds, duplicate cause alerts, and dashboards that cannot show user impact.",
                    "Design one dashboard for an ALB-backed EKS service that starts with request count, 5xx, latency, target health, pod readiness, deploy timestamp, and dependency saturation.",
                ),
                (
                    "VPC, Load Balancer, Route 53, and Health Paths",
                    "Debug cloud connectivity by tracing one request path end to end.",
                    "A request can fail at DNS, TLS, load balancer listener, target group health, security group, subnet route, node, Service, EndpointSlice, Pod readiness, or application dependency. AWS operations skill is knowing which layer produced the symptom.",
                    "Practice drawing Route 53 to ALB to target group to node or Pod IP to Kubernetes Service to Pod. Include security groups, subnets, route tables, NAT, and health check paths.",
                    "Given an unhealthy target group, produce a read-only investigation plan that checks AWS target health, ALB logs, security groups, Ingress events, EndpointSlices, and pod readiness.",
                ),
                (
                    "Reliability Reviews, Backups, and Change Safety",
                    "Protect AWS workloads with explicit recovery objectives and reversible changes.",
                    "Reliability is designed through failure isolation, quotas, scaling, backups, restore tests, deployment safety, and known rollback paths. Backups without restore drills are promises, not evidence.",
                    "Practice defining RTO, RPO, backup ownership, restore proof, single-AZ risk, quota headroom, deployment rollback, and a game-day scenario for one platform service.",
                    "Write a reliability review that explains what happens when one AZ fails, a bad deploy ships, a database restore is needed, or CloudWatch alarms become noisy.",
                ),
            ],
        ),
        platform_foundation_course(
            "platform-observability-telemetry-engineering",
            "Observability and Telemetry Engineering",
            ADVANCED_LEVEL,
            "Observability",
            "Design metrics, logs, traces, OpenTelemetry pipelines, Prometheus alerts, dashboards, and ownership rules that reduce incident time instead of creating telemetry noise.",
            [
                (
                    "Metrics, Logs, Traces, and OpenTelemetry Signals",
                    "Choose the right signal for the question under pressure.",
                    "Metrics show trends and alert conditions, logs explain discrete events, traces connect request hops, and OpenTelemetry provides a vendor-neutral model for producing and moving those signals. Interview-ready answers explain when each signal changes the next action.",
                    "Practice taking one latency incident and mapping which question is answered by RED metrics, which by logs, which by traces, and which by Kubernetes events.",
                    "Create a signal decision table for one service: user symptom, metric panel, log field, trace span, owner, retention, and cost risk.",
                ),
                (
                    "Instrumentation, Context Propagation, and Sampling",
                    "Make telemetry coherent across services without collecting everything forever.",
                    "Instrumentation must preserve context across service boundaries so a request can be followed. Sampling decides which traces to keep. Poor propagation, unbounded attributes, and inconsistent service names turn observability into expensive guesswork.",
                    "Practice reviewing instrumentation for service.name, environment, version, route, status, trace ID in logs, baggage boundaries, and attributes that could explode cardinality.",
                    "Write an instrumentation review for a checkout path that includes propagation, sampling, semantic attributes, logs correlation, and privacy redaction.",
                ),
                (
                    "Prometheus Alert Quality and Cardinality",
                    "Build alerts that are actionable and metrics that stay affordable.",
                    "Prometheus-style systems reward clear metric names and stable labels. Alerts should represent urgent, actionable conditions tied to user pain or imminent resource exhaustion. High-cardinality labels and cause-only pages make systems slower and responders tired.",
                    "Practice reviewing a PrometheusRule for `for` duration, severity labels, owner, runbook URL, grouping, inhibition, symptom-versus-cause, and labels that include user IDs or request IDs.",
                    "Rewrite one noisy alert into a better symptom alert with routing labels, runbook, threshold reasoning, and dashboard link.",
                ),
                (
                    "Dashboards, Runbooks, and Telemetry Operations",
                    "Operate telemetry as a production dependency with owners and budgets.",
                    "Dashboards should answer whether users are hurt, where the blast radius is, what changed, and which dependency is saturated. Telemetry platforms also need retention policy, access control, cost review, pipeline health, and incident runbooks.",
                    "Practice designing a dashboard hierarchy: executive symptom view, service drilldown, dependency view, Kubernetes capacity view, and deployment/change timeline.",
                    "Create an observability readiness artifact with dashboards, alert inventory, log fields, trace coverage, ownership, retention, and telemetry cost guardrails.",
                ),
            ],
        ),
        platform_foundation_course(
            "platform-incident-response-reliability",
            "Incident Response and Reliability Leadership",
            ADVANCED_LEVEL,
            "Incident Response",
            "Practice incident command, severity, mitigation, communications, timelines, postmortems, corrective actions, and game days for platform roles.",
            [
                (
                    "Incident Roles, Severity, and First Response",
                    "Declare incidents early and give responders clear roles before coordination fails.",
                    "Incident response is a social and technical system. Clear incident command, operations, communications, planning, severity, and decision logging prevent freelancing during stress. Strong responders separate user impact, mitigation, diagnosis, and long-term fix.",
                    "Practice receiving a page and writing the first five minutes: declare or not, severity, commander, comms channel, symptom, affected users, current mitigation, next update time.",
                    "Run a tabletop where one person is incident commander, one handles operations, one writes comms, and one maintains the timeline.",
                ),
                (
                    "Timeline, Communications, and Mitigation",
                    "Keep users and responders aligned while reducing blast radius.",
                    "During incidents, communication is part of mitigation. A timeline records what changed and when. Mitigation choices should stop the bleeding while preserving evidence and avoiding uncoordinated production changes.",
                    "Practice writing stakeholder updates that are honest about impact, action, uncertainty, next update time, and owner without dumping raw debugging details.",
                    "Produce a live incident document with status, impact, suspected trigger, actions taken, commands run, decisions, owners, and handoff notes.",
                ),
                (
                    "Postmortems and Corrective Actions",
                    "Turn painful failures into system improvements without blame.",
                    "A postmortem should explain impact, contributing factors, detection gaps, response behavior, mitigation, root causes, and corrective actions. The best actions reduce recurrence or impact; they are owned, dated, and reviewable.",
                    "Practice converting a vague action like 'be more careful' into specific work: add canary gate, tighten alert, fix dashboard, change runbook, add test, reduce timeout, improve rollback.",
                    "Write a postmortem summary that includes what went well, what made response harder, action owners, and how the platform will verify improvement.",
                ),
                (
                    "Game Days and Incident Readiness",
                    "Rehearse failure before the real outage writes the exam.",
                    "Game days test people, dashboards, runbooks, automation, and recovery assumptions. They should be scoped, safe, and measured. The goal is not theater; it is finding gaps while the stakes are lower.",
                    "Practice designing a game day for DNS failure, bad deploy, unavailable AZ, exhausted Pod IPs, or noisy alerts. Include abort criteria and customer-safety boundaries.",
                    "Create an incident readiness calendar with quarterly scenarios, owners, expected evidence, and improvement backlog review.",
                ),
            ],
        ),
        platform_foundation_course(
            "platform-finops-kubernetes-aws",
            "FinOps for Kubernetes and AWS Platforms",
            ADVANCED_LEVEL,
            "FinOps",
            "Learn cost visibility, ownership, right-sizing, Kubernetes waste, AWS EKS cost drivers, guardrails, and finance-friendly tradeoff communication.",
            [
                (
                    "Cost Visibility, Tags, and Ownership",
                    "Make cloud cost explainable before trying to optimize it.",
                    "FinOps starts with visibility and accountability: accounts, tags, labels, allocation rules, shared platform costs, owner reviews, and business context. A platform team needs to show not only spend, but why spend exists.",
                    "Practice building a cost ownership model that maps AWS account, cluster, namespace, service, owner, environment, team, and cost center.",
                    "Create a cost review artifact with top drivers, owner, trend, unit metric, avoidable waste, and reliability constraints.",
                ),
                (
                    "Kubernetes Requests, Waste, and Right-sizing",
                    "Reduce idle capacity without creating noisy neighbors or outages.",
                    "Kubernetes cost is shaped by requests, limits, node shape, autoscaling, bin packing, topology constraints, DaemonSets, and workload schedules. Right-sizing is a reliability decision as well as a finance decision.",
                    "Practice comparing requested CPU/memory with actual usage, restart history, throttling, OOMKilled events, HPA behavior, and PDB constraints.",
                    "Write a right-sizing recommendation that includes expected savings, risk, validation window, rollback plan, and owner approval.",
                ),
                (
                    "AWS Cost Drivers for EKS Platforms",
                    "Find the cloud bill surprises that hide outside worker nodes.",
                    "EKS platform costs include EC2 or Fargate compute, EBS, snapshots, load balancers, NAT Gateways, cross-AZ data, logs, metrics, traces, public IPs, support, and third-party tooling. The surprise is often network or observability, not Pods.",
                    "Practice building a cost driver map for one EKS service from request path to compute, network, storage, and telemetry usage.",
                    "Produce an EKS cost investigation note that ranks compute, storage, load balancer, NAT, data transfer, and telemetry hypotheses.",
                ),
                (
                    "FinOps Review Cadence and Guardrails",
                    "Make cost optimization a durable operating habit instead of a panic exercise.",
                    "FinOps works when teams have a regular review cadence, guardrails, budgets, anomaly detection, exception process, and a way to evaluate savings against reliability and delivery impact.",
                    "Practice writing cost guardrails: required tags, namespace quotas, idle resource reports, log retention tiers, load balancer review, budget alerts, and exception expiry.",
                    "Build a monthly platform FinOps review agenda with business context, technical recommendations, risks, owners, and follow-up evidence.",
                ),
            ],
        ),
        platform_foundation_course(
            "platform-career-job-search-sprint",
            "Platform Engineering Job Search Sprint",
            ADVANCED_LEVEL,
            "Career",
            "Turn learning into interview-ready proof: skill gap maps, portfolio narratives, resume bullets, recruiter screens, STAR stories, and a 30-day prep operating plan.",
            [
                (
                    "Skill Gap Map for Platform Roles",
                    "Prioritize learning by job descriptions instead of panic-scrolling tutorials.",
                    "A laid-off DevOps/SRE/cloud engineer needs ruthless focus. Most platform interviews cluster around Linux, networking, Kubernetes, AWS, Terraform, CI/CD, observability, incident response, security, and communication. A gap map turns that into a weekly plan.",
                    "Practice collecting five target job descriptions and scoring yourself across must-have skills, nice-to-have skills, evidence you already have, and labs you need to complete.",
                    "Create a gap map that chooses your next 10 study blocks and ties each block to one interview story or portfolio artifact.",
                ),
                (
                    "Portfolio Evidence and Project Narratives",
                    "Make hiring managers believe you can operate real systems.",
                    "Portfolio-grade proof is not a screenshot. It shows constraints, architecture, commands, decisions, validation, rollback, cost, security, and what you would improve next. The goal is credible judgment, not pretending a lab is production.",
                    "Practice turning a Platform Academy lab into a README section with problem, environment, commands, evidence, tradeoffs, diagram, and interview talking points.",
                    "Produce a proof pack with one Kubernetes debug story, one Terraform/AWS story, one CI/CD story, one incident story, and one platform-product story.",
                ),
                (
                    "Resume Bullets, Recruiter Screens, and STAR Stories",
                    "Translate engineering work into clear job-search signal.",
                    "Recruiters scan for keywords and scope. Hiring managers listen for judgment. Strong prep means having concise bullets and deeper STAR stories for the same work: situation, task, action, result, tradeoffs, and what you learned.",
                    "Practice rewriting vague resume lines into specific platform outcomes with action, technology, scale, risk, and result. Prepare recruiter answers for layoffs, gaps, compensation, relocation, and role fit.",
                    "Create a question bank of 12 STAR stories covering incidents, conflict, automation, cost, security, failed project, learning fast, and leading without authority.",
                ),
                (
                    "30-Day Interview Prep Operating Plan",
                    "Run job search like an incident response and learning system.",
                    "A strong 30-day plan balances applications, networking, daily drills, mock interviews, hands-on labs, resume iteration, rest, and feedback loops. Track leading indicators so the search does not become a fog.",
                    "Practice scheduling blocks for Kubernetes debugging, Terraform plan review, AWS/IAM, CI/CD design, SRE incidents, behavioral stories, and company-specific prep.",
                    "Build a 30-day tracker with target roles, study blocks, completed labs, mock results, applications, referrals, follow-ups, weak areas, and next actions.",
                ),
            ],
        ),
    ]
)


PLATFORM_LEVELS = [
    {
        "slug": "fresher",
        "title": FRESHER_LEVEL,
        "level_group": "Fresher",
        "audience": "New Kubernetes learners who need concepts, commands, and safe local practice before operating real clusters.",
        "course_slugs": [
            "platform-kubernetes-fundamentals",
            "platform-kubectl-debugging-basics",
            "platform-cloud-native-foundations",
            "platform-linux-command-line-foundations",
            "platform-networking-fundamentals",
            "platform-docker-image-supply-chain",
        ],
    },
    {
        "slug": "intermediate",
        "title": INTERMEDIATE_LEVEL,
        "level_group": INTERMEDIATE_LEVEL,
        "audience": "Engineers who can read manifests and now need EKS, Helm, and GitOps delivery judgment.",
        "course_slugs": [
            "platform-eks-operations",
            "platform-helm-application-delivery",
            "platform-argocd-gitops",
            "platform-terraform-aws-infrastructure",
            "platform-aws-iam-for-eks",
            "platform-aws-operations-foundations",
        ],
    },
    {
        "slug": "advanced",
        "title": ADVANCED_LEVEL,
        "level_group": ADVANCED_LEVEL,
        "audience": "Platform owners designing production EKS architecture, security boundaries, and reliability operations.",
        "course_slugs": [
            "platform-production-eks-architecture",
            "platform-kubernetes-security-multitenancy",
            "platform-sre-observability-kubernetes",
            "platform-cicd-release-engineering",
            "platform-engineering-product-operating-model",
            "platform-observability-telemetry-engineering",
            "platform-incident-response-reliability",
            "platform-finops-kubernetes-aws",
            "platform-career-job-search-sprint",
        ],
    },
]


PLATFORM_TRACKS = [
    {
        "slug": "kubernetes-fundamentals",
        "title": "Kubernetes Fundamentals Track",
        "role": "Fresher learner building the mental model for Pods, Services, and Deployments",
        "summary": "Start with the objects and signals that explain most Kubernetes behavior.",
        "course_slug": "platform-kubernetes-fundamentals",
        "level_group": "Fresher",
        "audience": "Learners new to Kubernetes.",
        "outcomes": [
            "Explain image, container, Pod, Deployment, ReplicaSet, and Service relationships.",
            "Trace labels and selectors from Service to ready Pods.",
            "Use probes, requests, ConfigMaps, and Secrets without confusing their roles.",
        ],
    },
    {
        "slug": "kubectl-debugging",
        "title": "kubectl Debugging Track",
        "role": "Fresher learner practicing safe first-response commands",
        "summary": "Build a repeatable read-only diagnosis loop before making changes.",
        "course_slug": "platform-kubectl-debugging-basics",
        "level_group": "Fresher",
        "audience": "Learners who know object names but need debugging fluency.",
        "outcomes": [
            "Use get, describe, logs, and events as the first response loop.",
            "Separate CrashLoopBackOff, ImagePullBackOff, Pending, and probe failures.",
            "Use exec and port-forward as diagnostics, not durable fixes.",
        ],
    },
    {
        "slug": "cloud-native-foundations",
        "title": "Cloud Native Foundations Track",
        "role": "Fresher learner connecting Docker, YAML, config, networking, and resources",
        "summary": "Learn the surrounding concepts that make Kubernetes manifests understandable.",
        "course_slug": "platform-cloud-native-foundations",
        "level_group": "Fresher",
        "audience": "Learners coming from app development or general cloud basics.",
        "outcomes": [
            "Explain tags, digests, registries, and artifact promotion.",
            "Read Kubernetes YAML and validate it with dry-run.",
            "Connect basic DNS, ports, requests, and memory failure signals.",
        ],
    },
    {
        "slug": "eks-operations",
        "title": "EKS Operations Track",
        "role": "Intermediate engineer operating AWS-backed Kubernetes clusters",
        "summary": "Handle VPC CNI, capacity, identity, add-ons, and ALB controller failure modes.",
        "course_slug": "platform-eks-operations",
        "level_group": INTERMEDIATE_LEVEL,
        "audience": "Engineers supporting EKS clusters or preparing for platform team interviews.",
        "outcomes": [
            "Diagnose CNI/IP exhaustion and subnet planning issues.",
            "Choose EC2, managed node groups, or Fargate based on workload fit.",
            "Review IRSA, add-on versions, and ALB controller events.",
        ],
    },
    {
        "slug": "helm-delivery",
        "title": "Helm Delivery Track",
        "role": "Intermediate engineer shipping repeatable Kubernetes releases",
        "summary": "Turn charts into reviewable release artifacts with lint, render, diff, and rollback discipline.",
        "course_slug": "platform-helm-application-delivery",
        "level_group": INTERMEDIATE_LEVEL,
        "audience": "Application and platform engineers maintaining Helm charts.",
        "outcomes": [
            "Treat chart values as a stable API.",
            "Render and validate dev, stage, and prod manifests before apply.",
            "Explain selector, CRD, hook, rollback, and supply-chain risks.",
        ],
    },
    {
        "slug": "argocd-gitops",
        "title": "ArgoCD GitOps Track",
        "role": "Intermediate engineer operating Git-based deployment workflows",
        "summary": "Use Applications, Projects, sync policy, drift review, secrets, and promotion safely.",
        "course_slug": "platform-argocd-gitops",
        "level_group": INTERMEDIATE_LEVEL,
        "audience": "Engineers adopting GitOps or maintaining ArgoCD for teams.",
        "outcomes": [
            "Explain desired vs live state and Application health.",
            "Design AppProject boundaries and app-of-apps bootstrap paths.",
            "Handle pruning, self-heal, ignoreDifferences, secrets, and rollback reality.",
        ],
    },
    {
        "slug": "production-eks",
        "title": "Production EKS Architecture Track",
        "role": "Advanced platform owner designing resilient EKS systems",
        "summary": "Make private access, Karpenter, multi-AZ, cost, and upgrade decisions explicit.",
        "course_slug": "platform-production-eks-architecture",
        "level_group": ADVANCED_LEVEL,
        "audience": "Senior engineers designing or reviewing production EKS platforms.",
        "outcomes": [
            "Defend endpoint access, private node, and break-glass choices.",
            "Constrain Karpenter and capacity policies with cost and disruption guardrails.",
            "Plan multi-AZ behavior and cluster upgrades before failures expose gaps.",
        ],
    },
    {
        "slug": "security-multitenancy",
        "title": "Security and Multi-tenancy Track",
        "role": "Advanced platform owner setting tenant guardrails",
        "summary": "Design RBAC, network policy, admission, pod security, and secret boundaries for shared clusters.",
        "course_slug": "platform-kubernetes-security-multitenancy",
        "level_group": ADVANCED_LEVEL,
        "audience": "Engineers responsible for shared cluster safety and tenant isolation.",
        "outcomes": [
            "Design least-privilege RBAC and test it with can-i.",
            "Roll out network policy and admission guardrails without breaking tenants.",
            "Build a secrets strategy with rotation and blast-radius control.",
        ],
    },
    {
        "slug": "sre-observability",
        "title": "SRE and Observability Track",
        "role": "Advanced operator turning incidents into better reliability systems",
        "summary": "Build metrics, dashboards, alerts, SLOs, logs, traces, and runbooks around user impact.",
        "course_slug": "platform-sre-observability-kubernetes",
        "level_group": ADVANCED_LEVEL,
        "audience": "Engineers moving from component monitoring to reliability leadership.",
        "outcomes": [
            "Separate RED user symptoms from USE resource causes.",
            "Design burn-rate alerts that reduce alert fatigue.",
            "Write incident runbooks with safe diagnostics and post-incident learning.",
        ],
    },
]

PLATFORM_TRACKS.extend(
    [
        {
            "slug": "linux-command-line-foundations",
            "title": "Linux Command Line Track",
            "role": "Fresher learner becoming comfortable inside servers, containers, and CI runners",
            "summary": "Build shell and Linux fluency so Kubernetes debugging commands make sense instead of feeling magical.",
            "course_slug": "platform-linux-command-line-foundations",
            "level_group": "Fresher",
            "audience": "Learners starting from zero or coming from non-Linux backgrounds.",
            "outcomes": [
                "Inspect files, logs, processes, permissions, and text output safely.",
                "Connect Linux process failure signals to Kubernetes Pod states.",
                "Create repeatable evidence-gathering command notes for incidents.",
            ],
        },
        {
            "slug": "networking-fundamentals",
            "title": "Networking Foundations Track",
            "role": "Fresher learner building the packet, DNS, HTTP, and firewall mental model",
            "summary": "Understand connectivity before debugging Services, Ingress, ALBs, NetworkPolicies, and timeouts.",
            "course_slug": "platform-networking-fundamentals",
            "level_group": "Fresher",
            "audience": "Learners who need practical networking for cloud-native operations.",
            "outcomes": [
                "Trace requests across IPs, ports, DNS names, Services, and Ingress.",
                "Classify DNS, TLS, timeout, 502, and 503 failures by likely owner.",
                "Design minimal allowed network paths with testable assumptions.",
            ],
        },
        {
            "slug": "terraform-aws-infrastructure",
            "title": "Terraform AWS Infrastructure Track",
            "role": "Intermediate engineer making EKS and AWS infrastructure reproducible",
            "summary": "Use Terraform state, modules, plans, and reviews to ship platform infrastructure safely.",
            "course_slug": "platform-terraform-aws-infrastructure",
            "level_group": INTERMEDIATE_LEVEL,
            "audience": "Engineers moving from kubectl changes to reproducible AWS platform ownership.",
            "outcomes": [
                "Read Terraform plans for security, reliability, replacement, and cost risk.",
                "Structure modules and environment promotion without copy-paste drift.",
                "Connect EKS behavior back to Terraform-owned VPC, IAM, and node resources.",
            ],
        },
        {
            "slug": "aws-iam-for-eks",
            "title": "AWS IAM for EKS Track",
            "role": "Intermediate operator securing AWS access for controllers, workloads, and automation",
            "summary": "Learn IAM evaluation, trust policies, STS, IRSA, Pod Identity, and least-privilege reviews.",
            "course_slug": "platform-aws-iam-for-eks",
            "level_group": INTERMEDIATE_LEVEL,
            "audience": "Engineers responsible for secure workload and controller AWS permissions.",
            "outcomes": [
                "Explain allow, explicit deny, conditions, boundaries, SCPs, and resource policies.",
                "Trace AssumeRole and IRSA failures from Kubernetes service account to AWS CloudTrail.",
                "Review powerful controller policies before production installation.",
            ],
        },
        {
            "slug": "cicd-release-engineering",
            "title": "CI/CD Release Engineering Track",
            "role": "Advanced engineer designing safe pipelines and production release controls",
            "summary": "Build artifact promotion, quality gates, progressive delivery, rollback, and pipeline security habits.",
            "course_slug": "platform-cicd-release-engineering",
            "level_group": ADVANCED_LEVEL,
            "audience": "Engineers accountable for shipping changes quickly without sacrificing reliability.",
            "outcomes": [
                "Design quality gates across tests, image scans, rendered manifests, smoke checks, and SLO signals.",
                "Promote immutable artifacts with signatures, SBOMs, and digest-based rollbacks.",
                "Threat-model CI/CD systems as production control planes.",
            ],
        },
        {
            "slug": "platform-engineering-operating-model",
            "title": "Platform Engineering Operating Model Track",
            "role": "Advanced platform owner building golden paths and measurable internal developer experience",
            "summary": "Turn platform technology into a product with ownership, readiness, self-service APIs, and outcome metrics.",
            "course_slug": "platform-engineering-product-operating-model",
            "level_group": ADVANCED_LEVEL,
            "audience": "Senior engineers shaping platform strategy, adoption, and operational standards.",
            "outcomes": [
                "Design golden paths that make secure, observable service delivery easy.",
                "Define service ownership and production-readiness expectations before launch.",
                "Measure platform success through reliability, cost, speed, security, and developer experience metrics.",
            ],
        },
    ]
)

PLATFORM_TRACKS.extend(
    [
        {
            "slug": "docker-image-supply-chain",
            "title": "Docker Image Supply Chain Track",
            "role": "Fresher learner turning Dockerfiles into production-grade artifacts",
            "summary": "Build smaller, safer, traceable images and promote exact digests through environments.",
            "course_slug": "platform-docker-image-supply-chain",
            "level_group": "Fresher",
            "audience": "Learners who need container image judgment before Kubernetes releases.",
            "outcomes": [
                "Review Dockerfiles for base image, user, entrypoint, build context, and runtime contract risk.",
                "Use multi-stage builds to keep build tools out of runtime images.",
                "Explain tag, digest, registry, scan, SBOM, and artifact promotion tradeoffs.",
            ],
        },
        {
            "slug": "aws-operations-foundations",
            "title": "AWS Operations Foundations Track",
            "role": "Intermediate engineer debugging AWS-backed service paths and operational readiness",
            "summary": "Connect Well-Architected thinking, CloudWatch, VPCs, load balancers, Route 53, reliability, and backups.",
            "course_slug": "platform-aws-operations-foundations",
            "level_group": INTERMEDIATE_LEVEL,
            "audience": "Cloud and platform engineers who need AWS operational interview fluency.",
            "outcomes": [
                "Create an AWS ownership and readiness review for one production-facing service.",
                "Design CloudWatch dashboards and alarms that start from user impact.",
                "Trace request failures across DNS, ALB, target groups, security groups, subnets, Services, and Pods.",
            ],
        },
        {
            "slug": "observability-telemetry-engineering",
            "title": "Observability Telemetry Engineering Track",
            "role": "Advanced engineer designing telemetry systems that reduce incident time",
            "summary": "Use OpenTelemetry, Prometheus, logs, traces, dashboards, and alert quality rules with cost and ownership in mind.",
            "course_slug": "platform-observability-telemetry-engineering",
            "level_group": ADVANCED_LEVEL,
            "audience": "Engineers preparing for SRE and platform observability design interviews.",
            "outcomes": [
                "Choose metrics, logs, traces, and events based on the question being answered.",
                "Review instrumentation for propagation, sampling, semantic attributes, redaction, and cardinality.",
                "Improve alerts and dashboards so responders can confirm impact and act quickly.",
            ],
        },
        {
            "slug": "incident-response-reliability",
            "title": "Incident Response Reliability Track",
            "role": "Advanced responder practicing incident command and post-incident improvement",
            "summary": "Build incident command, comms, timeline, mitigation, postmortem, corrective-action, and game-day habits.",
            "course_slug": "platform-incident-response-reliability",
            "level_group": ADVANCED_LEVEL,
            "audience": "SRE, DevOps, and platform engineers who need to sound calm and credible in incident interviews.",
            "outcomes": [
                "Declare and structure incidents with clear commander, ops, comms, planning, severity, and update cadence.",
                "Write useful incident timelines, stakeholder updates, mitigation notes, and handoffs.",
                "Turn postmortem findings into owned, dated corrective actions and rehearsed game days.",
            ],
        },
        {
            "slug": "finops-kubernetes-aws",
            "title": "FinOps Kubernetes and AWS Track",
            "role": "Advanced platform owner reducing waste without damaging reliability",
            "summary": "Map cost ownership, Kubernetes requests, AWS EKS cost drivers, guardrails, and review cadence.",
            "course_slug": "platform-finops-kubernetes-aws",
            "level_group": ADVANCED_LEVEL,
            "audience": "Engineers who need cloud cost stories with technical and business credibility.",
            "outcomes": [
                "Map AWS and Kubernetes spend to service owners, environments, labels, tags, and shared platform costs.",
                "Write right-sizing recommendations with validation windows, rollback plans, and reliability risk.",
                "Explain EKS cost drivers beyond nodes: NAT, load balancers, storage, telemetry, transfer, and tooling.",
            ],
        },
        {
            "slug": "career-job-search-sprint",
            "title": "Platform Job Search Sprint Track",
            "role": "Laid-off or job-searching DevOps/SRE/cloud engineer turning practice into interview proof",
            "summary": "Build skill gap maps, proof packs, resume bullets, STAR stories, and a 30-day prep plan.",
            "course_slug": "platform-career-job-search-sprint",
            "level_group": ADVANCED_LEVEL,
            "audience": "Engineers who need to convert learning into interviews, confidence, and credible job-search artifacts fast.",
            "outcomes": [
                "Prioritize study from real platform job descriptions instead of tutorial drift.",
                "Turn labs into portfolio proof with commands, evidence, tradeoffs, diagrams, and rollback thinking.",
                "Prepare recruiter answers and STAR stories across incidents, automation, cost, security, and leadership.",
            ],
        },
    ]
)


PLATFORM_ROADMAP = [
    {
        "sequence": 1,
        "title": "Kubernetes Object Mental Model",
        "role": "You can explain how images, Pods, Deployments, Services, labels, and probes fit together.",
        "focus": "Fresher fundamentals before production debugging.",
        "level_group": "Fresher",
        "course_slugs": ["platform-kubernetes-fundamentals"],
        "checkpoints": [
            "Trace a Deployment to ReplicaSet to Pod.",
            "Find why a Service has no ready endpoints.",
            "Explain readiness, liveness, requests, ConfigMaps, and Secrets.",
        ],
    },
    {
        "sequence": 2,
        "title": "kubectl First Responder",
        "role": "You can collect evidence for common Pod failures without guessing.",
        "focus": "Read-only debugging with describe, logs, events, exec, and port-forward.",
        "level_group": "Fresher",
        "course_slugs": ["platform-kubectl-debugging-basics"],
        "checkpoints": [
            "Capture previous logs for CrashLoopBackOff.",
            "Separate ImagePullBackOff from application crashes.",
            "Read scheduler events for Pending Pods.",
        ],
    },
    {
        "sequence": 3,
        "title": "Cloud Native Base Layer",
        "role": "You can reason about images, YAML, config, networking, and resource requests.",
        "focus": "Docker, registries, manifests, dry-runs, environment promotion, DNS, and capacity basics.",
        "level_group": "Fresher",
        "course_slugs": ["platform-cloud-native-foundations"],
        "checkpoints": [
            "Compare image tags and digests.",
            "Validate a manifest with dry-run.",
            "Explain service DNS and memory failure signals.",
        ],
    },
    {
        "sequence": 4,
        "title": "EKS Operator",
        "role": "You can inspect the AWS-specific parts of an EKS cluster safely.",
        "focus": "VPC CNI, node options, IRSA, add-ons, and ALB controller operations.",
        "level_group": INTERMEDIATE_LEVEL,
        "course_slugs": ["platform-eks-operations"],
        "checkpoints": [
            "Diagnose CNI IP allocation failures.",
            "Compare managed node groups, Fargate, and EC2 workload fit.",
            "Review an IRSA trust policy and ALB controller events.",
        ],
    },
    {
        "sequence": 5,
        "title": "Helm Release Builder",
        "role": "You can ship Kubernetes changes through reviewable rendered artifacts.",
        "focus": "Chart APIs, values layering, lint/template/diff, upgrade safety, rollbacks, CRDs, and supply chain.",
        "level_group": INTERMEDIATE_LEVEL,
        "course_slugs": ["platform-helm-application-delivery"],
        "checkpoints": [
            "Render dev, stage, and prod values.",
            "Detect selector drift before upgrade.",
            "Inspect third-party charts for RBAC and privileged settings.",
        ],
    },
    {
        "sequence": 6,
        "title": "GitOps Operator",
        "role": "You can run ArgoCD without hiding drift or over-granting teams.",
        "focus": "Applications, AppProjects, app-of-apps, sync waves, prune, self-heal, secrets, environments, and rollback.",
        "level_group": INTERMEDIATE_LEVEL,
        "course_slugs": ["platform-argocd-gitops"],
        "checkpoints": [
            "Explain desired state vs live state.",
            "Design AppProject boundaries for tenants.",
            "Handle HPA drift and rollback through Git.",
        ],
    },
    {
        "sequence": 7,
        "title": "Production EKS Architect",
        "role": "You can defend cluster architecture choices before production traffic exposes them.",
        "focus": "Private endpoint access, break-glass paths, Karpenter, multi-AZ design, cost guardrails, and upgrades.",
        "level_group": ADVANCED_LEVEL,
        "course_slugs": ["platform-production-eks-architecture"],
        "checkpoints": [
            "Design private endpoint access for operators and CI.",
            "Constrain Karpenter NodePools.",
            "Plan a cluster upgrade with deprecated API inventory.",
        ],
    },
    {
        "sequence": 8,
        "title": "Shared Cluster Security Owner",
        "role": "You can build tenant guardrails that reduce blast radius without blocking delivery.",
        "focus": "RBAC, network policy, Pod Security Standards, admission, secrets, and tenant boundaries.",
        "level_group": ADVANCED_LEVEL,
        "course_slugs": ["platform-kubernetes-security-multitenancy"],
        "checkpoints": [
            "Use kubectl auth can-i to test least privilege.",
            "Roll out default-deny network policy with DNS allowances.",
            "Design a secret rotation and exception process.",
        ],
    },
    {
        "sequence": 9,
        "title": "Kubernetes Reliability Lead",
        "role": "You can turn observability and incidents into better engineering systems.",
        "focus": "RED/USE, Prometheus/Grafana, logs, traces, SLOs, burn rates, alert routing, and runbooks.",
        "level_group": ADVANCED_LEVEL,
        "course_slugs": ["platform-sre-observability-kubernetes"],
        "checkpoints": [
            "Build a dashboard starting with user impact.",
            "Write a burn-rate alert that pages at the right urgency.",
            "Create a runbook with mitigation and post-incident follow-up.",
        ],
    },
]

PLATFORM_ROADMAP.extend(
    [
        {
            "sequence": 10,
            "title": "Linux Operator Foundations",
            "role": "You can inspect servers, containers, logs, processes, permissions, and text output without panic.",
            "focus": "Shell fluency for every later Kubernetes and CI/CD troubleshooting workflow.",
            "level_group": "Fresher",
            "course_slugs": ["platform-linux-command-line-foundations"],
            "checkpoints": [
                "Find relevant files and logs in a project or container filesystem.",
                "Explain process exit codes and permission failures.",
                "Build a short text pipeline that extracts incident evidence.",
            ],
        },
        {
            "sequence": 11,
            "title": "Networking Mental Model",
            "role": "You can locate failures across DNS, ports, TLS, HTTP, Ingress, Services, and policies.",
            "focus": "Practical packet-path reasoning before cloud load balancers and service meshes.",
            "level_group": "Fresher",
            "course_slugs": ["platform-networking-fundamentals"],
            "checkpoints": [
                "Draw browser to ALB to Ingress to Service to Pod traffic.",
                "Classify timeout, 502, 503, TLS, and DNS symptoms.",
                "Design a minimal allowlist for a three-tier service.",
            ],
        },
        {
            "sequence": 12,
            "title": "Terraform AWS Platform Builder",
            "role": "You can review and evolve EKS infrastructure through reproducible Terraform changes.",
            "focus": "State, modules, plans, VPC, EKS, environment promotion, drift, and safe applies.",
            "level_group": INTERMEDIATE_LEVEL,
            "course_slugs": ["platform-terraform-aws-infrastructure"],
            "checkpoints": [
                "Identify risky replacements and IAM changes in a Terraform plan.",
                "Explain backend, state locking, modules, variables, and outputs.",
                "Trace an EKS networking or node issue back to Terraform-owned AWS resources.",
            ],
        },
        {
            "sequence": 13,
            "title": "AWS IAM and EKS Identity",
            "role": "You can debug and review AWS permissions for humans, CI/CD, controllers, and Pods.",
            "focus": "Policy evaluation, AssumeRole, trust policies, IRSA, Pod Identity, and least privilege.",
            "level_group": INTERMEDIATE_LEVEL,
            "course_slugs": ["platform-aws-iam-for-eks"],
            "checkpoints": [
                "Trace AccessDenied from principal to policy statement and condition.",
                "Validate an IRSA or Pod Identity setup end to end.",
                "Review controller permissions for blast radius before install.",
            ],
        },
        {
            "sequence": 14,
            "title": "Release Engineering Lead",
            "role": "You can design CI/CD systems that promote trusted artifacts and protect production.",
            "focus": "Quality gates, supply chain, progressive delivery, rollback, and pipeline security.",
            "level_group": ADVANCED_LEVEL,
            "course_slugs": ["platform-cicd-release-engineering"],
            "checkpoints": [
                "Define a pipeline with blocking gates and post-deploy smoke checks.",
                "Promote image digests with scan, signature, and SBOM evidence.",
                "Write canary and rollback rules tied to user-impact signals.",
            ],
        },
        {
            "sequence": 15,
            "title": "Platform Product Owner",
            "role": "You can turn platform capabilities into golden paths that teams adopt and trust.",
            "focus": "Developer experience, service ownership, production readiness, platform APIs, cost, and adoption metrics.",
            "level_group": ADVANCED_LEVEL,
            "course_slugs": ["platform-engineering-product-operating-model"],
            "checkpoints": [
                "Design a new-service golden path with Terraform, Helm, ArgoCD, observability, and docs.",
                "Define ownership and production readiness for a service before launch.",
                "Measure platform value with reliability, cost, delivery, security, and developer-experience KPIs.",
            ],
        },
    ]
)

PLATFORM_ROADMAP.extend(
    [
        {
            "sequence": 16,
            "title": "Docker Image Operator",
            "role": "You can review Dockerfiles, build runtime images, and promote immutable artifacts safely.",
            "focus": "Dockerfiles, multi-stage builds, tags, digests, registries, scans, SBOMs, and runtime users.",
            "level_group": "Fresher",
            "course_slugs": ["platform-docker-image-supply-chain"],
            "checkpoints": [
                "Review a Dockerfile for runtime contract and root-user risk.",
                "Explain why multi-stage builds reduce operational and security risk.",
                "Promote an image by digest with scan, SBOM, and rollback evidence.",
            ],
        },
        {
            "sequence": 17,
            "title": "AWS Operations Operator",
            "role": "You can trace AWS service failures from user symptom through cloud and Kubernetes signals.",
            "focus": "CloudWatch, Well-Architected operations, VPC paths, Route 53, ALB health, backups, and change safety.",
            "level_group": INTERMEDIATE_LEVEL,
            "course_slugs": ["platform-aws-operations-foundations"],
            "checkpoints": [
                "Build an AWS service ownership and readiness review.",
                "Design a CloudWatch dashboard that starts with user impact.",
                "Debug unhealthy ALB targets across AWS and Kubernetes evidence.",
            ],
        },
        {
            "sequence": 18,
            "title": "Observability Telemetry Engineer",
            "role": "You can design telemetry that helps responders act instead of merely storing more data.",
            "focus": "OpenTelemetry signals, context propagation, sampling, Prometheus alerts, cardinality, dashboards, and telemetry operations.",
            "level_group": ADVANCED_LEVEL,
            "course_slugs": ["platform-observability-telemetry-engineering"],
            "checkpoints": [
                "Choose metrics, logs, traces, and events for one latency incident.",
                "Review instrumentation for propagation, sampling, labels, and privacy.",
                "Rewrite a noisy alert into an actionable symptom alert.",
            ],
        },
        {
            "sequence": 19,
            "title": "Incident Response Lead",
            "role": "You can coordinate incidents, communicate clearly, mitigate safely, and turn failures into improvements.",
            "focus": "Incident command, severity, timelines, comms, mitigation, postmortems, corrective actions, and game days.",
            "level_group": ADVANCED_LEVEL,
            "course_slugs": ["platform-incident-response-reliability"],
            "checkpoints": [
                "Run the first five minutes of an incident with clear roles and update cadence.",
                "Write stakeholder and technical updates from the same incident state.",
                "Convert postmortem findings into owned, dated, verifiable corrective actions.",
            ],
        },
        {
            "sequence": 20,
            "title": "FinOps Platform Steward",
            "role": "You can reduce AWS and Kubernetes waste while protecting reliability and team trust.",
            "focus": "Cost ownership, tags and labels, Kubernetes requests, EKS cost drivers, right-sizing, guardrails, and review cadence.",
            "level_group": ADVANCED_LEVEL,
            "course_slugs": ["platform-finops-kubernetes-aws"],
            "checkpoints": [
                "Map EKS service spend across compute, network, storage, load balancing, and telemetry.",
                "Write a right-sizing recommendation with validation and rollback.",
                "Run a monthly FinOps review with owners, risks, and follow-up evidence.",
            ],
        },
        {
            "sequence": 21,
            "title": "Platform Career Sprint",
            "role": "You can convert platform study into interview stories, portfolio evidence, and a focused 30-day search plan.",
            "focus": "Skill gap mapping, proof packs, resume bullets, recruiter screens, STAR stories, mock interviews, and job-search metrics.",
            "level_group": ADVANCED_LEVEL,
            "course_slugs": ["platform-career-job-search-sprint"],
            "checkpoints": [
                "Score five job descriptions against your current evidence and gaps.",
                "Turn labs into README-ready proof with commands, evidence, and tradeoffs.",
                "Prepare STAR stories for incidents, automation, cost, security, and leadership.",
            ],
        },
    ]
)


_PLATFORM_ROADMAP_SEQUENCE = {
    "Linux Operator Foundations": 1,
    "Networking Mental Model": 2,
    "Kubernetes Object Mental Model": 3,
    "kubectl First Responder": 4,
    "Cloud Native Base Layer": 5,
    "Docker Image Operator": 6,
    "EKS Operator": 7,
    "Helm Release Builder": 8,
    "GitOps Operator": 9,
    "Terraform AWS Platform Builder": 10,
    "AWS IAM and EKS Identity": 11,
    "AWS Operations Operator": 12,
    "Production EKS Architect": 13,
    "Shared Cluster Security Owner": 14,
    "Kubernetes Reliability Lead": 15,
    "Observability Telemetry Engineer": 16,
    "Release Engineering Lead": 17,
    "Incident Response Lead": 18,
    "FinOps Platform Steward": 19,
    "Platform Product Owner": 20,
    "Platform Career Sprint": 21,
}
for stage in PLATFORM_ROADMAP:
    stage["sequence"] = _PLATFORM_ROADMAP_SEQUENCE[stage["title"]]
PLATFORM_ROADMAP.sort(key=lambda stage: stage["sequence"])


PLATFORM_LABS = [
    {
        "slug": "trace-service-to-pod",
        "title": "Trace Service traffic to ready Pods",
        "track": "Kubernetes",
        "difficulty": FRESHER_LEVEL,
        "level_group": "Fresher",
        "estimated_minutes": 30,
        "course_slug": "platform-kubernetes-fundamentals",
        "lesson_title": "Services, Labels, Selectors, and Namespaces",
        "scenario": "A Service exists but traffic returns 503 because labels and readiness do not line up.",
        "skills": ["service selectors", "EndpointSlices", "labels", "readiness", "namespace scope"],
        "prerequisites": [
            "A local Kubernetes cluster such as kind, minikube, Docker Desktop Kubernetes, or an approved sandbox cluster.",
            "kubectl configured to the local/sandbox context.",
            "Run commands from the repository root so the lab manifest paths resolve.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md",
            "bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --cluster",
            "kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml",
            "kubectl wait --for=condition=available deploy/checkout -n payments --timeout=90s",
            "kubectl get svc,pods,endpointslice -n payments",
        ],
        "commands": [
            "kubectl describe svc checkout -n payments",
            "kubectl get pods -n payments --show-labels",
            "kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout",
        ],
        "practice_steps": [
            "Read the Service selector and write down the label key/value it expects.",
            "Compare that selector with the labels on the checkout Pods.",
            "Confirm whether EndpointSlices have ready backend addresses.",
            "Apply the fixed manifest only after you can explain why the starting manifest fails.",
        ],
        "expected_evidence": [
            "The Service selector starts as app=checkout.",
            "The checkout Pods are labeled app=checkout-api.",
            "EndpointSlice output has no ready checkout backend addresses until the selector is fixed.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/trace-service-to-pod/validate.sh",
            "bash labs/platform-academy/trace-service-to-pod/validate.sh --evidence /tmp/trace-service-evidence.md",
            "kubectl apply -f labs/platform-academy/trace-service-to-pod/fixed.yaml",
            "kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide",
            "kubectl get pods -n payments -l app=checkout-api --show-labels",
        ],
        "cleanup_commands": ["bash labs/platform-academy/trace-service-to-pod/cleanup.sh"],
        "no_cluster_fallback": [
            "Run bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md to copy the evidence template and print the captured transcript.",
            "Open labs/platform-academy/trace-service-to-pod/start.yaml and compare the Service selector with the Deployment Pod template labels.",
            "Write the one-line YAML change needed to make the Service select the running Pods.",
        ],
        "checklist": [
            "Read the Service selector.",
            "Compare selector keys with current Pod labels.",
            "Confirm EndpointSlices contain ready Pod IPs.",
            "Fix source manifests rather than only live objects.",
        ],
    },
    {
        "slug": "debug-crashloop-imagepull",
        "title": "Separate CrashLoopBackOff from ImagePullBackOff",
        "track": "kubectl",
        "difficulty": FRESHER_LEVEL,
        "level_group": "Fresher",
        "estimated_minutes": 35,
        "course_slug": "platform-kubectl-debugging-basics",
        "lesson_title": "CrashLoopBackOff and ImagePullBackOff",
        "scenario": "A rollout produced failing Pods, and you need to determine whether the image cannot pull or the app crashes after start.",
        "skills": ["describe", "previous logs", "events", "image pull secrets", "exit codes"],
        "prerequisites": [
            "A local Kubernetes cluster such as kind, minikube, Docker Desktop Kubernetes, or an approved sandbox cluster.",
            "kubectl configured to the local/sandbox context.",
            "Network access for pulling busybox and nginx images, or preloaded images in the cluster.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md",
            "bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --cluster",
            "kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/start.yaml",
            "kubectl get pods -n payments-debug",
        ],
        "commands": [
            "kubectl describe pods -n payments-debug -l app=checkout-crash",
            "kubectl logs -n payments-debug -l app=checkout-crash --previous",
            "kubectl describe pods -n payments-debug -l app=checkout-pull",
            "kubectl get events -n payments-debug --sort-by=.lastTimestamp",
        ],
        "practice_steps": [
            "Use describe output to identify which Pod started and then exited.",
            "Use previous logs only for the container that actually started.",
            "Use events to identify the Pod that never started because the image could not be pulled.",
            "State which fix belongs to app/config and which fix belongs to image registry or manifest ownership.",
        ],
        "expected_evidence": [
            "The checkout-crash Pod reaches CrashLoopBackOff and has previous logs that say missing DB_URL.",
            "The checkout-pull Pod reaches ErrImagePull or ImagePullBackOff and has image pull events.",
            "Previous logs are useful for CrashLoopBackOff but not for a container that never pulled.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/debug-crashloop-imagepull/validate.sh",
            "bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --evidence /tmp/crashloop-imagepull-evidence.md",
            "kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/fixed.yaml",
            "kubectl rollout status deploy/checkout-crash -n payments-debug --timeout=90s",
            "kubectl rollout status deploy/checkout-pull -n payments-debug --timeout=90s",
            "kubectl get pods -n payments-debug",
        ],
        "cleanup_commands": ["bash labs/platform-academy/debug-crashloop-imagepull/cleanup.sh"],
        "no_cluster_fallback": [
            "Run bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md to copy the evidence template and print the captured transcript.",
            "Open labs/platform-academy/debug-crashloop-imagepull/start.yaml and identify which Deployment can start and which one cannot pull an image.",
            "Write the first command you would run for each symptom and what signal you expect from it.",
        ],
        "checklist": [
            "Identify the exact Pod phase and event reason.",
            "Use previous logs only for containers that started and crashed.",
            "Inspect image reference and pull secret for registry failures.",
            "Choose config fix, image fix, or rollback based on evidence.",
        ],
    },
    {
        "slug": "review-yaml-before-apply",
        "title": "Review Kubernetes YAML before apply",
        "track": "Cloud Native",
        "difficulty": FRESHER_LEVEL,
        "level_group": "Fresher",
        "estimated_minutes": 30,
        "course_slug": "platform-cloud-native-foundations",
        "lesson_title": "YAML, Manifests, and kubectl Dry Runs",
        "scenario": "A vendor manifest needs review before it reaches any cluster.",
        "skills": ["manifest reading", "dry-run", "resource scope", "security search", "namespace review"],
        "prerequisites": [
            "kubectl installed locally for client-side dry-run, or the ability to inspect YAML with grep.",
            "Run commands from the repository root so lab file paths resolve.",
            "Do not apply the vendor manifest to a shared or production cluster.",
        ],
        "setup_commands": [
            "ls labs/platform-academy/review-yaml-before-apply",
            "sed -n '1,220p' labs/platform-academy/review-yaml-before-apply/vendor.yaml",
        ],
        "commands": [
            "kubectl apply --dry-run=client --validate=false -f labs/platform-academy/review-yaml-before-apply/vendor.yaml",
            "grep -n \"kind:\\|namespace:\\|ClusterRole\\|privileged\\|hostPath\" labs/platform-academy/review-yaml-before-apply/vendor.yaml",
            "kubectl explain deployment.spec.template.spec.containers",
        ],
        "practice_steps": [
            "List every resource kind and whether it is namespace-scoped or cluster-scoped.",
            "Find the risky settings before reading the safe baseline.",
            "Compare vendor.yaml with safe-baseline.yaml and write the review questions you would send back.",
            "Decide whether this manifest is blocked, approved with changes, or safe for a sandbox only.",
        ],
        "expected_evidence": [
            "The vendor manifest contains a ClusterRole that can list/watch secrets.",
            "The Deployment asks for privileged mode and a hostPath mount.",
            "The Secret contains placeholder stringData that should not be committed with real credentials.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/review-yaml-before-apply/validate.sh",
            "bash labs/platform-academy/review-yaml-before-apply/validate.sh --evidence /tmp/yaml-review-evidence.md",
            "grep -n \"ClusterRole\\|privileged\\|hostPath\\|stringData\" labs/platform-academy/review-yaml-before-apply/vendor.yaml",
            "grep -n \"allowPrivilegeEscalation\\|readOnlyRootFilesystem\" labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml",
        ],
        "cleanup_commands": ["bash labs/platform-academy/review-yaml-before-apply/cleanup.sh"],
        "no_cluster_fallback": [
            "Run the grep commands and manually review the YAML without kubectl.",
            "Create a review note with resource kinds, namespaces, risky fields, and questions for the vendor.",
        ],
        "checklist": [
            "List every resource kind and namespace.",
            "Find cluster-scoped permissions and risky Pod settings.",
            "Run client dry-run or schema validation.",
            "Record questions before approving the manifest.",
        ],
    },
    {
        "slug": "diagnose-eks-ip-exhaustion",
        "title": "Diagnose EKS Pod IP exhaustion",
        "track": "EKS",
        "difficulty": INTERMEDIATE_LEVEL,
        "level_group": INTERMEDIATE_LEVEL,
        "estimated_minutes": 45,
        "course_slug": "platform-eks-operations",
        "lesson_title": "VPC CNI and IP Exhaustion",
        "scenario": "New Pods remain Pending during scale-out and events mention CNI allocation failures.",
        "skills": ["VPC CNI", "subnet sizing", "aws-node logs", "scheduler events", "prefix delegation"],
        "commands": [
            "kubectl describe pod pending-pod -n payments",
            "kubectl -n kube-system logs ds/aws-node -c aws-node --since=15m",
            "kubectl get nodes -o wide",
        ],
        "checklist": [
            "Separate CPU/memory scheduling failure from CNI IP allocation failure.",
            "Read aws-node logs for allocation errors.",
            "Compare subnet capacity with expected Pod growth.",
            "Decide whether to add capacity, enable prefix delegation, or redesign CIDRs.",
        ],
    },
    {
        "slug": "validate-helm-release-artifact",
        "title": "Validate a Helm release artifact",
        "track": "Helm",
        "difficulty": INTERMEDIATE_LEVEL,
        "level_group": INTERMEDIATE_LEVEL,
        "estimated_minutes": 40,
        "course_slug": "platform-helm-application-delivery",
        "lesson_title": "Lint, Template, Diff, and Upgrade Safety",
        "scenario": "A chart renders successfully but may change immutable selectors or create unsafe resources.",
        "skills": ["helm lint", "helm template", "helm diff", "dry-run", "selector review"],
        "commands": [
            "helm lint charts/checkout",
            "helm template checkout charts/checkout -f values/prod.yaml > rendered.yaml",
            "helm diff upgrade checkout charts/checkout -n payments -f values/prod.yaml",
        ],
        "checklist": [
            "Render the exact production values stack.",
            "Compare selectors and labels with the previous release.",
            "Validate rendered YAML before mutation.",
            "Document rollback limitations.",
        ],
    },
    {
        "slug": "trace-argocd-drift",
        "title": "Trace an ArgoCD drift report",
        "track": "ArgoCD",
        "difficulty": INTERMEDIATE_LEVEL,
        "level_group": INTERMEDIATE_LEVEL,
        "estimated_minutes": 35,
        "course_slug": "platform-argocd-gitops",
        "lesson_title": "Sync Waves, Pruning, Self-Heal, and Drift",
        "scenario": "ArgoCD reports OutOfSync because a controller modified a live field.",
        "skills": ["argocd diff", "ignoreDifferences", "controller ownership", "self-heal", "Git source of truth"],
        "commands": [
            "argocd app diff checkout-prod",
            "kubectl get hpa,deploy -n payments checkout -o yaml",
            "kubectl describe application checkout-prod -n argocd",
        ],
        "checklist": [
            "Identify the exact field causing drift.",
            "Decide whether Git or a live controller should own the field.",
            "Scope ignoreDifferences narrowly if ignoring is correct.",
            "Document the ownership decision near the Application manifest.",
        ],
    },
    {
        "slug": "design-production-eks-review",
        "title": "Run a production EKS architecture review",
        "track": "EKS Architecture",
        "difficulty": ADVANCED_LEVEL,
        "level_group": ADVANCED_LEVEL,
        "estimated_minutes": 55,
        "course_slug": "platform-production-eks-architecture",
        "lesson_title": "Multi-AZ Design and Cost Guardrails",
        "scenario": "You need to review whether a proposed EKS platform is resilient and cost-aware before launch.",
        "skills": ["multi-AZ", "storage scope", "cost labels", "Karpenter constraints", "upgrade readiness"],
        "commands": [
            "kubectl get nodes -L topology.kubernetes.io/zone",
            "kubectl get pods -A -o wide",
            "kubectl get pv,pvc -A",
        ],
        "checklist": [
            "Confirm critical replicas spread across zones.",
            "Identify zonal storage and recovery expectations.",
            "Review cost labels, idle requests, load balancers, and NAT traffic.",
            "Name upgrade pause points and deprecated API inventory.",
        ],
    },
    {
        "slug": "audit-tenant-boundaries",
        "title": "Audit Kubernetes tenant boundaries",
        "track": "Security",
        "difficulty": ADVANCED_LEVEL,
        "level_group": ADVANCED_LEVEL,
        "estimated_minutes": 50,
        "course_slug": "platform-kubernetes-security-multitenancy",
        "lesson_title": "RBAC and Least Privilege",
        "scenario": "A shared cluster needs a tenant access review before onboarding another team.",
        "skills": ["RBAC", "can-i", "network policy", "pod security", "secret access"],
        "commands": [
            "kubectl auth can-i get secrets -n payments --as dev@example.com",
            "kubectl get role,rolebinding -n payments",
            "kubectl get networkpolicy -A",
        ],
        "checklist": [
            "Test representative user and service account permissions.",
            "Find cluster-admin and wildcard bindings.",
            "Confirm default-deny or documented network boundaries.",
            "Review secret access and exception ownership.",
        ],
    },
    {
        "slug": "write-slo-backed-runbook",
        "title": "Write an SLO-backed Kubernetes runbook",
        "track": "SRE",
        "difficulty": ADVANCED_LEVEL,
        "level_group": ADVANCED_LEVEL,
        "estimated_minutes": 50,
        "course_slug": "platform-sre-observability-kubernetes",
        "lesson_title": "SLOs, Error Budgets, and Burn-Rate Alerts",
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

PLATFORM_LABS.extend(
    [
        {
            "slug": "inspect-linux-failure-evidence",
            "title": "Inspect Linux failure evidence",
            "track": "Linux",
            "difficulty": FRESHER_LEVEL,
            "level_group": "Fresher",
            "estimated_minutes": 35,
            "course_slug": "platform-linux-command-line-foundations",
            "lesson_title": "Processes, Exit Codes, and Logs",
            "scenario": "A container exits repeatedly and you need to decide whether it is an app crash, permission issue, or resource kill.",
            "skills": ["processes", "exit codes", "logs", "permissions", "evidence notes"],
            "commands": [
                "kubectl describe pod checkout-abc123 -n payments",
                "kubectl logs checkout-abc123 -n payments --previous",
                "kubectl exec checkout-abc123 -n payments -- id",
            ],
            "checklist": [
                "Capture Last State and exit code.",
                "Compare logs with process and permission assumptions.",
                "Separate OOMKilled, permission denied, and application exception symptoms.",
                "Write the next safest diagnostic command before proposing a fix.",
            ],
        },
        {
            "slug": "trace-network-path",
            "title": "Trace an HTTP request across the network path",
            "track": "Networking",
            "difficulty": FRESHER_LEVEL,
            "level_group": "Fresher",
            "estimated_minutes": 40,
            "course_slug": "platform-networking-fundamentals",
            "lesson_title": "HTTP, TLS, and Ingress",
            "scenario": "Users see intermittent 503 responses and you need to locate whether the error starts at DNS, ALB, Ingress, Service, or Pod readiness.",
            "skills": ["DNS", "HTTP status", "TLS", "Ingress", "Service endpoints"],
            "commands": [
                "curl -I https://app.example.com/healthz",
                "kubectl describe ingress checkout -n payments",
                "kubectl get svc,endpointslice -n payments",
            ],
            "checklist": [
                "Resolve the hostname and confirm the expected endpoint.",
                "Identify which hop emits the HTTP status code.",
                "Compare Service endpoints with Pod readiness.",
                "Document whether the next owner is DNS, ingress, app, or platform networking.",
            ],
        },
        {
            "slug": "review-terraform-eks-plan",
            "title": "Review a Terraform EKS plan",
            "track": "Terraform",
            "difficulty": INTERMEDIATE_LEVEL,
            "level_group": INTERMEDIATE_LEVEL,
            "estimated_minutes": 50,
            "course_slug": "platform-terraform-aws-infrastructure",
            "lesson_title": "Plan Review, Drift, and Safe Changes",
            "scenario": "A Terraform plan changes node groups, security groups, and IAM roles before a production EKS upgrade.",
            "skills": ["terraform plan", "state", "replacement risk", "IAM diff", "cost review"],
            "commands": [
                "terraform init -backend=false",
                "terraform plan -out=tfplan",
                "terraform show -no-color tfplan",
            ],
            "checklist": [
                "Find create, update, replace, and destroy actions.",
                "Call out IAM and security group blast radius.",
                "Identify validation and rollback steps.",
                "Estimate cost impact before approval.",
            ],
        },
        {
            "slug": "debug-irsa-access-denied",
            "title": "Debug IRSA AccessDenied for a Pod",
            "track": "AWS IAM",
            "difficulty": INTERMEDIATE_LEVEL,
            "level_group": INTERMEDIATE_LEVEL,
            "estimated_minutes": 45,
            "course_slug": "platform-aws-iam-for-eks",
            "lesson_title": "IRSA and EKS Pod Identity",
            "scenario": "A workload can start but AWS SDK calls fail with AccessDenied after a service-account change.",
            "skills": ["IRSA", "service accounts", "trust policy", "CloudTrail", "STS"],
            "commands": [
                "kubectl get sa checkout -n payments -o yaml",
                "kubectl describe pod checkout-abc123 -n payments",
                "aws sts get-caller-identity",
            ],
            "checklist": [
                "Match service account annotation or Pod Identity association to the expected role.",
                "Review trust policy subject, audience, and OIDC provider.",
                "Confirm the denied action and resource in CloudTrail or SDK output.",
                "Decide whether the fix belongs in Kubernetes, IAM trust, or IAM permissions.",
            ],
        },
        {
            "slug": "design-safe-release-pipeline",
            "title": "Design a safe Kubernetes release pipeline",
            "track": "CI/CD",
            "difficulty": ADVANCED_LEVEL,
            "level_group": ADVANCED_LEVEL,
            "estimated_minutes": 55,
            "course_slug": "platform-cicd-release-engineering",
            "lesson_title": "Pipeline Stages and Quality Gates",
            "scenario": "A team wants push-to-prod for a Kubernetes service, and you need to add the minimum gates that protect users without blocking every release.",
            "skills": ["quality gates", "artifact promotion", "smoke tests", "canary", "rollback"],
            "commands": [
                "docker build -t checkout:sha .",
                "helm template checkout charts/checkout -f values/prod.yaml",
                "kubectl rollout status deploy/checkout -n payments",
            ],
            "checklist": [
                "Define build, test, render, scan, deploy, smoke, and SLO gates.",
                "Promote immutable image digests rather than rebuilding per environment.",
                "Name automatic rollback criteria and manual approval points.",
                "Threat-model who can deploy and where secrets live.",
            ],
        },
        {
            "slug": "create-platform-golden-path",
            "title": "Create a service golden path",
            "track": "Platform Engineering",
            "difficulty": ADVANCED_LEVEL,
            "level_group": ADVANCED_LEVEL,
            "estimated_minutes": 60,
            "course_slug": "platform-engineering-product-operating-model",
            "lesson_title": "Golden Paths and Developer Experience",
            "scenario": "Your platform team needs a self-service path for launching a new service with CI, Terraform, Helm, ArgoCD, dashboards, and runbooks.",
            "skills": ["golden path", "service template", "production readiness", "developer experience", "platform metrics"],
            "commands": [
                "cookiecutter platform-service-template",
                "helm template new-service charts/service",
                "argocd app get new-service-dev",
            ],
            "checklist": [
                "Define required inputs and generated artifacts.",
                "Include observability, ownership, security, and rollback defaults.",
                "Document the first-run developer experience.",
                "Pick adoption and reliability metrics to review after launch.",
            ],
        },
    ]
)

PLATFORM_LABS.extend(
    [
        {
            "slug": "review-docker-image-supply-chain",
            "title": "Review a Docker image supply chain",
            "track": "Docker",
            "difficulty": FRESHER_LEVEL,
            "level_group": "Fresher",
            "estimated_minutes": 45,
            "course_slug": "platform-docker-image-supply-chain",
            "lesson_title": "Tags, Digests, Registries, and Promotion",
            "scenario": "A team wants to promote an image tagged `latest` to production, and you need to prove which artifact will actually run.",
            "skills": ["Dockerfile review", "multi-stage builds", "image digests", "registry promotion", "SBOM review"],
            "commands": [
                "docker build -t checkout:local .",
                "docker image inspect checkout:local",
                "docker history checkout:local",
            ],
            "checklist": [
                "Identify base image, runtime user, entrypoint, exposed port, and copied files.",
                "Compare tag-based release notes with immutable digest evidence.",
                "Check whether build-only tools or secrets reached the runtime image.",
                "Write a promotion note with digest, scan status, SBOM location, and rollback image.",
            ],
        },
        {
            "slug": "debug-aws-alb-health-path",
            "title": "Debug an AWS ALB health path",
            "track": "AWS Operations",
            "difficulty": INTERMEDIATE_LEVEL,
            "level_group": INTERMEDIATE_LEVEL,
            "estimated_minutes": 50,
            "course_slug": "platform-aws-operations-foundations",
            "lesson_title": "VPC, Load Balancer, Route 53, and Health Paths",
            "scenario": "An ALB target group turns unhealthy after a Kubernetes deployment and users see intermittent 503 responses.",
            "skills": ["CloudWatch", "ALB target health", "Route 53", "security groups", "EndpointSlices"],
            "commands": [
                "aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN",
                "aws cloudwatch describe-alarms --state-value ALARM",
                "kubectl describe ingress checkout -n payments",
                "kubectl get svc,endpointslice,pods -n payments",
            ],
            "checklist": [
                "Confirm which target group and health path are failing.",
                "Compare ALB target health with Kubernetes readiness and EndpointSlices.",
                "Check security group and subnet assumptions before changing application code.",
                "Write the owner and next action for AWS networking, ingress controller, or app team.",
            ],
        },
        {
            "slug": "design-opentelemetry-signal-path",
            "title": "Design an OpenTelemetry signal path",
            "track": "Observability",
            "difficulty": ADVANCED_LEVEL,
            "level_group": ADVANCED_LEVEL,
            "estimated_minutes": 55,
            "course_slug": "platform-observability-telemetry-engineering",
            "lesson_title": "Metrics, Logs, Traces, and OpenTelemetry Signals",
            "scenario": "Checkout latency is hard to debug because metrics, logs, and traces disagree and no one owns the telemetry path.",
            "skills": ["OpenTelemetry", "context propagation", "sampling", "Prometheus rules", "telemetry cost"],
            "commands": [
                "kubectl get servicemonitor,podmonitor,prometheusrule -A",
                "kubectl get otelcol -A",
                "kubectl logs deploy/otel-collector -n observability --since=15m",
            ],
            "checklist": [
                "Map the user symptom to metric, log, trace, and Kubernetes event evidence.",
                "Check service names, route labels, trace IDs in logs, and sampling policy.",
                "Flag high-cardinality labels and sensitive attributes.",
                "Write owners for instrumentation, collector, storage, dashboard, and alert policy.",
            ],
        },
        {
            "slug": "run-incident-commander-tabletop",
            "title": "Run an incident commander tabletop",
            "track": "Incident Response",
            "difficulty": ADVANCED_LEVEL,
            "level_group": ADVANCED_LEVEL,
            "estimated_minutes": 60,
            "course_slug": "platform-incident-response-reliability",
            "lesson_title": "Incident Roles, Severity, and First Response",
            "scenario": "A canary release causes elevated checkout errors and the team needs coordinated mitigation, communication, and timeline discipline.",
            "skills": ["incident command", "severity", "stakeholder communication", "timeline", "mitigation"],
            "commands": [
                "kubectl get events -n payments --sort-by=.lastTimestamp",
                "kubectl rollout history deploy/checkout -n payments",
                "kubectl get pods,svc,endpointslice -n payments",
            ],
            "checklist": [
                "Assign incident commander, operations, communications, and planning roles.",
                "Write impact, severity, current mitigation, and next update time.",
                "Record timeline entries for alerts, deploys, commands, decisions, and handoff.",
                "End with postmortem triggers and corrective-action owners.",
            ],
        },
        {
            "slug": "audit-eks-cost-drivers",
            "title": "Audit EKS cost drivers",
            "track": "FinOps",
            "difficulty": ADVANCED_LEVEL,
            "level_group": ADVANCED_LEVEL,
            "estimated_minutes": 60,
            "course_slug": "platform-finops-kubernetes-aws",
            "lesson_title": "AWS Cost Drivers for EKS Platforms",
            "scenario": "Cloud spend jumped after a platform migration, and you need to separate real growth from Kubernetes and AWS waste.",
            "skills": ["FinOps", "Kubernetes requests", "EKS cost drivers", "NAT costs", "telemetry spend"],
            "commands": [
                "kubectl top pods -A --containers",
                "kubectl get pods -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,CPU:.spec.containers[*].resources.requests.cpu,MEM:.spec.containers[*].resources.requests.memory",
                "kubectl get svc,pv,pvc -A",
            ],
            "checklist": [
                "Rank compute, storage, load balancer, NAT, data transfer, and telemetry hypotheses.",
                "Compare requested resources with actual usage and restart/OOM evidence.",
                "Map each recommendation to an owner, expected savings, reliability risk, and rollback.",
                "Decide which savings are quick wins and which require architecture changes.",
            ],
        },
        {
            "slug": "build-platform-career-proof-pack",
            "title": "Build a platform career proof pack",
            "track": "Career",
            "difficulty": ADVANCED_LEVEL,
            "level_group": ADVANCED_LEVEL,
            "estimated_minutes": 75,
            "course_slug": "platform-career-job-search-sprint",
            "lesson_title": "Portfolio Evidence and Project Narratives",
            "scenario": "You need interview-ready proof that your platform skills are practical, current, and credible after a layoff.",
            "skills": ["portfolio", "resume bullets", "STAR stories", "job description analysis", "mock interview prep"],
            "commands": [
                "git log --oneline --decorate -5",
                "find . -maxdepth 3 -iname '*README*' -o -iname '*runbook*'",
                "grep -R \"rollback\\|SLO\\|Terraform\\|Kubernetes\" -n docs apps || true",
            ],
            "checklist": [
                "Choose five target job descriptions and extract repeated skill demands.",
                "Turn one lab into a README proof section with commands, evidence, tradeoffs, and rollback.",
                "Write resume bullets for implementation, operations, and business impact.",
                "Prepare STAR stories for incident response, automation, cost, security, and influence.",
            ],
        },
    ]
)


RUNNABLE_LAB_UPDATES = {
    "diagnose-eks-ip-exhaustion": {
        "prerequisites": [
            "No AWS credentials required; this lab uses a captured EKS evidence pack.",
            "Run commands from the repository root so local evidence paths resolve.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh --evidence /tmp/eks-ip-exhaustion-evidence.md",
            "sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
        ],
        "commands": [
            "grep -n \"FailedCreatePodSandBox\\|failed to assign IP\\|AvailableIPv4AddressCount\" labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
            "grep -n \"maxPods\\|runningPods\\|prefix delegation\" labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
            "python3 labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py --snapshot labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
            "sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md",
        ],
        "practice_steps": [
            "Separate scheduler max-pod pressure from VPC CNI IP allocation errors.",
            "Find the subnet with the lowest free IPv4 count.",
            "Use the local analyzer to confirm the scheduler, CNI, subnet, maxPods, and prefix-delegation signals agree.",
            "Decide whether prefix delegation, node group sizing, or CIDR planning is the correct owner path.",
        ],
        "expected_evidence": [
            "Events include FailedCreatePodSandBox with failed IP assignment.",
            "One subnet has only seven available IPv4 addresses.",
            "Nodes are near maxPods and prefix delegation is disabled.",
            "The local analyzer reports EKS IP exhaustion analysis passed.",
            "The remediation plan separates app, platform, network, and release ownership.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh",
            "bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh --evidence /tmp/eks-ip-exhaustion-evidence.md",
            "python3 labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py --snapshot labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
            "grep -n \"not an application restart problem\" labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/diagnose-eks-ip-exhaustion/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the evidence pack as a captured incident transcript.",
            "Write the decision note without running any cluster or AWS commands.",
        ],
    },
    "validate-helm-release-artifact": {
        "prerequisites": [
            "No cluster or Helm install required for the baseline review path.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "ls labs/platform-academy/validate-helm-release-artifact",
            "sed -n '1,180p' labs/platform-academy/validate-helm-release-artifact/review-notes.md",
        ],
        "commands": [
            "diff -u labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml || true",
            "grep -n \"selector:\\|latest\\|privileged\\|LoadBalancer\" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml",
        ],
        "practice_steps": [
            "Review rendered YAML instead of trusting chart success.",
            "Find immutable selector changes and risky security changes.",
            "Write an approval decision with rollback limitations.",
        ],
        "expected_evidence": [
            "The Deployment selector changes between rendered versions.",
            "The image changes from digest-pinned to the mutable latest tag.",
            "The rendered output introduces privileged mode and a LoadBalancer.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/validate-helm-release-artifact/validate.sh",
            "bash labs/platform-academy/validate-helm-release-artifact/validate.sh --evidence /tmp/helm-release-evidence.md",
            "grep -n \"app: checkout\" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml",
            "grep -n \"privileged: true\" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml",
        ],
        "cleanup_commands": ["bash labs/platform-academy/validate-helm-release-artifact/cleanup.sh"],
        "no_cluster_fallback": [
            "Read the before/after YAML files and complete the review without Helm.",
            "Block the release in writing if selector, image, security, or exposure risk is unresolved.",
        ],
    },
    "trace-argocd-drift": {
        "prerequisites": [
            "No ArgoCD server required; this lab compares captured desired and live manifests.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/trace-argocd-drift/setup.sh --evidence /tmp/argocd-drift-evidence.md",
            "sed -n '1,220p' labs/platform-academy/trace-argocd-drift/argocd-app-report.txt",
            "sed -n '1,160p' labs/platform-academy/trace-argocd-drift/ownership-decision.md",
        ],
        "commands": [
            "diff -u labs/platform-academy/trace-argocd-drift/desired.yaml labs/platform-academy/trace-argocd-drift/live.yaml || true",
            "grep -n \"OutOfSync\\|selfHeal\\|/spec/replicas\" labs/platform-academy/trace-argocd-drift/argocd-app-report.txt",
            "grep -n \"replicas\\|last-scale\\|ignoreDifferences\" labs/platform-academy/trace-argocd-drift/*.yaml labs/platform-academy/trace-argocd-drift/ownership-decision.md",
            "python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py --desired labs/platform-academy/trace-argocd-drift/desired.yaml --live labs/platform-academy/trace-argocd-drift/live.yaml --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt",
        ],
        "practice_steps": [
            "Identify the exact field causing drift.",
            "Use the ArgoCD app report to decide whether self-heal would fight a controller-owned field.",
            "Decide whether Git or an autoscaler should own replicas.",
            "Scope any ignore rule narrowly and keep other fields Git-owned.",
            "Run the local analyzer to verify image/resources remain Git-owned while replicas are the only ignored field.",
        ],
        "expected_evidence": [
            "The ArgoCD app report marks checkout OutOfSync and selfHeal enabled.",
            "Git wants three replicas while live state has nine.",
            "The live object carries autoscaling metadata.",
            "The ownership decision should mention a narrow replicas-only ignore rule.",
            "The analyzer confirms the ignore rule is scoped to checkout in payments and only /spec/replicas.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/trace-argocd-drift/validate.sh",
            "bash labs/platform-academy/trace-argocd-drift/validate.sh --evidence /tmp/argocd-drift-evidence.md",
            "python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py --desired labs/platform-academy/trace-argocd-drift/desired.yaml --live labs/platform-academy/trace-argocd-drift/live.yaml --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt",
            "grep -n \"replicas: 9\" labs/platform-academy/trace-argocd-drift/live.yaml",
            "grep -n \"spec.replicas\" labs/platform-academy/trace-argocd-drift/ownership-decision.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/trace-argocd-drift/cleanup.sh"],
        "no_cluster_fallback": [
            "Treat argocd-app-report.txt, desired.yaml, and live.yaml as exported ArgoCD evidence.",
            "Write the field owner decision without connecting to ArgoCD.",
        ],
    },
    "design-production-eks-review": {
        "prerequisites": [
            "No AWS account required; this lab uses a proposal snapshot.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,220p' labs/platform-academy/design-production-eks-review/cluster-review.md",
        ],
        "commands": [
            "grep -n \"Missing cost label\\|pdb=missing\\|public and private\\|zonal\" labs/platform-academy/design-production-eks-review/cluster-review.md",
            "grep -n \"Upgrade pause\\|deprecated APIs\\|PDBs\" labs/platform-academy/design-production-eks-review/cluster-review.md",
            "sed -n '1,220p' labs/platform-academy/design-production-eks-review/launch-review.md",
        ],
        "practice_steps": [
            "Check critical workload spread and PDB coverage.",
            "Identify zonal storage and recovery expectations.",
            "Flag missing cost labels and upgrade pause points.",
        ],
        "expected_evidence": [
            "One worker has a missing PDB.",
            "Postgres uses zonal storage with snapshot restore expectations.",
            "One apps node lacks a cost label.",
            "The launch review blocks production until reliability, cost, and upgrade gaps are owned.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/design-production-eks-review/validate.sh",
            "bash labs/platform-academy/design-production-eks-review/validate.sh --evidence /tmp/production-eks-review-evidence.md",
            "grep -n \"Block production launch\" labs/platform-academy/design-production-eks-review/launch-review.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/design-production-eks-review/cleanup.sh"],
        "no_cluster_fallback": [
            "Use cluster-review.md as the design review packet.",
            "Write launch blockers and follow-up owners without connecting to AWS.",
        ],
    },
    "audit-tenant-boundaries": {
        "prerequisites": [
            "kubectl is optional; the default path is local manifest review.",
            "Do not apply this manifest to a shared cluster because it intentionally contains risky RBAC.",
            "Optional cluster mode requires a disposable local Kubernetes context.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/audit-tenant-boundaries/setup.sh --evidence /tmp/tenant-boundaries-evidence.md",
            "kubectl create --dry-run=client --validate=false -f labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml",
            "sed -n '1,180p' labs/platform-academy/audit-tenant-boundaries/review.md",
            "bash labs/platform-academy/audit-tenant-boundaries/setup.sh --cluster --evidence /tmp/tenant-boundaries-evidence.md",
        ],
        "commands": [
            "grep -n \"cluster-admin\\|secrets\\|allow-all-egress\\|pod-security\" labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml",
            "grep -n \"Block onboarding\\|secret access\\|egress\" labs/platform-academy/audit-tenant-boundaries/review.md",
        ],
        "practice_steps": [
            "Find broad RBAC and secret access.",
            "Check whether NetworkPolicy creates a real boundary.",
            "Record exception owners and expiry requirements before onboarding.",
        ],
        "expected_evidence": [
            "A temporary ClusterRoleBinding grants cluster-admin.",
            "The Role can list and watch secrets.",
            "The NetworkPolicy allows all egress.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/audit-tenant-boundaries/validate.sh",
            "bash labs/platform-academy/audit-tenant-boundaries/validate.sh --evidence /tmp/tenant-boundaries-evidence.md",
            "bash labs/platform-academy/audit-tenant-boundaries/validate.sh --cluster",
            "grep -n \"name: cluster-admin\" labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml",
            "grep -n \"resources: \\[\\\"secrets\\\"\\]\" labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml",
        ],
        "cleanup_commands": ["bash labs/platform-academy/audit-tenant-boundaries/cleanup.sh"],
        "no_cluster_fallback": [
            "Review tenant-a.yaml directly and write the onboarding blockers.",
            "Use review.md as the expected finding checklist.",
        ],
    },
    "write-slo-backed-runbook": {
        "prerequisites": [
            "No Prometheus server required; this lab uses local alert and incident files.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/signals.md",
            "sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/runbook-template.md",
        ],
        "commands": [
            "grep -n \"CheckoutHighErrorBudgetBurn\\|0.02\\|severity: page\" labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml",
            "grep -n \"revision 43\\|readiness flapping\\|Mitigation\" labs/platform-academy/write-slo-backed-runbook/signals.md",
            "diff -u labs/platform-academy/write-slo-backed-runbook/runbook-template.md labs/platform-academy/write-slo-backed-runbook/completed-runbook.md || true",
        ],
        "practice_steps": [
            "Name the user-visible SLO and burn signal.",
            "Tie the alert to rollout and Kubernetes event evidence.",
            "Fill the runbook with safe commands, mitigation choices, and follow-up owners.",
        ],
        "expected_evidence": [
            "The alert pages on a checkout 5xx ratio over 2%.",
            "The signals connect rollout revision 43 with readiness flapping.",
            "The runbook template separates evidence, mitigation, and follow-up.",
            "The completed runbook ties rollback criteria to revision 43 and post-mitigation validation.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/write-slo-backed-runbook/validate.sh",
            "bash labs/platform-academy/write-slo-backed-runbook/validate.sh --evidence /tmp/slo-runbook-evidence.md",
            "grep -n \"Collect read-only evidence first\" labs/platform-academy/write-slo-backed-runbook/incident-decision.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/write-slo-backed-runbook/cleanup.sh"],
        "no_cluster_fallback": [
            "Use signals.md as the incident transcript.",
            "Fill runbook-template.md without connecting to Prometheus or Kubernetes.",
        ],
    },
    "inspect-linux-failure-evidence": {
        "prerequisites": [
            "No cluster required; this lab uses captured describe, log, and id output.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,180p' labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt",
            "sed -n '1,120p' labs/platform-academy/inspect-linux-failure-evidence/previous.log",
        ],
        "commands": [
            "grep -n \"Exit Code\\|Reason\\|Restart Count\" labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt",
            "grep -n \"Permission denied\\|uid=\" labs/platform-academy/inspect-linux-failure-evidence/previous.log labs/platform-academy/inspect-linux-failure-evidence/id-output.txt",
        ],
        "practice_steps": [
            "Capture Last State, exit code, and restart count.",
            "Compare previous logs with runtime user evidence.",
            "Decide whether this is app crash, permission, or resource pressure.",
        ],
        "expected_evidence": [
            "The previous container exited with code 126.",
            "Previous logs show Permission denied.",
            "The process runs as uid 10001.",
            "The remediation note rejects memory tuning and root runtime as first fixes.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh",
            "bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh --evidence /tmp/linux-failure-evidence.md",
            "grep -n \"Running as root: hides the permission bug\" labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/inspect-linux-failure-evidence/cleanup.sh"],
        "no_cluster_fallback": [
            "The captured files are the fallback path.",
            "Write the next safest diagnostic command and the likely owner of the fix.",
        ],
    },
    "trace-network-path": {
        "prerequisites": [
            "No DNS, ALB, or Kubernetes access required for the default path; this lab uses captured network evidence.",
            "Optional cluster mode requires a disposable local Kubernetes context.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/trace-network-path/setup.sh --evidence /tmp/network-path-evidence.md",
            "sed -n '1,220p' labs/platform-academy/trace-network-path/incident-handoff.md",
            "sed -n '1,220p' labs/platform-academy/trace-network-path/network-evidence.md",
            "bash labs/platform-academy/trace-network-path/setup.sh --cluster --evidence /tmp/network-path-evidence.md",
        ],
        "commands": [
            "grep -n \"HTTP/2 503\\|Target.ResponseCodeMismatch\\|targetPort web\" labs/platform-academy/trace-network-path/incident-handoff.md labs/platform-academy/trace-network-path/network-evidence.md labs/platform-academy/trace-network-path/ingress-service.yaml",
            "grep -n \"name: http\\|targetPort: web\" labs/platform-academy/trace-network-path/ingress-service.yaml",
        ],
        "practice_steps": [
            "Start from the pager handoff and preserve the no-live-change boundary.",
            "Identify which hop emits the 503.",
            "Compare ALB target health with Kubernetes Service and Pod port names.",
            "Decide whether the owner is DNS, ingress, Service, or application readiness.",
        ],
        "expected_evidence": [
            "The incident handoff names the checkout health path impact and safety boundary.",
            "The client receives a 503 from awselb.",
            "One target is unhealthy with response code mismatch.",
            "The Service targetPort is web while the Pod port is named http.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/trace-network-path/validate.sh",
            "bash labs/platform-academy/trace-network-path/validate.sh --evidence /tmp/network-path-evidence.md",
            "bash labs/platform-academy/trace-network-path/validate.sh --cluster",
            "grep -n \"targetPort: web\" labs/platform-academy/trace-network-path/ingress-service.yaml",
            "grep -n \"name: http\" labs/platform-academy/trace-network-path/ingress-service.yaml",
        ],
        "cleanup_commands": ["bash labs/platform-academy/trace-network-path/cleanup.sh"],
        "no_cluster_fallback": [
            "Use incident-handoff.md and network-evidence.md as a captured request trace.",
            "Write the hop-by-hop owner note without live DNS or ALB access.",
        ],
    },
    "review-terraform-eks-plan": {
        "prerequisites": [
            "No Terraform install or AWS credentials required; this lab uses a saved plan excerpt.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/review-terraform-eks-plan/setup.sh --evidence /tmp/terraform-eks-plan-evidence.md",
            "sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
        ],
        "commands": [
            "grep -n \"must be replaced\\|0.0.0.0/0\\|eks:\\*\\|Plan:\" labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
            "sed -n '1,160p' labs/platform-academy/review-terraform-eks-plan/review.md",
            "python3 labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py --plan labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
        ],
        "practice_steps": [
            "Find create, change, replace, and destroy actions.",
            "Call out subnet, capacity, security group, and IAM blast radius.",
            "Run the local analyzer to produce a block decision from the saved plan.",
            "Write the approval decision and rollback questions.",
        ],
        "expected_evidence": [
            "The node group replacement loses multi-AZ subnet coverage.",
            "A public 0.0.0.0/0 security group rule is added.",
            "An IAM policy grants eks:* on all resources.",
            "The analyzer reports a do-not-approve decision with blocking risk signals.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/review-terraform-eks-plan/validate.sh",
            "bash labs/platform-academy/review-terraform-eks-plan/validate.sh --evidence /tmp/terraform-eks-plan-evidence.md",
            "python3 labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py --plan labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
            "grep -n \"must be replaced\" labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
            "grep -n \"0.0.0.0/0\\|eks:\\*\" labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
        ],
        "cleanup_commands": ["bash labs/platform-academy/review-terraform-eks-plan/cleanup.sh"],
        "no_cluster_fallback": [
            "Use tfplan.txt as the plan artifact.",
            "Complete review.md without running terraform.",
        ],
    },
    "debug-irsa-access-denied": {
        "prerequisites": [
            "No AWS credentials required; this lab uses local Kubernetes and CloudTrail evidence.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/debug-irsa-access-denied/setup.sh --evidence /tmp/irsa-access-denied-evidence.md",
            "kubectl create --dry-run=client --validate=false -f labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml",
            "sed -n '1,180p' labs/platform-academy/debug-irsa-access-denied/workload-error.log",
            "sed -n '1,180p' labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json",
        ],
        "commands": [
            "grep -n \"role-arn\\|serviceAccountName\\|AWS_ROLE_ARN\" labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml labs/platform-academy/debug-irsa-access-denied/workload-error.log",
            "grep -n \"system:serviceaccount\\|AccessDenied\\|PutObject\" labs/platform-academy/debug-irsa-access-denied/trust-policy.json labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json",
            "python3 labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py --serviceaccount labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml --trust-policy labs/platform-academy/debug-irsa-access-denied/trust-policy.json --fixed-trust-policy labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json --cloudtrail-event labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json --permission-policy labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json",
        ],
        "practice_steps": [
            "Match the Pod service account to the annotated IAM role.",
            "Compare the application-side SDK failure with the CloudTrail denial.",
            "Compare the trust policy subject with the real namespace and service account.",
            "Use the CloudTrail action and resource to decide whether the trust policy or permissions policy is wrong.",
            "Run the local simulator to prove the proposed trust subject and S3 object-prefix permission cover the captured request.",
        ],
        "expected_evidence": [
            "The ServiceAccount is payments/checkout.",
            "The workload log shows AWS_ROLE_ARN for payments-checkout-readonly and an SDK AccessDenied on PutObject.",
            "The trust policy subject allows default/checkout instead.",
            "CloudTrail denies s3:PutObject through the readonly role.",
            "The simulator proves the fixed trust subject and least-privilege policy allow the captured request without broad S3 scope.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/debug-irsa-access-denied/validate.sh",
            "bash labs/platform-academy/debug-irsa-access-denied/validate.sh --evidence /tmp/irsa-access-denied-evidence.md",
            "python3 labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py --serviceaccount labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml --trust-policy labs/platform-academy/debug-irsa-access-denied/trust-policy.json --fixed-trust-policy labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json --cloudtrail-event labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json --permission-policy labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json",
            "grep -n \"namespace: payments\" labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml",
            "grep -n \"system:serviceaccount:default:checkout\" labs/platform-academy/debug-irsa-access-denied/trust-policy.json",
        ],
        "cleanup_commands": ["bash labs/platform-academy/debug-irsa-access-denied/cleanup.sh"],
        "no_cluster_fallback": [
            "Review serviceaccount.yaml, workload-error.log, trust-policy.json, and cloudtrail-event.json as exported evidence.",
            "Write whether the immediate blocker is trust subject mismatch, permission scope, or both.",
        ],
    },
    "design-safe-release-pipeline": {
        "prerequisites": [
            "No CI runner required; this lab reviews a pipeline definition and checklist.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/design-safe-release-pipeline/setup.sh --evidence /tmp/release-pipeline-evidence.md",
            "sed -n '1,180p' labs/platform-academy/design-safe-release-pipeline/pipeline.yaml",
            "sed -n '1,180p' labs/platform-academy/design-safe-release-pipeline/release-checklist.md",
        ],
        "commands": [
            "grep -n \"main\\|deploy-prod\\|helm upgrade\\|missing digest\" labs/platform-academy/design-safe-release-pipeline/pipeline.yaml",
            "grep -n \"digest\\|smoke\\|rollback\\|approval\" labs/platform-academy/design-safe-release-pipeline/release-checklist.md",
            (
                "python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py "
                "--unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml "
                "--safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml "
                "--checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md "
                "--decision labs/platform-academy/design-safe-release-pipeline/decision-record.md"
            ),
            "diff -u labs/platform-academy/design-safe-release-pipeline/pipeline.yaml labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml || true",
        ],
        "practice_steps": [
            "Identify missing quality gates before production.",
            "Add immutable digest promotion and smoke-test expectations.",
            "Use the local analyzer to prove the unsafe path and safe gate chain.",
            "Name rollback criteria and permission boundaries.",
        ],
        "expected_evidence": [
            "The sample pipeline deploys from main directly to production.",
            "The build step does not promote by digest.",
            "The checklist requires scan, smoke, rollback, and approval gates.",
            "The local analyzer reports Safe release pipeline analysis passed.",
            "The safe pipeline adds staging, manifest validation, policy checks, canary, and rollback criteria.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/design-safe-release-pipeline/validate.sh",
            "bash labs/platform-academy/design-safe-release-pipeline/validate.sh --evidence /tmp/release-pipeline-evidence.md",
            (
                "python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py "
                "--unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml "
                "--safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml "
                "--checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md "
                "--decision labs/platform-academy/design-safe-release-pipeline/decision-record.md"
            ),
            "grep -n \"environment: production\" labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml",
        ],
        "cleanup_commands": ["bash labs/platform-academy/design-safe-release-pipeline/cleanup.sh"],
        "no_cluster_fallback": [
            "Use pipeline.yaml and release-checklist.md as the review packet.",
            "Write the minimum gate set before touching a real CI system.",
        ],
    },
    "create-platform-golden-path": {
        "prerequisites": [
            "No template engine required; this lab reviews the golden path contract.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,220p' labs/platform-academy/create-platform-golden-path/service-template.md",
        ],
        "commands": [
            "grep -n \"Generated artifacts\\|SLO dashboard\\|Runbook\\|Backstage\" labs/platform-academy/create-platform-golden-path/service-template.md",
            "grep -n \"missing\\|owner\\|lifecycle\" labs/platform-academy/create-platform-golden-path/catalog-info.yaml",
            "diff -u labs/platform-academy/create-platform-golden-path/catalog-info.yaml labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml || true",
        ],
        "practice_steps": [
            "Define required inputs and generated outputs.",
            "Check whether ownership, SLO, and runbook defaults are complete.",
            "Describe the first-run developer experience and adoption metrics.",
        ],
        "expected_evidence": [
            "The template generates Dockerfile, Helm, CI, ArgoCD, dashboard, runbook, and catalog files.",
            "The catalog file still has missing PagerDuty and SLO annotations.",
            "The first-run flow ends with production readiness review.",
            "The ready template defines inputs, secure defaults, launch gates, and adoption metrics.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/create-platform-golden-path/validate.sh",
            "bash labs/platform-academy/create-platform-golden-path/validate.sh --evidence /tmp/golden-path-evidence.md",
            "grep -n \"Adoption Metrics\" labs/platform-academy/create-platform-golden-path/ready-service-template.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/create-platform-golden-path/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the template files as a product review packet.",
            "Write missing inputs, generated artifacts, and launch-readiness blockers.",
        ],
    },
    "review-docker-image-supply-chain": {
        "prerequisites": [
            "No Docker daemon required for the baseline path; this lab uses local Dockerfile and captured metadata.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/review-docker-image-supply-chain/setup.sh --evidence /tmp/docker-supply-chain-evidence.md",
            "sed -n '1,160p' labs/platform-academy/review-docker-image-supply-chain/Dockerfile",
            "sed -n '1,160p' labs/platform-academy/review-docker-image-supply-chain/history.txt",
        ],
        "commands": [
            "grep -n \"FROM\\|COPY\\|API_TOKEN\\|USER\" labs/platform-academy/review-docker-image-supply-chain/Dockerfile labs/platform-academy/review-docker-image-supply-chain/image-inspect.json",
            "grep -n \"latest\\|RepoDigests\\|secret\\|COPY\" labs/platform-academy/review-docker-image-supply-chain/image-inspect.json labs/platform-academy/review-docker-image-supply-chain/history.txt",
            (
                "python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py "
                "--dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile "
                "--inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json "
                "--history labs/platform-academy/review-docker-image-supply-chain/history.txt "
                "--hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile "
                "--promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md"
            ),
            "diff -u labs/platform-academy/review-docker-image-supply-chain/Dockerfile labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile || true",
        ],
        "practice_steps": [
            "Identify base image, runtime user, copied files, exposed ports, and entrypoint.",
            "Compare tag evidence with digest evidence.",
            "Use the local analyzer to convert supply-chain findings into a block-or-promote decision.",
            "Flag secret leakage and oversized runtime image risk.",
        ],
        "expected_evidence": [
            "The image uses the mutable latest tag and has no RepoDigests.",
            "No runtime user is configured.",
            "API_TOKEN appears in Dockerfile, inspect metadata, and history.",
            "The local analyzer reports Docker supply-chain analysis passed.",
            "The promotion note requires digest, SBOM, scan, non-root runtime, and rollback evidence.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/review-docker-image-supply-chain/validate.sh",
            "bash labs/platform-academy/review-docker-image-supply-chain/validate.sh --evidence /tmp/docker-supply-chain-evidence.md",
            (
                "python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py "
                "--dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile "
                "--inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json "
                "--history labs/platform-academy/review-docker-image-supply-chain/history.txt "
                "--hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile "
                "--promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md"
            ),
            "grep -n \"Immutable image digest\" labs/platform-academy/review-docker-image-supply-chain/promotion-note.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/review-docker-image-supply-chain/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the supplied Dockerfile, inspect JSON, and history text instead of building an image.",
            "Write a promotion note naming digest, SBOM, scan, runtime user, and rollback requirements.",
        ],
    },
    "debug-aws-alb-health-path": {
        "prerequisites": [
            "No AWS credentials required for the default path; this lab uses local ALB and Kubernetes evidence.",
            "Optional cluster mode requires a disposable local Kubernetes context.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --evidence /tmp/alb-health-path-evidence.md",
            "sed -n '1,160p' labs/platform-academy/debug-aws-alb-health-path/target-health.json",
            "bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --cluster --evidence /tmp/alb-health-path-evidence.md",
        ],
        "commands": [
            "grep -n \"unhealthy\\|ResponseCodeMismatch\\|targetPort: web\" labs/platform-academy/debug-aws-alb-health-path/target-health.json labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml",
            "grep -n \"healthcheck-path\\|targetPort web\\|no matching Pod port\" labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml labs/platform-academy/debug-aws-alb-health-path/events.txt",
        ],
        "practice_steps": [
            "Confirm which target group symptom is failing.",
            "Compare ALB health path with Ingress, Service, and Pod port evidence.",
            "Name whether the owner is AWS networking, ingress controller, or app manifest.",
        ],
        "expected_evidence": [
            "One target is unhealthy with Target.ResponseCodeMismatch.",
            "Ingress healthcheck path is /healthz.",
            "Service targetPort web does not match the Pod port named http.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/debug-aws-alb-health-path/validate.sh",
            "bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --evidence /tmp/alb-health-path-evidence.md",
            "bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --cluster",
            "grep -n \"Target.ResponseCodeMismatch\" labs/platform-academy/debug-aws-alb-health-path/target-health.json",
            "grep -n \"targetPort: web\" labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml",
        ],
        "cleanup_commands": ["bash labs/platform-academy/debug-aws-alb-health-path/cleanup.sh"],
        "no_cluster_fallback": [
            "Use target-health.json, ingress-service.yaml, and events.txt as exported evidence.",
            "Write the owner and next action without AWS CLI access.",
        ],
    },
    "design-opentelemetry-signal-path": {
        "prerequisites": [
            "No collector required; this lab reviews local OpenTelemetry and alert artifacts and can emit simulated signals.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,220p' labs/platform-academy/design-opentelemetry-signal-path/collector.yaml",
            "sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt",
            "python3 labs/platform-academy/simulator.py --scenario checkout-latency --format both --events 5",
        ],
        "commands": [
            "grep -n \"authorization\\|trace_id\\|customer_email\" labs/platform-academy/design-opentelemetry-signal-path/collector.yaml labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml",
            "grep -n \"pipelines:\\|traces:\\|histogram_quantile\" labs/platform-academy/design-opentelemetry-signal-path/collector.yaml labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml",
        ],
        "practice_steps": [
            "Map the symptom to metrics, logs, traces, and collector ownership.",
            "Find missing trace IDs and sensitive or high-cardinality labels.",
            "Write owners for instrumentation, collector, storage, dashboard, and alert policy.",
        ],
        "expected_evidence": [
            "Collector drops authorization headers.",
            "One log line has trace_id=missing.",
            "The latency alert groups by customer_email, creating high cardinality risk.",
            "The safe rule removes customer_email and the decision record assigns signal owners.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh",
            "bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence /tmp/otel-signal-path-evidence.md",
            "grep -n \"Owner Map\" labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/design-opentelemetry-signal-path/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the supplied collector, log, and rule files as the telemetry path packet.",
            "Write the ownership map without connecting to a telemetry backend.",
        ],
    },
    "run-incident-commander-tabletop": {
        "prerequisites": [
            "No cluster required; this tabletop uses local incident signal files and a local signal simulator.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,180p' labs/platform-academy/run-incident-commander-tabletop/signals.md",
            "sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/roles.md",
            "python3 labs/platform-academy/simulator.py --scenario checkout-incident --format logs --events 5",
        ],
        "commands": [
            "grep -n \"SEV-2\\|rollback\\|next stakeholder update\" labs/platform-academy/run-incident-commander-tabletop/signals.md",
            "grep -n \"Incident commander\\|Operations lead\\|Communications lead\\|Planning lead\" labs/platform-academy/run-incident-commander-tabletop/roles.md",
        ],
        "practice_steps": [
            "Assign incident roles and severity.",
            "Write current impact, mitigation, and next update time.",
            "Record timeline entries for facts, decisions, and owners.",
        ],
        "expected_evidence": [
            "The incident is SEV-2 with checkout 5xx impact.",
            "Rollback to revision 42 is identified as an option.",
            "The tabletop requires commander, operations, communications, and planning roles.",
            "The commander brief sets mitigation criteria and a 15-minute stakeholder update.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/run-incident-commander-tabletop/validate.sh",
            "bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence /tmp/incident-commander-evidence.md",
            "grep -n \"Rollback revision 43\" labs/platform-academy/run-incident-commander-tabletop/commander-brief.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/run-incident-commander-tabletop/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the signal, role, and timeline files as the complete tabletop packet.",
            "Fill the timeline without live incident tooling.",
        ],
    },
    "audit-eks-cost-drivers": {
        "prerequisites": [
            "No AWS Cost Explorer access required; this lab uses local cost evidence files.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "bash labs/platform-academy/audit-eks-cost-drivers/setup.sh --evidence /tmp/eks-cost-evidence.md",
            "sed -n '1,160p' labs/platform-academy/audit-eks-cost-drivers/usage.csv",
            "sed -n '1,120p' labs/platform-academy/audit-eks-cost-drivers/services.txt",
        ],
        "commands": [
            "awk -F, 'NR==1 || $8==\"unknown\" || $3 > ($4 * 4) {print}' labs/platform-academy/audit-eks-cost-drivers/usage.csv",
            "grep -n \"abandoned\\|LoadBalancer\\|unknown\" labs/platform-academy/audit-eks-cost-drivers/services.txt labs/platform-academy/audit-eks-cost-drivers/storage.txt",
            (
                "python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py "
                "--usage labs/platform-academy/audit-eks-cost-drivers/usage.csv "
                "--services labs/platform-academy/audit-eks-cost-drivers/services.txt "
                "--storage labs/platform-academy/audit-eks-cost-drivers/storage.txt "
                "--recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md"
            ),
        ],
        "practice_steps": [
            "Rank compute over-requesting, idle load balancers, and abandoned storage.",
            "Use the local analyzer to separate quick-win monthly exposure from architecture-review items.",
            "Map each finding to an owner, savings estimate, reliability risk, and rollback.",
            "Decide which recommendations are quick wins versus architecture changes.",
        ],
        "expected_evidence": [
            "Checkout and worker CPU requests are far above usage.",
            "Default namespace has abandoned load balancer and storage entries.",
            "Some resources have unknown owner metadata.",
            "The local analyzer reports EKS cost driver analysis passed and quick-win monthly exposure.",
            "The recommendation table includes savings, reliability risk, and rollback.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/audit-eks-cost-drivers/validate.sh",
            "bash labs/platform-academy/audit-eks-cost-drivers/validate.sh --evidence /tmp/eks-cost-evidence.md",
            (
                "python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py "
                "--usage labs/platform-academy/audit-eks-cost-drivers/usage.csv "
                "--services labs/platform-academy/audit-eks-cost-drivers/services.txt "
                "--storage labs/platform-academy/audit-eks-cost-drivers/storage.txt "
                "--recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md"
            ),
            "grep -n \"Expected Savings\" labs/platform-academy/audit-eks-cost-drivers/recommendations.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/audit-eks-cost-drivers/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the CSV and text snapshots as cost evidence.",
            "Write a cost recommendation table without live AWS access.",
        ],
    },
    "build-platform-career-proof-pack": {
        "prerequisites": [
            "No external job board required; this lab includes sample job-skill demand and evidence files.",
            "Run commands from the repository root.",
        ],
        "setup_commands": [
            "sed -n '1,160p' labs/platform-academy/build-platform-career-proof-pack/job-skills.txt",
            "sed -n '1,180p' labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md",
        ],
        "commands": [
            "grep -n \"Kubernetes\\|Terraform\\|incident response\\|SLOs\\|FinOps\" labs/platform-academy/build-platform-career-proof-pack/job-skills.txt",
            "grep -n \"Missing proof\\|rollback\\|STAR\" labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md labs/platform-academy/build-platform-career-proof-pack/readme-template.md",
            "diff -u labs/platform-academy/build-platform-career-proof-pack/readme-template.md labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md || true",
        ],
        "practice_steps": [
            "Extract repeated skills from the sample target roles.",
            "Pick three lab artifacts and map them to proof bullets.",
            "Fill the README template with commands, evidence, validation, rollback, and interview talking points.",
        ],
        "expected_evidence": [
            "Target roles repeatedly mention Kubernetes, AWS, Terraform, CI/CD, observability, SRE, and security.",
            "The evidence inventory names five candidate artifacts and missing proof to collect.",
            "The README template forces problem, commands, validation, rollback, and STAR talking points.",
            "The completed proof pack includes a README proof section, resume bullets, and STAR stories.",
        ],
        "validation_commands": [
            "bash labs/platform-academy/build-platform-career-proof-pack/validate.sh",
            "bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence /tmp/career-proof-evidence.md",
            "grep -n \"Release Safety\" labs/platform-academy/build-platform-career-proof-pack/star-stories.md",
        ],
        "cleanup_commands": ["bash labs/platform-academy/build-platform-career-proof-pack/cleanup.sh"],
        "no_cluster_fallback": [
            "Use the included job skills and evidence inventory instead of external job postings.",
            "Write one README proof section from any converted lab.",
        ],
    },
}

DEEPENED_LAB_UPDATES = {
    "trace-service-to-pod": {
        "worksheet_prompts": [
            "Record the current context or no-cluster transcript used, namespace, and cleanup command before changing anything.",
            "Paste the Service selector evidence and the exact label key/value the Service expects.",
            "Paste the Pod label evidence and the exact label key/value the running Pods expose.",
            "Paste the EndpointSlice evidence before the fix and explain why the Service has no ready backends.",
            "Write the smallest source-manifest fix and why a one-off live Service patch is not enough.",
            "Capture post-fix EndpointSlice validation and cleanup or no-cluster fallback evidence.",
        ],
        "rubric": [
            "Names the namespace, context or transcript source, and cleanup boundary before acting.",
            "Captures Service selector evidence with the exact `app=checkout` value.",
            "Captures Pod label evidence with the exact `app=checkout-api` value.",
            "Explains why a healthy Deployment can still produce empty EndpointSlices.",
            "Chooses the source-manifest Service selector fix instead of a console or live-only patch.",
            "Verifies ready EndpointSlice backends after the fix and records cleanup or fallback evidence.",
        ],
        "validation_checks": [
            "Safety context or no-cluster transcript recorded",
            "Service selector evidence captured",
            "Pod label evidence captured",
            "EndpointSlice empty-backend evidence captured",
            "Source manifest fix identified",
            "Post-fix EndpointSlice validation captured",
            "Cleanup or fallback note recorded",
        ],
        "rubric_evidence_terms": [
            ["namespace", "context", "no-cluster", "cleanup", "payments"],
            ["Service selector", "app=checkout", "selector"],
            ["Pod label", "app=checkout-api", "Pod labels"],
            ["EndpointSlice", "no ready", "empty", "backends"],
            ["source-manifest", "fixed.yaml", "selector", "live patch"],
            ["post-fix", "EndpointSlice", "cleanup", "fallback", "validate"],
        ],
    },
    "debug-crashloop-imagepull": {
        "worksheet_prompts": [
            "Record the current context or no-cluster transcript used, namespace, and cleanup command before changing anything.",
            "Classify each workload by status and whether its container actually started.",
            "Paste the CrashLoopBackOff Last State, exit code, and previous-log evidence.",
            "Paste the ImagePullBackOff image reference and event reason evidence.",
            "Assign the app/config owner action and the image/registry owner action separately.",
            "Capture rollout validation and cleanup or no-cluster fallback evidence.",
        ],
        "rubric": [
            "Separates CrashLoopBackOff from ImagePullBackOff without mixing evidence sources.",
            "Uses `logs --previous` only for the container that started and exited.",
            "Uses events and image reference evidence for the container that never started.",
            "Names `missing DB_URL` and exit code 42 as app/config evidence.",
            "Names the invalid registry reference as image/registry ownership evidence.",
            "Validates both fixed Deployments and records cleanup or fallback evidence.",
        ],
        "validation_checks": [
            "Safety context or no-cluster transcript recorded",
            "Failure modes classified",
            "CrashLoopBackOff previous-log evidence captured",
            "ImagePullBackOff event evidence captured",
            "Owners and fixes separated",
            "Rollout validation captured",
            "Cleanup or fallback note recorded",
        ],
        "rubric_evidence_terms": [
            ["checkout-crash", "CrashLoopBackOff", "checkout-pull", "ImagePullBackOff", "started"],
            ["logs --previous", "previous logs", "exit code 42", "missing DB_URL", "last state"],
            ["registry.invalid.example/checkout:missing", "ImagePullBackOff", "ErrImagePull", "event", "registry"],
            ["missing DB_URL", "exit code 42", "app/config", "owner"],
            ["registry.invalid.example/checkout:missing", "image/registry", "owner", "registry", "fix"],
            ["rollout", "validate", "cleanup", "fallback", "Deployments"],
        ],
    },
    "review-yaml-before-apply": {
        "worksheet_prompts": [
            "Record the reviewed vendor.yaml file, reviewer, namespace scope, and confirmation that no live apply was run.",
            "Inventory resource kinds, namespaces, cluster-scoped resources, and optional dry-run or parse-check output.",
            "Paste ClusterRole secret access, privileged container, hostPath `/`, and Secret `stringData.token` evidence.",
            "Classify each blocker as RBAC, workload security, node filesystem exposure, or credential handling.",
            "Write the block decision, safer baseline changes, and precise questions back to the vendor.",
            "Capture the safe-baseline diff, validation output, cleanup, and no-live-apply evidence note.",
        ],
        "rubric": [
            "Preserves the no-live-apply safety boundary and names the reviewed vendor manifest.",
            "Inventories resource kinds, namespaces, cluster-scoped resources, and parse-check evidence.",
            "Captures `ClusterRole` secret access, `privileged: true`, `hostPath: /`, and `stringData.token` evidence.",
            "Classifies blockers across RBAC, workload security, node filesystem exposure, and credential handling.",
            "Blocks the manifest with safer-baseline requirements and vendor questions.",
            "Saves safe-baseline diff, validation output, cleanup, and no-live-apply evidence.",
        ],
        "validation_checks": [
            "No-live-apply safety boundary recorded",
            "Resource inventory captured",
            "ClusterRole secret access evidence captured",
            "Privileged and hostPath evidence captured",
            "Secret stringData credential evidence captured",
            "Vendor block decision and questions recorded",
            "Validation output and cleanup/no-live-apply evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["vendor.yaml", "reviewer", "no live apply", "shared cluster"],
            ["ClusterRole", "Namespace", "Deployment", "Secret", "dry-run"],
            ["resources: [\"pods\", \"secrets\"]", "privileged: true", "hostPath", "stringData.token"],
            ["RBAC", "workload security", "node filesystem", "credential handling"],
            ["Block", "safe-baseline.yaml", "vendor questions", "allowPrivilegeEscalation: false"],
            ["diff", "validate", "cleanup", "evidence-template.md", "no-live-apply"],
        ],
    },
    "inspect-linux-failure-evidence": {
        "worksheet_prompts": [
            "Record the captured pod describe, previous log, id output, namespace, and confirmation that no cluster access is required.",
            "Paste `CrashLoopBackOff`, restart count, Last State reason, and exit code 126 evidence.",
            "Paste `/app/bin/checkout: Permission denied`, runtime UID/GID, and file-permission hypothesis evidence.",
            "Explain why the likely fix is image file permission or ownership, not memory tuning or application logic.",
            "Write the remediation owner, rejected root workaround, and validation signal for the fixed image.",
            "Capture remediation-note, validation output, cleanup, and no-cluster evidence to save.",
        ],
        "rubric": [
            "Preserves the captured-evidence/no-cluster safety boundary and names the evidence files.",
            "Captures `CrashLoopBackOff`, restart count, Last State, and exit code 126 evidence.",
            "Connects `/app/bin/checkout: Permission denied` with runtime user `uid=10001(checkout)`.",
            "Rejects memory tuning and app-logic debugging as first fixes because evidence points to permissions.",
            "Chooses image file permission or ownership remediation and rejects running as root.",
            "Saves remediation note, validation output, cleanup, and no-cluster evidence.",
        ],
        "validation_checks": [
            "No-cluster evidence boundary recorded",
            "CrashLoopBackOff and restart evidence captured",
            "Exit code 126 evidence captured",
            "Permission denied log and UID evidence captured",
            "Wrong fixes rejected",
            "Image permission owner and remediation recorded",
            "Validation output and cleanup/no-cluster evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["pod-describe.txt", "previous.log", "id-output.txt", "no cluster"],
            ["CrashLoopBackOff", "Restart Count:  8", "Last State", "Exit Code:    126"],
            ["/app/bin/checkout: Permission denied", "uid=10001(checkout)", "gid=10001(checkout)"],
            ["not application logic or memory pressure", "permission", "ownership", "execute"],
            ["image file permissions", "Running as root: hides the permission bug", "owner"],
            ["remediation-note.md", "validate", "cleanup", "evidence-template.md", "no-cluster"],
        ],
    },
    "design-production-eks-review": {
        "worksheet_prompts": [
            "Record the cluster-review packet, launch-review packet, reviewer, and confirmation that no AWS changes are being made.",
            "Paste endpoint posture, critical workload spread, missing PDB, and zonal storage evidence.",
            "Paste missing cost label, idle/NAT/LoadBalancer review gap, deprecated API, and add-on compatibility evidence.",
            "Separate immediate launch blockers from follow-up improvements and explain the reliability risk.",
            "Assign workload, platform, data, cost, and upgrade owners with validation criteria.",
            "Capture launch decision, validation output, cleanup, and no-AWS evidence packet.",
        ],
        "rubric": [
            "Preserves the captured architecture-review safety boundary and avoids live AWS mutation.",
            "Captures endpoint posture, missing PDB, critical workload spread, and zonal storage evidence.",
            "Captures missing cost label, cost-review gaps, deprecated APIs, and add-on compatibility risk.",
            "Separates launch blockers from follow-up improvements with reliability rationale.",
            "Assigns workload, platform, data, FinOps, and upgrade owners with validation criteria.",
            "Saves launch decision, validation output, cleanup, and no-AWS evidence.",
        ],
        "validation_checks": [
            "No-AWS architecture review boundary recorded",
            "Endpoint and workload-spread evidence captured",
            "Missing PDB and zonal storage evidence captured",
            "Cost label and cost-review gap evidence captured",
            "Upgrade and add-on compatibility evidence captured",
            "Launch blockers, follow-ups, and owners recorded",
            "Validation output and cleanup/no-AWS evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["cluster-review.md", "launch-review.md", "no AWS", "reviewer"],
            ["Endpoint: public and private", "payments/worker", "pdb=missing", "volume=gp3-us-west-2a"],
            ["Missing cost label on apps-c", "deprecated APIs", "controller add-ons", "compatibility matrix"],
            ["Block production launch", "follow-up", "reliability risk", "launch blockers"],
            ["workload owner", "platform owner", "data owner", "FinOps owner", "validation criteria"],
            ["launch-review.md", "validate", "cleanup", "evidence-template.md", "no-AWS"],
        ],
    },
    "trace-network-path": {
        "worksheet_prompts": [
            "Record the incident handoff, host/path, evidence source, manifest files, and confirmation that no live DNS, ALB, or cluster change is being made.",
            "Paste the client `HTTP/2 503`, `awselb/2.0` server header, DNS target, and expected traffic path.",
            "Paste the ALB `Target.ResponseCodeMismatch` target-health evidence and the unhealthy target status.",
            "Paste the Ingress backend, Service `targetPort web`, Pod port name `http`, and readiness or EndpointSlice evidence.",
            "Write which owners are ruled out, the source-manifest fix, owner split, and why this is not a DNS-only or ALB-console fix.",
            "Capture the fixed manifest diff, validation output, and cleanup or no-cluster note you would save.",
        ],
        "rubric": [
            "Uses the incident handoff to preserve impact context and avoid live DNS, ALB, or cluster mutation.",
            "Captures `HTTP/2 503`, `awselb/2.0`, DNS target, and expected host/path route evidence.",
            "Names `Target.ResponseCodeMismatch` as the ALB target-health symptom instead of guessing.",
            "Connects Ingress backend, Service `targetPort web`, and Pod port name `http` to the failed hop.",
            "Rules out DNS and ALB-only ownership before choosing a source-manifest `targetPort: http` fix.",
            "Saves fixed-ingress-service diff, validation output, cleanup, and no-cluster evidence.",
        ],
        "validation_checks": [
            "Incident handoff and no-live-network-change safety boundary recorded",
            "Client 503 and DNS evidence captured",
            "ALB Target.ResponseCodeMismatch evidence captured",
            "Ingress backend evidence captured",
            "Service targetPort and Pod port evidence captured",
            "Owners ruled out plus source-manifest fix recorded",
            "Validation output and cleanup/no-cluster evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["incident-handoff.md", "Pager Snapshot", "impact", "no live DNS", "no live ALB"],
            ["HTTP/2 503", "awselb/2.0", "k8s-payments-checkout-123456", "checkout.example.com"],
            ["Target.ResponseCodeMismatch", "unhealthy", "Health checks failed", "target health"],
            ["Ingress", "Service", "targetPort web", "targetPort: web", "Pod port", "http"],
            ["DNS owner", "ALB owner", "app/platform owner", "source-manifest", "targetPort: http"],
            ["diff", "validate", "cleanup", "no-cluster", "evidence-template.md"],
        ],
    },
    "debug-aws-alb-health-path": {
        "worksheet_prompts": [
            "Record the evidence source, namespace, manifest files, and why no live AWS mutation is required.",
            "Paste the ALB target health reason, unhealthy target, and observed HTTP status.",
            "Paste the Ingress health check path and explain whether it matches the app contract.",
            "Paste the Service targetPort, Pod port name, and controller event that prove the routing mismatch.",
            "Assign owner actions across AWS networking, ingress/controller, and application teams.",
            "Write the source-manifest fix and the validation or rollout handoff you would require.",
        ],
        "rubric": [
            "Uses exported ALB and Kubernetes evidence without requiring AWS credentials.",
            "Names `Target.ResponseCodeMismatch` and the 404 health-check symptom.",
            "Connects `/healthz` to the application health endpoint contract instead of assuming AWS is broken.",
            "Explains why `targetPort: web` does not match the Pod port named `http`.",
            "Separates AWS networking, ingress/controller, and app-owner actions.",
            "Rejects console-only fixes and defines source-manifest validation or rollout handoff.",
        ],
        "validation_checks": [
            "Evidence source and no-live-mutation boundary recorded",
            "ALB target health reason captured",
            "Health check path reviewed",
            "Service-to-Pod port mismatch captured",
            "Controller event captured",
            "Owner decision written",
            "Source-manifest fix and validation handoff recorded",
        ],
        "rubric_evidence_terms": [
            ["evidence source", "no live AWS", "namespace", "manifest", "no live mutation"],
            ["Target.ResponseCodeMismatch", "404", "unhealthy target", "target health"],
            ["/healthz", "health check path", "app contract", "health endpoint"],
            ["targetPort: web", "targetPort web", "Pod port", "http", "controller event"],
            ["AWS networking", "ingress/controller", "app owner", "owner"],
            ["source-manifest", "validation", "handoff", "console-only", "rollout"],
        ],
    },
    "diagnose-eks-ip-exhaustion": {
        "worksheet_prompts": [
            "Record the cluster snapshot, namespace, rollout scale target, and confirmation that no AWS or cluster capacity change is being made.",
            "Paste the `FailedScheduling` and `Insufficient pods` evidence that shows scheduler pod-density pressure.",
            "Paste the `FailedCreatePodSandBox` and aws-cni IP allocation evidence.",
            "Paste `subnet-bbb222`, `AvailableIPv4AddressCount=7`, node maxPods/runningPods, and `prefix delegation disabled` evidence.",
            "Write the owner split across application scale, platform node groups/CNI, and network subnet planning.",
            "Write the staged remediation, rejected actions, validation signals, rollback note, and saved evidence packet.",
        ],
        "rubric": [
            "Preserves the no-live-capacity-change safety boundary and names the reviewed rollout.",
            "Separates `FailedScheduling` pod-density evidence from application health assumptions.",
            "Connects `FailedCreatePodSandBox` and aws-cni logs to IP allocation failure.",
            "Identifies `subnet-bbb222`, `AvailableIPv4AddressCount=7`, maxPods pressure, and `prefix delegation disabled`.",
            "Separates application, platform/CNI, and network owners before recommending capacity changes.",
            "Rejects blind restarts or blind node scaling and records validation, rollback, and capacity-alert evidence.",
        ],
        "validation_checks": [
            "No-live-capacity-change safety boundary recorded",
            "EKS IP exhaustion analysis passed output captured",
            "FailedScheduling pod-density evidence captured",
            "FailedCreatePodSandBox CNI evidence captured",
            "Subnet IPv4 exhaustion evidence captured",
            "Nodes near maxPods and prefix delegation evidence captured",
            "Owner split and staged remediation recorded",
            "Validation output and rollback/no-credential evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["cluster-snapshot.txt", "payments", "checkout scale", "no AWS", "no cluster capacity"],
            ["FailedScheduling", "Insufficient pods", "maxPods", "pod-density"],
            ["FailedCreatePodSandBox", "aws-cni", "failed to assign an IP address", "ipamd.go"],
            ["subnet-bbb222", "AvailableIPv4AddressCount=7", "runningPods=29", "prefix delegation disabled"],
            ["application owner", "platform owner", "network owner", "CNI", "subnet planning"],
            ["Pause the checkout scale-up", "Blind node scaling: rejected", "validation", "Rollback", "capacity alert"],
        ],
    },
    "review-terraform-eks-plan": {
        "worksheet_prompts": [
            "Record the plan artifact, workspace or environment, reviewer, and confirmation that `terraform apply` is not being run.",
            "Paste the node group replacement evidence, subnet coverage before/after, and desired/max capacity change.",
            "Paste the public ingress and broad IAM policy evidence.",
            "Explain the blast radius, rollback uncertainty, and whether changes should be split into smaller plans.",
            "Write the approval decision, required remediation, owner, and follow-up validation.",
            "Capture the validation command output and the evidence artifacts you would save for review.",
        ],
        "rubric": [
            "Preserves the no-apply safety boundary and names the reviewed plan artifact.",
            "Captures node group replacement, subnet coverage regression, and capacity reduction evidence.",
            "Flags public `0.0.0.0/0` ingress and broad `eks:*` IAM scope.",
            "Explains blast radius, rollback uncertainty, owner, and why separate plans are safer.",
            "Blocks or conditions approval with concrete remediation and validation requirements.",
            "Saves decision, plan, reviewer questions, validation output, and cleanup/no-runtime notes.",
        ],
        "validation_checks": [
            "No-apply safety boundary recorded",
            "Replacement and subnet regression evidence captured",
            "Capacity reduction evidence captured",
            "Public ingress and broad IAM evidence captured",
            "Blast radius and rollback decision written",
            "Approval/remediation owner recorded",
            "Validation output and saved evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["terraform apply", "tfplan.txt", "plan artifact", "reviewer"],
            ["must be replaced", "subnet-aaa111", "subnet-bbb222", "desired_size = 6 -> 3", "max_size = 12 -> 6"],
            ["0.0.0.0/0", "eks:*", "Resource = \"*\"", "public ingress", "IAM"],
            ["blast radius", "rollback", "owner", "separate plans", "capacity"],
            ["Do not approve", "remediation", "least-privilege", "validation", "rollback"],
            ["decision-record.md", "tfplan.txt", "review.md", "validate", "cleanup"],
        ],
    },
    "debug-irsa-access-denied": {
        "worksheet_prompts": [
            "Record the evidence source, namespace, ServiceAccount, IAM role ARN, and confirmation that no live IAM changes are being made.",
            "Paste the Kubernetes and runtime identity evidence: ServiceAccount namespace/name, Pod `serviceAccountName`, role annotation, and `AWS_ROLE_ARN`.",
            "Paste the application-side SDK error from workload-error.log and compare it with CloudTrail.",
            "Paste the trust policy subject, expected subject, and namespace mismatch.",
            "Paste the CloudTrail denied action, error code, assumed role, bucket, and key prefix.",
            "Decide whether the failure is trust, permission, or both, and name the owner for each fix.",
            "Write the narrow trust and least-privilege permission fix plus validation or rollout handoff.",
        ],
        "rubric": [
            "Preserves the captured-evidence safety boundary and avoids live IAM mutation.",
            "Captures Kubernetes identity and runtime `AWS_ROLE_ARN` evidence for `payments/checkout`.",
            "Connects the application SDK `AccessDenied` with the CloudTrail `s3:PutObject` denial.",
            "Identifies the trust subject mismatch between `default/checkout` and `payments/checkout`.",
            "Connects CloudTrail `AccessDenied` on `s3:PutObject` to bucket and key-prefix evidence.",
            "Separates trust-policy ownership from permission-policy ownership and avoids wildcard fixes.",
            "Defines exact trust, least-privilege permission scope, validation, and rollout handoff.",
        ],
        "validation_checks": [
            "No-live-IAM safety boundary recorded",
            "ServiceAccount and runtime role identity evidence captured",
            "Application SDK AccessDenied evidence captured",
            "Trust subject mismatch captured",
            "CloudTrail AccessDenied evidence captured",
            "Bucket and key-prefix evidence captured",
            "Trust and permission owners separated",
            "Narrow fix and validation handoff recorded",
        ],
        "rubric_evidence_terms": [
            ["captured evidence", "no live IAM", "ServiceAccount", "role ARN", "payments"],
            ["payments/checkout", "serviceAccountName", "role-arn", "AWS_ROLE_ARN", "payments-checkout-readonly"],
            ["workload-error.log", "botocore", "AccessDenied", "PutObject", "SDK"],
            ["system:serviceaccount:default:checkout", "system:serviceaccount:payments:checkout", "trust policy", "namespace mismatch"],
            ["AccessDenied", "PutObject", "payments-prod-receipts", "receipts/2026/05/30", "CloudTrail"],
            ["trust", "permission", "owner", "wildcard", "s3:*"],
            ["s3:PutObject", "arn:aws:s3:::payments-prod-receipts/receipts/*", "least-privilege", "validation", "handoff"],
        ],
    },
    "audit-tenant-boundaries": {
        "worksheet_prompts": [
            "Record the manifest reviewed, tenant namespace, safety boundary, and cleanup command if a disposable cluster was used.",
            "Paste the ClusterRoleBinding, bound subject, cluster-admin role, and secret access evidence.",
            "Paste the Pod Security enforcement level and the required restricted target.",
            "Paste the NetworkPolicy egress rule and explain why it is not a default-deny boundary.",
            "Write the onboarding decision with blocking findings, required changes, owner, and expiry for exceptions.",
            "Capture validation output, safer target evidence, cleanup, and no-runtime-review evidence.",
        ],
        "rubric": [
            "Preserves the no-shared-cluster safety boundary and names the tenant namespace.",
            "Captures cluster-admin and secret-read RBAC evidence with exact resources and subjects.",
            "Identifies Pod Security `baseline` as weaker than the required `restricted` target.",
            "Explains why `allow-all-egress` is not tenant isolation and names the default-deny target.",
            "Blocks onboarding with owners, expiry dates, and required boundary changes.",
            "Saves validation, safer manifest diff, cleanup, and no-runtime-review evidence.",
        ],
        "validation_checks": [
            "No-shared-cluster safety boundary recorded",
            "ClusterRoleBinding and cluster-admin evidence captured",
            "Secret access evidence captured",
            "Pod Security baseline/restricted evidence captured",
            "Allow-all egress evidence captured",
            "Onboarding decision with owner/expiry recorded",
            "Validation output and cleanup/no-runtime evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["tenant-a", "shared cluster", "cleanup", "manifest", "dry-run"],
            ["tenant-a-temporary-admin", "cluster-admin", "deployer", "secrets", "Role"],
            ["pod-security.kubernetes.io/enforce: baseline", "restricted", "Pod Security", "exception"],
            ["allow-all-egress", "egress", "default-deny", "NetworkPolicy", "boundary"],
            ["Block onboarding", "owner", "expiry", "required changes", "exception"],
            ["fixed-tenant-a.yaml", "validate", "diff", "cleanup", "no-runtime"],
        ],
    },
    "validate-helm-release-artifact": {
        "worksheet_prompts": [
            "Record the rendered artifact, target environment, reviewer, and confirmation that the unsafe render was not applied.",
            "Paste the immutable selector change evidence from rendered-before.yaml and rendered-after.yaml.",
            "Paste the image, securityContext, and Service exposure regressions.",
            "Explain rollback risk and which chart/value owners must approve changes.",
            "Write the release decision and required safer rendered target.",
            "Capture validation output and the evidence artifacts you would save for release review.",
        ],
        "rubric": [
            "Preserves the no-apply safety boundary and names the rendered artifact under review.",
            "Captures the immutable Deployment selector change with exact before/after labels.",
            "Flags mutable `checkout:latest` image, privileged runtime, and new `LoadBalancer` exposure.",
            "Explains rollback risk, owner questions, and why render-success is not release approval.",
            "Blocks or conditions the release with concrete safer-render requirements.",
            "Saves rendered diff, decision, validation output, and cleanup/no-runtime notes.",
        ],
        "validation_checks": [
            "No-apply safety boundary recorded",
            "Selector before/after evidence captured",
            "Mutable image evidence captured",
            "Privileged runtime and LoadBalancer evidence captured",
            "Rollback risk and owner questions written",
            "Safer render decision recorded",
            "Validation output and saved evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["rendered artifact", "rendered-after.yaml", "not applied", "reviewer"],
            ["app.kubernetes.io/name=checkout", "app=checkout", "immutable selector", "Deployment selector"],
            ["checkout:latest", "privileged: true", "LoadBalancer", "securityContext", "mutable"],
            ["rollback", "owner", "chart values", "render-success", "release approval"],
            ["Block the release", "safe-rendered-after.yaml", "digest-pinned", "ClusterIP", "non-privileged"],
            ["diff", "review-notes.md", "validate", "cleanup", "no-runtime"],
        ],
    },
    "trace-argocd-drift": {
        "worksheet_prompts": [
            "Record the ArgoCD report, desired/live manifest sources, reviewer, and confirmation that no force-sync or broad ignore rule was applied.",
            "Paste the desired and live replica values plus the exact drift field path.",
            "Paste the sync policy and explain the `selfHeal` risk if ArgoCD fights controller-owned replicas.",
            "Paste the autoscaling/controller ownership signal from the live object.",
            "Decide whether Git or autoscaling owns replicas and list fields that must remain Git-owned.",
            "Review the proposed ignore rule and explain why it stays narrowly scoped.",
            "Capture validation output, owner decision, and evidence artifacts you would save.",
        ],
        "rubric": [
            "Uses the ArgoCD app report to preserve the captured-manifest safety boundary and avoid force-sync or broad ignore rules.",
            "Captures desired `replicas: 3`, live `replicas: 9`, and `.spec.replicas` drift evidence.",
            "Explains why `selfHeal: true` can fight autoscaling when field ownership is unclear.",
            "Uses autoscaling metadata as controller-ownership evidence instead of assuming human drift.",
            "Separates autoscaler-owned replicas from Git-owned image, labels, resources, and security fields.",
            "Chooses a narrow `/spec/replicas` ignore rule scoped to the checkout Deployment only.",
            "Saves ownership decision, ignore-rule review, validation output, and cleanup/no-runtime notes.",
        ],
        "validation_checks": [
            "ArgoCD report and no-force-sync safety boundary recorded",
            "Desired/live replica evidence captured",
            "selfHeal risk captured",
            "Autoscaling ownership evidence captured",
            "Git-owned fields listed",
            "Narrow ignore rule reviewed",
            "Ownership decision written",
            "Validation output and saved evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["argocd-app-report.txt", "OutOfSync", "desired.yaml", "live.yaml", "force-sync"],
            ["replicas: 3", "replicas: 9", ".spec.replicas", "/spec/replicas"],
            ["selfHeal: true", "force sync", "fight", "sync policy"],
            ["autoscaling.platform.example.com/last-scale", "autoscaling", "controller-owned", "live object"],
            ["Git-owned", "image", "labels", "resources", "security"],
            ["ignoreDifferences", "/spec/replicas", "checkout", "payments", "Deployment"],
            ["ownership-decision.md", "ignore-differences.yaml", "validate", "cleanup", "no-runtime"],
        ],
    },
    "review-docker-image-supply-chain": {
        "worksheet_prompts": [
            "Record the Dockerfile, captured inspect/history files, reviewer, and confirmation that the unsafe secret pattern will not be reused.",
            "Paste `checkout:latest`, digest, promotion artifact, and rollback artifact evidence.",
            "Paste every place `API_TOKEN` appears and the blank runtime user evidence.",
            "Paste the runtime image bloat evidence, including copied source/build files and base image risk.",
            "Write the hardening decision with required Dockerfile, SBOM, scan, non-root, and owner actions.",
            "Capture promotion note, validation output, digest/rollback requirements, and evidence to save.",
        ],
        "rubric": [
            "Preserves the captured-evidence safety boundary and avoids reusing the secret pattern.",
            "Captures `checkout:latest` tag-only promotion, missing RepoDigests, and rollback artifact gaps.",
            "Finds secret leakage in Dockerfile, inspect metadata, and layer history plus blank runtime user.",
            "Explains runtime bloat and root-runtime risk with source/build-copy evidence.",
            "Blocks promotion with required digest, SBOM, scan, non-root runtime, and owner actions.",
            "Saves promotion note, validation output, digest, rollback, and cleanup/no-runtime evidence.",
        ],
        "validation_checks": [
            "Captured-evidence safety boundary recorded",
            "Docker supply-chain analysis passed output captured",
            "Tag and missing digest evidence captured",
            "Secret leakage evidence captured",
            "Blank runtime user and image bloat evidence captured",
            "Hardening decision and owner actions written",
            "Promotion/rollback evidence requirements recorded",
            "Validation output and saved evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["Dockerfile", "image-inspect.json", "history.txt", "secret pattern", "reviewer"],
            ["checkout:latest", "RepoDigests", "rollback digest", "promotion artifact", "Docker supply-chain analysis passed"],
            ["API_TOKEN=do-not-bake-secrets", "Dockerfile", "image config", "history", "\"User\": \"\""],
            ["COPY --from=build /app .", "node:22", "root", "source tree", "runtime"],
            ["Block promotion", "digest", "SBOM", "scan", "non-root", "owner"],
            ["promotion-note.md", "validate", "rollback digest", "cleanup", "no-runtime"],
        ],
    },
    "design-safe-release-pipeline": {
        "worksheet_prompts": [
            "Record the unsafe workflow, checklist, reviewer, and confirmation that no real CI runner, registry, or cluster is being changed.",
            "Paste `deploy-prod`, `github.ref == 'refs/heads/main'`, direct Helm production deployment, and missing digest-promotion evidence.",
            "Paste the missing gate evidence and the required `image-digest.txt`, `trivy image`, SBOM, render, schema, and policy gates.",
            "Paste `deploy-staging`, smoke test, `environment: production`, canary, and approval boundary evidence.",
            "Write the release decision, owner split, rollback artifact, and `rollback-if-slo-breach` trigger.",
            "Capture validation output, safe pipeline excerpts, decision record, and evidence template contents to save.",
        ],
        "rubric": [
            "Preserves the no-live-CI safety boundary and names the reviewed pipeline artifacts.",
            "Blocks `deploy-prod` from `main` and explains why tag-only promotion is weaker than digest promotion.",
            "Requires `image-digest.txt`, `trivy image`, SBOM, manifest render, `kubeconform`, and policy evidence before deployment.",
            "Requires `deploy-staging`, smoke tests, `environment: production`, approval, and canary rollout before production.",
            "Defines owner split, rollback artifact, and `rollback-if-slo-breach` criteria for production.",
            "Saves safe-pipeline excerpts, decision record, validation output, and cleanup/no-runtime evidence.",
        ],
        "validation_checks": [
            "No-live-CI safety boundary recorded",
            "Safe release pipeline analysis passed output captured",
            "Direct main-to-production deploy evidence captured",
            "Digest-promotion gap captured",
            "Scan/SBOM/render/schema/policy gates captured",
            "Staging, smoke, approval, and canary evidence captured",
            "Rollback-if-SLO-breach decision recorded",
            "Validation output and saved evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["pipeline.yaml", "release-checklist.md", "no real CI", "registry", "cluster"],
            [
                "deploy-prod",
                "github.ref == 'refs/heads/main'",
                "helm upgrade --install",
                "missing digest promotion",
                "Safe release pipeline analysis passed",
            ],
            ["image-digest.txt", "trivy image", "syft", "helm template", "kubeconform", "conftest test"],
            ["deploy-staging", "smoke.sh", "environment: production", "rollout.strategy=canary", "approval"],
            ["rollback-if-slo-breach", "rollback", "owner", "SLO", "production"],
            ["safe-pipeline.yaml", "decision-record.md", "validate", "evidence-template.md", "no-runtime"],
        ],
    },
    "create-platform-golden-path": {
        "worksheet_prompts": [
            "Record the service-template, catalog metadata, reviewer, and confirmation that no template engine or cluster is required.",
            "Paste required inputs, generated artifacts, secure runtime defaults, first-run flow, and production readiness gates.",
            "Paste missing `pagerduty.com/service-id`, missing SLO dashboard, runbook, cost center, and concrete owner evidence.",
            "Explain why incomplete ownership metadata blocks production onboarding.",
            "Write the ready template decision with adoption metrics, reliability metrics, and launch-validation owners.",
            "Capture fixed catalog diff, decision record, validation output, cleanup, and no-runtime evidence.",
        ],
        "rubric": [
            "Preserves the file-review safety boundary and names the template and catalog artifacts.",
            "Captures required inputs, generated artifacts, secure defaults, first-run flow, and readiness gates.",
            "Identifies missing pager, missing SLO dashboard, runbook, cost center, and concrete owner metadata.",
            "Blocks production onboarding until ownership and observability metadata are complete.",
            "Defines adoption metrics, reliability metrics, launch gates, and owner validation.",
            "Saves fixed catalog diff, decision record, validation output, cleanup, and no-runtime evidence.",
        ],
        "validation_checks": [
            "No-runtime template review boundary recorded",
            "Required inputs and generated artifacts captured",
            "Secure defaults and launch gates captured",
            "Missing pager and SLO dashboard evidence captured",
            "Ownership, runbook, and cost metadata captured",
            "Adoption/reliability metrics and decision recorded",
            "Validation output and cleanup/no-runtime evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["service-template.md", "catalog-info.yaml", "no template engine", "no cluster"],
            ["Required Inputs", "Generated artifacts", "Run as non-root", "Production readiness review"],
            ["pagerduty.com/service-id: missing", "platform.example.com/slo-dashboard: missing", "runbook", "cost_center"],
            ["Block the starting service template", "production onboarding", "ownership metadata"],
            ["Adoption Metrics", "reliability metrics", "launch gates", "owner"],
            ["fixed-catalog-info.yaml", "decision-record.md", "validate", "evidence-template.md", "no-runtime"],
        ],
    },
    "audit-eks-cost-drivers": {
        "worksheet_prompts": [
            "Record the usage, service, storage, and recommendation files plus confirmation that no AWS or cluster deletion is being made.",
            "Paste over-requested workload rows, unknown-owner rows, and request-versus-usage evidence.",
            "Paste abandoned LoadBalancer, abandoned PVC, estimated monthly cost, and architecture-review evidence.",
            "Rank quick wins versus architecture changes with reliability risk and ownership confidence.",
            "Write recommendations with owner, expected savings, rollback, and review cadence.",
            "Capture recommendations table, validation output, cleanup, and no-AWS evidence note.",
        ],
        "rubric": [
            "Preserves the no-delete/no-AWS safety boundary and names the local cost evidence files.",
            "Captures over-requested workloads, unknown owners, and usage/request ratio evidence.",
            "Captures abandoned LoadBalancer, abandoned PVC, expected cost, and architecture-review items.",
            "Separates quick wins from architecture changes and avoids deletion without owner confirmation.",
            "Assigns owner, expected savings, reliability risk, rollback, and review cadence.",
            "Saves recommendations, validation output, cleanup, and no-AWS evidence.",
        ],
        "validation_checks": [
            "No-delete/no-AWS safety boundary recorded",
            "EKS cost driver analysis passed output captured",
            "Compute over-request evidence captured",
            "Unknown owner evidence captured",
            "Abandoned LoadBalancer and PVC evidence captured",
            "Quick-win monthly exposure and architecture-review items separated",
            "Owner, savings, risk, rollback, and cadence recorded",
            "Validation output and cleanup/no-AWS evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["usage.csv", "services.txt", "storage.txt", "no AWS", "no delete"],
            [
                "payments,checkout,6000,900",
                "payments,worker,4000,350",
                "default,load-test,3000,0",
                "EKS cost driver analysis passed",
                "Compute right-size candidates",
                "Quick-win monthly exposure",
            ],
            ["abandoned-demo", "abandoned-cache", "Expected Savings", "architecture review"],
            ["quick wins", "Reliability Risk", "owner confirmation", "delete"],
            ["Expected Savings", "Restore previous requests", "Weekly: unknown owner", "rollback"],
            ["recommendations.md", "validate", "cleanup", "evidence-template.md", "no-AWS"],
        ],
    },
    "build-platform-career-proof-pack": {
        "worksheet_prompts": [
            "Record the job-skill packet, evidence inventory, README template, and public-safe redaction boundary.",
            "Paste repeated target skills and the platform domains covered by the selected lab evidence.",
            "Paste selected lab artifacts, command/validator proof, decision evidence, rollback evidence, and missing proof.",
            "Write one portfolio proof section with problem, environment, commands, decision, validation, and talking points.",
            "Write resume bullets and STAR stories tied to incident response, security, cost, and release safety evidence.",
            "Capture validation output and list every claim that still needs screenshots, diagrams, or stronger evidence.",
        ],
        "rubric": [
            "Preserves the public-safe evidence boundary and avoids secrets, customer data, or private identifiers.",
            "Maps repeated target skills to concrete Platform Academy lab artifacts and domains.",
            "Cites commands, validators, decisions, rollback notes, and missing proof instead of broad claims.",
            "Completes a portfolio README proof section with problem, environment, command, decision, validation, and rollback.",
            "Writes resume bullets and STAR stories tied to incident response, security, cost, and release safety.",
            "Saves validation output and flags claims that need stronger screenshots, diagrams, or redaction.",
        ],
        "validation_checks": [
            "Public-safe redaction boundary recorded",
            "Repeated target skills captured",
            "Lab artifacts and validators mapped",
            "Portfolio proof README completed",
            "Resume bullets written with action/scope/impact",
            "STAR stories written for incident/security/cost/release",
            "Validation output and missing-proof evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["job-skills.txt", "evidence-inventory.md", "public", "redaction"],
            ["Kubernetes, Terraform, AWS, CI/CD", "EKS, Helm, ArgoCD", "Docker, supply chain"],
            ["Candidate artifacts", "Missing proof to collect", "verify-full-labs.sh", "Rollback"],
            ["completed-proof-readme.md", "Problem", "Environment", "Interview Talking Points"],
            ["resume-bullets.md", "star-stories.md", "Incident Response", "Security", "Cost", "Release Safety"],
            ["validate", "screenshots", "diagrams", "evidence-template.md", "stronger evidence"],
        ],
    },
    "write-slo-backed-runbook": {
        "worksheet_prompts": [
            "Record the alert/signal packet, service, reviewer, and confirmation that no live rollback command was run.",
            "Paste the 99.9% SLO target, CheckoutHighErrorBudgetBurn alert, 2% threshold, 14-minute duration, dashboard, and user impact.",
            "Paste revision 43 rollout timing, readiness flapping, target-health symptoms, and dependency evidence still needed.",
            "Write safe first commands plus rollback, traffic-shift, and escalation criteria.",
            "Write the mitigation decision, follow-up owners, dashboard/runbook improvements, and validation signals.",
            "Capture validation output and the alert, rollout, event, decision, and post-mitigation evidence you would save.",
        ],
        "rubric": [
            "Preserves the no-live-rollback safety boundary and names the SLO signal packet.",
            "Captures 99.9% availability, CheckoutHighErrorBudgetBurn, 2% 5xx threshold, and 14-minute burn evidence.",
            "Connects revision 43, readiness flapping, and target-health symptoms without skipping dependency checks.",
            "Defines read-only first commands and rollback/traffic-shift/escalation criteria before mitigation.",
            "Assigns Incident commander, app, platform, SRE, and dependency owners with validation and follow-up actions.",
            "Saves runbook, incident decision, validation output, dashboard link, and cleanup/no-runtime evidence.",
        ],
        "validation_checks": [
            "No-live-rollback safety boundary recorded",
            "SLO target and burn alert evidence captured",
            "Revision 43 and symptom evidence captured",
            "Safe first commands and mitigation criteria written",
            "Owner split and follow-up actions recorded",
            "Validation signals documented",
            "Saved evidence and cleanup/no-runtime note recorded",
        ],
        "rubric_evidence_terms": [
            ["no live rollback", "signals.md", "CheckoutHighErrorBudgetBurn", "reviewer"],
            ["99.9%", "CheckoutHighErrorBudgetBurn", "2% 5xx", "14 minutes", "dashboard"],
            ["revision 43", "readiness flapping", "target group unhealthy", "dependency", "rollout"],
            ["kubectl rollout history", "read-only", "rollback", "traffic", "escalation"],
            ["Incident commander", "App owner", "Platform owner", "SRE owner", "validation"],
            ["completed-runbook.md", "incident-decision.md", "validate", "dashboard", "cleanup"],
        ],
    },
    "design-opentelemetry-signal-path": {
        "worksheet_prompts": [
            "Record the collector manifest, log packet, Prometheus rule, simulator command, and confirmation that no live backend is changed.",
            "Paste the `http.request.header.authorization` deletion evidence and why it must remain.",
            "Paste the log line with a trace ID, the `trace_id=missing` line, app instrumentation owner, and validation signal.",
            "Paste the `customer_email` alert grouping evidence and explain the cardinality/privacy risk.",
            "Write the safer aggregation, owner map, dashboard/runbook handoff, and privacy decision.",
            "Capture simulator output, validation output, safe rule evidence, and saved artifacts.",
        ],
        "rubric": [
            "Preserves the no-live-telemetry-change safety boundary and names the reviewed artifacts.",
            "Keeps `http.request.header.authorization` deletion as a required collector privacy control.",
            "Captures trace context evidence, including a valid trace ID and `trace_id=missing` gap.",
            "Identifies `customer_email` as high-cardinality and sensitive alert-grouping evidence.",
            "Defines route-only aggregation plus app, telemetry, SRE, and data/privacy owners.",
            "Saves signal-path decision, safe rule, simulator output, validation output, and cleanup/no-runtime evidence.",
        ],
        "validation_checks": [
            "No-live-telemetry-change safety boundary recorded",
            "Sensitive header deletion evidence captured",
            "Trace context gap evidence captured",
            "Customer email cardinality evidence captured",
            "Safer aggregation and owner map written",
            "Simulator and validation output captured",
            "Saved evidence and cleanup/no-runtime note recorded",
        ],
        "rubric_evidence_terms": [
            ["collector.yaml", "checkout-logs.txt", "prometheus-rule.yaml", "simulator", "no live backend"],
            ["http.request.header.authorization", "action: delete", "collector", "privacy"],
            ["trace_id=missing", "trace_id=", "App owner", "propagate trace context", "logs"],
            ["customer_email", "cardinality", "privacy", "alert grouping", "histogram_quantile"],
            ["sum by (le, route)", "Owner Map", "SRE owner", "Data/privacy owner", "dashboard"],
            ["signal-path-decision.md", "safe-prometheus-rule.yaml", "simulator", "validate", "cleanup"],
        ],
    },
    "run-incident-commander-tabletop": {
        "worksheet_prompts": [
            "Record the signal packet, facilitator, next update clock, and confirmation that no live mitigation was executed.",
            "Paste SEV-2, checkout 5xx rate change, user impact, affected capability, and decision pressure.",
            "Assign Incident commander, Operations lead, Communications lead, Planning lead, and escalation owner.",
            "Write the suspect rollout, rollback option, current mitigation status, decision criterion, and stakeholder update time.",
            "Add timeline entries with evidence, decision, and owner for each major event.",
            "Capture commander brief, completed timeline, validation output, and follow-up evidence to save.",
        ],
        "rubric": [
            "Preserves the tabletop/no-live-mitigation safety boundary and names the update clock.",
            "Captures SEV-2, 0.2% to 9.4% 5xx increase, payment-confirmation impact, and decision pressure.",
            "Assigns Incident commander, Operations lead, Communications lead, Planning lead, and escalation roles before mitigation.",
            "Defines revision 43 rollback criteria, revision 42 option, mitigation status, and stakeholder update timing.",
            "Records timeline entries with evidence, decisions, owners, and communications handoff.",
            "Saves commander brief, completed timeline, validation output, and cleanup/no-runtime evidence.",
        ],
        "validation_checks": [
            "No-live-mitigation safety boundary recorded",
            "Severity and user impact evidence captured",
            "Incident roles assigned",
            "Rollback criteria and update clock written",
            "Timeline entries with evidence and owners recorded",
            "Communications lead handoff documented",
            "Validation output and saved evidence recorded",
        ],
        "rubric_evidence_terms": [
            ["signals.md", "tabletop", "no live mitigation", "15 minutes", "update clock"],
            ["SEV-2", "0.2%", "9.4%", "payment confirmation", "decision pressure"],
            ["Incident commander", "Operations lead", "Communications lead", "Planning lead", "escalation"],
            ["revision 43", "revision 42", "rollback", "mitigation pending", "stakeholder update"],
            ["timeline", "evidence", "decision", "owner", "communications"],
            ["commander-brief.md", "completed-timeline.md", "validate", "cleanup", "no-runtime"],
        ],
    },
}

LAB_ARTIFACT_PATHS = {
    "trace-service-to-pod": [
        "labs/platform-academy/trace-service-to-pod/README.md",
        "labs/platform-academy/trace-service-to-pod/start.yaml",
        "labs/platform-academy/trace-service-to-pod/fixed.yaml",
        "labs/platform-academy/trace-service-to-pod/broken-evidence.txt",
        "labs/platform-academy/trace-service-to-pod/evidence-template.md",
        "labs/platform-academy/lib/cluster-safety.sh",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/trace-service-to-pod/setup.sh",
        "labs/platform-academy/trace-service-to-pod/validate.sh",
        "labs/platform-academy/trace-service-to-pod/cleanup.sh",
        "labs/platform-academy/trace-service-to-pod/solution.md",
    ],
    "debug-crashloop-imagepull": [
        "labs/platform-academy/debug-crashloop-imagepull/README.md",
        "labs/platform-academy/debug-crashloop-imagepull/start.yaml",
        "labs/platform-academy/debug-crashloop-imagepull/fixed.yaml",
        "labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt",
        "labs/platform-academy/debug-crashloop-imagepull/evidence-template.md",
        "labs/platform-academy/lib/cluster-safety.sh",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/debug-crashloop-imagepull/setup.sh",
        "labs/platform-academy/debug-crashloop-imagepull/validate.sh",
        "labs/platform-academy/debug-crashloop-imagepull/cleanup.sh",
        "labs/platform-academy/debug-crashloop-imagepull/solution.md",
    ],
    "review-yaml-before-apply": [
        "labs/platform-academy/review-yaml-before-apply/README.md",
        "labs/platform-academy/review-yaml-before-apply/vendor.yaml",
        "labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml",
        "labs/platform-academy/review-yaml-before-apply/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/review-yaml-before-apply/validate.sh",
        "labs/platform-academy/review-yaml-before-apply/cleanup.sh",
        "labs/platform-academy/review-yaml-before-apply/solution.md",
    ],
    "diagnose-eks-ip-exhaustion": [
        "labs/platform-academy/diagnose-eks-ip-exhaustion/README.md",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/cleanup.sh",
        "labs/platform-academy/diagnose-eks-ip-exhaustion/solution.md",
    ],
    "validate-helm-release-artifact": [
        "labs/platform-academy/validate-helm-release-artifact/README.md",
        "labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml",
        "labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml",
        "labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml",
        "labs/platform-academy/validate-helm-release-artifact/review-notes.md",
        "labs/platform-academy/validate-helm-release-artifact/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/validate-helm-release-artifact/validate.sh",
        "labs/platform-academy/validate-helm-release-artifact/cleanup.sh",
        "labs/platform-academy/validate-helm-release-artifact/solution.md",
    ],
    "trace-argocd-drift": [
        "labs/platform-academy/trace-argocd-drift/README.md",
        "labs/platform-academy/trace-argocd-drift/argocd-app-report.txt",
        "labs/platform-academy/trace-argocd-drift/desired.yaml",
        "labs/platform-academy/trace-argocd-drift/live.yaml",
        "labs/platform-academy/trace-argocd-drift/ignore-differences.yaml",
        "labs/platform-academy/trace-argocd-drift/ownership-decision.md",
        "labs/platform-academy/trace-argocd-drift/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/trace-argocd-drift/drift_analyzer.py",
        "labs/platform-academy/trace-argocd-drift/setup.sh",
        "labs/platform-academy/trace-argocd-drift/validate.sh",
        "labs/platform-academy/trace-argocd-drift/cleanup.sh",
        "labs/platform-academy/trace-argocd-drift/solution.md",
    ],
    "design-production-eks-review": [
        "labs/platform-academy/design-production-eks-review/README.md",
        "labs/platform-academy/design-production-eks-review/cluster-review.md",
        "labs/platform-academy/design-production-eks-review/launch-review.md",
        "labs/platform-academy/design-production-eks-review/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/design-production-eks-review/validate.sh",
        "labs/platform-academy/design-production-eks-review/cleanup.sh",
        "labs/platform-academy/design-production-eks-review/solution.md",
    ],
    "audit-tenant-boundaries": [
        "labs/platform-academy/audit-tenant-boundaries/README.md",
        "labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml",
        "labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml",
        "labs/platform-academy/audit-tenant-boundaries/review.md",
        "labs/platform-academy/audit-tenant-boundaries/evidence-template.md",
        "labs/platform-academy/lib/cluster-safety.sh",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/audit-tenant-boundaries/setup.sh",
        "labs/platform-academy/audit-tenant-boundaries/validate.sh",
        "labs/platform-academy/audit-tenant-boundaries/cleanup.sh",
        "labs/platform-academy/audit-tenant-boundaries/solution.md",
    ],
    "write-slo-backed-runbook": [
        "labs/platform-academy/write-slo-backed-runbook/README.md",
        "labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml",
        "labs/platform-academy/write-slo-backed-runbook/signals.md",
        "labs/platform-academy/write-slo-backed-runbook/runbook-template.md",
        "labs/platform-academy/write-slo-backed-runbook/completed-runbook.md",
        "labs/platform-academy/write-slo-backed-runbook/incident-decision.md",
        "labs/platform-academy/write-slo-backed-runbook/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/write-slo-backed-runbook/validate.sh",
        "labs/platform-academy/write-slo-backed-runbook/cleanup.sh",
        "labs/platform-academy/write-slo-backed-runbook/solution.md",
    ],
    "inspect-linux-failure-evidence": [
        "labs/platform-academy/inspect-linux-failure-evidence/README.md",
        "labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt",
        "labs/platform-academy/inspect-linux-failure-evidence/previous.log",
        "labs/platform-academy/inspect-linux-failure-evidence/id-output.txt",
        "labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md",
        "labs/platform-academy/inspect-linux-failure-evidence/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/inspect-linux-failure-evidence/validate.sh",
        "labs/platform-academy/inspect-linux-failure-evidence/cleanup.sh",
        "labs/platform-academy/inspect-linux-failure-evidence/solution.md",
    ],
    "trace-network-path": [
        "labs/platform-academy/trace-network-path/README.md",
        "labs/platform-academy/trace-network-path/incident-handoff.md",
        "labs/platform-academy/trace-network-path/network-evidence.md",
        "labs/platform-academy/trace-network-path/ingress-service.yaml",
        "labs/platform-academy/trace-network-path/fixed-ingress-service.yaml",
        "labs/platform-academy/trace-network-path/evidence-template.md",
        "labs/platform-academy/lib/cluster-safety.sh",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/trace-network-path/setup.sh",
        "labs/platform-academy/trace-network-path/validate.sh",
        "labs/platform-academy/trace-network-path/cleanup.sh",
        "labs/platform-academy/trace-network-path/solution.md",
    ],
    "review-terraform-eks-plan": [
        "labs/platform-academy/review-terraform-eks-plan/README.md",
        "labs/platform-academy/review-terraform-eks-plan/tfplan.txt",
        "labs/platform-academy/review-terraform-eks-plan/review.md",
        "labs/platform-academy/review-terraform-eks-plan/decision-record.md",
        "labs/platform-academy/review-terraform-eks-plan/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py",
        "labs/platform-academy/review-terraform-eks-plan/setup.sh",
        "labs/platform-academy/review-terraform-eks-plan/validate.sh",
        "labs/platform-academy/review-terraform-eks-plan/cleanup.sh",
        "labs/platform-academy/review-terraform-eks-plan/solution.md",
    ],
    "debug-irsa-access-denied": [
        "labs/platform-academy/debug-irsa-access-denied/README.md",
        "labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml",
        "labs/platform-academy/debug-irsa-access-denied/workload-error.log",
        "labs/platform-academy/debug-irsa-access-denied/trust-policy.json",
        "labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json",
        "labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json",
        "labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json",
        "labs/platform-academy/debug-irsa-access-denied/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py",
        "labs/platform-academy/debug-irsa-access-denied/setup.sh",
        "labs/platform-academy/debug-irsa-access-denied/validate.sh",
        "labs/platform-academy/debug-irsa-access-denied/cleanup.sh",
        "labs/platform-academy/debug-irsa-access-denied/solution.md",
    ],
    "design-safe-release-pipeline": [
        "labs/platform-academy/design-safe-release-pipeline/README.md",
        "labs/platform-academy/design-safe-release-pipeline/pipeline.yaml",
        "labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml",
        "labs/platform-academy/design-safe-release-pipeline/release-checklist.md",
        "labs/platform-academy/design-safe-release-pipeline/decision-record.md",
        "labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py",
        "labs/platform-academy/design-safe-release-pipeline/setup.sh",
        "labs/platform-academy/design-safe-release-pipeline/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/design-safe-release-pipeline/validate.sh",
        "labs/platform-academy/design-safe-release-pipeline/cleanup.sh",
        "labs/platform-academy/design-safe-release-pipeline/solution.md",
    ],
    "create-platform-golden-path": [
        "labs/platform-academy/create-platform-golden-path/README.md",
        "labs/platform-academy/create-platform-golden-path/service-template.md",
        "labs/platform-academy/create-platform-golden-path/ready-service-template.md",
        "labs/platform-academy/create-platform-golden-path/catalog-info.yaml",
        "labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml",
        "labs/platform-academy/create-platform-golden-path/decision-record.md",
        "labs/platform-academy/create-platform-golden-path/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/create-platform-golden-path/validate.sh",
        "labs/platform-academy/create-platform-golden-path/cleanup.sh",
        "labs/platform-academy/create-platform-golden-path/solution.md",
    ],
    "review-docker-image-supply-chain": [
        "labs/platform-academy/review-docker-image-supply-chain/README.md",
        "labs/platform-academy/review-docker-image-supply-chain/Dockerfile",
        "labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile",
        "labs/platform-academy/review-docker-image-supply-chain/image-inspect.json",
        "labs/platform-academy/review-docker-image-supply-chain/history.txt",
        "labs/platform-academy/review-docker-image-supply-chain/promotion-note.md",
        "labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py",
        "labs/platform-academy/review-docker-image-supply-chain/setup.sh",
        "labs/platform-academy/review-docker-image-supply-chain/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/review-docker-image-supply-chain/validate.sh",
        "labs/platform-academy/review-docker-image-supply-chain/cleanup.sh",
        "labs/platform-academy/review-docker-image-supply-chain/solution.md",
    ],
    "debug-aws-alb-health-path": [
        "labs/platform-academy/debug-aws-alb-health-path/README.md",
        "labs/platform-academy/debug-aws-alb-health-path/target-health.json",
        "labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml",
        "labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml",
        "labs/platform-academy/debug-aws-alb-health-path/events.txt",
        "labs/platform-academy/debug-aws-alb-health-path/evidence-template.md",
        "labs/platform-academy/lib/cluster-safety.sh",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/debug-aws-alb-health-path/setup.sh",
        "labs/platform-academy/debug-aws-alb-health-path/validate.sh",
        "labs/platform-academy/debug-aws-alb-health-path/cleanup.sh",
        "labs/platform-academy/debug-aws-alb-health-path/solution.md",
    ],
    "design-opentelemetry-signal-path": [
        "labs/platform-academy/design-opentelemetry-signal-path/README.md",
        "labs/platform-academy/simulator.py",
        "labs/platform-academy/design-opentelemetry-signal-path/collector.yaml",
        "labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt",
        "labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml",
        "labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml",
        "labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md",
        "labs/platform-academy/design-opentelemetry-signal-path/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/design-opentelemetry-signal-path/validate.sh",
        "labs/platform-academy/design-opentelemetry-signal-path/cleanup.sh",
        "labs/platform-academy/design-opentelemetry-signal-path/solution.md",
    ],
    "run-incident-commander-tabletop": [
        "labs/platform-academy/run-incident-commander-tabletop/README.md",
        "labs/platform-academy/simulator.py",
        "labs/platform-academy/run-incident-commander-tabletop/signals.md",
        "labs/platform-academy/run-incident-commander-tabletop/roles.md",
        "labs/platform-academy/run-incident-commander-tabletop/timeline.md",
        "labs/platform-academy/run-incident-commander-tabletop/commander-brief.md",
        "labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md",
        "labs/platform-academy/run-incident-commander-tabletop/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/run-incident-commander-tabletop/validate.sh",
        "labs/platform-academy/run-incident-commander-tabletop/cleanup.sh",
        "labs/platform-academy/run-incident-commander-tabletop/solution.md",
    ],
    "audit-eks-cost-drivers": [
        "labs/platform-academy/audit-eks-cost-drivers/README.md",
        "labs/platform-academy/audit-eks-cost-drivers/usage.csv",
        "labs/platform-academy/audit-eks-cost-drivers/services.txt",
        "labs/platform-academy/audit-eks-cost-drivers/storage.txt",
        "labs/platform-academy/audit-eks-cost-drivers/recommendations.md",
        "labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py",
        "labs/platform-academy/audit-eks-cost-drivers/setup.sh",
        "labs/platform-academy/audit-eks-cost-drivers/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/audit-eks-cost-drivers/validate.sh",
        "labs/platform-academy/audit-eks-cost-drivers/cleanup.sh",
        "labs/platform-academy/audit-eks-cost-drivers/solution.md",
    ],
    "build-platform-career-proof-pack": [
        "labs/platform-academy/build-platform-career-proof-pack/README.md",
        "labs/platform-academy/build-platform-career-proof-pack/job-skills.txt",
        "labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md",
        "labs/platform-academy/build-platform-career-proof-pack/readme-template.md",
        "labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md",
        "labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md",
        "labs/platform-academy/build-platform-career-proof-pack/star-stories.md",
        "labs/platform-academy/build-platform-career-proof-pack/evidence-template.md",
        "labs/platform-academy/lib/evidence-check.sh",
        "labs/platform-academy/build-platform-career-proof-pack/validate.sh",
        "labs/platform-academy/build-platform-career-proof-pack/cleanup.sh",
        "labs/platform-academy/build-platform-career-proof-pack/solution.md",
    ],
}

FULL_LAB_SLUGS = {
    "trace-service-to-pod",
    "debug-crashloop-imagepull",
    "review-yaml-before-apply",
    "validate-helm-release-artifact",
    "trace-argocd-drift",
    "review-terraform-eks-plan",
    "debug-irsa-access-denied",
    "debug-aws-alb-health-path",
    "trace-network-path",
    "audit-tenant-boundaries",
    "design-safe-release-pipeline",
    "create-platform-golden-path",
    "review-docker-image-supply-chain",
    "build-platform-career-proof-pack",
    "diagnose-eks-ip-exhaustion",
    "write-slo-backed-runbook",
    "design-production-eks-review",
    "inspect-linux-failure-evidence",
    "design-opentelemetry-signal-path",
    "run-incident-commander-tabletop",
    "audit-eks-cost-drivers",
}

PORTFOLIO_LAB_SLUGS = {
    "trace-service-to-pod",
    "debug-crashloop-imagepull",
    "trace-network-path",
    "debug-irsa-access-denied",
    "trace-argocd-drift",
    "design-safe-release-pipeline",
    "write-slo-backed-runbook",
}

PORTFOLIO_LAB_FOCUS = {
    "trace-service-to-pod": "Kubernetes Service routing",
    "debug-crashloop-imagepull": "Pod failure classification",
    "trace-network-path": "HTTP path diagnosis",
    "debug-irsa-access-denied": "EKS workload identity",
    "trace-argocd-drift": "GitOps ownership decisions",
    "design-safe-release-pipeline": "production release safety",
    "write-slo-backed-runbook": "SLO-backed incident response",
}

EVIDENCE_PACK_LAB_SLUGS: set[str] = set()

for lab in PLATFORM_LABS:
    runnable_update = RUNNABLE_LAB_UPDATES.get(lab["slug"])
    if runnable_update:
        lab.update(runnable_update)
    deepened_update = DEEPENED_LAB_UPDATES.get(lab["slug"])
    if deepened_update:
        lab.update(deepened_update)
    if lab["slug"] in FULL_LAB_SLUGS:
        lab["lab_tier"] = "full"
        setup_command = f"bash labs/platform-academy/run-lab.sh setup {lab['slug']}"
        existing_setup_commands = lab.get("setup_commands", [])
        if not any(setup_command in command for command in existing_setup_commands):
            lab["setup_commands"] = [setup_command, *existing_setup_commands]
    elif lab["slug"] in EVIDENCE_PACK_LAB_SLUGS:
        lab["lab_tier"] = "evidence-pack"
    else:
        lab["lab_tier"] = "guided"
    lab["portfolio_grade"] = lab["slug"] in PORTFOLIO_LAB_SLUGS
    lab["portfolio_focus"] = PORTFOLIO_LAB_FOCUS.get(lab["slug"], "")
    lab["artifact_paths"] = LAB_ARTIFACT_PATHS.get(lab["slug"], [])
    lab.setdefault("worksheet_prompts", [
        f"Starting state: {lab['scenario']}",
        "Which command output or file excerpt proves the failure mode?",
        "What is the smallest safe action, design decision, or escalation?",
        "What evidence will you save for a review, portfolio note, or incident handoff?",
    ])
    lab.setdefault("rubric", [
        "Names the starting state, scope, and safety boundary before acting.",
        "Captures specific evidence before changing live state or approving a design.",
        "Explains the decision with owner, risk, validation, and rollback or fallback.",
        "Completes validation and cleanup, or documents why the no-cluster path was used.",
    ])
    lab.setdefault("validation_checks", [
        "Prerequisites reviewed",
        "Setup or evidence pack opened",
        "Expected evidence captured",
        "Validation command or review check completed",
        "Cleanup or no-cluster fallback documented",
    ])


RESOURCE_TYPE_BLUEPRINTS = [
    ("cheatsheet", "Compact command/reference sheet", 20),
    ("runbook", "Incident-ready diagnosis and mitigation procedure", 35),
    ("lab worksheet", "Hands-on practice worksheet with evidence prompts", 45),
    ("project brief", "Portfolio project brief with acceptance criteria", 60),
    ("interview prep", "Scenario questions and senior-level answer rubric", 30),
    ("official reference", "Curated official docs reading path", 25),
    ("architecture diagram", "Diagram prompt and review checklist", 40),
    ("template", "Reusable starter artifact or review template", 30),
    ("assessment", "Self-check quiz and practical grading rubric", 35),
    ("troubleshooting guide", "Symptom-to-signal debugging map", 40),
    ("decision record", "Architecture decision record with options and consequences", 35),
    ("production readiness checklist", "Launch-readiness checklist for reliability, security, and support", 45),
    ("failure mode drill", "Guided failure scenario with diagnosis and rollback criteria", 50),
    ("security review", "Threat-model and least-privilege review workbook", 50),
    ("cost review", "Cost, capacity, and ownership review worksheet", 45),
    ("portfolio artifact", "Portfolio-ready evidence builder with narrative prompts", 55),
]

RESOURCE_TYPE_PROFILES = {
    "cheatsheet": {
        "title_template": "{domain} Field Cheatsheet",
        "summary_template": "A compact operator map for {domain}: commands, object relationships, evidence to capture, and the traps that turn quick fixes into production risk.",
        "outcomes": [
            "Choose the first safe read-only checks before touching a live system.",
            "Name the high-risk fields, ownership boundaries, and rollback signals for this domain.",
            "Convert command output into a short evidence note someone else can review.",
        ],
        "study_tasks": [
            "Build a one-page quick-reference table: symptom, command, evidence, likely owner, and escalation path.",
            "Mark every command as local-safe, read-only production, sandbox mutation, or production mutation.",
            "Add one real screenshot or terminal capture to a portfolio note and explain why it matters.",
        ],
        "next_steps": [
            "Use the related lab to validate every command against a controlled scenario.",
            "Turn the cheatsheet into a pinned incident-room note with owners and unsafe actions called out.",
        ],
        "artifacts": ["field command map", "symptom-to-evidence table", "safe action legend"],
        "commands": ["# Start with read-only evidence, then decide whether mutation is justified.", "{command}"],
        "interview_prompts": [
            "Which command would you run first, and what answer would make you stop?",
            "What evidence would convince you the issue belongs outside this domain?",
        ],
    },
    "runbook": {
        "title_template": "{domain} Production Runbook",
        "summary_template": "An incident-ready procedure for {domain} with triage, blast-radius checks, mitigation choices, escalation notes, and post-incident follow-up.",
        "outcomes": [
            "Separate diagnosis, mitigation, recovery, and learning so responders do not mix goals.",
            "Capture customer impact, system state, owner, and rollback evidence before proposing changes.",
            "Write a runbook that a teammate can execute under pressure without guessing intent.",
        ],
        "study_tasks": [
            "Draft severity triggers, first five checks, mitigation options, rollback checks, and escalation owners.",
            "Add a 'do not do this first' section for risky commands or irreversible changes.",
            "Run a tabletop drill and record where the runbook was ambiguous.",
        ],
        "next_steps": [
            "Pair the runbook with alert links, dashboards, logs, and the related lab.",
            "Schedule a quarterly review so commands, owners, and dashboards do not drift.",
        ],
        "artifacts": ["incident runbook", "mitigation decision tree", "post-incident action register"],
        "commands": ["# Incident evidence baseline", "{command}", "# Record timeline entries as facts change."],
        "interview_prompts": [
            "How do you decide between mitigation and root-cause investigation during an incident?",
            "What does a good runbook include that a generic wiki page usually misses?",
        ],
    },
    "lab worksheet": {
        "title_template": "{domain} Evidence Lab Worksheet",
        "summary_template": "A hands-on worksheet for practicing {domain} with scenario setup, expected observations, evidence prompts, and grading criteria.",
        "outcomes": [
            "Practice a realistic failure without relying on production access.",
            "Collect proof in a repeatable order and explain each observation.",
            "Produce a lab note that shows thinking, not just successful commands.",
        ],
        "study_tasks": [
            "Write the scenario, starting state, constraints, commands, expected evidence, and cleanup steps.",
            "Capture one misleading signal and explain how you ruled it out.",
            "Score the lab using evidence quality, safety, speed, and explanation clarity.",
        ],
        "next_steps": [
            "Repeat the lab once from memory and once with a timer.",
            "Convert the worksheet into a public-safe portfolio walkthrough with sanitized output.",
        ],
        "artifacts": ["lab worksheet", "evidence transcript", "grading rubric"],
        "commands": ["# Run only in a local cluster or approved sandbox.", "{command}", "# Save observations before changing state."],
        "interview_prompts": [
            "What did the lab teach that reading alone would not?",
            "Which signal was most misleading and how did you disprove it?",
        ],
    },
    "project brief": {
        "title_template": "{domain} Portfolio Project Brief",
        "summary_template": "A scoped portfolio project for {domain} with goals, architecture, acceptance criteria, operational proof, and README prompts.",
        "outcomes": [
            "Turn study into a concrete artifact that demonstrates platform judgment.",
            "Define acceptance criteria covering reliability, security, cost, supportability, and rollback.",
            "Explain tradeoffs in a README reviewers can scan quickly.",
        ],
        "study_tasks": [
            "Write a project charter with user, problem, constraints, non-goals, and success metrics.",
            "Define the minimum demo plus one production-hardening extension.",
            "Include a 'what I would do differently in production' section.",
        ],
        "next_steps": [
            "Link the project to one course, one lab, and at least two official sources.",
            "Prepare a five-minute walkthrough that explains decisions before showing commands.",
        ],
        "artifacts": ["project README", "acceptance criteria", "demo transcript"],
        "commands": ["# Project bootstrap evidence", "{command}", "git status --short"],
        "interview_prompts": [
            "What tradeoff did you make, and what would change at production scale?",
            "How would you explain the project to a developer who only wants the paved road?",
        ],
    },
    "interview prep": {
        "title_template": "{domain} Interview Drill Packet",
        "summary_template": "A scenario-driven interview pack for {domain}: prompts, answer notes, common mistakes, follow-ups, and practice tasks grounded in official docs.",
        "outcomes": [
            "Answer with systems thinking instead of memorized definitions.",
            "Show evidence collection, blast-radius reasoning, and user-impact awareness.",
            "Recognize common mistakes that can create production risk.",
        ],
        "study_tasks": [
            "Answer five prompts aloud, then rewrite each answer with stronger evidence and tradeoffs.",
            "Add a follow-up question that tests senior judgment rather than trivia.",
            "Record one two-minute answer and remove filler until the reasoning is crisp.",
        ],
        "next_steps": [
            "Open interview prep for deeper drills in this domain.",
            "Pair each answer with a lab or project artifact you can cite as proof.",
        ],
        "artifacts": ["answer notes", "common mistake list", "practice prompt bank"],
        "commands": ["# Use this command as the evidence anchor for at least one scenario.", "{command}"],
        "interview_prompts": [
            "What is the first question you ask before proposing a fix?",
            "How do you explain the same problem to an engineer, an incident lead, and a product manager?",
        ],
    },
    "official reference": {
        "title_template": "{domain} Official Reading Path",
        "summary_template": "A curated official-source reading path for {domain}, organized by concept, operational decision, practice task, and interview-ready takeaway.",
        "outcomes": [
            "Use primary documentation as the source of truth before copying examples.",
            "Separate evergreen concepts from version-specific behavior.",
            "Turn official docs into operating checklists and design reviews.",
        ],
        "study_tasks": [
            "Read the source trail and write five operational takeaways with page links.",
            "Identify which guidance is conceptual, procedural, versioned, or safety-critical.",
            "Create flashcards for the terms you would expect in an interview or review.",
        ],
        "next_steps": [
            "Attach source links to the related lab notes so future readers can audit your reasoning.",
            "Re-review this resource after platform version upgrades or major provider changes.",
        ],
        "artifacts": ["annotated reading path", "source takeaway log", "version watchlist"],
        "commands": ["# Before implementation, open the official source trail and note current version assumptions.", "{command}"],
        "interview_prompts": [
            "Which official page would you trust for this decision, and what does it not answer?",
            "How do you keep docs-linked notes current as the platform changes?",
        ],
    },
    "architecture diagram": {
        "title_template": "{domain} Architecture Review Diagram",
        "summary_template": "A diagram brief for {domain} that maps actors, trust boundaries, network paths, ownership, failure modes, and evidence points.",
        "outcomes": [
            "Draw the system in a way that exposes risk, not just components.",
            "Make implicit ownership, data flow, and failure boundaries visible.",
            "Use the diagram as a review tool before implementation.",
        ],
        "study_tasks": [
            "Create a box-and-arrow diagram with users, control planes, data planes, secrets, and observability signals.",
            "Annotate every edge with protocol, identity, policy, and failure implication.",
            "Add a review checklist for what must be true before launch.",
        ],
        "next_steps": [
            "Use the diagram to drive a design review or mock interview system-design answer.",
            "Store the diagram next to the runbook and update it after incidents.",
        ],
        "artifacts": ["architecture diagram", "boundary legend", "review checklist"],
        "commands": ["# Validate the diagram against live or sandbox evidence.", "{command}"],
        "interview_prompts": [
            "Where is the trust boundary, and what crosses it?",
            "Which part of the diagram fails closed and which fails open?",
        ],
    },
    "template": {
        "title_template": "{domain} Operating Template",
        "summary_template": "A reusable template for {domain} reviews, launch notes, handoffs, and incident follow-up.",
        "outcomes": [
            "Standardize the information engineers need before a risky change.",
            "Reduce review fatigue by making evidence, owners, and decisions explicit.",
            "Create a reusable artifact that can live in repos or runbooks.",
        ],
        "study_tasks": [
            "Create headings for context, scope, risk, commands, evidence, rollback, owners, and source links.",
            "Pre-fill examples for one happy path and one failure path.",
            "Test the template by asking another person to find the rollback plan in under thirty seconds.",
        ],
        "next_steps": [
            "Attach the template to the related course project.",
            "Use it for one real review and tighten fields that felt vague.",
        ],
        "artifacts": ["review template", "handoff checklist", "rollback section"],
        "commands": ["# Check required template sections before reuse.", "{command}"],
        "interview_prompts": [
            "What fields must be present before you approve this change?",
            "How do templates help without becoming process theater?",
        ],
    },
    "assessment": {
        "title_template": "{domain} Practical Assessment",
        "summary_template": "A graded practical assessment for {domain} covering concepts, command fluency, scenario reasoning, and portfolio evidence.",
        "outcomes": [
            "Measure applied capability rather than passive familiarity.",
            "Identify gaps across concepts, diagnosis, safety, and communication.",
            "Decide which course, lab, or project should come next.",
        ],
        "study_tasks": [
            "Answer ten short questions and complete one scenario without looking at notes.",
            "Score yourself against evidence quality, safety, explanation, and recovery plan.",
            "Write a gap list with one next practice action for each weak area.",
        ],
        "next_steps": [
            "Retake the assessment after two labs and compare the evidence quality.",
            "Use missed questions to seed flashcards and interview prompts.",
        ],
        "artifacts": ["assessment scorecard", "gap list", "next practice plan"],
        "commands": ["# Practical assessment command anchor", "{command}"],
        "interview_prompts": [
            "What would make your answer production-ready?",
            "Which gap would be most dangerous on call?",
        ],
    },
    "troubleshooting guide": {
        "title_template": "{domain} Symptom-to-Signal Guide",
        "summary_template": "A troubleshooting map for {domain} that moves from symptoms to evidence, likely causes, owner boundaries, and safe mitigation.",
        "outcomes": [
            "Avoid random-walk debugging by following a clear evidence sequence.",
            "Separate user symptom, platform signal, probable cause, and mitigation.",
            "Know when to escalate because evidence crosses a boundary.",
        ],
        "study_tasks": [
            "Create branches for the top five symptoms and the safest first checks for each.",
            "Add false-positive notes so learners do not overfit to one metric or event.",
            "Write a minimal incident update based on the evidence collected.",
        ],
        "next_steps": [
            "Practice the guide with a timer and compare the order of checks to the runbook.",
            "Turn recurring symptoms into dashboard panels or automation ideas.",
        ],
        "artifacts": ["troubleshooting tree", "symptom map", "incident update examples"],
        "commands": ["# Symptom-to-signal first pass", "{command}"],
        "interview_prompts": [
            "What evidence changes your hypothesis?",
            "How do you avoid fixing the loudest symptom instead of the real cause?",
        ],
    },
    "decision record": {
        "title_template": "{domain} Architecture Decision Record",
        "summary_template": "An ADR-style decision exercise for {domain}: context, options, tradeoffs, decision, consequences, and revisit triggers.",
        "outcomes": [
            "Compare options with operational consequences instead of preference.",
            "Document why a decision was made and when it should be revisited.",
            "Connect platform choices to reliability, security, cost, and developer experience.",
        ],
        "study_tasks": [
            "Write three options with pros, cons, risks, migration cost, and rollback implications.",
            "Define what evidence would invalidate the decision later.",
            "Add an owner and review date so the ADR does not freeze the platform in time.",
        ],
        "next_steps": [
            "Use the ADR as a system-design interview story.",
            "Link the chosen option to a project brief or production readiness checklist.",
        ],
        "artifacts": ["ADR", "options matrix", "revisit trigger list"],
        "commands": ["# Gather facts before writing the decision.", "{command}"],
        "interview_prompts": [
            "What alternatives did you reject, and why?",
            "What new evidence would make you reverse the decision?",
        ],
    },
    "production readiness checklist": {
        "title_template": "{domain} Production Readiness Checklist",
        "summary_template": "A launch checklist for {domain} covering ownership, SLOs, alerts, security, scaling, rollback, docs, and support paths.",
        "outcomes": [
            "Define what must be true before production exposure.",
            "Make reliability, security, cost, and operability visible before launch.",
            "Give reviewers a repeatable acceptance gate for platform work.",
        ],
        "study_tasks": [
            "Write readiness checks for ownership, telemetry, capacity, failure behavior, access, and rollback.",
            "Classify each check as must-have, should-have, or follow-up with owner and due date.",
            "Run the checklist against a sample service and record launch blockers.",
        ],
        "next_steps": [
            "Attach the checklist to the related project brief and lab evidence.",
            "Promote high-value checks into automated gates only after they are stable.",
        ],
        "artifacts": ["readiness checklist", "launch blocker log", "follow-up tracker"],
        "commands": ["# Readiness evidence anchor", "{command}"],
        "interview_prompts": [
            "What would block launch, and what could safely follow later?",
            "How do you keep production readiness useful instead of bureaucratic?",
        ],
    },
    "failure mode drill": {
        "title_template": "{domain} Failure Mode Drill",
        "summary_template": "A guided failure drill for {domain} with injected symptoms, expected signals, mitigation choices, and learning questions.",
        "outcomes": [
            "Practice failure before production pressure makes learning expensive.",
            "Connect failure symptoms to guardrails, dashboards, and rollback behavior.",
            "Improve runbooks and alerts from observed confusion.",
        ],
        "study_tasks": [
            "Define the injected failure, expected customer symptom, first alert, and desired mitigation.",
            "Run the drill in a sandbox and capture timeline, evidence, and decision points.",
            "Write two improvements: one technical and one documentation or training improvement.",
        ],
        "next_steps": [
            "Add the drill to an incident game-day backlog.",
            "Update the runbook with anything responders had to infer.",
        ],
        "artifacts": ["failure drill plan", "timeline", "improvement backlog"],
        "commands": ["# Failure drill evidence checkpoint", "{command}"],
        "interview_prompts": [
            "What failure have you practiced, and what changed afterward?",
            "How do you keep a drill safe while still making it realistic?",
        ],
    },
    "security review": {
        "title_template": "{domain} Security Review Workbook",
        "summary_template": "A security workbook for {domain} covering identities, secrets, network paths, policy boundaries, supply chain, audit, and exceptions.",
        "outcomes": [
            "Threat-model the domain with concrete trust boundaries and abuse cases.",
            "Review least privilege, secret handling, network exposure, and auditability.",
            "Document exceptions with expiry, owner, compensating control, and evidence.",
        ],
        "study_tasks": [
            "List actors, privileges, data, network edges, and mutation paths.",
            "Find one overly broad permission or policy and propose a safer scope.",
            "Write an exception record that would pass a serious review.",
        ],
        "next_steps": [
            "Pair this review with the production readiness checklist.",
            "Convert repeated manual checks into policy-as-code candidates.",
        ],
        "artifacts": ["threat model", "least-privilege review", "exception register"],
        "commands": ["# Security review evidence anchor", "{command}"],
        "interview_prompts": [
            "Where could privilege escalation happen?",
            "How do you balance developer speed with a meaningful control?",
        ],
    },
    "cost review": {
        "title_template": "{domain} Cost and Capacity Review",
        "summary_template": "A cost review for {domain} connecting usage, requested capacity, waste, reliability tradeoffs, and owner-facing recommendations.",
        "outcomes": [
            "Find cost signals without creating reliability regressions.",
            "Tie spend to ownership, capacity, SLOs, and platform adoption.",
            "Write recommendations that teams can act on without blame.",
        ],
        "study_tasks": [
            "List cost drivers, utilization signals, idle resources, and reliability constraints.",
            "Write one safe optimization and one risky optimization with rollback criteria.",
            "Create a cost note that explains impact, owner, action, and validation signal.",
        ],
        "next_steps": [
            "Pair cost findings with production readiness and SLO context.",
            "Use the review to seed a FinOps dashboard or backlog item.",
        ],
        "artifacts": ["cost review worksheet", "capacity evidence", "recommendation note"],
        "commands": ["# Cost and capacity evidence anchor", "{command}"],
        "interview_prompts": [
            "How do you reduce waste without hurting reliability?",
            "What cost metric would you show a service owner?",
        ],
    },
    "portfolio artifact": {
        "title_template": "{domain} Portfolio Artifact Builder",
        "summary_template": "A portfolio builder for {domain} that turns labs, diagrams, decisions, and docs-linked notes into a credible engineering story.",
        "outcomes": [
            "Show applied platform engineering judgment with evidence.",
            "Connect problem, constraints, decisions, commands, and outcomes in one story.",
            "Prepare a clean artifact for interviews, resume bullets, or project reviews.",
        ],
        "study_tasks": [
            "Write the before-state, investigation, implementation, validation, and tradeoff sections.",
            "Add source links, screenshots, command output, and a rollback or safety note.",
            "Create three resume bullets: beginner, intermediate, and advanced framing.",
        ],
        "next_steps": [
            "Use the artifact as your answer to a behavioral or system-design prompt.",
            "Ask whether the artifact proves judgment, not just tool usage, then revise.",
        ],
        "artifacts": ["portfolio README", "evidence gallery", "interview story"],
        "commands": ["# Portfolio evidence anchor", "{command}", "git log --oneline -5"],
        "interview_prompts": [
            "What does this artifact prove you can do on a real platform team?",
            "Which part demonstrates judgment rather than following a tutorial?",
        ],
    },
}

RESOURCE_DOMAIN_BLUEPRINTS = [
    {
        "domain": "Linux",
        "level_group": "Fresher",
        "course_slug": "platform-linux-command-line-foundations",
        "lab_slug": "inspect-linux-failure-evidence",
        "topics": "shell navigation, files, processes, logs, permissions, exit codes, text pipelines",
        "command": "ps aux | head && journalctl --since '15 min ago'",
        "artifact": "Linux operator evidence checklist",
    },
    {
        "domain": "Networking",
        "level_group": "Fresher",
        "course_slug": "platform-networking-fundamentals",
        "lab_slug": "trace-network-path",
        "topics": "IP paths, ports, DNS, HTTP, TLS, Ingress, load balancers, firewalls",
        "command": "curl -Iv https://app.example.com/healthz",
        "artifact": "request path diagram",
    },
    {
        "domain": "Docker",
        "level_group": "Fresher",
        "course_slug": "platform-docker-image-supply-chain",
        "lab_slug": "review-docker-image-supply-chain",
        "topics": "Dockerfiles, layers, multi-stage builds, tags, digests, registries, image scanning",
        "command": "docker image inspect IMAGE:TAG",
        "artifact": "container image review checklist",
    },
    {
        "domain": "Kubernetes",
        "level_group": "Fresher",
        "course_slug": "platform-kubernetes-fundamentals",
        "lab_slug": "trace-service-to-pod",
        "topics": "Pods, Deployments, ReplicaSets, Services, EndpointSlices, probes, requests, ConfigMaps, Secrets",
        "command": "kubectl get deploy,rs,pods,svc,endpointslice -n payments",
        "artifact": "Kubernetes object relationship map",
    },
    {
        "domain": "kubectl",
        "level_group": "Fresher",
        "course_slug": "platform-kubectl-debugging-basics",
        "lab_slug": "debug-crashloop-imagepull",
        "topics": "get, describe, logs, events, exec, port-forward, CrashLoopBackOff, ImagePullBackOff, Pending",
        "command": "kubectl describe pod POD -n NAMESPACE",
        "artifact": "first responder command tree",
    },
    {
        "domain": "Cloud Native",
        "level_group": "Fresher",
        "course_slug": "platform-cloud-native-foundations",
        "lab_slug": "review-yaml-before-apply",
        "topics": "YAML, manifests, registries, DNS, ports, resource requests, environment promotion",
        "command": "kubectl apply --dry-run=client -f manifest.yaml",
        "artifact": "manifest review worksheet",
    },
    {
        "domain": "EKS",
        "level_group": "Intermediate",
        "course_slug": "platform-eks-operations",
        "lab_slug": "diagnose-eks-ip-exhaustion",
        "topics": "VPC CNI, subnet IP exhaustion, managed node groups, Fargate, add-ons, ALB controller",
        "command": "aws eks describe-cluster --name prod-platform",
        "artifact": "EKS operations checklist",
    },
    {
        "domain": "Terraform",
        "level_group": "Intermediate",
        "course_slug": "platform-terraform-aws-infrastructure",
        "lab_slug": "review-terraform-eks-plan",
        "topics": "state, locking, modules, variables, VPC, EKS, plan review, drift, safe applies",
        "command": "terraform plan -out=tfplan && terraform show -no-color tfplan",
        "artifact": "Terraform plan review template",
    },
    {
        "domain": "AWS IAM",
        "level_group": "Intermediate",
        "course_slug": "platform-aws-iam-for-eks",
        "lab_slug": "debug-irsa-access-denied",
        "topics": "policy evaluation, STS, AssumeRole, trust policies, IRSA, Pod Identity, CloudTrail",
        "command": "aws sts get-caller-identity",
        "artifact": "IAM access decision worksheet",
    },
    {
        "domain": "AWS Operations",
        "level_group": "Intermediate",
        "course_slug": "platform-aws-operations-foundations",
        "lab_slug": "debug-aws-alb-health-path",
        "topics": "VPC design, subnets, routing, load balancers, Route 53, CloudWatch, autoscaling, blast radius, and operational readiness",
        "command": "aws cloudwatch describe-alarms --state-value ALARM",
        "artifact": "AWS operations review worksheet",
    },
    {
        "domain": "Helm",
        "level_group": "Intermediate",
        "course_slug": "platform-helm-application-delivery",
        "lab_slug": "validate-helm-release-artifact",
        "topics": "values layering, templates, helpers, schema, lint, template, diff, hooks, CRDs, rollback",
        "command": "helm template checkout charts/checkout -f values/prod.yaml",
        "artifact": "rendered manifest review rubric",
    },
    {
        "domain": "ArgoCD",
        "level_group": "Intermediate",
        "course_slug": "platform-argocd-gitops",
        "lab_slug": "trace-argocd-drift",
        "topics": "Applications, AppProjects, sync waves, pruning, drift, self-heal, secrets, rollback through Git",
        "command": "argocd app diff checkout-prod",
        "artifact": "GitOps drift triage guide",
    },
    {
        "domain": "CI/CD",
        "level_group": "Advanced",
        "course_slug": "platform-cicd-release-engineering",
        "lab_slug": "design-safe-release-pipeline",
        "topics": "quality gates, artifact promotion, SBOMs, signing, image scanning, canaries, rollback, runner security",
        "command": "helm template checkout charts/checkout -f values/prod.yaml",
        "artifact": "release pipeline quality gate matrix",
    },
    {
        "domain": "Security",
        "level_group": "Advanced",
        "course_slug": "platform-kubernetes-security-multitenancy",
        "lab_slug": "audit-tenant-boundaries",
        "topics": "RBAC, NetworkPolicy, Pod Security Standards, admission, secrets, tenant boundaries, audit",
        "command": "kubectl auth can-i get secrets -n payments --as dev@example.com",
        "artifact": "tenant security review checklist",
    },
    {
        "domain": "SRE",
        "level_group": "Advanced",
        "course_slug": "platform-sre-observability-kubernetes",
        "lab_slug": "write-slo-backed-runbook",
        "topics": "RED/USE, Prometheus, Grafana, logs, traces, SLOs, error budgets, burn-rate alerts, runbooks",
        "command": "kubectl get prometheusrule -A",
        "artifact": "SLO and alert review worksheet",
    },
    {
        "domain": "Observability",
        "level_group": "Advanced",
        "course_slug": "platform-observability-telemetry-engineering",
        "lab_slug": "design-opentelemetry-signal-path",
        "topics": "metrics, logs, traces, OpenTelemetry, Prometheus, CloudWatch, dashboards, sampling, cardinality, and alert quality",
        "command": "kubectl get servicemonitor,prometheusrule -A",
        "artifact": "observability signal design review",
    },
    {
        "domain": "Incident Response",
        "level_group": "Advanced",
        "course_slug": "platform-incident-response-reliability",
        "lab_slug": "run-incident-commander-tabletop",
        "topics": "severity, incident commander, comms, mitigation, escalation, timelines, postmortems, game days",
        "command": "kubectl get events -n payments --sort-by=.lastTimestamp",
        "artifact": "incident timeline and postmortem template",
    },
    {
        "domain": "FinOps",
        "level_group": "Advanced",
        "course_slug": "platform-finops-kubernetes-aws",
        "lab_slug": "audit-eks-cost-drivers",
        "topics": "OpenCost, AWS CUR, budgets, NAT costs, load balancers, spot, right-sizing, chargeback, cost per service",
        "command": "kubectl top pods -A --containers",
        "artifact": "EKS cost review worksheet",
    },
    {
        "domain": "Platform Engineering",
        "level_group": "Advanced",
        "course_slug": "platform-engineering-product-operating-model",
        "lab_slug": "create-platform-golden-path",
        "topics": "golden paths, service ownership, paved-road APIs, templates, production readiness, scorecards, developer experience",
        "command": "argocd app get new-service-dev",
        "artifact": "golden path launch checklist",
    },
    {
        "domain": "Career",
        "level_group": "Advanced",
        "course_slug": "platform-career-job-search-sprint",
        "lab_slug": "build-platform-career-proof-pack",
        "topics": "skill matrix, portfolio projects, interview scenarios, CKA/CKAD/CKS, AWS, Terraform Associate, resume proof",
        "command": "git log --oneline --decorate -5",
        "artifact": "portfolio proof and interview rubric",
    },
]


RESOURCE_OFFICIAL_SOURCES = {
    "Linux": ("https://www.gnu.org/software/bash/manual/bash.html", "GNU Bash reference manual"),
    "Networking": ("https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name", "MDN web networking docs"),
    "Docker": ("https://docs.docker.com/reference/", "Docker official reference"),
    "Kubernetes": ("https://kubernetes.io/docs/tasks/debug/", "Kubernetes official debugging docs"),
    "kubectl": ("https://kubernetes.io/docs/reference/kubectl/", "kubectl official reference"),
    "Cloud Native": ("https://kubernetes.io/docs/concepts/", "Kubernetes concepts docs"),
    "EKS": ("https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html", "Amazon EKS user guide"),
    "Terraform": ("https://developer.hashicorp.com/terraform/docs", "Terraform official docs"),
    "AWS IAM": ("https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html", "AWS IAM user guide"),
    "AWS Operations": ("https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html", "Amazon CloudWatch user guide"),
    "Helm": ("https://helm.sh/docs/", "Helm official docs"),
    "ArgoCD": ("https://argo-cd.readthedocs.io/en/stable/", "Argo CD official docs"),
    "CI/CD": ("https://docs.github.com/en/actions", "GitHub Actions official docs"),
    "Security": ("https://kubernetes.io/docs/concepts/security/", "Kubernetes security docs"),
    "SRE": ("https://sre.google/sre-book/table-of-contents/", "Google SRE book"),
    "Observability": ("https://opentelemetry.io/docs/concepts/signals/", "OpenTelemetry signal concepts"),
    "Incident Response": ("https://sre.google/sre-book/managing-incidents/", "Google SRE incident management"),
    "FinOps": ("https://www.finops.org/framework/", "FinOps Framework"),
    "Platform Engineering": ("https://tag-app-delivery.cncf.io/whitepapers/platforms/", "CNCF platforms whitepaper"),
    "Career": ("https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html", "AWS Well-Architected Framework"),
}

RESOURCE_OFFICIAL_SOURCE_SETS = {
    "Linux": [
        {"label": "GNU Bash Reference Manual", "url": "https://www.gnu.org/software/bash/manual/bash.html"},
        {"label": "GNU Coreutils Manual", "url": "https://www.gnu.org/software/coreutils/manual/coreutils.html"},
        {"label": "systemd journalctl manual", "url": "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html"},
    ],
    "Networking": [
        {"label": "MDN Domain Names", "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name"},
        {"label": "MDN HTTP Overview", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"},
        {"label": "Kubernetes Services", "url": "https://kubernetes.io/docs/concepts/services-networking/service/"},
    ],
    "Docker": [
        {"label": "Docker Build Best Practices", "url": "https://docs.docker.com/build/building/best-practices/"},
        {"label": "Docker Multi-stage Builds", "url": "https://docs.docker.com/build/building/multi-stage/"},
        {"label": "Docker Reference", "url": "https://docs.docker.com/reference/"},
    ],
    "Kubernetes": [
        {"label": "Kubernetes Debugging Tasks", "url": "https://kubernetes.io/docs/tasks/debug/"},
        {"label": "Kubernetes Services", "url": "https://kubernetes.io/docs/concepts/services-networking/service/"},
        {"label": "Kubernetes Probes", "url": "https://kubernetes.io/docs/concepts/workloads/pods/probes/"},
        {"label": "Kubernetes Deployments", "url": "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"},
    ],
    "kubectl": [
        {"label": "kubectl Reference", "url": "https://kubernetes.io/docs/reference/kubectl/"},
        {"label": "Debug Running Pods", "url": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/"},
        {"label": "Debug Pods", "url": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/"},
    ],
    "Cloud Native": [
        {"label": "Kubernetes Concepts", "url": "https://kubernetes.io/docs/concepts/"},
        {"label": "Kubernetes Configuration Best Practices", "url": "https://kubernetes.io/docs/concepts/configuration/overview/"},
        {"label": "Kubernetes Workloads", "url": "https://kubernetes.io/docs/concepts/workloads/"},
    ],
    "EKS": [
        {"label": "Amazon EKS User Guide", "url": "https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html"},
        {"label": "Amazon VPC CNI Best Practices", "url": "https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html"},
        {"label": "EKS Pod Identity", "url": "https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html"},
        {"label": "EKS Add-ons", "url": "https://docs.aws.amazon.com/eks/latest/userguide/workloads-add-ons-available-eks.html"},
    ],
    "Terraform": [
        {"label": "Terraform State", "url": "https://developer.hashicorp.com/terraform/language/state"},
        {"label": "Terraform Plan Command", "url": "https://developer.hashicorp.com/terraform/cli/commands/plan"},
        {"label": "Terraform Module Development", "url": "https://developer.hashicorp.com/terraform/language/modules/develop"},
    ],
    "AWS IAM": [
        {"label": "AWS IAM User Guide", "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html"},
        {"label": "IAM Policy Evaluation Logic", "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html"},
        {"label": "EKS Pod Identity", "url": "https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html"},
    ],
    "AWS Operations": [
        {"label": "Amazon CloudWatch User Guide", "url": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html"},
        {"label": "AWS Operational Excellence Pillar", "url": "https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html"},
        {"label": "AWS Reliability Pillar", "url": "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html"},
        {"label": "Amazon VPC User Guide", "url": "https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html"},
    ],
    "Helm": [
        {"label": "Helm Best Practices", "url": "https://helm.sh/docs/chart_best_practices/"},
        {"label": "Helm Values Best Practices", "url": "https://helm.sh/docs/chart_best_practices/values/"},
        {"label": "Helm Charts", "url": "https://helm.sh/docs/topics/charts/"},
    ],
    "ArgoCD": [
        {"label": "Argo CD Documentation", "url": "https://argo-cd.readthedocs.io/en/stable/"},
        {"label": "Argo CD Projects", "url": "https://argo-cd.readthedocs.io/en/stable/user-guide/projects/"},
        {"label": "Argo CD Sync Waves", "url": "https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/"},
        {"label": "Argo CD Diffing", "url": "https://argo-cd.readthedocs.io/en/stable/user-guide/diffing/"},
    ],
    "CI/CD": [
        {"label": "GitHub Actions Secure Use", "url": "https://docs.github.com/en/actions/reference/security/secure-use"},
        {"label": "GitHub Actions OIDC", "url": "https://docs.github.com/en/actions/concepts/security/openid-connect"},
        {"label": "Deployments and Environments", "url": "https://docs.github.com/en/actions/reference/deployments-and-environments"},
    ],
    "Security": [
        {"label": "Kubernetes Security Concepts", "url": "https://kubernetes.io/docs/concepts/security/"},
        {"label": "Pod Security Standards", "url": "https://kubernetes.io/docs/concepts/security/pod-security-standards/"},
        {"label": "Network Policies", "url": "https://kubernetes.io/docs/concepts/services-networking/network-policies/"},
        {"label": "Using RBAC Authorization", "url": "https://kubernetes.io/docs/reference/access-authn-authz/rbac/"},
    ],
    "SRE": [
        {"label": "Google SRE Service Level Objectives", "url": "https://sre.google/sre-book/service-level-objectives/"},
        {"label": "Google SRE Practical Alerting", "url": "https://sre.google/sre-book/practical-alerting/"},
        {"label": "Google Incident Management Guide", "url": "https://sre.google/resources/practices-and-processes/incident-management-guide/"},
    ],
    "Observability": [
        {"label": "OpenTelemetry Signals", "url": "https://opentelemetry.io/docs/concepts/signals/"},
        {"label": "OpenTelemetry Collector", "url": "https://opentelemetry.io/docs/collector/"},
        {"label": "Prometheus Alerting Practices", "url": "https://prometheus.io/docs/practices/alerting/"},
        {"label": "Amazon CloudWatch User Guide", "url": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html"},
    ],
    "Incident Response": [
        {"label": "Google SRE Managing Incidents", "url": "https://sre.google/sre-book/managing-incidents/"},
        {"label": "Google Incident Management Guide", "url": "https://sre.google/resources/practices-and-processes/incident-management-guide/"},
        {"label": "Google SRE Postmortem Culture", "url": "https://sre.google/sre-book/postmortem-culture/"},
    ],
    "FinOps": [
        {"label": "FinOps Framework", "url": "https://www.finops.org/framework/"},
        {"label": "AWS Cost Optimization Pillar", "url": "https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html"},
        {"label": "AWS Cost Optimization Foundation", "url": "https://docs.aws.amazon.com/whitepapers/latest/cost-optimization-laying-the-foundation/welcome.html"},
    ],
    "Platform Engineering": [
        {"label": "CNCF Platforms Whitepaper", "url": "https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
        {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        {"label": "Kubernetes Documentation", "url": "https://kubernetes.io/docs/"},
    ],
    "Career": [
        {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        {"label": "Certified Kubernetes Administrator", "url": "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/"},
        {"label": "Terraform Associate Certification", "url": "https://developer.hashicorp.com/certifications/infrastructure-automation"},
    ],
}


RESOURCE_RESEARCH_PROFILES = {
    "Kubernetes": {
        "source_takeaways": [
            "Services route to Pods through label selectors and EndpointSlices, so selector drift is a first-class incident cause.",
            "Deployments manage ReplicaSets during rollouts; the durable fix belongs in the controller template, chart, or Git source.",
            "Probes, requests, events, and owner references usually explain more than a restart button.",
        ],
        "study_tasks": [
            "Draw Deployment -> ReplicaSet -> Pod -> Service -> EndpointSlice for one workload.",
            "Write a failure note for a Service with no endpoints and include the exact labels you compared.",
            "Practice explaining readiness versus liveness without using memorized definitions.",
        ],
        "interview_prompts": [
            "A Service returns 503 after a label cleanup. Walk through your first five checks.",
            "A rollout is stuck with unavailable replicas. What Kubernetes objects do you inspect and why?",
            "How do you decide whether a probe failure is protecting users or creating a restart storm?",
        ],
    },
    "kubectl": {
        "source_takeaways": [
            "The fastest safe loop is get, describe, logs, and events before mutation.",
            "Previous logs are often the only durable evidence for a CrashLoopBackOff container.",
            "Interactive tools like exec and port-forward are diagnostics, not long-term operating models.",
        ],
        "study_tasks": [
            "Build a one-page command tree for Pending, CrashLoopBackOff, ImagePullBackOff, and probe failures.",
            "Capture an incident timeline from events sorted by timestamp.",
            "Write a rule for when restart is mitigation versus evidence loss.",
        ],
        "interview_prompts": [
            "What evidence do you collect before deleting a broken Pod?",
            "How do you separate ImagePullBackOff from CrashLoopBackOff under time pressure?",
            "When would you use exec, and what would make it unsafe?",
        ],
    },
    "EKS": {
        "source_takeaways": [
            "The Amazon VPC CNI assigns VPC addresses to Pods on AWS infrastructure, making subnet planning part of Kubernetes capacity.",
            "EKS add-ons and controllers have versions, IAM permissions, and failure modes like any production dependency.",
            "Capacity choice is workload fit: EC2 nodes, managed node groups, Fargate, and dynamic provisioning each change observability and operations.",
        ],
        "study_tasks": [
            "Model Pod IP demand for a node group and compare it with subnet headroom.",
            "Write a preflight checklist for ALB controller installation.",
            "Compare Fargate and EC2 nodes for a workload that needs a DaemonSet.",
        ],
        "interview_prompts": [
            "Pods are Pending and CNI logs mention allocation errors. What do you inspect?",
            "When is Fargate a poor fit for a platform workload?",
            "What should be versioned and monitored for EKS add-ons?",
        ],
    },
    "AWS IAM": {
        "source_takeaways": [
            "Workload identity should map AWS permissions to a specific Kubernetes service account instead of relying on broad node roles.",
            "EKS Pod Identity and IRSA both need a trust boundary plus narrowly scoped permission policy.",
            "AccessDenied debugging starts with principal, action, resource, condition, and which policy layer denied it.",
        ],
        "study_tasks": [
            "Trace an AWS SDK call from Pod service account to role and policy decision.",
            "Write a trust-policy review checklist for a controller.",
            "List how CloudTrail evidence would confirm the actual caller.",
        ],
        "interview_prompts": [
            "A Pod can call S3 in staging but gets AccessDenied in prod. Where do you look?",
            "What is the risk of letting Pods use the node instance profile?",
            "How do you review an AWS Load Balancer Controller IAM policy?",
        ],
    },
    "Helm": {
        "source_takeaways": [
            "A chart's values file is an API surface; changing names or shapes can break users and pipelines.",
            "Rendered manifests are the review artifact, not the template intent in someone's head.",
            "Upgrade safety means checking selectors, immutable fields, hooks, CRDs, and rollback limits.",
        ],
        "study_tasks": [
            "Render dev and prod values, then diff selectors, probes, resources, and RBAC.",
            "Document five chart values with user-facing comments and defaults.",
            "Write an upgrade review note for a chart that changes labels.",
        ],
        "interview_prompts": [
            "What makes a Helm values file easy or dangerous to operate?",
            "How do you review a third-party chart before installation?",
            "Why can helm rollback fail to restore service behavior?",
        ],
    },
    "ArgoCD": {
        "source_takeaways": [
            "Projects restrict source repositories, destinations, and resource kinds; the default project is intentionally broad for early use.",
            "Sync waves and hooks control apply order, but they need health and rollback thinking.",
            "Prune, self-heal, and ignoreDifferences are governance choices, not checkboxes.",
        ],
        "study_tasks": [
            "Design an AppProject for one tenant namespace and one allowed repo.",
            "Write an HPA drift decision: Git-owned field or controller-owned field?",
            "Map rollback steps when auto-sync would otherwise reapply the bad commit.",
        ],
        "interview_prompts": [
            "How would you prevent a tenant ArgoCD app from creating ClusterRoles?",
            "What can go wrong with auto-sync plus prune in production?",
            "When should ignoreDifferences be used, and how narrow should it be?",
        ],
    },
    "Terraform": {
        "source_takeaways": [
            "State is Terraform's record of managed infrastructure, so backend, workspace, and lock correctness matter before plan review.",
            "A plan is a proposal: replacements, deletes, route changes, IAM changes, and unknowns need human review.",
            "Reusable modules should expose stable inputs without hiding high-risk cloud decisions.",
        ],
        "study_tasks": [
            "Annotate a plan with create, update, replace, destroy, unknown, and sensitive sections.",
            "Write a state/backend safety checklist for production applies.",
            "Review an EKS module call for subnet, IAM, endpoint, and node-group risk.",
        ],
        "interview_prompts": [
            "What does Terraform state do, and why is locking important?",
            "How do you review a plan that replaces a node group?",
            "What makes a platform Terraform module too abstract?",
        ],
    },
    "Security": {
        "source_takeaways": [
            "NetworkPolicy only protects traffic when the network plugin enforces it.",
            "Pod Security Standards define privileged, baseline, and restricted guardrail levels.",
            "Least privilege has to include users, service accounts, controllers, secrets, and exceptions.",
        ],
        "study_tasks": [
            "Write a default-deny rollout plan that keeps DNS working.",
            "Audit one namespace for secret access, cluster-admin paths, and risky Pod settings.",
            "Create an exception record for a privileged observability agent.",
        ],
        "interview_prompts": [
            "How do you roll out NetworkPolicy without breaking production?",
            "What Pod settings should an admission policy block by default?",
            "How do you test whether a developer can read Secrets?",
        ],
    },
    "SRE": {
        "source_takeaways": [
            "SLOs should begin with user-visible service behavior rather than component vanity metrics.",
            "Alerting should page on urgent, actionable symptoms and use tickets for slower operational work.",
            "Runbooks should start with safe diagnostics, then mitigation, escalation, and learning loops.",
        ],
        "study_tasks": [
            "Define one availability SLI and one latency SLI for checkout traffic.",
            "Write a burn-rate alert explanation in human incident language.",
            "Turn a repeated Kubernetes incident into an automation or dashboard improvement.",
        ],
        "interview_prompts": [
            "How do you choose an SLI for an API?",
            "What makes an alert page-worthy?",
            "How do you keep a runbook from becoming stale?",
        ],
    },
    "CI/CD": {
        "source_takeaways": [
            "CI/CD systems are production control planes because they can build, sign, approve, and deploy code.",
            "Immutable artifact promotion is stronger than rebuilding per environment.",
            "Progressive delivery needs measurable pause and rollback conditions.",
        ],
        "study_tasks": [
            "Map a pipeline from commit to image digest to Helm render to ArgoCD sync.",
            "Define smoke, canary, and SLO gates for a checkout service.",
            "Threat-model who can push, approve, and deploy to production.",
        ],
        "interview_prompts": [
            "What gates would you require before prod deployment?",
            "Why promote digests instead of tags?",
            "How would you secure a pipeline with production deploy permissions?",
        ],
    },
    "AWS Operations": {
        "source_takeaways": [
            "AWS operational interviews often test whether you can reason from user symptom to VPC path, load balancer health, IAM, telemetry, and ownership.",
            "CloudWatch, VPC flow, load balancer, Route 53, and Well-Architected signals are most useful when tied to one explicit failure hypothesis.",
            "A good cloud engineer balances blast radius, cost, security, and recovery time instead of treating every AWS issue as a console-clicking exercise.",
        ],
        "study_tasks": [
            "Draw one request path through Route 53, ALB, subnets, security groups, nodes, Services, and Pods.",
            "Write a CloudWatch alarm review that distinguishes symptom alarms from noisy component alarms.",
            "Create an AWS readiness checklist covering identity, network path, observability, backups, and rollback.",
        ],
        "interview_prompts": [
            "An ALB has unhealthy targets after a deploy. Which AWS and Kubernetes signals do you inspect first?",
            "How do you explain a private subnet, route table, NAT, and security group to a developer debugging egress?",
            "What CloudWatch alarm would page you, and what would stay as a ticket or dashboard?",
        ],
    },
    "Observability": {
        "source_takeaways": [
            "Metrics, logs, and traces are different signals; strong answers explain when each signal changes the next action.",
            "Prometheus guidance emphasizes symptom-focused alerting tied to user pain and actionable consoles.",
            "OpenTelemetry interviews often test instrumentation boundaries, context propagation, sampling, cardinality, and ownership.",
        ],
        "study_tasks": [
            "Design one dashboard panel set for checkout latency starting from user-visible symptoms.",
            "Write a trace investigation checklist covering ingress, service, dependency, database, and external API spans.",
            "Review one metric for name, labels, cardinality, aggregation, alert usefulness, and owner.",
        ],
        "interview_prompts": [
            "How do you decide whether to use metrics, logs, or traces for a latency issue?",
            "What makes an alert actionable enough to wake someone up?",
            "Where can OpenTelemetry instrumentation create cost or cardinality problems?",
        ],
    },
    "Platform Engineering": {
        "source_takeaways": [
            "A platform is a product: it should publish paved-road capabilities, supported contracts, and measurable outcomes.",
            "Golden paths work when they encode security, reliability, observability, and rollback defaults.",
            "Adoption metrics should connect developer experience with production outcomes.",
        ],
        "study_tasks": [
            "Design a new-service template with ownership, CI, Helm, ArgoCD, dashboards, and runbooks.",
            "Write production readiness criteria for a shared-cluster service.",
            "Define quarterly platform KPIs across speed, reliability, cost, security, and satisfaction.",
        ],
        "interview_prompts": [
            "How do you make the secure path the easy path for developers?",
            "What belongs in a production-readiness checklist?",
            "How do you know an internal platform is succeeding?",
        ],
    },
}

RESOURCE_RESEARCH_PROFILES.update(
    {
        "Linux": {
            "source_takeaways": [
                "Linux troubleshooting starts with process state, logs, permissions, filesystem pressure, and recent change context.",
                "Pipelines with grep, awk, sort, uniq, jq, and xargs are operational force multipliers when output is noisy.",
                "Journal and process evidence should be captured before restarts erase useful timing and exit-code context.",
            ],
            "study_tasks": [
                "Write a failure note that includes process, port, log, disk, and permission evidence.",
                "Build three text pipelines that reduce noisy logs into counts, timestamps, and suspect identifiers.",
                "Explain the difference between a one-off shell fix and a durable service or configuration fix.",
            ],
            "interview_prompts": [
                "A service is failing after deploy and logs are noisy. What is your Linux evidence order?",
                "How do you know whether a failure is permissions, disk, process crash, or network path?",
                "What shell pipeline have you used to turn a wall of text into an answer?",
            ],
        },
        "Networking": {
            "source_takeaways": [
                "Network diagnosis is a path problem: client, DNS, route, firewall, load balancer, proxy, service, endpoint, and application.",
                "TLS, HTTP status, DNS answer, and connection timing each point to different layers.",
                "A good network diagram includes who initiates traffic, which port/protocol is used, and where policy is enforced.",
            ],
            "study_tasks": [
                "Trace one request from browser or client to Pod and mark every DNS, load balancer, and policy boundary.",
                "Compare curl, dig, nc, and traceroute output for the same failure and explain what each proves.",
                "Write a false-positive note for a case where DNS worked but the application still failed.",
            ],
            "interview_prompts": [
                "A health check passes from inside the cluster but fails from the internet. Where do you look?",
                "How do you separate DNS failure from TLS failure from application failure?",
                "What belongs on a production network path diagram?",
            ],
        },
        "Docker": {
            "source_takeaways": [
                "Image quality is operational quality: base image choice, layers, build context, user, exposed ports, and entrypoint matter.",
                "Multi-stage builds reduce final image size and attack surface by separating build dependencies from runtime.",
                "Tags are convenient labels, but digests and attestations give stronger deployment evidence.",
            ],
            "study_tasks": [
                "Review a Dockerfile for base image, user, cache behavior, copied files, and unnecessary packages.",
                "Convert a single-stage Dockerfile into a multi-stage build and compare image size and runtime files.",
                "Write an image promotion note that references digest, scan result, and rollback path.",
            ],
            "interview_prompts": [
                "What makes a Dockerfile production-friendly?",
                "Why are multi-stage builds useful beyond smaller images?",
                "How do you prevent 'latest' from becoming a release-management problem?",
            ],
        },
        "Cloud Native": {
            "source_takeaways": [
                "Cloud-native work is about declarative configuration, immutable artifacts, service ownership, observability, and automated recovery.",
                "YAML is not proof of safety; rendered manifests, permissions, resource requests, and rollout behavior need review.",
                "The best platform defaults make reliability and security the easiest path for application teams.",
            ],
            "study_tasks": [
                "Map one service from source repo to image to manifest to deployment to dashboard.",
                "Write a manifest review checklist covering labels, probes, resources, secrets, and rollback.",
                "Explain what changes when moving from a local demo to a multi-team cluster.",
            ],
            "interview_prompts": [
                "What makes an application cloud-native in an operational sense?",
                "How do you review a manifest before apply?",
                "Which defaults should a platform team provide so developers avoid sharp edges?",
            ],
        },
        "Incident Response": {
            "source_takeaways": [
                "Incident response needs clear roles, timeline discipline, user-impact framing, and explicit communication channels.",
                "Mitigation and root cause are different jobs; confusing them slows recovery.",
                "Postmortems should improve systems and response behavior without blame.",
            ],
            "study_tasks": [
                "Write an incident timeline with detection, impact, mitigation, recovery, and follow-up points.",
                "Practice a short executive update and a technical update for the same incident.",
                "Turn one repeated incident class into a game-day drill and backlog item.",
            ],
            "interview_prompts": [
                "What does an incident commander do?",
                "How do you communicate uncertainty during an incident?",
                "What makes a postmortem useful instead of performative?",
            ],
        },
        "FinOps": {
            "source_takeaways": [
                "Cost optimization starts with visibility, ownership, tagging, usage patterns, and business context.",
                "Savings that reduce reliability, availability, or team trust are not real platform wins.",
                "Kubernetes cost work has to connect requests, limits, node shape, storage, load balancers, NAT, and data transfer.",
            ],
            "study_tasks": [
                "Create a cost driver map for one EKS service including compute, network, storage, and shared platform costs.",
                "Write a recommendation that includes expected savings, reliability risk, owner, validation, and rollback.",
                "Compare right-sizing, spot, scheduling, and architecture changes for one workload.",
            ],
            "interview_prompts": [
                "How do you explain Kubernetes waste to a service owner?",
                "What cost optimization would you reject because it risks reliability?",
                "Which AWS costs surprise teams running EKS?",
            ],
        },
        "Career": {
            "source_takeaways": [
                "Strong platform portfolios show judgment: constraints, tradeoffs, evidence, source links, and production thinking.",
                "Certifications help structure study, but interviews reward applied scenarios and clear explanations.",
                "A credible story connects technical work to developer experience, reliability, security, and cost outcomes.",
            ],
            "study_tasks": [
                "Turn one lab into a STAR-format interview story with evidence and tradeoffs.",
                "Write three resume bullets for the same project: implementation, operations, and business-impact versions.",
                "Create a gap map across AWS, Kubernetes, Terraform, SRE, security, and platform product thinking.",
            ],
            "interview_prompts": [
                "Tell me about a platform project where you changed your mind after seeing evidence.",
                "How do you keep learning material from becoming tutorial-only experience?",
                "What proof would make a hiring manager believe you can operate production systems?",
            ],
        },
    }
)


def resource_research_profile(domain: str) -> dict[str, list[str]]:
    return RESOURCE_RESEARCH_PROFILES.get(
        domain,
        {
            "source_takeaways": [
                f"Use official {domain} references as the source of truth before turning examples into production changes.",
                "Separate concepts, commands, safety constraints, and evidence artifacts when studying.",
                "Convert every learning session into a reusable note, checklist, or portfolio proof point.",
            ],
            "study_tasks": [
                f"Summarize the current official {domain} docs in five operational bullets.",
                "Write one local-safe practice scenario and one read-only production inspection scenario.",
                "Create a portfolio artifact showing diagnosis, decision, and rollback thinking.",
            ],
            "interview_prompts": [
                f"What {domain} failure mode have you practiced end to end?",
                "What evidence would you collect before changing the system?",
                "How would you explain the tradeoff to a product team?",
            ],
        },
    )


def official_source_for_domain(domain: str) -> tuple[str, str]:
    primary_source = RESOURCE_OFFICIAL_SOURCE_SETS.get(domain, [])
    if primary_source:
        return primary_source[0]["url"], primary_source[0]["label"]
    return RESOURCE_OFFICIAL_SOURCES.get(domain, ("https://kubernetes.io/docs/home/", "Official platform reference"))


def official_sources_for_domain(domain: str) -> list[dict[str, str]]:
    sources = RESOURCE_OFFICIAL_SOURCE_SETS.get(domain)
    if sources:
        return sources
    source_url, source_label = official_source_for_domain(domain)
    return [{"label": source_label, "url": source_url}]


def platform_resource_slug(domain: str, resource_type: str) -> str:
    return f"{domain}-{resource_type}".lower().replace("/", " ").replace("&", "and").replace(" ", "-")


def build_platform_resources() -> list[dict]:
    resources: list[dict] = []
    for domain in RESOURCE_DOMAIN_BLUEPRINTS:
        source_url, source_label = official_source_for_domain(domain["domain"])
        official_sources = official_sources_for_domain(domain["domain"])
        research_profile = resource_research_profile(domain["domain"])
        for resource_type, type_summary, minutes in RESOURCE_TYPE_BLUEPRINTS:
            type_profile = RESOURCE_TYPE_PROFILES[resource_type]
            slug = platform_resource_slug(domain["domain"], resource_type)
            title = type_profile["title_template"].format(domain=domain["domain"])
            commands = [
                command.format(command=domain["command"], domain=domain["domain"], slug=slug)
                for command in type_profile["commands"]
            ]
            resources.append(
                {
                    "slug": slug,
                    "title": title,
                    "domain": domain["domain"],
                    "level_group": domain["level_group"],
                    "resource_type": resource_type,
                    "estimated_minutes": minutes,
                    "summary": type_profile["summary_template"].format(
                        domain=domain["domain"],
                        topics=domain["topics"],
                        type_summary=type_summary,
                    ),
                    "outcomes": [
                        *type_profile["outcomes"],
                        f"Explain the core {domain['domain']} mental model in operational language.",
                    ],
                    "prerequisites": [
                        "Read the related Platform Academy lesson.",
                        "Know whether you are using a local cluster, mock data, or an approved sandbox.",
                        f"Skim the primary source trail for {domain['domain']} and note current version assumptions.",
                    ],
                    "safety_level": "local-safe" if domain["level_group"] == "Fresher" else "read-only / sandbox-first",
                    "commands": commands,
                    "artifacts": [domain["artifact"], *type_profile["artifacts"], f"{domain['domain']} {resource_type} notes"],
                    "related_lessons": [],
                    "related_labs": [domain["lab_slug"]],
                    "next_steps": [
                        *type_profile["next_steps"],
                        "Open the related lab and collect evidence before changing anything.",
                        "Convert the work into a clear README section.",
                    ],
                    "source_takeaways": [*research_profile["source_takeaways"], f"{type_summary} should be anchored to official {domain['domain']} documentation, not copied from stale examples."],
                    "study_tasks": [*type_profile["study_tasks"], *research_profile["study_tasks"]],
                    "interview_prompts": [*research_profile["interview_prompts"], *type_profile["interview_prompts"]],
                    "official_sources": official_sources,
                    "source_url": source_url,
                    "source_label": source_label,
                    "reviewed_at": "2026-05-30",
                }
            )
    return resources


PLATFORM_RESOURCES = build_platform_resources()


PLATFORM_INTERVIEW_PREP = [
    {
        "slug": "kubernetes-debugging-interview-pack",
        "title": "Kubernetes Debugging Interview Pack",
        "domain": "Kubernetes",
        "level_group": "Fresher",
        "focus": "Service routing, rollouts, Pods, probes, requests, and safe kubectl evidence collection.",
        "related_course_slug": "platform-kubernetes-fundamentals",
        "related_labs": ["trace-service-to-pod", "debug-crashloop-imagepull"],
        "official_sources": [
            {"label": "Kubernetes Deployments", "url": "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"},
            {"label": "Kubernetes Debug Pods", "url": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/"},
            {"label": "Kubernetes Services", "url": "https://kubernetes.io/docs/concepts/services-networking/service/"},
        ],
        "questions": [
            {
                "question": "A Service returns 503 after a label cleanup. Walk me through your diagnosis.",
                "scenario": "A deployment is running, the Service exists, and users get intermittent 503s.",
                "answer_outline": [
                    "Read the Service selector and namespace first.",
                    "List Pods with labels and compare selector keys exactly.",
                    "Inspect EndpointSlices for ready addresses and readiness failures.",
                    "Trace the source manifest or Helm values so the fix is durable.",
                ],
                "strong_signals": ["Mentions EndpointSlices", "Checks readiness before blaming networking", "Keeps fix in source of truth"],
                "red_flags": ["Deletes Pods first", "Changes random labels live", "Skips namespace and selector comparison"],
                "practice_task": "Use the trace-service-to-pod lab and write a four-command evidence note.",
            },
            {
                "question": "A rollout is stuck with unavailable replicas. Which objects do you inspect?",
                "scenario": "A new Deployment image was merged but rollout status never completes.",
                "answer_outline": [
                    "Inspect Deployment desired, updated, available, and unavailable counts.",
                    "Compare old and new ReplicaSets and their Pod status.",
                    "Describe failing Pods for events, probes, image pull, config, and scheduling.",
                    "Use rollout history for release context and decide rollback limits.",
                ],
                "strong_signals": ["Follows Deployment -> ReplicaSet -> Pod", "Differentiates rollback from data recovery", "Reads events"],
                "red_flags": ["Only scales replicas", "Confuses Service routing with rollout health", "Rolls back without impact check"],
                "practice_task": "Create a rollout triage template with status, events, owner, and rollback decision.",
            },
            {
                "question": "How do readiness, liveness, and startup probes differ operationally?",
                "scenario": "A slow-starting app restarts repeatedly after probe settings changed.",
                "answer_outline": [
                    "Readiness decides whether the Pod receives traffic.",
                    "Liveness decides whether kubelet restarts the container.",
                    "Startup delays liveness/readiness pressure while slow apps initialize.",
                    "A bad liveness probe can amplify a dependency issue into a restart storm.",
                ],
                "strong_signals": ["Uses traffic gate vs restart gate", "Mentions startup probe", "Treats probes as user-safety controls"],
                "red_flags": ["Says all probes restart Pods", "Disables probes permanently", "Ignores app startup behavior"],
                "practice_task": "Write probe review criteria for an HTTP API and a worker process.",
            },
            {
                "question": "A Pod is Pending. What are the highest-value signals?",
                "scenario": "A release creates Pods that never start, and the team suspects a cluster outage.",
                "answer_outline": [
                    "Describe the Pod and read scheduler events.",
                    "Check requests against node allocatable capacity.",
                    "Inspect taints, tolerations, node selectors, affinity, and PVC binding.",
                    "Separate scheduling failure from image pull or CNI allocation failure.",
                ],
                "strong_signals": ["Starts with scheduler events", "Knows taints and PVCs", "Separates capacity from runtime"],
                "red_flags": ["Uses logs for a container that never started", "Lowers requests blindly", "Assumes autoscaler will fix it"],
                "practice_task": "Create a Pending Pod checklist that maps event messages to likely owners.",
            },
            {
                "question": "What evidence do you collect before restarting a failing workload?",
                "scenario": "On-call wants to restart checkout during an incident.",
                "answer_outline": [
                    "Capture describe output, recent logs, previous logs, and sorted events.",
                    "Record current rollout revision, owner, and affected namespace.",
                    "Decide whether restart is mitigation, evidence loss, or both.",
                    "Document what should become an alert, dashboard, or automation.",
                ],
                "strong_signals": ["Preserves previous logs", "Mentions events timeline", "Connects response to learning loop"],
                "red_flags": ["Restarts before evidence", "No user-impact statement", "No follow-up artifact"],
                "practice_task": "Write a restart decision runbook for CrashLoopBackOff.",
            },
        ],
    },
    {
        "slug": "eks-operations-interview-pack",
        "title": "EKS Operations Interview Pack",
        "domain": "EKS",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "VPC CNI, Pod IPs, node models, add-ons, load balancers, and AWS-backed failure modes.",
        "related_course_slug": "platform-eks-operations",
        "related_labs": ["diagnose-eks-ip-exhaustion", "design-production-eks-review"],
        "official_sources": [
            {"label": "Amazon EKS User Guide", "url": "https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html"},
            {"label": "Amazon VPC CNI for EKS", "url": "https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html"},
            {"label": "Amazon EKS Best Practices Guide", "url": "https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html"},
        ],
        "questions": [
            {
                "question": "Pods are Pending and CNI logs mention IP allocation. What is your path?",
                "scenario": "A traffic spike triggers scale-out, but new Pods cannot start.",
                "answer_outline": [
                    "Read Pod events to confirm CNI/IP allocation rather than CPU or memory scheduling.",
                    "Inspect aws-node logs and VPC CNI configuration.",
                    "Check subnet available IPs, node max Pods, and prefix delegation settings.",
                    "Decide between subnet capacity, node shape, prefix delegation, or architecture change.",
                ],
                "strong_signals": ["Knows Pods consume VPC IPs with VPC CNI", "Checks subnet headroom", "Avoids one-size-fits-all scaling"],
                "red_flags": ["Only adds replicas", "Blames CoreDNS first", "Ignores subnet/AZ placement"],
                "practice_task": "Model Pod IP demand for three node groups and write a scale-out risk note.",
            },
            {
                "question": "When would you choose Fargate, managed node groups, or EC2 nodes?",
                "scenario": "A team proposes moving every workload to Fargate to remove node operations.",
                "answer_outline": [
                    "Use Fargate for compatible workloads where node management reduction matters.",
                    "Use managed node groups for conservative EC2 lifecycle and DaemonSet-friendly operations.",
                    "Use custom EC2/Karpenter patterns when workload shape, cost, GPUs, or DaemonSets require control.",
                    "Separate system and app capacity with labels, taints, and tolerations.",
                ],
                "strong_signals": ["Mentions DaemonSet constraints", "Discusses workload fit", "Balances toil, cost, and observability"],
                "red_flags": ["Says one model fits all", "Ignores logging/monitoring agents", "No placement controls"],
                "practice_task": "Create a workload placement matrix for API, batch, controller, and observability workloads.",
            },
            {
                "question": "An Ingress exists but no ALB appears. What do you inspect?",
                "scenario": "A developer created an Ingress and waited, but AWS did not provision a load balancer.",
                "answer_outline": [
                    "Check IngressClass and controller ownership.",
                    "Read Ingress events and AWS Load Balancer Controller logs.",
                    "Inspect subnet discovery tags, IAM permissions, scheme, target type, and annotations.",
                    "Confirm security groups and target health after provisioning.",
                ],
                "strong_signals": ["Connects Kubernetes events with AWS controller logs", "Mentions subnet tags and IAM", "Checks target type"],
                "red_flags": ["Only checks DNS", "Creates a manual ALB outside source of truth", "Ignores public/private exposure"],
                "practice_task": "Build an ALB controller preflight checklist.",
            },
            {
                "question": "How do you run EKS add-ons as production components?",
                "scenario": "VPC CNI, CoreDNS, and kube-proxy versions drift across clusters.",
                "answer_outline": [
                    "Inventory versions, compatibility, owners, alerts, and upgrade windows.",
                    "Treat add-on IAM and RBAC like application permissions.",
                    "Read release notes and test upgrades before cluster version changes.",
                    "Track health with controller metrics, logs, events, and SLO impact.",
                ],
                "strong_signals": ["Mentions compatibility order", "Owns alerts and runbooks", "Includes rollback/pause points"],
                "red_flags": ["Auto-upgrades everything blindly", "No owner per add-on", "Ignores permissions"],
                "practice_task": "Write an add-on ownership record for VPC CNI.",
            },
            {
                "question": "What EKS signals matter during a cluster upgrade readiness review?",
                "scenario": "The platform team must approve a Kubernetes minor version upgrade.",
                "answer_outline": [
                    "Inventory deprecated APIs, CRDs, admission webhooks, controllers, and Helm renders.",
                    "Plan control plane, add-on, and node rollout sequence.",
                    "Test clients and CI/CD compatibility against target version.",
                    "Define pause, validation, communication, and rollback boundaries.",
                ],
                "strong_signals": ["Includes add-ons and nodes", "Checks API deprecations", "Has pause points"],
                "red_flags": ["Calls it a button click", "Skips CRDs/webhooks", "No workload owner mapping"],
                "practice_task": "Create a one-page upgrade runbook for a production EKS cluster.",
            },
        ],
    },
    {
        "slug": "workload-identity-iam-interview-pack",
        "title": "AWS IAM and Workload Identity Interview Pack",
        "domain": "AWS IAM",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "IAM evaluation, STS, trust policies, IRSA, EKS Pod Identity, and controller permission review.",
        "related_course_slug": "platform-aws-iam-for-eks",
        "related_labs": ["debug-irsa-access-denied", "audit-tenant-boundaries"],
        "official_sources": [
            {"label": "EKS Pod Identity", "url": "https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html"},
            {"label": "AWS IAM User Guide", "url": "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html"},
        ],
        "questions": [
            {
                "question": "A Pod gets AccessDenied from AWS after a service account change. How do you debug?",
                "scenario": "The same code worked yesterday, but now AWS SDK calls fail in production.",
                "answer_outline": [
                    "Identify the actual principal with SDK logs, CloudTrail, or sts get-caller-identity where safe.",
                    "Check service account, annotation or Pod Identity association, and Pod spec serviceAccountName.",
                    "Review trust policy, OIDC or Pod Identity setup, action, resource, and conditions.",
                    "Separate trust failure from permission-policy denial.",
                ],
                "strong_signals": ["Finds actual principal", "Separates trust and permissions", "Uses CloudTrail evidence"],
                "red_flags": ["Adds AdministratorAccess", "Only checks Kubernetes YAML", "Ignores conditions and boundaries"],
                "practice_task": "Write an AccessDenied decision tree from Pod to IAM policy.",
            },
            {
                "question": "Why avoid broad node instance profile permissions for Pods?",
                "scenario": "A legacy cluster gives every workload the node role because it is simpler.",
                "answer_outline": [
                    "Any compromised Pod may reach node credentials if IMDS is not restricted.",
                    "Least privilege requires mapping permissions to specific service accounts.",
                    "Auditability improves when each workload has its own role association.",
                    "Controllers and apps should have distinct roles and blast radius.",
                ],
                "strong_signals": ["Mentions IMDS exposure", "Connects identity to service account", "Discusses auditability"],
                "red_flags": ["Says network isolation is enough", "Shares one role per cluster", "No credential isolation concern"],
                "practice_task": "Review a node role and propose a migration to workload identity.",
            },
            {
                "question": "How do you review an AWS controller IAM policy before production?",
                "scenario": "A team wants to install ExternalDNS or AWS Load Balancer Controller.",
                "answer_outline": [
                    "Identify required AWS APIs and resources for the controller.",
                    "Scope resources by ARN, tags, hosted zones, cluster name, and conditions where possible.",
                    "Review Kubernetes service account, trust policy, and namespace.",
                    "Add monitoring for high-risk API activity and ownership.",
                ],
                "strong_signals": ["Scopes resources", "Reviews trust and permission policy", "Adds monitoring"],
                "red_flags": ["Accepts cluster-admin plus broad AWS admin", "No owner", "No CloudTrail review"],
                "practice_task": "Create a policy review note for a load balancer controller.",
            },
            {
                "question": "Explain allow, explicit deny, conditions, and permission boundaries in IAM.",
                "scenario": "A role has an Allow but still cannot perform the action.",
                "answer_outline": [
                    "Evaluate identity, resource, session, boundary, SCP, and explicit deny layers.",
                    "Explicit deny wins over allow.",
                    "Conditions can make an allow apply only for matching context.",
                    "Boundaries and SCPs can cap what identity policies allow.",
                ],
                "strong_signals": ["Names multiple policy layers", "Explains explicit deny precedence", "Asks for principal/action/resource"],
                "red_flags": ["Looks only at one inline policy", "Ignores organizations/SCP", "Cannot identify the principal"],
                "practice_task": "Annotate a denied CloudTrail event with each policy layer to check.",
            },
            {
                "question": "How do EKS Pod Identity and IRSA change operations?",
                "scenario": "An organization is deciding between workload identity patterns.",
                "answer_outline": [
                    "Both scope AWS permissions to Kubernetes service accounts.",
                    "IRSA uses the cluster OIDC provider and role trust subjects.",
                    "EKS Pod Identity uses associations and a node agent, reducing OIDC provider operations.",
                    "Both still require least-privilege policies, IMDS awareness, and SDK compatibility.",
                ],
                "strong_signals": ["Knows both patterns", "Mentions agent/association for Pod Identity", "Does not overstate container isolation"],
                "red_flags": ["Says identity solves all Pod isolation", "Ignores SDK/default credential chain", "No trust boundary discussion"],
                "practice_task": "Write a comparison table for IRSA vs EKS Pod Identity for platform onboarding docs.",
            },
        ],
    },
    {
        "slug": "helm-gitops-interview-pack",
        "title": "Helm and GitOps Delivery Interview Pack",
        "domain": "Helm / ArgoCD",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "Values design, rendered manifests, AppProjects, sync policy, drift, and rollback reality.",
        "related_course_slug": "platform-helm-application-delivery",
        "related_labs": ["validate-helm-release-artifact", "trace-argocd-drift"],
        "official_sources": [
            {"label": "Helm Values Best Practices", "url": "https://helm.sh/docs/chart_best_practices/values/"},
            {"label": "Argo CD Projects", "url": "https://argo-cd.readthedocs.io/en/stable/user-guide/projects/"},
            {"label": "Argo CD Sync Waves", "url": "https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/"},
        ],
        "questions": [
            {
                "question": "What makes a Helm chart values file a good API?",
                "scenario": "Several teams consume one internal service chart.",
                "answer_outline": [
                    "Names should be stable, documented, and easy to override.",
                    "The chart should expose intent without leaking every template detail.",
                    "Types should be clear; quote strings where YAML coercion is risky.",
                    "Breaking values changes need versioning and migration notes.",
                ],
                "strong_signals": ["Calls values an API", "Mentions docs and type clarity", "Considers consumers"],
                "red_flags": ["Adds arbitrary nested knobs", "No docs", "Tests only with one values file"],
                "practice_task": "Document ten values for an internal app chart.",
            },
            {
                "question": "How do you review a Helm upgrade before it hits production?",
                "scenario": "A chart change passes unit tests but may alter selectors and RBAC.",
                "answer_outline": [
                    "Render exact production values and compare against previous release.",
                    "Run lint, schema validation, policy checks, and server dry-run where safe.",
                    "Inspect selectors, immutable fields, resources, probes, hooks, CRDs, and RBAC.",
                    "Document rollback limits and validation steps.",
                ],
                "strong_signals": ["Reviews rendered manifests", "Checks selectors/immutable fields", "Understands rollback limits"],
                "red_flags": ["Approves because helm lint passes", "No previous-release comparison", "Ignores CRDs"],
                "practice_task": "Write a release review rubric for rendered Kubernetes YAML.",
            },
            {
                "question": "How would you restrict tenant deployments in ArgoCD?",
                "scenario": "A shared ArgoCD instance serves multiple application teams.",
                "answer_outline": [
                    "Create AppProjects per tenant or boundary.",
                    "Restrict source repos, destination namespaces/clusters, and resource kinds.",
                    "Avoid the permissive default project for production tenants.",
                    "Use project roles and review cluster-scoped exceptions.",
                ],
                "strong_signals": ["Mentions source, destination, kinds", "Knows default project is broad", "Uses exceptions"],
                "red_flags": ["Every app in default project", "Allows all ClusterRoles", "No repo boundary"],
                "practice_task": "Design an AppProject spec for a tenant namespace.",
            },
            {
                "question": "When does ignoreDifferences help, and when is it dangerous?",
                "scenario": "ArgoCD reports drift because an HPA changes replicas.",
                "answer_outline": [
                    "It helps when a controller intentionally owns a field.",
                    "It should be scoped to specific group, kind, name, and field.",
                    "It is dangerous when broad rules hide actual drift or security changes.",
                    "Ownership should be documented near the Application manifest.",
                ],
                "strong_signals": ["Scoped field ownership", "HPA example", "Warns against broad ignores"],
                "red_flags": ["Ignores entire resources", "Cannot explain who owns field", "Uses it to hide broken sync"],
                "practice_task": "Write an HPA replica drift decision record.",
            },
            {
                "question": "What can go wrong with auto-sync, prune, and rollback?",
                "scenario": "A bad commit deploys to prod and someone wants to manually restore objects.",
                "answer_outline": [
                    "Auto-sync may reapply the bad desired state.",
                    "Prune can delete resources removed from Git, including shared or stateful objects.",
                    "Rollback should usually restore desired state in Git or pause automation first.",
                    "External state, CRDs, and migrations may need separate recovery.",
                ],
                "strong_signals": ["Knows automation can fight manual recovery", "Mentions prune risk", "Separates Git rollback from data rollback"],
                "red_flags": ["Deletes Application without plan", "No auto-sync awareness", "Assumes rollback covers databases"],
                "practice_task": "Write a GitOps incident recovery checklist.",
            },
        ],
    },
    {
        "slug": "terraform-platform-interview-pack",
        "title": "Terraform Platform Infrastructure Interview Pack",
        "domain": "Terraform",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "State, plans, modules, EKS infrastructure, drift, cost, and safe applies.",
        "related_course_slug": "platform-terraform-aws-infrastructure",
        "related_labs": ["review-terraform-eks-plan", "design-production-eks-review"],
        "official_sources": [
            {"label": "Terraform State", "url": "https://developer.hashicorp.com/terraform/language/state"},
            {"label": "Terraform Plan", "url": "https://developer.hashicorp.com/terraform/cli/commands/plan"},
        ],
        "questions": [
            {
                "question": "What is Terraform state and why does locking matter?",
                "scenario": "Two engineers are about to apply changes to the same EKS stack.",
                "answer_outline": [
                    "State maps configuration to real infrastructure objects.",
                    "Remote state and locking prevent concurrent writes and stale plans.",
                    "Wrong workspace or backend can target the wrong environment.",
                    "Sensitive state data needs access control.",
                ],
                "strong_signals": ["Explains mapping and locking", "Mentions backend/workspace", "Cares about sensitive data"],
                "red_flags": ["Says state is just cache", "Runs apply locally in prod", "No lock concern"],
                "practice_task": "Write a production Terraform backend safety checklist.",
            },
            {
                "question": "How do you review a Terraform plan for EKS changes?",
                "scenario": "A plan modifies node groups, route tables, security groups, and IAM.",
                "answer_outline": [
                    "Find create, update, replace, delete, and unknown sections.",
                    "Call out security group, route, endpoint, IAM, and node replacement blast radius.",
                    "Check dependency order and whether validation requires cluster or cloud checks.",
                    "Document rollback, cost, and communication impact.",
                ],
                "strong_signals": ["Reads plan beyond green/red", "Mentions blast radius", "Includes cost"],
                "red_flags": ["Approves if plan exits 0", "No replacement awareness", "Ignores IAM"],
                "practice_task": "Annotate a sample EKS plan with risk labels.",
            },
            {
                "question": "What makes an infrastructure module reusable but still safe?",
                "scenario": "A platform module manages VPC, EKS, node groups, and add-ons.",
                "answer_outline": [
                    "Expose stable inputs and outputs with clear ownership.",
                    "Avoid hiding high-risk defaults such as public endpoints or broad IAM.",
                    "Version module changes and provide migration notes.",
                    "Test representative environment values before release.",
                ],
                "strong_signals": ["Balances abstraction with visibility", "Mentions versioning", "Reviews defaults"],
                "red_flags": ["One mega-module with hidden behavior", "No migration path", "No tests"],
                "practice_task": "Write module contract docs for an EKS node group module.",
            },
            {
                "question": "How do you handle drift in Terraform-managed infrastructure?",
                "scenario": "Someone changed a security group in the AWS console during an incident.",
                "answer_outline": [
                    "Detect drift with plan and cloud evidence.",
                    "Decide whether the live change should be reverted or codified.",
                    "Update Terraform source if the change is the new desired state.",
                    "Avoid importing or tainting blindly without ownership context.",
                ],
                "strong_signals": ["Separates desired vs accidental drift", "Keeps source of truth", "Has incident context"],
                "red_flags": ["Runs apply without review", "Deletes live changes blindly", "No owner discussion"],
                "practice_task": "Write a drift decision record for an emergency security group change.",
            },
            {
                "question": "Which Terraform changes are highest risk for an EKS platform?",
                "scenario": "You get ten minutes to scan a plan before a change window.",
                "answer_outline": [
                    "Control plane endpoint access, subnets, routes, NAT, security groups, and IAM.",
                    "Node group replacements, launch templates, add-ons, and Karpenter constraints.",
                    "Stateful dependencies such as volumes, DNS, and load balancers.",
                    "Anything marked destroy or replace in production.",
                ],
                "strong_signals": ["Prioritizes connectivity/IAM/capacity", "Looks for destroy/replace", "Understands cloud blast radius"],
                "red_flags": ["Focuses only on resource count", "No network path thinking", "No rollback"],
                "practice_task": "Build a high-risk resource watchlist for EKS Terraform plans.",
            },
        ],
    },
    {
        "slug": "security-multitenancy-interview-pack",
        "title": "Kubernetes Security and Multi-tenancy Interview Pack",
        "domain": "Security",
        "level_group": ADVANCED_LEVEL,
        "focus": "RBAC, NetworkPolicy, Pod Security Standards, admission controls, secrets, and tenant boundaries.",
        "related_course_slug": "platform-kubernetes-security-multitenancy",
        "related_labs": ["audit-tenant-boundaries"],
        "official_sources": [
            {"label": "Kubernetes Network Policies", "url": "https://kubernetes.io/docs/concepts/services-networking/network-policies/"},
            {"label": "Kubernetes Pod Security Standards", "url": "https://kubernetes.io/docs/concepts/security/pod-security-standards/"},
        ],
        "questions": [
            {
                "question": "How do you roll out default-deny NetworkPolicy safely?",
                "scenario": "A shared cluster has flat Pod networking and tenants ask for isolation.",
                "answer_outline": [
                    "Confirm the CNI enforces NetworkPolicy.",
                    "Inventory dependencies, DNS, ingress, egress, metrics, and health checks.",
                    "Roll out by namespace with observability and rollback manifests.",
                    "Test allowed paths and document service ownership.",
                ],
                "strong_signals": ["Checks CNI enforcement", "Keeps DNS in mind", "Rolls out gradually"],
                "red_flags": ["Applies cluster-wide deny at once", "No dependency inventory", "Assumes policy works everywhere"],
                "practice_task": "Write a namespace default-deny migration plan.",
            },
            {
                "question": "What does least privilege mean in Kubernetes RBAC?",
                "scenario": "Developers need to restart workloads but should not read Secrets.",
                "answer_outline": [
                    "Grant verbs on required resources in required namespaces only.",
                    "Use Role/RoleBinding where possible and avoid cluster-admin.",
                    "Test with kubectl auth can-i for users and service accounts.",
                    "Create an escalation path for exceptional access.",
                ],
                "strong_signals": ["Uses can-i", "Separates Role from ClusterRole", "Avoids secrets verbs"],
                "red_flags": ["Uses cluster-admin for convenience", "No service-account review", "No testing"],
                "practice_task": "Design a restart-only RBAC role and test matrix.",
            },
            {
                "question": "Which Pod settings should admission policy block or review?",
                "scenario": "A vendor chart asks for privileged mode and hostPath.",
                "answer_outline": [
                    "Review privileged, hostPath, hostNetwork, hostPID, hostIPC, capabilities, and root user.",
                    "Compare against baseline/restricted Pod Security Standards.",
                    "Isolate required exceptions with owner, namespace, RBAC, network boundaries, and review date.",
                    "Audit before enforcement to avoid breaking critical controllers.",
                ],
                "strong_signals": ["Names concrete high-risk settings", "Understands exception process", "Mentions audit mode"],
                "red_flags": ["Approves vendor defaults", "No owner or expiry", "Blocks all controllers without review"],
                "practice_task": "Create an exception record for a privileged monitoring agent.",
            },
            {
                "question": "How do you design secrets boundaries in a shared cluster?",
                "scenario": "Multiple teams deploy in one cluster and some controllers watch all namespaces.",
                "answer_outline": [
                    "Keep tenant secrets in tenant namespaces with narrow list/watch permissions.",
                    "Encrypt at rest and audit access.",
                    "Use External Secrets, CSI driver, SOPS, or Sealed Secrets based on ownership.",
                    "Plan rotation and application reload behavior.",
                ],
                "strong_signals": ["Mentions list/watch risk", "Has source-of-truth strategy", "Includes rotation"],
                "red_flags": ["Commits plaintext secrets", "Allows broad secret read", "No audit"],
                "practice_task": "Write a secret access review for one namespace and one controller.",
            },
            {
                "question": "How would you separate tenants in a Kubernetes platform?",
                "scenario": "A business wants shared clusters but strong team isolation.",
                "answer_outline": [
                    "Use namespace boundaries with RBAC, quotas, LimitRanges, NetworkPolicy, and admission policy.",
                    "Separate high-risk tenants or compliance domains into clusters when needed.",
                    "Define ownership, cost labels, audit, and exception workflows.",
                    "Document what isolation Kubernetes does and does not provide.",
                ],
                "strong_signals": ["Does not oversell namespaces", "Combines multiple controls", "Knows when separate clusters matter"],
                "red_flags": ["Says namespaces are hard security boundaries", "No network or RBAC plan", "No exception handling"],
                "practice_task": "Draft a shared-cluster tenant onboarding checklist.",
            },
        ],
    },
    {
        "slug": "sre-observability-interview-pack",
        "title": "SRE and Observability Interview Pack",
        "domain": "SRE",
        "level_group": ADVANCED_LEVEL,
        "focus": "SLIs, SLOs, burn-rate alerts, dashboards, runbooks, incidents, and post-incident learning.",
        "related_course_slug": "platform-sre-observability-kubernetes",
        "related_labs": ["write-slo-backed-runbook"],
        "official_sources": [
            {"label": "Google SRE SLOs", "url": "https://sre.google/sre-book/service-level-objectives/"},
            {"label": "Prometheus Alerting Practices", "url": "https://prometheus.io/docs/practices/alerting/"},
        ],
        "questions": [
            {
                "question": "How do you choose an SLI for an API?",
                "scenario": "A checkout API has many internal metrics but no user-facing reliability objective.",
                "answer_outline": [
                    "Start with user-visible behavior: availability, latency, correctness, or freshness.",
                    "Define measurement point, good events, total events, and window.",
                    "Avoid component-only metrics as primary SLIs.",
                    "Tie dashboards and alerts to the SLO and error budget.",
                ],
                "strong_signals": ["User-visible first", "Defines numerator/denominator", "Connects to error budget"],
                "red_flags": ["Picks CPU as the SLI", "No measurement window", "No user impact"],
                "practice_task": "Define availability and latency SLIs for checkout.",
            },
            {
                "question": "What makes an alert page-worthy?",
                "scenario": "On-call receives noisy alerts for CPU, restarts, and queue length.",
                "answer_outline": [
                    "Page on urgent, actionable, user-impacting symptoms.",
                    "Use tickets or dashboards for slow, non-urgent operational work.",
                    "Include runbook, severity, owner, and evidence link.",
                    "Review alerts after incidents and remove noise.",
                ],
                "strong_signals": ["Urgent/actionable/user-impact", "Separates page from ticket", "Mentions runbook"],
                "red_flags": ["Pages on every warning", "No action path", "No ownership"],
                "practice_task": "Rewrite three noisy alerts into page, ticket, or dashboard categories.",
            },
            {
                "question": "Explain burn-rate alerting in practical terms.",
                "scenario": "A service is consuming error budget faster than expected.",
                "answer_outline": [
                    "Burn rate compares current error consumption to the allowed budget over a window.",
                    "Fast burns page quickly; slow burns create lower-urgency work.",
                    "Multi-window alerts reduce noise and catch sustained harm.",
                    "The alert should point to symptom dashboard and first mitigation choices.",
                ],
                "strong_signals": ["Explains budget consumption", "Uses multi-window concept", "Connects alert to action"],
                "red_flags": ["Only uses raw error count", "No window", "No mitigation"],
                "practice_task": "Write a burn-rate alert explanation for a product manager.",
            },
            {
                "question": "What should a Kubernetes incident runbook contain?",
                "scenario": "Checkout latency page fires and a new responder opens the runbook.",
                "answer_outline": [
                    "State user impact, SLO, severity, and owner.",
                    "List safe read-only diagnostics before mutating actions.",
                    "Provide mitigation options, rollback criteria, and escalation triggers.",
                    "Include post-incident follow-up and known dashboard links.",
                ],
                "strong_signals": ["Starts with impact", "Read-only first", "Includes escalation and learning"],
                "red_flags": ["Only a command dump", "No mitigation owner", "No stale-doc review"],
                "practice_task": "Write a runbook section for Service 503 incidents.",
            },
            {
                "question": "How do logs, metrics, and traces complement each other?",
                "scenario": "A service has high latency but logs look normal.",
                "answer_outline": [
                    "Metrics show aggregate trends and alert conditions.",
                    "Logs provide discrete event detail and context.",
                    "Traces show request path and dependency timing.",
                    "Use all three around one user-impact question rather than collecting everything.",
                ],
                "strong_signals": ["Understands each signal", "Ties signals to a question", "Mentions dependency timing"],
                "red_flags": ["Says one signal is enough", "No cardinality/cost awareness", "No user symptom"],
                "practice_task": "Design an observability panel for a slow checkout request.",
            },
        ],
    },
    {
        "slug": "platform-system-design-interview-pack",
        "title": "Platform Engineering System Design Interview Pack",
        "domain": "Platform Engineering",
        "level_group": ADVANCED_LEVEL,
        "focus": "Golden paths, production readiness, developer experience, cost, governance, and platform product strategy.",
        "related_course_slug": "platform-engineering-product-operating-model",
        "related_labs": ["create-platform-golden-path", "design-safe-release-pipeline"],
        "official_sources": [
            {"label": "CNCF Platforms Whitepaper", "url": "https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
            {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        ],
        "questions": [
            {
                "question": "Design a golden path for a new Kubernetes service.",
                "scenario": "Developers need to launch services without opening platform tickets for every step.",
                "answer_outline": [
                    "Generate repo, CI, Dockerfile, Helm chart, Terraform hooks, ArgoCD app, dashboards, alerts, and runbook.",
                    "Encode secure defaults and production readiness into templates.",
                    "Expose clear inputs and supported extension points.",
                    "Measure adoption, lead time, incidents, and developer satisfaction.",
                ],
                "strong_signals": ["Product thinking", "Security and observability defaults", "Measures outcomes"],
                "red_flags": ["Only scaffolds code", "No ownership/runbook", "No adoption metric"],
                "practice_task": "Sketch the first-run experience for creating a new service.",
            },
            {
                "question": "What belongs in a production readiness review?",
                "scenario": "A team wants to go live in the shared EKS platform.",
                "answer_outline": [
                    "Ownership, support model, SLOs, dashboards, alerts, runbooks, dependencies, and rollback.",
                    "Security, secrets, data handling, network paths, resource requests, and cost labels.",
                    "Load expectations, failure modes, deployment process, and incident escalation.",
                    "Exception owners and review dates for anything outside the paved road.",
                ],
                "strong_signals": ["Covers people and systems", "Includes cost/security/reliability", "Handles exceptions"],
                "red_flags": ["Only checks manifests", "No owner", "No rollback"],
                "practice_task": "Build a readiness scorecard for one service.",
            },
            {
                "question": "How do you decide when to build platform automation?",
                "scenario": "Engineers ask for automation after several manual incidents.",
                "answer_outline": [
                    "Look for repeated toil, high-risk manual steps, or long lead-time bottlenecks.",
                    "Confirm ownership, frequency, blast radius, and maintenance cost.",
                    "Start with a narrow paved-road workflow and measure adoption.",
                    "Document escape hatches and support boundaries.",
                ],
                "strong_signals": ["Balances automation cost", "Starts narrow", "Measures impact"],
                "red_flags": ["Automates every request", "No owner", "No lifecycle plan"],
                "practice_task": "Prioritize five platform backlog items by impact and effort.",
            },
            {
                "question": "How would you measure platform success?",
                "scenario": "Leadership asks whether the platform team is improving engineering outcomes.",
                "answer_outline": [
                    "Track lead time, deployment frequency, reliability, incident load, cost efficiency, security posture, and satisfaction.",
                    "Tie metrics to platform capabilities rather than vanity adoption.",
                    "Segment by team maturity and service criticality.",
                    "Use metrics to guide investment, not punish teams.",
                ],
                "strong_signals": ["Balanced scorecard", "Connects to product outcomes", "Avoids vanity metrics"],
                "red_flags": ["Only counts clusters", "No reliability/cost signal", "Metrics as punishment"],
                "practice_task": "Draft a quarterly platform review with five KPIs.",
            },
            {
                "question": "How do you handle exceptions to the golden path?",
                "scenario": "A team needs a privileged workload or unusual networking pattern.",
                "answer_outline": [
                    "Validate the business and technical need.",
                    "Document owner, risk, compensating controls, expiry, and review cadence.",
                    "Prefer platform-owned shared capability when many teams need the exception.",
                    "Feed repeated exceptions back into roadmap decisions.",
                ],
                "strong_signals": ["Exception lifecycle", "Compensating controls", "Roadmap feedback"],
                "red_flags": ["No exceptions allowed ever", "Permanent undocumented exceptions", "No risk owner"],
                "practice_task": "Write an exception template for privileged workloads.",
            },
        ],
    },
    {
        "slug": "linux-operator-interview-pack",
        "title": "Linux Operator Troubleshooting Interview Pack",
        "domain": "Linux",
        "level_group": "Fresher",
        "focus": "Shell navigation, processes, exit codes, permissions, logs, disk pressure, and evidence-first debugging.",
        "related_course_slug": "platform-linux-command-line-foundations",
        "related_labs": ["inspect-linux-failure-evidence", "debug-crashloop-imagepull"],
        "official_sources": [
            {"label": "GNU Bash Reference Manual", "url": "https://www.gnu.org/software/bash/manual/bash.html"},
            {"label": "GNU Coreutils Manual", "url": "https://www.gnu.org/software/coreutils/manual/coreutils.html"},
            {"label": "systemd journalctl manual", "url": "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html"},
        ],
        "questions": [
            {
                "question": "A Linux service fails after deploy and logs are noisy. What is your evidence order?",
                "scenario": "A container and a systemd service both report failure, but the team only has a vague user complaint.",
                "answer_outline": [
                    "Start with scope: host, container, service name, recent deploy, and user-impact symptom.",
                    "Check process state, exit code, recent logs, environment, config file path, and permissions.",
                    "Look for disk, memory, port, dependency, and certificate errors before restarting.",
                    "Reduce noisy logs into a timestamped evidence note with commands and findings.",
                ],
                "strong_signals": ["Separates process state from log text", "Checks permissions and disk", "Creates a concise evidence note"],
                "red_flags": ["Restarts repeatedly", "Greps one error and stops", "Does not identify the service owner"],
                "practice_task": "Use the Linux evidence lab and write a five-command failure note.",
            },
            {
                "question": "How do exit codes and signals show up in Kubernetes troubleshooting?",
                "scenario": "A Pod is CrashLoopBackOff and one container ended with code 137.",
                "answer_outline": [
                    "Read container last state, reason, exit code, restart count, and previous logs.",
                    "Connect exit code 137 to possible SIGKILL or memory pressure rather than app-level return code.",
                    "Check resource limits, OOMKilled reason, node pressure, and application memory behavior.",
                    "Decide whether the fix belongs in code, resource requests/limits, or workload placement.",
                ],
                "strong_signals": ["Uses last state and previous logs", "Knows 137/OOM path", "Connects Linux process behavior to Pod status"],
                "red_flags": ["Only increases replicas", "Ignores limits", "Assumes every crash is Kubernetes"],
                "practice_task": "Write a CrashLoopBackOff note that includes exit code, signal, and next owner.",
            },
            {
                "question": "A process cannot read its config file. How do you debug without weakening permissions?",
                "scenario": "A service runs as a non-root user and fails after a config volume or file ownership change.",
                "answer_outline": [
                    "Identify the runtime user, group, file path, mode bits, owner, and parent directory permissions.",
                    "Check whether the file is mounted read-only, generated by CI, or owned by another user.",
                    "Fix the narrow ownership or mode issue rather than making the container root.",
                    "Record the securityContext, Dockerfile user, and deployment source of truth.",
                ],
                "strong_signals": ["Checks parent directories", "Keeps non-root posture", "Finds source of truth"],
                "red_flags": ["Runs chmod 777", "Switches to root permanently", "Ignores how the file is mounted"],
                "practice_task": "Review one Dockerfile and Pod securityContext for file access assumptions.",
            },
            {
                "question": "What shell pipeline would you use to turn event noise into an answer?",
                "scenario": "A namespace has hundreds of events and the team needs the top failure reasons quickly.",
                "answer_outline": [
                    "Start with a bounded source such as recent events, logs, or JSON output.",
                    "Filter by namespace, reason, involved object, or timestamp before counting.",
                    "Use sort, uniq, awk, jq, or cut-style extraction to group repeated symptoms.",
                    "Keep the raw command and output snippet so the summary can be audited.",
                ],
                "strong_signals": ["Bounds the data", "Groups by reason/object", "Keeps reproducible command history"],
                "red_flags": ["Pastes a wall of logs", "Deletes context with over-broad filters", "Cannot reproduce the count"],
                "practice_task": "Build an event summary command for CrashLoopBackOff and ImagePullBackOff cases.",
            },
            {
                "question": "How do you tell disk pressure, log growth, and image storage apart?",
                "scenario": "Nodes report disk pressure and new Pods fail to start during a rollout.",
                "answer_outline": [
                    "Check node condition, kubelet events, filesystem usage, container image storage, and log directories.",
                    "Separate application log growth from image churn, emptyDir usage, and node root volume sizing.",
                    "Avoid deleting evidence blindly during an incident.",
                    "Create cleanup, retention, requests/limits, and capacity follow-up actions.",
                ],
                "strong_signals": ["Checks node condition and filesystem", "Separates log/image/emptyDir causes", "Protects evidence"],
                "red_flags": ["Deletes random files", "Only drains nodes", "No retention or capacity follow-up"],
                "practice_task": "Draft a disk pressure runbook section with safe read-only checks first.",
            },
        ],
    },
    {
        "slug": "networking-debugging-interview-pack",
        "title": "Networking Debugging Interview Pack",
        "domain": "Networking",
        "level_group": "Fresher",
        "focus": "DNS, ports, TLS, HTTP status codes, Ingress, Services, firewalls, and request-path reasoning.",
        "related_course_slug": "platform-networking-fundamentals",
        "related_labs": ["trace-network-path", "trace-service-to-pod"],
        "official_sources": [
            {"label": "MDN HTTP Overview", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"},
            {"label": "MDN Domain Names", "url": "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name"},
            {"label": "Kubernetes Services", "url": "https://kubernetes.io/docs/concepts/services-networking/service/"},
        ],
        "questions": [
            {
                "question": "A request times out. How do you locate the failing hop?",
                "scenario": "Users cannot reach checkout, but internal health checks sometimes pass.",
                "answer_outline": [
                    "Draw the request path from client to DNS, load balancer, Ingress, Service, Pod, and dependency.",
                    "Classify the symptom as DNS failure, connect timeout, TLS failure, HTTP response, or application timeout.",
                    "Test from outside, inside the cluster, and from a Pod when each vantage point is safe.",
                    "Map each failed hop to the owning system and next evidence source.",
                ],
                "strong_signals": ["Draws the path", "Uses vantage points", "Classifies the symptom before changing anything"],
                "red_flags": ["Only checks app logs", "Blames DNS for every failure", "No owner per hop"],
                "practice_task": "Use the network path lab and annotate each hop with command, signal, and owner.",
            },
            {
                "question": "How do you separate DNS failure from Service routing failure?",
                "scenario": "One namespace can reach checkout by IP but not by service name.",
                "answer_outline": [
                    "Check the exact name used, namespace, search domain, and fully qualified service DNS name.",
                    "Resolve the name from a controlled Pod and compare ClusterIP or records.",
                    "Inspect Service, EndpointSlices, CoreDNS health, and NetworkPolicy around DNS traffic.",
                    "Avoid changing Service selectors until name resolution and endpoint readiness are understood.",
                ],
                "strong_signals": ["Tests FQDN and namespace", "Checks EndpointSlices separately", "Considers DNS NetworkPolicy"],
                "red_flags": ["Edits CoreDNS first", "Ignores namespace search path", "Confuses DNS resolution with ready endpoints"],
                "practice_task": "Write a DNS-vs-Service decision tree for Kubernetes troubleshooting.",
            },
            {
                "question": "What do 404, 502, 503, and timeout usually tell you in an Ingress path?",
                "scenario": "A new route behind an ALB and Ingress returns different errors across environments.",
                "answer_outline": [
                    "Use status code, response headers, and timing to identify which hop likely answered.",
                    "404 often points to route/host/path mismatch; 502 to upstream/proxy issues; 503 to no healthy backend or readiness.",
                    "Timeout usually means no response path or blocked connectivity.",
                    "Confirm with Ingress events, controller logs, target health, Service endpoints, and app logs.",
                ],
                "strong_signals": ["Uses headers and timing", "Maps status to likely hop", "Checks target health and endpoints"],
                "red_flags": ["Treats all 5xx as app bugs", "No TLS/host/path check", "No controller evidence"],
                "practice_task": "Build a status-code triage table for ALB to Ingress to Service to Pod.",
            },
            {
                "question": "How would you design a minimal allowlist for frontend to API to database?",
                "scenario": "Security wants NetworkPolicy and cloud firewalls without breaking DNS or health checks.",
                "answer_outline": [
                    "List required sources, destinations, ports, protocols, namespaces, and labels.",
                    "Include DNS, metrics, health, and migration paths explicitly.",
                    "Roll out default deny gradually with observation and rollback manifests.",
                    "Test allowed and denied paths from controlled clients.",
                ],
                "strong_signals": ["Includes DNS and health checks", "Uses labels and ports precisely", "Tests both allow and deny"],
                "red_flags": ["Allows entire cluster CIDR", "Forgets DNS", "No rollback plan"],
                "practice_task": "Draft a three-tier NetworkPolicy review with test commands.",
            },
            {
                "question": "A TLS handshake fails only in production. What do you inspect?",
                "scenario": "Staging works, but production clients see certificate or handshake errors.",
                "answer_outline": [
                    "Check SNI, hostname, certificate chain, expiration, issuer, and trust store.",
                    "Compare load balancer listener, Ingress TLS secret, redirect policy, and protocol versions.",
                    "Look for proxy or service-mesh termination differences.",
                    "Record the client command, server certificate details, and owning certificate automation.",
                ],
                "strong_signals": ["Mentions SNI and chain", "Compares termination points", "Finds certificate owner"],
                "red_flags": ["Disables verification as a fix", "Only checks Kubernetes Secret name", "No client-side evidence"],
                "practice_task": "Create a TLS triage note template with hostname, SNI, issuer, and termination point.",
            },
        ],
    },
    {
        "slug": "docker-image-delivery-interview-pack",
        "title": "Docker and Image Delivery Interview Pack",
        "domain": "Docker",
        "level_group": "Fresher",
        "focus": "Dockerfiles, layers, multi-stage builds, tags, digests, image scanning, runtime users, and reproducible releases.",
        "related_course_slug": "platform-cloud-native-foundations",
        "related_labs": ["review-yaml-before-apply", "design-safe-release-pipeline"],
        "official_sources": [
            {"label": "Dockerfile Best Practices", "url": "https://docs.docker.com/build/building/best-practices/"},
            {"label": "Docker Multi-stage Builds", "url": "https://docs.docker.com/build/building/multi-stage/"},
            {"label": "Docker Reference", "url": "https://docs.docker.com/reference/"},
        ],
        "questions": [
            {
                "question": "What makes a Dockerfile production-friendly?",
                "scenario": "A service image builds, but it is huge, slow to scan, and runs as root.",
                "answer_outline": [
                    "Use a minimal, maintained base image and pin meaningful versions.",
                    "Separate build tooling from runtime with multi-stage builds where useful.",
                    "Run as a non-root user and copy only required runtime files.",
                    "Make dependency installation cacheable and scanable without hiding provenance.",
                ],
                "strong_signals": ["Mentions multi-stage builds", "Runs non-root", "Balances size, cache, and provenance"],
                "red_flags": ["Ships build tools in runtime", "Uses latest everywhere", "Runs as root without reason"],
                "practice_task": "Review a Dockerfile for base image, user, layers, copied files, and cache behavior.",
            },
            {
                "question": "Why deploy by image digest instead of only by tag?",
                "scenario": "Staging and production both say checkout:latest but behave differently.",
                "answer_outline": [
                    "Tags are mutable labels; digests identify exact image content.",
                    "Promotion should carry the tested artifact rather than rebuilding surprises.",
                    "Digest-based rollbacks are more auditable during incidents.",
                    "Tags can still be useful as human labels if the digest is recorded.",
                ],
                "strong_signals": ["Explains tag mutability", "Promotes tested artifacts", "Connects digest to rollback"],
                "red_flags": ["Trusts latest", "Rebuilds separately per environment", "Cannot identify what is running"],
                "practice_task": "Write a release note that records tag, digest, source commit, and scan result.",
            },
            {
                "question": "How do you reason about image vulnerability scan results?",
                "scenario": "A scan blocks release with critical findings in OS packages.",
                "answer_outline": [
                    "Identify package, severity, fix availability, exploitability, and whether the package is reachable at runtime.",
                    "Prefer base image updates or dependency updates over blanket exceptions.",
                    "Document temporary exceptions with owner, expiry, compensating controls, and follow-up.",
                    "Keep runtime images small to reduce scan surface.",
                ],
                "strong_signals": ["Reviews fix availability and reachability", "Uses expiring exceptions", "Improves base image hygiene"],
                "red_flags": ["Ignores scans", "Blocks forever without risk context", "Adds permanent exception"],
                "practice_task": "Create an image vulnerability triage record for one blocked release.",
            },
            {
                "question": "What can go wrong when copying files into a container image?",
                "scenario": "A release works locally but fails in Kubernetes because config and executable files are missing or unreadable.",
                "answer_outline": [
                    "Check build context, .dockerignore, working directory, COPY paths, file modes, and ownership.",
                    "Confirm the runtime user can read configs and execute binaries.",
                    "Separate build-time files from runtime files.",
                    "Add a smoke test that runs the final image command before pushing.",
                ],
                "strong_signals": ["Checks .dockerignore and ownership", "Tests final image", "Knows build vs runtime files"],
                "red_flags": ["Copies entire repo blindly", "Runs chmod 777", "Only tests outside the image"],
                "practice_task": "Write a final-image smoke check for an app container.",
            },
            {
                "question": "How would you structure local, CI, and production image workflows?",
                "scenario": "Developers want fast local builds, security wants repeatable production images.",
                "answer_outline": [
                    "Optimize local builds for speed while keeping the production Dockerfile reproducible.",
                    "Build once in CI, scan and attest the artifact, then promote the same digest.",
                    "Use separate dev conveniences without leaking them into production runtime.",
                    "Record source commit, build inputs, base image, and deployment digest.",
                ],
                "strong_signals": ["Separates dev convenience from production artifact", "Build once promote digest", "Records provenance"],
                "red_flags": ["Rebuilds on every deploy", "No scan/attestation", "Debug tools in prod image by default"],
                "practice_task": "Map image lifecycle from developer laptop to registry to Kubernetes rollout.",
            },
        ],
    },
    {
        "slug": "cicd-release-engineering-interview-pack",
        "title": "CI/CD Release Engineering Interview Pack",
        "domain": "CI/CD",
        "level_group": ADVANCED_LEVEL,
        "focus": "Quality gates, artifact promotion, OIDC, deployment environments, runner trust, canaries, and rollback.",
        "related_course_slug": "platform-cicd-release-engineering",
        "related_labs": ["design-safe-release-pipeline", "validate-helm-release-artifact"],
        "official_sources": [
            {"label": "GitHub Actions Security", "url": "https://docs.github.com/en/actions/how-tos/secure-your-work"},
            {"label": "GitHub Actions OIDC", "url": "https://docs.github.com/en/actions/concepts/security/openid-connect"},
            {"label": "Deployments and Environments", "url": "https://docs.github.com/en/actions/reference/deployments-and-environments"},
        ],
        "questions": [
            {
                "question": "Design a deployment pipeline for a Kubernetes service.",
                "scenario": "A team wants faster releases but production incidents increased after pipeline automation.",
                "answer_outline": [
                    "Map source checks, tests, image build, scan, SBOM, signing, Helm render, policy checks, deploy, smoke, and SLO gates.",
                    "Promote the same image digest through environments.",
                    "Use environment protection, approvals, and rollback rules for production.",
                    "Measure lead time, deployment frequency, change failure rate, and recovery time.",
                ],
                "strong_signals": ["Covers artifact and manifest gates", "Promotes digest", "Measures delivery and reliability"],
                "red_flags": ["Only adds a deploy job", "No post-deploy validation", "No rollback path"],
                "practice_task": "Create a quality-gate matrix for dev, stage, and production.",
            },
            {
                "question": "Why use OIDC for cloud deploy credentials in CI?",
                "scenario": "A repository stores long-lived AWS keys for production deployment.",
                "answer_outline": [
                    "OIDC lets workflows request short-lived cloud credentials through a trust relationship.",
                    "Scope trust by repository, branch, environment, audience, and job context.",
                    "Remove long-lived static cloud secrets from the CI system where possible.",
                    "Audit assume-role events and keep deploy roles least privilege.",
                ],
                "strong_signals": ["Short-lived credentials", "Scopes trust claims", "Mentions audit and least privilege"],
                "red_flags": ["Keeps static keys forever", "Allows any branch to deploy", "No CloudTrail review"],
                "practice_task": "Write an OIDC trust review checklist for a production deploy role.",
            },
            {
                "question": "How do you secure self-hosted runners?",
                "scenario": "A platform team uses self-hosted runners with network access to private clusters.",
                "answer_outline": [
                    "Treat runners as production control-plane infrastructure.",
                    "Separate runner pools by trust level, repository, environment, and network access.",
                    "Use ephemeral or frequently recycled runners where possible.",
                    "Control secrets, outbound access, logs, cache poisoning, and untrusted pull-request execution.",
                ],
                "strong_signals": ["Separates trust zones", "Understands runner network risk", "Handles untrusted PRs"],
                "red_flags": ["Runs all repos on one privileged runner", "Caches secrets", "Lets forks deploy"],
                "practice_task": "Threat-model a runner group that can deploy to EKS.",
            },
            {
                "question": "What makes a canary release safe enough to automate?",
                "scenario": "Leadership wants automatic production rollout if the first 5% looks healthy.",
                "answer_outline": [
                    "Define canary population, duration, success metrics, and automatic pause/rollback conditions.",
                    "Use user-impact signals such as error rate, latency, saturation, and business transactions.",
                    "Compare canary to baseline and watch dependencies, not just pod readiness.",
                    "Keep manual override and incident communication paths clear.",
                ],
                "strong_signals": ["Defines pause criteria", "Uses user-impact metrics", "Compares baseline"],
                "red_flags": ["Only checks Deployment available", "No rollback trigger", "No business signal"],
                "practice_task": "Write canary promotion rules for checkout using latency and error-budget signals.",
            },
            {
                "question": "How do you make rollback reliable in a pipeline?",
                "scenario": "A failed release rolls back Kubernetes objects but the database migration already ran.",
                "answer_outline": [
                    "Separate application rollback, data rollback, feature flags, and compatibility windows.",
                    "Keep immutable artifact history and deployment metadata.",
                    "Design migrations to be backward compatible or explicitly gated.",
                    "Practice rollback in non-prod and document the point of no return.",
                ],
                "strong_signals": ["Separates app and data rollback", "Uses compatibility windows", "Practices rollback"],
                "red_flags": ["Assumes helm rollback fixes data", "No artifact history", "No migration strategy"],
                "practice_task": "Add rollback assumptions and limits to a release runbook.",
            },
        ],
    },
    {
        "slug": "production-eks-architecture-interview-pack",
        "title": "Production EKS and AWS Architecture Interview Pack",
        "domain": "EKS",
        "level_group": ADVANCED_LEVEL,
        "focus": "Private access, endpoint design, multi-AZ resilience, Karpenter, cost guardrails, add-ons, and upgrade risk.",
        "related_course_slug": "platform-production-eks-architecture",
        "related_labs": ["design-production-eks-review", "diagnose-eks-ip-exhaustion"],
        "official_sources": [
            {"label": "Amazon EKS Best Practices Guide", "url": "https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html"},
            {"label": "Amazon VPC CNI Best Practices", "url": "https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html"},
            {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        ],
        "questions": [
            {
                "question": "How would you design access to a private EKS endpoint?",
                "scenario": "Security wants no public control-plane endpoint, but operators and CI still need access.",
                "answer_outline": [
                    "Define operator, automation, and break-glass paths before disabling public access.",
                    "Use private networking such as VPN, Direct Connect, bastion, SSM, or private runners based on org constraints.",
                    "Protect kubeconfig, IAM auth, audit logs, and emergency access.",
                    "Test failure modes: network outage, identity outage, and incident response outside business hours.",
                ],
                "strong_signals": ["Designs access paths", "Includes break-glass", "Tests failure modes"],
                "red_flags": ["Locks out CI/on-call", "No audit path", "Treats private endpoint as complete security"],
                "practice_task": "Draw a private EKS access diagram with normal and emergency paths.",
            },
            {
                "question": "How do you review multi-AZ resilience for EKS workloads?",
                "scenario": "A workload claims high availability but all replicas depend on one zone.",
                "answer_outline": [
                    "Check node groups, subnet placement, Pod topology spread, PDBs, storage class, and load balancer targets.",
                    "Look for zonal volumes, single-AZ NAT, and dependency concentration.",
                    "Model what happens during one-AZ loss and during maintenance disruption.",
                    "Tie placement decisions to SLOs and cost tradeoffs.",
                ],
                "strong_signals": ["Checks topology spread and storage", "Models AZ loss", "Includes dependencies"],
                "red_flags": ["Counts replicas only", "Ignores zonal storage", "No disruption budget review"],
                "practice_task": "Create an AZ-failure review checklist for a stateful and stateless service.",
            },
            {
                "question": "What guardrails would you put around Karpenter or dynamic node provisioning?",
                "scenario": "Teams want faster scale-out, but finance and reliability worry about surprise capacity.",
                "answer_outline": [
                    "Define allowed instance families, architectures, zones, capacity types, taints, labels, and limits.",
                    "Set disruption budgets, consolidation behavior, and workload compatibility expectations.",
                    "Monitor pending Pods, provisioning latency, interruption handling, and cost.",
                    "Keep critical workloads protected from overly aggressive consolidation.",
                ],
                "strong_signals": ["Uses NodePool constraints", "Balances cost and disruption", "Monitors provisioning outcomes"],
                "red_flags": ["Allows every instance type", "No disruption policy", "No cost visibility"],
                "practice_task": "Write a dynamic capacity policy for critical and batch workloads.",
            },
            {
                "question": "How do you plan an EKS upgrade for a platform with many tenants?",
                "scenario": "The cluster minor version is nearing support deadlines and tenants own their charts.",
                "answer_outline": [
                    "Inventory APIs, CRDs, webhooks, controllers, add-ons, clients, Helm renders, and tenant owners.",
                    "Test against the target version and publish deadlines for incompatible manifests.",
                    "Sequence control plane, add-ons, nodes, and workload validation.",
                    "Define pause criteria, rollback boundaries, communication, and post-upgrade watch windows.",
                ],
                "strong_signals": ["Includes tenants and CRDs", "Sequences add-ons and nodes", "Has communication plan"],
                "red_flags": ["Calls upgrade a button click", "No deprecated API inventory", "No tenant ownership"],
                "practice_task": "Build a tenant-facing upgrade readiness checklist.",
            },
            {
                "question": "How do you balance NAT gateway, load balancer, and node costs against reliability?",
                "scenario": "The platform bill is rising, and a team proposes collapsing everything into fewer AZs.",
                "answer_outline": [
                    "Break down cost by traffic path, NAT, load balancers, idle requests, node utilization, and storage.",
                    "Connect savings proposals to availability and failure-mode changes.",
                    "Use right-sizing, bin-packing, spot where appropriate, and architecture changes before cutting resilience blindly.",
                    "Track cost per service with ownership labels and review cadence.",
                ],
                "strong_signals": ["Explains cost drivers", "Protects resilience tradeoffs", "Uses ownership labels"],
                "red_flags": ["Cuts AZs without SLO discussion", "Only blames nodes", "No chargeback or review loop"],
                "practice_task": "Write a cost review note that separates waste from intentional resilience spend.",
            },
        ],
    },
    {
        "slug": "incident-response-interview-pack",
        "title": "Incident Response and Postmortem Interview Pack",
        "domain": "Incident Response",
        "level_group": ADVANCED_LEVEL,
        "focus": "Severity, incident command, communication, mitigation, escalation, timelines, postmortems, and game days.",
        "related_course_slug": "platform-sre-observability-kubernetes",
        "related_labs": ["write-slo-backed-runbook"],
        "official_sources": [
            {"label": "Google SRE Managing Incidents", "url": "https://sre.google/sre-book/managing-incidents/"},
            {"label": "Google Incident Management Guide", "url": "https://sre.google/resources/practices-and-processes/incident-management-guide/"},
            {"label": "Google SRE Postmortem Culture", "url": "https://sre.google/sre-book/postmortem-culture/"},
        ],
        "questions": [
            {
                "question": "How do you structure an incident response when checkout is down?",
                "scenario": "Multiple engineers are jumping into Slack with theories while customers cannot pay.",
                "answer_outline": [
                    "Name severity, incident commander, communications owner, subject-matter responders, and customer impact.",
                    "Create a timeline and separate diagnosis from mitigation workstreams.",
                    "Use safe mitigations first and communicate status at a predictable cadence.",
                    "Capture decisions and evidence for post-incident learning.",
                ],
                "strong_signals": ["Assigns roles", "Separates diagnosis and mitigation", "Communicates predictably"],
                "red_flags": ["Everyone debugs at once", "No impact statement", "No timeline"],
                "practice_task": "Draft the first ten minutes of an incident channel transcript.",
            },
            {
                "question": "How do you decide between rollback, failover, scaling, and feature disablement?",
                "scenario": "Error rate is high after a release, but database latency is also elevated.",
                "answer_outline": [
                    "Identify the user-impacting symptom, recent changes, and likely blast radius.",
                    "Choose mitigation that reduces impact fastest with the least irreversible risk.",
                    "Check whether rollback is compatible with data/schema state.",
                    "Keep communication clear about mitigation confidence and validation signal.",
                ],
                "strong_signals": ["Compares mitigation tradeoffs", "Checks data compatibility", "Validates user impact"],
                "red_flags": ["Always rolls back", "Always scales", "No validation signal"],
                "practice_task": "Write a mitigation decision table for a bad release plus database latency.",
            },
            {
                "question": "What makes a postmortem useful rather than performative?",
                "scenario": "The organization writes long incident docs but repeats the same failure.",
                "answer_outline": [
                    "Focus on contributing factors, detection gaps, decision points, and system improvements.",
                    "Create small, owned, prioritized follow-up actions with due dates.",
                    "Include what went well and what signals were missing.",
                    "Share learning without blaming individuals for normal human decisions under pressure.",
                ],
                "strong_signals": ["Actionable follow-ups", "Blameless but accountable", "Finds detection gaps"],
                "red_flags": ["Names a person as root cause", "No owners", "Only writes narrative"],
                "practice_task": "Rewrite a blame-heavy incident summary into learning-oriented findings.",
            },
            {
                "question": "How do you keep runbooks current?",
                "scenario": "On-call responders do not trust the runbook because it failed during the last incident.",
                "answer_outline": [
                    "Add ownership, review cadence, last-tested date, and service/version assumptions.",
                    "Test runbooks in drills, game days, and post-incident reviews.",
                    "Link commands to dashboards, alerts, and source-of-truth manifests.",
                    "Remove stale steps and mark risky actions clearly.",
                ],
                "strong_signals": ["Includes review cadence", "Tests through drills", "Marks risky actions"],
                "red_flags": ["Runbook has no owner", "Only updates during incidents", "Command dump without context"],
                "practice_task": "Add owner, review date, and validation steps to one runbook section.",
            },
            {
                "question": "What would you practice in a platform game day?",
                "scenario": "The team wants to prove they can handle EKS incidents before the next peak event.",
                "answer_outline": [
                    "Choose a realistic failure mode tied to SLOs, such as CNI exhaustion, bad rollout, DNS issue, or noisy alerting.",
                    "Define scope, abort criteria, observers, and expected evidence.",
                    "Practice incident roles, dashboards, runbook steps, and customer communication.",
                    "Turn gaps into platform backlog items and training material.",
                ],
                "strong_signals": ["Clear scope and abort criteria", "Exercises roles and evidence", "Feeds backlog"],
                "red_flags": ["Breaks prod casually", "No learning objective", "No follow-up"],
                "practice_task": "Design a 45-minute game day for Service 503 debugging.",
            },
        ],
    },
    {
        "slug": "finops-capacity-interview-pack",
        "title": "FinOps and Platform Capacity Interview Pack",
        "domain": "FinOps",
        "level_group": ADVANCED_LEVEL,
        "focus": "Cost allocation, rightsizing, idle resources, NAT and load balancer spend, spot capacity, budgets, and reliability tradeoffs.",
        "related_course_slug": "platform-production-eks-architecture",
        "related_labs": ["design-production-eks-review", "review-terraform-eks-plan"],
        "official_sources": [
            {"label": "AWS Cost Optimization Pillar", "url": "https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html"},
            {"label": "AWS Cost Optimization Foundation", "url": "https://docs.aws.amazon.com/whitepapers/latest/cost-optimization-laying-the-foundation/welcome.html"},
            {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        ],
        "questions": [
            {
                "question": "How do you start a Kubernetes cost review without harming reliability?",
                "scenario": "Leadership asks for a 25% EKS cost reduction this quarter.",
                "answer_outline": [
                    "Segment costs by service, owner, environment, cluster, node group, load balancer, NAT, storage, and data transfer.",
                    "Separate idle waste from deliberate resilience spend.",
                    "Review requests versus usage, replica needs, scheduling constraints, and SLOs.",
                    "Prioritize reversible savings and measure reliability impact.",
                ],
                "strong_signals": ["Uses ownership allocation", "Protects SLO tradeoffs", "Distinguishes waste from resilience"],
                "red_flags": ["Cuts replicas blindly", "No owner labels", "Ignores data transfer/NAT"],
                "practice_task": "Create a cost review worksheet for one namespace.",
            },
            {
                "question": "How do requests and limits affect both cost and reliability?",
                "scenario": "A service requests far more CPU than it uses, but latency spikes during load tests.",
                "answer_outline": [
                    "Requests drive scheduling and reserved capacity; limits can create throttling or kill behavior depending on resource.",
                    "Compare usage percentiles, saturation, HPA behavior, and latency under load.",
                    "Right-size with owners and rollback windows rather than one global ratio.",
                    "Keep critical workloads protected with enough headroom.",
                ],
                "strong_signals": ["Connects requests to bin-packing", "Mentions throttling and OOM", "Uses percentiles"],
                "red_flags": ["Sets everything tiny", "Ignores load testing", "No owner review"],
                "practice_task": "Write a right-sizing proposal with p50/p95 usage and SLO context.",
            },
            {
                "question": "Where do hidden AWS costs appear around EKS?",
                "scenario": "Compute is flat but the AWS bill keeps growing.",
                "answer_outline": [
                    "Inspect NAT gateway processing, cross-AZ traffic, load balancers, EBS volumes, snapshots, logs, metrics, and public egress.",
                    "Connect network architecture to cost paths before deleting resources.",
                    "Look for orphaned resources and unowned environments.",
                    "Add tags, budgets, alerts, and cleanup ownership.",
                ],
                "strong_signals": ["Names NAT and cross-AZ traffic", "Finds orphaned resources", "Uses tags and budgets"],
                "red_flags": ["Only reviews EC2", "Deletes shared resources blindly", "No cost owner"],
                "practice_task": "Build a hidden-cost checklist for an EKS platform account.",
            },
            {
                "question": "When is spot capacity appropriate for platform workloads?",
                "scenario": "A team wants to run every workload on spot instances to reduce cost.",
                "answer_outline": [
                    "Use spot for interruption-tolerant workloads with retry, checkpointing, or replica diversity.",
                    "Protect critical control-plane-adjacent and latency-sensitive workloads with safer capacity.",
                    "Mix capacity types and instance families to avoid correlated interruption.",
                    "Test interruption handling, disruption budgets, and autoscaler behavior.",
                ],
                "strong_signals": ["Matches workload tolerance", "Diversifies capacity", "Tests interruptions"],
                "red_flags": ["All workloads on spot", "No PDB review", "No retry or checkpointing"],
                "practice_task": "Classify five workloads by spot suitability and required guardrails.",
            },
            {
                "question": "How do you create cost accountability without making teams afraid to use the platform?",
                "scenario": "Chargeback is proposed after several teams over-provisioned services.",
                "answer_outline": [
                    "Start with showback, owner labels, service-level reports, and education before punitive controls.",
                    "Give teams clear levers: requests, replicas, environment cleanup, storage, and traffic path choices.",
                    "Set budgets and alerts with context, not surprise bills.",
                    "Tie platform defaults to efficient choices so good behavior is easy.",
                ],
                "strong_signals": ["Uses showback and education", "Gives teams levers", "Improves defaults"],
                "red_flags": ["Only blames teams", "No data quality", "Cost controls break reliability"],
                "practice_task": "Draft a team-facing cost report with three recommended actions.",
            },
        ],
    },
]


def interview_question(
    question: str,
    scenario: str,
    answer_outline: list[str],
    strong_signals: list[str],
    red_flags: list[str],
    practice_task: str,
) -> dict:
    return {
        "question": question,
        "scenario": scenario,
        "answer_outline": answer_outline,
        "strong_signals": strong_signals,
        "red_flags": red_flags,
        "practice_task": practice_task,
    }


JOB_SEARCH_INTERVIEW_PACKS = [
    {
        "slug": "career-recruiter-screen-interview-pack",
        "title": "DevOps and SRE Recruiter Screen Pack",
        "domain": "Career",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "Fast, credible answers for recruiter screens, hiring-manager screens, layoff context, salary, scope, and role fit.",
        "related_course_slug": "platform-engineering-product-operating-model",
        "related_labs": ["create-platform-golden-path", "write-slo-backed-runbook"],
        "official_sources": [
            {"label": "CNCF Platforms Whitepaper", "url": "https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
            {"label": "Google SRE Service Level Objectives", "url": "https://sre.google/sre-book/service-level-objectives/"},
            {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        ],
        "questions": [
            interview_question(
                "Give me your two-minute DevOps/SRE background.",
                "A recruiter asks for a quick summary before deciding whether to pass you to the hiring manager.",
                [
                    "Lead with role identity: systems you operate, cloud/platform scope, and production ownership.",
                    "Name two or three concrete strengths such as Kubernetes, Terraform, CI/CD, observability, incident response, or AWS.",
                    "Give one specific outcome with evidence.",
                    "Close with the role you are targeting now and why it fits.",
                ],
                ["Specific scope", "Evidence-backed outcome", "Clear target role"],
                ["Tool list with no ownership", "Apologetic layoff framing", "No production examples"],
                "Write and rehearse a 120-second background answer with one metric and one incident or project artifact.",
            ),
            interview_question(
                "Why are you looking now, and how do you discuss a layoff?",
                "You were laid off and need to answer directly without sounding defensive.",
                [
                    "State the layoff briefly and neutrally without over-explaining.",
                    "Pivot to what you owned, what you learned, and what you are looking for next.",
                    "Show active preparation: labs, portfolio artifacts, interview drills, and current platform topics.",
                    "Avoid blaming prior employers or revealing confidential details.",
                ],
                ["Calm concise framing", "Forward-looking", "Shows active preparation"],
                ["Blames people", "Sounds ashamed", "Turns the answer into a long story"],
                "Draft a 45-second layoff answer and pair it with a portfolio proof point.",
            ),
            interview_question(
                "What roles are you best matched for?",
                "A recruiter has DevOps, cloud engineer, SRE, and platform engineer roles open.",
                [
                    "Map your experience to role responsibilities rather than job titles.",
                    "Separate build-and-release, cloud infrastructure, reliability operations, and platform product work.",
                    "Name must-have and stretch areas honestly.",
                    "Ask clarifying questions about on-call, cloud scope, Kubernetes maturity, and IaC ownership.",
                ],
                ["Clarifies role scope", "Knows adjacent titles", "Honest about depth"],
                ["Says yes to everything", "Cannot explain SRE vs DevOps", "No questions for recruiter"],
                "Create a role-fit matrix for DevOps, SRE, platform engineer, and cloud engineer postings.",
            ),
            interview_question(
                "What compensation and availability answer keeps you moving forward?",
                "The recruiter asks salary expectations and start date early.",
                [
                    "Give a researched range or say you are aligned with market for the scope while asking for budget.",
                    "Separate base, bonus, equity, on-call, remote, and benefits when relevant.",
                    "Be clear on availability and interview timeline.",
                    "Avoid negotiating against yourself before role level is known.",
                ],
                ["Asks for budget", "Considers full package", "Clear availability"],
                ["Gives one desperate number", "Ignores on-call load", "Cannot state timeline"],
                "Write a salary-range answer with a follow-up question about level, on-call, and total compensation.",
            ),
            interview_question(
                "Tell me about your strongest platform project.",
                "A hiring manager asks for the project that best proves you can help their team quickly.",
                [
                    "Frame the business or engineering problem.",
                    "Explain architecture, tools, tradeoffs, and your direct contribution.",
                    "Name production evidence: reliability, cost, lead time, security, incident reduction, or adoption.",
                    "Explain what you would improve with more time.",
                ],
                ["Problem-first", "Clear contribution", "Evidence and tradeoffs"],
                ["Tutorial recap", "No ownership", "Cannot say what changed"],
                "Convert one project into a STAR answer with architecture, commands, screenshots, and measurable outcome.",
            ),
            interview_question(
                "What is your biggest current skill gap?",
                "The interviewer wants honesty without hearing that you are unprepared.",
                [
                    "Choose a real but bounded gap that does not invalidate the role.",
                    "Explain what you already know, what you are practicing, and how you close gaps on the job.",
                    "Tie the gap to a study plan, lab, or official docs.",
                    "Avoid generic perfectionism or claiming no gaps.",
                ],
                ["Bounded gap", "Active plan", "Self-aware"],
                ["Fatal gap for role", "No learning plan", "Fake weakness"],
                "Write a skill-gap answer for one tool you are learning and attach a 7-day study plan.",
            ),
            interview_question(
                "How do you communicate during incidents?",
                "A manager screens for whether you can operate under pressure with product and engineering teams.",
                [
                    "State user impact, severity, owners, current hypothesis, next update time, and mitigation path.",
                    "Separate facts from guesses.",
                    "Use concise updates for stakeholders and detailed notes for responders.",
                    "Close the loop with post-incident follow-up.",
                ],
                ["Clear impact statement", "Predictable updates", "Facts versus hypotheses"],
                ["Spams raw logs", "Goes silent", "Blames teams during incident"],
                "Write three incident updates: initial page, mitigation in progress, and recovery confirmed.",
            ),
            interview_question(
                "What questions do you ask the interviewer?",
                "The interviewer leaves five minutes for your questions.",
                [
                    "Ask about production ownership, on-call health, deployment process, reliability goals, and platform maturity.",
                    "Ask what success looks like in 30, 60, and 90 days.",
                    "Ask about current pain: incidents, cloud cost, CI/CD, Kubernetes, observability, or IaC drift.",
                    "Use the answer to decide whether the role is healthy and aligned.",
                ],
                ["Asks operator-level questions", "Learns team pain", "Evaluates role fit"],
                ["No questions", "Only asks perks", "Asks questions answered earlier"],
                "Prepare ten questions grouped by role scope, production health, team culture, and first-90-day expectations.",
            ),
        ],
    },
    {
        "slug": "behavioral-star-sre-interview-pack",
        "title": "Behavioral STAR Stories for SRE and DevOps Pack",
        "domain": "Career",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "Behavioral stories that prove judgment: incidents, conflict, automation, ownership, learning, and communication.",
        "related_course_slug": "platform-engineering-product-operating-model",
        "related_labs": ["write-slo-backed-runbook", "create-platform-golden-path"],
        "official_sources": [
            {"label": "Google SRE Managing Incidents", "url": "https://sre.google/sre-book/managing-incidents/"},
            {"label": "Google SRE Postmortem Culture", "url": "https://sre.google/sre-book/postmortem-culture/"},
            {"label": "CNCF Platforms Whitepaper", "url": "https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
        ],
        "questions": [
            interview_question(
                "Tell me about a production incident you handled.",
                "The interviewer wants your operating judgment, not a heroic war story.",
                [
                    "Use STAR: situation, task, action, result.",
                    "Include customer impact, detection, mitigation, communication, and follow-up.",
                    "Explain what you personally owned and what the team changed afterward.",
                    "Keep confidential details out while preserving technical credibility.",
                ],
                ["Impact and mitigation", "Personal ownership", "Learning loop"],
                ["Blames one person", "No result", "Only describes commands"],
                "Write a 3-minute incident story and a 30-second summary version.",
            ),
            interview_question(
                "Describe a time you automated toil.",
                "A platform team wants to know whether you automate responsibly.",
                [
                    "Explain the repeated manual pain and its risk.",
                    "Describe the smallest useful automation and guardrails.",
                    "Show adoption, time saved, error reduction, or reliability improvement.",
                    "Mention maintenance ownership and failure behavior.",
                ],
                ["Toil and risk quantified", "Guardrails", "Measured adoption"],
                ["Automated for novelty", "No owner", "No fallback"],
                "Turn one script, pipeline, or template into a STAR story with before/after evidence.",
            ),
            interview_question(
                "Tell me about a time you disagreed with a senior engineer or manager.",
                "The interviewer is testing collaboration and technical courage.",
                [
                    "State the shared goal and the risk you saw.",
                    "Use evidence: metrics, incidents, docs, plan output, or operational constraints.",
                    "Explain how you listened, proposed options, and reached a decision.",
                    "Share the outcome and what you learned.",
                ],
                ["Evidence-based disagreement", "Respectful collaboration", "Decision outcome"],
                ["Frames it as winning", "No evidence", "Avoids conflict entirely"],
                "Prepare a disagreement story involving reliability, cost, security, or release risk.",
            ),
            interview_question(
                "Give an example of learning a new tool quickly.",
                "You may not match every tool in the posting, so the interviewer tests learning velocity.",
                [
                    "Name the tool, deadline, and production or project context.",
                    "Show how you used official docs, labs, examples, and peer review.",
                    "Explain the artifact you produced and how you validated it.",
                    "Connect the learning method to the current role's stack.",
                ],
                ["Structured learning", "Validated artifact", "Transferable method"],
                ["Claims instant mastery", "No validation", "Only watched tutorials"],
                "Write a learning story for Terraform, Kubernetes, AWS IAM, or observability.",
            ),
            interview_question(
                "Tell me about a mistake you made.",
                "The interviewer wants accountability and operational maturity.",
                [
                    "Choose a real mistake with bounded impact.",
                    "Explain detection, communication, correction, and prevention.",
                    "Own your part without self-destruction.",
                    "Show the durable change: test, runbook, alert, review checklist, or automation.",
                ],
                ["Accountability", "Prevention", "Calm scope"],
                ["Blames others", "No learning", "Chooses a catastrophic unresolved mistake"],
                "Write a mistake story that ends with a concrete system improvement.",
            ),
            interview_question(
                "How do you handle being on call?",
                "A hiring manager wants to know if you understand operational load.",
                [
                    "Discuss alert quality, runbooks, escalation, handoff, and incident review.",
                    "Explain how you protect focus work while meeting support obligations.",
                    "Name signs of unhealthy on-call and how you improve them.",
                    "Tie on-call to reliability ownership rather than punishment.",
                ],
                ["Understands alert quality", "Mentions handoff", "Improves on-call system"],
                ["Says on-call is just availability", "Accepts noisy paging", "No learning loop"],
                "Create a healthy-on-call checklist you can discuss in interviews.",
            ),
            interview_question(
                "How do you explain technical risk to non-engineers?",
                "Product wants a launch date, but the platform readiness evidence is weak.",
                [
                    "Translate risk into user impact, probability, blast radius, and mitigation options.",
                    "Offer choices with tradeoffs rather than only saying no.",
                    "Use plain language and one or two concrete examples.",
                    "Document the decision and revisit trigger.",
                ],
                ["Business-language risk", "Options with tradeoffs", "Decision record"],
                ["Uses jargon", "Only blocks", "No recommendation"],
                "Write a launch-risk explanation for missing rollback, weak alerts, or unsafe IAM.",
            ),
            interview_question(
                "What makes you a strong teammate during a job transition?",
                "The interviewer wants confidence that urgency will not turn into chaos.",
                [
                    "Show humility, learning discipline, and willingness to own unglamorous work.",
                    "Describe how you ask questions, document findings, and ramp up without creating risk.",
                    "Explain how your recent preparation maps to their needs.",
                    "Keep the answer grounded and specific.",
                ],
                ["Mature ramp-up plan", "Documentation habit", "Role-specific preparation"],
                ["No ramp-up plan", "Overpromises", "Dismisses team context"],
                "Prepare a first-30-days answer for a team with Kubernetes, Terraform, and AWS incidents.",
            ),
        ],
    },
    {
        "slug": "live-troubleshooting-pairing-interview-pack",
        "title": "Live Troubleshooting and Pairing Interview Pack",
        "domain": "Platform Engineering",
        "level_group": ADVANCED_LEVEL,
        "focus": "How to think aloud in practical interviews: commands, hypotheses, safety, prioritization, and communication.",
        "related_course_slug": "platform-kubectl-debugging-basics",
        "related_labs": ["trace-service-to-pod", "debug-crashloop-imagepull", "review-terraform-eks-plan"],
        "official_sources": [
            {"label": "Kubernetes Debugging Tasks", "url": "https://kubernetes.io/docs/tasks/debug/"},
            {"label": "Terraform Plan Command", "url": "https://developer.hashicorp.com/terraform/cli/commands/plan"},
            {"label": "Prometheus Alerting Practices", "url": "https://prometheus.io/docs/practices/alerting/"},
        ],
        "questions": [
            interview_question(
                "How do you start a live troubleshooting exercise when the prompt is vague?",
                "The interviewer says, 'the app is down,' and waits.",
                [
                    "Clarify user symptom, scope, timeline, recent changes, and allowed environment.",
                    "State your first hypothesis and first safe read-only checks.",
                    "Think aloud in short loops: command, expected signal, interpretation, next step.",
                    "Avoid making destructive changes unless the exercise explicitly allows it.",
                ],
                ["Clarifies scope", "Read-only first", "Explains reasoning aloud"],
                ["Runs random commands", "Goes silent", "Mutates without permission"],
                "Practice a five-minute troubleshooting monologue for a Service 503.",
            ),
            interview_question(
                "What do you say when you do not know the exact command?",
                "A practical interview uses a tool variant you have not used recently.",
                [
                    "State the concept you need and the command shape you expect.",
                    "Use help, docs, examples, or safer read-only alternatives.",
                    "Explain what output you are trying to obtain.",
                    "Keep confidence in the reasoning even if syntax needs lookup.",
                ],
                ["Concept over memorization", "Uses help safely", "Explains desired output"],
                ["Bluffs wrong syntax", "Panics", "Abandons the investigation"],
                "Write fallback phrases for kubectl, terraform, aws, helm, and git commands.",
            ),
            interview_question(
                "How do you avoid rabbit holes in a live debug?",
                "Ten minutes remain and there are many possible causes.",
                [
                    "Anchor on user impact and the most discriminating next signal.",
                    "Time-box each branch and summarize what has been ruled out.",
                    "Prefer evidence that changes the decision tree.",
                    "Ask for constraints or hints when the exercise clearly lacks data.",
                ],
                ["Time-boxes", "Summarizes ruled-out paths", "Chooses discriminating checks"],
                ["Chases every clue", "Repeats same command", "Never updates hypothesis"],
                "Create a time-boxed debug checklist for Pod Pending, AccessDenied, and failed rollout.",
            ),
            interview_question(
                "How would you review a Terraform plan live?",
                "The interviewer gives you a plan with IAM, security group, and node group changes.",
                [
                    "Scan for create, update, replace, destroy, unknown, and sensitive changes.",
                    "Prioritize blast radius: IAM, network, data, capacity, and deletion.",
                    "Ask what environment, backend, workspace, and recent incident context apply.",
                    "Summarize approve, block, or needs-more-evidence with validation steps.",
                ],
                ["Prioritizes blast radius", "Asks backend/environment", "Gives decision summary"],
                ["Reads every line equally", "Approves because plan succeeded", "No validation"],
                "Practice a two-minute plan review summary using risk categories.",
            ),
            interview_question(
                "How do you debug AccessDenied in a pairing interview?",
                "A Pod or CI job fails with AWS AccessDenied and the interviewer expects structured reasoning.",
                [
                    "Identify actual principal, action, resource, condition, and request context.",
                    "Separate trust failure from permission-policy denial.",
                    "Check service account, OIDC or Pod Identity, assume-role path, and CloudTrail where available.",
                    "Propose least-privilege fix and verification command.",
                ],
                ["Finds actual principal", "Trust versus permission", "Least-privilege fix"],
                ["Adds admin", "Only reads Kubernetes YAML", "Cannot state action/resource"],
                "Build an AccessDenied live-debug script from symptom to verified fix.",
            ),
            interview_question(
                "How do you debug a noisy alert in a live interview?",
                "The interviewer shows an alert that fired five times this week without user impact.",
                [
                    "Ask whether it is urgent, actionable, user-impacting, and owned.",
                    "Check labels, thresholds, duration, route, runbook, and dashboard links.",
                    "Decide page, ticket, dashboard, or delete.",
                    "Suggest a symptom-based replacement if the current alert is cause-only noise.",
                ],
                ["Alert quality framework", "Route and owner review", "Suggests replacement"],
                ["Accepts all pages", "Deletes without replacement", "No user-impact question"],
                "Rewrite one noisy resource alert into a symptom-focused alert or ticket.",
            ),
            interview_question(
                "How do you communicate partial progress in a live exercise?",
                "You are not finished, but the interviewer asks where you are.",
                [
                    "Summarize known facts, ruled-out causes, current hypothesis, and next check.",
                    "State confidence level and what evidence would change your mind.",
                    "Avoid pretending the investigation is complete.",
                    "Keep the answer short enough to preserve time.",
                ],
                ["Clear facts and hypothesis", "States confidence", "Next evidence"],
                ["Overstates certainty", "Lists commands without meaning", "No next step"],
                "Practice a 20-second debug checkpoint update.",
            ),
            interview_question(
                "How do you close a troubleshooting exercise strongly?",
                "The clock ends before the entire system is fixed.",
                [
                    "State likely cause, evidence, safest next action, validation, and follow-up artifact.",
                    "Name remaining uncertainty and how you would resolve it.",
                    "Mention source-of-truth fix, runbook, alert, or test improvement.",
                    "Do not invent evidence you did not collect.",
                ],
                ["Evidence-based close", "Names uncertainty", "Suggests durable follow-up"],
                ["Pretends complete fix", "No validation", "No source-of-truth plan"],
                "Write closing summaries for Service 503, bad rollout, and Terraform drift scenarios.",
            ),
        ],
    },
    {
        "slug": "aws-core-operations-interview-pack",
        "title": "AWS Core Operations Interview Pack",
        "domain": "AWS Operations",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "VPC paths, ALB health, Route 53, CloudWatch, IAM context, autoscaling, backups, and operational readiness.",
        "related_course_slug": "platform-eks-operations",
        "related_labs": ["design-production-eks-review", "diagnose-eks-ip-exhaustion"],
        "official_sources": [
            {"label": "Amazon CloudWatch User Guide", "url": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html"},
            {"label": "Amazon VPC User Guide", "url": "https://docs.aws.amazon.com/vpc/latest/userguide/how-it-works.html"},
            {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        ],
        "questions": [
            interview_question(
                "An ALB has unhealthy targets after a deploy. What do you inspect?",
                "Traffic fails through the load balancer, but Pods look mostly healthy.",
                [
                    "Check target group health reason, listener rule, path, port, protocol, and security groups.",
                    "Compare ALB health check path with Service, Ingress, readiness probe, and app route.",
                    "Inspect subnet/AZ target registration and controller events if Kubernetes owns the ALB.",
                    "Validate from both AWS target health and Kubernetes endpoint readiness.",
                ],
                ["Connects ALB and Kubernetes signals", "Checks health path/port", "Looks at security groups"],
                ["Only checks Pods", "Changes health check blindly", "Ignores target group reason"],
                "Create an ALB unhealthy-target checklist with AWS and Kubernetes evidence.",
            ),
            interview_question(
                "Explain private subnet egress to a developer.",
                "A workload in a private subnet cannot call an external API.",
                [
                    "Explain route table, NAT gateway or egress path, security group, NACL, DNS, and endpoint policies.",
                    "Check whether failure is DNS, routing, firewall, TLS, or application timeout.",
                    "Use flow logs or controlled tests when available.",
                    "Discuss cost and resilience tradeoffs of NAT per AZ versus shared egress.",
                ],
                ["Clear network path", "Separates DNS/routing/firewall", "Mentions cost/resilience"],
                ["Says private subnet has no internet by magic", "Ignores route tables", "No test plan"],
                "Draw private subnet egress and name one command or console signal per hop.",
            ),
            interview_question(
                "What CloudWatch alarms would you page on for a production API?",
                "The team has CPU alarms but misses user-visible outages.",
                [
                    "Start with availability, latency, error rate, saturation, and dependency symptoms.",
                    "Use dimensions and thresholds that reflect service ownership and impact.",
                    "Route urgent actionable symptoms to page; slower risks to tickets.",
                    "Link alarms to dashboards, runbooks, and mitigation choices.",
                ],
                ["Symptom-first alarms", "Actionable route", "Runbook links"],
                ["Pages on every CPU spike", "No owner", "No dashboard/runbook"],
                "Rewrite three CloudWatch alarms into page, ticket, or dashboard categories.",
            ),
            interview_question(
                "How do you investigate intermittent DNS issues in AWS?",
                "Some clients intermittently resolve the wrong endpoint or fail to resolve at all.",
                [
                    "Check hosted zone, record type, TTL, health checks, resolver path, split-horizon assumptions, and recent changes.",
                    "Compare results from affected networks and known-good networks.",
                    "Look for caching, propagation, conditional forwarding, and private hosted-zone associations.",
                    "Document whether the failure is resolution, routing, or application health.",
                ],
                ["Understands hosted zones and TTL", "Tests multiple vantage points", "Separates DNS from app health"],
                ["Flushes caches only", "No private hosted-zone check", "Treats DNS as static"],
                "Write a Route 53 triage note with record, TTL, resolver, and affected clients.",
            ),
            interview_question(
                "How do you review backup and restore readiness?",
                "A team says backups are enabled but has never restored.",
                [
                    "Ask for RPO, RTO, backup scope, retention, encryption, access, and cross-account or cross-region needs.",
                    "Verify restore procedure, owner, test cadence, and dependency ordering.",
                    "Check monitoring for backup failures and storage cost growth.",
                    "Treat untested backups as assumptions, not guarantees.",
                ],
                ["RPO/RTO", "Restore testing", "Monitoring and ownership"],
                ["Only checks backup toggle", "No restore drill", "No owner"],
                "Create a restore-readiness checklist for a database-backed service.",
            ),
            interview_question(
                "How do you reason about autoscaling in AWS and Kubernetes together?",
                "An API scales Pods but still runs out of capacity during traffic spikes.",
                [
                    "Separate workload autoscaling, node capacity, load balancer behavior, quotas, and downstream dependencies.",
                    "Check HPA metrics, requests, cluster autoscaler or Karpenter behavior, node launch time, and warm capacity.",
                    "Account for cooldowns, scale-from-zero, image pull time, and readiness delay.",
                    "Use load tests and SLO signals to set guardrails.",
                ],
                ["Separates Pod and node scaling", "Mentions warm-up delays", "Uses SLO/load test data"],
                ["Only raises max replicas", "Ignores node launch time", "No dependency capacity"],
                "Write a scale-out timeline from request spike to ready Pods and healthy targets.",
            ),
            interview_question(
                "What does Well-Architected thinking add to day-to-day operations?",
                "The team treats architecture reviews as paperwork.",
                [
                    "Use pillars as prompts for reliability, security, operational excellence, cost, performance, and sustainability tradeoffs.",
                    "Turn review findings into backlog, owner, risk, and revisit date.",
                    "Connect architecture decisions to incidents and operational metrics.",
                    "Keep reviews lightweight enough to influence real changes.",
                ],
                ["Turns review into action", "Balances pillars", "Connects incidents to architecture"],
                ["Checklist theater", "No owners", "Only done before audit"],
                "Convert one readiness gap into a Well-Architected-style action item.",
            ),
            interview_question(
                "How do you debug AWS quota or throttling issues?",
                "A deployment or autoscaling event fails intermittently during peak load.",
                [
                    "Identify API, region, account, service quota, throttling error, and retry behavior.",
                    "Check CloudTrail, CloudWatch metrics, service quota dashboards, and controller logs.",
                    "Decide whether to request quota increase, reduce API pressure, batch changes, or redesign.",
                    "Add monitoring so quota headroom is visible before incidents.",
                ],
                ["Names API/region/account", "Checks quotas and CloudTrail", "Adds headroom monitoring"],
                ["Retries forever", "No quota awareness", "Confuses throttling with auth"],
                "Create a quota headroom review for EKS node scaling and load balancer provisioning.",
            ),
        ],
    },
    {
        "slug": "observability-telemetry-design-interview-pack",
        "title": "Observability and Telemetry Design Interview Pack",
        "domain": "Observability",
        "level_group": ADVANCED_LEVEL,
        "focus": "Metrics, logs, traces, OpenTelemetry, Prometheus, CloudWatch, cardinality, dashboards, and actionable alert design.",
        "related_course_slug": "platform-sre-observability-kubernetes",
        "related_labs": ["write-slo-backed-runbook"],
        "official_sources": [
            {"label": "OpenTelemetry Signals", "url": "https://opentelemetry.io/docs/concepts/signals/"},
            {"label": "Prometheus Alerting Practices", "url": "https://prometheus.io/docs/practices/alerting/"},
            {"label": "Amazon CloudWatch User Guide", "url": "https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html"},
        ],
        "questions": [
            interview_question(
                "Design observability for a new checkout service.",
                "A team has logs but no useful dashboards or alerts.",
                [
                    "Start with user journeys, SLIs, and critical dependencies.",
                    "Define metrics for rate, errors, duration, saturation, and business outcomes.",
                    "Add structured logs and traces for request path and dependency timing.",
                    "Create dashboards and alerts with owners, runbooks, and review cadence.",
                ],
                ["User-journey first", "Combines signals", "Owner and runbook"],
                ["Collects everything", "No SLI", "No alert action"],
                "Create an observability launch checklist for checkout.",
            ),
            interview_question(
                "When do metrics, logs, and traces each change your next action?",
                "An interviewer asks for practical signal selection.",
                [
                    "Use metrics to detect aggregate symptoms and trends.",
                    "Use logs for discrete events, errors, and contextual facts.",
                    "Use traces for request path, latency breakdown, and dependency calls.",
                    "Combine signals around a hypothesis instead of browsing dashboards randomly.",
                ],
                ["Knows signal strengths", "Hypothesis-driven", "Avoids random dashboarding"],
                ["Says logs are enough", "No trace use case", "Ignores cost/cardinality"],
                "Write one latency investigation using one metric, one log query, and one trace.",
            ),
            interview_question(
                "How do you control metric cardinality?",
                "A Prometheus bill and query latency spike after a new deployment.",
                [
                    "Identify labels with unbounded values such as user id, request id, path parameters, or pod churn.",
                    "Separate useful aggregation labels from high-cardinality debugging detail.",
                    "Move per-request detail to logs or traces when appropriate.",
                    "Add metric review and instrumentation ownership.",
                ],
                ["Identifies unbounded labels", "Chooses right signal", "Adds review ownership"],
                ["Keeps every label", "Deletes metrics blindly", "No instrumentation process"],
                "Review five metric labels and classify safe, risky, or remove.",
            ),
            interview_question(
                "How do you design tracing for a microservice path?",
                "Checkout calls payment, inventory, fraud, and shipping services.",
                [
                    "Propagate trace context across ingress, services, queues, and outbound calls.",
                    "Name spans consistently and attach useful attributes without sensitive data.",
                    "Decide sampling strategy based on traffic, incident needs, and cost.",
                    "Use traces to explain latency breakdown and dependency errors.",
                ],
                ["Context propagation", "Sampling strategy", "Sensitive data awareness"],
                ["No propagation", "Logs PII in spans", "Samples away all errors"],
                "Sketch a trace for checkout and identify the spans you need during an incident.",
            ),
            interview_question(
                "How do you make dashboards useful during incidents?",
                "Responders say the dashboard has too many panels and no clear story.",
                [
                    "Start with symptom panels tied to SLOs and user impact.",
                    "Group by service, dependency, saturation, recent deploy, and mitigation signal.",
                    "Add links to logs, traces, runbooks, deploys, and owners.",
                    "Remove vanity panels that do not change decisions.",
                ],
                ["Incident-oriented layout", "Links to action", "Removes vanity panels"],
                ["Wall of charts", "No owner", "No deploy context"],
                "Redesign one dashboard into symptom, cause, and mitigation sections.",
            ),
            interview_question(
                "How do you handle observability for batch jobs and queues?",
                "A nightly job failure causes stale data but no request errors.",
                [
                    "Define freshness, backlog age, successful completion, failure rate, and processing latency.",
                    "Page only when user impact or business deadline is threatened.",
                    "Add runbook steps for retry, replay, and data validation.",
                    "Track dependency and downstream impact.",
                ],
                ["Freshness/backlog thinking", "Impact-based paging", "Replay validation"],
                ["Only monitors CPU", "Pages on every failed retry", "No data freshness SLI"],
                "Create an alert policy for a four-hour batch job with a ten-hour freshness threshold.",
            ),
            interview_question(
                "How do you migrate from vendor-specific telemetry to OpenTelemetry?",
                "A company wants portability without breaking current dashboards.",
                [
                    "Inventory current metrics, logs, traces, dashboards, alerts, and owners.",
                    "Introduce OpenTelemetry instrumentation and collector pipeline gradually.",
                    "Preserve semantic meaning, cardinality controls, and alert compatibility.",
                    "Run dual-write or comparison periods before cutting over.",
                ],
                ["Migration inventory", "Gradual rollout", "Alert compatibility"],
                ["Big bang rewrite", "Breaks dashboards", "No owner mapping"],
                "Write a migration plan for one service from vendor SDK to OpenTelemetry.",
            ),
            interview_question(
                "How do you test whether monitoring itself works?",
                "The team missed an outage because alerts never reached on-call.",
                [
                    "Add blackbox checks, synthetic alerts, Alertmanager route tests, and notification audits.",
                    "Monitor collector, Prometheus, CloudWatch, and dashboard pipeline health.",
                    "Practice alert delivery in game days.",
                    "Document failure modes and backup communication paths.",
                ],
                ["Metamonitoring", "Route tests", "Game day validation"],
                ["Assumes alerts work", "No notification test", "No fallback path"],
                "Create a metamonitoring checklist from scrape target to pager notification.",
            ),
        ],
    },
    {
        "slug": "terraform-live-review-interview-pack",
        "title": "Terraform Live Plan Review Interview Pack",
        "domain": "Terraform",
        "level_group": INTERMEDIATE_LEVEL,
        "focus": "Live IaC review: state, modules, plans, unknowns, replacements, drift, imports, policy checks, and safe applies.",
        "related_course_slug": "platform-terraform-aws-infrastructure",
        "related_labs": ["review-terraform-eks-plan", "design-production-eks-review"],
        "official_sources": [
            {"label": "Terraform State", "url": "https://developer.hashicorp.com/terraform/language/state"},
            {"label": "Terraform Plan Command", "url": "https://developer.hashicorp.com/terraform/cli/commands/plan"},
            {"label": "Terraform Modules", "url": "https://developer.hashicorp.com/terraform/docs/configuration/modules"},
        ],
        "questions": [
            interview_question(
                "Walk me through your first two minutes with a Terraform plan.",
                "The interviewer hands you a large plan and asks whether it is safe.",
                [
                    "Confirm workspace, backend, variables, provider, environment, and change context.",
                    "Scan summary for create, update, replace, destroy, unknown, and sensitive values.",
                    "Prioritize IAM, network, data, capacity, and deletion risks.",
                    "State approve/block/needs-evidence with validation and rollback notes.",
                ],
                ["Environment check", "Risk prioritization", "Decision summary"],
                ["Reads linearly only", "Ignores backend", "No blast-radius framing"],
                "Practice a two-minute spoken plan scan using risk buckets.",
            ),
            interview_question(
                "How do unknown values affect plan review?",
                "A plan has many attributes known after apply.",
                [
                    "Identify whether unknowns are harmless computed values or decision-critical values.",
                    "Look for unknowns that affect IAM, routes, security groups, replacements, or dependencies.",
                    "Use data sources, outputs, preconditions, or staged applies cautiously when needed.",
                    "Avoid approving if the unknown hides blast radius.",
                ],
                ["Separates harmless from risky unknowns", "Links to blast radius", "Uses staged thinking"],
                ["Ignores unknowns", "Applies to see what happens", "No validation"],
                "Mark unknown plan values as safe, needs evidence, or blocker.",
            ),
            interview_question(
                "When would you use import, moved blocks, or state surgery?",
                "Infrastructure exists outside Terraform and the team wants it under code.",
                [
                    "Prefer declarative import and moved blocks where supported.",
                    "Back up state, lock state, and review addresses before any state operation.",
                    "Avoid changing real infrastructure accidentally during adoption.",
                    "Document owner, source of truth, and rollback path.",
                ],
                ["State safety", "Avoids accidental mutation", "Documents ownership"],
                ["Edits state casually", "Imports without config", "No backup"],
                "Write a safe import checklist for an existing security group.",
            ),
            interview_question(
                "How do you review Terraform changes from a security perspective?",
                "A plan changes IAM policies, security groups, and KMS access.",
                [
                    "Identify new principals, actions, resources, conditions, and trust relationships.",
                    "Check ingress, egress, public exposure, encryption, and logging changes.",
                    "Look for wildcard permissions and broad CIDRs.",
                    "Use policy-as-code or review templates for repeatable checks.",
                ],
                ["Principal/action/resource review", "Network exposure", "Repeatable policy checks"],
                ["Only checks resource count", "Allows 0.0.0.0/0 casually", "No condition review"],
                "Create a Terraform security-review rubric for IAM and security groups.",
            ),
            interview_question(
                "How do you structure Terraform environments for promotion?",
                "Dev, stage, and prod drift because engineers copy-pasted stacks.",
                [
                    "Use shared modules with versioned releases and environment-specific inputs.",
                    "Separate state per environment with clear backend and workspace rules.",
                    "Promote module versions intentionally through environments.",
                    "Review differences as configuration choices, not accidental drift.",
                ],
                ["Module versioning", "State separation", "Intentional promotion"],
                ["Copy-paste stacks", "Shared prod/dev state", "No version strategy"],
                "Design a dev-to-prod promotion flow for an EKS module.",
            ),
            interview_question(
                "What should policy-as-code catch before apply?",
                "The organization wants guardrails without blocking every useful change.",
                [
                    "Catch high-risk patterns: public ingress, unencrypted storage, missing tags, broad IAM, and destructive changes.",
                    "Separate warnings from hard blocks.",
                    "Allow documented exceptions with owner and expiry.",
                    "Keep policies understandable to the engineers they affect.",
                ],
                ["Risk-based policies", "Exception lifecycle", "Human-readable rules"],
                ["Blocks everything", "No exceptions", "Opaque policy failures"],
                "Write five policy checks for EKS infrastructure plans.",
            ),
            interview_question(
                "How do you handle a failed apply?",
                "Terraform partially applied changes and then failed while updating node groups.",
                [
                    "Stop and inspect state, real infrastructure, error, and what completed.",
                    "Avoid rerunning blindly until drift and partial changes are understood.",
                    "Decide whether to fix config, import/update state, roll forward, or roll back.",
                    "Communicate impact, owner, and next validation step.",
                ],
                ["Partial-apply awareness", "State and real-world comparison", "Clear recovery path"],
                ["Runs apply until green", "Deletes resources manually", "No communication"],
                "Write a failed-apply recovery note with state, live resources, and next action.",
            ),
            interview_question(
                "How do you explain Terraform risk to a non-IaC interviewer?",
                "A manager asks why plan review takes time when automation exists.",
                [
                    "Explain that Terraform automates changes to real infrastructure, including network, IAM, and data paths.",
                    "Use blast radius, rollback difficulty, and state as plain-language concepts.",
                    "Give examples of safe quick changes versus changes needing review.",
                    "Connect review quality to incident prevention.",
                ],
                ["Plain language", "Blast radius examples", "Connects to incidents"],
                ["Too much jargon", "Sounds anti-automation", "No examples"],
                "Prepare a 60-second explanation of Terraform plan review for a product manager.",
            ),
        ],
    },
    {
        "slug": "kubernetes-platform-system-design-drill-pack",
        "title": "Kubernetes Platform System Design Drill Pack",
        "domain": "Kubernetes",
        "level_group": ADVANCED_LEVEL,
        "focus": "System design interviews for Kubernetes platforms: multi-tenancy, release paths, observability, cost, upgrade strategy, and developer experience.",
        "related_course_slug": "platform-production-eks-architecture",
        "related_labs": ["design-production-eks-review", "create-platform-golden-path"],
        "official_sources": [
            {"label": "Kubernetes Documentation", "url": "https://kubernetes.io/docs/"},
            {"label": "CNCF Platforms Whitepaper", "url": "https://tag-app-delivery.cncf.io/whitepapers/platforms/"},
            {"label": "AWS Well-Architected Framework", "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"},
        ],
        "questions": [
            interview_question(
                "Design a Kubernetes platform for 30 product teams.",
                "The interviewer wants architecture, operating model, and tradeoffs.",
                [
                    "Clarify team needs, service criticality, compliance boundaries, and cloud constraints.",
                    "Choose cluster strategy, tenant boundaries, networking, identity, delivery, observability, and support model.",
                    "Define golden path defaults plus exception process.",
                    "Measure reliability, cost, adoption, lead time, and security posture.",
                ],
                ["Clarifies requirements", "Combines technical and operating model", "Measures outcomes"],
                ["Only draws clusters", "No tenancy/security", "No support model"],
                "Draw a platform architecture with tenant, control-plane, data-plane, and ownership boundaries.",
            ),
            interview_question(
                "How would you design namespace onboarding?",
                "A team needs self-service access without waiting on platform tickets.",
                [
                    "Generate namespace, RBAC, quotas, NetworkPolicy, cost labels, dashboards, alerts, and ArgoCD app scaffold.",
                    "Require owner, service tier, data classification, and support model.",
                    "Use policy checks and templates for safe defaults.",
                    "Expose exceptions as reviewed, expiring records.",
                ],
                ["Self-service with guardrails", "Ownership metadata", "Exception process"],
                ["Manual ticket queue only", "No quotas/RBAC", "No owner"],
                "Write an onboarding template for a new team namespace.",
            ),
            interview_question(
                "How do you design upgrade strategy for shared clusters?",
                "Multiple teams deploy CRDs, webhooks, and Helm charts into shared production clusters.",
                [
                    "Inventory APIs, CRDs, webhooks, clients, add-ons, and tenant manifests.",
                    "Provide compatibility windows, test clusters, dry-run checks, and owner deadlines.",
                    "Sequence control plane, add-ons, nodes, and workloads.",
                    "Publish pause criteria, rollback limits, and communication plan.",
                ],
                ["Tenant-aware upgrade", "CRD/webhook awareness", "Communication plan"],
                ["Upgrade without inventory", "No test path", "No owner deadlines"],
                "Create an upgrade program plan with tenant checklist and dates.",
            ),
            interview_question(
                "How do you choose between one shared cluster and many clusters?",
                "Security and cost teams disagree on platform topology.",
                [
                    "Compare isolation, blast radius, compliance, cost, operational complexity, and team autonomy.",
                    "Use separate clusters for hard isolation, high-risk workloads, or regulatory boundaries.",
                    "Use shared clusters when guardrails and support model are mature enough.",
                    "Document tradeoffs and migration path.",
                ],
                ["Tradeoff framing", "Knows namespace limits", "Documents migration path"],
                ["One answer for all orgs", "Oversells namespaces", "Ignores operating cost"],
                "Write a decision record for shared versus dedicated clusters.",
            ),
            interview_question(
                "How do you design platform observability as a product capability?",
                "Every team builds dashboards differently and incidents are slow.",
                [
                    "Provide default RED/USE dashboards, log/tracing standards, alert templates, and ownership labels.",
                    "Let teams extend views while preserving core SLO and incident surfaces.",
                    "Integrate deploy events, runbooks, and service catalog metadata.",
                    "Measure adoption and incident usefulness.",
                ],
                ["Default surfaces", "Extensible but consistent", "Service metadata"],
                ["Dashboard free-for-all", "No SLO tie", "No runbook links"],
                "Design a standard observability package for new services.",
            ),
            interview_question(
                "How would you make cost visible without blocking delivery?",
                "Teams over-request resources and finance wants controls.",
                [
                    "Add cost labels, namespace reports, request/usage views, and service-owner showback.",
                    "Set sane defaults and recommendations in templates.",
                    "Create review workflows for extreme requests or expensive resources.",
                    "Tie cost changes to reliability and product context.",
                ],
                ["Showback before punishment", "Template defaults", "Reliability tradeoff"],
                ["Blocks every deploy", "No labels", "Cost without context"],
                "Create a monthly platform cost review format for service owners.",
            ),
            interview_question(
                "How do you design break-glass access?",
                "Normal access is least privilege, but incidents sometimes need emergency power.",
                [
                    "Define who can request, approve, assume, audit, and revoke emergency access.",
                    "Make access time-bound, logged, ticket-linked, and reviewed after use.",
                    "Keep normal workflows least privilege so break-glass is exceptional.",
                    "Test the process before an actual incident.",
                ],
                ["Time-bound access", "Audit and review", "Tested process"],
                ["Permanent admin", "No audit", "Break-glass never tested"],
                "Write a break-glass access runbook for production Kubernetes.",
            ),
            interview_question(
                "How do you handle platform deprecation?",
                "The team needs to retire an old chart, runner, or cluster version that many services still use.",
                [
                    "Inventory consumers, risk, replacement path, deadlines, and support burden.",
                    "Provide migration tooling, docs, office hours, and compatibility checks.",
                    "Communicate with enough lead time and escalation path.",
                    "Track adoption and exceptions until the old path is actually gone.",
                ],
                ["Consumer inventory", "Migration support", "Tracks completion"],
                ["Deletes old path suddenly", "No owner map", "No exception handling"],
                "Create a deprecation plan for an old Helm chart or Kubernetes version.",
            ),
        ],
    },
]

PLATFORM_INTERVIEW_PREP.extend(JOB_SEARCH_INTERVIEW_PACKS)


def add_job_search_layered_questions() -> None:
    for pack in PLATFORM_INTERVIEW_PREP:
        domain = pack["domain"]
        title = pack["title"]
        course_slug = pack["related_course_slug"]
        source_label = pack["official_sources"][0]["label"] if pack["official_sources"] else "the primary official source"
        additions = [
            interview_question(
                f"What portfolio proof would you show for {domain}?",
                f"You need to convince a hiring manager that your {domain} knowledge is applied, not tutorial-only.",
                [
                    f"Pick one artifact tied to {title}: lab note, diagram, runbook, Terraform plan review, dashboard, or incident write-up.",
                    "Explain the problem, constraints, commands or design choices, and validation evidence.",
                    "Name what would change in a real production environment.",
                    f"Link the artifact back to {source_label} and the related course {course_slug}.",
                ],
                ["Shows evidence", "Explains tradeoffs", "Uses docs-linked reasoning"],
                ["Only lists tools", "No validation", "Cannot explain production differences"],
                f"Create a portfolio README section proving one {domain} skill with screenshot-safe evidence.",
            ),
            interview_question(
                f"How would you build a seven-day crash plan for {domain} interviews?",
                f"You have interviews soon and must turn {domain} gaps into answerable scenarios quickly.",
                [
                    "Day 1: scan official docs and write the top concepts in operational language.",
                    "Days 2-3: complete the related lab and produce an evidence note.",
                    "Days 4-5: answer scenario questions aloud and repair weak answers.",
                    "Days 6-7: create one portfolio artifact and one STAR story tied to this domain.",
                ],
                ["Time-boxed plan", "Docs plus labs", "Practice answers aloud"],
                ["Only watches videos", "No hands-on artifact", "No interview rehearsal"],
                f"Turn this {domain} pack into a seven-day study checklist with daily outputs.",
            ),
            interview_question(
                f"How do you answer when an interviewer challenges your {domain} recommendation?",
                "The interviewer pushes back to see whether you can reason under pressure.",
                [
                    "Restate the goal, constraints, and risk the recommendation addresses.",
                    "Offer alternatives and tradeoffs rather than defending one answer emotionally.",
                    "Name the evidence that would change your decision.",
                    "Show willingness to adapt while protecting reliability, security, and user impact.",
                ],
                ["Tradeoff thinking", "Evidence changes mind", "Calm collaboration"],
                ["Gets defensive", "No alternatives", "Ignores user impact"],
                f"Write two alternative answers for a controversial {domain} decision.",
            ),
            interview_question(
                f"What are the common false positives or misleading signals in {domain}?",
                f"The interview tests whether you can avoid fixing the loudest symptom in {domain}.",
                [
                    "Name one signal that is useful but easy to over-interpret.",
                    "Pair it with a second signal that confirms or disproves the hypothesis.",
                    "Explain the safest next read-only check before mutation.",
                    "Close with the owner boundary and escalation path if evidence points elsewhere.",
                ],
                ["Avoids overfitting", "Uses confirming evidence", "Read-only before mutation"],
                ["Treats one metric as truth", "Mutates immediately", "No owner boundary"],
                f"Add a false-positive section to your {domain} troubleshooting notes.",
            ),
        ]
        seen = {question["question"] for question in pack["questions"]}
        pack["questions"].extend(question for question in additions if question["question"] not in seen)


add_job_search_layered_questions()


PLATFORM_COURSE_SLUGS = [course["slug"] for course in PLATFORM_COURSES]
