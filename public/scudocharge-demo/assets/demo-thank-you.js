(function () {
  var core = window.ScudoCore;
  if (!core) {
    return;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback || 0);
  }

  function isFilePreview() {
    return window.location.protocol === "file:" || window.location.origin === "null" || window.location.origin === "file://";
  }

  function readStoredResult() {
    try {
      var raw = window.sessionStorage.getItem("scudoDemoCheckoutResult");
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function readQueryResult() {
    var params = new URLSearchParams(window.location.search);
    var amount = params.get("amount");
    var credit = params.get("credit");
    var boxNum = params.get("box_num");
    var payId = params.get("pay_id");
    if (!amount && !credit && !boxNum && !payId) {
      return null;
    }
    return {
      amount: toNumber(amount, 0),
      creditAmount: toNumber(credit, toNumber(amount, 0)),
      boxNum: boxNum ? String(boxNum) : "",
      payId: payId || "",
    };
  }

  function normaliseResult(config) {
    var result = readStoredResult() || readQueryResult() || {};
    var defaultAmount = Number(config.payment.defaultAmount || 12);
    return {
      amount: toNumber(result.amount, defaultAmount),
      creditAmount: toNumber(result.creditAmount, toNumber(result.amount, defaultAmount)),
      boxNum: result.boxNum ? String(result.boxNum) : "",
      payId: result.payId || "DEMO-" + String(Date.now()).slice(-6),
    };
  }

  function renderSummary(config, result) {
    var settings = window.SCUDO_DEMO_DATA && window.SCUDO_DEMO_DATA.settings ? window.SCUDO_DEMO_DATA.settings : {};
    var directory = core.getChargerDirectory(config, settings);
    var charger = result.boxNum ? core.findCharger(directory, result.boxNum) : null;
    var chargerLabel = charger ? core.labelForCharger(charger) : "ScudoCharge demo charger";
    var chargerMeta = charger ? core.describeCharger(charger) : "Demo connector selected during checkout preview.";
    var hardwareRef = charger ? "Hardware ID " + charger.boxNum : "Demo reference";
    var siteLabel = charger ? (charger.siteId || config.site.siteId) : config.site.siteId;

    byId("thankYouTitle").textContent = "Thank you";
    byId("thankYouBody").textContent = "This page simulates the confirmation experience after a successful ScudoCharge payment. No live payment has been taken.";
    byId("thankYouMeta").textContent = [config.site.name, config.site.region, "Demo confirmation"].filter(Boolean).join(" • ");
    byId("summaryPaid").textContent = core.formatMoney(result.amount, config);
    byId("summaryCredit").textContent = core.formatMoney(result.creditAmount, config);
    byId("summaryCharger").textContent = chargerLabel;
    byId("summarySite").textContent = siteLabel;
    byId("summaryPayId").textContent = result.payId;
    byId("summaryHardware").textContent = hardwareRef;
    byId("summaryChargerMeta").textContent = chargerMeta;
    byId("supportEmail").textContent = config.operator.supportEmail;
    byId("supportEmail").href = "mailto:" + config.operator.supportEmail;
  }

  function bindLinks() {
    var replayLink = byId("thankYouReplayLink");
    var dashboardLink = byId("thankYouDashboardLink");
    if (!replayLink || !dashboardLink) {
      return;
    }
    if (isFilePreview()) {
      replayLink.href = "../index.html";
      dashboardLink.href = "../dashboard/index.html";
      return;
    }
    if (window.location.pathname.indexOf("/payment-demo") === 0) {
      replayLink.href = "/payment-demo";
      dashboardLink.href = "/dashboard-demo";
      return;
    }
    replayLink.href = "/demo";
    dashboardLink.href = "/dashboard-demo";
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function launchConfetti() {
    var container = byId("thankYouConfetti");
    if (!container) {
      return;
    }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      container.innerHTML = "";
      return;
    }
    var colours = ["var(--primary)", "var(--accent)", "var(--promo)", "#f5fbf7"];
    container.innerHTML = "";

    Array.from({ length: 26 }).forEach(function (_, index) {
      var piece = document.createElement("span");
      var size = randomBetween(8, 16);
      var drift = randomBetween(-110, 110).toFixed(0) + "px";
      var rotation = randomBetween(140, 520).toFixed(0) + "deg";
      var delay = (index * 0.045 + randomBetween(0, 0.35)).toFixed(2) + "s";
      var duration = randomBetween(3.4, 5.2).toFixed(2) + "s";
      var opacity = randomBetween(0.72, 0.98).toFixed(2);
      piece.className = "confetti-piece";
      piece.style.setProperty("--left", randomBetween(4, 96).toFixed(2) + "%");
      piece.style.setProperty("--size", size.toFixed(0) + "px");
      piece.style.setProperty("--delay", delay);
      piece.style.setProperty("--duration", duration);
      piece.style.setProperty("--drift", drift);
      piece.style.setProperty("--rotation", rotation);
      piece.style.setProperty("--opacity", opacity);
      piece.style.setProperty("--color", colours[index % colours.length]);
      piece.style.setProperty("--radius-shape", Math.random() > 0.5 ? "999px" : "4px");
      container.appendChild(piece);
    });

    window.setTimeout(function () {
      container.innerHTML = "";
    }, 6200);
  }

  async function init() {
    var config = await core.getConfig();
    core.applyTheme(config);
    core.populateBrandTokens(document, config);
    document.title = config.operatorName + " | Demo Thank You";
    renderSummary(config, normaliseResult(config));
    bindLinks();
    launchConfetti();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
