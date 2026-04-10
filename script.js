const STORAGE_KEY = "bloom-budget-state-v2";
const BASE_CURRENCY = "ZMW";
const currencySymbols = {
  USD: "$",
  ZMW: "K",
};
const categoryLimitsZmw = {
  Housing: 6000,
  Food: 2200,
  Transport: 1200,
  Lifestyle: 1400,
  Utilities: 1000,
  Other: 900,
};

const exchangeRate = normalizeExchangeRate(window.BOZ_EXCHANGE_RATE);
let state = loadState();

const elements = {
  incomeInput: document.querySelector("#incomeInput"),
  incomeCurrencySelect: document.querySelector("#incomeCurrencySelect"),
  savingsInput: document.querySelector("#savingsInput"),
  savingsCurrencySelect: document.querySelector("#savingsCurrencySelect"),
  displayCurrencySelect: document.querySelector("#displayCurrencySelect"),
  saveTargetsBtn: document.querySelector("#saveTargetsBtn"),
  clearDataBtn: document.querySelector("#clearDataBtn"),
  transactionForm: document.querySelector("#transactionForm"),
  transactionList: document.querySelector("#transactionList"),
  planForm: document.querySelector("#planForm"),
  planList: document.querySelector("#planList"),
  categoryBudgets: document.querySelector("#categoryBudgets"),
  weeklyPlanner: document.querySelector("#weeklyPlanner"),
  budgetRing: document.querySelector("#budgetRing"),
  spentRatio: document.querySelector("#spentRatio"),
  remainingBudget: document.querySelector("#remainingBudget"),
  plannedSoon: document.querySelector("#plannedSoon"),
  netBalance: document.querySelector("#netBalance"),
  balanceHint: document.querySelector("#balanceHint"),
  savedAmount: document.querySelector("#savedAmount"),
  savingsHint: document.querySelector("#savingsHint"),
  upcomingCount: document.querySelector("#upcomingCount"),
  upcomingHint: document.querySelector("#upcomingHint"),
  nudgeTitle: document.querySelector("#nudgeTitle"),
  nudgeText: document.querySelector("#nudgeText"),
  rateHeadline: document.querySelector("#rateHeadline"),
  rateDetails: document.querySelector("#rateDetails"),
  buyRate: document.querySelector("#buyRate"),
  midRate: document.querySelector("#midRate"),
  sellRate: document.querySelector("#sellRate"),
  transactionTemplate: document.querySelector("#transactionTemplate"),
  planTemplate: document.querySelector("#planTemplate"),
  settingsModal: document.querySelector("#settings-modal"),
  openSettingsBtn: document.querySelector("#openSettingsBtn"),
  closeSettingsBtn: document.querySelector("#closeSettingsBtn"),
  journalForm: document.querySelector("#journalForm"),
  journalList: document.querySelector("#journalList"),
};

boot();

function boot() {
  populateControls();
  setDefaultDates();
  bindEvents();
  render();
}

