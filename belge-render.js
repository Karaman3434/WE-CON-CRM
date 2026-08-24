/*
  belge-render.js
  ===============
  "weiconv2_goruntulenen_belge" localStorage anahtarından {tip, ts} okur,
  ReportsData.sonIslemler() içinden o kaydı bulur, eski uygulamanın
  faturaOnizlemeHtmlOlustur() düzenini BİREBİR üreten HTML'i çizer.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

var TIP_ETIKET_BELGE = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
var DURUM_ETIKET = {
  iptal: {ikon:"🚫", ad:"İPTAL EDİLDİ", renk:"#c0392b", bg:"#fdeceb"},
  iade: {ikon:"↩️", ad:"İADE EDİLDİ", renk:"#6a1b9a", bg:"#f3e5f5"},
  kacan: {ikon:"❌", ad:"KAÇAN SİPARİŞ", renk:"#c0392b", bg:"#fff4e5"}
};

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

function kosulKutusuHtml(ikon, etiket, deger){
  return "<div class='belge-kosul-alan'>"
    + "<div class='belge-kosul-ikon'>" + ikon + "</div>"
    + "<div><div class='belge-kosul-etiket'>" + etiket + "</div><div class='belge-kosul-deger'>" + htmlEsc(deger||"-") + "</div></div>"
    + "</div>";
}

function yetkiliSatiriHtml(isim, tel, eposta){
  if(!isim && !tel && !eposta) return "";
  var parcalar = [];
  if(tel) parcalar.push("📞 " + tel);
  if(eposta) parcalar.push("✉️ " + eposta);
  return "<div class='belge-yetkili-satir'>👤 <b>" + htmlEsc(isim||"-") + "</b>"
    + (parcalar.length ? " — <span class='belge-yetkili-detay'>" + htmlEsc(parcalar.join(" · ")) + "</span>" : "")
    + "</div>";
}

function belgeyiCiz(kayit, musteri){
  try{
    var urunler = kayit.urunler || [];
    var netEuro = 0, toplamPrim = 0;
    var satirlarHtml = urunler.map(function(item, i){
      var toplamEuro = item.toplamEuro!==undefined ? item.toplamEuro : ((item.iskBirim||0)*(item.adet||0));
      netEuro += toplamEuro;
      var mk = (item.iskBirim||0)-(item.dipFiyat||0);
      var satirPrim = mk*(item.adet||0)*0.22;
      if(satirPrim > 0) toplamPrim += satirPrim;
      return "<tr>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kb'>Berta:</span> " + htmlEsc(item.berta||"-") + " <span class='ka'>Abas:</span> " + htmlEsc(item.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(item.ad) + "</div></td>"
        + "<td>" + (item.adet||0) + "</td>"
        + "<td>" + fmt(item.listeFiyat||0) + " €</td>"
        + "<td>%" + (item.iskonto||0) + "</td>"
        + "<td>" + fmt(item.iskBirim!==undefined?item.iskBirim:(item.listeFiyat||0)) + " €</td>"
        + "<td class='belge-td-toplam'>" + fmt(toplamEuro) + " €</td>"
        + "<td class='belge-td-prim'>" + (satirPrim<0 ? "Yok" : fmt(satirPrim)+" €") + "</td>"
        + "</tr>";
    }).join("");

    var durum = kayit.durum;
    var sorunluMu = durum==="iptal" || durum==="iade" || durum==="kacan";
    var durumRozetHtml = (durum && DURUM_ETIKET[durum])
      ? "<div class='belge-durum-rozet' style='background:" + DURUM_ETIKET[durum].bg + ";color:" + DURUM_ETIKET[durum].renk + ";'>" + DURUM_ETIKET[durum].ikon + " BU KAYIT " + DURUM_ETIKET[durum].ad + (durum==="kacan" && kayit.kacanRakip ? " — → "+htmlEsc(kayit.kacanRakip) : "") + "</div>"
      : "";

    var vade = (musteri && musteri.vade) || "";
    var faturaTuru = (musteri && musteri.fatura) || "";
    var kargo = (musteri && musteri.kargo) || "";
    var faturaAdr = kayit.faturaAdresi ? (kayit.faturaAdresi.adres || "") : "";
    var teslimatAdr = kayit.teslimatAdresi ? (kayit.teslimatAdresi.adres || "") : "";
    var yetkililer = (musteri && musteri.iletisimler) || [];

    var ustBaslikHtml = "<div class='belge-ust-baslik'>"
      + "<div class='belge-logo-satir'><span class='belge-logo-mini'>WEICON</span><span class='belge-tur-baslik'>" + (TIP_ETIKET_BELGE[kayit.tip]||"SİPARİŞ") + " FORMU</span></div>"
      + "<table class='belge-tarih-tablo'>"
      + "<tr><td class='bt-etiket'>TARİH</td><td class='bt-deger'>" + htmlEsc(kayit.tarih) + "</td></tr>"
      + (kayit.revizeZamani ? "<tr class='belge-revize-satir'><td class='bt-etiket'>🔄 REVİZE</td><td class='bt-deger'>Fiyat güncellendi</td></tr>" : "")
      + "</table>"
      + "</div>";

    var musteriBlokHtml = "<div class='belge-musteri-baslik'>MÜŞTERİ BİLGİLERİ</div>"
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad'>" + htmlEsc(kayit.musteri) + "</div>"
      + (faturaAdr ? "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + htmlEsc(faturaAdr) + "</div>" : "")
      + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + kosulKutusuHtml("📅","VADE",vade) + kosulKutusuHtml("📄","FATURA",faturaTuru) + kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
      + yetkililer.map(function(k){ return yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("")
      + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + "</div>" : "")
      + "</div>";

    var belgeBaslikMetni = (TIP_ETIKET_BELGE[kayit.tip]||"SİPARİŞ") + (kayit.kod ? " · " + kayit.kod : " DETAYLARI");

    var html = "<div class='belge-kutu" + (sorunluMu?" belge-kutu--sorunlu":"") + "'>"
      + durumRozetHtml
      + ustBaslikHtml
      + musteriBlokHtml
      + "<div class='belge-belge-baslik-serit'>" + htmlEsc(belgeBaslikMetni) + "</div>"
      + "<div class='data-table-container'><table class='belge-urun-tablo'>"
      + "<thead><tr><th style='width:6%;'>SIRA</th><th style='width:25%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th><th>PRİM</th></tr></thead>"
      + "<tbody>" + satirlarHtml + "</tbody>"
      + "</table></div>"
      + "<div class='belge-genel-toplam-serit'>"
      + "<span class='belge-gt-etiket'>GENEL TOPLAM</span><span class='belge-gt-ayrac'></span><span class='belge-gt-deger'>" + fmt(netEuro) + " €</span>"
      + "</div>"
      + "<div class='belge-prim-serit'>"
      + "<span class='belge-prim-etiket'>MÜDÜR PRİMİ (TOPLAM)</span><span class='belge-prim-deger'>" + (toplamPrim<0?"Prim yok":fmt(toplamPrim)+" €") + "</span>"
      + "</div>"
      + "</div>";

    document.getElementById("belgeIcerik").innerHTML = html;
  }catch(e){ hataGoster("Belge çizilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnYazdir").onclick = function(){ window.print(); };

  var ref = null;
  try{ ref = JSON.parse(localStorage.getItem("weiconv2_goruntulenen_belge")||"null"); }catch(e){}
  if(!ref){
    hataGoster("Görüntülenecek belge bulunamadı.");
    return;
  }

  function denemeCiz(){
    var liste = ReportsData.sonIslemler();
    var kayit = liste.find(function(k){ return k.tip===ref.tip && k.ts===ref.ts; });
    if(!kayit) return false;
    var musteri = CustomerData.musteriBul(kayit.musteri);
    belgeyiCiz(kayit, musteri);
    return true;
  }

  ReportsData.arsivDegistiginde(denemeCiz);
  CustomerData.listeDegistiginde(denemeCiz);
  denemeCiz();
});
