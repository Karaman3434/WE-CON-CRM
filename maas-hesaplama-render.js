/*
  maas-hesaplama-render.js — VERSİYON: WG.270926.2245.651
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

// "Avans Seçimi" (02.10.2026, Abdullah'ın isteğiyle) — bkz. dosya başındaki
// genel açıklama ve avans-kayit-data.js'teki bekleyenKayitlar()/
// dahilEdildiginiIsaretle(). Bu üç değişken SADECE açık/canlı dönem için
// geçerlidir; dönem değişince (kapatma sonrası veya sayfa yeniden
// açıldığında) otomatik sıfırlanır — bkz. mhHesaplaVeCiz.
var mhSonAcikAnahtar = null;
var mhKendiAvansDahilMi = true;      // bu ayın kendi (canlı) avansı otomatik dahil mi?
var mhSeciliBekleyenAnahtarlar = []; // bu kapanışa EK olarak seçilen geçmiş avans kayıtları

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

// CANLI (açık) dönem için avans toplamlarını HER ZAMAN Avans Takibi'nin
// açık taslağından okur (27.09.2026 senkron düzeltmesi) — eski kod önce
// AvansKayitData.kapaliKaydiBul'a bakıyordu; Avans Takibi kendi bağımsız
// zincirinde o ay için eski/kalıntı bir "kapalı" kayıt varsa (örn. bu ay
// Maaş Hesaplama'da hâlâ açıkken), burada yanlışlıkla "kapatıldı, 0,00 TL"
// gösteriliyor ve iki sayfa birbirini tutmuyordu. Açık dönem için TEK
// doğru kaynak her zaman canlı taslaktır.
function mhAvansCanliOku(ay, yil){
  var taslak;
  try{ taslak = AvansKayitData.taslakOku(ay, yil); }catch(e){ taslak = {ozelAvansGirisleri:[], isAvansiGirisleri:[], isAvansiHarcamalar:[]}; }
  var ozelToplam = (taslak.ozelAvansGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var isToplam = (taslak.isAvansiGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var belgelenenToplam = (taslak.isAvansiHarcamalar||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var isKesilecek = Math.max(0, isToplam - belgelenenToplam);
  var toplamKesinti = ozelToplam + isKesilecek;
  return {ozelToplam:ozelToplam, isKesilecek:isKesilecek, toplamKesinti:toplamKesinti};
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
  // Kapanmış dönem: rakam artık bu kayıtta SAKLI (o an kapatılırken
  // hesaplanmış toplamKesinti) — Avans Takibi'nin bugünkü/güncel taslağına
  // hiç bakılmaz, çünkü o taslak zaten kapatılırken sıfırlandı/silindi.
  document.getElementById("mhOzetAvansToplam").textContent = fmtTL_MH(k.toplamKesinti);
  document.getElementById("mhOzetAvansDurum").textContent = "✓ Kapatıldı.";
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
  var acikAnahtar = acik.yil + "-" + ("0"+acik.ay).slice(-2);
  // Dönem değiştiyse (kapatma sonrası ilerledik, veya sayfa yeniden açıldı)
  // "Avans Seçimi" tercihlerini varsayılana döndür — eski ayın seçimleri
  // yeni açık aya sızmasın.
  if(mhSonAcikAnahtar !== acikAnahtar){
    mhSonAcikAnahtar = acikAnahtar;
    mhKendiAvansDahilMi = true;
    mhSeciliBekleyenAnahtarlar = [];
  }

  var h = MaasOrtakHesap.hesapla(acik.ay, acik.yil);
  var sonuc = h.sonuc;

  document.getElementById("mhOzetBrutSabitAlt").textContent = "Brüt: " + fmtTL_MH(h.brutSabit);
  document.getElementById("mhOzetNetMaas").textContent = fmtTL_MH(sonuc.netSabitMaas);
  document.getElementById("mhOzetBrutPrimAlt").textContent = "Brüt: " + fmtTL_MH(h.brutPrim);
  document.getElementById("mhOzetNetPrim").textContent = fmtTL_MH(sonuc.netPrim);
  document.getElementById("mhKartNetToplam").textContent = fmtTL_MH(sonuc.netToplam);

  // Açık dönem her zaman CANLI taslaktan okunur — bkz. mhAvansCanliOku
  // yorumu. Bu değer "kapatıldı" diyemez, çünkü dönem henüz açık. Bu
  // satır/değer HER ZAMAN bu ayın kendi avansını gösterir (Avans Takibi'ne
  // gider) — "Avans Seçimi" aşağıdaki AYRI satırda yönetilir.
  var av = mhAvansCanliOku(acik.ay, acik.yil);
  document.getElementById("mhOzetAvansToplam").textContent = fmtTL_MH(av.toplamKesinti);
  document.getElementById("mhOzetAvansDurum").textContent = (av.ozelToplam || av.isKesilecek)
    ? "⏳ Taslak var, henüz kapatılmadı."
    : "Kayıt yok.";

  // "Avans Seçimi" (02.10.2026) — bu ayın maaşından GERÇEKTE düşülecek
  // toplam artık otomatik olarak av.toplamKesinti DEĞİL; kullanıcının
  // seçimine göre hesaplanır: kendi ayının avansı (açık/kapalı seçilebilir)
  // + geçmişten seçilen bekleyen kayıtlar.
  var bekleyen = [];
  try{ bekleyen = AvansKayitData.bekleyenKayitlar(); }catch(e){}
  var seciliToplam = bekleyen
    .filter(function(k){ return mhSeciliBekleyenAnahtarlar.indexOf(k.anahtar) !== -1; })
    .reduce(function(s,k){ return s + (k.toplamKesinti||0); }, 0);
  var kendiAvansKatkisi = mhKendiAvansDahilMi ? av.toplamKesinti : 0;
  var toplamKesintiYeni = kendiAvansKatkisi + seciliToplam;

  mhBekleyenSatiriGuncelle(bekleyen, seciliToplam, kendiAvansKatkisi);

  var hesabaYatacak = sonuc.netToplam - toplamKesintiYeni;
  document.getElementById("mhKartHesabaYatacak").textContent = fmtTL_MH(hesabaYatacak);

  mhGuncelHesap = {
    acik: acik, acikAnahtar: acikAnahtar, brutSabit: h.brutSabit, birinciToplam: h.birinciToplam, brutPrim: h.brutPrim,
    sonuc: sonuc, avans: av, bekleyenListesi: bekleyen,
    kendiAvansDahilMi: mhKendiAvansDahilMi, seciliBekleyenAnahtarlar: mhSeciliBekleyenAnahtarlar.slice(),
    toplamKesintiYeni: toplamKesintiYeni, hesabaYatacak: hesabaYatacak
  };
}

// "⏳ AVANS SEÇİMİ" satırını günceller — sadece bekleyen avans varsa veya
// kullanıcı bu ayın kendi avansını dahil etmekten vazgeçtiyse dikkat
// çekecek şekilde doldurur.
function mhBekleyenSatiriGuncelle(bekleyen, seciliToplam, kendiAvansKatkisi){
  var rozet = document.getElementById("mhBekleyenRozet");
  var alt = document.getElementById("mhBekleyenAlt");
  var deger = document.getElementById("mhBekleyenDeger");
  if(!rozet || !alt || !deger) return;

  if(bekleyen.length){
    rozet.hidden = false;
    rozet.textContent = bekleyen.length + " ay";
  } else {
    rozet.hidden = true;
  }

  if(seciliToplam > 0){
    alt.textContent = "Bu aya " + fmtTL_MH(seciliToplam) + " ekleniyor";
  } else if(bekleyen.length){
    alt.textContent = "Henüz hiçbir maaştan düşülmedi";
  } else if(!mhKendiAvansDahilMi){
    alt.textContent = "Bu ayın kendi avansı ERTELENDİ";
  } else {
    alt.textContent = "Bekleyen avans yok";
  }

  deger.textContent = fmtTL_MH(bekleyen.reduce(function(s,k){ return s+(k.toplamKesinti||0); }, 0));
}

/* ---------- Avans Seçimi sheet'i (02.10.2026) ---------- */
function mhBekleyenSheetiAc(){
  if(!mhGuncelHesap || mhGezinmeOfset !== 0) return; // sadece açık dönemde anlamlı
  mhBekleyenSheetiCiz();
  document.getElementById("mhBekleyenSheetOverlay").hidden = false;
}

