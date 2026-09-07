/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Waypoint } from "@/lib/db";
import { groupWaypointsByDay } from "@/lib/timeline-sorter";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Receipt } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function TripTimelinePage() {
    const params = useParams();
    const router = useRouter();
    const tripId = Number(params.id);

    const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);
    const [editForm, setEditForm] = useState<Partial<Waypoint>>({});
    const [isCreating, setIsCreating] = useState(false);

    const trip = useLiveQuery(() => db.trips.get(tripId));
    const waypoints = useLiveQuery(() => db.waypoints.where("tripId").equals(tripId).toArray());

    if (!trip) return null;

    const groupedWaypoints = waypoints ? groupWaypointsByDay(waypoints) : {};

    async function handleSaveWaypoint() {
        if (isCreating) {
            await db.waypoints.add({
                tripId: tripId,
                lat: editForm.lat || 0,
                lng: editForm.lng || 0,
                timestamp: editForm.timestamp || new Date().toISOString(),
                note: editForm.note || "",
                media: editForm.media || undefined,
                tags: editForm.tags || ["Log"]
            });
            setIsCreating(false);
        } else if (editingWaypoint?.id) {
            await db.waypoints.update(editingWaypoint.id, editForm);
            setEditingWaypoint(null);
        }
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="relative h-56 w-full">
                {trip.coverPhoto ? (
                    <img src={trip.coverPhoto} alt={trip.destination} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground opacity-30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40" />
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 text-white">
                    <h1 className="text-3xl font-bold font-sans drop-shadow-md">{trip.destination}</h1>
                    <p className="opacity-90 font-medium mt-1">
                        {format(parseISO(trip.startDate), "MMM d")} - {format(parseISO(trip.endDate), "MMM d, yyyy")}
                    </p>
                </div>
            </div>

            {/* Action Row */}
            <div className="flex gap-4 p-4 border-b border-border bg-card">
                <Link
                    href={`/trip/${tripId}/map`}
                    className="flex-1 flex items-center justify-center py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-semibold transition-colors"
                >
                    <MapPin className="w-4 h-4 mr-2 text-primary" /> Map View
                </Link>
                <Link
                    href={`/trip/${tripId}/expenses`}
                    className="flex-1 flex items-center justify-center py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-semibold transition-colors"
                >
                    <Receipt className="w-4 h-4 mr-2 text-primary" /> Expenses
                </Link>
            </div>

            {/* Timeline */}
            <div className="p-4 space-y-8 mt-2">
                {Object.entries(groupedWaypoints).map(([day, wps]) => (
                    <div key={day} className="relative">
                        <div className="sticky top-14 z-10 bg-background/90 backdrop-blur-sm -mx-4 px-4 py-2 mb-4 border-y border-border/50">
                            <h3 className="font-bold text-sm text-primary">{format(parseISO(day), "EEEE, MMM d")}</h3>
                        </div>

                        <div className="space-y-6">
                            {wps.map((wp, idx) => (
                                <div key={wp.id} className="relative pl-6">
                                    {/* Vertical line indicator */}
                                    {idx !== wps.length - 1 && (
                                        <div className="absolute left-[7px] top-6 bottom-[-32px] w-[2px] bg-border" />
                                    )}
                                    {/* Dot */}
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-background bg-primary shadow-sm" />

                                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm relative group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                            <button
                                                onClick={() => { setEditingWaypoint(wp); setEditForm(wp); }}
                                                className="p-1.5 bg-secondary text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                            </button>
                                            <button
                                                onClick={async () => { if (confirm('Delete place?')) await db.waypoints.delete(wp.id!); }}
                                                className="p-1.5 bg-secondary text-destructive rounded-full hover:bg-destructive hover:text-white transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mb-2 pr-12">
                                            <div className="flex items-center text-xs font-semibold text-muted-foreground">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {format(parseISO(wp.timestamp), "h:mm a")}
                                            </div>
                                            <div className="flex gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                                                {wp.tags.map(tag => (
                                                    <span key={tag} className="bg-primary/10 px-2 py-0.5 rounded-sm">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {wp.note && <p className="text-sm mt-1">{wp.note}</p>}
                                        {wp.media && (
                                            <div className="mt-3 rounded-xl overflow-hidden border border-border">
                                                <img src={wp.media} alt="Waypoint media" className="w-full h-auto object-cover max-h-48" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {!Object.keys(groupedWaypoints).length && (
                    <div className="text-center py-12 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No waypoints logged yet.</p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-20 right-6 z-40">
                <button
                    onClick={() => { setIsCreating(true); setEditForm({}); setEditingWaypoint(null); }}
                    className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
                >
                    <MapPin className="w-6 h-6" />
                </button>
            </div>

            {(editingWaypoint || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl p-6 border border-border shadow-2xl relative">
                        <h2 className="text-xl font-bold mb-4 text-foreground drop-shadow-sm">{isCreating ? "Add Visited Place" : "Edit Place"}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Note / Description</label>
                                <textarea
                                    className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground min-h-[4rem]"
                                    rows={3}
                                    value={editForm.note || ""}
                                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Timestamp</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                        value={editForm.timestamp ? editForm.timestamp.slice(0, 16) : ""}
                                        onChange={(e) => setEditForm({ ...editForm, timestamp: `${e.target.value}:00Z` })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                        value={editForm.tags?.join(", ") || ""}
                                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Media URL</label>
                                <input
                                    type="text"
                                    className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                    value={editForm.media || ""}
                                    onChange={(e) => setEditForm({ ...editForm, media: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setEditingWaypoint(null); setIsCreating(false); }}
                                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveWaypoint}
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm active:scale-95 transition-transform"
                            >
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
