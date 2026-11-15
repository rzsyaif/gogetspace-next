/**
 * Content of the generated dental practice website. Follows the confirmed brief and the
 * Niche Playbook: Dentist v0.3 guidelines, tone, page templates and guardrails.
 */

export const BUSINESS = {
  name: "Bakti Dental Care",
  legalName: "Klinik Pergigian Bakti Sdn. Bhd.",
  tagline: "General, Family & Cosmetic Dentistry",
  phone: "+60 4-226 1088",
  whatsapp: "+60 12-480 2211",
  emergencyPhone: "+60 12-480 9999",
  email: "hello@baktidental.my",
  established: 2015,
  accreditation: "Malaysian Dental Council (MDC) Registered",
  registrationNo: "MDC Reg. No. 4821",
  resultsPortal: "portal.baktidental.my",
}

export const EMERGENCY_NOTICE =
  "If you experience severe facial swelling, difficulty breathing or swallowing, uncontrolled bleeding, or serious trauma, please contact emergency medical services immediately (call 999) or visit your nearest hospital emergency department."

export interface Location {
  id: string
  name: string
  kind: string
  address: string[]
  hours: { days: string; time: string }[]
  phone: string
  emergency: string
  note?: string
  /** position on the stylised map, 0–100 */
  map: { x: number; y: number }
}

export const LOCATIONS: Location[] = [
  {
    id: "george-town",
    name: "George Town Practice",
    kind: "Main clinic & family practice",
    address: ["48 Jalan Burmah", "10050 George Town, Penang"],
    hours: [
      { days: "Mon – Fri", time: "8:30 am – 6:00 pm" },
      { days: "Saturday", time: "9:00 am – 3:00 pm" },
      { days: "Sunday", time: "Same-day emergency on call" },
    ],
    phone: "+60 4-226 1088",
    emergency: "+60 12-480 9999",
    note: "Free patient parking behind the clinic · Wheelchair accessible",
    map: { x: 62, y: 30 },
  },
  {
    id: "bayan-lepas",
    name: "Bayan Lepas Branch",
    kind: "Family & orthodontics branch",
    address: ["2-1-12 Bayan Point, Jalan Mayang Pasir 3", "11950 Bayan Lepas, Penang"],
    hours: [
      { days: "Mon – Fri", time: "9:00 am – 6:30 pm" },
      { days: "Saturday", time: "9:00 am – 2:00 pm" },
      { days: "Sunday", time: "Closed" },
    ],
    phone: "+60 4-641 2290",
    emergency: "+60 12-480 9999",
    note: "Directly opposite Sunshine Square · Ground floor",
    map: { x: 58, y: 78 },
  },
]

export interface Treatment {
  id: string
  name: string
  category: "General" | "Cosmetic" | "Orthodontics" | "Implants & Restorative" | "Pediatric" | "Emergency"
  /** from-price or indicative starting price */
  price: number
  turnaround: string
  duration: string
  sample: string
  popular?: boolean
  description: string
  fasting?: string
  comfortNote?: string
}

