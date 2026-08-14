/* Non-DOM browser simulation for customer selection -> memory UI event chain. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function load(file, context) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}

const listeners = {};
const document = {
  readyState: 'complete',
  addEventListener(type, handler) {
    (listeners['document:' + type] ||= []).push(handler);
  },
  querySelectorAll() { return []; },
  body: {}
};
const window = {
  document,
  addEventListener(type, handler) {
    (listeners['window:' + type] ||= []).push(handler);
  },
  dispatchEvent(event) {
    (listeners['window:' + event.type] || []).forEach(handler => handler(event));
  },
  CustomEvent: class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
};

const context = { window, document, console };
vm.createContext(context);
load('js/customers/customer-selection-bridge.js', context);

let received = null;
window.addEventListener('weicon:customer-selected', event => { received = event.detail; });

const ok = window.WEICONCustomerSelectionBridge.select({ id: 'C-900', name: 'Test Customer' });
if (!ok) throw new Error('Selection bridge did not emit.');
if (!received || received.customerId !== 'C-900') throw new Error('Customer selection event was not propagated.');
if (!received.customer || received.customer.name !== 'Test Customer') throw new Error('Customer payload was not propagated.');

console.log('WE-CON-CRM customer selection UI integration test: PASS');