function openSettings() {
  elements.settingsModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeSettings() {
  elements.settingsModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function bindEvents() {
  elements.openSettingsBtn.addEventListener("click", openSettings);
  elements.closeSettingsBtn.addEventListener("click", closeSettings);

  // Close when clicking the backdrop
  elements.settingsModal.addEventListener("click", (e) => {
    if (e.target === elements.settingsModal) closeSettings();
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !elements.settingsModal.hidden) closeSettings();
  });

  elements.saveTargetsBtn.addEventListener("click", () => {
    state.incomeTarget = {
      amount: toNumber(elements.incomeInput.value),
      currency: elements.incomeCurrencySelect.value,
    };
    state.savingsTarget = {
      amount: toNumber(elements.savingsInput.value),
      currency: elements.savingsCurrencySelect.value,
    };
    state.preferences.displayCurrency = elements.displayCurrencySelect.value;
    saveState();
    render();
    closeSettings();
  });

  elements.displayCurrencySelect.addEventListener("change", () => {
    state.preferences.displayCurrency = elements.displayCurrencySelect.value;
    saveState();
    render();
  });

  elements.clearDataBtn.addEventListener("click", () => {
    state = createEmptyState();
    saveState();
    populateControls();
    setDefaultDates();
    render();
  });

  // Auto-category button
  const autoCatBtn = document.getElementById("autoCategoryBtn");
  const titleInput = elements.transactionForm.elements.title;
  const categorySelect = elements.transactionForm.elements.category;
  const typeSelect = elements.transactionForm.elements.type;

  autoCatBtn.addEventListener("click", () => {
    const detected = autoDetectCategory(titleInput.value);
    categorySelect.value = detected;
    // Also set type to income if category is Income
    if (detected === "Income") typeSelect.value = "income";
    else typeSelect.value = "expense";
  });

  // Auto-detect on title blur (subtle — just suggests)
  titleInput.addEventListener("blur", () => {
    if (titleInput.value.trim()) {
      const detected = autoDetectCategory(titleInput.value);
      categorySelect.value = detected;
      if (detected === "Income") typeSelect.value = "income";
      else typeSelect.value = "expense";
    }
  });

  elements.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const transaction = {
      id: crypto.randomUUID(),
      title: String(formData.get("title")).trim(),
      amount: toNumber(formData.get("amount")),
      currency: String(formData.get("currency")),
      type: String(formData.get("type")),
      category: String(formData.get("category")),
      date: String(formData.get("date")),
    };

    if (!transaction.title || !transaction.amount || !transaction.date) {
      return;
    }

    state.transactions.unshift(transaction);
    saveState();
    event.currentTarget.reset();
    setDefaultDates();
    render();
  });

  elements.planForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const plan = {
      id: crypto.randomUUID(),
      name: String(formData.get("name")).trim(),
      amount: toNumber(formData.get("amount")),
      currency: String(formData.get("currency")),
      dueDate: String(formData.get("dueDate")),
      priority: String(formData.get("priority")),
    };

    if (!plan.name || !plan.amount || !plan.dueDate) {
      return;
    }

    state.plans.push(plan);
    state.plans.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    saveState();
    event.currentTarget.reset();
    setDefaultDates();
    render();
  });

  elements.journalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const entry = {
      id: crypto.randomUUID(),
      date: String(formData.get("date")),
      content: String(formData.get("content")).trim(),
    };
    if (!entry.date || !entry.content) return;
    state.journal.unshift(entry);
    saveState();
    event.currentTarget.reset();
    elements.journalForm.elements.date.value = new Date().toISOString().slice(0, 10);
    render();
  });
}

function renderJournal() {
  const list = elements.journalList;
  list.innerHTML = "";

  if (!state.journal.length) {
    list.innerHTML = '<p class="helper-copy" style="text-align:center;padding:16px 0">No entries yet. Write your first one above.</p>';
    return;
  }

  state.journal.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "journal-entry";
    article.innerHTML = `
      <div class="journal-entry-header">
        <span class="journal-entry-date">${formatDate(entry.date)}</span>
        <button class="icon-btn" type="button" aria-label="Delete entry" data-id="${entry.id}">×</button>
      </div>
      <p class="journal-entry-content">${entry.content.replace(/</g, "&lt;")}</p>
    `;
    article.querySelector("[data-id]").addEventListener("click", () => {
      state.journal = state.journal.filter((e) => e.id !== entry.id);
      saveState();
      render();
    });
    list.appendChild(article);
  });
}

function normalizeJournalEntry(value) {
  if (!value?.date || !value?.content) return null;
  return {
    id: value.id || crypto.randomUUID(),
    date: String(value.date),
    content: String(value.content),
  };
}

function render() {
  const metrics = getMetrics();
  renderExchangeRate();
  renderSummary(metrics);
  renderTransactions();
  renderPlans(metrics.upcomingPlans);
  renderCategories(metrics.categorySpendBase);
  renderWeeklyPlanner();
  renderJournal();
}

