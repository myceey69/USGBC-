/* ---------- Search / TOC ---------- */
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
search?.addEventListener('input', e=>filterTOC(e.target.value));
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    const id = '#' + e.target.id;
    const link = tocLinks.find(a => a.getAttribute('href')===id);
    if(e.isIntersecting){
      tocLinks.forEach(x=>x.classList.remove('active'));
      link?.classList.add('active');
    }
  });
},{ rootMargin: "-30% 0px -60% 0px", threshold: 0.01 });
sections.forEach(s=>s && obs.observe(s));

/* ---------- Expand/Collapse ---------- */
document.getElementById('expandAll')?.addEventListener('click', ()=> {
  document.querySelectorAll('details').forEach(d=>d.open = true);
});
document.getElementById('collapseAll')?.addEventListener('click', ()=> {
  document.querySelectorAll('details').forEach(d=>d.open = false);
});

/* ---------- Checklist (unchanged) ---------- */
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
  "Rainwater tank with firefighter outlet (NST or local thread)"
];
const checklist = document.getElementById('checklist');
const progress = document.getElementById('progress');
function renderChecklist(){
  if(!checklist) return;
  checklist.innerHTML = "";
  checklistItems.forEach((t,i)=>{
    const id = "c"+i;
    const wrap = document.createElement('label');
    wrap.className = 'check-item';
    wrap.innerHTML = `<input id="${id}" type="checkbox" /> <span>${t}</span>`;
    checklist.appendChild(wrap);
  });
  checklist.addEventListener('change', ()=>{
    const checks = checklist.querySelectorAll('input[type=checkbox]');
    const done = Array.from(checks).filter(c=>c.checked).length;
    progress.textContent = `${done} of ${checks.length} completed`;
  });
  progress.textContent = `0 of ${checklistItems.length} completed`;
}
renderChecklist();

/* ---------- Map ---------- */
const map = L.map('map', { scrollWheelZoom:false }).setView([34.19, -118.13], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

/* ====================================================================== */
/*                      WILDFIRE PANEL (CLEAN)                            */
/* ====================================================================== */

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
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  function clearAll() {
    // Reset inputs to zero/blank
    els.minLon.value = 0;
    els.minLat.value = 0;
    els.maxLon.value = 0;
    els.maxLat.value = 0;
    els.days.value   = 0;
    els.start.value  = '';
    els.end.value    = '';
    // Clear UI
    els.summary.textContent = 'No data yet.';
    els.tbody.innerHTML = '';
    wfLayer.clearLayers();
  }
  els.clear.addEventListener('click', clearAll);

  function buildEonetURL(p) {
    // EONET bbox order: minLon,maxLat,maxLon,minLat
    const bbox = [p.minLon, p.maxLat, p.maxLon, p.minLat].join(',');
    const u = new URL('https://eonet.gsfc.nasa.gov/api/v3/events/geojson');
    u.searchParams.set('category', 'wildfires');
    u.searchParams.set('bbox', bbox);
    if (p.days && p.days > 0) {
      u.searchParams.set('days', p.days);
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

    // Fit map to markers, if any
    const pts = [];
    wfLayer.eachLayer(l => { if(l.getLatLng) pts.push(l.getLatLng()); });
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.2));
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const p = {
      minLon: clamp(parseFloat(els.minLon.value || 0), -180, 180),
      minLat: clamp(parseFloat(els.minLat.value || 0), -90, 90),
      maxLon: clamp(parseFloat(els.maxLon.value || 0), -180, 180),
      maxLat: clamp(parseFloat(els.maxLat.value || 0), -90, 90),
      days:   parseInt(els.days.value || '0', 10),
      start:  (els.start.value || '').trim(),
      end:    (els.end.value || '').trim()
    };

    els.summary.textContent = 'Loading…';

    try {
      const url = buildEonetURL(p);
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

  // start with a clean state
  clearAll();
})();
