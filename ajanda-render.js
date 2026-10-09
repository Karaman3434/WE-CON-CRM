/*
  ajanda-render.js — VERSİYON: WG.091026.1540.755
  ===================================================
  Takvim: Pazartesi başlangıç, Cmt/Paz kırmızı, kayıtlı günlerde rozet
  (kaç sayfa var). Bir güne dokununca o günün sayfa önizlemeleri altta
  listelenir. "📷 Fotoğraf Çek" — cihazın kamerasını doğrudan açar,
  çekilen kare anında küçültülüp sıkıştırılır ve seçili güne kaydedilir.
  Bir sayfaya dokununca tam ekran görüntüleyici açılır; sağa/sola
  kaydırarak (veya ‹/› oklarıyla) TÜM sayfalar arasında kronolojik
  sırayla gezinilir — gün sınırını fark ettirmeden aşar (09.10.2026,
  Abdullah'ın "ajanda yaprağı çevirir gibi" isteği).
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

var AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var GUN_ADLARI = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var d = new Date();
    el.textContent = GUN_ADLARI[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI[d.getMonth()] + " " + d.getFullYear();
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function gunAnahtari(yil, ay, gun){
  return yil + "-" + String(ay+1).padStart(2,"0") + "-" + String(gun).padStart(2,"0");
}
function bugununTarihAnahtari(){
  var d = new Date();
  return gunAnahtari(d.getFullYear(), d.getMonth(), d.getDate());
}

// Seçilen fotoğrafı küçültüp JPEG olarak sıkıştırır (maks. 1100px
// genişlik, %65 kalite — Ödenebilir Komisyon'daki yöntemin aynısı,
// ajanda sayfaları için biraz daha yüksek çözünürlük: el yazısı
// okunabilir kalsın).
function resimSikistir(file, geriBildir){
  try{
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        try{
          var maxGenislik = 1100;
          var olcek = Math.min(1, maxGenislik / img.width);
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * olcek));
          canvas.height = Math.max(1, Math.round(img.height * olcek));
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          geriBildir(canvas.toDataURL("image/jpeg", 0.65));
        }catch(e){ geriBildir(null); }
      };
      img.onerror = function(){ geriBildir(null); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ geriBildir(null); };
    reader.readAsDataURL(file);
  }catch(e){ geriBildir(null); }
}

var goruntulenenYil, goruntulenenAy; // ay: 0-11
var seciliGunAnahtari = null;

function aySecPopupDoldur(){
  try{
    var kapsayici = document.getElementById("ajAySecSatir");
    var bugun = new Date();
    var html = "";
    for(var i=-12; i<=12; i++){
      var d = new Date(bugun.getFullYear(), bugun.getMonth()+i, 1);
      var y = d.getFullYear(), a = d.getMonth();
      var seciliMi = (y===goruntulenenYil && a===goruntulenenAy);
      html += "<div class='aj-ay-secenek" + (seciliMi?" aj-ay-secenek--secili":"") + "' data-yil='" + y + "' data-ay='" + a + "'>" + AY_ADLARI[a].slice(0,3) + " " + y + "</div>";
    }
    kapsayici.innerHTML = html;
    kapsayici.querySelectorAll(".aj-ay-secenek").forEach(function(el){
      el.onclick = function(){
        goruntulenenYil = parseInt(this.getAttribute("data-yil"), 10);
        goruntulenenAy = parseInt(this.getAttribute("data-ay"), 10);
        takvimiCiz();
        document.getElementById("ajAySecOverlay").hidden = true;
      };
    });
    var seciliEl = kapsayici.querySelector(".aj-ay-secenek--secili");
    if(seciliEl) seciliEl.scrollIntoView({inline:"center", block:"nearest"});
  }catch(e){ hataGoster("Ay listesi açılamadı: " + e.message); }
}

function takvimiCiz(){
  try{
    document.getElementById("ajAyBaslik").textContent = AY_ADLARI[goruntulenenAy] + " " + goruntulenenYil;

    var gunSayilari = (typeof AjandaData !== "undefined") ? AjandaData.gunSayilari() : {};

    var ilkGun = new Date(goruntulenenYil, goruntulenenAy, 1);
    var bosluk = (ilkGun.getDay() + 6) % 7; // Pazartesi başlangıçlı
    var gunSayisi = new Date(goruntulenenYil, goruntulenenAy+1, 0).getDate();
    var bugun = new Date();
    var bugunAnahtar = gunAnahtari(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());

    var html = "";
    for(var b=0; b<bosluk; b++) html += "<div class='aj-gun-hucre aj-gun-hucre--bos'></div>";
    for(var g=1; g<=gunSayisi; g++){
      var anahtar = gunAnahtari(goruntulenenYil, goruntulenenAy, g);
      var haftaGunu = new Date(goruntulenenYil, goruntulenenAy, g).getDay();
      var tatilMi = haftaGunu===0 || haftaGunu===6;
      var sayi = gunSayilari[anahtar] || 0;
      var siniflar = "aj-gun-hucre";
      if(tatilMi) siniflar += " aj-gun-hucre--tatil";
      if(anahtar===bugunAnahtar) siniflar += " aj-gun-hucre--bugun";
      if(anahtar===seciliGunAnahtari) siniflar += " aj-gun-hucre--secili";
      html += "<div class='" + siniflar + "' data-anahtar='" + anahtar + "'>"
        + g
        + (sayi>0 ? "<span class='aj-gun-rozet'>" + sayi + "</span>" : "")
        + "</div>";
    }
    document.getElementById("ajTakvimGrid").innerHTML = html;

    document.querySelectorAll(".aj-gun-hucre:not(.aj-gun-hucre--bos)").forEach(function(hucre){
      hucre.onclick = function(){
        seciliGunAnahtari = this.getAttribute("data-anahtar");
        takvimiCiz();
        seciliGunuCiz();
      };
    });
  }catch(e){ hataGoster("Takvim çizilemedi: " + e.message); }
}

// Seçili günün sayfa önizlemeleri — takvimin altında küçük kutular.
function seciliGunuCiz(){
  try{
    var baslikEl = document.getElementById("ajSeciliGunBaslik");
    var seridEl = document.getElementById("ajSayfaSeridi");
    var bosEl = document.getElementById("ajBosGun");
    if(!seciliGunAnahtari){ baslikEl.textContent = ""; seridEl.innerHTML = ""; bosEl.hidden = true; return; }

    var parca = seciliGunAnahtari.split("-");
    var gosterim = parca[2] + " " + AY_ADLARI[parseInt(parca[1],10)-1] + " " + parca[0];
    var kayitlar = (typeof AjandaData !== "undefined") ? AjandaData.gununKayitlari(seciliGunAnahtari) : [];

    baslikEl.textContent = gosterim + " — " + (kayitlar.length>0 ? (kayitlar.length + " sayfa") : "sayfa yok");

    if(kayitlar.length === 0){
      seridEl.innerHTML = "";
      bosEl.hidden = false;
    } else {
      bosEl.hidden = true;
      seridEl.innerHTML = kayitlar.map(function(k){
        var saat = new Date(k.zaman).toLocaleTimeString("tr-TR", {hour:"2-digit", minute:"2-digit"});
        return "<div class='aj-sayfa-kutu' data-id='" + k.id + "'>"
          + "<div class='aj-sayfa-resim' style='background-image:url(" + "\"" + k.url + "\"" + ")'></div>"
          + "<div class='aj-sayfa-saat'>" + saat + "</div>"
          + "</div>";
      }).join("");
      seridEl.querySelectorAll(".aj-sayfa-kutu").forEach(function(kutu){
        kutu.onclick = function(){ viewerAc(this.getAttribute("data-id")); };
      });
    }
  }catch(e){ hataGoster("Seçili gün çizilemedi: " + e.message); }
}

// ——— TAM EKRAN KAYDIRMALI GÖRÜNTÜLEYİCİ ———
var ajViewerListe = [];
var ajViewerIndex = -1;

function viewerAc(baslangicId){
  try{
    ajViewerListe = (typeof AjandaData !== "undefined") ? AjandaData.tumKayitlarKronolojik() : [];
    ajViewerIndex = -1;
    for(var i=0; i<ajViewerListe.length; i++){ if(ajViewerListe[i].id === baslangicId){ ajViewerIndex = i; break; } }
    if(ajViewerIndex < 0) ajViewerIndex = 0;
    viewerCiz();
    document.getElementById("ajViewer").hidden = false;
  }catch(e){ hataGoster("Görüntüleyici açılamadı: " + e.message); }
}

function viewerKapat(){
  document.getElementById("ajViewer").hidden = true;
  takvimiCiz();
  seciliGunuCiz();
}

function viewerCiz(){
  var fotoEl = document.getElementById("ajViewerFoto");
  var altEl = document.getElementById("ajViewerAlt");
  var bosEl = document.getElementById("ajViewerBos");
  var oncekiBtn = document.getElementById("btnAjViewerOnceki");
  var sonrakiBtn = document.getElementById("btnAjViewerSonraki");
  var silBtn = document.getElementById("btnAjViewerSil");

  if(ajViewerListe.length === 0){
    fotoEl.hidden = true;
    bosEl.hidden = false;
    altEl.textContent = "";
    oncekiBtn.disabled = true; sonrakiBtn.disabled = true; silBtn.hidden = true;
    return;
  }
  bosEl.hidden = true;
  fotoEl.hidden = false;
  silBtn.hidden = false;

  var k = ajViewerListe[ajViewerIndex];
  fotoEl.src = k.url;

  var gunKayitlari = ajViewerListe.filter(function(x){ return x.tarih === k.tarih; });
  var kacinci = 1;
  for(var i=0; i<gunKayitlari.length; i++){ if(gunKayitlari[i].id === k.id){ kacinci = i+1; break; } }

  var parca = k.tarih.split("-");
  var gosterim = parca[2] + " " + AY_ADLARI[parseInt(parca[1],10)-1] + " " + parca[0];
  var saat = new Date(k.zaman).toLocaleTimeString("tr-TR", {hour:"2-digit", minute:"2-digit"});
  altEl.innerHTML = "<b>" + gosterim + "</b> — Sayfa " + kacinci + "/" + gunKayitlari.length + " · " + saat;

  oncekiBtn.disabled = ajViewerIndex <= 0;
  sonrakiBtn.disabled = ajViewerIndex >= ajViewerListe.length - 1;
}

function viewerOnceki(){ if(ajViewerIndex > 0){ ajViewerIndex--; viewerCiz(); } }
function viewerSonraki(){ if(ajViewerIndex < ajViewerListe.length - 1){ ajViewerIndex++; viewerCiz(); } }

function viewerSil(){
  if(ajViewerListe.length === 0) return;
  var k = ajViewerListe[ajViewerIndex];
  if(!confirm("Bu sayfa fotoğrafı silinsin mi? Bu işlem geri alınamaz.")) return;
  var silBtn = document.getElementById("btnAjViewerSil");
  silBtn.disabled = true;
  AjandaData.fotografSil(k.tarih, k.id, k.yol, function(basarili, err){
    silBtn.disabled = false;
    if(!basarili){ hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata")); return; }
    ajViewerListe.splice(ajViewerIndex, 1);
    if(ajViewerListe.length === 0){ viewerKapat(); return; }
    if(ajViewerIndex >= ajViewerListe.length) ajViewerIndex = ajViewerListe.length - 1;
    viewerCiz();
  });
}

// Kaydırma (swipe) — basit yatay eşik, dikey kaydırmayla karışmasın diye
// yatay hareket dikeyden belirgin fazlaysa tetiklenir.
var ajDokunusX = null, ajDokunusY = null;
function viewerDokunusBasladi(ev){
  var t = ev.touches && ev.touches[0];
  if(!t) return;
  ajDokunusX = t.clientX; ajDokunusY = t.clientY;
}
function viewerDokunusBitti(ev){
  if(ajDokunusX === null) return;
  var t = ev.changedTouches && ev.changedTouches[0];
  if(!t){ ajDokunusX = null; return; }
  var dx = t.clientX - ajDokunusX;
  var dy = t.clientY - ajDokunusY;
  ajDokunusX = null; ajDokunusY = null;
  if(Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
  if(dx < 0) viewerSonraki(); else viewerOnceki();
}

// ——— FOTOĞRAF ÇEK ———
function fotografCekTiklandi(){
  document.getElementById("ajFotoSecici").click();
}
function fotografSecildi(file){
  if(!file) return;
  var hedefTarih = seciliGunAnahtari || bugununTarihAnahtari();
  var btn = document.getElementById("btnAjFotoCek");
  btn.classList.add("aj-cek-btn--yukleniyor");
  btn.textContent = "⏳ Yükleniyor...";
  resimSikistir(file, function(dataUrl){
    if(!dataUrl){
      btn.classList.remove("aj-cek-btn--yukleniyor");
      btn.innerHTML = "<span class='aj-cek-ikon'>📷</span>Fotoğraf Çek";
      hataGoster("Fotoğraf işlenemedi, tekrar dener misin?");
      return;
    }
    AjandaData.fotografEkle(hedefTarih, dataUrl, function(basarili, err){
      btn.classList.remove("aj-cek-btn--yukleniyor");
      btn.innerHTML = "<span class='aj-cek-ikon'>📷</span>Fotoğraf Çek";
      if(!basarili){
        hataGoster("Fotoğraf kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        return;
      }
      if(!seciliGunAnahtari){
        seciliGunAnahtari = hedefTarih;
        var parcaH = hedefTarih.split("-");
        goruntulenenYil = parseInt(parcaH[0], 10);
        goruntulenenAy = parseInt(parcaH[1], 10) - 1;
      }
      takvimiCiz();
      seciliGunuCiz();
    });
  });
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  var simdi = new Date();
  goruntulenenYil = simdi.getFullYear();
  goruntulenenAy = simdi.getMonth();
  seciliGunAnahtari = bugununTarihAnahtari();

  var btnMenuEl = document.getElementById("btnMenu");
  if(btnMenuEl) btnMenuEl.onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("btnAySecAc").onclick = function(){
    aySecPopupDoldur();
    document.getElementById("ajAySecOverlay").hidden = false;
  };
  document.getElementById("btnAjAySecKapat").onclick = function(){
    document.getElementById("ajAySecOverlay").hidden = true;
  };
  document.getElementById("ajGunFiltre").onchange = function(){
    var deger = this.value; // "YYYY-MM-DD"
    if(!deger) return;
    var parca = deger.split("-");
    goruntulenenYil = parseInt(parca[0], 10);
    goruntulenenAy = parseInt(parca[1], 10) - 1;
    seciliGunAnahtari = deger;
    takvimiCiz();
    seciliGunuCiz();
  };
  document.getElementById("ajGunFiltre").value = seciliGunAnahtari;

  document.getElementById("btnAjFotoCek").onclick = fotografCekTiklandi;
  document.getElementById("ajFotoSecici").addEventListener("change", function(){
    var file = this.files && this.files[0];
    fotografSecildi(file);
    this.value = "";
  });

  document.getElementById("btnAjViewerKapat").onclick = viewerKapat;
  document.getElementById("btnAjViewerOnceki").onclick = viewerOnceki;
  document.getElementById("btnAjViewerSonraki").onclick = viewerSonraki;
  document.getElementById("btnAjViewerSil").onclick = viewerSil;
  var govdeEl = document.getElementById("ajViewerGovde");
  govdeEl.addEventListener("touchstart", viewerDokunusBasladi, {passive:true});
  govdeEl.addEventListener("touchend", viewerDokunusBitti, {passive:true});

  if(typeof AjandaData !== "undefined"){
    AjandaData.degistiginde(function(){
      takvimiCiz();
      seciliGunuCiz();
    });
  }

  takvimiCiz();
  seciliGunuCiz();
});
