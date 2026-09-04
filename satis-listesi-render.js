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

function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

// Bu liste sadece SİPARİŞ gösterir (bkz. ReportsData.satislarListele) — kod
// öneki her zaman "SİP", bu yüzden renk sabit navy.
var KANAL_HARF = {mail:"M", whatsapp:"W"};
var KANAL_RENK = {mail:"#185fa5", whatsapp:"#128C7E"};
function kanalHarfHTML(kanal){
  if(!kanal || !KANAL_HARF[kanal]) return "";
  return "<span class='ik2-kanal-harf' style='color:" + KANAL_RENK[kanal] + ";'>" + KANAL_HARF[kanal] + "</span>";
}

function listeyiCiz(kapsam){
  try{
    var liste = ReportsData.satislarListele(kapsam);
    var kapsayici = document.getElementById("slListe");
    var bos = document.getElementById("slBos");
    if(!liste.length){ kapsayici.innerHTML = ""; bos.hidden = false; return; }
    bos.hidden = true;

    kapsayici.innerHTML = liste.map(function(k, i){
      var renkMetin = k.durum === "kacan" ? "#c0392b" : "#003a70";
      var durumEk = k.durum === "kacan" ? "❌ KAÇTI" : "";
      return "<div class='ik2-kart' data-i='" + i + "'>"
        + "<div class='ik2-ust'>"
        + "<span class='ik2-ust-sol'><span class='ik2-isim'>" + htmlEsc(k.musteri) + "</span>"
        + (k.sehir ? " <span class='ik2-sehir'>- " + htmlEsc(k.sehir) + "</span>" : "")
        + "</span>"
        + (k.revizeZamani ? "<span class='ik2-rvz'>RVZ</span>" : "")
        + "</div>"
        + "<div class='ik2-alt'>"
        + "<span class='ik2-tarih'>" + htmlEsc(k.tarih||"") + "</span>"
        + "<span class='ik2-kod' style='color:" + renkMetin + ";'>" + kanalHarfHTML(k.kanal) + htmlEsc(k.kod||"SİP") + "</span>"
        + "<span class='ik2-tutar'>" + fmt(k.toplam) + " €</span>"
        + "</div>"
        + (durumEk ? "<div class='ik2-durum-ek'>" + durumEk + "</div>" : "")
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".ik2-kart").forEach(function(el){
      el.onclick = function(){
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

  var params = new URLSearchParams(window.location.search);
  var kapsam = params.get("kapsam") === "ay" ? "ay" : "bugun";
  var baslikMetni = kapsam === "ay" ? "📅 Bu Ayın Satışları" : "📅 Bugünün Satışları";
  document.getElementById("slBaslik").textContent = baslikMetni;
  document.getElementById("rotaBaslik").textContent = kapsam === "ay" ? "Bu Ayın Satışları" : "Bugünün Satışları";

  ReportsData.arsivDegistiginde(function(){ listeyiCiz(kapsam); });
});