function renderExchangeRate() {
  if (!exchangeRate) {
    elements.rateHeadline.textContent = "No rate loaded";
    elements.rateDetails.textContent = "Run the local pipeline to generate data/exchange-rate.generated.js.";
    elements.buyRate.textContent = formatPlainRate(0);
    elements.midRate.textContent = formatPlainRate(0);
    elements.sellRate.textContent = formatPlainRate(0);
    return;
  }

  elements.rateHeadline.textContent = `1 USD = ${formatCurrency(exchangeRate.midRate, "ZMW")}`;
  elements.rateDetails.textContent = `Effective ${formatDateTime(exchangeRate.effectiveAt)} • fetched ${formatDateTime(exchangeRate.fetchedAt)}`;
  elements.buyRate.textContent = formatPlainRate(exchangeRate.buying);
  elements.midRate.textContent = formatPlainRate(exchangeRate.midRate);
  elements.sellRate.textContent = formatPlainRate(exchangeRate.selling);
}

function renderSummary(metrics) {
  const displayCurrency = state.preferences.displayCurrency;
  const incomeTargetBase = targetToBase(state.incomeTarget);
  const savingsTargetBase = targetToBase(state.savingsTarget);
  const spendRatio = incomeTargetBase > 0 ? Math.min(metrics.totalExpensesBase / incomeTargetBase, 1) : 0;

  elements.budgetRing.style.setProperty("--progress", `${Math.round(spendRatio * 360)}deg`);
  elements.spentRatio.textContent = `${Math.round(spendRatio * 100)}%`;
  elements.remainingBudget.textContent = formatDisplay(Math.max(incomeTargetBase - metrics.totalExpensesBase, 0), displayCurrency);
  elements.plannedSoon.textContent = formatDisplay(metrics.upcomingPlansBase, displayCurrency);

  elements.netBalance.textContent = formatDisplay(metrics.netBalanceBase, displayCurrency);
  elements.balanceHint.textContent = metrics.transactionCount > 0
    ? `${metrics.expenseCount} expense item${metrics.expenseCount === 1 ? "" : "s"} recorded across ${metrics.transactionCount} transaction${metrics.transactionCount === 1 ? "" : "s"}.`
    : "Start recording income and expenses.";

  elements.savedAmount.textContent = formatDisplay(metrics.actualSavingsBase, displayCurrency);
  elements.savingsHint.textContent = savingsTargetBase > 0
    ? `${Math.round(Math.min(metrics.actualSavingsBase / savingsTargetBase, 1) * 100)}% of your savings target reached.`
    : "No savings target saved yet.";

  elements.upcomingCount.textContent = `${metrics.upcomingPlans.length} item${metrics.upcomingPlans.length === 1 ? "" : "s"}`;
  elements.upcomingHint.textContent = metrics.upcomingPlans.length > 0
    ? `${metrics.highPriorityCount} high-priority bill${metrics.highPriorityCount === 1 ? "" : "s"} due within 14 days.`
    : "Nothing due in the next 14 days.";

  if (!exchangeRate) {
    elements.nudgeTitle.textContent = "Load a rate file";
    elements.nudgeText.textContent = "Currency conversion is disabled until the Bank of Zambia rate file is generated locally.";
  } else if (incomeTargetBase === 0) {
    elements.nudgeTitle.textContent = "Set your income target";
    elements.nudgeText.textContent = "Budget guidance becomes more useful once the monthly income target is saved.";
  } else if (metrics.upcomingPlansBase > Math.max(incomeTargetBase - savingsTargetBase - metrics.totalExpensesBase, 0)) {
    elements.nudgeTitle.textContent = "Upcoming bills are tight";
    elements.nudgeText.textContent = "Planned costs in the next two weeks are above the room left after your savings goal.";
  } else if (savingsTargetBase > 0 && metrics.actualSavingsBase < savingsTargetBase) {
    elements.nudgeTitle.textContent = "Savings gap";
    elements.nudgeText.textContent = `You still need ${formatDisplay(savingsTargetBase - metrics.actualSavingsBase, displayCurrency)} to hit your target.`;
  } else {
    elements.nudgeTitle.textContent = "On steady ground";
    elements.nudgeText.textContent = "Spending, savings, and planned bills are sitting inside the current budget.";
  }
}

