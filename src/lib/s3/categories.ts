// Default seed data for S³ support categories/subcategories, alphabetically
// ordered — this also makes each <select>'s native "type a letter to jump"
// behaviour predictable. Configurable by admins at runtime (Section 67)
// once that settings UI is built — this only bootstraps a fresh database.
export const SUPPORT_CATEGORIES: Array<{ name: string; subcategories: string[] }> = [
  {
    name: "Academic",
    subcategories: [
      "Declining academic performance",
      "Difficulty understanding work",
      "Homework concerns",
      "Literacy",
      "Motivation",
      "Numeracy",
      "Other",
      "Study skills",
      "Test/exam concerns",
    ],
  },
  {
    name: "Attendance",
    subcategories: ["Early departure", "Frequent absence", "Other", "Persistent lateness", "Truancy", "Unexplained absence"],
  },
  {
    name: "Behaviour",
    subcategories: [
      "Aggression",
      "Classroom disruption",
      "Conflict",
      "Defiance",
      "Disruptive behaviour",
      "Inappropriate language",
      "Other",
      "Repeated rule-breaking",
      "Withdrawal",
    ],
  },
  {
    name: "Bullying",
    subcategories: [
      "Cyberbullying",
      "Other",
      "Physical bullying",
      "Social/relational bullying",
      "Suspected bullying (unconfirmed)",
      "Verbal bullying",
    ],
  },
  {
    name: "Concentration / Attention",
    subcategories: [
      "Appears disengaged",
      "Difficulty completing tasks",
      "Difficulty following instructions",
      "Easily distracted",
      "Excessive talking",
      "Frequently off-task",
      "Other",
      "Restlessness",
    ],
  },
  {
    name: "Family / Home Circumstances",
    subcategories: [
      "Bereavement in family",
      "Change in home circumstances",
      "Family conflict",
      "Financial hardship",
      "Housing instability",
      "Other",
      "Parental separation/divorce",
    ],
  },
  {
    name: "Learning Difficulties",
    subcategories: [
      "Diagnosed learning difficulty requiring support",
      "Other",
      "Processing speed concern",
      "Reading difficulty",
      "Suspected learning difficulty",
      "Writing difficulty",
    ],
  },
  {
    name: "Motivation",
    subcategories: [
      "Lack of engagement in extramural activities",
      "Loss of interest in previously enjoyed subject/activity",
      "Low motivation in class",
      "Low motivation to attend",
      "Other",
    ],
  },
  { name: "Other", subcategories: ["Other"] },
  {
    name: "Peer Relationships",
    subcategories: [
      "Difficulty maintaining friendships",
      "Exclusion from peer group",
      "Falling out with friends",
      "Group conflict",
      "Other",
      "Peer pressure",
    ],
  },
  {
    name: "Personal / Emotional",
    subcategories: [
      "Anxiety/worry",
      "Emotional distress",
      "Family circumstances",
      "Grief/loss",
      "Mood changes",
      "Other",
      "Self-esteem",
      "Social difficulties",
    ],
  },
  {
    name: "Physical / Health Concern",
    subcategories: ["Chronic health condition", "Fatigue/tiredness", "Frequent illness", "Injury", "Nutrition/eating concern", "Other"],
  },
  {
    name: "Safety Concern",
    subcategories: [
      "Concern for emotional safety",
      "Concern for physical safety",
      "Other",
      "Risk-taking behaviour",
      "Unsafe environment (home/school)",
    ],
  },
  {
    name: "Social",
    subcategories: ["Conflict with peers", "Difficulty in group work", "Difficulty making friends", "Other", "Social isolation", "Social skills concerns"],
  },
  {
    name: "Substance Concern",
    subcategories: ["Other", "Peer influence concern", "Possession", "Suspected substance use", "Under the influence at school"],
  },
  {
    name: "Technology / Online Concern",
    subcategories: ["Cyberbullying", "Excessive screen time", "Inappropriate online content", "Online safety concern", "Other", "Social media conflict"],
  },
];

export const ACTIVITY_TYPES = [
  "Before/After School",
  "Break",
  "Culture",
  "General School",
  "Other",
  "Sport",
  "Subject",
] as const;

export const SUBJECTS = [
  "Afrikaans",
  "English",
  "Life Orientation",
  "Mathematics",
  "Science",
  "Social Sciences",
] as const;

export const SPORTS = ["Athletics", "Cricket", "Hockey", "Netball", "Rugby", "Swimming"] as const;

export const CULTURAL_ACTIVITIES = ["Art Club", "Chess", "Choir", "Debate", "Drama"] as const;

export const ACTION_TYPES = [
  "Behaviour intervention",
  "Classroom observation",
  "Further investigation",
  "Learner meeting",
  "Monitoring initiated",
  "No action required",
  "Other",
  "Parent meeting",
  "Referred to academic support",
  "Referred to counselling/support",
  "Referred to external support",
  "Spoke to learner",
  "Spoke to parent/guardian",
  "Spoke to staff member",
  "Teacher meeting",
] as const;
