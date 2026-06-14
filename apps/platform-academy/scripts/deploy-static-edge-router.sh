#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID}"
: "${CLOUDFRONT_FUNCTION_NAME:?Set CLOUDFRONT_FUNCTION_NAME}"

allow_preprovisioned_edge="${STATIC_ALLOW_PREPROVISIONED_EDGE:-false}"

require_edge_control_or_explicit_preprovisioned() {
  local message="$1"
  if [ "${allow_preprovisioned_edge}" = "true" ]; then
    echo "${message}; continuing because STATIC_ALLOW_PREPROVISIONED_EDGE=true." >&2
    return 0
  fi

  echo "${message}; refusing to deploy before assets are synced because the edge router and security headers cannot be verified." >&2
  echo "Grant the deploy role CloudFront Function, response headers policy, and distribution update permissions, or set STATIC_ALLOW_PREPROVISIONED_EDGE=true only after confirming the distribution already has the current router and required security headers." >&2
  exit 1
}

function_source="${STATIC_EDGE_ROUTER_SOURCE:-deploy/cloudfront/static-spa-router.js}"
if [ ! -f "${function_source}" ]; then
  echo "CloudFront Function source not found: ${function_source}" >&2
  exit 1
fi

function_config="Comment=Static portfolio SPA router for Platform Academy,Runtime=cloudfront-js-2.0"
describe_error="$(mktemp)"
function_etag=""
if ! function_etag="$(aws cloudfront describe-function \
  --name "${CLOUDFRONT_FUNCTION_NAME}" \
  --stage DEVELOPMENT \
  --query ETag \
  --output text 2>"${describe_error}")"; then
  if grep -q "AccessDenied" "${describe_error}"; then
    require_edge_control_or_explicit_preprovisioned "CloudFront Function management is not allowed for this deploy role"
    exit 0
  fi
  cat "${describe_error}" >&2
  exit 1
fi
rm -f "${describe_error}"

if [ -z "${function_etag}" ] || [ "${function_etag}" = "None" ]; then
  create_error="$(mktemp)"
  if ! function_etag="$(aws cloudfront create-function \
    --name "${CLOUDFRONT_FUNCTION_NAME}" \
    --function-config "${function_config}" \
    --function-code "fileb://${function_source}" \
    --query ETag \
    --output text 2>"${create_error}")"; then
    if grep -q "AccessDenied" "${create_error}"; then
      require_edge_control_or_explicit_preprovisioned "CloudFront Function creation is not allowed for this deploy role"
      exit 0
    fi
    cat "${create_error}" >&2
    exit 1
  fi
  rm -f "${create_error}"
else
  update_function_error="$(mktemp)"
  if ! function_etag="$(aws cloudfront update-function \
    --name "${CLOUDFRONT_FUNCTION_NAME}" \
    --if-match "${function_etag}" \
    --function-config "${function_config}" \
    --function-code "fileb://${function_source}" \
    --query ETag \
    --output text 2>"${update_function_error}")"; then
    if grep -q "AccessDenied" "${update_function_error}"; then
      require_edge_control_or_explicit_preprovisioned "CloudFront Function updates are not allowed for this deploy role"
      exit 0
    fi
    cat "${update_function_error}" >&2
    exit 1
  fi
  rm -f "${update_function_error}"
fi

aws cloudfront publish-function \
  --name "${CLOUDFRONT_FUNCTION_NAME}" \
  --if-match "${function_etag}" \
  --query FunctionSummary.Name \
  --output text >/dev/null

function_arn="$(aws cloudfront describe-function \
  --name "${CLOUDFRONT_FUNCTION_NAME}" \
  --stage LIVE \
  --query FunctionSummary.FunctionMetadata.FunctionARN \
  --output text)"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

distribution_config="${tmp_dir}/distribution-config.json"
updated_config="${tmp_dir}/distribution-config-updated.json"
update_error="${tmp_dir}/distribution-update-error.txt"
response_headers_policy_source="${STATIC_RESPONSE_HEADERS_POLICY_SOURCE:-deploy/cloudfront/static-response-headers-policy.json}"
response_headers_policy_id="${CLOUDFRONT_RESPONSE_HEADERS_POLICY_ID:-}"

