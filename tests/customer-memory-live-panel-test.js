/* Visible customer memory panel smoke test. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../js/customers/customer-memory-live-panel.js'), 'utf8');
const listeners = {};
function EventTarget() {}
EventTarget.prototype.addEventListener = function (name, fn) { listeners[name] = fn; };
const document = {
  readyState: 'complete',
  head: { appendChild() {} },
  body: { appendChild() {} },
  getElementById() { return null; },
  createElement() { return { id: '', setAttribute() {}, appendChild() {}, querySelector() { return { addEventListener() {} }; }, innerHTML: '', classList: { add() {}, remove() {} } }; }
};
const context = { window: new EventTarget(), document, console, Promise, String, Date };
context.window.document = document;
context.window.WEICONCustomerMemoryUIBridge = {
  getCustomerId(value) { return value && value.id ? value.id : String(value || ''); },
  async getSnapshot() { return { lastActivity: { type: 'ziyaret', date: '2026-08-14' }, lastOrder: { date: '2026-08-10' }, activityCount: 3 }; }
};
vm.createContext(context);
vm.runInContext(source, context);
if (!context.window.WEICONCustomerMemoryLivePanel) throw new Error('Live panel API missing.');
if (!listeners['weicon:customer-selected']) throw new Error('Customer selection listener missing.');
console.log('WE-CON-CRM customer memory live panel test: PASS');
