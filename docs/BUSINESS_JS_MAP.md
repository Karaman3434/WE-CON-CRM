# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **21,615 bytes**
- Function declarations found: **25**

## Comment/section markers

| Line | Section marker |
|---:|---|
| 37 | ============ GİRİŞ / KİLİT SİSTEMİ ============ |
| 42 | Geriye dönük uyumluluk için: 3 saat eşiğini (tam giriş) döndürür. |
| 45 | 0 = normal, 1 = PIN kilidi gerekli (30dk-3sa arası), 2 = tam giriş gerekli (3sa+) |
| 74 | PIN artık düz metin değil, SHA-256 özeti (hash) olarak saklanır — ne cihazda |
| 75 | (localStorage) ne de Firebase'de gerçek PIN hiçbir zaman düz metin tutulmaz. |
| 84 | Geriye dönük uyumluluk: eski sürümlerden kalma düz metin "weicon_pin" varsa |
| 85 | hash'e çevirip yeni anahtara taşır, eski düz metni siler. |
| 129 | Yer tutucu — ileride genel ayarlar ekranı buraya bağlanacak. |
| 219 | PIN ekranı açıkken dışarıdaki dokunuşlar aktiviteyi güncellemesin (kilit açılmadan sayaç sıfırlanmasın) |
| 224 | Telefon ekranı kapanıp uygulama arka plana atıldığında setInterval duraklar. |
| 225 | Geri dönüldüğünde ilk dokunuşla aktivite zamanı sıfırlanmadan ÖNCE kontrol edelim, |
| 226 | yoksa arka planda geçen uzun süreler hiç sayılmadan kilit atlanmış olur. |
| 252 | Otomatik yedekleme için — JSON metnini Firebase Storage'a yükler. |
| 261 | --- Çevrimdışı senkron kuyruğu ----------------------------------------- |
| 262 | İnternet yokken veya Firebase'e yazma başarısız olursa, veri kaybolmasın |
| 263 | diye "hangi path'e ne yazılacaktı" burada bekletilir. Bağlantı geri gelince |
| 264 | (online event / periyodik kontrol) otomatik olarak tekrar denenir. |
| 278 | --- Çevrimdışı OPERASYON kuyruğu (müşteri/arşiv gibi paylaşılan veriler) -- |
| 279 | Yukarıdaki genel kuyruk "path'e şu ham veriyi yaz" şeklinde çalışıyor — |
| 280 | bağlantı gelince RAW .set() ile komple üzerine yazıyor, bu da az önce |
| 281 | eklenen güvenli-birleştirme (musteriListesiGuvenliKaydet/arsivGuvenliKaydet) |
| 282 | korumasını çevrimdışı senaryoda devre dışı bırakırdı: siz çevrimdışıyken |
| 283 | bir kaydı değiştirip kuyruğa aldıysanız ve o sırada BAŞKA bir cihaz aynı |
| 284 | listeye farklı bir değişiklik yazdıysa, bağlantınız geri geldiğinde eski |
| 285 | (bayat) komple kopyanız diğer cihazın değişikliğini sessizce silebilirdi. |
| 286 | Bu yüzden müşteri/arşiv için artık "hangi TEK kayıt değişti" bilgisi |
| 287 | saklanıyor; bağlantı gelince bu kayıt güvenli-birleştirme fonksiyonundan |
| 288 | geçirilerek uygulanıyor (sunucudaki en güncel veriyle birleştirilerek). |
| 321 | -------------------------------------------------------------------------- |
| 352 | -------------------------------------------------------------------------- |
| 381 | Atomik sayaç artırımı — iki cihaz aynı anda kod üretmeye çalışsa bile |
| 382 | Firebase sunucu tarafında SIRAYLA işlenir; hangi cihaz önce yazarsa yazsın |
| 383 | diğerinin artışı asla kaybolmaz/üzerine yazılmaz (eskiden fbSet ile TÜM |
| 384 | sayaçlar nesnesi komple üzerine yazılıyor ve çakışan artış kayboluyordu). |
| 395 | Gerçek zamanlı dinleme - tüm cihazlar anında güncellenir |
| 404 | Giriş (oturum geri yükleme) henüz tamamlanmadıysa BEKLE — aksi halde yeni |
| 405 | güvenlik kuralları ("auth != null") nedeniyle ilk okuma reddedilip veri |
| 406 | sessizce boş kalabilir (ve bu dinleyici kendiliğinden tekrar denemez). |
| 419 | İlk deneme - script'ler artık defer olmadığı için burada firebase hazır olmalı |
| 422 | Güvenlik ağı: bir sebeple hâlâ hazır değilse, sayfa tam yüklenince tekrar dene |
| 429 | Sayaçları (SIP/TEK/PRO/NUM sıra numaraları) Firebase'den dinle ve yerel |
| 430 | önbelleği her zaman İKİ değerin BÜYÜĞÜNE eşitle. Bu, cihaz değiştirdiğinde |
| 431 | (Samsung ↔ iPhone ↔ iPad) bir önceki cihazda üretilmiş en güncel sıra |
| 432 | numarasının bilinmemesi yüzünden aynı kod numarasının tekrar üretilmesini |
| 433 | önler — eskiden sayaçlar hiç Firebase'den geri okunmuyordu. |
| 456 | PIN kodu artık cihaza özel değil — Firebase'de senkronize edilir, tüm |
| 457 | cihazlar (Samsung/iPhone/iPad) aynı PIN'i anında paylaşır. |
| 469 | Güvenlik ağı: giriş sistemi 8 saniye içinde kurulamazsa (auth objesi oluşmadı, |
| 470 | internet/Firebase erişilemedi vb.), uygulamayı AÇMAK yerine "bağlantı kurulamadı, |
| 471 | tekrar dene" mesajı gösterip KİLİTLİ tutuyoruz (fail-closed — güvenlik açığı olmasın). |

## Function index

| Line | Function |
|---:|---|
| 19 | `firebaseBaslat` |
| 38 | `sonAktiviteGuncelle` |
| 41 | `sonAktiviteZamaniAsimiMi` |
| 46 | `gecenSureDurumu` |
| 56 | `pinEkraniniGoster` |
| 67 | `pinEkraniniGizle` |
| 77 | `pinHashHesapla` |
| 86 | `pinEskiFormatiTasi` |
| 97 | `pinDogrula` |
| 115 | `pinEkraniIptalTamGiris` |
| 123 | `ustMenuAcKapat` |
| 128 | `ustMenuAyarlaraGit` |
| 133 | `pinDegistir` |
| 164 | `girisEkraniniGoster` |
| 170 | `girisEkraniniGizle` |
| 176 | `girisYap` |
| 192 | `cikisYap` |
| 196 | `girisSistemiKur` |
| 227 | `kilitDurumunuKontrolEt` |
| 266 | `bekleyenSenkronKaydet` |
| 272 | `bekleyenSenkronTemizle` |
| 290 | `bekleyenIslemKaydet` |
| 398 | `baglan` |
| 434 | `sayaclarFirebasdenSenkronla` |
| 458 | `pinFirebasdenYukle` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