function renderTransactions() {
  elements.transactionList.innerHTML = "";

  if (state.transactions.length === 0) {
    elements.transactionList.innerHTML = `<div class="empty-state">No transactions yet. Add your first income or expense above.</div>`;
    return;
  }

  state.transactions
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .forEach((transaction) => {
      const fragment = elements.transactionTemplate.content.cloneNode(true);
      const title = fragment.querySelector(".item-title");
      const meta = fragment.querySelector(".item-meta");
      const amount = fragment.querySelector(".item-amount");
      const secondary = fragment.querySelector(".amount-secondary");
      const button = fragment.querySelector(".icon-btn");
      const displayCurrency = state.preferences.displayCurrency;
      const convertedAmount = convertAmount(transaction.amount, transaction.currency, displayCurrency);

      title.textContent = transaction.title;
      meta.textContent = `${transaction.category} • ${transaction.type} • ${formatDate(transaction.date)}`;
      amount.textContent = `${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount, transaction.currency)}`;
      secondary.textContent = transaction.currency === displayCurrency
        ? `${displayCurrency} entry`
        : `${transaction.type === "income" ? "+" : "-"}${formatCurrency(convertedAmount, displayCurrency)} shown`;
      amount.classList.add(transaction.type === "income" ? "amount-income" : "amount-expense");

      button.addEventListener("click", () => {
        state.transactions = state.transactions.filter((entry) => entry.id !== transaction.id);
        saveState();
        render();
      });

      elements.transactionList.appendChild(fragment);
    });
}

function renderPlans(upcomingPlans) {
  elements.planList.innerHTML = "";

  if (state.plans.length === 0) {
    elements.planList.innerHTML = `<div class="empty-state">No upcoming plans yet. Add future expenses to map your month.</div>`;
    return;
  }

  state.plans
    .slice()
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .forEach((plan) => {
      const fragment = elements.planTemplate.content.cloneNode(true);
      const title = fragment.querySelector(".item-title");
      const meta = fragment.querySelector(".item-meta");
      const pill = fragment.querySelector(".priority-pill");
      const amount = fragment.querySelector(".item-amount");
      const secondary = fragment.querySelector(".amount-secondary");
      const button = fragment.querySelector(".icon-btn");
      const displayCurrency = state.preferences.displayCurrency;
      const convertedAmount = convertAmount(plan.amount, plan.currency, displayCurrency);

      title.textContent = plan.name;
      meta.textContent = `${daysAwayText(plan.dueDate)} • due ${formatDate(plan.dueDate)}`;
      pill.textContent = plan.priority;
      pill.classList.add(`priority-${plan.priority}`);
      amount.textContent = formatCurrency(plan.amount, plan.currency);
      secondary.textContent = plan.currency === displayCurrency
        ? `${displayCurrency} plan`
        : `${formatCurrency(convertedAmount, displayCurrency)} displayed`;
      amount.classList.add("amount-expense");

      button.addEventListener("click", () => {
        state.plans = state.plans.filter((entry) => entry.id !== plan.id);
        saveState();
        render();
      });

      elements.planList.appendChild(fragment);
    });
}

function renderCategories(categorySpendBase) {
  elements.categoryBudgets.innerHTML = "";

  Object.entries(categoryLimitsZmw).forEach(([category, limitBase]) => {
    const spentBase = categorySpendBase[category] || 0;
    const ratio = Math.min(spentBase / limitBase, 1);
    const displayCurrency = state.preferences.displayCurrency;
    const card = document.createElement("article");
    card.className = "category-card";
    card.innerHTML = `
      <div class="category-topline">
        <span class="category-name">${category}</span>
        <strong>${formatDisplay(spentBase, displayCurrency)}</strong>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${Math.round(ratio * 100)}%"></div>
      </div>
      <div class="category-foot">
        <span>Budget ${formatDisplay(limitBase, displayCurrency)}</span>
        <span>${Math.round(ratio * 100)}% used</span>
      </div>
    `;
    elements.categoryBudgets.appendChild(card);
  });
}

