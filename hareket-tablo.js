/*
  hareket-tablo.js
  =================
  Programdaki TÜM ürün listesi tabloları (Sepet'in Hesaplanacak/Hesaplandı
  grupları, Gönder ekranının hareket tablosu, Formu Görüntüle önizlemesi)
  aynı belge-tablosu tasarımını (belge-style.css -> .belge-urun-tablo)
  kullanır. Bu dosya o tabloyu üretmek için tek, paylaşılan fonksiyonu
  sağlar — böylece tasarım her yerde birebir aynı kalır.
*/

var HareketTablo = (function(){

  function htmlEsc(s){
    return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function fmt(n){
    return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  // urunler: [{ad, berta, abas, listeFiyat, dipFiyat, iskonto, adet}]
  // hesapla(u): CartData.hesapla ile aynı imzada fonksiyon — {iskontoluFiyat, toplamEuro, mudurPrim}
  // zeminSinifi: "hareket-satir--sari" | "hareket-satir--yesil" | ""
  function satirlarHtml(urunler, hesapla, zeminSinifi){
    return (urunler||[]).map(function(u, i){
      var h = hesapla(u);
      var toplamVarMi = h && h.toplamEuro != null;
      return "<tr class='" + (zeminSinifi||"") + "'>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kb'>Berta:</span> " + htmlEsc(u.berta||"-") + " <span class='ka'>Abas:</span> " + htmlEsc(u.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>"
        + "<td>" + (u.adet!=null ? u.adet : "-") + "</td>"
        + "<td>" + (u.listeFiyat!=null ? fmt(u.listeFiyat)+" €" : "-") + "</td>"
        + "<td>" + (u.iskonto!=null ? "%"+u.iskonto : "-") + "</td>"
        + "<td>" + (toplamVarMi ? fmt(h.iskontoluFiyat)+" €" : "-") + "</td>"
        + "<td class='belge-td-toplam'>" + (toplamVarMi ? fmt(h.toplamEuro)+" €" : "-") + "</td>"
        + "<td class='belge-td-prim'>" + (toplamVarMi ? (h.mudurPrim<0?"Yok":fmt(h.mudurPrim)+" €") : "-") + "</td>"
        + "</tr>";
    }).join("");
  }

  // Tek bir grup (örn. sadece HESAPLANDI) için etiket + tablo + (istenirse) genel toplam.
  function grupHtml(opts){
    var etiketRenk = opts.zeminSinifi === "hareket-satir--sari" ? "#8a6d1a" : "#0e6b34";
    var etiketBg = opts.zeminSinifi === "hareket-satir--sari" ? "#fff9e6" : "#eafaf0";
    var html = "<div class='hareket-grup-etiket' style='background:" + etiketBg + ";color:" + etiketRenk + ";'>" + opts.etiket + "</div>";
    html += "<div class='data-table-container'><table class='belge-urun-tablo'>"
      + "<thead><tr><th style='width:6%;'>SIRA</th><th style='width:25%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th><th>PRİM</th></tr></thead>"
      + "<tbody>" + satirlarHtml(opts.urunler, opts.hesapla, opts.zeminSinifi) + "</tbody></table></div>";
    if(opts.genelToplam != null){
      html += "<div class='belge-genel-toplam-serit'>"
        + "<span class='belge-gt-etiket'>GENEL TOPLAM</span><span class='belge-gt-ayrac'></span><span class='belge-gt-deger'>" + fmt(opts.genelToplam) + " €</span>"
        + "</div>";
    }
    return html;
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

  return {
    satirlarHtml: satirlarHtml,
    grupHtml: grupHtml,
    kosulKutusuHtml: kosulKutusuHtml,
    yetkiliSatiriHtml: yetkiliSatiriHtml,
    fmt: fmt,
    htmlEsc: htmlEsc
  };

})();
