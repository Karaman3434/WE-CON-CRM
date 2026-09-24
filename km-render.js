/*
  km-render.js
  ============
  Tek form: bugünün KM'sini + saat/güzergah/ziyaret/kategori girip
  "Günü Kaydet" ile kaydeder. Üstte dünün özet satırı, altta "Bu Ayın
  Kayıtları" gerçek tablo olarak açılıp kapanabilir + Excel'e aktarılabilir.
*/

// "YYYY-MM-DD" anahtarını "GG.AA.YYYY" gösterim metnine çevirir — Tarih
// hücresi elle düzenlenince, kullanıcının yazdığı yeni metin gerçekten
// değişmiş mi diye karşılaştırmak için kullanılıyor.
function tarihMetniAyikla(anahtar){
  var p = (anahtar||"").split("-");
  if(p.length !== 3) return "";
  return p[2] + "." + p[1] + "." + p[0];
}

function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

var GUNLER = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var AYLAR_KISA = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    var d = new Date();
    if(el) el.textContent = GUNLER[d.getDay()] + ", " + d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear();
    var el2 = document.getElementById("kmBugunTarih");
    if(el2) el2.textContent = d.getDate() + " " + AYLAR[d.getMonth()];
    var el3 = document.getElementById("kmTarihGoster");
    if(el3) el3.value = ("0"+d.getDate()).slice(-2) + "." + ("0"+(d.getMonth()+1)).slice(-2) + "." + d.getFullYear();
    var saatEl = document.getElementById("kmSaat");
    if(saatEl && !saatEl.value){
      saatEl.value = ("0"+d.getHours()).slice(-2) + ":" + ("0"+d.getMinutes()).slice(-2);
    }
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

var secilenKategori = "is";

function kategoriSecimBagla(){
  document.querySelectorAll(".kategori-btn").forEach(function(btn){
    btn.onclick = function(){
      document.querySelectorAll(".kategori-btn").forEach(function(b){ b.classList.remove("kategori-btn--secili"); });
      this.classList.add("kategori-btn--secili");
      secilenKategori = this.getAttribute("data-kategori");
    };
  });
}

function dunOzetiniCiz(){
  try{
    var el = document.getElementById("kmDunOzet");
    var girilenDeger = parseFloat(document.getElementById("kmBugun").value);

    if(isNaN(girilenDeger)){
      el.innerHTML = "Bugünün kilometresini girdiğinde, bir önceki tarihte yapılan mesafe burada hesaplanacak.";
      return;
    }

    var ozet = KmData.oncekiTarihinMesafesi(girilenDeger);
    if(!ozet){
      el.innerHTML = "Henüz önceki bir kayıt yok.";
      return;
    }
    var parca = ozet.tarihAnahtari.split("-"); // YYYY-MM-DD
    var etiketTarih = parca[2] + "." + parca[1] + "." + parca[0];
    if(ozet.oncekiKm===undefined || ozet.oncekiKm===null || ozet.oncekiKm===""){
      el.innerHTML = "Önceki tarih (" + etiketTarih + ") için kilometre kaydı yok, mesafe hesaplanamıyor.";
      return;
    }
    if(ozet.mesafe===null){
      el.innerHTML = "Önceki tarih (" + etiketTarih + "): <strong>" + ozet.oncekiKm + " km</strong> — bugünkü değer geçersiz.";
      return;
    }
    el.innerHTML = "Önceki tarih (" + etiketTarih + "): <strong>" + ozet.oncekiKm + " km</strong> → <strong>" + ozet.bugunkuDeger + " km</strong>"
      + " = <strong>" + ozet.mesafe + " km</strong> yapılmış";
  }catch(e){ hataGoster("Önceki tarih özeti çizilemedi: " + e.message); }
}

// AYLIK TOPLAM PANOSU (24.09.2026) — günlük takip sayfasında bu ayki
// İş/Özel KM toplamı (Ana Sayfa'da DEĞİL — Abdullah'ın açık isteği).
function gunlukAyPanosunuGuncelle(){
  try{
    var etiketEl = document.getElementById("kmGunlukAyEtiketi");
    if(!etiketEl || typeof KmData === "undefined") return;
    var d = new Date();
    var yilAy = d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2);
    etiketEl.textContent = "AYLIK TOPLAM · " + AYLAR[d.getMonth()].toLocaleUpperCase("tr-TR") + " " + d.getFullYear();
    var kayitlar = KmData.ayinKayitlari(yilAy);
    var toplamIs = 0, toplamOzel = 0;
    kayitlar.forEach(function(k){
      if(k.isKm!=null) toplamIs += k.isKm;
      if(k.ozelKm!=null) toplamOzel += k.ozelKm;
    });
    document.getElementById("kmGunlukAyToplamIs").textContent = toplamIs + " km";
    document.getElementById("kmGunlukAyToplamOzel").textContent = toplamOzel + " km";
  }catch(e){ hataGoster("Aylık toplam panosu güncellenemedi: " + e.message); }
}

