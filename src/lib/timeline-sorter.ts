import { Waypoint } from "./db";
import { format, parseISO } from "date-fns";

export function sortWaypointsByTimeline(waypoints: Waypoint[]): Waypoint[] {
    return [...waypoints].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function groupWaypointsByDay(waypoints: Waypoint[]): Record<string, Waypoint[]> {
    const sorted = sortWaypointsByTimeline(waypoints);
    const grouped: Record<string, Waypoint[]> = {};

    sorted.forEach(wp => {
        const day = format(parseISO(wp.timestamp), "yyyy-MM-dd");
        if (!grouped[day]) {
            grouped[day] = [];
        }
        grouped[day].push(wp);
    });

    return grouped;
}
