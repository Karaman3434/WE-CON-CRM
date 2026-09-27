/*
  maas-hesaplama-render.js — VERSİYON: WG.270926.2200.650
  ==========================================================
  MAAŞ HESAPLAMA (ÖZET) sayfası — 27.09.2026 mimari bölünmesi. Bu sayfa
  artık kendi Brüt Sabit Maaş / Brüt Prim hesaplamasını yapmıyor; Net
  Maaş ve Net Prim'i MaasOrtakHesap.hesapla() üzerinden okur (Net Maaş
  sayfası ve Ödenebilir Komisyon'un Brüt/Net Prim bölümü de AYNI çağrıyı
  yapıyor, bu yüzden üç sayfadaki rakamlar hep tutarlı kalır). Avans/diğer
  kesinti hâlâ bu sayfada okunur — Avans Takibi sayfasından (kapalı kayıt
  varsa onu, yoksa açık taslağı) otomatik gelir. "GEÇERLİ AYIN HESABI
  KAPANDI" hem Maaş kaydını hem — hâlâ açıksa — aynı ayın Avans Takibi'ni
  senkron kapatır. Tek kapat noktası burasıdır.
*/

var AY_ADLARI_MH = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var mhGuncelHesap = null; // en son mhHesaplaVeCiz() çıktısı — Kayıt Et bunu kullanır

function fmtTL_MH(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
}

function tarihiGuncelle_MH(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI_MH[d.getMonth()+1] + " " + d.getFullYear();
  }catch(e){}
}

function mhAcikDonemEtiketiGuncelle(){
  var acik = MaasKayitData.acikDonem();
  var etiket = document.getElementById("mhDonemBtnMetin");
  if(etiket) etiket.textContent = AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("mhKartBaslikAy").textContent = AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("btnAyiKayitEt").textContent = "✓ GEÇERLİ AYIN HESABI KAPANDI";
  return acik;
}

// DÖNEM BARI — 0 = açık/canlı dönem (mhHesaplaVeCiz ile canlı hesaplanır),
// 1+ = MaasKayitData.tumKayitlar()[ofset-1] (kapanmış kayıt, salt okunur).
var mhGezinmeOfset = 0;

function mhDuzenlemeGorunurlugunuAyarla(gorunurMu){
  document.getElementById("btnAyiKayitEt").hidden = !gorunurMu;
  document.getElementById("btnMhKapaliKaydiSil").hidden = gorunurMu;
  document.getElementById("mhKapaliSerit").hidden = gorunurMu;
}

