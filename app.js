const STORAGE_KEY = "projetPhoenixV1";

const habitKeys = ["water", "steps", "workout", "calories", "noSoda", "sleep"];
const habitLabels = {
  water: "2 L d’eau",
  steps: "8 000 pas",
  workout: "Sport",
  calories: "Calories",
  noSoda: "Pas de soda",
  sleep: "Sommeil"
};

const $ = (id) => document.getElementById(id);

const el = {
  dayNumber: $("dayNumber"),
  dayTotal: $("dayTotal"),
  currentWeight: $("currentWeight"),
  targetWeight: $("targetWeight"),
  lostWeight: $("lostWeight"),
  remainingWeight: $("remainingWeight"),
  progressText: $("progressText"),
  progressFill: $("progressFill"),
  openSettingsBtn: $("openSettingsBtn"),
  settingsPanel: $("settingsPanel"),
  startDateInput: $("startDateInput"),
  durationInput: $("durationInput"),
  startWeightInput: $("startWeightInput"),
  targetWeightInput: $("targetWeightInput"),
  saveSettingsBtn: $("saveSettingsBtn"),
  entryForm: $("entryForm"),
  entryDate: $("entryDate"),
  entryWeight: $("entryWeight"),
  entryWaist: $("entryWaist"),
  entryMood: $("entryMood"),
  habitWater: $("habitWater"),
  habitSteps: $("habitSteps"),
  habitWorkout: $("habitWorkout"),
  habitCalories: $("habitCalories"),
  habitNoSoda: $("habitNoSoda"),
  habitSleep: $("habitSleep"),
  saveMessage: $("saveMessage"),
  chart: $("weightChart"),
  chartHint: $("chartHint"),
  historyList: $("historyList"),
  clearTodayBtn: $("clearTodayBtn"),
  exportJsonBtn: $("exportJsonBtn"),
  exportCsvBtn: $("exportCsvBtn"),
  importJsonInput: $("importJsonInput"),
  resetBtn: $("resetBtn")
};

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateFr(isoDate) {
  if (!isoDate) return "";
  return parseLocalDate(isoDate).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
}

