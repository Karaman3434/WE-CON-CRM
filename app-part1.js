// WEICON ASİST VERSİYON: W230826.1859.554 — app-part1.js
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

var APP_VERSION = "W230826.1859.554";
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
// HATA GÜVENLİK AĞI — daha önce bazı ekranlarda (özellikle Ana Sayfa) bir JS
// hatası SESSİZCE oluşup render'ın yarıda kesilmesine yol açıyordu; hata
// konsolda kalıyor, telefonda görünmüyordu. Artık yakalanmamış HER hata
// ekranda kırmızı bir toast olarak gösteriliyor — bir dahaki sefere sorun
// olursa, tam hata mesajının ekran görüntüsü teşhis için yeterli olacak.
window.__sonHatalar = [];
window.addEventListener("error", function(ev){
  try{
    var msg = "⚠️ HATA: " + (ev && ev.message ? ev.message : "bilinmeyen") +
      (ev && ev.filename ? " (" + ev.filename.split("/").pop() + ":" + ev.lineno + ")" : "");
    console.error("Yakalanmamış hata:", ev);
    window.__sonHatalar.push(new Date().toLocaleTimeString()+" "+msg);
    if(typeof showToast === "function") showToast(msg, 9000);
    else alert(msg);
  }catch(e){}
});
window.addEventListener("unhandledrejection", function(ev){
  try{
    var msg = "⚠️ HATA (promise): " + (ev && ev.reason ? (ev.reason.message || ev.reason) : "bilinmeyen");
    console.error("Yakalanmamış promise hatası:", ev);
    if(typeof showToast === "function") showToast(msg, 9000);
  }catch(e){}
});

window.onload = function(){
  if(window.__APP_STARTED__) return;
  window.__APP_STARTED__=true;
  try{
  window.addEventListener("resize", function(){ if(typeof hareketTabloKaydirmaKontrol==="function") hareketTabloKaydirmaKontrol(); });


  // Tüm popup'ları (id'si "Modal" veya "Popup" ile biten div'ler, artı
  // yeniMusteriOzet gibi kalıp dışı ama tam ekran olan tek tük istisnalar)
  // otomatik izler ve her açılışını KRONOLOJİK SIRAYLA modalYigini listesine
  // ekler. "Geri" tuşu bu geçmişi adım adım geri sararak önceki adımı olduğu
  // gibi tekrar görünür kılar. Bir popup kendi Kapat tuşuyla (Geri'ye
  // uğramadan) kapatılırsa, yığının tepesindeyse oradan da düşürülür —
  // aksi halde çok sonra alakasız bir ekrandayken Geri o eski popup'ı canlandırabilirdi.
  // (girisEkrani/pinEkrani BİLİNÇLİ OLARAK izlenmiyor — güvenlik ekranları,
  // Geri ile atlanabilir olmamalı.)
  document.querySelectorAll('div[id$="Modal"], div[id$="Popup"], #yeniMusteriOzet').forEach(function(el){
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

  // KRİTİK: Telefonun/tarayıcının FİZİKSEL geri tuşu-jesti, eskiden uygulama
  // içi Geri mantığına HİÇ bağlı değildi — basıldığında doğrudan uygulamadan
  // çıkabiliyor ya da tarayıcının kendi geçmişine gidip ortadaki bir işlemi
  // (yarım kalmış sipariş, açık bir form vb.) sessizce kaybettirebiliyordu.
  // Artık sahte bir tarayıcı geçmişi girdisi ("tuzak") kuruyoruz: fiziksel geri
  // tuşuna basılınca (popstate) uygulamadan ÇIKMAK yerine aynı geriGit()
  // çalışıyor, hemen ardından tuzak yeniden kuruluyor — kullanıcı ne kadar üst
  // üste fiziksel geri tuşuna basarsa bassın, uygulamadan asla istemeden çıkmıyor.
  try{
    history.pushState({weiconAsist:true}, "");
    window.addEventListener("popstate", function(){
      history.pushState({weiconAsist:true}, "");
      geriGit();
    });
  }catch(e){ console.error("Geri tuşu tuzağı kurulamadı:", e); }

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
  }catch(e){
    console.error("window.onload içinde hata:", e);
    try{ showToast("⚠️ AÇILIŞ HATASI: " + (e && e.message ? e.message : e), 9000); }catch(e2){ alert("Açılış hatası: " + (e && e.message ? e.message : e)); }
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
            adet: u.adet||0, iskBirim: u.iskBirim||0, iskonto: u.iskonto||0, toplamEuro: u.toplamEuro||0
          });
        }
      }
    }
  }
  sonuc.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  return sonuc;
}

function urunSatisGecmisiAc(berta, abas, ad){
  var gecmis = urunSatisGecmisiGetir(berta, abas);
  var musteriSayisi = {};
  var toplamAdet = 0;
  gecmis.forEach(function(g){ musteriSayisi[g.musteriId||g.musteri]=true; toplamAdet += g.adet; });
  var farkliMusteri = Object.keys(musteriSayisi).length;

  var html = "<div style='background:#003a70;color:#fff;padding:14px 16px;border-radius:10px 10px 0 0;'>"
    +"<div style='font-size:14px;font-weight:800;color:#7fd6ff;'>Berta: "+safeText(berta||"-")+" · Abas: "+safeText(abas||"-")+"</div>"
    +"<div style='font-size:23px;font-weight:900;'>"+safeText(ad)+"</div>"
    +"</div>"
    +"<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:#f7f9fc;border-left:1px solid #eef1f5;border-right:1px solid #eef1f5;'>"
    +"<div style='text-align:center;'><div style='font-size:24px;font-weight:900;color:#003a70;'>"+farkliMusteri+"</div><div style='font-size:11px;font-weight:800;color:#556170;'>FARKLI MÜŞTERİ</div></div>"
    +"<div style='text-align:center;'><div style='font-size:24px;font-weight:900;color:#0e6b34;'>"+toplamAdet+" adet</div><div style='font-size:11px;font-weight:800;color:#556170;'>TOPLAM SATILAN</div></div>"
    +"</div>"
    +"<div style='border:1px solid #eef1f5;border-top:none;border-radius:0 0 10px 10px;overflow:hidden;max-height:50vh;overflow-y:auto;'>";

  if(gecmis.length===0){
    html += "<div style='padding:20px;text-align:center;color:#8a97a6;font-size:16px;font-weight:700;'>Bu ürün henüz hiçbir müşteriye satılmamış/teklif edilmemiş.</div>";
  } else {
    gecmis.forEach(function(g,i){
      var zebra = (i%2===1) ? "background:#f7f9fc;" : "background:#fff;";
      var TIP_ETIKET = {siparis:"SİP", teklif:"TEK", proforma:"PRO", numune:"NUM"};
      var TIP_RENK = {siparis:"#003a70", teklif:"#1f9d55", proforma:"#8e44ad", numune:"#b7601f"};
      html += "<div onclick=\""+(g.musteriId?"musteriKartAcId('"+g.musteriId+"')":"")+"\" style='padding:11px 14px;border-bottom:1.5px solid #eef1f5;"+zebra+(g.musteriId?"cursor:pointer;":"")+"'>"
        +"<div style='display:flex;justify-content:space-between;align-items:baseline;gap:8px;'>"
        +"<span style='font-size:12px;font-weight:900;color:#fff;background:"+(TIP_RENK[g.tip]||"#556170")+";padding:2px 7px;border-radius:5px;flex-shrink:0;'>"+(TIP_ETIKET[g.tip]||"")+"</span>"
        +"<span style='font-size:19px;font-weight:900;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;'>"+safeText(g.musteri)+"</span>"
        +"<span style='font-size:12px;font-weight:700;color:#374151;flex-shrink:0;'>"+tarihKisaltTekSatir(g.tarih)+"</span>"
        +"</div>"
        +"<div style='font-size:13px;color:#374151;margin-top:3px;padding-left:38px;'>"+g.adet+" adet · "+fmt(g.iskBirim)+"€/birim · %"+g.iskonto+" iskonto</div>"
        +"</div>";
    });
  }
  html += "</div>";

  document.getElementById("urunSatisGecmisiIcerik").innerHTML = html;
  document.getElementById("urunSatisGecmisiModal").style.display = "flex";
}

