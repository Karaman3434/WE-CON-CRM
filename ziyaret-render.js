/*
  ziyaret-render.js
  =================
  reports-render.js'in Ziyaret bölümünden çıkarıldı — artık kendi ayrı
  sayfası var (eski uygulamadaki "ZİYARET TAKVİMİ" kutucuğuyla aynı rota).
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

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  CustomerData.listeDegistiginde(ziyaretleriCiz);
  ziyaretleriCiz();
});
