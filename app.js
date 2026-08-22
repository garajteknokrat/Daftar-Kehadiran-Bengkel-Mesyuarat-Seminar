// ====== KONFIGURASI ======
// Ganti dengan URL Web App Google Apps Script anda selepas deploy (lihat SETUP.md)
const API_URL = "https://script.google.com/macros/s/AKfycbxAq1ThDR4N_XD42uGUffii0wETbqD9gFKRPDeq-8E_2O8AmkApEHybbG_LBYI4ZMJZWw/exec";

// ====== HELPER API ======
async function apiGet(action, params = {}) {
  try {
    const url = new URL(API_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: "Respons tidak sah dari server (bukan JSON). Semak sama ada Apps Script sudah di-deploy sebagai versi terkini." };
    }
  } catch (err) {
    return { error: "Gagal hubungi server: " + err.message };
  }
}

async function apiPost(action, payload = {}) {
  try {
    // Content-Type text/plain sengaja digunakan supaya browser tidak hantar
    // 'preflight' OPTIONS request, sebab Google Apps Script tidak layan OPTIONS.
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: "Respons tidak sah dari server (bukan JSON). Semak sama ada Apps Script sudah di-deploy sebagai versi terkini." };
    }
  } catch (err) {
    return { error: "Gagal hubungi server: " + err.message };
  }
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

// ====== SIJIL (SERTIFIKAT) ======
// Koordinat dilaras khusus untuk assets/sijil-template.png (Sijil Penghargaan
// rasmi BPLTV, 1653×2339px). Kalau template diganti dengan versi lain saiz
// berbeza, laraskan width/height dan kedudukan y setiap medan di bawah.
const SIJIL_CONFIG = {
  templateUrl: "assets/sijil-template.png",
  width: 1653,
  height: 2339,
  maxTextWidth: 1420,
  inkColor: "#0a0322",
  nama: { y: 870, font: "italic 62px Georgia, 'Times New Roman', serif" },
  peranan: { y: 1050, text: "PESERTA", font: "bold 32px Arial, sans-serif" },
  kursus: { yStart: 1258, lineHeight: 58, font: "bold 30px Arial, sans-serif" },
  tarikh: { y: 1503, font: "bold 32px Arial, sans-serif" },
  lokasi: { yStart: 1668, lineHeight: 56, font: "bold 28px Arial, sans-serif" },
};

let _sijilTemplateImg = null;
function loadSijilTemplate() {
  if (_sijilTemplateImg) return Promise.resolve(_sijilTemplateImg);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { _sijilTemplateImg = img; resolve(img); };
    img.onerror = reject;
    img.src = SIJIL_CONFIG.templateUrl;
  });
}

// Pecahkan teks panjang ke beberapa baris supaya muat dalam maxTextWidth.
function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawCentered(ctx, text, y) {
  ctx.fillText(text, SIJIL_CONFIG.width / 2, y);
}

function drawWrappedCentered(ctx, text, yStart, lineHeight) {
  const lines = wrapText(ctx, text, SIJIL_CONFIG.maxTextWidth);
  lines.forEach((line, i) => drawCentered(ctx, line, yStart + i * lineHeight));
}

// Hasilkan sijil sebagai data URL PNG, siap untuk dimuat turun.
async function generateSijilDataUrl({ nama, namaKursus, tarikh, lokasi }) {
  const img = await loadSijilTemplate();
  const canvas = document.createElement("canvas");
  canvas.width = SIJIL_CONFIG.width;
  canvas.height = SIJIL_CONFIG.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = SIJIL_CONFIG.inkColor;

  ctx.font = SIJIL_CONFIG.nama.font;
  drawCentered(ctx, nama, SIJIL_CONFIG.nama.y);

  ctx.font = SIJIL_CONFIG.peranan.font;
  drawCentered(ctx, SIJIL_CONFIG.peranan.text, SIJIL_CONFIG.peranan.y);

  ctx.font = SIJIL_CONFIG.kursus.font;
  drawWrappedCentered(ctx, (namaKursus || "").toUpperCase(), SIJIL_CONFIG.kursus.yStart, SIJIL_CONFIG.kursus.lineHeight);

  ctx.font = SIJIL_CONFIG.tarikh.font;
  drawCentered(ctx, tarikh, SIJIL_CONFIG.tarikh.y);

  if (lokasi) {
    ctx.font = SIJIL_CONFIG.lokasi.font;
    drawWrappedCentered(ctx, lokasi.toUpperCase(), SIJIL_CONFIG.lokasi.yStart, SIJIL_CONFIG.lokasi.lineHeight);
  }

  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

// ====== PWA ======
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

// ====== GPS (geofence kehadiran) ======
// Bungkus navigator.geolocation dalam Promise, senang guna dengan await.
function getCurrentPositionAsync(options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Peranti/pelayar ini tidak menyokong GPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
