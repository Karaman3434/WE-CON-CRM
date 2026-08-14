/* WE-CON-CRM Customer Memory Live Panel
 * Visible, non-invasive panel for the legacy CRM. No Firebase writes.
 */
(function (global) {
  'use strict';

  const PANEL_ID = 'weicon-customer-memory-live-panel';

  function ensureStyles() {
    if (document.getElementById('weicon-customer-memory-live-style')) return;
    const style = document.createElement('style');
    style.id = 'weicon-customer-memory-live-style';
    style.textContent = `
      #${PANEL_ID}{position:fixed;right:16px;bottom:16px;width:min(360px,calc(100vw - 32px));z-index:2147483000;background:#fff;border:1px solid #d9dee7;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.16);font:14px/1.4 Arial,sans-serif;color:#172033;overflow:hidden}
      #${PANEL_ID} .wm-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #edf0f4;font-weight:700}
      #${PANEL_ID} .wm-close{border:0;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:#667085}
      #${PANEL_ID} .wm-body{padding:12px 14px}
      #${PANEL_ID} .wm-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #f0f2f5}
      #${PANEL_ID} .wm-row:last-child{border-bottom:0}
      #${PANEL_ID} .wm-label{color:#667085}
      #${PANEL_ID} .wm-value{font-weight:600;text-align:right}
      #${PANEL_ID}.wm-hidden{display:none}
    `;
    document.head.appendChild(style);
  }

  function getPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;
    ensureStyles();
    panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.setAttribute('aria-label', 'Müşteri Hafızası');
    panel.innerHTML = '<div class="wm-head"><span>Müşteri Hafızası</span><button class="wm-close" type="button" aria-label="Kapat">×</button></div><div class="wm-body"><div class="wm-row"><span class="wm-label">Müşteri</span><span class="wm-value" data-wm="customer">—</span></div><div class="wm-row"><span class="wm-label">Son Hareket</span><span class="wm-value" data-wm="activity">—</span></div><div class="wm-row"><span class="wm-label">Son Sipariş</span><span class="wm-value" data-wm="order">—</span></div><div class="wm-row"><span class="wm-label">Toplam Hareket</span><span class="wm-value" data-wm="count">0</span></div></div>';
    panel.querySelector('.wm-close').addEventListener('click', function () { panel.classList.add('wm-hidden'); });
    document.body.appendChild(panel);
    return panel;
  }

  function text(value, fallback) { return value == null || value === '' ? (fallback || '—') : String(value); }

  async function show(customer, customerId) {
    const bridge = global.WEICONCustomerMemoryUIBridge;
    if (!bridge) return;
    const id = bridge.getCustomerId(customer || customerId);
    if (!id) return;
    const panel = getPanel();
    panel.classList.remove('wm-hidden');
    const snapshot = await bridge.getSnapshot(id);
    if (!snapshot) return;
    panel.querySelector('[data-wm="customer"]').textContent = id;
    const activity = snapshot.lastActivity;
    const order = snapshot.lastOrder;
    panel.querySelector('[data-wm="activity"]').textContent = activity ? text(activity.type, 'Hareket') + ' · ' + text(activity.date) : 'Kayıt yok';
    panel.querySelector('[data-wm="order"]').textContent = order ? text(order.date || order.tarih) : 'Kayıt yok';
    panel.querySelector('[data-wm="count"]').textContent = String(snapshot.activityCount || 0);
  }

  function boot() {
    global.addEventListener('weicon:customer-selected', function (event) {
      const detail = event && event.detail ? event.detail : {};
      show(detail.customer, detail.customerId || detail.id).catch(function (error) {
        console.warn('[WE-CON-CRM] Live memory panel skipped:', error.message);
      });
    });
  }

  global.WEICONCustomerMemoryLivePanel = Object.freeze({ show });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
