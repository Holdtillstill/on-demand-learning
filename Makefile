.PHONY: help up up-logging down logs test bootstrap backend-test frontend-test worker-test build compose-config fmt-check

PYTHON ?= python3.11

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-18s %s\n", $$1, $$2}'

up: ## Start the local platform
	docker compose up --build

up-logging: ## Start local platform with optional OpenSearch logging profile
	docker compose --profile logging up --build

down: ## Stop services and keep volumes
	docker compose down

logs: ## Tail all service logs
	docker compose logs -f

compose-config: ## Validate Docker Compose syntax
	docker compose config

bootstrap: ## Install local Python dependencies with the supported Python runtime
	$(PYTHON) -m pip install -r apps/api/requirements.txt -r apps/worker/requirements.txt

backend-test: ## Run backend tests locally
	cd apps/api && $(PYTHON) -m pytest

frontend-test: ## Run frontend tests locally
	cd apps/frontend && npm install --include=dev && npm run typecheck && npm test && npm run build

worker-test: ## Run worker tests locally
	cd apps/worker && $(PYTHON) -m pytest

test: backend-test worker-test frontend-test ## Run all tests

build: ## Build local service images
	docker compose build

fmt-check: ## Run Python lint checks
	cd apps/api && $(PYTHON) -m ruff check app tests
	cd apps/worker && $(PYTHON) -m ruff check .
