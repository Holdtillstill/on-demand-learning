.PHONY: help up up-logging down logs clean-generated clean-smoke-images test bootstrap backend-test api-migration-check api-image-migration-check doc-link-check env-contract-check platform-content-count-check working-tree-hygiene-check platform-academy-test platform-lab-contract platform-lab-artifact-contract platform-lab-matrix platform-lab-verify platform-review-manifest platform-api-smoke platform-lab-smoke platform-browser-smoke platform-container-smoke platform-deployed-smoke platform-release-evidence platform-review-pack smoke-helper-check worker-test build compose-config terraform-validate k8s-platform-contract kubeconform-check workflow-lint workflow-contract-check script-syntax-check fmt-check release-check platform-release-check

PYTHON ?= python3.11
KUBECONFORM_IMAGE ?= ghcr.io/yannh/kubeconform:v0.6.7
ACTIONLINT_IMAGE ?= rhysd/actionlint:1.7.7
ACTIONLINT ?= actionlint

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-24s %s\n", $$1, $$2}'

up: ## Start the local platform
	docker compose up --build

up-logging: ## Start local platform with optional OpenSearch logging profile
	docker compose --profile logging up --build

down: ## Stop services and keep volumes
	docker compose down

logs: ## Tail all service logs
	docker compose logs -f

clean-generated: ## Remove local test/build/smoke artifacts
	rm -rf .pytest_cache apps/api/.pytest_cache apps/worker/.pytest_cache apps/platform-academy/.vite apps/platform-academy/dist infra/terraform/.terraform smoke-artifacts
	rm -rf apps/api/test.db apps/api/ci-test.db apps/api/ci-smoke.db test.db ci-platform-browser-smoke.db
	rm -rf apps/platform-academy/playwright-report apps/platform-academy/test-results apps/platform-academy/coverage
	find apps scripts labs -name __pycache__ -type d -prune -exec rm -rf {} +
	find apps -name '*.tsbuildinfo' -type f -delete

clean-smoke-images: ## Remove temporary Platform Academy and API release-check images
	@images="$$(docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -E '^(on-demand-platform-smoke-(api|web)|on-demand-api-release-check):' || true)"; \
	if [ -n "$$images" ]; then \
		printf '%s\n' "$$images" | xargs docker image rm; \
	else \
		echo "No Platform Academy or API release-check images to remove."; \
	fi

compose-config: ## Validate Docker Compose syntax
	docker compose config --quiet

terraform-validate: ## Validate Terraform scaffold without planning or applying resources
	cd infra/terraform && terraform fmt -check && terraform init -backend=false && terraform validate

k8s-platform-contract: ## Verify Kubernetes scaffold includes the Platform Academy runtime contract
	$(PYTHON) scripts/verify_k8s_platform_contract.py

kubeconform-check: ## Validate Kubernetes manifests with kubeconform
	docker run --rm -v "$(CURDIR):/work" $(KUBECONFORM_IMAGE) -strict -summary /work/infra/k8s/platform-academy.yaml

