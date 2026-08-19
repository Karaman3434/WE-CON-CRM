var globalProductCatalog = [];
var basket = [];
var ilerletilenSurecKaynagi = null; // {tip, ts} - açık süreç ilerletilirken kaynak kayıt, arşive kaydedince otomatik bağlanır
var aktarilanUrun = null;
var elleUrunEkleModu = false; // true iken hesaplaPopupModal, kataloğa kayıtlı olmayan/bedelsiz bir ürünü elle eklemek için açılmıştır
var hareketListesi = [];
// ============================================================================
// TİPOGRAFİ SİSTEMİ — WEICON ASİST v1 (2026)
// Google Material Design 3'ün Display/Headline/Title/Body/Label mantığından
// esinlenerek, saha-satış için büyütülmüş taban boyutlarımıza uyarlandı.
// Yeni eklenen HER ekran/popup, mümkün olduğunca bu 5 sabit seviyeden birini
// kullanmalı — rastgele ara boyutlar (17px, 23px, 26px vb.) yaratmaktan kaçının.
//   VURGU/SAYI  : 45px — para rakamları, KM değeri (en önemli sayılar)
//   BAŞLIK      : 30px — popup başlıkları, ekran adları
//   GÖVDE       : 22px — müşteri adı, açıklama, form alanı (asıl içerik)
//   ETİKET      : 16px, BÜYÜK HARF — "TARİH", "MÜŞTERİ BİLGİSİ" gibi kısa başlıklar
//   YARDIMCI    : 13px — ID kodları, tarih/saat damgası (ikincil bilgi)
// Büyük harf SADECE Etiket seviyesinde kullanılır — isim/not/adres gibi serbest
// metinler normal (karışık) harfle kalır, okunabilirlik için.
// ============================================================================

var APP_VERSION = "V1908261337-540";
// Kart/tabela fotoğrafını okuyan VE anomali analizini yapan ortak Cloudflare Worker adresi.
// Kurulum rehberindeki adımları tamamladıktan sonra buraya kendi Worker URL'ini yapıştır.
// Örn: "https://weicon-ai.SENIN-KULLANICI-ADIN.workers.dev"
var WEICON_AI_WORKER_URL = "https://weiconai-ukhwe673dq-uc.a.run.app";
var WEICON_MAIL_WORKER_URL = "https://us-central1-weicon-asist.cloudfunctions.net/weiconMailGonder";
var KART_OKUMA_URL = "";
var secilenMod = null;
var KDV_ORANI = parseFloat(localStorage.getItem("weicon_kdv_orani")) || 20;

function veriYonetimiPopupAc(){
  document.getElementById("veriYonetimiModal").style.display="flex";
}

