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

function siparisGecmisiniCiz(){
  try{
    var seciliMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    var seciliId = seciliMusteri ? seciliMusteri.id : null;
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return ayniMusteriKaydiMi(k.musteri, k.musteriId, seciliMusteriAdi, seciliId); });
    var kapsayici = document.getElementById("detaySiparisListesi");
    var bos = document.getElementById("detaySiparisBos");

    document.getElementById("badgeGecmis").textContent = bunaAit.length;
    document.getElementById("gecmisAlt").textContent = bunaAit.length>0 ? (bunaAit.length + " kayıtlı işlem") : "Henüz kayıt yok";

    var farkliIsimliKayit = bunaAit.find(function(k){
      return (k.musteri||"").trim() !== (seciliMusteriAdi||"").trim();
    });
    var uyusmazlikKutu = document.getElementById("isimUyusmazlikKutu");
    if(farkliIsimliKayit){
      uyusmazlikKutu.hidden = false;
      document.getElementById("isimUyusmazlikMetin").textContent =
        "⚠️ Bazı eski kayıtlarda farklı bir isim var: \"" + farkliIsimliKayit.musteri + "\". "
        + "Bu kayıtlar gösteriliyor ama isimleri güncel Cari Bilgi (\"" + seciliMusteriAdi + "\") ile eşleşmiyor.";
      document.getElementById("btnIsimUyusmazlikDuzelt").onclick = isimleriEsitleTiklandi;
    } else {
      uyusmazlikKutu.hidden = true;
    }

    if(bunaAit.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    var TIP_ETIKET_G = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
    var TIP_IKON_G = {numune:"🧪", teklif:"📝", proforma:"📋", siparis:"📦"};
    var TIP_RENK_G = {siparis:"#003a70", teklif:"#0e6b34", proforma:"#6a1b9a", numune:"#a8590c"};

    // Her işlem (sipariş/teklif/vb.) kendi grubu: üstte tür+tarih+kod
    // başlığı (kod artık her satırda değil, TEK SEFER burada), altında
    // programın standart belge tablosu (Sepet/Belge Önizleme ile birebir
    // aynı stil), en altta kur+toplam şeridi. Herhangi bir satırı sağa/
    // sola kaydırınca o İŞLEMİN TAMAMI için silme onayı çıkar.
    kapsayici.innerHTML = bunaAit.map(function(k){
      var kacanMi = k.durum === "kacan";
      var renk = TIP_RENK_G[k.tip]||"#003a70";
      var toplamEuro = 0, toplamTl = 0;
      var kaydinKuru = k.kur || (parseFloat(localStorage.getItem("weicon_kur"))||0);

      var satirlarHtml = (k.urunler||[]).map(function(u, i){
        toplamEuro += u.toplamEuro||0;
        toplamTl += (u.toplamEuro||0) * kaydinKuru;
        var mk = (u.iskBirim||0)-(u.dipFiyat||0);
        var ozelFiyatMi = (u.iskonto||0) > 60;
        var prim = ozelFiyatMi ? 0 : mk*(u.adet||0)*0.22;
        if(prim<0) prim = 0;
        var primTl = Math.round(prim * kaydinKuru);
        return "<tr>"
          + "<td class='belge-td-sira'>" + (i+1) + "</td>"
          + "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(u.berta||"-") + " - <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(u.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>"
          + "<td>" + (u.adet||0) + "</td>"
          + "<td>" + fmtG(u.listeFiyat||0) + "€</td>"
          + "<td><span class='rozet-isk'>%" + (u.iskonto||0) + "</span></td>"
          + "<td><span class='rozet-net'>" + fmtG(u.iskBirim!==undefined?u.iskBirim:0) + "€</span></td>"
          + "<td class='belge-td-toplam'>" + fmtG(u.toplamEuro||0) + "€</td>"
          + "<td class='belge-td-prim'>" + (ozelFiyatMi ? "Ö.F" : ("<span class='belge-td-prim-tek'>"+primTl.toLocaleString("tr-TR")+" TL</span>")) + "</td>"
          + "</tr>";
      }).join("");

      return "<div class='gecmis-grup' data-tip='" + k.tip + "' data-ts='" + k.ts + "'>"
        + "<div class='gecmis-grup-govde'>"
        + "<div class='gecmis-grup-baslik' style='background:" + renk + ";'>"
        + "<span>" + TIP_IKON_G[k.tip] + " " + TIP_ETIKET_G[k.tip] + " · " + htmlEsc(k.tarih.split(" ").slice(0,2).join(" ")) + " · " + htmlEsc(k.kod||"") + "</span>"
        + (kacanMi ? "<span class='gecmis-kacan-rozet'>❌ KAÇTI</span>" : "")
        + (k.revizeZamani ? "<span class='gecmis-revize-rozet'>🔄 REVİZE</span>" : "")
        + "</div>"
        + "<div class='data-table-container'><table class='belge-urun-tablo gecmis-standart-tablo'>"
        + "<thead><tr><th style='width:4%;'>SR</th><th style='width:32%;'>ÜRÜN BİLGİSİ</th><th style='width:6%;'>ADET</th><th style='width:9%;'>LİSTE</th><th style='width:11%;'>İSK</th><th style='width:12%;'>NET</th><th style='width:13%;'>TOPLAM</th><th style='width:13%;'>PRİM</th></tr></thead>"
        + "<tbody>" + satirlarHtml + "</tbody></table></div>"
        + "<div class='belge-genel-toplam-serit'>"
        + (kaydinKuru ? "<span class='belge-gt-kur'>Hesaplanan Kur<br>" + fmtG(kaydinKuru) + " Euro</span>" : "")
        + "<span class='belge-gt-etiket'>TOPLAM</span>"
        + "<span class='belge-gt-deger'>" + fmtG(toplamEuro) + " €" + (kaydinKuru ? "<span class='belge-gt-deger-alt'>≈ " + Math.round(toplamEuro*kaydinKuru).toLocaleString("tr-TR") + " TL</span>" : "") + "</span>"
        + "</div>"
        + "</div>"
        + "<div class='gecmis-grup-sil-arkaplan'>🗑 Sil</div>"
        + "</div>";
    }).join("");

    // Tıklama = belgeyi görüntüle (kaydırma DEĞİLSE)
    kapsayici.querySelectorAll(".gecmis-grup-govde").forEach(function(govde){
      var grup = govde.closest(".gecmis-grup");
      var basladiX = null, kaydiriliyorMu = false;
      govde.addEventListener("pointerdown", function(e){ basladiX = e.clientX; kaydiriliyorMu = false; });
      govde.addEventListener("pointermove", function(e){
        if(basladiX===null) return;
        var fark = e.clientX - basladiX;
        if(Math.abs(fark) > 8) kaydiriliyorMu = true;
        if(Math.abs(fark) > 6){
          govde.style.transform = "translateX(" + Math.max(-90, Math.min(90, fark)) + "px)";
        }
      });
      function birak(e){
        if(basladiX===null) return;
        var fark = (e.clientX||basladiX) - basladiX;
        basladiX = null;
        govde.style.transition = "transform .2s";
        govde.style.transform = "translateX(0)";
        setTimeout(function(){ govde.style.transition = ""; }, 200);
        if(Math.abs(fark) > 60){
          silOnayiSor(grup.getAttribute("data-tip"), parseFloat(grup.getAttribute("data-ts")));
          return;
        }
        if(!kaydiriliyorMu){
          localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:grup.getAttribute("data-tip"), ts:parseFloat(grup.getAttribute("data-ts"))}));
          window.location.href = "belge-onizleme.html";
        }
      }
      govde.addEventListener("pointerup", birak);
      govde.addEventListener("pointercancel", function(){ basladiX = null; govde.style.transform = "translateX(0)"; });
    });
  }catch(e){ hataGoster("Sipariş geçmişi çizilemedi: " + e.message); }
}

