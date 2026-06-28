import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*
    EcoAudit Demo

    Login is captcha-only.
    For production, use Firebase Authentication and strict Firestore rules.
*/

const firebaseConfig = {
    apiKey: "AIzaSyCsfnnAknKLhx5N1boV4_kdPtMTlWxGVaQ",
    authDomain: "ecoaudit-f8bc9.firebaseapp.com",
    projectId: "ecoaudit-f8bc9",
    storageBucket: "ecoaudit-f8bc9.firebasestorage.app",
    messagingSenderId: "21919473929",
    appId: "1:21919473929:web:695c2029d4e7721bfd33d8",
    measurementId: "G-8S57TTLFKW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM */

const authScreen = document.getElementById("auth-screen");
const authForm = document.getElementById("auth-form");
const appContent = document.getElementById("app-content");

const form = document.getElementById("waste-form");
const submitBtn = document.getElementById("submit-btn");
const statusMsg = document.getElementById("status-msg");
const logsContainer = document.getElementById("logs-container");

const totalWeightEl = document.getElementById("total-weight");
const co2SavedEl = document.getElementById("co2-saved");
const treesSavedEl = document.getElementById("trees-saved");
const verifiedCountEl = document.getElementById("verified-count");

const reportTotalWeightEl = document.getElementById("report-total-weight");
const reportCo2SavedEl = document.getElementById("report-co2-saved");
const reportTreesSavedEl = document.getElementById("report-trees-saved");

const clearBtn = document.getElementById("clear-btn");
const categorySelect = document.getElementById("category");

const dynamicInfo = document.getElementById("dynamic-info");
const infoTitle = document.getElementById("info-title");
const infoDesc = document.getElementById("info-desc");

const captchaCanvas = document.getElementById("captcha-canvas");
const refreshCaptchaBtn = document.getElementById("refresh-captcha");
const themeToggleBtn = document.getElementById("theme-toggle");
const downloadPdfBtn = document.getElementById("download-pdf");
const toast = document.getElementById("toast");

/* STATE */

let map = null;
let markerLayer = null;
let currentCaptcha = "";
let dashboardLoaded = false;

const ctx = captchaCanvas.getContext("2d");

/* WASTE INFO */

const wasteIntelligence = {
    Plastic: {
        title: "Harmful Impact: Plastic",
        desc: "Takes up to 500 years to decompose. It breaks down into microplastics that contaminate water, soil, and the food chain."
    },

    Paper: {
        title: "Harmful Impact: Paper",
        desc: "Excess paper disposal increases landfill load and drives higher demand for trees, water, and energy."
    },

    Organic: {
        title: "Harmful Impact: Organic Waste",
        desc: "When organic waste decomposes without oxygen in landfills, it releases methane, a powerful greenhouse gas."
    },

    Glass: {
        title: "Harmful Impact: Glass",
        desc: "Glass is recyclable, but discarded glass takes extremely long to break down and can physically harm ecosystems."
    },

    "E-Waste": {
        title: "Harmful Impact: E-Waste",
        desc: "E-waste can release toxic metals like lead, mercury, and cadmium into soil and water."
    }
};

/* HELPERS */

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function setStatus(message, type = "success") {
    statusMsg.style.color = type === "error" ? "#f43f5e" : "#2dd4bf";
    statusMsg.textContent = message;
}

function clearStatusLater() {
    setTimeout(() => {
        statusMsg.textContent = "";
    }, 3000);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* CAPTCHA */

function generateCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    currentCaptcha = "";

    for (let i = 0; i < 6; i++) {
        currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    ctx.clearRect(0, 0, captchaCanvas.width, captchaCanvas.height);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, captchaCanvas.width, captchaCanvas.height);

    for (let i = 0; i < 8; i++) {
        ctx.beginPath();

        ctx.moveTo(
            Math.random() * captchaCanvas.width,
            Math.random() * captchaCanvas.height
        );

        ctx.lineTo(
            Math.random() * captchaCanvas.width,
            Math.random() * captchaCanvas.height
        );

        ctx.strokeStyle = `rgba(45, 212, 191, ${Math.random() * 0.5})`;
        ctx.lineWidth = Math.random() * 2;
        ctx.stroke();
    }

    ctx.font = "bold 38px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.textBaseline = "middle";

    for (let i = 0; i < currentCaptcha.length; i++) {
        ctx.save();

        ctx.translate(
            30 + i * 32,
            35 + (Math.random() - 0.5) * 10
        );

        ctx.rotate((Math.random() - 0.5) * 0.5);
        ctx.fillText(currentCaptcha[i], -12, 0);
        ctx.restore();
    }
}

/* MAP */

function initMap() {
    if (map) {
        return;
    }

    map = L.map("map", {
        scrollWheelZoom: false
    }).setView([9.9252, 78.1198], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
}

function updateMap(logs) {
    initMap();

    markerLayer.clearLayers();

    const points = logs
        .filter(item => typeof item.latitude === "number" && typeof item.longitude === "number")
        .map(item => [item.latitude, item.longitude, item]);

    if (!points.length) {
        map.setView([9.9252, 78.1198], 12);
        return;
    }

    const bounds = [];

    points.forEach(([lat, lng, item]) => {
        bounds.push([lat, lng]);

        L.marker([lat, lng])
            .bindPopup(`
                <strong>${escapeHtml(item.category)}</strong><br>
                ${Number(item.weight).toFixed(1)} kg<br>
                ${escapeHtml(item.dateStr)}
            `)
            .addTo(markerLayer);
    });

    map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 15
    });
}