function tumVeriyiYedekle(){
  var musteriler = lsGet("weicon_musteriler",[]);
  var arsiv = lsGet("weicon_arsiv",{});
  var yedek = {
    yedekTarihi: new Date().toISOString(),
    kdvOrani: KDV_ORANI,
    musteriler: musteriler,
    arsiv: arsiv
  };
  var blob = new Blob([JSON.stringify(yedek, null, 2)], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  var bugun = new Date();
  var tarihStr = bugun.getFullYear()+"-"+String(bugun.getMonth()+1).padStart(2,"0")+"-"+String(bugun.getDate()).padStart(2,"0");
  a.href = url;
  a.download = "WEICON_ASIST_Yedek_"+tarihStr+".json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  lsSet("weicon_son_yedek_ts", Date.now());
  showToast("Yedek indirildi: "+musteriler.length+" müşteri, "+((arsiv.siparis||[]).length+(arsiv.teklif||[]).length+(arsiv.proforma||[]).length+(arsiv.numune||[]).length)+" işlem kaydı.", 5000);
}

function yedekHatirlaticiKontrolEt(){
  var sonTs = lsGet("weicon_son_yedek_ts", 0);
  var gun = sonTs ? Math.floor((Date.now()-sonTs)/86400000) : null;
  if(gun===null || gun>=7){
    var bugunStr = new Date().toDateString();
    var sonGosterimGun = lsGet("weicon_yedek_uyari_son_gosterim", "");
    if(sonGosterimGun === bugunStr) return; // bugün zaten gösterildi, tekrar gösterme
    lsSet("weicon_yedek_uyari_son_gosterim", bugunStr);
    var mesaj = gun===null
      ? "💾 Henüz hiç yedek almadınız. Verilerinizi korumak için ana sayfadan yedek alın."
      : "💾 Son yedeğiniz "+gun+" gün önce alınmış. Güncel bir yedek almanızı öneririz.";
    setTimeout(function(){ showToast(mesaj, 6000); }, 1200);
  }
}

// Haftada bir, uygulama açıldığında sessizce (kullanıcıyı rahatsız etmeden)
// Firebase Storage'a otomatik yedek alır. Elle indirilen yedeğin yerini tutmaz,
// ek bir güvenlik ağıdır — "yanlışlıkla bir şey sildim" durumunda geri dönüş sağlar.
function otomatikYedekKontrolEt(){
  if(!window.fbUploadYedek) return;
  var sonTs = lsGet("weicon_son_otomatik_yedek_ts", 0);
  var gun = sonTs ? Math.floor((Date.now()-sonTs)/86400000) : null;
  if(gun!==null && gun<7) return; // henüz zamanı gelmedi
  var musteriler = lsGet("weicon_musteriler",[]);
  var arsiv = lsGet("weicon_arsiv",{});
  var yedek = {
    yedekTarihi: new Date().toISOString(),
    otomatik: true,
    kdvOrani: KDV_ORANI,
    musteriler: musteriler,
    arsiv: arsiv,
    kmTakip: (typeof kmTakipKayitlariObj!=="undefined") ? kmTakipKayitlariObj : {}
  };
  var bugun = new Date();
  var yil = bugun.getFullYear();
  var ay = String(bugun.getMonth()+1).padStart(2,"0");
  var gunStr = String(bugun.getDate()).padStart(2,"0");
  var dosyaAdi = yil+"/"+ay+"/WEICON_Yedek_"+yil+"-"+ay+"-"+gunStr+"_"+Date.now()+".json";
  window.fbUploadYedek(JSON.stringify(yedek), dosyaAdi).then(function(){
    lsSet("weicon_son_otomatik_yedek_ts", Date.now());
    console.log("✓ Otomatik yedek alındı:", dosyaAdi);
  }).catch(function(e){
    console.error("Otomatik yedek hatası", e);
  });
}

function kdvOraniDegistir(){
  var yeni = prompt("KDV oranını girin (%):", KDV_ORANI);
  if(yeni===null) return;
  var sayi = parseFloat(String(yeni).replace(",","."));
  if(isNaN(sayi) || sayi<0 || sayi>100){ showToast("Geçersiz oran."); return; }
  KDV_ORANI = sayi;
  localStorage.setItem("weicon_kdv_orani", sayi);
  var etiketler = document.querySelectorAll(".kdv-orani-goster");
  for(var i=0;i<etiketler.length;i++) etiketler[i].textContent = sayi;
  if(typeof hesapla==="function") hesapla();
  showToast("KDV oranı %"+sayi+" olarak güncellendi.");
}
var activeCurrentPage = 8;
var STORAGE_KEY = "wemosa_v8_catalog";
var demoCatalog = [
  {"berta":"11002400","abas":"10000047","name":"Cinko Sprey 400ml","price":"12.26"},
  {"berta":"10050005","abas":"10000020","name":"Plastik-Metal B Recine 0.5kg","price":"36.28"}
];

/* R003.2 State Manager */
const AppState={
  basket: basket,
  hareketListesi: hareketListesi,
  seciliMusteri: null
};

function validateText(v,maxLen){
  v=String(v||"").trim();
  if(v.length>maxLen) v=v.substring(0,maxLen);
  return v.replace(/[<>]/g,"");
}



/* R003.3 Performance */
function debounce(fn,delay){
  let t;
  return function(){
    clearTimeout(t);
    const args=arguments;
    t=setTimeout(()=>fn.apply(this,args),delay);
  }
}

window.__APP_STARTED__=false;
window.onload = function(){
  if(window.__APP_STARTED__) return;
  window.__APP_STARTED__=true;
  window.addEventListener("resize", function(){ if(typeof hareketTabloKaydirmaKontrol==="function") hareketTabloKaydirmaKontrol(); });


  // Tüm popup'ları (id'si "Modal" ile biten div'ler) otomatik izler ve her açılışını
  // KRONOLOJİK SIRAYLA modalYigini listesine ekler. "Geri" tuşu bu geçmişi adım adım
  // geri sararak önceki adımı olduğu gibi tekrar görünür kılar. Bir popup kendi Kapat
  // tuşuyla (Geri'ye uğramadan) kapatılırsa, yığının tepesindeyse oradan da düşürülür —
  // aksi halde çok sonra alakasız bir ekrandayken Geri o eski popup'ı canlandırabilirdi.
  document.querySelectorAll('div[id$="Modal"]').forEach(function(el){
    var gozlemci = new MutationObserver(function(){
      var gorunur = el.style.display && el.style.display !== "none";
      if(gorunur){
        var sonKayit = modalYigini[modalYigini.length-1];
        if(!sonKayit || sonKayit.id !== el.id){
          modalYigini.push({id:el.id, display:el.style.display});
          if(modalYigini.length > 60) modalYigini.shift();
        }
      } else {
        // Bu popup kapatıldı. "Geri" tuşuyla kapatıldıysa geriGit() zaten kendi
        // popladığı için burada yığının tepesi artık bu id'yle eşleşmez (ardışık
        // aynı id yığına asla eklenmediğinden). Ama kullanıcı bu popup'ı KENDİ Kapat
        // tuşuyla (Geri'ye hiç uğramadan) kapattıysa, o popup hâlâ yığının tepesinde
        // durur — bu durumda onu da yığından düşürüyoruz ki "Geri" tuşu çok sonra,
        // alakasız bir ekrandayken bu kapatılmış popup'ı tekrar canlandırmasın.
        var tepe = modalYigini[modalYigini.length-1];
        if(tepe && tepe.id === el.id) modalYigini.pop();
      }
    });
    gozlemci.observe(el, {attributes:true, attributeFilter:["style"]});
  });

  // Tarih göster
  var aylar=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  var gunler=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  var bugun=new Date();
  var tarihStr=gunler[bugun.getDay()]+", "+bugun.getDate()+" "+aylar[bugun.getMonth()]+" "+bugun.getFullYear();
  document.getElementById("gunTarihi").textContent=tarihStr;
  var bannerTarihEl = document.getElementById("bildirimBannerTarih");
  if(bannerTarihEl) bannerTarihEl.textContent = tarihStr;
  var kdvEtiketler = document.querySelectorAll(".kdv-orani-goster");
  for(var ki=0;ki<kdvEtiketler.length;ki++) kdvEtiketler[ki].textContent = KDV_ORANI;
  loadCatalogFromMemory();
  // Bugünün araç KM kaydı girilip girilmediğini (kilit kontrolü için) önce yerel
  // önbellekten anında oku — Firebase senkronizasyonu biraz sonra bunu tazeleyecek.
  kmTakipKayitlariObj = lsGet("weicon_km_kayitlari", {});
  document.getElementById("searchInput").addEventListener("input", debounce(performFilter,200));
  document.getElementById("jsonFileInput").addEventListener("change", processJsonUpload);
  hesapla();
  musteriSeritiGuncelle();
  yedekHatirlaticiKontrolEt();
  setTimeout(function(){ otomatikYedekKontrolEt(); }, 4000);
  gorevleriYukle(function(){
    bildirimBannerGuncelle();
    gorevHatirlatmaKontrolEt();
  });
  bildirimBannerGuncelle();
  if(window.bekleyenSenkronRozetGuncelle) window.bekleyenSenkronRozetGuncelle();
  setTimeout(function(){ haftalikTakipOtomatikKontrol(); }, 1900);
  aramaGecmisiniGoster();
  switchTab(8);
  // Kur otomatik güncelleme
  setTimeout(kurOtomatikKontrol, 1000);
  // Eski kayıtlara (kod alanı olmayan) geriye dönük benzersiz kod atama — bir kereye mahsus
  setTimeout(eskiKayitlaraKodAta, 2500);

  // Firebase hazır olunca müşteri ve arşiv verilerini çek
  function firebasdenYukle(){
    if(window.fbDinle){
      // Müşteri listesi - gerçek zamanlı dinle, tüm cihazlar anında güncellenir
      window.fbDinle("musteriler", function(data){
        if(data){
          if(Array.isArray(data)) musteriListesi=data;
          else musteriListesi=Object.values(data);
        } else { musteriListesi=[]; }
        musteriIdEksikleriTamamla();
        lsSet("weicon_musteriler", musteriListesi);
        if(activeCurrentPage===7) musteriListesiniRenderEt();
        // Müşteri verisi (dolayısıyla şehir bilgisi) güncellenince Son İşlemler
        // tablosundaki şehir sütunu da tazelensin — önceden bu eksikti, bu yüzden
        // tablo müşteri listesi henüz gelmeden çizildiyse şehir hep "-" kalıyordu.
        if(activeCurrentPage===6 && typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
      });
      // Arşiv - gerçek zamanlı dinle
      window.fbDinle("arsiv", function(data){
        if(data){
          arsivData=data;
          if(!arsivData.siparis) arsivData.siparis=[];
          if(!arsivData.proforma) arsivData.proforma=[];
          if(!arsivData.teklif) arsivData.teklif=[];
          if(!arsivData.numune) arsivData.numune=[];
        } else {
          arsivData={numune:[],teklif:[],proforma:[],siparis:[]};
        }
        lsSet("weicon_arsiv", arsivData);
        if(activeCurrentPage===6){ arsivSayaclariGuncelle(); if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt(); }
        if(activeCurrentPage===7) musteriListesiniRenderEt();
        if(activeCurrentPage===8) anaSayfaRenderEt();
      });
      // Araç KM kaydı - gerçek zamanlı dinle (kilit kontrolü bu veriye bakıyor)
      window.fbDinle("kmTakip", function(data){
        var yeniVeri = data || {};
        // GÜVENLİK AĞI: Sunucudan gelen veri, bu cihazda (telefonda) hâlihazırda
        // bilinen günlerden BELİRGİN ŞEKİLDE AZ ise (örn. sunucu boş/eksik bir
        // anlık görüntü döndürdüyse), bunu ŞÜPHELİ sayıp kabul ETMİYORUZ —
        // telefondaki bilinen veriyi koruyoruz. Bu, geçmişte yaşanan "sunucudan
        // gelen eksik veri, telefondaki sağlam geçmişin üzerine yazıldı" türü bir
        // kaybı BİR DAHA yaşamamak için eklendi. Normal küçük farklar (1-2 gün)
        // sorun değil, sadece büyük/ani düşüşler reddediliyor.
        var mevcutGunSayisi = Object.keys(kmTakipKayitlariObj||{}).length;
        var yeniGunSayisi = Object.keys(yeniVeri).length;
        if(mevcutGunSayisi>=5 && yeniGunSayisi < mevcutGunSayisi*0.5){
          console.error("⚠️ KM verisi şüpheli şekilde küçüldü ("+mevcutGunSayisi+" → "+yeniGunSayisi+" gün), sunucu verisi REDDEDİLDİ, telefondaki veri korunuyor.");
          if(typeof showToast==="function") showToast("⚠️ KM verisinde tutarsızlık algılandı, cihazdaki veri korundu.", 4000);
          return;
        }
        kmTakipKayitlariObj = yeniVeri;
        lsSet("weicon_km_kayitlari", kmTakipKayitlariObj);
      });
      // Kur - gerçek zamanlı dinle, bir cihazda değişen kur tüm cihazlara anında yansır
      window.fbDinle("kur", function(data){
        if(data && data.deger){
          var kurInput = document.getElementById("kur");
          if(kurInput && kurInput.value !== data.deger){
            kurInput.value = data.deger;
            hesapla();
            localStorage.setItem("weicon_kur", data.deger);
            localStorage.setItem("weicon_kur_zaman", data.zaman||Date.now());
            anaKurDegerGuncelle(data.deger);
          }
        }
      });
    }
  }

  if(window.firebaseHazir){
    firebasdenYukle();
  } else {
    window.addEventListener("firebaseHazir", firebasdenYukle);
  }
};

function showToast(m, sure){
  var t=document.getElementById("toast");
  t.innerText=m; t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); }, sure||2200);
}

