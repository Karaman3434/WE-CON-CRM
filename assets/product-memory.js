// SON KULLANILAN ÜRÜNLER (en son sepete eklenen 20 ürün, tekrar tıklayınca direkt sepete eklenir)
function sonKullanilanKaydet(id,name,price,berta,abas){
  var liste = lsGet("weicon_son_kullanilan",[]);
  liste = liste.filter(function(u){ return u.id !== id; });
  liste.unshift({id:id,name:name,price:price,berta:berta,abas:abas});
  if(liste.length > 20) liste = liste.slice(0,20);
  lsSet("weicon_son_kullanilan", liste);
  sonKullanilanUrunleriGoster();
}

function sonKullanilanUrunleriGoster(){
  var div = document.getElementById("sonKullanilanUrunlerDiv");
  if(!div) return;
  var q = document.getElementById("searchInput")?document.getElementById("searchInput").value.trim():"";
  if(q.length>0){ div.innerHTML=""; return; }
  var liste = lsGet("weicon_son_kullanilan",[]);
  if(liste.length === 0){ div.innerHTML=""; return; }
  var gosterilecek = liste.slice(0,8);
  var html = '<div style="font-size:16px;color:#555;margin-bottom:6px;font-weight:900;">🕓 Son Kullanılan Ürünler:</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
  for(var i=0; i<gosterilecek.length; i++){
    var u = gosterilecek[i];
    var safeName = (u.name||"").replace(/'/g,"&#39;");
    var safeBerta = (u.berta||"").replace(/'/g,"&#39;");
    var safeAbas = (u.abas||"").replace(/'/g,"&#39;");
    html += "<button onclick=\"sonKullanilanUrunSecildi(this,'"+u.id+"','"+safeName+"',"+(parseFloat(u.price)||0)+",'"+safeBerta+"','"+safeAbas+"')\" "
      +"style='background:#e8f4fd;color:#003a70;border:1px solid #003a70;padding:8px 16px;"
      +"border-radius:20px;font-size:22px;font-weight:900;cursor:pointer;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"
      +safeText(u.name)+"</button>";
  }
  html += '</div>';
  div.innerHTML = html;
}

function sonKullanilanUrunSecildi(btn,id,name,price,berta,abas){
  for(var i=0;i<basket.length;i++){
    if(basket[i].id===id){ showToast("Ürün zaten sepette."); return; }
  }
  addToBasket(btn,id,name,price,berta,abas);
}

/* ============================================================
   TOPLU İSKONTO
============================================================ */
