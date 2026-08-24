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
    };
  });
}

function farkiGuncelle(){
  var anahtar = KmData.bugunAnahtari();
  var kayit = KmData.kaydiOku(anahtar);
  var b = kayit ? kayit.km : null;
  var s = document.getElementById("kmBitis").value;
  var fark = KmData.farkHesapla(s, b);
  document.getElementById("kmFarkGoster").textContent = (fark===null ? "0" : fark) + " km";
}

// Güne göre iki hâlden biri gösterilir:
//  ADIM 1 — bugün için hiç kayıt yoksa: sadece Başlangıç KM girişi.
//  ADIM 2 — bugün başlangıç girilmiş ama bitiş girilmemişse: Bitiş KM girişi.
// (Bitiş de girilmişse ADIM 2 düzenlenebilir hâlde kalır — gün içinde tekrar
// güncellenebilsin diye.)
function formuDoldur(){
  try{
    var anahtar = KmData.bugunAnahtari();
    var kayit = KmData.kaydiOku(anahtar);
    var adim1 = document.getElementById("kmAdim1");
    var adim2 = document.getElementById("kmAdim2");

    if(!kayit || kayit.km===undefined || kayit.km===null || kayit.km===""){
      // ADIM 1: henüz başlangıç girilmemiş.
      adim1.hidden = false;
      adim2.hidden = true;
      var onerilen = KmData.oncekiBitisKmBul(anahtar);
      var baslangicInput = document.getElementById("kmBaslangic");
      if(onerilen!==null && !baslangicInput.value) baslangicInput.value = onerilen;
    } else {
      // ADIM 2: başlangıç zaten kayıtlı, bitişi gir/güncelle.
      adim1.hidden = true;
      adim2.hidden = false;
      document.getElementById("kmOzetBaslangic").textContent = kayit.km;
      document.getElementById("kmOzetSaat").textContent = kayit.saat ? (" (saat " + kayit.saat + ")") : "";
      document.getElementById("kmBitis").value = kayit.bitisKm || "";
      document.getElementById("kmZiyaretYerleri").value = kayit.ziyaretYerleri || "";
      farkiGuncelle();
    }
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
      document.getElementById("kmAyToplamOzel").textContent = "0 km";
      return;
    }

    var toplamIs = 0, toplamOzel = 0;
    var html = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var etiket = parseInt(parca[2],10) + " " + aylar[parseInt(parca[1],10)-1];
      var fark = k.isKm!=null ? k.isKm : (k.ozelKm!=null ? k.ozelKm : 0);
      if(k.isKm!=null) toplamIs += k.isKm;
      if(k.ozelKm!=null) toplamOzel += k.ozelKm;
      var kategoriSinif = k.kmKategori === "ozel" ? "ozel" : "";
      return "<div class='km-tablo-satir'>"
        + "<div><div class='km-tablo-tarih'>" + etiket + "</div><div class='km-tablo-detay'>" + (k.km||"-") + " → " + (k.bitisKm||"-") + " km" + (k.ziyaretYerleri?" · "+k.ziyaretYerleri:"") + "</div></div>"
        + "<div class='km-tablo-fark " + kategoriSinif + "'>" + fark + " km</div>"
        + "</div>";
    }).join("");

    kapsayici.innerHTML = html;
    document.getElementById("kmAyToplamIs").textContent = toplamIs + " km";
    document.getElementById("kmAyToplamOzel").textContent = toplamOzel + " km";
  }catch(e){ hataGoster("Tablo çizilemedi: " + e.message); }
}

function kmBaslangicKaydetTiklandi(){
  try{
    var b = document.getElementById("kmBaslangic").value;
    if(!b){
      hataGoster("Başlangıç KM girin.");
      return;
    }
    var btn = document.getElementById("btnKmBaslangicKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    var saat = document.getElementById("kmSaat").value.trim();
    var guzergah = document.getElementById("kmGuzergah").value.trim();
    KmData.baslangiciKaydet(KmData.bugunAnahtari(), parseFloat(b), secilenKategori, saat, guzergah, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "✓ Günü Başlat (Başlangıç KM'sini Kaydet)";
      if(basarili){
        alert("✓ Gün başlatıldı. Bitiş KM'sini gün içinde veya akşam girebilirsin.");
      } else {
        hataGoster("Kaydetme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
}

function kmBitisKaydetTiklandi(){
  try{
    var s = document.getElementById("kmBitis").value;
    if(!s){
      hataGoster("Bitiş KM girin.");
      return;
    }
    var btn = document.getElementById("btnKmBitisKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    var ziyaretYerleri = document.getElementById("kmZiyaretYerleri").value.trim();
    KmData.bitisiKaydet(KmData.bugunAnahtari(), parseFloat(s), ziyaretYerleri, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "✓ Günü Bitir (Bitiş KM'sini Kaydet)";
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

    var basliklar = ["Tarih","Başlangıç-Bitiş Saati","Seyir Güzergahı","Ziyaret Yerleri","Başlangıç KM","Bitiş KM","İş KM","Özel KM"];
    var veriSatirlari = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var d = new Date(parseInt(parca[0]), parseInt(parca[1])-1, parseInt(parca[2]));
      var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
      var tarihStr = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear()+" "+gunler[d.getDay()];
      return [tarihStr, k.saat||"", k.guzergah||"", k.ziyaretYerleri||"", k.km||"", k.bitisKm||"", k.isKm!=null?k.isKm:"", k.ozelKm!=null?k.ozelKm:""];
    });

    var aoa = [
      ["AD SOYAD", adSoyad, "", "DÖNEM", donemEtiket, "PLAKA", plaka],
      [],
      basliklar
    ].concat(veriSatirlari);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:20},{wch:16},{wch:22},{wch:26},{wch:12},{wch:12},{wch:9},{wch:9}];

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
  document.getElementById("kmBitis").addEventListener("input", farkiGuncelle);
  document.getElementById("btnKmBaslangicKaydet").onclick = kmBaslangicKaydetTiklandi;
  document.getElementById("btnKmBitisKaydet").onclick = kmBitisKaydetTiklandi;
  document.getElementById("btnKmDuzenle").onclick = function(){
    // Başlangıç bilgisini elle düzeltmek istersen — kaydı sil, Adım 1'e dön.
    if(!confirm("Bugünün başlangıç bilgisini silip yeniden mi gireceksin?")) return;
    var db = firebase.database();
    db.ref("kmTakip/" + KmData.bugunAnahtari()).remove().then(function(){
      document.getElementById("kmBaslangic").value = "";
    });
  };
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
  // Firebase verisi sayfa tam yüklenmeden önce gelmiş olabilir — bir kez de
  // hemen elle çiziyoruz (dinleyici ilk anlık görüntüyü kaçırmış olabilir).
  formuDoldur();
  tabloyuCiz();
});
