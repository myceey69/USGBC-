// --------- Search / TOC highlighting ----------
const search = document.querySelector('#search');
const tocLinks = [...document.querySelectorAll('#toc a')];
const sections = tocLinks.map(a => document.querySelector(a.getAttribute('href')));

function filterTOC(q){
  const t = q.trim().toLowerCase();
  tocLinks.forEach(a=>{
    const match = a.textContent.toLowerCase().includes(t);
    a.style.display = match ? 'block' : 'none';
  });
}

search.addEventListener('input', e=>filterTOC(e.target.value));

// Active link on scroll
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    const id = '#' + e.target.id;
    const link = tocLinks.find(a => a.getAttribute('href')===id);
    if(e.isIntersecting){
      tocLinks.forEach(x=>x.classList.remove('active'));
      link?.classList.add('active');
    }
  });
}, { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 });

sections.forEach(s=>s && obs.observe(s));



// --------- Tank sizing calculator ----------
function calcTank(){
  const A = +roofArea.value;     // sq ft
  const R = +rainIn.value;       // inches
  const eff = +effEl.value;
  const gpm = +gpmEl.value;
  const min = +minutesEl.value;
  const days = +daysEl.value;

  const harvested = A * R * 0.623 * eff;          // gallons/year
  const fire = gpm * min;                         // gallons
  const domestic = 50 * 3 * days;                 // gallons
  const needed = Math.ceil(fire + domestic);
  const recommended = Math.ceil(Math.max(needed, harvested * 0.25));

  tankResult.textContent =
    `Recommended storage ≈ ${recommended.toLocaleString()} gallons `
    + `(fire: ${fire.toLocaleString()} + domestic: ${domestic.toLocaleString()}, `
    + `annual harvest ~ ${Math.ceil(harvested).toLocaleString()} gal).`;
}

const roofArea = document.getElementById('roofArea');
const rainIn   = document.getElementById('rainIn');
const effEl    = document.getElementById('eff');
const gpmEl    = document.getElementById('gpm');
const minutesEl= document.getElementById('minutes');
const daysEl   = document.getElementById('days');

document.getElementById('calcBtn').addEventListener('click', calcTank);

// --------- Checklist ----------
const checklistItems = [
  "Non-combustible exterior cladding (Class A or metal/cementitious)",
  "Tempered glass windows; ember-resistant attic/soffit vents",
  "Class A roof; clear debris from gutters & roof valleys",
  "0–5 ft ‘ignition-free’ zone: gravel/hardscape only",
  "5–30 ft lean, clean, and green landscaping (native/drought-tolerant)",
  "Ladder fuels removed; limb trees 6–10 ft up from ground",
  "Metal mesh (1/8” or less) on vents; seal gaps, weatherstrip doors",
  "Addressable signage; visible hydrant/standpipe access",
  "Solar + battery storage for outage resilience",
  "Rainwater tank with firefighter outlet (NST thread or local standard)"
];

const checklist = document.getElementById('checklist');
const progress = document.getElementById('progress');

function renderChecklist(){
  checklist.innerHTML = "";
  checklistItems.forEach((t,i)=>{
    const id = "c"+i;
    const wrap = document.createElement('label');
    wrap.className = 'check-item';
    wrap.innerHTML = `<input id="${id}" type="checkbox" /> <span>${t}</span>`;
    checklist.appendChild(wrap);
  });
  checklist.addEventListener('change', updateProgress);
  updateProgress();
}

function updateProgress(){
  const checks = checklist.querySelectorAll('input[type=checkbox]');
  const done = Array.from(checks).filter(c=>c.checked).length;
  progress.textContent = `${done} of ${checks.length} completed`;
}

renderChecklist();

