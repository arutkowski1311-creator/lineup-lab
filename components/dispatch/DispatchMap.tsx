"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */

export interface MapJob {
  id: string;
  lat: number;
  lng: number;
  address: string;
  customer_name: string;
  type: "drop" | "pickup";
  status: string;
  unit_number?: string;
  size?: string;
  base_rate?: number;
  actual_drop_time?: string;
  requested_pickup_start?: string;
  days_on_site?: number;
}

interface MapProps {
  yard: { lat: number; lng: number; address: string };
  jobs: MapJob[];
  transferStations: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
  }>;
  routePath?: Array<{ lat: number; lng: number }>;
  selectedJobId?: string | null;
  onJobClick?: (jobId: string) => void;
}

/* ---------- Dark map styles ---------- */

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

/* ---------- Helpers ---------- */

/** Build an SVG data-url circle marker */
function circleMarkerIcon(
  color: string,
  label?: string,
  scale: number = 1,
): string {
  const size = Math.round(32 * scale);
  const half = size / 2;
  const fontSize = Math.round(12 * scale);
  const textEl = label
    ? `<text x="${half}" y="${half + fontSize * 0.35}" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="bold" font-size="${fontSize}">${label}</text>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${half}" cy="${half}" r="${half - 1}" fill="${color}" stroke="#fff" stroke-width="2"/>
    ${textEl}
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Build an SVG data-url diamond marker */
function diamondMarkerIcon(color: string, scale: number = 1): string {
  const size = Math.round(28 * scale);
  const half = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <polygon points="${half},1 ${size - 1},${half} ${half},${size - 1} 1,${half}" fill="${color}" stroke="#fff" stroke-width="2"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Get status badge color for info window */
function getInfoStatusBadge(status: string): { bg: string; text: string; label: string } {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    scheduled: { bg: "#3b82f620", text: "#60a5fa", label: "Scheduled" },
    en_route_drop: { bg: "#6366f120", text: "#818cf8", label: "En Route (Drop)" },
    dropped: { bg: "#10b98120", text: "#34d399", label: "Dropped" },
    active: { bg: "#10b98120", text: "#34d399", label: "Active" },
    pickup_requested: { bg: "#f9731620", text: "#fb923c", label: "Pickup Requested" },
    pickup_scheduled: { bg: "#3b82f620", text: "#60a5fa", label: "Pickup Scheduled" },
    en_route_pickup: { bg: "#6366f120", text: "#818cf8", label: "En Route (Pickup)" },
    pending_approval: { bg: "#f59e0b20", text: "#fbbf24", label: "Pending" },
  };
  return map[status] || { bg: "#ffffff20", text: "#9ca3af", label: status };
}

/** Format date for display */
function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/** Build styled info window HTML for a job */
function buildJobInfoHTML(job: MapJob): string {
  const isDrop = job.type === "drop";
  const badge = getInfoStatusBadge(job.status);
  const typeBg = isDrop ? "#3b82f6" : "#f97316";
  const typeLabel = isDrop ? "Drop-off" : "Pickup";

  let rows = "";

  // Status badge
  rows += `
    <div style="display:flex;gap:6px;margin-bottom:8px;">
      <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${typeBg};color:#fff;">${typeLabel}</span>
      <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${badge.bg};color:${badge.text};border:1px solid ${badge.text}40;">${badge.label}</span>
    </div>
  `;

  // Address
  rows += `
    <div style="margin-bottom:6px;">
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Address</div>
      <div style="font-size:13px;color:#374151;">${job.address}</div>
    </div>
  `;

  // Dumpster info
  if (job.unit_number || job.size) {
    rows += `
      <div style="margin-bottom:6px;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Dumpster</div>
        <div style="font-size:13px;color:#374151;">
          ${job.unit_number ? `<strong>${job.unit_number}</strong>` : ""}
          ${job.unit_number && job.size ? " &middot; " : ""}
          ${job.size ? `${job.size}` : ""}
        </div>
      </div>
    `;
  }

  // Drop time
  if (job.actual_drop_time) {
    rows += `
      <div style="margin-bottom:6px;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Drop Time</div>
        <div style="font-size:13px;color:#374151;">${fmtDate(job.actual_drop_time)}</div>
      </div>
    `;
  }

  // Days on site
  if (job.days_on_site !== undefined && job.days_on_site >= 0) {
    const daysColor = job.days_on_site > 7 ? "#ef4444" : job.days_on_site > 3 ? "#f59e0b" : "#10b981";
    rows += `
      <div style="margin-bottom:6px;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Days on Site</div>
        <div style="font-size:13px;font-weight:600;color:${daysColor};">${job.days_on_site} day${job.days_on_site !== 1 ? "s" : ""}</div>
      </div>
    `;
  }

  // Scheduled pickup
  if (job.requested_pickup_start) {
    rows += `
      <div style="margin-bottom:6px;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Scheduled Pickup</div>
        <div style="font-size:13px;color:#374151;">${fmtDate(job.requested_pickup_start)}</div>
      </div>
    `;
  }

  // Base rate
  if (job.base_rate !== undefined) {
    rows += `
      <div style="margin-bottom:2px;">
        <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px;">Rate</div>
        <div style="font-size:14px;font-weight:700;color:#059669;">$${job.base_rate.toLocaleString()}</div>
      </div>
    `;
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:8px 4px;max-width:280px;min-width:220px;">
      <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;border-bottom:2px solid ${typeBg};padding-bottom:6px;">
        ${job.customer_name}
      </div>
      ${rows}
    </div>
  `;
}

/* ---------- Component ---------- */