/* CATEGORY INFO */

categorySelect.addEventListener("change", event => {
    const selected = event.target.value;

    if (wasteIntelligence[selected]) {
        infoTitle.textContent = wasteIntelligence[selected].title;
        infoDesc.textContent = wasteIntelligence[selected].desc;
        dynamicInfo.classList.remove("hidden");
    } else {
        dynamicInfo.classList.add("hidden");
        infoTitle.textContent = "";
        infoDesc.textContent = "";
    }
});

/* CAPTCHA-ONLY LOGIN */

authForm.addEventListener("submit", event => {
    event.preventDefault();

    const captchaInput = document.getElementById("captcha-input").value.trim();
    const isCaptchaValid = captchaInput === currentCaptcha;

    if (isCaptchaValid) {
        document.getElementById("auth-error").textContent = "";

        authScreen.style.opacity = "0";

        setTimeout(() => {
            authScreen.style.display = "none";
            appContent.style.display = "block";

            initMap();

            setTimeout(() => {
                map.invalidateSize();
            }, 250);

            if (!dashboardLoaded) {
                loadDashboard();
                dashboardLoaded = true;
            }

            showToast("Dashboard access granted.");
        }, 450);
    } else {
        document.getElementById("auth-error").textContent =
            "Security check failed. Please enter the correct captcha.";

        document.getElementById("captcha-input").value = "";
        generateCaptcha();
    }
});

/* WASTE LOGGING */

form.addEventListener("submit", event => {
    event.preventDefault();

    const category = categorySelect.value;
    const weight = Number(document.getElementById("weight").value);

    if (!category || Number.isNaN(weight) || weight <= 0) {
        setStatus("Please choose category and enter valid weight.", "error");
        return;
    }

    submitBtn.disabled = true;
    setStatus("Verifying location & securing data...");

    if (!navigator.geolocation) {
        showError("Geolocation is not supported in this browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                await addDoc(collection(db, "wasteLogs"), {
                    category: category,
                    weight: weight,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy || null,
                    createdAt: serverTimestamp()
                });

                setStatus("Data successfully saved.");
                showToast("Waste log saved successfully.");

                form.reset();
                dynamicInfo.classList.add("hidden");

                clearStatusLater();
            } catch (error) {
                console.error(error);
                showError("Database save failed. Check Firebase rules/config.");
            } finally {
                submitBtn.disabled = false;
            }
        },

        error => {
            console.error(error);
            showError("Location permission is required for audit verification.");
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
});

function showError(message) {
    setStatus(message, "error");
    submitBtn.disabled = false;
}

/* DASHBOARD */