function hitUrunlerAc(){
  var liste = hitUrunleriHesapla().slice(0,30);
  document.getElementById("urunIstatistikBaslik").textContent = "🔥 Hit Ürünler (en çok satılan)";
  var icerik = document.getElementById("urunIstatistikIcerik");
  if(liste.length===0){
    icerik.innerHTML = "<div style='color:#888;font-size:40px;padding:20px 0;text-align:center;'>Henüz sipariş kaydı yok.</div>";
  } else {
    var html = "<div style='color:#888;font-size:18px;text-align:center;margin-bottom:6px;'>💡 Bir ürüne dokunarak doğrudan sepete ekleyebilirsiniz.</div>"
      +"<table style='width:100%;border-collapse:collapse;'>"
      +"<tr style='background:#cfe2f3;'><th style='padding:8px;text-align:left;font-size:28px;color:#111827;border:1px solid #3569b8;'>Ürün</th><th style='padding:8px;text-align:center;font-size:28px;color:#111827;border:1px solid #3569b8;'>Toplam Adet</th><th style='padding:8px;text-align:center;font-size:22px;color:#111827;border:1px solid #3569b8;'>Satış<br>Geçmişi</th></tr>";
    liste.forEach(function(u,i){
      var safeAd = String(u.ad||"").replace(/'/g,"&#39;");
      var safeBerta = String(u.berta||"").replace(/'/g,"&#39;");
      var safeAbas = String(u.abas||"").replace(/'/g,"&#39;");
      html += "<tr style='border:1px solid #3569b8;background:#fff;'>"
        +"<td onclick=\"hitUrundenSepeteEkle('"+safeAd+"',"+(parseFloat(u.fiyat)||0)+",'"+safeBerta+"','"+safeAbas+"')\" style='cursor:pointer;padding:9px 8px;font-size:30px;font-weight:800;color:#111827;border:1px solid #3569b8;'>"+(i+1)+". "+u.ad+"<div style='font-size:22px;color:#3569b8;font-weight:700;'>Berta: "+(u.berta||"-")+" · Abas: "+(u.abas||"-")+"</div></td>"
        +"<td onclick=\"hitUrundenSepeteEkle('"+safeAd+"',"+(parseFloat(u.fiyat)||0)+",'"+safeBerta+"','"+safeAbas+"')\" style='cursor:pointer;padding:9px 8px;text-align:center;font-size:34px;font-weight:900;color:#0e6b34;border:1px solid #3569b8;'>"+u.adet+"</td>"
        +"<td onclick=\"urunSatisGecmisiAc('"+safeBerta+"','"+safeAbas+"','"+safeAd+"')\" style='cursor:pointer;padding:9px 8px;text-align:center;border:1px solid #3569b8;background:#eef4fb;'><div style='font-size:26px;font-weight:900;color:#003a70;'>📊</div><div style='font-size:14px;font-weight:800;color:#003a70;'>Geçmiş</div></td>"
        +"</tr>";
    });
    html += "</table>";
    icerik.innerHTML = html;
  }
  document.getElementById("urunIstatistikModal").style.display = "flex";
}

// EN ÇOK ARANAN — arama kutusuna yazılan terimlerin sıklığını gösterir.
function enCokAranakHesapla(){
  var frekans = lsGet("weicon_arama_frekans", {});
  return Object.keys(frekans).map(function(k){ return frekans[k]; }).sort(function(a,b){ return b.sayi-a.sayi; });
}

function enCokAranakAc(){
  var liste = enCokAranakHesapla().slice(0,30);
  document.getElementById("urunIstatistikBaslik").textContent = "🔍 En Çok Aranan Ürünler";
  var icerik = document.getElementById("urunIstatistikIcerik");
  if(liste.length===0){
    icerik.innerHTML = "<div style='color:#888;font-size:40px;padding:20px 0;text-align:center;'>Henüz arama geçmişi yok.</div>";
  } else {
    var html = "<table style='width:100%;border-collapse:collapse;'>"
      +"<tr style='background:#cfe2f3;'><th style='padding:8px;text-align:left;font-size:28px;color:#3569b8;border:1px solid #3569b8;'>Arama Terimi</th><th style='padding:8px;text-align:center;font-size:28px;color:#3569b8;border:1px solid #3569b8;'>Kaç Kez Arandı</th></tr>";
    liste.forEach(function(a,i){
      html += "<tr onclick=\"document.getElementById('urunIstatistikModal').style.display='none';document.getElementById('searchInput').value='"+a.metin.replace(/'/g,"&#39;")+"';performFilter();\" style='cursor:pointer;border:1px solid #3569b8;background:#fff;'>"
        +"<td style='padding:9px 8px;font-size:32px;font-weight:800;color:#003a70;border:1px solid #3569b8;'>"+(i+1)+". "+a.metin+"</td>"
        +"<td style='padding:9px 8px;text-align:center;font-size:34px;font-weight:900;color:#16a085;border:1px solid #3569b8;'>"+a.sayi+"</td>"
        +"</tr>";
    });
    html += "</table>";
    icerik.innerHTML = html;
  }
  document.getElementById("urunIstatistikModal").style.display = "flex";
}

// SON KULLANILAN ÜRÜNLER (en son sepete eklenen 20 ürün, tekrar tıklayınca direkt sepete eklenir)
function sonKullanilanKaydet(id,name,price,berta,abas){
  var liste = lsGet("weicon_son_kullanilan",[]);
  liste = liste.filter(function(u){ return u.id !== id; });
  liste.unshift({id:id,name:name,price:price,berta:berta,abas:abas});
  if(liste.length > 20) liste = liste.slice(0,20);
  lsSet("weicon_son_kullanilan", liste);
  sonKullanilanUrunleriGoster();
}

function sonKullanilanUrunleriGoster(){
  var div = document.getElementById("sonKullanilanUrunlerDiv");
  if(!div) return;
  var q = document.getElementById("searchInput")?document.getElementById("searchInput").value.trim():"";
  if(q.length>0){ div.innerHTML=""; return; }
  var liste = lsGet("weicon_son_kullanilan",[]);
  if(liste.length === 0){ div.innerHTML=""; return; }
  var gosterilecek = liste.slice(0,8);
  var html = '<div style="font-size:16px;color:#555;margin-bottom:6px;font-weight:900;">🕓 Son Kullanılan Ürünler:</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
  for(var i=0; i<gosterilecek.length; i++){
    var u = gosterilecek[i];
    var safeName = (u.name||"").replace(/'/g,"&#39;");
    var safeBerta = (u.berta||"").replace(/'/g,"&#39;");
    var safeAbas = (u.abas||"").replace(/'/g,"&#39;");
    html += "<button onclick=\"sonKullanilanUrunSecildi(this,'"+u.id+"','"+safeName+"',"+(parseFloat(u.price)||0)+",'"+safeBerta+"','"+safeAbas+"')\" "
      +"style='background:#e8f4fd;color:#003a70;border:1px solid #003a70;padding:8px 16px;"
      +"border-radius:20px;font-size:22px;font-weight:900;cursor:pointer;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"
      +safeText(u.name)+"</button>";
  }
  html += '</div>';
  div.innerHTML = html;
}

function sonKullanilanUrunSecildi(btn,id,name,price,berta,abas){
  for(var i=0;i<basket.length;i++){
    if(basket[i].id===id){ showToast("Ürün zaten sepette."); return; }
  }
  addToBasket(btn,id,name,price,berta,abas);
}

/* ============================================================
   TOPLU İSKONTO
============================================================ */
function topluIskontoUygula(){
  var oran = parseFloat(document.getElementById("topluIskontoInput").value);
  var mesaj = document.getElementById("topluIskontoMesaj");
  if(isNaN(oran) || oran < 0 || oran > 100){
    mesaj.textContent = "Geçersiz oran!";
    mesaj.style.color = "#e0524a";
    return;
  }
  // Sepetteki tüm ürünleri topluİskonto ile hareket listesine ekle
  if(basket.length === 0){
    mesaj.textContent = "Sepet boş!";
    mesaj.style.color = "#e0524a";
    return;
  }
  var kur = parseFloat(document.getElementById("kur")?document.getElementById("kur").value:53.29)||53.29;
  var eklenen = 0;
  var basketSnapshot = basket.slice(); // işlem sırasında sepet değişse bile tüm ürünler işlensin
  for(var i=0; i<basketSnapshot.length; i++){
    var item = basketSnapshot[i];
    var iskBirim = item.price - (item.price * oran / 100);
    var toplamEuro = iskBirim * item.quantity;
    var dipFiyat = item.price * 0.3635;
    // Zaten hareketListesinde varsa güncelle
    var varMi = false;
    for(var j=0; j<hareketListesi.length; j++){
      if(hareketListesi[j].id === item.id && hareketListesi[j].name === item.name){ varMi=true; break; }
    }
    if(!varMi){
      hareketListesi.push({
        id: item.id, name: item.name,
        berta: item.berta, abas: item.abas,
        listeFiyat: item.price, dipFiyat: dipFiyat,
        iskonto: oran, adet: item.quantity, kur: kur,
        iskBirim: iskBirim, toplamEuro: toplamEuro
      });
      eklenen++;
    }
  }
  mesaj.style.color = "#28a745";
  mesaj.textContent = eklenen+" ürün %"+oran+" isk. ile eklendi!";
  setTimeout(function(){ mesaj.textContent=""; }, 3000);
  // Tüm sepet toplu olarak işlendiği için sepeti temizle
  basket = [];
  updateBasketCount();
  if(typeof renderBasket==="function") renderBasket();
  if(typeof renderHareket==="function") renderHareket();
  showToast("✓ "+eklenen+" ürün eklendi — İletişimde toplam "+hareketListesi.length+" ürün var", 3500);
  switchTab(5);
}
var musteriListesi = [];
var gorevListesi = []; // {id, musteriAd, aciklama, tarih:"YYYY-MM-DD", saat:"HH:MM", tamamlandi:false, tamamlanmaZamani:null, olusturmaZamani}
var gorevAktifFiltre = "bekleyen";
var gorevAktifMusteriFiltre = null; // müşteri kartından açıldığında sadece o müşteriye ait görevleri gösterir
var seciliMusteri = JSON.parse(localStorage.getItem("weicon_secili_musteri")||"null");

function musteriListesiniKaydet(){
  lsSet("weicon_musteriler", musteriListesi);
}

// İki cihaz aynı anda FARKLI müşterileri düzenlerse/silerse birbirinin
// değişikliğini kaybetmesin diye: Firebase'e yazmadan hemen önce sunucudaki
// EN GÜNCEL listeyi çekip, sadece BU işlemin değişikliğini (eklenen/güncellenen
// bir müşteri ve/veya silinen bir müşteri ID'si) o güncel listenin içine
// uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local
// musteriListesi komple üzerine yazılıyordu ve diğer cihazın az önce yaptığı
// değişiklik sessizce kaybolabiliyordu.
function musteriListesiGuvenliKaydet(oncelikliMusteri, silinecekId){
  if(!window.fbSet) return Promise.reject(new Error("firebase yok"));
  if(!window.fbGet || (typeof navigator!=="undefined" && navigator.onLine===false)){
    if(typeof bekleyenIslemKaydet==="function"){
      bekleyenIslemKaydet({tur:"musteri", kayit:oncelikliMusteri||null, silinecekId:silinecekId||null});
      return Promise.resolve();
    }
    return window.fbSet("musteriler", musteriListesi);
  }
  return window.fbGet("musteriler").then(function(sunucuVerisi){
    var sunucuListe = sunucuVerisi ? (Array.isArray(sunucuVerisi)?sunucuVerisi.slice():Object.values(sunucuVerisi)) : musteriListesi.slice();
    if(silinecekId){
      sunucuListe = sunucuListe.filter(function(m){ return m && m.id !== silinecekId; });
    }
    if(oncelikliMusteri && oncelikliMusteri.id){
      var bulunduMu = false;
      for(var i=0;i<sunucuListe.length;i++){
        if(sunucuListe[i] && sunucuListe[i].id === oncelikliMusteri.id){ sunucuListe[i] = oncelikliMusteri; bulunduMu = true; break; }
      }
      if(!bulunduMu) sunucuListe.unshift(oncelikliMusteri);
    }
    return window.fbSet("musteriler", sunucuListe);
  }).catch(function(){
    // Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen
    // kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli
    // birleştirme ile tekrar denenecek (komple liste ile üzerine yazmıyoruz).
    if(typeof bekleyenIslemKaydet==="function"){
      bekleyenIslemKaydet({tur:"musteri", kayit:oncelikliMusteri||null, silinecekId:silinecekId||null});
      return Promise.resolve();
    }
    return window.fbSet("musteriler", musteriListesi);
  });
}

var aktifSehirFiltre = null; // null = hepsi

var tumMusterilerModuAktif = false;
function musteriHepsiniGoster(){
  aktifSehirFiltre = null;
  document.getElementById("sehirFiltrePanel").style.display="none";
  var durumDiv = document.getElementById("musteriFiltreDurum");
  if(durumDiv) durumDiv.style.display="none";
  tumMusterilerModuAktif = !tumMusterilerModuAktif;
  var btn = document.getElementById("tumMusterilerBtn");
  if(btn) btn.innerHTML = tumMusterilerModuAktif ? "🔽 Son Kayıtlara Dön" : "👥 Tüm Müşteriler";
  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      if(data){ musteriListesi=Array.isArray(data)?data:Object.values(data); }
      else { musteriListesi=[]; }
      lsSet("weicon_musteriler", musteriListesi);
      musteriListesiniRenderEt();
    });
  } else { musteriListesiniRenderEt(); }
}

function sehirFiltreGoster(){
  var panel = document.getElementById("sehirFiltrePanel");
  if(panel.style.display==="block"){ panel.style.display="none"; return; }
  // Şehirleri topla
  var sehirler = {};
  for(var i=0;i<musteriListesi.length;i++){
    var s = (musteriListesi[i].sehir||"").trim();
    if(s) sehirler[s] = (sehirler[s]||0)+1;
  }
  var sehirKeys = Object.keys(sehirler).sort();
  if(sehirKeys.length===0){
    showToast("Kayıtlı şehir bilgisi yok. Müşterilere şehir ekleyin.");
    return;
  }
  var html="";
  for(var j=0;j<sehirKeys.length;j++){
    var s2=sehirKeys[j];
    html+="<button onclick=\"sehireGoreFiltrele('"+s2+"')\" style='background:#8e44ad;color:#fff;border:none;padding:8px 14px;border-radius:20px;font-size:15px;font-weight:bold;cursor:pointer;margin-bottom:4px;'>"+s2+" ("+sehirler[s2]+")</button>";
  }
  document.getElementById("sehirButonlari").innerHTML=html;
  panel.style.display="block";
}

function sehireGoreFiltrele(sehir){
  aktifSehirFiltre = sehir;
  document.getElementById("sehirFiltrePanel").style.display="none";
  var durumDiv = document.getElementById("musteriFiltreDurum");
  var durumYazi = document.getElementById("musteriFiltreDurumYazi");
  if(durumDiv){ durumDiv.style.display="flex"; }
  if(durumYazi){ durumYazi.textContent="🏙 "+sehir+" müşterileri gösteriliyor"; }
  musteriListesiniRenderEt();
}

function musteriPanelAc(panel){
  var bulPanel = document.getElementById("musteriiBulPanel");
  var kaydetPanel = document.getElementById("musteriKaydetPanel");
  var btnKaydet = document.getElementById("btnMusteriKaydet");
  if(panel==="bul"){
    bulPanel.style.display="block";
    kaydetPanel.style.display="none";
    if(btnKaydet) btnKaydet.style.opacity="0.7";
    if(window.fbGet){
      window.fbGet("musteriler").then(function(data){
        if(data){ musteriListesi=Array.isArray(data)?data:Object.values(data); }
        else { musteriListesi=[]; }
        lsSet("weicon_musteriler", musteriListesi);
        musteriListesiniRenderEt();
      });
    } else { musteriListesiniRenderEt(); }
  } else {
    bulPanel.style.display="none";
    kaydetPanel.style.display="block";
    if(btnKaydet) btnKaydet.style.opacity="1";
    var ozet = document.getElementById("yeniMusteriOzet");
    if(ozet) ozet.style.display="none";
  }
}

function turkceBaslikDuzeni(str){
  if(!str) return str;
  var kucuk = str.toLocaleLowerCase("tr-TR");
  return kucuk.replace(/(^|[\s.\-\/])([a-zçğıöşü])/g, function(tam, ayrac, harf){
    return ayrac + harf.toLocaleUpperCase("tr-TR");
  });
}

function yetkiliMetniIletisimeCevir(metin){
  if(!metin) return null;
  var parcalar = metin.split(" - ").map(function(s){ return s.trim(); }).filter(Boolean);
  var sonuc = {isim:"", telefon:"", eposta:""};
  parcalar.forEach(function(p){
    if(p.indexOf("@")>-1){ sonuc.eposta = p; }
    else if(/[0-9]{6,}/.test(p.replace(/\s/g,""))){ sonuc.telefon = p; }
    else if(!sonuc.isim){ sonuc.isim = p; }
  });
  if(!sonuc.isim) sonuc.isim = parcalar[0] || metin;
  return sonuc;
}

// ============================================================
// KARTTAN/TABELADAN DOLDUR — fotoğrafı Cloud Function'a gönderir,
// dönen bilgileri Yeni Müşteri formuna doldurur. Otomatik kaydetmez,
// kullanıcı kontrol edip kendisi "KAYDET"e basar.
// ============================================================
function kartFotoAlaniniTemizle(){
  var inp=document.getElementById("kartFotoInput");
  if(inp) inp.value="";
}

function kartFotoDurumGoster(mesaj, tip, durumElId){
  var el=document.getElementById(durumElId||"kartFotoDurum");
  if(!el) return;
  var renkler = {
    yukleniyor:{bg:"#eef4fb",fg:"#003a70"},
    basarili:{bg:"#e7f8ee",fg:"#1e7145"},
    hata:{bg:"#fdeceb",fg:"#c0392b"}
  };
  var r = renkler[tip]||renkler.yukleniyor;
  el.style.background=r.bg;
  el.style.color=r.fg;
  el.textContent=mesaj;
  el.style.display="block";
}

// Genel amaçlı: bir dosyayı Cloud Function'a gönderip AI ile okunan bilgileri döndürür.
// hedef: "firma" | "yetkiliIletisim" | "teslimatAdresi" — sunucu tarafında isteme metnini yönlendirmek için.
function kartFotoGonder(dosya, hedef, durumElId, basariCB, hataCB){
  var workerUrl = WEICON_AI_WORKER_URL || KART_OKUMA_URL;
  if(!workerUrl){
    kartFotoDurumGoster("⚠️ Bu özellik henüz kurulmadı (WEICON_AI_WORKER_URL boş). Kurulum rehberine bakın.", "hata", durumElId);
    return;
  }
  kartFotoDurumGoster("⏳ Fotoğraf okunuyor, lütfen bekleyin...", "yukleniyor", durumElId);

  // Fotoğrafı (hangi formatta gelirse gelsin — HEIC, WEBP, vs.) her zaman JPEG'e
  // çevirerek gönderiyoruz; Anthropic API sadece jpeg/png/gif/webp kabul ediyor.
  kartFotoJpegeDonustur(dosya, function(base64, mediaType){
    fetch(workerUrl, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({action:"kartOku", image: base64, mediaType: mediaType, hedef: hedef||"firma"})
    })
    .then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(data){
        return {ok:r.ok, status:r.status, data:data};
      });
    })
    .then(function(sonuc){
      if(!sonuc.ok || sonuc.data.error){
        throw new Error(sonuc.data.error || ("Sunucu hatası ("+sonuc.status+")"));
      }
      // basariCB, anlamlı bir veri bulunamadıysa false döndürebilir — bu durumda
      // otomatik "başarılı" mesajı yerine uyarı gösteriyoruz (alanlar boşken bile
      // yanlışlıkla "✓ Bilgiler dolduruldu" denmesin diye).
      var bulunduMu = basariCB(sonuc.data);
      if(bulunduMu === false){
        kartFotoDurumGoster("⚠️ Fotoğrafta aranan bilgi bulunamadı — bilgileri elle girebilirsiniz.", "hata", durumElId);
      } else if(typeof bulunduMu === "string"){
        // basariCB, sadece bazı alanların bulunduğunu belirtmek için özel bir mesaj döndürmüş
        // (ör. saat bulundu ama tarih fotoğrafta görünmüyordu) — genel mesaj yerine bunu göster.
        kartFotoDurumGoster(bulunduMu, "basarili", durumElId);
      } else {
        kartFotoDurumGoster("✓ Bilgiler dolduruldu — lütfen kontrol edip kaydet.", "basarili", durumElId);
      }
    })
    .catch(function(err){
      kartFotoDurumGoster("⚠️ Okunamadı: "+err.message+" — bilgileri elle girebilirsiniz.", "hata", durumElId);
      if(hataCB) hataCB(err);
    });
  }, function(){
    kartFotoDurumGoster("⚠️ Fotoğraf okunamadı/işlenemedi, tekrar deneyin.", "hata", durumElId);
    if(hataCB) hataCB(new Error("Dosya işlenemedi"));
  });
}

