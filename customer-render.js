/*
  customer-render.js
  ==================
  Eski uygulamanın musteriListesiniRenderEt() mantığıyla BİREBİR aynı:
  - Arama yokken: sadece en son eklenen 12 müşteri (dizinin başı, çünkü yeni
    kayıtlar unshift ile başa ekleniyor), + "Tüm Müşterileri Göster" butonu.
  - Arama aktifken: TÜM eşleşenler, en son görüntülenene göre sıralı.
  - Her satır: isim + (varsa) ziyaret rozeti üstte; müşteri kodu + şehir altta.
    Zebra desenli (bir alt, bir üst renk).
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

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function cariSatirHTML(kod, isim, sehir){
  return "<span class='cari-kod'>" + htmlEsc(kod||"—") + "</span>"
    + "<span class='cari-ayrac'> - </span>"
    + "<span class='cari-isim'>" + htmlEsc(isim||"") + "</span>"
    + (sehir ? "<span class='cari-ayrac'> - </span><span class='cari-sehir'>" + htmlEsc(sehir) + "</span>" : "");
}

var tumMusterilerModuAktif = false;

// Bir müşterinin "son aktivite" zamanı = en son ziyaret VEYA en son işlem
// tarihinden hangisi daha yeniyse. Arama/Tüm Müşteriler sıralamasında
// en son aktif olan müşteriler öne çıksın diye kullanılır.
var musteriSonIslemHaritasi = null; // musteriId -> son işlem ts (sıralama için)
var musteriSonIslemDetayHaritasi = null; // musteriId -> {tip, durum, ts}
var musteriSonBelgeTemasHaritasi = null; // musteriId -> {harf, ts} (mail/whatsapp gönderimi)
// HATA DÜZELTME (WG.080926.196): bazı eski/aktarılmış sipariş-teklif
// kayıtlarında musteriId hiç yok (sadece isim var) — bu kayıtlar id
// bazlı haritalarda hiç görünmüyor, müşteri listesinde yakın zamanlı
// işlemi olan müşteriler için bile yanlışlıkla "İşlem yok"/"Temas yok"
// gösteriliyordu. Bu üç harita, musteriId'si OLMAYAN kayıtlar için
// isim bazlı YEDEK arama sağlar.
var musteriSonIslemHaritasiAd = null;
var musteriSonIslemDetayHaritasiAd = null;
var musteriSonBelgeTemasHaritasiAd = null;
function sonIslemHaritasiniHazirla(){
  var ts = {}, detay = {}, belgeTemas = {};
  var tsAd = {}, detayAd = {}, belgeTemasAd = {};
  try{
    if(typeof ReportsData !== "undefined"){
      ReportsData.sonIslemler().forEach(function(k){
        var adAnahtar = (k.musteri||"").toLocaleLowerCase("tr-TR");
        var hedefTs = k.musteriId ? ts : (adAnahtar ? tsAd : null);
        var hedefDetay = k.musteriId ? detay : (adAnahtar ? detayAd : null);
        var hedefBelgeTemas = k.musteriId ? belgeTemas : (adAnahtar ? belgeTemasAd : null);
        var anahtar = k.musteriId || adAnahtar;
        if(!hedefTs) return;
        if(!hedefTs[anahtar] || k.ts > hedefTs[anahtar]) hedefTs[anahtar] = k.ts;
        if(!hedefDetay[anahtar] || k.ts > hedefDetay[anahtar].ts){
          hedefDetay[anahtar] = {tip:k.tip, durum:k.durum, ts:k.ts};
        }
        if(k.kanal === "mail" || k.kanal === "whatsapp"){
          var harf = k.kanal === "mail" ? "M" : "W";
          if(!hedefBelgeTemas[anahtar] || k.ts > hedefBelgeTemas[anahtar].ts){
            hedefBelgeTemas[anahtar] = {harf:harf, ts:k.ts};
          }
        }
      });
    }
  }catch(e){}
  musteriSonIslemHaritasi = ts;
  musteriSonIslemDetayHaritasi = detay;
  musteriSonBelgeTemasHaritasi = belgeTemas;
  musteriSonIslemHaritasiAd = tsAd;
  musteriSonIslemDetayHaritasiAd = detayAd;
  musteriSonBelgeTemasHaritasiAd = belgeTemasAd;
}
function sonAktiviteZamani(m){
  var adAnahtar = (m.ad||"").toLocaleLowerCase("tr-TR");
  var sonIslem = (musteriSonIslemHaritasi && m.id) ? musteriSonIslemHaritasi[m.id] : null;
  if(sonIslem == null && musteriSonIslemHaritasiAd) sonIslem = musteriSonIslemHaritasiAd[adAnahtar];
  var aday = [m.sonZiyaret||0, sonIslem||0];
  return Math.max.apply(null, aday);
}

var GUNLER_KISA = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
function tarihFormatlaKisa(ts){
  var d = new Date(ts);
  var gg = String(d.getDate()).padStart(2,"0");
  var aa = String(d.getMonth()+1).padStart(2,"0");
  return gg + "." + aa + "." + d.getFullYear() + " " + GUNLER_KISA[d.getDay()];
}

// En son TEMAS: ziyaret (Z), temas/telefon (T), mail gönderimi (M) veya
// WhatsApp gönderimi (W) — hangisi en yeni tarihliyse o gösterilir.
function sonTemasBilgisi(m){
  var adaylar = [];
  (m.ziyaretGecmisi||[]).forEach(function(z){
    if(z.tur === "ziyaret") adaylar.push({harf:"Z", ts:z.ts||0});
    else if(z.tur === "temas") adaylar.push({harf:"T", ts:z.ts||0});
  });
  var adAnahtar = (m.ad||"").toLocaleLowerCase("tr-TR");
  var belgeTemas = (musteriSonBelgeTemasHaritasi && m.id) ? musteriSonBelgeTemasHaritasi[m.id] : null;
  if(!belgeTemas && musteriSonBelgeTemasHaritasiAd) belgeTemas = musteriSonBelgeTemasHaritasiAd[adAnahtar];
  if(belgeTemas) adaylar.push(belgeTemas);
  if(!adaylar.length) return null;
  adaylar.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  return adaylar[0];
}

// En son İŞLEM: numune (N), teklif (FT), proforma (PF), sipariş (S) —
// beklemede olan sipariş için BKS. Temas rozeti gibi tarihi de gösterir.
var ISLEM_HARF = {numune:"N", teklif:"FT", proforma:"PF"};
function sonIslemBilgisi(m){
  var adAnahtar = (m.ad||"").toLocaleLowerCase("tr-TR");
  var kayit = (musteriSonIslemDetayHaritasi && m.id) ? musteriSonIslemDetayHaritasi[m.id] : null;
  if(!kayit && musteriSonIslemDetayHaritasiAd) kayit = musteriSonIslemDetayHaritasiAd[adAnahtar];
  if(!kayit) return null;
  var harf = kayit.tip === "siparis"
    ? (kayit.durum === "beklemede" ? "BKS" : "S")
    : (ISLEM_HARF[kayit.tip] || null);
  if(!harf) return null;
  return {harf:harf, ts:kayit.ts};
}

function temasIslemRozetleriHTML(m){
  var temas = sonTemasBilgisi(m);
  var islem = sonIslemBilgisi(m);
  var temasHTML = temas
    ? "<span class='musteri-rozet musteri-rozet--temas'>Temas: " + temas.harf + " " + tarihFormatlaKisa(temas.ts) + "</span>"
    : "<span class='musteri-rozet musteri-rozet--yok'>Temas yok</span>";
  var islemHTML = islem
    ? "<span class='musteri-rozet musteri-rozet--islem" + (islem.harf==="BKS" ? " musteri-rozet--beklemede" : "") + "'>İşlem: " + islem.harf + " " + tarihFormatlaKisa(islem.ts) + "</span>"
    : "<span class='musteri-rozet musteri-rozet--yok'>İşlem yok</span>";
  return "<div class='musteri-rozet-satiri'>" + temasHTML + islemHTML + "</div>";
}


function listeyiCiz(){
  try{
    sonIslemHaritasiniHazirla();
    var q = document.getElementById("musteriAra").value;
    var kapsayici = document.getElementById("musteriListesi");
    var bos = document.getElementById("musteriBosMesaj");
    var yukleniyor = document.getElementById("musteriYukleniyor");
    var bilgiNotuEl = document.getElementById("listeBilgiNotu");
    var tumBtn = document.getElementById("btnTumMusteriler");
    var sehirFiltre = document.getElementById("musteriSehirFiltre").value;
    var tarihSirala = "eskiden-yeniye";

    if(CustomerData.uzunluk() === 0){
      kapsayici.innerHTML = "";
      bos.hidden = true;
      yukleniyor.hidden = false;
      tumBtn.hidden = true;
      bilgiNotuEl.hidden = true;
      return;
    }
    yukleniyor.hidden = true;

    var sonuclar = CustomerData.ara(q);
    var aramaAktif = q.trim().length > 0;
    bilgiNotuEl.hidden = true;
    bilgiNotuEl.className = "liste-bilgi-notu";

    if(sehirFiltre) sonuclar = sonuclar.filter(function(m){ return (m.sehir||"").toLocaleLowerCase("tr-TR").indexOf(sehirFiltre.toLocaleLowerCase("tr-TR")) >= 0; });

    var siralamaModuAktif = aramaAktif || tumMusterilerModuAktif || !!sehirFiltre;

    if(siralamaModuAktif){
      sonuclar = sonuclar.slice().sort(function(a,b){
        var fark = sonAktiviteZamani(a) - sonAktiviteZamani(b);
        return tarihSirala === "yeniden-eskiye" ? -fark : fark;
      });
      tumBtn.hidden = true;
      if(tumMusterilerModuAktif && !aramaAktif && !sehirFiltre){
        bilgiNotuEl.hidden = false;
        bilgiNotuEl.className = "liste-bilgi-notu liste-bilgi-notu--yesil";
        bilgiNotuEl.textContent = "👥 Tüm müşteriler (toplam " + sonuclar.length + ").";
      }
    } else {
      var toplamSayi = sonuclar.length;
      sonuclar = sonuclar.slice(0, 12);
      if(toplamSayi > 12){
        bilgiNotuEl.hidden = false;
        bilgiNotuEl.textContent = "En son kayıt edilen 12 müşteri gösteriliyor · toplam " + toplamSayi + " müşteri sistemde kayıtlı.";
        tumBtn.hidden = false;
      } else {
        tumBtn.hidden = true;
      }
    }

    if(sonuclar.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = "<div class='musteri-liste-kutu'>" + sonuclar.map(function(m, i){
      var zebraSinif = (i%2===1) ? "musteri-karti--alt" : "musteri-karti--ust";
      return "<div class='musteri-karti " + zebraSinif + "' data-i='" + i + "'>"
        + "<div class='musteri-karti-satir'>"
        + "<div class='musteri-icerik'>"
        + "<div class='musteri-ust-satir'><span class='musteri-cari-metin'>" + cariSatirHTML(m.id, m.ad, m.sehir) + "</span></div>"
        + temasIslemRozetleriHTML(m)
        + "</div>"
        + "<div class='musteri-ok-alan'><svg width='8' height='12' viewBox='0 0 20 32' fill='none'><path d='M4 4 L16 16 L4 28' stroke='#e24b4a' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg></div>"
        + "</div>"
        + "</div>";
    }).join("") + "</div>";

    kapsayici.querySelectorAll(".musteri-karti").forEach(function(kart, i){
      kart.onclick = function(){
        CustomerData.sec(sonuclar[i]);
        CustomerData.sonGoruntulendi(sonuclar[i].ad);
        // Müşteri arama sonuçlarından seçim her zaman Müşteri Kartı'na
        // gider — sepette eskiden kalmış bir ürün olması bu rotayı
        // etkilemez (eskiden "yarım kalan işlemi tamamla" mantığıyla
        // send.html'e atlıyordu, bu yanlış rotaydı).
        window.location.href = "customer-detail.html";
      };
    });
  }catch(e){ hataGoster("Liste çizilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("musteriAra").addEventListener("input", listeyiCiz);
  document.getElementById("musteriSehirFiltre").addEventListener("input", listeyiCiz);
  document.getElementById("btnTumMusteriler").onclick = function(){
    tumMusterilerModuAktif = true;
    listeyiCiz();
  };
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  CustomerData.listeDegistiginde(listeyiCiz);
  // HATA DÜZELTME (WG.080926.196): Temas/İşlem rozetleri ReportsData'ya
  // bağlı ama liste sadece CustomerData değiştiğinde yeniden çiziliyordu.
  // Sayfa ilk açıldığında ReportsData henüz yüklenmemiş olabiliyordu —
  // veri sonradan gelince liste hiç tazelenmiyor, rozetler kalıcı olarak
  // "yok" görünüyordu. Artık ReportsData değiştiğinde de yeniden çiziliyor.
  if(typeof ReportsData !== "undefined") ReportsData.arsivDegistiginde(listeyiCiz);
  listeyiCiz();
});
