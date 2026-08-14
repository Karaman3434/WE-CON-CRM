// ============ ZİYARET TAKVİMİ ============
var ziyaretTakvimYil, ziyaretTakvimAy; // ay: 0-11
(function(){ var d=new Date(); ziyaretTakvimYil=d.getFullYear(); ziyaretTakvimAy=d.getMonth(); })();
var AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function anaSayfadanZiyaretTakvimiAc(){
  switchTab(9);
  setTimeout(function(){
    var wrap = document.getElementById("ziyaretTakvimWrap");
    if(wrap && wrap.style.display==="none"){
      ziyaretTakvimiAcKapa();
    }
    var btn = document.getElementById("ziyaretTakvimToggleBtn");
    if(btn) btn.scrollIntoView({behavior:"smooth", block:"start"});
  }, 150);
}

function ziyaretTakvimiAcKapa(){
  var wrap = document.getElementById("ziyaretTakvimWrap");
  var btn = document.getElementById("ziyaretTakvimToggleBtn");
  var sonIslemlerWrap = document.getElementById("sonIslemlerWrap");
  if(!wrap || !btn) return;
  var acik = wrap.style.display !== "none";
  if(acik){
    wrap.style.display = "none";
    btn.innerHTML = "📆 Ziyaret Takvimini Göster ▾";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "block";
  } else {
    // Diğer panelleri (Aylık Özet, Ajanda) kapat
    var digerWrap = document.getElementById("aylikOzetWrap");
    var digerBtn = document.getElementById("aylikOzetToggleBtn");
    if(digerWrap) digerWrap.style.display = "none";
    if(digerBtn) digerBtn.innerHTML = "📅 Aylık Sipariş &amp; Prim Özetini Göster ▾";
    var ajWrap = document.getElementById("ajandaWrap");
    var ajBtn = document.getElementById("ajandaToggleBtn");
    if(ajWrap) ajWrap.style.display = "none";
    if(ajBtn) ajBtn.innerHTML = "📓 Günlük Ajanda Göster ▾";

    wrap.style.display = "block";
    btn.innerHTML = "📆 Ziyaret Takvimini Gizle ▴";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "none";
    ziyaretTakvimiOlustur();
  }
}
