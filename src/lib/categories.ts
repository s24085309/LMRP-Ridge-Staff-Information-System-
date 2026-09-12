// Default seed categories. Administrators can add/rename/reorder/hide
// categories at runtime — this list only bootstraps a fresh database.
export const DEFAULT_CATEGORIES = [
  { name: "Administration", slug: "administration", icon: "settings", order: 1 },
  { name: "Ed-Admin", slug: "ed-admin", icon: "monitor", order: 2 },
  { name: "Google Classroom", slug: "google-classroom", icon: "graduation-cap", order: 3 },
  { name: "Academics", slug: "academics", icon: "book", order: 4 },
  { name: "🛟S³ - Student Support System", slug: "student-support", icon: null, order: 5 },
  { name: "Culture", slug: "culture", icon: "drama", order: 6 },
  { name: "Sport", slug: "sport", icon: "trophy", order: 7 },
  { name: "School Resources", slug: "school-resources", icon: "folder", order: 8 },
] as const;
