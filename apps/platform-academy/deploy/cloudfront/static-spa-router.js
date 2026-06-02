function apiUnavailableResponse() {
  return {
    statusCode: 404,
    statusDescription: 'Not Found',
    headers: {
      'content-type': { value: 'application/json' },
      'cache-control': { value: 'no-store' },
      'x-robots-tag': { value: 'noindex, nofollow' },
    },
    body: '{"status":"not_found","message":"This static Platform Academy host serves the public catalog and browser-local workspace. Start an approved demo environment for API-backed workflows."}',
  };
}

function isStaticApiSnapshot(uri) {
  return (
    uri === '/api/platform-academy/catalog' ||
    uri === '/api/platform-academy/roadmap' ||
    uri === '/api/platform-academy/resources' ||
    uri === '/api/platform-academy/interview-prep' ||
    uri === '/api/platform-academy/labs' ||
    /^\/api\/lessons\/[0-9]+$/.test(uri)
  );
}

function isApiRoute(uri) {
  return uri === '/api' || uri.indexOf('/api/') === 0 || uri === '/healthz' || uri === '/readyz';
}

function isStaticAsset(uri) {
  return uri === '/' || uri.indexOf('.') !== -1 || uri.indexOf('/assets/') === 0 || uri.indexOf('/static-api/') === 0;
}

function isSpaNavigationMethod(request) {
  return request.method === 'GET' || request.method === 'HEAD';
}

function handler(event) {
  var request = event.request;
  var uri = request.uri || '/';

  if (isApiRoute(uri) && !isStaticApiSnapshot(uri)) {
    return apiUnavailableResponse();
  }

  if (isStaticApiSnapshot(uri)) {
    return request;
  }

  if (isSpaNavigationMethod(request) && !isStaticAsset(uri)) {
    request.uri = '/index.html';
  }

  return request;
}
