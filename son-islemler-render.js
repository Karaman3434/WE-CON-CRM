/*
  son-islemler-render.js
  =======================
  reports-render.js'deki islemleriCiz/islemlerExcelAktar buradan taşındı.
  Liste tasarımı farklı: ikon-avatar (harf rozeti solda, tek satır bilgi).
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
function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

var TIP_ETIKET = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
// reports-render.js'deki KOD_RENK ile birebir aynı — iki dosyada da aynı
// tutulmalı. KOD_RENK_METIN, beyaz zeminde düz yazı olarak okunabilirlik
// için KOD_RENK'ten daha koyu tonlar kullanır.
var TIP_KOD_YEDEK = {numune:"NUM", teklif:"F.TEK", proforma:"P.FAT", siparis:"SİP"};
var KOD_RENK_METIN = {"SİP":"#003a70", "F.TEK":"#1a7431", "P.FAT":"#5c1680", "NUM":"#7a4008"};
var KANAL_HARF = {mail:"M", whatsapp:"W"};
var KANAL_RENK = {mail:"#185fa5", whatsapp:"#128C7E"};
function kodOnekiAyikla(kod){
  if(!kod) return null;
  var parcalar = kod.split(".");
  if(parcalar.length < 3) return kod;
  return parcalar.slice(0, parcalar.length-2).join(".");
}
function kodMetinRengiGetir(k){
  if(k.durum === "kacan") return "#c0392b";
  var onek = kodOnekiAyikla(k.kod) || TIP_KOD_YEDEK[k.tip] || "?";
  return KOD_RENK_METIN[onek] || "#1c2530";
}
function kanalHarfHTML(kanal){
  if(!kanal || !KANAL_HARF[kanal]) return "";
  return "<span class='ik2-kanal-harf' style='color:" + KANAL_RENK[kanal] + ";'>" + KANAL_HARF[kanal] + "</span>";
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
      var kacanMi = k.durum === "kacan";
      var kod = k.kod || TIP_KOD_YEDEK[k.tip] || "?";
      var renkMetin = kodMetinRengiGetir(k);
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      var durumEk = kacanMi ? "❌ KAÇTI" : "";
      return "<div class='ik2-kart' data-i='" + i + "'>"
        + "<div class='ik2-ust'>"
        + "<span class='ik2-ust-sol'><span class='ik2-isim'>" + htmlEsc(k.musteri) + "</span>"
        + (k.sehir ? " <span class='ik2-sehir'>- " + htmlEsc(k.sehir) + "</span>" : "")
        + "</span>"
        + (k.revizeZamani ? "<span class='ik2-rvz'>RVZ</span>" : "")
        + "</div>"
        + "<div class='ik2-alt'>"
        + "<span class='ik2-tarih'>" + htmlEsc(k.tarih) + "</span>"
        + "<span class='ik2-kod' style='color:" + renkMetin + ";'>" + kanalHarfHTML(k.kanal) + htmlEsc(kod) + "</span>"
        + "<span class='ik2-tutar'>" + fmt(toplam) + " €</span>"
        + "</div>"
        + (durumEk ? "<div class='ik2-durum-ek'>" + durumEk + "</div>" : "")
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".ik2-kart").forEach(function(el){
      el.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        var k = liste[i];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
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

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("islemAra").addEventListener("input", islemleriCiz);
  document.getElementById("islemTipFiltre").addEventListener("change", islemleriCiz);
  document.getElementById("btnIslemlerExcel").onclick = islemlerExcelAktar;
  ReportsData.arsivDegistiginde(islemleriCiz);
  islemleriCiz();
});