function renderWeeklyPlanner() {
  elements.weeklyPlanner.innerHTML = "";
  const buckets = groupPlansByWeek(state.plans);
  const displayCurrency = state.preferences.displayCurrency;

  if (buckets.length === 0) {
    elements.weeklyPlanner.innerHTML = `<div class="empty-state">Your planner is clear. Add expected bills or events to see a weekly outlook.</div>`;
    return;
  }

  buckets.forEach((bucket) => {
    const card = document.createElement("article");
    card.className = "week-card";
    const labels = bucket.items.map((item) => item.name).join(", ");
    card.innerHTML = `
      <div>
        <strong>${bucket.label}</strong>
        <span class="item-meta">${labels}</span>
      </div>
      <div class="week-total">${formatDisplay(bucket.totalBase, displayCurrency)}</div>
    `;
    elements.weeklyPlanner.appendChild(card);
  });
}

function getMetrics() {
  const incomeTransactions = state.transactions.filter((entry) => entry.type === "income");
  const expenseTransactions = state.transactions.filter((entry) => entry.type === "expense");
  const totalIncomeBase = incomeTransactions.reduce((sum, entry) => sum + amountToBase(entry.amount, entry.currency), 0);
  const totalExpensesBase = expenseTransactions.reduce((sum, entry) => sum + amountToBase(entry.amount, entry.currency), 0);
  const today = toDateOnly(new Date());
  const soonBoundary = new Date(today);
  soonBoundary.setDate(soonBoundary.getDate() + 14);

  const upcomingPlans = state.plans.filter((plan) => {
    const dueDate = toDateOnly(plan.dueDate);
    return dueDate >= today && dueDate <= soonBoundary;
  });

  const categorySpendBase = expenseTransactions.reduce((map, entry) => {
    map[entry.category] = (map[entry.category] || 0) + amountToBase(entry.amount, entry.currency);
    return map;
  }, {});

  return {
    totalIncomeBase,
    totalExpensesBase,
    actualSavingsBase: Math.max(totalIncomeBase - totalExpensesBase, 0),
    netBalanceBase: totalIncomeBase - totalExpensesBase,
    categorySpendBase,
    upcomingPlans,
    upcomingPlansBase: upcomingPlans.reduce((sum, plan) => sum + amountToBase(plan.amount, plan.currency), 0),
    highPriorityCount: upcomingPlans.filter((plan) => plan.priority === "high").length,
    transactionCount: state.transactions.length,
    expenseCount: expenseTransactions.length,
  };
}

function loadState() {
  const next = createEmptyState();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return normalizeState(JSON.parse(saved));
    }

    const legacy = localStorage.getItem("bloom-budget-state");
    if (legacy) {
      return migrateLegacyState(JSON.parse(legacy));
    }
  } catch (error) {
    return next;
  }

  return next;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createEmptyState() {
  return {
    incomeTarget: { amount: 0, currency: "ZMW" },
    savingsTarget: { amount: 0, currency: "ZMW" },
    transactions: [],
    plans: [],
    journal: [],
    preferences: { displayCurrency: "ZMW" },
  };
}

function normalizeState(value) {
  return {
    incomeTarget: normalizeTarget(value.incomeTarget),
    savingsTarget: normalizeTarget(value.savingsTarget),
    transactions: Array.isArray(value.transactions) ? value.transactions.map(normalizeMoneyEntry).filter(Boolean) : [],
    plans: Array.isArray(value.plans) ? value.plans.map(normalizePlanEntry).filter(Boolean) : [],
    journal: Array.isArray(value.journal) ? value.journal.map(normalizeJournalEntry).filter(Boolean) : [],
    preferences: {
      displayCurrency: normalizeCurrency(value.preferences?.displayCurrency, "ZMW"),
    },
  };
}

