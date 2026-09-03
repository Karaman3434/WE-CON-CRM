/*
  cihazlar-render.js
  ====================
  Akış:
    1) Herkes "Bu Cihaz" kartından kendi cihazını adlandırabilir.
    2) Cihaz adı tam olarak "Samsung S22" değilse -> sadece bilgi notu,
       yönetim alanı hiç gösterilmez.
    3) "Samsung S22" ise -> AYRI bir PIN istenir (uygulama kilidinden
       farklı, weicon_cihaz_pin_hash / Firebase "cihazPin" düğümünde
       saklanır). İlk kullanımda PIN hiç yoksa doğrudan "yeni PIN belirle"
       akışına girilir. Bu oturumda (sessionStorage) bir kez doğrulanınca
       sayfa yeniden açılana kadar tekrar sorulmaz.
    4) PIN doğrulanınca cihaz listesi + engelle/engeli kaldır butonları.
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

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
  }catch(e){}
}

function zamanGoster(ms){
  if(!ms) return "hiç görülmedi";
  var farkDk = Math.round((Date.now() - ms) / 60000);
  if(farkDk < 1) return "az önce";
  if(farkDk < 60) return farkDk + " dk önce";
  if(farkDk < 1440) return Math.floor(farkDk/60) + " sa önce";
  return Math.floor(farkDk/1440) + " gün önce";
}

/* ---------- "Bu Cihaz" kartı ---------- */
function buCihazKartiniHazirla(){
  var input = document.getElementById("czBuCihazAdi");
  var yerel = localStorage.getItem("weicon_cihaz_adi");
  if(yerel) input.value = yerel;

  document.getElementById("btnCzAdKaydet").onclick = function(){
    var ad = input.value.trim();
    if(!ad) return;
    CihazData.adiKaydet(ad, function(basarili){
      if(basarili){
        var ok = document.getElementById("czAdKaydedildi");
        ok.hidden = false;
        setTimeout(function(){ ok.hidden = true; }, 2500);
      }
      erisimKontrolEt();
    });
  };
}

/* ---------- Erişim kontrolü: sadece "Samsung S22" yönetim görebilir ---------- */
function erisimKontrolEt(){
  var s22Mi = CihazData.korumaliMi(CihazData.benimAdim());
  document.getElementById("czSadeceS22Notu").hidden = s22Mi;
  document.getElementById("czPinAlani").hidden = true;
  document.getElementById("czYonetimAlani").hidden = true;

  if(!s22Mi) return;

  if(sessionStorage.getItem("weicon_cihaz_pin_ok") === "1"){
    yonetimAlaniniGoster();
  } else {
    document.getElementById("czPinAlani").hidden = false;
    czPinAkisiBaslat();
  }
}

/* ---------- Cihaz Yönetim PIN'i (uygulama PIN'inden AYRI) ---------- */
var czGirilenPin = "";
var czPinAsama = "kontrolEdiliyor"; // kontrolEdiliyor -> giris | yeniPin1 -> yeniPin2 -> tamam
var czYeniPinIlkGiris = "";

function czPinHashGetir(){ return localStorage.getItem("weicon_cihaz_pin_hash"); }

function czNoktalariGuncelle(){
  var noktalar = document.querySelectorAll("#czPinNoktalar .pin-nokta");
  noktalar.forEach(function(n, i){ n.classList.toggle("dolu", i < czGirilenPin.length); });
}
function czPinEkraniniSifirla(){ czGirilenPin = ""; czNoktalariGuncelle(); }

function czRakamEkle(r){
  if(czGirilenPin.length >= 4) return;
  czGirilenPin += r;
  czNoktalariGuncelle();
  if(czGirilenPin.length === 4){
    if(czPinAsama === "giris") czPinKontrolEt();
    else if(czPinAsama === "yeniPin1") czYeniPinIlkAdimiIsle();
    else if(czPinAsama === "yeniPin2") czYeniPinTekrarIsle();
  }
}
function czRakamSil(){
  czGirilenPin = czGirilenPin.slice(0, -1);
  czNoktalariGuncelle();
  document.getElementById("czPinHata").hidden = true;
}

function czYeniPinAkisiniBaslat(){
  czPinAsama = "yeniPin1";
  czPinEkraniniSifirla();
  document.getElementById("czPinBaslik").textContent = "🆕 Yönetim PIN'i Belirle";
  var bilgi = document.getElementById("czPinBilgi");
  bilgi.textContent = "Bu cihazdan cihaz engelleme yapabilmek için 4 haneli AYRI bir PIN belirle (uygulama kilidinden farklı).";
  bilgi.hidden = false;
}

