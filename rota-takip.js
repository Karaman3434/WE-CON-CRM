/*
  rota-takip.js
  =============
  Tıklanabilir "rota şeridi" — Abdullah'ın isteğiyle (15.09.2026) eski statik
  gri ".rota-etiketi" yazısının yerine geçiyor. Ziyaret edilen sayfalar
  sessionStorage'da bir yığın olarak tutulur; her durak kendi sayfasına
  giden bir bağlantı olur, en sondaki (şu an bulunulan sayfa) tıklanamaz.

  Kullanım (her sayfanın kendi <script> bloğunda, DOMContentLoaded içinde):
    RotaTakip.kaydet("cart.html", "Sepet");
    RotaTakip.ciz("rotaSeridi");

  Ana Sayfa'ya dönüldüğünde (sifirlaMi=true) yığın temizlenir — "Ana
  Sayfa'ya gitmek zaten benim rotamı sıfırlamak istediğim an" (Abdullah).
  Aynı sayfaya tekrar gelinirse (örn. geri gidip farklı bir yoldan aynı
  sayfaya varılırsa) yığın o noktada kesilir, sonsuza kadar büyümez.
*/
var RotaTakip = (function(){
  var ANAHTAR = "weiconv2_rota_yigin";

  function yiginiOku(){
    try{ return JSON.parse(sessionStorage.getItem(ANAHTAR)||"[]"); }catch(e){ return []; }
  }
  function yiginiYaz(yigin){
    try{ sessionStorage.setItem(ANAHTAR, JSON.stringify(yigin)); }catch(e){}
  }

  function kaydet(href, etiket, sifirlaMi){
    var yigin = sifirlaMi ? [] : yiginiOku();
    var mevcutIdx = -1;
    for(var i=0;i<yigin.length;i++){ if(yigin[i].href === href){ mevcutIdx = i; break; } }
    if(mevcutIdx !== -1){
      yigin = yigin.slice(0, mevcutIdx+1);
    } else {
      yigin.push({href: href, etiket: etiket});
    }
    yiginiYaz(yigin);
    return yigin;
  }

  function sifirla(){ yiginiYaz([]); }

  function ciz(konteynerId){
    var yigin = yiginiOku();
    var el = document.getElementById(konteynerId);
    if(!el || yigin.length === 0) return;
    var parcalar = yigin.map(function(durak, i){
      var sonMu = (i === yigin.length-1);
      var stil = sonMu
        ? "background:#eaf2fc;border:1.5px solid #3569b8;color:#003a70;font-weight:800;"
        : "background:#f4f6f9;border:1.5px solid #cbd5e1;color:#2d3540;font-weight:600;";
      var kapsul = "<span style='flex-shrink:0;border-radius:20px;padding:6px 12px;font-size:11.5px;white-space:nowrap;" + stil + "'>" + durak.etiket + "</span>";
      return sonMu ? kapsul : ("<a href='" + durak.href + "' style='text-decoration:none;display:inline-flex;flex-shrink:0;'>" + kapsul + "</a>");
    });
    var ayrac = "<span style='flex-shrink:0;align-self:center;color:#8b95a1;padding:0 1px;font-size:11px;'>›</span>";
    el.innerHTML = parcalar.join(ayrac);
  }

  return { kaydet: kaydet, ciz: ciz, sifirla: sifirla };
})();