function migrateLegacyState(value) {
  return normalizeState({
    incomeTarget: { amount: toNumber(value.income), currency: "ZMW" },
    savingsTarget: { amount: toNumber(value.savingsTarget), currency: "ZMW" },
    transactions: Array.isArray(value.transactions)
      ? value.transactions.map((entry) => ({ ...entry, currency: "ZMW" }))
      : [],
    plans: Array.isArray(value.plans)
      ? value.plans.map((entry) => ({ ...entry, currency: "ZMW" }))
      : [],
    preferences: { displayCurrency: "ZMW" },
  });
}

function normalizeTarget(value) {
  return {
    amount: toNumber(value?.amount),
    currency: normalizeCurrency(value?.currency, "ZMW"),
  };
}

function normalizeMoneyEntry(value) {
  if (!value?.title || !value?.date || !value?.type || !value?.category) {
    return null;
  }

  return {
    id: value.id || crypto.randomUUID(),
    title: String(value.title),
    amount: toNumber(value.amount),
    currency: normalizeCurrency(value.currency, "ZMW"),
    type: value.type === "income" ? "income" : "expense",
    category: String(value.category),
    date: String(value.date),
  };
}

function normalizePlanEntry(value) {
  if (!value?.name || !value?.dueDate || !value?.priority) {
    return null;
  }

  return {
    id: value.id || crypto.randomUUID(),
    name: String(value.name),
    amount: toNumber(value.amount),
    currency: normalizeCurrency(value.currency, "ZMW"),
    dueDate: String(value.dueDate),
    priority: ["high", "medium", "low"].includes(value.priority) ? value.priority : "medium",
  };
}

function populateControls() {
  elements.incomeInput.value = state.incomeTarget.amount || "";
  elements.incomeCurrencySelect.value = state.incomeTarget.currency;
  elements.savingsInput.value = state.savingsTarget.amount || "";
  elements.savingsCurrencySelect.value = state.savingsTarget.currency;
  elements.displayCurrencySelect.value = state.preferences.displayCurrency;
}

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  elements.transactionForm.elements.date.value = today;
  elements.planForm.elements.dueDate.value = today;
  elements.journalForm.elements.date.value = today;
}

function amountToBase(amount, currency) {
  const numeric = toNumber(amount);
  if (numeric === 0) {
    return 0;
  }

  if (currency === BASE_CURRENCY) {
    return numeric;
  }

  if (!exchangeRate) {
    return 0;
  }

  return numeric * exchangeRate.midRate;
}

function convertAmount(amount, fromCurrency, toCurrency) {
  const numeric = toNumber(amount);
  if (fromCurrency === toCurrency) {
    return numeric;
  }

  if (!exchangeRate) {
    return 0;
  }

  if (fromCurrency === "USD" && toCurrency === "ZMW") {
    return numeric * exchangeRate.midRate;
  }

  if (fromCurrency === "ZMW" && toCurrency === "USD") {
    return numeric / exchangeRate.midRate;
  }

  return numeric;
}

function targetToBase(target) {
  return amountToBase(target.amount, target.currency);
}

function normalizeExchangeRate(rate) {
  if (!rate || !rate.midRate) {
    return null;
  }

  return {
    source: String(rate.source || "Bank of Zambia"),
    fetchedAt: String(rate.fetchedAt || ""),
    effectiveAt: String(rate.effectiveAt || ""),
    buying: toNumber(rate.buying),
    midRate: toNumber(rate.midRate),
    selling: toNumber(rate.selling),
  };
}

function normalizeCurrency(value, fallback) {
  return value === "USD" || value === "ZMW" ? value : fallback;
}

function formatDisplay(amountBase, currency) {
  return formatCurrency(convertAmount(amountBase, BASE_CURRENCY, currency), currency);
}

