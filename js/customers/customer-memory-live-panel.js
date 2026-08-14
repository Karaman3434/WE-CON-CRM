/* WE-CON-CRM Customer Memory Live Panel
 * Reliable DOM-first version for the legacy customer card.
 * No dependency on Firebase or a separate bridge is required for visibility.
 */
(function (global) {
  'use strict';

  const PANEL_ID = 'weicon-customer-memory-live-panel';
  const MODAL_ID = 'musteriKartModal';
  let timer = null;
  let observer = null;

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

  function makePanel() {
    ensureStyles();
    const panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.setAttribute('aria-label', 'Müşteri Hafızası');
    panel.innerHTML = `
      <div class="wm-head">
        <span>🧠 Müşteri Hafızası</span>
        <button class="wm-close" type="button" aria-label="Kapat">×</button>
      </div>
      <div class="wm-body">
        <div class="wm-row"><span class="wm-label">Müşteri</span><span class="wm-value" data-wm="customer">—</span></div>
        <div class="wm-row"><span class="wm-label">Son Temas</span><span class="wm-value" data-wm="activity">Kayıtlı temas yok</span></div>
        <div class="wm-row"><span class="wm-label">Toplam İşlem</span><span class="wm-value" data-wm="count">0</span></div>
        <div class="wm-row"><span class="wm-label">Toplam Tutar</span><span class="wm-value" data-wm="total">—</span></div>
      </div>`;
    panel.querySelector('.wm-close').addEventListener('click', function () {
      panel.classList.add('wm-hidden');
    });
    return panel;
  }

  function modalIsOpen(modal) {
    if (!modal) return false;
    const style = global.getComputedStyle ? global.getComputedStyle(modal) : null;
    return (style ? style.display : modal.style.display) !== 'none';
  }

  function findCloseButton(modal) {
    return modal.querySelector('button[onclick="musteriKartKapat()"]');
  }

  function mount(panel, modal) {
    if (!modal || !modalIsOpen(modal)) return false;
    const content = modal.firstElementChild;
    if (!content) return false;
    if (panel.parentElement !== content) {
      const closeButton = findCloseButton(modal);
      if (closeButton && closeButton.parentElement === content.querySelector(':scope > div:last-child')) {
        content.insertBefore(panel, closeButton.parentElement);
      } else {
        content.appendChild(panel);
      }
    }
    return true;
  }

  function clean(value) {
    return (value || '').replace(/\\s+/g, ' ').trim();
  }

  function sync() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal || !modalIsOpen(modal)) return;

    let panel = document.getElementById(PANEL_ID);
    if (!panel) panel = makePanel();
    if (!mount(panel, modal)) return;
    panel.classList.remove('wm-hidden');

    const customer = clean(document.getElementById('musteriKartAd')?.textContent);
    const visit = clean(document.getElementById('musteriKartZiyaretBilgi')?.textContent);
    const lastContact = clean(document.getElementById('cariKartSonTemas')?.textContent);

    const infoText = clean(document.getElementById('musteriKartBilgi')?.textContent);
    const summaryText = clean(modal.textContent);

    panel.querySelector('[data-wm="customer"]').textContent = customer || '—';
    panel.querySelector('[data-wm="activity"]').textContent = visit || (lastContact && lastContact !== '-' ? lastContact : 'Kayıtlı temas yok');

    const countMatch = summaryText.match(/(?:TOPLAM İŞLEM|Toplam İşlem)\\s*([0-9]+)/i);
    const totalMatch = summaryText.match(/(?:TOPLAM TUTAR|Toplam Tutar)\\s*([0-9.,]+\\s*€)/i);
    panel.querySelector('[data-wm="count"]').textContent = countMatch ? countMatch[1] : (infoText ? '1' : '0');
    panel.querySelector('[data-wm="total"]').textContent = totalMatch ? totalMatch[1] : '—';
  }

  function boot() {
    if (timer) global.clearInterval(timer);
    timer = global.setInterval(sync, 250);
    sync();

    if (observer) observer.disconnect();
    observer = new MutationObserver(function () { sync(); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  global.WEICONCustomerMemoryLivePanel = Object.freeze({ show: sync });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(window);
