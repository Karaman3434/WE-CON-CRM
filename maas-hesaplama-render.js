/*
  maas-hesaplama-render.js
  ==========================
  Ay seçimini, KomisyonData'dan otomatik brüt prim çekmeyi ve
  MaasHesaplamaData.ayHesapla() sonucunu ekrana basmayı yönetir.
*/

var AY_ADLARI_MH = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function fmtTL_MH(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
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

var mhElleGirilenPrim = {}; // {ayNo: deger} — kullanıcı "Değiştir"den elle girdiyse burada tutulur

// KomisyonData'daki en güncel kayıttan 1-12 ayların brüt prim dizisini
// döndürür — birden fazla kayıt varsa EN YENİ tarihli olanı esas alır
// (tumKayitlar() zaten yeniden eskiye sıralı döner).
function mhGuncelPrimDizisiOku(){
  try{
    var kayitlar = KomisyonData.tumKayitlar();
    if(!kayitlar || !kayitlar.length) return {aylar:null, tarih:null};
    return {aylar: kayitlar[0].aylar || {}, tarih: kayitlar[0].tarih};
  }catch(e){ return {aylar:null, tarih:null}; }
}

function mhEtkinPrimDizisiOlustur(){
  var kaynak = mhGuncelPrimDizisiOku();
  var dizi = {};
  for(var ay=1; ay<=12; ay++){
    dizi[ay] = mhElleGirilenPrim.hasOwnProperty(ay) ? mhElleGirilenPrim[ay] : ((kaynak.aylar && kaynak.aylar[ay]) || 0);
  }
  return {dizi: dizi, tarih: kaynak.tarih};
}

function mhAySecimiDoldur(){
  var sel = document.getElementById("mhAySecim");
  var simdi = new Date();
  var buAy = simdi.getMonth()+1;
  sel.innerHTML = "";
  for(var ay=1; ay<=12; ay++){
    var opt = document.createElement("option");
    opt.value = ay;
    opt.textContent = AY_ADLARI_MH[ay] + " " + simdi.getFullYear();
    if(ay === buAy) opt.selected = true;
    sel.appendChild(opt);
  }
}

function mhPrimKutusunuGuncelle(){
  var ay = parseInt(document.getElementById("mhAySecim").value, 10);
  var sonuc = mhEtkinPrimDizisiOlustur();
  var deger = sonuc.dizi[ay] || 0;
  document.getElementById("mhPrimDeger").textContent = fmtTL_MH(deger);
  document.getElementById("mhPrimGiris").value = deger ? deger.toString().replace(".", ",") : "";
  var kaynakEl = document.getElementById("mhPrimKaynak");
  if(mhElleGirilenPrim.hasOwnProperty(ay)){
    kaynakEl.textContent = "Elle girildi.";
  } else if(sonuc.tarih){
    var p = sonuc.tarih.split("-");
    kaynakEl.textContent = "Kaynak: Ödenebilir Komisyon · " + p[2] + "." + p[1] + "." + p[0] + " kaydı";
  } else {
    kaynakEl.textContent = "Ödenebilir Komisyon'da kayıt yok — elle gir.";
  }
}

function mhHesaplaVeCiz(){
  var ay = parseInt(document.getElementById("mhAySecim").value, 10);
  var brutSabit = parseFloat((document.getElementById("mhBrutSabit").value||"0").replace(",",".")) || 0;
  var avans = parseFloat((document.getElementById("mhAvans").value||"0").replace(",",".")) || 0;
  var primDizisi = mhEtkinPrimDizisiOlustur().dizi;

  var sonuc = MaasHesaplamaData.ayHesapla(ay, brutSabit, primDizisi);

  document.getElementById("mhSonucSabit").textContent = fmtTL_MH(sonuc.netSabitMaas);
  document.getElementById("mhSonucPrim").textContent = fmtTL_MH(sonuc.netPrim);
  document.getElementById("mhSonucToplam").textContent = fmtTL_MH(sonuc.netToplam);
  document.getElementById("mhSonucBanka").textContent = fmtTL_MH(sonuc.netToplam - avans);
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_MH();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  mhAySecimiDoldur();

  var brutKayitli = localStorage.getItem("weicon_brut_sabit_maas");
  if(brutKayitli) document.getElementById("mhBrutSabit").value = brutKayitli;

  mhPrimKutusunuGuncelle();
  mhHesaplaVeCiz();

  document.getElementById("mhAySecim").onchange = function(){
    mhPrimKutusunuGuncelle();
    mhHesaplaVeCiz();
  };

  document.getElementById("mhPrimDegistirBtn").onclick = function(){
    var deger = document.getElementById("mhPrimDeger");
    var giris = document.getElementById("mhPrimGiris");
    var duzenleniyorMu = !giris.hidden;
    if(duzenleniyorMu){
      var ay = parseInt(document.getElementById("mhAySecim").value, 10);
      var v = parseFloat((giris.value||"0").replace(",",".")) || 0;
      mhElleGirilenPrim[ay] = v;
      giris.hidden = true;
      deger.hidden = false;
      this.textContent = "✏️ Değiştir";
      mhPrimKutusunuGuncelle();
      mhHesaplaVeCiz();
    } else {
      deger.hidden = true;
      giris.hidden = false;
      giris.focus();
      this.textContent = "✓ Onayla";
    }
  };

  document.getElementById("mhBrutSabit").onchange = function(){
    var v = parseFloat((this.value||"0").replace(",",".")) || 0;
    try{ AyarlarSync.brutSabitMaasKaydet(v); }catch(e){}
    mhHesaplaVeCiz();
  };
  document.getElementById("mhAvans").oninput = mhHesaplaVeCiz;

  try{
    KomisyonData.degistiginde(function(){
      mhPrimKutusunuGuncelle();
      mhHesaplaVeCiz();
    });
  }catch(e){}
});
