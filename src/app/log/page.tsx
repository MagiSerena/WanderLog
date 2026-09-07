"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Send, Loader2 } from "lucide-react";

export default function LogWaypointPage() {
    const router = useRouter();
    const trips = useLiveQuery(() => db.trips.toArray());

    const [tripId, setTripId] = useState<number | "">("");
    const [note, setNote] = useState("");
    const [tags, setTags] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    const handleGetLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setIsLocating(false);
                },
                (err) => {
                    console.error(err);
                    // Fallback to Iceland if error just for demonstration
                    setLocation({ lat: 64.1265, lng: -21.8174 });
                    setIsLocating(false);
                }
            );
        } else {
            setLocation({ lat: 64.1265, lng: -21.8174 });
            setIsLocating(false);
        }
    };

    const handleSave = async () => {
        if (!tripId || !location) return;

        const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

        await db.waypoints.add({
            tripId: Number(tripId),
            lat: location.lat,
            lng: location.lng,
            timestamp: new Date().toISOString(),
            note,
            tags: tagArray
        });

        router.push(`/trip/${tripId}`);
    };

    return (
        <div className="p-4 pt-10 max-w-lg mx-auto pb-24">
            <h1 className="text-2xl font-bold mb-6">Log New Moment</h1>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Select Trip</label>
                    <select
                        value={tripId}
                        onChange={e => setTripId(Number(e.target.value))}
                        className="w-full bg-card border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="" disabled>Choose a trip...</option>
                        {trips?.map(t => (
                            <option key={t.id} value={t.id}>{t.destination}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Location</label>
                    <button
                        onClick={handleGetLocation}
                        className={`w-full flex items-center justify-center p-4 rounded-xl border-2 border-dashed transition-colors ${location ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary text-muted-foreground"
                            }`}
                    >
                        {isLocating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : location ? (
                            <>
                                <MapPin className="w-5 h-5 mr-2" />
                                <span>Captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                            </>
                        ) : (
                            <>
                                <MapPin className="w-5 h-5 mr-2" />
                                <span>Tap to capture current GPS</span>
                            </>
                        )}
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Note / Memory</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="What's happening right now?"
                        className="w-full bg-card border border-border rounded-xl p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-2">Tags (comma separated)</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="e.g. food, sightseeing, transport"
                        className="w-full bg-card border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="pt-4 flex gap-4">
                    <button className="flex-1 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold p-4 rounded-xl transition-colors">
                        <Camera className="w-5 h-5 mr-2" /> Photo
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!tripId || !location}
                        className="flex-1 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold p-4 rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5 mr-2" /> Save Log
                    </button>
                </div>
            </div>
        </div>
    );
}
