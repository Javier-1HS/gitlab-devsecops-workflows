import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Configuración personalizada de métricas
const errorRate = new Rate('errors');
const responseTiming = new Trend('response_time');
const apiDuration = new Trend('api_duration');

// Configuración de opciones
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up 20 usuarios
    { duration: '1m', target: 50 },    // Mantener 50 usuarios por 1 minuto
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.1'],                    // Error rate < 10%
    response_time: ['p(95)<500'],             // 95% request < 500ms
    'response_time{staticAsset:yes}': ['p(99)<250'], // Static assets < 250ms
  },
  ext: {
    loadimpact: {
      projectID: 3486808,
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Test: Health Check
  group('Health Check', function () {
    const healthRes = http.get(`${BASE_URL}/health`, {
      tags: { name: 'HealthCheck' },
    });
    check(healthRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });
    responseTiming.add(healthRes.timings.duration);
    errorRate.add(healthRes.status !== 200);
  });

  sleep(1);

  // Test: Get Version
  group('Version Endpoint', function () {
    const versionRes = http.get(`${BASE_URL}/version`, {
      tags: { name: 'GetVersion' },
    });
    check(versionRes, {
      'status is 200': (r) => r.status === 200,
      'has version field': (r) => JSON.parse(r.body).version !== undefined,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
    apiDuration.add(versionRes.timings.duration);
    errorRate.add(versionRes.status !== 200);
  });

  sleep(1);

  // Test: API Endpoint - GET
  group('API - GET Request', function () {
    const apiRes = http.get(`${BASE_URL}/api/v1/data`, {
      tags: { 
        name: 'GetData',
        staticAsset: 'no',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    check(apiRes, {
      'status is 200': (r) => r.status === 200,
      'response is JSON': (r) => r.headers['content-type'] === 'application/json',
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    responseTiming.add(apiRes.timings.duration);
    errorRate.add(apiRes.status !== 200);
  });

  sleep(2);

  // Test: API Endpoint - POST
  group('API - POST Request', function () {
    const payload = JSON.stringify({
      name: 'Test User',
      email: 'test@crezcamos.com',
      description: 'Load test user',
    });

    const postRes = http.post(`${BASE_URL}/api/v1/data`, payload, {
      tags: { 
        name: 'CreateData',
        staticAsset: 'no',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    check(postRes, {
      'status is 201': (r) => r.status === 201,
      'response is JSON': (r) => r.headers['content-type'] === 'application/json',
      'response time < 750ms': (r) => r.timings.duration < 750,
    });
    responseTiming.add(postRes.timings.duration);
    errorRate.add(postRes.status !== 201);
  });

  sleep(1);

  // Test: Static Assets
  group('Static Assets', function () {
    const staticRes = http.get(`${BASE_URL}/public/style.css`, {
      tags: { 
        name: 'StaticAsset',
        staticAsset: 'yes',
      },
    });
    check(staticRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });
    responseTiming.add(staticRes.timings.duration);
  });

  sleep(1);

  // Test: Concurrent Requests
  group('Concurrent Requests', function () {
    const responses = http.batch([
      ['GET', `${BASE_URL}/api/v1/users`],
      ['GET', `${BASE_URL}/api/v1/products`],
      ['GET', `${BASE_URL}/api/v1/settings`],
    ]);
    
    responses.forEach((res) => {
      check(res, {
        'status is 200': (r) => r.status === 200,
      });
      responseTiming.add(res.timings.duration);
      errorRate.add(res.status !== 200);
    });
  });

  sleep(2);
}

// Función para validar desempeño después de tests
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Helper para resumen de texto
function textSummary(data, options) {
  let summary = '\n=== Load Test Summary ===\n';
  summary += `Total Requests: ${data.metrics.http_reqs?.value || 0}\n`;
  summary += `Total Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;
  summary += `Error Rate: ${(((data.metrics.errors?.value || 0) / (data.metrics.http_reqs?.value || 1)) * 100).toFixed(2)}%\n`;
  summary += `Avg Response Time: ${(data.metrics.response_time?.value || 0).toFixed(2)}ms\n`;
  return summary;
}
