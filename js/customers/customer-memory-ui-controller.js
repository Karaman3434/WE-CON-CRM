/* WE-CON-CRM Customer Memory UI Controller
 * Safe, opt-in DOM integration for the legacy UI.
 * It reacts only to the explicit weicon:customer-selected event or elements
 * carrying data-customer-id. It never writes customer/Firebase data.
 */
(function (global) {
  'use strict';

  function formatDate(value) {
    if (!value) return '—';
    return String(value);
  }

  function render(target, snapshot) {
    if (!target || !snapshot) return;
    let panel = target.querySelector('.weicon-customer-memory');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'weicon-customer-memory';
      panel.setAttribute('aria-label', 'Müşteri Hafızası');
      panel.style.cssText = 'margin-top:10px;padding:10px;border:1px solid rgba(0,0,0,.10);border-radius:10px;font-size:13px;';
      target.appendChild(panel);
    }

    const activity = snapshot.lastActivity;
    const order = snapshot.lastOrder;
    panel.innerHTML = '' +
      '<strong>Müşteri Hafızası</strong>' +
      '<div style="margin-top:6px">Son Hareket: ' +
      (activity ? `${activity.type || 'Hareket'} · ${formatDate(activity.date)}` : 'Kayıt yok') +
      '</div>' +
      '<div>Son Sipariş: ' +
      (order ? formatDate(order.date || order.tarih) : 'Kayıt yok') +
      '</div>' +
      '<div>Toplam Hareket: ' + String(snapshot.activityCount || 0) + '</div>';
  }

  async function attach(target, customerId) {
    const bridge = global.WEICONCustomerMemoryUIBridge;
    if (!bridge) return;
    const id = bridge.getCustomerId(customerId);
    if (!id) return;
    try {
      const snapshot = await bridge.getSnapshot(id);
      if (snapshot) render(target, snapshot);
    } catch (error) {
      console.warn('[WE-CON-CRM] Customer memory UI skipped:', error.message);
    }
  }

  function boot() {
    global.addEventListener('weicon:customer-selected', function (event) {
      const detail = event && event.detail ? event.detail : {};
      const target = detail.target || document.querySelector('[data-customer-memory-target]');
      if (target) attach(target, detail.customer || detail.customerId || detail.id);
    });

    document.querySelectorAll('[data-customer-id]').forEach(function (target) {
      attach(target, target.getAttribute('data-customer-id'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
