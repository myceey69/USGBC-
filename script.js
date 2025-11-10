/* ---------- Utility ---------- */
const $ = (id) => document.getElementById(id);

/* ---------- Search / TOC ---------- */
const search = $('#search');
const tocLinks = [...document.querySelectorAll('#toc a')];
const sections = tocLinks.map(a => document.querySelector(a.getAttribute('href')));
search?.addEventListener('input', e=>{
  const t = e.target.value.trim().toLowerCase();
  tocLinks.forEach(a => a.style.display = a.textContent.toLowerCase().includes(t) ? 'block' : 'none');
});
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    const id = '#' + e.target.id;
    const link = tocLinks.find(a => a.getAttribute('href')===id);
    if(e.isIntersecting){ tocLinks.forEach(x=>x.classList.remove('active')); link?.classList.add('active'); }
  });
},{ rootMargin: "-30% 0px -60% 0px", threshold: 0.01 });
sections.forEach(s=>s && obs.observe(s));

/* ---------- Expand/Collapse ---------- */
$('#expandAll')?.addEventListener('click', ()=> document.querySelectorAll('details').forEach(d=>d.open=true));
$('#collapseAll')?.addEventListener('click', ()=> document.querySelectorAll('details').forEach(d=>d.open=false));
$('#printBtn')?.addEventListener('click', ()=> window.print());

/* ---------- Checklist ---------- */
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
(function renderChecklist(){
  const checklist = $('#checklist'); const progress = $('#progress');
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
})();

/* ---------- Map ---------- */
const map = L.map('map', { scrollWheelZoom:false }).setView([34.19, -118.13], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

/* ====================================================================== */
/*                      WILDFIRE PANEL (locale-safe)                      */
/* ====================================================================== */

(function () {
  const els = {
    form:   $('#wf-form'),
    minLon: $('#wfMinLon'),
    minLat: $('#wfMinLat'),
    maxLon: $('#wfMaxLon'),
    maxLat: $('#wfMaxLat'),
    days:   $('#wfDays'),
    start:  $('#wfStart'),
    end:    $('#wfEnd'),
    run:    $('#wfRun'),
    clear:  $('#wfClear'),
    summary:$('#wfSummary'),
    tbody:  $('#wfTbody')
  };
  if(!els.form) return;

  const wfLayer = L.layerGroup().addTo(map);

  // Normalize any user-entered number: handles commas and fancy minus
  function parseDec(v){
    if (v == null) return NaN;
    let s = String(v).trim();
    // Replace Unicode minus/dashes with simple hyphen
    s = s.replace(/\u2212|\u2012|\u2013|\u2014/g, '-');
    // Replace comma decimal with dot, but keep leading minus
    s = s.replace(/,/g, '.');
    // Remove spaces
    s = s.replace(/\s+/g, '');
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
    // EONET bbox: minLon,maxLat,maxLon,minLat
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

    // Parse & validate
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

  // Start clean
  clearAll();
})();
