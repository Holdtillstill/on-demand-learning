# Contributing

Thanks for taking a look at Platform Academy. Issues and pull requests are welcome for product bugs, content corrections, documentation improvements, lab fixes, local runtime behavior, and security-safe platform improvements.

## Public Safety

Do not include secrets, AWS account IDs, ARNs, hosted zone IDs, private cloud data, learner data, personal emails, visitor data, request records, private preview URLs, or deployment internals in issues, pull requests, screenshots, logs, or comments.

Use [SECURITY.md](SECURITY.md) for vulnerabilities or anything that may expose private infrastructure or sensitive data.

## Validation

Before opening a pull request, run the checks that match your change:

```bash
python3 scripts/verify_public_readiness.py
python3 scripts/verify_workflow_contracts.py
make platform-academy-test
make backend-test
make worker-test
```

For release, lab, deployment, or full-stack changes, use the broader validation commands in the README and release checklist.

Runtime preview resources must stay approved, temporary, and cleaned up after validation.
