/*
  avans-takibi-render.js
  ========================
  Özel Avans / İş Avansı / İş Avansı Harcamaları listelerini yönetir.
  Dönem artık ELLE SEÇİLEBİLİR (avDonemSecici) — otomatik hesaplanan açık
  dönem sadece başlangıç önerisi ve "kapat"tan sonraki öneridir, kapatılmamış
  herhangi bir aya geçip orada da giriş yapılabilir. Her ekleme/silme ANINDA
  AvansKayitData.taslakGuncelle() ile seçili dönemin taslağına yazılır.
*/

var AY_ADLARI_AV = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

var avOzelListe = [];
var avIsListe = [];
var avHarcamaListe = [];
var avSeciliAy = null;
var avSeciliYil = null;

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
// Türkçe tutar biçimi: binlik ayraç "." , ondalık ayraç ",". "20.000" -> 20000.
function tutarParse_AV(s){
  s = (s||"").toString().trim();
  if(!s) return 0;
  s = s.replace(/\./g, "").replace(",", ".");
  var v = parseFloat(s);
  return isNaN(v) ? 0 : v;
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
  AvansKayitData.taslakGuncelle(avSeciliAy, avSeciliYil, {
    ozelAvansGirisleri: avOzelListe,
    isAvansiGirisleri: avIsListe,
    isAvansiHarcamalar: avHarcamaListe
  }, function(basarili, err){
    if(!basarili) console.error("Taslak kaydedilemedi:", err);
  });
}

// Dönem seçiciyi doldurur: AÇIK DÖNEM'in doğal başlangıç noktasından
// (hiç kayıt yokken "bir önceki ay") itibaren 18 ay ileriye kadar — geçmiş
// yıllar listelenmez. ZATEN KAPATILMIŞ aylar da listelenmez (onlar Kayıt
// Geçmişi'nde; yanlışlıkla kapatıldıysa oradan silinip buraya geri gelir).
function avBaslangicNoktasi(){
  var simdi = new Date();
  var ay = simdi.getMonth(); // 0-index = zaten "bir önceki ay"ın 1-index karşılığı
  var yil = simdi.getFullYear();
  if(ay < 1){ ay = 12; yil -= 1; }
  return {ay:ay, yil:yil};
}

function avDonemSeciciDoldur(){
  var sel = document.getElementById("avDonemSecici");
  var baslangic = avBaslangicNoktasi();
  var secenekler = [];
  var ay = baslangic.ay, yil = baslangic.yil;
  for(var i=0; i<18; i++){
    if(!AvansKayitData.kapaliKaydiBul(ay, yil)) secenekler.push({ay:ay, yil:yil});
    ay++; if(ay>12){ ay=1; yil++; }
  }
  sel.innerHTML = secenekler.map(function(s){
    return "<option value='" + s.ay + "-" + s.yil + "'" + (s.ay===avSeciliAy && s.yil===avSeciliYil ? " selected" : "") + ">" + AY_ADLARI_AV[s.ay] + " " + s.yil + "</option>";
  }).join("");

  // Doğal başlangıç ayı (bugün için Ağustos) hâlâ kapalıysa, sessizce
  // atlamak yerine NEDENİNİ göster — kafa karıştırmasın.
  var uyari = document.getElementById("avBaslangicKapaliUyari");
  var kapaliKayit = AvansKayitData.kapaliKaydiBul(baslangic.ay, baslangic.yil);
  if(kapaliKayit){
    uyari.style.display = "block";
    uyari.innerHTML = "⚠️ " + AY_ADLARI_AV[baslangic.ay] + " " + baslangic.yil + " zaten kapatılmış (bu yüzden listede yok). Yeniden açmak için <a href='#' id='avBaslangicKapaliGit' style='color:#c0392b; text-decoration:underline; font-weight:900;'>aşağıdan Kayıt Geçmişi'nden sil</a>.";
    var link = document.getElementById("avBaslangicKapaliGit");
    if(link) link.onclick = function(ev){
      ev.preventDefault();
      document.getElementById("avGecmisAySecici").value = kapaliKayit.anahtar;
      avGecmisDetayGoster(kapaliKayit.anahtar);
      document.getElementById("avGecmisAySecici").scrollIntoView({behavior:"smooth", block:"center"});
    };
  } else {
    uyari.style.display = "none";
    uyari.innerHTML = "";
  }
}

function avDonemeGec(ay, yil){
  avSeciliAy = ay; avSeciliYil = yil;
  var taslak = AvansKayitData.taslakOku(ay, yil);
  avOzelListe = taslak.ozelAvansGirisleri || [];
  avIsListe = taslak.isAvansiGirisleri || [];
  avHarcamaListe = taslak.isAvansiHarcamalar || [];
  avDonemSeciciDoldur();
  avCiz();
}

