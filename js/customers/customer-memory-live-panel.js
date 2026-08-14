/* WE-CON-CRM Customer Memory Live Panel
 * Visible, non-invasive panel for the legacy CRM. No Firebase writes.
 * The panel is attached to the real customer-card modal when it exists.
 */
(function (global) {
  'use strict';

  const PANEL_ID = 'weicon-customer-memory-live-panel';
  const CUSTOMER_MODAL_ID = 'musteriKartModal';
  let lastCustomerId = null;

  function ensureStyles() {
    if (document.getElementById('weicon-customer-memory-live-style')) return;
    const style = document.createElement('style');
    style.id = 'weicon-customer-memory-live-style';
    style.textContent = `
      #${PANEL_ID}{margin:16px 0 18px;background:#f7fbff;border:2px solid #3569b8;border-radius:14px;box-shadow:0 4px 14px rgba(0,58,112,.10);font:inherit;color:#172033;overflow:hidden}
      #${PANEL_ID} .wm-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#003a70;color:#fff;font-size:25px;font-weight:900}
      #${PANEL_ID} .wm-close{border:0;background:transparent;font-size:25px;line-height:1;cursor:pointer;color:#fff}
      #${PANEL_ID} .wm-body{padding:12px 14px}
      #${PANEL_ID} .wm-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 2px;border-bottom:1px solid #dce7f5}
      #${PANEL_ID} .wm-row:last-child{border-bottom:0}
      #${PANEL_ID} .wm-label{color:#64748b;font-size:17px;font-weight:800}
      #${PANEL_ID} .wm-value{font-weight:900;text-align:right;color:#003a70;font-size:18px}
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
    panel.innerHTML = '<div class="wm-head"><span>🧠 Müşteri Hafızası</span><button class="wm-close" type="button" aria-label="Kapat">×</button></div><div class="wm-body"><div class="wm-row"><span class="wm-label">Müşteri</span><span class="wm-value" data-wm="customer">—</span></div><div class="wm-row"><span class="wm-label">Son Hareket</span><span class="wm-value" data-wm="activity">—</span></div><div class="wm-row"><span class="wm-label">Son Sipariş</span><span class="wm-value" data-wm="order">—</span></div><div class="wm-row"><span class="wm-label">Toplam Hareket</span><span class="wm-value" data-wm="count">0</span></div></div>';
    panel.querySelector('.wm-close').addEventListener('click', function () { panel.classList.add('wm-hidden'); });
    return panel;
  }

  function text(value, fallback) { return value == null || value === '' ? (fallback || '—') : String(value); }

  function getCustomerFromLegacyCard() {
    const list = global.musteriListesi;
    const idx = global.musteriKartIdx;
    if (!Array.isArray(list) || idx == null || !list[idx]) return null;
    return list[idx];
  }

  function isCustomerModalOpen() {
    const modal = document.getElementById(CUSTOMER_MODAL_ID);
    if (!modal) return false;
    const display = global.getComputedStyle ? global.getComputedStyle(modal).display : modal.style.display;
    return display !== 'none';
  }

  function mountIntoCustomerCard(panel) {
    const modal = document.getElementById(CUSTOMER_MODAL_ID);
    if (!modal) return false;
    const content = modal.querySelector(':scope > div');
    if (!content) return false;
    const closeButton = content.querySelector('button[onclick="musteriKartKapat()"]');
    if (closeButton && closeButton.parentElement) {
      closeButton.parentElement.parentElement.insertBefore(panel, closeButton.parentElement);
    } else {
      content.appendChild(panel);
    }
    return true;
  }

  async function show(customer, customerId) {
    const bridge = global.WEICONCustomerMemoryUIBridge;
    if (!bridge) return;
    const id = bridge.getCustomerId(customer || customerId);
    if (!id) return;
    const panel = getPanel();
    mountIntoCustomerCard(panel);
    if (!panel.parentElement) document.body.appendChild(panel);
    panel.classList.remove('wm-hidden');
    const snapshot = await bridge.getSnapshot(id);
    if (!snapshot) return;
    lastCustomerId = id;
    panel.querySelector('[data-wm="customer"]').textContent = customer && customer.ad ? customer.ad : id;
    const activity = snapshot.lastActivity;
    const order = snapshot.lastOrder;
    panel.querySelector('[data-wm="activity"]').textContent = activity ? text(activity.type, 'Hareket') + ' · ' + text(activity.date) : 'Kayıt yok';
    panel.querySelector('[data-wm="order"]').textContent = order ? text(order.date || order.tarih) : 'Kayıt yok';
    panel.querySelector('[data-wm="count"]').textContent = String(snapshot.activityCount || 0);
  }

  function syncLegacyCustomerCard() {
    if (!isCustomerModalOpen()) return;
    const customer = getCustomerFromLegacyCard();
    if (!customer) return;
    const bridge = global.WEICONCustomerMemoryUIBridge;
    if (!bridge) return;
    const id = bridge.getCustomerId(customer);
    const panel = document.getElementById(PANEL_ID);
    if (!id) return;
    if (id !== lastCustomerId || !panel || panel.classList.contains('wm-hidden')) {
      show(customer, id).catch(function (error) {
        console.warn('[WE-CON-CRM] Customer memory panel skipped:', error.message);
      });
    } else {
      mountIntoCustomerCard(panel);
    }
  }

  function boot() {
    global.addEventListener('weicon:customer-selected', function (event) {
      const detail = event && event.detail ? event.detail : {};
      show(detail.customer, detail.customerId || detail.id).catch(function (error) {
        console.warn('[WE-CON-CRM] Live memory panel skipped:', error.message);
      });
    });
    global.setInterval(syncLegacyCustomerCard, 350);
    syncLegacyCustomerCard();
  }

  global.WEICONCustomerMemoryLivePanel = Object.freeze({ show });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