// Herhangi bir görsel dosyasını (HEIC/HEIF, WEBP, PNG, vs.) canvas üzerinden
// JPEG'e çevirip base64 olarak döndürür. Böylece Anthropic API'nin kabul
// etmediği formatlarda (özellikle iPhone/bazı Android HEIC fotoğrafları) hata alınmaz.
// Tarayıcı görseli çözemezse (ör. desteklenmeyen HEIC varyantı), sessizce
// orijinal dosyayı olduğu gibi göndermeye düşer — tamamen durup hata vermek yerine.
function kartFotoJpegeDonustur(dosya, basariCB, hataCB){
  var yedekPlanaGec = function(){
    var reader = new FileReader();
    reader.onload = function(e){
      var base64 = e.target.result.split(",")[1];
      basariCB(base64, dosya.type || "image/jpeg");
    };
    reader.onerror = function(){ hataCB(); };
    reader.readAsDataURL(dosya);
  };

  var img = new Image();
  var url = URL.createObjectURL(dosya);
  img.onload = function(){
    try{
      var MAKS_KENAR = 2000; // AI okumasında küçük dijital rakamların net kalması için
      var genislik = img.naturalWidth, yukseklik = img.naturalHeight;
      if(genislik > MAKS_KENAR || yukseklik > MAKS_KENAR){
        var oran = Math.min(MAKS_KENAR/genislik, MAKS_KENAR/yukseklik);
        genislik = Math.round(genislik*oran);
        yukseklik = Math.round(yukseklik*oran);
      }
      var canvas = document.createElement("canvas");
      canvas.width = genislik;
      canvas.height = yukseklik;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0,0,genislik,yukseklik);
      ctx.drawImage(img, 0, 0, genislik, yukseklik);
      var dataUrl = canvas.toDataURL("image/jpeg", 0.93);
      URL.revokeObjectURL(url);
      basariCB(dataUrl.split(",")[1], "image/jpeg");
    }catch(e){
      URL.revokeObjectURL(url);
      yedekPlanaGec();
    }
  };
  img.onerror = function(){
    URL.revokeObjectURL(url);
    yedekPlanaGec();
  };
  img.src = url;
}

function kartFotoAlaniDoldur(id, deger){
  if(!deger) return;
  var el=document.getElementById(id);
  if(!el) return;
  el.value = deger;
  el.style.transition="background 0.3s";
  el.style.background="#fff3cd";
  setTimeout(function(){ el.style.background=""; }, 2500);
}

function kartFotoSecildi(input){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  kartFotoGonder(dosya, "firma", "kartFotoDurum", function(data){
    return kartFotoAlanDoldurTumu(data);
  });
  kartFotoAlaniniTemizle();
}

// "Yetkili İletişim Bilgileri" alanını fotoğraf/ekran görüntüsünden doldurur (Telefon + E-posta + varsa isim)
function yetkiliIletisimFotoSecildi(input, prefix){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  var durumElId = prefix+"YetkiliIletisimFotoDurum";
  kartFotoGonder(dosya, "yetkiliIletisim", durumElId, function(data){
    var isimEl = document.getElementById(prefix+"Yetkili");
    var telEl = document.getElementById(prefix+"YetkiliTelefon");
    var epostaEl = document.getElementById(prefix+"YetkiliEposta");
    if(data.yetkili && isimEl && !isimEl.value.trim()) kartFotoAlaniDoldur(prefix+"Yetkili", data.yetkili);
    if(data.telefon && telEl) kartFotoAlaniDoldur(prefix+"YetkiliTelefon", data.telefon);
    if(data.eposta && epostaEl) kartFotoAlaniDoldur(prefix+"YetkiliEposta", data.eposta);
    if(!data.telefon && !data.eposta && !data.yetkili){
      return false;
    }
  });
  input.value = "";
}

// Teslimat Adresi alanını fotoğraf/ekran görüntüsünden doldurur
function teslimatAdresiFotoSecildi(input, hedefFieldId){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  var durumElId = hedefFieldId+"FotoDurum";
  kartFotoGonder(dosya, "teslimatAdresi", durumElId, function(data){
    if(data.adres) kartFotoAlaniDoldur(hedefFieldId, data.adres);
    else return false;
  });
  input.value = "";
}

function kartFotoAlanDoldurTumu(data){
  var buluduMu = false;
  if(data.firmaAdi){ kartFotoAlaniDoldur("yeniMusteriAdi", turkceBaslikDuzeni(data.firmaAdi)); buluduMu = true; }
  if(data.sehir){ kartFotoAlaniDoldur("yeniMusteriSehir", turkceBaslikDuzeni(data.sehir)); buluduMu = true; }
  if(data.adres){ kartFotoAlaniDoldur("yeniMusteriAcikAdres", data.adres); buluduMu = true; }
  if(data.telefon){ kartFotoAlaniDoldur("yeniMusteriYetkiliTelefon", data.telefon); buluduMu = true; }
  if(data.eposta){ kartFotoAlaniDoldur("yeniMusteriYetkiliEposta", data.eposta); buluduMu = true; }
  if(data.vergiDairesi || data.vergiNo){
    kartFotoAlaniDoldur("yeniMusteriFatura", [data.vergiDairesi, data.vergiNo].filter(Boolean).join(" / "));
    buluduMu = true;
  }
  return buluduMu;
}

// ============================================================
// YENİ ÜRÜN EKLE — stoğa yeni giren ama Ürün Bul listesinde henüz
// olmayan tekil ürünleri, tüm listeyi değiştirmeden ekler.
// ============================================================
function veriYonetimindenUrunEkleAc(){
  var vModal = document.getElementById("veriYonetimiModal");
  if(vModal) vModal.style.display = "none";
  setTimeout(function(){ yeniUrunEklePopupAc(); }, 60);
}

function yeniUrunEklePopupAc(){
  document.getElementById("yeniUrunBerta").value = "";
  document.getElementById("yeniUrunAbas").value = "";
  document.getElementById("yeniUrunAdi").value = "";
  document.getElementById("yeniUrunFiyat").value = "";
  document.getElementById("yeniUrunHata").style.display = "none";
  document.getElementById("yeniUrunEkleModal").style.display = "flex";
}

function yeniUrunKaydet(){
  var berta = document.getElementById("yeniUrunBerta").value.trim().slice(0,60);
  var abas = document.getElementById("yeniUrunAbas").value.trim().slice(0,60);
  var ad = document.getElementById("yeniUrunAdi").value.trim().slice(0,200);
  var fiyat = parseFloat(document.getElementById("yeniUrunFiyat").value);
  var hataEl = document.getElementById("yeniUrunHata");

  if(!ad){ hataEl.textContent="⚠️ Ürün adı zorunlu."; hataEl.style.display="block"; return; }
  if(isNaN(fiyat) || fiyat<=0){ hataEl.textContent="⚠️ Geçerli bir fiyat girin."; hataEl.style.display="block"; return; }

  // Aynı Berta+Abas kombinasyonu zaten listede varsa uyar (mükerrer kayıt önle)
  if(berta && abas){
    var mukerrer = globalProductCatalog.some(function(it){
      var b=(it.berta||it.BERTA||"").toString().trim();
      var a=(it.abas||it.ABAS||"").toString().trim();
      return b===berta && a===abas;
    });
    if(mukerrer){
      hataEl.textContent="⚠️ Bu Berta/Abas kodu zaten listede kayıtlı. Mükerrer eklemeyi önlemek için işlem durduruldu.";
      hataEl.style.display="block";
      return;
    }
  }

  var yeniUrun = {urun:ad, berta:berta, abas:abas, fiyat:fiyat};
  var yeniIndex = globalProductCatalog.length;
  globalProductCatalog.push(yeniUrun);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(globalProductCatalog));
  performFilter();

  if(window.fbUpdate){
    var updates = {};
    updates[yeniIndex] = yeniUrun;
    window.fbUpdate(updates).then(function(){
      showToast("✓ \""+ad+"\" listeye eklendi ve Firebase'e kaydedildi (tüm cihazlarda görünecek).", 4500);
    }).catch(function(){
      showToast("✓ \""+ad+"\" eklendi ama Firebase'e gönderilemedi — sadece bu cihazda.", 5000);
    });
  } else {
    showToast("✓ \""+ad+"\" eklendi (yalnızca bu cihazda).", 4000);
  }

  document.getElementById("yeniUrunEkleModal").style.display = "none";
  switchTab(1);
}

// --- Müşteri kalıcı ID sistemi -------------------------------------------
// Firma adı yerine kalıcı bir ID: isim değişse/iki firma aynı adı taşısa bile
// kayıtlar birbirine karışmaz. Eski kayıtlarda id yoksa burada otomatik
// tamamlanır (geriye dönük uyumlu — mevcut veriler kaybolmaz).
// Görünür, sıralı müşteri kodu üretir (M-0001, M-0002, ...). Mevcut listedeki
// en yüksek numaranın bir fazlasını verir.
function musteriSonrakiKoduBul(){
  var maxNo = 0;
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i].id;
    if(m && /^M-\d+$/.test(m)){
      var no = parseInt(m.split("-")[1],10);
      if(no>maxNo) maxNo = no;
    }
  }
  return "M-"+String(maxNo+1).padStart(4,"0");
}
function musteriIdUret(){
  return musteriSonrakiKoduBul();
}
function musteriIdEksikleriTamamla(){
  var eksikVarMi = false;
  // Eskiden rastgele (CUS-...) üretilmiş kodlar varsa, görünür/sıralı yeni
  // biçime (M-0001) geçiriyoruz — en eski müşteri (listenin sonunda, çünkü
  // yeni müşteriler unshift ile başa ekleniyor) en küçük numarayı alsın diye
  // ters sırada numaralandırıyoruz.
  for(var i=musteriListesi.length-1;i>=0;i--){
    if(!musteriListesi[i].id || !/^M-\d+$/.test(musteriListesi[i].id)){
      musteriListesi[i].id = musteriSonrakiKoduBul();
      eksikVarMi = true;
    }
  }
  if(eksikVarMi){
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet) window.fbSet("musteriler", musteriListesi).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  }
}
// --------------------------------------------------------------------------

// --- Mükerrer müşteri tespiti -------------------------------------------
function turkceNormallestir(s){
  return (s||"").toString().toLocaleLowerCase("tr")
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/İ/g,"i");
}
var MUSTERI_ORTAK_KELIME_YOKSAY = ["a.s","as","ltd","sti","san","tic","ve","co","inc","paz","dis","tur","turizm","grup","group","the","ve","ic"];
function musteriAdiKelimelere(ad){
  return turkceNormallestir(ad).replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(function(k){
    return k.length>1 && MUSTERI_ORTAK_KELIME_YOKSAY.indexOf(k)===-1;
  });
}
function benzerMusteriBul(ad){
  var hedefKelime = musteriAdiKelimelere(ad);
  if(hedefKelime.length===0) return null;
  var enIyi = null, enIyiOran = 0;
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    if(!m || !m.ad) continue;
    var kk = musteriAdiKelimelere(m.ad);
    if(kk.length===0) continue;
    var ortak = 0;
    for(var j=0;j<hedefKelime.length;j++){ if(kk.indexOf(hedefKelime[j])!==-1) ortak++; }
    var oran = ortak / Math.min(hedefKelime.length, kk.length);
    if(oran > enIyiOran){ enIyiOran = oran; enIyi = {musteri:m, idx:i, oran:oran}; }
  }
  if(enIyi && enIyi.oran >= 0.6) return enIyi;
  return null;
}
function musteriKaydet(){
  var ad = turkceBaslikDuzeni(validateText(document.getElementById("yeniMusteriAdi").value,120));
  if(!ad){ showToast("Müşteri adı girin!"); return; }
  var benzer = benzerMusteriBul(ad);
  if(benzer){
    document.getElementById("musteriMukerrerIcerik").innerHTML =
      "Girdiğiniz <b>\""+ad+"\"</b> ismi, sistemde kayıtlı olan aşağıdaki müşteriye çok benziyor:"
      +"<div style='background:#f7f9fb;border:1px solid #d5dce6;border-radius:8px;padding:10px;margin-top:10px;'>"
        +"<div style='font-weight:800;color:#003a70;'>"+benzer.musteri.ad+"</div>"
        +"<div style='font-size:13px;color:#666;'>"+(benzer.musteri.sehir||"")+"</div>"
      +"</div>";
    document.getElementById("musteriMukerrerGitBtn").setAttribute("onclick","musteriMukerrerKapat();musteriKartAc("+benzer.idx+")");
    document.getElementById("musteriMukerrerModal").style.display="flex";
    return;
  }
  musteriKaydetGercek();
}
function musteriMukerrerKapat(){
  document.getElementById("musteriMukerrerModal").style.display="none";
}
function musteriMukerrerZorlaKaydet(){
  musteriMukerrerKapat();
  musteriKaydetGercek();
}
// --------------------------------------------------------------------------

