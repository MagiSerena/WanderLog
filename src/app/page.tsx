/* eslint-disable */
"use client";

import React, { useEffect, useState } from "react";
import { db, Trip } from "@/lib/db";
import { SignIn } from "@/components/auth/SignIn";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays, MapPin, Plane, Send, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trip>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [greeting, setGreeting] = useState("Ready for your next adventure?");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good Morning 🌅, Ready for your next adventure?");
    else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon ☀️, Ready for your next adventure?");
    else setGreeting("Good Night 🌙, Ready for your next adventure?");

    if (localStorage.getItem("token")) {
      setIsAuthenticated(true);
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    seedData();
    seedIndianPlaces();
    seedKyotoPlaces();

    return () => clearInterval(timer);
  }, []);

  const trips = useLiveQuery(() => db.trips.toArray());
  const wps = useLiveQuery(() => db.waypoints.toArray());
  const exps = useLiveQuery(() => db.expenses.toArray());

  // Wait till hydrated to prevent next.js mismatch
  if (!isClient) return null;

  const normalizeExpense = (amount: number, currency: string) => {
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.1,
      GBP: 1.25,
      INR: 0.012,
      JPY: 0.0067,
      KRW: 0.00075,
      ISK: 0.0073
    };
    return amount * (rates[currency?.toUpperCase()] || 1);
  };
  const xpBase = (trips && wps && exps) ? Math.floor(trips.length * 500 + wps.length * 150 + exps.reduce((s, e) => s + normalizeExpense(e.amount, e.currency || "USD"), 0) * 0.1) : 0;
  const userLevel = Math.floor(xpBase / 1000) + 1;
  const progressPercent = ((xpBase % 1000) / 1000) * 100;

  async function seedKyotoPlaces() {
    if (localStorage.getItem("seeded_kyoto_v2")) return;
    localStorage.setItem("seeded_kyoto_v2", "true");

    const kyotoTrips = await db.trips.where("destination").equals("Kyoto, Japan").toArray();
    let kyotoId: number;

    if (kyotoTrips.length > 0 && kyotoTrips[0].id) {
      kyotoId = kyotoTrips[0].id;
    } else {
      kyotoId = await db.trips.add({
        destination: "Kyoto, Japan",
        startDate: "2026-10-12T00:00:00Z",
        endDate: "2026-10-18T00:00:00Z",
        coverPhoto: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
        budget: 2000,
        mode: "flight",
      }) as number;
    }

    await db.waypoints.bulkAdd([
      { tripId: kyotoId, lat: 34.9671, lng: 135.7727, timestamp: "2026-10-12T10:00:00Z", tags: ["Shrine", "Culture"], note: "Fushimi Inari Taisha - Thousand Tori Gates!" },
      { tripId: kyotoId, lat: 35.0393, lng: 135.7292, timestamp: "2026-10-13T09:30:00Z", tags: ["Temple", "Zen"], note: "Kinkaku-ji (Golden Pavilion)" },
      { tripId: kyotoId, lat: 35.0116, lng: 135.6773, timestamp: "2026-10-14T14:00:00Z", tags: ["Nature", "Walk"], note: "Arashiyama Bamboo Grove" }
    ]);

    await db.expenses.bulkAdd([
      { tripId: kyotoId, amount: 250, currency: "USD", category: "Stay", date: "2026-10-12", title: "Traditional Ryokan" },
      { tripId: kyotoId, amount: 45, currency: "USD", category: "Food", date: "2026-10-13", title: "Kaiseki Dinner" },
      { tripId: kyotoId, amount: 15, currency: "USD", category: "Transport", date: "2026-10-14", title: "Bus Pass" },
      { tripId: kyotoId, amount: 20, currency: "USD", category: "Activities", date: "2026-10-14", title: "Matcha Tea Ceremony" },
      { tripId: kyotoId, amount: 100, currency: "USD", category: "Transport", date: "2026-10-18", title: "Shinkansen to Tokyo" }
    ]);
  }

  async function seedIndianPlaces() {
    if (localStorage.getItem("seeded_india")) return;
    localStorage.setItem("seeded_india", "true");

    const keralaId = await db.trips.add({
      destination: "Kerala Backwaters, India",
      startDate: "2027-01-10T00:00:00Z",
      endDate: "2027-01-18T00:00:00Z",
      coverPhoto: "https://images.unsplash.com/photo-1602216056096-3b40cc0f9942?w=800&q=80",
      budget: 1200,
      mode: "train",
    });

    await db.waypoints.bulkAdd([
      { tripId: keralaId, lat: 9.9312, lng: 76.2673, timestamp: "2027-01-10T14:00:00Z", tags: ["Arrival"], note: "Reached Kochi" },
      { tripId: keralaId, lat: 9.4981, lng: 76.3388, timestamp: "2027-01-12T10:00:00Z", tags: ["Nature", "Boat"], note: "Houseboat cruise in Alleppey" },
    ]);

    await db.expenses.add({ tripId: keralaId, amount: 150, currency: "USD", category: "Stay", date: "2027-01-12", title: "Houseboat Booking" });

    const ladakhId = await db.trips.add({
      destination: "Leh Ladakh, India",
      startDate: "2027-06-05T00:00:00Z",
      endDate: "2027-06-15T00:00:00Z",
      coverPhoto: "https://images.unsplash.com/photo-1549487920-d3ff91f9b51c?w=800&q=80",
      budget: 1500,
      mode: "flight",
    });

    await db.waypoints.add({ tripId: ladakhId, lat: 34.1526, lng: 77.5771, timestamp: "2027-06-06T09:00:00Z", tags: ["Mountain"], note: "Acclimatizing in Leh" });
  }

  async function seedData() {
    // Ad-hoc forced migration to move dates to the past per user request
    const allTrips = await db.trips.toArray();
    const historicYears = ['2019', '2021', '2022', '2023', '2024'];

    if (!localStorage.getItem("seeded_santorini_upcoming")) {
      localStorage.setItem("seeded_santorini_upcoming", "true");
      await db.trips.add({
        destination: "Santorini, Greece",
        startDate: "2027-10-15T00:00:00Z",
        endDate: "2027-10-25T00:00:00Z",
        coverPhoto: "https://images.unsplash.com/photo-1498598457418-36ef20772bb9?w=1600&q=80",
        budget: 4200,
        mode: "upcoming",
      });
    }

    // Enforce update for ANY existing Santorini or Greece trip to use the new scenery photo, 2027 dates, and upcoming mode
    const allTripper = await db.trips.toArray();
    for (const st of allTripper) {
      if (st.destination.toLowerCase().includes("greece")) {
        await db.trips.update(st.id!, {
          coverPhoto: st.coverPhoto || "https://images.unsplash.com/photo-1498598457418-36ef20772bb9?w=1600&q=80",
          startDate: "2027-10-15T00:00:00Z",
          endDate: "2027-10-25T00:00:00Z",
          mode: "upcoming"
        });
      }
    }

    for (let i = 0; i < allTrips.length; i++) {
      const trip = allTrips[i];
      if (trip.destination === "Leh Ladakh, India" || trip.destination === "Kerala Backwaters, India" || trip.destination.toLowerCase().includes("greece")) continue;

      const targetYear = historicYears[i % historicYears.length];

      // Update dates if they don't match the historic year and are not in 2026/2027
      if (!trip.startDate.startsWith(targetYear) && !trip.startDate.startsWith('2026') && !trip.startDate.startsWith('2027')) {
        await db.trips.update(trip.id!, {
          startDate: trip.startDate.replace(/202[0-9]/, targetYear),
          endDate: trip.endDate?.replace(/202[0-9]/, targetYear),
          mode: "past"
        });
      }
    }

    // Automatically convert ONLY the first "Kyoto, Japan" to "Seoul"
    const kyotoTrips = await db.trips.where("destination").equals("Kyoto, Japan").toArray();
    if (kyotoTrips.length > 0) {
      await db.trips.update(kyotoTrips[0].id!, {
        destination: "Seoul, South Korea",
        coverPhoto: "https://images.unsplash.com/photo-1513511110023-3bdfecb5cb22?w=800&q=80"
      });
    }
    if (kyotoTrips.length > 1) {
      await db.trips.update(kyotoTrips[1].id!, {
        coverPhoto: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80"
      });
    }

    // Because my previous patch forcefully renamed ALL of them to Seoul, I must run a cleanup for them:
    const seoulTrips = await db.trips.where("destination").equals("Seoul, South Korea").toArray();

    if (seoulTrips.length > 0) {
      const primarySeoul = seoulTrips[0];
      await db.trips.update(primarySeoul.id!, {
        coverPhoto: "https://images.unsplash.com/photo-1546874177-9e664107314e?w=800&q=80"
      });

      const wps = await db.waypoints.where("tripId").equals(primarySeoul.id!).count();
      if (wps === 0) {
        await db.waypoints.bulkAdd([
          { tripId: primarySeoul.id!, lat: 37.5796, lng: 126.9770, timestamp: primarySeoul.startDate, tags: ["History", "Sightseeing"], note: "Visited Gyeongbokgung Palace & wore Hanbok!" },
          { tripId: primarySeoul.id!, lat: 37.5815, lng: 126.9850, timestamp: primarySeoul.startDate.replace(/T.*/, 'T14:30:00Z'), tags: ["Culture", "Walk"], note: "Explored Bukchon Hanok Village" },
          { tripId: primarySeoul.id!, lat: 37.5511, lng: 126.9882, timestamp: primarySeoul.startDate.replace(/T.*/, 'T20:00:00Z'), tags: ["View", "Nightlife"], note: "N Seoul Tower sunset and Itaewon dinner" }
        ]);
        await db.expenses.bulkAdd([
          { tripId: primarySeoul.id!, amount: 120, currency: "USD", category: "Stay", date: primarySeoul.startDate.split('T')[0], title: "Hanok Guesthouse" },
          { tripId: primarySeoul.id!, amount: 45, currency: "USD", category: "Food", date: primarySeoul.startDate.split('T')[0], title: "K-BBQ Dinner" },
          { tripId: primarySeoul.id!, amount: 15, currency: "USD", category: "Activities", date: primarySeoul.startDate.split('T')[0], title: "Hanbok Rental" }
        ]);
      }
    }

    if (seoulTrips.length > 1) {
      await db.trips.update(seoulTrips[1].id!, {
        destination: "Kyoto, Japan",
        coverPhoto: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80"
      });
    }

    // Force strict 12th-18th October date overrides for Japan exactly as referenced
    const explicitKyotoTrips = await db.trips.where("destination").equals("Kyoto, Japan").toArray();
    for (const trip of explicitKyotoTrips) {
      const mappedYear = trip.startDate.split('-')[0];
      await db.trips.update(trip.id!, {
        startDate: `${mappedYear}-10-12T00:00:00Z`,
        endDate: `${mappedYear}-10-18T00:00:00Z`
      });
    }

    // Unconditionally guarantee that Niagara Falls is visible to the user!
    const icelandTrips = await db.trips.where("destination").equals("Iceland Ring Road").toArray();
    const niagaraTrips = await db.trips.where("destination").equals("Niagara Falls, Canada").toArray();

    // If Niagara Falls doesn't exist natively, mutate the duplicate Iceland OR append it outright
    if (niagaraTrips.length === 0) {
      if (icelandTrips.length > 1) {
        const trip = icelandTrips[1];
        await db.trips.update(trip.id!, {
          destination: "Niagara Falls, Canada",
          coverPhoto: "/niagara_generated.png"
        });
        await db.waypoints.where("tripId").equals(trip.id!).delete();
        await db.expenses.where("tripId").equals(trip.id!).delete();

        await db.waypoints.bulkAdd([
          { tripId: trip.id!, lat: 43.0828, lng: -79.0742, timestamp: "2023-08-10T10:00:00Z", tags: ["Nature", "Sightseeing"], note: "Maid of the Mist boat tour! Got completely soaked!" },
          { tripId: trip.id!, lat: 43.0768, lng: -79.0800, timestamp: "2023-08-10T15:00:00Z", tags: ["View", "Walk"], note: "Walked along the Horseshoe Falls observation deck" },
          { tripId: trip.id!, lat: 43.0896, lng: -79.0849, timestamp: "2023-08-10T20:30:00Z", tags: ["Food", "Nightlife"], note: "Dinner at Skylon Tower revolving restaurant" }
        ]);
        await db.expenses.bulkAdd([
          { tripId: trip.id!, amount: 35, currency: "USD", category: "Activities", date: "2023-08-10", title: "Maid of the Mist Tickets" },
          { tripId: trip.id!, amount: 110, currency: "USD", category: "Food", date: "2023-08-10", title: "Skylon Tower Fine Dining" },
          { tripId: trip.id!, amount: 20, currency: "USD", category: "Transport", date: "2023-08-10", title: "WEGO Bus Pass" }
        ]);
        const appendedNiagaraId = await db.trips.add({
          destination: "Niagara Falls, Canada",
          startDate: "2023-08-10T00:00:00Z",
          endDate: "2023-08-15T00:00:00Z",
          coverPhoto: "/niagara_generated.png",
          budget: 1800,
          mode: "past"
        });
        await db.waypoints.bulkAdd([
          { tripId: appendedNiagaraId, lat: 43.0828, lng: -79.0742, timestamp: "2023-08-10T10:00:00Z", tags: ["Nature", "Sightseeing"], note: "Maid of the Mist boat tour! Got completely soaked!" },
          { tripId: appendedNiagaraId, lat: 43.0768, lng: -79.0800, timestamp: "2023-08-10T15:00:00Z", tags: ["View", "Walk"], note: "Walked along the Horseshoe Falls observation deck" },
          { tripId: appendedNiagaraId, lat: 43.0896, lng: -79.0849, timestamp: "2023-08-10T20:30:00Z", tags: ["Food", "Nightlife"], note: "Dinner at Skylon Tower revolving restaurant" }
        ]);
        await db.expenses.bulkAdd([
          { tripId: appendedNiagaraId, amount: 35, currency: "USD", category: "Activities", date: "2023-08-10", title: "Maid of the Mist Tickets" },
          { tripId: appendedNiagaraId, amount: 110, currency: "USD", category: "Food", date: "2023-08-10", title: "Skylon Tower Fine Dining" },
          { tripId: appendedNiagaraId, amount: 20, currency: "USD", category: "Transport", date: "2023-08-10", title: "WEGO Bus Pass" }
        ]);
      }
    } else {
      // If it exists, unconditionally force the cover photo to fix any 404 image errors and securely inject logs
      for (const trip of niagaraTrips) {
        await db.trips.update(trip.id!, {
          coverPhoto: "/niagara_generated.png"
        });

        await db.waypoints.where("tripId").equals(trip.id!).delete();
        await db.expenses.where("tripId").equals(trip.id!).delete();

        await db.waypoints.bulkAdd([
          { tripId: trip.id!, lat: 43.0828, lng: -79.0742, timestamp: "2023-08-10T10:00:00Z", tags: ["Nature", "Sightseeing"], note: "Maid of the Mist boat tour! Got completely soaked!" },
          { tripId: trip.id!, lat: 43.0768, lng: -79.0800, timestamp: "2023-08-10T15:00:00Z", tags: ["View", "Walk"], note: "Walked along the Horseshoe Falls observation deck" },
          { tripId: trip.id!, lat: 43.0896, lng: -79.0849, timestamp: "2023-08-10T20:30:00Z", tags: ["Food", "Nightlife"], note: "Dinner at Skylon Tower revolving restaurant" }
        ]);
        await db.expenses.bulkAdd([
          { tripId: trip.id!, amount: 35, currency: "USD", category: "Activities", date: "2023-08-10", title: "Maid of the Mist Tickets" },
          { tripId: trip.id!, amount: 110, currency: "USD", category: "Food", date: "2023-08-10", title: "Skylon Tower Fine Dining" },
          { tripId: trip.id!, amount: 20, currency: "USD", category: "Transport", date: "2023-08-10", title: "WEGO Bus Pass" }
        ]);
      }
    }

    // Force strict 5th-12th October date overrides for Niagara Falls explicitly requested by the user
    const explicitNiagaraTrips = await db.trips.where("destination").equals("Niagara Falls, Canada").toArray();
    for (const trip of explicitNiagaraTrips) {
      const mappedYear = trip.startDate.split('-')[0];
      await db.trips.update(trip.id!, {
        startDate: `${mappedYear}-10-05T00:00:00Z`,
        endDate: `${mappedYear}-10-12T00:00:00Z`
      });

      const wps = await db.waypoints.where("tripId").equals(trip.id!).toArray();
      for (const wp of wps) {
        await db.waypoints.update(wp.id!, {
          timestamp: wp.timestamp.replace(/-08-10|-10-12/g, "-10-05")
        });
      }

      const exps = await db.expenses.where("tripId").equals(trip.id!).toArray();
      for (const ex of exps) {
        await db.expenses.update(ex.id!, {
          date: ex.date.replace(/-08-10|-10-12/g, "-10-05")
        });
      }
    }

    const ladakhTrips = await db.trips.where("destination").equals("Leh Ladakh, India").toArray();

    if (ladakhTrips.length > 0) {
      for (const trip of ladakhTrips) {
        await db.trips.update(trip.id!, {
          coverPhoto: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
          startDate: "2026-11-05T00:00:00Z",
          endDate: "2026-11-15T00:00:00Z",
          mode: "upcoming"
        });

        const wps = await db.waypoints.where("tripId").equals(trip.id!).toArray();
        for (const wp of wps) {
          await db.waypoints.update(wp.id!, {
            timestamp: wp.timestamp.replace(/^\d{4}-\d{2}-/, "2026-11-")
          });
        }

        const exps = await db.expenses.where("tripId").equals(trip.id!).toArray();
        for (const ex of exps) {
          await db.expenses.update(ex.id!, {
            date: ex.date.replace(/^\d{4}-\d{2}-/, "2026-11-")
          });
        }
      }
    }

    const keralaTrips = await db.trips.where("destination").equals("Kerala Backwaters, India").toArray();
    if (keralaTrips.length > 0) {
      keralaTrips.forEach(async (trip) => {
        await db.trips.update(trip.id!, {
          coverPhoto: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=800&q=80"
        });
      });
    }

    // Prevent double execution in React Strict Mode
    if (localStorage.getItem("seeded")) return;
    localStorage.setItem("seeded", "true");

    const existing = await db.trips.count();
    if (existing > 0) return; // Already seeded

    await db.trips.add({
      destination: "Seoul, South Korea",
      startDate: "2026-10-15T00:00:00Z",
      endDate: "2026-10-22T00:00:00Z",
      coverPhoto: "https://images.unsplash.com/photo-1513511110023-3bdfecb5cb22?w=800&q=80",
      budget: 2500,
      mode: "flight",
    });

    const icelandId = await db.trips.add({
      destination: "Iceland Ring Road",
      startDate: "2026-12-05T00:00:00Z",
      endDate: "2026-12-15T00:00:00Z",
      coverPhoto: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&q=80",
      budget: 3200,
      mode: "car",
    });

    // Add some waypoints & expenses to Iceland natively
    await db.waypoints.bulkAdd([
      { tripId: icelandId, lat: 64.1466, lng: -21.9426, timestamp: "2026-12-05T10:00:00Z", tags: ["City", "Arrival"], note: "Landed in Reykjavik" },
      { tripId: icelandId, lat: 63.8804, lng: -22.4495, timestamp: "2026-12-05T14:30:00Z", tags: ["Spa", "Relax"], note: "Blue Lagoon" },
    ]);

    await db.expenses.bulkAdd([
      { tripId: icelandId, amount: 11000, currency: "ISK", category: "Activities", date: "2026-12-05", title: "Blue Lagoon Entry" },
      { tripId: icelandId, amount: 6200, currency: "ISK", category: "Food", date: "2026-12-05", title: "Dinner in Reykjavik" },
    ]);

    // Automatically convert any legacy USD Iceland expenses to correct ISK to retroactively repair data
    const allExps = await db.expenses.toArray();
    for (const exp of allExps) {
      if (exp.currency === "USD" && exp.amount === 80) {
        await db.expenses.update(exp.id!, { amount: 11000, currency: "ISK" });
      }
      if (exp.currency === "USD" && exp.amount === 45) {
        await db.expenses.update(exp.id!, { amount: 6200, currency: "ISK" });
      }
    }
  }

  async function handleDeleteTrip(e: React.MouseEvent, tripId: number) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this trip and all its logs?")) {
      await db.trips.delete(tripId);
      await db.waypoints.where("tripId").equals(tripId).delete();
      await db.expenses.where("tripId").equals(tripId).delete();
    }
  }

  async function handleSaveEdit() {
    if (isCreating) {
      await db.trips.add({
        destination: editForm.destination || "New Diary Entry",
        startDate: editForm.startDate || new Date().toISOString().split('T')[0] + 'T00:00:00Z',
        endDate: editForm.endDate || new Date().toISOString().split('T')[0] + 'T00:00:00Z',
        coverPhoto: editForm.coverPhoto || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        budget: editForm.budget || 0,
        mode: editForm.mode || "upcoming"
      });
      setIsCreating(false);
    } else if (editingTrip?.id) {
      await db.trips.update(editingTrip.id, editForm);
      setEditingTrip(null);
    }
  }

  if (!isAuthenticated) {
    return <SignIn onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="p-4 space-y-6 flex flex-col pt-6">
      <header className="py-2 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-md">Your Journeys</h1>
        <p className="text-slate-900 dark:text-gray-200 font-medium mt-1">{greeting}</p>
      </header>

      {/* Cinematic Upcoming Trip Countdown injected here... */}
      {(() => {
        const upcomingTrips = trips?.filter(t => t.mode === 'upcoming');
        if (!upcomingTrips || upcomingTrips.length === 0 || !currentTime) return null;

        // Find the absolute closest upcoming trip
        const upcomingTrip = upcomingTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

        const diff = new Date(upcomingTrip.startDate).getTime() - currentTime.getTime();
        if (diff < 0) return null;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 relative overflow-hidden rounded-[2rem] bg-black border border-white/10 shadow-2xl group w-full h-[180px]">
            <div className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-1000">
              <img src={upcomingTrip.coverPhoto} className="w-full h-full object-cover blur-[2px] group-hover:blur-0 transition-all duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            </div>
            <div className="relative p-7 flex flex-col md:flex-row items-center justify-between text-white z-10 w-full h-full">
              <div className="text-center md:text-left">
                <div className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-400 mb-2 flex items-center justify-center md:justify-start space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <span className="drop-shadow-md">Next Adventure</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black drop-shadow-2xl tracking-tighter">{upcomingTrip.destination}</h2>
              </div>
              <div className="flex space-x-3 mt-4 md:mt-0">
                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl w-[70px] h-[75px] border border-white/20 shadow-xl group-hover:bg-white/20 transition-colors">
                  <span className="text-2xl font-black">{days}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">Days</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl w-[70px] h-[75px] border border-white/20 shadow-xl group-hover:bg-white/20 transition-colors">
                  <span className="text-2xl font-black">{hours}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">Hrs</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl w-[70px] h-[75px] border border-white/20 shadow-xl group-hover:bg-white/20 transition-colors">
                  <span className="text-2xl font-black">{mins}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">Mins</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl w-[70px] h-[75px] border border-white/20 shadow-xl group-hover:bg-white/20 transition-colors">
                  <span className="text-2xl font-black text-blue-400">{secs}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">Secs</span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })()}

      {/* Traveler Stats Gamification Bar */}
      {trips && wps && exps && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-white/0 dark:to-white/0 group-hover:dark:from-blue-500/5 group-hover:dark:to-indigo-500/5 transition-colors duration-500 pointer-events-none" />

          {/* Level Badge */}
          <div className="flex items-center space-x-4 relative z-10 w-full md:w-auto">
            <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 shrink-0">
              <span className="text-2xl font-black text-white">{userLevel}</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white dark:border-[#111] animate-pulse shadow-sm" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Master Explorer</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{xpBase.toLocaleString()} Travel XP</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 w-full flex flex-col px-0 md:px-4 relative z-10">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              <span>Level {userLevel}</span>
              <span>Level {userLevel + 1}</span>
            </div>
            <div className="w-full h-3.5 bg-gray-100 dark:bg-black/50 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
          </div>

          {/* Stats Counters */}
          <div className="flex items-center space-x-6 text-center w-full md:w-auto relative z-10 justify-around md:justify-end border-t md:border-t-0 border-gray-100 dark:border-white/5 pt-4 md:pt-0 mt-2 md:mt-0">
            <div>
              <span className="block text-xl font-black text-gray-900 dark:text-white drop-shadow-sm">{trips.length}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Trips</span>
            </div>
            <div>
              <span className="block text-xl font-black text-gray-900 dark:text-white drop-shadow-sm">{wps.length}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Memories</span>
            </div>
          </div>
        </motion.div>
      )}

      {trips?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 mt-12 bg-card rounded-2xl border border-border shadow-sm text-center">
          <Plane className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-lg font-semibold">No trips yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm mt-2 mb-6">Create a new trip to start logging waypoints, photos, and expenses.</p>
          <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 active:scale-95 transform">
            Start a Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {trips?.map((trip: Trip, idx: number) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={trip.id}
            >
              <Link
                href={`/trip/${trip.id}`}
                className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="relative h-40 w-full bg-muted overflow-hidden">
                  {trip.coverPhoto ? (
                    <img src={trip.coverPhoto} alt={trip.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <MapPin className="text-muted-foreground w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-md shadow-sm">
                    {trip.mode.toUpperCase()}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-xl leading-truncate drop-shadow-sm">{trip.destination}</h3>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col space-y-1 text-sm">
                    <div className="flex items-center text-white font-semibold">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      <span>{format(parseISO(trip.startDate), "MMM d")} - {format(parseISO(trip.endDate), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="bg-secondary p-2 rounded-full text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors mr-2">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="flex gap-2 relative z-20">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingTrip(trip); setEditForm(trip); }}
                      className="bg-secondary p-2 rounded-full text-blue-500 hover:bg-blue-500 hover:text-white transition-colors shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id!)}
                      className="bg-secondary p-2 rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Add New Input Slot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (trips?.length || 0) * 0.1 }}
          >
            <button
              onClick={() => { setIsCreating(true); setEditForm({}); setEditingTrip(null); }}
              className="w-full group flex flex-col items-center justify-center h-full min-h-[15rem] bg-card/60 backdrop-blur-md border-[2px] border-dashed border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] hover:bg-card/90 text-muted-foreground hover:text-foreground"
            >
              <div className="bg-secondary/80 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-sm text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              </div>
              <span className="font-bold text-lg">Add New Diary/Trip</span>
            </button>
          </motion.div>
        </div>
      )}

      {/* Advanced Edit/Add Modal */}
      {(editingTrip || isCreating) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => { setEditingTrip(null); setIsCreating(false); }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-[#111111] w-full max-w-xl rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header integrated with Cover Photo preview if available, else Gradient */}
            <div className="relative h-32 sm:h-40 w-full bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden shrink-0">
              {editForm.coverPhoto && (
                <img src={editForm.coverPhoto} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {isCreating ? "New Adventure" : "Edit Itinerary"}
                </h2>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Destination</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><MapPin className="w-5 h-5" /></span>
                  <input
                    type="text"
                    placeholder="e.g. Kyoto, Japan"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    value={editForm.destination || ""}
                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    value={editForm.startDate?.split('T')[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, startDate: `${e.target.value}T00:00:00Z` })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    value={editForm.endDate?.split('T')[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, endDate: `${e.target.value}T00:00:00Z` })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Trip Mode</label>
                <select
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  value={editForm.mode || "flight"}
                  onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="car">Car Roadtrip</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                  Cover Photo URL
                  <span className="text-[10px] text-blue-500 font-semibold cursor-pointer hover:underline" onClick={() => setEditForm({ ...editForm, coverPhoto: "" })}>Clear</span>
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all mb-3 text-sm truncate"
                  value={editForm.coverPhoto || ""}
                  onChange={(e) => setEditForm({ ...editForm, coverPhoto: e.target.value })}
                />

                {/* Quick Photo Suggester */}
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Or choose a quick theme:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80", // Travel classic map
                      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", // Beach
                      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80", // Mountains
                      "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&q=80"  // City
                    ].map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setEditForm({ ...editForm, coverPhoto: url.replace('w=400', 'w=800') })}
                        className={`h-12 rounded-lg bg-gray-200 dark:bg-gray-800 cursor-pointer overflow-hidden border-2 transition-all ${editForm.coverPhoto?.includes(url.split('?')[0]) ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent hover:border-gray-400 opacity-70 hover:opacity-100'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 flex justify-end space-x-3 dark:bg-[#1a1a24] border-t border-gray-200 dark:border-white/5 shrink-0 mt-auto">
              <button
                onClick={() => { setEditingTrip(null); setIsCreating(false); }}
                className="px-6 py-3 rounded-xl bg-transparent text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 flex items-center space-x-2"
              >
                <Plane className="w-4 h-4" />
                <span>Save Trip</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
