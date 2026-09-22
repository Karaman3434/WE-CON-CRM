/*
  musteri-serit.js — WG.220926.2300.603
  ========================================
  TEK KURAL (22.09.2026): Müşteri adının göründüğü hiçbir sayfa kendi
  HTML'ini elle yazmaz — hepsi MusteriSeridi.html(musteri) çağırır. Yeni
  bir sayfaya müşteri adı eklenecekse de buradan çağrılır, YENİ bir stil
  icat edilmez.
*/
var MusteriSeridi = (function(){

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  // musteri: {id, ad, sehir} — id ve sehir opsiyonel.
  function html(musteri){
    if(!musteri) return "";
    var kod = musteri.id ? "<b class='ms-kod'>" + esc(musteri.id) + "</b> " : "";
    var sehir = musteri.sehir ? "<span class='ms-sehir'>" + esc(musteri.sehir) + "</span>" : "";
    return "<div class='musteri-serit'>"
      + "<span class='ms-ad'>" + kod + esc(musteri.ad) + "</span>"
      + sehir
      + "</div>";
  }

  // Belirtilen id'li konteynerin içine şeridi basar.
  function uygula(konteynerId, musteri){
    var el = document.getElementById(konteynerId);
    if(!el) return;
    el.innerHTML = html(musteri);
  }

  return { html: html, uygula: uygula };

})();
