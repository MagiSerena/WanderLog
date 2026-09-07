"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dynamic from 'next/dynamic';

// Next.js needs dynamic import for react-leaflet to prevent SSR errors
const MapView = dynamic(
    () => import('../../../../components/MapView').then((mod) => mod.default),
    { ssr: false, loading: () => <div className="w-full h-screen bg-card animate-pulse flex items-center justify-center">Loading map...</div> }
);

export default function TripMapPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = Number(params.id);

    return (
        <div className="relative w-full h-screen">
            <div className="absolute top-4 left-4 z-[400]">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-background/90 hover:bg-background backdrop-blur-md rounded-full shadow-lg transition-colors border border-border text-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>
            <MapView tripId={tripId} />
        </div>
    );
}