workflow-lint: ## Validate GitHub Actions workflows with actionlint
	@if command -v "$(ACTIONLINT)" >/dev/null 2>&1; then \
		"$(ACTIONLINT)" -color=false .github/workflows/*.yml; \
	else \
		status=1; \
		for attempt in 1 2 3; do \
			docker run --rm -v "$(CURDIR):/repo" -w /repo $(ACTIONLINT_IMAGE) -color=false .github/workflows/*.yml && status=0 && break; \
			status=$$?; \
			echo "actionlint Docker attempt $$attempt failed with status $$status" >&2; \
			sleep $$((attempt * 5)); \
		done; \
		exit $$status; \
	fi
	$(PYTHON) scripts/verify_workflow_contracts.py

workflow-contract-check: ## Verify release-critical GitHub Actions workflow contracts
	$(PYTHON) scripts/verify_workflow_contracts.py

script-syntax-check: ## Validate shell script syntax
	find scripts labs/platform-academy -name '*.sh' -type f -print0 | xargs -0 -n 1 bash -n

bootstrap: ## Install local Python dependencies with the supported Python runtime
	$(PYTHON) -m pip install -r apps/api/requirements.txt -r apps/worker/requirements.txt

backend-test: ## Run backend tests locally
	cd apps/api && $(PYTHON) -m pytest

api-migration-check: ## Verify Alembic migrations against a disposable SQLite database
	PYTHON=$(PYTHON) scripts/verify_api_migrations.sh

api-image-migration-check: ## Verify the built API image can run Alembic with startup schema creation disabled
	scripts/verify_api_image_migrations.sh

doc-link-check: ## Verify repo-local Markdown links resolve
	$(PYTHON) scripts/verify_doc_links.py

env-contract-check: ## Verify sample env and local Compose cover runtime settings
	$(PYTHON) scripts/verify_env_contract.py

platform-content-count-check: ## Verify smoke defaults and docs match Platform Academy content counts
	PYTHONPATH=apps/api $(PYTHON) scripts/verify_platform_content_counts.py

working-tree-hygiene-check: ## Verify branch and local changed files are clean enough to review
	$(PYTHON) scripts/verify_working_tree_hygiene.py

platform-academy-test: ## Run standalone Platform Academy frontend tests locally
	cd apps/platform-academy && npm install --include=dev && npm run typecheck && npm test && npm run build

platform-lab-contract: ## Verify Platform Academy lab catalog metadata against repo artifacts
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) scripts/verify_platform_lab_contract.py

platform-lab-artifact-contract: ## Structurally verify portfolio-grade Platform Academy lab artifacts
	PYTHONDONTWRITEBYTECODE=1 $(PYTHON) scripts/verify_platform_lab_artifacts.py

platform-lab-matrix: ## Print Markdown review matrix for all full Platform Academy labs
	@PYTHONDONTWRITEBYTECODE=1 $(PYTHON) scripts/verify_platform_lab_contract.py --lab-review-matrix

platform-review-manifest: ## Print branch-aware reviewer manifest grouped by subsystem
	@PYTHONDONTWRITEBYTECODE=1 $(PYTHON) scripts/platform_review_manifest.py

platform-lab-verify: platform-lab-contract platform-lab-artifact-contract ## Verify local Platform Academy full-lab artifacts
	PYTHON=$(PYTHON) PYTHONDONTWRITEBYTECODE=1 bash labs/platform-academy/verify-full-labs.sh

platform-api-smoke: ## Smoke test critical Platform Academy API surfaces against API_BASE
	PYTHON=$(PYTHON) scripts/smoke_platform_academy_api.sh

platform-lab-smoke: ## Smoke test all Platform Academy lab payloads, packets, and bundles against API_BASE
	PYTHON=$(PYTHON) scripts/smoke_platform_academy_labs.sh

platform-browser-smoke: ## Browser smoke test Platform Academy routes against WEB_BASE and optional API_BASE
	web_base="$${WEB_BASE:-http://localhost:8090}"; api_base="$${SMOKE_API_BASE:-$${API_BASE:-$${web_base}}}"; cd apps/platform-academy && npm install --include=dev && npx playwright install chromium && WEB_BASE="$${web_base}" SMOKE_API_BASE="$${api_base}" npm run smoke:routes

platform-container-smoke: ## Build and smoke test API + Platform Academy web containers
	if [ "$${SMOKE_DRY_RUN:-false}" != "true" ]; then cd apps/platform-academy && npm install --include=dev && npx playwright install chromium; fi
	PYTHON=$(PYTHON) scripts/smoke_platform_academy_container.sh

platform-deployed-smoke: ## Smoke test deployed Platform Academy using API_BASE and optional WEB_BASE
	PYTHON=$(PYTHON) scripts/smoke_platform_academy_deployed.sh

platform-release-evidence: ## Print copy-paste Platform Academy release evidence Markdown
	@scripts/platform_release_evidence.sh

platform-review-pack: ## Write a disposable Platform Academy review/deployment handoff pack
	@PYTHON=$(PYTHON) scripts/platform_review_pack.sh

smoke-helper-check: ## Verify smoke helper dry-run and validation paths without network access
	PYTHON=$(PYTHON) scripts/verify_smoke_helpers.sh

worker-test: ## Run worker tests locally
	cd apps/worker && $(PYTHON) -m pytest

test: backend-test worker-test platform-academy-test platform-lab-verify ## Run all tests

build: ## Build local service images
	docker compose build

fmt-check: ## Run Python lint checks
	cd apps/api && $(PYTHON) -m ruff check app tests alembic
	cd apps/worker && $(PYTHON) -m ruff check .
	$(PYTHON) -m ruff check scripts labs/platform-academy/simulator.py

release-check: fmt-check doc-link-check env-contract-check platform-content-count-check working-tree-hygiene-check script-syntax-check smoke-helper-check api-migration-check test compose-config terraform-validate k8s-platform-contract kubeconform-check workflow-lint ## Run local release gates before tagging or publishing images

platform-release-check: release-check api-image-migration-check platform-container-smoke ## Run local release gates plus built-container Platform Academy smoke
