// WE-CON-CRM — Customer form value helpers
// Extracted without changing the existing global API.

function getDynamicCustomerName(){ return document.getElementById("custNameInput").value.trim()||"Musteri"; }
function getDynamicCustomerSehir(){ var el=document.getElementById("custSehirInput"); return el?el.value.trim():""; }
function getDynamicCustomerNameSehirli(){ var cn=getDynamicCustomerName(); var cs=getDynamicCustomerSehir(); return cs?(cn+" - "+cs):cn; }
function getDynamicCustomerVade(){ return document.getElementById("custVadeInput").value.trim(); }
function getDynamicCustomerFatura(){ return document.getElementById("custFaturaInput").value.trim(); }

function getModLabel(){
  if(secilenMod==="siparis") return "SİPARİŞ";
  if(secilenMod==="proforma") return "PROFORMA FATURA";
  if(secilenMod==="numune") return "NUMUNE";
  return "FİYAT TEKLİFİ";
}

function getDynamicCustomerYetkili(){
  if(seciliYetkiliKisi && seciliYetkiliKisi.isim) return seciliYetkiliKisi.isim;
  return document.getElementById("custYetkiliInput").value.trim()||"";
}
function getDynamicCustomerYetkiliIletisim(){
  if(seciliYetkiliKisi && seciliYetkiliKisi.isim){
    return [seciliYetkiliKisi.telefon, seciliYetkiliKisi.eposta].filter(Boolean).join("  ·  ");
  }
  return "";
}
function getDynamicCustomerKargo(){ return document.getElementById("custKargoInput").value.trim()||""; }
function getDynamicCustomerTeslimatAdresi(){
  var cb = document.getElementById("custTeslimatKullanCheckbox");
  if(!cb || !cb.checked) return "";
  var el = document.getElementById("custTeslimatAdresiInput");
  return el ? el.value.trim() : "";
}
function custTeslimatToggle(){
  var cb = document.getElementById("custTeslimatKullanCheckbox");
  var ta = document.getElementById("custTeslimatAdresiInput");
  if(!cb || !ta) return;
  ta.style.display = cb.checked ? "block" : "none";
  if(cb.checked) ta.focus();
  generateCommunicationData();
}
