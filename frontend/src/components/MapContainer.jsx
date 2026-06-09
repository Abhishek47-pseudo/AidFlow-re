import React, { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to programmatically pan/zoom map on selection
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), {
        animate: true,
        duration: 0.6
      });
    }
  }, [center, zoom, map]);
  return null;
};

export const MapContainer = ({ 
  disasters = [], 
  emergencies = [], 
  selectedLocation = null,
  activeRoute = null,
  onMarkerClick = () => {}
}) => {
  const defaultCenter = [30.7333, 76.7794];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [isLightMode, setIsLightMode] = useState(document.body.classList.contains('light'));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsLightMode(document.body.classList.contains('light'));
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lon]);
      setMapZoom(13);
    }
  }, [selectedLocation]);

  // Create custom DivIcon for vehicles/units
  const createVehicleIcon = (unitName, status = 'active') => {
    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div class="map-telemetry-pulse ${status === 'idle' ? 'map-telemetry-pulse-idle' : ''}" style="top: 2px; left: 2px;"></div>
          <div style="
            background: var(--bg-card, #0a1020); 
            border: 2px solid ${status === 'idle' ? '#64748B' : '#3B82F6'}; 
            color: var(--text-main, #ffffff);
            border-radius: 8px; 
            width: 28px; 
            height: 28px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            font-size: 14px;
            z-index: 10;
          ">
            🚚
          </div>
          <div style="
            position: absolute; 
            bottom: -18px; 
            background: var(--bg-card, rgba(10,16,32,0.85)); 
            color: var(--text-muted, #94A3B8); 
            border: 1px solid rgba(255,255,255,0.08);
            font-family: 'DM Mono', monospace;
            font-size: 8px; 
            padding: 1px 4px; 
            border-radius: 3px;
            white-space: nowrap;
            z-index: 15;
          ">
            ${unitName}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  // Create custom DivIcon for incident reports
  const createIncidentIcon = (severity, isActive = true) => {
    let color = '#06B6D4'; // Info
    if (severity === 'low') color = '#22C55E';
    else if (severity === 'medium') color = '#F59E0B';
    else if (severity === 'high') color = '#F97316';
    else if (severity === 'critical') color = '#EF4444';

    return L.divIcon({
      className: 'custom-incident-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          ${isActive && severity === 'critical' ? `
            <div class="map-telemetry-pulse" style="border-color: ${color}; top: 0px; left: 0px;"></div>
          ` : ''}
          <div style="
            background: ${color}; 
            border: 2px solid #ffffff; 
            border-radius: 50%; 
            width: 16px; 
            height: 16px; 
            box-shadow: 0 0 12px ${color};
            z-index: 10;
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <LeafletMap 
        center={mapCenter} 
        zoom={mapZoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '14px' }}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {/* Dynamic CartoDB basemap style */}
        <TileLayer
          key={isLightMode ? 'light' : 'dark'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isLightMode 
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        {/* Render Disaster Zones overlays */}
        {disasters.map((zone) => {
          if (!zone || !zone.location || !zone.location.center) return null;
          return (
          <React.Fragment key={zone.zoneId || Math.random()}>
            {/* Layer 1: Blurred low opacity glow */}
            <Circle 
              center={[zone.location.center.lat, zone.location.center.lon]}
              radius={(zone.location.radius || 1) * 1000 * 1.5}
              pathOptions={{ 
                fillColor: zone.severity === 'critical' ? '#EF4444' : zone.severity === 'high' ? '#F97316' : '#F59E0B',
                fillOpacity: 0.04, 
                stroke: false 
              }}
            />
            {/* Layer 2: Crisp solid boundary */}
            <Circle 
              center={[zone.location.center.lat, zone.location.center.lon]}
              radius={(zone.location.radius || 1) * 1000}
              pathOptions={{ 
                color: zone.severity === 'critical' ? '#EF4444' : zone.severity === 'high' ? '#F97316' : '#F59E0B',
                weight: 2, 
                fillColor: zone.severity === 'critical' ? '#EF4444' : zone.severity === 'high' ? '#F97316' : '#F59E0B',
                fillOpacity: 0.15 
              }}
            >
              <Popup>
                <div style={{ padding: '0.25rem' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>⚠️ {zone.name}</h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Type: <strong>{zone.disasterType}</strong></p>
                  <p style={{ margin: '0', fontSize: '12px' }}>Severity: <span className={`badge ${zone.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>{zone.severity}</span></p>
                </div>
              </Popup>
            </Circle>
          </React.Fragment>
          );
        })}

        {/* Render active emergencies */}
        {emergencies.map((emg) => {
          if (!emg) return null;
          const lat = emg.location?.lat;
          const lon = emg.location?.lon;
          if (!lat || !lon) return null;

          const severity = emg.aiAnalysis?.severity || 'medium';
          const isDispatched = emg.status === 'dispatched' || emg.status === 'en_route';

          return (
            <React.Fragment key={emg.emergencyId}>
              {/* Emergency Location Marker */}
              <Marker
                position={[lat, lon]}
                icon={createIncidentIcon(severity, emg.status !== 'completed')}
                eventHandlers={{
                  click: () => onMarkerClick(emg),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '10px', color: '#94A3B8' }}>{emg.emergencyId}</span>
                      <span className={`badge ${severity === 'critical' ? 'badge-danger' : severity === 'high' ? 'badge-warning' : 'badge-info'}`}>
                        {severity}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#ffffff', marginBottom: '8px', fontWeight: '500' }}>
                      {emg.userMessage}
                    </p>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Status: <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{emg.status}</strong>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Vehicle Node Marker if dispatched */}
              {isDispatched && emg.response?.routing?.waypoints && (
                <Marker
                  position={[
                    emg.response.routing.currentLocation?.lat || lat + 0.005, 
                    emg.response.routing.currentLocation?.lon || lon + 0.005
                  ]}
                  icon={createVehicleIcon(emg.response.routing.unitId || 'UNIT-1', emg.status)}
                >
                  <Popup>
                    <div>
                      <h4>🚚 Response Unit {emg.response.routing.unitId || 'UNIT-1'}</h4>
                      <p>Heading to emergency <strong>{emg.emergencyId}</strong></p>
                      <p>Status: <span className="badge badge-success">En Route</span></p>
                      <p className="font-mono">ETA: {emg.response.routing.eta || '12 mins'}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

        {/* Render Active Dispatch Route */}
        {activeRoute && activeRoute.waypoints && activeRoute.waypoints.length > 0 && (
          <>
            {/* Layer 1: Alternative paths in grey dashed lines */}
            {activeRoute.alternativeRoute && (
              <Polyline 
                positions={activeRoute.alternativeRoute}
                pathOptions={{ color: '#64748B', weight: 3, dashArray: '6 8', opacity: 0.5 }}
              />
            )}
            {/* Layer 2: Main optimal path in bold blue dashes */}
            <Polyline 
              positions={activeRoute.waypoints}
              className="map-route-optimal"
            />
          </>
        )}
      </LeafletMap>
    </div>
  );
};