var _undoToastTimer = null;
function showUndoToast(mesaj, geriAlFonksiyonu){
  var kutu = document.getElementById("undoToast");
  var msgEl = document.getElementById("undoToastMesaj");
  var btn = document.getElementById("undoToastBtn");
  msgEl.textContent = mesaj;
  kutu.style.opacity = "1";
  kutu.style.transform = "translateX(-50%) translateY(0)";
  kutu.style.pointerEvents = "auto";
  btn.onclick = function(){
    geriAlFonksiyonu();
    gizleUndoToast();
  };
  if(_undoToastTimer) clearTimeout(_undoToastTimer);
  _undoToastTimer = setTimeout(gizleUndoToast, 5000);
}
function gizleUndoToast(){
  var kutu = document.getElementById("undoToast");
  kutu.style.opacity = "0";
  kutu.style.transform = "translateX(-50%) translateY(20px)";
  kutu.style.pointerEvents = "none";
}

/* ============================================================
   ARAMA GEÇMİŞİ
============================================================ */
var aramaGecmisi = lsGet("weicon_arama_gecmisi",[]);

function aramaGecmisiKaydet(q){
  if(!q || q.length < 2) return;
  aramaGecmisi = lsGet("weicon_arama_gecmisi",[]);
  // Zaten varsa başa taşı
  aramaGecmisi = aramaGecmisi.filter(function(a){ return a !== q; });
  aramaGecmisi.unshift(q);
  // Son 10 aramayı tut
  if(aramaGecmisi.length > 10) aramaGecmisi = aramaGecmisi.slice(0,10);
  lsSet("weicon_arama_gecmisi", aramaGecmisi);
  aramaGecmisiniGoster();

  // "En Çok Aranan Ürünler" tablosu için sıklık sayacı (küçük/büyük harf duyarsız)
  var qKucuk = q.toLocaleLowerCase("tr-TR");
  var frekans = lsGet("weicon_arama_frekans", {});
  frekans[qKucuk] = frekans[qKucuk] || {metin:q, sayi:0};
  frekans[qKucuk].sayi += 1;
  frekans[qKucuk].metin = q; // en son yazılan hâliyle göster
  lsSet("weicon_arama_frekans", frekans);
}