// --- Müşteri Birleştir ------------------------------------------------
function musteriBirlestirAc(){
  if(musteriKartIdx===null) return;
  var ana = musteriListesi[musteriKartIdx];
  if(!ana) return;
  document.getElementById("musteriBirlestirAnaAdi").textContent = "\""+ana.ad+"\" için bir birleştirme hedefi seçin";
  document.getElementById("musteriBirlestirAramaInput").value = "";
  document.getElementById("musteriBirlestirOnayAsama").style.display="none";
  document.getElementById("musteriBirlestirAramaAsama").style.display="block";
  musteriBirlestirAramaRenderEt();
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("musteriBirlestirModal").style.display="flex";
}
function musteriBirlestirModalKapat(){
  document.getElementById("musteriBirlestirModal").style.display="none";
  document.getElementById("musteriKartModal").style.display="flex";
}
var musteriBirlestirHedefIdx = null;
function musteriBirlestirAramaRenderEt(){
  var q = turkceNormallestir(document.getElementById("musteriBirlestirAramaInput").value);
  var el = document.getElementById("musteriBirlestirAramaListesi");
  var sonuclar = [];
  for(var i=0;i<musteriListesi.length;i++){
    if(i===musteriKartIdx) continue;
    var m = musteriListesi[i];
    if(!m || !m.ad) continue;
    if(q && turkceNormallestir(m.ad).indexOf(q)===-1) continue;
    sonuclar.push({m:m, idx:i});
    if(sonuclar.length>=30) break;
  }
  if(sonuclar.length===0){
    el.innerHTML = "<div style='text-align:center;color:#888;font-size:20px;padding:16px 0;'>Sonuç yok.</div>";
    return;
  }
  var html = "";
  for(var j=0;j<sonuclar.length;j++){
    var s = sonuclar[j];
    html += "<div onclick='musteriBirlestirHedefSec("+s.idx+")' style='cursor:pointer;background:#f7f9fc;border:1px solid #d5dce6;border-radius:8px;padding:14px 16px;margin-bottom:10px;'>"
      + "<div style='font-weight:800;font-size:22px;color:#003a70;'>"+s.m.ad+"</div>"
      + (s.m.sehir ? "<div style='font-size:17px;color:#666;margin-top:2px;'>"+s.m.sehir+"</div>" : "")
      + "</div>";
  }
  el.innerHTML = html;
}
function musteriBirlestirHedefSec(idx){
  musteriBirlestirHedefIdx = idx;
  var ana = musteriListesi[musteriKartIdx];
  var diger = musteriListesi[idx];
  if(!ana || !diger) return;
  document.getElementById("musteriBirlestirDigerBilgi").innerHTML = diger.ad + (diger.sehir?"<div style='font-size:16px;color:#888;margin-top:2px;'>"+diger.sehir+"</div>":"");
  document.getElementById("musteriBirlestirAnaBilgi").innerHTML = ana.ad + (ana.sehir?"<div style='font-size:16px;color:#0e7a60;margin-top:2px;'>"+ana.sehir+"</div>":"");
  document.getElementById("musteriBirlestirAramaAsama").style.display="none";
  document.getElementById("musteriBirlestirOnayAsama").style.display="block";
}
function musteriBirlestirOnayla(){
  var anaIdx = musteriKartIdx;
  var digerIdx = musteriBirlestirHedefIdx;
  if(anaIdx===null || digerIdx===null) return;
  var ana = musteriListesi[anaIdx];
  var diger = musteriListesi[digerIdx];
  if(!ana || !diger) return;
  var anaAd = ana.ad, digerAd = diger.ad;
  if(!ana.id) ana.id = musteriIdUret(); // eski kayıtta ID yoksa şimdi ver
  var anaId = ana.id, digerId = diger.id;

  // 1) İletişim kişilerini birleştir (aynı isimde tekrar eklenmesin)
  var mevcutIsimler = (ana.iletisimler||[]).map(function(k){ return (k.isim||"").toLowerCase(); });
  (diger.iletisimler||[]).forEach(function(k){
    if(mevcutIsimler.indexOf((k.isim||"").toLowerCase())===-1){
      if(!ana.iletisimler) ana.iletisimler=[];
      ana.iletisimler.push(k);
    }
  });

  // 2) Temas (ziyaret) geçmişini birleştir
  if(diger.ziyaretGecmisi && diger.ziyaretGecmisi.length){
    if(!ana.ziyaretGecmisi) ana.ziyaretGecmisi=[];
    ana.ziyaretGecmisi = ana.ziyaretGecmisi.concat(diger.ziyaretGecmisi);
    ana.ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    ana.sonZiyaret = ana.ziyaretGecmisi[0].ts;
    ana.sonZiyaretNot = ana.ziyaretGecmisi[0].not;
  }

  // 3) Görevleri taşı
  (gorevListesi||[]).forEach(function(g){ if(g.musteriAd===digerAd) g.musteriAd=anaAd; });
  if(typeof gorevleriKaydet==="function") gorevleriKaydet();

  // 4) Arşivdeki sipariş/teklif/proforma/numune kayıtlarını taşı — ID varsa ID
  // ile, yoksa (eski kayıtlar) isimle eşleştirilir; hepsi ana kaydın ID+adına taşınır.
  var arsiv = lsGet("weicon_arsiv",{});
  ["siparis","teklif","proforma","numune"].forEach(function(tip){
    (arsiv[tip]||[]).forEach(function(k){
      var buNaAitMi = (digerId && k.musteriId) ? (k.musteriId===digerId) : (k.musteri===digerAd);
      if(buNaAitMi){ k.musteri=anaAd; k.musteriId=anaId; }
    });
  });
  arsivData = arsiv;
  lsSet("weicon_arsiv", arsiv);
  if(window.fbSet) window.fbSet("arsiv", arsiv).catch(function(e){ console.error("Firebase yazma hatası:", e); });

  // 5) Diğer müşteri kaydını sil
  musteriListesi.splice(digerIdx,1);
  var yeniAnaIdx = musteriListesi.indexOf(ana);
  musteriListesiniKaydet();
  musteriListesiGuvenliKaydet(ana, digerId).catch(function(e){ console.error("Firebase yazma hatası:", e); });

  showToast("✅ \""+digerAd+"\" → \""+anaAd+"\" ile birleştirildi.");
  document.getElementById("musteriBirlestirModal").style.display="none";
  musteriListesiniRenderEt();
  musteriKartIdx = yeniAnaIdx;
  musteriKartAc(yeniAnaIdx);
}
// --------------------------------------------------------------------------

function musteriKaydetGercek(){
  var ad = turkceBaslikDuzeni(validateText(document.getElementById("yeniMusteriAdi").value,120));
  if(!ad){ showToast("Müşteri adı girin!"); return; }
  var sehir = document.getElementById("yeniMusteriSehir")?turkceBaslikDuzeni(validateText(document.getElementById("yeniMusteriSehir").value,60)):"";
  var acikAdres = document.getElementById("yeniMusteriAcikAdres") ? document.getElementById("yeniMusteriAcikAdres").value.trim() : "";
  var vade = document.getElementById("yeniMusteriVade").value.trim();
  var fatura = document.getElementById("yeniMusteriFatura").value.trim();
  var yetkiliTelefon = document.getElementById("yeniMusteriYetkiliTelefon").value.trim();
  var yetkiliEposta = document.getElementById("yeniMusteriYetkiliEposta").value.trim();
  var kargo = document.getElementById("yeniMusteriKargo").value.trim();
  var teslimatAdresi = document.getElementById("yeniMusteriTeslimatAdresi").value.trim();

  function kaydiTamamla(guncelListe){
    // ŞEMA STABİLİZASYONU: yeni müşteri artık DOĞRUDAN yeni (dizi) formatta
    // oluşturuluyor — acikAdres/teslimatAdresi (eski tekil alanlar) ARTIK HİÇ
    // YAZILMIYOR. Bu alanlar sadece ÇOK ESKİ (bu değişiklikten önce oluşmuş)
    // müşteri kayıtlarını okumak için hâlâ kodda duruyor, yeni veri üretmiyorlar.
    var yeniMusteri = {
      id:musteriIdUret(), ad:ad, sehir:sehir, vade:vade, fatura:fatura,
      telefon:yetkiliTelefon, eposta:yetkiliEposta, kargo:kargo,
      faturaAdresleri: acikAdres ? [{etiket:"Fatura Adresi", adres:acikAdres}] : [],
      teslimatAdresleri: teslimatAdresi ? [{etiket:"Teslimat Adresi", adres:teslimatAdresi}] : []
    };
    guncelListe.unshift(yeniMusteri);
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet){
      musteriListesiGuvenliKaydet(yeniMusteri).then(function(){
        showToast("✓ "+ad+" Firebase'e kaydedildi (tüm cihazlarda görünecek)");
      }).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    }
    // Kaydedildikten sonra doğrudan müşteri kartını aç — siz kapatana kadar ekranda kalır.
    musteriListesiniRenderEt();
    musteriKartAc(0);
  }

  // Önce Firebase'deki EN GÜNCEL listeyi çek, sonra üzerine ekle
  // (başka bir cihazın az önce eklediği müşteriyi silmemek için)
  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      kaydiTamamla(guncelListe);
    }).catch(function(){
      kaydiTamamla(lsGet("weicon_musteriler",[]));
    });
  } else {
    kaydiTamamla(lsGet("weicon_musteriler",[]));
  }

  document.getElementById("yeniMusteriAdi").value="";
  if(document.getElementById("yeniMusteriSehir")) document.getElementById("yeniMusteriSehir").value="";
  if(document.getElementById("yeniMusteriAcikAdres")) document.getElementById("yeniMusteriAcikAdres").value="";
  document.getElementById("yeniMusteriVade").value="";
  document.getElementById("yeniMusteriFatura").value="";
  document.getElementById("yeniMusteriYetkili").value="";
  document.getElementById("yeniMusteriYetkiliTelefon").value="";
  document.getElementById("yeniMusteriYetkiliEposta").value="";
  document.getElementById("yeniMusteriKargo").value="";
  document.getElementById("yeniMusteriTeslimatAdresi").value="";
}

function kurKaydetVeYayinla(kurStr){
  document.getElementById("kur").value = kurStr;
  hesapla();
  localStorage.setItem("weicon_kur", kurStr);
  localStorage.setItem("weicon_kur_zaman", Date.now());
  anaKurDegerGuncelle(kurStr);
  if(window.fbSet){
    window.fbSet("kur", {deger:kurStr, zaman:Date.now()}).catch(function(e){
      console.error("Kur Firebase'e yazılamadı", e);
    });
  }
}

function kurGuncelle(){
  if(location.protocol==='file:'||location.hostname==='') return;
  fetch("https://api.frankfurter.app/latest?from=EUR&to=TRY")
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data && data.rates && data.rates.TRY){
        var yeniKur = data.rates.TRY;
        kurKaydetVeYayinla(yeniKur.toFixed(4));
      }
    })
    .catch(function(){
      // Arka planda (10dk'da bir) sessizce deniyor — bağlantı yoksa sorun değil,
      // bir sonraki denemede tekrar çalışır, kullanıcıyı rahatsız eden bir uyarı göstermiyoruz.
    });
}

function kurGuncelleManuel(){
  // Sadece kullanıcı 🔄 Kur butonuna bastığında çalışır
  showToast("Kur güncelleniyor...");
  if(location.protocol==='file:'||location.hostname===''){
    kurManuelGir(); return;
  }
  fetch("https://api.frankfurter.app/latest?from=EUR&to=TRY")
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data && data.rates && data.rates.TRY){
        var yeniKur = data.rates.TRY;
        kurKaydetVeYayinla(yeniKur.toFixed(4));
        showToast("✅ EUR/TL: "+yeniKur.toFixed(4));
      } else { kurManuelGir(); }
    })
    .catch(function(){ kurManuelGir(); });
}

function kurManuelGir(){
  var mevcutKur = document.getElementById("kur")?document.getElementById("kur").value:"";
  document.getElementById("kurManuelInput").value = mevcutKur||"";
  document.getElementById("kurManuelModal").style.display="flex";
  setTimeout(function(){ document.getElementById("kurManuelInput").focus(); }, 100);
}

function kurManuelKapat(){
  document.getElementById("kurManuelModal").style.display="none";
}

function kurManuelKaydet(){
  var kur = document.getElementById("kurManuelInput").value;
  if(kur && !isNaN(parseFloat(kur))){
    kurKaydetVeYayinla(parseFloat(kur).toFixed(4));
    showToast("Kur güncellendi ve tüm cihazlara gönderildi: "+kur);
    kurManuelKapat();
  } else {
    showToast("Geçerli bir kur girin.");
  }
}

function anaKurDegerGuncelle(kurStr){
  var el = document.getElementById("anaKurDeger");
  if(el && kurStr) el.textContent = "1 € = "+parseFloat(kurStr).toFixed(2).replace(".",",")+" ₺";
}

function kurOtomatikKontrol(){
  var kayitliKur = localStorage.getItem("weicon_kur");
  if(kayitliKur){
    // Kayıtlı kur varsa hemen göster (Firebase'den gelen gerçek zamanlı veri az sonra bunun üzerine yazacak)
    document.getElementById("kur").value = kayitliKur;
    hesapla();
    anaKurDegerGuncelle(kayitliKur);
  }
  // Kur, Firebase'den (fbDinle ile) her zaman okunuyor — bu, tüm cihazların
  // her an aynı ortak kuru görmesini sağlıyor. BUNA EK olarak artık en az 10
  // dakikada bir OTOMATİK tazeleniyor da (Frankfurter API'nin çağrı sınırı
  // olmadığı için güvenli) — kullanıcının 🔄 butonuna basmasına gerek kalmadan
  // kur güncel kalır. Birden fazla cihaz aynı anda tazelese bile hepsi aynı
  // (Frankfurter'dan gelen) doğru değeri yazacağı için çakışma riski yoktur.
  kurGuncelle();
  setInterval(kurGuncelle, 600000); // 10 dakikada bir
}

