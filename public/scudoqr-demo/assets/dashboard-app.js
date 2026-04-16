(function () {
  var core = window.ScudoCore;
  if (!core) {
    return;
  }

  var state = {
    config: null,
    settings: {},
    directory: [],
    demoMode: Boolean(window.SCUDO_DEMO_MODE),
    bonusEnabled: false,
    bonusMode: "manual",
    bonusDisplayMode: "selected",
    bonusPack: null,
    bonusPacks: [],
    staffVisibility: core.normalizeStaffVisibility(),
    latestRecommendation: null,
    latestTransactions: [],
    dashboardTimer: null,
  };

  var STORAGE_KEYS = {
    users: "scudo_dashboard_users",
    adminPin: "scudo_dashboard_admin_pin",
    unlocked: "scudo_dashboard_unlocked",
    role: "scudo_dashboard_role",
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function defaultAdminPin() {
    return window.SCUDO_DASH_PIN || window.LUXWASH_DASH_PIN || "1111";
  }

  function defaultUsers() {
    return [{ name: "Owner", pin: getAdminPin(), role: "owner" }];
  }

  function getAdminPin() {
    return localStorage.getItem(STORAGE_KEYS.adminPin) || defaultAdminPin();
  }

  function setAdminPin(pin) {
    localStorage.setItem(STORAGE_KEYS.adminPin, pin);
  }

  function getUsers() {
    var raw = localStorage.getItem(STORAGE_KEYS.users);
    if (!raw) {
      var seeded = defaultUsers();
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(seeded));
      return seeded;
    }
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : defaultUsers();
    } catch (_error) {
      return defaultUsers();
    }
  }

  function setUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }

  function currentRole() {
    return localStorage.getItem(STORAGE_KEYS.role) || "staff";
  }

  function markUnlocked(role) {
    localStorage.setItem(STORAGE_KEYS.unlocked, "true");
    localStorage.setItem(STORAGE_KEYS.role, role || "staff");
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.unlocked);
    localStorage.removeItem(STORAGE_KEYS.role);
    byId("loginScreen").classList.remove("hidden");
  }

  function buildQuery() {
    var params = new URLSearchParams();
    var bay = byId("filterBay").value;
    var start = byId("filterStart").value;
    var end = byId("filterEnd").value;
    if (charger) {
      params.set("bay", charger);
    }
    if (start) {
      params.set("start", start);
    }
    if (end) {
      params.set("end", end);
    }
    var query = params.toString();
    return query ? "?" + query : "";
  }

  function setSettingsStatus(id, message, isError) {
    var node = byId(id);
    if (!node) {
      return;
    }
    node.textContent = message || "";
    node.style.color = isError ? "var(--danger)" : "var(--text-muted)";
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function demoTransactions() {
    return safeArray(window.SCUDO_DEMO_DATA && window.SCUDO_DEMO_DATA.transactions)
      .slice()
      .sort(function (left, right) {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }

  function parseDateValue(value, endOfDay) {
    if (!value) {
      return null;
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date.getTime();
  }

  function filterTransactionsForView(list) {
    var bay = byId("filterBay") ? byId("filterBay").value : "";
    var start = byId("filterStart") ? byId("filterStart").value : "";
    var end = byId("filterEnd") ? byId("filterEnd").value : "";
    var startMs = parseDateValue(start, false);
    var endMs = parseDateValue(end, true);
    return safeArray(list).filter(function (item) {
      var ts = new Date(item.createdAt).getTime();
      if (bay && String(item.boxNum) !== String(charger)) {
        return false;
      }
      if (startMs !== null && ts < startMs) {
        return false;
      }
      if (endMs !== null && ts > endMs) {
        return false;
      }
      return true;
    });
  }

  function successfulTransactions(list) {
    return safeArray(list).filter(function (item) {
      return String(item.status || "").toLowerCase() !== "failed";
    });
  }

  function sumAmounts(list, key) {
    return safeArray(list).reduce(function (total, item) {
      return total + Number(item[key] || 0);
    }, 0);
  }

  function latestAnchorDate(list) {
    var items = safeArray(list);
    if (!items.length) {
      return new Date();
    }
    var latest = items.reduce(function (current, item) {
      var ts = new Date(item.createdAt).getTime();
      return ts > current ? ts : current;
    }, 0);
    return new Date(latest || Date.now());
  }

  function rangeFilter(list, start, end) {
    return safeArray(list).filter(function (item) {
      var ts = new Date(item.createdAt).getTime();
      return ts >= start && ts <= end;
    });
  }

  function buildDailySeries(list, days, anchor) {
    var series = [];
    for (var offset = days - 1; offset >= 0; offset -= 1) {
      var day = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - offset);
      var start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      var end = start + 24 * 60 * 60 * 1000 - 1;
      var bucket = rangeFilter(list, start, end);
      series.push({
        date: day.toISOString().slice(0, 10),
        total: Number(sumAmounts(bucket, "amount").toFixed(2)),
        sessions: bucket.length,
        credit: Number(sumAmounts(bucket, "creditAmount").toFixed(2)),
      });
    }
    return series;
  }

  function buildHourlyDemand(list) {
    var hourly = Array.from({ length: 24 }, function (_value, hour) {
      return {
        hour: hour,
        label: String(hour).padStart(2, "0") + ":00",
        sessions: 0,
        revenue: 0,
      };
    });
    successfulTransactions(list).forEach(function (item) {
      var hour = new Date(item.createdAt).getHours();
      if (hourly[hour]) {
        hourly[hour].sessions += 1;
        hourly[hour].revenue += Number(item.amount || 0);
      }
    });
    return hourly.map(function (item) {
      return {
        hour: item.hour,
        label: item.label,
        sessions: item.sessions,
        revenue: Number(item.revenue.toFixed(2)),
      };
    });
  }

  function buildChargerPerformance(list) {
    var grouped = {};
    safeArray(list).forEach(function (item) {
      var key = String(item.boxNum || "");
      if (!key) {
        return;
      }
      if (!grouped[key]) {
        grouped[key] = {
          boxNum: key,
          revenue: 0,
          credit: 0,
          incentive: 0,
          sessions: 0,
          successfulSessions: 0,
          failedSessions: 0,
          lastSeen: "",
        };
      }
      grouped[key].revenue += Number(item.amount || 0);
      grouped[key].credit += Number(item.creditAmount || item.amount || 0);
      grouped[key].incentive += Number(item.bonusAmount || 0);
      grouped[key].sessions += 1;
      if (String(item.status || "").toLowerCase() === "failed") {
        grouped[key].failedSessions += 1;
      } else {
        grouped[key].successfulSessions += 1;
      }
      if (!grouped[key].lastSeen || new Date(item.createdAt).getTime() > new Date(grouped[key].lastSeen).getTime()) {
        grouped[key].lastSeen = item.createdAt;
      }
    });

    state.directory.forEach(function (charger) {
      var key = String(charger.boxNum);
      if (!grouped[key]) {
        grouped[key] = {
          boxNum: key,
          revenue: 0,
          credit: 0,
          incentive: 0,
          sessions: 0,
          successfulSessions: 0,
          failedSessions: 0,
          lastSeen: "",
        };
      }
    });

    return Object.keys(grouped).map(function (key) {
      var item = grouped[key];
      return {
        boxNum: item.boxNum,
        revenue: Number(item.revenue.toFixed(2)),
        credit: Number(item.credit.toFixed(2)),
        incentive: Number(item.incentive.toFixed(2)),
        sessions: item.sessions,
        successfulSessions: item.successfulSessions,
        failedSessions: item.failedSessions,
        successRate: item.sessions ? item.successfulSessions / item.sessions : 1,
        avgTicket: item.sessions ? Number((item.revenue / item.sessions).toFixed(2)) : 0,
        lastSeen: item.lastSeen,
      };
    }).sort(function (left, right) {
      return Number(right.revenue || 0) - Number(left.revenue || 0);
    });
  }

  function buildDemoAlerts(filtered, allTransactions) {
    var alerts = safeArray(filtered)
      .filter(function (item) {
        return String(item.status || "").toLowerCase() === "failed";
      })
      .slice(0, 8);

    if (alerts.length) {
      return alerts;
    }

    return safeArray(allTransactions)
      .filter(function (item) {
        return String(item.status || "").toLowerCase() === "failed";
      })
      .slice(0, 8);
  }

  function buildDemoSummary(filteredTransactions, allTransactions) {
    var filtered = safeArray(filteredTransactions);
    var successful = successfulTransactions(filtered);
    var anchor = latestAnchorDate(filtered.length ? filtered : allTransactions);
    var startOfDay = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()).getTime();
    var startOfWeek = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay()).getTime();
    var startOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getTime();
    var end = anchor.getTime();
    var today = rangeFilter(successful, startOfDay, end);
    var week = rangeFilter(successful, startOfWeek, end);
    var month = rangeFilter(successful, startOfMonth, end);
    var byBay = {};

    successful.forEach(function (item) {
      var key = String(item.boxNum || "");
      byCharger[key] = Number(((byCharger[key] || 0) + Number(item.amount || 0)).toFixed(2));
    });

    var hourly = buildHourlyDemand(filtered);
    var last7 = buildDailySeries(successful, 7, anchor);
    var averageForecast = last7.length
      ? last7.reduce(function (total, day) { return total + Number(day.total || 0); }, 0) / last7.length
      : 0;
    var revenueForecast = Array.from({ length: 7 }, function (_value, index) {
      var date = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + index + 1);
      return {
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" }),
        total: Number(averageForecast.toFixed(2)),
      };
    });

    return {
      totals: {
        today: Number(sumAmounts(today, "amount").toFixed(2)),
        week: Number(sumAmounts(week, "amount").toFixed(2)),
        month: Number(sumAmounts(month, "amount").toFixed(2)),
        all: Number(sumAmounts(successful, "amount").toFixed(2)),
        credit: Number(sumAmounts(successful, "creditAmount").toFixed(2)),
        incentive: Number(sumAmounts(successful, "bonusAmount").toFixed(2)),
      },
      counts: {
        today: today.length,
        week: week.length,
        month: month.length,
        all: filtered.length,
        successful: successful.length,
        failed: filtered.length - successful.length,
      },
      metrics: {
        totalChargersConfigured: state.directory.length,
        activeChargersToday: new Set(today.map(function (item) { return String(item.boxNum); })).size,
        sessionSuccessRate: filtered.length ? successful.length / filtered.length : 1,
        avgSessionValue: successful.length ? Number((sumAmounts(successful, "amount") / successful.length).toFixed(2)) : 0,
        chargingCreditIssued: Number(sumAmounts(successful, "creditAmount").toFixed(2)),
        promotionalCreditIssued: Number(sumAmounts(successful, "bonusAmount").toFixed(2)),
      },
      byBay: byCharger,
      byCharger: byCharger,
      last7: last7,
      chargerPerformance: buildChargerPerformance(filtered),
      demandByHour: hourly,
      heatmap: hourly.map(function (item) {
        return { label: item.label, sessions: item.sessions, revenue: item.revenue };
      }),
      peakHours: hourly
        .slice()
        .sort(function (left, right) { return right.sessions - left.sessions; })
        .slice(0, 4)
        .map(function (item) {
          return { label: item.label, sessions: item.sessions };
        }),
      revenueForecast: revenueForecast,
    };
  }

  function sortByRevenue(items) {
    return items.slice().sort(function (left, right) {
      return Number(right.revenue || 0) - Number(left.revenue || 0);
    });
  }

  function fallbackPerformance(summary) {
    var directory = state.directory;
    var byBay = summary.byBay || summary.byBay || {};
    return sortByRevenue(Object.keys(byCharger).map(function (boxNum) {
      var bay = core.findCharger(directory, boxNum);
      return {
        boxNum: boxNum,
        label: bay ? core.labelForCharger(charger) : "Bay " + boxNum,
        chargerId: bay ? charger.chargerId : "",
        revenue: Number(byCharger[boxNum] || 0),
        sessions: 0,
        avgTicket: 0,
        successRate: 1,
        lastSeen: "",
        incentive: 0,
      };
    }));
  }

  function currentPerformance(summary) {
    return safeArray(summary.chargerPerformance).length ? sortByRevenue(summary.chargerPerformance) : fallbackPerformance(summary);
  }

  function networkMetrics(summary) {
    var metrics = summary.metrics || {};
    var totalChargers = Number(metrics.totalChargersConfigured || state.directory.length || 0);
    var activeToday = Number(metrics.activeChargersToday || 0);
    var successRate = Number(metrics.sessionSuccessRate || 0);
    var avgSessionValue = Number(metrics.avgSessionValue || 0);
    return [
      { label: "Configured Chargers", value: String(totalChargers), meta: "Active estate footprint" },
      { label: "Live Today", value: String(activeToday), meta: "Chargers with activity today" },
      { label: "Session Success", value: core.formatPercent(successRate, 0), meta: "Completed start attempts" },
      { label: "Average Session", value: core.formatMoney(avgSessionValue, state.config), meta: "Blended paid amount" },
    ];
  }

  function renderNetworkCards(summary) {
    var grid = byId("networkGrid");
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    networkMetrics(summary).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "network-card";
      card.innerHTML =
        '<span class="label">' + item.label + "</span>" +
        "<strong>" + item.value + "</strong>" +
        '<span class="muted">' + item.meta + "</span>";
      grid.appendChild(card);
    });
  }

  function renderKpis(summary) {
    var totals = summary.totals || {};
    var counts = summary.counts || {};
    [
      { key: "today", label: "Today" },
      { key: "week", label: "This Week" },
      { key: "month", label: "This Month" },
      { key: "all", label: "All Time" },
    ].forEach(function (item) {
      byId("kpi-" + item.key).textContent = core.formatMoney(totals[item.key], state.config);
      byId("kpi-" + item.key + "-sub").textContent = String(counts[item.key] || 0) + " sessions";
    });
  }

  function renderLast7(summary) {
    var series = safeArray(summary.last7);
    var bars = byId("last7Bars");
    var labels = byId("last7Labels");
    if (!bars || !labels) {
      return;
    }
    bars.innerHTML = "";
    labels.innerHTML = "";
    if (!series.length) {
      bars.innerHTML = '<div class="empty-state">Recent revenue will appear here once sessions begin.</div>';
      return;
    }
    var max = Math.max.apply(null, series.map(function (item) { return Number(item.total || 0); }).concat([1]));
    series.forEach(function (item) {
      var bar = document.createElement("div");
      bar.className = "chart-bar";
      bar.style.height = Math.max(16, (Number(item.total || 0) / max) * 220) + "px";
      bar.title = item.date + " • " + core.formatMoney(item.total, state.config);
      bars.appendChild(bar);

      var label = document.createElement("div");
      label.className = "chart-label";
      label.textContent = item.date ? item.date.slice(5) : "--";
      labels.appendChild(label);
    });
  }

  function renderChargerTotals(summary) {
    var list = byId("chargerTotalsList");
    if (!list) {
      return;
    }
    var performance = currentPerformance(summary).slice(0, 5);
    list.innerHTML = "";
    if (!performance.length) {
      list.innerHTML = '<div class="empty-state">No bay totals yet. Transactions will populate this view automatically.</div>';
      return;
    }
    performance.forEach(function (item) {
      var bay = core.findCharger(state.directory, item.boxNum);
      var tile = document.createElement("article");
      tile.className = "charger-tile";
      tile.innerHTML =
        '<div class="charger-head"><strong>' + (bay ? core.labelForCharger(charger) : item.label) + '</strong><span class="soft">' +
          core.formatMoney(item.revenue, state.config) + "</span></div>" +
        '<span class="muted">' + [bay ? charger.chargerId : item.chargerId, bay ? charger.location : "", bay ? charger.connector : ""].filter(Boolean).join(" • ") + "</span>" +
        '<div class="pill-row">' +
          '<span class="pill"><strong>' + String(item.sessions || 0) + '</strong> sessions</span>' +
          '<span class="pill"><strong>' + core.formatMoney(item.avgTicket || 0, state.config) + '</strong> avg</span>' +
        "</div>";
      list.appendChild(tile);
    });
  }

  function renderChargerPerformance(summary) {
    var list = byId("performanceList");
    if (!list) {
      return;
    }
    var performance = currentPerformance(summary);
    list.innerHTML = "";
    if (!performance.length) {
      list.innerHTML = '<div class="empty-state">Bay performance appears here once the network starts processing sessions.</div>';
      return;
    }
    var max = Math.max.apply(null, performance.map(function (item) { return Number(item.revenue || 0); }).concat([1]));
    performance.forEach(function (item) {
      var bay = core.findCharger(state.directory, item.boxNum);
      var label = bay ? core.labelForCharger(charger) : item.label;
      var fill = Math.max(6, (Number(item.revenue || 0) / max) * 100);
      var row = document.createElement("article");
      row.className = "performance-row";
      row.innerHTML =
        '<div class="performance-head"><div><strong>' + label + '</strong><div class="muted">' +
          [bay ? charger.chargerId : item.chargerId, bay ? charger.location : "", bay ? (charger.powerKw ? charger.powerKw + "kW" : "") : ""].filter(Boolean).join(" • ") +
          '</div></div><div class="metric-value" style="font-size:1.8rem">' + core.formatMoney(item.revenue, state.config) + "</div></div>" +
        '<div class="performance-track"><div class="performance-fill" style="width:' + fill + '%"></div></div>' +
        '<div class="performance-meta">' +
          '<span>' + String(item.sessions || 0) + ' sessions</span>' +
          '<span>' + core.formatMoney(item.avgTicket || 0, state.config) + ' average paid amount</span>' +
          '<span>' + core.formatPercent(item.successRate || 0, 0) + ' success rate</span>' +
          '<span>' + core.formatRelativeTime(item.lastSeen) + ' last activity</span>' +
        "</div>";
      list.appendChild(row);
    });
  }

  function renderForecast(summary) {
    var list = byId("forecastList");
    if (!list) {
      return;
    }
    var forecast = safeArray(summary.revenueForecast);
    list.innerHTML = "";
    if (!forecast.length) {
      list.innerHTML = '<div class="empty-state">Forecasts become more useful after a few live trading days.</div>';
      return;
    }
    forecast.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "forecast-row";
      row.innerHTML = '<span>' + item.label + '</span><strong>' + core.formatMoney(item.total, state.config) + "</strong>";
      list.appendChild(row);
    });
  }

  function renderDemand(summary) {
    var bars = byId("demandBars");
    var labels = byId("demandLabels");
    if (!bars || !labels) {
      return;
    }
    var hourly = safeArray(summary.demandByHour);
    bars.innerHTML = "";
    labels.innerHTML = "";
    if (!hourly.length) {
      bars.innerHTML = '<div class="empty-state">Hourly charging demand will appear here once transactions are flowing.</div>';
      return;
    }
    var slices = [];
    for (var bucket = 0; bucket < 8; bucket += 1) {
      var start = bucket * 3;
      var end = start + 2;
      var total = hourly
        .filter(function (item) { return item.hour >= start && item.hour <= end; })
        .reduce(function (sum, item) { return sum + Number(item.sessions || item.count || 0); }, 0);
      slices.push({ label: start + ":00-" + end + ":59", total: total });
    }
    var max = Math.max.apply(null, slices.map(function (item) { return item.total; }).concat([1]));
    slices.forEach(function (item) {
      var bar = document.createElement("div");
      bar.className = "mini-bar";
      bar.style.height = Math.max(16, (item.total / max) * 220) + "px";
      bar.title = item.label + " • " + item.total + " sessions";
      bars.appendChild(bar);

      var label = document.createElement("div");
      label.className = "chart-label";
      label.textContent = item.label.replace(":00", "");
      labels.appendChild(label);
    });
  }

  function renderHeatmap(summary) {
    var grid = byId("heatmapGrid");
    var peaks = byId("peakPills");
    if (!grid || !peaks) {
      return;
    }
    var heatmap = safeArray(summary.heatmap);
    var peakHours = safeArray(summary.peakHours);
    grid.innerHTML = "";
    peaks.innerHTML = "";
    if (!heatmap.length) {
      grid.innerHTML = '<div class="empty-state">Peak-hour intelligence appears after live sessions have built up.</div>';
      return;
    }
    var max = Math.max.apply(null, heatmap.map(function (item) { return Number(item.sessions || item.count || 0); }).concat([1]));
    heatmap.forEach(function (item) {
      var sessions = Number(item.sessions || item.count || 0);
      var intensity = sessions / max;
      var cell = document.createElement("div");
      cell.className = "heat-cell";
      cell.style.background = "rgba(18, 133, 88, " + (0.08 + intensity * 0.36) + ")";
      cell.innerHTML = "<strong>" + item.label + "</strong><span>" + sessions + " sessions</span>";
      grid.appendChild(cell);
    });
    peakHours.forEach(function (item) {
      var pill = document.createElement("span");
      pill.className = "peak-pill";
      pill.textContent = item.label + " • " + item.sessions + " sessions";
      peaks.appendChild(pill);
    });
  }

  function renderStatusChips(transactions) {
    var grid = byId("statusChipRow");
    if (!grid) {
      return;
    }
    var latestByBay = {};
    safeArray(transactions).forEach(function (item) {
      if (!item.boxNum) {
        return;
      }
      var key = String(item.boxNum);
      if (!latestByCharger[key] || new Date(item.createdAt).getTime() > new Date(latestByCharger[key].createdAt).getTime()) {
        latestByCharger[key] = item;
      }
    });
    grid.innerHTML = "";
    state.directory.forEach(function (charger) {
      var latest = latestByCharger[String(charger.boxNum)];
      var statusClass = "warn";
      var statusText = "Idle";
      var meta = charger.chargerId + " • No recent sessions";
      if (latest) {
        var minutesAgo = (Date.now() - new Date(latest.createdAt).getTime()) / 60000;
        if (String(latest.status || "").toLowerCase() === "failed") {
          statusClass = "bad";
          statusText = "Needs check";
          meta = charger.chargerId + " • Last start failed";
        } else if (minutesAgo <= Number(state.config.dashboard.alertIdleMinutes || 90)) {
          statusClass = "ok";
          statusText = "Online";
          meta = charger.chargerId + " • " + core.formatRelativeTime(latest.createdAt);
        } else {
          statusClass = "warn";
          statusText = "Quiet";
          meta = charger.chargerId + " • " + core.formatRelativeTime(latest.createdAt);
        }
      }
      var chip = document.createElement("article");
      chip.className = "status-chip " + statusClass;
      chip.innerHTML =
        '<span class="label">' + (charger.siteId || state.config.site.siteId) + "</span>" +
        "<strong>" + core.labelForCharger(charger) + "</strong>" +
        '<span class="muted">' + statusText + "</span>" +
        '<span class="soft">' + meta + "</span>";
      grid.appendChild(chip);
    });
  }

  function idleAlerts(transactions) {
    var latestByBay = {};
    safeArray(transactions).forEach(function (item) {
      if (!item.boxNum) {
        return;
      }
      var key = String(item.boxNum);
      if (!latestByCharger[key] || new Date(item.createdAt).getTime() > new Date(latestByCharger[key].createdAt).getTime()) {
        latestByCharger[key] = item;
      }
    });
    return state.directory
      .map(function (charger) {
        var latest = latestByCharger[String(charger.boxNum)];
        if (!latest) {
          return {
            title: core.labelForCharger(charger),
            body: "No paid sessions recorded yet for this charger.",
          };
        }
        var minutesAgo = (Date.now() - new Date(latest.createdAt).getTime()) / 60000;
        if (minutesAgo <= Number(state.config.dashboard.alertIdleMinutes || 90)) {
          return null;
        }
        return {
          title: core.labelForCharger(charger),
          body: "No recent successful session. Last seen " + core.formatRelativeTime(latest.createdAt) + ".",
        };
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  function renderAlerts(apiAlerts, transactions) {
    var list = byId("alertList");
    if (!list) {
      return;
    }
    var alerts = [];
    safeArray(apiAlerts).forEach(function (item) {
      var bay = core.findCharger(state.directory, item.boxNum);
      alerts.push({
        title: bay ? core.labelForCharger(charger) : "Bay " + item.boxNum,
        body: item.error || "The charging start request failed and needs checking.",
      });
    });
    idleAlerts(transactions).forEach(function (alert) {
      alerts.push(alert);
    });
    list.innerHTML = "";
    if (!alerts.length) {
      list.innerHTML = '<div class="empty-state">No active alerts. The charging estate looks healthy.</div>';
      return;
    }
    alerts.slice(0, 8).forEach(function (alert) {
      var card = document.createElement("article");
      card.className = "alert-card";
      card.innerHTML = "<strong>" + alert.title + "</strong><p class='muted'>" + alert.body + "</p>";
      list.appendChild(card);
    });
  }

  function renderTransactions(items) {
    var body = byId("transactionsBody");
    if (!body) {
      return;
    }
    body.innerHTML = "";
    if (!safeArray(items).length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state">No transactions yet.</div></td></tr>';
      return;
    }
    items.forEach(function (item) {
      var bay = core.findCharger(state.directory, item.boxNum);
      var row = document.createElement("tr");
      var statusClass = String(item.status || "").toLowerCase() === "failed" ? "table-status fail" : "table-status";
      row.innerHTML =
        "<td><strong>" + core.formatDate(item.createdAt) + "</strong></td>" +
        "<td><strong>" + (bay ? core.labelForCharger(charger) : ("Bay " + item.boxNum)) + "</strong><br><span class='soft'>" + (bay ? charger.siteId : state.config.site.siteId) + "</span></td>" +
        "<td><strong>" + core.formatMoney(item.amount, state.config) + "</strong><br><span class='soft'>" + core.formatMoney(item.creditAmount || item.amount, state.config) + " delivered</span></td>" +
        "<td>" + (item.payId || "Pending") + "</td>" +
        "<td><span class='" + statusClass + "'>" + (item.status || "started") + "</span></td>" +
        "<td>" + (item.error || "OK") + "</td>";
      body.appendChild(row);
    });
  }

  function median(values) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    if (!sorted.length) {
      return 0;
    }
    var midpoint = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  }

  function recommendBonusPack(transactions) {
    var amounts = safeArray(transactions)
      .filter(function (item) { return String(item.status || "").toLowerCase() !== "failed"; })
      .map(function (item) { return Number(item.amount || 0); })
      .filter(function (value) { return Number.isFinite(value) && value > 0; });
    if (amounts.length < 3 || !state.bonusPacks.length) {
      return null;
    }
    var midpoint = median(amounts);
    var chosen = state.bonusPacks.reduce(function (best, pack) {
      if (!best) {
        return pack;
      }
      return Math.abs(Number(pack.pay) - midpoint) < Math.abs(Number(best.pay) - midpoint) ? pack : best;
    }, null);
    return {
      pack: chosen,
      median: midpoint,
    };
  }

  function renderPromotionControls() {
    var packRow = byId("promotionPackRow");
    packRow.innerHTML = "";
    state.bonusPacks.forEach(function (pack) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "ghost-button" + (Number(pack.pay) === Number(state.bonusPack) ? " active" : "");
      button.textContent = core.formatMoney(pack.pay, state.config) + " → " + core.formatMoney(pack.credit, state.config);
      button.addEventListener("click", function () {
        state.bonusPack = pack.pay;
        renderPromotionControls();
      });
      packRow.appendChild(button);
    });

    byId("promotionEnabled").checked = state.bonusEnabled;
    byId("promotionMode").value = state.bonusMode;
    byId("promotionDisplay").value = state.bonusDisplayMode;
    byId("promotionChargers").value = state.directory.map(function (charger) { return charger.boxNum; }).join(",");
    if (state.latestRecommendation && state.latestRecommendation.pack) {
      byId("promotionRecommendation").textContent =
        "Recommended pack: " +
        core.formatMoney(state.latestRecommendation.pack.pay, state.config) +
        " → " +
        core.formatMoney(state.latestRecommendation.pack.credit, state.config) +
        " based on a median session of " +
        core.formatMoney(state.latestRecommendation.median, state.config) +
        ".";
    } else {
      byId("promotionRecommendation").textContent = "Recommendations appear once live session data is available.";
    }
  }

  function renderUsers() {
    var list = byId("userList");
    list.innerHTML = "";
    getUsers().forEach(function (user, index) {
      var card = document.createElement("article");
      card.className = "user-card";
      card.innerHTML = "<div><strong>" + user.name + "</strong><div class='muted'>" + user.role + "</div></div>";
      var actions = document.createElement("div");
      actions.className = "button-row";

      var reset = document.createElement("button");
      reset.type = "button";
      reset.className = "ghost-button";
      reset.textContent = "Reset PIN";
      reset.addEventListener("click", function () {
        var next = getUsers();
        var generated = String(Math.floor(1000 + Math.random() * 9000));
        next[index].pin = generated;
        setUsers(next);
        setSettingsStatus("accessSaveStatus", user.name + " new PIN: " + generated, false);
      });

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost-button";
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        var next = getUsers().filter(function (_item, itemIndex) { return itemIndex !== index; });
        setUsers(next.length ? next : defaultUsers());
        renderUsers();
      });

      actions.appendChild(reset);
      if (user.role !== "owner" || getUsers().length > 1) {
        actions.appendChild(remove);
      }
      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  function renderStaffVisibility() {
    document.querySelectorAll("[data-staff-toggle]").forEach(function (input) {
      var key = input.getAttribute("data-staff-toggle");
      input.checked = state.staffVisibility[key] !== false;
    });
  }

  function applyRole() {
    var role = currentRole();
    document.querySelectorAll("[data-section]").forEach(function (section) {
      if (role === "owner") {
        section.classList.remove("hidden");
        return;
      }
      var key = section.getAttribute("data-section");
      section.classList.toggle("hidden", state.staffVisibility[key] === false);
    });
    byId("adminArea").classList.toggle("hidden", role !== "owner");
  }

  async function saveRemoteSettings(statusId) {
    if (state.demoMode) {
      state.settings = {
        bonusEnabled: state.bonusEnabled,
        bonusMode: state.bonusMode,
        bonusDisplayMode: state.bonusDisplayMode,
        bonusPack: state.bonusPack,
        bonusPacks: state.bonusPacks,
        bays: state.directory.map(function (charger) { return charger.boxNum; }),
        staffVisibility: state.staffVisibility,
      };
      applySettings();
      renderPromotionControls();
      renderStaffVisibility();
      applyRole();
      setSettingsStatus(statusId, "Updated in demo mode only.", false);
      return;
    }
    try {
      var payload = {
        bonusEnabled: state.bonusEnabled,
        bonusMode: state.bonusMode,
        bonusDisplayMode: state.bonusDisplayMode,
        bonusPack: state.bonusMode === "recommended" && state.latestRecommendation && state.latestRecommendation.pack
          ? state.latestRecommendation.pack.pay
          : state.bonusPack,
        bonusPacks: state.bonusPacks,
        bays: state.directory.map(function (charger) { return charger.boxNum; }),
        staffVisibility: state.staffVisibility,
        pin: getAdminPin(),
      };
      var apiBase = await core.resolveApiBase(state.config);
      state.settings = await core.fetchJson((apiBase || "") + "/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      applySettings();
      renderPromotionControls();
      renderStaffVisibility();
      applyRole();
      setSettingsStatus(statusId, "Saved to the live operator experience.", false);
    } catch (error) {
      setSettingsStatus(statusId, error.message || "Unable to save settings.", true);
    }
  }

  async function loadRemoteSettings() {
    if (state.demoMode) {
      state.settings = (window.SCUDO_DEMO_DATA && window.SCUDO_DEMO_DATA.settings) || {};
      return;
    }
    try {
      var apiBase = await core.resolveApiBase(state.config);
      state.settings = await core.fetchJson((apiBase || "") + "/api/settings");
    } catch (_error) {
      state.settings = {};
    }
  }

  function applySettings() {
    state.directory = core.getChargerDirectory(state.config, state.settings);
    state.bonusEnabled = typeof state.settings.bonusEnabled === "boolean" ? state.settings.bonusEnabled : false;
    state.bonusMode = state.settings.bonusMode === "recommended" ? "recommended" : "manual";
    state.bonusDisplayMode = state.settings.bonusDisplayMode === "all" ? "all" : "selected";
    state.bonusPack = Number(state.settings.bonusPack || 0) || null;
    state.bonusPacks = Array.isArray(state.settings.bonusPacks) && state.settings.bonusPacks.length
      ? state.settings.bonusPacks.map(function (pack) {
        return { pay: Number(pack.pay), credit: Number(pack.credit) };
      })
      : safeArray(state.config.promotions.defaultPacks).map(function (pack) {
        return { pay: Number(pack.pay), credit: Number(pack.credit) };
      });
    state.staffVisibility = core.normalizeStaffVisibility(state.settings.staffVisibility);
    renderFilters();
  }

  function renderFilters() {
    var select = byId("filterBay");
    if (!select) {
      return;
    }
    var current = select.value;
    select.innerHTML = '<option value="">All bays</option>';
    state.directory.forEach(function (charger) {
      var option = document.createElement("option");
      option.value = charger.boxNum;
      option.textContent = core.labelForCharger(charger) + " • " + charger.chargerId;
      select.appendChild(option);
    });
    if (current) {
      select.value = current;
    }
  }

  async function updateApiStatus() {
    var badge = byId("apiBadge");
    var label = byId("apiBadgeText");
    if (!badge || !label) {
      return;
    }
    badge.classList.remove("online", "offline");
    label.textContent = "Checking API";
    if (state.demoMode) {
      badge.classList.add("online");
      label.textContent = "Demo data";
      return;
    }
    try {
      var apiBase = await core.resolveApiBase(state.config);
      await core.fetchJson((apiBase || "") + "/api/health");
      badge.classList.add("online");
      label.textContent = "API online";
    } catch (_error) {
      badge.classList.add("offline");
      label.textContent = "API offline";
    }
  }

  async function loadDashboard() {
    if (state.demoMode) {
      var allDemoTransactions = demoTransactions();
      var filteredDemoTransactions = filterTransactionsForView(allDemoTransactions);
      var demoSummary = buildDemoSummary(filteredDemoTransactions, allDemoTransactions);
      var demoAlerts = buildDemoAlerts(filteredDemoTransactions, allDemoTransactions);
      state.latestTransactions = filteredDemoTransactions.slice(0, Number(state.config.dashboard.recentTransactionsLimit || 50));
      state.latestRecommendation = recommendBonusPack(allDemoTransactions);

      renderNetworkCards(demoSummary);
      renderKpis(demoSummary);
      renderLast7(demoSummary);
      renderChargerTotals(demoSummary);
      renderChargerPerformance(demoSummary);
      renderForecast(demoSummary);
      renderDemand(demoSummary);
      renderHeatmap(demoSummary);
      renderStatusChips(allDemoTransactions);
      renderAlerts(demoAlerts, allDemoTransactions);
      renderTransactions(state.latestTransactions);
      renderPromotionControls();
      byId("dashboardError").classList.add("hidden");
      return;
    }
    try {
      var apiBase = await core.resolveApiBase(state.config);
      var query = buildQuery();
      var summary = await core.fetchJson((apiBase || "") + "/api/dashboard/summary" + query);
      var limit = Number(state.config.dashboard.recentTransactionsLimit || 50);
      var transactions = await core.fetchJson((apiBase || "") + "/api/dashboard/transactions" + (query ? query + "&limit=" + limit : "?limit=" + limit));
      var alerts = await core.fetchJson((apiBase || "") + "/api/dashboard/alerts" + (query ? query + "&limit=10" : "?limit=10"));
      var healthTransactions = await core.fetchJson((apiBase || "") + "/api/dashboard/transactions?limit=200");

      state.latestTransactions = safeArray(transactions.items);
      state.latestRecommendation = recommendBonusPack(healthTransactions.items);

      renderNetworkCards(summary);
      renderKpis(summary);
      renderLast7(summary);
      renderChargerTotals(summary);
      renderChargerPerformance(summary);
      renderForecast(summary);
      renderDemand(summary);
      renderHeatmap(summary);
      renderStatusChips(healthTransactions.items);
      renderAlerts(alerts.items, healthTransactions.items);
      renderTransactions(transactions.items);
      renderPromotionControls();
      byId("dashboardError").classList.add("hidden");
    } catch (error) {
      byId("dashboardError").classList.remove("hidden");
      byId("dashboardErrorText").textContent = error.message || "Dashboard data could not be loaded.";
    }
  }

  function populateBrandSurface() {
    core.populateBrandTokens(document, state.config);
    core.applyTheme(state.config);
    document.title = state.config.operatorName + " | " + state.config.dashboard.title;
    byId("heroSiteMeta").textContent = [
      state.config.site.name,
      state.config.site.siteId,
      state.config.site.region,
    ].filter(Boolean).join(" • ");
  }

  function bindFilters() {
    byId("applyFilters").addEventListener("click", loadDashboard);
    byId("clearFilters").addEventListener("click", function () {
      byId("filterBay").value = "";
      byId("filterStart").value = "";
      byId("filterEnd").value = "";
      loadDashboard();
    });
    byId("printDaily").addEventListener("click", function () {
      var today = new Date();
      var todayKey = today.toISOString().slice(0, 10);
      byId("filterStart").value = todayKey;
      byId("filterEnd").value = todayKey;
      loadDashboard().then(function () {
        window.print();
      });
    });
    byId("exportCsv").addEventListener("click", async function () {
      if (state.demoMode) {
        var rows = [["createdAt", "boxNum", "amount", "creditAmount", "bonusAmount", "payId", "status", "error"]];
        filterTransactionsForView(demoTransactions()).forEach(function (item) {
          rows.push([
            item.createdAt,
            item.boxNum,
            item.amount,
            item.creditAmount,
            item.bonusAmount || 0,
            item.payId || "",
            item.status || "",
            item.error || "",
          ]);
        });
        var csv = rows.map(function (row) {
          return row.map(function (value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
          }).join(",");
        }).join("\n");
        var blob = new Blob([csv], { type: "text/csv" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "scudocharge-demo-transactions.csv";
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      var apiBase = await core.resolveApiBase(state.config);
      window.open((apiBase || "") + "/api/dashboard/transactions.csv" + buildQuery(), "_blank");
    });
    byId("logoutButton").addEventListener("click", logout);
    byId("refreshButton").addEventListener("click", loadDashboard);
  }

  function bindPromotionControls() {
    byId("promotionEnabled").addEventListener("change", function (event) {
      state.bonusEnabled = event.target.checked;
    });
    byId("promotionMode").addEventListener("change", function (event) {
      state.bonusMode = event.target.value;
    });
    byId("promotionDisplay").addEventListener("change", function (event) {
      state.bonusDisplayMode = event.target.value;
    });
    byId("applyRecommendation").addEventListener("click", function () {
      if (state.latestRecommendation && state.latestRecommendation.pack) {
        state.bonusMode = "recommended";
        state.bonusPack = state.latestRecommendation.pack.pay;
        renderPromotionControls();
      }
    });
    byId("savePromotionSettings").addEventListener("click", function () {
      var chargerList = byId("promotionChargers").value
        .split(",")
        .map(function (value) { return value.trim(); })
        .filter(Boolean);
      if (chargerList.length) {
        state.directory = state.directory
          .filter(function (charger) { return chargerList.indexOf(String(charger.boxNum)) !== -1; })
          .concat(chargerList
            .filter(function (boxNum) { return !core.findCharger(state.directory, boxNum); })
            .map(function (boxNum) { return { boxNum: boxNum, chargerId: "CH-" + boxNum, label: "Bay " + boxNum, siteId: state.config.site.siteId }; }));
      }
      saveRemoteSettings("promotionSaveStatus");
    });
  }

  function bindAccessControls() {
    document.querySelectorAll("[data-staff-toggle]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.staffVisibility[input.getAttribute("data-staff-toggle")] = input.checked;
        applyRole();
      });
    });

    byId("saveStaffAccess").addEventListener("click", function () {
      saveRemoteSettings("accessSaveStatus");
    });

    byId("addUser").addEventListener("click", function () {
      var name = byId("newUserName").value.trim();
      var pin = byId("newUserPin").value.trim();
      var role = byId("newUserRole").value;
      if (!name || !pin) {
        setSettingsStatus("accessSaveStatus", "Enter both a user name and PIN.", true);
        return;
      }
      var users = getUsers();
      users.push({ name: name, pin: pin, role: role || "staff" });
      setUsers(users);
      byId("newUserName").value = "";
      byId("newUserPin").value = "";
      renderUsers();
      setSettingsStatus("accessSaveStatus", "User added.", false);
    });

    byId("saveAdminPin").addEventListener("click", function () {
      var pin = byId("adminPin").value.trim();
      if (!pin) {
        setSettingsStatus("accessSaveStatus", "Enter an admin PIN.", true);
        return;
      }
      setAdminPin(pin);
      var users = getUsers();
      var owner = users.find(function (user) { return user.role === "owner"; });
      if (owner) {
        owner.pin = pin;
        setUsers(users);
      }
      byId("adminPin").value = "";
      setSettingsStatus("accessSaveStatus", "Admin PIN updated for this dashboard.", false);
    });
  }

  function bindLogin() {
    function unlock() {
      var entered = byId("pinInput").value.trim();
      var users = getUsers();
      var match = users.find(function (user) { return String(user.pin) === entered; });
      if (!match && entered === getAdminPin()) {
        match = { role: "owner" };
      }
      if (!match) {
        byId("loginError").textContent = "Invalid PIN";
        return;
      }
      markUnlocked(match.role || "staff");
      byId("loginScreen").classList.add("hidden");
      byId("loginError").textContent = "";
      applyRole();
      loadDashboard();
    }
    byId("unlockDashboard").addEventListener("click", unlock);
    byId("pinInput").addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        unlock();
      }
    });
  }

  async function init() {
    state.config = await core.getConfig();
    populateBrandSurface();
    if (!state.demoMode) {
      bindLogin();
    }
    bindFilters();
    bindPromotionControls();
    bindAccessControls();
    renderUsers();
    await loadRemoteSettings();
    applySettings();
    renderStaffVisibility();
    applyRole();
    updateApiStatus();

    if (state.demoMode) {
      markUnlocked("owner");
      byId("loginScreen").classList.add("hidden");
      byId("logoutButton").style.display = "none";
      applyRole();
      loadDashboard();
      return;
    }

    if (localStorage.getItem(STORAGE_KEYS.unlocked) === "true") {
      byId("loginScreen").classList.add("hidden");
      applyRole();
      loadDashboard();
    }

    if (state.dashboardTimer) {
      window.clearInterval(state.dashboardTimer);
    }
    state.dashboardTimer = window.setInterval(function () {
      if (localStorage.getItem(STORAGE_KEYS.unlocked) === "true") {
        updateApiStatus();
        loadDashboard();
      }
    }, Number(state.config.dashboard.refreshMs || 60000));
  }

  window.addEventListener("DOMContentLoaded", init);
})();