function formatKg(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(1).replace(".", ",")} kg`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultState() {
  return {
    profile: {
      startDate: todayLocalISO(),
      durationDays: 90,
      startWeight: 84,
      targetWeight: 74
    },
    entries: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const data = JSON.parse(raw);
    return normalizeState(data);
  } catch (error) {
    console.warn("Impossible de lire les données locales", error);
    return defaultState();
  }
}

function normalizeState(data) {
  const fallback = defaultState();

  const profile = {
    startDate: data?.profile?.startDate || fallback.profile.startDate,
    durationDays: Number(data?.profile?.durationDays) || fallback.profile.durationDays,
    startWeight: Number(data?.profile?.startWeight) || fallback.profile.startWeight,
    targetWeight: Number(data?.profile?.targetWeight) || fallback.profile.targetWeight
  };

  const entries = Array.isArray(data?.entries)
    ? data.entries
        .filter((entry) => entry && entry.date)
        .map((entry) => ({
          date: entry.date,
          weight: toOptionalNumber(entry.weight),
          waist: toOptionalNumber(entry.waist),
          habits: {
            water: Boolean(entry?.habits?.water),
            steps: Boolean(entry?.habits?.steps),
            workout: Boolean(entry?.habits?.workout),
            calories: Boolean(entry?.habits?.calories),
            noSoda: Boolean(entry?.habits?.noSoda),
            sleep: Boolean(entry?.habits?.sleep)
          },
          mood: String(entry.mood || "")
        }))
    : [];

  return { profile, entries: sortEntries(entries) };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getEntry(date) {
  return state.entries.find((entry) => entry.date === date) || null;
}

function upsertEntry(entry) {
  const index = state.entries.findIndex((item) => item.date === entry.date);
  if (index >= 0) {
    state.entries[index] = entry;
  } else {
    state.entries.push(entry);
  }
  state.entries = sortEntries(state.entries);
  saveState();
}

function getLatestEntryWithWeight() {
  const withWeight = state.entries.filter((entry) => typeof entry.weight === "number");
  return withWeight.at(-1) || null;
}

function getCurrentWeight() {
  return getLatestEntryWithWeight()?.weight ?? state.profile.startWeight;
}

function getDayNumber() {
  const start = parseLocalDate(state.profile.startDate);
  const today = parseLocalDate(todayLocalISO());
  const diffMs = today - start;
  const diffDays = Math.floor(diffMs / 86400000) + 1;
  return clamp(diffDays, 1, state.profile.durationDays);
}

function getProgress() {
  const start = state.profile.startWeight;
  const target = state.profile.targetWeight;
  const current = getCurrentWeight();
  const totalToLose = start - target;

  if (totalToLose <= 0) return 0;

  const lost = start - current;
  return clamp((lost / totalToLose) * 100, 0, 100);
}

function countHabits(entry) {
  if (!entry) return 0;
  return habitKeys.reduce((total, key) => total + (entry.habits?.[key] ? 1 : 0), 0);
}

function renderDashboard() {
  const current = getCurrentWeight();
  const start = state.profile.startWeight;
  const target = state.profile.targetWeight;
  const lost = Math.max(0, start - current);
  const remaining = Math.max(0, current - target);
  const progress = getProgress();
  const day = getDayNumber();

  el.dayNumber.textContent = `Jour ${day}`;
  el.dayTotal.textContent = `/ ${state.profile.durationDays}`;
  el.currentWeight.textContent = formatKg(current);
  el.targetWeight.textContent = formatKg(target);
  el.lostWeight.textContent = formatKg(lost);
  el.remainingWeight.textContent = formatKg(remaining);
  el.progressText.textContent = `${Math.round(progress)} %`;
  el.progressFill.style.width = `${progress}%`;
}

function renderSettings() {
  el.startDateInput.value = state.profile.startDate;
  el.durationInput.value = state.profile.durationDays;
  el.startWeightInput.value = state.profile.startWeight;
  el.targetWeightInput.value = state.profile.targetWeight;
}

function setHabitInputs(habits = {}) {
  el.habitWater.checked = Boolean(habits.water);
  el.habitSteps.checked = Boolean(habits.steps);
  el.habitWorkout.checked = Boolean(habits.workout);
  el.habitCalories.checked = Boolean(habits.calories);
  el.habitNoSoda.checked = Boolean(habits.noSoda);
  el.habitSleep.checked = Boolean(habits.sleep);
}

function getHabitInputs() {
  return {
    water: el.habitWater.checked,
    steps: el.habitSteps.checked,
    workout: el.habitWorkout.checked,
    calories: el.habitCalories.checked,
    noSoda: el.habitNoSoda.checked,
    sleep: el.habitSleep.checked
  };
}

function loadEntryIntoForm(date) {
  const entry = getEntry(date);
  el.entryDate.value = date;

  if (entry) {
    el.entryWeight.value = entry.weight ?? "";
    el.entryWaist.value = entry.waist ?? "";
    el.entryMood.value = entry.mood ?? "";
    setHabitInputs(entry.habits);
    return;
  }

  el.entryWeight.value = getCurrentWeight() || "";
  el.entryWaist.value = "";
  el.entryMood.value = "";
  setHabitInputs({});
}

function renderHistory() {
  if (state.entries.length === 0) {
    el.historyList.innerHTML = `<p class="hint">Aucune journée enregistrée pour le moment.</p>`;
    return;
  }

  const recentEntries = [...state.entries].reverse().slice(0, 30);

  el.historyList.innerHTML = recentEntries.map((entry) => {
    const habitScore = countHabits(entry);
    const meta = [
      typeof entry.weight === "number" ? `Poids : ${formatKg(entry.weight)}` : null,
      typeof entry.waist === "number" ? `Taille : ${entry.waist.toFixed(1).replace(".", ",")} cm` : null
    ].filter(Boolean);

    const checkedHabits = habitKeys
      .filter((key) => entry.habits?.[key])
      .map((key) => habitLabels[key])
      .join(" · ");

    return `
      <article class="history-item">
        <div class="history-head">
          <span class="history-date">${formatDateFr(entry.date)}</span>
          <span class="history-score">${habitScore}/6</span>
        </div>
        <p class="history-meta">${meta.join(" · ") || "Aucune mesure"}</p>
        <p class="history-meta">${checkedHabits || "Aucune case cochée"}</p>
        ${entry.mood ? `<p class="history-mood">${escapeHtml(entry.mood)}</p>` : ""}
      </article>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderChart() {
  const canvas = el.chart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 32, right: 28, bottom: 48, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  const points = state.entries
    .filter((entry) => typeof entry.weight === "number")
    .map((entry) => ({ date: entry.date, weight: entry.weight }));

  const allWeights = [
    state.profile.startWeight,
    state.profile.targetWeight,
    ...points.map((point) => point.weight)
  ];

  const minWeight = Math.floor(Math.min(...allWeights) - 1);
  const maxWeight = Math.ceil(Math.max(...allWeights) + 1);
  const range = Math.max(1, maxWeight - minWeight);

  function xForIndex(index, total) {
    if (total <= 1) return padding.left + plotW / 2;
    return padding.left + (index / (total - 1)) * plotW;
  }

  function yForWeight(weight) {
    return padding.top + ((maxWeight - weight) / range) * plotH;
  }

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#9ca3af";
  ctx.font = "22px system-ui";

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i / 4) * plotH;
    const weight = maxWeight - (i / 4) * range;

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillText(`${weight.toFixed(0)} kg`, 8, y + 7);
  }

  // target line
  const targetY = yForWeight(state.profile.targetWeight);
  ctx.strokeStyle = "rgba(34,197,94,0.85)";
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(padding.left, targetY);
  ctx.lineTo(width - padding.right, targetY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#86efac";
  ctx.fillText("Objectif", width - padding.right - 92, targetY - 10);

  if (points.length === 0) {
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";
    ctx.font = "24px system-ui";
    ctx.fillText("Ajoute ton premier poids pour afficher le graphique", width / 2, height / 2);
    ctx.textAlign = "left";
    el.chartHint.textContent = "En attente";
    return;
  }

  // line
  ctx.strokeStyle = "#fb923c";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  points.forEach((point, index) => {
    const x = xForIndex(index, points.length);
    const y = yForWeight(point.weight);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = "#f97316";
  points.forEach((point, index) => {
    const x = xForIndex(index, points.length);
    const y = yForWeight(point.weight);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // labels x
  ctx.fillStyle = "#9ca3af";
  ctx.font = "20px system-ui";
  ctx.textAlign = "center";

  const first = points[0];
  const last = points.at(-1);
  ctx.fillText(formatDateFr(first.date), padding.left, height - 14);
  ctx.fillText(formatDateFr(last.date), width - padding.right, height - 14);
  ctx.textAlign = "left";

  el.chartHint.textContent = `${points.length} mesure${points.length > 1 ? "s" : ""}`;
}

function renderAll() {
  renderDashboard();
  renderSettings();
  renderHistory();
  renderChart();
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const content = JSON.stringify(state, null, 2);
  downloadFile(`projet-phoenix-${todayLocalISO()}.json`, content, "application/json;charset=utf-8");
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function exportCsv() {
  const header = [
    "date",
    "poids_kg",
    "tour_taille_cm",
    "eau_2l",
    "pas_8000",
    "sport",
    "calories_ok",
    "pas_de_soda",
    "sommeil_ok",
    "score_habitudes",
    "ressenti"
  ];

  const rows = state.entries.map((entry) => [
    entry.date,
    entry.weight ?? "",
    entry.waist ?? "",
    entry.habits.water ? 1 : 0,
    entry.habits.steps ? 1 : 0,
    entry.habits.workout ? 1 : 0,
    entry.habits.calories ? 1 : 0,
    entry.habits.noSoda ? 1 : 0,
    entry.habits.sleep ? 1 : 0,
    countHabits(entry),
    entry.mood || ""
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(";"))
    .join("\n");

  downloadFile(`projet-phoenix-${todayLocalISO()}.csv`, csv, "text/csv;charset=utf-8");
}

function resetAll() {
  const confirmed = confirm("Réinitialiser toutes les données locales du Projet Phoenix ?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  loadEntryIntoForm(todayLocalISO());
  renderAll();
}

function clearSelectedDay() {
  const date = el.entryDate.value;
  const entry = getEntry(date);
  if (!entry) return;

  const confirmed = confirm(`Effacer les données du ${formatDateFr(date)} ?`);
  if (!confirmed) return;

  state.entries = state.entries.filter((item) => item.date !== date);
  saveState();
  loadEntryIntoForm(date);
  renderAll();
}

function importJsonFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = normalizeState(JSON.parse(reader.result));
      const confirmed = confirm("Importer ce fichier JSON et remplacer les données actuelles ?");
      if (!confirmed) return;

      state = imported;
      saveState();
      loadEntryIntoForm(todayLocalISO());
      renderAll();
    } catch (error) {
      alert("Import impossible : fichier JSON invalide.");
      console.error(error);
    }
  };

  reader.readAsText(file);
}

let state = loadState();

el.openSettingsBtn.addEventListener("click", () => {
  el.settingsPanel.classList.toggle("hidden");
});

el.saveSettingsBtn.addEventListener("click", () => {
  const startDate = el.startDateInput.value || todayLocalISO();
  const durationDays = Number(el.durationInput.value);
  const startWeight = Number(el.startWeightInput.value);
  const targetWeight = Number(el.targetWeightInput.value);

  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    alert("La durée du projet doit être supérieure à 0.");
    return;
  }

  if (!Number.isFinite(startWeight) || !Number.isFinite(targetWeight)) {
    alert("Les poids doivent être valides.");
    return;
  }

  state.profile = {
    startDate,
    durationDays,
    startWeight,
    targetWeight
  };

  saveState();
  renderAll();
  el.settingsPanel.classList.add("hidden");
});

el.entryDate.addEventListener("change", () => {
  loadEntryIntoForm(el.entryDate.value);
});

el.entryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const entry = {
    date: el.entryDate.value || todayLocalISO(),
    weight: toOptionalNumber(el.entryWeight.value),
    waist: toOptionalNumber(el.entryWaist.value),
    habits: getHabitInputs(),
    mood: el.entryMood.value.trim()
  };

  upsertEntry(entry);
  renderAll();

  el.saveMessage.textContent = "Journée enregistrée.";
  setTimeout(() => {
    el.saveMessage.textContent = "";
  }, 2200);
});

el.clearTodayBtn.addEventListener("click", clearSelectedDay);
el.exportJsonBtn.addEventListener("click", exportJson);
el.exportCsvBtn.addEventListener("click", exportCsv);
el.resetBtn.addEventListener("click", resetAll);

el.importJsonInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importJsonFile(file);
  event.target.value = "";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.info("Service worker non actif dans ce contexte.", error);
    });
  });
}

loadEntryIntoForm(todayLocalISO());
renderAll();