var musteriKartIdx = null;

function musteriIslemSayisiGetir(ad){
  var arsiv = lsGet("weicon_arsiv",{});
  var tipler = ["numune","teklif","proforma","siparis"];
  var sayi = 0;
  for(var t=0;t<tipler.length;t++){
    var liste = arsiv[tipler[t]]||[];
    for(var k=0;k<liste.length;k++){
      if((liste[k].musteri||"").toLocaleLowerCase("tr-TR") === (ad||"").toLocaleLowerCase("tr-TR")) sayi++;
    }
  }
  return sayi;
}

// İşlemler menüsünde "İşlem Geçmişi" kartının altında göstermek için, o
// müşterinin EN SON (tarihe göre) kaydını kısa bir özet metin olarak döndürür.
// Örn: "12 Ağu · Fiyat Teklifi · 16,35 €". Hiç kayıt yoksa null döner.
function musteriSonIslemBilgisiGetir(ad){
  var arsiv = lsGet("weicon_arsiv",{});
  var tipEtiket = {numune:"Numune", teklif:"Fiyat Teklifi", proforma:"Proforma", siparis:"Sipariş"};
  var tipler = ["numune","teklif","proforma","siparis"];
  var enSon = null;
  for(var t=0;t<tipler.length;t++){
    var liste = arsiv[tipler[t]]||[];
    for(var k=0;k<liste.length;k++){
      var kayit = liste[k];
      if((kayit.musteri||"").toLocaleLowerCase("tr-TR") !== (ad||"").toLocaleLowerCase("tr-TR")) continue;
      if(!enSon || (kayit.ts||0) > (enSon.ts||0)){
        enSon = {ts:kayit.ts||0, tip:tipEtiket[tipler[t]], toplam:(kayit.urunler||[]).reduce(function(s,u){ return s+(u.toplam||0); },0)};
      }
    }
  }
  if(!enSon) return null;
  var d = new Date(enSon.ts);
  var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var tarihStr = d.getDate()+" "+aylar[d.getMonth()];
  return tarihStr+" · "+enSon.tip+" · "+enSon.toplam.toFixed(2).replace(".",",")+" €";
}

function musteriKartAc(idx){
  var m = musteriListesi[idx];
  if(!m) return;
  if(musteriSecimHedefSayfa === "gorevGir"){
    musteriSecimHedefSayfa = null;
    musteriKartIdx = idx;
    gorevTanimlaAc();
    return;
  }
  if(musteriSecimHedefSayfa === "ziyaretEkleGun"){
    musteriSecimHedefSayfa = null;
    musteriKartIdx = idx;
    ziyaretDuzenlenenTs = null;
    ziyaretSeciliTur = "ziyaret";
    ziyaretSeciliFotolar = [];
    ziyaretSeciliKisi = null;
    ziyaretTurSeciciOlustur();
    ziyaretFotoGaleriOlustur();
    ziyaretKisiEtiketGuncelle();
    var pad=function(n){ return n.toString().padStart(2,"0"); };
    var d = new Date(ziyaretEklenecekTs);
    var localVal = d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
    document.getElementById("ziyaretTarihSaat").value = localVal;
    document.getElementById("ziyaretNotu").value = "";
    document.getElementById("ziyaretModalBaslik").textContent = "📍 Temas Kaydı — "+m.ad;
    var silBtn0 = document.getElementById("ziyaretSilBtn");
    if(silBtn0) silBtn0.style.display="none";
    document.getElementById("musteriZiyaretModal").style.display="flex";
    return;
  }
  musteriKartIdx = idx;
  m.sonGoruntuleme = Date.now();
  musteriListesiniKaydet();
  document.getElementById("musteriKartAd").textContent = m.ad||"";
  var kartKoduEl = document.getElementById("musteriKartKodu");
  if(kartKoduEl) kartKoduEl.textContent = m.id ? ("🏷 Müşteri Kodu: "+m.id) : "";
  seciliYetkililer = [];
  localStorage.removeItem("weicon_secili_yetkililer");
  localStorage.removeItem("weicon_secili_yetkili");
  seciliFaturaAdresi = null;
  localStorage.removeItem("weicon_secili_fatura");
  seciliTeslimatAdresi = null;
  localStorage.removeItem("weicon_secili_teslimat");
  teslimatDahilEt = true;
  localStorage.removeItem("weicon_teslimat_dahil_et");
  yetkiliKisiEtiketGuncelle();
  var bilgiParts = [];
  if(m.sehir) bilgiParts.push(sehirFormatla(m.sehir));
  if(m.vade) bilgiParts.push(m.vade+" vade");
  if(m.yetkili) bilgiParts.push(m.yetkili);
  document.getElementById("musteriKartBilgi").textContent = bilgiParts.join(" · ");
  var badgeZ = document.getElementById("badgeZiyaret");
  if(badgeZ) badgeZ.textContent = (m.ziyaretGecmisi||[]).length;
  var badgeI = document.getElementById("badgeIslemGecmisi");
  if(badgeI) badgeI.textContent = musteriIslemSayisiGetir(m.ad);
  var badgeK = document.getElementById("badgeIletisim");
  if(badgeK) badgeK.textContent = (m.iletisimler||[]).length;
  gorevBadgeGuncelle();

  // Bağlamsal alt bilgi satırları — kör tıklama olmasın diye her kartın altında
  // gerçek/güncel bir özet gösteriyoruz.
  var altTemasEl = document.getElementById("islemAltTemas");
  if(altTemasEl){
    if(m.sonZiyaret){
      var tGun = Math.floor((Date.now()-m.sonZiyaret)/86400000);
      altTemasEl.textContent = "Son temas: "+tGun+" gün önce";
    } else {
      altTemasEl.textContent = "Son temas: kayıt yok — ilk temas için dokun";
    }
  }
  var altGecmisEl = document.getElementById("islemAltGecmis");
  if(altGecmisEl){
    var sonIslem = musteriSonIslemBilgisiGetir(m.ad);
    altGecmisEl.textContent = sonIslem || "Henüz işlem kaydı yok";
  }
  var altGorevlerimEl = document.getElementById("islemAltGorevlerim");
  if(altGorevlerimEl){
    var acikGorevSayisi = gorevListesi.filter(function(g){ return g.musteriAd===m.ad && !g.tamamlandi; }).length;
    altGorevlerimEl.textContent = acikGorevSayisi>0 ? acikGorevSayisi+" açık görev" : "Açık görev yok";
  }
  yetkiliKisiEtiketGuncelle();
  var ziyaretBilgiDiv = document.getElementById("musteriKartZiyaretBilgi");
  if(m.sonZiyaret){
    var tarihStr = new Date(m.sonZiyaret).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
    ziyaretBilgiDiv.innerHTML = "Son ziyaret: "+tarihStr+(m.sonZiyaretNot?"<br>Not: "+safeText(m.sonZiyaretNot):"");
    ziyaretBilgiDiv.style.display="block";
  } else {
    ziyaretBilgiDiv.style.display="none";
  }
  // ARTIK seçim ekranı ("Müşteri Kartı / İşlemler") YOK — isme dokununca
  // doğrudan Müşteri Kartı açılıyor. İşlemler ekranına gitmek istersen Kart'ın
  // altındaki "⚡ İşlemler'e Git" butonunu kullanıyorsun (zaten kart üzerinde var).
  musteriCariKartAc();
}

// Müşterinin toplam işlem sayısı ve toplam € tutarını hesaplar (id varsa id ile,
// yoksa isim ile eşleştirir — musteriIslemSayisiGetir ile aynı mantık).
function musteriIslemOzetiGetir(m){
  var arsiv = lsGet("weicon_arsiv",{});
  var tipler = ["numune","teklif","proforma","siparis"];
  var sayi = 0, toplamEuro = 0;
  for(var t=0;t<tipler.length;t++){
    var liste = arsiv[tipler[t]]||[];
    for(var k=0;k<liste.length;k++){
      var kayit = liste[k];
      var eslesiyorMu = (m.id && kayit.musteriId) ? (kayit.musteriId===m.id) : ((kayit.musteri||"").toLocaleLowerCase("tr-TR")===(m.ad||"").toLocaleLowerCase("tr-TR"));
      if(eslesiyorMu){
        sayi++;
        (kayit.urunler||[]).forEach(function(u){ toplamEuro += u.toplamEuro||0; });
      }
    }
  }
  return {sayi:sayi, toplamEuro:toplamEuro};
}

// "📇 MÜŞTERİ KARTI" — salt-okunur cari bilgiler (adres/vade/fatura/kargo/özet/son temas).
function musteriCariKartAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  document.getElementById("cariKartAd").textContent = m.ad||"";
  document.getElementById("cariKartAltBaslik").textContent = (m.id?("🏷 "+m.id):"")+(m.id&&m.sehir?" · ":"")+(sehirFormatla(m.sehir)||"");
  cariKartAdresListesiniRenderEt("fatura");
  cariKartAdresListesiniRenderEt("teslimat");
  document.getElementById("cariKartVade").textContent = m.vade || "-";
  document.getElementById("cariKartFatura").textContent = m.fatura || "-";
  document.getElementById("cariKartKargo").textContent = m.kargo || "-";

  cariKartYetkiliListesiniRenderEt();

  document.getElementById("musteriCariKartModal").style.display="flex";
}

// Müşteri Kartı'ndaki YETKİLİLER bölümünü render eder: artık sadece salt-okunur
// bir liste değil, her kişinin yanında ✏️ Düzenle / 🗑 Sil, altta da
// "+ Yeni Yetkili Ekle" var — İşlemler ekranına gitmeye GEREK KALMADI.
// Mail/WhatsApp gönderirken "kime gönderilsin" seçimi ayrı bir akış olarak
// (musteriIletisimYetkiliSecmeyeAc üzerinden) aynen çalışmaya devam ediyor.
function cariKartYetkiliListesiniRenderEt(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var kisiler = m.iletisimler || [];
  var baslikEl = document.getElementById("cariKartYetkiliBaslik");
  if(baslikEl) baslikEl.textContent = "👥 YETKİLİLER ("+kisiler.length+")";
  var listeEl = document.getElementById("cariKartYetkiliListesi");
  var notEl = document.getElementById("cariKartYetkiliNot");
  if(!listeEl) return;
  var html = "";
  for(var ki=0; ki<kisiler.length; ki++){
    var k = kisiler[ki];
    var parcalar = [];
    if(k.bolum||k.gorev) parcalar.push([k.bolum,k.gorev].filter(Boolean).map(safeText).join(" · "));
    if(k.telefon) parcalar.push("📞 "+safeText(k.telefon));
    if(k.eposta) parcalar.push("✉️ "+safeText(k.eposta));
    html += "<div style='background:#f7f9fc;border:1.5px solid #d5dce6;border-radius:8px;padding:12px 14px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:flex-start;gap:9px;'>"
      +"<div style='min-width:0;flex:1;'>"
      +"<div style='font-size:24px;font-weight:900;color:#1a2a3a;'>👤 "+safeText(k.isim||"-")+"</div>"
      +(parcalar.length ? "<div style='font-size:20px;color:#556;margin-top:4px;line-height:1.35;'>"+parcalar.join("<br>")+"</div>" : "")
      +"</div>"
      +"<div style='display:flex;gap:8px;flex-shrink:0;'>"
      +"<button onclick='cariKartYetkiliDuzenleAc("+ki+")' style='background:#eef4fb;color:#003a70;border:1px solid #003a70;padding:8px 14px;border-radius:6px;font-weight:bold;font-size:18px;cursor:pointer;white-space:nowrap;'>✏️</button>"
      +"<button onclick='cariKartYetkiliSilAc("+ki+")' style='background:#f8d7da;color:#e0524a;border:1px solid #e0524a;padding:8px 14px;border-radius:6px;font-weight:bold;font-size:18px;cursor:pointer;white-space:nowrap;'>🗑</button>"
      +"</div>"
      +"</div>";
  }
  html += "<button onclick='cariKartYetkiliEkleAc()' style='width:100%;background:linear-gradient(135deg,#16a085,#0e8a72);color:#fff;border:none;padding:14px;font-size:22px;font-weight:900;border-radius:8px;cursor:pointer;margin-top:2px;'>+ Yeni Yetkili Ekle</button>";
  listeEl.innerHTML = html;
  if(notEl) notEl.style.display = kisiler.length>0 ? "block" : "none";
}

function cariKartYetkiliEkleAc(){
  musteriIletisimAc();
  musteriIletisimTabSec('ekle');
}
function cariKartYetkiliDuzenleAc(i){
  musteriIletisimAc();
  yetkiliKisiDuzenleAc(i);
}
function teslimatDahilEtDegistir(){
  teslimatDahilEt = !teslimatDahilEt;
  localStorage.setItem("weicon_teslimat_dahil_et", teslimatDahilEt ? "true" : "false");
  var ubkModal = document.getElementById("urunBulOnKontrolModal");
  if(ubkModal && ubkModal.style.display==="flex" && typeof urunBulOnKontrolRenderEt==="function") urunBulOnKontrolRenderEt();
  if(typeof belgeBilgileriOzetGuncelle==="function") belgeBilgileriOzetGuncelle();
}

