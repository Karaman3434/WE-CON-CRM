/*
  home-render.js
  ==============
  Bu dosyanın TEK görevi: WeiconData'dan veriyi okuyup ekrana (DOM'a) yazmak.
  Hiçbir hesaplama yapmaz, hiçbir Firebase çağrısı içermez.

  GÜVENLİK AĞI: Her fonksiyon try/catch ile korunuyor ve herhangi bir hata
  ekranda görünür bir uyarı olarak gösteriliyor — "sessiz bozulma" olmasın.
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
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function kartlariGuncelle(){
  try{
    var ay = WeiconData.buAyinVerisi();
    var bugun = WeiconData.bugununVerisi();

    setText("anaSayfaSatisToplam", WeiconData.fmt(ay.toplamEuro));
    setText("anaSayfaPrimToplam", WeiconData.fmt(ay.toplamPrim));
    setText("anaSayfaAyEtiketi", ay.ayAd + " " + ay.yil + " satışı");
    setText("anaSayfaPrimEtiketi", ay.ayAd + " " + ay.yil + " primi");

    setText("anaSayfaBugunSatis", WeiconData.fmt(bugun.toplamEuro) + " EURO");
    setText("anaSayfaBugunPrim", WeiconData.fmt(bugun.toplamPrim) + " TL");

    hedefGostergesiniGuncelle(ay.toplamEuro);

  }catch(e){ hataGoster("Kartlar güncellenemedi: " + e.message); }
}

// Aylık satış hedefi ilerleme göstergesi — hedef Ayarlar sayfasında
// girilir (localStorage "weicon_hedef", Firebase "ayarlar/hedef" ile
// senkron). Hedef girilmemişse sahte bir yüzde asla gösterilmez, ama
// gösterge tamamen de gizlenmez — rozet "Hedef belirle" yazan tıklanabilir
// bir bağlantıya dönüşür (Ayarlar'a götürür) ki özellik var olduğu hâlde
// yokmuş gibi görünmesin.
function hedefGostergesiniGuncelle(satisToplamEuro){
  try{
    var rozet = document.getElementById("asHedefRozet");
    var barTrack = document.getElementById("asHedefBarTrack");
    var barDolu = document.getElementById("asHedefBarDolu");
    var altYazi = document.getElementById("asHedefAltYazi");
    if(!rozet || !barTrack || !barDolu || !altYazi) return;

    var hedef = parseFloat(localStorage.getItem("weicon_hedef"));

    if(!isFinite(hedef) || hedef <= 0){
      rozet.hidden = false;
      rozet.textContent = "Hedef belirle";
      barTrack.hidden = true;
      altYazi.hidden = false;
      altYazi.textContent = "Aylık hedefini Ayarlar'dan girersen ilerleme burada görünür.";
      return;
    }

    var yuzde = Math.round((satisToplamEuro / hedef) * 100);
    if(yuzde < 0) yuzde = 0;

    rozet.hidden = false;
    rozet.textContent = "%" + yuzde + " hedef";
    barTrack.hidden = false;
    barDolu.style.width = Math.min(yuzde, 100) + "%";
    altYazi.hidden = false;
    altYazi.textContent = "Hedef: " + WeiconData.fmt(hedef) + " EURO";
  }catch(e){ hataGoster("Hedef göstergesi güncellenemedi: " + e.message); }
}

var TEMAS_TUR_ETIKET = {ziyaret:"Ziyaret", telefon:"Telefon", mail:"Mail", whatsapp:"WhatsApp"};

function gununOzetiniGuncelle(){
  try{
    var islem = WeiconData.gununIslemOzeti();
    setText("gununOzetiIslemSayi", islem.toplam);
    setText("gununOzetiSiparisSayi", islem.dokum.siparis||0);

    if(typeof CustomerData !== "undefined"){
      var bugun = new Date();
      var temasDokum = {ziyaret:0, telefon:0, mail:0, whatsapp:0};
      CustomerData.tumZiyaretTemaslar().forEach(function(z){
        var d = new Date(z.ts);
        if(d.getFullYear()===bugun.getFullYear() && d.getMonth()===bugun.getMonth() && d.getDate()===bugun.getDate()){
          var t = z.tur || "ziyaret";
          if(temasDokum[t]===undefined) temasDokum[t] = 0;
          temasDokum[t]++;
        }
      });
      var temasToplam = 0;
      Object.keys(temasDokum).forEach(function(t){ temasToplam += temasDokum[t]; });
      setText("gununOzetiTemasSayi", temasToplam);
    }

    var bugunTarih = new Date();
    var tarihStr = bugunTarih.getFullYear() + "-" + String(bugunTarih.getMonth()+1).padStart(2,"0") + "-" + String(bugunTarih.getDate()).padStart(2,"0");
    var kutu = document.getElementById("gununOzetiKutu");
    if(kutu) kutu.href = "ziyaret.html?tarih=" + tarihStr;
  }catch(e){ hataGoster("Günün özeti güncellenemedi: " + e.message); }
}

function setText(id, deger){
  var el = document.getElementById(id);
  if(el) el.textContent = deger;
  else console.warn("Element bulunamadı:", id);
}

function bildirimBanneriGuncelle(){
  try{
    var ozet = WeiconData.bildirimOzetiHesapla();
    var banner = document.getElementById("bildirimBanner");
    if(ozet.toplam === 0){
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    var parcalar = [];
    if(ozet.acikSurecSayisi > 0) parcalar.push(ozet.acikSurecSayisi + " açık süreç (15+ gün)");
    if(ozet.gecikmisGorevSayisi > 0) parcalar.push(ozet.gecikmisGorevSayisi + " gecikmiş görev");
    document.getElementById("bildirimBannerAlt").textContent = parcalar.join(" · ");
  }catch(e){ hataGoster("Bildirim banner'ı güncellenemedi: " + e.message); }
}

function isGunuKaldiHesapla(tarih){
  var d = tarih || new Date();
  var yil = d.getFullYear(), ay = d.getMonth();
  var ayinSonGunu = new Date(yil, ay+1, 0).getDate();
  var bugunGun = d.getDate();
  var sayac = 0;
  for(var g=bugunGun; g<=ayinSonGunu; g++){
    var haftaGunu = new Date(yil, ay, g).getDay(); // 0=Pazar, 6=Cumartesi
    if(haftaGunu !== 0 && haftaGunu !== 6) sayac++;
  }
  return sayac;
}

var isGunuSonHesaplananGun = null;
function isGunuKutusunuGuncelle(){
  try{
    var el = document.getElementById("isGunuDeger");
    if(!el) return;
    var simdi = new Date();
    el.textContent = isGunuKaldiHesapla(simdi);
    isGunuSonHesaplananGun = simdi.getDate();
  }catch(e){ hataGoster("İş günü göstergesi güncellenemedi: " + e.message); }
}

// Ayarlar'daki "okunmamış hata" rozeti (01.10.2026, Abdullah'ın isteğiyle).
// Hata Kayıtları sayfası, kendisi ziyaret edildiğinde "weicon_hata_son_gorulen"
// localStorage anahtarına en son gördüğü kaydın zaman damgasını yazar (bkz.
// hata-kayitlari-render.js). Burada "hatalar" düğümünü dinleyip, bu zaman
// damgasından SONRA oluşmuş kayıt sayısını buluyoruz — 0 ise rozet gizli,
// 1+ ise "Ayarlar" etiketinin yanında kırmızı rozette sayı görünür.
function hataRozetiGuncelle(){
  try{
    var rozet = document.getElementById("asAyarlarHataRozeti");
    if(!rozet) return;
    if(!firebase.apps.length){ firebase.initializeApp(WEICON_FIREBASE_CONFIG); }
    firebase.database().ref("hatalar").on("value", function(snap){
      try{
        var veri = snap.val();
        var sonGorulen = parseInt(localStorage.getItem("weicon_hata_son_gorulen"), 10) || 0;
        var yeniSayisi = 0;
        if(veri){
          Object.keys(veri).forEach(function(anahtar){
            var zaman = veri[anahtar].zaman || 0;
            if(zaman > sonGorulen) yeniSayisi++;
          });
        }
        if(yeniSayisi > 0){
          rozet.hidden = false;
          rozet.textContent = yeniSayisi > 99 ? "99+" : yeniSayisi;
        }else{
          rozet.hidden = true;
        }
      }catch(e){}
    });
  }catch(e){}
}

function asKurGuncelle(){
  try{
    var el = document.getElementById("asKurDeger");
    if(!el) return;
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    el.textContent = isNaN(kur) ? "-" : kur.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:4});
  }catch(e){}
}

// Menü içi "yana açılan" alt menü paneli — GENEL altyapı (30.09.2026,
// Abdullah'ın isteğiyle). Hangi drawer etiketinin alt menüsü olduğu,
// sadece bu tabloya bir anahtar eklenerek tanımlanır; HTML tarafında o
// etiket <a> yerine <button data-alt-menu="anahtar"> olur (bkz. home.html
// "Raporlar" satırı) — panel konumlandırma/açma/kapama kodu SABİT kalır,
// yarın başka bir etikete (örn. Müşteri) alt menü eklemek istenirse bu
// tabloya birkaç satır eklemek yeterlidir.
var DRAWER_ALT_MENULERI = {
  raporlar: {
    baslik: "Raporlar",
    ogeler: [
      {ikon:"📊", etiket:"İstatistikler", href:"reports.html"},
      {ikon:"📋", etiket:"Son İşlemler", href:"son-islemler.html"},
      {ikon:"📌", etiket:"Görevlerim", href:"gorevler.html"},
      {ikon:"📆", etiket:"Ziyaret Takvimi", href:"ziyaret.html"},
      {ikon:"❌", etiket:"Kaçan Satışlar", href:"kacan-satislar.html"}
    ]
  }
};

var altMenuAcikTetikleyici = null;

function altMenuKapat(){
  var panel = document.getElementById("asDrawerAltMenu");
  if(!panel) return;
  panel.hidden = true;
  if(altMenuAcikTetikleyici) altMenuAcikTetikleyici.classList.remove("as-drawer-oge--acik");
  altMenuAcikTetikleyici = null;
}

function altMenuAc(anahtar, tetikleyiciEl){
  try{
    var tanim = DRAWER_ALT_MENULERI[anahtar];
    if(!tanim) return;
    // Aynı satıra tekrar dokununca kapat (aç/kapa tuşu gibi davransın).
    if(altMenuAcikTetikleyici === tetikleyiciEl){ altMenuKapat(); return; }
    altMenuKapat();

    var panel = document.getElementById("asDrawerAltMenu");
    document.getElementById("asDrawerAltMenuBaslik").textContent = tanim.baslik;
    document.getElementById("asDrawerAltMenuListe").innerHTML = tanim.ogeler.map(function(o){
      return "<a class='as-drawer-altmenu-oge' href='" + o.href + "'>"
        + "<span class='as-drawer-altmenu-oge-ikon' aria-hidden='true'>" + o.ikon + "</span>"
        + "<span>" + o.etiket + "</span></a>";
    }).join("");

    panel.hidden = false;
    // Tetikleyici satırın TAM YANINA konumlandır, ekrandan taşarsa sola
    // kaydırıp sığdır (küçük ekranlarda bile okunaklı kalması için).
    var rect = tetikleyiciEl.getBoundingClientRect();
    var panelGenislik = panel.offsetWidth;
    var sol = rect.right + 6;
    if(sol + panelGenislik > window.innerWidth - 8){ sol = window.innerWidth - panelGenislik - 8; }
    if(sol < 8) sol = 8;
    var ust = rect.top;
    var panelYukseklik = panel.offsetHeight;
    if(ust + panelYukseklik > window.innerHeight - 8){ ust = window.innerHeight - panelYukseklik - 8; }
    if(ust < 8) ust = 8;
    panel.style.left = sol + "px";
    panel.style.top = ust + "px";

    tetikleyiciEl.classList.add("as-drawer-oge--acik");
    altMenuAcikTetikleyici = tetikleyiciEl;
  }catch(e){ hataGoster("Alt menü açılamadı: " + e.message); }
}

function asDrawerAc(){
  try{
    var overlay = document.getElementById("asDrawerOverlay");
    var drawer = document.getElementById("asDrawer");
    if(!overlay || !drawer) return;
    overlay.hidden = false;
    document.body.classList.add("as-drawer-kilit");
    requestAnimationFrame(function(){ drawer.classList.add("as-drawer--acik"); });
  }catch(e){ hataGoster("Menü açılamadı: " + e.message); }
}
function asDrawerKapat(){
  try{
    var overlay = document.getElementById("asDrawerOverlay");
    var drawer = document.getElementById("asDrawer");
    if(!overlay || !drawer) return;
    altMenuKapat();
    drawer.classList.remove("as-drawer--acik");
    document.body.classList.remove("as-drawer-kilit");
    setTimeout(function(){ overlay.hidden = true; }, 250);
  }catch(e){}
}
/* ---------- KULLANICI ADI (03.10.2026, Abdullah'ın isteğiyle) ----------
   Drawer'daki "Hesabım" satırını CihazData.benimKullaniciAdim() ile
   doldurur; boşsa "Hesabım" yazılı kalır (henüz tanımlanmadıysa). Aynı
   pencere hem MECBURİ ilk-kullanım ekranı hem de drawer'daki ✏️'den açılan
   DÜZENLEME ekranı olarak kullanılır — tek fark: mecburi modda kapat
   butonu gizli ve input boş zorunlu, düzenleme modunda kapat butonu
   görünür ve input mevcut adla dolu gelir. */