export const TESTS: Treatment[] = [
  {
    id: "checkup-clean",
    name: "Check-up & Teeth Cleaning (Scaling)",
    category: "General",
    price: 120,
    duration: "30–45 min",
    turnaround: "Single visit",
    sample: "Routine care",
    popular: true,
    description: "Comprehensive dental examination, ultrasonic tartar scaling, polishing and personalised oral hygiene guidance.",
    comfortNote: "Gentle approach with topical numbing gel available if you have sensitive gums.",
  },
  {
    id: "new-patient-exam",
    name: "Comprehensive New-Patient Exam & X-rays",
    category: "General",
    price: 160,
    duration: "45–60 min",
    turnaround: "Single visit",
    sample: "Initial visit",
    popular: true,
    description: "Full mouth charting, digital bite-wing X-rays, gum health scoring and a written treatment plan with transparent costs.",
    comfortNote: "Take your time — we explain every finding before making any recommendation.",
  },
  {
    id: "fillings",
    name: "Composite Tooth-Coloured Filling",
    category: "General",
    price: 90,
    duration: "30–45 min",
    turnaround: "Single visit",
    sample: "Restorative",
    popular: true,
    description: "Durable tooth-coloured resin filling matched to your natural tooth shade, restoring shape and function.",
    comfortNote: "Local anaesthesia ensures numbness during preparation. Tell us if you feel any sensitivity.",
  },
  {
    id: "child-visit",
    name: "Child's First Visit & Fluoride",
    category: "Pediatric",
    price: 80,
    duration: "30 min",
    turnaround: "Single visit",
    sample: "Pediatric care",
    popular: true,
    description: "Fun, gentle introduction to dental care, counting teeth, brushing fun, and protective topical fluoride application.",
    comfortNote: "Completely pressure-free visit with guardian present in the surgery throughout.",
  },
  {
    id: "emergency-toothache",
    name: "Emergency Toothache Relief / Same-Day Visit",
    category: "Emergency",
    price: 100,
    duration: "30 min",
    turnaround: "Same day",
    sample: "Urgent care",
    popular: true,
    description: "Immediate triage, pain relief, focused diagnostic X-ray and urgent treatment to stabilise toothache or dental trauma.",
    comfortNote: "Priority pain management. Dedicated same-day emergency slots available every weekday.",
  },
  {
    id: "teeth-whitening",
    name: "Professional Teeth Whitening",
    category: "Cosmetic",
    price: 750,
    duration: "60–90 min",
    turnaround: "1–2 visits",
    sample: "Cosmetic",
    popular: true,
    description: "In-clinic power whitening or custom take-home trays with safe, clinician-monitored gel. Noticeably brighter teeth safely.",
    comfortNote: "Pre-treatment sensitivity assessment included. Results vary by tooth structure.",
  },
  {
    id: "clear-aligners",
    name: "Clear Aligners Consultation & 3D Scan",
    category: "Orthodontics",
    price: 150,
    duration: "45 min",
    turnaround: "Consultation",
    sample: "Orthodontics",
    popular: true,
    description: "Digital 3D smile scan, orthodontic assessment and treatment simulation showing your prospective smile transformation.",
    comfortNote: "Includes complete installment and pricing breakdown with no obligation.",
  },
  {
    id: "dental-implant-consult",
    name: "Dental Implant Consultation & Assessment",
    category: "Implants & Restorative",
    price: 200,
    duration: "45 min",
    turnaround: "Consultation",
    sample: "Implant dentistry",
    popular: false,
    description: "Bone level check, surgical assessment, restoration options for single or multiple missing teeth, and full cost estimate.",
    comfortNote: "Honest suitability guidance with step-by-step recovery timeline explained.",
  },
  {
    id: "root-canal",
    name: "Root Canal Treatment",
    category: "General",
    price: 550,
    duration: "60 min",
    turnaround: "1–2 visits",
    sample: "Endodontics",
    description: "Removes infected pulp tissue to save your natural tooth, sealed with biocompatible filler and restorative crown option.",
    comfortNote: "Modern local anaesthetics make root canal therapy no more uncomfortable than a routine filling.",
  },
  {
    id: "wisdom-extraction",
    name: "Wisdom Tooth Removal",
    category: "General",
    price: 350,
    duration: "45 min",
    turnaround: "Single visit",
    sample: "Oral surgery",
    description: "Gentle extraction of problematic, impacted, or painful wisdom teeth with full aftercare instructions provided.",
    comfortNote: "Detailed pre-procedure sedation options and owner-approved aftercare kit provided.",
  },
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
  {
    id: "preventive",
    name: "Essential Check & Clean",
    price: 150,
    for: "Routine 6-month check-up for adults",
    tests: 4,
    highlights: ["Full dental exam", "Ultrasonic scaling", "Stain polishing", "Oral cancer screening"],
    featured: true,
  },
  {
    id: "family-duo",
    name: "Family Smile Visit (Parent & Child)",
    price: 220,
    for: "Parent check & clean + child's preventative visit",
    tests: 6,
    highlights: ["Adult check & scaling", "Child exam & fluoride", "Diet & brushing advice", "Joint appointment slot"],
  },
  {
    id: "cosmetic-consult",
    name: "Smile Makeover Assessment",
    price: 180,
    for: "Veneers, whitening & alignment planning",
    tests: 5,
    highlights: ["High-res intraoral photos", "3D smile preview", "Bite alignment check", "Personalised estimate"],
  },
  {
    id: "senior-care",
    name: "Senior Denture & Gum Care",
    price: 160,
    for: "Patients aged 60+ and denture wearers",
    tests: 5,
    highlights: ["Denture adjustment & ultrasonic clean", "Dry mouth assessment", "Deep gum health check", "Doctor consultation"],
  },
]

export const STEPS = [
  {
    title: "1. Book or message us",
    text: "Book your appointment online in 60 seconds or WhatsApp our friendly desk. Same-day emergency slots are reserved daily.",
  },
  {
    title: "2. Gentle, honest care",
    text: "We listen to your concerns, explain what we see on screen, and always ask if you feel anxious before starting.",
  },
  {
    title: "3. Clear plan, no surprises",
    text: "You receive a clear treatment estimate with from-prices. We never start any procedure without your prior agreement.",
  },
]

export const AUDIENCES = [
  {
    id: "families",
    title: "Families & Children",
    text: "Calm, welcoming visits designed to make children feel safe, with guardian consent and friendly communication.",
    cta: "Book family visit",
    href: "new-patients",
  },
  {
    id: "routine",
    title: "Routine & Preventive Care",
    text: "Gentle tartar scaling, composite fillings and check-ups to keep your natural teeth healthy for life.",
    cta: "Explore treatments",
    href: "treatments",
  },
  {
    id: "cosmetic-ortho",
    title: "Aligners & Cosmetic Smiles",
    text: "Clear braces, tooth whitening and aesthetic bonding with realistic outcomes and transparent payment plans.",
    cta: "Request consultation",
    href: "prices",
  },
]