// TEK SEFERLİK (GEÇİCİ) ADRES — müşteri kartındaki kayıtlı listeye hiç
// eklenmez, sadece bu andaki gönderim/kayıt için kullanılır. "gecici:true"
// işaretiyle taşınır; ekran bunu turuncu bir rozetle ayırt eder.
function geciciAdresFormAc(){
  var form = document.getElementById("geciciAdresForm");
  if(form) form.style.display = "block";
  var ta = document.getElementById("geciciAdresInput");
  if(ta) ta.value = "";
}
function geciciAdresFormKapat(){
  var form = document.getElementById("geciciAdresForm");
  if(form) form.style.display = "none";
}
function geciciAdresKullan(){
  var tip = adresYonetimTipi;
  var adres = (document.getElementById("geciciAdresInput").value||"").trim();
  if(!adres){ showToast("⚠️ Adres boş olamaz."); return; }
  var geciciKayit = {etiket:"Geçici Adres", adres:adres, gecici:true};
  if(tip==="fatura"){ seciliFaturaAdresi = geciciKayit; localStorage.setItem("weicon_secili_fatura", JSON.stringify(geciciKayit)); }
  else { seciliTeslimatAdresi = geciciKayit; localStorage.setItem("weicon_secili_teslimat", JSON.stringify(geciciKayit)); }
  adresYonetimKapat();
  var ubkModal = document.getElementById("urunBulOnKontrolModal");
  if(ubkModal && ubkModal.style.display==="flex" && typeof urunBulOnKontrolRenderEt==="function") urunBulOnKontrolRenderEt();
  if(typeof belgeBilgileriOzetGuncelle==="function") belgeBilgileriOzetGuncelle();
}

function cariKartYetkiliSilAc(i){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m || !m.iletisimler || !m.iletisimler[i]) return;
  var isim = m.iletisimler[i].isim||"Bu kişi";
  if(!confirm("'"+isim+"' silinsin mi?")) return;
  musteriIletisimSil(i);
}

// ============================================================
// FATURA / TESLİMAT ADRESLERİ — Yetkililer listesiyle BİREBİR aynı mantık:
// Müşteri Kartı'nda doğrudan ekle/düzenle/sil yapılabilir; Ürün Bul ön-kontrolünden
// veya kart üzerinden "adresSecildi" ile hangisinin kullanılacağı seçilir.
// tip: "fatura" | "teslimat"
// ============================================================
var adresYonetimTipi = "fatura";
var adresDuzenlenenIdx = null;

function cariKartAdresListesiniRenderEt(tip){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var liste = musteriAdresListesiGetir(m, tip);
  var seciliAdres = tip==="fatura" ? seciliFaturaAdresi : seciliTeslimatAdresi;
  var baslikEl = document.getElementById(tip==="fatura" ? "cariKartFaturaBaslik" : "cariKartTeslimatBaslik");
  var listeEl = document.getElementById(tip==="fatura" ? "cariKartFaturaListesi" : "cariKartTeslimatListesi");
  if(!listeEl) return;
  var ikon = tip==="fatura" ? "🧾" : "🚚";
  var etiketBaslik = tip==="fatura" ? "FATURA ADRESLERİ" : "TESLİMAT ADRESLERİ";
  if(baslikEl) baslikEl.textContent = ikon+" "+etiketBaslik+" ("+liste.length+")";
  var html = "";
  for(var i=0;i<liste.length;i++){
    var a = liste[i];
    var seciliMi = !!(seciliAdres && seciliAdres.adres===a.adres && seciliAdres.etiket===a.etiket);
    html += "<div style='background:"+(seciliMi?"#eafaf3":"#f7f9fc")+";border:1.5px solid "+(seciliMi?"#0e7c63":"#d5dce6")+";border-radius:8px;padding:12px 14px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:flex-start;gap:9px;'>"
      +"<div style='min-width:0;flex:1;'>"
      +(seciliMi ? "<div style='font-size:12px;font-weight:900;color:#0e7c63;margin-bottom:2px;'>✓ SEÇİLİ</div>" : "")
      +"<div style='font-size:20px;font-weight:900;color:#1a2a3a;'>"+safeText(a.etiket||"Adres")+"</div>"
      +"<div style='font-size:18px;color:#556;margin-top:3px;line-height:1.35;'>"+safeText(a.adres)+"</div>"
      +"</div>"
      +"<div style='display:flex;gap:8px;flex-shrink:0;'>"
      +"<button onclick='adresDuzenleAc(\""+tip+"\","+i+")' style='background:#eef4fb;color:#003a70;border:1px solid #003a70;padding:8px 14px;border-radius:6px;font-weight:bold;font-size:18px;cursor:pointer;white-space:nowrap;'>✏️</button>"
      +"<button onclick='adresSilAc(\""+tip+"\","+i+")' style='background:#f8d7da;color:#e0524a;border:1px solid #e0524a;padding:8px 14px;border-radius:6px;font-weight:bold;font-size:18px;cursor:pointer;white-space:nowrap;'>🗑</button>"
      +"</div>"
      +"</div>";
  }
  html += "<button onclick=\"adresEkleAc('"+tip+"')\" style='width:100%;background:linear-gradient(135deg,#16a085,#0e8a72);color:#fff;border:none;padding:14px;font-size:20px;font-weight:900;border-radius:8px;cursor:pointer;margin-top:2px;'>+ Yeni "+(tip==="fatura"?"Fatura":"Teslimat")+" Adresi Ekle</button>";
  listeEl.innerHTML = html;
}

// Ürün Bul ön-kontrolünden veya Müşteri Kartı'ndan "Seç/Değiştir" ile açılır —
// hem listeleme hem seçim hem ekle/düzenle/sil TEK bu popup üzerinden yapılır.
function adresYonetimAc(tip){
  if(musteriKartIdx===null) return;
  adresYonetimTipi = tip;
  var baslikEl = document.getElementById("adresYonetimBaslik");
  if(baslikEl) baslikEl.textContent = (tip==="fatura" ? "🧾 Fatura Adresi Seç" : "🚚 Teslimat Adresi Seç");
  adresYonetimListesiniRenderEt();
  document.getElementById("adresYonetimModal").style.display = "flex";
}
function adresYonetimKapat(){
  document.getElementById("adresYonetimModal").style.display = "none";
}
function adresYonetimListesiniRenderEt(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var tip = adresYonetimTipi;
  var liste = musteriAdresListesiGetir(m, tip);
  var seciliAdres = tip==="fatura" ? seciliFaturaAdresi : seciliTeslimatAdresi;
  var html = "";
  for(var i=0;i<liste.length;i++){
    var a = liste[i];
    var seciliMi = !!(seciliAdres && seciliAdres.adres===a.adres && seciliAdres.etiket===a.etiket);
    html += "<div onclick=\"adresSecildi('"+tip+"',"+i+")\" style='cursor:pointer;background:"+(seciliMi?"#eafaf3":"#f7f9fc")+";border:2px solid "+(seciliMi?"#0e7c63":"#d5dce6")+";border-radius:10px;padding:12px 14px;margin-bottom:9px;'>"
      +"<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:8px;'>"
      +"<div style='min-width:0;flex:1;'>"
      +(seciliMi ? "<div style='font-size:11px;font-weight:900;color:#0e7c63;margin-bottom:2px;'>✓ SEÇİLİ</div>" : "")
      +"<div style='font-size:18px;font-weight:900;color:#1a2a3a;'>"+safeText(a.etiket||"Adres")+"</div>"
      +"<div style='font-size:16px;color:#556;margin-top:2px;line-height:1.35;'>"+safeText(a.adres)+"</div>"
      +"</div>"
      +"<div style='display:flex;gap:6px;flex-shrink:0;' onclick='event.stopPropagation();'>"
      +"<button onclick='adresDuzenleAc(\""+tip+"\","+i+")' style='background:#eef4fb;color:#003a70;border:1px solid #003a70;padding:7px 11px;border-radius:6px;font-weight:bold;font-size:16px;cursor:pointer;'>✏️</button>"
      +"<button onclick='adresSilAc(\""+tip+"\","+i+")' style='background:#f8d7da;color:#e0524a;border:1px solid #e0524a;padding:7px 11px;border-radius:6px;font-weight:bold;font-size:16px;cursor:pointer;'>🗑</button>"
      +"</div></div></div>";
  }
  document.getElementById("adresYonetimListesi").innerHTML = html || "<div style='text-align:center;color:#8a97a6;font-size:15px;padding:14px 0;'>Henüz adres eklenmemiş.</div>";
  var geciciForm = document.getElementById("geciciAdresForm");
  if(geciciForm) geciciForm.style.display = "none";
}
function adresSecildi(tip, idx){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var liste = musteriAdresListesiGetir(m, tip);
  var secilen = liste[idx];
  if(!secilen) return;
  if(tip==="fatura"){ seciliFaturaAdresi = secilen; localStorage.setItem("weicon_secili_fatura", JSON.stringify(secilen)); }
  else { seciliTeslimatAdresi = secilen; localStorage.setItem("weicon_secili_teslimat", JSON.stringify(secilen)); }
  adresYonetimKapat();
  var ubkModal = document.getElementById("urunBulOnKontrolModal");
  if(ubkModal && ubkModal.style.display==="flex" && typeof urunBulOnKontrolRenderEt==="function") urunBulOnKontrolRenderEt();
  if(typeof belgeBilgileriOzetGuncelle==="function") belgeBilgileriOzetGuncelle();
  if(typeof musteriCariKartAc==="function" && document.getElementById("musteriCariKartModal") && document.getElementById("musteriCariKartModal").style.display==="flex"){
    cariKartAdresListesiniRenderEt(tip);
  }
}
// ADRES EKLE/DÜZENLE — artık kendi net, odaklı ekranında (adresFormModal).
// adresFormDonusYeri: bu form nereden açıldıysa (kart veya seçim ekranı)
// kaydettikten/vazgeçtikten sonra oraya geri döner ve orayı tazeler.
var adresFormDonusYeri = "kart"; // "kart" | "secim"

function adresEkleAc(tip){
  adresFormAc(tip, null);
}
function adresDuzenleAc(tip, idx){
  adresFormAc(tip, idx);
}
function adresFormAc(tip, idx){
  if(musteriKartIdx===null) return;
  adresYonetimTipi = tip;
  adresDuzenlenenIdx = idx;
  var secimEkraniAcikMi = document.getElementById("adresYonetimModal").style.display === "flex";
  var kartAcikMi = document.getElementById("musteriCariKartModal").style.display === "flex";
  adresFormDonusYeri = secimEkraniAcikMi ? "secim" : (kartAcikMi ? "kart" : "hicbiri");
  if(secimEkraniAcikMi) document.getElementById("adresYonetimModal").style.display = "none";
  // ÖNEMLİ: Müşteri Kartı'nı da geçici olarak GİZLİYORUZ (sadece görünürlük,
  // veri/durum bozulmaz). Bazı tarayıcılarda z-index'e rağmen üst üste binme
  // sorunu yaşanabiliyordu — bu form kapanınca Kart otomatik geri gösterilir,
  // bu şekilde "form arkada kaldı" sorunu kesin olarak ortadan kalkıyor.
  if(kartAcikMi) document.getElementById("musteriCariKartModal").style.display = "none";

  var etiketVal = "", adresVal = "";
  if(idx!==null){
    var m = musteriListesi[musteriKartIdx];
    var liste = musteriAdresListesiGetir(m, tip);
    var a = liste[idx];
    if(!a) return;
    etiketVal = a.etiket||""; adresVal = a.adres||"";
  }
  document.getElementById("adresFormEtiketInput").value = etiketVal;
  document.getElementById("adresFormAdresInput").value = adresVal;
  var baslikEl = document.getElementById("adresFormBaslik");
  var tipAdi = tip==="fatura" ? "Fatura" : "Teslimat";
  var ikon = tip==="fatura" ? "🧾" : "🚚";
  if(baslikEl) baslikEl.textContent = ikon+" "+(idx!==null ? tipAdi+" Adresini Düzenle" : "Yeni "+tipAdi+" Adresi Ekle");
  document.getElementById("adresFormModal").style.display = "flex";
}
function _adresFormDonusYap(){
  document.getElementById("adresFormModal").style.display = "none";
  cariKartAdresListesiniRenderEt(adresYonetimTipi);
  if(adresFormDonusYeri==="secim"){
    adresYonetimListesiniRenderEt();
    document.getElementById("adresYonetimModal").style.display = "flex";
  } else if(adresFormDonusYeri==="kart"){
    document.getElementById("musteriCariKartModal").style.display = "flex";
  }
}
function adresFormKapat(){
  _adresFormDonusYap();
}
function adresFormKaydet(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var tip = adresYonetimTipi;
  var liste = musteriAdresListesiGetir(m, tip);
  var etiket = (document.getElementById("adresFormEtiketInput").value||"").trim() || (tip==="fatura"?"Fatura Adresi":"Teslimat Adresi");
  var adres = (document.getElementById("adresFormAdresInput").value||"").trim();
  if(!adres){ showToast("⚠️ Adres boş olamaz."); return; }
  if(adresDuzenlenenIdx!==null && liste[adresDuzenlenenIdx]){
    // ÖNEMLİ DÜZELTME: yeni bir obje ile DEĞİŞTİRMEK yerine, var olan objenin
    // içeriğini yerinde güncelliyoruz. seciliFaturaAdresi/seciliTeslimatAdresi
    // bu objeye doğrudan REFERANS tutuyor (kopya değil) — bu sayede "şu an
    // seçili mi" diye kırılgan metin karşılaştırması yapmaya hiç gerek kalmıyor,
    // düzenleme HER ZAMAN o an aktif seçime de otomatik yansıyor. Eskiden
    // (metin birebir eşleşmeli) mantık, bazı durumlarda güncellemeyi atlayıp
    // gönderilen belgede eski adresin kalmasına yol açabiliyordu.
    liste[adresDuzenlenenIdx].etiket = etiket;
    liste[adresDuzenlenenIdx].adres = adres;
    var seciliAdres = tip==="fatura" ? seciliFaturaAdresi : seciliTeslimatAdresi;
    if(seciliAdres === liste[adresDuzenlenenIdx]){
      localStorage.setItem(tip==="fatura" ? "weicon_secili_fatura" : "weicon_secili_teslimat", JSON.stringify(seciliAdres));
    }
  } else {
    liste.push({etiket:etiket, adres:adres});
  }
  musteriListesiniKaydet();
  if(window.fbSet) musteriListesiGuvenliKaydet(m).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  showToast("✓ Kaydedildi.");
  _adresFormDonusYap();
}
function adresSilAc(tip, idx){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var liste = musteriAdresListesiGetir(m, tip);
  var a = liste[idx];
  if(!a) return;
  if(!confirm("'"+(a.etiket||"Bu adres")+"' silinsin mi?")) return;
  var seciliAdres = tip==="fatura" ? seciliFaturaAdresi : seciliTeslimatAdresi;
  if(seciliAdres && seciliAdres.adres===a.adres && seciliAdres.etiket===a.etiket){
    if(tip==="fatura"){ seciliFaturaAdresi=null; localStorage.removeItem("weicon_secili_fatura"); }
    else { seciliTeslimatAdresi=null; localStorage.removeItem("weicon_secili_teslimat"); }
  }
  liste.splice(idx,1);
  musteriListesiniKaydet();
  if(window.fbSet) musteriListesiGuvenliKaydet(m).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  adresYonetimListesiniRenderEt();
  cariKartAdresListesiniRenderEt(tip);
}

