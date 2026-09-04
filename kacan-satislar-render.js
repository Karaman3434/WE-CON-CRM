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
  }catch(e){}
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

var siralamaYonu = "yeni"; // yeni | eski

// Tür rengi — Son İşlemler / belge kartı ile aynı palet (bkz.
// reports-render.js KOD_RENK, belge-render.js TIP_RENK_BELGE).
var TIP_ETIKET_KS = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
var TIP_RENK_KS = {siparis:"#003a70", teklif:"#28a745", proforma:"#8e44ad", numune:"#b7601f"};

function listeyiCiz(){
  try{
    var liste = ReportsData.tumKacanlar(siralamaYonu);
    var kapsayici = document.getElementById("ksListe");
    var bos = document.getElementById("ksBos");
    if(!liste.length){ kapsayici.innerHTML = ""; bos.hidden = false; return; }
    bos.hidden = true;

    kapsayici.innerHTML = liste.map(function(k, i){
      var renk = TIP_RENK_KS[k.tip] || "#3569b8";
      return "<tr>"
        + "<td>" + (i+1) + "</td>"
        + "<td><button class='sl-musteri-btn' data-i='" + i + "'>" + htmlEsc(k.musteri) + "</button><span class='sl-sehir'>" + htmlEsc(k.sehir||"-") + "</span></td>"
        + "<td><span class='islem-kod-rozet' style='background:" + renk + ";'>" + htmlEsc(TIP_ETIKET_KS[k.tip]||k.tip) + "</span></td>"
        + "<td class='sl-tarih-hucre'>" + htmlEsc(k.tarih||"-") + "</td>"
        + "</tr>";
    }).join("");

    kapsayici.querySelectorAll(".sl-musteri-btn").forEach(function(btn){
      btn.onclick = function(){
        var k = liste[parseInt(this.getAttribute("data-i"), 10)];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });
  }catch(e){ hataGoster("Liste çizilemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("btnSiralama").onclick = function(){
    siralamaYonu = siralamaYonu === "yeni" ? "eski" : "yeni";
    this.textContent = siralamaYonu === "yeni" ? "Yeni → Eski ⇅" : "Eski → Yeni ⇅";
    listeyiCiz();
  };

  ReportsData.arsivDegistiginde(listeyiCiz);
});