function formuDoldur(){
  try{
    var anahtar = KmData.bugunAnahtari();
    var kayit = KmData.kaydiOku(anahtar);
    if(kayit){
      if(kayit.km!==undefined && kayit.km!==null) document.getElementById("kmBugun").value = kayit.km;
      if(kayit.saat) document.getElementById("kmSaat").value = kayit.saat;
      if(kayit.guzergah) document.getElementById("kmGuzergah").value = kayit.guzergah;
      if(kayit.ziyaretYerleri) document.getElementById("kmZiyaretYerleri").value = kayit.ziyaretYerleri;
      secilenKategori = kayit.kmKategori || "is";
      document.querySelectorAll(".kategori-btn").forEach(function(b){
        b.classList.toggle("kategori-btn--secili", b.getAttribute("data-kategori")===secilenKategori);
      });
    }
    dunOzetiniCiz();
  }catch(e){ hataGoster("Form doldurulamadı: " + e.message); }
}

function kmKaydetTiklandi(){
  try{
    var deger = document.getElementById("kmBugun").value;
    if(!deger){
      hataGoster("Bugünün kilometresini girin.");
      return;
    }
    var btn = document.getElementById("btnKmKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    var saat = document.getElementById("kmSaat").value.trim();
    var guzergah = document.getElementById("kmGuzergah").value.trim();
    var ziyaretYerleri = document.getElementById("kmZiyaretYerleri").value.trim();

    KmData.gununKmGir(parseFloat(deger), secilenKategori, saat, guzergah, function(basarili, err){
      if(!basarili){
        btn.disabled = false;
        btn.textContent = "✓ Günü Kaydet";
        hataGoster("Kaydetme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
        return;
      }
      // Ziyaret yerlerini de aynı kayda yaz (ayrı bir çağrı — küçük bir gecikmeyle
      // "kayıtlar" nesnesinin Firebase'den taze hâliyle güncellenmesini bekliyoruz).
      setTimeout(function(){
        KmData.ziyaretYerleriniKaydet(KmData.bugunAnahtari(), ziyaretYerleri, function(){
          btn.disabled = false;
          btn.textContent = "✓ Günü Kaydet";
          alert("✓ Kayıt tamamlandı.");
        });
      }, 300);
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
}

var kmAyarlarOnbellek = {};

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  kategoriSecimBagla();
  document.getElementById("kmBugun").addEventListener("input", dunOzetiniCiz);
  document.getElementById("btnKmKaydet").onclick = kmKaydetTiklandi;
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("btnKmBaslangicKaydet").onclick = function(){
    var deger = parseFloat(document.getElementById("kmBaslangicInput").value);
    if(!deger || deger<=0){ hataGoster("Geçerli bir kilometre değeri girin."); return; }
    var btn = document.getElementById("btnKmBaslangicKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    KmData.baslangicKaydet(deger, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "Kaydet ve Başla";
      if(basarili){
        document.getElementById("kmBaslangicOverlay").hidden = true;
        dunOzetiniCiz();
      } else {
        hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };
  // NOT: "Başlangıç Kilometresi Gerekli" hatırlatma popup'ı kaldırıldı —
  // Firebase verisi yavaş bağlantıda geç gelince yanlışlıkla tetiklenip
  // hiç kapanmıyordu (zaten dolu olan güne rağmen). Artık hiçbir koşulda
  // gösterilmiyor; kmBaslangicOverlay HTML'de duruyor ama hiç açılmıyor.

  // HATIRLATMA NOTU (24.09.2026) — panele dokununca popup açılır, serbest
  // metin yazılır, Kaydet ile KmData.hatirlatmaNotunuKaydet() çağrılır.
  function hatirlatmaPanelineYaz(){
    var metinEl = document.getElementById("kmHatirlatmaMetin");
    var not = KmData.hatirlatmaNotunuOku();
    if(not){
      metinEl.textContent = not;
      metinEl.classList.remove("km-hatirlatma-metin--bos");
    } else {
      metinEl.textContent = "Dokun, bir not yaz.";
      metinEl.classList.add("km-hatirlatma-metin--bos");
    }
  }
  document.getElementById("kmHatirlatmaKutu").onclick = function(){
    document.getElementById("kmHatirlatmaInput").value = KmData.hatirlatmaNotunuOku();
    document.getElementById("kmHatirlatmaOverlay").hidden = false;
  };
  document.getElementById("btnKmHatirlatmaVazgec").onclick = function(){
    document.getElementById("kmHatirlatmaOverlay").hidden = true;
  };
  document.getElementById("btnKmHatirlatmaKaydet").onclick = function(){
    var btn = this;
    var metin = document.getElementById("kmHatirlatmaInput").value;
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    KmData.hatirlatmaNotunuKaydet(metin, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "✓ Kaydet";
      if(basarili){
        document.getElementById("kmHatirlatmaOverlay").hidden = true;
      } else {
        hataGoster("Not kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };
  KmData.hatirlatmaNotuDegistiginde(hatirlatmaPanelineYaz);
  hatirlatmaPanelineYaz();

  KmData.ayarlarOku(function(ayarlar){
    kmAyarlarOnbellek = ayarlar || {};
  });

  KmData.degistiginde(function(){
    formuDoldur();
    gunlukAyPanosunuGuncelle();
  });
  formuDoldur();
  gunlukAyPanosunuGuncelle();
});