// İLETİŞİM KİŞİLERİ — firmanın farklı departman/kişilerini yönetme
var iletisimSecimModu = false; // true iken bir kişi seçiliyor (temas veya yetkili amaçlı)
var kisiSeciciAmaci = "temas"; // "temas" | "yetkili"
// Seçili Yetkili Kişi(ler) — ARTIK DİZİ: bir belgeye birden fazla yetkili
// eklenebilir (örn. hem satınalma hem muhasebe yetkilisi). Eski tekil format
// ("weicon_secili_yetkili") varsa, veri kaybı olmadan diziye taşınır.
var seciliYetkililer = (function(){
  var yeniFormat = localStorage.getItem("weicon_secili_yetkililer");
  if(yeniFormat){ try{ return JSON.parse(yeniFormat)||[]; }catch(e){ return []; } }
  var eskiFormat = JSON.parse(localStorage.getItem("weicon_secili_yetkili")||"null");
  return eskiFormat ? [eskiFormat] : [];
})();
// Seçili Fatura/Teslimat Adresi — Yetkili Kişi ile BİREBİR aynı mantık: müşterinin
// birden fazla kayıtlı adresi olabilir (faturaAdresleri/teslimatAdresleri dizileri),
// gönderim/kayıt sırasında hangisinin kullanılacağı burada seçilir ve cihazda saklanır.
var seciliFaturaAdresi = JSON.parse(localStorage.getItem("weicon_secili_fatura")||"null");
var seciliTeslimatAdresi = JSON.parse(localStorage.getItem("weicon_secili_teslimat")||"null");
// Teslimat adresi SEÇİLİ olsa bile, bu belgeye eklenip eklenmeyeceğini ayrıca
// kontrol eden anahtar — "sadece merkeze gönder, teslimat yazma" durumları için.
// Varsayılan: açık (true). Değer localStorage'da yoksa true kabul edilir.
var _teslimatDahilEtDeger = localStorage.getItem("weicon_teslimat_dahil_et");
var teslimatDahilEt = _teslimatDahilEtDeger===null ? true : (_teslimatDahilEtDeger==="true");

// Bir müşterinin Fatura/Teslimat adres LİSTESİNİ döndürür. Eskiden her müşterinin
// tek bir "acikAdres"/"teslimatAdresi" metni vardı — bu fonksiyon ilk çağrıldığında
// o eski tekil değeri otomatik olarak yeni listenin ilk kaydına taşır (veri kaybı
// olmadan), sonrasında liste doğrudan kullanılır. tip: "fatura" | "teslimat"
function musteriAdresListesiGetir(m, tip){
  if(!m) return [];
  var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
  if(!m[alan]){
    var eskiDeger = tip==="fatura" ? m.acikAdres : m.teslimatAdresi;
    m[alan] = (eskiDeger && eskiDeger.trim()) ? [{etiket: tip==="fatura"?"Fatura Adresi":"Teslimat Adresi", adres: eskiDeger.trim()}] : [];
  }
  return m[alan];
}
var yetkiliSecimSonrasiGonder = null; // yetkili seçilince otomatik devam edilecek gönderim türü: "mail" | "whatsapp" | "whatsappYedek"
var onizlemeCagrildigiYer = null; // "gonder" ise, önizleme kapanınca İletişim İşlemleri popup'ına dönülür
var urunBulKontrolAktif = false; // true iken "Ürün Bul" ön-kontrol popup'ı aktif — yetkili seçimi tamamlanınca oraya geri dönülür

function iletisimGonderKontrolluBaslat(tip){
  if(!seciliYetkililer.length){
    document.getElementById('iletisimIslemleriModal').style.display='none';
    if(musteriKartIdx===null){
      showToast("⚠️ Göndermeden önce müşteri kartından yetkili kişi seçmelisiniz.", 5000);
      return;
    }
    yetkiliSecimSonrasiGonder = tip;
    showToast("⚠️ Göndermeden önce yetkili kişi seçmelisiniz.", 4000);
    musteriIletisimYetkiliSecmeyeAc();
    return;
  }
  document.getElementById('iletisimIslemleriModal').style.display='none';
  iletisimGonderimYap(tip);
}

function iletisimGonderimYap(tip){
  if(tip==='mail') resimVeEpostaGonder();
  else if(tip==='whatsapp') resimVeWhatsappGonder();
  else if(tip==='whatsappYedek') sendWhatsAppMessage();
}

// Müşteri Kartı'ndan yetkili EKLE/DÜZENLE/SİL yönetim ekranını açar (seçim modu
// DEĞİL — sadece CRUD). Kapatılınca Müşteri Kartı'na geri döner.
function musteriIletisimAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  iletisimSecimModu = false;
  kisiSeciciAmaci = "temas";
  document.getElementById("iletisimSecimModuUyari").style.display = "none";
  document.getElementById("musteriIletisimFirmaAdi").textContent = m.ad||"";
  document.getElementById("micIsim").value = "";
  document.getElementById("micBolum").value = "";
  document.getElementById("micGorev").value = "";
  document.getElementById("micTelefon").value = "";
  document.getElementById("micEposta").value = "";
  musteriIletisimTabSec((m.iletisimler && m.iletisimler.length>0) ? "kisiler" : "ekle");
  document.getElementById("musteriCariKartModal").style.display="none";
  document.getElementById("musteriIletisimModal").style.display="flex";
}

function musteriIletisimKisiSecmeyeAc(){
  // Temas Kaydı ekranından "kiminle görüştünüz?" için çağrılır
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  iletisimSecimModu = true;
  kisiSeciciAmaci = "temas";
  document.getElementById("iletisimSecimModuUyari").textContent = "👤 Temas kaydı için kiminle görüştüğünüzü seçin";
  document.getElementById("iletisimSecimModuUyari").style.display = "block";
  document.getElementById("musteriIletisimFirmaAdi").textContent = m.ad||"";
  musteriIletisimTabSec((m.iletisimler && m.iletisimler.length>0) ? "kisiler" : "ekle");
  document.getElementById("musteriZiyaretModal").style.display="none";
  document.getElementById("musteriIletisimModal").style.display="flex";
}

function musteriIletisimYetkiliSecmeyeAc(){
  // Müşteri kartından veya Ürün Bul ön-kontrolünden "Yetkili Kişi" seçmek için
  // çağrılır — bu işlem/mail boyunca kullanılacak kişi
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  // Eski "Yetkili" metin alanı doluysa ve İletişim Kişileri hiç eklenmemişse, otomatik ilk kişi olarak senkronize et
  if(m.yetkili && (!m.iletisimler || m.iletisimler.length===0)){
    var otomatikKisi = yetkiliMetniIletisimeCevir(m.yetkili);
    if(otomatikKisi && otomatikKisi.isim){
      m.iletisimler = [otomatikKisi];
      musteriListesiniKaydet();
      if(window.fbSet) musteriListesiGuvenliKaydet(m).catch(function(e){ console.error("Firebase yazma hatası:", e); });
    }
  }
  iletisimSecimModu = true;
  kisiSeciciAmaci = "yetkili";
  document.getElementById("iletisimSecimModuUyari").textContent = "👤 Bu işlem/mail için yetkili kişiyi seçin";
  document.getElementById("iletisimSecimModuUyari").style.display = "block";
  document.getElementById("musteriIletisimFirmaAdi").textContent = m.ad||"";
  musteriIletisimTabSec((m.iletisimler && m.iletisimler.length>0) ? "kisiler" : "ekle");
  if(urunBulKontrolAktif){
    var ubkModal = document.getElementById("urunBulOnKontrolModal");
    if(ubkModal) ubkModal.style.display="none";
  } else {
    document.getElementById("musteriKartModal").style.display="none";
  }
  document.getElementById("musteriIletisimModal").style.display="flex";
}

function musteriIletisimKapat(){
  document.getElementById("musteriIletisimModal").style.display="none";
  if(iletisimSecimModu){
    iletisimSecimModu = false;
    if(kisiSeciciAmaci==="yetkili"){
      if(yetkiliSecimSonrasiGonder){
        yetkiliSecimSonrasiGonder = null;
        showToast("Gönderim iptal edildi — yetkili kişi seçilmedi.", 3000);
      }
      if(urunBulKontrolAktif){
        document.getElementById("urunBulOnKontrolModal").style.display="flex";
        urunBulOnKontrolRenderEt();
      } else {
        document.getElementById("musteriKartModal").style.display="flex";
      }
    } else {
      document.getElementById("musteriZiyaretModal").style.display="flex";
    }
  } else {
    document.getElementById("musteriCariKartModal").style.display="flex";
    cariKartYetkiliListesiniRenderEt();
  }
}

function musteriIletisimTabSec(tab){
  var btnKisiler = document.getElementById("iletisimTabKisiler");
  var btnEkle = document.getElementById("iletisimTabEkle");
  var icerikKisiler = document.getElementById("iletisimKisilerTabIcerik");
  var icerikEkle = document.getElementById("iletisimEkleTabIcerik");
  if(tab==="ekle"){
    btnEkle.style.background="#1a4d8f"; btnEkle.style.color="#fff";
    btnKisiler.style.background="transparent"; btnKisiler.style.color="#1a4d8f";
    icerikEkle.style.display="block"; icerikKisiler.style.display="none";
    // Varsayılan olarak "yeni kişi ekle" moduna sıfırla — yetkiliKisiDuzenleAc bu
    // çağrıdan HEMEN SONRA kendi düzenleme durumunu ayarlayıp üzerine yazıyor.
    micDuzenlenenIndex = null;
    document.getElementById("micIsim").value = "";
    document.getElementById("micBolum").value = "";
    document.getElementById("micGorev").value = "";
    document.getElementById("micTelefon").value = "";
    document.getElementById("micEposta").value = "";
    document.getElementById("micBaslik").textContent = "+ Yeni Kişi Ekle";
    document.getElementById("micKaydetBtn").textContent = "+ Kişiyi Ekle";
  } else {
    btnKisiler.style.background="#1a4d8f"; btnKisiler.style.color="#fff";
    btnEkle.style.background="transparent"; btnEkle.style.color="#1a4d8f";
    icerikKisiler.style.display="block"; icerikEkle.style.display="none";
    musteriIletisimListesiRenderEt();
  }
}

