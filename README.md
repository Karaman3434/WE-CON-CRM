# WE-CON-CRM
WEİCON CRM
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WEICON ASIST</title>
<style>
*{box-sizing:border-box;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:0;}
body{background-color:#f5f7fa;color:#333;padding:10px;display:flex;justify-content:center;}
.phone-container{width:100%;max-width:480px;background:#fff;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1);min-height:100vh;display:flex;flex-direction:column;overflow:hidden;position:relative;}
.app-header{text-align:center;padding:15px 10px 5px;font-size:20px;font-weight:bold;color:#003a70;}
.nav-tabs{display:flex;padding:8px 8px 0;gap:4px;}
.tab-btn{flex:1;padding:8px 2px;font-size:11px;font-weight:700;border:none;border-radius:4px 4px 0 0;cursor:pointer;text-align:center;background:#bcbcbc;color:#333;line-height:1.2;white-space:nowrap;overflow:hidden;}
.tab-btn.active{filter:brightness(0.85);}
.content-page{padding:10px;flex:1;display:none;margin-bottom:65px;overflow-y:auto;}
.content-page.active{display:flex;flex-direction:column;}
.page-info{text-align:center;font-size:12px;color:#666;margin-bottom:8px;font-weight:bold;}
.step-label{display:inline-block;background:#e2e8f0;color:#4a5568;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;margin-bottom:6px;text-transform:uppercase;}
.search-box-container{border:1px solid #999;border-radius:6px;padding:5px;margin-bottom:10px;background:#fff;}
.search-input{width:100%;border:none;outline:none;padding:8px;font-size:18px;}
.btn-primary{width:100%;background:#003a70;color:#fff;border:none;padding:12px;font-size:14px;font-weight:bold;letter-spacing:1px;border-radius:4px;cursor:pointer;margin-bottom:12px;text-transform:uppercase;}
.btn-update-container{text-align:right;margin-bottom:10px;}
.data-table-container{overflow-x:auto;}
.data-table{width:100%;border-collapse:collapse;table-layout:fixed;}
.data-table th{background:#003a70;color:#fff;font-size:11px;font-weight:bold;padding:6px 4px;text-align:left;}
.col-kodlar{width:25%;}.col-urun{width:49%;}.col-euro{width:14%;}.col-islem{width:12%;}
.data-table td{padding:6px 4px;font-size:11px;border-bottom:1px solid #e0e0e0;vertical-align:middle;}
.kod-container{font-size:10px;color:#555;line-height:1.3;}
.kod-b{color:#003a70;font-weight:bold;}.kod-a{color:#d9534f;font-weight:bold;}
.product-cell{font-weight:500;color:#222;word-break:break-word;}
.price-tag{background:#e8f4fd;color:#003a70;padding:2px 4px;border-radius:4px;font-weight:bold;display:inline-block;}
.btn-add{background:#003a70;color:#fff;border:none;padding:6px 4px;font-size:10px;border-radius:3px;cursor:pointer;width:100%;text-align:center;font-weight:bold;}
.btn-add.added{background:#d9534f!important;}
.no-data-msg{text-align:center;color:#888;padding:20px;font-size:12px;font-style:italic;}
.list-item-block{background:#f8f9fa;border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:8px;position:relative;}
.btn-item-remove{position:absolute;top:8px;right:8px;background:#d9534f;color:#fff;border:none;padding:3px 8px;font-size:10px;font-weight:bold;border-radius:4px;cursor:pointer;}
.list-item-header{font-size:12px;font-weight:bold;margin-bottom:4px;color:#222;padding-right:50px;}
.btn-sepette-hesapla{background:#28a745;color:#fff;border:none;padding:5px 8px;font-size:10px;font-weight:bold;border-radius:4px;cursor:pointer;white-space:nowrap;}
.placeholder-page{text-align:center;padding:20px;color:#666;font-size:13px;}
.hesap-section{background:#f7f9fc;border:1px solid #dce3ef;border-radius:8px;padding:12px 14px;margin-bottom:10px;}
.hesap-section-title{font-size:10px;font-weight:bold;color:#7a8bab;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}
.hesap-field{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;}
.hesap-field:last-child{margin-bottom:0;}
.hesap-field label{font-size:12px;color:#3a4a6b;flex:1;}
.hesap-input{width:120px;padding:5px 8px;border:1px solid #c5cfe0;border-radius:5px;font-size:13px;color:#1a2a4a;text-align:right;background:#fff;}
.hesap-input:focus{outline:none;border-color:#003a70;}
.hesap-result{width:120px;padding:5px 8px;background:#e8eef8;border:1px solid #c5cfe0;border-radius:5px;font-size:13px;font-weight:bold;color:#003a70;text-align:right;}
.hesap-result-vurgulu{width:120px;padding:6px 10px;background:#fff3e0;border:2px solid #ff9900;border-radius:5px;font-size:16px;font-weight:900;color:#ff9900;text-align:right;}
.hesap-two-col{display:flex;gap:8px;}
.hesap-two-col .hesap-section{flex:1;}
.hesap-fatura-box{background:#003a70;color:#fff;border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.hesap-fatura-box .lbl{font-size:11px;color:#a8c0e8;}
.hesap-fatura-box .val{font-size:20px;font-weight:bold;}
.btn-hesapla{width:100%;background:#28a745;color:#fff;border:none;padding:12px;font-size:14px;font-weight:bold;border-radius:4px;cursor:pointer;text-transform:uppercase;margin-bottom:8px;}
.tcmb-row{display:flex;align-items:center;justify-content:space-between;background:#eef2f7;padding:8px 10px;border-radius:6px;margin-bottom:10px;border:1px dashed #003a70;}
.tcmb-row span{font-size:11px;font-weight:bold;color:#003a70;}
.btn-tcmb{background:#6c757d;color:#fff;border:none;padding:5px 10px;font-size:11px;border-radius:4px;cursor:pointer;font-weight:bold;}
.aktarilan-kart{background:#fff3cd;border:1px solid #ff9900;border-radius:8px;padding:10px 12px;margin-bottom:10px;position:relative;}
.aktarilan-kart-baslik{font-size:10px;font-weight:bold;color:#ff9900;text-transform:uppercase;margin-bottom:4px;}
.aktarilan-kart-ad{font-size:12px;font-weight:bold;color:#222;padding-right:50px;line-height:1.3;}
.aktarilan-kart-kod{font-size:10px;color:#555;margin-top:3px;}
.btn-kart-sil{position:absolute;top:8px;right:8px;background:#d9534f;color:#fff;border:none;padding:3px 8px;font-size:10px;font-weight:bold;border-radius:4px;cursor:pointer;}
.btn-hareket-aktar{width:100%;background:#ff9900;color:#fff;border:none;padding:12px;font-size:14px;font-weight:bold;border-radius:4px;cursor:pointer;text-transform:uppercase;}
.hareket-urun-kart{background:#f8f9fa;border:1px solid #ddd;border-left:4px solid #ff9900;border-radius:6px;padding:10px;margin-bottom:8px;position:relative;}
.hareket-urun-ad{font-size:12px;font-weight:bold;color:#222;padding-right:50px;margin-bottom:3px;}
.hareket-urun-detay{font-size:11px;color:#555;margin-bottom:2px;}
.hareket-urun-fiyat{font-size:15px;font-weight:900;color:#ff9900;margin-top:6px;background:#fff8ee;padding:5px 8px;border-radius:5px;border-left:3px solid #ff9900;}
.hareket-liste-fiyat{font-size:12px;color:#555;margin-bottom:1px;}
.hareket-iskonto-satir{font-size:13px;font-weight:bold;color:#ff9900;}
.mod-group{display:flex;gap:6px;margin-bottom:14px;}
.btn-mod{flex:1;padding:10px 4px;font-size:11px;font-weight:bold;border:2px solid #003a70;background:#fff;color:#003a70;border-radius:6px;cursor:pointer;text-align:center;line-height:1.4;}
.btn-mod.secili{background:#003a70;color:#fff;}
.hareket-toplam-box{background:#003a70;color:#fff;border-radius:8px;padding:12px;text-align:right;margin-bottom:10px;}
.hareket-toplam-box .ht-label{font-size:11px;color:#a8c0e8;}
.hareket-toplam-box .ht-euro{font-size:20px;font-weight:bold;}
.hareket-toplam-box .ht-tl{font-size:14px;color:#ffcc00;font-weight:bold;}
.btn-iletisim-aktar{width:100%;background:#e67e22;color:#fff;border:none;padding:13px;font-size:14px;font-weight:bold;border-radius:4px;cursor:pointer;text-transform:uppercase;}
.communication-box{display:flex;flex-direction:column;gap:12px;padding:5px;}
.customer-input-panel{background:#f8fafc;border:1px dashed #003a70;border-radius:8px;padding:10px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;}
.customer-row-fields{display:flex;gap:8px;}
.customer-field-group{flex:1;display:flex;flex-direction:column;gap:4px;}
.customer-field-group label{font-size:11px;font-weight:bold;color:#003a70;}
.customer-input{width:100%;padding:6px 8px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px;outline:none;}
.comm-header{font-size:13px;font-weight:bold;color:#003a70;text-align:center;margin-bottom:2px;text-transform:uppercase;}
.text-preview-area{width:100%;height:290px;padding:12px;font-size:11px;border:1px solid #003a70;border-radius:6px;background:#fafafa;resize:none;font-family:'Courier New',monospace;color:#222;line-height:1.4;outline:none;}
.btn-copy-action{width:100%;background:#003a70;color:#fff;border:none;padding:12px;font-size:14px;font-weight:bold;border-radius:6px;cursor:pointer;text-transform:uppercase;}
.btn-email-action{width:100%;background:#e67e22;color:#fff;border:none;padding:12px;font-size:14px;font-weight:bold;border-radius:6px;cursor:pointer;text-transform:uppercase;}
.btn-whatsapp{width:100%;background:#25D366;color:#fff;border:none;padding:12px;font-size:14px;font-weight:bold;border-radius:6px;cursor:pointer;text-transform:uppercase;}
.bottom-nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-top:1px solid #e2e8f0;display:flex;padding:10px;gap:10px;z-index:999;}
.nav-arrow-btn{flex:1;padding:12px;font-size:13px;font-weight:bold;border:none;border-radius:6px;cursor:pointer;background:#4a5568;color:#fff;}
.nav-arrow-btn:disabled{background:#cbd5e1;color:#94a3b8;cursor:not-allowed;}
.toast-notification{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-20px);background:rgba(0,58,112,0.95);color:#fff;padding:12px 24px;border-radius:30px;font-size:13px;font-weight:bold;box-shadow:0 4px 15px rgba(0,0,0,0.2);z-index:9999;opacity:0;transition:all 0.3s ease;pointer-events:none;text-align:center;white-space:nowrap;}
.toast-notification.show{opacity:1;transform:translateX(-50%) translateY(0);}
#page1{background:#eef7ff;}#page2{background:#fff8ef;}#page3{background:#f3fff1;}#page4{background:#fdf3ff;}#page5{background:#f7f7f7;}
#tabBtn1{background:#003a70;color:#fff;}
#tabBtn2{background:#ff9900;color:#fff;}
#tabBtn3{background:#28a745;color:#fff;}
#tabBtn4{background:#8e44ad;color:#fff;}
#tabBtn5{background:#6c757d;color:#fff;}
</style>
</head>
<body>
<div id="toast" class="toast-notification">Basarili</div>
<div class="phone-container">
<div class="app-header">WEICON ASIST</div>
<div class="nav-tabs">
  <button class="tab-btn active" id="tabBtn1" onclick="switchTab(1)">Urun Bul</button>
  <button class="tab-btn" id="tabBtn2" onclick="switchTab(2)">Sepet <span id="sepetSayac">(0)</span></button>
  <button class="tab-btn" id="tabBtn3" onclick="switchTab(3)">Hesapla</button>
  <button class="tab-btn" id="tabBtn4" onclick="switchTab(4)">Hareket</button>
  <button class="tab-btn" id="tabBtn5" onclick="switchTab(5)">Iletisim</button>
</div>

<!-- SAYFA 1 -->
<div id="page1" class="content-page active">
<div class="page-info">Sayfa 1: Urun Bul</div>
<div class="step-label">[Islem 1.1] Urun Arama</div>
<div class="search-box-container"><input type="text" id="searchInput" class="search-input" placeholder="Arama yapin..."></div>
<button class="btn-primary" id="searchBtn">URUNU BUL</button>
<div class="step-label">[Islem 1.2] JSON Yukleme</div>
<div class="btn-update-container">
  <button onclick="document.getElementById('jsonFileInput').click()" style="background:#6c757d;color:#fff;padding:6px 12px;font-size:11px;border-radius:4px;cursor:pointer;font-weight:bold;border:none;">
    Listeyi Guncelle (.json)
  </button>
  <input type="file" id="jsonFileInput" accept=".json" style="display:none;">
</div>
<div class="data-table-container">
  <table class="data-table">
    <thead><tr>
      <th class="col-kodlar">KODLAR</th>
      <th class="col-urun">URUN</th>
      <th class="col-euro">EURO</th>
      <th class="col-islem">ISLEM</th>
    </tr></thead>
    <tbody id="productTableBody"></tbody>
  </table>
  <div id="noDataPlaceholder" class="no-data-msg" style="display:none;">Urun bulunamadi.</div>
</div>
</div>

<!-- SAYFA 2 -->
<div id="page2" class="content-page">
<div class="page-info">Sayfa 2: Sepetiniz</div>
<div class="step-label">[Islem 2.1] Sepet</div>
<div id="basketItemsContainer" style="padding:5px;"></div>
<div id="emptyBasketMsg" class="placeholder-page">Sepetiniz bos.</div>
</div>

<!-- SAYFA 3 -->
<div id="page3" class="content-page">
<div class="page-info">Sayfa 3: Hesaplama</div>
<div id="aktarilanKart" class="aktarilan-kart" style="display:none;">
  <div class="aktarilan-kart-baslik">Sepetten Aktarilan Urun</div>
  <div class="aktarilan-kart-ad" id="kart-urunAd">-</div>
  <div class="aktarilan-kart-kod" id="kart-urunKod">-</div>
  <button class="btn-kart-sil" onclick="aktarilanUrununSil()">Sil</button>
</div>
<div class="tcmb-row">
  <div>
    <span>TCMB Euro Kuru (TL):</span><br>
    <input type="number" id="kur" class="hesap-input" value="53.2919" step="0.0001" oninput="hesapla()" style="margin-top:4px;">
  </div>
  <button class="btn-tcmb" onclick="window.open('https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+page+site+area/bugun','_blank')">TCMB Kontrol</button>
</div>
<div class="hesap-two-col">
  <div class="hesap-section">
    <div class="hesap-section-title">Liste Fiyati (EUR)</div>
    <input type="number" id="listeFiyat" class="hesap-input" value="0" step="0.01" oninput="hesapla()" style="width:100%;">
  </div>
  <div class="hesap-section">
    <div class="hesap-section-title">Dip Fiyat (EUR)</div>
    <input type="number" id="dipFiyat" class="hesap-input" value="0" step="0.01" oninput="hesapla()" style="width:100%;">
  </div>
</div>
<div class="hesap-two-col">
  <div class="hesap-section">
    <div class="hesap-section-title">Iskonto (%)</div>
    <input type="number" id="iskonto" class="hesap-input" value="0" step="0.1" oninput="hesapla()" style="width:100%;">
  </div>
  <div class="hesap-section">
    <div class="hesap-section-title">Adet</div>
    <input type="number" id="adet" class="hesap-input" value="1" step="1" min="1" oninput="hesapla()" style="width:100%;">
  </div>
</div>
<div class="hesap-section">
  <div class="hesap-section-title">Hesaplanan Degerler</div>
  <div class="hesap-field"><label>Iskontolu Birim Fiyat (EUR)</label><div class="hesap-result-vurgulu" id="iskontoluFiyat">-</div></div>
  <div class="hesap-field"><label>TL Birim Fiyat (KDVsiz)</label><div class="hesap-result-vurgulu" id="tlBirimFiyat">-</div></div>
  <div class="hesap-field"><label>Urun Maliyet Kar (EUR)</label><div class="hesap-result" id="maliyetKar">-</div></div>
  <div class="hesap-field"><label>Mudur Prim (EUR)</label><div class="hesap-result" id="mudurPrim">-</div></div>
  <div class="hesap-field"><label>Toplam Mudur Prim (TL)</label><div class="hesap-result" id="mudurPrimTL">-</div></div>
  <div class="hesap-field"><label>Toplam Euro</label><div class="hesap-result" id="toplamEuro">-</div></div>
  <div class="hesap-field"><label>TL KDVsiz Toplam</label><div class="hesap-result" id="tlKdvsizToplam">-</div></div>
</div>
<div class="hesap-fatura-box">
  <div>
    <div class="lbl">FATURA TOPLAM (KDV DAHIL %20)</div>
    <div class="val" id="faturaToplam">-</div>
  </div>
  <div style="font-size:24px;"> KDV</div>
</div>
<button class="btn-hareket-aktar" onclick="hareketeSaklar()">HAREKET LISTESINE EKLE</button>
</div>

<!-- SAYFA 4 -->
<div id="page4" class="content-page">
<div class="page-info">Sayfa 4: Hareket</div>
<div class="step-label">[Islem 4.1] Islem Turu</div>
<div class="mod-group">
  <button class="btn-mod secili" id="mod-siparis" onclick="modSec('siparis')">SIPARIS</button>
  <button class="btn-mod" id="mod-proforma" onclick="modSec('proforma')">PROFORMA<br>FATURA</button>
  <button class="btn-mod" id="mod-teklif" onclick="modSec('teklif')">FIYAT<br>TEKLIFI</button>
</div>
<div class="step-label">[Islem 4.2] Hareket Listesi</div>
<div id="hareketListesiDiv" style="padding:0;"></div>
<div id="emptyHareketMsg" class="placeholder-page">Henuz urun eklenmedi.<br><small>3. sayfada hesaplayip ekleyin.</small></div>
<div id="hareketToplamBox" class="hareket-toplam-box" style="display:none;">
  <div class="ht-label">GENEL TOPLAM</div>
  <div class="ht-euro" id="hareketToplamEuro">0.00 EUR</div>
  <div class="ht-tl" id="hareketToplamTL">0.00 TL</div>
</div>
<button class="btn-iletisim-aktar" id="btnIletisimAktar" onclick="iletisimeAktar()" style="display:none;">ILETISIM SAYFASINA AKTAR</button>
</div>

<!-- SAYFA 5 -->
<div id="page5" class="content-page">
<div class="step-label">[Islem 5.1] Paylasim</div>
<div class="customer-input-panel">
  <div class="customer-field-group">
    <label>Musteri Adi:</label>
    <input type="text" id="custNameInput" class="customer-input" value="HiTiT MAKiNA - CORUM" oninput="generateCommunicationData()">
  </div>
  <div class="customer-row-fields">
    <div class="customer-field-group">
      <label>Vade:</label>
      <input type="text" id="custVadeInput" class="customer-input" value="45 gun" oninput="generateCommunicationData()">
    </div>
    <div class="customer-field-group">
      <label>Fatura:</label>
      <input type="text" id="custFaturaInput" class="customer-input" value="EURO fatura" oninput="generateCommunicationData()">
    </div>
  </div>
</div>
<div id="emptyCommMsg" class="placeholder-page" style="display:block;">Once 4. sayfada urun ekleyin ve islem turu secin.</div>
<div id="communicationBlock" class="communication-box" style="display:none;">
  <div class="comm-header" id="commHeader">Musteri Paylasim Paneli</div>
  <textarea id="emailTemplateTextarea" class="text-preview-area" readonly></textarea>
  <button class="btn-copy-action" onclick="copyEmailText()">Metni Kopyala</button>
  <button class="btn-email-action" onclick="sendDirectEmail()">E-Posta Gonder</button>
  <button class="btn-whatsapp" onclick="sendWhatsAppMessage()">WhatsApp Ile Gonder</button>
</div>
</div>

<div class="bottom-nav-bar">
  <button id="prevBarBtn" class="nav-arrow-btn" onclick="navigatePage(-1)">&lt; GERi</button>
  <button id="nextBarBtn" class="nav-arrow-btn" onclick="navigatePage(1)">iLERi &gt;</button>
</div>
</div>

<script>
var globalProductCatalog = [];
var basket = [];
var aktarilanUrun = null;
var hareketListesi = [];
var secilenMod = "siparis";
var activeCurrentPage = 1;
var STORAGE_KEY = "wemosa_v8_catalog";
var demoCatalog = [
  {"berta":"11002400","abas":"10000047","name":"Cinko Sprey 400ml","price":"12.26"},
  {"berta":"10050005","abas":"10000020","name":"Plastik-Metal B Recine 0.5kg","price":"36.28"}
];

window.onload = function(){
  loadCatalogFromMemory();
  document.getElementById("searchBtn").addEventListener("click", performFilter);
  document.getElementById("searchInput").addEventListener("input", performFilter);
  document.getElementById("jsonFileInput").addEventListener("change", processJsonUpload);
  updateBottomNavButtons();
  hesapla();
};

function showToast(m){
  var t=document.getElementById("toast");
  t.innerText=m; t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); }, 2200);
}

function navigatePage(d){
  var t=activeCurrentPage+d;
  if(t>=1 && t<=5) switchTab(t);
}

function updateBottomNavButtons(){
  document.getElementById("prevBarBtn").disabled=(activeCurrentPage===1);
  document.getElementById("nextBarBtn").disabled=(activeCurrentPage===5);
}

function switchTab(n){
  activeCurrentPage=n;
  updateBottomNavButtons();
  var pages=document.querySelectorAll(".content-page");
  for(var i=0;i<pages.length;i++) pages[i].classList.remove("active");
  var tabs=document.querySelectorAll(".nav-tabs .tab-btn");
  for(var i=0;i<tabs.length;i++) tabs[i].classList.remove("active");
  document.getElementById("page"+n).classList.add("active");
  document.getElementById("tabBtn"+n).classList.add("active");
  if(n===1) performFilter();
  if(n===2) renderBasket();
  if(n===3) hesapla();
  if(n===4) renderHareket();
  if(n===5) generateCommunicationData();
}

function loadCatalogFromMemory(){
  var s=localStorage.getItem(STORAGE_KEY);
