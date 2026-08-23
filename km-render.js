/*
  km-render.js
  ============
  Formu doldurur (bugünkü kayıt varsa gösterir, yoksa önceki günün bitişini
  başlangıç olarak önerir), anlık fark hesabını gösterir, tabloyu çizer.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
    var el2 = document.getElementById("kmBugunTarih");
    if(el2) el2.textContent = d.getDate() + " " + aylar[d.getMonth()];
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

var secilenKategori = "is";

function kategoriSecimBagla(){
  document.querySelectorAll(".kategori-btn").forEach(function(btn){
    btn.onclick = function(){
      document.querySelectorAll(".kategori-btn").forEach(function(b){ b.classList.remove("kategori-btn--secili"); });
      this.classList.add("kategori-btn--secili");
      secilenKategori = this.getAttribute("data-kategori");
      farkiGuncelle();
    };
  });
}

function farkiGuncelle(){
  var b = document.getElementById("kmBaslangic").value;
  var s = document.getElementById("kmBitis").value;
  var fark = KmData.farkHesapla(s, b);
  document.getElementById("kmFarkGoster").textContent = (fark===null ? "0" : fark) + " km";
}

function formuDoldur(){
  try{
    var anahtar = KmData.bugunAnahtari();
    var kayit = KmData.kaydiOku(anahtar);
    var baslangicInput = document.getElementById("kmBaslangic");
    var bitisInput = document.getElementById("kmBitis");

    if(kayit){
      baslangicInput.value = kayit.km || "";
      bitisInput.value = kayit.bitisKm || "";
      secilenKategori = kayit.kmKategori || "is";
      document.querySelectorAll(".kategori-btn").forEach(function(b){
        b.classList.toggle("kategori-btn--secili", b.getAttribute("data-kategori")===secilenKategori);
      });
    } else {
      var onerilen = KmData.oncekiBitisKmBul(anahtar);
      if(onerilen!==null) baslangicInput.value = onerilen;
    }
    farkiGuncelle();
  }catch(e){ hataGoster("Form doldurulamadı: " + e.message); }
}

function tabloyuCiz(){
  try{
    var kayitlar = KmData.buAyinKayitlari();
    var kapsayici = document.getElementById("kmTablo");
    var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

    if(kayitlar.length === 0){
      kapsayici.innerHTML = "<p style='text-align:center;color:#8a94a3;font-size:13px;padding:16px 0;'>Bu ay henüz kayıt yok.</p>";
      document.getElementById("kmAyToplamIs").textContent = "0 km";
      return;
    }

    var toplamIs = 0;
    var html = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var etiket = parseInt(parca[2],10) + " " + aylar[parseInt(parca[1],10)-1];
      var fark = k.isKm!=null ? k.isKm : (k.ozelKm!=null ? k.ozelKm : 0);
      if(k.isKm!=null) toplamIs += k.isKm;
      var kategoriSinif = k.kmKategori === "ozel" ? "ozel" : "";
      return "<div class='km-tablo-satir'>"
        + "<div><div class='km-tablo-tarih'>" + etiket + "</div><div class='km-tablo-detay'>" + (k.km||"-") + " → " + (k.bitisKm||"-") + " km</div></div>"
        + "<div class='km-tablo-fark " + kategoriSinif + "'>" + fark + " km</div>"
        + "</div>";
    }).join("");

    kapsayici.innerHTML = html;
    document.getElementById("kmAyToplamIs").textContent = toplamIs + " km";
  }catch(e){ hataGoster("Tablo çizilemedi: " + e.message); }
}

function kmKaydetTiklandi(){
  try{
    var b = document.getElementById("kmBaslangic").value;
    var s = document.getElementById("kmBitis").value;
    if(!b || !s){
      hataGoster("Başlangıç ve Bitiş KM girin.");
      return;
    }
    var btn = document.getElementById("btnKmKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    KmData.kaydet(KmData.bugunAnahtari(), parseFloat(b), parseFloat(s), secilenKategori, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "✓ Günü Kaydet";
      if(basarili){
        alert("✓ Kayıt tamamlandı.");
      } else {
        hataGoster("Kaydetme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
}

function excelAktar(){
  try{
    if(typeof XLSX === "undefined"){
      hataGoster("Excel kütüphanesi yüklenemedi, internet bağlantınızı kontrol edin.");
      return;
    }
    var kayitlar = KmData.buAyinKayitlari().slice().reverse(); // eskiden yeniye
    if(kayitlar.length === 0){
      alert("Bu ay henüz kayıt yok, aktarılacak veri bulunamadı.");
      return;
    }
    var adSoyad = document.getElementById("kmAdSoyad").value || "";
    var plaka = document.getElementById("kmPlaka").value || "";
    var now = new Date();
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var donemEtiket = aylar[now.getMonth()] + " " + now.getFullYear();

    var basliklar = ["Tarih","Başlangıç KM","Bitiş KM","İş KM","Özel KM"];
    var veriSatirlari = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var d = new Date(parseInt(parca[0]), parseInt(parca[1])-1, parseInt(parca[2]));
      var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
      var tarihStr = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear()+" "+gunler[d.getDay()];
      return [tarihStr, k.km||"", k.bitisKm||"", k.isKm!=null?k.isKm:"", k.ozelKm!=null?k.ozelKm:""];
    });

    var aoa = [
      ["AD SOYAD", adSoyad, "", "DÖNEM", donemEtiket, "PLAKA", plaka],
      [],
      basliklar
    ].concat(veriSatirlari);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:20},{wch:14},{wch:14},{wch:10},{wch:10}];

    var INCE_KENAR = { style:"thin", color:{rgb:"3569B8"} };
    var TUM_KENAR = { top:INCE_KENAR, bottom:INCE_KENAR, left:INCE_KENAR, right:INCE_KENAR };
    var BAS_SATIR = 3;
    for(var hc=0; hc<basliklar.length; hc++){
      var basAdr = XLSX.utils.encode_cell({r:BAS_SATIR-1, c:hc});
      if(!ws[basAdr]) ws[basAdr] = {t:"s", v:""};
      ws[basAdr].s = {
        fill: {patternType:"solid", fgColor:{rgb:"CFE2F3"}, bgColor:{rgb:"CFE2F3"}},
        font: {bold:true, color:{rgb:"3569B8"}},
        alignment: {horizontal:"center", vertical:"center"},
        border: TUM_KENAR
      };
    }
    for(var vr=0; vr<veriSatirlari.length; vr++){
      for(var vc=0; vc<basliklar.length; vc++){
        var vAdr = XLSX.utils.encode_cell({r:BAS_SATIR+vr, c:vc});
        if(!ws[vAdr]) ws[vAdr] = {t:"s", v:""};
        ws[vAdr].s = {
          alignment: {horizontal: (vc===0?"left":"center"), vertical:"center"},
          border: TUM_KENAR
        };
      }
    }

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KM Takip");
    var dosyaAdi = ((plaka||"KM").replace(/\s/g,"_"))+"_"+donemEtiket.replace(/\s/g,"_")+".xlsx";
    XLSX.writeFile(wb, dosyaAdi);
  }catch(e){ hataGoster("Excel oluşturulamadı: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  kategoriSecimBagla();
  document.getElementById("kmBaslangic").addEventListener("input", farkiGuncelle);
  document.getElementById("kmBitis").addEventListener("input", farkiGuncelle);
  document.getElementById("btnKmKaydet").onclick = kmKaydetTiklandi;
  document.getElementById("btnExcel").onclick = excelAktar;
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  KmData.ayarlarOku(function(ayarlar){
    document.getElementById("kmAdSoyad").value = ayarlar.adSoyad || "";
    document.getElementById("kmPlaka").value = ayarlar.plaka || "";
  });
  ["kmAdSoyad","kmPlaka"].forEach(function(id){
    document.getElementById(id).addEventListener("change", function(){
      KmData.ayarlarKaydet(document.getElementById("kmAdSoyad").value, document.getElementById("kmPlaka").value);
    });
  });
  KmData.degistiginde(function(){ formuDoldur(); tabloyuCiz(); });
});