function aramaGecmisiniGoster(){
  aramaGecmisi = lsGet("weicon_arama_gecmisi",[]);
  var div = document.getElementById("aramaGecmisiDiv");
  if(!div) return;
  if(aramaGecmisi.length === 0){ div.innerHTML=""; return; }
  var html = '<div style="font-size:16px;color:#555;margin-bottom:6px;font-weight:900;">Son Aramalar:</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
  for(var i=0; i<aramaGecmisi.length; i++){
    html += '<button onclick="aramaSecGeçmis(\''+aramaGecmisi[i]+'\')" '
      +'style="background:#e8f4fd;color:#003a70;border:1px solid #003a70;padding:8px 16px;'
      +'border-radius:20px;font-size:22px;font-weight:900;cursor:pointer;">'
      +aramaGecmisi[i]+'</button>';
  }
  html += '</div>';
  div.innerHTML = html;
}

function aramaSecGeçmis(q){
  document.getElementById("searchInput").value = q;
  requestAnimationFrame(function(){performFilter();});
}

// HİT ÜRÜNLER — tüm SİPARİŞ kayıtlarından ürünlerin toplam satılan adedini hesaplayıp
// en çok satılandan aza doğru sıralar.
function hitUrunleriHesapla(){
  var arsiv = lsGet("weicon_arsiv", {});
  var siparisler = arsiv.siparis || [];
  var sayac = {};
  siparisler.forEach(function(s){
    (s.urunler||[]).forEach(function(u){
      var key = (u.berta||"")+"|"+(u.abas||"")+"|"+(u.name||"");
      if(!sayac[key]) sayac[key] = {ad:u.name||"", berta:u.berta||"", abas:u.abas||"", fiyat:u.listeFiyat||0, adet:0, siparisSayisi:0};
      sayac[key].adet += (parseFloat(u.adet)||0);
      sayac[key].siparisSayisi += 1;
      if(u.listeFiyat) sayac[key].fiyat = u.listeFiyat; // en son görülen liste fiyatı kullanılır
    });
  });
  return Object.keys(sayac).map(function(k){ return sayac[k]; }).sort(function(a,b){ return b.adet-a.adet; });
}

