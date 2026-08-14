function anomaliDerinAnalizIste(){
  var workerUrl = WEICON_AI_WORKER_URL;
  var sonucEl = document.getElementById("anomaliDerinAnalizSonuc");
  if(!workerUrl){
    sonucEl.style.display = "block";
    sonucEl.style.background = "#fdeceb";
    sonucEl.style.color = "#c0392b";
    sonucEl.innerHTML = "⚠️ Bu özellik henüz kurulmadı (WEICON_AI_WORKER_URL boş). Kurulum rehberine bakın.";
    return;
  }
  sonucEl.style.display = "block";
  sonucEl.style.background = "#eef4fb";
  sonucEl.style.color = "#003a70";
  sonucEl.innerHTML = "⏳ Gemini analiz ediyor, lütfen bekleyin...";

  var musteriAdi = (seciliMusteri && seciliMusteri.ad) ? seciliMusteri.ad : "-";
  var urunlerOzet = hareketListesi.map(function(item){
    return {name:item.name, adet:item.adet, listeFiyat:item.listeFiyat, iskonto:item.iskonto, iskBirim:item.iskBirim};
  });

  fetch(workerUrl, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({action:"anomaliAnaliz", musteri: musteriAdi, urunler: urunlerOzet})
  })
  .then(function(r){
    if(!r.ok) throw new Error("Sunucu hatası ("+r.status+")");
    return r.json();
  })
  .then(function(data){
    if(data.error) throw new Error(data.error);
    sonucEl.style.background = "#e7f8ee";
    sonucEl.style.color = "#0e7c63";
    var guvenliMetin = (data.analiz||"Analiz alınamadı.").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    sonucEl.innerHTML = "🤖 <b>Gemini Analizi:</b><br>"+guvenliMetin.replace(/\n/g,"<br>");
  })
  .catch(function(err){
    sonucEl.style.background = "#fdeceb";
    sonucEl.style.color = "#c0392b";
    sonucEl.innerHTML = "⚠️ Analiz alınamadı: "+err.message;
  });
}