read_response_headers_policy_name() {
  node - "${response_headers_policy_source}" <<'NODE'
const fs = require("node:fs");

const [sourcePath] = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
process.stdout.write(config.Name || "");
NODE
}

lookup_response_headers_policy_id() {
  local policy_name="$1"
  local policies_json="${tmp_dir}/response-headers-policies.json"
  local policy_list_error="${tmp_dir}/response-headers-policy-list-error.txt"

  if ! aws cloudfront list-response-headers-policies \
    --type custom \
    --output json >"${policies_json}" 2>"${policy_list_error}"; then
    if grep -q "AccessDenied" "${policy_list_error}"; then
      require_edge_control_or_explicit_preprovisioned "CloudFront response headers policy list is not allowed for this deploy role"
      return 0
    fi
    cat "${policy_list_error}" >&2
    exit 1
  fi

  POLICY_NAME="${policy_name}" node - "${policies_json}" <<'NODE'
const fs = require("node:fs");

const [sourcePath] = process.argv.slice(2);
const policyName = process.env.POLICY_NAME;
const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const items = payload.ResponseHeadersPolicyList?.Items || [];
const match = items.find((item) => item.ResponseHeadersPolicy?.ResponseHeadersPolicyConfig?.Name === policyName);
process.stdout.write(match?.ResponseHeadersPolicy?.Id || "");
NODE
}

ensure_response_headers_policy() {
  if [ -n "${response_headers_policy_id}" ]; then
    echo "Using configured CloudFront response headers policy ${response_headers_policy_id}."
    return
  fi

  if [ ! -f "${response_headers_policy_source}" ]; then
    echo "CloudFront response headers policy source not found: ${response_headers_policy_source}; leaving existing distribution policy unchanged." >&2
    return
  fi

  local policy_name
  policy_name="$(read_response_headers_policy_name)"
  if [ -z "${policy_name}" ]; then
    echo "CloudFront response headers policy config is missing Name." >&2
    exit 1
  fi

  response_headers_policy_id="$(lookup_response_headers_policy_id "${policy_name}")"

  if [ -n "${response_headers_policy_id}" ]; then
    local policy_etag
    local get_policy_error="${tmp_dir}/response-headers-policy-get-error.txt"
    local update_policy_error="${tmp_dir}/response-headers-policy-update-error.txt"
    if ! policy_etag="$(aws cloudfront get-response-headers-policy-config \
      --id "${response_headers_policy_id}" \
      --query ETag \
      --output text 2>"${get_policy_error}")"; then
      if grep -q "AccessDenied" "${get_policy_error}"; then
        require_edge_control_or_explicit_preprovisioned "CloudFront response headers policy reads are not allowed for this deploy role"
        return
      fi
      cat "${get_policy_error}" >&2
      exit 1
    fi
    if aws cloudfront update-response-headers-policy \
      --id "${response_headers_policy_id}" \
      --if-match "${policy_etag}" \
      --response-headers-policy-config "file://${response_headers_policy_source}" \
      --query ResponseHeadersPolicy.Id \
      --output text >/dev/null 2>"${update_policy_error}"; then
      echo "CloudFront response headers policy ${policy_name} is up to date."
      return
    fi
    if grep -q "AccessDenied" "${update_policy_error}"; then
      require_edge_control_or_explicit_preprovisioned "CloudFront response headers policy updates are not allowed for this deploy role"
      return
    fi
    cat "${update_policy_error}" >&2
    exit 1
  fi

  local create_policy_error="${tmp_dir}/response-headers-policy-create-error.txt"
  if response_headers_policy_id="$(aws cloudfront create-response-headers-policy \
    --response-headers-policy-config "file://${response_headers_policy_source}" \
    --query ResponseHeadersPolicy.Id \
    --output text 2>"${create_policy_error}")"; then
    echo "Created CloudFront response headers policy ${policy_name}."
    return
  fi
  if grep -q "AccessDenied" "${create_policy_error}"; then
    require_edge_control_or_explicit_preprovisioned "CloudFront response headers policy creation is not allowed for this deploy role"
    response_headers_policy_id=""
    return
  fi
  cat "${create_policy_error}" >&2
  exit 1
}

