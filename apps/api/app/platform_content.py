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
        "commands": [
            "kubectl describe svc checkout -n payments",
            "kubectl get pods -n payments -l app=checkout --show-labels",
            "kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout",
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
        "commands": [
            "kubectl describe pod checkout-abc123 -n payments",
            "kubectl logs checkout-abc123 -n payments --previous",
            "kubectl get events -n payments --sort-by=.lastTimestamp",
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
        "commands": [
            "kubectl apply --dry-run=client -f vendor.yaml",
            "grep -n \"kind:\\|namespace:\\|ClusterRole\\|privileged\\|hostPath\" vendor.yaml",
            "kubectl explain deployment.spec.template.spec.containers",
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


PLATFORM_COURSE_SLUGS = [course["slug"] for course in PLATFORM_COURSES]
