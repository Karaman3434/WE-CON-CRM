// YENİ ÜRÜN EKLE — stoğa yeni giren ama Ürün Bul listesinde henüz
// olmayan tekil ürünleri, tüm listeyi değiştirmeden ekler.
// ============================================================
function veriYonetimindenUrunEkleAc(){
  var vModal = document.getElementById("veriYonetimiModal");
  if(vModal) vModal.style.display = "none";
  setTimeout(function(){ yeniUrunEklePopupAc(); }, 60);
}

function yeniUrunEklePopupAc(){
  document.getElementById("yeniUrunBerta").value = "";
  document.getElementById("yeniUrunAbas").value = "";
  document.getElementById("yeniUrunAdi").value = "";
  document.getElementById("yeniUrunFiyat").value = "";
  document.getElementById("yeniUrunHata").style.display = "none";
  document.getElementById("yeniUrunEkleModal").style.display = "flex";
}

function yeniUrunKaydet(){
  var berta = document.getElementById("yeniUrunBerta").value.trim().slice(0,60);
  var abas = document.getElementById("yeniUrunAbas").value.trim().slice(0,60);
  var ad = document.getElementById("yeniUrunAdi").value.trim().slice(0,200);
  var fiyat = parseFloat(document.getElementById("yeniUrunFiyat").value);
  var hataEl = document.getElementById("yeniUrunHata");

  if(!ad){ hataEl.textContent="⚠️ Ürün adı zorunlu."; hataEl.style.display="block"; return; }
  if(isNaN(fiyat) || fiyat<=0){ hataEl.textContent="⚠️ Geçerli bir fiyat girin."; hataEl.style.display="block"; return; }

  // Aynı Berta+Abas kombinasyonu zaten listede varsa uyar (mükerrer kayıt önle)
  if(berta && abas){
    var mukerrer = globalProductCatalog.some(function(it){
      var b=(it.berta||it.BERTA||"").toString().trim();
      var a=(it.abas||it.ABAS||"").toString().trim();
      return b===berta && a===abas;
    });
    if(mukerrer){
      hataEl.textContent="⚠️ Bu Berta/Abas kodu zaten listede kayıtlı. Mükerrer eklemeyi önlemek için işlem durduruldu.";
      hataEl.style.display="block";
      return;
    }
  }

  var yeniUrun = {urun:ad, berta:berta, abas:abas, fiyat:fiyat};
  var yeniIndex = globalProductCatalog.length;
  globalProductCatalog.push(yeniUrun);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(globalProductCatalog));
  performFilter();

  if(window.fbUpdate){
    var updates = {};
    updates[yeniIndex] = yeniUrun;
    window.fbUpdate(updates).then(function(){
      showToast("✓ \""+ad+"\" listeye eklendi ve Firebase'e kaydedildi (tüm cihazlarda görünecek).", 4500);
    }).catch(function(){
      showToast("✓ \""+ad+"\" eklendi ama Firebase'e gönderilemedi — sadece bu cihazda.", 5000);
    });
  } else {
    showToast("✓ \""+ad+"\" eklendi (yalnızca bu cihazda).", 4000);
  }

  document.getElementById("yeniUrunEkleModal").style.display = "none";
  switchTab(1);
}
