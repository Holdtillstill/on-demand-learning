import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../deploy/cloudfront/static-spa-router.js", import.meta.url), "utf8");
const responseHeadersPolicy = JSON.parse(
  await readFile(new URL("../deploy/cloudfront/static-response-headers-policy.json", import.meta.url), "utf8")
);

function route(uri, method = "GET") {
  const context = {
    event: {
      request: {
        method,
        uri,
        headers: {},
      },
    },
  };
  return vm.runInNewContext(`${source}\nhandler(event);`, context);
}

for (const uri of ["/api", "/api/health", "/api/progress", "/api/platform-academy/activity/demo-user", "/healthz", "/readyz"]) {
  const response = route(uri);
  assert.equal(response.statusCode, 404, `${uri} should return an edge JSON 404`);
  assert.equal(response.headers["content-type"].value, "application/json");
  assert.match(response.body, /Platform Academy/);
}

for (const uri of [
  "/api/platform-academy/catalog",
  "/api/platform-academy/roadmap",
  "/api/platform-academy/resources",
  "/api/platform-academy/interview-prep",
  "/api/platform-academy/labs",
  "/api/lessons/1",
  "/api/lessons/84",
]) {
  const request = route(uri);
  assert.equal(request.uri, uri, `${uri} should pass through to the static API snapshot`);
}

for (const uri of [
  "/dashboard/home",
  "/roadmap",
  "/labs",
  "/labs/trace-service-to-pod",
  "/resources",
  "/interview-prep",
  "/missing-route",
]) {
  const request = route(uri);
  assert.equal(request.uri, "/index.html", `${uri} should rewrite to the SPA shell`);
}

for (const method of ["POST", "PUT", "DELETE"]) {
  const response = route("/dashboard/home", method);
  assert.equal(response.uri, "/dashboard/home", `${method} /dashboard/home should pass through without a shell rewrite`);
}

for (const uri of ["/", "/assets/index.js", "/favicon.svg", "/robots.txt", "/static-api/platform-academy-catalog.json"]) {
  const request = route(uri);
  assert.equal(request.uri, uri, `${uri} should pass through unchanged`);
}

const securityHeaders = responseHeadersPolicy.SecurityHeadersConfig;
assert.equal(responseHeadersPolicy.Name, "platform-academy-static-security-headers");
assert.equal(securityHeaders.FrameOptions.FrameOption, "DENY");
assert.equal(securityHeaders.ReferrerPolicy.ReferrerPolicy, "strict-origin-when-cross-origin");
assert.equal(securityHeaders.ContentTypeOptions.Override, true);
assert.equal(securityHeaders.StrictTransportSecurity.AccessControlMaxAgeSec, 31536000);
assert.equal(securityHeaders.StrictTransportSecurity.IncludeSubdomains, true);

const csp = securityHeaders.ContentSecurityPolicy.ContentSecurityPolicy;
for (const requiredDirective of [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "upgrade-insecure-requests",
]) {
  assert(csp.includes(requiredDirective), `CSP should include ${requiredDirective}`);
}
assert(!/script-src[^;]*'unsafe-inline'/.test(csp), "CSP script-src should not allow unsafe-inline");
assert(!csp.includes("on-demand-demos.bozhi.dev"), "CSP should not keep the removed visitor telemetry origin");

const customHeaders = Object.fromEntries(
  responseHeadersPolicy.CustomHeadersConfig.Items.map((item) => [item.Header.toLowerCase(), item.Value])
);
assert.equal(customHeaders["cross-origin-opener-policy"], "same-origin");
assert.equal(customHeaders["permissions-policy"], "camera=(), microphone=(), geolocation=(), payment=()");

console.log("Platform Academy static SPA router and response header policy validation passed.");
