(function () {
  function buildIso(dayOffset, hour, minute) {
    var base = new Date("2026-04-10T00:00:00Z");
    base.setUTCDate(base.getUTCDate() - dayOffset);
    base.setUTCHours(hour, minute, 0, 0);
    return base.toISOString();
  }

  var paySeed = 470200;
  var sessionSeed = 910000;
  var plans = [
    {
      dayOffset: 0,
      entries: [
        ["260529", 12, 14, 6, 18, "started"],
        ["260530", 20, 24, 8, 42, "started"],
        ["260531", 35, 42, 10, 6, "started"],
        ["260533", 20, 24, 12, 37, "started"],
        ["260530", 50, 50, 16, 11, "started"],
        ["260532", 12, 14, 19, 4, "started"],
      ],
    },
    {
      dayOffset: 1,
      entries: [
        ["260529", 8, 8, 7, 11, "started"],
        ["260531", 20, 24, 9, 24, "started"],
        ["260532", 35, 42, 11, 18, "failed", "Connector handshake timeout"],
        ["260530", 20, 24, 13, 9, "started"],
        ["260533", 50, 50, 18, 46, "started"],
        ["260532", 12, 14, 20, 5, "started"],
      ],
    },
    {
      dayOffset: 2,
      entries: [
        ["260530", 12, 14, 6, 56, "started"],
        ["260531", 20, 24, 8, 17, "started"],
        ["260529", 35, 42, 10, 52, "started"],
        ["260533", 20, 24, 14, 28, "started"],
        ["260530", 35, 42, 17, 6, "started"],
        ["260532", 20, 24, 21, 14, "started"],
      ],
    },
    {
      dayOffset: 3,
      entries: [
        ["260533", 8, 8, 7, 42, "started"],
        ["260530", 20, 24, 9, 8, "started"],
        ["260531", 35, 42, 11, 31, "started"],
        ["260529", 50, 50, 15, 18, "started"],
        ["260532", 20, 24, 18, 21, "started"],
        ["260533", 12, 14, 20, 12, "started"],
      ],
    },
    {
      dayOffset: 4,
      entries: [
        ["260529", 12, 14, 6, 25, "started"],
        ["260530", 20, 24, 8, 41, "started"],
        ["260531", 20, 24, 12, 9, "failed", "Payment acknowledged but charger did not start"],
        ["260533", 35, 42, 13, 33, "started"],
        ["260532", 50, 50, 17, 45, "started"],
        ["260530", 12, 14, 19, 27, "started"],
      ],
    },
    {
      dayOffset: 5,
      entries: [
        ["260531", 8, 8, 7, 3, "started"],
        ["260529", 20, 24, 9, 55, "started"],
        ["260533", 35, 42, 11, 13, "started"],
        ["260530", 20, 24, 15, 2, "started"],
        ["260532", 35, 42, 18, 18, "started"],
        ["260529", 12, 14, 21, 1, "started"],
      ],
    },
    {
      dayOffset: 6,
      entries: [
        ["260530", 12, 14, 6, 49, "started"],
        ["260533", 20, 24, 8, 14, "started"],
        ["260529", 35, 42, 10, 27, "started"],
        ["260531", 50, 50, 14, 22, "started"],
        ["260532", 20, 24, 17, 44, "started"],
        ["260530", 20, 24, 20, 18, "started"],
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
        boxNum: Number(entry[0]),
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
      tagline: "Commercial EV charging payments and operations preview",
      site: {
        name: "Solihull Charging Hub",
        siteId: "SOL-HUB-01",
        region: "West Midlands",
        location: "Solihull commercial charging site",
        liveStatus: "Demo environment",
      },
      payment: {
        ctaLabel: "Preview demo session",
        footerNote: "ScudoCharge demo experience",
        footerMeta: "youremail@email.com",
      },
      dashboard: {
        title: "ScudoCharge demo dashboard",
        subtitle: "Illustrative EV charging operations view with realistic sample data for commercial demos.",
      },
    },
    settings: {
      bonusEnabled: true,
      bonusMode: "recommended",
      bonusDisplayMode: "selected",
      bonusPack: 20,
      bonusPacks: [
        { pay: 12, credit: 14 },
        { pay: 20, credit: 24 },
        { pay: 35, credit: 42 },
      ],
      bays: ["260529", "260530", "260531", "260532", "260533"],
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