// Hit Ürünler listesinden bir ürüne dokununca — Hesapla ekranını açmadan
// doğrudan sepete ekler, popup açık kalır (art arda birden fazla ürün eklenebilsin).
function hitUrundenSepeteEkle(name, price, berta, abas){
  var mevcut = null;
  for(var i=0;i<basket.length;i++){
    if(basket[i].berta===berta && basket[i].abas===abas){ mevcut = basket[i]; break; }
  }
  if(mevcut){
    mevcut.quantity = (mevcut.quantity||1)+1;
  } else {
    var id = "hit_"+Date.now()+"_"+Math.random().toString(36).substr(2,4);
    basket.push({id:id, name:name, price:safeNumber(price,0), berta:berta, abas:abas, quantity:1});
    sonKullanilanKaydet(id,name,safeNumber(price,0),berta,abas);
  }
  updateBasketCount();
  showToast("✓ "+name+" sepete eklendi.");
}

// ÜRÜN SATIŞ GEÇMİŞİ — "Hit Ürünler"de bir ürünün "📊 Geçmiş" butonuna basınca:
// bu ürün BUGÜNE KADAR hangi müşterilere, hangi tarihte, hangi fiyat/iskontoyla
// satılmış/teklif edilmiş — tek bakışta gösterir. SAP Business One'daki "Last
// Selling Price" ve Sage 50'deki "Item Sales History By Customer" mantığı.
// Salt-okunur: hiçbir yeni veri kaydetmez, sadece arşivi (kayit.urunler[])
// ürün bazında yeniden gruplar.
// Müşteri ID'sinden (M-0030 gibi) doğrudan Müşteri Kartı'nı açan yardımcı —
// arşiv kayıtları musteriKartIdx (dizideki sıra) değil musteriId (kalıcı kod)
// sakladığı için, index her zaman ID'den yeniden bulunmalı.
function musteriKartAcId(musteriId){
  if(!musteriId) return;
  for(var i=0;i<musteriListesi.length;i++){
    if(musteriListesi[i].id===musteriId){
      document.getElementById("urunSatisGecmisiModal").style.display="none";
      var ubk = document.getElementById("urunIstatistikModal"); if(ubk) ubk.style.display="none";
      musteriKartAc(i);
      return;
    }
  }
  showToast("⚠️ Müşteri bulunamadı (silinmiş olabilir).");
}

function urunSatisGecmisiGetir(berta, abas){
  var arsiv = lsGet("weicon_arsiv", {});
  var tipler = ["siparis","teklif","proforma","numune"];
  var sonuc = [];
  for(var t=0;t<tipler.length;t++){
    var liste = arsiv[tipler[t]]||[];
    for(var k=0;k<liste.length;k++){
      var kayit = liste[k];
      if(!kayit.urunler) continue;
      for(var j=0;j<kayit.urunler.length;j++){
        var u = kayit.urunler[j];
        var eslesiyorMu = berta ? (u.berta===berta && u.abas===abas) : false;
        if(eslesiyorMu){
          sonuc.push({
            musteri: kayit.musteri||"-", musteriId: kayit.musteriId||null,
            tarih: kayit.tarih||"", ts: kayit.ts||0, tip: tipler[t],
            adet: u.a