// Avans Takibi'nden bu ay/yıl için toplamları okur: önce KAPALI kayda bakar
// (kesin), yoksa AÇIK TASLAĞA (henüz kapatılmadı notuyla).
function mhAvansToplamlariniOku(ay, yil){
  var kapali = null;
  try{ kapali = AvansKayitData.kapaliKaydiBul(ay, yil); }catch(e){}
  var veri, taslakMi = false;
  if(kapali){
    veri = kapali;
  } else {
    taslakMi = true;
    try{ veri = AvansKayitData.taslakOku(ay, yil); }catch(e){ veri = {ozelAvansGirisleri:[], isAvansiGirisleri:[], isAvansiHarcamalar:[]}; }
  }
  var ozelToplam = (veri.ozelAvansGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var isToplam = (veri.isAvansiGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var belgelenenToplam = (veri.isAvansiHarcamalar||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var isKesilecek = Math.max(0, isToplam - belgelenenToplam);
  var toplamKesinti = ozelToplam + isKesilecek;
  return {ozelToplam:ozelToplam, isKesilecek:isKesilecek, toplamKesinti:toplamKesinti, taslakMi:taslakMi, kapaliVarMi: !!kapali};
}

function mhKapaliKaydiGoster(k){
  mhDuzenlemeGorunurlugunuAyarla(false);
  var etiket = document.getElementById("mhDonemBtnMetin");
  if(etiket) etiket.textContent = AY_ADLARI_MH[k.ay] + " " + k.yil;
  document.getElementById("mhKartBaslikAy").textContent = AY_ADLARI_MH[k.ay] + " " + k.yil;
  document.getElementById("mhOzetBrutSabitAlt").textContent = "Brüt: " + fmtTL_MH(k.brutSabitAylik);
  document.getElementById("mhOzetNetMaas").textContent = fmtTL_MH(k.netSabitMaas);
  document.getElementById("mhOzetBrutPrimAlt").textContent = "Brüt: " + fmtTL_MH(k.brutPrim);
  document.getElementById("mhOzetNetPrim").textContent = fmtTL_MH(k.netPrim);
  document.getElementById("mhKartNetToplam").textContent = fmtTL_MH(k.netToplam);
  document.getElementById("mhKartHesabaYatacak").textContent = fmtTL_MH(k.hesabaYatacak);
  var av = mhAvansToplamlariniOku(k.ay, k.yil);
  document.getElementById("mhOzetAvansToplam").textContent = fmtTL_MH(av.toplamKesinti);
  document.getElementById("mhOzetAvansDurum").textContent = av.kapaliVarMi ? "✓ Kapatıldı." : "Kayıt yok.";
  document.getElementById("btnMhKapaliKaydiSil").setAttribute("data-anahtar", k.anahtar);
}

function mhGorunumCiz(){
  var kayitlar = MaasKayitData.tumKayitlar();
  if(mhGezinmeOfset > kayitlar.length) mhGezinmeOfset = kayitlar.length;
  if(mhGezinmeOfset < 0) mhGezinmeOfset = 0;

  var btnOnceki = document.getElementById("mhDonemOncekiBtn");
  var btnSonraki = document.getElementById("mhDonemSonrakiBtn");
  if(btnOnceki) btnOnceki.hidden = (mhGezinmeOfset >= kayitlar.length);
  if(btnSonraki) btnSonraki.hidden = (mhGezinmeOfset === 0);

  if(mhGezinmeOfset === 0){
    mhDuzenlemeGorunurlugunuAyarla(true);
    mhHesaplaVeCiz();
  } else {
    mhKapaliKaydiGoster(kayitlar[mhGezinmeOfset - 1]);
  }
}

function mhHesaplaVeCiz(){
  var acik = mhAcikDonemEtiketiGuncelle();
  var h = MaasOrtakHesap.hesapla(acik.ay, acik.yil);
  var sonuc = h.sonuc;

  document.getElementById("mhOzetBrutSabitAlt").textContent = "Brüt: " + fmtTL_MH(h.brutSabit);
  document.getElementById("mhOzetNetMaas").textContent = fmtTL_MH(sonuc.netSabitMaas);
  document.getElementById("mhOzetBrutPrimAlt").textContent = "Brüt: " + fmtTL_MH(h.brutPrim);
  document.getElementById("mhOzetNetPrim").textContent = fmtTL_MH(sonuc.netPrim);
  document.getElementById("mhKartNetToplam").textContent = fmtTL_MH(sonuc.netToplam);

  var av = mhAvansToplamlariniOku(acik.ay, acik.yil);
  document.getElementById("mhOzetAvansToplam").textContent = fmtTL_MH(av.toplamKesinti);
  document.getElementById("mhOzetAvansDurum").textContent = av.kapaliVarMi
    ? "✓ Avans Takibi bu dönem için kapatıldı."
    : (av.taslakMi && (av.ozelToplam||av.isKesilecek) ? "⏳ Taslak var, henüz kapatılmadı." : "Kayıt yok.");

  var hesabaYatacak = sonuc.netToplam - av.toplamKesinti;
  document.getElementById("mhKartHesabaYatacak").textContent = fmtTL_MH(hesabaYatacak);

  mhGuncelHesap = {
    acik: acik, brutSabit: h.brutSabit, komisyonToplam: h.komisyonToplam, brutPrim: h.brutPrim,
    sonuc: sonuc, avans: av, hesabaYatacak: hesabaYatacak
  };
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_MH();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  mhGorunumCiz();

  document.getElementById("mhDonemOncekiBtn").onclick = function(){ mhGezinmeOfset++; mhGorunumCiz(); };
  document.getElementById("mhDonemSonrakiBtn").onclick = function(){ mhGezinmeOfset--; mhGorunumCiz(); };
  (function(){
    var bar = document.getElementById("mhDonemBar");
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
      if(dx > 0){ mhGezinmeOfset++; } else { mhGezinmeOfset--; }
      mhGorunumCiz();
    }, {passive:true});
  })();

  document.getElementById("btnMhKapaliKaydiSil").onclick = function(){
    var anahtar = this.getAttribute("data-anahtar");
    if(!anahtar) return;
    if(!confirm("Bu kaydı silmek istediğine emin misin? Bu, sonraki dönemin referans noktasını da etkileyebilir.")) return;
    MaasKayitData.kaydiSil(anahtar, function(basarili, err){
      if(!basarili){ alert("Silinemedi: " + (err && err.message)); return; }
      mhGezinmeOfset = 0;
      mhGorunumCiz();
    });
  };

  document.getElementById("btnAyiKayitEt").onclick = function(){
    if(mhGezinmeOfset !== 0) return; // sadece açık/canlı dönem kapatılabilir
    if(!mhGuncelHesap) return;
    var h = mhGuncelHesap;
    var avansUyari = h.avans.kapaliVarMi ? "" : "\n\nNot: Avans Takibi bu dönem için henüz kapatılmadı — onu da otomatik kapatacağım.";
    if(!confirm(AY_ADLARI_MH[h.acik.ay] + " " + h.acik.yil + " dönemini kapatmak istediğine emin misin?\n\nHesaba Yatacak: " + fmtTL_MH(h.hesabaYatacak) + avansUyari)) return;
    if(!confirm("Kesin olarak kapatılsın mı? Bu işlem geri alınamaz.\n\nKayıt edildikten sonra sistem otomatik bir sonraki aya geçer.")) return;

    document.getElementById("btnAyiKayitEt").disabled = true;

    function maasiKaydet(){
      var kayitObj = {
        ay: h.acik.ay, yil: h.acik.yil,
        brutSabitAylik: h.brutSabit,
        brutPrim: h.brutPrim,
        komisyonReferansToplam: h.komisyonToplam,
        toplamKesinti: h.avans.toplamKesinti,
        netSabitMaas: h.sonuc.netSabitMaas,
        netPrim: h.sonuc.netPrim,
        netToplam: h.sonuc.netToplam,
        hesabaYatacak: h.hesabaYatacak,
        kayitZamani: Date.now()
      };
      MaasKayitData.kaydet(kayitObj, function(basarili, err){
        document.getElementById("btnAyiKayitEt").disabled = false;
        if(!basarili){ alert("Kaydedilemedi: " + (err && err.message)); return; }
        // Kalibrasyonu otomatik ilerlet: artık bu ayın sonu itibariyle
        // kümülatif matrah biliniyor — bir dahaki sefere elle girmesin.
        var yeniBaz = {matrah: h.sonuc.kumulatifMatrahSimdi, ay: h.acik.ay, yil: h.acik.yil};
        try{ AyarlarSync.matrahBazKaydet(yeniBaz); }catch(e){}
        localStorage.setItem("weicon_matrah_baz", JSON.stringify(yeniBaz));
        mhGezinmeOfset = 0;
        // MaasKayitData.degistiginde dinleyicisi mhGorunumCiz'i tetikleyecek.
      });
    }

    // Avans Takibi aynı ay için hâlâ açıksa (kapalı kaydı yoksa), önce onu
    // senkron kapatıp SONRA Maaş kaydını yazıyoruz.
    if(!h.avans.kapaliVarMi){
      var taslak = AvansKayitData.taslakOku(h.acik.ay, h.acik.yil);
      var avansKayitObj = {
        ay: h.acik.ay, yil: h.acik.yil,
        ozelAvansGirisleri: taslak.ozelAvansGirisleri||[],
        isAvansiGirisleri: taslak.isAvansiGirisleri||[],
        isAvansiHarcamalar: taslak.isAvansiHarcamalar||[],
        ozelAvansToplam: h.avans.ozelToplam,
        isAvansiBelgesizKalan: h.avans.isKesilecek,
        toplamKesinti: h.avans.toplamKesinti,
        kayitZamani: Date.now()
      };
      AvansKayitData.kaydet(avansKayitObj, function(basariliAv, errAv){
        if(!basariliAv){ document.getElementById("btnAyiKayitEt").disabled=false; alert("Avans Takibi kapatılamadı: " + (errAv && errAv.message)); return; }
        maasiKaydet();
      });
    } else {
      maasiKaydet();
    }
  };

  try{ KomisyonData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
  try{ MaasKayitData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
  try{ AvansKayitData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
});
