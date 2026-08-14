/* Customer activity adapter tests: normalization only, no Firebase access. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../js/visits/customer-activity-adapter.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const adapter = context.window.WEICONCustomerActivityAdapter;
if (!adapter) throw new Error('Activity adapter was not initialized.');

const customer = {
  id: 'C-100',
  sonHareketler: [
    { id: 'a1', hareket: 'ziyaret', tarih: '2026-08-14', aciklama: 'Teknik görüşme' },
    { id: 'a2', hareket: 'whatsapp', tarih: '2026-08-13', aciklama: 'Teklif gönderildi' },
    { id: 'a3', hareket: 'email', tarih: '2026-08-12', aciklama: 'Mail' }
  ]
};

const result = adapter.fromCustomer(customer);
if (result.length !== 3) throw new Error('Expected 3 activities.');
if (result[0].type !== 'ziyaret') throw new Error('Ziyaret type normalization failed.');
if (result[1].type !== 'WhatsApp') throw new Error('WhatsApp type normalization failed.');
if (result[2].type !== 'mail') throw new Error('Email type normalization failed.');
if (result[0].customerId !== 'C-100') throw new Error('Customer ID mapping failed.');
if (result[0].note !== 'Teknik görüşme') throw new Error('Note mapping failed.');

const empty = adapter.fromCustomer({ id: 'C-101' });
if (!Array.isArray(empty) || empty.length !== 0) throw new Error('Empty activity handling failed.');

console.log('WE-CON-CRM customer activity adapter test: PASS');
