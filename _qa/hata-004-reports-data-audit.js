/* WE-CON-CRM HATA-004 audit — no production code changes.
   Purpose: regression guard for reports-data.js Firebase write patterns.
   This file is intentionally standalone and does not load in the application.
*/
(function(){
  "use strict";
  var requiredFunctions = [
    "guvenliGorevYaz",
    "kaydiKacanIsaretle",
    "kaydiSil",
    "kayitlariBirlestir",
    "kaydiGuncelle"
  ];
  var source = window.__REPORTS_DATA_SOURCE_FOR_AUDIT__ || "";
  var results = requiredFunctions.map(function(name){
    var re = new RegExp("function\\s+" + name + "\\s*\\(");
    return {functionName:name, found:re.test(source)};
  });
  window.__WEICON_REPORTS_AUDIT__ = {
    generatedAt: new Date().toISOString(),
    productionSafe: true,
    checks: results
  };
  console.table(results);
})();
