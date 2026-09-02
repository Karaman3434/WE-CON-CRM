/*
  ust-sabit-olcum.js
  ====================
  TEK görevi: sabit (sticky) üst şeridin (.app-ust-sabit — logo/tarih +
  Geri/Ana Sayfa/Menü) o an ekranda kapladığı GERÇEK yüksekliği ölçüp bir CSS
  değişkenine (--ust-sabit-yukseklik) yazmak. Popup'lar (.overlay, vb.) bu
  değişkeni kullanarak üst şeridin TAM ALTINDAN açılır — sabit bir piksel
  tahmini değil, o anki gerçek render'dan alınan değer.

  Bilerek İZOLE ve KIRILGAN OLMAYAN bir dosya: her şey try/catch içinde,
  hata olursa CSS zaten güvenli bir varsayılana (100px) düşer — bu dosya asla
  sayfanın geri kalanını bozamaz.
*/
(function(){
  function olc(){
    try{
      var el = document.querySelector(".app-ust-sabit");
      if(!el) return;
      var h = el.getBoundingClientRect().height;
      if(h > 0) document.documentElement.style.setProperty("--ust-sabit-yukseklik", h + "px");
    }catch(e){}
  }
  try{
    document.addEventListener("DOMContentLoaded", olc);
    window.addEventListener("resize", olc);
    window.addEventListener("load", olc);
    window.addEventListener("weiconAuthHazir", olc);
  }catch(e){}
})();
