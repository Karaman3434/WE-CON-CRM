// --- Müşteri kalıcı ID sistemi -------------------------------------------
// Firma adı yerine kalıcı bir ID: isim değişse/iki firma aynı adı taşısa bile
// kayıtlar birbirine karışmaz. Eski kayıtlarda id yoksa burada otomatik
// tamamlanır (geriye dönük uyumlu — mevcut veriler kaybolmaz).
// Görünür, sıralı müşteri kodu üretir (M-0001, M-0002, ...). Mevcut listedeki
// en yüksek numaranın bir fazlasını verir.
function musteriSonrakiKoduBul(){
  var maxNo = 0;
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i].id;
    if(m && /^M-\d+$/.test(m)){
      var no = parseInt(m.split("-")[1],10);
      if(no>maxNo) maxNo = no;
    }
  }
  return "M-"+String(maxNo+1).padStart(4,"0");
}
function musteriIdUret(){
  return musteriSonrakiKoduBul();
}
function musteriIdEksikleriTamamla(){
  var eksikVarMi = false;
  // Eskiden rastgele (CUS-...) üretilmiş kodlar varsa, görünür/sıralı yeni
  // biçime (M-0001) geçiriyoruz — en eski müşteri (listenin sonunda, çünkü
  // yeni müşteriler unshift ile başa ekleniyor) en küçük numarayı alsın diye
  // ters sırada numaralandırıyoruz.
  for(var i=musteriListesi.length-1;i>=0;i--){
    if(!musteriListesi[i].id || !/^M-\d+$/.test(musteriListesi[i].id)){
      musteriListesi[i].id = musteriSonrakiKoduBul();
      eksikVarMi = true;
    }
  }
  if(eksikVarMi){
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet) window.fbSet("musteriler", musteriListesi).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  }
}
// --------------------------------------------------------------------------