function mhBekleyenSheetiCiz(){
  var h = mhGuncelHesap;

  // Bu ayın kendi (canlı) avansı — varsa, dahil et/etme seçeneği.
  var kendiAlan = document.getElementById("mhBekleyenKendiAlan");
  if(h.avans.toplamKesinti > 0){
    kendiAlan.innerHTML =
      '<label class="ba-donem-kart" style="cursor:pointer;">' +
        '<div class="ba-donem-sol">' +
          '<input type="checkbox" class="ba-checkbox" id="mhKendiAvansToggle"' + (mhKendiAvansDahilMi?" checked":"") + '>' +
          '<div class="ba-donem-metin-grup">' +
            '<span class="ba-donem-ay">' + AY_ADLARI_MH[h.acik.ay] + ' ' + h.acik.yil + ' (bu ayın kendi avansı)</span>' +
            '<span class="ba-donem-tur">Avans Takibi’ndeki güncel taslak</span>' +
          '</div>' +
        '</div>' +
        '<span class="ba-donem-tutar">' + fmtTL_MH(h.avans.toplamKesinti) + '</span>' +
      '</label>';
    document.getElementById("mhKendiAvansToggle").onchange = function(){
      mhKendiAvansDahilMi = this.checked;
      mhBekleyenOzetGuncelle();
    };
  } else {
    kendiAlan.innerHTML = "";
  }

  // Geçmişten kalan, hiçbir maaşa henüz dahil edilmemiş kayıtlar.
  var listeAlan = document.getElementById("mhBekleyenListeAlan");
  var bekleyen = h.bekleyenListesi;
  if(!bekleyen.length){
    listeAlan.innerHTML = '<p class="mh-not-kucuk">Başka bekleyen avans kaydı yok.</p>';
  } else {
    listeAlan.innerHTML = bekleyen.map(function(k){
      var secili = mhSeciliBekleyenAnahtarlar.indexOf(k.anahtar) !== -1;
      var tur = [];
      if(k.ozelAvansToplam) tur.push("Özel: " + fmtTL_MH(k.ozelAvansToplam));
      if(k.isAvansiBelgesizKalan) tur.push("İş (belgesiz): " + fmtTL_MH(k.isAvansiBelgesizKalan));
      return '<label class="ba-donem-kart" style="cursor:pointer;">' +
        '<div class="ba-donem-sol">' +
          '<input type="checkbox" class="ba-checkbox mh-bekleyen-checkbox" data-anahtar="' + k.anahtar + '"' + (secili?" checked":"") + '>' +
          '<div class="ba-donem-metin-grup">' +
            '<span class="ba-donem-ay">' + AY_ADLARI_MH[k.ay] + ' ' + k.yil + '</span>' +
            '<span class="ba-donem-tur">' + (tur.join(" + ") || "Avans") + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="ba-donem-tutar">' + fmtTL_MH(k.toplamKesinti) + '</span>' +
      '</label>';
    }).join("");
    listeAlan.querySelectorAll(".mh-bekleyen-checkbox").forEach(function(cb){
      cb.onchange = function(){
        var a = this.getAttribute("data-anahtar");
        var idx = mhSeciliBekleyenAnahtarlar.indexOf(a);
        if(this.checked && idx===-1) mhSeciliBekleyenAnahtarlar.push(a);
        if(!this.checked && idx!==-1) mhSeciliBekleyenAnahtarlar.splice(idx,1);
        mhBekleyenOzetGuncelle();
      };
    });
  }

  mhBekleyenOzetGuncelle();

  // Daha önce dahil edilmiş kayıtlar — hangi avansın hangi maaşa katıldığı.
  var gecmisBaslik = document.getElementById("mhGecmisBaslik");
  var gecmisAlan = document.getElementById("mhGecmisListeAlan");
  var gecmis = [];
  try{
    gecmis = AvansKayitData.tumKayitlar().filter(function(k){ return !!k.maasaDahilEdildigiDonem; }).slice(0, 12);
  }catch(e){}
  if(gecmis.length){
    gecmisBaslik.hidden = false;
    gecmisAlan.innerHTML = gecmis.map(function(k){
      var p = String(k.maasaDahilEdildigiDonem||"").split("-");
      var hedefMetin = (p.length===2 && AY_ADLARI_MH[parseInt(p[1],10)])
        ? (AY_ADLARI_MH[parseInt(p[1],10)] + " " + p[0])
        : k.maasaDahilEdildigiDonem;
      return '<div class="ba-gecmis-kart">' +
        '<div><div class="ba-gecmis-ay">' + AY_ADLARI_MH[k.ay] + ' ' + k.yil + '</div>' +
        '<div class="ba-gecmis-not">✓ ' + hedefMetin + ' maaşına dahil edildi</div></div>' +
        '<span class="ba-gecmis-tutar">' + fmtTL_MH(k.toplamKesinti) + '</span>' +
      '</div>';
    }).join("");
  } else {
    gecmisBaslik.hidden = true;
    gecmisAlan.innerHTML = "";
  }
}