function avCiz(){
  document.getElementById("btnAviKapatKayitEt").textContent = "✓ " + AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil + "'ı Kapat ve Kayıt Et";

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
    + "<div class='mh-sonuc-satir'><span>Kalan İş Avansı</span><b>" + fmtTL_AV(t.isKesilecek) + "</b></div>"
    + "<div class='mh-sonuc-satir mh-sonuc-satir--toplam'><span>TOPLAM KESİNTİ</span><b>" + fmtTL_AV(t.toplamKesinti) + "</b></div>"
    + "<button type='button' id='btnAvGecmisSil' class='mh-gecmis-sil-btn'>🗑 Bu Kaydı Sil (ayı yeniden açar)</button>";
  document.getElementById("btnAvGecmisSil").onclick = function(){
    if(!confirm(AY_ADLARI_AV[k.ay] + " " + k.yil + " avans kaydını silmek istediğine emin misin? Bu ay tekrar Dönem listesinde açık olarak görünecek.")) return;
    AvansKayitData.kaydiSil(k.anahtar, function(basarili, err){
      if(!basarili){ alert("Silinemedi: " + (err && err.message)); return; }
      detay.innerHTML = "";
      document.getElementById("avGecmisAySecici").value = "";
      avGecmisSeciciDoldur();
      avDonemSeciciDoldur();
    });
  };
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_AV();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  var acik = AvansKayitData.acikDonem();
  avDonemeGec(acik.ay, acik.yil);
  avGecmisSeciciDoldur();

  document.getElementById("avDonemSecici").onchange = function(){
    var p = this.value.split("-");
    avDonemeGec(parseInt(p[0],10), parseInt(p[1],10));
  };

  document.getElementById("btnOzelEkle").onclick = function(){
    var tarih = document.getElementById("avOzelTarih").value;
    var aciklama = document.getElementById("avOzelAciklama").value.trim();
    var tutar = tutarParse_AV(document.getElementById("avOzelTutar").value);
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
    var tutar = tutarParse_AV(document.getElementById("avIsTutar").value);
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
    var tutar = tutarParse_AV(document.getElementById("avHarcamaTutar").value);
    if(!tarih || !cesit || tutar<=0){ alert("Tarih, çeşit ve tutar (0'dan büyük) gerekli."); return; }
    avHarcamaListe.push({tarih:tarih, cesit:cesit, tutar:tutar});
    document.getElementById("avHarcamaTarih").value = "";
    document.getElementById("avHarcamaCesit").value = "";
    document.getElementById("avHarcamaTutar").value = "";
    avTaslagiKaydet(); avCiz();
  };

  document.getElementById("btnAviKapatKayitEt").onclick = function(){
    var t = avToplamlariHesapla({ozelAvansGirisleri:avOzelListe, isAvansiGirisleri:avIsListe, isAvansiHarcamalar:avHarcamaListe});
    if(!confirm(AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil + " avans dönemini kapatıp kayıt etmek istediğine emin misin?\n\nToplam Kesinti: " + fmtTL_AV(t.toplamKesinti))) return;
    var kayitObj = {
      ay: avSeciliAy, yil: avSeciliYil,
      ozelAvansGirisleri: avOzelListe, isAvansiGirisleri: avIsListe, isAvansiHarcamalar: avHarcamaListe,
      ozelAvansToplam: t.ozelToplam, isAvansiToplam: t.isToplam, isAvansiBelgelenenToplam: t.belgelenenToplam,
      isAvansiBelgesizKalan: t.isKesilecek, toplamKesinti: t.toplamKesinti, kayitZamani: Date.now()
    };
    document.getElementById("btnAviKapatKayitEt").disabled = true;
    var kapatilanAy = avSeciliAy, kapatilanYil = avSeciliYil;
    AvansKayitData.kaydet(kayitObj, function(basarili, err){
      document.getElementById("btnAviKapatKayitEt").disabled = false;
      if(!basarili){ alert("Kaydedilemedi: " + (err && err.message)); return; }
      var sonrakiAy = kapatilanAy+1, sonrakiYil = kapatilanYil;
      if(sonrakiAy>12){ sonrakiAy=1; sonrakiYil+=1; }
      avDonemeGec(sonrakiAy, sonrakiYil);
      avGecmisSeciciDoldur();
    });
  };

  document.getElementById("avGecmisAySecici").onchange = function(){ avGecmisDetayGoster(this.value); };

  AvansKayitData.degistiginde(function(){
    avGecmisSeciciDoldur();
    avDonemSeciciDoldur();
  });
});
