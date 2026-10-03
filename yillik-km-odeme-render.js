/*
  yillik-km-odeme-render.js
  ==========================
  Araç KM alt menüsündeki "Yıllık KM Ödeme" (03.10.2026, Abdullah'ın
  isteğiyle). "Toplam Özel KM" sütunu km-data.js'teki kmTakip kayıtlarından
  CANLI hesaplanır (salt okunur); Ödeme Tarihi/Platformu/Ödeme hücreleri
  elle girilir ve km-data.js'in odemeGuncelle()'i ile "kmOdemeleri/{YYYY-MM}"
  altına kaydedilir. Tablo/Excel düzeni km-kayitlar-render.js ile aynı
  desenleri (contenteditable + blur'da otomatik kayıt) kullanır.
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

var koSeciliYil = null; // null = bu yıl (varsayılan)

// Yıl seçiciyi, kayıtlı km ayları + ödeme kayıtlarındaki yıllar + bu yıl
// birleşiminden doldurur — ileride yıl değişince seçenek olarak çıksın diye.
function koYilSeciciyiDoldur(){
  var yilSeti = {};
  KmData.kayitliAylar().forEach(function(ya){ yilSeti[ya.slice(0,4)] = true; });
  var simdi = new Date();
  var buYil = String(simdi.getFullYear());
  yilSeti[buYil] = true;
  var yillar = Object.keys(yilSeti).sort().reverse();
  var secici = document.getElementById("koYilSecici");
  secici.innerHTML = yillar.map(function(y){
    return "<option value='" + y + "'>" + y + (y===buYil ? " (bu yıl)" : "") + "</option>";
  }).join("");
  secici.value = koSeciliYil || buYil;
}

function koPad2(n){ return ("0"+n).slice(-2); }

function tabloyuCiz(){
  try{
    var simdi = new Date();
    var yil = koSeciliYil || String(simdi.getFullYear());
    document.getElementById("koYilEtiket").textContent = yil;
    document.getElementById("koTabloBaslik").textContent = yil + " — Aylık Ödeme Tablosu";

    var govde = document.getElementById("koTabloGovde");
    var toplamOzelYil = 0, toplamOdemeYil = 0;

    govde.innerHTML = AYLAR_KO.map(function(ayAdi, i){
      var yilAy = yil + "-" + koPad2(i+1);
      var toplamOzel = KmData.ayinOzelKmToplami(yilAy);
      var odemeKaydi = KmData.odemeOku(yilAy);
      var odemeTutari = (odemeKaydi.odeme!=null && odemeKaydi.odeme!=="") ? odemeKaydi.odeme : "";
      toplamOzelYil += toplamOzel;
      if(typeof odemeTutari === "number") toplamOdemeYil += odemeTutari;

      var odendiMi = odemeTutari !== "" && odemeTutari > 0;
      var durumHtml = odendiMi
        ? "<span class='ko-durum ko-durum--odendi'>✓ Ödendi</span>"
        : "<span class='ko-durum ko-durum--bekliyor'>Bekliyor</span>";

      return "<tr data-yilay='" + yilAy + "'>"
        + "<td>" + ayAdi + "</td>"
        + "<td class='km-td-ozel'>" + toplamOzel + "</td>"
        + "<td contenteditable='true' data-alan='odemeTarihi'>" + (odemeKaydi.odemeTarihi || "-") + "</td>"
        + "<td class='km-td-metin' contenteditable='true' data-alan='odemePlatformu'>" + (odemeKaydi.odemePlatformu || "-") + "</td>"
        + "<td contenteditable='true' data-alan='odeme'>" + (odemeTutari!==""?odemeTutari:"-") + "</td>"
        + "<td data-durum-hucresi='1'>" + durumHtml + "</td>"
        + "</tr>";
    }).join("");

    document.getElementById("koYilToplamOzelKm").textContent = toplamOzelYil + " km";
    document.getElementById("koYilToplamOdeme").textContent = toplamOdemeYil + " ₺";

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
        // her değişiklikte tabloyuCiz()'i tetikleyip rozet/toplamları
        // tazeliyor. Firebase JS SDK kendi yazdığımız değeri sunucu onayı
        // beklemeden hemen yerel olarak yansıttığı için bu gecikmesiz olur.
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
    var yil = koSeciliYil || String(new Date().getFullYear());
    var basliklar = ["Ay","Toplam Özel KM","Ödeme Tarihi","Platform","Ödeme"];
    var toplamOzelXl = 0, toplamOdemeXl = 0;
    var veriSatirlari = AYLAR_KO.map(function(ayAdi, i){
      var yilAy = yil + "-" + koPad2(i+1);
      var toplamOzel = KmData.ayinOzelKmToplami(yilAy);
      var odemeKaydi = KmData.odemeOku(yilAy);
      var odemeTutari = (odemeKaydi.odeme!=null && odemeKaydi.odeme!=="") ? odemeKaydi.odeme : 0;
      toplamOzelXl += toplamOzel;
      toplamOdemeXl += odemeTutari;
      return [ayAdi, toplamOzel, odemeKaydi.odemeTarihi||"", odemeKaydi.odemePlatformu||"", odemeTutari||""];
    });

    var aoa = [basliklar].concat(veriSatirlari);
    aoa.push(["TOPLAM", toplamOzelXl, "", "", toplamOdemeXl]);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:12},{wch:14},{wch:14},{wch:18},{wch:12}];

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
  document.getElementById("koYilSecici").onchange = function(){
    koSeciliYil = this.value;
    tabloyuCiz();
  };

  koYilSeciciyiDoldur();
  tabloyuCiz();
  KmData.degistiginde(function(){
    koYilSeciciyiDoldur();
    tabloyuCiz();
  });
  KmData.odemeDegistiginde(function(){
    tabloyuCiz();
  });
});