function asDrawerIsimGuncelle(){
  try{
    var el = document.getElementById("asDrawerIsim");
    if(!el) return;
    var adi = (typeof CihazData !== "undefined") ? CihazData.benimKullaniciAdim() : "";
    el.textContent = adi || "Hesabım";
  }catch(e){}
}

function kaKullaniciAdiPenceresiniAc(mecburiMi){
  try{
    var overlay = document.getElementById("kaOverlay");
    var kapatBtn = document.getElementById("kaKapatBtn");
    var input = document.getElementById("kaInput");
    var hata = document.getElementById("kaHata");
    if(!overlay || !input) return;
    hata.hidden = true;
    kapatBtn.hidden = !!mecburiMi;
    input.value = mecburiMi ? "" : CihazData.benimKullaniciAdim();
    overlay.hidden = false;
    if(mecburiMi) document.body.style.overflow = "hidden";
    setTimeout(function(){ input.focus(); }, 50);
  }catch(e){ hataGoster("Kullanıcı adı penceresi açılamadı: " + e.message); }
}

function kaKullaniciAdiPenceresiniKapat(){
  document.getElementById("kaOverlay").hidden = true;
  document.body.style.overflow = "";
}

function kaKullaniciAdiKaydiTikla(){
  var btn = document.getElementById("btnKaKaydet");
  try{
    var input = document.getElementById("kaInput");
    var hata = document.getElementById("kaHata");
    var adi = input.value.trim();
    if(!adi){ hata.hidden = false; return; }
    hata.hidden = true;
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    CihazData.kullaniciAdiKaydet(adi, function(){
      btn.disabled = false;
      btn.textContent = "✓ Kaydet ve Devam Et";
      asDrawerIsimGuncelle();
      kaKullaniciAdiPenceresiniKapat();
    });
  }catch(e){
    if(btn){ btn.disabled = false; btn.textContent = "✓ Kaydet ve Devam Et"; }
    hataGoster("Kullanıcı adı kaydedilemedi: " + e.message);
  }
}

