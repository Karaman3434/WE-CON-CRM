/* Static integration guard for the modular runtime. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'js/modular-runtime.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`Integration test failed: ${message}`);
}

assert(sw.includes('js/modular-runtime.js'), 'service worker injects modular runtime');
assert(sw.includes('text/html'), 'service worker limits HTML transformation');
assert(sw.includes('caches.match(event.request)'), 'offline fallback remains available');
assert(runtime.includes('js/core/app-state.js'), 'runtime includes core module');
assert(runtime.includes('js/firebase/firebase-gateway.js'), 'runtime includes Firebase gateway');
assert(runtime.includes('js/customers/customer-service.js'), 'runtime includes customer service');
assert(runtime.includes('js/products/product-repository.js'), 'runtime includes product repository');
assert(runtime.includes('js/pricelist/price-service.js'), 'runtime includes price service');
assert(runtime.includes('js/reports/report-model.js'), 'runtime includes report model');
assert(index.includes('</body>'), 'legacy index remains structurally intact');

console.log('WE-CON-CRM modular static integration test: PASS');
