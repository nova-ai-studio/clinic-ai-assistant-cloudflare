// Appointment booking: the clinic's weekly schedule, free slots and bookings.
// Other patients' appointments are simulated deterministically (a given slot is always taken or
// always free), and bookings made in the chat belong to the visitor's page session, like the history.

export type ServiceId = "checkup" | "consultation" | "filling" | "whitening" | "emergency" | "kids";
export type PartOfDay = "morning" | "afternoon" | "evening";

export const SERVICES: Record<ServiceId, { en: string; fr: string; minutes: number }> = {
  checkup: { en: "Check-up and cleaning", fr: "Examen et nettoyage", minutes: 60 },
  consultation: { en: "Consultation", fr: "Consultation", minutes: 30 },
  filling: { en: "Filling", fr: "Obturation", minutes: 60 },
  whitening: { en: "Teeth whitening", fr: "Blanchiment des dents", minutes: 60 },
  emergency: { en: "Emergency exam", fr: "Examen d'urgence", minutes: 30 },
  kids: { en: "Children's check-up", fr: "Examen pour enfant", minutes: 30 },
};
export const SERVICE_IDS = Object.keys(SERVICES) as ServiceId[];

export const DENTISTS: { id: string; name: string; days: number[]; services: ServiceId[] }[] = [
  { id: "tremblay", name: "Dr. Camille Tremblay", days: [1, 2, 3, 4, 5], services: ["checkup", "consultation", "filling", "whitening", "emergency"] },
  { id: "haddad", name: "Dr. Omar Haddad", days: [1, 3, 4, 6], services: ["checkup", "consultation", "filling", "emergency"] },
  { id: "nguyen", name: "Dr. Sofia Nguyen", days: [2, 4, 5, 6], services: ["checkup", "consultation", "kids", "emergency"] },
];
export const DENTIST_IDS = DENTISTS.map((d) => d.id);

/** Opening hours per weekday (0 = Sunday), in minutes from midnight. Saturdays are open every other week. */
const HOURS: Record<number, [number, number] | null> = {
  0: null,
  1: [480, 1140],
  2: [480, 1140],
  3: [480, 1140],
  4: [480, 1140],
  5: [480, 960],
  6: [540, 840],
};
const LUNCH: [number, number] = [720, 780];
const STEP = 30;
const TAKEN_PERCENT = 45;
const MIN_NOTICE_MINUTES = 60;
export const MAX_DAYS_AHEAD = 60;

export interface Slot {
  date: string; // YYYY-MM-DD, clinic time (Montréal)
  time: string; // HH:MM
  dentist: string;
}

export interface Booking extends Slot {
  ref: string;
  service: ServiceId;
  name: string;
  phone: string;
  email: string;
  newPatient: boolean;
  notes: string;
}

/** What blocks a slot: a booking already made in this session. */
export type Held = Pick<Booking, "ref" | "service" | "date" | "time" | "dentist">;

// ── Dates (plain YYYY-MM-DD strings, computed in UTC so time zones never shift them) ──
const DAY_MS = 86_400_000;
const dayMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const addDays = (d: string, n: number) => new Date(dayMs(d) + n * DAY_MS).toISOString().slice(0, 10);
export const weekday = (d: string) => new Date(dayMs(d)).getUTCDay();
const toMinutes = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(dayMs(v));
const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** Current date and time at the clinic. */
export function clinicNow(now = new Date()): { date: string; minutes: number; label: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Montreal",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const minutes = +parts.hour * 60 + +parts.minute;
  return { date, minutes, label: `${dayLabel(date, "en")}, ${toTime(minutes)}` };
}