// --------- Map ----------
const map = L.map('map', { scrollWheelZoom:false }).setView([34.19, -118.13], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

const hubs = [
  { name: "Recovery Hub — 540 W Woodbury Rd (placeholder)", coords:[34.1705, -118.1610] },
  { name: "Pasadena Disaster Recovery Center (placeholder)", coords:[34.1479, -118.1445] },
  { name: "LACoFD Station 11 (monitoring) — placeholder", coords:[34.187, -118.130] },
  { name: "Supermarket Node (741 E Altadena Dr, placeholder)", coords:[34.190, -118.123] },
];

hubs.forEach(h=>{
  L.marker(h.coords).addTo(map).bindPopup(`<strong>${h.name}</strong>`);
});

// --------- Keyboard focus for a11y ----------
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({ behavior:'smooth', block:'start' });
      history.replaceState(null, "", id);
    }
  })
});

/* ==================== Wildfire Events (added; scoped; runs after map) ==================== */
(function () {
  const form = document.getElementById('wf-form');
  if (!form) return; // only if widget exists

  const els = {
    minLon: document.getElementById('wfMinLon'),
    minLat: document.getElementById('wfMinLat'),
    maxLon: document.getElementById('wfMaxLon'),
    maxLat: document.getElementById('wfMaxLat'),
    days:   document.getElementById('wfDays'),
    start:  document.getElementById('wfStart'),
    end:    document.getElementById('wfEnd'),
    run:    document.getElementById('wfRun'),
    clear:  document.getElementById('wfClear'),
    summary:document.getElementById('wfSummary'),
    tbody:  document.getElementById('wfTbody')
  };

  // Chart.js setup
  let wildfireChart = null;
  const chartCtx = document.getElementById('wildfireChart');
  
  if (chartCtx) {
    wildfireChart = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'California Wildfires Over Time',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'California Wildfire Events Timeline'
          },
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Number of Wildfires'
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Set California bounds as default
  els.minLon.value = '-125';
  els.minLat.value = '32';
  els.maxLon.value = '-114';
  els.maxLat.value = '42';
  els.days.value = '365';

  const wfLayer = L.layerGroup().addTo(map);

  // locale-safe decimal parsing; accepts comma and Unicode minus
  function parseDec(v){
    if (v == null) return NaN;
    let s = String(v).trim();
    s = s.replace(/\u2212|\u2012|\u2013|\u2014/g, '-'); // minus variants
    s = s.replace(/,/g, '.').replace(/\s+/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clearAll() {
    els.minLon.value = '';
    els.minLat.value = '';
    els.maxLon.value = '';
    els.maxLat.value = '';
    els.days.value   = '';
    els.start.value    = '';
    els.end.value    = '';
    els.summary.textContent = 'No data yet.';
    els.tbody.innerHTML = '';
    wfLayer.clearLayers();
    
    // Clear the chart data
    if (wildfireChart) {
      wildfireChart.data.labels = [];
      wildfireChart.data.datasets[0].data = [];
      wildfireChart.update();
    }
  }
  els.clear.addEventListener('click', clearAll);

  function buildEonetURL(p) {
    const bbox = [p.minLon, p.maxLat, p.maxLon, p.minLat].join(',');
    const u = new URL('https://eonet.gsfc.nasa.gov/api/v3/events/geojson');
    u.searchParams.set('category', 'wildfires');
    u.searchParams.set('bbox', bbox);
    if (p.days && p.days > 0) {
      u.searchParams.set('days', String(p.days));
    } else {
      if (p.start) u.searchParams.set('start', p.start);
      if (p.end)   u.searchParams.set('end', p.end);
    }
    return u.toString();
  }

  function updateWildfireChart(features) {
    if (!wildfireChart || !features.length) return;

    // Aggregate wildfire data by date
    const dateCounts = {};
    
    features.forEach(f => {
      const p = f.properties || {};
      if (p.date) {
        const date = new Date(p.date).toISOString().split('T')[0]; // YYYY-MM-DD format
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    // Sort dates and prepare chart data
    const sortedDates = Object.keys(dateCounts).sort();
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = sortedDates.map(date => dateCounts[date]);

    // Update chart
    wildfireChart.data.labels = labels;
    wildfireChart.data.datasets[0].data = data;
    wildfireChart.update();
  }

  function renderTable(features) {
    els.tbody.innerHTML = '';
    wfLayer.clearLayers();

    features.forEach((f, i) => {
      const p = f.properties || {};
      const g = f.geometry || {};
      let lat = null, lon = null;

      if (g.type === 'Point' && Array.isArray(g.coordinates)) {
        [lon, lat] = g.coordinates;
      } else if (g.type === 'Polygon' && g.coordinates?.[0]?.[0]) {
        lon = g.coordinates[0][0][0]; lat = g.coordinates[0][0][1];
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${p.date || '—'}</td>
        <td>${p.title || 'Wildfire event'}</td>
        <td>${lat != null ? lat.toFixed(3) : '—'}</td>
        <td>${lon != null ? lon.toFixed(3) : '—'}</td>
        <td>${p.closed ? 'closed' : 'open'}</td>
        <td>${(p.sources||[]).map(s=>s.id).join(', ') || '—'}</td>
      `;
      els.tbody.appendChild(tr);

      if (lat != null && lon != null) {
        const m = L.marker([lat, lon]).bindPopup(`<b>${p.title || 'Wildfire'}</b><br>${p.date || ''}`);
        wfLayer.addLayer(m);
      }
    });

    // Update chart with wildfire data
    updateWildfireChart(features);

    const pts = [];
    wfLayer.eachLayer(l => { if(l.getLatLng) pts.push(l.getLatLng()); });
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.2));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent jump to top

    const minLon = parseDec(els.minLon.value);
    const minLat = parseDec(els.minLat.value);
    const maxLon = parseDec(els.maxLon.value);
    const maxLat = parseDec(els.maxLat.value);
    const days   = parseInt(String(parseDec(els.days.value) || 0), 10);

    const firstBad =
      [ [els.minLon,minLon], [els.minLat,minLat], [els.maxLon,maxLon], [els.maxLat,maxLat], [els.days, days] ]
      .find(([el,val]) => !Number.isFinite(val));
    if (firstBad) {
      els.summary.textContent = 'Please enter valid numbers (decimals with dot or comma).';
      firstBad[0].focus();
      return;
    }

    const params = {
      minLon: Math.min(Math.max(minLon, -180), 180),
      minLat: Math.min(Math.max(minLat,  -90),  90),
      maxLon: Math.min(Math.max(maxLon, -180), 180),
      maxLat: Math.min(Math.max(maxLat,  -90),  90),
      days:   Math.max(days, 0),
      start:  (els.start.value || '').trim(),
      end:    (els.end.value || '').trim()
    };

    els.summary.textContent = 'Loading…';

    try {
      const url = buildEonetURL(params);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      els.summary.textContent = `${features.length} event(s) loaded.`;
      renderTable(features);
    } catch (err) {
      console.error(err);
      els.summary.textContent = `Error: ${err.message}`;
      els.tbody.innerHTML = '';
      wfLayer.clearLayers();
    }
  });
  
  /* ==================== ADU Explorer ==================== */
const adus = [
  {
    name: "Fire-Resistant Modular",
    cost: "$$",
    energy: "A+",
    water: "A",
    wildfire: "High",
    equity: "Strong",
    desc: "Metal-frame prefab with Class A roof, solar battery, and fire-rated cladding.",
    model: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb",
    mapTag: "hub"
  },
  
  {
    name: "Greywater-Ready Backyard Unit",
    cost: "$",
    energy: "B+",
    water: "A+",
    wildfire: "Medium",
    equity: "Strong",
    desc: "Simple stick-built ADU with rainwater and greywater reuse integration.",
    model: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
    mapTag: "water"
  },
  
  {
    name: "Solar Micro-ADU",
    cost: "$$$",
    energy: "A++",
    water: "B",
    wildfire: "High",
    equity: "Moderate",
    desc: "Off-grid capable micro-unit ideal for community hubs or senior housing.",
    model:"https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    mapTag: "solar"
  }
];

const aduGrid = document.getElementById('aduGrid');
const aduViewer = document.getElementById('aduViewer');
const aduModel = document.getElementById('aduModel');
const aduTitle = document.getElementById('aduTitle');
const aduDesc = document.getElementById('aduDesc');
const aduClose = document.getElementById('aduClose');

adus.forEach(a => {
  const card = document.createElement('div');
  card.className = 'adu-card';
  card.innerHTML = `
    <h4>${a.name}</h4>
    <p class="small">${a.desc}</p>
    <ul class="metrics">
      <li><b>Energy:</b> ${a.energy}</li>
      <li><b>Water:</b> ${a.water}</li>
      <li><b>Wildfire safety:</b> ${a.wildfire}</li>
      <li><b>Equity:</b> ${a.equity}</li>
      <li><b>Cost:</b> ${a.cost}</li>
    </ul>`;
  card.addEventListener('click', () => showADU(a));
  aduGrid.appendChild(card);
});

function showADU(a) {
  aduViewer.hidden = false;
  aduTitle.textContent = a.name;
  aduDesc.textContent = a.desc;
  aduModel.src = a.model;

  // Optionally highlight on the map
  if (window.map && a.mapTag) {
    map.eachLayer(l => {
      if (l.getPopup && l.getPopup().getContent().includes(a.mapTag)) {
        l.openPopup();
      }
    });
  }
}

aduClose.addEventListener('click', () => {
  aduViewer.hidden = true;
  aduModel.src = '';
});

/* === Hotspots for ADU models (add below your ADU Explorer code) === */
adus[0].hotspots = [
  {label:"Solar roof (Class A)", pos:"0 0 1.55", normal:"0 0 -1"},
  {label:"Ember-safe cladding",  pos:"-1.6 0 0.9", normal:"1 0 0"}
];
adus[1].hotspots = [
  {label:"Rain barrel",          pos:"-1.4 -0.9 0.9", normal:"1 0 0"},
  {label:"Greywater reuse",      pos:"0 0 0.1", normal:"0 0 1"}
];
adus[2].hotspots = [
  {label:"Solar array",          pos:"0 -0.1 1.1", normal:"0 0 -1"},
  {label:"Battery pack",         pos:"1.2 0 0.5", normal:"-1 0 0"}
];

function clearHotspots() {
  // remove previous hotspots
  [...aduModel.querySelectorAll('button[slot^="hotspot"]')].forEach(b=>b.remove());
}

function addHotspots(hs=[]) {
  hs.forEach((h, idx) => {
    const btn = document.createElement('button');
    btn.className = 'hotspot';
    btn.setAttribute('slot', `hotspot-${idx}`);
    btn.setAttribute('data-position', h.pos);   // "x y z"
    btn.setAttribute('data-normal', h.normal);  // "nx ny nz"
    btn.textContent = h.label;
    aduModel.appendChild(btn);
  });
}

// augment showADU to render hotspots
const _origShowADU = showADU;
showADU = function(a){
  aduViewer.hidden = false;
  aduTitle.textContent = a.name;
  aduDesc.textContent = a.desc;
  aduModel.src = a.model;
  clearHotspots();
  addHotspots(a.hotspots || []);

  if (window.map && a.mapTag) {
    map.eachLayer(l => {
      if (l.getPopup && l.getPopup().getContent().includes(a.mapTag)) l.openPopup();
    });
  }
};

/* ==================== House / ADU Wildfire Tester logic ==================== */

const wtRun = document.getElementById('wtRun');
const wtResult = document.getElementById('wtResult');

function computeWildfireRating() {
  if (!wtRun || !wtResult) return;

  const getVal = id => {
    const el = document.getElementById(id);
    const v = el ? parseFloat(el.value) : 0;
    return Number.isFinite(v) ? v : 0;
  };

  const roof       = getVal('wtRoof');
  const walls      = getVal('wtWalls');
  const space      = getVal('wtSpace');
  const vents      = getVal('wtVents');
  const windows    = getVal('wtWindows');
  const water      = getVal('wtWater');
  const exposure   = getVal('wtExposure');
  const sprinklers = getVal('wtSprinklers');

  // Raw score can be slightly negative if exposure is bad; shift to 0–24,
  // then map to 1–10.
  let raw = roof + walls + space + vents + windows + water + exposure + sprinklers;
  let shifted = raw + 2; // move -2..22 range to 0..24
  if (shifted < 0) shifted = 0;
  if (shifted > 24) shifted = 24;

  let rating = Math.round(1 + (shifted * 9) / 24);
  if (rating < 1) rating = 1;
  if (rating > 10) rating = 10;

  let status;
  let advice;

  if (rating <= 3) {
    status = 'Not wildfire-hardened / not approved';
    advice = 'Add a Class A roof, non-combustible siding, an ignition-free 0–5 ft zone, and ember-resistant vents as a starting point.';
  } else if (rating <= 6) {
    status = 'Partially hardened – needs work before approval';
    advice = 'Focus on vents/eaves, windows, and defensible space to reduce ember exposure and radiant heat.';
  } else if (rating <= 8) {
    status = 'Substantially hardened – close to good practice';
    advice = 'Work with your local fire authority or WUI code official to confirm details and address any remaining weak spots.';
  } else {
    status = 'Highly hardened – best-practice features present';
    advice = 'Verify tank sizing, hose connections, and maintenance plans with local fire codes and water providers.';
  }

  wtResult.textContent =
    `Wildfire safety rating: ${rating}/10 – ${status}. ${advice}`;
}

if (wtRun) {
  wtRun.addEventListener('click', computeWildfireRating);
}

// Initialize wildfire tool state at load
  clearAll();
})();

/* ==================== House Photo Upload With Size Limit + Styled Warning ==================== */

const photoInput = document.getElementById('housePhotoInput');
const photoPreview = document.getElementById('housePhotoPreview');
const photoWrapper = document.getElementById('photoPreviewWrapper');
const photoError = document.getElementById('photoError');

const MAX_SIZE_MB = 3;  // Set your limit here
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

if (photoInput) {
  photoInput.addEventListener('change', function () {
    const file = photoInput.files[0];
    if (!file) return;

    // Reset previous messages
    photoError.style.display = "none";
    photoError.textContent = "";

    // Check size
    if (file.size > MAX_BYTES) {

      photoError.textContent = `⚠️ Image too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`;
      photoError.style.display = "block";

      // Reset preview
      photoInput.value = "";
      photoWrapper.hidden = true;
      photoPreview.src = "";

      return;
    }

    // Display preview
    const url = URL.createObjectURL(file);
    photoPreview.src = url;
    photoWrapper.hidden = false;
  });
}

/* ==================== Delete House Photo Function ==================== */

const deleteBtn = document.getElementById('deletePhotoBtn');

if (deleteBtn) {
  deleteBtn.addEventListener('click', function () {
    // Clear preview
    photoPreview.src = "";
    photoWrapper.hidden = true;

    // Reset file input
    photoInput.value = "";

    // Hide error message if any
    if (photoError) {
      photoError.style.display = "none";
      photoError.textContent = "";
    }
  });
}

// === SAFETY METER ===
function updateSafetyMeter() {
  const checks = checklist.querySelectorAll('input[type=checkbox]');
  const done = Array.from(checks).filter(c => c.checked).length;
  const percent = Math.round((done / checks.length) * 100);

  const fill = document.getElementById('meterFill');
  const text = document.getElementById('meterText');

  if (fill) fill.style.width = percent + "%";
  if (text) text.textContent = percent + "% complete";
}

document.addEventListener("change", function(e) {
    if (e.target.closest("#checklist")) {
        updateSafetyMeter();
    }
});
