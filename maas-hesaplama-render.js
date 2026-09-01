/*
  maas-hesaplama-render.js
  ==========================
  Açık dönemi (MaasKayitData.acikDonem) gösterir, Brüt Prim'i Ödenebilir
  Komisyon'un güncel toplamı ile son kayıtlı dönemin referans toplamı
  arasındaki farktan otomatik hesaplar, İş Avansı harcama tablosunu yönetir
  ve "Dönemi Kayıt Et ve Kapat" ile MaasKayitData'ya kalıcı kayıt yazar.
*/

var AY_ADLARI_MH = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var mhHarcamalar = []; // {tarih, cesit, tutar} — açık dönemin henüz kaydedilmemiş iş avansı harcamaları
var mhGuncelHesap = null; // en son mhHesaplaVeCiz() çıktısı — Kayıt Et bunu kullanır

function fmtTL_MH(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
}
function htmlEsc_MH(s){
  return (s==null?"":String(s)).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function fmtTarihKisa_MH(iso){
  if(!iso) return "-";
  var p = iso.split("-");
  if(p.length!==3) return iso;
  return p[2] + "." + p[1] + "." + p[0].slice(2);
}

function tarihiGuncelle_MH(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI_MH[d.getMonth()+1] + " " + d.getFullYear();
  }catch(e){}
}

// Ödenebilir Komisyon'un EN GÜNCEL kaydındaki 12 ayın toplamı.
function mhGuncelKomisyonToplami(){
  try{
    var kayitlar = KomisyonData.tumKayitlar();
    if(!kayitlar || !kayitlar.length) return 0;
    var aylar = kayitlar[0].aylar || {};
    var toplam = 0;
    for(var ay=1; ay<=12; ay++) toplam += parseFloat(aylar[ay]) || 0;
    return toplam;
  }catch(e){ return 0; }
}

// Kümülatif vergi hesaplaması için Ocak'tan açık döneme kadar her ayın brüt
// primini toplar — geçmiş aylar için kayıtlı maaş kayıtlarındaki brutPrim
// kullanılır (kayıt yoksa 0 varsayılır), açık dönem için canlı hesaplanan
// değer kullanılır.
function mhBrutPrimDizisiOlustur(acikAy, acikYil, acikBrutPrim){
  var dizi = {};
  try{
    MaasKayitData.tumKayitlar().forEach(function(k){
      if(k.yil === acikYil) dizi[k.ay] = k.brutPrim || 0;
    });
  }catch(e){}
  dizi[acikAy] = acikBrutPrim;
  return dizi;
}

function mhAcikDonemEtiketiGuncelle(){
  var acik = MaasKayitData.acikDonem();
  document.getElementById("mhDonemSerit").textContent = "Açık Dönem: " + AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("btnAyiKayitEt").textContent = "✓ " + AY_ADLARI_MH[acik.ay] + "'ı Kayıt Et ve Kapat";
  return acik;
}

function mhHarcamaTablosunuCiz(){
  var govde = document.getElementById("mhHarcamaTabloGovde");
  govde.innerHTML = mhHarcamalar.map(function(h, idx){
    return "<tr><td>" + fmtTarihKisa_MH(h.tarih) + "</td>"
      + "<td><span class='mh-harcama-etiket-rozet'>" + htmlEsc_MH(h.cesit) + "</span></td>"
      + "<td>" + fmtTL_MH(h.tutar) + "</td>"
      + "<td><button type='button' class='mh-harcama-sil-btn' data-idx='" + idx + "'>🗑</button></td></tr>";
  }).join("");
  document.getElementById("mhHarcamaBos").hidden = mhHarcamalar.length > 0;
  govde.querySelectorAll(".mh-harcama-sil-btn").forEach(function(btn){
    btn.onclick = function(){
      mhHarcamalar.splice(parseInt(this.getAttribute("data-idx"), 10), 1);
      mhHarcamaTablosunuCiz();
      mhHesaplaVeCiz();
    };
  });
}

