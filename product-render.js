/*
  product-render.js
  =================
  TEK görevi: arama kutusunu dinlemek, ProductData.ara()'dan sonuç almak ve
  ekrana kart olarak basmak. Hesaplama/Firebase mantığı içermez.
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

function sonuclariCiz(){
  try{
    var q = document.getElementById("searchInput").value;
    var liste = document.getElementById("sonucListesi");
    var bos = document.getElementById("bosMesaj");
    var yukleniyor = document.getElementById("yukleniyorMesaj");

    if(ProductData.katalogUzunluk() === 0){
      liste.innerHTML = "";
      bos.hidden = true;
      yukleniyor.hidden = false;
      return;
    }
    yukleniyor.hidden = true;

    var sonuclar = ProductData.ara(q);
    // Arama kutusu boşken sonuç listesini şişirmemek için sınırla
    if(q.trim().length === 0) sonuclar = sonuclar.slice(0, 30);

    if(sonuclar.length === 0){
      liste.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    var html = "";
    for(var i=0;i<sonuclar.length;i++){
      var idx = sonuclar[i].idx;
      var bilgi = ProductData.urunBilgisi(sonuclar[i].item);
      var eklendi = ProductData.sepetteMi(idx);
      html += "<tr>"
        + "<td class='product-cell product-cell--tikla' data-arama='" + htmlEsc(bilgi.abas || bilgi.berta || bilgi.ad) + "'>"
        + "<div class='tablo-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(bilgi.berta||"-") + " <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(bilgi.abas||"-") + "</div>"
        + "<div class='urun-adi'>" + htmlEsc(bilgi.ad) + " <span class='urun-detay-ok'>🔗</span></div>"
        + "</td>"
        + "<td><span class='tablo-fiyat'>" + bilgi.fiyat.toFixed(2) + " EUR</span></td>"
        + "<td><button class='btn-add" + (eklendi?" added":"") + "' data-idx='" + idx + "'>" + (eklendi?"EKLENDİ":"Seç") + "</button></td>"
        + "</tr>";
    }
    liste.innerHTML = html;

    // Ürün hücresine dokununca WEICON Türkiye sitesinde bu ürünü ara (yeni
    // sekme). Statik siteden doğrudan resim/teknik bilgi çekmek CORS
    // nedeniyle mümkün değil, bu yüzden gerçek WEICON sayfasını açıyoruz.
    liste.querySelectorAll(".product-cell--tikla").forEach(function(td){
      td.onclick = function(){
        var kod = this.getAttribute("data-arama");
        window.open("https://www.weicon.com.tr/search?search=" + encodeURIComponent(kod), "_blank");
      };
    });

    // Buton olayları — HTML string'e onclick gömmek yerine burada bağlanıyor
    var butonlar = liste.querySelectorAll(".btn-add");
    butonlar.forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var eklendiMi = ProductData.sepeteEkleCikar(idx);
        sepetSatiriniGuncelle();
        sonuclariCiz(); // buton durumunu tazele
        if(eklendiMi){
          document.getElementById("searchInput").value = "";
          document.getElementById("searchInput").focus();
          sonuclariCiz();
        }
      };
    });
  }catch(e){ hataGoster("Sonuçlar çizilemedi: " + e.message); }
}

function sepetSatiriniGuncelle(){
  try{
    var sayi = ProductData.sepetSayisi();
    document.getElementById("sepetSayisi").textContent = sayi;
    var btn = document.getElementById("btnSepeteDevam");
    btn.hidden = sayi === 0;
  }catch(e){ hataGoster("Sepet satırı güncellenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

var TIP_ETIKET_URUN = {siparis:"SİP", teklif:"TEK", proforma:"PRO", numune:"NUM"};
var TIP_RENK_URUN = {siparis:"#003a70", teklif:"#1f9d55", proforma:"#8e44ad", numune:"#b7601f"};

function urunSatisGecmisiGetir(berta, abas){
  var tipler = ["siparis","teklif","proforma","numune"];
  var sonuc = [];
  tipler.forEach(function(tip){
    ReportsData.sonIslemler().filter(function(k){ return k.tip===tip; }).forEach(function(kayit){
      (kayit.urunler||[]).forEach(function(u){
        if(u.berta===berta && u.abas===abas){
          sonuc.push({
            musteri: kayit.musteri||"-", tarih: kayit.tarih||"", ts: kayit.ts||0, tip: tip,
            adet: u.adet||0, iskBirim: u.iskBirim||0, iskonto: u.iskonto||0
          });
        }
      });
    });
  });
  sonuc.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  return sonuc;
}

function urunSatisGecmisiniAc(berta, abas, ad){
  try{
    var gecmis = urunSatisGecmisiGetir(berta, abas);
    var musteriSeti = {}; var toplamAdet = 0;
    gecmis.forEach(function(g){ musteriSeti[g.musteri]=true; toplamAdet += g.adet; });

    document.getElementById("urunGecmisKod").textContent = "Berta: " + (berta||"-") + " · Abas: " + (abas||"-");
    document.getElementById("urunGecmisAd").textContent = ad;
    document.getElementById("urunGecmisMusteriSayisi").textContent = Object.keys(musteriSeti).length;
    document.getElementById("urunGecmisToplamAdet").textContent = toplamAdet + " adet";

    var kapsayici = document.getElementById("urunGecmisListesi");
    if(gecmis.length === 0){
      kapsayici.innerHTML = "<p class='bos-mesaj'>Bu ürün henüz hiçbir müşteriye satılmamış/teklif edilmemiş.</p>";
    } else {
      kapsayici.innerHTML = gecmis.map(function(g){
        return "<div class='urun-gecmis-satir'>"
          + "<div class='urun-gecmis-satir-ust'>"
          + "<span class='urun-gecmis-tip-rozet' style='background:" + (TIP_RENK_URUN[g.tip]||"#2d3540") + ";'>" + (TIP_ETIKET_URUN[g.tip]||"") + "</span>"
          + "<span class='urun-gecmis-musteri'>" + htmlEsc(g.musteri) + "</span>"
          + "<span class='urun-gecmis-tarih'>" + htmlEsc(g.tarih) + "</span>"
          + "</div>"
          + "<div class='urun-gecmis-detay'>" + g.adet + " adet · " + g.iskBirim.toFixed(2) + "€/birim · %" + g.iskonto + " iskonto</div>"
          + "</div>";
      }).join("");
    }

    document.getElementById("ozelListeBolumu").hidden = true;
    document.getElementById("anaTabloAlani").hidden = true;
    document.getElementById("urunGecmisBolumu").hidden = false;
    document.getElementById("urunGecmisBolumu").scrollIntoView({behavior:"smooth", block:"start"});
  }catch(e){ hataGoster("Ürün satış geçmişi açılamadı: " + e.message); }
}

function hitUrunleriHesapla(){
  var haritalar = {};
  ["siparis"].forEach(function(tip){
    ReportsData.sonIslemler().filter(function(k){ return k.tip===tip; }).forEach(function(kayit){
      (kayit.urunler||[]).forEach(function(u){
        var anahtar = (u.berta||"")+"|"+(u.abas||"");
        if(!haritalar[anahtar]) haritalar[anahtar] = {ad:u.ad, berta:u.berta, abas:u.abas, adet:0, fiyat:u.listeFiyat||0};
        haritalar[anahtar].adet += u.adet||0;
      });
    });
  });
  return Object.values(haritalar).sort(function(a,b){ return b.adet-a.adet; });
}

function ozelListeyiAc(baslik, liste){
  document.getElementById("ozelListeBaslik").textContent = baslik;
  var govde = document.getElementById("ozelListeGovde");
  if(liste.length === 0){
    govde.innerHTML = "<tr><td colspan='3' style='text-align:center;color:#8a97a6;padding:16px;'>Henüz sipariş kaydı yok.</td></tr>";
  } else {
    govde.innerHTML = liste.slice(0,30).map(function(u,i){
      return "<tr data-i='" + i + "'>"
        + "<td class='hit-urun-sira-ad'>" + (i+1) + ". " + htmlEsc(u.ad) + "<div class='hit-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(u.berta||"-") + " <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(u.abas||"-") + "</div></td>"
        + "<td class='hit-urun-adet'>" + u.adet + "</td>"
        + "<td>📊</td>"
        + "</tr>";
    }).join("");
  }
  document.getElementById("anaTabloAlani").hidden = true;
  document.getElementById("urunGecmisBolumu").hidden = true;
  document.getElementById("ozelListeBolumu").hidden = false;

  govde.querySelectorAll("tr[data-i]").forEach(function(tr){
    tr.onclick = function(){
      var i = parseInt(this.getAttribute("data-i"), 10);
      var u = liste[i];
      urunSatisGecmisiniAc(u.berta, u.abas, u.ad);
    };
  });
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("searchInput").addEventListener("input", sonuclariCiz);
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnSepeteDevam").onclick = function(){ window.location.href = "cart.html"; };

  document.getElementById("btnHitUrunler").onclick = function(){
    ozelListeyiAc("🔥 Hit Ürünler (en çok satılan)", hitUrunleriHesapla());
  };
  document.getElementById("btnOzelListeKapat").onclick = function(){
    document.getElementById("ozelListeBolumu").hidden = true;
    document.getElementById("anaTabloAlani").hidden = false;
  };
  document.getElementById("btnUrunGecmisKapat").onclick = function(){
    document.getElementById("urunGecmisBolumu").hidden = true;
    document.getElementById("anaTabloAlani").hidden = false;
  };

  document.getElementById("btnYeniUrunAc").onclick = function(){
    document.getElementById("yeniUrunBerta").value = "";
    document.getElementById("yeniUrunAbas").value = "";
    document.getElementById("yeniUrunAdi").value = "";
    document.getElementById("yeniUrunFiyat").value = "";
    document.getElementById("yeniUrunHata").hidden = true;
    document.getElementById("yeniUrunOverlay").hidden = false;
    document.getElementById("yeniUrunOverlay").scrollIntoView({behavior:"smooth", block:"start"});
  };
  document.getElementById("btnYeniUrunVazgec").onclick = function(){
    document.getElementById("yeniUrunOverlay").hidden = true;
  };
  document.getElementById("btnYeniUrunKaydet").onclick = function(){
    var bilgi = {
      berta: document.getElementById("yeniUrunBerta").value,
      abas: document.getElementById("yeniUrunAbas").value,
      ad: document.getElementById("yeniUrunAdi").value,
      fiyat: document.getElementById("yeniUrunFiyat").value
    };
    var hataEl = document.getElementById("yeniUrunHata");
    hataEl.hidden = true;
    var btn = document.getElementById("btnYeniUrunKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    ProductData.yeniUrunEkle(bilgi, function(basarili, sonuc){
      btn.disabled = false;
      btn.textContent = "✓ Kaydet";
      if(basarili){
        alert("✓ \"" + bilgi.ad + "\" listeye eklendi.");
        document.getElementById("yeniUrunOverlay").hidden = true;
      } else {
        hataEl.textContent = "⚠️ " + (typeof sonuc === "string" ? sonuc : (sonuc && sonuc.message ? sonuc.message : "Eklenemedi."));
        hataEl.hidden = false;
      }
    });
  };

  ProductData.katalogDegistiginde(sonuclariCiz);
  sepetSatiriniGuncelle();
  sonuclariCiz();
});