export function dayLabel(date: string, lang: "en" | "fr"): string {
  return new Date(dayMs(date)).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function isOpenDay(date: string): boolean {
  const wd = weekday(date);
  if (!HOURS[wd]) return false;
  // Saturdays: open on even weeks (weeks counted from Monday 1970-01-05).
  return wd !== 6 || Math.floor((dayMs(date) / DAY_MS - 4) / 7) % 2 === 0;
}

/** FNV-1a: a stable pseudo-random number for a key, so simulated appointments never move. */
function hash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

const takenByOthers = (dentist: string, date: string, minute: number) => hash(`${dentist}|${date}|${minute}`) % 100 < TAKEN_PERCENT;

function heldBlocks(held: Held[]): Set<string> {
  const blocks = new Set<string>();
  for (const b of held) {
    const start = toMinutes(b.time);
    for (let m = start; m < start + SERVICES[b.service].minutes; m += STEP) blocks.add(`${b.dentist}|${b.date}|${m}`);
  }
  return blocks;
}

const inPart = (m: number, part?: PartOfDay) =>
  !part || (part === "morning" ? m < 720 : part === "afternoon" ? m >= 720 && m < 1020 : m >= 1020);

/** Every free start time for a service between two dates (inclusive), earliest first. */
export function freeSlots(
  service: ServiceId,
  from: string,
  to: string,
  held: Held[],
  opts: { dentist?: string; partOfDay?: PartOfDay; now?: { date: string; minutes: number } } = {},
): Slot[] {
  const now = opts.now ?? clinicNow();
  const first = from < now.date ? now.date : from;
  const lastAllowed = addDays(now.date, MAX_DAYS_AHEAD);
  const last = to > lastAllowed ? lastAllowed : to;
  const { minutes } = SERVICES[service];
  const blocked = heldBlocks(held);
  const slots: Slot[] = [];

  for (let date = first; date <= last; date = addDays(date, 1)) {
    const wd = weekday(date);
    const hours = HOURS[wd];
    if (!hours || !isOpenDay(date)) continue;
    if (service === "emergency" && wd === 6) continue; // same-day emergency slots are kept on weekdays
    for (const d of DENTISTS) {
      if (!d.services.includes(service) || !d.days.includes(wd) || (opts.dentist && opts.dentist !== d.id)) continue;
      for (let start = hours[0]; start + minutes <= hours[1]; start += STEP) {
        if (date === now.date && start < now.minutes + MIN_NOTICE_MINUTES) continue;
        if (wd !== 6 && start < LUNCH[1] && start + minutes > LUNCH[0]) continue;
        if (!inPart(start, opts.partOfDay)) continue;
        let free = true;
        for (let m = start; m < start + minutes && free; m += STEP) {
          free = !takenByOthers(d.id, date, m) && !blocked.has(`${d.id}|${date}|${m}`);
        }
        if (free) slots.push({ date, time: toTime(start), dentist: d.id });
      }
    }
  }
  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.dentist.localeCompare(b.dentist));
}

export function isFree(service: ServiceId, slot: Slot, held: Held[]): boolean {
  return freeSlots(service, slot.date, slot.date, held, { dentist: slot.dentist }).some((s) => s.time === slot.time);
}

export const dentistName = (id: string) => DENTISTS.find((d) => d.id === id)?.name ?? id;

// ── Request parsing ─────────────────────────────────────────────────────────

export const isService = (v: unknown): v is ServiceId => typeof v === "string" && v in SERVICES;

export function parseSlot(v: unknown): Slot | null {
  const s = v as Partial<Slot> | null;
  if (!s || !isDate(s.date) || !isTime(s.time) || typeof s.dentist !== "string" || !DENTIST_IDS.includes(s.dentist)) return null;
  return { date: s.date, time: s.time, dentist: s.dentist };
}

/** This session's bookings, sent back by the page so their slots stay blocked. */
export function parseHeld(v: unknown): Held[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 20) return null;
  const held: Held[] = [];
  for (const b of v) {
    const slot = parseSlot(b);
    if (!slot || !isService(b.service) || typeof b.ref !== "string" || !/^LUM-[A-Z0-9]{4}$/.test(b.ref)) return null;
    held.push({ ...slot, service: b.service, ref: b.ref });
  }
  return held;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** The booking form the visitor submitted in the chat. */
export function parseBookingForm(v: unknown): Omit<Booking, "ref"> | string {
  const f = v as Record<string, unknown> | null;
  const slot = parseSlot(f);
  if (!f || !slot || !isService(f.service)) return "Invalid booking: service, date, time and dentist are required.";
  const name = clean(f.name, 80);
  const phone = clean(f.phone, 30);
  const email = clean(f.email, 120);
  if (name.length < 2) return "Please enter your full name.";
  if (!/^[\d\s()+.-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7) return "Please enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  return { ...slot, service: f.service, name, phone, email, newPatient: f.newPatient === true, notes: clean(f.notes, 300) };
}

export function newRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `LUM-${Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => chars[b % chars.length]).join("")}`;
}
