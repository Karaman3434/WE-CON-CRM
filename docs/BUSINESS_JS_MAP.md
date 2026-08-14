# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **22,359 bytes**
- Function declarations found: **19**

## Comment/section markers

| Line | Section marker |
|---:|---|
| 10 | Kart/tabela fotoğrafını okuyan VE anomali analizini yapan ortak Cloudflare Worker adresi. |
| 11 | Kurulum rehberindeki adımları tamamladıktan sonra buraya kendi Worker URL'ini yapıştır. |
| 12 | Örn: "https://weicon-ai.SENIN-KULLANICI-ADIN.workers.dev" |
| 60 | Haftada bir, uygulama açıldığında sessizce (kullanıcıyı rahatsız etmeden) |
| 61 | Firebase Storage'a otomatik yedek alır. Elle indirilen yedeğin yerini tutmaz, |
| 62 | ek bir güvenlik ağıdır — "yanlışlıkla bir şey sildim" durumunda geri dönüş sağlar. |
| 110 | R003.2 State Manager |
| 125 | R003.3 Performance |
| 141 | KİLİT: Bugünün araç KM kaydı girilmeden, KM sayfası ve giriş/kilit ekranları |
| 142 | DIŞINDA hiçbir tıklama işlev görmesin. switchTab() zaten programatik geçişleri |
| 143 | KM sayfasına yönlendiriyor; bu dinleyici switchTab'e uğramayan doğrudan popup/ |
| 144 | fonksiyon çağıran tuşları (Hızlı Hesapla, Yeni Müşteri, Menü içi kısayollar vb.) yakalar. |
| 157 | Tüm popup'ları (id'si "Modal" ile biten div'ler) otomatik izler ve her açılışını |
| 158 | KRONOLOJİK SIRAYLA modalYigini listesine ekler. "Geri" tuşu bu geçmişi adım adım |
| 159 | geri sararak önceki adımı olduğu gibi tekrar görünür kılar. Bir popup kendi Kapat |
| 160 | tuşuyla (Geri'ye uğramadan) kapatılırsa, yığının tepesindeyse oradan da düşürülür — |
| 161 | aksi halde çok sonra alakasız bir ekrandayken Geri o eski popup'ı canlandırabilirdi. |
| 172 | Bu popup kapatıldı. "Geri" tuşuyla kapatıldıysa geriGit() zaten kendi |
| 173 | popladığı için burada yığının tepesi artık bu id'yle eşleşmez (ardışık |
| 174 | aynı id yığına asla eklenmediğinden). Ama kullanıcı bu popup'ı KENDİ Kapat |
| 175 | tuşuyla (Geri'ye hiç uğramadan) kapattıysa, o popup hâlâ yığının tepesinde |
| 176 | durur — bu durumda onu da yığından düşürüyoruz ki "Geri" tuşu çok sonra, |
| 177 | alakasız bir ekrandayken bu kapatılmış popup'ı tekrar canlandırmasın. |
| 185 | Tarih göster |
| 194 | Bugünün araç KM kaydı girilip girilmediğini (kilit kontrolü için) önce yerel |
| 195 | önbellekten anında oku — Firebase senkronizasyonu biraz sonra bunu tazeleyecek. |
| 212 | Kur otomatik güncelleme |
| 214 | Eski kayıtlara (kod alanı olmayan) geriye dönük benzersiz kod atama — bir kereye mahsus |
| 217 | Firebase hazır olunca müşteri ve arşiv verilerini çek |
| 220 | Müşteri listesi - gerçek zamanlı dinle, tüm cihazlar anında güncellenir |
| 229 | Müşteri verisi (dolayısıyla şehir bilgisi) güncellenince Son İşlemler |
| 230 | tablosundaki şehir sütunu da tazelensin — önceden bu eksikti, bu yüzden |
| 231 | tablo müşteri listesi henüz gelmeden çizildiyse şehir hep "-" kalıyordu. |
| 234 | Arşiv - gerçek zamanlı dinle |
| 250 | Araç KM kaydı - gerçek zamanlı dinle (kilit kontrolü bu veriye bakıyor) |
| 253 | GÜVENLİK AĞI: Sunucudan gelen veri, bu cihazda (telefonda) hâlihazırda |
| 254 | bilinen günlerden BELİRGİN ŞEKİLDE AZ ise (örn. sunucu boş/eksik bir |
| 255 | anlık görüntü döndürdüyse), bunu ŞÜPHELİ sayıp kabul ETMİYORUZ — |
| 256 | telefondaki bilinen veriyi koruyoruz. Bu, geçmişte yaşanan "sunucudan |
| 257 | gelen eksik veri, telefondaki sağlam geçmişin üzerine yazıldı" türü bir |
| 258 | kaybı BİR DAHA yaşamamak için eklendi. Normal küçük farklar (1-2 gün) |
| 259 | sorun değil, sadece büyük/ani düşüşler reddediliyor. |
| 274 | Kur - gerçek zamanlı dinle, bir cihazda değişen kur tüm cihazlara anında yansır |
| 326 | ============================================================ |
| 334 | Zaten varsa başa taşı |
| 337 | Son 10 aramayı tut |
| 342 | "En Çok Aranan Ürünler" tablosu için sıklık sayacı (küçük/büyük harf duyarsız) |
| 373 | HİT ÜRÜNLER — tüm SİPARİŞ kayıtlarından ürünlerin toplam satılan adedini hesaplayıp |
| 374 | en çok satılandan aza doğru sıralar. |
| 391 | Hit Ürünler listesinden bir ürüne dokununca — Hesapla ekranını açmadan |
| 392 | doğrudan sepete ekler, popup açık kalır (art arda birden fazla ürün eklenebilsin). |
| 435 | EN ÇOK ARANAN — arama kutusuna yazılan terimlerin sıklığını gösterir. |

## Function index

| Line | Function |
|---:|---|
| 19 | `veriYonetimiPopupAc` |
| 23 | `tumVeriyiYedekle` |
| 45 | `yedekHatirlaticiKontrolEt` |
| 63 | `otomatikYedekKontrolEt` |
| 91 | `kdvOraniDegistir` |
| 117 | `validateText` |
| 126 | `debounce` |
| 218 | `firebasdenYukle` |
| 297 | `showToast` |
| 304 | `showUndoToast` |
| 319 | `gizleUndoToast` |
| 331 | `aramaGecmisiKaydet` |
| 351 | `aramaGecmisiniGoster` |
| 368 | `aramaSecGeçmis` |
| 375 | `hitUrunleriHesapla` |
| 393 | `hitUrundenSepeteEkle` |
| 409 | `hitUrunlerAc` |
| 436 | `enCokAranakHesapla` |
| 441 | `enCokAranakAc` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
