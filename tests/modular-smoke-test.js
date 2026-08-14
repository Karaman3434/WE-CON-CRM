/* WE-CON-CRM modular architecture smoke test
 * Run with: node tests/modular-smoke-test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = { console };
context.window = context;
vm.createContext(context);

const files = [
  'js/core/app-state.js',
  'js/core/event-bus.js',
  'js/core/module-registry.js',
  'js/firebase/firebase-gateway.js',
  'js/firebase/storage-policy.js',
  'js/customers/customer-model.js',
  'js/customers/customer-repository.js',
  'js/customers/customer-service.js',
  'js/customers/customer-memory.js',
  'js/customers/customer-memory-read-service.js',
  'js/visits/activity-model.js',
  'js/visits/activity-repository.js',
  'js/products/product-model.js',
  'js/products/product-repository.js',
  'js/pricelist/price-service.js',
  'js/reports/report-model.js'
];

for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

function assert(condition, message) {
  if (!condition) throw new Error(`Smoke test failed: ${message}`);
}

function approximately(actual, expected, epsilon = 1e-9) {
  return Math.abs(actual - expected) <= epsilon;
}

assert(context.WEICONCustomerModel.normalize({ id: 7 }).id === '7', 'customer model');
assert(context.WEICONActivityModel.TYPES.includes('WhatsApp'), 'activity types');
assert(approximately(context.WEICONPriceService.withDiscount(100, 10), 90), 'price discount');
assert(approximately(context.WEICONPriceService.withMarkup(100, 10), 110), 'price markup');

context.WEICONCustomerRepository.configure({
  async read() { return [{ id: '1', firma: 'Test' }]; },
  async write(customer) { return customer; },
  async remove(id) { return id; }
});

(async () => {
  const customers = await context.WEICONCustomerService.getAll();
  assert(customers.length === 1, 'customer service list');

  const memory = context.WEICONCustomerMemory.summarize(
    customers[0],
    [{ id: 'a', date: '2026-08-14', type: 'ziyaret' }],
    [{ id: 'o', date: '2026-08-13' }]
  );
  assert(memory.activityCount === 1 && memory.orderCount === 1, 'customer memory');

  const snapshot = await context.WEICONCustomerMemoryReadService.getCustomerSnapshot('1');
  assert(snapshot && snapshot.customerId === '1' && snapshot.activityCount === 0, 'customer memory read service');

  const report = context.WEICONReportModel.summarize(customers, [{ type: 'ziyaret' }, { type: 'mail' }]);
  assert(report.customerCount === 1 && report.activityCount === 2, 'report model');

  console.log('WE-CON-CRM modular smoke test: PASS');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
