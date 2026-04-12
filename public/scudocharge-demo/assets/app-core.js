(function () {
  var apiBaseReady = null;
  var remoteConfigReady = null;

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function deepMerge(target) {
    var output = isObject(target) ? target : {};
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
      if (!isObject(source)) {
        return;
      }
      Object.keys(source).forEach(function (key) {
        var current = source[key];
        if (Array.isArray(current)) {
          output[key] = current.slice();
          return;
        }
        if (isObject(current)) {
          output[key] = deepMerge(isObject(output[key]) ? output[key] : {}, current);
          return;
        }
        output[key] = current;
      });
    });
    return output;
  }

  function getBaseConfig() {
    return isObject(window.SCUDO_OPERATOR_CONFIG) ? clone(window.SCUDO_OPERATOR_CONFIG) : {};
  }

  function getConfigValue(config, path, fallback) {
    var value = path.split(".").reduce(function (current, key) {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, config);
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  function getInitials(name, fallback) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) {
      return fallback || "SC";
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function normalizeTheme(config) {
    var presetName = config.themePreset || "green";
    var presets = isObject(config.themePresets) ? config.themePresets : {};
    var preset = isObject(presets[presetName]) ? presets[presetName] : {};
    config.theme = deepMerge({}, preset, config.theme || {});
    return config;
  }

  function normalizeConfig(config) {
    var next = normalizeTheme(config || {});
    next.operatorName = next.operatorName || "Scudo Charge";
    next.productName = next.productName || next.operatorName;
    next.tagline = next.tagline || "Premium EV charging operations";
    next.monogram = next.monogram || getInitials(next.operatorName, "SC");
    next.api = deepMerge({ baseUrl: "", fallbacks: [] }, next.api || {});
    next.operator = deepMerge(
      {
        supportEmail: "support@example.com",
        supportPhone: "+44 20 0000 0000",
        supportHours: "24/7 support",
        website: "",
      },
      next.operator || {},
    );
    next.site = deepMerge(
      {
        name: "Primary Charging Hub",
        siteId: "SITE-01",
        region: "United Kingdom",
        location: "",
        timezone: "Europe/London",
        liveStatus: "Live operations",
      },
      next.site || {},
    );
    next.payment = deepMerge(
      {
        pageTitle: "Start an EV charging session",
        eyebrow: "Secure session payment",
        minAmount: 4,
        maxAmount: 80,
        defaultAmount: 12,
        amountStep: 1,
        presetAmounts: [8, 12, 20, 35, 50],
        ctaLabel: "Continue to secure checkout",
        amountHint: "Choose a prepaid charging amount.",
        instructions: [],
        acceptedPayments: ["Card"],
        successTitle: "Charging credit authorised",
        successBody: "The charging command has been accepted.",
        footerNote: "Secure checkout",
        footerMeta: "",
      },
      next.payment || {},
    );
    next.promotions = deepMerge(
      {
        title: "Charging boost",
        note: "Optional promotional credit",
        badge: "Promotional credit available",
        defaultPacks: [],
      },
      next.promotions || {},
    );
    next.dashboard = deepMerge(
      {
        title: "Charging operations dashboard",
        subtitle: "Revenue and charger visibility",
        alertIdleMinutes: 90,
        refreshMs: 60000,
        recentTransactionsLimit: 50,
        forecastDays: 7,
      },
      next.dashboard || {},
    );
    next.chargerDirectory = Array.isArray(next.chargerDirectory) ? next.chargerDirectory.slice() : [];
    return next;
  }

  function currencyCode(config) {
    return String(getConfigValue(config, "payment.currency", "GBP")).toUpperCase();
  }

  function formatMoney(value, config) {
    var amount = Number(value || 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode(config),
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (_error) {
      return "£" + amount.toFixed(2);
    }
  }

  function formatCompactNumber(value) {
    return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function formatPercent(value, digits) {
    return (Number(value || 0) * 100).toFixed(digits === undefined ? 0 : digits) + "%";
  }

  function formatDate(value, options) {
    if (!value) {
      return "Unknown";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }
    return date.toLocaleString(undefined, options || {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelativeTime(value) {
    if (!value) {
      return "No activity";
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "No activity";
    }
    var diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (diffMinutes < 1) {
      return "Just now";
    }
    if (diffMinutes < 60) {
      return diffMinutes + "m ago";
    }
    if (diffMinutes < 1440) {
      return Math.floor(diffMinutes / 60) + "h ago";
    }
    return Math.floor(diffMinutes / 1440) + "d ago";
  }

  function toDateKey(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 10);
  }

  function resolveTheme(config) {
    return normalizeConfig(config).theme;
  }

  function applyTheme(config) {
    var theme = resolveTheme(config);
    var root = document.documentElement;
    Object.keys(theme).forEach(function (key) {
      root.style.setProperty("--" + key.replace(/[A-Z]/g, function (match) {
        return "-" + match.toLowerCase();
      }), String(theme[key]));
    });
  }

  function buildMark(config) {
    var logoUrl = getConfigValue(config, "logoUrl", "");
    var monogram = getConfigValue(config, "monogram", getInitials(getConfigValue(config, "operatorName", "Scudo Charge"), "SC"));
    if (logoUrl) {
      return '<img src="' + logoUrl + '" alt="' + getConfigValue(config, "operatorName", "Operator") + ' logo" />';
    }
    return '<span>' + monogram + "</span>";
  }

  function populateBrandTokens(root, config) {
    var context = root || document;
    var values = {
      operatorName: getConfigValue(config, "operatorName", "Scudo Charge"),
      productName: getConfigValue(config, "productName", "Scudo Charge Command"),
      tagline: getConfigValue(config, "tagline", "Premium EV charging operations"),
      supportEmail: getConfigValue(config, "operator.supportEmail", ""),
      supportPhone: getConfigValue(config, "operator.supportPhone", ""),
      supportHours: getConfigValue(config, "operator.supportHours", ""),
      siteName: getConfigValue(config, "site.name", "Primary Charging Hub"),
      siteId: getConfigValue(config, "site.siteId", "SITE-01"),
      siteRegion: getConfigValue(config, "site.region", ""),
      siteLocation: getConfigValue(config, "site.location", ""),
      liveStatus: getConfigValue(config, "site.liveStatus", ""),
      paymentTitle: getConfigValue(config, "payment.pageTitle", "Start an EV charging session"),
      paymentEyebrow: getConfigValue(config, "payment.eyebrow", "Secure session payment"),
      paymentFooterNote: getConfigValue(config, "payment.footerNote", ""),
      paymentFooterMeta: getConfigValue(config, "payment.footerMeta", ""),
      dashboardTitle: getConfigValue(config, "dashboard.title", "Charging operations dashboard"),
      dashboardSubtitle: getConfigValue(config, "dashboard.subtitle", ""),
    };

    Object.keys(values).forEach(function (key) {
      context.querySelectorAll('[data-brand="' + key + '"]').forEach(function (node) {
        node.textContent = values[key];
      });
    });

    context.querySelectorAll("[data-brand-mark]").forEach(function (node) {
      node.innerHTML = buildMark(config);
    });
  }

  function getOriginCandidates(config) {
    var candidates = [];
    var origin = window.location && window.location.origin && window.location.origin !== "null"
      ? window.location.origin
      : "";
    var apexOrigin = origin && origin.indexOf("://www.") !== -1
      ? origin.replace("://www.", "://")
      : origin && origin.indexOf("://www.") === -1 && origin.indexOf("://") !== -1
        ? origin.replace("://", "://www.")
        : "";

    if (origin) {
      candidates.push(origin);
    }
    if (apexOrigin && apexOrigin !== origin) {
      candidates.push(apexOrigin);
    }
    if (window.SCUDO_API_BASE_URL) {
      candidates.push(window.SCUDO_API_BASE_URL);
    }
    if (window.LUXWASH_API_BASE_URL) {
      candidates.push(window.LUXWASH_API_BASE_URL);
    }

    var configBase = getConfigValue(config, "api.baseUrl", "");
    if (configBase) {
      candidates.push(configBase);
    }

    var fallbacks = getConfigValue(config, "api.fallbacks", []);
    if (Array.isArray(fallbacks)) {
      candidates = candidates.concat(fallbacks);
    }

    candidates.push("http://127.0.0.1:3000");
    candidates.push("http://localhost:3000");

    return Array.from(new Set(candidates.filter(Boolean)));
  }

  async function fetchJson(url, options) {
    var response;
    try {
      response = await fetch(url, deepMerge({ cache: "no-store" }, options || {}));
    } catch (_error) {
      throw new Error("Unable to reach the operator API");
    }
    var text = await response.text();
    var payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch (_error) {
      payload = { error: text || "Unexpected API response" };
    }
    if (!response.ok) {
      throw new Error(payload.error || "API request failed");
    }
    return payload;
  }

  async function resolveApiBase(config) {
    if (apiBaseReady) {
      return apiBaseReady;
    }
    apiBaseReady = (async function () {
      try {
        var sameOrigin = await fetch("/api/health", { cache: "no-store" });
        if (sameOrigin.ok) {
          return "";
        }
      } catch (_error) {}

      var candidates = getOriginCandidates(config);
      for (var index = 0; index < candidates.length; index += 1) {
        var base = String(candidates[index] || "").replace(/\/+$/, "");
        try {
          var response = await fetch(base + "/api/health", { cache: "no-store" });
          if (response.ok) {
            return base;
          }
        } catch (_error) {}
      }

      apiBaseReady = null;
      return "";
    })();
    return apiBaseReady;
  }

  async function loadRemoteConfig(config) {
    if (window.SCUDO_DEMO_MODE) {
      return {};
    }
    if (remoteConfigReady) {
      return remoteConfigReady;
    }
    remoteConfigReady = (async function () {
      try {
        var base = await resolveApiBase(config);
        if (!base && window.location.origin === "null") {
          return {};
        }
        return await fetchJson((base || "") + "/api/operator/config");
      } catch (_error) {
        remoteConfigReady = null;
        return {};
      }
    })();
    return remoteConfigReady;
  }

  async function getConfig() {
    var baseConfig = normalizeConfig(getBaseConfig());
    var remoteConfig = await loadRemoteConfig(baseConfig);
    var demoConfig = window.SCUDO_DEMO_DATA && isObject(window.SCUDO_DEMO_DATA.config)
      ? window.SCUDO_DEMO_DATA.config
      : {};
    return normalizeConfig(deepMerge({}, baseConfig, remoteConfig || {}, demoConfig));
  }

  function createFallbackCharger(boxNum, index, config) {
    var padded = String(index + 1).padStart(2, "0");
    return {
      boxNum: String(boxNum),
      chargerId: "CH-" + padded,
      label: "Charger " + padded,
      siteId: getConfigValue(config, "site.siteId", "SITE-01"),
      connector: "CCS",
      powerKw: null,
      location: "",
    };
  }

  function normalizeCharger(entry, index, config) {
    if (!entry) {
      return null;
    }
    var boxNum = entry.boxNum || entry.box_num || entry.id || entry.hardwareId;
    if (boxNum === undefined || boxNum === null || boxNum === "") {
      return null;
    }
    var fallback = createFallbackCharger(String(boxNum), index, config);
    return deepMerge({}, fallback, entry, { boxNum: String(boxNum) });
  }

  function getChargerDirectory(config, settings) {
    var baseDirectory = Array.isArray(config.chargerDirectory) ? config.chargerDirectory : [];
    var normalizedBase = baseDirectory
      .map(function (entry, index) { return normalizeCharger(entry, index, config); })
      .filter(Boolean);
    var configuredBoxes = Array.isArray(settings && settings.bays)
      ? settings.bays.map(String)
      : normalizedBase.map(function (entry) { return String(entry.boxNum); });
    var merged = {};

    normalizedBase.forEach(function (entry) {
      merged[String(entry.boxNum)] = entry;
    });

    configuredBoxes.forEach(function (boxNum, index) {
      if (!merged[String(boxNum)]) {
        merged[String(boxNum)] = createFallbackCharger(String(boxNum), index, config);
      }
    });

    return Object.keys(merged)
      .map(function (key, index) { return normalizeCharger(merged[key], index, config); })
      .filter(Boolean)
      .sort(function (a, b) {
        return String(a.boxNum).localeCompare(String(b.boxNum), undefined, { numeric: true });
      });
  }

  function findCharger(directory, value) {
    var target = String(value || "");
    if (!target) {
      return null;
    }
    return (directory || []).find(function (entry) {
      return String(entry.boxNum) === target || String(entry.chargerId) === target;
    }) || null;
  }

  function describeCharger(entry) {
    if (!entry) {
      return "";
    }
    var parts = [];
    if (entry.chargerId) {
      parts.push(entry.chargerId);
    }
    if (entry.connector) {
      parts.push(entry.connector);
    }
    if (entry.powerKw) {
      parts.push(String(entry.powerKw) + "kW");
    }
    if (entry.location) {
      parts.push(entry.location);
    }
    return parts.join(" • ");
  }

  function labelForCharger(entry, fallback) {
    if (!entry) {
      return fallback || "Select charger";
    }
    return entry.label || entry.chargerId || fallback || "Selected charger";
  }

  function normalizeStaffVisibility(value) {
    var defaults = {
      filters: true,
      revenue: true,
      charts: true,
      chargerPerformance: true,
      forecasts: true,
      heatmap: true,
      alerts: true,
      transactions: true,
    };

    var parsed = value;
    if (typeof value === "string") {
      try {
        parsed = JSON.parse(value);
      } catch (_error) {
        parsed = null;
      }
    }
    if (!isObject(parsed)) {
      return defaults;
    }
    return Object.keys(defaults).reduce(function (next, key) {
      if (typeof parsed[key] === "boolean") {
        next[key] = parsed[key];
        return next;
      }
      if (key === "chargerPerformance" && typeof parsed.bayPerformance === "boolean") {
        next[key] = parsed.bayPerformance;
        return next;
      }
      next[key] = defaults[key];
      return next;
    }, {});
  }

  window.ScudoCore = {
    applyTheme: applyTheme,
    deepMerge: deepMerge,
    describeCharger: describeCharger,
    findCharger: findCharger,
    formatCompactNumber: formatCompactNumber,
    formatDate: formatDate,
    formatMoney: formatMoney,
    formatPercent: formatPercent,
    formatRelativeTime: formatRelativeTime,
    getChargerDirectory: getChargerDirectory,
    getConfig: getConfig,
    getConfigValue: getConfigValue,
    getInitials: getInitials,
    labelForCharger: labelForCharger,
    normalizeStaffVisibility: normalizeStaffVisibility,
    populateBrandTokens: populateBrandTokens,
    resolveApiBase: resolveApiBase,
    fetchJson: fetchJson,
    toDateKey: toDateKey,
  };
})();
