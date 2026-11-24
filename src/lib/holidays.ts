export interface HolidayItem {
  date: string; // YYYY-MM-DD in IST
  title: string;
  description: string;
}

const FIXED_ANNUAL_HOLIDAYS: { mmdd: string; title: string; description: string }[] = [
  {
    mmdd: "01-26",
    title: "Republic Day — School Holiday",
    description: "School will remain closed on account of Republic Day.",
  },
  {
    mmdd: "04-13",
    title: "Baisakhi — School Holiday",
    description: "School will remain closed on account of Baisakhi.",
  },
  {
    mmdd: "04-14",
    title: "Dr. B.R. Ambedkar Jayanti — School Holiday",
    description: "School will remain closed on account of Ambedkar Jayanti.",
  },
  {
    mmdd: "08-15",
    title: "Independence Day — School Holiday",
    description: "School will remain closed on account of Independence Day.",
  },
  {
    mmdd: "09-23",
    title: "Maharaja Hari Singh Ji Birthday — School Holiday",
    description: "School will remain closed on account of the official holiday.",
  },
  {
    mmdd: "10-02",
    title: "Gandhi Jayanti — School Holiday",
    description: "School will remain closed on account of Gandhi Jayanti.",
  },
  {
    mmdd: "10-26",
    title: "Accession Day — School Holiday",
    description: "School will remain closed on account of Accession Day.",
  },
  {
    mmdd: "12-25",
    title: "Christmas Day — School Holiday",
    description: "School will remain closed on account of Christmas Day.",
  },
];

// All-India & State Official Gazetted Holidays (2026-2027)
const DATED_HOLIDAYS: HolidayItem[] = [
  // Late 2026
  {
    date: "2026-11-24",
    title: "Guru Nanak Dev Ji's Birthday — School Holiday",
    description:
      "School will remain closed on account of Guru Nanak Dev Ji's Birthday.",
  },
  // 2027 All-India Gazetted Holidays
  {
    date: "2027-03-06",
    title: "Maha Shivratri — School Holiday",
    description: "School will remain closed on account of Maha Shivratri.",
  },
  {
    date: "2027-03-10",
    title: "Eid-ul-Fitr — School Holiday",
    description:
      "School will remain closed on account of Eid-ul-Fitr (subject to moon sighting).",
  },
  {
    date: "2027-03-22",
    title: "Holi — School Holiday",
    description: "School will remain closed on account of Holi.",
  },
  {
    date: "2027-03-26",
    title: "Good Friday — School Holiday",
    description: "School will remain closed on account of Good Friday.",
  },
  {
    date: "2027-04-15",
    title: "Ram Navami — School Holiday",
    description: "School will remain closed on account of Ram Navami.",
  },
  {
    date: "2027-04-19",
    title: "Mahavir Jayanti — School Holiday",
    description: "School will remain closed on account of Mahavir Jayanti.",
  },
  {
    date: "2027-05-17",
    title: "Eid-ul-Adha (Bakrid) — School Holiday",
    description:
      "School will remain closed on account of Eid-ul-Adha (subject to moon sighting).",
  },
  {
    date: "2027-05-20",
    title: "Buddha Purnima — School Holiday",
    description: "School will remain closed on account of Buddha Purnima.",
  },
  {
    date: "2027-06-15",
    title: "Muharram (Ashura) — School Holiday",
    description:
      "School will remain closed on account of Muharram (subject to moon sighting).",
  },
  {
    date: "2027-08-17",
    title: "Raksha Bandhan — School Holiday",
    description: "School will remain closed on account of Raksha Bandhan.",
  },
  {
    date: "2027-08-25",
    title: "Janmashtami — School Holiday",
    description: "School will remain closed on account of Janmashtami.",
  },
  {
    date: "2027-08-16",
    title: "Eid-e-Milad — School Holiday",
    description:
      "School will remain closed on account of Eid-e-Milad (subject to moon sighting).",
  },
  {
    date: "2027-10-10",
    title: "Dussehra (Vijayadashami) — School Holiday",
    description: "School will remain closed on account of Dussehra.",
  },
  {
    date: "2027-10-29",
    title: "Diwali — School Holiday",
    description: "School will remain closed on account of Diwali.",
  },
  {
    date: "2027-11-14",
    title: "Guru Nanak Dev Ji's Birthday — School Holiday",
    description:
      "School will remain closed on account of Guru Nanak Dev Ji's Birthday.",
  },
];

function getIstDateString(offsetDays = 0): string {
  const now = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000 + offsetDays * 86400_000;
  const ist = new Date(istMs);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns holidays occurring today or tomorrow (in IST).
 * Automatically disappears the day after the holiday passes.
 */
export function getUpcomingAutoHolidays(): (HolidayItem & { label: string })[] {
  const today = getIstDateString(0);
  const tomorrow = getIstDateString(1);
  const currentYear = today.slice(0, 4);
  const nextYear = tomorrow.slice(0, 4);

  const allHolidays: HolidayItem[] = [...DATED_HOLIDAYS];
  for (const fixed of FIXED_ANNUAL_HOLIDAYS) {
    allHolidays.push({
      date: `${currentYear}-${fixed.mmdd}`,
      title: fixed.title,
      description: fixed.description,
    });
    if (nextYear !== currentYear) {
      allHolidays.push({
        date: `${nextYear}-${fixed.mmdd}`,
        title: fixed.title,
        description: fixed.description,
      });
    }
  }

  const results: (HolidayItem & { label: string })[] = [];
  for (const h of allHolidays) {
    if (h.date === today) {
      results.push({ ...h, label: "Today • School Closed" });
    } else if (h.date === tomorrow) {
      results.push({ ...h, label: "Tomorrow • Holiday Notice" });
    }
  }
  return results;
}

const MOTIVATIONAL_QUOTES = [
  {
    quote:
      "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  {
    quote:
      "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.",
    author: "Dr. A.P.J. Abdul Kalam",
  },
  {
    quote:
      "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    quote: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
  },
  {
    quote:
      "Believe in yourself, work hard every day, and never stop learning.",
    author: "EMPHSS Bawli",
  },
];

export function getDailyMotivationalQuote() {
  const dayOfYear = Math.floor(Date.now() / 86400_000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
