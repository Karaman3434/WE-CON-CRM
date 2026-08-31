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

function ilerletTiklandi(k){
  try{
    var secenekler = ReportsData.SONRAKI_ASAMALAR[k.tip];
    if(!secenekler) return;
    var etiketler = secenekler.map(function(s){ return TIP_ETIKET[s]; }).join(" veya ");
    if(!confirm(k.musteri + " için " + (k.urunler||[]).length + " ürün düzenlenmek üzere Sepet'e yüklenecek" + (secenekler.length>1 ? " (Gönder'de " + etiketler + " seçebileceksin)." : (" ve " + etiketler + " olarak ilerletilecek.")) + " Devam edilsin mi?")) return;
    ReportsData.revizeBaslat(k);
  }catch(e){ hataGoster("İlerletilemedi: " + e.message); }
}

function ayDetayiniAc(ayVerisi){
  try{
    if(!ayVerisi) return;
    // Sadece SİPARİŞ'ler sayılır ve listelenir — Numune/Fiyat Teklifi/
    // Proforma bu ekranda gösterilmez (hepsi zaten "Son İşlemler"de
    // ayrıca görünüyor). "AY TOPLAMI" gerçek satış hacmini yansıtsın diye.
    var kayitlarBuAy = ReportsData.sonIslemler().filter(function(k){
      if(!k.tarih) return false;
      if(k.tip !== "siparis") return false;
      var parca = k.tarih.split(" ");
      return (parca[1]||"")===ayVerisi.ayAd && (parca[2]||"")===ayVerisi.yil;
    });
    if(kayitlarBuAy.length === 0){
      alert("Bu ayda sipariş kaydı yok.");
      return;
    }

    var ayToplamEuro = kayitlarBuAy.reduce(function(s,k){
      return s + (k.urunler||[]).reduce(function(ss,u){ return ss+(u.toplamEuro||0); }, 0);
    }, 0);
    var ayToplamTl = kayitlarBuAy.reduce(function(s,k){
      var kKuru = k.kur || (parseFloat(localStorage.getItem("weicon_kur"))||0);
      return s + (k.urunler||[]).reduce(function(ss,u){ return ss+((u.toplamEuro||0)*kKuru); }, 0);
    }, 0);

    document.getElementById("ayDetayBaslik").textContent = "📅 " + ayVerisi.ayAd + " " + ayVerisi.yil + " Kayıtları";
    document.getElementById("ayDetayToplamEtiket").textContent = "🧮 SİPARİŞ TOPLAMI (" + kayitlarBuAy.length + " kayıt)";
    document.getElementById("ayDetayToplamDeger").textContent = fmt(ayToplamEuro) + " € · ≈ " + fmt(ayToplamTl) + " TL";

    document.getElementById("ayDetayListesi").innerHTML = "<div class='musteri-liste-kutu'>" + kayitlarBuAy.map(function(k, i){
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      var kacanMi = k.durum === "kacan";
      var kodBilgi = kodRozetVeRenkGetir(k);
      var kod = kodBilgi.kod, renk = kodBilgi.renk;
      var durumEk = "";
      if(kacanMi) durumEk = " ❌ KAÇTI";
      if(k.revizeZamani) durumEk += " 🔄 REVİZE";
      return "<div class='ay-detay-satir' data-tip='" + k.tip + "' data-ts='" + k.ts + "'>"
        + "<div class='ay-detay-satir-ust'>"
        + "<span class='islem-kod-rozet' style='background:" + renk + ";'>" + kod + "</span>"
        + "<span class='ay-detay-satir-tarih'>" + htmlEsc(k.tarih) + "</span>"
        + (durumEk ? "<span class='islem-durum-ek'>" + durumEk + "</span>" : "")
        + "</div>"
        + "<div class='ay-detay-satir-alt'>"
        + "<span class='ay-detay-satir-musteri'>" + htmlEsc(k.musteri) + "</span>"
        + "<span class='ay-detay-satir-tutar'><span style='color:" + renk + ";'>" + fmt(toplam) + "€</span></span>"
        + "</div>"
        + "</div>";
    }).join("") + "</div>";

    document.getElementById("ayDetayListesi").querySelectorAll(".ay-detay-satir").forEach(function(el){
      el.onclick = function(){
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:this.getAttribute("data-tip"), ts:parseFloat(this.getAttribute("data-ts"))}));
        window.location.href = "belge-onizleme.html";
      };
    });

    document.getElementById("ayDetayBolumu").hidden = false;
    document.getElementById("ayDetayBolumu").scrollIntoView({behavior:"smooth", block:"start"});
  }catch(e){ hataGoster("Ay detayı açılamadı: " + e.message); }
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

    var ozet = ReportsData.aylikPrimOzeti12();
    var genelToplam=0, genelToplamTl=0, genelPrim=0, genelPrimTl=0;
    document.getElementById("istAylikListe").innerHTML = ozet.aylar.map(function(a, i){
      genelToplam += a.toplam; genelToplamTl += a.toplamTl; genelPrim += a.prim; genelPrimTl += a.primTl;
      var mevcutAySinifi = i===0 ? " aylik-ozet-satir--mevcut-ay" : "";
      return "<tr class='" + mevcutAySinifi.trim() + "'>"
        + "<td class='aylik-ozet-ay-hucre'>" + a.ayAd + " " + a.yil + "</td>"
        + "<td>" + fmt(a.toplam) + " €</td>"
        + "<td class='aylik-ozet-satirtl-hucre'>" + fmt(a.toplamTl) + " ₺</td>"
        + "<td class='aylik-ozet-prim-hucre'>" + fmt(a.prim) + " €</td>"
        + "<td class='aylik-ozet-primtl-hucre'>" + fmt(a.primTl) + " ₺</td>"
        + "</tr>";
    }).join("");
    document.getElementById("istAylikGenelToplam").textContent = fmt(genelToplam) + " €";
    document.getElementById("istAylikGenelPrim").textContent = fmt(genelPrim) + " €";
    document.getElementById("istAylikGenelPrimTl").textContent = fmt(genelPrimTl) + " ₺";
    var kurNotuEl = document.getElementById("istAylikKurNotu");
    if(ozet.kur){
      kurNotuEl.className = "aylik-ozet-kur-notu";
      kurNotuEl.textContent = "Kur: 1 € = " + fmt(ozet.kur) + " ₺ üzerinden hesaplandı";
    } else {
      kurNotuEl.className = "aylik-ozet-kur-notu aylik-ozet-kur-notu--hata";
      kurNotuEl.textContent = "⚠️ Güncel kur bulunamadı, TL Prim hesaplanamadı";
    }

    document.getElementById("istAylikListe").querySelectorAll("tr").forEach(function(tr, i){
      tr.onclick = function(){ ayDetayiniAc(ozet.aylar[i]); };
    });

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