function mhBekleyenOzetGuncelle(){
  var h = mhGuncelHesap;
  var seciliToplam = h.bekleyenListesi
    .filter(function(k){ return mhSeciliBekleyenAnahtarlar.indexOf(k.anahtar) !== -1; })
    .reduce(function(s,k){ return s + (k.toplamKesinti||0); }, 0);
  var kendiKatki = mhKendiAvansDahilMi ? h.avans.toplamKesinti : 0;
  document.getElementById("mhBekleyenSecimToplam").textContent = fmtTL_MH(kendiKatki + seciliToplam);
}

function mhBekleyenUygula(){
  document.getElementById("mhBekleyenSheetOverlay").hidden = true;
  mhGorunumCiz(); // mhKendiAvansDahilMi / mhSeciliBekleyenAnahtarlar artık güncel, yeniden hesapla
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_MH();
  var btnMenuEl = document.getElementById("btnMenu");
  if(btnMenuEl) btnMenuEl.onclick = function(){ window.location.href = "menu.html"; };
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

  document.getElementById("mhBekleyenAvansSatiri").onclick = function(){ mhBekleyenSheetiAc(); };
  document.getElementById("btnMhBekleyenKapat").onclick = function(){ document.getElementById("mhBekleyenSheetOverlay").hidden = true; };
  document.getElementById("btnMhBekleyenUygula").onclick = mhBekleyenUygula;

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

  // BAŞKA DÖNEMDE UNUTULMUŞ TASLAK KORUMASI (01.10.2026): "Ayı Kayıt Et",
  // Avans Takibi'ni kapatırken SADECE kapatılan ayın taslağını okur
  // (AvansKayitData.taslakOku(h.acik.ay, h.acik.yil)). Ama Avans Takibi
  // sayfasında ‹ › ile GEÇMİŞ bir aya gidip orada da giriş yapmak mümkün —
  // kullanıcı farkında olmadan verisini "açık/resmi" sayılan aydan FARKLI
  // bir ayın taslağına yazmış olabilir. Böyle bir durumda burası o ayı BOŞ
  // sanıp SIFIR tutarla kapatıyordu, gerçek veri ise başka bir ayda açık
  // taslak olarak öylece kalıyordu (veri KAYBOLMUYOR ama kullanıcıya
  // "silinmiş" gibi görünüyor ve yanlış rakamla kapanmış oluyordu — bkz.
  // Abdullah'ın 01.10.2026 bildirimi). Şimdi kapatmadan ÖNCE diğer
  // aylarda dolu bir taslak var mı kontrol ediyoruz; varsa işlemi
  // DURDURUP açıkça uyarıyoruz, sessizce yanlış veriyle kapatmıyoruz.
  function mhBaskaDonemdeDoluTaslakVarMi(buAy, buYil){
    try{
      var buAnahtar = buYil + "-" + ("0"+buAy).slice(-2);
      return AvansKayitData.tumTaslaklar().filter(function(t){
        if(t.anahtar === buAnahtar) return false;
        return (t.ozelAvansGirisleri||[]).length>0 || (t.isAvansiGirisleri||[]).length>0 || (t.isAvansiHarcamalar||[]).length>0;
      });
    }catch(e){ return []; }
  }

  document.getElementById("btnAyiKayitEt").onclick = function(){
    if(mhGezinmeOfset !== 0) return; // sadece açık/canlı dönem kapatılabilir
    if(!mhGuncelHesap) return;
    var h = mhGuncelHesap;

    var baskaTaslaklar = mhBaskaDonemdeDoluTaslakVarMi(h.acik.ay, h.acik.yil);
    if(baskaTaslaklar.length){
      alert(
        "⚠️ DURDURULDU — " + AY_ADLARI_MH[h.acik.ay] + " " + h.acik.yil + " dönemini kapatamıyorum.\n\n"
        + "Şu dönem(ler)de hâlâ dolu, kapatılmamış bir Avans Takibi taslağı var:\n"
        + baskaTaslaklar.map(function(t){ return "• " + AY_ADLARI_MH[t.ay] + " " + t.yil; }).join("\n")
        + "\n\nBunu şimdi kapatırsam, o taslaktaki gerçek verin görünmeden, bu ay SIFIR avans ile yanlış kapanır. "
        + "Önce Avans Takibi sayfasından o döneme gidip verini kontrol et, gerekirse Ayarlar > Bakım bölümündeki "
        + "\"Avans Dönemi Taşı\" aracıyla doğru döneme taşı, sonra buraya dönüp tekrar dene."
      );
      return;
    }

    var avansUyari = "\n\nNot: Avans Takibi bu dönem için de otomatik kapatılacak.";
    if(!confirm(AY_ADLARI_MH[h.acik.ay] + " " + h.acik.yil + " dönemini kapatmak istediğine emin misin?\n\nHesaba Yatacak: " + fmtTL_MH(h.hesabaYatacak) + avansUyari)) return;
    if(!confirm("Kesin olarak kapatılsın mı? Bu işlem geri alınamaz.\n\nKayıt edildikten sonra sistem otomatik bir sonraki aya geçer.")) return;

    document.getElementById("btnAyiKayitEt").disabled = true;

    function maasiKaydet(){
      var kayitObj = {
        ay: h.acik.ay, yil: h.acik.yil,
        brutSabitAylik: h.brutSabit,
        brutPrim: h.brutPrim,
        komisyonReferansToplam: h.birinciToplam,
        toplamKesinti: h.toplamKesintiYeni,
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
        // "Avans Seçimi" tercihlerini bir sonraki (yeni açılacak) ay için
        // varsayılana döndür.
        mhKendiAvansDahilMi = true;
        mhSeciliBekleyenAnahtarlar = [];
        mhGezinmeOfset = 0;
        // MaasKayitData.degistiginde dinleyicisi mhGorunumCiz'i tetikleyecek.
      });
    }

    // Avans Takibi'ni HER ZAMAN, o an ekranda görünen canlı taslaktan
    // TAZE bir kapalı kayıt olarak (yeniden) yazıyoruz — önceki kod bunu
    // sadece "kapalı kaydı yoksa" yapıyordu; eğer o ay için eski/kalıntı
    // bir kapalı kayıt varsa hiç dokunmuyordu ve stale veri kalabiliyordu.
    // Bu şekilde her kapatma kendi kendini onarır (self-healing).
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
    // "Avans Seçimi" (02.10.2026): bu ayın kendi avansı, kullanıcı AÇIKÇA
    // dahil ettiyse kendi ayına dahil edilmiş sayılır (varsayılan/normal
    // durum). Dahil etmediyse hiç işaretlenmez — "Bekleyen Avans" listesinde
    // kalır, ileride istediği bir aya seçerek ekleyebilir.
    if(h.kendiAvansDahilMi) avansKayitObj.maasaDahilEdildigiDonem = h.acikAnahtar;

    AvansKayitData.kaydet(avansKayitObj, function(basariliAv, errAv){
      if(!basariliAv){ document.getElementById("btnAyiKayitEt").disabled=false; alert("Avans Takibi kapatılamadı: " + (errAv && errAv.message)); return; }
      // Geçmişten bu kapanışa seçilen bekleyen avans kayıtlarını da
      // "bu aya dahil edildi" olarak işaretle (best-effort — bu adım
      // başarısız olsa bile maaş kaydı yine de tamamlanır, avans zaten
      // kapandı; kullanıcı gerekirse Avans Seçimi'nden tekrar işaretleyebilir).
      AvansKayitData.dahilEdildiginiIsaretle(h.seciliBekleyenAnahtarlar, h.acikAnahtar, function(){
        maasiKaydet();
      });
    });
  };

  try{ KomisyonDonemData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
  try{ MaasKayitData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
  try{ AvansKayitData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
});
