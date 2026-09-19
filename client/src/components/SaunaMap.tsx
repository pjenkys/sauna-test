import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapMarker, VENUE_CATEGORY_LABELS } from '../types';

interface SaunaMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onSelectSauna: (slug: string) => void;
  selectedSlug?: string;
  className?: string;
}

export const SaunaMap: React.FC<SaunaMapProps> = ({
  markers,
  center = [49.8175, 15.473], // Czech Republic center
  zoom = 7,
  onSelectSauna,
  selectedSlug,
  className = 'h-[500px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark-themed tiles for Scandinavian look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const bounds = L.latLngBounds([]);

    markers.forEach((m) => {
      const isSelected = selectedSlug === m.slug;
      const catInfo = VENUE_CATEGORY_LABELS[m.category] || { color: '#0ea5e9', cz: 'Sauna' };
      const color = catInfo.color;

      // Custom SVG DivIcon
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 ${
          isSelected ? 'scale-125 z-30' : 'z-10'
        }">
          ${
            m.is_promoted
              ? `<div class="absolute -inset-1.5 bg-amber-400/40 rounded-full animate-ping pointer-events-none"></div>
                 <div class="absolute -inset-1 border-2 border-amber-400 rounded-full pointer-events-none"></div>`
              : ''
          }
          <div style="background-color: ${color};" class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.5z"/>
            </svg>
          </div>
          ${
            m.is_promoted
              ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-950">★</div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-sauna-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const leafletMarker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      // Popup Content Card
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-3 text-slate-200 text-xs min-w-[210px]';
      popupHtml.innerHTML = `
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
            ${catInfo.cz}
          </span>
          ${
            m.is_promoted
              ? `<span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold">Partner</span>`
              : ''
          }
        </div>
        <div class="font-bold text-sm text-white mb-1 line-clamp-1">${m.name}</div>
        <div class="text-[11px] text-slate-400 mb-2">${m.address_city}</div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-700/60">
          <div class="flex items-center gap-1 text-amber-400 font-bold">
            <span>★</span>
            <span>${m.rating_overall > 0 ? m.rating_overall.toFixed(1) : 'Novinka'}</span>
            <span class="text-slate-400 font-normal">(${m.review_count})</span>
          </div>
          <button id="btn-popup-${m.id}" class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition-colors cursor-pointer">
            Zobrazit detail
          </button>
        </div>
      `;

      // Attach click listener for popup button
      leafletMarker.bindPopup(popupHtml);
      leafletMarker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${m.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectSauna(m.slug);
          };
        }
      });

      layer.addLayer(leafletMarker);
      bounds.extend([m.latitude, m.longitude]);
    });

    // If there are markers and no specific center override, fit bounds nicely
    if (markers.length > 1 && !center) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers, selectedSlug, onSelectSauna]);

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