// Rozet artık .kod alanının kendisi (örn. "F.TEK.010126.1300") — TIP_KOD
// eski kısa harfler yerine gerçek önek üretir, KOD_RENK önek bazında renk
// verir. .kod hâlâ yoksa (çok eski kayıt) TIP_KOD_YEDEK ile geriye dönük
// uyumluluk sağlanır.
var TIP_KOD_YEDEK = {numune:"NUM", teklif:"F.TEK", proforma:"P.FAT", siparis:"SİP"};
var KOD_RENK = {"SİP":"#003a70", "F.TEK":"#28a745", "P.FAT":"#8e44ad", "NUM":"#b7601f"};
function kodOnekiAyikla(kod){
  if(!kod) return null;
  // Son iki nokta ayraçlı parça (GGAAYY.SSDD) hariç, kalan kısım önektir.
  var parcalar = kod.split(".");
  if(parcalar.length < 3) return kod; // beklenmeyen format — olduğu gibi göster
  return parcalar.slice(0, parcalar.length-2).join(".");
}
function kodRozetVeRenkGetir(k){
  var kod = k.kod || TIP_KOD_YEDEK[k.tip] || "?";
  var onek = kodOnekiAyikla(k.kod) || TIP_KOD_YEDEK[k.tip] || "?";
  var renk = (k.durum === "kacan") ? "#c0392b" : (KOD_RENK[onek] || "#3569b8");
  return {kod: kod, renk: renk};
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
      var kodBilgi = kodRozetVeRenkGetir(k);
      var kod = kodBilgi.kod, renk = kodBilgi.renk;
      var durumEk = "";
      if(kacanMi) durumEk = " — ❌ KAÇTI" + (k.kacanRakip?" → "+htmlEsc(k.kacanRakip):"");
      if(k.revizeZamani) durumEk += " — 🔄 REVİZE";
      var urunDetayHtml = (k.urunler||[]).map(function(u){
        return "<div class='urun-detay-satir'><span>" + htmlEsc(u.ad) + " (" + (u.adet||1) + " adet)</span><span>" + (u.toplamEuro||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR</span></div>";
      }).join("");
      return "<div class='islem-karti" + (kacanMi?" islem-karti--kacan":"") + "'>"
        + "<div class='islem-rozet-satir islem-tiklanabilir' data-ac-i='" + i + "'>"
        + "<span class='islem-kod-rozet' style='background:" + renk + ";'>" + kod + "</span>"
        + "<span class='islem-tarih-buyuk'>" + htmlEsc(k.tarih) + "</span>"
        + (durumEk ? "<span class='islem-durum-ek'>" + durumEk + "</span>" : "")
        + "<span class='islem-toplam-satirici'>" + toplam.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR</span>"
        + "</div>"
        + "<div class='islem-musteri-satir islem-musteri-tiklanabilir' data-belge-i='" + i + "'>"
        + "<span class='islem-musteri-buyuk'>" + htmlEsc(k.musteri) + "</span>"
        + "<span class='islem-sehir-buyuk'>" + htmlEsc(k.sehir||"-") + "</span>"
        + "</div>"
        + "<div class='islem-detay islem-tiklanabilir' data-ac-i='" + i + "'>" + (k.urunler||[]).length + " ürün <span class='islem-ac-ikon'>▾</span></div>"
        + "<div class='urun-detay-kutu' id='urunDetay-" + i + "' hidden>" + urunDetayHtml + "</div>"
        + (!kacanMi
              ? ((k.tip==="teklif"||k.tip==="proforma") ? "<button class='islem-kacan-btn' data-i='"+i+"'>❌ Kaçtı Olarak İşaretle</button>" : "")
              + (ReportsData.SONRAKI_ASAMALAR[k.tip] ? "<button class='islem-ilerlet-btn' data-ilerlet-i='"+i+"'>▶️ " + (ReportsData.SONRAKI_ASAMALAR[k.tip].length>1 ? "İlerlet" : "İlerlet — " + TIP_ETIKET[ReportsData.SONRAKI_ASAMALAR[k.tip][0]]) + "</button>" : "")
              : ""
           )
        + "<div class='islem-3buton-satir'>"
        + "<button class='islem-belge-btn' data-belge-i='" + i + "'>📄 Belge</button>"
        + "<button class='islem-duzenle-btn' data-duzenle-i='" + i + "'>✏️ Düzenle</button>"
        + "<button class='islem-sil-btn' data-sil-i='" + i + "'>🗑️ Sil</button>"
        + "</div>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".islem-belge-btn, .islem-musteri-tiklanabilir").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-belge-i"), 10);
        var k = liste[i];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });

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