function loadDashboard() {
    const logsQuery = query(
        collection(db, "wasteLogs"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(
        logsQuery,

        snapshot => {
            logsContainer.innerHTML = "";

            let totalWeight = 0;
            const logs = [];

            if (snapshot.empty) {
                updateDashboardNumbers(0, 0, 0, 0);
                logsContainer.innerHTML = '<p class="empty-state">Awaiting audit data...</p>';
                updateMap([]);
                return;
            }

            snapshot.forEach(docSnap => {
                const data = docSnap.data();

                const weight = Number(data.weight) || 0;
                totalWeight += weight;

                const dateStr = data.createdAt
                    ? data.createdAt.toDate().toLocaleString()
                    : "Just now";

                const logItem = {
                    id: docSnap.id,
                    category: data.category || "Unknown",
                    weight: weight,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    dateStr: dateStr
                };

                logs.push(logItem);

                const card = document.createElement("div");
                card.className = "log-card";

                const lat =
                    typeof logItem.latitude === "number"
                        ? logItem.latitude.toFixed(4)
                        : "NA";

                const lng =
                    typeof logItem.longitude === "number"
                        ? logItem.longitude.toFixed(4)
                        : "NA";

                card.innerHTML = `
                    <h4>${escapeHtml(logItem.category)}</h4>

                    <div class="log-details">
                        <span><strong>Weight:</strong> ${logItem.weight.toFixed(1)} kg</span>
                        <span><strong>Loc:</strong> ${lat}, ${lng}</span>
                    </div>

                    <div class="log-details" style="margin-top:8px;">
                        <span>${escapeHtml(logItem.dateStr)}</span>
                    </div>
                `;

                logsContainer.appendChild(card);
            });

            const co2Prevented = totalWeight * 1.5;
            const treesEquivalent = co2Prevented / 21;
            const verifiedCount = logs.filter(item => item.latitude && item.longitude).length;

            updateDashboardNumbers(
                totalWeight,
                co2Prevented,
                treesEquivalent,
                verifiedCount
            );

            updateMap(logs);
        },

        error => {
            console.error(error);

            logsContainer.innerHTML = `
                <p class="empty-state">
                    Unable to load audit logs. Check Firestore rules and collection permission.
                </p>
            `;
        }
    );
}

function updateDashboardNumbers(totalWeight, co2Prevented, treesEquivalent, verifiedCount) {
    totalWeightEl.textContent = totalWeight.toFixed(1);
    co2SavedEl.textContent = co2Prevented.toFixed(1);
    treesSavedEl.textContent = treesEquivalent.toFixed(1);
    verifiedCountEl.textContent = String(verifiedCount);

    reportTotalWeightEl.textContent = totalWeight.toFixed(1);
    reportCo2SavedEl.textContent = co2Prevented.toFixed(1);
    reportTreesSavedEl.textContent = treesEquivalent.toFixed(1);
}

/* RESET */

clearBtn.addEventListener("click", async () => {
    const confirmed = confirm("⚠️ Permanently delete all audit logs?");

    if (!confirmed) {
        return;
    }

    try {
        clearBtn.textContent = "Purging...";
        clearBtn.disabled = true;

        const snapshot = await getDocs(collection(db, "wasteLogs"));

        await Promise.all(
            snapshot.docs.map(item => deleteDoc(doc(db, "wasteLogs", item.id)))
        );

        showToast("All audit logs cleared.");
    } catch (error) {
        console.error(error);
        alert("Purge failed. Check Firestore delete permission.");
    } finally {
        clearBtn.textContent = "🗑️ Reset";
        clearBtn.disabled = false;
    }
});

/* THEME */

themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const isLight = document.body.classList.contains("light-mode");

    themeToggleBtn.textContent = isLight ? "🌙 Dark Mode" : "☀️ Light Mode";
});

/* PDF EXPORT */

downloadPdfBtn.addEventListener("click", () => {
    if (typeof html2pdf === "undefined") {
        alert("PDF engine is not loaded.");
        return;
    }

    const element = document.getElementById("export-area");

    element.classList.add("pdf-print-mode");

    html2pdf()
        .set({
            margin: [0.5, 0.5, 0.5, 0.5],

            filename: "EcoAudit_Official_Report.pdf",

            image: {
                type: "jpeg",
                quality: 1
            },

            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            },

            jsPDF: {
                unit: "in",
                format: "letter",
                orientation: "portrait"
            }
        })

        .from(element)

        .save()

        .then(() => {
            element.classList.remove("pdf-print-mode");
            showToast("PDF exported successfully.");
        })

        .catch(error => {
            console.error(error);
            element.classList.remove("pdf-print-mode");
            alert("PDF export failed.");
        });
});

/* INIT */

generateCaptcha();

refreshCaptchaBtn.addEventListener("click", generateCaptcha);