export const TESTIMONIALS = [
  {
    quote: "I used to delay dentist visits because of dental anxiety. Dr. Sarah was patient, explained every step, and paused whenever I raised my hand.",
    name: "Mei Ling T.",
    role: "Regular patient · George Town",
  },
  {
    quote: "Brought my 5-year-old for her first dental check. The team made it playful and fun — no tears at all! She even asked when we can come back.",
    name: "Nurul Hidayah M.",
    role: "Mother of two · Bayan Lepas",
  },
  {
    quote: "Got an upfront estimate for my aligners with clear installment terms. No hidden charges and my progress is right on track.",
    name: "Jason K.",
    role: "Orthodontic patient · George Town",
  },
]

export const FAQS = [
  {
    q: "Will my dental treatment hurt?",
    a: "We prioritise your comfort. We apply topical numbing gel before any local anaesthetic, work gently, and establish a hand signal so you can pause treatment at any moment. Tell us if you feel anxious — we never rush.",
  },
  {
    q: "How much will my treatment cost?",
    a: "We believe in honest price guidance. Routine care carries clear 'from' prices on our website. For more complex treatments, you'll receive a detailed written estimate with payment options before anything starts.",
  },
  {
    q: "What should I do in a dental emergency?",
    a: "Call our emergency line or message us on WhatsApp immediately. We keep dedicated same-day emergency slots for severe toothache, broken teeth, or infections. For severe facial swelling or trauma affecting breathing, please go to hospital emergency (call 999).",
  },
  {
    q: "What happens during a child's first visit?",
    a: "We keep first visits gentle, fun, and pressure-free. We let your child explore the chair, count their teeth, and give them a sticker. Parents stay beside the chair throughout the appointment.",
  },
  {
    q: "Do you accept dental insurance or corporate panels?",
    a: "Yes. We accept major Malaysian corporate healthcare panels and provide itemised claim receipts for private dental insurance policies. Bring your insurance card or panel e-letter upon arrival.",
  },
  {
    q: "Can I pay in instalments for braces or implants?",
    a: "Yes. We offer interest-free instalment plans spread across your active treatment months for orthodontic aligners, braces, crowns, and dental implants.",
  },
  {
    q: "How often should I have a dental check-up?",
    a: "For most adults and children with healthy gums, a check-up and teeth cleaning every 6 months is ideal. If you are undergoing gum treatment or wearing braces, we may suggest every 3 to 4 months.",
  },
]

export const TEAM = [
  {
    name: "Dr. Sarah Tan",
    role: "Principal Dental Surgeon",
    credentials: "BDS (Malaya), MFDS RCPS (Glasgow)",
    focus: "General Dentistry, Preventive & Aesthetic Care",
    languages: "English, Bahasa Malaysia, Mandarin",
    registrationNo: "MDC Reg. No. 4821",
  },
  {
    name: "Dr. Lim Wei Kang",
    role: "Dental Surgeon",
    credentials: "BDS (IMU), Certified Clear Aligner Provider",
    focus: "Orthodontics, Clear Aligners & Restorative Care",
    languages: "English, Bahasa Malaysia, Cantonese",
    registrationNo: "MDC Reg. No. 6215",
  },
  {
    name: "Dr. Nurul Huda",
    role: "Dental Surgeon",
    credentials: "BDS (UiTM), Paediatric Dentistry Training",
    focus: "Children's Dentistry & Anxious Patients",
    languages: "English, Bahasa Malaysia",
    registrationNo: "MDC Reg. No. 7098",
  },
]

export const PREP = [
  {
    title: "What to bring for your first visit",
    items: [
      "Your Malaysian IC or passport",
      "List of any current medications you take (for safe treatment planning)",
      "Insurance card or corporate panel e-letter if you have coverage",
      "Any recent dental X-rays taken in the past 12 months, if available",
    ],
  },
  {
    title: "Support for anxious patients",
    items: [
      "Tell us when booking or arriving if you feel nervous — our team will allocate extra time.",
      "We explain what we will do before touching any instrument.",
      "You have full control: raise your left hand at any time and we immediately stop.",
      "Noise-cancelling headphones and relaxing music are available.",
    ],
  },
  {
    title: "Bringing children for dental care",
    items: [
      "Schedule morning appointments when your child is fresh and well-rested.",
      "Use positive, calm words — avoid saying 'it won't hurt' as it introduces the concept of pain.",
      "A parent or legal guardian must accompany minors and provide written treatment consent.",
    ],
  },
  {
    title: "Payment & Insurance",
    items: [
      "We accept Credit/Debit cards, DuitNow QR, Cash, and touchless e-wallets.",
      "0% instalment plans available for treatments above RM 1,000.",
      "Itemised billing provided for tax relief (dental medical expense deduction).",
    ],
  },
]
