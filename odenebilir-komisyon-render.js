/*
  odenebilir-komisyon-render.js — VERSİYON: WG.270926.2245.651
  ================================================================
  27.09.2026 yeniden tasarım:
  1) "1. Fotoğraf" ve "2. Fotoğraf" — açık maaş dönemi için sabit iki
     slot. Kutuya dokununca dosya seçilir, Tesseract.js (cihaz üzerinde)
     ile OCR yapılır, düzenlenebilir tabloya doldurulur — onaylamadan
     HİÇBİR ŞEY kaydedilmez. Fotoğrafın kendisi de (küçültülüp
     sıkıştırılarak) kaydedilir, kutucukta görünsün diye.
  2) Brüt Prim, 2. Fotoğraf toplamı ile 1. Fotoğraf toplamı arasındaki
     farktan otomatik hesaplanır (maas-ortak-hesap.js üzerinden) — ikisi
     de AYNI açık dönem için olduğundan ay karışıklığı imkansız.
  3) Ay kapanınca (Maaş Hesaplama'dan) bu iki slot otomatik sıfırlanır.
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

var AY_ADLARI = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function fmtTL(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2});
}

function bugununTarihAnahtari(){
  var d = new Date();
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}

function tarihAnahtariniOku(anahtar){
  var p = anahtar.split("-");
  return p[2] + " " + AY_ADLARI[parseInt(p[1],10)] + " " + p[0];
}

// Tesseract'ın ham metninden Ay -> Ödenebilir Komisyon eşleşmesini çıkarır.
// Kural: satırın İLK BİRKAÇ kelimesi içinde 1-12 arası TEK BAŞINA bir sayı
// varsa, ondan SONRAKİ tüm parasal görünümlü sayılardan (1.234,56 kalıbı)
// SONUNCUSU alınır — merkez tablosunda "Ödenebilir Komisyon" her zaman EN
// SAĞDAKİ (dolayısıyla satırda en son geçen) sütundur.
function ocrMetniniAyristir(metin){
  var sonuc = {};
  var sayiKalibi = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;
  metin.split("\n").forEach(function(satir){
    var tokenlar = satir.trim().split(/\s+/).filter(Boolean);
    var ay = null, ayIndex = -1;
    for(var i=0; i<Math.min(tokenlar.length, 3); i++){
      if(/^\d{1,2}$/.test(tokenlar[i])){
        var aday = parseInt(tokenlar[i], 10);
        if(aday>=1 && aday<=12){ ay = aday; ayIndex = i; break; }
      }
    }
    if(ay===null) return;
    var kalanMetin = tokenlar.slice(ayIndex+1).join(" ");
    var sayilar = kalanMetin.match(sayiKalibi);
    if(!sayilar || sayilar.length === 0) return;
    var sonSayiStr = sayilar[sayilar.length - 1];
    var sayisalDeger = parseFloat(sonSayiStr.replace(/\./g, "").replace(",", "."));
    if(isNaN(sayisalDeger)) return;
    sonuc[ay] = sayisalDeger;
  });
  return sonuc;
}

// Seçilen fotoğrafı kutucukta göstermek için küçültüp JPEG olarak
// sıkıştırır (maks. 900px genişlik, %60 kalite) — Firebase'e hafif gitsin.
function resimSikistir(file, geriBildir){
  try{
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        try{
          var maxGenislik = 900;
          var olcek = Math.min(1, maxGenislik / img.width);
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * olcek));
          canvas.height = Math.max(1, Math.round(img.height * olcek));
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          geriBildir(canvas.toDataURL("image/jpeg", 0.6));
        }catch(e){ geriBildir(null); }
      };
      img.onerror = function(){ geriBildir(null); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ geriBildir(null); };
    reader.readAsDataURL(file);
  }catch(e){ geriBildir(null); }
}

function girisTablosunuDoldur(aylar){
  var govde = document.getElementById("okGirisTabloGovde");
  govde.innerHTML = "";
  for(var ay=1; ay<=12; ay++){
    var deger = (aylar && aylar[ay]!==undefined) ? aylar[ay] : "";
    var tr = document.createElement("tr");
    tr.innerHTML = "<td class='ok-giris-ay-hucre'>" + ay + " · " + AY_ADLARI[ay] + "</td>"
      + "<td><input type='text' inputmode='decimal' data-ay='" + ay + "' value='" + (deger===""?"":fmtTL(deger)) + "' placeholder='0,00'></td>";
    govde.appendChild(tr);
  }
  document.getElementById("okDuzenlemeAlani").hidden = false;
  document.getElementById("okTarihGiris").value = bugununTarihAnahtari();
}

function ocrCalistir(dosya){
  var durumEl = document.getElementById("okOcrDurum");
  durumEl.hidden = false;
  durumEl.className = "ok-ocr-durum ok-ocr-durum--calisiyor";
  durumEl.textContent = "⏳ Metin okunuyor (cihaz üzerinde, birkaç saniye sürebilir)...";

  if(typeof Tesseract === "undefined"){
    durumEl.className = "ok-ocr-durum ok-ocr-durum--hata";
    durumEl.textContent = "✕ OCR modülü yüklenemedi (internet bağlantısını kontrol et). Elle de doldurabilirsin:";
    girisTablosunuDoldur({});
    return;
  }

  Tesseract.recognize(dosya, "eng")
    .then(function(sonuc){
      var aylar = ocrMetniniAyristir(sonuc.data.text);
      var bulunanSayisi = Object.keys(aylar).length;
      if(bulunanSayisi === 0){
        durumEl.className = "ok-ocr-durum ok-ocr-durum--hata";
        durumEl.textContent = "✕ Hiçbir satır okunamadı — görüntü net değil olabilir. Aşağıdan elle doldurabilirsin.";
      } else {
        durumEl.className = "ok-ocr-durum ok-ocr-durum--basarili";
        durumEl.textContent = "✓ " + bulunanSayisi + "/12 satır okundu — aşağıda MUTLAKA kontrol edip onayla (özellikle eksi işaretli/negatif değerler OCR tarafından kaçırılabilir).";
      }
      girisTablosunuDoldur(aylar);
    })
    .catch(function(err){
      durumEl.className = "ok-ocr-durum ok-ocr-durum--hata";
      durumEl.textContent = "✕ Okuma başarısız: " + (err.message||"bilinmeyen hata") + " — elle doldurabilirsin.";
      girisTablosunuDoldur({});
    });
}

// AKTİF DÜZENLEME — hangi slot ("birinci"/"ikinci") üzerinde çalışıldığı
// ve o slota ait sıkıştırılmış fotoğraf (henüz kaydedilmedi).
var okAktifSlot = null;
var okAktifResim = null;

function slotEtiketiUret(slot){ return slot === "birinci" ? "1. Fotoğraf" : "2. Fotoğraf"; }
function slotInputId(slot){ return slot === "birinci" ? "okFotoSeciciBirinci" : "okFotoSeciciIkinci"; }

function fotoKutusunaTiklandi(slot){
  var d = typeof KomisyonDonemData !== "undefined" ? KomisyonDonemData.gecerliDonem() : null;
  var mevcut = d && d[slot];
  if(mevcut){
    if(!confirm(slotEtiketiUret(slot) + "'ı değiştirmek istediğine emin misin? Mevcut fotoğraf ve rakamlar yerine yenisi kaydedilecek.")) return;
  }
  document.getElementById(slotInputId(slot)).click();
}

function fotoSecildi(slot, file){
  okAktifSlot = slot;
  okAktifResim = null;
  document.getElementById("okDuzenlemeSlotEtiket").textContent = slotEtiketiUret(slot) + " olarak kaydedilecek";
  resimSikistir(file, function(dataUrl){ okAktifResim = dataUrl; });
  ocrCalistir(file);
}

function onaylaTiklandi(){
  try{
    if(!okAktifSlot){ alert("Önce bir fotoğraf seç."); return; }
    var tarihAnahtari = document.getElementById("okTarihGiris").value;
    if(!tarihAnahtari){ alert("Lütfen bir tarih seç."); return; }
    var aylar = {};
    document.querySelectorAll("#okGirisTabloGovde input").forEach(function(inp){
      var ay = inp.getAttribute("data-ay");
      var deger = parseFloat((inp.value||"0").replace(/\./g,"").replace(",","."));
      aylar[ay] = isNaN(deger) ? 0 : deger;
    });
    var acik = MaasKayitData.acikDonem();
    var donemAnahtari = KomisyonDonemData.donemAnahtariUret(acik.ay, acik.yil);
    var kayit = {tarih: tarihAnahtari, aylar: aylar, resim: okAktifResim || null, kayitZamani: Date.now()};
    var btn = document.getElementById("btnOkOnayla");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    KomisyonDonemData.slotKaydet(donemAnahtari, okAktifSlot, kayit, function(basarili, err){
      btn.disabled = false; btn.textContent = "✓ Bu Kaydı Onayla ve Kaydet";
      if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata")); return; }
      document.getElementById(slotInputId(okAktifSlot)).value = "";
      document.getElementById("okDuzenlemeAlani").hidden = true;
      document.getElementById("okOcrDurum").hidden = true;
      okAktifSlot = null; okAktifResim = null;
    });
  }catch(e){ hataGoster("Onaylama başarısız: " + e.message); }
}

function iptalTiklandi(){
  if(okAktifSlot) document.getElementById(slotInputId(okAktifSlot)).value = "";
  document.getElementById("okDuzenlemeAlani").hidden = true;
  document.getElementById("okOcrDurum").hidden = true;
  okAktifSlot = null; okAktifResim = null;
}

// 1./2. FOTOĞRAF KUTULARINI ÇİZ
function kutulariCiz(){
  try{
    if(typeof KomisyonDonemData === "undefined") return;
    var d = KomisyonDonemData.gecerliDonem();
    ["birinci","ikinci"].forEach(function(slot){
      var kayit = d && d[slot];
      var idOnEk = slot === "birinci" ? "Birinci" : "Ikinci";
      var resimEl = document.getElementById("okFotoResim" + idOnEk);
      var tarihEl = document.getElementById("okFotoTarih" + idOnEk);
      var kutuEl = document.getElementById("okFotoKutu" + idOnEk);
      if(kayit){
        kutuEl.classList.add("ok-foto-kutu--dolu");
        if(kayit.resim){
          resimEl.innerHTML = "";
          resimEl.style.backgroundImage = "url('" + kayit.resim + "')";
        } else {
          resimEl.style.backgroundImage = "";
          resimEl.innerHTML = "<span class='ok-foto-kutu-ikon'>🖼️</span>";
        }
        tarihEl.textContent = tarihAnahtariniOku(kayit.tarih);
      } else {
        kutuEl.classList.remove("ok-foto-kutu--dolu");
        resimEl.style.backgroundImage = "";
        resimEl.innerHTML = "<span class='ok-foto-kutu-ikon'>📷</span>";
        tarihEl.textContent = "Yüklenmedi";
      }
    });
  }catch(e){ hataGoster("Fotoğraf kutuları çizilemedi: " + e.message); }
}

// BRÜT PRİM → NET PRİM (27.09.2026, revize) — 1./2. Fotoğraf farkından.
function fmtTL_BN(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
}
function fmtOranSadece_BN(brut, net){
  if(!brut) return "%0,00 kesinti";
  var oran = (brut-net)/brut*100;
  return "%" + oran.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " kesinti";
}

function farkGoster(){
  try{
    if(typeof MaasKayitData === "undefined" || typeof MaasOrtakHesap === "undefined") return;
    var acik = MaasKayitData.acikDonem();
    var etiketMetni = AY_ADLARI[acik.ay] + " " + acik.yil;
    document.getElementById("okDonemEtiket").textContent = etiketMetni;
    document.getElementById("bnDonemEtiket").textContent = etiketMetni;

    var h = MaasOrtakHesap.hesapla(acik.ay, acik.yil);
    var bekle = document.getElementById("bnBekleBanner");
    var tablo = document.getElementById("bnFarkTablo");
    var toplamSerit = document.getElementById("bnToplamFarkSerit");
    var netAlt = document.getElementById("bnNetAlt");

    if(!h.komisyonTamMi){
      bekle.hidden = false; tablo.hidden = true; toplamSerit.hidden = true; netAlt.hidden = true;
      return;
    }
    bekle.hidden = true;

    var d = KomisyonDonemData.gecerliDonem();
    var satirlar = "";
    for(var ay=1; ay<=12; ay++){
      var b = (d.birinci.aylar && d.birinci.aylar[ay]) || 0;
      var i = (d.ikinci.aylar && d.ikinci.aylar[ay]) || 0;
      var fark = i - b;
      if(Math.abs(fark) < 0.01) continue;
      var sinif = fark >= 0 ? "ok-fark-pozitif" : "ok-fark-negatif";
      var isaret = fark >= 0 ? "+" : "";
      satirlar += "<tr><td>" + ay + " · " + AY_ADLARI[ay] + "</td><td>" + fmtTL(b) + "</td><td>" + fmtTL(i) + "</td><td class='" + sinif + "'>" + isaret + fmtTL(fark) + "</td></tr>";
    }
    document.getElementById("bnFarkTabloGovde").innerHTML = satirlar || "<tr><td colspan='4' style='text-align:center;color:#8a8f98;'>Değişiklik yok.</td></tr>";
    tablo.hidden = false;

    var toplamFark = h.brutPrimHam;
    document.getElementById("bnToplamFarkDeger").textContent = (toplamFark>=0?"+":"") + fmtTL(toplamFark) + " TL";
    toplamSerit.hidden = false;

    document.getElementById("bnPrimKesintiOran").textContent = fmtOranSadece_BN(h.sonuc.brutPrim, h.sonuc.netPrim);
    document.getElementById("bnNetPrimDeger").textContent = fmtTL_BN(h.sonuc.netPrim);
    netAlt.hidden = false;
  }catch(e){ hataGoster("Brüt/Net Prim gösterilemedi: " + e.message); }
}

// AÇIK DÖNEM KONTROLÜ — bir önceki ay kapatıldıysa (Maaş Hesaplama'dan)
// 1./2. Fotoğraf'ı otomatik sıfırlar; MaasKayitData/KomisyonDonemData
// değiştiğinde de ekranı yeniden çizer.
function donemKontrolVeCiz(){
  try{
    if(typeof MaasKayitData === "undefined" || typeof KomisyonDonemData === "undefined") return;
    var acik = MaasKayitData.acikDonem();
    KomisyonDonemData.acikDonemleSenkronizeEt(acik.ay, acik.yil, function(){
      kutulariCiz();
      farkGoster();
    });
  }catch(e){ hataGoster("Dönem kontrolü başarısız: " + e.message); }
}

// DÖNEM BARI (27.09.2026) — 0 = açık/canlı dönem (yukarıdaki gibi
// düzenlenebilir, fotoğraf yüklenebilir), 1+ = MaasKayitData.tumKayitlar()
// [ofset-1] (kapanmış dönem — sadece o an kaydedilmiş Brüt/Net Prim
// sonucu salt okunur gösterilir; fotoğraflar kapanan dönemler için hiç
// saklanmaz, bkz. komisyon-donem-data.js).
var okGezinmeOfset = 0;

function okDuzenlemeGorunurlugunuAyarla(gorunurMu){
  var satir = document.getElementById("okFotoSatir");
  if(satir) satir.hidden = !gorunurMu;
  document.getElementById("okKapaliNot").hidden = gorunurMu;
  if(!gorunurMu){
    document.getElementById("okDuzenlemeAlani").hidden = true;
    document.getElementById("okOcrDurum").hidden = true;
  }
}

function okKapaliKaydiGoster(k){
  okDuzenlemeGorunurlugunuAyarla(false);
  var etiketMetni = AY_ADLARI[k.ay] + " " + k.yil;
  document.getElementById("okDonemBtnMetin").textContent = etiketMetni;
  document.getElementById("okDonemEtiket").textContent = etiketMetni;
  document.getElementById("bnDonemEtiket").textContent = etiketMetni;

  document.getElementById("bnBekleBanner").hidden = true;
  document.getElementById("bnFarkTablo").hidden = true;

  var brutPrim = k.brutPrim || 0;
  document.getElementById("bnToplamFarkDeger").textContent = (brutPrim>=0?"+":"") + fmtTL(brutPrim) + " TL";
  document.getElementById("bnToplamFarkSerit").hidden = false;

  document.getElementById("bnPrimKesintiOran").textContent = fmtOranSadece_BN(brutPrim, k.netPrim);
  document.getElementById("bnNetPrimDeger").textContent = fmtTL_BN(k.netPrim);
  document.getElementById("bnNetAlt").hidden = false;
}

function okGorunumCiz(){
  if(typeof MaasKayitData === "undefined") return;
  var kayitlar = MaasKayitData.tumKayitlar();
  if(okGezinmeOfset > kayitlar.length) okGezinmeOfset = kayitlar.length;
  if(okGezinmeOfset < 0) okGezinmeOfset = 0;

  var btnOnceki = document.getElementById("okDonemOncekiBtn");
  var btnSonraki = document.getElementById("okDonemSonrakiBtn");
  if(btnOnceki) btnOnceki.hidden = (okGezinmeOfset >= kayitlar.length);
  if(btnSonraki) btnSonraki.hidden = (okGezinmeOfset === 0);

  if(okGezinmeOfset === 0){
    okDuzenlemeGorunurlugunuAyarla(true);
    donemKontrolVeCiz();
  } else {
    okKapaliKaydiGoster(kayitlar[okGezinmeOfset - 1]);
  }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  var btnMenuEl = document.getElementById("btnMenu");
  if(btnMenuEl) btnMenuEl.onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("okFotoKutuBirinci").onclick = function(){ fotoKutusunaTiklandi("birinci"); };
  document.getElementById("okFotoKutuIkinci").onclick = function(){ fotoKutusunaTiklandi("ikinci"); };
  document.getElementById("okFotoSeciciBirinci").addEventListener("change", function(){
    if(this.files && this.files[0]) fotoSecildi("birinci", this.files[0]);
  });
  document.getElementById("okFotoSeciciIkinci").addEventListener("change", function(){
    if(this.files && this.files[0]) fotoSecildi("ikinci", this.files[0]);
  });
  document.getElementById("btnOkOnayla").onclick = onaylaTiklandi;
  document.getElementById("btnOkIptal").onclick = iptalTiklandi;

  document.getElementById("okDonemOncekiBtn").onclick = function(){ okGezinmeOfset++; okGorunumCiz(); };
  document.getElementById("okDonemSonrakiBtn").onclick = function(){ okGezinmeOfset--; okGorunumCiz(); };
  (function(){
    var bar = document.getElementById("okDonemBar");
    var baslangicX = null, baslangicY = null;
    bar.addEventListener("touchstart", function(ev){
      var t = ev.touches[0];
      baslangicX = t.clientX; baslangicY = t.clientY;
    }, {passive:true});
    bar.addEventListener("touchend", function(ev){
      if(baslangicX == null) return;
      var t = ev.changedTouches[0];
      var dx = t.clientX - baslangicX, dy = t.clientY - baslangicY;
      baslangicX = null; baslangicY = null;
      if(Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)*1.5) return;
      if(dx > 0){ okGezinmeOfset++; } else { okGezinmeOfset--; }
      okGorunumCiz();
    }, {passive:true});
  })();

  try{ KomisyonDonemData.degistiginde(function(){ if(okGezinmeOfset===0){ kutulariCiz(); farkGoster(); } }); }catch(e){}
  try{ MaasKayitData.degistiginde(function(){ okGorunumCiz(); }); }catch(e){}
  okGorunumCiz();
});
