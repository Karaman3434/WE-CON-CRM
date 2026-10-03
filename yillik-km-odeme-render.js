/*
  yillik-km-odeme-render.js
  ==========================
  Araç KM alt menüsündeki "Yıllık KM Ödeme" (03.10.2026, Abdullah'ın
  isteğiyle; 03.10.2026 içinde birkaç kez güncellendi):
    - Toplam Özel KM: km-data.js'teki kmTakip kayıtlarından CANLI
      hesaplanır (salt okunur).
    - KM Çarpanı: elle girilen TL/km değeri, yıl bazlı ("kmCarpanlari/{YIL}").
      03.10.2026 güncellemesi: blur'da DEĞİL, SADECE "✓ Kaydet" tuşuna
      basınca kaydedilir (bkz. btnKoCarpanKaydet click dinleyicisi).
    - Tutar: Toplam Özel KM × KM Çarpanı — OTOMATİK hesaplanır (salt okunur).
    - Ödeme Tarihi / Platform / Ödeme / Durum: serbest metin, elle girilir
      ve blur'da otomatik kaydedilir ("kmOdemeleri/{YYYY-MM}"). Durum
      BAŞTA otomatik Ödendi/Bekliyor rozetiydi, Abdullah'ın isteğiyle
      serbest metin hücresine çevrildi — artık hiçbir otomatik mantık yok.
  Üst pano (03.10.2026): Toplam Özel KM / Toplam Tutar / Toplam Ödenen /
  Kalan Ödeme — 4 panel yan yana.
  Yıl seçici YOK (bilerek) — sayfa her zaman BU YILI gösterir.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

var GUNLER_KO = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var AYLAR_KO = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function tarihiGuncelle(){
  var el = document.getElementById("gunTarihi");
  var d = new Date();
  if(el) el.textContent = GUNLER_KO[d.getDay()] + ", " + d.getDate() + " " + AYLAR_KO[d.getMonth()] + " " + d.getFullYear();
}

function koPad2(n){ return ("0"+n).slice(-2); }
function koBuYil(){ return String(new Date().getFullYear()); }

// Sayı ₺ gösterimi — tam sayıysa ondalıksız, küsuratlıysa virgülle 1 hane.
function koSayiGoster(n){
  if(!n) return "0";
  var yuvarlak = Math.round(n*10)/10;
  return (yuvarlak % 1 === 0) ? String(yuvarlak) : String(yuvarlak).replace(".", ",");
}

function koCarpaniGuncelle(){
  var yil = koBuYil();
  document.getElementById("koCarpanEtiket").textContent = "📐 " + yil + " KM Çarpanı";
  var input = document.getElementById("koCarpanInput");
  // Kullanıcı o an yazıyorsa (odakta) üzerine yazıp imleci sıçratma.
  if(document.activeElement !== input){
    var mevcut = KmData.carpanOku(yil);
    input.value = (mevcut !== "") ? mevcut : "";
  }
}

function tabloyuCiz(){
  try{
    var yil = koBuYil();
    document.getElementById("koTabloBaslik").textContent = yil + " — Aylık Ödeme Tablosu";
    var carpan = parseFloat(KmData.carpanOku(yil)) || 0;

    var govde = document.getElementById("koTabloGovde");
    var toplamOzelYil = 0, toplamOdemeYil = 0, toplamTutarYil = 0;

    govde.innerHTML = AYLAR_KO.map(function(ayAdi, i){
      var yilAy = yil + "-" + koPad2(i+1);
      var toplamOzel = KmData.ayinOzelKmToplami(yilAy);
      var tutar = toplamOzel * carpan;
      var odemeKaydi = KmData.odemeOku(yilAy);
      var odemeTutari = (odemeKaydi.odeme!=null && odemeKaydi.odeme!=="") ? odemeKaydi.odeme : "";

      toplamOzelYil += toplamOzel;
      toplamTutarYil += tutar;
      if(typeof odemeTutari === "number") toplamOdemeYil += odemeTutari;

      return "<tr data-yilay='" + yilAy + "'>"
        + "<td>" + ayAdi + "</td>"
        + "<td class='km-td-ozel'>" + toplamOzel + "</td>"
        + "<td class='km-td-tutar'>" + koSayiGoster(tutar) + "</td>"
        + "<td contenteditable='true' data-alan='odemeTarihi'>" + (odemeKaydi.odemeTarihi || "-") + "</td>"
        + "<td class='km-td-metin' contenteditable='true' data-alan='odemePlatformu'>" + (odemeKaydi.odemePlatformu || "-") + "</td>"
        + "<td contenteditable='true' data-alan='odeme'>" + (odemeTutari!==""?odemeTutari:"-") + "</td>"
        + "<td class='km-td-metin' contenteditable='true' data-alan='durum'>" + (odemeKaydi.durum || "-") + "</td>"
        + "</tr>";
    }).join("");

    document.getElementById("koYilToplamOzelKm").textContent = toplamOzelYil + " km";
    document.getElementById("koYilToplamTutar").textContent = koSayiGoster(toplamTutarYil) + " ₺";
    document.getElementById("koYilToplamOdeme").textContent = koSayiGoster(toplamOdemeYil) + " ₺";
    document.getElementById("koYilKalanOdeme").textContent = koSayiGoster(toplamTutarYil - toplamOdemeYil) + " ₺";

    govde.querySelectorAll("[contenteditable]").forEach(function(td){
      td.addEventListener("blur", function(){
        var tr = this.closest("tr");
        var yilAy = tr.getAttribute("data-yilay");
        var alan = this.getAttribute("data-alan");
        var deger = this.textContent.trim();
        if(deger === "-") deger = "";
        // km-kayitlar-render.js'teki hucreGuncelle kullanımıyla AYNI desen:
        // ekranı burada elle güncellemiyoruz — "kmOdemeleri" üzerindeki
        // canlı dinleyici (KmData.odemeDegistiginde, aşağıda bağlı) zaten
        // her değişiklikte tabloyuCiz()'i tetikleyip toplamları tazeliyor.
        // Firebase JS SDK kendi yazdığımız değeri sunucu onayı beklemeden
        // hemen yerel olarak yansıttığı için bu gecikmesiz olur.
        KmData.odemeGuncelle(yilAy, alan, deger, function(basarili, err){
          if(!basarili) hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      });
    });
  }catch(e){ hataGoster("Tablo çizilemedi: " + e.message); }
}

function excelAktar(){
  try{
    if(typeof XLSX === "undefined"){
      hataGoster("Excel kütüphanesi yüklenemedi, internet bağlantınızı kontrol edin.");
      return;
    }
    var yil = koBuYil();
    var carpan = parseFloat(KmData.carpanOku(yil)) || 0;
    var basliklar = ["Ay","Toplam Özel KM","Tutar","Ödeme Tarihi","Platform","Ödeme","Durum"];
    var toplamOzelXl = 0, toplamOdemeXl = 0, toplamTutarXl = 0;
    var veriSatirlari = AYLAR_KO.map(function(ayAdi, i){
      var yilAy = yil + "-" + koPad2(i+1);
      var toplamOzel = KmData.ayinOzelKmToplami(yilAy);
      var tutar = toplamOzel * carpan;
      var odemeKaydi = KmData.odemeOku(yilAy);
      var odemeTutari = (odemeKaydi.odeme!=null && odemeKaydi.odeme!=="") ? odemeKaydi.odeme : 0;
      toplamOzelXl += toplamOzel;
      toplamTutarXl += tutar;
      toplamOdemeXl += odemeTutari;
      return [ayAdi, toplamOzel, tutar, odemeKaydi.odemeTarihi||"", odemeKaydi.odemePlatformu||"", odemeTutari||"", odemeKaydi.durum||""];
    });

    var aoa = [basliklar].concat(veriSatirlari);
    aoa.push(["TOPLAM", toplamOzelXl, toplamTutarXl, "", "", toplamOdemeXl, ""]);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:12},{wch:14},{wch:12},{wch:14},{wch:18},{wch:12},{wch:14}];

    var KENAR_INCE = { style:"thin", color:{rgb:"333333"} };
    var KENAR_ORTA = { style:"medium", color:{rgb:"505050"} };
    function hucreAyarla(r, c, style){
      var adr = XLSX.utils.encode_cell({r:r, c:c});
      if(!ws[adr]) ws[adr] = {t:"s", v:""};
      ws[adr].s = style;
    }
    for(var hc=0; hc<basliklar.length; hc++){
      hucreAyarla(0, hc, {
        fill: {patternType:"solid", fgColor:{rgb:"FAEEDA"}, bgColor:{rgb:"FAEEDA"}},
        font: {bold:true, color:{rgb:"003A70"}},
        alignment: {horizontal:"center", vertical:"center"},
        border: {top:KENAR_ORTA, bottom:KENAR_ORTA, left:KENAR_INCE, right:KENAR_INCE}
      });
    }
    var toplamSatir = aoa.length - 1;
    for(var tc=0; tc<basliklar.length; tc++){
      hucreAyarla(toplamSatir, tc, {
        font: {bold:true, sz:12, color:{rgb:"FF0000"}},
        alignment: {horizontal:"center"},
        border: {top:KENAR_ORTA, bottom:KENAR_ORTA}
      });
    }

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KM Ödeme " + yil);
    XLSX.writeFile(wb, "Yillik_KM_Odeme_" + yil + ".xlsx");
  }catch(e){ hataGoster("Excel oluşturulamadı: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnKoExcel").onclick = excelAktar;
  document.getElementById("btnKoKaydet").onclick = function(){
    var btn = this;
    if(document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute("contenteditable")){
      document.activeElement.blur();
    }
    setTimeout(function(){
      var eskiMetin = btn.textContent;
      btn.textContent = "✓ Kaydedildi";
      btn.disabled = true;
      setTimeout(function(){ btn.textContent = eskiMetin; btn.disabled = false; }, 1500);
    }, 150);
  };

  // 03.10.2026 güncellemesi: çarpan artık blur'da DEĞİL, SADECE "✓ Kaydet"
  // tuşuna basınca kaydediliyor — Abdullah değiştirip tuşa basmadıkça
  // yazılı/kayıtlı değer olduğu gibi kalır.
  document.getElementById("btnKoCarpanKaydet").addEventListener("click", function(){
    var btn = this;
    var yil = koBuYil();
    var input = document.getElementById("koCarpanInput");
    var deger = input.value.trim();
    if(deger === ""){ koCarpaniGuncelle(); return; } // boş bırakılırsa dokunma
    KmData.carpanKaydet(yil, deger, function(basarili, err){
      if(!basarili){
        hataGoster("KM çarpanı kaydedilemedi: " + (err && err.message ? err.message : "geçersiz değer"));
        return;
      }
      var eskiMetin = btn.textContent;
      btn.textContent = "✓ Kaydedildi";
      btn.disabled = true;
      setTimeout(function(){ btn.textContent = eskiMetin; btn.disabled = false; }, 1500);
    });
  });

  koCarpaniGuncelle();
  tabloyuCiz();
  KmData.degistiginde(tabloyuCiz);
  KmData.odemeDegistiginde(tabloyuCiz);
  KmData.carpanDegistiginde(function(){
    koCarpaniGuncelle();
    tabloyuCiz();
  });
});
