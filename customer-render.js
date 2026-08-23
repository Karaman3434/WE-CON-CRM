/*
  customer-render.js
  ==================
  Müşteri listesini ekrana basar, arama kutusunu dinler, seçim yapılınca
  send.html'e yönlendirir.
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

function listeyiCiz(){
  try{
    var q = document.getElementById("musteriAra").value;
    var kapsayici = document.getElementById("musteriListesi");
    var bos = document.getElementById("musteriBosMesaj");
    var yukleniyor = document.getElementById("musteriYukleniyor");

    if(CustomerData.uzunluk() === 0){
      kapsayici.innerHTML = "";
      bos.hidden = true;
      yukleniyor.hidden = false;
      return;
    }
    yukleniyor.hidden = true;

    var sonuclar = CustomerData.ara(q);
    if(q.trim().length === 0) sonuclar = sonuclar.slice(0, 40);

    if(sonuclar.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = sonuclar.map(function(m, i){
      return "<div class='musteri-karti' data-i='" + i + "'>"
        + "<div><div class='musteri-ad'>" + htmlEsc(m.ad) + "</div><div class='musteri-sehir'>" + htmlEsc(m.sehir||"-") + "</div></div>"
        + "<span class='musteri-git'>→</span>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".musteri-karti").forEach(function(kart, i){
      kart.onclick = function(){
        CustomerData.sec(sonuclar[i]);
        window.location.href = "send.html";
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
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  CustomerData.listeDegistiginde(listeyiCiz);
  listeyiCiz();
});
