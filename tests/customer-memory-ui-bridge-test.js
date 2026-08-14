/* Read-only customer memory UI bridge test. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../js/customers/customer-memory-ui-bridge.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const bridge = context.window.WEICONCustomerMemoryUIBridge;
if (!bridge) throw new Error('UI bridge was not initialized.');

const service = {
  async getCustomerSnapshot(id) {
    return { customerId: String(id), lastActivity: { type: 'ziyaret' } };
  }
};
context.window.WEICONCustomerMemoryReadService = service;

(async () => {
  const snapshot = await bridge.getSnapshot('C-100');
  if (snapshot.customerId !== 'C-100') throw new Error('Snapshot forwarding failed.');
  if (bridge.getCustomerId({ musteriId: 'C-200' }) !== 'C-200') throw new Error('Customer ID extraction failed.');
  if (bridge.getCustomerId('C-300') !== 'C-300') throw new Error('String customer ID extraction failed.');
  console.log('WE-CON-CRM customer memory UI bridge test: PASS');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
