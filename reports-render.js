/*
  reports-render.js
  =================
  Sekme geçişini, Son İşlemler listesini ve Görevler listesini/formunu yönetir.
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

var SONRAKI_ASAMA = {numune:"teklif", teklif:"proforma", proforma:"siparis"};

function ilerletTiklandi(k){
  try{
    if(!confirm(k.musteri + " için " + (k.urunler||[]).length + " ürün, bir sonraki aşamaya (" + TIP_ETIKET[SONRAKI_ASAMA[k.tip]] + ") taşınacak. Devam edilsin mi?")) return;

    var sepet = (k.urunler||[]).map(function(u, i){
      return {idx:i, ad:u.ad, berta:u.berta, abas:u.abas, listeFiyat:u.listeFiyat, dipFiyat:u.dipFiyat, iskonto:u.iskonto, adet:u.adet};
    });
    localStorage.setItem("weiconv2_sepet", JSON.stringify(sepet));
    localStorage.setItem("weicon_secili_musteri", JSON.stringify({ad:k.musteri, sehir:k.sehir||"", id:k.musteriId||null}));
    localStorage.setItem("weiconv2_ilerlet_kaynak", JSON.stringify({tip:k.tip, ts:k.ts, sonrakiAsama:SONRAKI_ASAMA[k.tip]}));

    window.location.href = "cart.html";
  }catch(e){ hataGoster("İlerletilemedi: " + e.message); }
}

function sekmeGecisBagla(){
  document.querySelectorAll(".sekme-btn").forEach(function(btn){
    btn.onclick = function(){
      var hedef = this.getAttribute("data-sekme");
      document.querySelectorAll(".sekme-btn").forEach(function(b){ b.classList.remove("sekme-btn--secili"); });
      this.classList.add("sekme-btn--secili");
      document.getElementById("sekmeIslemler").hidden = hedef !== "islemler";
      document.getElementById("sekmeGorevler").hidden = hedef !== "gorevler";
      document.getElementById("sekmeIstatistik").hidden = hedef !== "istatistik";
      document.getElementById("sekmeZiyaret").hidden = hedef !== "ziyaret";
      if(hedef === "istatistik") istatistikleriCiz();
      if(hedef === "ziyaret") ziyaretleriCiz();
    };
  });
}

function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function istatistikleriCiz(){
  try{
    var buAy = ReportsData.ayToplami(0);
    var gecenAy = ReportsData.ayToplami(1);
    document.getElementById("istBuAyToplam").textContent = fmt(buAy.toplam) + " EUR";
    document.getElementById("istBuAySiparisSayisi").textContent = buAy.sayi + " sipariş";
    document.getElementById("istGecenAyToplam").textContent = fmt(gecenAy.toplam) + " EUR";
    document.getElementById("istGecenAySiparisSayisi").textContent = gecenAy.sayi + " sipariş";

    var son6 = ReportsData.son6Ay();
    document.getElementById("istAylikListe").innerHTML = son6.map(function(a){
      return "<div class='istatistik-satir'><span class='istatistik-satir-ad'>" + a.ayAd + " " + a.yil + "</span><span class='istatistik-satir-deger'>" + fmt(a.toplam) + " EUR</span></div>";
    }).join("");

    var musteriler = ReportsData.enCokSatisYapilanMusteriler(5);
    var musteriHtml = musteriler.length === 0
      ? "<p class='bos-mesaj'>Henüz veri yok.</p>"
      : musteriler.map(function(m){
          return "<div class='istatistik-satir'><span class='istatistik-satir-ad'>" + htmlEsc(m.ad) + "</span><span class='istatistik-satir-deger'>" + fmt(m.toplam) + " EUR</span></div>";
        }).join("");
    document.getElementById("istMusteriListe").innerHTML = musteriHtml;

    var kacanOzet = ReportsData.kacanOzetBuAy();
    document.getElementById("istKacanSayi").textContent = kacanOzet.kacanlar.length;
    document.getElementById("istKacanTutar").textContent = fmt(kacanOzet.toplamTutar) + " EUR";
    document.getElementById("istKacanListe").innerHTML = kacanOzet.kacanlar.length === 0
      ? "<p class='bos-mesaj'>Bu ay kaçan işaretli kayıt yok.</p>"
      : kacanOzet.kacanlar.map(function(k){
          return "<div class='kacan-satir'>"
            + "<div class='kacan-satir-ust'><span>" + htmlEsc(k.kayit.musteri) + "</span><span>" + fmt(k.tutar) + " EUR</span></div>"
            + "<div class='kacan-satir-alt'>" + (k.kayit.kacanRakip ? "Rakip: "+htmlEsc(k.kayit.kacanRakip)+" · " : "") + (k.kayit.kacanSebep||"Sebep belirtilmedi") + "</div>"
            + "</div>";
        }).join("");
  }catch(e){ hataGoster("İstatistikler çizilemedi: " + e.message); }
}

function islemleriCiz(){
  try{
    var q = (document.getElementById("islemAra").value||"").trim().toLocaleLowerCase("tr-TR");
    var tipFiltre = document.getElementById("islemTipFiltre").value;

    var liste = ReportsData.sonIslemler();
    if(tipFiltre) liste = liste.filter(function(k){ return k.tip === tipFiltre; });
    if(q) liste = liste.filter(function(k){ return (k.musteri||"").toLocaleLowerCase("tr-TR").indexOf(q) >= 0; });
    liste = liste.slice(0, 100);

    var kapsayici = document.getElementById("islemlerListesi");
    var bos = document.getElementById("islemlerBosMesaj");

    if(liste.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = liste.map(function(k, i){
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      var kacanMi = k.durum === "kacan";
      var urunDetayHtml = (k.urunler||[]).map(function(u){
        return "<div class='urun-detay-satir'><span>" + htmlEsc(u.ad) + " (" + (u.adet||1) + " adet)</span><span>" + (u.toplamEuro||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR</span></div>";
      }).join("");
      return "<div class='islem-karti" + (kacanMi?" islem-karti--kacan":"") + "'>"
        + "<div class='islem-ust-satir islem-tiklanabilir' data-ac-i='" + i + "'>"
        + "<span class='islem-musteri'>" + htmlEsc(k.musteri) + "</span>"
        + "<span class='islem-tip islem-tip--" + k.tip + "'>" + TIP_ETIKET[k.tip] + "</span>"
        + "</div>"
        + "<div class='islem-detay islem-tiklanabilir' data-ac-i='" + i + "'>" + htmlEsc(k.tarih) + " · " + (k.urunler||[]).length + " ürün · " + htmlEsc(k.sehir||"") + " <span class='islem-ac-ikon'>▾</span></div>"
        + "<div class='islem-toplam'>" + toplam.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR</div>"
        + "<div class='urun-detay-kutu' id='urunDetay-" + i + "' hidden>" + urunDetayHtml + "</div>"
        + (kacanMi
            ? "<div class='islem-kacan-etiket'>❌ KAÇTI" + (k.kacanRakip?" → "+htmlEsc(k.kacanRakip):"") + (k.kacanSebep?" ("+htmlEsc(k.kacanSebep)+")":"") + "</div>"
            : ""
              + ((k.tip==="teklif"||k.tip==="proforma") ? "<button class='islem-kacan-btn' data-i='"+i+"'>❌ Kaçtı Olarak İşaretle</button>" : "")
              + (SONRAKI_ASAMA[k.tip] ? "<button class='islem-ilerlet-btn' data-ilerlet-i='"+i+"'>▶️ İlerlet — " + TIP_ETIKET[SONRAKI_ASAMA[k.tip]] + "</button>" : "")
           )
        + "<div class='islem-duzenle-sil-satir'>"
        + "<button class='islem-duzenle-btn' data-duzenle-i='" + i + "'>✏️ Düzenle</button>"
        + "<button class='islem-sil-btn' data-sil-i='" + i + "'>🗑️ Sil</button>"
        + "</div>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".islem-tiklanabilir").forEach(function(el){
      el.onclick = function(){
        var i = this.getAttribute("data-ac-i");
        var detay = document.getElementById("urunDetay-" + i);
        if(detay) detay.hidden = !detay.hidden;
      };
    });

    kapsayici.querySelectorAll(".islem-ilerlet-btn").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-ilerlet-i"), 10);
        ilerletTiklandi(liste[i]);
      };
    });

    kapsayici.querySelectorAll(".islem-duzenle-btn").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-duzenle-i"), 10);
        duzenlemeAc(liste[i]);
      };
    });

    kapsayici.querySelectorAll(".islem-sil-btn").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-sil-i"), 10);
        var k = liste[i];
        if(!confirm(k.musteri + " — " + k.tarih + " kaydı tamamen silinsin mi? Bu geri alınamaz.")) return;
        ReportsData.kaydiSil(k.tip, k.ts, function(basarili, err){
          if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      };
    });

    kapsayici.querySelectorAll(".islem-kacan-btn").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        var k = liste[i];
        var sebep = prompt("Kaçırma sebebi (örn. Fiyat, Termin, Rakip):", "") || "";
        var rakip = prompt("Rakip firma (opsiyonel):", "") || "";
        ReportsData.kaydiKacanIsaretle(k.tip, k.ts, sebep, rakip, function(basarili, err){
          if(basarili) alert("✓ İşaretlendi.");
          else hataGoster("İşaretlenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      };
    });
  }catch(e){ hataGoster("İşlemler çizilemedi: " + e.message); }
}

function gorevleriCiz(){
  try{
    var liste = ReportsData.gorevleriGetir();
    var kapsayici = document.getElementById("gorevListesiKapsayici");
    var bos = document.getElementById("gorevBosMesaj");

    if(liste.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = liste.map(function(g){
      return "<div class='gorev-karti" + (g.tamamlandi?" tamamlandi":"") + "'>"
        + "<input type='checkbox' class='gorev-checkbox' data-id='" + g.id + "' " + (g.tamamlandi?"checked":"") + ">"
        + "<div class='gorev-bilgi'>"
        + "<div class='gorev-musteri'>" + htmlEsc(g.musteriAd) + "</div>"
        + "<div class='gorev-aciklama'>" + htmlEsc(g.aciklama) + "</div>"
        + "<div class='gorev-zaman'>" + htmlEsc(g.tarih||"") + " " + htmlEsc(g.saat||"") + "</div>"
        + "</div>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".gorev-checkbox").forEach(function(cb){
      cb.onchange = function(){
        ReportsData.gorevTamamlandiToggle(this.getAttribute("data-id"));
      };
    });
  }catch(e){ hataGoster("Görevler çizilemedi: " + e.message); }
}

function gorevEkleTiklandi(){
  try{
    var musteri = document.getElementById("gorevMusteri").value.trim();
    var aciklama = document.getElementById("gorevAciklama").value.trim();
    var tarih = document.getElementById("gorevTarih").value;
    var saat = document.getElementById("gorevSaat").value;
    if(!musteri || !aciklama){
      hataGoster("Müşteri/konu ve açıklama girin.");
      return;
    }
    ReportsData.gorevEkle(musteri, aciklama, tarih, saat);
    document.getElementById("gorevMusteri").value = "";
    document.getElementById("gorevAciklama").value = "";
  }catch(e){ hataGoster("Görev eklenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

function ziyaretleriCiz(){
  try{
    var liste = CustomerData.ziyaretHatirlatmalari();
    var kapsayici = document.getElementById("ziyaretListesi");
    if(liste.length === 0){
      kapsayici.innerHTML = "<p class='bos-mesaj'>Müşteri listesi boş.</p>";
      return;
    }
    kapsayici.innerHTML = liste.map(function(z, i){
      var gunMetin = z.hicZiyaretYok ? "Hiç ziyaret yok" : z.gun + " gündür yok";
      var kritikSinif = "";
      if(z.hicZiyaretYok || z.gun >= 30) kritikSinif = "ziyaret-karti--kritik";
      else if(z.gun >= 15) kritikSinif = "ziyaret-karti--uyari";
      return "<div class='ziyaret-karti " + kritikSinif + "' data-i='" + i + "'>"
        + "<div class='ziyaret-ust-satir'><span class='ziyaret-musteri'>" + htmlEsc(z.musteri) + "</span><span class='ziyaret-gun-etiket'>" + gunMetin + "</span></div>"
        + "<div class='ziyaret-sehir'>" + htmlEsc(z.sehir||"-") + "</div>"
        + "<div class='ziyaret-not-input'><input type='text' placeholder='Ziyaret notu (opsiyonel)' data-not='" + i + "'><button class='ziyaret-ekle-btn' data-ekle='" + i + "'>✓ Ziyaret Ekle</button></div>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll("[data-ekle]").forEach(function(btn, i){
      btn.onclick = function(){
        var not = kapsayici.querySelector("[data-not='" + i + "']").value;
        btn.disabled = true;
        btn.textContent = "Kaydediliyor...";
        CustomerData.ziyaretEkle(liste[i].musteri, not, function(basarili, err){
          if(basarili){
            alert("✓ Ziyaret kaydedildi.");
          } else {
            hataGoster("Ziyaret kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
            btn.disabled = false;
            btn.textContent = "✓ Ziyaret Ekle";
          }
        });
      };
    });
  }catch(e){ hataGoster("Ziyaretler çizilemedi: " + e.message); }
}

var duzenlenenKayit = null;

function duzenlemeAc(k){
  duzenlenenKayit = k;
  var kapsayici = document.getElementById("duzenleUrunListesi");
  kapsayici.innerHTML = (k.urunler||[]).map(function(u, i){
    return "<div class='duzenle-urun-satir'>"
      + "<div class='duzenle-urun-ad'>" + htmlEsc(u.ad) + "</div>"
      + "<div class='duzenle-alan-grid'>"
      + "<input type='number' step='0.01' data-alan='listeFiyat' data-i='" + i + "' value='" + (u.listeFiyat||0) + "' placeholder='Liste Fiyat'>"
      + "<input type='number' step='0.1' data-alan='iskonto' data-i='" + i + "' value='" + (u.iskonto||0) + "' placeholder='İskonto %'>"
      + "<input type='number' step='1' data-alan='adet' data-i='" + i + "' value='" + (u.adet||1) + "' placeholder='Adet'>"
      + "<input type='number' step='0.01' data-alan='dipFiyat' data-i='" + i + "' value='" + (u.dipFiyat||0) + "' placeholder='Dip Fiyat'>"
      + "</div>"
      + "</div>";
  }).join("");
  document.getElementById("duzenleOverlay").hidden = false;
}

function duzenlemeKaydet(){
  try{
    if(!duzenlenenKayit) return;
    var yeniUrunler = (duzenlenenKayit.urunler||[]).map(function(u, i){
      var listeFiyat = parseFloat(document.querySelector("[data-alan='listeFiyat'][data-i='"+i+"']").value)||0;
      var iskonto = parseFloat(document.querySelector("[data-alan='iskonto'][data-i='"+i+"']").value)||0;
      var adet = parseFloat(document.querySelector("[data-alan='adet'][data-i='"+i+"']").value)||1;
      var dipFiyat = parseFloat(document.querySelector("[data-alan='dipFiyat'][data-i='"+i+"']").value)||0;
      var iskontoluFiyat = listeFiyat - (listeFiyat*iskonto/100);
      return {
        ad: u.ad, berta: u.berta, abas: u.abas,
        listeFiyat: listeFiyat, iskonto: iskonto, adet: adet, dipFiyat: dipFiyat,
        iskBirim: iskontoluFiyat,
        toplamEuro: iskontoluFiyat * adet
      };
    });
    var btn = document.getElementById("btnDuzenleKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    ReportsData.kaydiGuncelle(duzenlenenKayit.tip, duzenlenenKayit.ts, yeniUrunler, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "Kaydet";
      if(basarili){
        document.getElementById("duzenleOverlay").hidden = true;
        duzenlenenKayit = null;
        alert("✓ Güncellendi.");
      } else {
        hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Düzenleme kaydedilemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  sekmeGecisBagla();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnGorevEkle").onclick = gorevEkleTiklandi;

  var bugun = new Date();
  document.getElementById("gorevTarih").value = bugun.toISOString().slice(0,10);

  document.getElementById("btnDuzenleVazgec").onclick = function(){ document.getElementById("duzenleOverlay").hidden = true; duzenlenenKayit = null; };
  document.getElementById("btnDuzenleKaydet").onclick = duzenlemeKaydet;
  document.getElementById("islemAra").addEventListener("input", islemleriCiz);
  document.getElementById("islemTipFiltre").addEventListener("change", islemleriCiz);
  ReportsData.arsivDegistiginde(islemleriCiz);
  ReportsData.gorevDegistiginde(gorevleriCiz);
});
