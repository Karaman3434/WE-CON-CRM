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
  var altBaslikParcalar = [];
  if(musteri.id) altBaslikParcalar.push("🏷 " + musteri.id);
  if(musteri.sehir) altBaslikParcalar.push(musteri.sehir);
  document.getElementById("detayAltBaslik").textContent = altBaslikParcalar.join(" · ") || "-";

  document.getElementById("cariVade").textContent = musteri.vade || "-";
  document.getElementById("cariFatura").textContent = musteri.fatura || "-";
  document.getElementById("cariKargo").textContent = musteri.kargo || "-";

  document.getElementById("detayVade").value = musteri.vade || "";
  document.getElementById("detayFatura").value = musteri.fatura || "";
  document.getElementById("detayKargo").value = musteri.kargo || "";
}

function siparisGecmisiniCiz(){
  try{
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return (k.musteri||"").toLocaleLowerCase("tr-TR") === (seciliMusteriAdi||"").toLocaleLowerCase("tr-TR"); });
    var kapsayici = document.getElementById("detaySiparisListesi");
    var bos = document.getElementById("detaySiparisBos");

    var toplamCiro = bunaAit
      .filter(function(k){ return k.tip === "siparis"; })
      .reduce(function(s,k){ return s + (k.urunler||[]).reduce(function(s2,u){ return s2+(u.toplamEuro||0); }, 0); }, 0);
    var ciroEl = document.getElementById("detayToplamCiro");
    if(ciroEl) ciroEl.textContent = toplamCiro.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR";

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
        var prim = mk*(u.adet||0)*0.22;
        if(prim<0) prim = 0;
        var satirBg = kacanMi ? "#fac9c5" : (TIP_ZEMIN_GECMIS[k.tip]||"#ffffff");
        satirlar += "<tr class='gecmis-tablo-satir' data-tip='" + k.tip + "' data-ts='" + k.ts + "' style='background:" + satirBg + ";'>"
          + "<td>" + (j===0 ? "<span class='gecmis-kod-mini'>" + TIP_KOD_GECMIS[k.tip] + "</span>" + (kacanMi?"<div class='gecmis-durum-mini'>❌ KAÇTI</div>":"") : "") + "</td>"
          + "<td>" + (j===0 ? htmlEsc(k.tarih.split(" ").slice(0,2).join(" ")) : "") + "</td>"
          + "<td class='gecmis-td-urun'><div class='gecmis-td-kod'><span class='kb'>B:</span>" + htmlEsc(u.berta||"-") + " <span class='ka'>A:</span>" + htmlEsc(u.abas||"-") + "</div><div class='gecmis-td-ad'>" + htmlEsc(u.ad) + "</div></td>"
          + "<td>" + (u.adet||0) + "</td>"
          + "<td>" + fmtG(u.listeFiyat||0) + "€</td>"
          + "<td class='gecmis-td-isk'>%" + (u.iskonto||0) + "</td>"
          + "<td style='color:" + TIP_RENK_GECMIS[k.tip] + ";'>" + fmtG(u.iskBirim!==undefined?u.iskBirim:0) + "€</td>"
          + "<td class='gecmis-td-toplam'>" + fmtG(u.toplamEuro||0) + "€</td>"
          + "<td class='gecmis-td-prim'>" + fmtG(prim) + "€</td>"
          + "</tr>";
      });
    });

    kapsayici.innerHTML = "<div class='data-table-container'><table class='gecmis-urun-tablo'>"
      + "<thead><tr><th>KOD</th><th>TARİH</th><th>ÜRÜN İSMİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th><th>PRİM</th></tr></thead>"
      + "<tbody>" + satirlar + "</tbody></table></div>";

    kapsayici.querySelectorAll(".gecmis-tablo-satir").forEach(function(tr){
      tr.onclick = function(){
        var t = this.getAttribute("data-tip");
        var ts = this.getAttribute("data-ts");
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:t, ts:parseFloat(ts)}));
        window.location.href = "belge-onizleme.html";
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
      var sayacId = tip==="fatura" ? "faturaAdresSayisi" : "teslimatAdresSayisi";
      var kapsayici = document.getElementById(kapsayiciId);
      var sayacEl = document.getElementById(sayacId);
      if(sayacEl) sayacEl.textContent = liste.length;

      if(liste.length === 0){
        kapsayici.innerHTML = "<p class='bos-mesaj' style='padding:8px 0;'>Kayıtlı adres yok.</p>";
        return;
      }
      kapsayici.innerHTML = liste.map(function(a, i){
        return "<div class='adres-satir' id='adresSatir-" + tip + "-" + i + "'>"
          + "<div class='adres-goruntu'>"
          + "<div><div class='adres-etiket'>" + htmlEsc(a.etiket) + "</div><div class='adres-metin'>" + htmlEsc(a.adres) + "</div></div>"
          + "<div class='satir-buton-grubu'>"
          + "<button class='satir-duzenle-btn' data-tip='" + tip + "' data-i='" + i + "'>Düzenle</button>"
          + "<button class='satir-sil-btn' data-tip='" + tip + "' data-i='" + i + "'>Sil</button>"
          + "</div>"
          + "</div>"
          + "<div class='adres-duzenle-form' hidden>"
          + "<input type='text' class='adres-duzenle-etiket' value=\"" + htmlEsc(a.etiket) + "\" placeholder='Etiket'>"
          + "<input type='text' class='adres-duzenle-adres' value=\"" + htmlEsc(a.adres) + "\" placeholder='Adres'>"
          + "<div class='form-buton-satir'>"
          + "<button class='duzenle-kapat-btn-kucuk' data-tip='" + tip + "' data-i='" + i + "'>Kapat</button>"
          + "<button class='duzenle-kaydet-btn-kucuk' data-tip='" + tip + "' data-i='" + i + "'>Kaydet</button>"
          + "</div>"
          + "</div>"
          + "</div>";
      }).join("");

      kapsayici.querySelectorAll(".satir-sil-btn").forEach(function(btn){
        btn.onclick = function(){
          if(!confirm("Bu adres silinsin mi?")) return;
          var t = this.getAttribute("data-tip");
          var i = parseInt(this.getAttribute("data-i"), 10);
          CustomerData.musteriAdresSil(seciliMusteriAdi, t, i, function(basarili, err){
            if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
          });
        };
      });

      kapsayici.querySelectorAll(".satir-duzenle-btn").forEach(function(btn){
        btn.onclick = function(){
          var t = this.getAttribute("data-tip");
          var i = this.getAttribute("data-i");
          var satir = document.getElementById("adresSatir-" + t + "-" + i);
          satir.querySelector(".adres-goruntu").hidden = true;
          satir.querySelector(".adres-duzenle-form").hidden = false;
        };
      });
      kapsayici.querySelectorAll(".duzenle-kapat-btn-kucuk").forEach(function(btn){
        btn.onclick = function(){
          var t = this.getAttribute("data-tip");
          var i = this.getAttribute("data-i");
          var satir = document.getElementById("adresSatir-" + t + "-" + i);
          satir.querySelector(".adres-goruntu").hidden = false;
          satir.querySelector(".adres-duzenle-form").hidden = true;
        };
      });
      kapsayici.querySelectorAll(".duzenle-kaydet-btn-kucuk").forEach(function(btn){
        btn.onclick = function(){
          var t = this.getAttribute("data-tip");
          var i = parseInt(this.getAttribute("data-i"), 10);
          var satir = document.getElementById("adresSatir-" + t + "-" + i);
          var yeniEtiket = satir.querySelector(".adres-duzenle-etiket").value.trim();
          var yeniAdres = satir.querySelector(".adres-duzenle-adres").value.trim();
          if(!yeniAdres){ hataGoster("Adres boş olamaz."); return; }
          CustomerData.musteriAdresGuncelle(seciliMusteriAdi, t, i, yeniEtiket, yeniAdres, function(basarili, err){
            if(!basarili) hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
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

function yetkilileriCiz(musteri){
  try{
    var liste = musteri.iletisimler || [];
    var kapsayici = document.getElementById("yetkiliListesi");
    var sayacEl = document.getElementById("yetkiliSayisi");
    if(sayacEl) sayacEl.textContent = liste.length;
    if(liste.length === 0){
      kapsayici.innerHTML = "<p class='bos-mesaj' style='padding:8px 0;'>Kayıtlı kişi yok.</p>";
      return;
    }
    kapsayici.innerHTML = liste.map(function(k, i){
      var detaylar = [k.telefon, k.eposta].filter(Boolean).join(" · ");
      return "<div class='yetkili-karti' id='yetkiliSatir-" + i + "'>"
        + "<div class='yetkili-goruntu'>"
        + "<div class='yetkili-ust-satir'>"
        + "<div><span class='yetkili-isim'>" + htmlEsc(k.isim) + "</span>" + (k.gorev?" <span class='yetkili-gorev'>("+htmlEsc(k.gorev)+")</span>":"") + "</div>"
        + "<div class='satir-buton-grubu'>"
        + "<button class='satir-duzenle-btn' data-i='" + i + "'>Düzenle</button>"
        + "<button class='satir-sil-btn' data-i='" + i + "'>Sil</button>"
        + "</div>"
        + "</div>"
        + (detaylar ? "<div class='yetkili-detay'>" + htmlEsc(detaylar) + "</div>" : "")
        + "</div>"
        + "<div class='yetkili-duzenle-form' hidden>"
        + "<input type='text' class='yd-isim' value=\"" + htmlEsc(k.isim) + "\" placeholder='İsim'>"
        + "<input type='text' class='yd-gorev' value=\"" + htmlEsc(k.gorev||"") + "\" placeholder='Görev'>"
        + "<div class='form-satir-2'>"
        + "<input type='tel' class='yd-telefon' value=\"" + htmlEsc(k.telefon||"") + "\" placeholder='Telefon'>"
        + "<input type='email' class='yd-eposta' value=\"" + htmlEsc(k.eposta||"") + "\" placeholder='E-posta'>"
        + "</div>"
        + "<div class='form-buton-satir'>"
        + "<button class='duzenle-kapat-btn-kucuk' data-i='" + i + "'>Kapat</button>"
        + "<button class='duzenle-kaydet-btn-kucuk' data-i='" + i + "'>Kaydet</button>"
        + "</div>"
        + "</div>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".satir-sil-btn").forEach(function(btn){
      btn.onclick = function(){
        if(!confirm("Bu kişi silinsin mi?")) return;
        var i = parseInt(this.getAttribute("data-i"), 10);
        CustomerData.yetkiliSil(seciliMusteriAdi, i, function(basarili, err){
          if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      };
    });

    kapsayici.querySelectorAll(".satir-duzenle-btn").forEach(function(btn){
      btn.onclick = function(){
        var i = this.getAttribute("data-i");
        var satir = document.getElementById("yetkiliSatir-" + i);
        satir.querySelector(".yetkili-goruntu").hidden = true;
        satir.querySelector(".yetkili-duzenle-form").hidden = false;
      };
    });
    kapsayici.querySelectorAll(".duzenle-kapat-btn-kucuk").forEach(function(btn){
      btn.onclick = function(){
        var i = this.getAttribute("data-i");
        var satir = document.getElementById("yetkiliSatir-" + i);
        satir.querySelector(".yetkili-goruntu").hidden = false;
        satir.querySelector(".yetkili-duzenle-form").hidden = true;
      };
    });
    kapsayici.querySelectorAll(".duzenle-kaydet-btn-kucuk").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        var satir = document.getElementById("yetkiliSatir-" + i);
        var isim = satir.querySelector(".yd-isim").value.trim();
        if(!isim){ hataGoster("İsim boş olamaz."); return; }
        var yeniKisi = {
          isim: isim,
          gorev: satir.querySelector(".yd-gorev").value.trim(),
          telefon: satir.querySelector(".yd-telefon").value.trim(),
          eposta: satir.querySelector(".yd-eposta").value.trim()
        };
        CustomerData.yetkiliGuncelle(seciliMusteriAdi, i, yeniKisi, function(basarili, err){
          if(!basarili) hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      };
    });
  }catch(e){ hataGoster("Yetkili kişiler çizilemedi: " + e.message); }
}

function yetkiliEkleBagla(){
  document.getElementById("btnYetkiliEkle").onclick = function(){
    var isim = document.getElementById("yeniYetkiliIsim").value.trim();
    if(!isim){ hataGoster("İsim girin."); return; }
    var kisi = {
      isim: isim,
      gorev: document.getElementById("yeniYetkiliGorev").value.trim(),
      telefon: document.getElementById("yeniYetkiliTelefon").value.trim(),
      eposta: document.getElementById("yeniYetkiliEposta").value.trim()
    };
    CustomerData.yetkiliEkle(seciliMusteriAdi, kisi, function(basarili, err){
      if(basarili){
        ["yeniYetkiliIsim","yeniYetkiliGorev","yeniYetkiliTelefon","yeniYetkiliEposta"].forEach(function(id){
          document.getElementById(id).value = "";
        });
      } else {
        hataGoster("Eklenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };
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
  yetkilileriCiz(secili);
  yetkiliEkleBagla();

  document.getElementById("btnSatisYap").onclick = function(){
    CustomerData.sec(secili);
    window.location.href = "product.html";
  };
  document.getElementById("btnBilgiKaydet").onclick = bilgileriKaydetTiklandi;
  document.getElementById("btnDuzenleAc").onclick = function(){
    var form = document.getElementById("detayBilgiForm");
    form.hidden = !form.hidden;
  };
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  CustomerData.listeDegistiginde(function(){
    var tazeMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    if(tazeMusteri){
      ustBilgiyiCiz(tazeMusteri);
      ziyaretGecmisiniCiz(tazeMusteri);
      adresleriCiz(tazeMusteri);
      yetkilileriCiz(tazeMusteri);
    }
  });
  ReportsData.arsivDegistiginde(siparisGecmisiniCiz);
  ziyaretGecmisiniCiz(secili);
  siparisGecmisiniCiz();
  // Firebase müşteri listesi (dolayısıyla yetkili/adres bilgileri) sayfa tam
  // yüklenmeden önce gelmiş olabilir — dinleyici bu ilk anlık görüntüyü
  // kaçırmış olabilir. Zaten yüklenmişse hemen taze veriyle güncelle.
  var tazeMusteriIlk = CustomerData.musteriBul(seciliMusteriAdi);
  if(tazeMusteriIlk){
    ustBilgiyiCiz(tazeMusteriIlk);
    adresleriCiz(tazeMusteriIlk);
    yetkilileriCiz(tazeMusteriIlk);
  }
});
