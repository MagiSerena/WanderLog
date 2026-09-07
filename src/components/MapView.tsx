"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { sortWaypointsByTimeline } from "@/lib/timeline-sorter";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number, unit: "km" | "mi") {
    const R = unit === "mi" ? 3958.8 : 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function MapView({ tripId }: { tripId: number }) {
    const waypoints = useLiveQuery(() => db.waypoints.where("tripId").equals(tripId).toArray());
    const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">("km");

    useEffect(() => {
        const updateSettings = () => {
            const stored = localStorage.getItem("app_distance") as "km" | "mi";
            setDistanceUnit(stored || "km");
        };
        updateSettings();
        window.addEventListener("storage", updateSettings);
        return () => window.removeEventListener("storage", updateSettings);
    }, []);

    if (!waypoints || waypoints.length === 0) {
        return (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground p-8 text-center flex-col">
                <p>No waypoints available for this trip.</p>
                <p className="text-sm mt-2 opacity-70">Add a waypoint from the trip timeline to see it on the map.</p>
            </div>
        );
    }

    const sortedWaypoints = sortWaypointsByTimeline(waypoints);
    const routePositions = sortedWaypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
    const center = routePositions.length > 0 ? routePositions[0] : [0, 0];

    let totalDist = 0;
    for (let i = 0; i < routePositions.length - 1; i++) {
        totalDist += getDistance(routePositions[i][0], routePositions[i][1], routePositions[i + 1][0], routePositions[i + 1][1], distanceUnit);
    }

    return (
        <div className="relative w-full h-full">
            <div className="absolute top-4 left-4 z-[999] bg-background/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Distance</p>
                <p className="text-xl font-bold font-sans text-primary">
                    {totalDist.toFixed(1)} {distanceUnit === "mi" ? "Miles" : "KM"}
                </p>
            </div>

            <MapContainer
                center={center as [number, number]}
                zoom={8}
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OSM contributors'
                />

                <Polyline
                    positions={routePositions}
                    color="#2563eb"
                    weight={4}
                    opacity={0.8}
                    dashArray="10, 10"
                />

                {sortedWaypoints.map((wp) => (
                    <Marker key={wp.id} position={[wp.lat, wp.lng]}>
                        <Popup className="rounded-xl overflow-hidden">
                            <div className="p-1 min-w-[200px]">
                                <div className="font-bold mb-1">{format(parseISO(wp.timestamp), "MMM d, h:mm a")}</div>
                                {wp.note && <div className="text-sm mt-1 mb-2">{wp.note}</div>}
                                <div className="flex gap-1 flex-wrap mt-2">
                                    {wp.tags.map(tag => (
                                        <span key={tag} className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
