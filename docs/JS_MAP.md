# WE-CON-CRM JavaScript Architecture Map

Generated from the current `index.html` source on `project-context`.

| # | Approx. bytes | External/Inline | Markers / first code | Function names (sample) |
|---:|---:|---|---|---|
| 1 | 0 | external | - | - |
| 2 | 0 | external | - | - |
| 3 | 0 | external | - | - |
| 4 | 0 | external | - | - |
| 5 | 0 | external | - | - |
| 6 | 0 | external | - | - |
| 7 | 0 | external | - | - |
| 8 | 21,615 | inline | const firebaseConfig = {<br>function firebaseBaslat(){<br>// ============ GİRİŞ / KİLİT SİSTEMİ ============ | firebaseBaslat, sonAktiviteGuncelle, sonAktiviteZamaniAsimiMi, gecenSureDurumu, pinEkraniniGoster, pinEkraniniGizle, pinHashHesapla, pinEskiFormatiTasi, pinDogrula, pinEkraniIptalTamGiris |
| 9 | 129 | inline | function updateHTML(el,html){ | updateHTML |
| 10 | 1,063 | inline | // Tüm popup overlay'leri artık tam ekranı değil, üst panelin (WEICON logosu +<br>// tarih + Geri/Ana Sayfa/Menü satırı) ALTINI kaplıyor — böylece bir popup<br>// açıkken bile üst panel her zaman görünür ve tıklanabilir kalıyor. Üst | ustPanelYuksekligiOlc |
| 11 | 465,598 | inline | // Kart/tabela fotoğrafını okuyan VE anomali analizini yapan ortak Cloudflare Worker adresi.<br>// Kurulum rehberindeki adımları tamamladıktan sonra buraya kendi Worker URL'ini yapıştır.<br>// Örn: "https://weicon-ai.SENIN-KULLANICI-ADIN.workers.dev" | veriYonetimiPopupAc, tumVeriyiYedekle, yedekHatirlaticiKontrolEt, otomatikYedekKontrolEt, kdvOraniDegistir, validateText, debounce, firebasdenYukle, showToast, showUndoToast |
| 12 | 70 | inline | - | - |

## Safety note

This map is documentation only. It does not change application behavior. High-risk Firebase/authentication/offline synchronization blocks must be reviewed from source before extraction.
