import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, MessageSquare, ExternalLink, Calendar, Heart } from 'lucide-react';

// Leaflet default icon fix
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

if (typeof window !== 'undefined') {
  fixLeafletIcons();
}

// Custom icons for different types of institutions
const getCustomIcon = (type, isSelected) => {
  let color = '#0284c7'; // default sky blue
  if (type === 'Católica Apostólica Romana') color = '#eab308'; // yellow
  else if (type.includes('Pentecostal')) color = '#10b981'; // emerald
  else if (type.includes('Bautista')) color = '#8b5cf6'; // purple
  else if (type.includes('Adventista')) color = '#f97316'; // orange

  const html = `
    <div style="
      background-color: ${color};
      width: ${isSelected ? '36px' : '28px'};
      height: ${isSelected ? '36px' : '28px'};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '18' : '14'}" height="${isSelected ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20M17 5H7M19 9H5" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: isSelected ? [36, 36] : [28, 28],
    iconAnchor: isSelected ? [18, 18] : [14, 14],
  });
};

// Component to programmatically pan/zoom the map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), {
        animate: true,
        duration: 1.0
      });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  institutions = [],
  selectedId = null,
  onSelectInstitution = () => {},
  center = [-34.515, -58.768],
  zoom = 13,
  editable = false,
  onMarkerDrag = () => {},
  editableCoords = null,
  showHeatmap = false
}) {
  const mapRef = useRef(null);

  // José C. Paz Border approximation
  const jcPazBoundary = useMemo(() => [
    [-34.480, -58.810],
    [-34.480, -58.730],
    [-34.545, -58.730],
    [-34.545, -58.810],
    [-34.480, -58.810]
  ], []);

  // Draggable marker events
  const markerHandlers = useMemo(() => ({
    dragend(e) {
      const marker = e.target;
      if (marker != null) {
        const latLng = marker.getLatLng();
        onMarkerDrag(latLng.lat, latLng.lng);
      }
    },
  }), [onMarkerDrag]);

  // Adjust center if there is a selected institution
  const mapCenter = useMemo(() => {
    if (selectedId) {
      const selected = institutions.find(i => i.id === selectedId);
      if (selected) {
        return [selected.latitude, selected.longitude];
      }
    }
    return center;
  }, [selectedId, institutions, center]);

  const mapZoom = selectedId ? 16 : zoom;

  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        maxBounds={[
          [-34.60, -58.90], // Southwest boundary
          [-34.40, -58.65]  // Northeast boundary
        ]}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Highlight José C. Paz Boundary */}
        <Polygon
          positions={jcPazBoundary}
          pathOptions={{
            color: '#1e3a8a',
            weight: 2,
            opacity: 0.7,
            fillColor: '#1e3a8a',
            fillOpacity: 0.03
          }}
        />

        {/* Change view handler */}
        <ChangeView center={mapCenter} zoom={mapZoom} />

        {/* Normal Markers */}
        {!editable && !showHeatmap && institutions.map((inst) => {
          const isSelected = inst.id === selectedId;
          const photo = inst.photos && inst.photos.length > 0 ? inst.photos[0].url : 'https://images.unsplash.com/photo-1548625361-155deee223d0?w=800&auto=format&fit=crop&q=60';
          
          return (
            <Marker
              key={inst.id}
              position={[inst.latitude, inst.longitude]}
              icon={getCustomIcon(inst.denomination, isSelected)}
              eventHandlers={{
                click: () => {
                  onSelectInstitution(inst);
                },
              }}
            >
              <Popup>
                <div className="flex flex-col bg-white overflow-hidden text-slate-800">
                  {/* Photo */}
                  <div className="h-32 w-full relative bg-slate-100">
                    <img 
                      src={photo} 
                      alt={inst.denomination} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md">
                      {inst.type}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">
                      {inst.denomination}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight mt-0.5">
                      {inst.congregation}
                    </h3>
                    
                    <div className="flex items-center text-xs text-slate-500 mt-2">
                      <MapPin size={12} className="mr-1 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{inst.address}</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-500 mt-1 font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        Barrio: {inst.neighborhood}
                      </span>
                    </div>

                    {/* Social Action quick badge */}
                    {inst.has_comedor === 1 && (
                      <div className="flex items-center mt-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 w-max">
                        <Heart size={10} className="mr-1 fill-emerald-600 stroke-none" />
                        Acción Social Activa
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-1.5 mt-3 border-t pt-2.5">
                      {inst.institutional_whatsapp && (
                        <a
                          href={`https://wa.me/54${inst.institutional_whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center text-center bg-emerald-500 hover:bg-emerald-600 text-white rounded py-1 text-xs font-bold transition shadow-sm"
                        >
                          <MessageSquare size={12} className="mr-1" />
                          WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => onSelectInstitution(inst)}
                        className={`flex items-center justify-center text-center bg-slate-900 hover:bg-slate-800 text-white rounded py-1 text-xs font-bold transition shadow-sm ${!inst.institutional_whatsapp ? 'col-span-2' : ''}`}
                      >
                        <ExternalLink size={12} className="mr-1" />
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Editable single marker (Register Form) */}
        {editable && editableCoords && (
          <Marker
            draggable={true}
            eventHandlers={markerHandlers}
            position={[editableCoords.lat, editableCoords.lng]}
            icon={getCustomIcon('Católica Apostólica Romana', true)} // Uses a bright marker
          >
            <Popup>
              <div className="p-2 text-xs text-slate-700 font-medium">
                📍 <b>Ubicación de la Iglesia</b><br />
                Arrastra este marcador para ajustar la ubicación exacta en el mapa.
              </div>
            </Popup>
          </Marker>
        )}

        {/* Heatmap Overlay (using sutil circles to prevent compile bloat) */}
        {showHeatmap && !editable && institutions.map((inst) => {
          let radius = 100;
          if (inst.avg_attendees) {
            radius = Math.max(80, Math.min(400, inst.avg_attendees * 1.2));
          }
          return (
            <Circle
              key={`heat-${inst.id}`}
              center={[inst.latitude, inst.longitude]}
              radius={radius}
              pathOptions={{
                fillColor: '#dc2626', // Red heatmap
                fillOpacity: 0.35,
                color: '#dc2626',
                weight: 1,
                opacity: 0.5
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
