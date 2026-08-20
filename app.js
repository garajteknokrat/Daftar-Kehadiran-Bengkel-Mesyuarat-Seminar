// ====== KONFIGURASI ======
// Ganti dengan URL Web App Google Apps Script anda selepas deploy (lihat SETUP.md)
const API_URL = "https://script.google.com/macros/s/AKfycbxAq1ThDR4N_XD42uGUffii0wETbqD9gFKRPDeq-8E_2O8AmkApEHybbG_LBYI4ZMJZWw/exec";

// ====== HELPER API ======
async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(action, payload = {}) {
  // Content-Type text/plain sengaja digunakan supaya browser tidak hantar
  // 'preflight' OPTIONS request, sebab Google Apps Script tidak layan OPTIONS.
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

// ====== HELPER UI ======
function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function csvDownload(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
