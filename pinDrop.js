// Initialize the leaflet map centered 
const map = L.map('map').setView([20, 78], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Pins and marker cache
let pins = [];
let markers = [];

// Load pins
try {
  const saved = localStorage.getItem('pins');
  pins = saved ? JSON.parse(saved) : [];
} catch {
  pins = [];
}
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Add a new marker to the map
function addMarker(pin, idx, focus = false) {
  const marker = L.marker([pin.lat, pin.lng]).addTo(map);
  marker.bindPopup(
    `<b>${escapeHTML(pin.remark)}</b><br>${escapeHTML(pin.address)}`
  );
  markers[idx] = marker;
  if (focus) {
    map.setView([pin.lat, pin.lng], 14);
    marker.openPopup();
  }
}

function updateSidebar() {
  const pinListElem = document.getElementById('pin-list');
  pinListElem.innerHTML = "";

  pins.forEach((pin, idx) => {
    const div = document.createElement('div');
    div.className = "pin-item";
    div.innerHTML = `
      <strong>${escapeHTML(pin.remark)}</strong><br>
      <span style="color:#666;font-size:0.95em;">${escapeHTML(pin.address)}</span>
      <button class="delete-btn" title="Delete pin" data-idx="${idx}">&#128465;</button>
    `;
    div.onclick = (e) => {
      if (e.target.classList.contains("delete-btn")) return;
      map.setView([pin.lat, pin.lng], 14);
      markers[idx].openPopup();
    };
    pinListElem.appendChild(div);
  });

  // Attach delete button to each button
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      deletePin(idx);
    };
  });
}

// Store pins
function savePins() {
  localStorage.setItem('pins', JSON.stringify(pins));
}

// Get neat address for coordinates via OpenStreetMap's API
function fetchAddress(lat, lng, callback) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
    .then(res => res.json())
    .then(data => callback(data.display_name || "Unknown address"))
    .catch(() => callback("Address fetch failed"));
}

// Delete a pin and its marker
function deletePin(idx) {
  if (markers[idx]) {
    map.removeLayer(markers[idx]);
    markers.splice(idx, 1);
  }
  pins.splice(idx, 1);
  
  // Re-index/refresh all markers and list

  markers.forEach(m => map.removeLayer(m));
  markers = [];
  pins.forEach((pin, i) => addMarker(pin, i));
  updateSidebar();
  savePins();
}

// Handle pin drop: prompt user, get address, place marker & update 
map.on('click', function (e) {
  const remark = prompt("Enter a remark for this pin:");
  if (!remark) return;
  fetchAddress(e.latlng.lat, e.latlng.lng, address => {
    const pin = { lat: e.latlng.lat, lng: e.latlng.lng, remark, address };
    pins.push(pin);
    addMarker(pin, pins.length - 1, true);
    updateSidebar();
    savePins();
  });
});

pins.forEach((pin, idx) => addMarker(pin, idx));
updateSidebar();
