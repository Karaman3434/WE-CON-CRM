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
  }catch(e){}
}

var GRUP_BASLIK = {
  gecti:      {yazi: "🔴 VADESİ GEÇTİ", renk: "#c0392b"},
  bugun:      {yazi: "🟠 BUGÜN VADESİ DOLUYOR", renk: "#b7601f"},
  yaklasiyor: {yazi: "🟡 YAKLAŞIYOR (5 gün içinde)", renk: "#8a7209"},
  "var":      {yazi: "🟢 VADESİ VAR", renk: "#0f7a3d"}
};

function listeyiCiz(){
  try{
    var kok = document.getElementById("vtListe");
    var gruplar = VadeTakip.grupluListe();

    if(!gruplar.length){
      kok.innerHTML = "";
      document.getElementById("vtBos").hidden = false;
      // Hiç grup yok — takipte fatura yoktur; bunun "vade tanımlı hiç
      // müşteri yok" mu yoksa "hepsi ödendi" mi olduğunu ayırt etmeye
      // gerek yok, ikisinde de aynı olumlu mesaj yeterli.
      return;
    }
    document.getElementById("vtBos").hidden = true;

    var html = "";
    gruplar.forEach(function(g){
      var b = GRUP_BASLIK[g.durum];
      html += VadeTakipUI.grupBasligiHTML(b.yazi, g.kayitlar.length, b.renk);
      html += "<div class='vt-grup'>";
      g.kayitlar.forEach(function(o){ html += VadeTakipUI.satirHTML(o, {gosterMusteri: true}); });
      html += "</div>";
    });
    kok.innerHTML = html;
  }catch(e){ hataGoster("Vade Takip listesi çizilemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  VadeTakipUI.baglaRozetler(document.getElementById("vtListe"), listeyiCiz);
  ReportsData.arsivDegistiginde(listeyiCiz);
  CustomerData.listeDegistiginde(listeyiCiz);
  listeyiCiz();
});
