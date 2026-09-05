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

var tumMusterilerModuAktif = false;

function listeyiCiz(){
  try{
    var q = document.getElementById("musteriAra").value;
    var kapsayici = document.getElementById("musteriListesi");
    var bos = document.getElementById("musteriBosMesaj");
    var yukleniyor = document.getElementById("musteriYukleniyor");
    var bilgiNotuEl = document.getElementById("listeBilgiNotu");
    var tumBtn = document.getElementById("btnTumMusteriler");

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

    if(aramaAktif){
      sonuclar = sonuclar.slice().sort(function(a,b){ return (b.sonGoruntuleme||0)-(a.sonGoruntuleme||0); });
      tumBtn.hidden = true;
    } else if(tumMusterilerModuAktif){
      sonuclar = sonuclar.slice().sort(function(a,b){ return (a.ad||"").localeCompare(b.ad||"", "tr-TR"); });
      bilgiNotuEl.hidden = false;
      bilgiNotuEl.className = "liste-bilgi-notu liste-bilgi-notu--yesil";
      bilgiNotuEl.textContent = "👥 Tüm müşteriler (toplam " + sonuclar.length + ") — alfabetik sırayla.";
      tumBtn.hidden = true;
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
      var ziyaretRozetHtml = "";
      if(m.sonZiyaret){
        var gun = Math.floor((Date.now()-m.sonZiyaret)/86400000);
        if(gun > 30) ziyaretRozetHtml = "<span class='musteri-ziyaret-rozet musteri-ziyaret-rozet--uyari'>⚠️ " + gun + " gün ziyaret yok</span>";
        else ziyaretRozetHtml = "<span class='musteri-ziyaret-rozet musteri-ziyaret-rozet--iyi'>✓ " + gun + " gün önce</span>";
      }
      return "<div class='musteri-karti " + zebraSinif + "' data-i='" + i + "'>"
        + "<div class='musteri-karti-satir'>"
        + "<div class='musteri-icerik'>"
        + "<div class='musteri-ust-satir'><span class='musteri-ad'>" + htmlEsc(m.ad) + "</span>" + ziyaretRozetHtml + "</div>"
        + "<div class='musteri-alt-satir'>"
        + "<span class='musteri-kod'>" + (m.id ? "🏷 " + htmlEsc(m.id) : "") + "</span>"
        + "<span class='musteri-sehir'>" + htmlEsc(m.sehir||"-") + "</span>"
        + "</div>"
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
  document.getElementById("btnTumMusteriler").onclick = function(){
    tumMusterilerModuAktif = true;
    listeyiCiz();
  };
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  CustomerData.listeDegistiginde(listeyiCiz);
  listeyiCiz();
});
