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
var seciliMusteriAdi = null;

function ustBilgiyiCiz(musteri){
  document.getElementById("detayAd").textContent = musteri.ad;
  document.getElementById("detaySehir").textContent = musteri.sehir || "";
  document.getElementById("detayVade").value = musteri.vade || "";
  document.getElementById("detayFatura").value = musteri.fatura || "";
  document.getElementById("detayTelefon").value = musteri.telefon || "";
  document.getElementById("detayEposta").value = musteri.eposta || "";
  document.getElementById("detayKargo").value = musteri.kargo || "";
}

function siparisGecmisiniCiz(){
  try{
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return (k.musteri||"").toLocaleLowerCase("tr-TR") === (seciliMusteriAdi||"").toLocaleLowerCase("tr-TR"); });
    var kapsayici = document.getElementById("detaySiparisListesi");
    var bos = document.getElementById("detaySiparisBos");

    if(bunaAit.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;
    kapsayici.innerHTML = bunaAit.map(function(k){
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      return "<div class='gecmis-karti'>"
        + "<div class='gecmis-ust-satir'><span class='gecmis-tip gecmis-tip--" + k.tip + "'>" + TIP_ETIKET[k.tip] + "</span><span class='gecmis-tarih'>" + htmlEsc(k.tarih) + "</span></div>"
        + "<div class='gecmis-toplam'>" + toplam.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR — " + (k.urunler||[]).length + " ürün</div>"
        + "</div>";
    }).join("");
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

function sekmeGecisBagla(){
  document.querySelectorAll(".sekme-btn").forEach(function(btn){
    btn.onclick = function(){
      var hedef = this.getAttribute("data-sekme");
      document.querySelectorAll(".sekme-btn").forEach(function(b){ b.classList.remove("sekme-btn--secili"); });
      this.classList.add("sekme-btn--secili");
      document.getElementById("sekmeSiparisler").hidden = hedef !== "siparisler";
      document.getElementById("sekmeZiyaretler").hidden = hedef !== "ziyaretler";
    };
  });
}

function bilgileriKaydetTiklandi(){
  try{
    var guncelBilgi = {
      vade: document.getElementById("detayVade").value,
      fatura: document.getElementById("detayFatura").value,
      telefon: document.getElementById("detayTelefon").value,
      eposta: document.getElementById("detayEposta").value,
      kargo: document.getElementById("detayKargo").value
    };
    var btn = document.getElementById("btnBilgiKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    CustomerData.musteriGuncelle(seciliMusteriAdi, guncelBilgi, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "Bilgileri Güncelle";
      if(basarili) alert("✓ Güncellendi.");
      else hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  }catch(e){ hataGoster("Bilgiler kaydedilemedi: " + e.message); }
}

function adresleriCiz(musteri){
  try{
    ["fatura","teslimat"].forEach(function(tip){
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      var liste = musteri[alan] || [];
      var kapsayiciId = tip==="fatura" ? "faturaAdresListesi" : "teslimatAdresListesi";
      var kapsayici = document.getElementById(kapsayiciId);

      if(liste.length === 0){
        kapsayici.innerHTML = "<p class='bos-mesaj' style='padding:8px 0;'>Kayıtlı adres yok.</p>";
        return;
      }
      kapsayici.innerHTML = liste.map(function(a, i){
        return "<div class='adres-satir'>"
          + "<div><div class='adres-etiket'>" + htmlEsc(a.etiket) + "</div><div class='adres-metin'>" + htmlEsc(a.adres) + "</div></div>"
          + "<button class='adres-sil-btn' data-tip='" + tip + "' data-i='" + i + "'>Sil</button>"
          + "</div>";
      }).join("");

      kapsayici.querySelectorAll(".adres-sil-btn").forEach(function(btn){
        btn.onclick = function(){
          if(!confirm("Bu adres silinsin mi?")) return;
          var t = this.getAttribute("data-tip");
          var i = parseInt(this.getAttribute("data-i"), 10);
          CustomerData.musteriAdresSil(seciliMusteriAdi, t, i, function(basarili, err){
            if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
          });
        };
      });
    });
  }catch(e){ hataGoster("Adresler çizilemedi: " + e.message); }
}

function adresEkleBagla(){
  document.querySelectorAll(".adres-ekle-btn").forEach(function(btn){
    btn.onclick = function(){
      var tip = this.getAttribute("data-tip");
      var etiketId = tip==="fatura" ? "yeniFaturaEtiket" : "yeniTeslimatEtiket";
      var adresId = tip==="fatura" ? "yeniFaturaAdres" : "yeniTeslimatAdres";
      var etiket = document.getElementById(etiketId).value.trim();
      var adres = document.getElementById(adresId).value.trim();
      if(!adres){ hataGoster("Adres girin."); return; }
      CustomerData.musteriAdresEkle(seciliMusteriAdi, tip, etiket, adres, function(basarili, err){
        if(basarili){
          document.getElementById(etiketId).value = "";
          document.getElementById(adresId).value = "";
        } else {
          hataGoster("Eklenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        }
      });
    };
  });
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  sekmeGecisBagla();

  var secili = CustomerData.seciliyiOku();
  if(!secili){
    hataGoster("Müşteri seçilmemiş, listeye dönülüyor.");
    setTimeout(function(){ window.location.href = "customer.html"; }, 1500);
    return;
  }
  seciliMusteriAdi = secili.ad;
  ustBilgiyiCiz(secili);
  adresleriCiz(secili);
  adresEkleBagla();

  document.getElementById("btnSatisYap").onclick = function(){
    CustomerData.sec(secili);
    window.location.href = "product.html";
  };
  document.getElementById("btnBilgiKaydet").onclick = bilgileriKaydetTiklandi;
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  CustomerData.listeDegistiginde(function(){
    var tazeMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    if(tazeMusteri){
      ustBilgiyiCiz(tazeMusteri);
      ziyaretGecmisiniCiz(tazeMusteri);
      adresleriCiz(tazeMusteri);
    }
  });
  ReportsData.arsivDegistiginde(siparisGecmisiniCiz);
  ziyaretGecmisiniCiz(secili);
  siparisGecmisiniCiz();
});
