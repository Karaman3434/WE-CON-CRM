/* WE-CON-CRM — Customer Memory Card
 * Standalone UI integration for the existing legacy customer card.
 * Read-only: no Firebase/localStorage writes.
 * Intentionally independent from the modular runtime so it can render even
 * when the legacy page is served from an older cached build.
 */
(function (global) {
  'use strict';

  var PANEL_ID = 'weicon-customer-memory-card';
  var CHECK_MS = 300;

  function text(value, fallback) {
    return value == null || value === '' ? (fallback || '—') : String(value);
  }

  function formatMoney(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return '0,00 €';
    return n.toFixed(2).replace('.', ',') + ' €';
  }

  function formatDate(value) {
    if (!value) return 'Kayıt yok';
    var d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return String(value);
  }

  function getCustomer() {
    var list = global.musteriListesi;
    var idx = global.musteriKartIdx;
    if (!Array.isArray(list) || idx == null || !list[idx]) return null;
    return list[idx];
  }

  function isOpen() {
    var modal = document.getElementById('musteriKartModal');
    if (!modal) return false;
    var style = global.getComputedStyle ? global.getComputedStyle(modal) : null;
    return (style ? style.display : modal.style.display) !== 'none';
  }

  function getSummary(customer) {
    try {
      if (typeof global.musteriIslemOzetiGetir === 'function') {
        var summary = global.musteriIslemOzetiGetir(customer);
        if (summary) return summary;
      }
    } catch (e) {}
    return { sayi: 0, toplamEuro: 0 };
  }

  function getLastOrder(customer) {
    var candidates = [
      customer && customer.sonSiparis,
      customer && customer.sonSiparisTarihi,
      customer && customer.lastOrder,
      customer && customer.lastOrderDate
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i]) return formatDate(candidates[i]);
    }

    var arrays = [customer && customer.siparisler, customer && customer.siparisGecmisi, customer && customer.orders, customer && customer.orderHistory];
    for (var j = 0; j < arrays.length; j++) {
      if (Array.isArray(arrays[j]) && arrays[j].length) {
        var last = arrays[j][arrays[j].length - 1] || {};
        return formatDate(last.tarih || last.date || last.createdAt);
      }
    }
    return 'Kayıt yok';
  }

  function ensureStyles() {
    if (document.getElementById('weicon-customer-memory-card-style')) return;
    var style = document.createElement('style');
    style.id = 'weicon-customer-memory-card-style';
    style.textContent = '' +
      '#' + PANEL_ID + '{margin:0 0 18px;background:#f7fbff;border:2px solid #1f5fae;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,58,112,.12)}' +
      '#' + PANEL_ID + ' .wm-title{background:#003a70;color:#fff;padding:13px 16px;font-size:23px;font-weight:900}' +
      '#' + PANEL_ID + ' .wm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}' +
      '#' + PANEL_ID + ' .wm-item{padding:11px 15px;border-bottom:1px solid #dbe7f5}' +
      '#' + PANEL_ID + ' .wm-item:nth-last-child(-n+2){border-bottom:0}' +
      '#' + PANEL_ID + ' .wm-label{display:block;color:#718096;font-size:13px;font-weight:800;margin-bottom:3px}' +
      '#' + PANEL_ID + ' .wm-value{display:block;color:#003a70;font-size:18px;font-weight:900}' +
      '@media(max-width:600px){#' + PANEL_ID + ' .wm-grid{grid-template-columns:1fr 1fr}#' + PANEL_ID + ' .wm-value{font-size:17px}}';
    document.head.appendChild(style);
  }

  function render() {
    var modal = document.getElementById('musteriKartModal');
    if (!modal || !isOpen()) return;
    var customer = getCustomer();
    if (!customer) return;

    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      ensureStyles();
      panel = document.createElement('section');
      panel.id = PANEL_ID;
      panel.setAttribute('aria-label', 'Müşteri Hafızası');

      var anchor = document.getElementById('cariKartSonTemas');
      var anchorParent = anchor && anchor.parentElement;
      if (anchorParent && anchorParent.parentElement) {
        anchorParent.parentElement.insertBefore(panel, anchorParent.parentElement.firstElementChild);
      } else {
        var content = modal.querySelector(':scope > div');
        if (content) content.appendChild(panel);
        else modal.appendChild(panel);
      }
    }

    var summary = getSummary(customer);
    var lastContact = customer.sonZiyaret ? formatDate(customer.sonZiyaret) : 'Kayıt yok';
    var count = Number(summary.sayi) || 0;
    var total = Number(summary.toplamEuro) || 0;

    panel.innerHTML = '' +
      '<div class="wm-title">🧠 Müşteri Hafızası</div>' +
      '<div class="wm-grid">' +
        '<div class="wm-item"><span class="wm-label">Müşteri</span><span class="wm-value">' + text(customer.ad) + '</span></div>' +
        '<div class="wm-item"><span class="wm-label">Son Temas</span><span class="wm-value">' + lastContact + '</span></div>' +
        '<div class="wm-item"><span class="wm-label">Toplam İşlem</span><span class="wm-value">' + count + '</span></div>' +
        '<div class="wm-item"><span class="wm-label">Toplam Tutar</span><span class="wm-value">' + formatMoney(total) + '</span></div>' +
        '<div class="wm-item"><span class="wm-label">Son Sipariş</span><span class="wm-value">' + getLastOrder(customer) + '</span></div>' +
        '<div class="wm-item"><span class="wm-label">Müşteri Kodu</span><span class="wm-value">' + text(customer.kod || customer.musteriKodu || customer.id) + '</span></div>' +
      '</div>';
  }

  function boot() {
    setInterval(render, CHECK_MS);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