export default function DispatchMap({
  yard,
  jobs,
  transferStations,
  routePath,
  selectedJobId,
  onJobClick,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const pulseOverlayRef = useRef<google.maps.Marker | null>(null);
  const isInitializedRef = useRef(false);

  /* ---- Cleanup helpers ---- */

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  const clearPolyline = useCallback(() => {
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
  }, []);

  const clearPulse = useCallback(() => {
    pulseOverlayRef.current?.setMap(null);
    pulseOverlayRef.current = null;
  }, []);

  /* ---- Initialize map once ---- */

  useEffect(() => {
    if (isInitializedRef.current) return;
    if (!containerRef.current) return;
    if (typeof window === "undefined" || !window.google?.maps) return;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: 40.59, lng: -74.69 },
      zoom: 11,
      styles: DARK_MAP_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    isInitializedRef.current = true;
  }, []);

  /* ---- Sync markers, polyline, and selection whenever props change ---- */

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const gm = window.google.maps;
    const iw = infoWindowRef.current!;

    // Clear previous
    clearMarkers();
    clearPolyline();
    clearPulse();

    const markers: google.maps.Marker[] = [];

    /* -- Yard marker -- */
    const yardMarker = new gm.Marker({
      position: { lat: yard.lat, lng: yard.lng },
      map,
      icon: {
        url: circleMarkerIcon("#22c55e", "Y"),
        scaledSize: new gm.Size(32, 32),
        anchor: new gm.Point(16, 16),
      },
      title: "Yard",
      zIndex: 10,
    });
    yardMarker.addListener("click", () => {
      iw.setContent(
        `<div style="color:#212121;font-family:sans-serif;padding:4px 0;">
          <strong>Yard</strong><br/>
          <span style="font-size:13px;">${yard.address}</span>
        </div>`,
      );
      iw.open(map, yardMarker);
    });
    markers.push(yardMarker);

    /* -- Job markers -- */
    jobs.forEach((job) => {
      const isDrop = job.type === "drop";
      const color = isDrop ? "#3b82f6" : "#f97316"; // blue / orange
      const isSelected = job.id === selectedJobId;

      const marker = new gm.Marker({
        position: { lat: job.lat, lng: job.lng },
        map,
        icon: {
          url: circleMarkerIcon(color, undefined, isSelected ? 1.3 : 1),
          scaledSize: isSelected
            ? new gm.Size(42, 42)
            : new gm.Size(32, 32),
          anchor: isSelected
            ? new gm.Point(21, 21)
            : new gm.Point(16, 16),
        },
        title: `${job.customer_name} (${job.type})`,
        zIndex: isSelected ? 20 : 5,
      });

      marker.addListener("click", () => {
        // Build rich info window content and open it
        iw.setContent(buildJobInfoHTML(job));
        iw.open(map, marker);
        // Don't call onJobClick here — it causes a re-render that destroys this marker
        // The InfoWindow will show the job details directly
      });

      markers.push(marker);

      /* Pulse ring for selected job */
      if (isSelected) {
        const pulseMarker = new gm.Marker({
          position: { lat: job.lat, lng: job.lng },
          map,
          icon: {
            url: buildPulseIcon(color),
            scaledSize: new gm.Size(56, 56),
            anchor: new gm.Point(28, 28),
          },
          clickable: false,
          zIndex: 19,
        });
        pulseOverlayRef.current = pulseMarker;
      }
    });

    /* -- Transfer station markers -- */
    transferStations.forEach((ts) => {
      const marker = new gm.Marker({
        position: { lat: ts.lat, lng: ts.lng },
        map,
        icon: {
          url: diamondMarkerIcon("#ef4444"),
          scaledSize: new gm.Size(28, 28),
          anchor: new gm.Point(14, 14),
        },
        title: ts.name,
        zIndex: 8,
      });

      marker.addListener("click", () => {
        iw.close();
        iw.setContent(
          `<div style="color:#212121;font-family:sans-serif;padding:4px 0;">
            <strong>Transfer Station</strong><br/>
            <span style="font-size:13px;">${ts.name}</span>
          </div>`,
        );
        iw.open(map, marker);
      });

      markers.push(marker);
    });

    markersRef.current = markers;

    /* -- Route polyline -- */
    if (routePath && routePath.length > 1) {
      const path = routePath.map((p) => ({ lat: p.lat, lng: p.lng }));
      const polyline = new gm.Polyline({
        path,
        geodesic: true,
        strokeColor: "#8b5cf6",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map,
      });
      polylineRef.current = polyline;
    }
  }, [
    yard,
    jobs,
    transferStations,
    routePath,
    selectedJobId,
    onJobClick,
    clearMarkers,
    clearPolyline,
    clearPulse,
  ]);

  /* ---- Cleanup on unmount ---- */

  useEffect(() => {
    return () => {
      clearMarkers();
      clearPolyline();
      clearPulse();
    };
  }, [clearMarkers, clearPolyline, clearPulse]);

  /* ---- Check if Google Maps is available ---- */

  const isGoogleReady =
    typeof window !== "undefined" && !!window.google?.maps;

  if (!isGoogleReady) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400",
          "h-full w-full min-h-[400px]",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-8 w-8 animate-spin text-zinc-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-sm">Map loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full min-h-[400px] rounded-md overflow-hidden")}
    />
  );
}

/* ---------- Pulse animation SVG ---------- */

function buildPulseIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">
    <circle cx="28" cy="28" r="22" fill="none" stroke="${color}" stroke-width="3" opacity="0.5">
      <animate attributeName="r" from="14" to="26" dur="1.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="28" cy="28" r="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.3">
      <animate attributeName="r" from="10" to="22" dur="1.2s" begin="0.3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.5" to="0" dur="1.2s" begin="0.3s" repeatCount="indefinite"/>
    </circle>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
