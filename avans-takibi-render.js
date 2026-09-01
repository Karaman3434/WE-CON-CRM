/*
  avans-takibi-render.js
  ========================
  Özel Avans / İş Avansı / İş Avansı Harcamaları listelerini yönetir. Her
  ekleme/silme ANINDA AvansKayitData.taslakGuncelle() ile Firebase'e yazılır.
  "Kapat ve Kayıt Et" taslağı resmi kayda çevirir, listeleri sıfırlar.
*/

var AY_ADLARI_AV = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

var avOzelListe = [];
var avIsListe = [];
var avHarcamaListe = [];

function fmtTL_AV(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
}
function htmlEsc_AV(s){
  return (s==null?"":String(s)).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function fmtTarihKisa_AV(iso){
  if(!iso) return "-";
  var p = iso.split("-");
  if(p.length!==3) return iso;
  return p[2] + "." + p[1] + "." + p[0].slice(2);
}

function tarihiGuncelle_AV(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI_AV[d.getMonth()+1] + " " + d.getFullYear();
  }catch(e){}
}

function avToplamHesapla(liste){
  return liste.reduce(function(s,x){ return s + (x.tutar||0); }, 0);
}

// Verilen {ozelAvansGirisleri, isAvansiGirisleri, isAvansiHarcamalar} verisinden
// tüm toplamları hesaplar — hem taslak hem kapalı kayıt görüntülemede kullanılır.
function avToplamlariHesapla(veri){
  var ozelToplam = avToplamHesapla(veri.ozelAvansGirisleri||[]);
  var isToplam = avToplamHesapla(veri.isAvansiGirisleri||[]);
  var belgelenenToplam = avToplamHesapla(veri.isAvansiHarcamalar||[]);
  var isKesilecek = Math.max(0, isToplam - belgelenenToplam);
  var toplamKesinti = ozelToplam + isKesilecek;
  return {ozelToplam:ozelToplam, isToplam:isToplam, belgelenenToplam:belgelenenToplam, isKesilecek:isKesilecek, toplamKesinti:toplamKesinti};
}

function avTabloCiz(govdeId, bosId, liste, kolonEtiket){
  var govde = document.getElementById(govdeId);
  govde.innerHTML = liste.map(function(h, idx){
    return "<tr><td>" + fmtTarihKisa_AV(h.tarih) + "</td>"
      + "<td>" + (kolonEtiket==="etiket" ? "<span class='mh-harcama-etiket-rozet'>"+htmlEsc_AV(h.cesit||h.aciklama)+"</span>" : htmlEsc_AV(h.aciklama||h.cesit)) + "</td>"
      + "<td>" + fmtTL_AV(h.tutar) + "</td>"
      + "<td><button type='button' class='mh-harcama-sil-btn' data-idx='" + idx + "'>🗑</button></td></tr>";
  }).join("");
  document.getElementById(bosId).hidden = liste.length > 0;
  return govde;
}

function avTaslagiKaydet(){
  AvansKayitData.taslakGuncelle({
    ozelAvansGirisleri: avOzelListe,
    isAvansiGirisleri: avIsListe,
    isAvansiHarcamalar: avHarcamaListe
  }, function(basarili, err){
    if(!basarili) console.error("Taslak kaydedilemedi:", err);
  });
}

