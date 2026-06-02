import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../deploy/cloudfront/static-spa-router.js", import.meta.url), "utf8");

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

console.log("Platform Academy static SPA router validation passed.");
