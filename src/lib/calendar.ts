import { wedding } from "@/config/wedding";

/** Google Calendar wants UTC basic-format stamps: 20260726T043000Z */
function stamp(date: Date) {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * "Add to calendar" link for the ceremony. `weddingDate` has no timezone
 * offset, so it is read as local time — matching how guests read the card.
 */
export function googleCalendarUrl(durationHours = 2) {
  const start = new Date(wedding.weddingDate);
  const end = new Date(start.getTime() + durationHours * 3_600_000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${wedding.ceremonyName} — ${wedding.groom.shortName} & ${wedding.bride.shortName}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: wedding.meta.ogDescription,
    location: wedding.venue.address,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
