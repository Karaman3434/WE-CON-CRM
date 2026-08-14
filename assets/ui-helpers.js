// Extracted from original index.html UI helper block 1
function updateHTML(el,html){
  if(!el) return;
  if(el.__lastHTML===html) return;
  el.__lastHTML=html;
  el.innerHTML=html;
}

// Extracted from original index.html UI helper block 2
// Tüm popup overlay'leri artık tam ekranı değil, üst panelin (WEICON logosu +
// tarih + Geri/Ana Sayfa/Menü satırı) ALTINI kaplıyor — böylece bir popup
// açıkken bile üst panel her zaman görünür ve tıklanabilir kalıyor. Üst
// panelin gerçek yüksekliği cihaza/yazı boyutuna göre değişebileceği için
// sabit bir piksel yazmak yerine, panel her yüklendiğinde/boyut değiştiğinde
// gerçek yüksekliği ölçülüp --ust-panel-h CSS değişkenine yazılıyor.
(function(){
  function ustPanelYuksekligiOlc(){
    var panel = document.getElementById("ustNavGrid");
    if(!panel) return;
    var yukseklik = Math.ceil(panel.getBoundingClientRect().bottom);
    if(yukseklik > 0){
      document.documentElement.style.setProperty("--ust-panel-h", yukseklik+"px");
    }
  }
  ustPanelYuksekligiOlc();
  window.addEventListener("load", ustPanelYuksekligiOlc);
  window.addEventListener("resize", ustPanelYuksekligiOlc);
  window.addEventListener("orientationchange", function(){ setTimeout(ustPanelYuksekligiOlc, 200); });
})();
