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
