/* WE-CON-CRM Report Model */
(function (global) {
  'use strict';

  function summarize(customers, activities) {
    const customerList = Array.isArray(customers) ? customers : [];
    const activityList = Array.isArray(activities) ? activities : [];

    const byType = {};
    activityList.forEach(item => {
      const type = item && (item.type || item.hareket) || 'Diğer';
      byType[type] = (byType[type] || 0) + 1;
    });

    return Object.freeze({
      customerCount: customerList.length,
      activityCount: activityList.length,
      activitiesByType: Object.freeze(byType)
    });
  }

  global.WEICONReportModel = Object.freeze({ summarize });
})(window);