function kaBaslatVeKontrolEt(){
  try{
    if(typeof CihazData === "undefined") return;
    asDrawerIsimGuncelle();
    document.getElementById("btnKaKaydet").onclick = kaKullaniciAdiKaydiTikla;
    document.getElementById("kaInput").addEventListener("keydown", function(ev){
      if(ev.key === "Enter") kaKullaniciAdiKaydiTikla();
    });
    var kapatBtn = document.getElementById("kaKapatBtn");
    if(kapatBtn) kapatBtn.onclick = kaKullaniciAdiPenceresiniKapat;
    var duzenleBtn = document.getElementById("btnAsKullaniciDuzenle");
    if(duzenleBtn) duzenleBtn.onclick = function(){ kaKullaniciAdiPenceresiniAc(false); };

    if(!CihazData.benimKullaniciAdim()){
      kaKullaniciAdiPenceresiniAc(true);
    }
  }catch(e){ hataGoster("Kullanıcı adı kontrolü başarısız: " + e.message); }
}

function asDrawerBagla(){
  try{
    document.getElementById("btnAsMenuAc").onclick = asDrawerAc;
    var btnKapat = document.getElementById("btnAsMenuKapat");
    if(btnKapat) btnKapat.onclick = asDrawerKapat;
    var overlay = document.getElementById("asDrawerOverlay");
    overlay.addEventListener("click", function(ev){
      if(ev.target === overlay) asDrawerKapat();
    });
    // Alt menüsü olan etiketler (data-alt-menu="...") — GENEL bağlama:
    // kaç tane olursa olsun tek seferde bulup bağlar, tekrar kod yazmaya
    // gerek kalmaz (bkz. DRAWER_ALT_MENULERI).
    document.querySelectorAll("[data-alt-menu]").forEach(function(btn){
      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        altMenuAc(this.getAttribute("data-alt-menu"), this);
      };
    });
    document.addEventListener("click", function(ev){
      var panel = document.getElementById("asDrawerAltMenu");
      if(!panel || panel.hidden) return;
      if(panel.contains(ev.target) || ev.target.closest("[data-alt-menu]")) return;
      altMenuKapat();
    });
    document.getElementById("btnAsCikis").onclick = function(){
      if(!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
      firebase.auth().signOut().then(function(){
        window.location.href = "login.html";
      });
    };
  }catch(e){ hataGoster("Menü bağlanamadı: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

// Ana Sayfa'daki eski ayrı kur şeridi kaldırıldı — döviz kuru artık global
// header'da gösteriliyor (bkz. ust-sabit-olcum.js: dovizKuruHeaderaEkle).

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  isGunuKutusunuGuncelle();
  setInterval(function(){
    if(new Date().getDate() !== isGunuSonHesaplananGun) isGunuKutusunuGuncelle();
  }, 60000);
  asDrawerBagla();
  kaBaslatVeKontrolEt();
  try{ if(typeof CihazData !== "undefined") CihazData.kaydiGuncelle(); }catch(e){}
  WeiconData.veriDegistiginde(kartlariGuncelle);
  WeiconData.bildirimDegistiginde(bildirimBanneriGuncelle);
  WeiconData.bildirimDegistiginde(gununOzetiniGuncelle);
  WeiconData.bildirimVerisiDinlemeyeBasla();
  if(typeof CustomerData !== "undefined") CustomerData.listeDegistiginde(gununOzetiniGuncelle);
  document.getElementById("bildirimBanner").onclick = function(){ window.location.href = "bildirimler.html"; };
  // Firebase verisi henüz gelmemiş olabilir; ilk anda da bir kez dene.
  kartlariGuncelle();
  gununOzetiniGuncelle();

  asKurGuncelle();
  hataRozetiGuncelle();
  window.addEventListener("storage", function(ev){
    if(ev.key === "weicon_kur") asKurGuncelle();
    if(ev.key === "weicon_hedef") kartlariGuncelle();
    if(ev.key === "weicon_hata_son_gorulen") hataRozetiGuncelle();
  });
  if(typeof AyarlarSync !== "undefined") AyarlarSync.degistiginde(kartlariGuncelle);
  window.addEventListener("weiconAuthHazir", function(ev){
    asKurGuncelle();
    try{
      var el = document.getElementById("asDrawerEposta");
      if(el && ev.detail && ev.detail.user) el.textContent = ev.detail.user.email;
    }catch(e){}
  });
});