function avCiz(){
  var acik = AvansKayitData.acikDonem();
  document.getElementById("avDonemSerit").textContent = "Açık Dönem: " + AY_ADLARI_AV[acik.ay] + " " + acik.yil;
  document.getElementById("btnAviKapatKayitEt").textContent = "✓ " + AY_ADLARI_AV[acik.ay] + "'ı Kapat ve Kayıt Et";

  var govdeOzel = avTabloCiz("avOzelTabloGovde", "avOzelBos", avOzelListe, "aciklama");
  govdeOzel.querySelectorAll(".mh-harcama-sil-btn").forEach(function(btn){
    btn.onclick = function(){ avOzelListe.splice(parseInt(this.getAttribute("data-idx"),10),1); avTaslagiKaydet(); avCiz(); };
  });
  var govdeIs = avTabloCiz("avIsTabloGovde", "avIsBos", avIsListe, "aciklama");
  govdeIs.querySelectorAll(".mh-harcama-sil-btn").forEach(function(btn){
    btn.onclick = function(){ avIsListe.splice(parseInt(this.getAttribute("data-idx"),10),1); avTaslagiKaydet(); avCiz(); };
  });
  var govdeHarcama = avTabloCiz("avHarcamaTabloGovde", "avHarcamaBos", avHarcamaListe, "etiket");
  govdeHarcama.querySelectorAll(".mh-harcama-sil-btn").forEach(function(btn){
    btn.onclick = function(){ avHarcamaListe.splice(parseInt(this.getAttribute("data-idx"),10),1); avTaslagiKaydet(); avCiz(); };
  });

  var t = avToplamlariHesapla({ozelAvansGirisleri:avOzelListe, isAvansiGirisleri:avIsListe, isAvansiHarcamalar:avHarcamaListe});
  document.getElementById("avOzelToplam").textContent = fmtTL_AV(t.ozelToplam);
  document.getElementById("avIsToplam").textContent = fmtTL_AV(t.isToplam);
  document.getElementById("avBelgelenenToplam").textContent = fmtTL_AV(t.belgelenenToplam);
  document.getElementById("avIsKesilecek").textContent = fmtTL_AV(t.isKesilecek);
  document.getElementById("avToplamOzel").textContent = fmtTL_AV(t.ozelToplam);
  document.getElementById("avToplamIs").textContent = fmtTL_AV(t.isKesilecek);
  document.getElementById("avToplamGenel").textContent = fmtTL_AV(t.toplamKesinti);
}

function avGecmisSeciciDoldur(){
  var kayitlar = AvansKayitData.tumKayitlar();
  var sel = document.getElementById("avGecmisAySecici");
  document.getElementById("avGecmisBos").hidden = kayitlar.length > 0;
  sel.innerHTML = "<option value=''>Ay seç…</option>" + kayitlar.map(function(k){
    return "<option value='" + k.anahtar + "'>" + AY_ADLARI_AV[k.ay] + " " + k.yil + "</option>";
  }).join("");
}

