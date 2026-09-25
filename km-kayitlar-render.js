/*
  km-kayitlar-render.js
  ======================
  Eskiden km-render.js içindeydi, km.html'de aynı sayfada aşağı açılıyordu
  (24.09.2026'da ayrı sayfaya taşındı — bkz. km-kayitlar.html). Üstte
  YILLIK/AYLIK TOPLAM panoları (İş/Özel), altında ay seçici + gerçek/
  düzenlenebilir tablo + Kaydet + Excel'e Aktar.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

var GUNLER = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function tarihiGuncelle(){
  var el = document.getElementById("gunTarihi");
  var d = new Date();
  if(el) el.textContent = GUNLER[d.getDay()] + ", " + d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear();
}

// "YYYY-MM-DD" anahtarını "GG.AA.YYYY" gösterim metnine çevirir — Tarih
// hücresi elle düzenlenince gerçekten değişmiş mi diye karşılaştırmak için.
function tarihMetniAyikla(anahtar){
  var p = (anahtar||"").split("-");
  if(p.length !== 3) return "";
  return p[2] + "." + p[1] + "." + p[0];
}

var OZEL_GUN_ANAHTAR_KELIMELER = ["HAFTA SONU","TATİL","TATIL","RAPOR","İZİN","IZIN","BAYRAM","RESMİ TATİL","RESMI TATIL"];
function ozelGunMuHesapla(k){
  var satirMetniBuyuk = ((k.guzergah||"") + " " + (k.ziyaretYerleri||"")).toLocaleUpperCase("tr-TR");
  return OZEL_GUN_ANAHTAR_KELIMELER.some(function(kelime){ return satirMetniBuyuk.indexOf(kelime) !== -1; });
}

var seciliYilAy = null; // null = bu ay (varsayılan); "YYYY-MM" = geçmiş/seçilmiş ay

function aySeciciyiDoldur(){
  var secici = document.getElementById("kmAySecici");
  var aylar = KmData.kayitliAylar();
  var simdi = new Date();
  var buAyAnahtari = simdi.getFullYear()+"-"+("0"+(simdi.getMonth()+1)).slice(-2);
  secici.innerHTML = aylar.map(function(ya){
    var etiket = KmData.ayAdiUret(ya) + (ya===buAyAnahtari ? " (bu ay)" : "");
    return "<option value='" + ya + "'>" + etiket + "</option>";
  }).join("");
  secici.value = seciliYilAy || buAyAnahtari;
}

// YILLIK TOPLAM (24.09.2026) — seçili ayın YILINDAKİ tüm kayıtların
// İş/Özel toplamı. Ay değişince yıl da değişebileceği için her çizimde
// yeniden hesaplanır.
function yillikToplamiCiz(yil){
  var kayitlar = KmData.yilinKayitlari(String(yil));
  var toplamIs = 0, toplamOzel = 0;
  kayitlar.forEach(function(k){
    if(k.isKm!=null) toplamIs += k.isKm;
    if(k.ozelKm!=null) toplamOzel += k.ozelKm;
  });
  document.getElementById("kmYilEtiket").textContent = yil;
  document.getElementById("kmYilToplamIs").textContent = toplamIs + " km";
  document.getElementById("kmYilToplamOzel").textContent = toplamOzel + " km";
}

function tabloyuCiz(){
  try{
    var simdi0 = new Date();
    var buAyAnahtari0 = simdi0.getFullYear()+"-"+("0"+(simdi0.getMonth()+1)).slice(-2);
    var goruntulenenAy = seciliYilAy || buAyAnahtari0;
    var yil = goruntulenenAy.split("-")[0];
    yillikToplamiCiz(yil);
    document.getElementById("kmAyEtiket").textContent = KmData.ayAdiUret(goruntulenenAy);

    var kayitlar = KmData.ayinKayitlari(goruntulenenAy);
    document.getElementById("kmTabloBaslik").textContent = (goruntulenenAy===buAyAnahtari0 ? "Bu Ayın Kayıtları" : KmData.ayAdiUret(goruntulenenAy) + " Kayıtları");
    var govde = document.getElementById("kmTabloGovde");
    var bugunAnahtar = KmData.bugunAnahtari();

    if(kayitlar.length === 0){
      govde.innerHTML = "<tr><td colspan='8' style='text-align:center;color:#44494f;padding:16px 0;'>Bu ayda hiç kayıt yok.</td></tr>";
      document.getElementById("kmAyToplamIs").textContent = "0 km";
      document.getElementById("kmAyToplamOzel").textContent = "0 km";
      return;
    }

    var toplamIs = 0, toplamOzel = 0;
    govde.innerHTML = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var d = new Date(parseInt(parca[0],10), parseInt(parca[1],10)-1, parseInt(parca[2],10));
      var tarihGosterim = ("0"+d.getDate()).slice(-2) + "." + ("0"+(d.getMonth()+1)).slice(-2) + "." + d.getFullYear();
      var gunAdiGosterim = GUNLER[d.getDay()].toLocaleUpperCase("tr-TR");
      if(k.isKm!=null) toplamIs += k.isKm;
      if(k.ozelKm!=null) toplamOzel += k.ozelKm;
      var bugunMu = k.anahtar === bugunAnahtar;
      var satirSinifi = bugunMu ? " class='km-satir--bugun'" : "";
      // Hafta sonu / tatil / rapor / izin / bayram gibi özel kullanım
      // günlerini fark etmek için satırın tamamı sarı zemin olur.
      if(ozelGunMuHesapla(k) && !bugunMu) satirSinifi = " class='km-satir--ozelgun'";
      var baslangicSinifi = bugunMu ? " km-td-baslangic-bugun" : "";
      // Saat: "09:00-18:00" gibi aralık girilmişse iki satır (üstte
      // başlangıç, altta bitiş); tek saat varsa tek satır.
      var saatGosterim = (k.saat||"-").split("-").map(function(s){ return s.trim(); }).join("\n");
      return "<tr" + satirSinifi + " data-anahtar='" + k.anahtar + "'>"
        + "<td class='km-td-tarih'><div class='km-tarih-gun' contenteditable='true' data-alan='tarih'>" + tarihGosterim + "</div><div class='km-tarih-adi'>" + gunAdiGosterim + "</div></td>"
        + "<td class='km-td-saat' contenteditable='true' data-alan='saat'>" + saatGosterim + "</td>"
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

    govde.querySelectorAll("[contenteditable]").forEach(function(td){
      td.addEventListener("blur", function(){
        var tr = this.closest("tr");
        var anahtar = tr.getAttribute("data-anahtar");
        var alan = this.getAttribute("data-alan");
        var deger = this.textContent.trim();
        // Tarih hücresi diğerlerinden farklı: bir "alan" değil, kaydın
        // kendi anahtarı (Firebase'de kayıt tarihe göre saklanıyor) — bu
        // yüzden değer güncellemesi değil, kaydı yeni tarihe TAŞIMA işlemi.
        if(alan === "tarih"){
          if(deger === tarihMetniAyikla(anahtar)) return; // değişmemiş
          KmData.tarihiDegistir(anahtar, deger, function(basarili, err){
            if(!basarili){
              hataGoster("Tarih değiştirilemedi: " + (err && err.message ? err.message : err));
              tabloyuCiz(); // eski tarihe geri döndür
              return;
            }
            tabloyuCiz(); // satır yeni tarihiyle/sırasıyla yeniden çizilir
          });
          return;
        }
        // Saat hücresi iki satır (başlangıç/bitiş) olarak gösteriliyor —
        // kaydederken tekrar tek satır "09:00-18:00" formatına çeviriyoruz.
        if(alan === "saat"){
          deger = deger.split("\n").map(function(s){ return s.trim(); }).filter(Boolean).join("-");
        }
        if(deger === "-") deger = "";
        KmData.hucreGuncelle(anahtar, alan, deger, function(basarili, err){
          if(!basarili) hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      });
    });
  }catch(e){ hataGoster("Tablo çizilemedi: " + e.message); }
}

var kmAyarlarOnbellek = {};

function excelAktar(){
  try{
    if(typeof XLSX === "undefined"){
      hataGoster("Excel kütüphanesi yüklenemedi, internet bağlantınızı kontrol edin.");
      return;
    }
    var goruntulenenAy2 = seciliYilAy || (function(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2); })();
    var kayitlar = KmData.ayinKayitlari(goruntulenenAy2).slice().reverse();
    if(kayitlar.length === 0){
      alert("Bu ayda hiç kayıt yok, aktarılacak veri bulunamadı.");
      return;
    }
    var kayaliAyarlar = kmAyarlarOnbellek || {};
    var adSoyad = kayaliAyarlar.adSoyad || "";
    var plaka = kayaliAyarlar.plaka || "";
    var donemEtiket = KmData.ayAdiUret(goruntulenenAy2);

    var basliklar = ["Tarih","Saat","Seyir Güzergahı","Ziyaret Edilen Yerler","Başlangıç KM","Bitiş KM","İş KM","Özel KM"];
    var veriSatirlari = kayitlar.map(function(k){
      var parca = k.anahtar.split("-");
      var d = new Date(parseInt(parca[0]), parseInt(parca[1])-1, parseInt(parca[2]));
      // İstenen format: "26.08.2026" (rakam) alt satırda "ÇARŞAMBA" (harf) —
      // hücre içinde iki satır (wrapText ile aşağıda etkinleştiriliyor).
      var tarihStr = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear()+"\n"+GUNLER[d.getDay()].toLocaleUpperCase("tr-TR");
      // Saat: "09:00-18:00" gibi eski/aralıklı girişlerde başlangıç üstte,
      // bitiş altta iki satır olsun. Tek saat girilmişse tek satır kalır.
      var saatStr = k.saat || "";
      if(saatStr.indexOf("-") >= 0){
        var saatParca = saatStr.split("-");
        saatStr = saatParca[0].trim() + "\n" + saatParca[1].trim();
      }
      // İş KM / Özel KM — depolanmış değere güvenmek yerine HER ZAMAN
      // Excel'e aktarırken (Bitiş KM - Başlangıç KM) taze hesaplanır ve
      // günün kategorisine (İş/Özel) göre ilgili sütuna yazılır. Böylece
      // tablo satırı sonradan elle düzenlenmiş olsa bile Excel çıktısı
      // her zaman tutarlı kalır.
      var isKmDeger = "", ozelKmDeger = "";
      if(k.km!=null && k.bitisKm!=null){
        var fark = k.bitisKm - k.km;
        if(k.kmKategori === "ozel") ozelKmDeger = fark;
        else isKmDeger = fark; // varsayılan/"is" kategorisi
      }
      return [tarihStr, saatStr, k.guzergah||"", k.ziyaretYerleri||"", k.km!=null?k.km:"", k.bitisKm!=null?k.bitisKm:"", isKmDeger, ozelKmDeger];
    });

    var aoa = [
      ["AD SOYAD", adSoyad, "", "DÖNEM", donemEtiket, "PLAKA", plaka],
      [],
      basliklar
    ].concat(veriSatirlari);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{wch:20},{wch:10},{wch:12},{wch:12},{wch:22},{wch:26},{wch:9},{wch:9}];
    // Tarih/Saat hücreleri iki satırlı olduğu için veri satırlarını daha
    // yüksek yapıyoruz (başlık ve boş satırlar normal kalsın).
    var satirYukseklikleri = [{},{},{}];
    for(var ry=0; ry<veriSatirlari.length; ry++){ satirYukseklikleri.push({hpt:32}); }
    ws["!rows"] = satirYukseklikleri;

    // Kenar rengi programdaki tabloyla (km-style.css .km-veri-tablo th/td)
    // BİREBİR aynı ton (#333) — "kodlayınca tekrar düzenlemek istemiyorum"
    // isteği gereği ikisi burada kasıtlı olarak eşleştirilmiştir.
    var INCE_KENAR = { style:"thin", color:{rgb:"333333"} };
    var TUM_KENAR = { top:INCE_KENAR, bottom:INCE_KENAR, left:INCE_KENAR, right:INCE_KENAR };
    var BAS_SATIR = 3;

    // AD SOYAD / DÖNEM / PLAKA üst bilgi satırı (25.09.2026) — eskiden
    // hiç biçimlendirilmiyordu, artık tablonun geri kalanıyla aynı ızgara +
    // vurgulu (kalın/fill) görünüme sahip.
    for(var ic=0; ic<7; ic++){
      var infoAdr = XLSX.utils.encode_cell({r:0, c:ic});
      if(!ws[infoAdr]) ws[infoAdr] = {t:"s", v:""};
      ws[infoAdr].s = {
        fill: {patternType:"solid", fgColor:{rgb:"EAF2FC"}, bgColor:{rgb:"EAF2FC"}},
        font: {bold:true, color:{rgb:"003A70"}},
        alignment: {horizontal:(ic%2===1?"left":"center"), vertical:"center"},
        border: TUM_KENAR
      };
    }

    for(var hc=0; hc<basliklar.length; hc++){
      var basAdr = XLSX.utils.encode_cell({r:BAS_SATIR-1, c:hc});
      if(!ws[basAdr]) ws[basAdr] = {t:"s", v:""};
      ws[basAdr].s = {
        fill: {patternType:"solid", fgColor:{rgb:"FAEEDA"}, bgColor:{rgb:"FAEEDA"}},
        font: {bold:true, color:{rgb:"003A70"}},
        alignment: {horizontal:"center", vertical:"center"},
        border: TUM_KENAR
      };
    }
    // ÖZEL GÜN (hafta sonu/tatil/rapor/izin/bayram) SATIRLARI — ekrandaki
    // tabloda bu satırlar zaten bej zeminle işaretleniyor, Excel çıktısında
    // da fark edilsin diye SARI zeminle vurgulanıyor.
    for(var vr=0; vr<veriSatirlari.length; vr++){
      var ozelGunMuXl = ozelGunMuHesapla(kayitlar[vr]);
      for(var vc=0; vc<basliklar.length; vc++){
        var vAdr = XLSX.utils.encode_cell({r:BAS_SATIR+vr, c:vc});
        if(!ws[vAdr]) ws[vAdr] = {t:"s", v:""};
        ws[vAdr].s = {
          alignment: {horizontal: (vc===0||vc===1?"center":(vc===4||vc===5?"left":"center")), vertical:"center", wrapText: (vc===0||vc===1)},
          border: TUM_KENAR
        };
        if(ozelGunMuXl){
          ws[vAdr].s.fill = {patternType:"solid", fgColor:{rgb:"FFFF00"}, bgColor:{rgb:"FFFF00"}};
        }
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
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnExcel").onclick = excelAktar;
  document.getElementById("btnKmTabloKaydet").onclick = function(){
    // Tablodaki hücreler zaten yazarken (blur olunca) otomatik kaydediyor —
    // bu tuş, o an düzenlemede olan (henüz blur olmamış) bir hücre varsa
    // onu zorla kaydettirip kullanıcıya açık bir onay gösteriyor.
    var btn = this;
    if(document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute("contenteditable")){
      document.activeElement.blur();
    }
    setTimeout(function(){
      var eskiMetin = btn.textContent;
      btn.textContent = "✓ Kaydedildi";
      btn.disabled = true;
      setTimeout(function(){ btn.textContent = eskiMetin; btn.disabled = false; }, 1500);
    }, 150);
  };
  document.getElementById("kmAySecici").onchange = function(){
    seciliYilAy = this.value;
    tabloyuCiz();
  };

  KmData.ayarlarOku(function(ayarlar){
    kmAyarlarOnbellek = ayarlar || {};
  });

  aySeciciyiDoldur();
  tabloyuCiz();
  KmData.degistiginde(function(){
    aySeciciyiDoldur();
    tabloyuCiz();
  });
});
