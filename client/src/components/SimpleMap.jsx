import React, { useEffect, useRef, useState } from 'react';

const SimpleMap = ({ 
  center = { lat: 28.6139, lng: 77.2090 }, 
  zoom = 13, 
  onClick, 
  markers = [], 
  markerColor = 'red' 
}) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [mousePos, setMousePos] = useState(null);

  useEffect(() => {
    // Load Leaflet CSS and JS from CDN
    const loadLeaflet = async () => {
      // Check if already loaded
      if (window.L) {
        initMap();
        return;
      }

      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.body.appendChild(script);
    };

    const initMap = () => {
      if (!mapContainer.current || mapInstance.current) return;

      // Create map
      const map = window.L.map(mapContainer.current).setView(
        [center.lat, center.lng],
        zoom
      );

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstance.current = map;

      // Add markers for saved locations
      markers.forEach((marker) => {
        window.L.marker([marker.lat, marker.lng], {
          icon: window.L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map).bindPopup(`Farm Location<br>Lat: ${marker.lat.toFixed(4)}<br>Lng: ${marker.lng.toFixed(4)}`);
      });

      // Center marker (red)
      window.L.marker([center.lat, center.lng], {
        icon: window.L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map).bindPopup(`Center<br>Lat: ${center.lat.toFixed(4)}<br>Lng: ${center.lng.toFixed(4)}`);

      // Click handler
      map.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Remove old click marker if exists
        if (window.clickMarker) {
          map.removeLayer(window.clickMarker);
        }

        // Add new click marker (orange)
        window.clickMarker = window.L.marker([lat, lng], {
          icon: window.L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map).bindPopup(`Selected<br>Lat: ${lat.toFixed(4)}<br>Lng: ${lng.toFixed(4)}`, { autoClose: false }).openPopup();

        // Call onClick callback
        if (onClick) {
          onClick({
            latLng: {
              lat: () => lat,
              lng: () => lng
            }
          });
        }
      });

      // Mouse move handler for hover display
      map.on('mousemove', (e) => {
        setMousePos({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      map.on('mouseleave', () => {
        setMousePos(null);
      });
    };

    loadLeaflet();

    return () => {
      // Cleanup
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [center, zoom, markers, onClick]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '0.75rem',
        border: '1px solid #ddd',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0f0f0',
        zIndex: 1
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '10px 14px',
          borderRadius: '6px',
          zIndex: 1000,
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}
      >
        📍 <strong>Center:</strong> {center.lat.toFixed(4)}°, {center.lng.toFixed(4)}°
        {mousePos && (
          <>
            <br />
            🖱️ <strong>Hover:</strong> {mousePos.lat.toFixed(4)}°, {mousePos.lng.toFixed(4)}°
          </>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '8px 12px',
          borderRadius: '6px',
          zIndex: 1000,
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}
      >
        👆 Click to select location
      </div>
    </div>
  );
};

export default SimpleMap;
