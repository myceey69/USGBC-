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
sections.forEach(s=>obs.observe(s));
// --------- Expand/Collapse all ----------
const expandAllBtn = document.getElementById('expandAll');
const collapseAllBtn = document.getElementById('collapseAll');
function setAll(open){
  document.querySelectorAll('details').forEach(d=>d.open = open);
}
expandAllBtn.addEventListener('click', ()=>setAll(true));
collapseAllBtn.addEventListener('click', ()=>setAll(false));
// --------- Tank sizing calculator ----------
function calcTank(){
  const A = +roofArea.value;     // sq ft
  const R = +rainIn.value;       // inches
  const eff = +effEl.value;
  const gpm = +gpmEl.value;
  const min = +minutesEl.value;
  const days = +daysEl.value;
  const harvested = A * R * 0.623 * eff;          // gallons/year
  const fire = gpm * min;                          // gallons
  const domestic = 50 * 3 * days;                  // gallons (50 gpd x 3 people x days)
  const needed = Math.ceil(fire + domestic);
  const recommended = Math.ceil(Math.max(needed, harvested * 0.25)); // suggest at least 25% of annual capture
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
// --------- Anchor links smooth scroll ----------
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

/* ==================== Wildfire Events module (appearance-only changes live in CSS) ==================== */
(function () {
  const els = {
    form:   document.getElementById('wf-form'),
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
  if(!els.form) return;

  const wfLayer = L.layerGroup().addTo(map);

  // locale-safe parsing
  function parseDec(v){
    if (v == null) return NaN;
    let s = String(v).trim();
    s = s.replace(/\u2212|\u2012|\u2013|\u2014/g, '-');
    s = s.replace(/,/g, '.').replace(/\s+/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clearAll() {
    els.minLon.value = '0';
    els.minLat.value = '0';
    els.maxLon.value = '0';
    els.maxLat.value = '0';
    els.days.value   = '0';
    els.start.value  = '';
    els.end.value    = '';
    els.summary.textContent = 'No data yet.';
    els.tbody.innerHTML = '';
    wfLayer.clearLayers();
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

    const pts = [];
    wfLayer.eachLayer(l => { if(l.getLatLng) pts.push(l.getLatLng()); });
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.2));
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const minLon = parseDec(els.minLon.value);
    const minLat = parseDec(els.minLat.value);
    const maxLon = parseDec(els.maxLon.value);
    const maxLat = parseDec(els.maxLat.value);
    const days   = parseInt(String(parseDec(els.days.value) || 0), 10);

    const firstBad =
      [ [els.minLon,minLon], [els.minLat,minLat], [els.maxLon,maxLon], [els.maxLat,maxLat], [els.days, days] ]
      .find(([el,val]) => !Number.isFinite(val));
    if (firstBad) {
      els.summary.textContent = 'Please enter valid numbers (decimals with dot or comma are OK).';
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

  clearAll();
})();
