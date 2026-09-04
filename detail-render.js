/*
  detail-render.js
  ================
  Seçili müşterinin bilgilerini, sipariş geçmişini (ReportsData.sonIslemler
  üzerinden filtrelenmiş) ve ziyaret geçmişini gösterir.
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

var TIP_ETIKET = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};

function fmtG(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}
var seciliMusteriAdi = null;

function ustBilgiyiCiz(musteri){
  document.getElementById("detayAd").textContent = musteri.ad;
  document.getElementById("detayKod").textContent = musteri.id ? ("🏷 Müşteri Kodu: " + musteri.id) : "";

  var bilgiParcalar = [];
  if(musteri.sehir) bilgiParcalar.push(musteri.sehir);
  if(musteri.vade) bilgiParcalar.push(musteri.vade + " vade");
  var ilkYetkili = (musteri.iletisimler && musteri.iletisimler[0]) ? musteri.iletisimler[0].isim : null;
  if(ilkYetkili) bilgiParcalar.push(ilkYetkili);
  document.getElementById("detayOzetSatir").textContent = bilgiParcalar.join(" · ");

  var ziyaretSayisi = (musteri.ziyaretGecmisi||[]).length;
  document.getElementById("badgeZiyaret").textContent = ziyaretSayisi;
  document.getElementById("temasAlt").textContent = ziyaretSayisi>0 ? (ziyaretSayisi + " kayıtlı temas") : "Henüz temas kaydı yok";
}

function ayniMusteriKaydiMi(kayitMusteriAdi, kayitMusteriId, seciliAd, seciliId){
  // Sadece isim birebir eşleşmesi YETERSİZ — müşteri ismi sonradan
  // düzenlenmiş (kısaltılmış/uzatılmış) olabilir, o zaman eski kayıtlar
  // görünmez olur. Önce Müşteri Kodu (ID) ile, o yoksa isimle, o da tam
  // eşleşmezse "biri diğerinin içinde geçiyor mu" kontrolüyle eşleştir.
  if(seciliId && kayitMusteriId) return kayitMusteriId === seciliId;
  var a = (kayitMusteriAdi||"").toLocaleLowerCase("tr-TR").trim();
  var b = (seciliAd||"").toLocaleLowerCase("tr-TR").trim();
  if(!a || !b) return false;
  if(a === b) return true;
  return a.indexOf(b) === 0 || b.indexOf(a) === 0;
}

// Tam liste artık ayrı bir sayfada (bkz. gecmis.html / gecmis-render.js —
// rota, filtre çipleri, en yeniden en eskiye sıralı renkli kartlar).
// Burada sadece "İşlem Geçmişi" kutucuğundaki sayaç/alt metin güncellenir.
function siparisGecmisiniCiz(){
  try{
    var seciliMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    var seciliId = seciliMusteri ? seciliMusteri.id : null;
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return ayniMusteriKaydiMi(k.musteri, k.musteriId, seciliMusteriAdi, seciliId); });

    document.getElementById("badgeGecmis").textContent = bunaAit.length;
    document.getElementById("gecmisAlt").textContent = bunaAit.length>0 ? (bunaAit.length + " kayıtlı işlem") : "Henüz kayıt yok";
  }catch(e){ hataGoster("Sipariş geçmişi sayacı güncellenemedi: " + e.message); }
}

function ziyaretGecmisiniCiz(musteri){
  try{
    var liste = (musteri.ziyaretGecmisi || []).slice().sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    var kapsayici = document.getElementById("detayZiyaretListesi");
    var bos = document.getElementById("detayZiyaretBos");

    if(liste.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;
    kapsayici.innerHTML = liste.map(function(z){
      var d = new Date(z.ts);
      var tarihStr = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear();
      return "<div class='gecmis-karti'>"
        + "<div class='gecmis-tarih'>" + tarihStr + "</div>"
        + "<div class='gecmis-not'>" + htmlEsc(z.not||"") + "</div>"
        + "</div>";
    }).join("");
  }catch(e){ hataGoster("Ziyaret geçmişi çizilemedi: " + e.message); }
}

function tilelariBagla(){
  document.getElementById("tileTemas").onclick = function(){
    var bolum = document.getElementById("bolumTemas");
    bolum.hidden = !bolum.hidden;
    if(!bolum.hidden) bolum.scrollIntoView({behavior:"smooth", block:"start"});
  };
  document.getElementById("tileGecmis").onclick = function(){
    window.location.href = "gecmis.html";
  };
  document.getElementById("tileGorevler").onclick = function(){
    var bolum = document.getElementById("bolumGorevler");
    bolum.hidden = !bolum.hidden;
    if(!bolum.hidden) bolum.scrollIntoView({behavior:"smooth", block:"start"});
  };
  // "İşlem Yap" kutucuğu — artık doğrudan ürün aramaya gitmiyor, önce
  // Cari Kart'a gidip vade/fatura/kargo/adres/yetkili bilgilerini gözden
  // geçirme fırsatı veriyor. Cari Kart'ta "İşleme Devam Et" tuşu (sadece bu
  // akıştan gelindiyse görünür) tıklanınca belge türü seçimi açılır.
  document.getElementById("tileUrunBul").onclick = function(){
    CustomerData.sec(CustomerData.musteriBul(seciliMusteriAdi) || {ad:seciliMusteriAdi});
    localStorage.setItem("weiconv2_islem_yap_akisi", "1");
    window.location.href = "customer-cari-kart.html";
  };

  document.getElementById("tileUrunGecmisi").onclick = urunGecmisiniAc;
  document.getElementById("btnUrunGecmisiKapat").onclick = function(){ document.getElementById("urunGecmisiOverlay").hidden = true; };
  document.getElementById("btnUrunGecmisiGeri").onclick = function(){
    document.getElementById("urunGecmisiDetay").hidden = true;
    document.getElementById("urunGecmisiListesi").hidden = false;
    document.getElementById("urunGecmisiBaslik").textContent = "📦 Ürün Geçmişi";
  };
}

function urunGecmisiniAc(){
  try{
    if(typeof ReportsData === "undefined" || typeof ReportsData.musteriUrunGecmisi !== "function"){
      hataGoster("Ürün geçmişi şu an yüklenemedi.");
      return;
    }
    var musteri = CustomerData.musteriBul(seciliMusteriAdi);
    var gruplar = ReportsData.musteriUrunGecmisi(seciliMusteriAdi, musteri ? musteri.id : null);
    var listesiEl = document.getElementById("urunGecmisiListesi");
    var detayEl = document.getElementById("urunGecmisiDetay");
    var baslikEl = document.getElementById("urunGecmisiBaslik");

    detayEl.hidden = true;
    listesiEl.hidden = false;
    baslikEl.textContent = "📦 Ürün Geçmişi";
    document.getElementById("badgeUrunGecmisi").textContent = gruplar.length;

    if(gruplar.length === 0){
      listesiEl.innerHTML = "<p style='text-align:center;color:#44494f;padding:16px 0;'>Bu müşteriye henüz sipariş olarak satılmış bir ürün yok.</p>";
    } else {
      listesiEl.innerHTML = gruplar.map(function(g, i){
        return "<div class='satir-tiklanabilir' data-urun-i='" + i + "' style='background:#f4f7fb;border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;'>"
          + "<span style='font-size:12px;font-weight:800;color:#111;'>" + htmlEsc(g.ad) + "</span>"
          + "<span style='font-size:10px;color:#8e44ad;font-weight:800;'>" + g.kayitlar.length + " kez ›</span>"
          + "</div>";
      }).join("");
      listesiEl.querySelectorAll("[data-urun-i]").forEach(function(el){
        el.onclick = function(){
          var g = gruplar[parseInt(this.getAttribute("data-urun-i"),10)];
          baslikEl.textContent = "📦 " + g.ad;
          document.getElementById("urunGecmisiTabloGovde").innerHTML = g.kayitlar.map(function(k){
            return "<tr>"
              + "<td>" + htmlEsc((k.tarih||"").split(" ").slice(0,2).join(" ")) + "</td>"
              + "<td>" + (k.adet||0) + "</td>"
              + "<td>" + fmtG(k.listeFiyat) + "€</td>"
              + "<td><span class='rozet-isk'>%" + k.iskonto + "</span></td>"
              + "<td><span class='rozet-net'>" + fmtG(k.netFiyat) + "€</span></td>"
              + "</tr>";
          }).join("");
          listesiEl.hidden = true;
          detayEl.hidden = false;
        };
      });
    }
    document.getElementById("urunGecmisiOverlay").hidden = false;
  }catch(e){ hataGoster("Ürün geçmişi açılamadı: " + e.message); }
}

function musteriGorevleriniCiz(){
  try{
    var tumu = ReportsData.gorevleriGetir();
    var bunaAit = tumu.filter(function(g){
      return (g.musteriAd||"").toLocaleLowerCase("tr-TR").indexOf((seciliMusteriAdi||"").toLocaleLowerCase("tr-TR")) >= 0;
    });
    document.getElementById("badgeGorevler").textContent = bunaAit.length;
    document.getElementById("gorevlerAlt").textContent = bunaAit.length>0 ? (bunaAit.length + " görev") : "Görev yok";

    var kapsayici = document.getElementById("detayGorevListesi");
    var bos = document.getElementById("detayGorevBos");
    if(bunaAit.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;
    kapsayici.innerHTML = bunaAit.map(function(g){
      return "<div class='gorev-karti" + (g.tamamlandi?" tamamlandi":"") + "'>"
        + "<div class='gorev-bilgi'>"
        + "<div class='gorev-aciklama'>" + htmlEsc(g.aciklama) + "</div>"
        + "<div class='gorev-zaman'>" + htmlEsc(g.tarih||"") + " " + htmlEsc(g.saat||"") + "</div>"
        + "</div>"
        + "</div>";
    }).join("");
  }catch(e){ hataGoster("Görevler çizilemedi: " + e.message); }
}

// ---- MÜŞTERİ BİRLEŞTİRME ----
var birlestirHedefAd = null;

function birlestirAramaCiz(){
  var q = (document.getElementById("birlestirAramaInput").value||"").trim().toLocaleLowerCase("tr-TR");
  var sonuclar = CustomerData.ara(q).filter(function(m){ return m.ad !== seciliMusteriAdi; }).slice(0, 30);
  var el = document.getElementById("birlestirAramaListesi");
  if(sonuclar.length === 0){
    el.innerHTML = "<p class='bos-mesaj'>Sonuç yok.</p>";
    return;
  }
  el.innerHTML = sonuclar.map(function(m){
    return "<div class='birlestir-arama-sonuc-karti' data-ad='" + htmlEsc(m.ad) + "'>"
      + "<div class='birlestir-arama-sonuc-ad'>" + htmlEsc(m.ad) + "</div>"
      + (m.sehir ? "<div class='birlestir-arama-sonuc-sehir'>" + htmlEsc(m.sehir) + "</div>" : "")
      + "</div>";
  }).join("");
  el.querySelectorAll(".birlestir-arama-sonuc-karti").forEach(function(kart){
    kart.onclick = function(){ birlestirHedefSec(this.getAttribute("data-ad")); };
  });
}

function birlestirHedefSec(digerAd){
  birlestirHedefAd = digerAd;
  var ana = CustomerData.musteriBul(seciliMusteriAdi);
  var diger = CustomerData.musteriBul(digerAd);
  if(!ana || !diger) return;
  document.getElementById("birlestirDigerBilgi").textContent = diger.ad + (diger.sehir?" — "+diger.sehir:"");
  document.getElementById("birlestirAnaBilgi").textContent = ana.ad + (ana.sehir?" — "+ana.sehir:"");
  document.getElementById("birlestirAramaAsama").hidden = true;
  document.getElementById("birlestirOnayAsama").hidden = false;
}

function birlestirmeyiOnayla(){
  var btn = document.getElementById("btnBirlestirOnayla");
  btn.disabled = true;
  btn.textContent = "Birleştiriliyor...";
  CustomerData.musterileriBirlestir(seciliMusteriAdi, birlestirHedefAd, function(basarili, sonuc){
    if(!basarili){
      btn.disabled = false;
      btn.textContent = "✓ Birleştir";
      hataGoster("Birleştirilemedi: " + (sonuc && sonuc.message ? sonuc.message : "bilinmeyen hata"));
      return;
    }
    ReportsData.kayitlariBirlestir(sonuc.digerAd, sonuc.digerId, sonuc.anaAd, sonuc.anaId, function(basarili2, err2){
      btn.disabled = false;
      btn.textContent = "✓ Birleştir";
      if(basarili2){
        alert("✅ \"" + sonuc.digerAd + "\" → \"" + sonuc.anaAd + "\" ile birleştirildi.");
        document.getElementById("bolumBirlestir").hidden = true;
      } else {
        hataGoster("Müşteri birleştirildi ama arşiv/görev taşımada sorun oldu: " + (err2 && err2.message ? err2.message : "bilinmeyen hata") + " — lütfen tekrar dene veya elle kontrol et.");
      }
    });
  });
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  tilelariBagla();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  var secili = CustomerData.seciliyiOku();
  if(!secili){
    hataGoster("Müşteri seçilmemiş, listeye dönülüyor.");
    setTimeout(function(){ window.location.href = "customer.html"; }, 1500);
    return;
  }
  seciliMusteriAdi = secili.ad;
  ustBilgiyiCiz(secili);

  document.getElementById("btnMusteriSil").onclick = function(){
    if(!confirm("⚠️ DİKKAT: Bu, \"" + seciliMusteriAdi + "\" müşterisinin TÜMÜNÜ (cari bilgileri, tüm sipariş/teklif geçmişi, notlar dahil) kalıcı olarak siler.\n\nSadece tek bir işlemi silmek istiyorsan buraya değil, İşlem Geçmişi listesindeki ilgili kayda dokun.\n\nYine de müşterinin TAMAMINI silmek istiyor musun?")) return;
    if(!confirm("Bu işlem geri alınamaz. Onaylıyor musunuz?")) return;
    CustomerData.musteriSil(seciliMusteriAdi, function(basarili, err){
      if(basarili){
        alert("✓ Müşteri silindi.");
        window.location.href = "customer.html";
      } else {
        hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };

  document.getElementById("btnBirlestirAc").onclick = function(){
    birlestirHedefAd = null;
    document.getElementById("birlestirAnaAdi").textContent = "\"" + seciliMusteriAdi + "\" için bir birleştirme hedefi seçin";
    document.getElementById("birlestirAramaInput").value = "";
    document.getElementById("birlestirOnayAsama").hidden = true;
    document.getElementById("birlestirAramaAsama").hidden = false;
    birlestirAramaCiz();
    document.getElementById("bolumBirlestir").hidden = false;
    document.getElementById("bolumBirlestir").scrollIntoView({behavior:"smooth", block:"start"});
  };
  document.getElementById("birlestirAramaInput").addEventListener("input", birlestirAramaCiz);
  document.getElementById("btnBirlestirVazgec").onclick = function(){ document.getElementById("bolumBirlestir").hidden = true; };
  document.getElementById("btnBirlestirOnayVazgec").onclick = function(){
    document.getElementById("birlestirOnayAsama").hidden = true;
    document.getElementById("birlestirAramaAsama").hidden = false;
  };
  document.getElementById("btnBirlestirOnayla").onclick = birlestirmeyiOnayla;

  CustomerData.listeDegistiginde(function(){
    var tazeMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    if(tazeMusteri){
      ustBilgiyiCiz(tazeMusteri);
      ziyaretGecmisiniCiz(tazeMusteri);
    }
  });
  ReportsData.arsivDegistiginde(siparisGecmisiniCiz);
  ReportsData.gorevDegistiginde(musteriGorevleriniCiz);
  ziyaretGecmisiniCiz(secili);
  siparisGecmisiniCiz();
  musteriGorevleriniCiz();
  // Firebase müşteri listesi sayfa tam yüklenmeden önce gelmiş olabilir —
  // dinleyici bu ilk anlık görüntüyü kaçırmış olabilir. Zaten yüklenmişse
  // hemen taze veriyle güncelle.
  var tazeMusteriIlk = CustomerData.musteriBul(seciliMusteriAdi);
  if(tazeMusteriIlk) ustBilgiyiCiz(tazeMusteriIlk);
});