function czPinKontrolEt(){
  var mevcutHash = czPinHashGetir();
  pinHashHesapla(czGirilenPin).then(function(girilenHash){
    if(girilenHash === mevcutHash){
      sessionStorage.setItem("weicon_cihaz_pin_ok", "1");
      yonetimAlaniniGoster();
    } else {
      document.getElementById("czPinHata").hidden = false;
      czPinEkraniniSifirla();
    }
  });
}

function czYeniPinIlkAdimiIsle(){
  czYeniPinIlkGiris = czGirilenPin;
  czPinAsama = "yeniPin2";
  czPinEkraniniSifirla();
  document.getElementById("czPinBaslik").textContent = "🆕 PIN'i Onayla";
  document.getElementById("czPinBilgi").textContent = "Az önce girdiğin PIN'i onaylamak için tekrar gir.";
}

function czYeniPinTekrarIsle(){
  if(czGirilenPin !== czYeniPinIlkGiris){
    document.getElementById("czPinHata").textContent = "PIN'ler eşleşmiyor, baştan deneyin.";
    document.getElementById("czPinHata").hidden = false;
    czYeniPinIlkGiris = "";
    czYeniPinAkisiniBaslat();
    return;
  }
  pinHashHesapla(czGirilenPin).then(function(yeniHash){
    localStorage.setItem("weicon_cihaz_pin_hash", yeniHash);
    try{ firebase.database().ref("cihazPin").set({hash:yeniHash, zaman:Date.now()}); }catch(e){}
    sessionStorage.setItem("weicon_cihaz_pin_ok", "1");
    yonetimAlaniniGoster();
  });
}

function czTusTakiminiOlustur(){
  var tuslar = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  var grid = document.getElementById("czPinTusGrid");
  grid.innerHTML = tuslar.map(function(t){
    if(t === "") return "<button class='pin-tus pin-tus--bos'></button>";
    if(t === "⌫") return "<button class='pin-tus pin-tus--sil' data-sil='1'>⌫</button>";
    return "<button class='pin-tus' data-rakam='" + t + "'>" + t + "</button>";
  }).join("");
  grid.querySelectorAll("[data-rakam]").forEach(function(btn){
    btn.onclick = function(){ czRakamEkle(this.getAttribute("data-rakam")); };
  });
  grid.querySelector("[data-sil]").onclick = czRakamSil;

  var gizliInput = document.getElementById("czPinGizliInput");
  gizliInput.addEventListener("input", function(){
    var v = gizliInput.value.replace(/[^0-9]/g, "").slice(0,4);
    gizliInput.value = "";
    for(var i=0;i<v.length;i++) czRakamEkle(v[i]);
  });
}

function czPinAkisiBaslat(){
  document.getElementById("czPinBaslik").textContent = "🔒 Cihaz Yönetim PIN'i";
  document.getElementById("czPinBilgi").hidden = true;
  czPinEkraniniSifirla();

  if(czPinHashGetir()){
    czPinAsama = "giris";
    return;
  }
  // Yerelde yok — Firebase'de bu S22'nin daha önce belirlediği bir PIN
  // var mı diye bak (localStorage temizlenmiş olabilir). Yoksa yeni belirle.
  try{
    firebase.database().ref("cihazPin/hash").once("value").then(function(snap){
      if(snap.val()){
        localStorage.setItem("weicon_cihaz_pin_hash", snap.val());
        czPinAsama = "giris";
      } else {
        czYeniPinAkisiniBaslat();
      }
    }).catch(function(){ czYeniPinAkisiniBaslat(); });
  }catch(e){ czYeniPinAkisiniBaslat(); }
}

