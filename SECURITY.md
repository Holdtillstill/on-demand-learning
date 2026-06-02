# Security Policy

This project is a public portfolio application. Do not commit AWS account IDs, ARNs, hosted zone IDs, personal emails, credentials, tokens, webhook URLs, or private deployment identifiers.

## Reporting

Use GitHub private vulnerability reporting or a direct owner channel. Do not open a public issue that contains secrets, cloud identifiers, learner data, visitor data, or deployment internals.

## Scope

- Platform Academy frontend, API, worker, and static curriculum assets.
- Container images and optional Kubernetes deployment scaffolding.
- Public CI/CD workflows, dependency audits, secret scans, filesystem scans, and image scans.
- Labs, runbooks, and generated learning content.

## Baseline Checks

CI runs Python and npm dependency audits, Gitleaks secret scanning, GitHub dependency review, Trivy filesystem scanning, image scanning, workflow-contract checks, and browser/API smoke checks where relevant.

## Educational Fixtures

Some lessons and labs include explicit placeholder credentials or sample cloud identifiers to teach security review. They must remain clearly synthetic and must not be replaced with real values.
