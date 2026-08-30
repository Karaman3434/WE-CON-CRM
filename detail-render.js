/*
  detail-render.js
  ================
  Seçili müşterinin bilgilerini, sipariş geçmişini (ReportsData.sonIslemler
  üzerinden filtrelenmiş) ve ziyaret geçmişini gösterir.
*/

function hataGoster(mesaj){
  console.error(mesaj);
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

function siparisGecmisiniCiz(){
  try{
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return (k.musteri||"").toLocaleLowerCase("tr-TR") === (seciliMusteriAdi||"").toLocaleLowerCase("tr-TR"); });
    var kapsayici = document.getElementById("detaySiparisListesi");
    var bos = document.getElementById("detaySiparisBos");

    document.getElementById("badgeGecmis").textContent = bunaAit.length;
    document.getElementById("gecmisAlt").textContent = bunaAit.length>0 ? (bunaAit.length + " kayıtlı işlem") : "Henüz kayıt yok";

    if(bunaAit.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    var TIP_KOD_GECMIS = {numune:"NUM", teklif:"TEK", proforma:"PRO", siparis:"SIP"};
    var TIP_ZEMIN_GECMIS = {siparis:"#dbe9f9", teklif:"#cdf3de", proforma:"#e5cdf7", numune:"#ffe3bf"};
    var TIP_RENK_GECMIS = {siparis:"#003a70", teklif:"#0e6b34", proforma:"#6a1b9a", numune:"#a8590c"};

    var satirlar = "";
    bunaAit.forEach(function(k){
      var kacanMi = k.durum === "kacan";
      (k.urunler||[]).forEach(function(u, j){
        var mk = (u.iskBirim||0)-(u.dipFiyat||0);
        var ozelFiyatMi = (u.iskonto||0) > 60;
        var prim = ozelFiyatMi ? 0 : mk*(u.adet||0)*0.22;
        if(prim<0) prim = 0;
        var kaydinKuru = k.kur || (parseFloat(localStorage.getItem("weicon_kur"))||0);
        var primTl = prim * kaydinKuru;
        var satirBg = kacanMi ? "#fac9c5" : (TIP_ZEMIN_GECMIS[k.tip]||"#ffffff");
        satirlar += "<tr class='gecmis-tablo-satir' data-tip='" + k.tip + "' data-ts='" + k.ts + "' style='background:" + satirBg + ";'>"
          + "<td>" + (j===0 ? "<span class='gecmis-kod-mini'>" + TIP_KOD_GECMIS[k.tip] + "</span>" + (kacanMi?"<div class='gecmis-durum-mini'>❌ KAÇTI</div>":"") : "") + "</td>"
          + "<td>" + (j===0 ? htmlEsc(k.tarih.split(" ").slice(0,2).join(" ")) : "") + "</td>"
          + "<td class='gecmis-td-urun'><div class='gecmis-td-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(u.berta||"-") + " <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(u.abas||"-") + "</div><div class='gecmis-td-ad'>" + htmlEsc(u.ad) + "</div></td>"
          + "<td>" + (u.adet||0) + "</td>"
          + "<td>" + fmtG(u.listeFiyat||0) + "€</td>"
          + "<td class='gecmis-td-isk'>%" + (u.iskonto||0) + "</td>"
          + "<td style='color:" + TIP_RENK_GECMIS[k.tip] + ";'>" + fmtG(u.iskBirim!==undefined?u.iskBirim:0) + "€</td>"
          + "<td class='gecmis-td-toplam'>" + fmtG(u.toplamEuro||0) + "€</td>"
          + "<td class='gecmis-td-prim'>" + (ozelFiyatMi ? "ÖZEL FİYAT" : fmtG(primTl)+"TL") + "</td>"
          + "<td>" + (j===0 ? "<button class='gecmis-sil-btn' data-sil-tip='" + k.tip + "' data-sil-ts='" + k.ts + "'>🗑️</button>" : "") + "</td>"
          + "</tr>";
      });
    });

    kapsayici.innerHTML = "<div class='data-table-container'><table class='gecmis-urun-tablo'>"
      + "<thead><tr><th>KOD</th><th>TARİH</th><th>ÜRÜN İSMİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th><th>PRİM</th><th></th></tr></thead>"
      + "<tbody>" + satirlar + "</tbody></table></div>";

    kapsayici.querySelectorAll(".gecmis-tablo-satir").forEach(function(tr){
      tr.onclick = function(){
        var t = this.getAttribute("data-tip");
        var ts = this.getAttribute("data-ts");
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:t, ts:parseFloat(ts)}));
        window.location.href = "belge-onizleme.html";
      };
    });
    kapsayici.querySelectorAll(".gecmis-sil-btn").forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var t = this.getAttribute("data-sil-tip");
        var ts = parseFloat(this.getAttribute("data-sil-ts"));
        if(!confirm("Bu kayıt tamamen silinsin mi? Bu geri alınamaz.")) return;
        this.disabled = true;
        ReportsData.kaydiSil(t, ts, function(basarili, err){
          if(!basarili){
            hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
          }
        });
      };
    });
  }catch(e){ hataGoster("Sipariş geçmişi çizilemedi: " + e.message); }
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
    var bolum = document.getElementById("bolumGecmis");
    bolum.hidden = !bolum.hidden;
    if(!bolum.hidden) bolum.scrollIntoView({behavior:"smooth", block:"start"});
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

  var secili = CustomerData.seciliyiOku();
  if(!secili){
    hataGoster("Müşteri seçilmemiş, listeye dönülüyor.");
    setTimeout(function(){ window.location.href = "customer.html"; }, 1500);
    return;
  }
  seciliMusteriAdi = secili.ad;
  ustBilgiyiCiz(secili);

  document.getElementById("btnMusteriSil").onclick = function(){
    if(!confirm(seciliMusteriAdi + " müşterisini kalıcı olarak silmek istediğinize emin misiniz? Bu geri alınamaz.")) return;
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