/* ---------- Cihaz listesi ---------- */
function yonetimAlaniniGoster(){
  document.getElementById("czPinAlani").hidden = true;
  document.getElementById("czYonetimAlani").hidden = false;
  CihazData.tumCihazlariDinle(listeyiCiz);
  if(!yonetimAlaniHazirlandiMi){
    yonetimAlaniHazirlandiMi = true;
    czErisimKoduAlaniniHazirla();
  }
}
var yonetimAlaniHazirlandiMi = false;

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function listeyiCiz(liste){
  try{
    var kapsayici = document.getElementById("czListe");
    var bos = document.getElementById("czBos");
    if(!liste.length){ kapsayici.innerHTML = ""; bos.hidden = false; return; }
    bos.hidden = true;

    var benimId = CihazData.benimIdim();

    kapsayici.innerHTML = liste.map(function(c){
      var buCihazMi = c.id === benimId;
      var korumaliMi = CihazData.korumaliMi(c.ad);
      var rozetler = "";
      if(buCihazMi) rozetler += "<span class='cz-kart-rozet cz-kart-rozet--bu'>Bu cihaz</span>";
      if(c.engelli) rozetler += " <span class='cz-kart-rozet cz-kart-rozet--engelli'>Engelli</span>";

      var alt;
      if(buCihazMi){
        alt = "";
      } else if(korumaliMi){
        alt = "<div class='cz-kart-alt cz-korumali-not'>🔒 Korumalı ana cihaz — engellenemez.</div>";
      } else if(c.engelli){
        alt = "<div class='cz-kart-alt'><button class='cz-kaldir-btn' data-id='" + htmlEsc(c.id) + "'>✓ Engeli Kaldır</button></div>";
      } else {
        alt = "<div class='cz-kart-alt'><button class='cz-engelle-btn' data-id='" + htmlEsc(c.id) + "' data-ad='" + htmlEsc(c.ad||"") + "'>🚫 Engelle</button></div>";
      }

      return "<div class='cz-kart'>"
        + "<div class='cz-kart-ust'><span class='cz-kart-ad'>" + htmlEsc(c.ad || "Adsız Cihaz") + "</span>" + rozetler + "</div>"
        + "<div class='cz-kart-son-gorulme'>Son görülme: " + zamanGoster(c.sonGorulme) + "</div>"
        + alt
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".cz-engelle-btn").forEach(function(btn){
      btn.onclick = function(){
        var id = this.getAttribute("data-id");
        var ad = this.getAttribute("data-ad");
        if(!confirm("\"" + ad + "\" cihazı engellensin mi? O cihazda oturum kapatılacak.")) return;
        CihazData.engelle(id, ad, function(basarili, hata){
          if(!basarili) hataGoster(hata || "Cihaz engellenemedi.");
        });
      };
    });
    kapsayici.querySelectorAll(".cz-kaldir-btn").forEach(function(btn){
      btn.onclick = function(){
        var id = this.getAttribute("data-id");
        CihazData.engeliKaldir(id, function(basarili, hata){
          if(!basarili) hataGoster(hata || "Engel kaldırılamadı.");
        });
      };
    });
  }catch(e){ hataGoster("Cihaz listesi çizilemedi: " + e.message); }
}

/* ---------- Erişim Kodu (bağlantı sonu ?k=XXX) ---------- */
function czGuncelLinkOlustur(kod){
  try{
    var taban = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
    return taban + "home.html?k=" + encodeURIComponent(kod);
  }catch(e){ return ""; }
}

function czLinkKutusunuCiz(kod){
  var kutu = document.getElementById("czGuncelLinkKutusu");
  if(!kod){ kutu.innerHTML = ""; return; }
  var link = czGuncelLinkOlustur(kod);
  kutu.innerHTML = "<div class='cz-link-kutusu'>"
    + "<div class='cz-link-metin'>" + htmlEsc(link) + "</div>"
    + "<button class='cz-link-kopyala-btn' id='btnCzLinkKopyala'>📋 Bağlantıyı Kopyala</button>"
    + "</div>";
  document.getElementById("btnCzLinkKopyala").onclick = function(){
    navigator.clipboard.writeText(link).then(function(){
      this.textContent = "✓ Kopyalandı";
      var btn = this;
      setTimeout(function(){ btn.textContent = "📋 Bağlantıyı Kopyala"; }, 2000);
    }.bind(this)).catch(function(){ hataGoster("Kopyalanamadı, elle seçip kopyala."); });
  };
}

function czErisimKoduAlaniniHazirla(){
  try{
    firebase.database().ref("erisimKodu/kod").on("value", function(snap){
      var kod = snap.val();
      document.getElementById("czErisimKoduInput").value = kod || "";
      czLinkKutusunuCiz(kod);
    });
  }catch(e){ hataGoster("Erişim kodu okunamadı: " + e.message); }

  document.getElementById("btnCzKoduKaydet").onclick = function(){
    var kod = document.getElementById("czErisimKoduInput").value.trim();
    if(!kod) return;
    if(!confirm("Erişim kodu \"" + kod + "\" olarak değiştirilsin mi? Güncel kodu daha önce kullanmamış hiçbir cihaz artık giriş yapamayacak.")) return;
    firebase.database().ref("erisimKodu").set({kod: kod, zaman: Date.now()}).then(function(){
      var ok = document.getElementById("czKoduKaydedildi");
      ok.hidden = false;
      setTimeout(function(){ ok.hidden = true; }, 2500);
      try{ localStorage.setItem("weicon_erisim_kodu_dogrulandi", kod); }catch(e){} // bu cihaz (S22) yeni kodu otomatik bilir
    }).catch(function(err){ hataGoster("Kod kaydedilemedi: " + err.message); });
  };
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  buCihazKartiniHazirla();
  czTusTakiminiOlustur();
  erisimKontrolEt();
  CihazData.kaydiGuncelle();
});