function mhHesaplaVeCiz(){
  var acik = mhAcikDonemEtiketiGuncelle();
  var brutSabit = parseFloat((document.getElementById("mhBrutSabit").value||"0").replace(",",".")) || 0;

  var komisyonToplam = mhGuncelKomisyonToplami();
  var referans = 0;
  try{ referans = MaasKayitData.sonReferansKomisyonToplami(); }catch(e){}
  var brutPrim = Math.max(0, komisyonToplam - referans);

  document.getElementById("mhPrimDeger").textContent = fmtTL_MH(brutPrim);
  document.getElementById("mhPrimKaynak").textContent =
    "Güncel Ödenebilir Komisyon toplamı " + fmtTL_MH(komisyonToplam) + " − son kayıtlı referans " + fmtTL_MH(referans);

  var primDizisi = mhBrutPrimDizisiOlustur(acik.ay, acik.yil, brutPrim);
  var sonuc = MaasHesaplamaData.ayHesapla(acik.ay, brutSabit, primDizisi);

  var ozelAvans = parseFloat((document.getElementById("mhOzelAvans").value||"0").replace(",",".")) || 0;
  var isAvansiTutar = parseFloat((document.getElementById("mhIsAvansiTutar").value||"0").replace(",",".")) || 0;
  var belgelenenToplam = mhHarcamalar.reduce(function(s,h){ return s + (h.tutar||0); }, 0);
  var isAvansiKesilecek = Math.max(0, isAvansiTutar - belgelenenToplam);
  var toplamKesinti = ozelAvans + isAvansiKesilecek;
  var hesabaYatacak = sonuc.netToplam - toplamKesinti;

  document.getElementById("mhBelgelenenToplam").textContent = fmtTL_MH(belgelenenToplam);
  document.getElementById("mhIsAvansiKesilecek").textContent = fmtTL_MH(isAvansiKesilecek);

  document.getElementById("mhSonucSabit").textContent = fmtTL_MH(sonuc.netSabitMaas);
  document.getElementById("mhSonucPrim").textContent = fmtTL_MH(sonuc.netPrim);
  document.getElementById("mhSonucToplam").textContent = fmtTL_MH(sonuc.netToplam);
  document.getElementById("mhSonucKesinti").textContent = fmtTL_MH(toplamKesinti);
  document.getElementById("mhSonucBanka").textContent = fmtTL_MH(hesabaYatacak);

  mhGuncelHesap = {
    acik: acik, brutSabit: brutSabit, komisyonToplam: komisyonToplam, brutPrim: brutPrim,
    sonuc: sonuc, ozelAvans: ozelAvans, isAvansiTutar: isAvansiTutar,
    belgelenenToplam: belgelenenToplam, isAvansiKesilecek: isAvansiKesilecek,
    toplamKesinti: toplamKesinti, hesabaYatacak: hesabaYatacak
  };
}