function islemlerExcelAktar(){
  try{
    if(typeof XLSX === "undefined"){
      hataGoster("Excel kütüphanesi yüklenemedi, internet bağlantınızı kontrol edin.");
      return;
    }
    var q = (document.getElementById("islemAra").value||"").trim().toLocaleLowerCase("tr-TR");
    var tipFiltre = document.getElementById("islemTipFiltre").value;
    var liste = ReportsData.sonIslemler();
    if(tipFiltre) liste = liste.filter(function(k){ return k.tip === tipFiltre; });
    if(q) liste = liste.filter(function(k){ return (k.musteri||"").toLocaleLowerCase("tr-TR").indexOf(q) >= 0; });

    if(liste.length === 0){
      alert("Aktarılacak kayıt bulunamadı.");
      return;
    }

    var basliklar = ["Tarih","Müşteri","Şehir","Tür","Ürün Sayısı","Toplam (EUR)","Durum"];
    var veriSatirlari = liste.map(function(k){
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      var durum = k.durum === "kacan" ? "Kaçtı" : "";
      return [k.tarih||"", k.musteri||"", k.sehir||"", TIP_ETIKET[k.tip]||k.tip, (k.urunler||[]).length, toplam, durum];
    });

    var aoa = [basliklar].concat(veriSatirlari);
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:18},{wch:22},{wch:16},{wch:10},{wch:10},{wch:12},{wch:10}];

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Son İşlemler");
    var now = new Date();
    var dosyaAdi = "Son_Islemler_" + now.getFullYear() + String(now.getMonth()+1).padStart(2,"0") + String(now.getDate()).padStart(2,"0") + ".xlsx";
    XLSX.writeFile(wb, dosyaAdi);
  }catch(e){ hataGoster("Excel oluşturulamadı: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

var duzenlenenKayit = null;
var duzenlemeSilinenIndeksler = [];

function duzenlemeAc(k){
  duzenlenenKayit = k;
  duzenlemeSilinenIndeksler = [];
  var kapsayici = document.getElementById("duzenleUrunListesi");
  kapsayici.innerHTML = (k.urunler||[]).map(function(u, i){
    return "<div class='duzenle-urun-satir' id='duzenleSatir-" + i + "'>"
      + "<div class='duzenle-urun-baslik-satir'>"
      + "<div class='duzenle-urun-ad'>" + htmlEsc(u.ad) + "</div>"
      + "<button class='duzenle-urun-sil-btn' data-urun-sil-i='" + i + "'>🗑️</button>"
      + "</div>"
      + "<div class='duzenle-alan-grid'>"
      + "<input type='number' step='0.01' data-alan='listeFiyat' data-i='" + i + "' value='" + (u.listeFiyat||0) + "' placeholder='Liste Fiyat'>"
      + "<input type='number' step='0.1' data-alan='iskonto' data-i='" + i + "' value='" + (u.iskonto||0) + "' placeholder='İskonto %'>"
      + "<input type='number' step='1' data-alan='adet' data-i='" + i + "' value='" + (u.adet||1) + "' placeholder='Adet'>"
      + "<input type='number' step='0.01' data-alan='dipFiyat' data-i='" + i + "' value='" + (u.dipFiyat||0) + "' placeholder='Dip Fiyat'>"
      + "</div>"
      + "</div>";
  }).join("");

  kapsayici.querySelectorAll(".duzenle-urun-sil-btn").forEach(function(btn){
    btn.onclick = function(){
      var i = parseInt(this.getAttribute("data-urun-sil-i"), 10);
      if((duzenlenenKayit.urunler||[]).length - duzenlemeSilinenIndeksler.length <= 1){
        alert("Bir kayıtta en az 1 ürün kalmalı. Tüm ürünleri silmek istiyorsan, kaydı tamamen 'Sil' butonuyla kaldır.");
        return;
      }
      duzenlemeSilinenIndeksler.push(i);
      var satir = document.getElementById("duzenleSatir-" + i);
      if(satir) satir.remove();
    };
  });

  document.getElementById("duzenleOverlay").hidden = false;
}

function duzenlemeKaydet(){
  try{
    if(!duzenlenenKayit) return;
    var yeniUrunler = [];
    (duzenlenenKayit.urunler||[]).forEach(function(u, i){
      if(duzenlemeSilinenIndeksler.indexOf(i) >= 0) return; // silinmiş ürün, atla
      var listeFiyat = parseFloat(document.querySelector("[data-alan='listeFiyat'][data-i='"+i+"']").value)||0;
      var iskonto = parseFloat(document.querySelector("[data-alan='iskonto'][data-i='"+i+"']").value)||0;
      var adet = parseFloat(document.querySelector("[data-alan='adet'][data-i='"+i+"']").value)||1;
      var dipFiyat = parseFloat(document.querySelector("[data-alan='dipFiyat'][data-i='"+i+"']").value)||0;
      var iskontoluFiyat = listeFiyat - (listeFiyat*iskonto/100);
      yeniUrunler.push({
        ad: u.ad, berta: u.berta, abas: u.abas,
        listeFiyat: listeFiyat, iskonto: iskonto, adet: adet, dipFiyat: dipFiyat,
        iskBirim: iskontoluFiyat,
        toplamEuro: iskontoluFiyat * adet
      });
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
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  // Akıllı Geri: Raporlar (raporlar.html) üzerinden gerçekten buraya
  // gelindiyse tarayıcı geçmişinde bir adım geri gider; geçmiş yoksa
  // (doğrudan bağlantıyla açıldıysa) Raporlar'a düşer.
  (function(){
    var btn = document.getElementById("btnGeriAkilli");
    if(btn) btn.onclick = function(){
      if(window.history.length > 1) window.history.back();
      else window.location.href = "raporlar.html";
    };
  })();

  document.getElementById("btnDuzenleVazgec").onclick = function(){ document.getElementById("duzenleOverlay").hidden = true; duzenlenenKayit = null; };
  document.getElementById("btnDuzenleKaydet").onclick = duzenlemeKaydet;
  document.getElementById("islemAra").addEventListener("input", islemleriCiz);
  document.getElementById("islemTipFiltre").addEventListener("change", islemleriCiz);
  document.getElementById("btnIslemlerExcel").onclick = islemlerExcelAktar;
  document.getElementById("btnAyDetayKapat").onclick = function(){ document.getElementById("ayDetayBolumu").hidden = true; };
  ReportsData.arsivDegistiginde(function(){ islemleriCiz(); istatistikleriCiz(); });
  // Firebase verisi sayfa tam yüklenmeden önce gelmiş olabilir (dinleyici
  // kaçırmış olabilir) — bu yüzden ilk anda da bir kez elle çiziyoruz.
  islemleriCiz();
  istatistikleriCiz();
});
