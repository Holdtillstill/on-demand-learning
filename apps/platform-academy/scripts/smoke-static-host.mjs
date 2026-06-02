const WEB_BASE = normalizeBase(process.env.WEB_BASE || process.env.PLATFORM_WEB_BASE || 'https://platform-academy.bozhi.dev');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const EXPECT_SECURITY_HEADERS = process.env.SMOKE_EXPECT_SECURITY_HEADERS !== 'false';

const htmlRoutes = [
  '/',
  '/dashboard/home',
  '/roadmap',
  '/labs',
  '/labs/trace-service-to-pod',
  '/resources',
  '/interview-prep',
  '/missing-route',
];

const staticJsonChecks = [
  {
    path: '/static-api/platform-academy-catalog.json',
    validate: (payload) => {
      assert(payload.total_courses === 21, `Expected 21 courses, got ${payload.total_courses}`);
      assert(payload.total_lessons === 84, `Expected 84 lessons, got ${payload.total_lessons}`);
      assert(Array.isArray(payload.labs) && payload.labs.length === 21, `Expected 21 labs, got ${payload.labs?.length}`);
    },
  },
  {
    path: '/static-api/platform-academy-resources.json',
    validate: (payload) => {
      assert(Array.isArray(payload.resources) && payload.resources.length === 320, `Expected 320 resources, got ${payload.resources?.length}`);
    },
  },
  {
    path: '/static-api/platform-academy-interview-prep.json',
    validate: (payload) => {
      assert(Array.isArray(payload.packs) && payload.packs.length === 22, `Expected 22 interview packs, got ${payload.packs?.length}`);
      assert(payload.total_questions === 219, `Expected 219 interview questions, got ${payload.total_questions}`);
    },
  },
  {
    path: '/api/platform-academy/catalog',
    validate: (payload) => {
      assert(payload.total_courses === 21, 'Static /api catalog alias should return the checked-in catalog snapshot');
    },
  },
];

function normalizeBase(value) {
  return value.replace(/\/+$/, '');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${WEB_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    return {
      body: await response.text(),
      contentType: response.headers.get('content-type') || '',
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function requireHeader(headers, name, expected) {
  const value = headers[name.toLowerCase()] || '';
  assert(value, `Expected ${name} security header on ${WEB_BASE}`);
  if (expected instanceof RegExp) assert(expected.test(value), `Expected ${name} to match ${expected}, got "${value}"`);
  if (typeof expected === 'string') assert(value === expected, `Expected ${name} to be "${expected}", got "${value}"`);
  return value;
}

function assertSecurityHeaders(result) {
  if (!EXPECT_SECURITY_HEADERS) return;

  const csp = requireHeader(result.headers, 'content-security-policy', /default-src 'self'/);
  for (const requiredDirective of [
    "base-uri 'self'",
    "connect-src 'self' https://on-demand-demos.bozhi.dev",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' https://on-demand-demos.bozhi.dev",
    'upgrade-insecure-requests',
  ]) {
    assert(csp.includes(requiredDirective), `CSP should include ${requiredDirective}`);
  }
  assert(!/script-src[^;]*'unsafe-inline'/.test(csp), 'CSP script-src should not allow unsafe-inline');

  requireHeader(result.headers, 'strict-transport-security', /max-age=31536000/);
  requireHeader(result.headers, 'x-content-type-options', 'nosniff');
  requireHeader(result.headers, 'x-frame-options', 'DENY');
  requireHeader(result.headers, 'referrer-policy', 'strict-origin-when-cross-origin');
}

async function assertHtmlShell(path) {
  const result = await fetchText(path);
  assert(result.status === 200, `${path} should return 200, got ${result.status}`);
  assert(result.contentType.toLowerCase().includes('text/html'), `${path} should return HTML, got ${result.contentType}`);
  assert(result.body.includes('<div id="root"></div>'), `${path} should serve the app shell`);
  assert(result.body.includes('https://on-demand-demos.bozhi.dev/visitor.js'), `${path} should include visitor script`);
  assert(result.body.includes('data-project="platform-academy"'), `${path} should tag visitor events with platform-academy`);
  if (path === '/') assertSecurityHeaders(result);
}

async function assertJsonSnapshot({ path, validate }) {
  const result = await fetchText(path, { headers: { accept: 'application/json' } });
  assert(result.status === 200, `${path} should return 200, got ${result.status}`);
  const payload = JSON.parse(result.body);
  validate(payload);
}

async function assertLabPacket() {
  const result = await fetchText('/static-api/labs/trace-service-to-pod/packet.md');
  assert(result.status === 200, `Lab packet should return 200, got ${result.status}`);
  assert(result.body.includes('# Trace Service traffic to ready Pods'), 'Lab packet should include the expected title');
  assert(result.body.includes('Validation commands'), 'Lab packet should include validation guidance');
}

for (const route of htmlRoutes) {
  await assertHtmlShell(route);
}

for (const check of staticJsonChecks) {
  await assertJsonSnapshot(check);
}

await assertLabPacket();

console.log(`Platform Academy static host smoke passed for ${WEB_BASE}.`);
