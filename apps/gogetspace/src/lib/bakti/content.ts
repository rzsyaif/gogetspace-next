/**
 * Content of the generated Bakti Analisa site. It follows the confirmed brief; values the brief marks as
 * assumptions (accreditation, year, locations…) are used as written there.
 */

export const BUSINESS = {
  name: "Bakti Analisa",
  legalName: "Bakti Analisa Clinical Laboratory Sdn. Bhd.",
  tagline: "Clinical laboratory, Penang",
  phone: "+60 4-226 1088",
  whatsapp: "+60 12-480 2211",
  email: "hello@baktianalisa.my",
  established: 2008,
  accreditation: "MS ISO 15189",
  resultsPortal: "results.baktianalisa.my",
}

export interface Location {
  id: string
  name: string
  kind: string
  address: string[]
  hours: { days: string; time: string }[]
  phone: string
  note?: string
  /** position on the stylised map, 0–100 */
  map: { x: number; y: number }
}

export const LOCATIONS: Location[] = [
  {
    id: "george-town",
    name: "George Town",
    kind: "Main laboratory & collection centre",
    address: ["48 Jalan Burmah", "10050 George Town, Penang"],
    hours: [
      { days: "Mon – Fri", time: "7:00 am – 6:00 pm" },
      { days: "Saturday", time: "7:00 am – 1:00 pm" },
      { days: "Sunday & public holidays", time: "Closed" },
    ],
    phone: "+60 4-226 1088",
    note: "Free parking behind the building",
    map: { x: 62, y: 30 },
  },
  {
    id: "bayan-lepas",
    name: "Bayan Lepas",
    kind: "Collection centre",
    address: ["2-1-12 Bayan Point, Jalan Mayang Pasir 3", "11950 Bayan Lepas, Penang"],
    hours: [
      { days: "Mon – Fri", time: "7:30 am – 5:00 pm" },
      { days: "Saturday", time: "7:30 am – 12:30 pm" },
    ],
    phone: "+60 4-641 2290",
    note: "Next to the industrial park — popular with corporate screening",
    map: { x: 58, y: 78 },
  },
  {
    id: "butterworth",
    name: "Butterworth",
    kind: "Collection centre",
    address: ["15 Jalan Raja Uda", "12300 Butterworth, Penang"],
    hours: [
      { days: "Mon – Fri", time: "7:30 am – 5:00 pm" },
      { days: "Saturday", time: "7:30 am – 12:30 pm" },
    ],
    phone: "+60 4-332 7185",
    map: { x: 84, y: 22 },
  },
]

export interface Test {
  id: string
  name: string
  category: "Blood" | "Urine" | "Hormones" | "Allergy" | "Cancer markers" | "Infection"
  price: number
  fasting?: string
  turnaround: string
  sample: string
  popular?: boolean
  description: string
}

export const TESTS: Test[] = [
  { id: "fbc", name: "Full blood count (FBC)", category: "Blood", price: 25, turnaround: "Same day", sample: "Blood", popular: true, description: "Checks red and white blood cells and platelets — a common first test for tiredness, infection or anaemia." },
  { id: "glucose", name: "Fasting blood glucose", category: "Blood", price: 12, fasting: "8–10 hours", turnaround: "Same day", sample: "Blood", popular: true, description: "Screens for diabetes and pre-diabetes." },
  { id: "hba1c", name: "HbA1c", category: "Blood", price: 45, turnaround: "1 day", sample: "Blood", popular: true, description: "Your average blood sugar over the past 2–3 months. No fasting needed." },
  { id: "lipid", name: "Lipid profile (cholesterol)", category: "Blood", price: 40, fasting: "10–12 hours", turnaround: "Same day", sample: "Blood", popular: true, description: "Total, LDL and HDL cholesterol and triglycerides." },
  { id: "rp", name: "Kidney function (renal profile)", category: "Blood", price: 45, turnaround: "Same day", sample: "Blood", description: "Urea, creatinine, eGFR and electrolytes." },
  { id: "lft", name: "Liver function test (LFT)", category: "Blood", price: 45, turnaround: "Same day", sample: "Blood", description: "Liver enzymes, proteins and bilirubin." },
  { id: "thyroid", name: "Thyroid function (TSH, Free T4)", category: "Hormones", price: 70, turnaround: "1 day", sample: "Blood", popular: true, description: "Checks for an under- or over-active thyroid." },
  { id: "vitd", name: "Vitamin D (25-OH)", category: "Blood", price: 90, turnaround: "2 days", sample: "Blood", description: "Low vitamin D is common, even in sunny Penang." },
  { id: "hormone-f", name: "Female hormone panel", category: "Hormones", price: 160, turnaround: "2 days", sample: "Blood", description: "FSH, LH, oestradiol and prolactin. Best taken on day 2–5 of your cycle." },
  { id: "psa", name: "PSA (prostate)", category: "Cancer markers", price: 60, turnaround: "1 day", sample: "Blood", description: "Prostate-specific antigen. Recommended for men over 50 or as advised by your doctor." },
  { id: "cea", name: "CEA", category: "Cancer markers", price: 65, turnaround: "1 day", sample: "Blood", description: "A tumour marker most often used to follow up bowel cancer." },
  { id: "ige", name: "Allergy panel (30 allergens)", category: "Allergy", price: 380, turnaround: "5 days", sample: "Blood", description: "Food and inhalant allergens including dust mite, seafood, nuts and pollen." },
  { id: "ufeme", name: "Urine FEME", category: "Urine", price: 15, turnaround: "Same day", sample: "Urine (first morning)", description: "Full urine exam for infection, sugar and protein." },
  { id: "dengue", name: "Dengue NS1 & IgG/IgM", category: "Infection", price: 75, turnaround: "Same day", sample: "Blood", description: "For fever lasting more than 2 days. Results in about 3 hours." },
  { id: "hep-b", name: "Hepatitis B screening", category: "Infection", price: 35, turnaround: "1 day", sample: "Blood", description: "HBsAg and anti-HBs, often required for work." },
]

