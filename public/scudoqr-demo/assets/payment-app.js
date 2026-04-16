(function () {
  var core = window.ScudoCore;
  if (!core) {
    return;
  }

  var state = {
    config: null,
    settings: {},
    directory: [],
    amount: 12,
    creditAmount: 12,
    busy: false,
    selectedBoxNum: "",
    bonusEnabled: false,
    bonusMode: "manual",
    bonusDisplayMode: "selected",
    bonusPack: null,
    bonusPacks: [],
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function presetValues() {
    return Array.isArray(state.config.payment.presetAmounts) && state.config.payment.presetAmounts.length
      ? state.config.payment.presetAmounts.map(Number)
      : [8, 12, 20, 35, 50];
  }

  function amountStep() {
    return Math.max(1, Number(state.config.payment.amountStep || 1));
  }

  function clampAmount(value) {
    var min = Number(state.config.payment.minAmount || 4);
    var max = Number(state.config.payment.maxAmount || 80);
    return Math.min(max, Math.max(min, Number(value || min)));
  }

  function getSelectedCharger() {
    return core.findCharger(state.directory, state.selectedBoxNum);
  }

  function setStatus(message, type) {
    var node = byId("paymentStatus");
    if (!node) {
      return;
    }
    node.textContent = message || "";
    node.className = "status-inline" + (type ? " " + type : "");
  }

  function setBusy(isBusy, label) {
    state.busy = isBusy;
    var button = byId("payButton");
    if (button) {
      button.disabled = isBusy;
      button.textContent = label || state.config.payment.ctaLabel;
    }
    byId("amountMinus").disabled = isBusy || state.amount <= Number(state.config.payment.minAmount || 4);
    byId("amountPlus").disabled = isBusy || state.amount >= Number(state.config.payment.maxAmount || 80);
    document.querySelectorAll(".preset-button, .promo-button, .bay-card").forEach(function (buttonNode) {
      buttonNode.disabled = isBusy;
    });
  }

  function updatePageTitle() {
    document.title = state.config.operatorName + " | " + state.config.payment.pageTitle;
  }

  function renderInstructions() {
    var list = byId("instructionList");
    if (!list) {
      return;
    }
    list.innerHTML = "";
    state.config.payment.instructions.forEach(function (step) {
      var item = document.createElement("li");
      item.textContent = step;
      list.appendChild(item);
    });
  }

  function renderSupport() {
    byId("siteMeta").textContent = [
      state.config.site.region,
      state.config.site.location,
      state.config.site.liveStatus,
    ].filter(Boolean).join(" • ");
    byId("supportEmail").textContent = state.config.operator.supportEmail;
    byId("supportEmail").href = "mailto:" + state.config.operator.supportEmail;
    byId("supportPhone").textContent = state.config.operator.supportPhone || "";
    byId("supportHours").textContent = state.config.operator.supportHours || "";
    byId("supportPhone").style.display = state.config.operator.supportPhone ? "" : "none";
    byId("supportHours").style.display = state.config.operator.supportHours ? "" : "none";
    byId("paymentHint").textContent = state.config.payment.amountHint;
    byId("operatorSiteMeta").textContent = [
      state.config.site.siteId,
      state.config.site.timezone,
      state.config.site.liveStatus,
    ].filter(Boolean).join(" • ");
  }

  function renderPaymentMethods() {
    var row = byId("paymentMethods");
    if (!row) {
      return;
    }
    row.innerHTML = "";
    (state.config.payment.acceptedPayments || []).forEach(function (label) {
      var pill = document.createElement("span");
      pill.className = "payment-pill";
      pill.textContent = label;
      row.appendChild(pill);
    });
  }

  function renderChargerSelection() {
    var selected = getSelectedCharger();
    var title = selected ? core.labelForCharger(selected) : "Choose a bay";
    var subtitle = selected ? core.describeCharger(selected) : "Choose the charger or connector your driver will use.";
    byId("selectedBayName").textContent = title;
    byId("selectedBayMeta").textContent = subtitle;
    byId("selectedSiteRef").textContent = selected ? (selected.siteId || state.config.site.siteId) : state.config.site.siteId;
    byId("selectedBayRef").textContent = selected ? ("Bay ID " + selected.boxNum) : "Select a bay to see its reference";
  }

  function renderAmount() {
    byId("amountNumber").textContent = core.formatMoney(state.amount, state.config);
    var summaryPaid = byId("summaryPaid");
    var summaryCredit = byId("summaryCredit");
    var summaryPromo = byId("summaryPromo");
    var selected = getSelectedCharger();

    summaryPaid.textContent = core.formatMoney(state.amount, state.config);
    summaryCredit.textContent = core.formatMoney(state.creditAmount, state.config);
    summaryPromo.textContent = state.creditAmount > state.amount
      ? "+" + core.formatMoney(state.creditAmount - state.amount, state.config) + " promotional credit"
      : "No promotional credit selected";
    byId("summaryBay").textContent = selected ? core.labelForCharger(selected) : "No bay selected";

    document.querySelectorAll(".preset-button").forEach(function (button) {
      button.classList.toggle("active", Number(button.getAttribute("data-amount")) === state.amount && state.creditAmount === state.amount);
    });
    document.querySelectorAll(".promo-button").forEach(function (button) {
      var pay = Number(button.getAttribute("data-pay"));
      var credit = Number(button.getAttribute("data-credit"));
      button.classList.toggle("active", pay === state.amount && credit === state.creditAmount && credit > pay);
    });
  }

  function renderPresets() {
    var grid = byId("presetGrid");
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    presetValues().forEach(function (value, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "preset-button";
      button.setAttribute("data-amount", String(value));
      button.innerHTML =
        '<span class="preset-amount">' + core.formatMoney(value, state.config) + "</span>" +
        '<span class="preset-label">' + (index === 1 ? "Popular choice" : "Prepaid amount") + "</span>";
      button.addEventListener("click", function () {
        if (state.busy) {
          return;
        }
        state.amount = clampAmount(value);
        state.creditAmount = state.amount;
        renderAmount();
        setStatus("", "");
      });
      grid.appendChild(button);
    });
  }

  function visibleBonusPacks() {
    if (!state.bonusEnabled) {
      return [];
    }
    if (state.bonusDisplayMode === "all") {
      return state.bonusPacks.slice();
    }
    var selectedPack = state.bonusPacks.find(function (pack) {
      return Number(pack.pay) === Number(state.bonusPack);
    });
    return selectedPack ? [selectedPack] : state.bonusPacks.slice(0, 1);
  }

  function renderPromotions() {
    var card = byId("promoCard");
    var badge = byId("promoBadge");
    var grid = byId("promoGrid");
    if (!card || !grid || !badge) {
      return;
    }
    var packs = visibleBonusPacks();
    card.style.display = state.bonusEnabled && packs.length ? "grid" : "none";
    badge.style.display = state.bonusEnabled && packs.length ? "inline-flex" : "none";
    badge.textContent = state.config.promotions.badge;
    grid.innerHTML = "";
    packs.forEach(function (pack) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "promo-button";
      button.setAttribute("data-pay", String(pack.pay));
      button.setAttribute("data-credit", String(pack.credit));
      button.innerHTML =
        '<span class="preset-amount">' + core.formatMoney(pack.pay, state.config) + " → " + core.formatMoney(pack.credit, state.config) + "</span>" +
        '<span class="promo-label">' + core.formatMoney(pack.credit - pack.pay, state.config) + " extra wash credit</span>";
      button.addEventListener("click", function () {
        if (state.busy) {
          return;
        }
        state.amount = clampAmount(pack.pay);
        state.creditAmount = clampAmount(pack.credit);
        renderAmount();
        setStatus("", "");
      });
      grid.appendChild(button);
    });
    renderAmount();
  }

  function renderChargerModal() {
    var grid = byId("bayGrid");
    if (!grid) {
      return;
    }
    grid.innerHTML = "";
    state.directory.forEach(function (charger) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "bay-card" + (String(state.selectedBoxNum) === String(charger.boxNum) ? " active" : "");
      button.innerHTML =
        '<span class="label">' + (charger.siteId || state.config.site.siteId) + "</span>" +
        "<strong>" + core.labelForCharger(charger) + "</strong>" +
        "<span>" + core.describeCharger(charger) + "<br>Bay ID " + charger.boxNum + "</span>";
      button.addEventListener("click", function () {
        if (state.busy) {
          return;
        }
        selectCharger(charger.boxNum);
        closeModal();
      });
      grid.appendChild(button);
    });
  }

  function openModal() {
    renderChargerModal();
    byId("bayModal").classList.add("open");
  }

  function closeModal() {
    byId("bayModal").classList.remove("open");
  }

  function setQueryParam(key, value) {
    var url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, document.title, url.toString());
  }

  function selectCharger(boxNum) {
    state.selectedBoxNum = String(boxNum || "");
    setQueryParam("box_num", state.selectedBoxNum);
    renderChargerSelection();
    renderChargerModal();
  }

  function readSelectedChargerFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("box_num") || params.get("box") || params.get("charger");
    if (!raw) {
      if (state.directory.length === 1 || (window.SCUDO_DEMO_MODE && state.directory.length)) {
        state.selectedBoxNum = state.directory[0].boxNum;
      }
      return;
    }
    var selected = core.findCharger(state.directory, raw);
    state.selectedBoxNum = selected ? selected.boxNum : "";
  }

  function stripCheckoutParams() {
    var url = new URL(window.location.href);
    ["payment", "session_id"].forEach(function (key) {
      url.searchParams.delete(key);
    });
    window.history.replaceState({}, document.title, url.toString());
  }

  function isFilePreview() {
    return window.location.protocol === "file:" || window.location.origin === "null" || window.location.origin === "file://";
  }

  function rememberDemoResult(result) {
    try {
      window.sessionStorage.setItem("scudoDemoCheckoutResult", JSON.stringify(result));
    } catch (_error) {
      // Ignore storage issues in preview environments.
    }
  }

  function buildDemoThankYouUrl(result) {
    var basePath = window.location.pathname.indexOf("/payment-demo") === 0 ? "/payment-demo/thank-you/" : "/demo/thank-you/";
    var url = isFilePreview()
      ? new URL("./thank-you/index.html", window.location.href)
      : new URL(basePath, window.location.origin);
    url.searchParams.set("amount", String(Number(result.amount || 0)));
    url.searchParams.set("credit", String(Number(result.creditAmount || result.amount || 0)));
    url.searchParams.set("box_num", String(result.boxNum || ""));
    url.searchParams.set("pay_id", String(result.payId || ""));
    return url.toString();
  }

  function redirectToDemoThankYou(result) {
    rememberDemoResult(result);
    window.location.href = buildDemoThankYouUrl(result);
  }

  async function submitPayment() {
    if (state.busy) {
      return;
    }
    var selected = getSelectedCharger();
    if (!selected && window.SCUDO_DEMO_MODE && state.directory.length) {
      selectCharger(state.directory[0].boxNum);
      selected = getSelectedCharger();
    }
    if (!selected) {
      setStatus("Select a bay before continuing to checkout.", "error");
      return;
    }

    if (window.SCUDO_DEMO_MODE) {
      setBusy(true, "Showing demo flow...");
      setStatus("Running demo checkout preview...", "");
      window.setTimeout(function () {
        redirectToDemoThankYou({
          amount: Number(state.amount.toFixed(2)),
          creditAmount: Number(state.creditAmount.toFixed(2)),
          boxNum: Number(selected.boxNum),
          payId: "DEMO-" + String(Date.now()).slice(-6),
        });
      }, 650);
      return;
    }

    var apiBase = await core.resolveApiBase(state.config);
    if (!apiBase && window.location.origin === "null") {
      setStatus("The operator API could not be reached. Check the configured API base URL.", "error");
      return;
    }

    setBusy(true, "Preparing secure checkout...");
    setStatus("Checking bay availability and creating the payment session...", "");

    try {
      var payload = {
        amount: Number(state.amount.toFixed(2)),
        creditAmount: Number(state.creditAmount.toFixed(2)),
        boxNum: Number(selected.boxNum),
      };
      var response = await core.fetchJson((apiBase || "") + "/api/charging/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus("Redirecting to secure checkout...", "success");
      window.location.href = response.url;
    } catch (error) {
      setBusy(false, state.config.payment.ctaLabel);
      setStatus(error.message || "Unable to create the payment session.", "error");
    }
  }

  function writeSuccessDetails(result) {
    var selected = getSelectedCharger() || core.findCharger(state.directory, result.boxNum);
    byId("successTitle").textContent = state.config.payment.successTitle;
    byId("successBody").textContent = state.config.payment.successBody;
    byId("successPaid").textContent = core.formatMoney(result.amount, state.config);
    byId("successCredit").textContent = core.formatMoney(result.creditAmount || result.amount, state.config);
    byId("successCharger").textContent = selected ? core.labelForCharger(selected) : ("Charger " + result.boxNum);
    byId("successSite").textContent = selected ? (selected.siteId || state.config.site.siteId) : state.config.site.siteId;
    byId("successPayId").textContent = result.payId || "Pending";
    byId("paymentScreen").hidden = true;
    byId("successScreen").hidden = false;
  }

  async function handleCheckoutReturn() {
    if (window.SCUDO_DEMO_MODE) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var paymentState = params.get("payment");
    var sessionId = params.get("session_id");
    if (paymentState === "cancelled") {
      stripCheckoutParams();
      setStatus("Checkout was cancelled. No payment was taken.", "error");
      return;
    }
    if (paymentState !== "success" || !sessionId) {
      return;
    }

    var apiBase = await core.resolveApiBase(state.config);
    setBusy(true, "Authorising wash session...");
    setStatus("Payment received. Finalising the charging command...", "");

    try {
      var result = await core.fetchJson((apiBase || "") + "/api/charging/confirm-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId }),
      });
      stripCheckoutParams();
      setBusy(false, state.config.payment.ctaLabel);
      writeSuccessDetails(result);
    } catch (error) {
      stripCheckoutParams();
      setBusy(false, state.config.payment.ctaLabel);
      setStatus(error.message || "Unable to confirm the charging session.", "error");
    }
  }

  function resetFlow() {
    byId("successScreen").hidden = true;
    byId("paymentScreen").hidden = false;
    setBusy(false, state.config.payment.ctaLabel);
    setStatus("", "");
  }

  async function loadSettings() {
    if (window.SCUDO_DEMO_MODE && window.SCUDO_DEMO_DATA && window.SCUDO_DEMO_DATA.settings) {
      state.settings = window.SCUDO_DEMO_DATA.settings;
      return;
    }
    try {
      var apiBase = await core.resolveApiBase(state.config);
      if (!apiBase && window.location.origin === "null") {
        return;
      }
      state.settings = await core.fetchJson((apiBase || "") + "/api/settings");
    } catch (_error) {
      state.settings = {};
    }
  }

  function applySettings() {
    var settings = state.settings || {};
    state.directory = core.getChargerDirectory(state.config, settings);
    state.bonusEnabled = typeof settings.bonusEnabled === "boolean" ? settings.bonusEnabled : false;
    state.bonusMode = settings.bonusMode === "recommended" ? "recommended" : "manual";
    state.bonusDisplayMode = settings.bonusDisplayMode === "all" ? "all" : "selected";
    state.bonusPack = Number(settings.bonusPack || 0) || null;
    state.bonusPacks = Array.isArray(settings.bonusPacks) && settings.bonusPacks.length
      ? settings.bonusPacks.map(function (pack) {
        return { pay: Number(pack.pay), credit: Number(pack.credit) };
      })
      : (state.config.promotions.defaultPacks || []).map(function (pack) {
        return { pay: Number(pack.pay), credit: Number(pack.credit) };
      });
    readSelectedChargerFromUrl();
  }

  function bindEvents() {
    byId("amountMinus").addEventListener("click", function () {
      if (state.busy) {
        return;
      }
      state.amount = clampAmount(state.amount - amountStep());
      state.creditAmount = state.amount;
      renderAmount();
      setStatus("", "");
    });

    byId("amountPlus").addEventListener("click", function () {
      if (state.busy) {
        return;
      }
      state.amount = clampAmount(state.amount + amountStep());
      state.creditAmount = state.amount;
      renderAmount();
      setStatus("", "");
    });

    byId("payButton").addEventListener("click", submitPayment);
    byId("selectBayButton").addEventListener("click", openModal);
    byId("closeModalButton").addEventListener("click", closeModal);
    byId("modalDismissButton").addEventListener("click", closeModal);
    byId("startAnotherButton").addEventListener("click", resetFlow);
    byId("bayModal").addEventListener("click", function (event) {
      if (event.target === byId("bayModal")) {
        closeModal();
      }
    });
  }

  async function init() {
    state.config = await core.getConfig();
    core.applyTheme(state.config);
    core.populateBrandTokens(document, state.config);
    updatePageTitle();
    state.amount = clampAmount(state.config.payment.defaultAmount || presetValues()[0] || 12);
    state.creditAmount = state.amount;
    renderInstructions();
    renderSupport();
    renderPaymentMethods();
    renderPresets();
    await loadSettings();
    applySettings();
    renderChargerSelection();
    renderPromotions();
    renderChargerModal();
    renderAmount();
    bindEvents();
    setBusy(false, state.config.payment.ctaLabel);
    await handleCheckoutReturn();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
