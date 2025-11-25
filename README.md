# USGBC-Aligned Resilient Rebuilding Guide

An interactive post-fire rebuilding and community-resilience guide aligned with USGBC green building principles and developed for the Altadena recovery effort.

## Features

### 🏠 Core Rebuilding Sections
- **Risk & Damage Assessment** — Prioritized actions for high-risk zones and vulnerable homes  
- **Community Recovery Hubs** — Mapped facilities, service centers, and support networks  
- **Integrated Water Resilience** — Rain capture, distributed storage, greywater systems & tank calculator  
- **Mobility & Transit** — Emergency access, equity-focused coverage, and critical corridors  
- **Green & Resilient Rebuild** — Fire-safe materials, solar + storage, cool surfaces, stormwater strategies  
- **Equity & Housing** — Anti-displacement measures, funding access, affordability safeguards  
- **Monitoring & Feedback** — Dashboard concepts for adaptive policy and implementation tracking  

### 🛠️ Interactive Tools
- **Home-Hardening Checklist** — Track progress on wildfire-resilient building measures  
- **House/ADU Wildfire Safety Tester** — Generates a 1–10 fire-safety rating based on structural features  
- **ADU Explorer** — 3D interactive models with hotspots showing resilient design elements  
- **Wildfire Events Tracker** — Fetches and visualizes NASA EONET wildfire events on the map and in charts  
- **Water Tank Sizing Calculator** — Estimates domestic + firefighting storage needs  
- **Recovery Hubs Map** — Leaflet-powered visualization of hubs, ADUs, and wildfire markers  

### 🌐 3D Story Viewer
Integrated Cesium ion Story Viewer providing:  
- **Interactive 3D terrain & scenario visualization**  
- **Zoom, pan, and orbit** navigation  
- **Touch-friendly mobile gestures**  
- **Fullscreen immersive viewing**  

Access it through the “3D Story Viewer” section in the sidebar.

## Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)  
- **Mapping:** Leaflet.js  
- **3D Visualization:** Cesium ion Story Viewer  
- **3D Models:** Google `<model-viewer>` (glTF / WebXR)  
- **Charts:** Chart.js for wildfire timeline graphs  
- **Styling:** Modern CSS Reset + custom responsive design system  
- **Accessibility:** Keyboard navigation, ARIA support, high-contrast visuals, print stylesheet  

## Development Software & Tools
- **Editor:** Visual Studio Code or similar  
- **Browser:** Chrome, Firefox, Edge for development/testing  
- **Version Control:** Git  
- **External APIs & Services:**  
  - NASA EONET API (wildfire event data)  
  - Cesium ion (3D terrain and scene viewer)  
  - OpenStreetMap tiles (base maps)  
  - Model Viewer (3D Web Components)  
- **Testing Tools:** Browser DevTools, responsive mode, accessibility scanners  

## Usage
1. Open `index.html` in any modern browser  
2. Navigate sections using the left-hand sidebar  
3. Expand content panels for in-depth guidance  
4. Use the built-in interactive tools (checklists, calculators, wildfire tracker, ADU models)  
5. Launch the Cesium 3D Story Viewer for immersive spatial context  

## 3D Story Viewer Navigation
- **Left click + drag** — rotate  
- **Right click + drag** — zoom  
- **Middle click + drag** — pan  
- **Mobile gestures supported** (pinch, drag, tap)  
- **Fullscreen mode available**  

## Development Philosophy
Focused on:  
- **USGBC-aligned practices** — sustainable, resilient design  
- **Community equity** — support for underserved households  
- **Interactive learning** — tools to guide rebuild decisions  
- **Inclusive design** — readable, accessible, user-friendly  

