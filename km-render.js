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
      el.innerHTML = "Henüz önceki bir kayıt yok.";
      return;
    }
    // "Dün" yerine kaydın GERÇEK tarihini gösteriyoruz — araç günlerdir
    // çıkmamışsa (hafta sonu/tatil/izin), bu "dün" olmayabilir.
    var parca = ozet.tarihAnahtari.split("-"); // YYYY-MM-DD
    var etiketTarih = parca[2] + "." + parca[1] + "." + parca[0];
    el.innerHTML = "Önceki kayıt (" + etiketTarih + "): <strong>" + (ozet.baslangic!=null?ozet.baslangic:"-") + " km</strong> → <strong>" + ozet.bitis + " km</strong>"
      + " = <strong>" + (ozet.mesafe!=null?ozet.mesafe:"-") + " km</strong> yapıldı";
  }catch(e){ hataGoster("Önceki kayıt özeti çizilemedi: " + e.message); }
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
      govde.innerHTML = "<tr><td colspan='8' style='text-align:center;color:#44494f;padding:16px 0;'>Bu ay henüz kayıt yok.</td></tr>";
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
      var ozelGunAnahtarKelimeler = ["HAFTA SONU","TATİL","TATIL","RAPOR","İZİN","IZIN","BAYRAM","RESMİ TATİL","RESMI TATIL"];
      var satirMetniBuyuk = ((k.guzergah||"") + " " + (k.ziyaretYerleri||"")).toLocaleUpperCase("tr-TR");
      var ozelGunMu = ozelGunAnahtarKelimeler.some(function(kelime){ return satirMetniBuyuk.indexOf(kelime) !== -1; });
      if(ozelGunMu && !bugunMu) satirSinifi = " class='km-satir--ozelgun'";
      var baslangicSinifi = bugunMu ? " km-td-baslangic-bugun" : "";
      // Saat: "09:00-18:00" gibi aralık girilmişse iki satır (üstte
      // başlangıç, altta bitiş); tek saat varsa tek satır.
      var saatGosterim = (k.saat||"-").split("-").map(function(s){ return s.trim(); }).join("\n");
      return "<tr" + satirSinifi + " data-anahtar='" + k.anahtar + "'>"
        + "<td class='km-td-tarih'><div class='km-tarih-gun'>" + tarihGosterim + "</div><div class='km-tarih-adi'>" + gunAdiGosterim + "</div></td>"
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

    govde.querySelectorAll("td[contenteditable]").forEach(function(td){
      td.addEventListener("blur", function(){
        var tr = this.closest("tr");
        var anahtar = tr.getAttribute("data-anahtar");
        var alan = this.getAttribute("data-alan");
        var deger = this.textContent.trim();
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
          alignment: {horizontal: (vc===0||vc===1?"center":(vc===4||vc===5?"left":"center")), vertical:"center", wrapText: (vc===0||vc===1)},
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
  // NOT: "Başlangıç Kilometresi Gerekli" hatırlatma popup'ı kaldırıldı —
  // Firebase verisi yavaş bağlantıda geç gelince yanlışlıkla tetiklenip
  // hiç kapanmıyordu (zaten dolu olan güne rağmen). Artık hiçbir koşulda
  // gösterilmiyor; kmBaslangicOverlay HTML'de duruyor ama hiç açılmıyor.

  KmData.ayarlarOku(function(ayarlar){
    kmAyarlarOnbellek = ayarlar || {};
  });

  KmData.degistiginde(function(){
    formuDoldur();
    if(!document.getElementById("kmTabloBolum").hidden) tabloyuCiz();
  });
  formuDoldur();
});
