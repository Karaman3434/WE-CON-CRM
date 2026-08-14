// --- Mükerrer müşteri tespiti -------------------------------------------
function turkceNormallestir(s){
  return (s||"").toString().toLocaleLowerCase("tr")
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/İ/g,"i");
}
var MUSTERI_ORTAK_KELIME_YOKSAY = ["a.s","as","ltd","sti","san","tic","ve","co","inc","paz","dis","tur","turizm","grup","group","the","ve","ic"];
function musteriAdiKelimelere(ad){
  return turkceNormallestir(ad).replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(function(k){
    return k.length>1 && MUSTERI_ORTAK_KELIME_YOKSAY.indexOf(k)===-1;
  });
}
function benzerMusteriBul(ad){
  var hedefKelime = musteriAdiKelimelere(ad);
  if(hedefKelime.length===0) return null;
  var enIyi = null, enIyiOran = 0;
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    if(!m || !m.ad) continue;
    var kk = musteriAdiKelimelere(m.ad);
    if(kk.length===0) continue;
    var ortak = 0;
    for(var j=0;j<hedefKelime.length;j++){ if(kk.indexOf(hedefKelime[j])!==-1) ortak++; }
    var oran = ortak / Math.min(hedefKelime.length, kk.length);
    if(oran > enIyiOran){ enIyiOran = oran; enIyi = {musteri:m, idx:i, oran:oran}; }
  }
  if(enIyi && enIyi.oran >= 0.6) return enIyi;
  return null;
}
function musteriKaydet(){
  var ad = turkceBaslikDuzeni(validateText(document.getElementById("yeniMusteriAdi").value,120));
  if(!ad){ showToast("Müşteri adı girin!"); return; }
  var benzer = benzerMusteriBul(ad);
  if(benzer){
    document.getElementById("musteriMukerrerIcerik").innerHTML =
      "Girdiğiniz <b>\""+ad+"\"</b> ismi, sistemde kayıtlı olan aşağıdaki müşteriye çok benziyor:"
      +"<div style='background:#f7f9fb;border:1px solid #d5dce6;border-radius:8px;padding:10px;margin-top:10px;'>"
        +"<div style='font-weight:800;color:#003a70;'>"+benzer.musteri.ad+"</div>"
        +"<div style='font-size:13px;color:#666;'>"+(benzer.musteri.sehir||"")+"</div>"
      +"</div>";
    document.getElementById("musteriMukerrerGitBtn").setAttribute("onclick","musteriMukerrerKapat();musteriKartAc("+benzer.idx+")");
    document.getElementById("musteriMukerrerModal").style.display="flex";
    return;
  }
  musteriKaydetGercek();
}
function musteriMukerrerKapat(){
  document.getElementById("musteriMukerrerModal").style.display="none";
}
function musteriMukerrerZorlaKaydet(){
  musteriMukerrerKapat();
  musteriKaydetGercek();
}
// --------------------------------------------------------------------------