function formatCurrency(amount, currency) {
  const numeric = toNumber(amount);
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbols[currency] || `${currency} `}${formatter.format(numeric)}`;
}

function formatPlainRate(value) {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
  return `${currencySymbols.ZMW}${formatter.format(toNumber(value))}`;
}

function formatDate(value) {
  return toDateOnly(value).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown time";
  }

  return date.toLocaleString("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupPlansByWeek(plans) {
  const sorted = plans.slice().sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const buckets = new Map();

  sorted.forEach((plan) => {
    const date = toDateOnly(plan.dueDate);
    const monday = new Date(date);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const key = monday.toISOString().slice(0, 10);

    if (!buckets.has(key)) {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      buckets.set(key, {
        label: `${formatShortDate(monday)} to ${formatShortDate(sunday)}`,
        totalBase: 0,
        items: [],
      });
    }

    const bucket = buckets.get(key);
    bucket.totalBase += amountToBase(plan.amount, plan.currency);
    bucket.items.push(plan);
  });

  return Array.from(buckets.values());
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
  });
}

function daysAwayText(dateString) {
  const today = toDateOnly(new Date());
  const dueDate = toDateOnly(dateString);
  const msPerDay = 24 * 60 * 60 * 1000;
  const difference = Math.round((dueDate - today) / msPerDay);

  if (difference < 0) {
    return `${Math.abs(difference)} day${Math.abs(difference) === 1 ? "" : "s"} overdue`;
  }

  if (difference === 0) {
    return "Due today";
  }

  if (difference === 1) {
    return "Due tomorrow";
  }

  return `Due in ${difference} days`;
}

function toDateOnly(value) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

// ─── AI Auto-categorization ─────────────────────────────────────────────────
const categoryKeywords = {
  Housing: [
    "rent", "mortgage", "landlord", "lease", "apartment", "house", "property",
    "accommodation", "lodge", "hostel", "airbnb", "tenant", "deposit"
  ],
  Food: [
    "grocery", "groceries", "food", "restaurant", "lunch", "dinner", "breakfast",
    "snack", "meal", "takeout", "takeaway", "pizza", "burger", "chicken",
    "bread", "milk", "market", "shoprite", "pick n pay", "spar", "cafe",
    "coffee", "starbucks", "uber eats", "deliveroo", "nandos", "kfc",
    "mcdonalds", "hungry lion", "debonairs", "kitchen", "butcher", "meat"
  ],
  Transport: [
    "uber", "taxi", "bus", "fuel", "petrol", "diesel", "gas", "parking",
    "toll", "fare", "lyft", "bolt", "flight", "airline", "ticket", "car",
    "vehicle", "mechanic", "repair", "tyre", "tire", "oil change", "wash",
    "motor", "drive", "commute", "train", "metro"
  ],
  Lifestyle: [
    "netflix", "spotify", "subscription", "gym", "fitness", "movie", "cinema",
    "entertainment", "game", "gaming", "clothing", "shoes", "fashion", "salon",
    "haircut", "barber", "beauty", "amazon", "shopping", "gift", "birthday",
    "party", "vacation", "holiday", "travel", "hotel", "dentist", "doctor",
    "medical", "health", "pharmacy", "medicine", "sport", "belt", "watch",
    "phone", "laptop", "electronics", "harp", "instrument", "music", "book",
    "perfume", "cologne"
  ],
  Utilities: [
    "electric", "electricity", "water", "internet", "wifi", "broadband",
    "data", "airtime", "phone bill", "mobile", "zesco", "bill", "sewage",
    "trash", "garbage", "waste", "dstv", "gotv"
  ],
  Income: [
    "salary", "wage", "income", "pay", "bonus", "freelance", "dividend",
    "refund", "reimbursement", "allowance", "commission", "advance"
  ]
};

function autoDetectCategory(label) {
  if (!label) return "Other";
  const lower = label.toLowerCase().trim();

  let bestCategory = "Other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestCategory = category;
        bestScore = keyword.length;
      }
    }
  }

  return bestCategory;
}
