/*
  km-render.js
  ============
  Tek form: bugünün KM'sini + saat/güzergah/ziyaret/kategori girip
  "Günü Kaydet" ile kaydeder. Üstte dünün özet satırı, altta "Bu Ayın
  Kayıtları" gerçek tablo olarak açılıp kapanabilir + Excel'e aktarılabilir.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

var GUNLER = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var AYLAR_KISA = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    var d = new Date();
    if(el) el.textContent = GUNLER[d.getDay()] + ", " + d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear();
    var el2 = document.getElementById("kmBugunTarih");
    if(el2) el2.textContent = d.getDate() + " " + AYLAR[d.getMonth()];
    var el3 = document.getElementById("kmTarihGoster");
    if(el3) el3.value = ("0"+d.getDate()).slice(-2) + "." + ("0"+(d.getMonth()+1)).slice(-2) + "." + d.getFullYear();
    var saatEl = document.getElementById("kmSaat");
    if(saatEl && !saatEl.value){
      saatEl.value = ("0"+d.getHours()).slice(-2) + ":" + ("0"+d.getMinutes()).slice(-2);
    }
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

function dunOzetiniCiz(){
  try{
    var ozet = KmData.dunOzeti();
    var el = document.getElementById("kmDunOzet");
    if(!ozet){
      el.innerHTML = "Dünkü kayıt henüz yok.";
      return;
    }
    el.innerHTML = "Dün: <strong>" + (ozet.baslangic!=null?ozet.baslangic:"-") + " km</strong> → <strong>" + ozet.bitis + " km</strong>"
      + " = <strong>" + (ozet.mesafe!=null?ozet.mesafe:"-") + " km</strong> yapıldı";
  }catch(e){ hataGoster("Dün özeti çizilemedi: " + e.message); }
}

function formuDoldur(){
  try{
    var anahtar = KmData.bugunAnahtari();
    var kayit = KmData.kaydiOku(anahtar);
    if(kayit){
      if(kayit.km!==undefined && kayit.km!==null) document.getElementById("kmBugun").value = kayit.km;
      if(kayit.saat) document.getElementById("kmSaat").value = kayit.saat;
      if(kayit.guzergah) document.getElementById("kmGuzergah").value = kayit.guzergah;
      if(kayit.ziyaretYerleri) document.getElementById("kmZiyaretYerleri").value = kayit.ziyaretYerleri;
      secilenKategori = kayit.kmKategori || "is";
      document.querySelectorAll(".kategori-btn").forEach(function(b){
        b.classList.toggle("kategori-btn--secili", b.getAttribute("data-kategori")===secilenKategori);
      });
    }
    dunOzetiniCiz();
  }catch(e){ hataGoster("Form doldurulamadı: " + e.message); }
}

function tabloyuCiz(){
  try{
    var kayitlar = KmData.buAyinKayitlari();
    var govde = document.getElementById("kmTabloGovde");
    var bugunAnahtar = KmData.bugunAnahtari();

    if(kayitlar.length === 0){
      govde.innerHTML = "<tr><td colspan='8' style='text-align:center;color:#8a94a3;padding:16px 0;'>Bu ay henüz kayıt yok.</td></tr>";
      document.getElementById("kmAyToplamIs").textContent = "0 km";
      document.getElementById("kmAyToplamOzel").textContent = "0 km";
      return;
    }

    var toplamIs = 0, toplamOzel = 0;
    govde.innerHTML = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var etiket = parseInt(parca[2],10) + " " + AYLAR_KISA[parseInt(parca[1],10)-1];
      if(k.isKm!=null) toplamIs += k.isKm;
      if(k.ozelKm!=null) toplamOzel += k.ozelKm;
      var bugunMu = k.anahtar === bugunAnahtar;
      var satirSinifi = bugunMu ? " class='km-satir--bugun'" : "";
      var baslangicSinifi = bugunMu ? " km-td-baslangic-bugun" : "";
      return "<tr" + satirSinifi + " data-anahtar='" + k.anahtar + "'>"
        + "<td>" + etiket + "</td>"
        + "<td contenteditable='true' data-alan='saat'>" + (k.saat||"-") + "</td>"
        + "<td class='km-td-metin' contenteditable='true' data-alan='guzergah'>" + (k.guzergah||"-") + "</td>"
        + "<td class='km-td-metin' contenteditable='true' data-alan='ziyaret'>" + (k.ziyaretYerleri||"-") + "</td>"
        + "<td contenteditable='true' data-alan='baslangic' class='km-td-baslangic" + baslangicSinifi + "'>" + (k.km!=null?k.km:"-") + "</td>"
        + "<td contenteditable='true' data-alan='bitis'>" + (k.bitisKm!=null?k.bitisKm:"-") + "</td>"
        + "<td class='km-td-is' contenteditable='true' data-alan='isKm'>" + (k.isKm!=null?k.isKm:"-") + "</td>"
        + "<td class='km-td-ozel' contenteditable='true' data-alan='ozelKm'>" + (k.ozelKm!=null?k.ozelKm:"-") + "</td>"
        + "</tr>";
    }).join("");

    document.getElementById("kmAyToplamIs").textContent = toplamIs + " km";
    document.getElementById("kmAyToplamOzel").textContent = toplamOzel + " km";

    govde.querySelectorAll("td[contenteditable]").forEach(function(td){
      td.addEventListener("blur", function(){
        var tr = this.closest("tr");
        var anahtar = tr.getAttribute("data-anahtar");
        var alan = this.getAttribute("data-alan");
        var deger = this.textContent.trim();
        if(deger === "-") deger = "";
        KmData.hucreGuncelle(anahtar, alan, deger, function(basarili, err){
          if(!basarili) hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      });
    });
  }catch(e){ hataGoster("Tablo çizilemedi: " + e.message); }
}

function kmKaydetTiklandi(){
  try{
    var deger = document.getElementById("kmBugun").value;
    if(!deger){
      hataGoster("Bugünün kilometresini girin.");
      return;
    }
    var btn = document.getElementById("btnKmKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    var saat = document.getElementById("kmSaat").value.trim();
    var guzergah = document.getElementById("kmGuzergah").value.trim();
    var ziyaretYerleri = document.getElementById("kmZiyaretYerleri").value.trim();

    KmData.gununKmGir(parseFloat(deger), secilenKategori, saat, guzergah, function(basarili, err){
      if(!basarili){
        btn.disabled = false;
        btn.textContent = "✓ Günü Kaydet";
        hataGoster("Kaydetme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
        return;
      }
      // Ziyaret yerlerini de aynı kayda yaz (ayrı bir çağrı — küçük bir gecikmeyle
      // "kayıtlar" nesnesinin Firebase'den taze hâliyle güncellenmesini bekliyoruz).
      setTimeout(function(){
        KmData.ziyaretYerleriniKaydet(KmData.bugunAnahtari(), ziyaretYerleri, function(){
          btn.disabled = false;
          btn.textContent = "✓ Günü Kaydet";
          alert("✓ Kayıt tamamlandı.");
        });
      }, 300);
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
}

function excelAktar(){
  try{
    if(typeof XLSX === "undefined"){
      hataGoster("Excel kütüphanesi yüklenemedi, internet bağlantınızı kontrol edin.");
      return;
    }
    var kayitlar = KmData.buAyinKayitlari().slice().reverse();
    if(kayitlar.length === 0){
      alert("Bu ay henüz kayıt yok, aktarılacak veri bulunamadı.");
      return;
    }
    var kayaliAyarlar = kmAyarlarOnbellek || {};
    var adSoyad = kayaliAyarlar.adSoyad || "";
    var plaka = kayaliAyarlar.plaka || "";
    var now = new Date();
    var donemEtiket = AYLAR[now.getMonth()] + " " + now.getFullYear();

    var basliklar = ["Tarih","Saat","Seyir Güzergahı","Ziyaret Edilen Yerler","Başlangıç KM","Bitiş KM","İş KM","Özel KM"];
    var veriSatirlari = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var d = new Date(parseInt(parca[0]), parseInt(parca[1])-1, parseInt(parca[2]));
      var tarihStr = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear()+" "+GUNLER[d.getDay()].toLocaleUpperCase("tr-TR");
      return [tarihStr, k.saat||"", k.guzergah||"", k.ziyaretYerleri||"", k.km!=null?k.km:"", k.bitisKm!=null?k.bitisKm:"", k.isKm!=null?k.isKm:"", k.ozelKm!=null?k.ozelKm:""];
    });

    var aoa = [
      ["AD SOYAD", adSoyad, "", "DÖNEM", donemEtiket, "PLAKA", plaka],
      [],
      basliklar
    ].concat(veriSatirlari);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:20},{wch:10},{wch:12},{wch:12},{wch:22},{wch:26},{wch:9},{wch:9}];

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
          alignment: {horizontal: (vc===0||vc===4||vc===5?"left":"center"), vertical:"center"},
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

var kmAyarlarOnbellek = {};

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  kategoriSecimBagla();
  document.getElementById("btnKmKaydet").onclick = kmKaydetTiklandi;
  document.getElementById("btnExcel").onclick = excelAktar;
  document.getElementById("btnTabloGoster").onclick = function(){
    var bolum = document.getElementById("kmTabloBolum");
    bolum.hidden = !bolum.hidden;
    if(!bolum.hidden) tabloyuCiz();
  };
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("btnKmBaslangicKaydet").onclick = function(){
    var deger = parseFloat(document.getElementById("kmBaslangicInput").value);
    if(!deger || deger<=0){ hataGoster("Geçerli bir kilometre değeri girin."); return; }
    var btn = document.getElementById("btnKmBaslangicKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    KmData.baslangicKaydet(deger, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "Kaydet ve Başla";
      if(basarili){
        document.getElementById("kmBaslangicOverlay").hidden = true;
        dunOzetiniCiz();
      } else {
        hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };
  var kmBaslangicKontroluYapildi = false;
  setTimeout(function(){
    if(kmBaslangicKontroluYapildi) return;
    kmBaslangicKontroluYapildi = true;
    if(KmData.baslangicGerekliMi()){
      var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
      var ayAdi = aylar[new Date().getMonth()];
      document.getElementById("kmBaslangicAciklama").textContent =
        "Sistemde henüz bir başlangıç KM kaydı yok. " + ayAdi + " ayı (veya takip başlangıcı) için aracın güncel kilometresini gir — bu değer, günlük kayıtların otomatik hesaplanabilmesi için gereklidir.";
      document.getElementById("kmBaslangicOverlay").hidden = false;
    }
  }, 1200); // Firebase'in ilk veriyi getirmesi için makul bir bekleme; KmData.degistiginde()
            // aşağıda daha erken tetiklenirse bu zaten iptal edilmiş olur.
  KmData.degistiginde(function(){
    if(kmBaslangicKontroluYapildi) return;
    kmBaslangicKontroluYapildi = true;
    if(KmData.baslangicGerekliMi()){
      var aylar2 = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
      var ayAdi2 = aylar2[new Date().getMonth()];
      document.getElementById("kmBaslangicAciklama").textContent =
        "Sistemde henüz bir başlangıç KM kaydı yok. " + ayAdi2 + " ayı (veya takip başlangıcı) için aracın güncel kilometresini gir — bu değer, günlük kayıtların otomatik hesaplanabilmesi için gereklidir.";
      document.getElementById("kmBaslangicOverlay").hidden = false;
    }
  });

  KmData.ayarlarOku(function(ayarlar){
    kmAyarlarOnbellek = ayarlar || {};
  });

  KmData.degistiginde(function(){
    formuDoldur();
    if(!document.getElementById("kmTabloBolum").hidden) tabloyuCiz();
  });
  formuDoldur();
});
