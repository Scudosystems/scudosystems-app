(function () {
  function buildIso(dayOffset, hour, minute) {
    var base = new Date("2026-04-10T00:00:00Z");
    base.setUTCDate(base.getUTCDate() - dayOffset);
    base.setUTCHours(hour, minute, 0, 0);
    return base.toISOString();
  }

  var paySeed = 820400;
  var sessionSeed = 630000;

  // [boxNum, amount, creditAmount, hour, minute, status, ?errorMsg]
  var plans = [
    {
      dayOffset: 0,
      entries: [
        ["BAY001", 8,  10, 7, 14, "started"],
        ["BAY002", 12, 15, 8, 42, "started"],
        ["BAY003", 8,  10, 9, 6,  "started"],
        ["BAY005", 18, 23, 10, 31, "started"],
        ["BAY001", 5,  5,  11, 18, "started"],
        ["BAY004", 12, 15, 12, 49, "started"],
        ["BAY002", 8,  10, 13, 22, "started"],
        ["BAY006", 18, 23, 14, 7,  "started"],
        ["BAY003", 5,  5,  15, 38, "started"],
        ["BAY005", 12, 15, 16, 11, "started"],
        ["BAY001", 8,  10, 17, 54, "started"],
        ["BAY004", 25, 25, 18, 28, "started"],
      ],
    },
    {
      dayOffset: 1,
      entries: [
        ["BAY002", 8,  10, 7, 5,  "started"],
        ["BAY001", 12, 15, 8, 33, "started"],
        ["BAY003", 18, 23, 9, 14, "started"],
        ["BAY006", 8,  8,  10, 47, "failed", "Bay sensor timeout — retry attempted"],
        ["BAY004", 12, 15, 11, 22, "started"],
        ["BAY005", 8,  10, 12, 39, "started"],
        ["BAY001", 18, 23, 13, 6,  "started"],
        ["BAY002", 5,  5,  14, 51, "started"],
        ["BAY003", 12, 15, 15, 28, "started"],
        ["BAY006", 8,  10, 16, 43, "started"],
        ["BAY004", 25, 25, 17, 17, "started"],
        ["BAY005", 8,  10, 18, 55, "started"],
      ],
    },
    {
      dayOffset: 2,
      entries: [
        ["BAY001", 12, 15, 7, 21, "started"],
        ["BAY003", 8,  10, 8, 48, "started"],
        ["BAY002", 18, 23, 9, 35, "started"],
        ["BAY005", 8,  10, 10, 12, "started"],
        ["BAY004", 12, 15, 11, 44, "started"],
        ["BAY001", 5,  5,  12, 19, "started"],
        ["BAY006", 18, 23, 13, 37, "started"],
        ["BAY002", 8,  10, 14, 52, "started"],
        ["BAY003", 12, 15, 15, 8,  "started"],
        ["BAY005", 25, 25, 16, 33, "started"],
        ["BAY001", 8,  10, 17, 46, "started"],
        ["BAY004", 12, 15, 18, 14, "started"],
      ],
    },
    {
      dayOffset: 3,
      entries: [
        ["BAY003", 8,  10, 7, 9,  "started"],
        ["BAY001", 18, 23, 8, 31, "started"],
        ["BAY002", 12, 15, 9, 56, "started"],
        ["BAY004", 8,  10, 10, 23, "started"],
        ["BAY006", 5,  5,  11, 41, "started"],
        ["BAY005", 18, 23, 12, 7,  "started"],
        ["BAY001", 8,  10, 13, 28, "started"],
        ["BAY003", 12, 15, 14, 44, "started"],
        ["BAY002", 8,  10, 15, 16, "started"],
        ["BAY004", 25, 25, 16, 52, "started"],
        ["BAY006", 8,  8,  17, 35, "failed", "Payment acknowledged but bay did not activate"],
        ["BAY005", 12, 15, 18, 43, "started"],
      ],
    },
    {
      dayOffset: 4,
      entries: [
        ["BAY002", 8,  10, 7, 17, "started"],
        ["BAY004", 12, 15, 8, 44, "started"],
        ["BAY001", 18, 23, 9, 22, "started"],
        ["BAY003", 8,  10, 10, 38, "started"],
        ["BAY005", 12, 15, 11, 14, "started"],
        ["BAY006", 8,  10, 12, 49, "started"],
        ["BAY002", 5,  5,  13, 31, "started"],
        ["BAY001", 18, 23, 14, 7,  "started"],
        ["BAY004", 12, 15, 15, 22, "started"],
        ["BAY003", 8,  10, 16, 48, "started"],
        ["BAY005", 25, 25, 17, 11, "started"],
        ["BAY006", 8,  10, 18, 36, "started"],
      ],
    },
    {
      dayOffset: 5,
      entries: [
        ["BAY001", 12, 15, 7, 6,  "started"],
        ["BAY003", 8,  10, 8, 27, "started"],
        ["BAY005", 18, 23, 9, 51, "started"],
        ["BAY002", 8,  10, 10, 18, "started"],
        ["BAY004", 12, 15, 11, 43, "started"],
        ["BAY006", 5,  5,  12, 29, "started"],
        ["BAY001", 18, 23, 13, 14, "started"],
        ["BAY003", 8,  10, 14, 38, "started"],
        ["BAY005", 12, 15, 15, 53, "started"],
        ["BAY002", 8,  10, 16, 21, "started"],
        ["BAY004", 25, 25, 17, 44, "started"],
        ["BAY006", 8,  10, 18, 9,  "started"],
      ],
    },
    {
      dayOffset: 6,
      entries: [
        ["BAY003", 8,  10, 7, 33, "started"],
        ["BAY001", 12, 15, 8, 56, "started"],
        ["BAY002", 18, 23, 9, 18, "started"],
        ["BAY006", 8,  10, 10, 44, "started"],
        ["BAY004", 12, 15, 11, 27, "started"],
        ["BAY005", 8,  10, 12, 52, "started"],
        ["BAY001", 18, 23, 13, 39, "started"],
        ["BAY003", 5,  5,  14, 14, "started"],
        ["BAY002", 12, 15, 15, 31, "started"],
        ["BAY006", 8,  10, 16, 48, "started"],
        ["BAY004", 25, 25, 17, 23, "started"],
        ["BAY005", 8,  10, 18, 7,  "started"],
      ],
    },
  ];

  var transactions = [];

  plans.forEach(function (dayPlan) {
    dayPlan.entries.forEach(function (entry) {
      paySeed += 1;
      sessionSeed += 1;
      transactions.push({
        id: "demo_" + sessionSeed,
        sessionId: "cs_demo_" + sessionSeed,
        createdAt: buildIso(dayPlan.dayOffset, entry[3], entry[4]),
        boxNum: entry[0],
        amount: entry[1],
        creditAmount: entry[2],
        bonusAmount: Math.max(0, entry[2] - entry[1]),
        payId: entry[5] === "failed" ? null : String(paySeed),
        status: entry[5],
        error: entry[6] || "",
      });
    });
  });

  transactions.sort(function (left, right) {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  window.SCUDO_DEMO_DATA = {
    config: {
      tagline: "Commercial car wash QR payments and operations preview",
      site: {
        name: "Glide Solihull",
        siteId: "GLD-SOL-01",
        region: "West Midlands",
        location: "Solihull retail park — 6 wash bays",
        liveStatus: "Demo environment",
      },
      payment: {
        ctaLabel: "Preview demo session",
        footerNote: "ScudoQR demo experience",
        footerMeta: "ops@glidecarwash.co.uk",
      },
      dashboard: {
        title: "ScudoQR demo dashboard",
        subtitle: "Illustrative car wash operations view with realistic sample data for commercial demos.",
      },
    },
    settings: {
      bonusEnabled: true,
      bonusMode: "recommended",
      bonusDisplayMode: "selected",
      bonusPack: 12,
      bonusPacks: [
        { pay: 8, credit: 10 },
        { pay: 12, credit: 15 },
        { pay: 18, credit: 23 },
      ],
      bays: ["BAY001", "BAY002", "BAY003", "BAY004", "BAY005", "BAY006"],
      staffVisibility: {
        filters: true,
        revenue: true,
        charts: true,
        chargerPerformance: true,
        forecasts: true,
        heatmap: true,
        alerts: true,
        transactions: true,
      },
    },
    transactions: transactions,
  };
})();
