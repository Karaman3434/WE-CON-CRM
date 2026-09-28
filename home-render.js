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

    setText("anaSayfaSatisToplam", WeiconData.fmt(ay.toplamEuro) + " EURO");
    setText("anaSayfaPrimToplam", WeiconData.fmt(ay.toplamPrim) + " TL");
    setText("anaSayfaAyEtiketi", ay.ayAd.toLocaleUpperCase("tr-TR") + " " + ay.yil + " SATIŞ");
    setText("anaSayfaPrimEtiketi", ay.ayAd.toLocaleUpperCase("tr-TR") + " " + ay.yil + " PRİM");

    setText("anaSayfaBugunSatis", WeiconData.fmt(bugun.toplamEuro) + " EURO");
    setText("anaSayfaBugunPrim", WeiconData.fmt(bugun.toplamPrim) + " TL");

  }catch(e){ hataGoster("Kartlar güncellenemedi: " + e.message); }
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

function asKurGuncelle(){
  try{
    var el = document.getElementById("asKurDeger");
    if(!el) return;
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    el.textContent = isNaN(kur) ? "-" : kur.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:4});
  }catch(e){}
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
    drawer.classList.remove("as-drawer--acik");
    document.body.classList.remove("as-drawer-kilit");
    setTimeout(function(){ overlay.hidden = true; }, 250);
  }catch(e){}
}
function asDrawerBagla(){
  try{
    document.getElementById("btnAsMenuAc").onclick = asDrawerAc;
    var overlay = document.getElementById("asDrawerOverlay");
    overlay.addEventListener("click", function(ev){
      if(ev.target === overlay) asDrawerKapat();
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

function motivasyonuGuncelle(){
  try{
    if(typeof MOTIVASYON_SOZLERI === "undefined") return;
    var simdi = new Date();
    var selamEl = document.getElementById("motivasyonSelam");
    var sozEl = document.getElementById("motivasyonSoz");
    if(selamEl) selamEl.textContent = "Merhaba,";
    if(sozEl) sozEl.textContent = "\u201c" + motivasyonSozunuGetir(simdi) + "\u201d";
  }catch(e){}
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  motivasyonuGuncelle();
  // Saat başı/2 saatte bir değişimi yakalamak için hafif bir dakika
  // kontrolü yeterli — saniyede bir çalışan gereksiz bir zamanlayıcı
  // kurulmuyor (60 sn'de bir küçük bir metin güncellemesi, performansa
  // etkisi yok).
  setInterval(motivasyonuGuncelle, 60000);
  isGunuKutusunuGuncelle();
  setInterval(function(){
    if(new Date().getDate() !== isGunuSonHesaplananGun) isGunuKutusunuGuncelle();
  }, 60000);
  asDrawerBagla();
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
  window.addEventListener("storage", function(ev){ if(ev.key === "weicon_kur") asKurGuncelle(); });
  window.addEventListener("weiconAuthHazir", function(ev){
    asKurGuncelle();
    try{
      var el = document.getElementById("asDrawerIsim");
      if(el && ev.detail && ev.detail.user) el.textContent = ev.detail.user.email;
    }catch(e){}
  });
});