export interface Package {
  id: string
  name: string
  price: number
  for: string
  tests: number
  highlights: string[]
  featured?: boolean
}

export const PACKAGES: Package[] = [
  { id: "basic", name: "Basic", price: 120, for: "A yearly check for adults under 40", tests: 28, highlights: ["Full blood count", "Blood sugar", "Cholesterol", "Kidney & liver", "Urine FEME"] },
  { id: "comprehensive", name: "Comprehensive", price: 380, for: "A thorough check for adults 40+", tests: 52, highlights: ["Everything in Basic", "HbA1c", "Thyroid", "Vitamin D", "Hepatitis B", "Doctor's review"], featured: true },
  { id: "women", name: "Women's", price: 420, for: "Hormones, iron and bone health", tests: 48, highlights: ["Comprehensive core", "Female hormones", "Iron studies", "CA-125", "Calcium"] },
  { id: "men", name: "Men's", price: 420, for: "Heart, prostate and hormones", tests: 47, highlights: ["Comprehensive core", "PSA", "Testosterone", "Uric acid", "hs-CRP"] },
  { id: "senior", name: "Senior", price: 460, for: "For 60+, with a doctor's review", tests: 58, highlights: ["Comprehensive core", "Cardiac markers", "Bone profile", "Tumour markers", "Doctor's review"] },
]

export const STEPS = [
  { title: "Book or walk in", text: "Book online or on WhatsApp in under a minute, or just walk in to any centre." },
  { title: "Quick collection", text: "Most visits take 10 minutes. We'll tell you beforehand if you need to fast." },
  { title: "Results online", text: "Get a secure link by SMS. Most results are ready the same day." },
]

export const AUDIENCES = [
  { id: "patients", title: "For patients", text: "Blood tests and health checks, with or without a doctor's referral.", cta: "See tests & prices", href: "tests-and-packages" },
  { id: "doctors", title: "For doctors & clinics", text: "Courier pick-up, e-reports straight to your clinic and monthly billing.", cta: "Open a clinic account", href: "for-doctors" },
  { id: "companies", title: "For companies", text: "Pre-employment and annual screening, on-site at your workplace.", cta: "Request a quote", href: "corporate-screening" },
]

export const TESTIMONIALS = [
  { quote: "In and out in 10 minutes, and my results were on my phone before dinner.", name: "Mei Ling T.", role: "Patient, Air Itam" },
  { quote: "Reports arrive in our clinic system the same afternoon. Our patients no longer chase us for results.", name: "Dr. Arvind S.", role: "GP, Klinik Sentosa" },
  { quote: "They screened 340 of our staff on-site in two mornings without stopping the production line.", name: "Nurul H.", role: "HR Manager, Bayan Lepas" },
]

export const FAQS = [
  { q: "Do I need a doctor's referral?", a: "No. You can book most tests yourself. If you have a referral letter, bring it along and we'll send the results to your doctor too." },
  { q: "Do I need to fast?", a: "Only for some tests, such as fasting glucose and cholesterol (8–12 hours). Plain water is fine. Each test shows whether fasting is needed, and we'll remind you when you book." },
  { q: "How do I get my results?", a: "We send a secure link by SMS and email as soon as your results are ready. You can also log in to the results portal at any time." },
  { q: "How long do results take?", a: "Most routine tests are ready the same day. Specialist tests take 1–5 working days — the time is listed next to each test." },
  { q: "Can I pay with insurance or my company panel?", a: "Yes. We're on most major insurance and corporate panels. Bring your card or letter of guarantee." },
  { q: "Do you collect samples at home?", a: "Yes, within Penang Island and Seberang Perai for RM 50 per visit. Book on WhatsApp and choose a time slot." },
  { q: "Is my data kept private?", a: "Yes. Your results are only shared with you and the doctor you name, in line with the Personal Data Protection Act 2010." },
]

export const TEAM = [
  { name: "Dr. Siti Rahmah Idris", role: "Consultant Pathologist & Lab Director" },
  { name: "Lim Wei Jie", role: "Head of Quality" },
  { name: "Priya Nair", role: "Senior Medical Laboratory Technologist" },
  { name: "Ahmad Faizal", role: "Corporate Screening Lead" },
]

export const PREP = [
  { title: "Fasting tests", items: ["Don't eat or drink anything except plain water for 8–12 hours (the exact time is shown for each test).", "Take your usual medicines unless your doctor says otherwise.", "Morning appointments are easiest — come in before breakfast."] },
  { title: "Urine tests", items: ["Use the first urine of the morning if you can.", "Collect a mid-stream sample in the container we give you.", "Bring it to us within 2 hours."] },
  { title: "Hormone tests", items: ["Female hormone tests are best done on day 2–5 of your cycle.", "Testosterone and cortisol are best measured before 10 am."] },
  { title: "What to bring", items: ["Your IC or passport", "Your doctor's referral letter, if you have one", "Your insurance card or company letter of guarantee"] },
]
