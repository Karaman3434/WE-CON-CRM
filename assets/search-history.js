function aramaGecmisiKaydet(q){
  if(!q || q.length < 2) return;
  aramaGecmisi = lsGet("weicon_arama_gecmisi",[]);
  // Zaten varsa başa taşı
  aramaGecmisi = aramaGecmisi.filter(function(a){ return a !== q; });
  aramaGecmisi.unshift(q);
  // Son 10 aramayı tut
  if(aramaGecmisi.length > 10) aramaGecmisi = aramaGecmisi.slice(0,10);
  lsSet("weicon_arama_gecmisi", aramaGecmisi);
  aramaGecmisiniGoster();

  // "En Çok Aranan Ürünler" tablosu için sıklık sayacı (küçük/büyük harf duyarsız)
  var qKucuk = q.toLocaleLowerCase("tr-TR");
  var frekans = lsGet("weicon_arama_frekans", {});
  frekans[qKucuk] = frekans[qKucuk] || {metin:q, sayi:0};
  frekans[qKucuk].sayi += 1;
  frekans[qKucuk].metin = q; // en son yazılan hâliyle göster
  lsSet("weicon_arama_frekans", frekans);
}

function aramaGecmisiniGoster(){
  aramaGecmisi = lsGet("weicon_arama_gecmisi",[]);
  var div = document.getElementById("aramaGecmisiDiv");
  if(!div) return;
  if(aramaGecmisi.length === 0){ div.innerHTML=""; return; }
  var html = '<div style="font-size:16px;color:#555;margin-bottom:6px;font-weight:900;">Son Aramalar:</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
  for(var i=0; i<aramaGecmisi.length; i++){
    html += '<button onclick="aramaSecGeçmis(\''+aramaGecmisi[i]+'\')" '
      +'style="background:#e8f4fd;color:#003a70;border:1px solid #003a70;padding:8px 16px;'
      +'border-radius:20px;font-size:22px;font-weight:900;cursor:pointer;">'
      +aramaGecmisi[i]+'</button>';
  }
  html += '</div>';
  div.innerHTML = html;
}

function aramaSecGeçmis(q){
  document.getElementById("searchInput").value = q;
  requestAnimationFrame(function(){performFilter();});
}

// HİT ÜRÜNLER — tüm SİPARİŞ kayıtlarından ürünlerin toplam satılan adedini hesaplayıp
// en çok satılandan aza doğru sıralar.
