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
// tarihinden hangisi daha yeniyse. 1 günden fazla geçmişse tarih kırmızı
// ve kalın gösterilir; bu, yeni bir ziyaret/işlem girilene kadar böyle
// kalır (KESİN KURAL, 06.09.2026).
var musteriSonIslemHaritasi = null;
function sonIslemHaritasiniHazirla(){
  var harita = {};
  try{
    if(typeof ReportsData !== "undefined"){
      ReportsData.sonIslemler().forEach(function(k){
        if(!k.musteriId) return;
        if(!harita[k.musteriId] || k.ts > harita[k.musteriId]) harita[k.musteriId] = k.ts;
      });
    }
  }catch(e){}
  musteriSonIslemHaritasi = harita;
}
function sonAktiviteZamani(m){
  var sonIslem = (musteriSonIslemHaritasi && m.id) ? musteriSonIslemHaritasi[m.id] : null;
  var aday = [m.sonZiyaret||0, sonIslem||0];
  return Math.max.apply(null, aday);
}
function aktiviteNoktasiHTML(m){
  var zaman = sonAktiviteZamani(m);
  var gecikmisMi = (zaman === 0) || ((Date.now()-zaman) > 30*86400000);
  if(!gecikmisMi) return "";
  return "<span class='musteri-gecikme-noktasi' title='30+ gündür ziyaret/işlem yok'></span>";
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
        + "<div class='musteri-ust-satir'>" + aktiviteNoktasiHTML(m) + "<span class='musteri-cari-metin'>" + cariSatirHTML(m.id, m.ad, m.sehir) + "</span></div>"
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
  listeyiCiz();
});