function musteriIletisimListesiRenderEt(){
  var el = document.getElementById("musteriIletisimListesi");
  if(!el || musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var liste = m.iletisimler || [];
  var sayacEl = document.getElementById("iletisimTabSayac");
  if(sayacEl) sayacEl.textContent = liste.length;
  if(liste.length===0){
    el.innerHTML = "<div style='text-align:center;padding:20px 0;'>"
      + "<div style='color:#888;font-size:27px;margin-bottom:18px;'>Henüz kayıtlı iletişim kişisi yok.</div>"
      + "<button onclick=\"musteriIletisimTabSec('ekle')\" style='width:100%;background:linear-gradient(135deg,#16a085,#0e8a72);color:#fff;border:none;padding:22px;font-size:28px;font-weight:900;border-radius:10px;cursor:pointer;'>+ Yeni Yetkili Kişi Ekle</button>"
      + "</div>";
    return;
  }
  var html = "";
  if(iletisimSecimModu && kisiSeciciAmaci==="yetkili"){
    html += "<div style='background:#eef4fb;border:1.5px solid #c3d7f0;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:15px;font-weight:700;color:#3569b8;'>💡 Birden fazla yetkili seçebilirsin — istediğin kadar kişiye dokun, bitince altta \"✓ Tamam\" de.</div>";
  }
  for(var i=0;i<liste.length;i++){
    var k = liste[i];
    var secili = iletisimSecimModu && (kisiSeciciAmaci==="yetkili" ? seciliYetkililer.some(function(sy){return sy.isim===k.isim;}) : (ziyaretSeciliKisi && ziyaretSeciliKisi.isim===k.isim));
    html += "<div "+(iletisimSecimModu ? "onclick='"+(kisiSeciciAmaci==="yetkili"?"yetkiliKisiToggle(":"ziyaretKisiSec(")+i+")'" : "")+" style='cursor:"+(iletisimSecimModu?"pointer":"default")+";background:"+(secili?"#eafaf3":"#f7f9fc")+";border:2px solid "+(secili?"#16a085":"#d5dce6")+";border-radius:8px;padding:20px 22px;margin-bottom:14px;'>"
      +"<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:12px;'>"
      +"<div style='flex:1;display:flex;align-items:flex-start;gap:14px;'>"
      +(iletisimSecimModu ? "<span style='flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 12px;border-radius:20px;font-size:16px;font-weight:800;border:2px solid #16a085;background:"+(secili?"#16a085":"#eafaf3")+";color:"+(secili?"#fff":"#0e7a60")+";white-space:nowrap;margin-top:3px;'>"+(secili?"✓ Seçili":"Seç")+"</span>" : "")
      +"<div>"
      +"<div style='font-size:32px;font-weight:900;color:#222;'>"+(k.isim||"-")+"</div>"
      +(k.bolum||k.gorev ? "<div style='font-size:24px;color:#666;margin-top:3px;'>"+[k.bolum,k.gorev].filter(Boolean).join(" · ")+"</div>" : "")
      +(k.telefon ? "<div style='font-size:26px;color:#003a70;margin-top:9px;'>📞 "+k.telefon+"</div>" : "")
      +(k.eposta ? "<div style='font-size:26px;color:#003a70;margin-top:3px;'>✉️ "+k.eposta+"</div>" : "")
      +"</div></div>"
      +"<div style='display:flex;flex-direction:column;gap:8px;'>"
      +"<button onclick='event.stopPropagation();yetkiliKisiDuzenleAc("+i+")' style='background:#eef4fb;color:#003a70;border:1px solid #003a70;padding:14px 20px;border-radius:6px;font-weight:bold;font-size:22px;cursor:pointer;white-space:nowrap;'>✏️ Düzenle</button>"
      +"<button onclick='event.stopPropagation();musteriIletisimSil("+i+")' style='background:#f8d7da;color:#e0524a;border:1px solid #e0524a;padding:14px 20px;border-radius:6px;font-weight:bold;font-size:22px;cursor:pointer;white-space:nowrap;'>🗑 Sil</button>"
      +"</div>"
      +"</div>"
      +"</div>";
  }
  el.innerHTML = html + (iletisimSecimModu ? "<button onclick=\"musteriIletisimTabSec('ekle')\" style='width:100%;background:linear-gradient(135deg,#3d76a3,#2c5a80);color:#fff;border:none;padding:22px;font-size:28px;font-weight:800;border-radius:10px;cursor:pointer;margin-top:4px;'>＋ Bir Kişi Daha Ekle</button>" : "")
    + (iletisimSecimModu && kisiSeciciAmaci==="yetkili" ? "<button onclick=\"yetkiliSecimiTamamla()\" style='width:100%;background:linear-gradient(135deg,#16a085,#0e8a72);color:#fff;border:none;padding:22px;font-size:30px;font-weight:900;border-radius:10px;cursor:pointer;margin-top:10px;'>✓ Tamam ("+seciliYetkililer.length+" seçili)</button>" : "");
}

// Seçim modunda + amaç "yetkili" ise: TOGGLE (ekle/çıkar), modal AÇIK kalır —
// kullanıcı istediği kadar kişi seçebilsin. Diğer amaçlarda (ziyaret gibi)
// davranış eskisi gibi: seç ve modalı kapat (tekli seçim).
function yetkiliKisiToggle(i){
  var m = musteriListesi[musteriKartIdx];
  if(!m || !m.iletisimler || !m.iletisimler[i]) return;
  var k = m.iletisimler[i];
  var idx = seciliYetkililer.findIndex(function(sy){ return sy.isim===k.isim; });
  if(idx>=0){ seciliYetkililer.splice(idx,1); }
  else { seciliYetkililer.push({isim:k.isim, bolum:k.bolum||"", gorev:k.gorev||"", telefon:k.telefon||"", eposta:k.eposta||""}); }
  localStorage.setItem("weicon_secili_yetkililer", JSON.stringify(seciliYetkililer));
  yetkiliKisiEtiketGuncelle();
  if(typeof musteriSeritiGuncelle==="function") musteriSeritiGuncelle();
  musteriIletisimListesiRenderEt();
}
function yetkiliSecimiTamamla(){
  iletisimSecimModu = false;
  document.getElementById("musteriIletisimModal").style.display="none";
  if(yetkiliSecimSonrasiGonder){
    var bekleyenTip = yetkiliSecimSonrasiGonder;
    yetkiliSecimSonrasiGonder = null;
    iletisimGonderimYap(bekleyenTip);
    return;
  }
  var ubkModal = document.getElementById("urunBulOnKontrolModal");
  if(ubkModal && (ubkModal.style.display==="flex" || (typeof urunBulKontrolAktif!=="undefined" && urunBulKontrolAktif))){
    ubkModal.style.display="flex";
    if(typeof urunBulOnKontrolRenderEt==="function") urunBulOnKontrolRenderEt();
  }
  if(typeof belgeBilgileriOzetGuncelle==="function") belgeBilgileriOzetGuncelle();
}

function ziyaretKisiSec(i){
  var m = musteriListesi[musteriKartIdx];
  if(!m || !m.iletisimler || !m.iletisimler[i]) return;
  var k = m.iletisimler[i];
  var secilenKisi = {isim:k.isim, bolum:k.bolum||"", gorev:k.gorev||"", telefon:k.telefon||"", eposta:k.eposta||""};
  iletisimSecimModu = false;
  document.getElementById("musteriIletisimModal").style.display="none";
  ziyaretSeciliKisi = secilenKisi;
  document.getElementById("musteriZiyaretModal").style.display="flex";
  ziyaretKisiEtiketGuncelle();
}

var micDuzenlenenIndex = null; // null = yeni kişi ekleniyor, sayı = o index'teki kişi düzenleniyor

function yetkiliKisiDuzenleAc(i){
  var m = musteriListesi[musteriKartIdx];
  if(!m || !m.iletisimler || !m.iletisimler[i]) return;
  var k = m.iletisimler[i];
  musteriIletisimTabSec("ekle");
  micDuzenlenenIndex = i;
  document.getElementById("micIsim").value = k.isim||"";
  document.getElementById("micBolum").value = k.bolum||"";
  document.getElementById("micGorev").value = k.gorev||"";
  document.getElementById("micTelefon").value = k.telefon||"";
  document.getElementById("micEposta").value = k.eposta||"";
  document.getElementById("micBaslik").textContent = "✏️ Kişiyi Düzenle";
  document.getElementById("micKaydetBtn").textContent = "✓ Değişiklikleri Kaydet";
}

function musteriIletisimEkle(){
  if(musteriKartIdx===null) return;
  var idx = musteriKartIdx;
  if(!musteriListesi[idx]) return;
  var orijinalAd = musteriListesi[idx].ad;
  var orijinalId = musteriListesi[idx].id || null;
  var isim = document.getElementById("micIsim").value.trim();
  if(!isim){ showToast("İsim girmeniz gerekiyor."); return; }
  var yeniKisi = {
    isim: isim,
    bolum: document.getElementById("micBolum").value.trim(),
    gorev: document.getElementById("micGorev").value.trim(),
    telefon: document.getElementById("micTelefon").value.trim(),
    eposta: document.getElementById("micEposta").value.trim()
  };
  var duzenlenenIdx = micDuzenlenenIndex;
  document.getElementById("micIsim").value = "";
  document.getElementById("micBolum").value = "";
  document.getElementById("micGorev").value = "";
  document.getElementById("micTelefon").value = "";
  document.getElementById("micEposta").value = "";
  document.getElementById("micBaslik").textContent = "+ Yeni Kişi Ekle";
  document.getElementById("micKaydetBtn").textContent = "+ Kişiyi Ekle";
  micDuzenlenenIndex = null;

  function guncellemeyiUygula(guncelListe){
    // Kalıcı ID ile eşleştir (isim değişmiş/aynı isimde başka müşteri olsa bile şaşmaz).
    // ID yoksa (çok eski kayıt) isimle, o da olmazsa index'e düş.
    var hedefIdx = orijinalId ? guncelListe.findIndex(function(x){ return x.id===orijinalId; }) : -1;
    if(hedefIdx===-1) hedefIdx = guncelListe.findIndex(function(x){ return x.ad===orijinalAd; });
    if(hedefIdx===-1) hedefIdx = idx;
    if(!guncelListe[hedefIdx]) return;
    if(!guncelListe[hedefIdx].iletisimler) guncelListe[hedefIdx].iletisimler = [];
    if(duzenlenenIdx!==null && guncelListe[hedefIdx].iletisimler[duzenlenenIdx]){
      guncelListe[hedefIdx].iletisimler[duzenlenenIdx] = yeniKisi;
    } else {
      guncelListe[hedefIdx].iletisimler.push(yeniKisi);
    }
    musteriListesi = guncelListe;
    musteriKartIdx = hedefIdx;
    lsSet("weicon_musteriler", musteriListesi);
    var yeniUzunluk = musteriListesi[hedefIdx].iletisimler.length;
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).then(function(){
        showToast("✓ İletişim kişisi eklendi ve Firebase'e yazıldı ✓");
      }).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    } else {
      showToast("✓ İletişim kişisi eklendi (yerel).");
    }
    musteriIletisimListesiRenderEt();
    if(typeof cariKartYetkiliListesiniRenderEt==="function") cariKartYetkiliListesiniRenderEt();
    var badgeK = document.getElementById("badgeIletisim");
    if(badgeK) badgeK.textContent = yeniUzunluk;
    // Artık kişi eklendiğinde otomatik seçip işlemi kapatmıyoruz — kullanıcı
    // "Kişiler" listesine dönüyor, istediği kadar kişi daha ekleyebiliyor,
    // hangisini kullanmak istiyorsa ona dokunarak seçiyor.
    musteriIletisimTabSec("kisiler");
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){
      guncellemeyiUygula(lsGet("weicon_musteriler",[]));
    });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

function musteriIletisimSil(i){
  if(musteriKartIdx===null) return;
  var idx = musteriKartIdx;
  if(!musteriListesi[idx]) return;
  var orijinalAd = musteriListesi[idx].ad;
  var orijinalId = musteriListesi[idx].id || null;

  function guncellemeyiUygula(guncelListe){
    var hedefIdx = orijinalId ? guncelListe.findIndex(function(x){ return x.id===orijinalId; }) : -1;
    if(hedefIdx===-1) hedefIdx = guncelListe.findIndex(function(x){ return x.ad===orijinalAd; });
    if(hedefIdx===-1) hedefIdx = idx;
    if(!guncelListe[hedefIdx] || !guncelListe[hedefIdx].iletisimler) return;
    guncelListe[hedefIdx].iletisimler.splice(i,1);
    musteriListesi = guncelListe;
    musteriKartIdx = hedefIdx;
    lsSet("weicon_musteriler", musteriListesi);
    var yeniUzunluk = musteriListesi[hedefIdx].iletisimler.length;
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    }
    musteriIletisimListesiRenderEt();
    if(typeof cariKartYetkiliListesiniRenderEt==="function") cariKartYetkiliListesiniRenderEt();
    var badgeK = document.getElementById("badgeIletisim");
    if(badgeK) badgeK.textContent = yeniUzunluk;
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){
      guncellemeyiUygula(lsGet("weicon_musteriler",[]));
    });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

// BİLDİRİM SİSTEMİ — 15/30/33 günlük hatırlatma: açık (siparişe dönmemiş) NUMUNE/TEKLİF/PROFORMA'lar
function bildirimleriHesapla(){
  var sonuc = [];
  var bugun = Date.now();
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    var acikKayit = musteriAcikSurecKaydiGetir(m.ad);
    if(!acikKayit) continue;
    var gunFarki = Math.floor((bugun - acikKayit.ts) / 86400000);
    if(gunFarki < 15) continue;
    var seviye = gunFarki >= 33 ? "kritik" : (gunFarki >= 30 ? "ikinci" : "ilk");
    sonuc.push({musteri:m.ad, sehir:m.sehir||"", tip:acikKayit.tip, ts:acikKayit.ts, tarih:acikKayit.tarih, gun:gunFarki, seviye:seviye, urunSayisi:(acikKayit.kayit.urunler||[]).length});
  }
  sonuc.sort(function(a,b){ return b.gun-a.gun; });
  return sonuc;
}

// ZİYARET HATIRLATMASI — 15+ gündür ziyaret edilmeyen firmalar
function ziyaretHatirlatmalariHesapla(){
  var sonuc = [];
  var bugun = Date.now();
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    var liste = m.ziyaretGecmisi||[];
    if(liste.length===0) continue;
    var enSonTs = Math.max.apply(null, liste.map(function(z){ return z.ts||0; }));
    var gunFarki = Math.floor((bugun - enSonTs) / 86400000);
    if(gunFarki < 15) continue;
    sonuc.push({musteri:m.ad, sehir:m.sehir||"", gun:gunFarki});
  }
  sonuc.sort(function(a,b){ return b.gun-a.gun; });
  return sonuc;
}

// ============================================================
// GÖREV SİSTEMİ — müşteri kartından "Görev Gir" ile hatırlatma
// tarih/saat + açıklama tanımlama, "Görevlerim" listesinden takip.
// ============================================================
function gorevleriYukle(cb){
  if(window.fbGet){
    window.fbGet("gorevler").then(function(data){
      gorevListesi = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      lsSet("weicon_gorevler", gorevListesi);
      if(cb) cb();
    }).catch(function(){
      gorevListesi = lsGet("weicon_gorevler", []);
      if(cb) cb();
    });
  } else {
    gorevListesi = lsGet("weicon_gorevler", []);
    if(cb) cb();
  }
}

function gorevleriKaydet(){
  lsSet("weicon_gorevler", gorevListesi);
  if(window.fbSet) window.fbSet("gorevler", gorevListesi).catch(function(e){ console.error("Firebase yazma hatası:", e); });
}

function gorevTanimlaAc(){
  if(musteriKartIdx===null || !musteriListesi[musteriKartIdx]) return;
  document.getElementById("gorevTanimlaMusteriAdi").textContent = musteriListesi[musteriKartIdx].ad || "";
  document.getElementById("gorevAciklamaInput").value = "";
  var simdi = new Date();
  var bugunKey = kmTarihAnahtari ? kmTarihAnahtari(simdi) : simdi.toISOString().slice(0,10);
  document.getElementById("gorevBaslangicTarihInput").value = bugunKey;
  document.getElementById("gorevBitisTarihInput").value = bugunKey;
  var saatVarsayilan = new Date(simdi.getTime()+60*60*1000); // varsayılan: 1 saat sonrası
  document.getElementById("gorevSaatInput").value = ("0"+saatVarsayilan.getHours()).slice(-2)+":"+("0"+saatVarsayilan.getMinutes()).slice(-2);
  document.getElementById("gorevTanimlaModal").style.display="flex";
}
