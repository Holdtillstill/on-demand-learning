#!/usr/bin/env python3
"""Evidence-oriented local IRSA trust and permission simulator for the access-denied lab."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{path} is not valid JSON: {exc}")
    if not isinstance(data, dict):
        fail(f"{path} should contain a JSON object")
    return data


def first_match(pattern: str, text: str, label: str) -> str:
    match = re.search(pattern, text, re.MULTILINE)
    if not match:
        fail(f"could not find {label}")
    return match.group(1)


def service_account_identity(path: Path) -> tuple[str, str, str]:
    text = path.read_text(encoding="utf-8")
    name = first_match(r"(?m)^metadata:\n(?:  .+\n)*  name: ([^\n]+)\n  namespace:", text, "ServiceAccount name")
    namespace = first_match(r"(?m)^  namespace: ([^\n]+)", text, "ServiceAccount namespace")
    role_arn = first_match(r"(?m)^\s+eks\.amazonaws\.com/role-arn: ([^\n]+)", text, "IRSA role ARN")
    return namespace.strip(), name.strip(), role_arn.strip()


def trust_subject(policy: dict[str, Any]) -> str:
    for statement in statements(policy):
        condition = statement.get("Condition", {})
        if not isinstance(condition, dict):
            continue
        string_equals = condition.get("StringEquals", {})
        if not isinstance(string_equals, dict):
            continue
        for key, value in string_equals.items():
            if key.endswith(":sub") and isinstance(value, str):
                return value
    fail("trust policy does not include a StringEquals sub condition")


def statements(policy: dict[str, Any]) -> list[dict[str, Any]]:
    raw = policy.get("Statement", [])
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list) or not all(isinstance(item, dict) for item in raw):
        fail("policy Statement should be an object or list of objects")
    return raw


def cloudtrail_request(event: dict[str, Any]) -> tuple[str, str]:
    event_name = event.get("eventName")
    params = event.get("requestParameters", {})
    if not isinstance(event_name, str) or not isinstance(params, dict):
        fail("CloudTrail event should include eventName and requestParameters")
    bucket = params.get("bucketName")
    key = params.get("key")
    if not isinstance(bucket, str) or not isinstance(key, str):
        fail("CloudTrail event should include requestParameters.bucketName and key")
    return f"s3:{event_name}", f"arn:aws:s3:::{bucket}/{key}"


def value_list(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return value
    return []


def wildcard_match(pattern: str, value: str) -> bool:
    regex = re.escape(pattern).replace(r"\*", ".*")
    return re.fullmatch(regex, value) is not None


def policy_allows(policy: dict[str, Any], action: str, resource: str) -> bool:
    allowed = False
    for statement in statements(policy):
        effect = statement.get("Effect")
        actions = value_list(statement.get("Action"))
        resources = value_list(statement.get("Resource"))
        if not actions or not resources:
            continue
        action_match = any(wildcard_match(candidate, action) for candidate in actions)
        resource_match = any(wildcard_match(candidate, resource) for candidate in resources)
        if not action_match or not resource_match:
            continue
        if effect == "Deny":
            return False
        if effect == "Allow":
            allowed = True
    return allowed


def policy_uses_wildcard_s3(policy: dict[str, Any]) -> bool:
    for statement in statements(policy):
        for action in value_list(statement.get("Action")):
            if wildcard_match(action, "s3:DeleteBucket") or action == "s3:*":
                return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serviceaccount", required=True, type=Path)
    parser.add_argument("--trust-policy", required=True, type=Path)
    parser.add_argument("--fixed-trust-policy", required=True, type=Path)
    parser.add_argument("--cloudtrail-event", required=True, type=Path)
    parser.add_argument("--permission-policy", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    namespace, name, role_arn = service_account_identity(args.serviceaccount)
    subject = f"system:serviceaccount:{namespace}:{name}"
    broken_subject = trust_subject(load_json(args.trust_policy))
    fixed_subject = trust_subject(load_json(args.fixed_trust_policy))
    action, resource = cloudtrail_request(load_json(args.cloudtrail_event))
    permission_policy = load_json(args.permission_policy)

    errors: list[str] = []
    if broken_subject == subject:
        errors.append("broken trust policy unexpectedly matches the workload subject")
    if fixed_subject != subject:
        errors.append(f"fixed trust subject should be {subject}, got {fixed_subject}")
    if not policy_allows(permission_policy, action, resource):
        errors.append(f"least-privilege policy should allow {action} on {resource}")
    if policy_uses_wildcard_s3(permission_policy):
        errors.append("least-privilege policy should not use broad s3 wildcard actions")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("IRSA simulation passed.")
        print(f"- Workload subject: {subject}")
        print(f"- Annotated role: {role_arn}")
        print(f"- Broken trust subject: {broken_subject} (mismatch)")
        print(f"- Fixed trust subject: {fixed_subject} (match)")
        print(f"- Requested permission: {action} on {resource}")
        print("- Proposed policy allows the request without broad s3 wildcard scope.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
