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
  }catch(e){ hataGoster("İstatistikler çizilemedi: " + e.message); }
}

function islemleriCiz(){
  try{
    var liste = ReportsData.sonIslemler(50);
    var kapsayici = document.getElementById("islemlerListesi");
    var bos = document.getElementById("islemlerBosMesaj");

    if(liste.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = liste.map(function(k){
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      return "<div class='islem-karti'>"
        + "<div class='islem-ust-satir'>"
        + "<span class='islem-musteri'>" + htmlEsc(k.musteri) + "</span>"
        + "<span class='islem-tip islem-tip--" + k.tip + "'>" + TIP_ETIKET[k.tip] + "</span>"
        + "</div>"
        + "<div class='islem-detay'>" + htmlEsc(k.tarih) + " · " + (k.urunler||[]).length + " ürün · " + htmlEsc(k.sehir||"") + "</div>"
        + "<div class='islem-toplam'>" + toplam.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}) + " EUR</div>"
        + "</div>";
    }).join("");
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

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  sekmeGecisBagla();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnGorevEkle").onclick = gorevEkleTiklandi;

  var bugun = new Date();
  document.getElementById("gorevTarih").value = bugun.toISOString().slice(0,10);

  ReportsData.arsivDegistiginde(islemleriCiz);
  ReportsData.gorevDegistiginde(gorevleriCiz);
});