function mhGecmisiCiz(){
  var kayitlar = MaasKayitData.tumKayitlar();
  var kutu = document.getElementById("mhGecmisListesi");
  document.getElementById("mhGecmisBos").hidden = kayitlar.length > 0;
  kutu.innerHTML = kayitlar.map(function(k){
    return "<div class='mh-gecmis-karti'>"
      + "<div class='mh-gecmis-ust'>"
      + "<span class='mh-gecmis-ay'>" + AY_ADLARI_MH[k.ay] + " " + k.yil + "</span>"
      + "<span class='mh-gecmis-tutar'>" + fmtTL_MH(k.hesabaYatacak) + "</span>"
      + "</div>"
      + "<div class='mh-gecmis-detay' hidden>"
      + "<div class='mh-sonuc-satir'><span>Net Sabit Maaş</span><b>" + fmtTL_MH(k.netSabitMaas) + "</b></div>"
      + "<div class='mh-sonuc-satir'><span>Net Prim (Brüt: " + fmtTL_MH(k.brutPrim) + ")</span><b>" + fmtTL_MH(k.netPrim) + "</b></div>"
      + "<div class='mh-sonuc-satir'><span>Toplam Kesinti</span><b>" + fmtTL_MH(k.toplamKesinti) + "</b></div>"
      + "<div class='mh-sonuc-satir mh-sonuc-satir--toplam'><span>Hesaba Yatan</span><b>" + fmtTL_MH(k.hesabaYatacak) + "</b></div>"
      + "<button type='button' class='mh-gecmis-sil-btn' data-anahtar='" + k.anahtar + "'>🗑 Bu Kaydı Sil</button>"
      + "</div></div>";
  }).join("");
  kutu.querySelectorAll(".mh-gecmis-ust").forEach(function(el){
    el.onclick = function(){
      var detay = this.parentElement.querySelector(".mh-gecmis-detay");
      detay.hidden = !detay.hidden;
    };
  });
  kutu.querySelectorAll(".mh-gecmis-sil-btn").forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      if(!confirm("Bu kaydı silmek istediğine emin misin? Bu, sonraki dönemin referans noktasını da etkileyebilir.")) return;
      MaasKayitData.kaydiSil(this.getAttribute("data-anahtar"), function(basarili, err){
        if(!basarili) alert("Silinemedi: " + (err && err.message));
      });
    };
  });
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_MH();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  var brutKayitli = localStorage.getItem("weicon_brut_sabit_maas");
  if(brutKayitli) document.getElementById("mhBrutSabit").value = brutKayitli;

  mhHarcamaTablosunuCiz();
  mhHesaplaVeCiz();
  mhGecmisiCiz();

  document.getElementById("mhBrutSabit").onchange = function(){
    var v = parseFloat((this.value||"0").replace(",",".")) || 0;
    try{ AyarlarSync.brutSabitMaasKaydet(v); }catch(e){}
    mhHesaplaVeCiz();
  };
  document.getElementById("mhOzelAvans").oninput = mhHesaplaVeCiz;
  document.getElementById("mhIsAvansiTutar").oninput = mhHesaplaVeCiz;

  document.getElementById("btnHarcamaEkle").onclick = function(){
    var tarih = document.getElementById("mhHarcamaTarih").value;
    var cesit = document.getElementById("mhHarcamaCesit").value.trim();
    var tutar = parseFloat((document.getElementById("mhHarcamaTutar").value||"0").replace(",",".")) || 0;
    if(!tarih || !cesit || tutar<=0){ alert("Tarih, çeşit ve tutar (0'dan büyük) gerekli."); return; }
    mhHarcamalar.push({tarih:tarih, cesit:cesit, tutar:tutar});
    document.getElementById("mhHarcamaTarih").value = "";
    document.getElementById("mhHarcamaCesit").value = "";
    document.getElementById("mhHarcamaTutar").value = "";
    mhHarcamaTablosunuCiz();
    mhHesaplaVeCiz();
  };

  document.getElementById("btnAyiKayitEt").onclick = function(){
    if(!mhGuncelHesap) return;
    var h = mhGuncelHesap;
    if(!confirm(AY_ADLARI_MH[h.acik.ay] + " " + h.acik.yil + " dönemini kayıt edip kapatmak istediğine emin misin?\n\nHesaba Yatacak: " + fmtTL_MH(h.hesabaYatacak) + "\n\nKayıt edildikten sonra sistem otomatik bir sonraki aya geçer.")) return;

    var kayitObj = {
      ay: h.acik.ay, yil: h.acik.yil,
      brutSabitAylik: h.brutSabit,
      brutPrim: h.brutPrim,
      komisyonReferansToplam: h.komisyonToplam,
      ozelAvans: h.ozelAvans,
      isAvansiTutar: h.isAvansiTutar,
      isAvansiHarcamalar: mhHarcamalar,
      isAvansiBelgesizKalan: h.isAvansiKesilecek,
      toplamKesinti: h.toplamKesinti,
      netSabitMaas: h.sonuc.netSabitMaas,
      netPrim: h.sonuc.netPrim,
      netToplam: h.sonuc.netToplam,
      hesabaYatacak: h.hesabaYatacak,
      kayitZamani: Date.now()
    };

    document.getElementById("btnAyiKayitEt").disabled = true;
    MaasKayitData.kaydet(kayitObj, function(basarili, err){
      document.getElementById("btnAyiKayitEt").disabled = false;
      if(!basarili){ alert("Kaydedilemedi: " + (err && err.message)); return; }
      mhHarcamalar = [];
      document.getElementById("mhOzelAvans").value = "";
      document.getElementById("mhIsAvansiTutar").value = "";
      mhHarcamaTablosunuCiz();
      // MaasKayitData.degistiginde dinleyicisi zaten mhHesaplaVeCiz + mhGecmisiCiz'i tetikleyecek.
    });
  };

  try{
    KomisyonData.degistiginde(function(){ mhHesaplaVeCiz(); });
  }catch(e){}
  try{
    MaasKayitData.degistiginde(function(){ mhHesaplaVeCiz(); mhGecmisiCiz(); });
  }catch(e){}
});
