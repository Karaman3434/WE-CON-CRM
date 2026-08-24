/*
  customer-render.js
  ==================
  Müşteri listesini ekrana basar, arama kutusunu dinler, seçim yapılınca
  send.html'e yönlendirir.
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
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function listeyiCiz(){
  try{
    var q = document.getElementById("musteriAra").value;
    var kapsayici = document.getElementById("musteriListesi");
    var bos = document.getElementById("musteriBosMesaj");
    var yukleniyor = document.getElementById("musteriYukleniyor");

    if(CustomerData.uzunluk() === 0){
      kapsayici.innerHTML = "";
      bos.hidden = true;
      yukleniyor.hidden = false;
      return;
    }
    yukleniyor.hidden = true;

    var sonuclar = CustomerData.ara(q);

    var siralama = document.getElementById("musteriSiralama").value;
    sonuclar = sonuclar.slice(); // orijinal listeyi bozmadan sırala
    if(siralama === "sehir"){
      sonuclar.sort(function(a,b){ return (a.sehir||"").localeCompare(b.sehir||"", "tr-TR"); });
    } else if(siralama === "sonZiyaret"){
      sonuclar.sort(function(a,b){
        var aTs = (a.ziyaretGecmisi&&a.ziyaretGecmisi.length) ? Math.max.apply(null, a.ziyaretGecmisi.map(function(z){return z.ts||0;})) : 0;
        var bTs = (b.ziyaretGecmisi&&b.ziyaretGecmisi.length) ? Math.max.apply(null, b.ziyaretGecmisi.map(function(z){return z.ts||0;})) : 0;
        return bTs - aTs; // en yakın ziyaret üstte
      });
    } else {
      sonuclar.sort(function(a,b){ return (a.ad||"").localeCompare(b.ad||"", "tr-TR"); });
    }

    if(q.trim().length === 0) sonuclar = sonuclar.slice(0, 40);

    if(sonuclar.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = sonuclar.map(function(m, i){
      return "<div class='musteri-karti' data-i='" + i + "'>"
        + "<div><div class='musteri-ad'>" + htmlEsc(m.ad) + "</div><div class='musteri-sehir'>" + htmlEsc(m.sehir||"-") + "</div></div>"
        + "<span class='musteri-git'>→</span>"
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".musteri-karti").forEach(function(kart, i){
      kart.onclick = function(){
        CustomerData.sec(sonuclar[i]);
        // Sepette ürün varsa (satış akışının ortasındaysak) doğrudan Kaydet'e
        // geç; sepet boşsa (müşteriyi incelemeye gelinmiş) Müşteri Kartı'na git.
        var sepetDoluMu = false;
        try{ sepetDoluMu = JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]").length > 0; }catch(e){}
        window.location.href = sepetDoluMu ? "send.html" : "customer-detail.html";
      };
    });
  }catch(e){ hataGoster("Liste çizilemedi: " + e.message); }
}

function yeniMusteriFormBagla(){
  var form = document.getElementById("yeniMusteriForm");
  document.getElementById("btnYeniMusteriAc").onclick = function(){
    form.hidden = !form.hidden;
  };
  document.getElementById("btnYeniMusteriVazgec").onclick = function(){
    form.hidden = true;
  };
  document.getElementById("btnYeniMusteriKaydet").onclick = function(){
    var bilgi = {
      ad: document.getElementById("yeniMusteriAdi").value,
      sehir: document.getElementById("yeniMusteriSehir").value,
      vade: document.getElementById("yeniMusteriVade").value,
      fatura: document.getElementById("yeniMusteriFatura").value,
      telefon: document.getElementById("yeniMusteriTelefon").value,
      eposta: document.getElementById("yeniMusteriEposta").value,
      kargo: document.getElementById("yeniMusteriKargo").value
    };

    // Mükerrer kayıt önleme: benzer isimli müşteri varsa önce onay iste.
    var benzerler = CustomerData.benzerMusterileriBul(bilgi.ad);
    if(benzerler.length > 0){
      var isimler = benzerler.map(function(m){ return m.ad + (m.sehir?" ("+m.sehir+")":""); }).join("\n");
      var devamEt = confirm("Benzer isimli müşteri(ler) zaten kayıtlı:\n\n" + isimler + "\n\nYine de yeni bir müşteri olarak eklemek istiyor musunuz?");
      if(!devamEt) return;
    }

    var btn = document.getElementById("btnYeniMusteriKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    CustomerData.yeniMusteriKaydet(bilgi, function(basarili, sonuc){
      btn.disabled = false;
      btn.textContent = "✓ Müşteriyi Kaydet";
      if(basarili){
        alert("✓ " + sonuc.ad + " kaydedildi.");
        form.hidden = true;
        ["yeniMusteriAdi","yeniMusteriSehir","yeniMusteriVade","yeniMusteriFatura","yeniMusteriTelefon","yeniMusteriEposta","yeniMusteriKargo"].forEach(function(id){
          document.getElementById(id).value = "";
        });
      } else {
        hataGoster(typeof sonuc === "string" ? sonuc : "Kaydedilemedi: " + (sonuc && sonuc.message ? sonuc.message : "bilinmeyen hata"));
      }
    });
  };
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  yeniMusteriFormBagla();
  document.getElementById("musteriAra").addEventListener("input", listeyiCiz);
  document.getElementById("musteriSiralama").addEventListener("change", listeyiCiz);
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  CustomerData.listeDegistiginde(listeyiCiz);
  listeyiCiz();
});
