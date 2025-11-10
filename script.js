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
  // --------- Keyboard focus for a11y: keep focused toc item visible ----------
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

/* ========= NEW: NASA EONET Wildfire Panel ===================================
   - Fetches GeoJSON: https://eonet.gsfc.nasa.gov/api/v3/events/geojson
   - category=wildfires, supports bbox, days OR start/end, status, limit
   - Drops markers on the existing Leaflet `map` and lists results.
   - Also displays a CLI string mirroring: eonet_fetch_events.py --bbox ... --days ...
   ========================================================================== */
(function () {
  const els = {
    form: document.getElementById('wf-form'),
    minLon: document.getElementById('wfMinLon'),
    minLat: document.getElementById('wfMinLat'),
    maxLon: document.getElementById('wfMaxLon'),
    maxLat: document.getElementById('wfMaxLat'),
    days: document.getElementById('wfDays'),
    start: document.getElementById('wfStart'),
    end: document.getElementById('wfEnd'),
    status: document.getElementById('wfStatus'),
    limit: document.getElementById('wfLimit'),
    useCA: document.getElementById('wfUseCA'),
    useMap: document.getElementById('wfUseMap'),
    summary: document.getElementById('wfSummary'),
    list: document.getElementById('wfList'),
    cli: document.getElementById('wfCli'),
    clear: document.getElementById('wfClear')
  };
  if (!els.form) return;

  // Layer for wildfire markers
  const wfLayer = L.layerGroup().addTo(map);

  function clearMarkers() { wfLayer.clearLayers(); }

  // Read Leaflet bounds -> bbox
  function getMapBoundsBBox() {
    const b = map.getBounds();
    const sw = b.getSouthWest(), ne = b.getNorthEast();
    return { minLon: sw.lng, minLat: sw.lat, maxLon: ne.lng, maxLat: ne.lat };
  }
  function setFields(b) {
    els.minLon.value = b.minLon.toFixed(2);
    els.minLat.value = b.minLat.toFixed(2);
    els.maxLon.value = b.maxLon.toFixed(2);
    els.maxLat.value = b.maxLat.toFixed(2);
  }

  els.useCA.addEventListener('click', () => {
    setFields({ minLon: -124.48, minLat: 32.53, maxLon: -114.13, maxLat: 42.00 });
  });
  els.useMap.addEventListener('click', () => {
    setFields(getMapBoundsBBox());
  });

  // EONET bbox quirk: expects minLon,maxLat,maxLon,minLat
  function buildEonetURL(p) {
    const bbox = [p.minLon, p.maxLat, p.maxLon, p.minLat].join(',');
    const u = new URL('https://eonet.gsfc.nasa.gov/api/v3/events/geojson');
    u.searchParams.set('category', 'wildfires');
    u.searchParams.set('status', p.status || 'open');
    u.searchParams.set('limit', p.limit || 100);
    u.searchParams.set('bbox', bbox);
    if (p.days) {
      u.searchParams.set('days', p.days);
    } else {
      if (p.start) u.searchParams.set('start', p.start);
      if (p.end) u.searchParams.set('end', p.end);
    }
    return u.toString();
  }

  // CLI mirror for your Python script invocation
  function buildCli(p) {
    const parts = [
      'python3 eonet_fetch_events.py',
      `--bbox ${p.minLon} ${p.minLat} ${p.maxLon} ${p.maxLat}`
    ];
    if (p.days) parts.push(`--days ${p.days}`);
    if (p.start) parts.push(`--start ${p.start}`);
    if (p.end) parts.push(`--end ${p.end}`);
    if (p.status && p.status !== 'open') parts.push(`--status ${p.status}`);
    if (p.limit && +p.limit !== 100) parts.push(`--limit ${p.limit}`);
    parts.push('--out eonet_query');
    return parts.join(' ');
  }

  function render(features) {
    els.list.innerHTML = '';
    clearMarkers();

    features.forEach((f, i) => {
      const p = f.properties || {};
      const g = f.geometry || {};
      let lat = null, lon = null;

      if (g.type === 'Point' && Array.isArray(g.coordinates)) {
        [lon, lat] = g.coordinates;
      } else if (g.type === 'Polygon' && g.coordinates && g.coordinates[0] && g.coordinates[0][0]) {
        lon = g.coordinates[0][0][0]; lat = g.coordinates[0][0][1];
      }

      const li = document.createElement('li');
      li.className = 'wf-item';
      li.innerHTML = `
        <div class="wf-item-head">
          <span class="wf-badge">${i + 1}</span>
          <strong>${p.title || 'Wildfire event'}</strong>
        </div>
        <div class="wf-item-body">
          <div><b>Date:</b> ${p.date || '—'}</div>
          <div><b>Status:</b> ${p.closed ? 'closed' : 'open'}</div>
          <div><b>ID:</b> ${p.id || f.id || '—'}</div>
          <div><b>Coords:</b> ${lat != null ? lat.toFixed(3) : '—'}, ${lon != null ? lon.toFixed(3) : '—'}</div>
          <div><b>Sources:</b> ${(p.sources || []).map(s => s.id).join(', ') || '—'}</div>
        </div>`;
      els.list.appendChild(li);

      if (lat != null && lon != null) {
        const m = L.marker([lat, lon]).bindPopup(`<b>${p.title || 'Wildfire'}</b><br>${p.date || ''}`);
        wfLayer.addLayer(m);
      }
    });

    // Fit map to markers if present
    const allLatLng = [];
    wfLayer.eachLayer(layer => {
      if (layer.getLatLng) allLatLng.push(layer.getLatLng());
    });
    if (allLatLng.length) {
      const bounds = L.latLngBounds(allLatLng);
      map.fitBounds(bounds.pad(0.2));
    }
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const p = {
      minLon: clamp(parseFloat(els.minLon.value), -180, 180),
      minLat: clamp(parseFloat(els.minLat.value), -90, 90),
      maxLon: clamp(parseFloat(els.maxLon.value), -180, 180),
      maxLat: clamp(parseFloat(els.maxLat.value), -90, 90),
      status: els.status.value,
      limit: parseInt(els.limit.value, 10) || 100
    };

    const d = (els.days.value || '').trim();
    const s = (els.start.value || '').trim();
    const en = (els.end.value || '').trim();

    if (d) {
      p.days = parseInt(d, 10);
      p.start = null; p.end = null;
    } else {
      p.days = null;
      p.start = s || null;
      p.end = en || null;
    }

    els.cli.textContent = buildCli(p);
    els.summary.textContent = 'Loading…';

    try {
      const url = buildEonetURL(p);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const features = (data && data.features) ? data.features : [];
      els.summary.textContent = `${features.length} event(s) loaded`;
      render(features);
    } catch (err) {
      console.error(err);
      els.summary.textContent = `Error: ${err.message}`;
    }
  });

  els.clear.addEventListener('click', () => {
    els.list.innerHTML = '';
    els.summary.textContent = '';
    els.cli.textContent = 'python3 eonet_fetch_events.py …';
    clearMarkers();
  });
})();