function avGecmisDetayGoster(anahtar){
  var detay = document.getElementById("avGecmisDetay");
  if(!anahtar){ detay.innerHTML = ""; return; }
  var kayitlar = AvansKayitData.tumKayitlar();
  var k = kayitlar.filter(function(x){ return x.anahtar===anahtar; })[0];
  if(!k){ detay.innerHTML = ""; return; }
  var t = avToplamlariHesapla(k);
  detay.innerHTML = "<div class='mh-sonuc-satir'><span>Özel Avans</span><b>" + fmtTL_AV(t.ozelToplam) + "</b></div>"
    + "<div class='mh-sonuc-satir'><span>İş Avansı Alınan</span><b>" + fmtTL_AV(t.isToplam) + "</b></div>"
    + "<div class='mh-sonuc-satir'><span>Belgelenen</span><b>" + fmtTL_AV(t.belgelenenToplam) + "</b></div>"
    + "<div class='mh-sonuc-satir'><span>İş Avansı Belgesiz Kalan</span><b>" + fmtTL_AV(t.isKesilecek) + "</b></div>"
    + "<div class='mh-sonuc-satir mh-sonuc-satir--toplam'><span>TOPLAM KESİNTİ</span><b>" + fmtTL_AV(t.toplamKesinti) + "</b></div>";
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_AV();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  var taslak = AvansKayitData.taslakOku();
  avOzelListe = taslak.ozelAvansGirisleri || [];
  avIsListe = taslak.isAvansiGirisleri || [];
  avHarcamaListe = taslak.isAvansiHarcamalar || [];
  avCiz();
  avGecmisSeciciDoldur();

  document.getElementById("btnOzelEkle").onclick = function(){
    var tarih = document.getElementById("avOzelTarih").value;
    var aciklama = document.getElementById("avOzelAciklama").value.trim();
    var tutar = parseFloat((document.getElementById("avOzelTutar").value||"0").replace(",",".")) || 0;
    if(!tarih || !aciklama || tutar<=0){ alert("Tarih, açıklama ve tutar (0'dan büyük) gerekli."); return; }
    avOzelListe.push({tarih:tarih, aciklama:aciklama, tutar:tutar});
    document.getElementById("avOzelTarih").value = "";
    document.getElementById("avOzelAciklama").value = "";
    document.getElementById("avOzelTutar").value = "";
    avTaslagiKaydet(); avCiz();
  };

  document.getElementById("btnIsEkle").onclick = function(){
    var tarih = document.getElementById("avIsTarih").value;
    var aciklama = document.getElementById("avIsAciklama").value.trim();
    var tutar = parseFloat((document.getElementById("avIsTutar").value||"0").replace(",",".")) || 0;
    if(!tarih || !aciklama || tutar<=0){ alert("Tarih, açıklama ve tutar (0'dan büyük) gerekli."); return; }
    avIsListe.push({tarih:tarih, aciklama:aciklama, tutar:tutar});
    document.getElementById("avIsTarih").value = "";
    document.getElementById("avIsAciklama").value = "";
    document.getElementById("avIsTutar").value = "";
    avTaslagiKaydet(); avCiz();
  };

  document.getElementById("btnHarcamaEkle").onclick = function(){
    var tarih = document.getElementById("avHarcamaTarih").value;
    var cesit = document.getElementById("avHarcamaCesit").value.trim();
    var tutar = parseFloat((document.getElementById("avHarcamaTutar").value||"0").replace(",",".")) || 0;
    if(!tarih || !cesit || tutar<=0){ alert("Tarih, çeşit ve tutar (0'dan büyük) gerekli."); return; }
    avHarcamaListe.push({tarih:tarih, cesit:cesit, tutar:tutar});
    document.getElementById("avHarcamaTarih").value = "";
    document.getElementById("avHarcamaCesit").value = "";
    document.getElementById("avHarcamaTutar").value = "";
    avTaslagiKaydet(); avCiz();
  };

  document.getElementById("btnAviKapatKayitEt").onclick = function(){
    var acik = AvansKayitData.acikDonem();
    var t = avToplamlariHesapla({ozelAvansGirisleri:avOzelListe, isAvansiGirisleri:avIsListe, isAvansiHarcamalar:avHarcamaListe});
    if(!confirm(AY_ADLARI_AV[acik.ay] + " " + acik.yil + " avans dönemini kapatıp kayıt etmek istediğine emin misin?\n\nToplam Kesinti: " + fmtTL_AV(t.toplamKesinti))) return;
    var kayitObj = {
      ay: acik.ay, yil: acik.yil,
      ozelAvansGirisleri: avOzelListe, isAvansiGirisleri: avIsListe, isAvansiHarcamalar: avHarcamaListe,
      ozelAvansToplam: t.ozelToplam, isAvansiToplam: t.isToplam, isAvansiBelgelenenToplam: t.belgelenenToplam,
      isAvansiBelgesizKalan: t.isKesilecek, toplamKesinti: t.toplamKesinti, kayitZamani: Date.now()
    };
    document.getElementById("btnAviKapatKayitEt").disabled = true;
    AvansKayitData.kaydet(kayitObj, function(basarili, err){
      document.getElementById("btnAviKapatKayitEt").disabled = false;
      if(!basarili){ alert("Kaydedilemedi: " + (err && err.message)); return; }
      avOzelListe = []; avIsListe = []; avHarcamaListe = [];
      avCiz(); avGecmisSeciciDoldur();
    });
  };

  document.getElementById("avGecmisAySecici").onchange = function(){ avGecmisDetayGoster(this.value); };

  AvansKayitData.degistiginde(function(){
    // Başka bir sekmeden/cihazdan değişirse, KENDİ yazdığımız taslağı
    // ezmemek için sadece geçmiş listesini ve (kapanmışsa) dönemi tazeler.
    avGecmisSeciciDoldur();
    document.getElementById("btnAviKapatKayitEt").textContent = "✓ " + AY_ADLARI_AV[AvansKayitData.acikDonem().ay] + "'ı Kapat ve Kayıt Et";
    document.getElementById("avDonemSerit").textContent = "Açık Dönem: " + AY_ADLARI_AV[AvansKayitData.acikDonem().ay] + " " + AvansKayitData.acikDonem().yil;
  });
});
