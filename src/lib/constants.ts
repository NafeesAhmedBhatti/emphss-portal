export const SCHOOL_INFO = {
  fullName: "English Medium Public Higher Secondary School, Bawli",
  shortName: "EMPHSS",
  location: "Bawli",
  tagline: "Nurturing Young Minds from Nursery to 12th",
} as const;

export const CLASS_ORDER = [
  "Nursery",
  "LKG",
  "UKG",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
] as const;

export type SchoolClass = (typeof CLASS_ORDER)[number];

export const PASSED_OUT_STATUS = "Passed Out";

export function getNextClass(currentClass: string): string {
  const index = CLASS_ORDER.indexOf(currentClass as SchoolClass);
  if (index === -1) return currentClass;
  if (index === CLASS_ORDER.length - 1) return PASSED_OUT_STATUS;
  return CLASS_ORDER[index + 1];
}

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export const TRANSPORT_OPTIONS = [
  { value: "Local", label: "Local (Self / Walking / Cycle)" },
  { value: "School Transport", label: "School Transport (Van / Bus)" },
] as const;

export const TRANSPORT_ROUTES = [
  "Saj A",
  "Saj B",
  "Bhatia",
  "Badakanna",
  "Maharajpura",
  "Lah",
  "Dodasan Bala",
  "Dodasan Pain",
] as const;

export const NOTICE_CATEGORIES = [
  "Admission",
  "Timing",
  "Transport",
  "General",
] as const;

export const PRE_PRIMARY_SUBJECTS = [
  "English",
  "Math",
  "Urdu",
  "Science",
  "Hindi",
] as const;

export const MIDDLE_SUBJECTS = [
  "English",
  "Math",
  "Science",
  "SST",
  "Urdu",
  "Hindi",
  "Arabic",
  "Computer",
] as const;

export const HIGH_SCHOOL_SUBJECTS = [
  "English",
  "Math",
  "Science",
  "SST",
  "Urdu",
] as const;

export const HIGHER_SECONDARY_SUBJECTS = [
  "English",
  "Physics",
  "Chemistry",
  "Botany",
  "Zoology",
  "Math",
  "Computer Science",
  "IP",
  "Physical Education",
  "Political Science",
  "Geography",
  "Arabic",
  "Urdu",
] as const;

export function getSubjectsForClass(cls: string): string[] {
  if (cls === "Nursery" || cls === "LKG" || cls === "UKG") {
    return [...PRE_PRIMARY_SUBJECTS];
  }
  if (
    cls === "1st" ||
    cls === "2nd" ||
    cls === "3rd" ||
    cls === "4th" ||
    cls === "5th" ||
    cls === "6th" ||
    cls === "7th" ||
    cls === "8th"
  ) {
    return [...MIDDLE_SUBJECTS];
  }
  if (cls === "9th" || cls === "10th") {
    return [...HIGH_SCHOOL_SUBJECTS];
  }
  if (cls === "11th" || cls === "12th") {
    return [...HIGHER_SECONDARY_SUBJECTS];
  }
  return [];
}