ensure_response_headers_policy

write_updated_distribution_config() {
  FUNCTION_ARN="${function_arn}" RESPONSE_HEADERS_POLICY_ID="${response_headers_policy_id}" node - "${distribution_config}" "${updated_config}" <<'NODE'
const fs = require("node:fs");

const [sourcePath, targetPath] = process.argv.slice(2);
const functionArn = process.env.FUNCTION_ARN;
const responseHeadersPolicyId = process.env.RESPONSE_HEADERS_POLICY_ID;
const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const defaultBehavior = config.DefaultCacheBehavior;
const associations = defaultBehavior.FunctionAssociations || { Quantity: 0 };
const items = (associations.Items || []).filter((item) => item.EventType !== "viewer-request");

items.push({
  EventType: "viewer-request",
  FunctionARN: functionArn
});

defaultBehavior.FunctionAssociations = {
  Quantity: items.length,
  Items: items
};

if (responseHeadersPolicyId) {
  defaultBehavior.ResponseHeadersPolicyId = responseHeadersPolicyId;
}

fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
NODE
}

default_behavior_update_status() {
  FUNCTION_ARN="${function_arn}" RESPONSE_HEADERS_POLICY_ID="${response_headers_policy_id}" node - "${distribution_config}" <<'NODE'
const fs = require("node:fs");

const [sourcePath] = process.argv.slice(2);
const functionArn = process.env.FUNCTION_ARN;
const responseHeadersPolicyId = process.env.RESPONSE_HEADERS_POLICY_ID;
const config = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const defaultBehavior = config.DefaultCacheBehavior || {};
const associations = defaultBehavior.FunctionAssociations || { Quantity: 0 };
const items = associations.Items || [];
const viewerRequestItems = items.filter((item) => item.EventType === "viewer-request");
const functionIsCurrent = viewerRequestItems.length === 1 && viewerRequestItems[0].FunctionARN === functionArn;
const policyIsCurrent = !responseHeadersPolicyId || defaultBehavior.ResponseHeadersPolicyId === responseHeadersPolicyId;

if (functionIsCurrent && policyIsCurrent) {
  process.stdout.write("current");
} else {
  process.stdout.write("update");
}
NODE
}

max_update_attempts="${CLOUDFRONT_UPDATE_MAX_ATTEMPTS:-5}"
update_succeeded="false"

for attempt in $(seq 1 "${max_update_attempts}"); do
  distribution_etag="$(aws cloudfront get-distribution-config \
    --id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --query ETag \
    --output text)"

  aws cloudfront get-distribution-config \
    --id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --query DistributionConfig \
    --output json >"${distribution_config}"

  if [ "$(default_behavior_update_status)" = "current" ]; then
    echo "Static edge router and response headers policy are already associated."
    exit 0
  fi

  write_updated_distribution_config

  if aws cloudfront update-distribution \
    --id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --if-match "${distribution_etag}" \
    --distribution-config "file://${updated_config}" \
    --query Distribution.Status \
    --output text >/dev/null 2>"${update_error}"; then
    update_succeeded="true"
    break
  fi

  if grep -q "PreconditionFailed" "${update_error}" && [ "${attempt}" -lt "${max_update_attempts}" ]; then
    echo "CloudFront distribution changed while updating; retrying with a fresh ETag (${attempt}/${max_update_attempts})." >&2
    sleep $((attempt * 2))
    continue
  fi

  cat "${update_error}" >&2
  exit 1
done

if [ "${update_succeeded}" != "true" ]; then
  echo "CloudFront distribution update did not complete after ${max_update_attempts} attempts." >&2
  exit 1
fi

aws cloudfront wait distribution-deployed --id "${CLOUDFRONT_DISTRIBUTION_ID}"
echo "Static edge router and response headers policy are published and associated."
