    // Bu ayki kaçan kayıtların toplam tutarı ayrı hesaplanır.
  var toplamTutar = 0;
  for(var kt=0; kt<kacanlar.length; kt++) toplamTutar += kacanlar[kt].tutar || 0;

  window._kacanKayitlariBuAy = kacanlar;

  el.innerHTML =
