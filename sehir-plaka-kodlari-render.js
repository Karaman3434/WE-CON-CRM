function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
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
    var q = (document.getElementById("spkAra").value||"").trim().toLocaleLowerCase("tr-TR");
    var liste = CustomerData.ilKodlariListele();
    if(q) liste = liste.filter(function(x){ return x.ad.toLocaleLowerCase("tr-TR").indexOf(q) >= 0; });

    var kapsayici = document.getElementById("spkListesi");
    var bos = document.getElementById("spkBosMesaj");
    if(liste.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = "<div class='spk-liste-kutu'>" + liste.map(function(x){
      return "<div class='spk-satir'>"
        + "<span class='spk-il-adi'>" + htmlEsc(x.ad) + "</span>"
        + "<input type='text' class='spk-kod-input' data-anahtar='" + htmlEsc(x.anahtar) + "' value='" + htmlEsc(x.kod) + "' maxlength='2' inputmode='numeric'>"
        + "<button class='spk-sil-btn' data-anahtar='" + htmlEsc(x.anahtar) + "' aria-label='Sil'>🗑</button>"
        + "</div>";
    }).join("") + "</div>";

    kapsayici.querySelectorAll(".spk-kod-input").forEach(function(input){
      input.addEventListener("change", function(){
        CustomerData.ilKoduEkleGuncelle(this.getAttribute("data-anahtar"), this.value);
        listeyiCiz();
      });
    });
    kapsayici.querySelectorAll(".spk-sil-btn").forEach(function(btn){
      btn.onclick = function(){
        var anahtar = this.getAttribute("data-anahtar");
        if(!confirm(anahtar.charAt(0).toLocaleUpperCase("tr-TR") + anahtar.slice(1) + " silinsin mi?")) return;
        CustomerData.ilKoduSil(anahtar);
        listeyiCiz();
      };
    });
  }catch(e){ hataGoster("Liste çizilemedi: " + e.message); }
}

function yeniIlEkleTiklandi(){
  try{
    var ad = document.getElementById("spkYeniAd").value.trim();
    var kod = document.getElementById("spkYeniKod").value.trim();
    if(!ad || !kod){
      hataGoster("İl adı ve kod girin.");
      return;
    }
    CustomerData.ilKoduEkleGuncelle(ad, kod);
    document.getElementById("spkYeniAd").value = "";
    document.getElementById("spkYeniKod").value = "";
    listeyiCiz();
  }catch(e){ hataGoster("İl eklenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("spkAra").addEventListener("input", listeyiCiz);
  document.getElementById("btnSpkEkle").onclick = yeniIlEkleTiklandi;
  listeyiCiz();
});
