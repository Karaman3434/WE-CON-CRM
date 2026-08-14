// Top menu UI extracted from index.html.
// Integration into index.html is intentionally deferred until the inline
// declarations can be removed atomically.
(function(){
  window.ustMenuAcKapat = function(){
    var el = document.getElementById("ustMenuPopup");
    if(!el) return;
    el.style.display = (el.style.display === "block") ? "none" : "block";
  };

  window.ustMenuAyarlaraGit = function(){
    if(typeof showToast === "function") showToast("⚙️ Ayarlar yakında burada olacak.");
    else alert("⚙️ Ayarlar yakında burada olacak.");
  };
})();
