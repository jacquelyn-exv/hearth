export type Urgency = 'none' | 'low' | 'medium' | 'high' | 'critical'
// ============================================================
// HEARTH SYSTEM RULES ENGINE
// Age thresholds, condition logic, and maintenance rules
// per system type. Add roofing and other system rules here
// as content is provided.
// ============================================================


export type SystemCondition = 'good' | 'watch' | 'priority' | 'inspect' | 'unknown' | 'na'

export type AgeThreshold = {
  age_min: number
  age_max: number
  condition: SystemCondition
  urgency: Urgency
  task_title: string
  task_description: string
  inspection_override: boolean // recent inspection can downgrade urgency
}

export type SystemRule = {
  system_type: string
  display_name: string
  icon: string
  expected_lifespan_years: number
  age_thresholds: AgeThreshold[]
  never_inspected_escalation: boolean // escalate one level if age > 10 and never inspected
  maintenance_interval_months: number
  diy_difficulty: 1 | 2 | 3 | 4 | 5 // 1 = easy DIY, 5 = always hire
  warning_signs: string[]
  notes: string
}

export const SYSTEM_RULES: SystemRule[] = [
  // ── WATER HEATER ──────────────────────────────────────────
  {
    system_type: 'water_heater',
    display_name: 'Water Heater',
    icon: '🔥',
    expected_lifespan_years: 11,
    age_thresholds: [
      {
        age_min: 0, age_max: 7,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 8, age_max: 10,
        condition: 'watch', urgency: 'low',
        task_title: 'Schedule water heater inspection',
        task_description: 'Your water heater is 8–10 years old and approaching the end of its expected lifespan. An annual inspection now lets you plan a replacement on your timeline — not in an emergency.',
        inspection_override: true,
      },
      {
        age_min: 10, age_max: 12,
        condition: 'priority', urgency: 'medium',
        task_title: 'Get water heater inspected this year',
        task_description: 'Your water heater is past its expected lifespan. Have a plumber inspect the anode rod, check for corrosion, and give you a replacement timeline. Planning now saves you from an emergency replacement.',
        inspection_override: true,
      },
      {
        age_min: 12, age_max: 999,
        condition: 'inspect', urgency: 'high',
        task_title: 'Plan water heater replacement — past lifespan',
        task_description: 'Your water heater is significantly past its expected lifespan. The risk of failure increases sharply after year 12. Get a professional assessment and plan your replacement before it fails — emergency replacements cost significantly more and water damage from a failed heater can reach $8,000–15,000.',
        inspection_override: true,
      },
    ],
    never_inspected_escalation: true,
    maintenance_interval_months: 12,
    diy_difficulty: 2,
    warning_signs: [
      'Rusty or discolored hot water',
      'Rumbling or popping noises when heating',
      'Water pooling around the base',
      'Hot water runs out faster than it used to',
      'Visible corrosion on the tank or connections',
    ],
    notes: 'Annual sediment flush extends life. Check anode rod every 3 years.',
  },

  // ── HVAC ──────────────────────────────────────────────────
  {
    system_type: 'hvac',
    display_name: 'HVAC',
    icon: '🌡️',
    expected_lifespan_years: 17,
    age_thresholds: [
      {
        age_min: 0, age_max: 8,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 8, age_max: 12,
        condition: 'watch', urgency: 'low',
        task_title: 'Schedule HVAC tune-up',
        task_description: 'Your HVAC system is 8–12 years old. Annual tune-ups at this stage extend life and maintain efficiency. Change filters every 1–3 months.',
        inspection_override: true,
      },
      {
        age_min: 12, age_max: 15,
        condition: 'priority', urgency: 'medium',
        task_title: 'Get HVAC assessed — plan for replacement',
        task_description: 'Your HVAC is 12–15 years old and in its final operating window. Have it serviced and ask the technician for an honest assessment of remaining life. Start budgeting for replacement.',
        inspection_override: true,
      },
      {
        age_min: 15, age_max: 999,
        condition: 'inspect', urgency: 'high',
        task_title: 'HVAC past expected lifespan — assess now',
        task_description: 'Your HVAC system is past its expected lifespan. Get a professional assessment. Continuing to run an aging system increases your risk of failure during peak summer or winter when demand is highest and contractors are busiest.',
        inspection_override: true,
      },
    ],
    never_inspected_escalation: true,
    maintenance_interval_months: 12,
    diy_difficulty: 1,
    warning_signs: [
      'Unusual noises (grinding, squealing, banging)',
      'Uneven heating or cooling between rooms',
      'Spike in energy bills without explanation',
      'System runs constantly without reaching set temperature',
      'Frequent cycling on and off',
      'Ice forming on the outdoor unit',
    ],
    notes: 'Replace filters every 1–3 months. Schedule professional tune-up annually.',
  },

  // ── ROOF ──────────────────────────────────────────────────
  // Full rules to be populated from homeowner roofing content
  {
    system_type: 'roof',
    display_name: 'Roof',
    icon: '🏠',
    expected_lifespan_years: 27,
    age_thresholds: [
      {
        age_min: 0, age_max: 10,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 10, age_max: 18,
        condition: 'watch', urgency: 'low',
        task_title: 'Schedule roof inspection',
        task_description: 'Your roof is 10–18 years old. A professional inspection every 3–5 years at this stage catches small issues before they become expensive. Look for granule loss, cracked flashing, and any soft spots.',
        inspection_override: true,
      },
      {
        age_min: 18, age_max: 24,
        condition: 'priority', urgency: 'medium',
        task_title: 'Get roof professionally inspected',
        task_description: 'Your roof is in its final operating window. Get a professional inspection and start budgeting for replacement. Addressing minor issues now prevents major leaks later.',
        inspection_override: true,
      },
      {
        age_min: 24, age_max: 999,
        condition: 'inspect', urgency: 'high',
        task_title: 'Roof past expected lifespan — inspect now',
        task_description: 'Your roof is past its expected lifespan. Get a professional inspection immediately. A failing roof can cause cascading damage to insulation, drywall, and structural components.',
        inspection_override: true,
      },
    ],
    never_inspected_escalation: true,
    maintenance_interval_months: 36,
    diy_difficulty: 4,
    warning_signs: [
      'Granules collecting in gutters or at downspouts',
      'Missing, curled, or cracked shingles',
      'Dark stains or streaks on shingles',
      'Sagging areas on the roof deck',
      'Light visible through attic boards',
      'Water stains on ceilings or walls',
      'Damaged or lifted flashing around chimney and vents',
    ],
    notes: 'Full roofing rules to be populated. See roofing content document.',
  },

  // ── PLUMBING ──────────────────────────────────────────────
  {
    system_type: 'plumbing',
    display_name: 'Plumbing',
    icon: '💧',
    expected_lifespan_years: 50,
    age_thresholds: [
      {
        age_min: 0, age_max: 25,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 25, age_max: 40,
        condition: 'watch', urgency: 'low',
        task_title: 'Exercise plumbing shutoffs annually',
        task_description: 'Plumbing shutoff valves that are never turned can seize. Turn your main shutoff and individual fixture shutoffs once a year to keep them operational. You need to know these work before an emergency.',
        inspection_override: false,
      },
      {
        age_min: 40, age_max: 999,
        condition: 'priority', urgency: 'medium',
        task_title: 'Get plumbing inspected — aging system',
        task_description: 'Your plumbing is 40+ years old. Galvanized pipes corrode from the inside out — reduced water pressure and discolored water are signs. Have a plumber assess your supply lines.',
        inspection_override: true,
      },
    ],
    never_inspected_escalation: false,
    maintenance_interval_months: 12,
    diy_difficulty: 3,
    warning_signs: [
      'Reduced water pressure throughout the home',
      'Discolored or rusty water',
      'Slow drains in multiple fixtures',
      'Water stains on ceilings or walls',
      'Unexplained increase in water bill',
      'Visible corrosion on pipes',
    ],
    notes: 'Galvanized steel pipes corrode from inside — reduced pressure is the tell. PEX and copper last much longer.',
  },

  // ── ELECTRICAL ────────────────────────────────────────────
  {
    system_type: 'electrical',
    display_name: 'Electrical Panel',
    icon: '⚡',
    expected_lifespan_years: 35,
    age_thresholds: [
      {
        age_min: 0, age_max: 15,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 15, age_max: 25,
        condition: 'watch', urgency: 'low',
        task_title: 'Schedule electrical inspection',
        task_description: 'Electrical panels should be inspected every 10 years. Check for warm breakers, tripping issues, or any buzzing sounds from the panel.',
        inspection_override: true,
      },
      {
        age_min: 25, age_max: 999,
        condition: 'priority', urgency: 'medium',
        task_title: 'Get electrical panel professionally inspected',
        task_description: 'Your electrical panel is 25+ years old. Older panels can be fire hazards. Have a licensed electrician inspect it — especially if you have a Federal Pacific or Zinsco panel which are known to be problematic.',
        inspection_override: true,
      },
    ],
    never_inspected_escalation: true,
    maintenance_interval_months: 120,
    diy_difficulty: 5,
    warning_signs: [
      'Breakers that trip frequently',
      'Warm or hot panel cover',
      'Buzzing or crackling sounds from panel',
      'Lights that flicker or dim',
      'Burning smell near panel or outlets',
      'Panel is Federal Pacific or Zinsco brand',
    ],
    notes: 'Never DIY electrical panel work. Always hire a licensed electrician.',
  },

  // ── GUTTERS ───────────────────────────────────────────────
  {
    system_type: 'gutters',
    display_name: 'Gutters',
    icon: '🌧️',
    expected_lifespan_years: 20,
    age_thresholds: [
      {
        age_min: 0, age_max: 10,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 10, age_max: 18,
        condition: 'watch', urgency: 'low',
        task_title: 'Inspect gutters for wear',
        task_description: 'Check for sagging sections, separated joints, rust spots, and peeling paint on fascia behind gutters.',
        inspection_override: false,
      },
      {
        age_min: 18, age_max: 999,
        condition: 'priority', urgency: 'medium',
        task_title: 'Assess gutters for replacement',
        task_description: 'Your gutters are approaching end of life. Get an assessment — failing gutters cause fascia rot and foundation water damage that costs far more than gutter replacement.',
        inspection_override: false,
      },
    ],
    never_inspected_escalation: false,
    maintenance_interval_months: 6,
    diy_difficulty: 2,
    warning_signs: [
      'Sagging or pulling away from the house',
      'Water stains on siding below gutters',
      'Peeling paint on fascia',
      'Rust spots or holes',
      'Water pooling near foundation after rain',
    ],
    notes: 'Clean twice yearly — spring and fall. Check after every major storm.',
  },

  // ── WINDOWS ───────────────────────────────────────────────
  {
    system_type: 'windows',
    display_name: 'Windows',
    icon: '🪟',
    expected_lifespan_years: 22,
    age_thresholds: [
      {
        age_min: 0, age_max: 12,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 12, age_max: 18,
        condition: 'watch', urgency: 'low',
        task_title: 'Check window seals and caulking',
        task_description: 'Inspect for condensation between panes (seal failure), drafts, and degraded caulking. Re-caulking is inexpensive and improves energy efficiency.',
        inspection_override: false,
      },
      {
        age_min: 18, age_max: 999,
        condition: 'priority', urgency: 'medium',
        task_title: 'Assess windows for replacement',
        task_description: 'Windows 18+ years old often have failed seals and degraded frames. New windows improve energy efficiency, comfort, and home value. Get quotes and consider prioritizing the worst performers.',
        inspection_override: false,
      },
    ],
    never_inspected_escalation: false,
    maintenance_interval_months: 12,
    diy_difficulty: 2,
    warning_signs: [
      'Condensation or fogging between panes',
      'Drafts around frames',
      'Difficulty opening or closing',
      'Visible rot or damage on wood frames',
      'Cracked or broken seals',
    ],
    notes: 'Re-caulk annually. Check weatherstripping every 2 years.',
  },

  // ── DECK ──────────────────────────────────────────────────
  {
    system_type: 'deck',
    display_name: 'Deck / Patio',
    icon: '🪵',
    expected_lifespan_years: 17,
    age_thresholds: [
      {
        age_min: 0, age_max: 8,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 8, age_max: 13,
        condition: 'watch', urgency: 'low',
        task_title: 'Inspect deck for rot and structural integrity',
        task_description: 'Check deck boards, posts, and ledger board for rot. Poke wood with a screwdriver — soft spots indicate rot. Reseal or restain if the wood looks dry or gray.',
        inspection_override: false,
      },
      {
        age_min: 13, age_max: 999,
        condition: 'priority', urgency: 'medium',
        task_title: 'Get deck assessed — structural safety',
        task_description: 'Decks 13+ years old need a structural assessment. Ledger board failure and post rot are the leading causes of deck collapses. Get a professional assessment before the summer season.',
        inspection_override: false,
      },
    ],
    never_inspected_escalation: false,
    maintenance_interval_months: 12,
    diy_difficulty: 3,
    warning_signs: [
      'Soft or spongy boards when walked on',
      'Visible rot or dark staining on wood',
      'Wobbly railings or posts',
      'Ledger board pulling away from house',
      'Rust on metal hardware and connectors',
    ],
    notes: 'Reseal wood decks every 2–3 years. Inspect ledger board connection annually.',
  },

  // ── SUMP PUMP ─────────────────────────────────────────────
  {
    system_type: 'sump_pump',
    display_name: 'Sump Pump',
    icon: '💦',
    expected_lifespan_years: 10,
    age_thresholds: [
      {
        age_min: 0, age_max: 5,
        condition: 'good', urgency: 'none',
        task_title: '',
        task_description: '',
        inspection_override: false,
      },
      {
        age_min: 5, age_max: 8,
        condition: 'watch', urgency: 'low',
        task_title: 'Test sump pump this spring',
        task_description: 'Pour water into the pit to confirm the pump activates. Replace battery backup if more than 3 years old.',
        inspection_override: false,
      },
      {
        age_min: 8, age_max: 999,
        condition: 'priority', urgency: 'high',
        task_title: 'Replace sump pump — near end of lifespan',
        task_description: 'Sump pumps typically last 7–10 years. A failing pump during a heavy rain event can cause thousands in basement flooding damage. Replace proactively before it fails.',
        inspection_override: false,
      },
    ],
    never_inspected_escalation: false,
    maintenance_interval_months: 12,
    diy_difficulty: 2,
    warning_signs: [
      'Pump runs constantly or very frequently',
      'Pump makes unusual noises',
      'Visible rust or corrosion',
      'Pump fails to activate when water is poured in',
      'Battery backup is more than 3 years old',
    ],
    notes: 'Test every spring. Replace battery backup every 3 years.',
  },
]