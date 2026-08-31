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
  // basit: true ise WhatsApp'a özel sade satır (SIRA/ÜRÜN/ADET/NET/TOPLAM) üretir —
  // müşteriye internal bilgi olan LİSTE/İSK/PRİM sütunları hiç gönderilmez.
  function satirlarHtml(urunler, hesapla, zeminSinifi, basit){
    return (urunler||[]).map(function(u, i){
      var h = hesapla(u);
      var toplamVarMi = h && h.toplamEuro != null;
      var urunHucre = "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(u.berta||"-") + " - <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(u.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>";
      if(basit){
        return "<tr class='" + (zeminSinifi||"") + "'>"
          + urunHucre
          + "<td>" + (u.adet!=null ? u.adet : "-") + "</td>"
          + "<td>" + (toplamVarMi ? "<span class='rozet-net'>"+fmt(h.iskontoluFiyat)+" €</span>" : "-") + "</td>"
          + "<td class='belge-td-toplam'>" + (toplamVarMi ? fmt(h.toplamEuro)+" €" : "-") + "</td>"
          + "</tr>";
      }
      var primHucre;
      if(!toplamVarMi){ primHucre = "-"; }
      else if(u.iskonto>60){ primHucre = "Ö.F"; }
      else { primHucre = "<div>" + Math.round(h.mudurPrimTL).toLocaleString("tr-TR") + "</div><div class='belge-td-prim-birim'>TL</div>"; }
      return "<tr class='" + (zeminSinifi||"") + "'>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + urunHucre
        + "<td>" + (u.adet!=null ? u.adet : "-") + "</td>"
        + "<td>" + (u.listeFiyat!=null ? fmt(u.listeFiyat)+" €" : "-") + "</td>"
        + "<td>" + (u.iskonto!=null ? "<span class='rozet-isk'>%"+u.iskonto+"</span>" : "-") + "</td>"
        + "<td>" + (toplamVarMi ? "<span class='rozet-net'>"+fmt(h.iskontoluFiyat)+" €</span>" : "-") + "</td>"
        + "<td class='belge-td-toplam'>" + (toplamVarMi ? fmt(h.toplamEuro)+" €" : "-") + "</td>"
        + "<td class='belge-td-prim'>" + primHucre + "</td>"
        + "</tr>";
    }).join("");
  }

  // Tek bir grup (örn. sadece HESAPLANDI) için etiket + tablo + (istenirse) genel toplam.
  // opts.kanal === "whatsapp" ise sade tablo (SIRA/ÜRÜN BİLGİSİ/ADET/NET/TOPLAM) üretir.
  function grupHtml(opts){
    var basit = opts.kanal === "whatsapp";
    var etiketRenk = opts.zeminSinifi === "hareket-satir--sari" ? "#8a6d1a" : "#0e6b34";
    var etiketBg = opts.zeminSinifi === "hareket-satir--sari" ? "#fff9e6" : "#eafaf0";
    var etiketRozetHtml = opts.etiketRozet ? "<span class='hareket-grup-etiket-rozet'>" + opts.etiketRozet + "</span>" : "";
    var html = "<div class='hareket-grup-etiket' style='background:" + etiketBg + ";color:" + etiketRenk + ";'><span>" + opts.etiket + "</span>" + etiketRozetHtml + "</div>";
    var basHucreler = basit
      ? "<th style='width:50%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>NET</th><th>TOPLAM</th>"
      : "<th style='width:4%;'>SR</th><th style='width:38%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th><th>PRİM</th>";
    html += "<div class='data-table-container'><table class='belge-urun-tablo'>"
      + "<thead><tr>" + basHucreler + "</tr></thead>"
      + "<tbody>" + satirlarHtml(opts.urunler, opts.hesapla, opts.zeminSinifi, basit) + "</tbody></table></div>";
    if(opts.genelToplam != null){
      html += "<div class='belge-genel-toplam-serit'>"
        + (opts.kur ? "<span class='belge-gt-kur'>Hesaplanan Kur<br>" + fmt(opts.kur) + " Euro</span>" : "")
        + "<span class='belge-gt-etiket'>GENEL TOPLAM</span>"
        + "<span class='belge-gt-deger'>" + fmt(opts.genelToplam) + " €</span>"
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