function silOnayiSor(tip, ts){
  if(!confirm("Bu işlem tamamen silinsin mi? Bu geri alınamaz.")) return;
  ReportsData.kaydiSil(tip, ts, function(basarili, err){
    if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
  });
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

function isimleriEsitleTiklandi(){
  try{
    var seciliMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    var seciliId = seciliMusteri ? seciliMusteri.id : null;
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return ayniMusteriKaydiMi(k.musteri, k.musteriId, seciliMusteriAdi, seciliId); });
    var farkliIsimler = [];
    bunaAit.forEach(function(k){
      var isim = (k.musteri||"").trim();
      if(isim && isim !== (seciliMusteriAdi||"").trim() && farkliIsimler.indexOf(isim)===-1) farkliIsimler.push(isim);
    });
    if(farkliIsimler.length === 0) return;

    if(!confirm("Şu eski isim varyant(lar)ı bulundu:\n\n" + farkliIsimler.join("\n") + "\n\nBunlara ait TÜM kayıtlar (sipariş/teklif/görev), güncel isim \"" + seciliMusteriAdi + "\" ile eşitlenecek. Devam edilsin mi?")) return;

    var btn = document.getElementById("btnIsimUyusmazlikDuzelt");
    btn.disabled = true; btn.textContent = "Eşitleniyor...";

    var sirayla = function(i){
      if(i >= farkliIsimler.length){
        btn.disabled = false; btn.textContent = "✓ İsimleri Eşitle";
        siparisGecmisiniCiz();
        return;
      }
      ReportsData.kayitlariBirlestir(farkliIsimler[i], null, seciliMusteriAdi, seciliId, function(basarili, err){
        if(!basarili){
          btn.disabled = false; btn.textContent = "✓ İsimleri Eşitle";
          hataGoster("Eşitlenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
          return;
        }
        sirayla(i+1);
      });
    };
    sirayla(0);
  }catch(e){ hataGoster("İsimler eşitlenemedi: " + e.message); }
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
