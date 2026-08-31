// Tek merkezi sürüm bilgisi — ui-render-fix.js içindeki yorum satırıyla
// senkron tutulmalıdır. Format: W(YYMMDD).(HHMM).(sıra no)
var APP_VERSION = "WG.260831.2109.56";

function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function ayarlariDoldur(){
  try{
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    var kdv = parseFloat(localStorage.getItem("weicon_kdv_orani"));
    document.getElementById("kurInput").value = isNaN(kur) ? "" : kur;
    document.getElementById("kdvInput").value = isNaN(kdv) ? 20 : kdv;
    sonGuncellemeYazisiniGoster();
  }catch(e){ hataGoster("Ayarlar okunamadı: " + e.message); }
}

function sonGuncellemeYazisiniGoster(){
  var el = document.getElementById("kurSonGuncelleme");
  if(!el) return;
  var zaman = parseFloat(localStorage.getItem("weicon_kur_zaman"));
  if(isNaN(zaman) || zaman<=0){
    el.textContent = "Son otomatik güncelleme: hiç yapılmadı";
    return;
  }
  var farkDk = Math.round((Date.now() - zaman) / 60000);
  var metin;
  if(farkDk < 1) metin = "az önce";
  else if(farkDk < 60) metin = farkDk + " dakika önce";
  else metin = Math.floor(farkDk/60) + " saat " + (farkDk%60) + " dakika önce";
  el.textContent = "Son güncelleme: " + metin;
}

function ayarlariKaydet(){
  try{
    var kur = parseFloat(document.getElementById("kurInput").value) || 0;
    var kdv = parseFloat(document.getElementById("kdvInput").value) || 20;
    if(typeof AyarlarSync !== "undefined"){
      AyarlarSync.kurKaydet(kur);
      AyarlarSync.kdvKaydet(kdv);
    } else {
      localStorage.setItem("weicon_kur", kur);
      localStorage.setItem("weicon_kur_zaman", Date.now());
      localStorage.setItem("weicon_kdv_orani", kdv);
    }
    alert("✓ Ayarlar kaydedildi.");
  }catch(e){ hataGoster("Ayarlar kaydedilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  ayarlariDoldur();
  document.getElementById("btnAyarKaydet").onclick = ayarlariKaydet;
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnKurSimdiDene").onclick = function(){
    var btn = this;
    btn.disabled = true;
    btn.textContent = "⏳ Deneniyor...";
    if(typeof AyarlarSync === "undefined"){
      btn.disabled = false; btn.textContent = "🔄 Şimdi Dene (Otomatik Çek)";
      hataGoster("Kur senkron modülü yüklenemedi.");
      return;
    }
    AyarlarSync.otomatikKurGetir(true, function(basarili, kur, kaynak){
      btn.disabled = false;
      if(basarili){
        var kaynakAdi = kaynak==="tcmb" ? "TCMB" : (kaynak==="yedek" ? "yedek kaynak" : "Frankfurter");
        btn.textContent = "✓ Başarılı — " + kur.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:4}) + " (" + kaynakAdi + ")";
        ayarlariDoldur();
      } else {
        btn.textContent = "✕ Başarısız — internet bağlantısını kontrol et";
      }
      setTimeout(function(){ btn.textContent = "🔄 Şimdi Dene (Otomatik Çek)"; }, 3000);
    });
  };
  if(typeof AyarlarSync !== "undefined") AyarlarSync.degistiginde(ayarlariDoldur);
  var surumEl = document.getElementById("surumBilgisi");
  if(surumEl) surumEl.textContent = "Sürüm " + APP_VERSION;
});
