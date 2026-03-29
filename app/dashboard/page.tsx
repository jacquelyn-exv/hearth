'use client'
import { useEffect as _useEffectHash } from 'react'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { FinancialTab } from '@/components/financial/FinancialTab'
import { HomeLog } from '@/components/log/HomeLog'
import { getSmartTasks as getEngineSmartTasks } from '@/lib/smartTasks'
import { adaptHomeProfile } from '@/lib/adaptHomeProfile'
import Nav from '@/components/Nav'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const SYSTEM_LIFESPANS: Record<string, number> = {
  // Core structural
  roof: 27, siding: 30, gutters: 25, windows: 22,
  entry_door: 35, sliding_door: 28, garage_door: 20,
  foundation: 75, plumbing: 50, electrical: 40,
  // Mechanical
  hvac: 17, water_heater: 11, sump_pump: 10, chimney: 50,
  // Outdoor
  deck: 17, driveway: 25, fencing: 20, landscaping: 20,
  irrigation: 20,
  // Situational
  septic: 30, well: 30, solar: 30, generator: 20,
  pool: 25, crawl_space: 20, water_softener: 15,
  // Appliances
  refrigerator: 13, dishwasher: 11, washer: 11, dryer: 12, oven: 15,
}

const SYSTEM_ICONS: Record<string, string> = {
  roof: '🏠', siding: '🏗️', gutters: '🌧️', windows: '🪟',
  entry_door: '🚪', sliding_door: '🪟', garage_door: '🚗',
  foundation: '🏛️', plumbing: '🔧', electrical: '⚡',
  hvac: '🌡️', water_heater: '🔥', sump_pump: '💦', chimney: '🔥',
  deck: '🪵', driveway: '🛣️', fencing: '🔒', landscaping: '🌿',
  irrigation: '💧',
  septic: '🌊', well: '🪣', solar: '☀️', generator: '⚡',
  pool: '🏊', crawl_space: '🏚️', water_softener: '💧',
  refrigerator: '🧊', dishwasher: '🍽️', washer: '🫧', dryer: '🌀', oven: '🍳',
}

const SYSTEM_DISPLAY_NAMES: Record<string, string> = {
  roof: 'Roof', siding: 'Siding', gutters: 'Gutters & Trim',
  windows: 'Windows', entry_door: 'Entry Door', sliding_door: 'Sliding Door',
  garage_door: 'Garage Door', foundation: 'Foundation',
  plumbing: 'Plumbing', electrical: 'Electrical Panel',
  hvac: 'HVAC', water_heater: 'Water Heater', sump_pump: 'Sump Pump',
  chimney: 'Chimney / Fireplace',
  deck: 'Deck / Patio', driveway: 'Driveway', fencing: 'Fencing',
  landscaping: 'Landscaping', irrigation: 'Irrigation / Sprinklers',
  septic: 'Septic System', well: 'Well', solar: 'Solar Panels',
  generator: 'Generator', pool: 'Pool / Hot Tub',
  crawl_space: 'Crawl Space', water_softener: 'Water Softener',
  refrigerator: 'Refrigerator', dishwasher: 'Dishwasher',
  washer: 'Washer', dryer: 'Dryer', oven: 'Oven / Range',
}

// Core systems shown to everyone
const CORE_SYSTEMS = [
  'roof','hvac','water_heater','windows','entry_door','sliding_door',
  'garage_door','siding','gutters','deck','driveway','fencing',
  'chimney','sump_pump','plumbing','electrical','foundation',
]
// Situational — shown but easy to mark N/A
const SITUATIONAL_SYSTEMS = [
  'septic','well','solar','generator','pool','crawl_space',
  'water_softener','irrigation','landscaping',
]
// Appliances
const APPLIANCES = ['refrigerator','dishwasher','washer','dryer','oven']

// Keep for backward compat
const ALL_SYSTEMS = CORE_SYSTEMS

const SYSTEM_FIELDS: Record<string, {label:string;type:string;options?:string[]}[]> = {
  roof:[
    {label:'Material',type:'select',options:['3-tab asphalt','Architectural asphalt','Premium architectural','Wood shake','Metal','Clay tile','Concrete tile','Synthetic / composite','TPO / flat','Slate','Unknown']},
    {label:'Install year',type:'year'},{label:'Last inspection',type:'date'},
    {label:'Has skylights',type:'boolean'},{label:'Known issues',type:'text'},
    {label:'Considering replacing',type:'boolean'},
  ],
  siding:[
    {label:'Material',type:'select',options:['Vinyl','Fiber cement','Engineered wood','Wood','Brick','Stucco','Stone veneer','Metal','Unknown']},
    {label:'Install year',type:'year'},{label:'Last inspection',type:'date'},
    {label:'Known issues',type:'text'},{label:'Considering replacing',type:'boolean'},
  ],
  gutters:[
    {label:'Material',type:'select',options:['Aluminum','Vinyl','Steel','Copper / Zinc','Unknown']},
    {label:'Seamless or sectional',type:'select',options:['Seamless','Sectional','Unknown']},
    {label:'Fascia material',type:'select',options:['Wood','Cellular PVC','Composite','Aluminum wrapped','Unknown']},
    {label:'Has gutter guards',type:'boolean'},{label:'Install year',type:'year'},
    {label:'Last cleaning',type:'date'},{label:'Considering replacing',type:'boolean'},
  ],
  windows:[
    {label:'Frame material',type:'select',options:['Vinyl','Wood','Aluminum','Fiberglass','Composite / Clad wood','Unknown']},
    {label:'Glazing type',type:'select',options:['Single pane','Double pane','Triple pane','Unknown']},
    {label:'Install year',type:'year'},{label:'Window count',type:'number'},
    {label:'Has fogged units',type:'boolean'},{label:'Any broken glass',type:'boolean'},
    {label:'Any wood rot',type:'boolean'},{label:'Considering replacing',type:'boolean'},
  ],
  entry_door:[
    {label:'Material',type:'select',options:['Fiberglass','Steel','Wood','Composite','Unknown']},
    {label:'Frame material',type:'select',options:['Wood','Composite','Fiberglass','Unknown']},
    {label:'Quantity',type:'number'},{label:'Has glass lites or sidelites',type:'boolean'},
    {label:'Hardware in working condition',type:'boolean'},{label:'Install year',type:'year'},
    {label:'Considering replacing',type:'boolean'},
  ],
  sliding_door:[
    {label:'Frame material',type:'select',options:['Vinyl','Aluminum','Fiberglass','Wood','Clad wood','Unknown']},
    {label:'Glazing type',type:'select',options:['Single pane','Double pane','Triple pane','Unknown']},
    {label:'Configuration',type:'select',options:['2-panel','3-panel','Unknown']},
    {label:'Locking type',type:'select',options:['Single-point','Multi-point','Unknown']},
    {label:'Quantity',type:'number'},{label:'Has anti lift',type:'boolean'},
    {label:'Hardware in working condition',type:'boolean'},{label:'Install year',type:'year'},
    {label:'Considering replacing',type:'boolean'},
  ],
  hvac:[
    {label:'HVAC system type',type:'select',options:['Gas furnace + central AC','Air source heat pump','Mini split / ductless','Boiler','Other']},
    {label:'Fuel source',type:'select',options:['Gas','Electric','Propane','Oil']},
    {label:'Furnace install year',type:'year'},{label:'AC or heat pump install year',type:'year'},
    {label:'Filter size',type:'text'},{label:'Last filter replacement',type:'date'},
    {label:'Last professional service',type:'date'},{label:'Considering replacing',type:'boolean'},
  ],
  water_heater:[
    {label:'Water heater type',type:'select',options:['Tank (gas)','Tank (electric)','Tankless (gas)','Tankless (electric)','Heat pump / hybrid']},
    {label:'Tank size gallons',type:'number'},{label:'Install year',type:'year'},
    {label:'Has expansion tank',type:'select',options:['Yes','No','Unknown']},
    {label:'Last flush',type:'date'},{label:'Last anode rod inspection',type:'date'},
    {label:'Last TPR valve test',type:'date'},{label:'Considering replacing',type:'boolean'},
  ],
  deck:[
    {label:'Material',type:'select',options:['Pressure treated wood','Cedar','Composite','Hardwood','Concrete','Pavers']},
    {label:'Install year',type:'year'},{label:'Last seal stain',type:'date'},
    {label:'Known issues',type:'text'},{label:'Considering replacing',type:'boolean'},
  ],
  chimney:[
    {label:'Chimney type',type:'select',options:['Wood burning','Gas','Electric','Decorative']},
    {label:'Last sweep',type:'date'},{label:'Last inspection',type:'date'},
    {label:'Considering replacing',type:'boolean'},
  ],
  sump_pump:[
    {label:'Install year',type:'year'},{label:'Has battery backup',type:'boolean'},
    {label:'Last test',type:'date'},{label:'Last battery replacement',type:'date'},
    {label:'Considering replacing',type:'boolean'},
  ],
  driveway:[
    {label:'Material',type:'select',options:['Asphalt','Concrete','Pavers','Gravel','Other']},
    {label:'Install year',type:'year'},{label:'Known issues',type:'text'},
    {label:'Considering replacing',type:'boolean'},
  ],
  fencing:[
    {label:'Material',type:'select',options:['Wood','Vinyl','Aluminum','Chain link','Other']},
    {label:'Install year',type:'year'},{label:'Known issues',type:'text'},
    {label:'Considering replacing',type:'boolean'},
  ],
  landscaping:[
    {label:'Install year',type:'year'},{label:'Notes',type:'text'},
    {label:'Considering replacing',type:'boolean'},
  ],
  refrigerator:[
    {label:'Appliance type',type:'select',options:['Top freezer','Bottom freezer','Side-by-side','French door']},
    {label:'Purchase year',type:'year'},{label:'Has ice maker',type:'boolean'},
    {label:'Has water dispenser',type:'boolean'},{label:'Last condenser coil cleaning',type:'date'},
    {label:'Last water filter replacement',type:'date'},{label:'Considering replacing',type:'boolean'},
  ],
  dishwasher:[
    {label:'Appliance type',type:'select',options:['Built-in','Drawer','Portable']},
    {label:'Purchase year',type:'year'},{label:'Last filter cleaning',type:'date'},
    {label:'Last cleaner cycle',type:'date'},
  ],
  washer:[
    {label:'Appliance type',type:'select',options:['Top load','Front load','Compact','Unknown']},
    {label:'Purchase year',type:'year'},
    {label:'Fuel type',type:'select',options:['Electric','Gas']},
    {label:'Last drum clean',type:'date'},
  ],
  dryer:[
    {label:'Appliance type',type:'select',options:['Electric','Gas','Heat pump','Unknown']},
    {label:'Purchase year',type:'year'},
    {label:'Last vent cleaning',type:'date'},
  ],
  oven:[
    {label:'Appliance type',type:'select',options:['Gas range','Electric range','Induction','Double oven','Wall oven','Unknown']},
    {label:'Purchase year',type:'year'},
    {label:'Has smart features',type:'boolean'},
  ],
  garage_door:[
    {label:'Material',type:'select',options:['Steel','Wood','Aluminum','Fiberglass','Unknown']},
    {label:'Is insulated',type:'boolean'},
    {label:'Door count',type:'number'},
    {label:'Install year',type:'year'},
    {label:'Last service year',type:'date'},
  ],
  foundation:[
    {label:'Foundation type',type:'select',options:['Poured concrete','Block','Slab','Crawl space','Pier and beam','Unknown']},
    {label:'Known issues',type:'text'},
    {label:'Last inspection',type:'date'},
  ],
  plumbing:[
    {label:'Pipe material',type:'select',options:['Copper','PEX','PVC','CPVC','Galvanized steel','Cast iron','Unknown','Mixed']},
    {label:'Install year',type:'year'},
    {label:'Last inspection',type:'date'},
    {label:'Known issues',type:'text'},
  ],
  electrical:[
    {label:'Panel type',type:'select',options:['Standard breaker','Federal Pacific (replace ASAP)','Zinsco (replace ASAP)','Fuse box','Siemens','Square D','Other','Unknown']},
    {label:'Panel amperage',type:'select',options:['60A','100A','150A','200A','400A','Unknown']},
    {label:'Install year',type:'year'},
    {label:'Last inspection',type:'date'},
    {label:'Known issues',type:'text'},
  ],
  septic:[
    {label:'Tank size',type:'select',options:['500 gallons','750 gallons','1,000 gallons','1,250 gallons','1,500 gallons','2,000+ gallons','Unknown']},
    {label:'Septic system type',type:'select',options:['Conventional','Chamber','Drip distribution','Aerobic','Mound','Unknown']},
    {label:'Install year',type:'year'},
    {label:'Last pumped',type:'year'},
    {label:'Last inspection',type:'date'},
  ],
  well:[
    {label:'Install year',type:'year'},
    {label:'Well depth ft',type:'number'},
    {label:'Last water test',type:'date'},
    {label:'Last inspection',type:'date'},
    {label:'Known issues',type:'text'},
  ],
  solar:[
    {label:'Install year',type:'year'},
    {label:'Panel count',type:'number'},
    {label:'Panel kw output',type:'number'},
    {label:'Has battery backup',type:'boolean'},
    {label:'Last inspection',type:'date'},
  ],
  generator:[
    {label:'Fuel type',type:'select',options:['Natural gas','Propane','Gasoline','Diesel','Unknown']},
    {label:'Install year',type:'year'},
    {label:'Panel kw',type:'number'},
    {label:'Last service year',type:'date'},
  ],
  pool:[
    {label:'Pool type',type:'select',options:['In-ground','Above-ground','Hot tub / spa','Combined pool + spa','Unknown']},
    {label:'Material',type:'select',options:['Concrete / gunite','Fiberglass','Vinyl liner','Unknown']},
    {label:'Install year',type:'year'},
    {label:'Has heater',type:'boolean'},
    {label:'Last chemical service',type:'date'},
  ],
  crawl_space:[
    {label:'Type',type:'select',options:['Vented','Encapsulated','Partially encapsulated','Unknown']},
    {label:'Encapsulated',type:'boolean'},
    {label:'Install year',type:'year'},
    {label:'Last inspection',type:'date'},
    {label:'Last vapor barrier',type:'date'},
    {label:'Known issues',type:'text'},
  ],
  water_softener:[
    {label:'Softener type',type:'select',options:['Salt-based ion exchange','Salt-free / conditioner','Magnetic','Dual tank','Unknown']},
    {label:'Install year',type:'year'},
    {label:'Last resin clean',type:'date'},
  ],
  irrigation:[
    {label:'Install year',type:'year'},
    {label:'Coverage sqft',type:'number'},
    {label:'Has smart controller',type:'boolean'},
    {label:'Last inspection',type:'date'},
  ],
}

const DOC_CATEGORIES = [
  {key:'warranty',label:'Warranties',icon:'🛡️',color:'#EAF2EC',textColor:'#3D7A5A'},
  {key:'permit',label:'Permits & Inspections',icon:'📋',color:'#E6F2F8',textColor:'#3A7CA8'},
  {key:'manual',label:'Appliance Manuals',icon:'📖',color:'#FBF0DC',textColor:'#C47B2B'},
  {key:'insurance',label:'Insurance Summary',icon:'🏛️',color:'#F5EAE7',textColor:'#8B3A2A'},
  {key:'invoice',label:'Invoices & Quotes',icon:'🧾',color:'#EAF2EC',textColor:'#3D7A5A'},
  {key:'hoa',label:'HOA Documents',icon:'🏘️',color:'#F0EEF8',textColor:'#5A4A8A'},
  {key:'inspection',label:'Inspection Reports',icon:'🔍',color:'#FBF0DC',textColor:'#C47B2B'},
  {key:'other',label:'Other',icon:'📁',color:'#F5F5F5',textColor:'#8A8A82'},
]
const DOC_SYSTEMS = ['Roof','Siding','Windows','Entry Door','Sliding Door','Gutters & Trim','Deck','Driveway','Fencing','HVAC','Water Heater','Sump Pump','Chimney','Refrigerator','Dishwasher','Whole Home','Other']

const GOALS = [
  {key:'maintain',emoji:'🏡',label:'Maintain and protect'},
  {key:'protect_value',emoji:'🏷️',label:'Prepare to sell'},
  {key:'renovate',emoji:'🔨',label:'Renovate and improve'},
  {key:'new_owner',emoji:'📚',label:'Learn as a new homeowner'},
  {key:'maximize_value',emoji:'📈',label:'Maximize long-term value'},
  {key:'budget',emoji:'💰',label:'Control my maintenance costs'},
]

const FIRST_30_DAYS_CATEGORIES = [
  {key:'safety',label:'Safety First',icon:'🔐',items:[
    {key:'change_locks',title:'Change all locks and garage codes'},
    {key:'locate_shutoffs',title:'Locate and label your electrical panel, main water shutoff, and gas shutoff'},
    {key:'smoke_detectors',title:'Test smoke and CO detectors — replace batteries'},
    {key:'fire_extinguisher',title:"Buy a fire extinguisher if one isn't present"},
    {key:'evacuation_plan',title:'Create a home evacuation plan'},
  ]},
  {key:'utilities',label:'Utilities & Accounts',icon:'💡',items:[
    {key:'transfer_utilities',title:'Transfer all utilities into your name'},
    {key:'auto_payments',title:'Set up automatic payments or note due dates'},
    {key:'forward_mail',title:'Forward mail and update your address with USPS, bank, DMV, and employer'},
  ]},
  {key:'insurance',label:'Insurance & Documents',icon:'📄',items:[
    {key:'review_insurance',title:"Review your homeowner's insurance policy"},
    {key:'home_inventory',title:'Create a home inventory — photos/video of all rooms'},
    {key:'store_documents',title:'Store important documents in a safe place'},
  ]},
  {key:'maintenance',label:'Maintenance Baseline',icon:'🔧',items:[
    {key:'hvac_filter',title:'Change HVAC filters and note the size'},
    {key:'water_heater_check',title:'Locate the water heater and check its age'},
    {key:'dryer_vent',title:'Clean dryer vents'},
    {key:'check_leaks',title:'Check for leaks under sinks, around toilets, and near the water heater'},
    {key:'gfci_test',title:'Test GFCI outlets in kitchens, bathrooms, and garage'},
  ]},
  {key:'know_your_home',label:'Get to Know the Home',icon:'🏠',items:[
    {key:'inspection_report',title:'Re-read your home inspection report and prioritize flagged items'},
    {key:'exterior_walk',title:'Walk the exterior — check gutters, grading, and caulking'},
    {key:'meet_neighbors',title:'Introduce yourself to neighbors'},
    {key:'add_systems',title:'Add all your home systems to Hearth'},
  ]},
  {key:'financial',label:'Financial Setup',icon:'💰',items:[
    {key:'savings_account',title:'Set up a dedicated savings account for home repairs (1–2% of home value annually)'},
    {key:'mortgage_statement',title:'Understand your mortgage statement and confirm your first payment date'},
    {key:'homestead_exemption',title:'Look into homestead exemption with your county — many have deadlines'},
  ]},
  {key:'quick_wins',label:'Quick Wins',icon:'✨',items:[
    {key:'deep_clean',title:'Deep clean before fully moving in if possible'},
    {key:'paint_refresh',title:'Repaint or refresh anything cosmetically bothersome'},
    {key:'inspection_quotes',title:'Get quotes for any issues flagged in the inspection'},
  ]},
]

const COST_DATA: Record<string,{maintain:string;repair:string;emergency:string;valueAtRisk:string}> = {
  roof:{maintain:'$150–400',repair:'$400–1,500',emergency:'$5,000–50,000',valueAtRisk:'$3,000–15,000'},
  hvac:{maintain:'$80–150',repair:'$200–1,200',emergency:'$5,000–12,000',valueAtRisk:'$1,000–4,000'},
  water_heater:{maintain:'$0–100',repair:'$150–500',emergency:'$8,000–15,000',valueAtRisk:'$2,400–5,400'},
  windows:{maintain:'$20–60',repair:'$100–500',emergency:'$1,000–8,000',valueAtRisk:'$1,000–5,000'},
  gutters:{maintain:'$120–200',repair:'$150–600',emergency:'$4,000–12,000',valueAtRisk:'$800–2,000'},
  siding:{maintain:'$100–300',repair:'$300–1,500',emergency:'$3,000–15,000',valueAtRisk:'$2,000–8,000'},
  deck:{maintain:'$200–600',repair:'$300–2,500',emergency:'$500–5,000',valueAtRisk:'$2,000–8,000'},
  sump_pump:{maintain:'$0',repair:'$200–400',emergency:'$10,000–30,000',valueAtRisk:'$1,000–3,000'},
  entry_door:{maintain:'$50–100',repair:'$150–500',emergency:'$500–2,000',valueAtRisk:'$500–2,000'},
  sliding_door:{maintain:'$50–150',repair:'$200–800',emergency:'$500–2,000',valueAtRisk:'$500–2,000'},
  chimney:{maintain:'$150–300',repair:'$500–2,500',emergency:'$2,000–15,000',valueAtRisk:'$1,000–3,000'},
}

const PROJECT_CATEGORIES = [
  {key:'curb_appeal',label:'Curb Appeal',icon:'🌿'},
  {key:'energy',label:'Energy & Efficiency',icon:'⚡'},
  {key:'safety',label:'Safety & Security',icon:'🔒'},
  {key:'comfort',label:'Comfort & Living',icon:'🛋️'},
  {key:'maintenance',label:'Maintenance',icon:'🔧'},
  {key:'value',label:'Value Add',icon:'💰'},
]

const PROJECT_TEMPLATES = [
  {title:'Roof replacement',category:'maintenance',estimatedCost:'$8,000–20,000',roi:'High — buyer priority',bestTiming:'Spring or Fall',guideSlug:'roof'},
  {title:'HVAC replacement',category:'maintenance',estimatedCost:'$6,000–12,000',roi:'High — buyer priority',bestTiming:'Spring before cooling season',guideSlug:'hvac'},
  {title:'New entry door',category:'curb_appeal',estimatedCost:'$1,500–4,000',roi:'High — strong curb appeal ROI',bestTiming:'Any season',guideSlug:'entry-door'},
  {title:'Window replacement',category:'energy',estimatedCost:'$5,000–15,000',roi:'Moderate — comfort + efficiency',bestTiming:'Spring or Fall',guideSlug:'windows'},
  {title:'Deck or patio',category:'value',estimatedCost:'$4,000–20,000',roi:'Moderate — outdoor living value',bestTiming:'Spring',guideSlug:'deck'},
  {title:'Siding replacement',category:'curb_appeal',estimatedCost:'$8,000–20,000',roi:'High — major visual impact',bestTiming:'Late Spring or Summer',guideSlug:'siding'},
  {title:'Gutter replacement',category:'maintenance',estimatedCost:'$1,500–3,500',roi:'Moderate — protects foundation',bestTiming:'Fall',guideSlug:'gutters'},
  {title:'Landscaping refresh',category:'curb_appeal',estimatedCost:'$2,000–10,000',roi:'Moderate — first impressions',bestTiming:'Spring',guideSlug:null},
  {title:'Driveway reseal or replace',category:'curb_appeal',estimatedCost:'$500–8,000',roi:'Moderate — curb appeal',bestTiming:'Late Spring or Summer',guideSlug:null},
  {title:'Bathroom remodel',category:'value',estimatedCost:'$8,000–25,000',roi:'High — strong resale ROI',bestTiming:'Any season',guideSlug:null},
  {title:'Kitchen refresh',category:'value',estimatedCost:'$5,000–40,000',roi:'High — #1 resale driver',bestTiming:'Any season',guideSlug:null},
  {title:'Smart home upgrades',category:'safety',estimatedCost:'$500–3,000',roi:'Low–Moderate',bestTiming:'Any season',guideSlug:null},
]

const MAINTENANCE_SCHEDULE: Record<string,{month:number;task:string;urgency:'high'|'medium'|'low'}[]> = {
  roof:[{month:3,task:'Spring inspection — check for winter damage',urgency:'medium'},{month:9,task:'Fall inspection before storm season',urgency:'medium'}],
  hvac:[{month:3,task:'AC tune-up / filter change before cooling season',urgency:'high'},{month:9,task:'Furnace tune-up before heating season',urgency:'high'},{month:6,task:'Replace air filter',urgency:'medium'},{month:12,task:'Replace air filter',urgency:'medium'}],
  water_heater:[{month:4,task:'Flush sediment and test TPR valve',urgency:'medium'}],
  gutters:[{month:4,task:'Clean gutters and check for damage after winter',urgency:'high'},{month:10,task:'Clean gutters before winter — remove leaves',urgency:'high'}],
  deck:[{month:5,task:'Inspect for rot, loose boards, and seal if needed',urgency:'medium'}],
  chimney:[{month:9,task:'Annual chimney sweep before heating season',urgency:'high'}],
  sump_pump:[{month:3,task:'Test sump pump before spring rains',urgency:'high'},{month:9,task:'Test battery backup before storm season',urgency:'medium'}],
  windows:[{month:10,task:'Check caulking and weatherstripping before winter',urgency:'medium'}],
  entry_door:[{month:10,task:'Check weatherstripping and door sweep',urgency:'low'}],
  driveway:[{month:5,task:'Inspect for cracks and seal if needed',urgency:'low'}],
  landscaping:[{month:4,task:'Spring cleanup and mulch refresh',urgency:'low'},{month:10,task:'Fall cleanup and winterize irrigation',urgency:'low'}],
  refrigerator:[{month:3,task:'Clean condenser coils',urgency:'low'},{month:9,task:'Replace water filter',urgency:'low'}],
  dishwasher:[{month:6,task:'Clean filter and run cleaner cycle',urgency:'low'}],
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getCondition(sys: any) {
  if (sys.not_applicable) return {label:'N/A',color:'#8A8A82',bg:'#F5F5F5',textColor:'#8A8A82'}
  // Use saved condition if set, otherwise calculate
  const saved=sys.condition
  if(saved&&saved!=='unknown'){
    const labelMap:Record<string,string>={'good':'Good','fair':'Fair','poor':'Poor','critical':'Critical','watch':'Fair','inspect':'Poor','priority':'Critical'}
    const label=labelMap[saved]||''
    if(label==='Good')return{label:'Good',color:'#3D7A5A',bg:'#EAF2EC',textColor:'#27500A'}
    if(label==='Fair')return{label:'Fair',color:'#C47B2B',bg:'#FBF0DC',textColor:'#633806'}
    if(label==='Poor')return{label:'Poor',color:'#E24B4A',bg:'#FDECEA',textColor:'#791F1F'}
    if(label==='Critical')return{label:'Critical',color:'#791F1F',bg:'#FCEBEB',textColor:'#501313'}
    return{label:'',color:'#8A8A82',bg:'transparent',textColor:'#8A8A82'}
  }
  // No saved condition
  return{label:'',color:'#8A8A82',bg:'transparent',textColor:'#8A8A82'}
}

function getDeferredLiability(systems: any[]): number {
  // Costs represent realistic replacement/repair costs buyers would flag at inspection
  const costs: Record<string,number> = {
    roof: 12000,
    hvac: 7000,
    water_heater: 1500,
    windows: 6000,
    deck_patio: 8000,      // fixed: was 'deck', system_type is 'deck_patio'
    siding: 12000,
    entry_door: 2000,
    sliding_door: 2500,
    gutters_trim: 2000,    // fixed: was 'gutters', system_type is 'gutters_trim'
    driveway: 4000,
    fencing: 3000,
    chimney: 2000,
    sump_pump: 800,
    plumbing: 8000,        // added: partial replumb, major buyer flag
    electrical: 6000,      // added: panel upgrade, major buyer flag
    refrigerator: 1200,    // added: appliance replacement
    dishwasher: 800,       // added: appliance replacement
  }
  let total = 0
  for (const sys of systems) {
    if (sys.not_applicable) continue
    const yr = sys.replacement_year || sys.install_year
    if (!yr) continue
    const sysType = sys.system_type?.toLowerCase().replace(/ \/ /g,'_').replace(/ /g,'_').replace(/&/g,'').replace(/__/g,'_').replace(/^_|_$/g,'')
    const cost = costs[sysType]
    if (!cost) continue
    const pct = (new Date().getFullYear() - yr) / (SYSTEM_LIFESPANS[sys.system_type] || 20)
    if (pct > 1.0) total += cost
    else if (pct > 0.8) total += cost * 0.3
  }
  return Math.round(total)
}

function getThisMonthTasks(systems: any[]): {title:string;urgency:string}[] {
  const tasks: {title:string;urgency:string}[] = []
  const m = new Date().getMonth()
  const critical = systems.filter(s => ['Poor','Critical'].includes(getCondition(s).label))
  if (critical.length > 0) tasks.push({title:`Get your ${SYSTEM_DISPLAY_NAMES[critical[0].system_type]||critical[0].system_type} assessed`,urgency:'high'})
  if (m>=2&&m<=4) tasks.push({title:'Clean gutters after winter',urgency:'medium'},{title:'Schedule HVAC tune-up before cooling season',urgency:'medium'})
  if (m>=8&&m<=10) tasks.push({title:'Clean gutters before winter',urgency:'high'},{title:'Service heating system',urgency:'high'})
  if (m===11||m<=1) tasks.push({title:'Check pipes in unheated spaces',urgency:'high'})
  if (m>=5&&m<=7) tasks.push({title:'Check AC performance and replace filters',urgency:'low'})
  return tasks.slice(0,3)
}

function getSmartTasks(systems: any[], _score: any, weather: any): any[] {
  const tasks: any[] = []
  const m = new Date().getMonth()
  if (weather?.recentStorm) {
    const age = Date.now() - new Date(weather.recentStorm.date).getTime()
    if (age > 0 && age < 21*24*60*60*1000) tasks.push({id:'storm-event',title:`Walk your property after the ${weather.recentStorm.label.toLowerCase()}`,description:`Recorded ${new Date(weather.recentStorm.date).toLocaleDateString('en-US',{month:'long',day:'numeric'})}. Document with photos before calling anyone.`,source:'smart',urgency:'high'})
  }
  const critical = systems.filter(s=>['Poor','Critical'].includes(getCondition(s).label)).sort((a,b)=>(getCondition(a).label==='Critical'?0:1)-(getCondition(b).label==='Critical'?0:1))
  if (critical.length>0) {
    const sys=critical[0]
    tasks.push({id:`age-${sys.id}`,title:`Get your ${SYSTEM_DISPLAY_NAMES[sys.system_type]||sys.system_type} assessed`,description:`Approaching or past expected lifespan. Get a quote before it becomes an emergency.`,source:'smart',urgency:getCondition(sys).label==='Critical'?'high':getCondition(sys).label==='Poor'?'high':'medium'})
  }
  if (m>=2&&m<=4) tasks.push({id:'spring-1',title:'Clean gutters and check drainage',description:'Remove winter debris and ensure downspouts direct water away from your foundation.',source:'seasonal',urgency:'medium'},{id:'spring-2',title:'Schedule HVAC tune-up before summer',description:'Change filters and have the system checked before the cooling season starts.',source:'seasonal',urgency:'medium'})
  if (m>=8&&m<=10) tasks.push({id:'fall-1',title:'Clean gutters before winter',description:'Leaves and debris cause ice dams and water damage.',source:'seasonal',urgency:'medium'},{id:'fall-2',title:'Service heating system',description:'Schedule a furnace or heat pump tune-up before cold weather arrives.',source:'seasonal',urgency:'high'})
  if (m===11||m<=1) tasks.push({id:'winter-1',title:'Check pipes in unheated spaces',description:'Insulate exposed pipes in basement, garage, and crawl spaces.',source:'seasonal',urgency:'high'})
  if (m>=5&&m<=7) tasks.push({id:'summer-1',title:'Check AC performance and filters',description:'Test cooling efficiency and replace filters if needed before peak heat.',source:'seasonal',urgency:'low'})
  return tasks.slice(0,4)
}

function getCommunityLevel(pts: number) {
  if (pts>=1000) return {label:'Community Champion',emoji:'🏆',next:null as string|null,nextPoints:null as number|null}
  if (pts>=500) return {label:'Neighborhood Expert',emoji:'🌟',next:'Community Champion' as string|null,nextPoints:1000 as number|null}
  if (pts>=200) return {label:'Active Homeowner',emoji:'🏡',next:'Neighborhood Expert' as string|null,nextPoints:500 as number|null}
  return {label:'New Homeowner',emoji:'🌱',next:'Active Homeowner' as string|null,nextPoints:200 as number|null}
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function ProjectsTab({homeId,userId}:{homeId:string;userId:string}) {
  const [projects,setProjects]=useState<any[]>([])
  const [showAddForm,setShowAddForm]=useState(false)
  const [newTitle,setNewTitle]=useState('')
  const [newCategory,setNewCategory]=useState('maintenance')
  const [newBudget,setNewBudget]=useState('')
  const [newNotes,setNewNotes]=useState('')
  const [newPriority,setNewPriority]=useState('medium')
  const [newTimeline,setNewTimeline]=useState('within_2_years')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [editEdits,setEditEdits]=useState<any>({})
  const [saving,setSaving]=useState(false)
  const [filterCat,setFilterCat]=useState('all')
  const [showTemplates,setShowTemplates]=useState(false)
  const [financeOpenId,setFinanceOpenId]=useState<string|null>(null)
  const [financeMode,setFinanceMode]=useState<Record<string,string>>({})
  const [financeType,setFinanceType]=useState<Record<string,string>>({})
  const [financePromoTerm,setFinancePromoTerm]=useState<Record<string,number>>({})
  const [financeRate,setFinanceRate]=useState<Record<string,number>>({})
  const [financeTerm,setFinanceTerm]=useState<Record<string,number>>({})
  const [financeCustomRate,setFinanceCustomRate]=useState<Record<string,string>>({})
  const [financeCustomTerm,setFinanceCustomTerm]=useState<Record<string,string>>({})
  const [financeRemaining,setFinanceRemaining]=useState<Record<string,string>>({})

  // Known cost averages per project type (midpoint of typical range)
  const COST_AVERAGES: Record<string,{low:number;high:number;label:string}> = {
    'roof replacement':        {low:8000,  high:20000, label:'$8,000–20,000'},
    'roof':                    {low:8000,  high:20000, label:'$8,000–20,000'},
    'hvac replacement':        {low:6000,  high:12000, label:'$6,000–12,000'},
    'hvac':                    {low:6000,  high:12000, label:'$6,000–12,000'},
    'entry door':              {low:1500,  high:4000,  label:'$1,500–4,000'},
    'window replacement':      {low:5000,  high:15000, label:'$5,000–15,000'},
    'windows':                 {low:5000,  high:15000, label:'$5,000–15,000'},
    'deck':                    {low:4000,  high:20000, label:'$4,000–20,000'},
    'deck or patio':           {low:4000,  high:20000, label:'$4,000–20,000'},
    'siding replacement':      {low:8000,  high:20000, label:'$8,000–20,000'},
    'siding':                  {low:8000,  high:20000, label:'$8,000–20,000'},
    'gutter replacement':      {low:1500,  high:3500,  label:'$1,500–3,500'},
    'gutters':                 {low:1500,  high:3500,  label:'$1,500–3,500'},
    'landscaping':             {low:2000,  high:10000, label:'$2,000–10,000'},
    'driveway':                {low:500,   high:8000,  label:'$500–8,000'},
    'bathroom remodel':        {low:8000,  high:25000, label:'$8,000–25,000'},
    'kitchen':                 {low:5000,  high:40000, label:'$5,000–40,000'},
    'generator':               {low:7000,  high:15000, label:'$7,000–15,000'},
    'fence':                   {low:3000,  high:10000, label:'$3,000–10,000'},
    'fencing':                 {low:3000,  high:10000, label:'$3,000–10,000'},
    'water heater':            {low:800,   high:2000,  label:'$800–2,000'},
    'paint':                   {low:2000,  high:6000,  label:'$2,000–6,000'},
    'chimney':                 {low:1000,  high:5000,  label:'$1,000–5,000'},
  }

  const getKnownAverage=(title:string)=>{
    const t=title.toLowerCase()
    for(const key of Object.keys(COST_AVERAGES)){
      if(t.includes(key))return COST_AVERAGES[key]
    }
    return null
  }

  const parseBudget=(val:string):number|null=>{
    if(!val)return null
    const clean=val.replace(/[$,]/g,'')
    const parts=clean.split(/[–-]/).map((s:string)=>parseInt(s.trim())).filter((n:number)=>!isNaN(n)&&n>0)
    if(parts.length>=2)return Math.round((parts[0]+parts[parts.length-1])/2)
    if(parts.length===1)return parts[0]
    return null
  }

  const formatDollars=(n:number)=>'$'+n.toLocaleString()

  useEffect(()=>{
    if(!homeId)return
    supabase.from('home_projects').select('*').eq('home_id',homeId).order('created_at',{ascending:false}).then(({data})=>setProjects(data||[]))
  },[homeId])

  const addProject=async(title?:string,category?:string,estimatedCost?:string)=>{
    const t=title||newTitle;if(!t.trim())return
    setSaving(true)
    const budgetRaw=newBudget||estimatedCost||''
    const budgetNum=parseBudget(budgetRaw)
    const {data,error}=await supabase.from('home_projects').insert({home_id:homeId,created_by:userId,title:t.trim(),category:category||newCategory,estimated_cost:budgetNum?String(budgetNum):null,notes:newNotes||null,priority:newPriority,timeline:newTimeline,status:'wishlist'}).select().single()
    if(error){console.error('addProject:',error);alert('Could not save project: '+error.message);setSaving(false);return}
    if(data)setProjects((prev:any[])=>[data,...prev])
    setNewTitle('');setNewCategory('maintenance');setNewBudget('');setNewNotes('');setNewPriority('medium');setNewTimeline('within_2_years');setShowAddForm(false);setShowTemplates(false);setSaving(false)
  }

  const startEdit=(p:any)=>{setEditingId(p.id);setEditEdits({title:p.title,category:p.category,estimated_cost:p.estimated_cost||'',notes:p.notes||'',priority:p.priority||'medium',timeline:p.timeline||'within_2_years',status:p.status||'wishlist'})}

  const saveEdit=async()=>{
    if(!editingId)return;setSaving(true)
    const {title,category,notes,priority,status,timeline}=editEdits
    const budgetNum=parseBudget(editEdits.estimated_cost||'')
    const {data,error}=await supabase.from('home_projects').update({title,category,estimated_cost:budgetNum?String(budgetNum):null,notes:notes||null,priority,status,timeline}).eq('id',editingId).select().single()
    if(error){console.error('saveEdit:',error);alert('Could not save: '+error.message);setSaving(false);return}
    if(data)setProjects((prev:any[])=>prev.map(p=>p.id===editingId?data:p))
    setEditingId(null);setSaving(false)
  }

  const deleteProject=async(id:string)=>{
    if(!window.confirm('Remove this project?'))return
    await supabase.from('home_projects').delete().eq('id',id)
    setProjects((prev:any[])=>prev.filter(p=>p.id!==id))
  }

  const updateStatus=async(id:string,status:string)=>{
    await supabase.from('home_projects').update({status}).eq('id',id)
    setProjects((prev:any[])=>prev.map(p=>p.id===id?{...p,status}:p))
  }

  const getBestTiming=(title:string,category:string)=>{
    const t=title.toLowerCase()
    if(t.includes('deck'))return{when:'April – May',reason:'Contractors less busy, better rates'}
    if(t.includes('roof'))return{when:'Spring or Fall',reason:'Best contractor availability'}
    if(t.includes('hvac')||t.includes('furnace'))return{when:'Spring or Fall',reason:'Off-peak season rates'}
    if(t.includes('gutter'))return{when:'Fall',reason:'Before leaves and winter'}
    if(t.includes('window'))return{when:'Spring or Fall',reason:'Mild weather for installation'}
    if(t.includes('generator'))return{when:'Fall',reason:'Before storm season'}
    if(t.includes('siding'))return{when:'Late Spring or Summer',reason:'Dry conditions required'}
    if(t.includes('fence')||t.includes('fencing'))return{when:'Spring or Fall',reason:'Ground workable, contractors available'}
    if(t.includes('driveway'))return{when:'Late Spring or Summer',reason:'Asphalt needs warm temps'}
    if(t.includes('paint'))return{when:'Late Spring or Summer',reason:'Dry conditions required'}
    if(category==='energy')return{when:'Spring',reason:'Maximize summer savings'}
    return{when:'Spring or Fall',reason:'Best contractor availability'}
  }

  const getSavingsGoal=(budgetStr:string|null,timeline:string,knownAvg:{low:number;high:number}|null)=>{
    const months=timeline==='within_1_year'?12:timeline==='within_2_years'?24:timeline==='3_5_years'?48:60
    const label=timeline==='within_1_year'?'1 year':timeline==='within_2_years'?'2 years':timeline==='3_5_years'?'3–5 years':'someday'
    const budget=parseBudget(budgetStr||'')
    if(budget){
      const mo=Math.round(budget/months)
      return{monthly:formatDollars(mo)+' / mo',readyIn:'Ready in '+label+' at this rate',target:budget}
    }
    if(knownAvg){
      const mid=Math.round((knownAvg.low+knownAvg.high)/2)
      const mo=Math.round(mid/months)
      return{monthly:formatDollars(mo)+' / mo',readyIn:'Based on '+formatDollars(mid)+' avg · Ready in '+label,target:mid}
    }
    return null
  }

  const getGuideLinks=(title:string):{label:string;slug:string}[]=>{
    const t=title.toLowerCase()
    if(t.includes('deck'))return[{label:'📖 How to choose deck materials',slug:'deck'},{label:'💡 Composite vs wood: full comparison',slug:'deck'},{label:'🔑 Questions to ask your contractor',slug:'deck'},{label:'📋 Permit requirements',slug:'deck'},{label:'🏠 How decks affect home value',slug:'deck'}]
    if(t.includes('roof'))return[{label:'📖 Roof material guide',slug:'roof'},{label:'🔑 Questions to ask your roofer',slug:'roof'},{label:'💡 Signs you need a new roof',slug:'roof'},{label:'🏠 Roof ROI at sale',slug:'roof'}]
    if(t.includes('hvac')||t.includes('furnace'))return[{label:'📖 HVAC buying guide',slug:'hvac'},{label:'💡 Heat pump vs furnace',slug:'hvac'},{label:'🔑 Questions to ask your HVAC tech',slug:'hvac'}]
    if(t.includes('window'))return[{label:'📖 Window buying guide',slug:'windows'},{label:'💡 Single vs double vs triple pane',slug:'windows'},{label:'🔑 Window installation questions',slug:'windows'}]
    if(t.includes('siding'))return[{label:'📖 Siding material guide',slug:'siding'},{label:'💡 Fiber cement vs vinyl',slug:'siding'},{label:'🏠 Siding ROI at sale',slug:'siding'}]
    if(t.includes('gutter'))return[{label:'📖 Gutter material guide',slug:'gutters'},{label:'💡 Do you need gutter guards?',slug:'gutters'}]
    if(t.includes('door'))return[{label:'📖 Entry door guide',slug:'entry-door'},{label:'💡 Fiberglass vs steel vs wood',slug:'entry-door'}]
    if(t.includes('fence')||t.includes('fencing'))return[{label:'📖 Fencing material guide',slug:''},{label:'💡 Wood vs vinyl vs aluminum',slug:''}]
    return[{label:'📖 Browse all guides',slug:''}]
  }

  const iS:React.CSSProperties={width:'100%',padding:'7px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'6px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none',background:'#fff',color:'#1A1A18',boxSizing:'border-box'}
  const filtered=filterCat==='all'?projects:projects.filter(p=>p.category===filterCat)

  return(
    <div>
      {/* Header */}
      <div style={{background:'#1E3A2F',borderRadius:'16px',padding:'24px 28px',marginBottom:'24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px'}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'24px',fontWeight:400,color:'#F8F4EE',marginBottom:'6px'}}>Your Project Wish List</h2>
          <p style={{fontSize:'13px',color:'rgba(248,244,238,0.6)',lineHeight:1.6}}>Add projects you are planning — Hearth will show you costs, best timing, neighbor prices, and guides to help you prepare.</p>
        </div>
        <button onClick={()=>setShowAddForm(!showAddForm)} style={{background:'#C47B2B',color:'#fff',border:'none',padding:'11px 22px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0,whiteSpace:'nowrap'}}>+ Add project</button>
      </div>

      {/* Add form */}
      {showAddForm&&(
        <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'22px',marginBottom:'20px'}}>
          <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F',marginBottom:'16px'}}>Add a project</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div style={{gridColumn:'1/-1'}}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Project name *</label><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={iS} placeholder="e.g. Deck replacement, Fence, Kitchen renovation"/></div>
            <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Category</label><select value={newCategory} onChange={e=>setNewCategory(e.target.value)} style={iS}>{PROJECT_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
            <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Timeline</label><select value={newTimeline} onChange={e=>setNewTimeline(e.target.value)} style={iS}><option value="within_1_year">Within 1 year</option><option value="within_2_years">Within 2 years</option><option value="3_5_years">3–5 years</option><option value="someday">Someday</option></select></div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Budget in mind? (optional)</label>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#8A8A82'}}>$</span>
                <input type="number" value={newBudget} onChange={e=>setNewBudget(e.target.value)} style={{...iS,paddingLeft:'22px'}} placeholder="e.g. 15000"/>
              </div>
              {newBudget&&parseBudget(newBudget)&&<div style={{fontSize:'11px',color:'#3D7A5A',marginTop:'4px'}}>= {formatDollars(parseBudget(newBudget)!)}</div>}
              {!newBudget&&newTitle&&getKnownAverage(newTitle)&&<div style={{fontSize:'11px',color:'#8A8A82',marginTop:'4px'}}>No budget? We will use the typical range: {getKnownAverage(newTitle)!.label}</div>}
            </div>
            <div style={{gridColumn:'1/-1'}}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Notes (optional)</label><input value={newNotes} onChange={e=>setNewNotes(e.target.value)} style={iS} placeholder="Material preference, inspiration, anything else"/></div>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            <button onClick={()=>addProject()} disabled={saving||!newTitle.trim()} style={{flex:2,background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'10px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",opacity:saving||!newTitle.trim()?0.6:1}}>{saving?'Saving...':'Add to wish list'}</button>
            <button onClick={()=>setShowAddForm(false)} style={{flex:1,background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'10px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Browse ideas toggle */}
      {!showAddForm&&<div style={{marginBottom:'20px'}}><button onClick={()=>setShowTemplates(!showTemplates)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'8px 16px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>{showTemplates?'▲ Hide ideas':'▼ Browse common projects'}</button></div>}

      {/* Templates grid */}
      {showTemplates&&(
        <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'22px',marginBottom:'20px'}}>
          <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F',marginBottom:'16px'}}>Common home projects</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'12px'}}>
            {PROJECT_TEMPLATES.map(tpl=>(<div key={tpl.title} style={{border:'1px solid rgba(30,58,47,0.11)',borderRadius:'12px',padding:'14px',background:'#F8F4EE'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}><span style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F',flex:1}}>{tpl.title}</span><button onClick={()=>addProject(tpl.title,tpl.category,tpl.estimatedCost)} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'4px 10px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0,marginLeft:'8px'}}>+ Add</button></div><div style={{display:'grid',gap:'3px',fontSize:'11px',color:'#8A8A82'}}><div>💰 {tpl.estimatedCost}</div><div>📈 {tpl.roi}</div><div>📅 {tpl.bestTiming}</div></div>{tpl.guideSlug&&<a href={'/guides/'+tpl.guideSlug} style={{display:'inline-block',marginTop:'8px',fontSize:'11px',color:'#3D7A5A',fontWeight:500}}>Read the guide →</a>}</div>))}
          </div>
        </div>
      )}

      {/* Category filter */}
      {projects.length>0&&(
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
          <button onClick={()=>setFilterCat('all')} style={{padding:'6px 14px',borderRadius:'20px',fontSize:'12px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:filterCat==='all'?'#1E3A2F':'#fff',color:filterCat==='all'?'#F8F4EE':'#1E3A2F',outline:'1px solid rgba(30,58,47,0.15)'}}>All ({projects.length})</button>
          {PROJECT_CATEGORIES.filter(c=>projects.some(p=>p.category===c.key)).map(cat=>(<button key={cat.key} onClick={()=>setFilterCat(cat.key)} style={{padding:'6px 14px',borderRadius:'20px',fontSize:'12px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:filterCat===cat.key?'#1E3A2F':'#fff',color:filterCat===cat.key?'#F8F4EE':'#1E3A2F',outline:'1px solid rgba(30,58,47,0.15)'}}>{cat.icon} {cat.label}</button>))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length===0&&!showAddForm&&!showTemplates&&(
        <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'48px',textAlign:'center'}}>
          <div style={{fontSize:'44px',marginBottom:'14px'}}>✨</div>
          <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'20px',fontWeight:400,color:'#1E3A2F',marginBottom:'8px'}}>No projects yet</h3>
          <p style={{fontSize:'13px',color:'#8A8A82',lineHeight:1.7,maxWidth:'360px',margin:'0 auto 20px'}}>Add projects you want to tackle — Hearth will show you neighbor pricing, best timing, and guides.</p>
          <button onClick={()=>setShowTemplates(true)} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'11px 22px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Browse project ideas</button>
        </div>
      )}

      {/* Project cards */}
      <div style={{display:'grid',gap:'16px'}}>
        {filtered.map(p=>{
          const cat=PROJECT_CATEGORIES.find(c=>c.key===p.category)
          const isEditing=editingId===p.id
          const timing=getBestTiming(p.title,p.category)
          const knownAvg=getKnownAverage(p.title)
          const savings=getSavingsGoal(p.estimated_cost,p.timeline||'within_2_years',knownAvg)
          const guides=getGuideLinks(p.title)
          const budget=parseBudget(p.estimated_cost||'')
          const neighborAvg=knownAvg?Math.round((knownAvg.low+knownAvg.high)/2):null
          const timelineLabel=(p.timeline||'within_2_years').replace('within_1_year','Within 1 year').replace('within_2_years','Within 2 years').replace('3_5_years','3–5 years').replace('someday','Someday')
          const catRoi=cat?.key==='value'?'High resale ROI':cat?.key==='maintenance'?'Protects home value':cat?.key==='energy'?'Lowers utility bills':cat?.key==='curb_appeal'?'Strong curb appeal ROI':'Good long-term investment'
          const finAmt=budget||neighborAvg||0
          const finLowestFixed=finAmt>0?(()=>{const mr=11.99/100/12,n=120;return Math.round(finAmt*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1))})():0
          const finLowestPromo=finAmt>0?Math.round(finAmt/24):0
          const finStartingAt=finAmt>0?Math.min(finLowestFixed,finLowestPromo):0

          // Budget vs neighbor comparison
          const budgetDiff=budget&&neighborAvg?budget-neighborAvg:null
          const budgetVsNeighbor=budgetDiff!==null?(budgetDiff>0?{label:'$'+Math.abs(budgetDiff).toLocaleString()+' above neighbor avg',color:'#9B2C2C'}:budgetDiff<0?{label:'$'+Math.abs(budgetDiff).toLocaleString()+' below neighbor avg — may need to adjust',color:'#C47B2B'}:{label:'Right at neighbor avg',color:'#3D7A5A'}):null

          return(
            <div key={p.id} style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden'}}>

              {/* Card header */}
              <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:'14px',flex:1}}>
                  <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'#F8F4EE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{cat?.icon||'📋'}</div>
                  <div style={{flex:1}}>
                    {isEditing?<input value={editEdits.title} onChange={e=>setEditEdits((prev:any)=>({...prev,title:e.target.value}))} style={{...iS,fontSize:'16px',fontWeight:500,marginBottom:'8px'}}/>:<div style={{fontSize:'18px',fontWeight:600,color:'#1E3A2F',marginBottom:'4px'}}>{p.title}</div>}
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                      <span style={{fontSize:'11px',fontWeight:500,padding:'3px 10px',borderRadius:'20px',background:'#F8F4EE',color:'#1E3A2F',border:'1px solid rgba(30,58,47,0.15)'}}>{timelineLabel}</span>
                      <span style={{fontSize:'12px',color:'#8A8A82'}}>Added {new Date(p.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})}{p.notes?' · '+p.notes:''}</span>
                    </div>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  {budget?<div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',fontWeight:600,color:'#1E3A2F',marginBottom:'2px'}}>{formatDollars(budget)}</div>:knownAvg?<div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:500,color:'#8A8A82',marginBottom:'2px'}}>{knownAvg.label} typical</div>:null}
                  <div style={{fontSize:'12px',color:'#3D7A5A',fontWeight:500}}>↑ {catRoi}</div>
                </div>
              </div>

              {/* Stats row */}
              {!isEditing&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(30,58,47,0.06)'}}>
                  {/* Neighbors paid */}
                  <div style={{background:'#F8F4EE',padding:'14px 18px'}}>
                    <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'#8A8A82',marginBottom:'6px'}}>Neighbors Paid</div>
                    {neighborAvg?(
                      <>
                        <div style={{fontSize:'16px',fontWeight:600,color:'#1E3A2F',marginBottom:'2px'}}>{formatDollars(neighborAvg)} avg</div>
                        <div style={{fontSize:'11px',color:'#8A8A82'}}>{knownAvg!.label} typical range</div>
                        {budgetVsNeighbor&&budget&&<div style={{fontSize:'11px',color:budgetVsNeighbor.color,marginTop:'4px',fontWeight:500}}>{budgetVsNeighbor.label}</div>}
                      </>
                    ):(
                      <><div style={{fontSize:'14px',color:'#8A8A82',marginBottom:'2px'}}>No data yet</div><a href="/neighbors" style={{fontSize:'11px',color:'#3D7A5A',textDecoration:'none'}}>View jobs in your ZIP →</a></>
                    )}
                  </div>
                  {/* Best time */}
                  <div style={{background:'#F8F4EE',padding:'14px 18px'}}>
                    <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'#8A8A82',marginBottom:'6px'}}>Best Time to Hire</div>
                    <div style={{fontSize:'16px',fontWeight:600,color:'#1E3A2F',marginBottom:'2px'}}>{timing.when}</div>
                    <div style={{fontSize:'11px',color:'#8A8A82'}}>{timing.reason}</div>
                  </div>
                  {/* How to pay for it */}
                  <div style={{background:'#F8F4EE',padding:'14px 18px'}}>
                    <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'#8A8A82',marginBottom:'8px'}}>How to pay for it</div>
                    <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
                      <button onClick={()=>{const fm={...financeMode};fm[p.id]='save';setFinanceMode(fm);setFinanceOpenId(null)}} style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:(financeMode[p.id]||'save')==='save'?'#1E3A2F':'rgba(30,58,47,0.08)',color:(financeMode[p.id]||'save')==='save'?'#F8F4EE':'#1E3A2F',fontWeight:500}}>Save for it</button>
                      <button onClick={()=>{const fm={...financeMode};fm[p.id]='finance';setFinanceMode(fm);setFinanceOpenId(p.id)}} style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:financeMode[p.id]==='finance'?'#1E3A2F':'rgba(30,58,47,0.08)',color:financeMode[p.id]==='finance'?'#F8F4EE':'#1E3A2F',fontWeight:500}}>Finance it</button>
                    </div>
                    {(financeMode[p.id]||'save')==='save'?(
                      savings?(<><div style={{fontSize:'16px',fontWeight:600,color:'#1E3A2F',marginBottom:'2px'}}>{savings.monthly}</div><div style={{fontSize:'11px',color:'#8A8A82'}}>{savings.readyIn}</div></>):<div style={{fontSize:'12px',color:'#8A8A82'}}>Add a budget or timeline</div>
                    ):(
                      finStartingAt>0?(
                        <div style={{cursor:'pointer'}} onClick={()=>setFinanceOpenId(financeOpenId===p.id?null:p.id)}>
                          <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'2px'}}>Starting at</div>
                          <div style={{fontSize:'16px',fontWeight:600,color:'#1E3A2F',marginBottom:'2px'}}>${finStartingAt.toLocaleString()} / mo</div>
                          <div style={{fontSize:'11px',color:'#3D7A5A'}}>See all financing options ↓</div>
                        </div>
                      ):(
                        <div style={{fontSize:'12px',color:'#1E3A2F',fontWeight:500,cursor:'pointer'}} onClick={()=>setFinanceOpenId(financeOpenId===p.id?null:p.id)}>See financing options ↓</div>
                      )
                    )}
                  </div>
                </div>
              )}


              {/* Financing panel */}
              {financeOpenId===p.id&&!isEditing&&(
                <div style={{padding:'20px 24px',borderTop:'1px solid rgba(30,58,47,0.06)',background:'#FAFAF8'}}>
                  <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F',marginBottom:'3px'}}>Contractor financing explorer</div>
                  <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'14px'}}>Model real financing structures — adjust to match what your contractor offers</div>

                  {/* Cost inputs */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                    <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Project cost</label><input type="number" defaultValue={budget||neighborAvg||''} onChange={e=>{}} id={`fc-cost-${p.id}`} style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none'}} placeholder="e.g. 14000" /></div>
                    <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Down payment (optional)</label><input type="number" id={`fc-down-${p.id}`} style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none'}} placeholder="0" /></div>
                  </div>

                  {/* Type toggle */}
                  <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
                    <button onClick={()=>{const ft={...financePromoTerm};ft[p.id]=ft[p.id]||12;setFinancePromoTerm(ft);const ftype={...financeType};ftype[p.id+'-sub']='promo';setFinanceType(ftype)}} style={{padding:'5px 12px',borderRadius:'20px',fontSize:'12px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:(financeType[p.id+'-sub']||'promo')==='promo'?'#1E3A2F':'rgba(30,58,47,0.08)',color:(financeType[p.id+'-sub']||'promo')==='promo'?'#F8F4EE':'#1E3A2F',fontWeight:500}}>Promotional 0%</button>
                    <button onClick={()=>{const ftype={...financeType};ftype[p.id+'-sub']='fixed';setFinanceType(ftype)}} style={{padding:'5px 12px',borderRadius:'20px',fontSize:'12px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:financeType[p.id+'-sub']==='fixed'?'#1E3A2F':'rgba(30,58,47,0.08)',color:financeType[p.id+'-sub']==='fixed'?'#F8F4EE':'#1E3A2F',fontWeight:500}}>Fixed APR</button>
                  </div>

                  {/* Promo plans */}
                  {(financeType[p.id+'-sub']||'promo')==='promo'&&(<>
                    <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'8px',lineHeight:1.5}}>No interest if paid in full during the promotional period. Equal payments below show what you need to pay monthly to clear the balance before the period ends.</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',marginBottom:'12px'}}>
                      {[12,18,24].map(term=>{
                        const cost=parseFloat((document.getElementById(`fc-cost-${p.id}`) as HTMLInputElement)?.value||String(budget||neighborAvg||0))||0
                        const down=parseFloat((document.getElementById(`fc-down-${p.id}`) as HTMLInputElement)?.value||'0')||0
                        const fin=Math.max(0,cost-down)
                        const pmt=fin>0?Math.round(fin/term):0
                        const sel=(financePromoTerm[p.id]||12)===term
                        return(<button key={term} onClick={()=>{const ft={...financePromoTerm};ft[p.id]=term;setFinancePromoTerm(ft)}} style={{padding:'10px 8px',borderRadius:'8px',fontSize:'12px',border:sel?'1.5px solid #1E3A2F':'0.5px solid rgba(30,58,47,0.2)',background:sel?'#F0F5F2':'#fff',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left'}}>
                          <div style={{fontWeight:500,color:'#1E3A2F',marginBottom:'2px'}}>{term} months</div>
                          <div style={{fontSize:'11px',color:'#8A8A82'}}>0% promo</div>
                          {pmt>0&&<div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F',marginTop:'4px'}}>${pmt.toLocaleString()}/mo</div>}
                          {pmt>0&&<div style={{fontSize:'10px',color:'#3D7A5A',marginTop:'1px'}}>to pay off in full</div>}
                        </button>)
                      })}
                    </div>
                    <div style={{padding:'10px 12px',background:'#FAEEDA',borderRadius:'8px',borderLeft:'3px solid #C47B2B',borderTopLeftRadius:0,borderBottomLeftRadius:0,fontSize:'11px',color:'#633806',lineHeight:1.6,marginBottom:'10px'}}>
                      <strong style={{color:'#412402'}}>How deferred interest works:</strong> If any balance remains when the promo period ends, interest at 17.99–26.99% is charged retroactively on the <em>original financed amount</em> — not just what is left. Even $1 remaining triggers the full charge. Set a calendar reminder 60 days before the promo ends.
                    </div>
                  </>)}

                  {/* Fixed plans */}
                  {financeType[p.id+'-sub']==='fixed'&&(<>
                    <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'8px',lineHeight:1.5}}>Fixed rate for the full loan term — interest is built into your payment from day one. Common plans from major contractor financing partners.</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'10px'}}>
                      {[{rate:5.99,term:60,factor:3.0},{rate:7.99,term:84,factor:2.0},{rate:9.99,term:120,factor:1.3},{rate:11.99,term:120,factor:1.3}].map(plan=>{
                        const cost=parseFloat((document.getElementById(`fc-cost-${p.id}`) as HTMLInputElement)?.value||String(budget||neighborAvg||0))||0
                        const down=parseFloat((document.getElementById(`fc-down-${p.id}`) as HTMLInputElement)?.value||'0')||0
                        const fin=Math.max(0,cost-down)
                        const mr=plan.rate/100/12, n=plan.term
                        const pmt=fin>0?Math.round(fin*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1)):0
                        const total=pmt*n, interest=total-fin
                        const sel=financeRate[p.id]===plan.rate&&financeTerm[p.id]===plan.term
                        return(<button key={plan.rate} onClick={()=>{const fr={...financeRate};fr[p.id]=plan.rate;setFinanceRate(fr);const ft={...financeTerm};ft[p.id]=plan.term;setFinanceTerm(ft)}} style={{padding:'10px 12px',borderRadius:'8px',fontSize:'12px',border:sel?'1.5px solid #1E3A2F':'0.5px solid rgba(30,58,47,0.2)',background:sel?'#F0F5F2':'#fff',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left'}}>
                          <div style={{fontWeight:500,color:'#1E3A2F',marginBottom:'2px'}}>{plan.rate}% APR · {plan.term} mo</div>
                          <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'4px'}}>{plan.factor}% payment factor</div>
                          {pmt>0&&<div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>${pmt.toLocaleString()}/mo</div>}
                          {interest>0&&pmt>0&&<div style={{fontSize:'10px',color:'#9B2C2C',marginTop:'1px'}}>${Math.round(interest).toLocaleString()} interest total</div>}
                        </button>)
                      })}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                      <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Custom APR %</label><input type="number" value={financeCustomRate[p.id]||''} onChange={e=>{const fr={...financeCustomRate};fr[p.id]=e.target.value;setFinanceCustomRate(fr)}} style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none'}} placeholder="e.g. 8.49" /></div>
                      <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Custom term (months)</label><input type="number" value={financeCustomTerm[p.id]||''} onChange={e=>{const ft={...financeCustomTerm};ft[p.id]=e.target.value;setFinanceCustomTerm(ft)}} style={{width:'100%',padding:'7px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none'}} placeholder="e.g. 60" /></div>
                    </div>
                    {financeCustomRate[p.id]&&financeCustomTerm[p.id]&&(()=>{
                      const cost=parseFloat((document.getElementById(`fc-cost-${p.id}`) as HTMLInputElement)?.value||String(budget||neighborAvg||0))||0
                      const down=parseFloat((document.getElementById(`fc-down-${p.id}`) as HTMLInputElement)?.value||'0')||0
                      const fin=Math.max(0,cost-down)
                      const mr=parseFloat(financeCustomRate[p.id])/100/12
                      const n=parseInt(financeCustomTerm[p.id])
                      const pmt=fin>0&&mr>0&&n>0?Math.round(fin*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1)):0
                      const total=pmt*n, interest=total-fin
                      return pmt>0?(<div style={{padding:'10px 12px',background:'#F0F5F2',borderRadius:'8px',marginBottom:'10px'}}><span style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>${pmt.toLocaleString()}/mo</span><span style={{fontSize:'11px',color:'#9B2C2C',marginLeft:'10px'}}>${Math.round(interest).toLocaleString()} interest total</span></div>):null
                    })()}
                  </>)}

                  {/* What to know */}
                  <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'#8A8A82',margin:'12px 0 8px'}}>What to know</div>
                  <div style={{fontSize:'11px',color:'#4A4A44',lineHeight:1.7}}>
                    <div style={{padding:'4px 0',borderBottom:'0.5px solid rgba(30,58,47,0.08)'}}>Common lender partners: GreenSky, Synchrony Home, Mosaic, Service Finance Company</div>
                    <div style={{padding:'4px 0',borderBottom:'0.5px solid rgba(30,58,47,0.08)'}}>Credit 630–680+: typically qualifies for higher-rate plans · 690–700+: first-look lenders, lower APR plans</div>
                    <div style={{padding:'4px 0',borderBottom:'0.5px solid rgba(30,58,47,0.08)'}}>Approval is usually instant in the home from established contractors · soft pull first, hard pull on approval · you can also apply directly through lender websites</div>
                    <div style={{padding:'4px 0',borderBottom:'0.5px solid rgba(30,58,47,0.08)'}}>Payment factor: monthly payment per $1,000 borrowed · 1–4% is the common range</div>
                    <div style={{padding:'4px 0'}}>Ask about financing during the quote — not at signing · most fixed APR plans allow early payoff with no penalty</div>
                  </div>
                  <div style={{marginTop:'10px',fontSize:'10px',color:'#8A8A82',lineHeight:1.6}}>Estimates are educational only. Actual rates, terms, and approval depend on your credit profile and the contractor's financing partner. Always read the full loan agreement before signing.</div>
                </div>
              )}
              {/* Edit form */}
              {isEditing&&(
                <div style={{padding:'16px 24px',background:'#F8F4EE',borderTop:'1px solid rgba(30,58,47,0.06)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                    <div><select value={editEdits.category} onChange={e=>setEditEdits((prev:any)=>({...prev,category:e.target.value}))} style={iS}>{PROJECT_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
                    <div><select value={editEdits.timeline||'within_2_years'} onChange={e=>setEditEdits((prev:any)=>({...prev,timeline:e.target.value}))} style={iS}><option value="within_1_year">Within 1 year</option><option value="within_2_years">Within 2 years</option><option value="3_5_years">3–5 years</option><option value="someday">Someday</option></select></div>
                    <div><select value={editEdits.status||'wishlist'} onChange={e=>setEditEdits((prev:any)=>({...prev,status:e.target.value}))} style={iS}><option value="wishlist">Wish list</option><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div>
                    <div>
                      <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Budget in mind?</label>
                      <div style={{position:'relative'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#8A8A82'}}>$</span><input type="number" value={editEdits.estimated_cost||''} onChange={e=>setEditEdits((prev:any)=>({...prev,estimated_cost:e.target.value}))} style={{...iS,paddingLeft:'22px'}} placeholder="e.g. 15000"/></div>
                    </div>
                    <div style={{gridColumn:'1/-1'}}><input value={editEdits.notes||''} onChange={e=>setEditEdits((prev:any)=>({...prev,notes:e.target.value}))} style={iS} placeholder="Notes, material preferences..."/></div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button onClick={saveEdit} disabled={saving} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'8px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>{saving?'Saving...':'Save'}</button>
                    <button onClick={()=>setEditingId(null)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'8px 14px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Guide chips + status */}
              {!isEditing&&(
                <div style={{padding:'14px 24px',borderTop:'1px solid rgba(30,58,47,0.06)'}}>
                  <div style={{fontSize:'10px',fontWeight:600,letterSpacing:'1px',textTransform:'uppercase',color:'#8A8A82',marginBottom:'10px'}}>Educational Guides</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'14px'}}>
                    {guides.map(g=>(<a key={g.label} href={g.slug?'/guides/'+g.slug:'/guides'} style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#F8F4EE',border:'1px solid rgba(30,58,47,0.12)',padding:'6px 14px',borderRadius:'20px',fontSize:'12px',color:'#1E3A2F',textDecoration:'none',fontFamily:"'DM Sans', sans-serif"}}>{g.label}</a>))}
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
                    <div style={{display:'flex',gap:'6px'}}>
                      {['wishlist','planning','in_progress','done'].map(s=>(<button key={s} onClick={()=>updateStatus(p.id,s)} style={{padding:'4px 10px',borderRadius:'20px',fontSize:'11px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:p.status===s?'#1E3A2F':'rgba(30,58,47,0.07)',color:p.status===s?'#F8F4EE':'#8A8A82',fontWeight:p.status===s?500:400}}>{s.replace('_',' ')}</button>))}
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={()=>startEdit(p)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'5px 12px',borderRadius:'7px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Edit</button>
                      <button onClick={()=>deleteProject(p.id)} style={{background:'none',border:'1px solid rgba(155,44,44,0.2)',color:'#9B2C2C',padding:'5px 12px',borderRadius:'7px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MaintenanceTab({systems,home,jobs,onTabChange,userId,onJobsRefresh}:{systems:any[];home:any;jobs:any[];onTabChange:(tab:string)=>void;userId:string;onJobsRefresh:()=>void}) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const [loggedTasks,setLoggedTasks]=useState<Set<string>>(new Set())
  const [logDoneModal,setLogDoneModal]=useState<{task:string;systemType:string;systemIcon:string;month:number}|null>(null)
  const [ldCompany,setLdCompany]=useState('')
  const [ldDate,setLdDate]=useState(new Date().toISOString().split('T')[0])
  const [ldCost,setLdCost]=useState('')
  const [ldNotes,setLdNotes]=useState('')
  const [ldSaving,setLdSaving]=useState(false)

  const handleLogDone = async (task: {task:string;systemType:string;systemIcon:string;month:number}, saveToLog: boolean) => {
    const tk = `${task.systemType}-${task.month}-${task.task}`
    if (saveToLog && home?.id && userId) {
      setLdSaving(true)
      await supabase.from('home_activity').insert({
        home_id: home.id,
        user_id: userId,
        system_type: task.systemType,
        job_type: 'maintenance',
        company_name: ldCompany || null,
        description: task.task + (ldNotes ? ' — ' + ldNotes : ''),
        job_date: ldDate || new Date().toISOString().split('T')[0],
        final_price: ldCost ? parseFloat(ldCost) : null,
        source: 'calendar',
      })
      onJobsRefresh()
      setLdSaving(false)
    }
    setLoggedTasks(prev=>{const n=new Set(prev);n.add(tk);return n})
    setLogDoneModal(null)
    setLdCompany(''); setLdDate(new Date().toISOString().split('T')[0]); setLdCost(''); setLdNotes('')
  }
  const systemTypes = systems.filter(s=>!s.not_applicable).map(s=>s.system_type)

  const allTasks: {month:number;task:string;urgency:'high'|'medium'|'low';systemType:string;systemIcon:string}[] = []
  for (const st of systemTypes) {
    const sched = MAINTENANCE_SCHEDULE[st]
    if (!sched) continue
    const icon = SYSTEM_ICONS[st]||'🔧'
    for (const item of sched) allTasks.push({...item,systemType:st,systemIcon:icon})
  }

  const thisMonthTasks = allTasks.filter(t=>t.month-1===currentMonth)
  const overdueTasks = allTasks.filter(t=>t.month-1<currentMonth&&t.urgency==='high')

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
        <div><h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',fontWeight:400,color:'#1E3A2F',marginBottom:'4px'}}>Maintenance Calendar</h2><p style={{fontSize:'13px',color:'#8A8A82'}}>Personalized for your {systemTypes.length} active system{systemTypes.length!==1?'s':''}</p></div>
        
      </div>

      {overdueTasks.filter(t=>!loggedTasks.has(`${t.systemType}-${t.month}-${t.task}`)).length>0&&(
        <div style={{background:'#FDECEA',border:'1px solid rgba(139,58,42,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'20px'}}>
          <h4 style={{fontSize:'14px',fontWeight:500,color:'#9B2C2C',marginBottom:'10px'}}>⚠️ Overdue from earlier this year</h4>
          <div style={{display:'grid',gap:'8px'}}>
            {overdueTasks.filter(t=>!loggedTasks.has(`${t.systemType}-${t.month}-${t.task}`)).map(task=>{
              const tk=`${task.systemType}-${task.month}-${task.task}`
              return(
                <div key={tk} style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'18px'}}>{task.systemIcon}</span>
                    <div><div style={{fontSize:'13px',color:'#1A1A18'}}>{task.task}</div><div style={{fontSize:'11px',color:'#8A8A82'}}>Was due: {MONTH_NAMES[task.month-1]}</div></div>
                  </div>
                  <button onClick={()=>setLogDoneModal(task)} style={{background:'#9B2C2C',color:'#fff',border:'none',padding:'5px 12px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0}}>Log done</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{background:'#1E3A2F',borderRadius:'16px',padding:'20px 24px',marginBottom:'24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
          <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',color:'#F8F4EE',fontWeight:400}}>{MONTH_NAMES[currentMonth]} {currentYear}</h3>
          <span style={{fontSize:'12px',color:'rgba(248,244,238,0.5)'}}>{thisMonthTasks.length} task{thisMonthTasks.length!==1?'s':''}</span>
        </div>
        {thisMonthTasks.length===0?(
          <div style={{fontSize:'13px',color:'rgba(248,244,238,0.5)',textAlign:'center',padding:'12px 0'}}>No scheduled maintenance this month.</div>
        ):thisMonthTasks.map(task=>{
          const tk=`${task.systemType}-${task.month}-${task.task}`
          const isDone=loggedTasks.has(tk)
          return(
            <div key={tk} style={{display:'flex',alignItems:'center',gap:'12px',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(248,244,238,0.08)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <span style={{fontSize:'20px'}}>{task.systemIcon}</span>
                <div>
                  <div style={{fontSize:'13px',color:isDone?'rgba(248,244,238,0.4)':'#F8F4EE',textDecoration:isDone?'line-through':'none'}}>{task.task}</div>
                  <span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'10px',background:task.urgency==='high'?'rgba(229,115,115,0.2)':task.urgency==='medium'?'rgba(196,123,43,0.2)':'rgba(106,175,138,0.2)',color:task.urgency==='high'?'#E57373':task.urgency==='medium'?'#C47B2B':'#6AAF8A'}}>{task.urgency}</span>
                </div>
              </div>
              {isDone?<span style={{fontSize:'12px',color:'#6AAF8A',flexShrink:0}}>✓ Done</span>:<button onClick={()=>setLogDoneModal(task)} style={{background:'rgba(248,244,238,0.1)',border:'1px solid rgba(248,244,238,0.2)',color:'#F8F4EE',padding:'5px 12px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0}}>Log done</button>}
            </div>
          )
        })}
      </div>

      <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F',marginBottom:'16px'}}>Full Year Schedule</h3>
      <div style={{display:'grid',gap:'12px'}}>
        {MONTH_NAMES.map((monthName,mi)=>{
          const monthTasks=allTasks.filter(t=>t.month-1===mi)
          const isPast=mi<currentMonth
          const isCurrent=mi===currentMonth
          return(
            <div key={monthName} style={{background:'#fff',border:`1px solid ${isCurrent?'#1E3A2F':'rgba(30,58,47,0.11)'}`,borderLeft:isCurrent?'4px solid #C47B2B':'4px solid transparent',borderRadius:'12px',overflow:'hidden'}}>
              <div style={{padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',background:isCurrent?'#F0F5F2':isPast&&monthTasks.length>0?'#F8F4EE':'#fff'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'13px',fontWeight:isCurrent?600:500,color:isCurrent?'#1E3A2F':isPast?'#8A8A82':'#1E3A2F'}}>{monthName}</span>
                  {isCurrent&&<span style={{fontSize:'10px',background:'#C47B2B',color:'#fff',padding:'2px 8px',borderRadius:'10px',fontWeight:500}}>This month</span>}
                </div>
                <span style={{fontSize:'12px',color:'#8A8A82'}}>{monthTasks.length} task{monthTasks.length!==1?'s':''}</span>
              </div>
              {monthTasks.length>0&&(
                <div style={{padding:'8px 18px 12px',borderTop:'1px solid rgba(30,58,47,0.06)'}}>
                  {monthTasks.map((task,ti)=>{
                    const tk=`${task.systemType}-${task.month}-${task.task}`
                    const isDone=loggedTasks.has(tk)||(isPast&&jobs.some(j=>j.system_type===task.systemType&&j.job_date&&new Date(j.job_date).getMonth()===mi&&new Date(j.job_date).getFullYear()===currentYear))
                    return(
                      <div key={ti} style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'space-between',padding:'7px 0',borderBottom:ti<monthTasks.length-1?'1px solid rgba(30,58,47,0.05)':'none'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span style={{fontSize:'16px'}}>{task.systemIcon}</span>
                          <span style={{fontSize:'12px',color:isDone?'#8A8A82':'#1A1A18',textDecoration:isDone?'line-through':'none'}}>{task.task}</span>
                          <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'10px',flexShrink:0,background:task.urgency==='high'?'#FDECEA':task.urgency==='medium'?'#FBF0DC':'#EAF2EC',color:task.urgency==='high'?'#9B2C2C':task.urgency==='medium'?'#7A4A10':'#3D7A5A'}}>{task.urgency}</span>
                        </div>
                        {isDone?<span style={{fontSize:'11px',color:'#3D7A5A',flexShrink:0}}>✓</span>:!isPast?<button onClick={()=>setLogDoneModal(task)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'3px 8px',borderRadius:'5px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0}}>Log done</button>:null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {systemTypes.length===0&&(
        <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'40px',textAlign:'center',marginTop:'20px'}}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>📅</div>
          <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'20px',fontWeight:400,color:'#1E3A2F',marginBottom:'8px'}}>Add your systems to get a schedule</h3>
          <p style={{fontSize:'13px',color:'#8A8A82',marginBottom:'16px',lineHeight:1.7}}>Your maintenance calendar is personalized based on the systems you have.</p>
          <button onClick={()=>onTabChange('home_details')} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'10px 22px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Add home systems</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [user,setUser]=useState<any>(null)
  const [allHomes,setAllHomes]=useState<any[]>([])
  const [home,setHome]=useState<any>(null)
  const [details,setDetails]=useState<any>(null)
  const [systems,setSystems]=useState<any[]>([])
  const [jobs,setJobs]=useState<any[]>([])
  const [score,setScore]=useState<any>(null)
  const [tasks,setTasks]=useState<any[]>([])
  const [docs,setDocs]=useState<any[]>([])
  const [communityScore,setCommunityScore]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [activeTab,setActiveTab]=useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#','')
      const valid = ['overview','home_details','log','financial','projects','maintenance','documents']
      if (valid.includes(hash)) return hash
    }
    return 'overview'
  })
  // Sync tab to URL hash
  _useEffectHash(() => {
    window.location.hash = activeTab
  }, [activeTab])
  _useEffectHash(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#','')
      const valid = ['overview','home_details','log','financial','projects','maintenance','documents']
      if (valid.includes(hash)) setActiveTab(hash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const [saving,setSaving]=useState(false)
  const [deletingAccount,setDeletingAccount]=useState(false)
  const [displayName,setDisplayName]=useState('')
  const [homeownerType,setHomeownerType]=useState('')
  const [userGoals,setUserGoals]=useState<string[]>([])
  const [weather,setWeather]=useState<any>(null)
  const [weatherLoading,setWeatherLoading]=useState(true)
  const [showStormHistory,setShowStormHistory]=useState(false)
  const [stormHistory,setStormHistory]=useState<any[]>([])
  const [showAddTask,setShowAddTask]=useState(false)
  const [newTaskTitle,setNewTaskTitle]=useState('')
  const [newTaskDesc,setNewTaskDesc]=useState('')
  const [newTaskDue,setNewTaskDue]=useState('')
  const [dismissedSmartTasks,setDismissedSmartTasks]=useState<string[]>([])
  const [propertyMenuOpen,setPropertyMenuOpen]=useState<string|null>(null)
  const [showClaimedModal,setShowClaimedModal]=useState(false)
  const [showHistoryModal,setShowHistoryModal]=useState(false)
  const [editingGoals,setEditingGoals]=useState(false)
  const [draftGoals,setDraftGoals]=useState<Set<string>>(new Set())
  const [completedChecklist,setCompletedChecklist]=useState<string[]>([])
  const [showFullChecklist,setShowFullChecklist]=useState(false)
  const [expandedChecklistCats,setExpandedChecklistCats]=useState<Set<string>>(new Set(['safety']))
  const [homeEdits,setHomeEdits]=useState<any>({})
  const [editingHomeSection,setEditingHomeSection]=useState<string|null>(null)
  const [savedSection,setSavedSection]=useState<string|null>(null)
  const [expandedSections,setExpandedSections]=useState<Set<string>>(new Set(['about']))
  const [systemModal,setSystemModal]=useState<any|null>(null)
  const [wishlistToast,setWishlistToast]=useState<string|null>(null)
  const [envData,setEnvData]=useState<any>(null)
  const [envLoading,setEnvLoading]=useState(false)
  const [crops,setCrops]=useState<any[]>([])
  const [showAddCrop,setShowAddCrop]=useState(false)
  const [newCrop,setNewCrop]=useState<any>({name:'',crop_type:'vegetable',location:'',date_planted:'',water_interval_days:'',fertilize_interval_days:'',notes:''})
  const [showGardenLog,setShowGardenLog]=useState<string|null>(null)
  const [gardenLogType,setGardenLogType]=useState('watered')
  const [gardenLogNotes,setGardenLogNotes]=useState('')
  const [wishlistSyncModal,setWishlistSyncModal]=useState<{sysName:string;projectId:string;type:'in_service'|'scheduled'}|null>(null)
  const [savedSystemId,setSavedSystemId]=useState<string|null>(null)
  const [systemEdits,setSystemEdits]=useState<any>({})
  const [showHiddenSystems,setShowHiddenSystems]=useState(false)
  const [showUploadForm,setShowUploadForm]=useState(false)
  const [uploadFile,setUploadFile]=useState<File|null>(null)
  const [uploadName,setUploadName]=useState('')
  const [uploadDesc,setUploadDesc]=useState('')
  const [uploadCategory,setUploadCategory]=useState('other')
  const [uploadSystem,setUploadSystem]=useState('')
  const [uploadExpires,setUploadExpires]=useState('')
  const [uploading,setUploading]=useState(false)
  const [uploadError,setUploadError]=useState('')
  const [docFilter,setDocFilter]=useState('all')
  const [homeMembers,setHomeMembers]=useState<any[]>([])
  const [homeInvites,setHomeInvites]=useState<any[]>([])
  const [showInviteForm,setShowInviteForm]=useState(false)
  const [inviteEmail,setInviteEmail]=useState('')
  const [inviteFirstName,setInviteFirstName]=useState('')
  const [inviteLastName,setInviteLastName]=useState('')
  const [inviteRole,setInviteRole]=useState('co_owner')
  const [inviteSending,setInviteSending]=useState(false)
  const [inviteSent,setInviteSent]=useState(false)
  const [showAssignMenu,setShowAssignMenu]=useState<string|null>(null)
  const fileInputRef=useRef<HTMLInputElement>(null)

  const iS:React.CSSProperties={width:'100%',padding:'7px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'6px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none',background:'#fff',color:'#1A1A18',boxSizing:'border-box'}

  const loadHomeData=async(homeId:string)=>{
    const [{data:det},{data:sys},{data:j},{data:sc},{data:tk},{data:dc},{data:hm},{data:hi}]=await Promise.all([
      supabase.from('home_details').select('*').eq('home_id',homeId).single(),
      supabase.from('home_systems').select('*').eq('home_id',homeId),
      supabase.from('home_activity').select('*').eq('home_id',homeId).order('created_at',{ascending:false}),
      supabase.from('health_scores').select('*').eq('home_id',homeId).order('calculated_at',{ascending:false}).limit(1),
      supabase.from('home_tasks').select('*').eq('home_id',homeId).order('created_at',{ascending:false}),
      supabase.from('home_documents').select('*').eq('home_id',homeId).order('created_at',{ascending:false}),
      supabase.from('home_members').select('*').eq('home_id',homeId).eq('status','approved'),
      supabase.from('home_invites').select('*').eq('home_id',homeId).eq('status','pending').order('created_at',{ascending:false})
    ])
    setDetails(det);setSystems(sys||[]);setJobs(j||[])
    const {data:cr}=await supabase.from('garden_crops').select('*').eq('home_id',homeId).eq('archived',false).order('date_planted',{ascending:false})
    if(cr)setCrops(cr)
    if(sc&&sc.length>0)setScore(sc[0])
    setTasks(tk||[])
    setDismissedSmartTasks((tk||[]).filter((t:any)=>t.status==='dismissed').map((t:any)=>t.title))
    setDocs(dc||[])
    setHomeMembers(hm||[])
    setHomeInvites(hi||[])
    setHomeMembers(hm||[])
    const {data:zd}=await supabase.from('homes').select('zip').eq('id',homeId).single()
    if(zd?.zip){const {data:st}=await supabase.from('storm_events').select('*').eq('zip',zd.zip).order('event_date',{ascending:false}).limit(20);setStormHistory(st||[])}
  }

  useEffect(()=>{
    const load=async()=>{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){window.location.href='/login';return}
      setUser(user)
      const {data:prof}=await supabase.from('user_profiles').select('first_name,last_name,homeowner_type,homeowner_goal').eq('user_id',user.id).single()
      if(prof?.first_name)setDisplayName(prof.first_name.charAt(0).toUpperCase()+prof.first_name.slice(1))
      if(prof?.homeowner_type)setHomeownerType(prof.homeowner_type)
      if(prof?.homeowner_goal)setUserGoals(prof.homeowner_goal)
      const {data:cl}=await supabase.from('homeowner_checklist').select('item_key').eq('user_id',user.id).eq('completed',true)
      setCompletedChecklist((cl||[]).map((c:any)=>c.item_key))
      const {data:homes}=await supabase.from('homes').select('*').eq('user_id',user.id).order('is_primary',{ascending:false}).order('created_at',{ascending:false})
      if(homes&&homes.length>0){
        setAllHomes(homes)
        const ph=homes.find((h:any)=>h.is_primary)||homes[0]
        setHome(ph)
        if(ph.city||ph.zip){fetch(`/api/weather?city=${encodeURIComponent(ph.city||'')}&state=${encodeURIComponent(ph.state||'')}&zip=${encodeURIComponent(ph.zip||'')}`).then(r=>r.json()).then(d=>{if(!d.error)setWeather(d)}).finally(()=>setWeatherLoading(false))}else{setWeatherLoading(false)}
        await loadHomeData(ph.id)
        fetchEnvironmentData(ph)
        await supabase.rpc('recalculate_community_score',{p_user_id:user.id})
        const {data:cs}=await supabase.from('community_scores').select('*').eq('user_id',user.id).single()
        if(cs)setCommunityScore(cs)
        if(typeof window!=='undefined'&&window.location.search.includes('claimed=true')){setShowClaimedModal(true);window.history.replaceState({},'','/dashboard')}
      }else{window.location.replace('/onboarding');return}
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
    if(!loading&&(homeownerType==='first_time'||homeownerType==='new_to_home')&&jobs.length>0){
      const seen=localStorage.getItem('hearth_history_modal_seen')
      if(!seen){setShowHistoryModal(true);localStorage.setItem('hearth_history_modal_seen','true')}
    }
  },[loading,homeownerType,jobs.length])

  const addCrop=async()=>{
    if(!newCrop.name.trim())return
    const payload:any={home_id:home.id,user_id:user.id,...newCrop}
    if(payload.water_interval_days)payload.water_interval_days=parseInt(payload.water_interval_days)
    else delete payload.water_interval_days
    if(payload.fertilize_interval_days)payload.fertilize_interval_days=parseInt(payload.fertilize_interval_days)
    else delete payload.fertilize_interval_days
    // Auto-calculate expected harvest from zone frost dates + crop type
    if(payload.date_planted&&envData?.frost_date_last_spring){
      const planted=new Date(payload.date_planted)
      const vegDays:Record<string,number>={tomatoes:75,peppers:80,cucumbers:55,squash:50,beans:55,lettuce:45,spinach:40,kale:55,broccoli:60,carrots:70,peas:60,basil:30,eggplant:75}
      const lower=payload.name.toLowerCase()
      const days=Object.entries(vegDays).find(([k])=>lower.includes(k))?.[1]||70
      const harvestStart=new Date(planted);harvestStart.setDate(harvestStart.getDate()+days)
      const harvestEnd=new Date(harvestStart);harvestEnd.setDate(harvestEnd.getDate()+21)
      payload.expected_harvest_start=harvestStart.toISOString().split('T')[0]
      payload.expected_harvest_end=harvestEnd.toISOString().split('T')[0]
    }
    const {data}=await supabase.from('garden_crops').insert(payload).select().single()
    if(data){
      setCrops(prev=>[data,...prev])
      setShowAddCrop(false)
      setNewCrop({name:'',crop_type:'vegetable',location:'',date_planted:'',water_interval_days:'',fertilize_interval_days:'',notes:''})
      // Add watering reminder task if interval set
      if(data.water_interval_days){
        const dueDate=new Date();dueDate.setDate(dueDate.getDate()+data.water_interval_days)
        await supabase.from('home_tasks').insert({home_id:home.id,created_by:user.id,title:`Water ${data.name}`,source:'garden',source_type:'garden',crop_id:data.id,status:'todo',due_date:dueDate.toISOString().split('T')[0]})
      }
    }
  }

  const logGardenActivity=async(cropId:string,cropName:string)=>{
    await supabase.from('garden_activity').insert({crop_id:cropId,home_id:home.id,user_id:user.id,activity_type:gardenLogType,notes:gardenLogNotes||null})
    // Update crop stage
    if(gardenLogType==='harvested'){
      await supabase.from('garden_crops').update({stage:'harvested'}).eq('id',cropId)
      setCrops(prev=>prev.map(c=>c.id===cropId?{...c,stage:'harvested'}:c))
    }
    // Log to home_activity feed
    await supabase.from('home_activity').insert({home_id:home.id,user_id:user.id,job_type:'garden',title:`${gardenLogType.charAt(0).toUpperCase()+gardenLogType.slice(1)} ${cropName}`,notes:gardenLogNotes||null,job_date:new Date().toISOString().split('T')[0]})
    // Schedule next watering task if watered
    if(gardenLogType==='watered'){
      const crop=crops.find(c=>c.id===cropId)
      if(crop?.water_interval_days){
        const dueDate=new Date();dueDate.setDate(dueDate.getDate()+crop.water_interval_days)
        await supabase.from('home_tasks').insert({home_id:home.id,created_by:user.id,title:`Water ${cropName}`,source:'garden',source_type:'garden',crop_id:cropId,status:'todo',due_date:dueDate.toISOString().split('T')[0]})
      }
    }
    setShowGardenLog(null)
    setGardenLogNotes('')
  }

  const archiveCrop=async(cropId:string)=>{
    await supabase.from('garden_crops').update({archived:true}).eq('id',cropId)
    setCrops(prev=>prev.filter(c=>c.id!==cropId))
  }

  const fetchEnvironmentData=async(homeObj:any)=>{
    if(!homeObj?.zip&&!homeObj?.state)return
    setEnvLoading(true)
    try{
      const params=new URLSearchParams({
        zip:homeObj.zip||'',
        state:homeObj.state||'',
        lat:homeObj.lat||'',
        lng:homeObj.lng||'',
        year_built:String(homeObj.year_built||''),
      })
      const res=await fetch(`/api/environment?${params}`)
      const data=await res.json()
      if(!data.error){
        setEnvData(data)
        const update={
          climate_zone:data.climate_zone,
          hardiness_zone:data.hardiness_zone,
          frost_date_last_spring:data.frost_date_last_spring,
          frost_date_first_fall:data.frost_date_first_fall,
          freeze_risk_days:data.freeze_risk_days,
          radon_zone:data.radon_zone,
          flood_zone:data.flood_zone,
          hail_frequency:data.hail_frequency,
          lead_paint_risk:data.lead_paint_risk,
          asbestos_risk:data.asbestos_risk,
          soil_type:data.soil_type,
          avg_precipitation:data.avg_precipitation,
          avg_uv_index:data.avg_uv_index,
          solar_potential_kwh:data.solar_potential_kwh,
          avg_utility_electric:data.avg_utility_electric,
          avg_utility_gas:data.avg_utility_gas,
          earthquake_risk:data.earthquake_risk,
        }
        await supabase.from('home_details').update(update).eq('home_id',homeObj.id)
      }
    }catch(e){console.error('env fetch:',e)}
    setEnvLoading(false)
  }

  const switchHome=async(h:any)=>{
    setHome(h);setSystems([]);setJobs([]);setTasks([]);setScore(null);setDetails(null);setDocs([]);setWeather(null);setWeatherLoading(true);setLoading(true);setStormHistory([])
    if(h.city||h.zip){fetch(`/api/weather?city=${encodeURIComponent(h.city||'')}&state=${encodeURIComponent(h.state||'')}&zip=${encodeURIComponent(h.zip||'')}`).then(r=>r.json()).then(d=>{if(!d.error)setWeather(d)}).finally(()=>setWeatherLoading(false))}else{setWeatherLoading(false)}
    await loadHomeData(h.id);setLoading(false)
  }
  const setPrimaryHome=async(homeId:string)=>{await supabase.from('homes').update({is_primary:false}).eq('user_id',user.id);await supabase.from('homes').update({is_primary:true}).eq('id',homeId);setAllHomes((p:any[])=>p.map(h=>({...h,is_primary:h.id===homeId})));setPropertyMenuOpen(null)}
  const markForTransfer=async(homeId:string)=>{await supabase.from('homes').update({status:'for_transfer'}).eq('id',homeId);setAllHomes((p:any[])=>p.map(h=>h.id===homeId?{...h,status:'for_transfer'}:h));setPropertyMenuOpen(null)}
  const recalculateScore=async()=>{if(!home?.id)return;await supabase.rpc('recalculate_health_score',{p_home_id:home.id});const {data}=await supabase.from('health_scores').select('*').eq('home_id',home.id).order('calculated_at',{ascending:false}).limit(1);if(data&&data.length>0)setScore(data[0])}

  const startEditSection=(section:string)=>{
    setHomeEdits({address:home?.address||'',city:home?.city||'',state:home?.state||'',zip:home?.zip||'',year_built:home?.year_built||'',home_type:details?.home_type||home?.home_type||'',sqft:details?.sqft||home?.sqft||'',bedrooms:details?.bedrooms||'',bathrooms:details?.bathrooms||'',stories:details?.stories||'',lot_size:details?.lot_size||'',foundation_type:details?.foundation_type||'',garage:details?.garage||'',has_fireplace:details?.has_fireplace||false,has_sump_pump:details?.has_sump_pump||false,has_pool:details?.has_pool||false,has_solar:details?.has_solar||false,has_septic:details?.has_septic||false,has_well_water:details?.has_well_water||false,has_hoa:details?.has_hoa||false,tree_coverage:details?.tree_coverage||'',occupancy_status:home?.occupancy_status||'owner_occupied'})
    setEditingHomeSection(section)
    setExpandedSections(prev=>{const n=new Set(prev);n.add(section);return n})
  }

  const saveHomeSection=async(section:string)=>{
    setSaving(true)
    try{
      if(section==='about'){
        const {data:uh,error:he}=await supabase.from('homes').update({address:homeEdits.address,city:homeEdits.city,state:homeEdits.state,zip:homeEdits.zip,year_built:parseInt(homeEdits.year_built)||null,occupancy_status:homeEdits.occupancy_status||'owner_occupied'}).eq('id',home.id).select().single()
        if(he){console.error('homes update:',he);alert('Save failed: '+he.message);setSaving(false);return}
        if(uh)setHome(uh)
      }
      const du:any={}
      if(section==='about'){du.home_type=homeEdits.home_type||null;du.sqft=parseInt(homeEdits.sqft)||null;du.bedrooms=parseInt(homeEdits.bedrooms)||null;du.bathrooms=parseFloat(homeEdits.bathrooms)||null;du.stories=parseInt(homeEdits.stories)||null;du.lot_size=homeEdits.lot_size||null;du.has_hoa=homeEdits.has_hoa||false}
      if(Object.keys(du).length>0){
        const {data:existCheck}=await supabase.from('home_details').select('id').eq('home_id',home.id).maybeSingle()
        if(existCheck){
          const {data:ud,error:de}=await supabase.from('home_details').update(du).eq('home_id',home.id).select().single()
          if(de){console.error('home_details update:',de);alert('Save failed: '+de.message);setSaving(false);return}
          if(ud)setDetails(ud)
        }else{
          const {data:nd,error:ie}=await supabase.from('home_details').insert({home_id:home.id,...du}).select().single()
          if(ie){console.error('home_details insert:',ie);alert('Save failed: '+ie.message);setSaving(false);return}
          if(nd)setDetails(nd)
        }
      }
      await recalculateScore()
      if(section==='about')fetchEnvironmentData(home)
      setEditingHomeSection(null)
      setSavedSection(section)
      setTimeout(()=>setSavedSection(null),2500)
    }catch(e:any){console.error('saveHomeSection:',e);alert('Save failed: '+e.message)}
    setSaving(false)
  }

  const startEditSystem=(sys:any)=>{
    const edits:any={}
    Object.keys(sys).forEach(k=>{edits[k]=sys[k]})
    const fields=SYSTEM_FIELDS[sys.system_type]||[]
    fields.forEach(f=>{const key=f.label.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');if(!(key in edits))edits[key]=f.type==='boolean'?false:''})
    // Autofill install year from home build year if not set
    const buildYear=home?.year_built?parseInt(home.year_built):null
    if(buildYear&&!edits.install_year&&!edits.purchase_year){
      // Only autofill for systems that would have been installed when home was built
      const installSystems=['roof','hvac','water_heater','windows','entry_door','sliding_door','siding','gutters','driveway','fencing','chimney','sump_pump','plumbing','electrical','foundation','garage_door']
      if(installSystems.includes(sys.system_type))edits.install_year=buildYear
    }
    // Default condition if not set
    if(!edits.condition||edits.condition==='unknown')edits.condition='Good'
    // Autofill status if not set
    if(!edits.system_status)edits.system_status='in_service'
    // Autofill window count from sqft
    if(sys.system_type==='windows'&&!edits.window_count&&details?.sqft){
      edits.window_count=Math.round(details.sqft/80)
    }
    setSystemEdits(edits)
    
  }

  const saveSystem=async(sysId:string)=>{
    setSaving(true)
    try{
      const COLS=['id','home_id','system_type','install_year','replacement_year','age_years','material','notes','condition','system_status','ever_replaced','under_warranty','not_applicable','known_issues','storm_damage_unaddressed','considering_replacing','warranty_expiry_year','quantity','window_count','has_fogged_units','has_skylights','any_broken_glass','any_wood_rot','has_broken_glass','locks_not_functioning','windows_wont_open','has_gutter_guards','seamless_or_sectional','fascia_material','has_glass_lites_or_sidelites','hardware_in_working_condition','has_anti_lift','configuration','locking_type','frame_material','glazing_type','fuel_source','fuel_type','filter_size','last_filter_replacement','last_professional_service','furnace_install_year','ac_or_heat_pump_install_year','tank_size_gallons','tank_size','has_expansion_tank','last_flush','last_anode_rod_inspection','last_tpr_valve_test','last_sweep','last_inspection','last_cleaning','last_seal_stain','last_seal_year','last_test','last_battery_replacement','has_battery_backup','has_ice_maker','has_water_dispenser','last_condenser_coil_cleaning','last_water_filter_replacement','last_filter_cleaning','last_cleaner_cycle','occupants','last_pumped','system_subtype','pipe_material','panel_type','panel_amperage','is_insulated','door_count','last_service_year','purchase_year','appliance_type','has_water_line','last_drum_clean','has_smart_features','coverage_sqft','has_heater','last_chemical_service','softener_type','last_resin_clean','well_depth_ft','last_water_test','panel_kw','battery_backup','crawl_space_type','last_vapor_barrier','encapsulated','last_vent_cleaning','hvac_system_type','water_heater_type','pool_type','septic_system_type','chimney_type','foundation_type','tank_size_gallons','panel_count','panel_kw_output','last_seal_stain']
      const payload:any={}
      for(const k of Object.keys(systemEdits)){if(COLS.includes(k))payload[k]=systemEdits[k]}
      if(payload.condition){const cm:Record<string,string>={'Good':'good','Fair':'fair','Poor':'poor','Critical':'critical','good':'good','fair':'fair','poor':'poor','critical':'critical','watch':'fair','inspect':'poor','priority':'critical','unknown':'unknown'};payload.condition=cm[payload.condition]||'unknown'}
      const effectiveYear=payload.replacement_year||payload.install_year
      payload.age_years=effectiveYear?new Date().getFullYear()-parseInt(effectiveYear):null
      if(payload.install_year)payload.install_year=parseInt(payload.install_year)
      if(payload.replacement_year)payload.replacement_year=parseInt(payload.replacement_year)
      const {data:updated,error:se}=await supabase.from('home_systems').update(payload).eq('id',sysId).select().single()
      if(se){console.error('system update:',se);alert('Save failed: '+se.message);setSaving(false);return}
      if(updated)setSystems((prev:any[])=>prev.map(s=>s.id===sysId?updated:s))
      await recalculateScore()
      {
        const sysName=SYSTEM_DISPLAY_NAMES[updated?.system_type]||updated?.system_type||'System'
        const existingProjects=await supabase.from('home_projects').select('id,title,status').eq('home_id',home.id)
        const matchingProject=existingProjects.data?.find((p:any)=>p.title.toLowerCase().includes(sysName.toLowerCase()))
        if(payload.system_status==='getting_quotes'){
          if(!matchingProject){
            await supabase.from('home_projects').insert({home_id:home.id,created_by:user.id,title:`${sysName} replacement`,category:'maintenance',status:'wishlist',priority:'medium'})
            setWishlistToast(sysName)
            setTimeout(()=>setWishlistToast(null),4000)
          }
        } else if(payload.system_status==='scheduled'&&matchingProject){
          setWishlistSyncModal({sysName,projectId:matchingProject.id,type:'scheduled'})
        } else if(payload.system_status==='recently_replaced'&&matchingProject&&matchingProject.status!=='done'){
          await supabase.from('home_projects').update({status:'done'}).eq('id',matchingProject.id)
        } else if((payload.system_status==='in_service'||payload.system_status==='monitoring')&&matchingProject&&matchingProject.status==='wishlist'){
          setWishlistSyncModal({sysName,projectId:matchingProject.id,type:'in_service'})
        }
      }
      setSavedSystemId(sysId)
      setTimeout(()=>setSavedSystemId(null),2500)
    }catch(e:any){console.error('saveSystem:',e);alert('Save failed: '+e.message)}
    setSaving(false)
  }

  const addSystem=async(systemType:string)=>{
    const {data}=await supabase.from('home_systems').insert({home_id:home.id,system_type:systemType,not_applicable:false}).select().single()
    if(data){setSystems((prev:any[])=>[...prev,data]);startEditSystem(data);setSystemModal(data)}
  }

  const toggleChecklistItem=async(itemKey:string)=>{
    const done=completedChecklist.includes(itemKey)
    if(done){await supabase.from('homeowner_checklist').update({completed:false,completed_at:null}).eq('user_id',user.id).eq('item_key',itemKey);setCompletedChecklist(prev=>prev.filter(k=>k!==itemKey))}
    else{await supabase.from('homeowner_checklist').upsert({user_id:user.id,item_key:itemKey,completed:true,completed_at:new Date().toISOString()},{onConflict:'user_id,item_key'});setCompletedChecklist(prev=>[...prev,itemKey])}
  }

  const saveGoals=async()=>{
    const ga=Array.from(draftGoals)
    await supabase.from('user_profiles').upsert({user_id:user.id,homeowner_goal:ga,updated_at:new Date().toISOString()},{onConflict:'user_id'})
    setUserGoals(ga);setEditingGoals(false)
  }

  const addTask=async()=>{
    if(!newTaskTitle.trim())return
    const {data}=await supabase.from('home_tasks').insert({home_id:home.id,created_by:user.id,title:newTaskTitle,description:newTaskDesc||null,source:'custom',status:'todo',due_date:newTaskDue||null}).select().single()
    if(data)setTasks((prev:any[])=>[data,...prev])
    setNewTaskTitle('');setNewTaskDesc('');setNewTaskDue('');setShowAddTask(false)
  }

  const updateTaskStatus=async(taskId:string,status:string)=>{
    await supabase.from('home_tasks').update({status,completed_at:status==='done'?new Date().toISOString():null}).eq('id',taskId)
    setTasks((prev:any[])=>prev.map(t=>t.id===taskId?{...t,status}:t))
    await recalculateScore()
  }

  const deleteTask=async(taskId:string)=>{await supabase.from('home_tasks').delete().eq('id',taskId);setTasks((prev:any[])=>prev.filter(t=>t.id!==taskId))}

  const assignTask=async(taskId:string,assignedTo:string|null)=>{
    await supabase.from('home_tasks').update({assigned_to:assignedTo,assigned_by:user.id,assigned_at:new Date().toISOString()}).eq('id',taskId)
    setTasks((prev:any[])=>prev.map(t=>t.id===taskId?{...t,assigned_to:assignedTo,assigned_by:user.id}:t))
    setShowAssignMenu(null)
    if(assignedTo&&assignedTo!==user.id){
      await supabase.from('home_tasks').update({status:'todo'}).eq('id',taskId)
    }
  }

  const sendInvite=async()=>{
    if(!inviteEmail.trim()||!home?.id)return
    setInviteSending(true)
    const token=Math.random().toString(36).substring(2)+Date.now().toString(36)
    await supabase.from('home_invites').insert({home_id:home.id,invited_by:user.id,email:inviteEmail.trim().toLowerCase(),role:inviteRole,token,status:'pending',first_name:inviteFirstName.trim()||null,last_name:inviteLastName.trim()||null})
    await fetch('/api/invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:inviteEmail.trim(),role:inviteRole,inviterName:displayName||user?.email?.split('@')[0]||'Your co-owner',homeAddress:home?.address||'your home',token,firstName:inviteFirstName.trim(),lastName:inviteLastName.trim()})})
    setInviteSent(true)
    setInviteSending(false)
    setInviteEmail('')
    setInviteFirstName('')
    setInviteLastName('')
    setTimeout(()=>{setInviteSent(false);setShowInviteForm(false)},3000)
  }

  const cancelInvite=async(inviteId:string)=>{
    await supabase.from('home_invites').update({status:'cancelled'}).eq('id',inviteId)
    setHomeInvites(prev=>prev.filter(i=>i.id!==inviteId))
  }

  const handleFileSelect=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f)return
    if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(f.type)){setUploadError('Only PDF, JPG, and PNG files are accepted.');return}
    if(f.size>10*1024*1024){setUploadError('File must be under 10MB.');return}
    setUploadError('');setUploadFile(f)
    if(!uploadName)setUploadName(f.name.replace(/\.[^/.]+$/,''))
  }

  const handleUpload=async()=>{
    if(!uploadFile||!uploadName.trim()){setUploadError('Please select a file and enter a name.');return}
    setUploading(true);setUploadError('')
    try{
      const ext=uploadFile.name.split('.').pop()
      const fp=`${user.id}/${home.id}/${Date.now()}.${ext}`
      const {error:ue}=await supabase.storage.from('home-documents').upload(fp,uploadFile,{contentType:uploadFile.type})
      if(ue)throw ue
      const {data:doc}=await supabase.from('home_documents').insert({home_id:home.id,user_id:user.id,name:uploadName.trim(),description:uploadDesc.trim()||null,category:uploadCategory,system_type:uploadSystem||null,file_path:fp,file_size:uploadFile.size,file_type:uploadFile.type,expires_at:uploadExpires||null}).select().single()
      if(doc)setDocs((prev:any[])=>[doc,...prev])
      setUploadFile(null);setUploadName('');setUploadDesc('');setUploadCategory('other');setUploadSystem('');setUploadExpires('');setShowUploadForm(false)
      if(fileInputRef.current)fileInputRef.current.value=''
    }catch(e:any){setUploadError(e.message)}
    setUploading(false)
  }

  const handleDownload=async(doc:any)=>{const {data}=await supabase.storage.from('home-documents').createSignedUrl(doc.file_path,60);if(data?.signedUrl)window.open(data.signedUrl,'_blank')}
  const handleDeleteDoc=async(doc:any)=>{if(!window.confirm(`Delete "${doc.name}"?`))return;await supabase.storage.from('home-documents').remove([doc.file_path]);await supabase.from('home_documents').delete().eq('id',doc.id);setDocs((prev:any[])=>prev.filter(d=>d.id!==doc.id))}
  const handleDeleteAccount=async()=>{if(!window.confirm('Are you sure? This cannot be undone.'))return;if(!window.confirm('Last chance — permanent.'))return;setDeletingAccount(true);const {error}=await supabase.rpc('delete_user_account');if(error){alert('Error: '+error.message);setDeletingAccount(false)}else{await supabase.auth.signOut();window.location.href='/'}}
  const formatSize=(bytes:number)=>{if(!bytes)return'';if(bytes<1024*1024)return`${Math.round(bytes/1024)} KB`;return`${(bytes/(1024*1024)).toFixed(1)} MB`}

  const renderSystemField=(field:{label:string;type:string;options?:string[]})=>{
    const key=field.label.toLowerCase().replace(/[()]/g,'').replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').replace(/_+/g,'_').replace(/^_|_$/g,'')
    const val=systemEdits[key]??systemEdits[field.label]??(field.type==='boolean'?false:'')
    const onChange=(v:any)=>setSystemEdits((p:any)=>({...p,[key]:v,[field.label]:v}))
    if(field.type==='boolean')return<label key={field.label} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',cursor:'pointer'}}><input type="checkbox" checked={!!val} onChange={e=>onChange(e.target.checked)} style={{accentColor:'#1E3A2F'}}/>{field.label}</label>
    if(field.type==='select')return<div key={field.label}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>{field.label}</label><select value={val} onChange={e=>onChange(e.target.value)} style={iS}><option value="">Unknown</option>{field.options?.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
    if(field.type==='date')return<div key={field.label}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>{field.label}</label><input type="date" value={val||''} onChange={e=>onChange(e.target.value)} style={iS}/></div>
    if(field.type==='number')return<div key={field.label}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>{field.label}</label><input type="number" value={val||''} onChange={e=>onChange(e.target.value)} style={iS}/></div>
    return<div key={field.label}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>{field.label}</label><input value={val||''} onChange={e=>onChange(e.target.value)} style={iS} placeholder={field.type==='year'?'e.g. 2018':''}/></div>
  }

const STATUS_OPTIONS=[
      {v:'in_service',label:'In service — working normally',dot:'#3D7A5A'},
      {v:'monitoring',label:'In service — monitoring it',dot:'#C47B2B',sub:'Showing age or condition concerns'},
      {v:'getting_quotes',label:'Getting quotes',dot:'#C47B2B',sub:'Actively pricing replacement'},
      {v:'scheduled',label:'Replacement scheduled',dot:'#185FA5'},
      {v:'recently_replaced',label:'Recently replaced',dot:'#185FA5',sub:'Update the year above'},
      {v:'not_applicable',label:'Not applicable',dot:'#888780',sub:"This home doesn't have one"},
    ]

  const renderSystemCard=(sys:any)=>{
    const cond=getCondition(sys)
    const effectiveYear=sys.replacement_year||sys.install_year||sys.purchase_year
    const age=effectiveYear?new Date().getFullYear()-effectiveYear:null
    const lifespan=SYSTEM_LIFESPANS[sys.system_type]||20
    const pct=age?Math.min(100,Math.round((age/lifespan)*100)):0
    const isEditing=systemModal?.id===sys.id
    const fields=SYSTEM_FIELDS[sys.system_type]||[]
    const essentialFields=fields.filter(f=>!['boolean'].includes(f.type)&&!['Last','last'].some(p=>f.label.startsWith(p))&&f.label!=='Notes'&&f.label!=='Known issues')
    const detailFields=fields.filter(f=>f.type==='boolean'||['Last','last'].some(p=>f.label.startsWith(p)))
    const notesFields=fields.filter(f=>f.label==='Notes'||f.label==='Known issues')

    // Safety flags
    const hasBrokenGlass=sys.has_broken_glass||sys.any_broken_glass
    const hasLockIssue=sys.locks_not_functioning
    const hasWindowWontOpen=sys.windows_wont_open
    const isDangerousPanel=sys.panel_type?.includes('Federal Pacific')||sys.panel_type?.includes('Zinsco')
    const hasSafetyFlag=hasBrokenGlass||hasLockIssue||isDangerousPanel

    // Autofill defaults
    const autoYear=home?.year_built?parseInt(home.year_built):null

    // Septic pump interval calculation
    const getSepticInterval=()=>{
      const tank=sys.tank_size||''
      const occ=parseInt(sys.occupants)||2
      if(tank.includes('500'))return occ<=2?3:2
      if(tank.includes('750'))return occ<=2?4:3
      if(tank.includes('1,000')||tank.includes('1000'))return occ<=2?5:occ<=4?3:2
      if(tank.includes('1,500')||tank.includes('1500'))return occ<=4?5:3
      return 3
    }


    return(
      <div key={sys.id} style={{background:'#fff',border:`1px solid ${hasSafetyFlag?'rgba(226,75,74,0.4)':'rgba(30,58,47,0.11)'}`,borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>

        {/* Safety alerts — shown even when collapsed */}
        {hasSafetyFlag&&(
          <div style={{padding:'10px 16px',background:'#FEF5F5',borderBottom:'1px solid rgba(226,75,74,0.15)'}}>
            {isDangerousPanel&&<div style={{fontSize:'12px',fontWeight:500,color:'#791F1F',marginBottom:'2px'}}>🔴 {sys.panel_type} panel — known fire hazard, replacement recommended immediately</div>}
            {hasBrokenGlass&&<div style={{fontSize:'12px',fontWeight:500,color:'#791F1F',marginBottom:'2px'}}>🔴 Broken glass — safety and security risk, repair needed promptly</div>}
            {hasLockIssue&&<div style={{fontSize:'12px',fontWeight:500,color:'#791F1F'}}>🔴 Lock not functioning — security vulnerability, repair recommended promptly</div>}
          </div>
        )}

        <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 18px',cursor:'pointer'}}
          onClick={()=>{startEditSystem(sys);setSystemModal(sys)}}>
          <div style={{fontSize:'22px',flexShrink:0}}>{SYSTEM_ICONS[sys.system_type]||'🔧'}</div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px',flexWrap:'wrap'}}>
              <span style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>{SYSTEM_DISPLAY_NAMES[sys.system_type]||sys.system_type}</span>
              {cond.label&&<span style={{fontSize:'10px',fontWeight:500,padding:'2px 7px',borderRadius:'20px',background:cond.bg,color:cond.textColor}}>{cond.label}</span>}
              {savedSystemId===sys.id&&<span style={{fontSize:'10px',fontWeight:500,padding:'2px 10px',borderRadius:'20px',background:'#EAF2EC',color:'#3D7A5A'}}>✓ Saved</span>}
              {sys.system_status==='getting_quotes'&&<span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'20px',background:'#FBF0DC',color:'#633806'}}>Getting quotes</span>}
              {sys.system_status==='scheduled'&&<span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'20px',background:'#E6F1FB',color:'#0C447C'}}>Scheduled</span>}
            </div>
            <div style={{fontSize:'12px',color:'#8A8A82'}}>
              {sys.not_applicable?'Not applicable':age?`${age} yr old${sys.material?` · ${sys.material}`:''}`:sys.material||'Tap to set up'}
            </div>
          </div>
          {age!==null&&!sys.not_applicable&&<div style={{width:'60px',flexShrink:0}}><div style={{height:'4px',background:'#EDE8E0',borderRadius:'2px'}}><div style={{width:`${pct}%`,height:'100%',background:cond.color,borderRadius:'2px'}}/></div><div style={{fontSize:'10px',color:'#8A8A82',textAlign:'right',marginTop:'2px'}}>{pct}%</div></div>}
          <span style={{fontSize:'12px',color:'#8A8A82',flexShrink:0}}>›</span>
        </div>

      </div>
    )
  }

  if(loading)return<div style={{background:'#F8F4EE',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans', sans-serif"}}><p style={{color:'#8A8A82'}}>Loading your home...</p></div>

  const sv=score?.total_score||0
  const tabs=['overview','home_details','log','financial','projects','maintenance','environment','documents']
  const tl:Record<string,string>={overview:'Dashboard',home_details:'Home Details',log:'Activity Log',financial:'Finances',projects:'Projects',maintenance:'Maintenance Calendar',environment:'Environment',documents:'Documents'}
  const alertSys=systems.filter(s=>['Inspect','Priority'].includes(getCondition(s).label))
  const dnf=displayName||user?.email?.split('@')[0]?.split('.')[0]?.replace(/^\w/,(c:string)=>c.toUpperCase())||'there'
  const engineProfile=adaptHomeProfile(home,systems,userGoals,stormHistory)
  const engineResult=getEngineSmartTasks(engineProfile)
  const smartTasks=engineResult.displayed.filter(t=>!dismissedSmartTasks.includes(t.id))
  const customTasks=tasks.filter(t=>t.status!=='done'&&t.status!=='dismissed'&&t.source!=='smart'&&t.source!=='seasonal')
  const doneTasks=tasks.filter(t=>t.status==='done')
  const communityLevel=getCommunityLevel(communityScore?.total_points||0)
  const expiringDocs=docs.filter(d=>{if(!d.expires_at)return false;const days=Math.ceil((new Date(d.expires_at).getTime()-Date.now())/(1000*60*60*24));return days<=90&&days>0})
  const filteredDocs=docs.filter(d=>docFilter==='all'||d.category===docFilter)
  const docsByCat=DOC_CATEGORIES.map(cat=>({...cat,docs:filteredDocs.filter(d=>d.category===cat.key)})).filter(cat=>cat.docs.length>0)
  const stormDate=weather?.recentStorm?new Date(weather.recentStorm.date):null
  const stormIsFuture=stormDate?stormDate.getTime()>Date.now():false
  const showActiveStorm=stormDate!==null&&(stormIsFuture||(Date.now()-stormDate.getTime())<21*24*60*60*1000)
  const deferred=getDeferredLiability(systems)
  const isNewHO=homeownerType==='first_time'||homeownerType==='new_to_home'
  const totalCL=FIRST_30_DAYS_CATEGORIES.reduce((a,c)=>a+c.items.length,0)
  const clPct=Math.round((completedChecklist.length/totalCL)*100)
  const tmTasks=getThisMonthTasks(systems)
  const thisYearSpend=jobs.filter(j=>j.final_price&&j.job_date&&new Date(j.job_date).getFullYear()===new Date().getFullYear()).reduce((a:number,j:any)=>a+Number(j.final_price),0)
  const thisYearJobs=jobs.filter(j=>j.job_date&&new Date(j.job_date).getFullYear()===new Date().getFullYear()).length
  const scoreDetails=[
    {label:'Systems',icon:'🏠',value:score?.system_risk_score||0,insight:(score?.system_risk_score||0)>=80?'All systems in good shape':'Systems need attention',action:'View',onClick:()=>setActiveTab('home_details')},
    {label:'Maintenance',icon:'🔧',value:score?.maintenance_score||0,insight:(score?.maintenance_score||0)>=70?'Great maintenance history':'Log more jobs to improve',action:'Log',href:'/log'},
    {label:'Value',icon:'💰',value:score?.value_protection_score||0,insight:(score?.value_protection_score||0)>=70?'Home value well protected':'See financial breakdown',action:'View',onClick:()=>setActiveTab('financial')},
    {label:'Seasonal',icon:'🌿',value:score?.seasonal_readiness_score||0,insight:(score?.seasonal_readiness_score||0)>=70?'Ready for the season':'Check seasonal tasks',action:'View',onClick:()=>setActiveTab('maintenance')},
  ]

  return(
    <main style={{background:'#F8F4EE',minHeight:'100vh',fontFamily:"'DM Sans', sans-serif"}}>
      <Nav/>

      {/* HEADER */}
      <div style={{background:'#1E3A2F',padding:'0 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'20px',paddingBottom:'16px',gap:'16px'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(248,244,238,0.40)',marginBottom:'4px'}}>My Home</div>
            <div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'24px',color:'#F8F4EE',fontWeight:400,lineHeight:1.1}}>{dnf}</div>
            {home&&<div style={{fontSize:'12px',color:'rgba(248,244,238,0.50)',marginTop:'3px'}}>{home.address}{home.city?`, ${home.city}`:''}{home.state?` ${home.state}`:''}</div>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
            {allHomes.length>1&&(
              <div style={{position:'relative'}}>
                <button onClick={()=>setPropertyMenuOpen(propertyMenuOpen==='switcher'?null:'switcher')} style={{background:'rgba(248,244,238,0.08)',border:'1px solid rgba(248,244,238,0.15)',color:'rgba(248,244,238,0.75)',padding:'7px 12px',borderRadius:'8px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",display:'flex',alignItems:'center',gap:'6px'}}>
                  <span>Switch property</span>
                  <span style={{fontSize:'10px',opacity:0.6}}>{propertyMenuOpen==='switcher'?'▲':'▼'}</span>
                </button>
                {propertyMenuOpen==='switcher'&&(
                  <div style={{position:'absolute',top:'38px',right:0,background:'#fff',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',border:'1px solid rgba(30,58,47,0.11)',overflow:'hidden',zIndex:300,minWidth:'260px'}}>
                    {allHomes.map((h:any)=>(
                      <div key={h.id} style={{borderBottom:'1px solid rgba(30,58,47,0.06)'}}>
                        <button onClick={()=>{switchHome(h);setPropertyMenuOpen(null)}} style={{display:'block',width:'100%',padding:'12px 16px',background:h.id===home?.id?'#F0F5F2':'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:"'DM Sans', sans-serif"}}>
                          <div style={{fontSize:'13px',fontWeight:h.id===home?.id?500:400,color:'#1E3A2F',display:'flex',alignItems:'center',gap:'6px'}}>
                            {h.is_primary&&<span style={{fontSize:'10px'}}>⭐</span>}
                            {h.id===home?.id&&<span style={{fontSize:'10px',color:'#3D7A5A'}}>✓</span>}
                            {h.address}
                          </div>
                          {h.city&&<div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>{h.city}{h.state?`, ${h.state}`:''}</div>}
                          <div style={{marginTop:'4px'}}><span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'10px',fontWeight:500,background:h.occupancy_status==='rental'?'#E6F2F8':h.occupancy_status==='former'?'#F5F5F5':'#EAF2EC',color:h.occupancy_status==='rental'?'#3A7CA8':h.occupancy_status==='former'?'#8A8A82':'#3D7A5A'}}>{h.occupancy_status==='rental'?'Rental':h.occupancy_status==='former'?'Former home':'Primary'}</span></div>
                        </button>
                        <div style={{display:'flex',borderTop:'1px solid rgba(30,58,47,0.04)'}}>
                          {!h.is_primary&&<button onClick={()=>setPrimaryHome(h.id)} style={{flex:1,padding:'7px 12px',background:'none',border:'none',cursor:'pointer',fontSize:'11px',color:'#8A8A82',fontFamily:"'DM Sans', sans-serif",textAlign:'left'}}>⭐ Set primary</button>}
                          {h.status!=='for_transfer'&&<button onClick={()=>markForTransfer(h.id)} style={{flex:1,padding:'7px 12px',background:'none',border:'none',cursor:'pointer',fontSize:'11px',color:'#C47B2B',fontFamily:"'DM Sans', sans-serif",textAlign:'left'}}>🔑 Mark former</button>}
                        </div>
                      </div>
                    ))}
                    <a href="/onboarding" style={{display:'block',padding:'11px 16px',fontSize:'12px',color:'#1E3A2F',textDecoration:'none',fontFamily:"'DM Sans', sans-serif",borderTop:'1px solid rgba(30,58,47,0.06)'}}>+ Add another property</a>
                  </div>
                )}
              </div>
            )}
            {allHomes.length===1&&(
              <a href="/onboarding" style={{background:'rgba(248,244,238,0.08)',border:'1px solid rgba(248,244,238,0.15)',color:'rgba(248,244,238,0.60)',padding:'7px 12px',borderRadius:'8px',fontSize:'12px',textDecoration:'none',fontFamily:"'DM Sans', sans-serif"}}>+ Add property</a>
            )}
          </div>
        </div>
                <div style={{display:'flex',gap:'2px',overflowX:'auto'}}>
          {tabs.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{background:'none',border:'none',color:activeTab===tab?'#F8F4EE':'rgba(248,244,238,0.5)',fontFamily:"'DM Sans', sans-serif",fontSize:'13px',padding:'9px 14px 13px',cursor:'pointer',whiteSpace:'nowrap',borderBottom:activeTab===tab?'2px solid #C47B2B':'2px solid transparent',fontWeight:activeTab===tab?500:400,position:'relative',bottom:'-1px',transition:'color 0.2s'}}>{tl[tab]}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'24px 28px 48px',maxWidth:'1100px',margin:'0 auto'}}>
        {/* ══ OVERVIEW ══ */}
        {activeTab==='overview'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'20px',alignItems:'start'}}>
            <div>
              {deferred>0&&(<div style={{background:'#FDECEA',border:'1px solid rgba(139,58,42,0.2)',borderRadius:'12px',padding:'14px 18px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}><div><div style={{fontSize:'13px',fontWeight:500,color:'#9B2C2C',marginBottom:'2px'}}>💸 ~${deferred.toLocaleString()} in deferred maintenance identified</div><div style={{fontSize:'12px',color:'#7A3A2A',lineHeight:1.5}}>Addressing this now costs far less than waiting.</div></div><button onClick={()=>setActiveTab('financial')} style={{background:'#9B2C2C',color:'#fff',border:'none',padding:'7px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0}}>See breakdown →</button></div>)}

              {isNewHO&&clPct<100&&(
                <div style={{background:'#fff',border:'2px solid #1E3A2F',borderRadius:'16px',overflow:'hidden',marginBottom:'20px'}}>
                  <div style={{background:'#1E3A2F',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div><h4 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'16px',color:'#F8F4EE',fontWeight:400,marginBottom:'2px'}}>Your First 30 Days</h4><div style={{fontSize:'12px',color:'rgba(248,244,238,0.55)'}}>{completedChecklist.length} of {totalCL} complete · {clPct}%</div></div>
                    <button onClick={()=>setShowFullChecklist(!showFullChecklist)} style={{background:'rgba(248,244,238,0.1)',border:'1px solid rgba(248,244,238,0.2)',color:'#F8F4EE',fontSize:'12px',padding:'5px 12px',borderRadius:'8px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>{showFullChecklist?'Collapse':'View all'}</button>
                  </div>
                  <div style={{padding:'12px 20px'}}>
                    <div style={{height:'6px',background:'#EDE8E0',borderRadius:'3px',marginBottom:'14px'}}><div style={{width:`${clPct}%`,height:'100%',background:'#3D7A5A',borderRadius:'3px',transition:'width 0.3s'}}/></div>
                    {!showFullChecklist?(
                      <div style={{display:'grid',gap:'8px'}}>{FIRST_30_DAYS_CATEGORIES.flatMap(c=>c.items).filter(i=>!completedChecklist.includes(i.key)).slice(0,3).map(item=>(<div key={item.key} style={{display:'flex',alignItems:'center',gap:'10px'}}><button onClick={()=>toggleChecklistItem(item.key)} style={{width:'20px',height:'20px',borderRadius:'50%',border:'2px solid #1E3A2F',background:'none',cursor:'pointer',flexShrink:0}}/><span style={{fontSize:'13px',color:'#1A1A18'}}>{item.title}</span></div>))}</div>
                    ):(
                      <div style={{display:'grid',gap:'16px'}}>{FIRST_30_DAYS_CATEGORIES.map(cat=>(<div key={cat.key}><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px',cursor:'pointer'}} onClick={()=>setExpandedChecklistCats(prev=>{const n=new Set(prev);if(n.has(cat.key))n.delete(cat.key);else n.add(cat.key);return n})}><span style={{fontSize:'16px'}}>{cat.icon}</span><span style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{cat.label}</span><span style={{fontSize:'11px',color:'#8A8A82',marginLeft:'auto'}}>{cat.items.filter(i=>completedChecklist.includes(i.key)).length}/{cat.items.length}</span><span style={{fontSize:'11px',color:'#8A8A82'}}>{expandedChecklistCats.has(cat.key)?'▲':'▼'}</span></div>{expandedChecklistCats.has(cat.key)&&(<div style={{display:'grid',gap:'8px',paddingLeft:'28px'}}>{cat.items.map(item=>{const done=completedChecklist.includes(item.key);return(<div key={item.key} style={{display:'flex',alignItems:'center',gap:'10px'}}><button onClick={()=>toggleChecklistItem(item.key)} style={{width:'20px',height:'20px',borderRadius:'50%',border:`2px solid ${done?'#3D7A5A':'#1E3A2F'}`,background:done?'#3D7A5A':'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>{done&&<span style={{color:'#fff',fontSize:'11px'}}>✓</span>}</button><span style={{fontSize:'13px',color:done?'#8A8A82':'#1A1A18',textDecoration:done?'line-through':'none'}}>{item.title}</span></div>)})}</div>)}</div>))}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Score hero */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'20px'}}>
                <div style={{background:'#1E3A2F',padding:'24px 28px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:'-40px',right:'-40px',width:'200px',height:'200px',background:'radial-gradient(circle, rgba(196,123,43,0.2) 0%, transparent 70%)',pointerEvents:'none'}}/>
                  <div style={{display:'flex',alignItems:'center',gap:'24px',position:'relative',zIndex:1}}>
                    <div style={{position:'relative',width:'80px',height:'80px',flexShrink:0}}>
                      <svg width="80" height="80" style={{transform:'rotate(-90deg)'}}><circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/><circle cx="40" cy="40" r="32" fill="none" stroke={sv>=80?'#6AAF8A':sv>=60?'#C47B2B':'#E57373'} strokeWidth="10" strokeDasharray="201" strokeDashoffset={201-(201*sv/100)} strokeLinecap="round"/></svg>
                      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}><div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',color:'#F8F4EE',fontWeight:600,lineHeight:1}}>{sv}</div></div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'2px',textTransform:'uppercase',color:'#6AAF8A',marginBottom:'4px'}}>Home Health Score</div>
                      <h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',color:'#F8F4EE',fontWeight:400,marginBottom:'4px'}}>{sv>=80?'Your home is in great shape':sv>=60?'Your home is doing well':'Your home needs attention'}</h2>
                      <div style={{fontSize:'12px',color:'rgba(248,244,238,0.55)'}}>{home?.address} · Built {home?.year_built} · {systems.length} system{systems.length!==1?'s':''} tracked · {jobs.length} job{jobs.length!==1?'s':''} logged</div>
                    </div>
                    <a href="/report" target="_blank" style={{background:'rgba(248,244,238,0.1)',border:'1px solid rgba(248,244,238,0.2)',color:'rgba(248,244,238,0.8)',padding:'7px 14px',borderRadius:'8px',fontSize:'12px',textDecoration:'none',fontFamily:"'DM Sans', sans-serif",flexShrink:0,whiteSpace:'nowrap'}}>Share report ↗</a>
                  </div>
                </div>
                {scoreDetails.map((dim,i)=>(
                  <div key={dim.label} style={{padding:'12px 22px',borderBottom:i<scoreDetails.length-1?'1px solid rgba(30,58,47,0.06)':'none',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer'}} onClick={()=>'onClick' in dim&&dim.onClick?dim.onClick():'href' in dim&&dim.href?window.location.href=dim.href:null}>
                    <div style={{fontSize:'20px',width:'28px',flexShrink:0}}>{dim.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}><span style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{dim.label}</span><span style={{fontSize:'13px',fontWeight:600,color:dim.value>=80?'#3D7A5A':dim.value>=60?'#C47B2B':'#9B2C2C'}}>{dim.value}</span></div>
                      <div style={{height:'6px',background:'#EDE8E0',borderRadius:'3px',marginBottom:'4px'}}><div style={{width:`${dim.value}%`,height:'100%',background:dim.value>=80?'#3D7A5A':dim.value>=60?'#C47B2B':'#9B2C2C',borderRadius:'3px'}}/></div>
                      <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:'11px',color:'#8A8A82'}}>{dim.insight}</span><span style={{fontSize:'11px',color:'#3D7A5A',fontWeight:500}}>{dim.action} →</span></div>
                    </div>
                  </div>
                ))}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(30,58,47,0.08)'}}>
                  {[{label:'Maintenance this year',value:thisYearSpend>0?`$${thisYearSpend.toLocaleString()}`:'$0',sub:`${thisYearJobs} job${thisYearJobs!==1?'s':''} logged`},{label:'Deferred liability',value:deferred>0?`~$${deferred.toLocaleString()}`:'None',sub:deferred>0?'Address before selling':'All systems current'},{label:'Systems tracked',value:String(systems.filter(s=>!s.not_applicable).length),sub:alertSys.length>0?`${alertSys.length} need attention`:'All in good shape'}].map(stat=>(<div key={stat.label} style={{background:'#fff',padding:'14px 18px'}}><div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'20px',color:'#1E3A2F',fontWeight:600,marginBottom:'2px'}}>{stat.value}</div><div style={{fontSize:'11px',fontWeight:500,color:'#1E3A2F',marginBottom:'1px'}}>{stat.label}</div><div style={{fontSize:'11px',color:'#8A8A82'}}>{stat.sub}</div></div>))}
                </div>
              </div>

              {/* To-Do */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'20px'}}>
                <div style={{background:'#1E3A2F',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}><h4 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'16px',color:'#F8F4EE',fontWeight:400}}>Home To-Do</h4><button onClick={()=>setShowAddTask(!showAddTask)} style={{background:'rgba(248,244,238,0.1)',border:'1px solid rgba(248,244,238,0.2)',color:'#F8F4EE',fontSize:'12px',padding:'4px 10px',borderRadius:'6px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>+ Add task</button></div>
                {showAddTask&&(<div style={{padding:'16px 20px',borderBottom:'1px solid rgba(30,58,47,0.08)',background:'#F8F4EE'}}><div style={{display:'grid',gap:'10px'}}><input value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={iS} placeholder="Task title"/><input value={newTaskDesc} onChange={e=>setNewTaskDesc(e.target.value)} style={iS} placeholder="Description (optional)"/><input type="date" value={newTaskDue} onChange={e=>setNewTaskDue(e.target.value)} style={{...iS,maxWidth:'200px'}}/><div style={{display:'flex',gap:'8px'}}><button onClick={addTask} style={{flex:1,background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'8px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Add task</button><button onClick={()=>setShowAddTask(false)} style={{flex:1,background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'8px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button></div></div></div>)}
                {customTasks.map(task=>{
                  const assignedMember=homeMembers.find((m:any)=>m.user_id===task.assigned_to)
                  return(
                    <div key={task.id} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'13px 20px',borderBottom:'1px solid rgba(30,58,47,0.06)',position:'relative'}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,background:'#EAF2EC'}}>✏️</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'14px',marginBottom:'2px',fontWeight:500}}>{task.title}</div>
                        {task.description&&<div style={{fontSize:'12px',color:'#8A8A82',marginBottom:'4px'}}>{task.description}</div>}
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          {task.due_date&&<div style={{fontSize:'11px',color:'#C47B2B'}}>Due {new Date(task.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>}
                          {task.assigned_to&&<div style={{fontSize:'11px',color:'#3D7A5A',background:'#EAF2EC',padding:'2px 8px',borderRadius:'10px'}}>→ {task.assigned_to===user?.id?'You':assignedMember?.email||'Assigned'}</div>}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'6px',flexShrink:0,alignItems:'flex-start',position:'relative'}}>
                        {homeMembers.length>0&&(
                          <div style={{position:'relative'}}>
                            <button onClick={()=>setShowAssignMenu(showAssignMenu===task.id?null:task.id)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'3px 8px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>👤 Assign</button>
                            {showAssignMenu===task.id&&(
                              <div style={{position:'absolute',top:'28px',right:0,background:'#fff',border:'1px solid rgba(30,58,47,0.15)',borderRadius:'10px',boxShadow:'0 4px 20px rgba(0,0,0,0.12)',zIndex:100,minWidth:'180px',overflow:'hidden'}}>
                                <div style={{padding:'8px 12px',borderBottom:'1px solid rgba(30,58,47,0.08)',fontSize:'11px',color:'#8A8A82',fontWeight:500}}>Assign to</div>
                                {task.assigned_to&&<button onClick={()=>assignTask(task.id,null)} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',borderBottom:'1px solid rgba(30,58,47,0.06)',cursor:'pointer',textAlign:'left',fontSize:'12px',color:'#9B2C2C',fontFamily:"'DM Sans', sans-serif"}}>× Remove assignment</button>}
                                <button onClick={()=>assignTask(task.id,user.id)} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',borderBottom:'1px solid rgba(30,58,47,0.06)',cursor:'pointer',textAlign:'left',fontSize:'12px',color:'#1E3A2F',fontFamily:"'DM Sans', sans-serif",fontWeight:task.assigned_to===user?.id?600:400}}>Myself {task.assigned_to===user?.id?'✓':''}</button>
                                {homeMembers.map((m:any)=>(
                                  <button key={m.user_id} onClick={()=>assignTask(task.id,m.user_id)} style={{display:'block',width:'100%',padding:'8px 12px',background:'none',border:'none',borderBottom:'1px solid rgba(30,58,47,0.06)',cursor:'pointer',textAlign:'left',fontSize:'12px',color:'#1E3A2F',fontFamily:"'DM Sans', sans-serif",fontWeight:task.assigned_to===m.user_id?600:400}}>
                                    {m.email} <span style={{fontSize:'10px',color:'#8A8A82',textTransform:'capitalize'}}>({(m.role||'').replace('_',' ')})</span> {task.assigned_to===m.user_id?'✓':''}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <select value={task.status} onChange={e=>updateTaskStatus(task.id,e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'6px',border:'1px solid rgba(30,58,47,0.2)',background:'#fff',fontFamily:"'DM Sans', sans-serif",cursor:'pointer'}}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done ✓</option></select>
                        <button onClick={()=>deleteTask(task.id)} style={{background:'none',border:'none',color:'#8A8A82',cursor:'pointer',fontSize:'16px',padding:'0 4px'}}>×</button>
                      </div>
                    </div>
                  )
                })}
                {smartTasks.map((item:any)=>(<div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'13px 20px',borderBottom:'1px solid rgba(30,58,47,0.06)'}}><div style={{width:'36px',height:'36px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0,background:item.urgency==='high'?'#FDECEA':item.urgency==='medium'?'#FBF0DC':'#EAF2EC'}}>{item.source==='smart'?'🧠':'📋'}</div><div style={{flex:1}}><div style={{fontSize:'14px',marginBottom:'2px'}}>{item.title}</div><div style={{fontSize:'12px',color:'#8A8A82'}}>{item.description}</div></div><div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}><span style={{fontSize:'10px',fontWeight:500,padding:'3px 8px',borderRadius:'20px',background:item.urgency==='high'?'#FDECEA':item.urgency==='medium'?'#FBF0DC':'#EAF2EC',color:item.urgency==='high'?'#9B2C2C':item.urgency==='medium'?'#7A4A10':'#3D7A5A'}}>{item.source==='smart'?'Smart':'Seasonal'}</span><select defaultValue="todo" onChange={async e=>{if(e.target.value==='done'||e.target.value==='dismiss'){setDismissedSmartTasks((prev:string[])=>[...prev,item.id]);await supabase.from('home_tasks').insert({home_id:home.id,created_by:user.id,title:item.id,source:item.source,status:'dismissed',dismissed_at:new Date().toISOString()})}}} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'6px',border:'1px solid rgba(30,58,47,0.2)',background:'#fff',fontFamily:"'DM Sans', sans-serif",cursor:'pointer'}}><option value="todo">To do</option><option value="done">Done ✓</option><option value="dismiss">Dismiss</option></select></div></div>))}
                {customTasks.length===0&&smartTasks.length===0&&<div style={{padding:'24px',textAlign:'center',color:'#8A8A82',fontSize:'13px'}}>No tasks right now — add your own or they will appear based on your home data.</div>}
                {doneTasks.length>0&&<div style={{padding:'10px 20px',background:'#F8F4EE',borderTop:'1px solid rgba(30,58,47,0.06)'}}><div style={{fontSize:'12px',color:'#8A8A82'}}>✓ {doneTasks.length} completed task{doneTasks.length!==1?'s':''}</div></div>}
              </div>

              {/* Buyer / Seller tips */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              {/* Goals */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'18px',marginBottom:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}><h4 style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Your goals</h4><button onClick={()=>{setEditingGoals(!editingGoals);setDraftGoals(new Set(userGoals))}} style={{background:'none',border:'none',fontSize:'12px',color:'#3D7A5A',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",fontWeight:500}}>{editingGoals?'Cancel':'Edit'}</button></div>
                {!editingGoals?(userGoals.length>0?(<div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>{userGoals.map(key=>{const g=GOALS.find(g=>g.key===key);return g?<span key={key} style={{background:'#1E3A2F',color:'#F8F4EE',padding:'5px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:500}}>{g.emoji} {g.label}</span>:null})}</div>):<button onClick={()=>{setEditingGoals(true);setDraftGoals(new Set())}} style={{width:'100%',background:'#F8F4EE',border:'1px dashed rgba(30,58,47,0.2)',color:'#8A8A82',fontSize:'12px',padding:'10px',borderRadius:'8px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>+ Set your goals</button>):(
                  <div><p style={{fontSize:'11px',color:'#8A8A82',marginBottom:'10px'}}>Select up to 3</p><div style={{display:'grid',gap:'6px',marginBottom:'12px'}}>{GOALS.map(goal=>{const sel=draftGoals.has(goal.key);const atMax=draftGoals.size>=3&&!sel;return(<div key={goal.key} onClick={()=>{if(atMax)return;setDraftGoals(prev=>{const n=new Set(prev);if(n.has(goal.key))n.delete(goal.key);else n.add(goal.key);return n})}} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',border:`1px solid ${sel?'#1E3A2F':'rgba(30,58,47,0.15)'}`,borderRadius:'8px',cursor:atMax?'not-allowed':'pointer',background:sel?'#F0F5F2':'#fff',opacity:atMax?0.5:1}}><span style={{fontSize:'16px'}}>{goal.emoji}</span><span style={{fontSize:'12px',fontWeight:sel?500:400,color:'#1E3A2F',flex:1}}>{goal.label}</span>{sel&&<span style={{fontSize:'11px',color:'#3D7A5A'}}>✓</span>}</div>)})}</div><button onClick={saveGoals} style={{width:'100%',background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'9px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Save goals</button></div>
                )}
              </div>

              {/* Community score */}
              {communityScore&&(<div style={{background:'#1E3A2F',borderRadius:'16px',padding:'18px',marginBottom:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}><div style={{fontSize:'26px'}}>{communityLevel.emoji}</div><div><div style={{fontSize:'13px',fontWeight:500,color:'#F8F4EE'}}>{communityLevel.label}</div><div style={{fontSize:'11px',color:'rgba(248,244,238,0.5)'}}>Community score</div></div><div style={{marginLeft:'auto',fontFamily:"'Playfair Display', Georgia, serif",fontSize:'24px',color:'#C47B2B',fontWeight:600}}>{communityScore.total_points}</div></div>
                {communityLevel.nextPoints&&(<div style={{marginBottom:'12px'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'rgba(248,244,238,0.45)',marginBottom:'4px'}}><span>{communityScore.total_points} pts</span><span>{communityLevel.nextPoints} to reach {communityLevel.next}</span></div><div style={{height:'6px',background:'rgba(255,255,255,0.1)',borderRadius:'3px'}}><div style={{width:`${Math.min(100,(communityScore.total_points/communityLevel.nextPoints)*100)}%`,height:'100%',background:'#C47B2B',borderRadius:'3px'}}/></div></div>)}
                <div style={{display:'grid',gap:'6px',marginBottom:'12px'}}>{[{label:'Home set up',pts:50,done:communityScore.total_points>=50},{label:'First job logged',pts:100,done:communityScore.first_job_logged},{label:`${communityScore.jobs_shared||0} jobs shared`,pts:75,done:(communityScore.jobs_shared||0)>0,perItem:true},{label:`${communityScore.systems_detailed||0} systems detailed`,pts:25,done:(communityScore.systems_detailed||0)>0,perItem:true}].map(item=>(<div key={item.label} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px'}}><span style={{color:item.done?'#6AAF8A':'rgba(248,244,238,0.3)'}}>{item.done?'✓':'○'}</span><span style={{color:item.done?'rgba(248,244,238,0.8)':'rgba(248,244,238,0.4)',flex:1}}>{item.label}</span><span style={{color:'#C47B2B',fontWeight:500}}>+{item.pts}{(item as any).perItem?' ea':''}</span></div>))}</div>
                <a href="/neighbors" style={{display:'block',background:'rgba(248,244,238,0.1)',border:'1px solid rgba(248,244,238,0.15)',color:'rgba(248,244,238,0.8)',textAlign:'center',padding:'8px',borderRadius:'8px',fontSize:'12px',textDecoration:'none',fontFamily:"'DM Sans', sans-serif"}}>View neighbor contributions →</a>
              </div>)}

              {/* This month */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'16px'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(30,58,47,0.08)'}}><h4 style={{fontSize:'12px',fontWeight:500,letterSpacing:'1px',textTransform:'uppercase',color:'#8A8A82'}}>This Month</h4></div>
                <div style={{padding:'12px 16px'}}>{tmTasks.length===0?<div style={{fontSize:'12px',color:'#8A8A82'}}>Nothing due this month.</div>:tmTasks.map((task,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',marginBottom:i<tmTasks.length-1?'8px':0}}><span style={{color:task.urgency==='high'?'#E57373':task.urgency==='medium'?'#C47B2B':'#6AAF8A',fontSize:'8px',flexShrink:0}}>●</span><span style={{color:'#1A1A18',lineHeight:1.4}}>{task.title}</span></div>))}</div>
                <div style={{padding:'10px 16px',borderTop:'1px solid rgba(30,58,47,0.06)'}}><button onClick={()=>setActiveTab('maintenance')} style={{background:'none',border:'none',fontSize:'12px',color:'#3D7A5A',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",fontWeight:500,padding:0}}>View full calendar →</button></div>
              </div>

              {/* Weather — compact, links to environment tab */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'16px',cursor:'pointer'}} onClick={()=>setActiveTab('environment')}>
                {weatherLoading?<div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'24px'}}>⛅</span><span style={{fontSize:'13px',color:'#8A8A82'}}>Loading weather...</span></div>:weather?<div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'24px'}}>{weather.emoji}</span><div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>{weather.temp}° · {weather.desc}</div><div style={{fontSize:'11px',color:'#8A8A82'}}>{home?.city}, {home?.state}</div></div><span style={{fontSize:'11px',color:'#3D7A5A',fontWeight:500}}>View →</span></div>:<div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'24px'}}>⛅</span><span style={{fontSize:'13px',color:'#8A8A82'}}>Weather unavailable</span></div>}
                {showActiveStorm&&!stormIsFuture&&(<div style={{background:'#FBF0DC',padding:'8px 16px',borderTop:'1px solid rgba(196,123,43,0.15)'}}><div style={{fontSize:'12px',fontWeight:500,color:'#7A4A10'}}>⚠️ {weather.recentStorm.label} — tap to view storm center</div></div>)}
                {showActiveStorm&&stormIsFuture&&(<div style={{background:'#E6F2F8',padding:'8px 16px',borderTop:'1px solid rgba(58,124,168,0.15)'}}><div style={{fontSize:'12px',fontWeight:500,color:'#3A7CA8'}}>🌨️ {weather.recentStorm.label} incoming — tap to view</div></div>)}
              </div>

              {/* Quick actions */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'18px',marginBottom:'16px'}}>
                <h4 style={{fontSize:'13px',fontWeight:500,marginBottom:'14px',color:'#1E3A2F'}}>Quick actions</h4>
                {[{label:'+ Log a job',onClick:()=>setActiveTab('log')},{label:'👤 Invite a home member',onClick:()=>{setActiveTab('home_details');setTimeout(()=>setShowInviteForm(true),100)}},{label:'✨ Add a project to wish list',onClick:()=>setActiveTab('projects')},{label:'+ Add another property',href:'/onboarding'},{label:'📄 Share report card',href:'/report',target:'_blank'},{label:'📖 Browse guides',href:'/guides'}].map((a:any)=>a.href?<a key={a.label} href={a.href} target={a.target} style={{display:'block',padding:'9px 0',fontSize:'13px',color:'#1E3A2F',textDecoration:'none',borderBottom:'1px solid rgba(30,58,47,0.07)'}}>{a.label}</a>:<button key={a.label} onClick={a.onClick} style={{display:'block',width:'100%',padding:'9px 0',fontSize:'13px',color:'#1E3A2F',background:'none',border:'none',borderBottom:'1px solid rgba(30,58,47,0.07)',cursor:'pointer',textAlign:'left',fontFamily:"'DM Sans', sans-serif"}}>{a.label}</button>)}
              </div>

              <div style={{background:'#fff',border:'1px solid rgba(155,44,44,0.15)',borderRadius:'16px',padding:'18px'}}>
                <h4 style={{fontSize:'13px',fontWeight:500,color:'#9B2C2C',marginBottom:'8px'}}>Danger zone</h4>
                <p style={{fontSize:'12px',color:'#8A8A82',lineHeight:1.6,marginBottom:'12px'}}>Permanently removes all your homes, systems, jobs, and health scores.</p>
                <button onClick={handleDeleteAccount} disabled={deletingAccount} style={{background:'none',border:'1px solid rgba(155,44,44,0.3)',color:'#9B2C2C',fontSize:'12px',padding:'8px 14px',borderRadius:'8px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",width:'100%'}}>{deletingAccount?'Deleting...':'Delete my account'}</button>
              </div>
            </div>
          </div>
        )}
        {/* ══ HOME DETAILS ══ */}
        {activeTab==='home_details'&&(
          <div>
            <h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',fontWeight:400,color:'#1E3A2F',marginBottom:'20px'}}>Home Details</h2>

            {[{key:'about',title:'About This Home'}].map(sec=>(
              <div key={sec.key} style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'16px 20px',borderBottom:expandedSections.has(sec.key)?'1px solid rgba(30,58,47,0.08)':'none',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>{if(editingHomeSection===sec.key)setEditingHomeSection(null);else startEditSection(sec.key)}}>
                  <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'16px',fontWeight:400,color:'#1E3A2F'}}>{sec.title}</h3>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>{savedSection===sec.key?<span style={{fontSize:'12px',color:'#3D7A5A',fontWeight:500,background:'#EAF2EC',padding:'3px 10px',borderRadius:'20px'}}>✓ Saved</span>:<span style={{fontSize:'12px',color:'#3D7A5A',fontWeight:500}}>{editingHomeSection===sec.key?'Cancel ✕':'Edit ✎'}</span>}<span style={{fontSize:'12px',color:'#8A8A82'}}>{expandedSections.has(sec.key)?'▲':'▼'}</span></div>
                </div>
                {expandedSections.has(sec.key)&&sec.key==='about'&&(
                  <div style={{padding:'20px'}}>
                    {editingHomeSection==='about'?(
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        {[{label:'Street address',key:'address'},{label:'City',key:'city'},{label:'State',key:'state'},{label:'ZIP',key:'zip'},{label:'Year built',key:'year_built'},{label:'Square footage',key:'sqft'},{label:'Bedrooms',key:'bedrooms'},{label:'Bathrooms',key:'bathrooms'},{label:'Stories',key:'stories'},{label:'Lot size (acres)',key:'lot_size'}].map(f=>(<div key={f.key}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>{f.label}</label><input value={homeEdits[f.key]||''} onChange={e=>setHomeEdits((p:any)=>({...p,[f.key]:e.target.value}))} style={iS}/></div>))}
                        <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Home type</label><select value={homeEdits.home_type||''} onChange={e=>setHomeEdits((p:any)=>({...p,home_type:e.target.value}))} style={iS}><option value="">Unknown</option><option value="single_family">Single family</option><option value="townhouse">Townhouse</option><option value="condo">Condo</option><option value="multi_family">Multi-family</option><option value="mobile_home">Mobile home</option></select></div>
                        <div style={{gridColumn:'1/-1'}}><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',flexWrap:'wrap'}}><div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'6px'}}>My relationship to this home</label><div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{[{value:'owner_occupied',label:'🏡 I live here'},{value:'rental',label:'🔑 I rent this out'},{value:'former',label:'📦 Former home'}].map(opt=>(<button key={opt.value} type="button" onClick={()=>setHomeEdits((p:any)=>({...p,occupancy_status:opt.value}))} style={{padding:'7px 12px',borderRadius:'8px',fontSize:'13px',border:`1px solid ${homeEdits.occupancy_status===opt.value?'#1E3A2F':'rgba(30,58,47,0.2)'}`,background:homeEdits.occupancy_status===opt.value?'#1E3A2F':'#fff',color:homeEdits.occupancy_status===opt.value?'#F8F4EE':'#1E3A2F',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",fontWeight:homeEdits.occupancy_status===opt.value?500:400}}>{opt.label}</button>))}</div></div><div style={{flexShrink:0}}><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'6px'}}>HOA</label><div style={{display:'flex',gap:'6px'}}>{[{value:true,label:'Yes'},{value:false,label:'No'}].map(opt=>(<button key={String(opt.value)} type="button" onClick={()=>setHomeEdits((p:any)=>({...p,has_hoa:opt.value}))} style={{padding:'7px 14px',borderRadius:'8px',fontSize:'13px',border:`1px solid ${homeEdits.has_hoa===opt.value?'#1E3A2F':'rgba(30,58,47,0.2)'}`,background:homeEdits.has_hoa===opt.value?'#1E3A2F':'#fff',color:homeEdits.has_hoa===opt.value?'#F8F4EE':'#1E3A2F',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",fontWeight:homeEdits.has_hoa===opt.value?500:400}}>{opt.label}</button>))}</div></div></div></div>
                        <div style={{gridColumn:'1/-1',display:'flex',gap:'8px',marginTop:'4px'}}><button onClick={()=>saveHomeSection('about')} disabled={saving} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>{saving?'Saving...':'Save'}</button><button onClick={()=>setEditingHomeSection(null)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'9px 16px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button></div>
                      </div>
                    ):(
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                        <div style={{gridColumn:'1/-1',marginBottom:'8px',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}><span style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'5px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:500,background:home?.occupancy_status==='rental'?'#E6F2F8':home?.occupancy_status==='former'?'#F5F5F5':'#EAF2EC',color:home?.occupancy_status==='rental'?'#3A7CA8':home?.occupancy_status==='former'?'#8A8A82':'#3D7A5A'}}>{home?.occupancy_status==='rental'?'🔑 I rent this out':home?.occupancy_status==='former'?'📦 Former home':'🏡 I live here'}</span>{details?.has_hoa&&<span style={{background:'#E6F2F8',color:'#3A7CA8',padding:'5px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:500}}>🏘️ HOA</span>}</div>
                      {[{label:'Address',value:home?.address},{label:'City / State / ZIP',value:`${home?.city||''}${home?.state?`, ${home.state}`:''}${home?.zip?` ${home.zip}`:''}`},{label:'Year built',value:home?.year_built},{label:'Home type',value:(details?.home_type||home?.home_type)?.replace('_',' ')},{label:'Sq ft',value:details?.sqft?`${details.sqft.toLocaleString()} sq ft`:null},{label:'Beds / Baths',value:details?.bedrooms?`${details.bedrooms} bd · ${details.bathrooms||'?'} ba`:null},{label:'Stories',value:details?.stories},{label:'Lot size',value:details?.lot_size?`${details.lot_size} acres`:null}].filter(s=>s.value).map(stat=>(<div key={stat.label} style={{fontSize:'13px'}}><span style={{color:'#8A8A82'}}>{stat.label}: </span><span style={{fontWeight:500,textTransform:'capitalize'}}>{stat.value}</span></div>))}

                      </div>
                    )}
                  </div>
                )}
                {expandedSections.has(sec.key)&&sec.key==='features'&&(
                  <div style={{padding:'20px'}}>
                    {editingHomeSection==='features'?(
                      <div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                          <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Foundation</label><select value={homeEdits.foundation_type||''} onChange={e=>setHomeEdits((p:any)=>({...p,foundation_type:e.target.value}))} style={iS}><option value="">Unknown</option><option value="full_basement">Full basement</option><option value="partial_basement">Partial basement</option><option value="crawl_space">Crawl space</option><option value="slab">Slab</option><option value="pier_beam">Pier and beam</option></select></div>
                          <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Garage</label><select value={homeEdits.garage||''} onChange={e=>setHomeEdits((p:any)=>({...p,garage:e.target.value}))} style={iS}><option value="">None</option><option value="attached">Attached</option><option value="detached">Detached</option><option value="carport">Carport</option></select></div>
                          <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Tree coverage</label><select value={homeEdits.tree_coverage||''} onChange={e=>setHomeEdits((p:any)=>({...p,tree_coverage:e.target.value}))} style={iS}><option value="">Unknown</option><option value="heavy">Heavy</option><option value="moderate">Moderate</option><option value="light">Light</option><option value="none">None</option></select></div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>{[{label:'Fireplace',key:'has_fireplace'},{label:'Sump pump',key:'has_sump_pump'},{label:'Pool / hot tub',key:'has_pool'},{label:'Solar panels',key:'has_solar'},{label:'Septic system',key:'has_septic'},{label:'Well water',key:'has_well_water'},{label:'HOA',key:'has_hoa'}].map(cb=>(<label key={cb.key} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',cursor:'pointer'}}><input type="checkbox" checked={homeEdits[cb.key]||false} onChange={e=>setHomeEdits((p:any)=>({...p,[cb.key]:e.target.checked}))} style={{accentColor:'#1E3A2F',width:'16px',height:'16px'}}/>{cb.label}</label>))}</div>
                        <div style={{display:'flex',gap:'8px'}}><button onClick={()=>saveHomeSection('features')} disabled={saving} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>{saving?'Saving...':'Save'}</button><button onClick={()=>setEditingHomeSection(null)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'9px 16px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button></div>
                      </div>
                    ):(
                      <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>

                        {!details?.foundation_type&&!details?.has_fireplace&&!details?.garage&&<span style={{fontSize:'13px',color:'#8A8A82'}}>Tap to add structure and features.</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Home Members */}
            <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'24px'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'16px',fontWeight:400,color:'#1E3A2F'}}>Home Members</h3>
                  <p style={{fontSize:'11px',color:'#8A8A82',marginTop:'2px'}}>People with access to this home</p>
                </div>
                <button onClick={()=>{setShowInviteForm(!showInviteForm);setInviteSent(false)}} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'7px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>+ Invite member</button>
              </div>
              {showInviteForm&&(
                <div style={{padding:'16px 20px',background:'#F8F4EE',borderBottom:'1px solid rgba(30,58,47,0.08)'}}>
                  {inviteSent?(
                    <div style={{background:'#EAF2EC',border:'1px solid rgba(61,122,90,0.2)',borderRadius:'8px',padding:'12px 16px',fontSize:'13px',color:'#3D7A5A',textAlign:'center'}}>Invitation sent to {inviteEmail}</div>
                  ):(
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div>
                        <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'4px'}}>First name</label>
                        <input type="text" value={inviteFirstName} onChange={e=>setInviteFirstName(e.target.value)} placeholder="Jane" style={{width:'100%',padding:'8px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none',boxSizing:'border-box' as const}}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'4px'}}>Last name</label>
                        <input type="text" value={inviteLastName} onChange={e=>setInviteLastName(e.target.value)} placeholder="Smith" style={{width:'100%',padding:'8px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none',boxSizing:'border-box' as const}}/>
                      </div>
                      <div style={{gridColumn:'1/-1'}}>
                        <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'4px'}}>Email address</label>
                        <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@example.com" style={{width:'100%',padding:'8px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none',boxSizing:'border-box' as const}}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'4px'}}>Role</label>
                        <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{width:'100%',padding:'8px 10px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'DM Sans', sans-serif",outline:'none',background:'#fff'}}>
                          <option value="co_owner">Co-owner</option>
                          <option value="property_manager">Property manager</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      <div style={{display:'flex',gap:'8px',alignItems:'flex-end'}}>
                        <button onClick={sendInvite} disabled={inviteSending||!inviteEmail.trim()} style={{flex:1,background:inviteEmail.trim()?'#C47B2B':'rgba(196,123,43,0.3)',color:'#fff',border:'none',padding:'8px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:inviteEmail.trim()?'pointer':'not-allowed',fontFamily:"'DM Sans', sans-serif"}}>{inviteSending?'Sending...':'Send invite'}</button>
                        <button onClick={()=>setShowInviteForm(false)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'8px 12px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {homeMembers.length===0&&homeInvites.length===0&&!showInviteForm&&(
                <div style={{padding:'20px',textAlign:'center'}}>
                  <p style={{fontSize:'13px',color:'#8A8A82',lineHeight:1.6}}>No other members yet. Invite a co-owner, property manager, or viewer.</p>
                </div>
              )}
              {homeMembers.length>0&&(
                <div>
                  {homeMembers.map((m:any)=>(
                    <div key={m.user_id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 20px',borderBottom:'1px solid rgba(30,58,47,0.06)'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#1E3A2F',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'#F8F4EE',flexShrink:0,fontWeight:500}}>{(m.email||'?')[0].toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{m.first_name&&m.last_name?m.first_name+' '+m.last_name:m.email}</div>
                        {m.first_name&&<div style={{fontSize:'11px',color:'#8A8A82'}}>{m.email}</div>}
                        <div style={{fontSize:'11px',color:'#8A8A82',textTransform:'capitalize'}}>{(m.role||'').replace(/_/g,' ')}</div>
                      </div>
                      <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',background:'#EAF2EC',color:'#3D7A5A',fontWeight:500}}>Active</span>
                    </div>
                  ))}
                </div>
              )}
              {homeInvites.length>0&&(
                <div style={{borderTop:homeMembers.length>0?'1px solid rgba(30,58,47,0.08)':'none'}}>
                  {homeMembers.length>0&&<div style={{padding:'8px 20px',background:'#F8F4EE'}}><span style={{fontSize:'11px',fontWeight:600,color:'#8A8A82',textTransform:'uppercase',letterSpacing:'0.05em'}}>Pending invites</span></div>}
                  {homeInvites.map((inv:any)=>(
                    <div key={inv.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 20px',borderBottom:'1px solid rgba(30,58,47,0.06)'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'rgba(196,123,43,0.15)',border:'1px dashed rgba(196,123,43,0.40)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'#C47B2B',flexShrink:0,fontWeight:500}}>{(inv.email||'?')[0].toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{inv.first_name&&inv.last_name?inv.first_name+' '+inv.last_name:inv.email}</div>
                        {inv.first_name&&<div style={{fontSize:'11px',color:'#8A8A82'}}>{inv.email}</div>}
                        <div style={{fontSize:'11px',color:'#8A8A82',textTransform:'capitalize'}}>{(inv.role||'').replace(/_/g,' ')} · Invited {new Date(inv.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',background:'#FBF0DC',color:'#C47B2B',fontWeight:500}}>Pending</span>
                        <button onClick={()=>cancelInvite(inv.id)} style={{background:'none',border:'none',color:'#8A8A82',cursor:'pointer',fontSize:'13px',padding:'2px 6px',borderRadius:'4px'}} title="Cancel invite">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            <div style={{marginBottom:'8px'}}><h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F'}}>Home Systems</h3></div>
            {/* CORE SYSTEMS tile grid */}
            <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F',marginBottom:'8px',letterSpacing:'0.5px'}}>Core systems</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:'8px',marginBottom:'20px'}}>
              {CORE_SYSTEMS.map(st=>{
                const ex=systems.find((s:any)=>s.system_type===st)
                const cond=ex?getCondition(ex):null
                const age=ex?(ex.replacement_year||ex.install_year)?new Date().getFullYear()-(ex.replacement_year||ex.install_year):null:null
                const lifespan=SYSTEM_LIFESPANS[st]||20
                const pct=age?Math.min(100,Math.round((age/lifespan)*100)):0
                const hasSafetyFlag=ex&&(ex.has_broken_glass||ex.locks_not_functioning||ex.any_broken_glass||ex.panel_type?.includes('Federal Pacific')||ex.panel_type?.includes('Zinsco'))
                return(
                  <div key={st}
                    onClick={()=>{if(ex){startEditSystem(ex);setSystemModal(ex)}else{addSystem(st)}}}
                    style={{background:'#fff',border:`1px solid ${hasSafetyFlag?'#E24B4A':ex?'rgba(30,58,47,0.15)':'rgba(30,58,47,0.1)'}`,borderRadius:'12px',padding:'12px',cursor:'pointer',position:'relative'}}>
                    {hasSafetyFlag&&<div style={{position:'absolute',top:'6px',right:'6px',width:'8px',height:'8px',borderRadius:'50%',background:'#E24B4A'}}/>}
                    <div style={{fontSize:'20px',marginBottom:'6px'}}>{SYSTEM_ICONS[st]||'🔧'}</div>
                    <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F',marginBottom:'2px'}}>{SYSTEM_DISPLAY_NAMES[st]||st}</div>
                    {ex&&!ex.not_applicable?(
                      <div>
                        <div style={{fontSize:'10px',color:cond?.textColor||'#8A8A82',fontWeight:500}}>{cond?.label||'Set up'}</div>
                        {age&&<div style={{fontSize:'10px',color:'#8A8A82',marginTop:'1px'}}>{age} yrs old</div>}
                        {age&&<div style={{height:'3px',background:'#EDE8E0',borderRadius:'2px',marginTop:'4px',overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:cond?.color||'#3D7A5A',borderRadius:'2px'}}/></div>}
                      </div>
                    ):ex?.not_applicable?(
                      <div style={{fontSize:'10px',color:'#8A8A82'}}>Not applicable</div>
                    ):(
                      <div style={{fontSize:'10px',color:'#C47B2B',fontWeight:500}}>Tap to set up</div>
                    )}
                  </div>
                )
              })}
            </div>
            {systems.some(s=>s.not_applicable)&&<button onClick={()=>setShowHiddenSystems(!showHiddenSystems)} style={{background:'none',border:'none',color:'#8A8A82',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",padding:'8px 0',marginBottom:'20px'}}>{showHiddenSystems?'Hide not applicable systems':`Show ${systems.filter(s=>s.not_applicable).length} hidden systems`}</button>}

            <div style={{marginTop:'8px',marginBottom:'8px'}}><h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F'}}>Appliances</h3></div>
            {/* APPLIANCES tile grid */}
            <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F',marginBottom:'4px',letterSpacing:'0.5px'}}>Appliances</div>
            <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'8px'}}>Track individual appliances — we'll flag aging and maintenance reminders</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:'8px',marginBottom:'20px'}}>
              {APPLIANCES.map(at=>{
                const ex=systems.find((s:any)=>s.system_type===at)
                const cond=ex?getCondition(ex):null
                const ageYear=ex?.purchase_year||ex?.install_year
                const age=ageYear?new Date().getFullYear()-ageYear:null
                const lifespan=SYSTEM_LIFESPANS[at]||12
                const pct=age?Math.min(100,Math.round((age/lifespan)*100)):0
                return(
                  <div key={at}
                    onClick={()=>{if(ex){startEditSystem(ex);setSystemModal(ex)}else{addSystem(at)}}}
                    style={{background:'#fff',border:`1px solid ${ex?'rgba(30,58,47,0.15)':'rgba(30,58,47,0.1)'}`,borderRadius:'12px',padding:'12px',cursor:'pointer'}}>
                    <div style={{fontSize:'20px',marginBottom:'6px'}}>{SYSTEM_ICONS[at]||'🔧'}</div>
                    <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F',marginBottom:'2px'}}>{SYSTEM_DISPLAY_NAMES[at]||at}</div>
                    {ex&&!ex.not_applicable?(
                      <div>
                        <div style={{fontSize:'10px',color:cond?.textColor||'#8A8A82',fontWeight:500}}>{cond?.label||'Set up'}</div>
                        {age&&<div style={{fontSize:'10px',color:'#8A8A82',marginTop:'1px'}}>{age} yrs old</div>}
                        {age&&<div style={{height:'3px',background:'#EDE8E0',borderRadius:'2px',marginTop:'4px',overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:cond?.color||'#3D7A5A',borderRadius:'2px'}}/></div>}
                      </div>
                    ):ex?.not_applicable?(
                      <div style={{fontSize:'10px',color:'#8A8A82'}}>Not applicable</div>
                    ):(
                      <div style={{fontSize:'10px',color:'#C47B2B',fontWeight:500}}>Tap to set up</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* SITUATIONAL SYSTEMS tile grid */}
            <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F',marginBottom:'4px',letterSpacing:'0.5px'}}>Situational systems</div>
            <div style={{fontSize:'11px',color:'#8A8A82',marginBottom:'8px'}}>Only applies to some homes — mark as not applicable if yours doesn't have them</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:'8px',marginBottom:'16px'}}>
              {SITUATIONAL_SYSTEMS.map(st=>{
                const ex=systems.find((s:any)=>s.system_type===st)
                const cond=ex?getCondition(ex):null
                const age=ex?(ex.replacement_year||ex.install_year)?new Date().getFullYear()-(ex.replacement_year||ex.install_year):null:null
                const lifespan=SYSTEM_LIFESPANS[st]||20
                const pct=age?Math.min(100,Math.round((age/lifespan)*100)):0
                return(
                  <div key={st}
                    onClick={()=>{if(ex){startEditSystem(ex);setSystemModal(ex)}else{addSystem(st)}}}
                    style={{background:'#fff',border:`1px solid ${ex?'rgba(30,58,47,0.15)':'rgba(30,58,47,0.1)'}`,borderRadius:'12px',padding:'12px',cursor:'pointer',opacity:ex?.not_applicable?0.5:1}}>
                    <div style={{fontSize:'20px',marginBottom:'6px'}}>{SYSTEM_ICONS[st]||'🔧'}</div>
                    <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F',marginBottom:'2px'}}>{SYSTEM_DISPLAY_NAMES[st]||st}</div>
                    {ex&&!ex.not_applicable?(
                      <div>
                        <div style={{fontSize:'10px',color:cond?.textColor||'#8A8A82',fontWeight:500}}>{cond?.label||'Set up'}</div>
                        {age&&<div style={{fontSize:'10px',color:'#8A8A82',marginTop:'1px'}}>{age} yrs old</div>}
                        {age&&<div style={{height:'3px',background:'#EDE8E0',borderRadius:'2px',marginTop:'4px',overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:cond?.color||'#3D7A5A',borderRadius:'2px'}}/></div>}
                      </div>
                    ):ex?.not_applicable?(
                      <div style={{fontSize:'10px',color:'#8A8A82'}}>Not applicable</div>
                    ):(
                      <div style={{fontSize:'10px',color:'#C47B2B',fontWeight:500}}>Tap to set up</div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        )}
        {/* ══ FINANCIAL ══ */}
        {activeTab==='financial'&&home&&(
          <FinancialTab
            home={home}
            jobs={jobs}
            systems={systems}
            details={details}
            deferred={deferred}
            thisYearSpend={thisYearSpend}
            thisYearJobs={thisYearJobs}
          />
        )}
                {activeTab==='log'&&home&&user&&<HomeLog homeId={home.id} userId={user.id} userName={displayName||user.email||''} zip={home.zip||''} systems={systems} jobs={jobs} onActivityUpdate={async()=>{const{data:j}=await supabase.from('home_activity').select('*').eq('home_id',home.id).order('created_at',{ascending:false});if(j)setJobs(j)}} />}
        {activeTab==='projects'&&<ProjectsTab homeId={home?.id} userId={user?.id}/>}
        {activeTab==='maintenance'&&<MaintenanceTab systems={systems} home={home} jobs={jobs} onTabChange={setActiveTab} userId={user?.id||''} onJobsRefresh={async()=>{const{data:j}=await supabase.from('home_activity').select('*').eq('home_id',home.id).order('created_at',{ascending:false});if(j)setJobs(j)}} />}

        {/* ══ ENVIRONMENT ══ */}
        {activeTab==='environment'&&home&&(
          <div style={{padding:'20px'}}>
            <h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',fontWeight:400,color:'#1E3A2F',marginBottom:'4px'}}>Your Home's Environment</h2>
            <p style={{fontSize:'13px',color:'#8A8A82',marginBottom:'20px'}}>{home.address}{home.city?', '+home.city:''}{home.state?' '+home.state:''} {home.zip||''}</p>

            {envLoading&&<div style={{textAlign:'center' as const,padding:'40px',color:'#8A8A82',fontSize:'13px'}}>Loading your environment profile...</div>}

            {!envLoading&&!envData&&<div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'24px',textAlign:'center' as const}}>
              <div style={{fontSize:'13px',color:'#8A8A82',marginBottom:'12px'}}>We need your ZIP code to load environment data.</div>
              <button onClick={()=>setActiveTab('home_details')} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'9px 18px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Add your address</button>
            </div>}

            {!envLoading&&envData&&(<>

              {/* ── Weather & Storm Center ── */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#E6F1FB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>⛅</div>
                  <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Weather & storm center</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>{home?.city}, {home?.state}</div></div>
                  {weather&&<div style={{textAlign:'right' as const}}><div style={{fontSize:'20px',fontWeight:500,color:'#1E3A2F'}}>{weather.temp}°</div><div style={{fontSize:'10px',color:'#8A8A82'}}>{weather.desc}</div></div>}
                </div>
                {showActiveStorm&&!stormIsFuture&&(<div style={{background:'#FBF0DC',padding:'11px 16px',borderBottom:'1px solid rgba(196,123,43,0.15)'}}><div style={{fontSize:'13px',fontWeight:500,color:'#7A4A10'}}>⚠️ {weather?.recentStorm?.label} — {weather?.recentStorm?.date?new Date(weather.recentStorm.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px',lineHeight:1.5}}>Walk your property and document any damage with photos before contacting contractors.</div></div>)}
                {showActiveStorm&&stormIsFuture&&(<div style={{background:'#E6F2F8',padding:'11px 16px',borderBottom:'1px solid rgba(58,124,168,0.15)'}}><div style={{fontSize:'13px',fontWeight:500,color:'#3A7CA8'}}>🌨️ {weather?.recentStorm?.label} forecast — {weather?.recentStorm?.date?new Date(weather.recentStorm.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>Check gutters and clear drains before it hits.</div></div>)}
                {stormHistory.length>0&&(
                  <div style={{padding:'12px 16px'}}>
                    <div style={{fontSize:'11px',fontWeight:500,color:'#8A8A82',textTransform:'uppercase' as const,letterSpacing:'1px',marginBottom:'8px'}}>Storm history</div>
                    {stormHistory.slice(0,3).map((storm:any)=>{const daysAgo=Math.round((Date.now()-new Date(storm.event_date).getTime())/(1000*60*60*24));return(<div key={storm.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(30,58,47,0.06)'}}><div><div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F'}}>{storm.notes||storm.event_type?.replace(/_/g,' ')}</div><div style={{fontSize:'10px',color:'#8A8A82'}}>{new Date(storm.event_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}{storm.max_windspeed>0?` · ${Math.round(storm.max_windspeed)} mph`:''}</div></div><span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'10px',background:daysAgo<=21?'#FBF0DC':'#F5F5F5',color:daysAgo<=21?'#7A4A10':'#8A8A82'}}>{daysAgo===0?'Today':`${daysAgo}d ago`}</span></div>)})}
                  </div>
                )}
                {!stormHistory.length&&!showActiveStorm&&<div style={{padding:'12px 16px',fontSize:'12px',color:'#8A8A82'}}>No storm events on record for your area.</div>}
              </div>

              {(envData.radon_zone===1||envData.lead_paint_risk||envData.asbestos_risk||['AE','A','VE'].includes(envData.flood_zone))&&(
                <div style={{background:'#FEF5F5',border:'1px solid rgba(226,75,74,0.2)',borderRadius:'14px',padding:'16px 18px',marginBottom:'12px'}}>
                  <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'1px',textTransform:'uppercase' as const,color:'#791F1F',marginBottom:'10px'}}>Safety alerts for your home</div>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:'8px'}}>
                    {envData.radon_zone===1&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>☢️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#791F1F'}}>High radon risk area</div><div style={{fontSize:'12px',color:'#9B2C2C',marginTop:'2px',lineHeight:1.5}}>{envData.radon_action}</div></div></div>}
                    {envData.lead_paint_risk&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>⚠️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#791F1F'}}>Lead paint probable — built before 1978</div><div style={{fontSize:'12px',color:'#9B2C2C',marginTop:'2px',lineHeight:1.5}}>Test before any renovation or sanding. EPA-certified contractors required for renovation work in pre-1978 homes.</div></div></div>}
                    {envData.asbestos_risk&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>⚠️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#791F1F'}}>Asbestos materials probable — built before 1980</div><div style={{fontSize:'12px',color:'#9B2C2C',marginTop:'2px',lineHeight:1.5}}>Common in insulation, floor tiles, roof shingles, and drywall of this era. Test before any demolition or renovation.</div></div></div>}
                    {['AE','A','VE'].includes(envData.flood_zone)&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🌊</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#791F1F'}}>High flood hazard — FEMA Zone {envData.flood_zone}</div><div style={{fontSize:'12px',color:'#9B2C2C',marginTop:'2px',lineHeight:1.5}}>{envData.flood_action}</div></div></div>}
                  </div>
                </div>
              )}

              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#E6F1FB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🌡️</div>
                  <div><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Your climate</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>IECC Zone {envData.climate_zone} · USDA Zone {envData.hardiness_zone}</div></div>
                </div>
                <div style={{padding:'14px 18px',display:'flex',flexDirection:'column' as const,gap:'12px'}}>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>❄️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Frost dates</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>Last spring frost: <strong>{envData.frost_date_last_spring}</strong> · First fall frost: <strong>{envData.frost_date_first_fall}</strong> · {envData.growing_days} growing days/year</div></div></div>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🌧️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Average rainfall — {envData.avg_precipitation}" per year</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>{envData.avg_precipitation>50?'High rainfall — check gutters and drainage annually':envData.avg_precipitation>30?'Moderate rainfall — standard gutter maintenance':'Low rainfall — irrigation likely needed'}</div></div></div>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>☀️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>UV index — avg {envData.avg_uv_index}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>{envData.uv_implications}</div></div></div>
                  {envData.freeze_risk_days>0&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🧊</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Freeze risk — ~{envData.freeze_risk_days} days/year</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>Insulate exposed pipes before November. Check weatherstripping annually.</div></div></div>}
                  {envData.solar_potential_kwh&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>⚡</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Solar potential — ~{envData.solar_potential_kwh.toLocaleString()} kWh/yr estimated</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>Based on a typical 25-panel system · State avg: {envData.avg_utility_electric}¢/kWh</div></div></div>}
                  {envData.daylight_summer&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🌅</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Daylight hours</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px'}}>Summer peak: <strong>{envData.daylight_summer}</strong> · Winter low: <strong>{envData.daylight_winter}</strong> · Best months for outdoor projects: {envData.daylight_best_months}</div></div></div>}
                </div>
              </div>

              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#EAF3DE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🌱</div>
                  <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Soil & garden</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>{envData.soil_type} · Zone {envData.hardiness_zone} · {envData.soil_drainage} drainage</div></div>
                  <button onClick={()=>setShowAddCrop(true)} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'6px 12px',borderRadius:'8px',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",flexShrink:0}}>+ Add crop</button>
                </div>

                {/* Soil info */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(30,58,47,0.06)',background:'#F8F4EE'}}>
                  <div style={{fontSize:'12px',color:'#8A8A82',marginBottom:'4px'}}>{envData.soil_desc}</div>
                  <div style={{fontSize:'12px',color:'#1E3A2F'}}><strong>Gardening tip:</strong> {envData.soil_gardening}</div>
                </div>

                {/* Planting calendar */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(30,58,47,0.06)'}}>
                  <div style={{fontSize:'11px',fontWeight:500,color:'#1E3A2F',marginBottom:'7px'}}>Planting calendar — Zone {envData.hardiness_zone}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'2px',marginBottom:'5px'}}>
                    {['J','F','M','A','M','J','J','A','S','O','N','D'].map((mo,i)=>{const ls=envData.frost_date_last_spring?new Date(envData.frost_date_last_spring+' 2024').getMonth():3;const ff=envData.frost_date_first_fall?new Date(envData.frost_date_first_fall+' 2024').getMonth():9;const growing=i>=ls&&i<=ff;const peak=i>=ls+1&&i<=ff-1;return <div key={i} style={{textAlign:'center' as const}}><div style={{fontSize:'8px',color:'#8A8A82',marginBottom:'2px'}}>{mo}</div><div style={{height:'18px',borderRadius:'2px',background:peak?'#FAEEDA':growing?'#EAF3DE':'#F5F5F5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px'}}>{peak?'🌿':growing?'🌱':''}</div></div>})}
                  </div>
                  <div style={{display:'flex',gap:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'10px',color:'#8A8A82'}}><div style={{width:'8px',height:'8px',borderRadius:'2px',background:'#EAF3DE'}}/>Planting</div>
                    <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'10px',color:'#8A8A82'}}><div style={{width:'8px',height:'8px',borderRadius:'2px',background:'#FAEEDA'}}/>Peak</div>
                  </div>
                </div>

                {/* Zone-specific recommendations */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(30,58,47,0.06)'}}>
                  <div style={{fontSize:'11px',fontWeight:500,color:'#1E3A2F',marginBottom:'6px'}}>Vegetables for Zone {envData.hardiness_zone}</div>
                  <div style={{fontSize:'10px',color:'#8A8A82',fontWeight:500,marginBottom:'4px'}}>COOL SEASON — Plant {envData.frost_date_last_spring?`${new Date(envData.frost_date_last_spring+' 2024').toLocaleDateString('en-US',{month:'short'})} & ${new Date(envData.frost_date_first_fall+' 2024').toLocaleDateString('en-US',{month:'short'})}`:''}</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:'5px',marginBottom:'8px'}}>
                    {(parseFloat(envData.hardiness_zone?.split('-')[0]||'7')<=5?['Lettuce','Kale','Broccoli','Brussels sprouts','Carrots','Peas','Radishes']:parseFloat(envData.hardiness_zone?.split('-')[0]||'7')<=7?['Lettuce','Spinach','Kale','Broccoli','Carrots','Peas','Radishes']:['Lettuce','Collards','Mustard greens','Swiss chard','Turnips']).map((v:string)=><span key={v} style={{background:'#E6F1FB',color:'#0C447C',padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:500}}>{v}</span>)}
                  </div>
                  <div style={{fontSize:'10px',color:'#8A8A82',fontWeight:500,marginBottom:'4px'}}>WARM SEASON — Plant {envData.frost_date_last_spring||'after last frost'}</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:'5px',marginBottom:'10px'}}>
                    {(parseFloat(envData.hardiness_zone?.split('-')[0]||'7')<=5?['Tomatoes','Peppers','Squash','Beans','Basil']:parseFloat(envData.hardiness_zone?.split('-')[0]||'7')<=7?['Tomatoes','Peppers','Cucumbers','Squash','Beans','Basil','Eggplant']:['Sweet potatoes','Okra','Peppers','Eggplant','Southern peas']).map((v:string)=><span key={v} style={{background:'#FAEEDA',color:'#633806',padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:500}}>{v}</span>)}
                  </div>
                  <div style={{fontSize:'11px',fontWeight:500,color:'#1E3A2F',marginBottom:'5px'}}>Perennial flowers</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:'5px',marginBottom:'8px'}}>
                    {(parseFloat(envData.hardiness_zone?.split('-')[0]||'7')<=5?['Black-eyed Susan','Purple coneflower','Bee balm','Sedum','Baptisia','Russian sage']:parseFloat(envData.hardiness_zone?.split('-')[0]||'7')<=7?['Black-eyed Susan','Purple coneflower','Salvia','Baptisia','Phlox','Rudbeckia','Aster','Sedum']:['Lantana','Salvia','Agapanthus','Canna','Gaillardia','Verbena']).map((v:string)=><span key={v} style={{background:'#EAF3DE',color:'#27500A',padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:500}}>{v}</span>)}
                  </div>
                  <div style={{fontSize:'11px',fontWeight:500,color:'#1E3A2F',marginBottom:'5px'}}>Native plants</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:'5px'}}>
                    {envData.native_plants?.map((p:string)=><span key={p} style={{background:'var(--color-background-secondary,#F5F5F5)',color:'#5F5E5A',padding:'3px 8px',borderRadius:'20px',fontSize:'10px',fontWeight:500}}>{p}</span>)}
                  </div>
                </div>

                {/* Crop cards */}
                <div style={{padding:'12px 16px'}}>
                  <div style={{fontSize:'11px',fontWeight:500,color:'#1E3A2F',marginBottom:'8px'}}>Your crops {crops.length>0?`· ${crops.length} growing`:''}</div>
                  {crops.length===0&&<div style={{fontSize:'12px',color:'#8A8A82',marginBottom:'8px'}}>No crops tracked yet. Add your first one to get personalized reminders and harvest tracking.</div>}
                  {crops.map((crop:any)=>{
                    const planted=crop.date_planted?new Date(crop.date_planted):null
                    const harvestStart=crop.expected_harvest_start?new Date(crop.expected_harvest_start):null
                    const harvestEnd=crop.expected_harvest_end?new Date(crop.expected_harvest_end):null
                    const now=new Date()
                    const harvestReady=harvestStart&&now>=harvestStart&&(!harvestEnd||now<=harvestEnd)
                    const harvestSoon=harvestStart&&!harvestReady&&harvestStart.getTime()-now.getTime()<14*24*60*60*1000
                    const totalDays=planted&&harvestStart?Math.round((harvestStart.getTime()-planted.getTime())/(1000*60*60*24)):null
                    const elapsedDays=planted?Math.round((now.getTime()-planted.getTime())/(1000*60*60*24)):null
                    const progress=totalDays&&elapsedDays?Math.min(100,Math.round((elapsedDays/totalDays)*100)):null
                    return(
                      <div key={crop.id} style={{background:harvestReady?'#EAF3DE':harvestSoon?'#FAEEDA':'var(--color-background-secondary,#F8F8F8)',borderRadius:'10px',padding:'12px',marginBottom:'8px',border:`1px solid ${harvestReady?'rgba(61,122,90,0.3)':harvestSoon?'rgba(196,123,43,0.3)':'rgba(30,58,47,0.08)'}`}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'6px'}}>
                          <div>
                            <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{crop.name}</div>
                            <div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>{crop.crop_type}{crop.location?` · ${crop.location}`:''}{planted?` · Planted ${planted.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:''}</div>
                          </div>
                          <div style={{display:'flex',gap:'6px'}}>
                            {harvestReady&&<span style={{background:'#EAF3DE',color:'#27500A',fontSize:'10px',fontWeight:500,padding:'2px 7px',borderRadius:'20px'}}>🌿 Harvest ready</span>}
                            {harvestSoon&&<span style={{background:'#FAEEDA',color:'#633806',fontSize:'10px',fontWeight:500,padding:'2px 7px',borderRadius:'20px'}}>Soon</span>}
                          </div>
                        </div>
                        {progress!==null&&<div style={{marginBottom:'8px'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'#8A8A82',marginBottom:'3px'}}><span>Growing</span><span>{harvestStart?harvestStart.toLocaleDateString('en-US',{month:'short',day:'numeric'}):''}</span></div><div style={{height:'4px',background:'rgba(30,58,47,0.1)',borderRadius:'2px'}}><div style={{width:`${progress}%`,height:'100%',background:harvestReady?'#3D7A5A':harvestSoon?'#C47B2B':'#1E3A2F',borderRadius:'2px'}}/></div></div>}
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>{setShowGardenLog(crop.id);setGardenLogType('watered')}} style={{flex:1,background:'#fff',border:'0.5px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'6px 0',borderRadius:'7px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>💧 Water</button>
                          <button onClick={()=>{setShowGardenLog(crop.id);setGardenLogType('fertilized')}} style={{flex:1,background:'#fff',border:'0.5px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'6px 0',borderRadius:'7px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>🌿 Feed</button>
                          <button onClick={()=>{setShowGardenLog(crop.id);setGardenLogType('harvested')}} style={{flex:1,background:'#fff',border:'0.5px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'6px 0',borderRadius:'7px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>🧺 Harvest</button>
                          <button onClick={()=>archiveCrop(crop.id)} style={{background:'#fff',border:'0.5px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'6px 8px',borderRadius:'7px',fontSize:'11px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>×</button>
                        </div>
                        {showGardenLog===crop.id&&(
                          <div style={{marginTop:'8px',padding:'10px',background:'#fff',borderRadius:'8px',border:'0.5px solid rgba(30,58,47,0.15)'}}>
                            <select value={gardenLogType} onChange={e=>setGardenLogType(e.target.value)} style={{width:'100%',padding:'7px',borderRadius:'7px',border:'1px solid rgba(30,58,47,0.2)',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",marginBottom:'6px',background:'#fff'}}>
                              <option value="watered">💧 Watered</option>
                              <option value="fertilized">🌿 Fertilized</option>
                              <option value="harvested">🧺 Harvested</option>
                              <option value="pruned">✂️ Pruned</option>
                              <option value="treated">🛡️ Treated for pests</option>
                              <option value="noted">📝 Note</option>
                            </select>
                            <input value={gardenLogNotes} onChange={e=>setGardenLogNotes(e.target.value)} placeholder="Notes (optional)" style={{width:'100%',padding:'7px',borderRadius:'7px',border:'1px solid rgba(30,58,47,0.2)',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",marginBottom:'6px',boxSizing:'border-box' as const}}/>
                            <div style={{display:'flex',gap:'6px'}}>
                              <button onClick={()=>logGardenActivity(crop.id,crop.name)} style={{flex:1,background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'7px',borderRadius:'7px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Log</button>
                              <button onClick={()=>setShowGardenLog(null)} style={{background:'none',border:'0.5px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'7px 12px',borderRadius:'7px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add crop modal */}
                {showAddCrop&&(
                  <div style={{margin:'0 16px 16px',padding:'14px',background:'#F8F4EE',borderRadius:'10px',border:'0.5px solid rgba(30,58,47,0.15)'}}>
                    <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F',marginBottom:'10px'}}>Add a crop</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                      <div><label style={{fontSize:'10px',color:'#8A8A82',display:'block',marginBottom:'3px'}}>Crop name *</label><input value={newCrop.name} onChange={e=>setNewCrop((p:any)=>({...p,name:e.target.value}))} placeholder="e.g. Tomatoes" style={{width:'100%',padding:'7px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",boxSizing:'border-box' as const}}/></div>
                      <div><label style={{fontSize:'10px',color:'#8A8A82',display:'block',marginBottom:'3px'}}>Type</label><select value={newCrop.crop_type} onChange={e=>setNewCrop((p:any)=>({...p,crop_type:e.target.value}))} style={{width:'100%',padding:'7px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",background:'#fff'}}><option value="vegetable">Vegetable</option><option value="flower">Flower</option><option value="herb">Herb</option><option value="fruit">Fruit</option><option value="native">Native plant</option><option value="other">Other</option></select></div>
                      <div><label style={{fontSize:'10px',color:'#8A8A82',display:'block',marginBottom:'3px'}}>Date planted</label><input type="date" value={newCrop.date_planted} onChange={e=>setNewCrop((p:any)=>({...p,date_planted:e.target.value}))} style={{width:'100%',padding:'7px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",boxSizing:'border-box' as const}}/></div>
                      <div><label style={{fontSize:'10px',color:'#8A8A82',display:'block',marginBottom:'3px'}}>Location</label><input value={newCrop.location} onChange={e=>setNewCrop((p:any)=>({...p,location:e.target.value}))} placeholder="Raised bed, front yard..." style={{width:'100%',padding:'7px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",boxSizing:'border-box' as const}}/></div>
                      <div><label style={{fontSize:'10px',color:'#8A8A82',display:'block',marginBottom:'3px'}}>Water reminder (days)</label><input type="number" value={newCrop.water_interval_days} onChange={e=>setNewCrop((p:any)=>({...p,water_interval_days:e.target.value}))} placeholder="e.g. 2" style={{width:'100%',padding:'7px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",boxSizing:'border-box' as const}}/></div>
                      <div><label style={{fontSize:'10px',color:'#8A8A82',display:'block',marginBottom:'3px'}}>Fertilize reminder (days)</label><input type="number" value={newCrop.fertilize_interval_days} onChange={e=>setNewCrop((p:any)=>({...p,fertilize_interval_days:e.target.value}))} placeholder="e.g. 14" style={{width:'100%',padding:'7px',border:'1px solid rgba(30,58,47,0.2)',borderRadius:'7px',fontSize:'12px',fontFamily:"'DM Sans', sans-serif",boxSizing:'border-box' as const}}/></div>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={addCrop} style={{flex:1,background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'9px',borderRadius:'8px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Add crop</button>
                      <button onClick={()=>setShowAddCrop(false)} style={{background:'none',border:'0.5px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'9px 14px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Pollen & Air Quality ── */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#FAEEDA',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🌸</div>
                  <div><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Pollen & air quality</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>Zone {envData.hardiness_zone} seasonal calendar</div></div>
                </div>
                <div style={{padding:'14px 18px'}}>
                  {envData.pollen_tree&&[
                    {label:'Tree pollen',season:envData.pollen_tree,color:'#EF9F27',intensity:0.85},
                    {label:'Grass pollen',season:envData.pollen_grass,color:'#639922',intensity:0.70},
                    {label:'Ragweed',season:envData.pollen_ragweed,color:'#E24B4A',intensity:0.90},
                    {label:'Mold spores',season:envData.pollen_mold,color:'#888780',intensity:0.60},
                  ].map(p=>(
                    <div key={p.label} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                      <div style={{fontSize:'12px',color:'#8A8A82',width:'90px',flexShrink:0}}>{p.label}</div>
                      <div style={{flex:1,height:'6px',background:'rgba(30,58,47,0.08)',borderRadius:'3px',overflow:'hidden'}}><div style={{width:`${p.intensity*100}%`,height:'100%',background:p.color,borderRadius:'3px'}}/></div>
                      <div style={{fontSize:'11px',color:'#8A8A82',width:'70px',textAlign:'right' as const,flexShrink:0}}>{p.season}</div>
                    </div>
                  ))}
                  <div style={{marginTop:'10px',padding:'10px 12px',background:'#EAF3DE',borderRadius:'8px'}}>
                    <div style={{fontSize:'12px',fontWeight:500,color:'#27500A',marginBottom:'2px'}}>💨 HVAC filter tip</div>
                    <div style={{fontSize:'11px',color:'#3B6D11',lineHeight:1.5}}>Worst pollen months in your zone: <strong>{envData.pollen_worst_months}</strong>. Use MERV 11+ filters and change monthly during peak season. Consider upgrading to MERV 13 if household members have allergies.</div>
                  </div>
                </div>
              </div>

              {/* ── Pest Risk ── */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#FCEBEB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🐛</div>
                  <div><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Pest risk</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>Common in your region</div></div>
                </div>
                <div style={{padding:'14px 18px',display:'flex',flexDirection:'column' as const,gap:'10px'}}>
                  {envData.pest_termite&&[
                    {icon:'🐜',name:'Termites',risk:envData.pest_termite,tips:{very_high:'Termite populations are very active here. Annual professional inspection strongly recommended. Consider preventive baiting system.',high:'Active termite populations. Annual inspection recommended. Inspect foundation sills and wood-to-soil contact annually.',moderate:'Moderate termite risk. Inspect foundation perimeter every 2-3 years.',low:'Low termite risk in your region. No specific action required.'}},
                    {icon:'🦟',name:'Mosquitoes',risk:envData.pest_mosquito,tips:{very_high:'Extreme mosquito pressure. Eliminate all standing water. Consider mosquito treatments for yard May–Oct.',high:'High mosquito season. Check gutters and low areas after rain. Eliminate standing water.',moderate:'Moderate mosquito pressure seasonally. Standard precautions apply.',low:'Low mosquito pressure. No specific action needed.'}},
                    {icon:'🦌',name:'Deer pressure',risk:envData.pest_deer,tips:{very_high:'Very high deer activity. Choose deer-resistant plants. Consider fencing for vegetable gardens.',high:'High deer activity. Inspect young trees for rubbing damage. Use deer-resistant plants in garden.',moderate:'Moderate deer activity. Take precautions with young trees and garden beds.',low:'Low deer pressure in your area.'}},
                    {icon:'🐭',name:'Rodents',risk:envData.pest_rodent,tips:{very_high:'High rodent risk. Seal all gaps around pipes, foundation, and vents.',high:'Seal gaps around pipes and foundation before fall. Check attic and crawl space annually.',moderate:'Seasonal entry risk. Seal gaps before October.',low:'Low rodent risk. Standard home sealing applies.'}},
                  ].map(pest=>{
                    const badgeColor=pest.risk==='very_high'||pest.risk==='high'?{bg:'#FCEBEB',text:'#791F1F'}:pest.risk==='moderate'?{bg:'#FAEEDA',text:'#633806'}:{bg:'#EAF3DE',text:'#27500A'}
                    return(
                      <div key={pest.name} style={{display:'flex',gap:'10px',paddingBottom:'10px',borderBottom:'0.5px solid rgba(30,58,47,0.08)'}}>
                        <span style={{fontSize:'16px',flexShrink:0,marginTop:'1px'}}>{pest.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                            <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{pest.name}</div>
                            <span style={{fontSize:'10px',fontWeight:500,padding:'2px 7px',borderRadius:'20px',background:badgeColor.bg,color:badgeColor.text}}>{pest.risk.replace('_',' ')}</span>
                          </div>
                          <div style={{fontSize:'12px',color:'#8A8A82',lineHeight:1.5}}>{pest.tips[pest.risk as keyof typeof pest.tips]}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Water Quality ── */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#E6F1FB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>💧</div>
                  <div><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Water quality</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>Municipal supply · {home?.state} average</div></div>
                </div>
                <div style={{padding:'14px 18px',display:'flex',flexDirection:'column' as const,gap:'10px'}}>
                  {envData.water_hardness_level&&(()=>{
                    const hwColor=envData.water_hardness_level==='very_hard'?{bg:'#FCEBEB',text:'#791F1F'}:envData.water_hardness_level==='hard'?{bg:'#FAEEDA',text:'#633806'}:{bg:'#EAF3DE',text:'#27500A'}
                    return(
                      <div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                          <div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Water hardness — {envData.water_hardness_avg} mg/L avg</div>
                          <span style={{fontSize:'10px',fontWeight:500,padding:'2px 7px',borderRadius:'20px',background:hwColor.bg,color:hwColor.text}}>{(envData.water_hardness_level||'').replace('_',' ')}</span>
                        </div>
                        <div style={{fontSize:'12px',color:'#8A8A82',lineHeight:1.5,marginBottom:'8px'}}>{envData.water_hardness_desc}</div>
                        {(envData.water_hardness_level==='hard'||envData.water_hardness_level==='very_hard')&&(
                          <div style={{padding:'9px 12px',background:'#EAF3DE',borderRadius:'8px',fontSize:'11px',color:'#27500A',lineHeight:1.5}}>
                            Hard water tip: Flush your water heater annually and check the anode rod every 3 years. Consider a water softener to extend appliance life by 20–30%.
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  <div style={{display:'flex',gap:'10px',paddingTop:'2px'}}><span style={{fontSize:'16px',flexShrink:0}}>📋</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Annual water quality report</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px',lineHeight:1.5}}>Your water utility publishes a Consumer Confidence Report (CCR) every year. Search "{home?.city||home?.state} water quality report CCR" to find your local report.</div></div></div>
                  {systems.find((s:any)=>s.system_type==='well')&&<div style={{padding:'9px 12px',background:'#FAEEDA',borderRadius:'8px',fontSize:'11px',color:'#633806',lineHeight:1.5}}>You have a well system logged — test your well water annually for bacteria and nitrates. Every 5 years test for heavy metals and VOCs.</div>}
                </div>
              </div>

              {/* ── Risk Profile ── */}
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'14px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#FCEBEB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>🛡️</div>
                  <div><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F'}}>Risk profile</div><div style={{fontSize:'11px',color:'#8A8A82',marginTop:'1px'}}>Natural hazards for your area</div></div>
                </div>
                <div style={{padding:'14px 18px',display:'flex',flexDirection:'column' as const,gap:'12px'}}>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🌊</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>Flood — FEMA Zone {envData.flood_zone}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px',lineHeight:1.5}}>{envData.flood_desc}</div></div></div>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🌨️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{envData.hail_label}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px',lineHeight:1.5}}>{envData.hail_action}</div></div></div>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>☢️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{envData.radon_label} — Zone {envData.radon_zone}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px',lineHeight:1.5}}>{envData.radon_desc}</div></div></div>
                  <div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'16px',flexShrink:0}}>🏔️</span><div><div style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{envData.earthquake_label}</div><div style={{fontSize:'12px',color:'#8A8A82',marginTop:'2px',lineHeight:1.5}}>{envData.earthquake_action}</div></div></div>
                </div>
              </div>

            </>)}
          </div>
        )}

        {/* ══ DOCUMENTS ══ */}
        {activeTab==='documents'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}><div><h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'22px',fontWeight:400,color:'#1E3A2F',marginBottom:'4px'}}>Document Vault</h2><p style={{fontSize:'13px',color:'#8A8A82'}}>{docs.length} document{docs.length!==1?'s':''} · Transfers with your home</p></div><button onClick={()=>setShowUploadForm(!showUploadForm)} style={{background:'#C47B2B',color:'#fff',border:'none',padding:'10px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>+ Upload</button></div>
            <div style={{background:'#EAF2EC',border:'1px solid rgba(61,122,90,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'16px',display:'flex',gap:'8px'}}><span style={{fontSize:'14px',flexShrink:0}}>🔒</span><div style={{fontSize:'12px',color:'#3D7A5A',lineHeight:1.6}}><strong>Private and secure.</strong> Store home-related files only — warranties, permits, inspection reports, manuals.</div></div>
            {expiringDocs.length>0&&(<div style={{background:'#FBF0DC',border:'1px solid rgba(196,123,43,0.2)',borderRadius:'10px',padding:'12px 16px',marginBottom:'16px'}}><div style={{fontSize:'13px',fontWeight:500,color:'#7A4A10',marginBottom:'6px'}}>⚠️ {expiringDocs.length} document{expiringDocs.length>1?'s':''} expiring within 90 days</div>{expiringDocs.map(d=>{const days=Math.ceil((new Date(d.expires_at).getTime()-Date.now())/(1000*60*60*24));return<div key={d.id} style={{fontSize:'12px',color:'#8A8A82'}}>{d.name} — expires in {days} days</div>})}</div>)}
            {showUploadForm&&(
              <div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'22px',marginBottom:'20px'}}>
                <h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F',marginBottom:'16px'}}>Upload a document</h3>
                <div onClick={()=>fileInputRef.current?.click()} style={{border:'2px dashed rgba(30,58,47,0.2)',borderRadius:'12px',padding:'24px',textAlign:'center',cursor:'pointer',background:uploadFile?'#EAF2EC':'#F8F4EE',marginBottom:'14px'}}><div style={{fontSize:'28px',marginBottom:'6px'}}>{uploadFile?'✅':'📎'}</div><div style={{fontSize:'14px',fontWeight:500,color:'#1E3A2F',marginBottom:'3px'}}>{uploadFile?uploadFile.name:'Click to select a file'}</div><div style={{fontSize:'12px',color:'#8A8A82'}}>{uploadFile?formatSize(uploadFile.size):'PDF, JPG, or PNG · Max 10MB'}</div><input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileSelect} style={{display:'none'}}/></div>
                <div style={{display:'grid',gap:'10px'}}>
                  <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Document name *</label><input value={uploadName} onChange={e=>setUploadName(e.target.value)} style={iS} placeholder="e.g. Roof warranty 2021"/></div>
                  <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Description (optional)</label><input value={uploadDesc} onChange={e=>setUploadDesc(e.target.value)} style={iS} placeholder="e.g. 10-year workmanship warranty"/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Category *</label><select value={uploadCategory} onChange={e=>setUploadCategory(e.target.value)} style={iS}>{DOC_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}</select></div>
                    <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Related system</label><select value={uploadSystem} onChange={e=>setUploadSystem(e.target.value)} style={iS}><option value="">None</option>{DOC_SYSTEMS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                  </div>
                  <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Expiration date (optional)</label><input type="date" value={uploadExpires} onChange={e=>setUploadExpires(e.target.value)} style={iS}/></div>
                </div>
                {uploadError&&<div style={{background:'#FDECEA',color:'#9B2C2C',padding:'10px 14px',borderRadius:'8px',fontSize:'13px',marginTop:'12px'}}>{uploadError}</div>}
                <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
                  <button onClick={handleUpload} disabled={uploading||!uploadFile} style={{flex:2,background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'10px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",opacity:uploading||!uploadFile?0.6:1}}>{uploading?'Uploading...':'Upload document'}</button>
                  <button onClick={()=>{setShowUploadForm(false);setUploadFile(null);setUploadError('')}} style={{flex:1,background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'10px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
                </div>
              </div>
            )}
            {docs.length>0&&(<div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}><button onClick={()=>setDocFilter('all')} style={{padding:'6px 14px',borderRadius:'20px',fontSize:'12px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:docFilter==='all'?'#1E3A2F':'#fff',color:docFilter==='all'?'#F8F4EE':'#1E3A2F',outline:'1px solid rgba(30,58,47,0.15)'}}>All ({docs.length})</button>{DOC_CATEGORIES.filter(c=>docs.some(d=>d.category===c.key)).map(cat=><button key={cat.key} onClick={()=>setDocFilter(cat.key)} style={{padding:'6px 14px',borderRadius:'20px',fontSize:'12px',border:'none',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",background:docFilter===cat.key?cat.textColor:cat.color,color:docFilter===cat.key?'#fff':cat.textColor,outline:`1px solid ${cat.textColor}33`}}>{cat.icon} {cat.label} ({docs.filter(d=>d.category===cat.key).length})</button>)}</div>)}
            {docs.length===0&&!showUploadForm&&(<div style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',padding:'48px',textAlign:'center'}}><div style={{fontSize:'44px',marginBottom:'14px'}}>📂</div><h3 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'20px',fontWeight:400,color:'#1E3A2F',marginBottom:'8px'}}>No documents yet</h3><p style={{fontSize:'13px',color:'#8A8A82',lineHeight:1.7,maxWidth:'380px',margin:'0 auto 20px'}}>Store warranties, permits, inspection reports, and manuals here. They transfer automatically when you pass ownership.</p><button onClick={()=>setShowUploadForm(true)} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'11px 22px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Upload your first document</button></div>)}
            {docsByCat.map(cat=>(<div key={cat.key} style={{background:'#fff',border:'1px solid rgba(30,58,47,0.11)',borderRadius:'16px',overflow:'hidden',marginBottom:'16px'}}><div style={{padding:'12px 20px',borderBottom:'1px solid rgba(30,58,47,0.08)',display:'flex',alignItems:'center',gap:'10px',background:cat.color}}><span style={{fontSize:'16px'}}>{cat.icon}</span><h4 style={{fontSize:'13px',fontWeight:500,color:cat.textColor}}>{cat.label}</h4><span style={{fontSize:'11px',color:cat.textColor,opacity:0.7,marginLeft:'auto'}}>{cat.docs.length} file{cat.docs.length!==1?'s':''}</span></div>{cat.docs.map((doc:any,i:number)=>{const isPdf=doc.file_type==='application/pdf';const isImage=doc.file_type?.startsWith('image/');const isExpiring=doc.expires_at&&Math.ceil((new Date(doc.expires_at).getTime()-Date.now())/(1000*60*60*24))<=90;return(<div key={doc.id} style={{padding:'12px 20px',borderBottom:i<cat.docs.length-1?'1px solid rgba(30,58,47,0.06)':'none',display:'flex',alignItems:'center',gap:'12px'}}><div style={{fontSize:'20px',flexShrink:0}}>{isPdf?'📄':isImage?'🖼️':'📎'}</div><div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px',flexWrap:'wrap'}}><span style={{fontSize:'13px',fontWeight:500,color:'#1E3A2F'}}>{doc.name}</span>{doc.system_type&&<span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'20px',background:'#EDE8E0',color:'#8A8A82'}}>{doc.system_type}</span>}{isExpiring&&<span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'20px',background:'#FBF0DC',color:'#C47B2B'}}>⏰ Expiring soon</span>}</div>{doc.description&&<div style={{fontSize:'12px',color:'#8A8A82',marginBottom:'2px'}}>{doc.description}</div>}<div style={{fontSize:'11px',color:'#8A8A82'}}>{formatSize(doc.file_size)}{doc.expires_at&&` · Expires ${new Date(doc.expires_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}{` · Added ${new Date(doc.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}</div></div><div style={{display:'flex',gap:'6px',flexShrink:0}}><button onClick={()=>handleDownload(doc)} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'6px 12px',borderRadius:'8px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",fontWeight:500}}>{isImage?'View':'Download'}</button><button onClick={()=>handleDeleteDoc(doc)} style={{background:'none',border:'1px solid rgba(155,44,44,0.2)',color:'#9B2C2C',padding:'6px 10px',borderRadius:'8px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Delete</button></div></div>)})}</div>))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showHistoryModal&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}><div style={{background:'#fff',borderRadius:'16px',padding:'36px',width:'100%',maxWidth:'480px',textAlign:'center'}}><div style={{fontSize:'48px',marginBottom:'16px'}}>🏠</div><h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'24px',fontWeight:400,color:'#1E3A2F',marginBottom:'10px'}}>This home has a history</h2><p style={{fontSize:'14px',color:'#8A8A82',lineHeight:1.7,marginBottom:'24px'}}>There are {jobs.length} contractor job{jobs.length!==1?'s':''} already logged for this home.</p><div style={{display:'grid',gap:'10px'}}><button onClick={()=>{setShowHistoryModal(false);setActiveTab('log')}} style={{display:'block',width:'100%',background:'#1E3A2F',color:'#F8F4EE',padding:'12px',borderRadius:'10px',fontSize:'14px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",border:'none',textAlign:'center'}}>See this home&apos;s history first</button><button onClick={()=>setShowHistoryModal(false)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'12px',borderRadius:'10px',fontSize:'14px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Start my new homeowner guide</button></div></div></div>)}
      {showClaimedModal&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}><div style={{background:'#fff',borderRadius:'16px',padding:'36px',width:'100%',maxWidth:'480px',textAlign:'center'}}><div style={{fontSize:'48px',marginBottom:'16px'}}>🔑</div><h2 style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'24px',fontWeight:400,color:'#1E3A2F',marginBottom:'10px'}}>This home is now yours</h2><p style={{fontSize:'14px',color:'#8A8A82',lineHeight:1.7,marginBottom:'24px'}}>You now have full access to this home&apos;s complete history.</p><div style={{display:'grid',gap:'10px'}}><button onClick={()=>{setShowClaimedModal(false);setActiveTab('home_details')}} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'12px',borderRadius:'10px',fontSize:'14px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Update home details now</button><button onClick={()=>setShowClaimedModal(false)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'12px',borderRadius:'10px',fontSize:'14px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>I&apos;ll do it later</button></div></div></div>)}

      {/* SYSTEM MODAL */}
      {systemModal&&(()=>{
        const sys=systems.find(s=>s.id===systemModal.id)||systemModal
        const fields=SYSTEM_FIELDS[sys.system_type]||[]
        const essentialFields=fields.filter((f:any)=>!['boolean'].includes(f.type)&&!['Last','last'].some((p:string)=>f.label.startsWith(p))&&f.label!=='Notes'&&f.label!=='Known issues')
        const detailFields=fields.filter((f:any)=>f.type==='boolean'||['Last','last'].some((p:string)=>f.label.startsWith(p)))
        const notesFields=fields.filter((f:any)=>f.label==='Notes'||f.label==='Known issues')
        const autoYear=home?.year_built?parseInt(home.year_built):null
        const getSepticInterval=()=>{const sz=parseInt(systemEdits.tank_size)||1000;const occ=parseInt(systemEdits.occupants)||2;return Math.round(sz/(occ*60))}
        return(
          <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,0.45)'}} onClick={e=>{if(e.target===e.currentTarget)setSystemModal(null)}}>
            <div style={{background:'#F8F4EE',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'640px',maxHeight:'90vh',overflowY:'auto',padding:'0 0 40px'}}>
              {/* Modal header */}
              <div style={{position:'sticky',top:0,background:'#1E3A2F',borderRadius:'20px 20px 0 0',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:10}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'24px'}}>{SYSTEM_ICONS[sys.system_type]||'🔧'}</span>
                  <div>
                    <div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',color:'#F8F4EE',fontWeight:400}}>{SYSTEM_DISPLAY_NAMES[sys.system_type]||sys.system_type}</div>
                    <div style={{fontSize:'11px',color:'rgba(248,244,238,0.5)',marginTop:'1px'}}>Tap fields to update · saves to your home record</div>
                  </div>
                </div>
                <button onClick={()=>setSystemModal(null)} style={{background:'rgba(248,244,238,0.12)',border:'none',color:'#F8F4EE',width:'32px',height:'32px',borderRadius:'50%',fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans', sans-serif"}}>✕</button>
              </div>
              <div style={{padding:'20px 20px 0'}}>

                {/* Safety flags */}
                {(sys.has_broken_glass||sys.any_broken_glass)&&<div style={{padding:'10px 14px',background:'#FEF5F5',borderRadius:'10px',border:'1px solid rgba(226,75,74,0.3)',marginBottom:'12px',fontSize:'12px',fontWeight:500,color:'#791F1F'}}>🔴 Broken glass detected — security + safety risk</div>}
                {sys.locks_not_functioning&&<div style={{padding:'10px 14px',background:'#FEF5F5',borderRadius:'10px',border:'1px solid rgba(226,75,74,0.3)',marginBottom:'12px',fontSize:'12px',fontWeight:500,color:'#791F1F'}}>🔴 Lock not functioning — security vulnerability</div>}
                {(sys.panel_type?.includes('Federal Pacific')||sys.panel_type?.includes('Zinsco'))&&<div style={{padding:'10px 14px',background:'#FEF5F5',borderRadius:'10px',border:'1px solid rgba(226,75,74,0.3)',marginBottom:'12px'}}><div style={{fontSize:'12px',fontWeight:500,color:'#791F1F',marginBottom:'3px'}}>🔴 {sys.panel_type} — known fire hazard</div><div style={{fontSize:'11px',color:'#9B2C2C',lineHeight:1.5}}>Replacement by a licensed electrician is strongly recommended.</div></div>}

                {/* STEP 1 */}
                <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'1px',textTransform:'uppercase' as const,color:'#C47B2B',marginBottom:'6px'}}>Step 1 · The essentials</div>
                <div style={{fontSize:'12px',color:'#8A8A82',marginBottom:'12px',lineHeight:1.5}}>These fields drive your maintenance calendar and cost estimates</div>

                {sys.system_type==='septic'&&systemEdits.tank_size&&systemEdits.occupants&&(
                  <div style={{background:'#1E3A2F',borderRadius:'10px',padding:'12px 14px',marginBottom:'12px'}}>
                    <div style={{fontSize:'10px',color:'rgba(248,244,238,0.5)',marginBottom:'3px'}}>Your calculated pumping schedule</div>
                    <div style={{fontSize:'17px',fontWeight:500,color:'#F8F4EE',marginBottom:'2px'}}>Every {getSepticInterval()} years</div>
                    <div style={{fontSize:'11px',color:'rgba(248,244,238,0.5)'}}>{systemEdits.tank_size} · {systemEdits.occupants} occupants · EPA guideline</div>
                    {systemEdits.last_pumped&&(()=>{const due=parseInt(systemEdits.last_pumped)+getSepticInterval();const overdue=due<new Date().getFullYear();return(<div style={{marginTop:'8px',fontSize:'11px',color:overdue?'#E57373':'#6AAF8A',fontWeight:500}}>{overdue?`⚠️ Overdue — was due ${due}`:`Next due: ${due}`}</div>)})()}
                  </div>
                )}

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                  {essentialFields.map((f:any)=>renderSystemField(f))}
                  {(essentialFields.some((f:any)=>f.label==='Install year'||f.label==='Purchase year'))&&autoYear&&!(systemEdits.install_year||systemEdits.purchase_year)&&(
                    <div style={{gridColumn:'1/-1',fontSize:'11px',color:'#8A8A82',marginTop:'-6px'}}>💡 Pre-filled from your home's build year — update if replaced</div>
                  )}
                </div>

                {/* Condition */}
                <div style={{marginBottom:'14px'}}>
                  <label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'6px'}}>Condition</label>
                  <div style={{display:'flex',gap:'8px'}}>
                    {[
                      {v:'Good',color:'#27500A',bg:'#EAF2EC',border:'#3D7A5A',desc:'No issues, well maintained'},
                      {v:'Fair',color:'#633806',bg:'#FBF0DC',border:'#C47B2B',desc:'Minor wear, worth monitoring'},
                      {v:'Poor',color:'#791F1F',bg:'#FDECEA',border:'#E24B4A',desc:'Needs attention soon'},
                      {v:'Critical',color:'#501313',bg:'#FCEBEB',border:'#791F1F',desc:'Urgent — act now'},
                    ].map(opt=>(
                      <button key={opt.v} onClick={()=>setSystemEdits((p:any)=>({...p,condition:opt.v}))}
                        style={{flex:1,padding:'10px 8px',borderRadius:'10px',border:`${(systemEdits.condition||'Good')===opt.v?'1.5px':'0.5px'} solid ${(systemEdits.condition||'Good')===opt.v?opt.border:'rgba(30,58,47,0.15)'}`,background:(systemEdits.condition||'Good')===opt.v?opt.bg:'#fff',cursor:'pointer',textAlign:'center' as const,fontFamily:"'DM Sans', sans-serif"}}>
                        <div style={{fontSize:'11px',fontWeight:500,color:opt.color,marginBottom:'2px'}}>{opt.v}</div>
                        <div style={{fontSize:'10px',color:opt.color,opacity:0.8,lineHeight:1.3}}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STEP 2 */}
                <div style={{height:'0.5px',background:'rgba(30,58,47,0.1)',margin:'14px 0'}}/>
                <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'1px',textTransform:'uppercase' as const,color:'#C47B2B',marginBottom:'6px'}}>Step 2 · Status</div>
                <div style={{display:'grid',gap:'6px',marginBottom:'14px'}}>
                  {STATUS_OPTIONS.map((opt:any)=>(
                    <button key={opt.v}
                      onClick={()=>setSystemEdits((p:any)=>({...p,system_status:opt.v,not_applicable:opt.v==='not_applicable'}))}
                      style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',borderRadius:'10px',border:`${(systemEdits.system_status||'in_service')===opt.v?'1.5px':'0.5px'} solid ${(systemEdits.system_status||'in_service')===opt.v?'#1E3A2F':'rgba(30,58,47,0.15)'}`,background:(systemEdits.system_status||'in_service')===opt.v?'#F0F5F2':'#fff',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left' as const}}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:opt.dot,flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F'}}>{opt.label}</div>
                        {opt.sub&&<div style={{fontSize:'10px',color:'#8A8A82',marginTop:'1px'}}>{opt.sub}</div>}
                      </div>
                    </button>
                  ))}
                </div>

                {systemEdits.system_status==='recently_replaced'&&(
                  <div style={{background:'#EAF2EC',border:'1px solid rgba(61,122,90,0.2)',borderRadius:'10px',padding:'11px 14px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontSize:'16px'}}>📋</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'12px',fontWeight:500,color:'#1E3A2F'}}>Want to log this replacement?</div>
                      <div style={{fontSize:'11px',color:'#8A8A82',marginTop:'2px'}}>Keep a record of the work done, cost, and contractor.</div>
                    </div>
                    <a href="/log" style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'6px 12px',borderRadius:'7px',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textDecoration:'none',whiteSpace:'nowrap'}}>Log it →</a>
                  </div>
                )}

                {/* STEP 3 */}
                <div style={{height:'0.5px',background:'rgba(30,58,47,0.1)',margin:'14px 0'}}/>
                <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'1px',textTransform:'uppercase' as const,color:'#C47B2B',marginBottom:'6px'}}>Step 3 · Details & service history</div>

                {sys.system_type==='windows'&&(
                  <div style={{display:'grid',gap:'6px',marginBottom:'12px'}}>
                    {[
                      {key:'has_broken_glass',label:'Any broken glass',desc:'Security + safety risk — high urgency',severity:'high'},
                      {key:'locks_not_functioning',label:'Any locks not functioning',desc:'Security vulnerability — repair recommended',severity:'high'},
                      {key:'windows_wont_open',label:"Any windows won\'t open or close",desc:'Egress safety concern',severity:'medium'},
                      {key:'has_fogged_units',label:'Condensation / fogging between panes',desc:'Seal failure — energy loss',severity:'low'},
                      {key:'any_wood_rot',label:'Any wood rot',desc:'Structural concern on wood frames',severity:'medium'},
                    ].map(check=>(
                      <label key={check.key} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',background:check.severity==='high'&&systemEdits[check.key]?'#FEF5F5':check.severity==='medium'&&systemEdits[check.key]?'#FBF0DC':'#F8F4EE',border:`0.5px solid ${check.severity==='high'?'rgba(226,75,74,0.2)':check.severity==='medium'?'rgba(196,123,43,0.2)':'rgba(30,58,47,0.1)'}`,borderRadius:'8px',cursor:'pointer'}}>
                        <input type="checkbox" checked={systemEdits[check.key]||false} onChange={e=>setSystemEdits((p:any)=>({...p,[check.key]:e.target.checked}))} style={{accentColor:check.severity==='high'?'#E24B4A':check.severity==='medium'?'#C47B2B':'#1E3A2F',width:'15px',height:'15px'}}/>
                        <div>
                          <div style={{fontSize:'12px',fontWeight:500,color:check.severity==='high'?'#791F1F':check.severity==='medium'?'#633806':'#1E3A2F'}}>{check.label}</div>
                          <div style={{fontSize:'10px',color:'#8A8A82',marginTop:'1px'}}>{check.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {sys.system_type==='electrical'&&systemEdits.panel_type&&(systemEdits.panel_type.includes('Federal Pacific')||systemEdits.panel_type.includes('Zinsco'))&&(
                  <div style={{padding:'10px 14px',background:'#FEF5F5',borderRadius:'10px',border:'1px solid rgba(226,75,74,0.3)',marginBottom:'12px'}}>
                    <div style={{fontSize:'12px',fontWeight:500,color:'#791F1F',marginBottom:'3px'}}>🔴 {systemEdits.panel_type} — known fire hazard</div>
                    <div style={{fontSize:'11px',color:'#9B2C2C',lineHeight:1.5}}>Replacement by a licensed electrician is strongly recommended.</div>
                  </div>
                )}

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  {detailFields.filter((f:any)=>f.type!=='boolean').map((f:any)=>renderSystemField(f))}
                  <div><label style={{display:'block',fontSize:'11px',color:'#8A8A82',marginBottom:'3px'}}>Notes</label><input value={systemEdits.notes||''} onChange={e=>setSystemEdits((p:any)=>({...p,notes:e.target.value}))} style={iS} placeholder="Anything else worth remembering?"/></div>
                  {notesFields.map((f:any)=>renderSystemField(f))}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginBottom:'16px'}}>
                  {detailFields.filter((f:any)=>f.type==='boolean'&&!['has_broken_glass','locks_not_functioning','windows_wont_open','has_fogged_units','any_wood_rot','considering_replacing'].includes(f.label.toLowerCase().replace(/\s+/g,'_'))).map((f:any)=>renderSystemField(f))}
                  <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',cursor:'pointer'}}><input type="checkbox" checked={systemEdits.under_warranty||false} onChange={e=>setSystemEdits((p:any)=>({...p,under_warranty:e.target.checked}))} style={{accentColor:'#1E3A2F'}}/>Under warranty</label>
                  {systemEdits.under_warranty&&<div style={{gridColumn:'1/-1' as const,display:'flex',alignItems:'center',gap:'8px'}}><label style={{fontSize:'12px',color:'#8A8A82',whiteSpace:'nowrap' as const}}>Warranty expires</label><input type="number" value={systemEdits.warranty_expiry_year||''} onChange={e=>setSystemEdits((p:any)=>({...p,warranty_expiry_year:e.target.value}))} placeholder="Year (e.g. 2031)" style={{...iS,maxWidth:'160px'}}/></div>}
                </div>

                {/* Save / Cancel */}
                <div style={{display:'flex',gap:'10px',paddingTop:'4px'}}>
                  <button onClick={async()=>{await saveSystem(sys.id);if(!saving)setSystemModal(null)}} disabled={saving} style={{flex:1,background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'13px 20px',borderRadius:'12px',fontSize:'14px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>{saving?'Saving...':'Save changes'}</button>
                  <button onClick={()=>setSystemModal(null)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#8A8A82',padding:'13px 18px',borderRadius:'12px',fontSize:'14px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* WISHLIST SYNC MODAL */}
      {wishlistSyncModal&&(
        <div style={{position:'fixed',inset:0,zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)',padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setWishlistSyncModal(null)}}>
          <div style={{background:'#F8F4EE',borderRadius:'16px',padding:'24px',maxWidth:'340px',width:'100%',fontFamily:"'DM Sans', sans-serif"}}>
            <div style={{fontFamily:"'Playfair Display', Georgia, serif",fontSize:'18px',fontWeight:400,color:'#1E3A2F',marginBottom:'8px'}}>{wishlistSyncModal.type==='scheduled'?'Move to planning?':'Update your wishlist?'}</div>
            <div style={{fontSize:'13px',color:'#8A8A82',lineHeight:1.6,marginBottom:'20px'}}>{wishlistSyncModal.type==='scheduled'?<>You scheduled <span style={{fontWeight:500,color:'#1E3A2F'}}>{wishlistSyncModal.sysName} replacement</span> — want to move it from wishlist to planning on your projects?</>:<>You moved {wishlistSyncModal.sysName} back to in service. What should we do with <span style={{fontWeight:500,color:'#1E3A2F'}}>{wishlistSyncModal.sysName} replacement</span> on your project wishlist?</>}</div>
            <div style={{display:'flex',flexDirection:'column' as const,gap:'8px'}}>
              {wishlistSyncModal.type==='scheduled'?(
                <>
                  <button onClick={async()=>{await supabase.from('home_projects').update({status:'planning'}).eq('id',wishlistSyncModal.projectId);setWishlistSyncModal(null)}} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'11px 16px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left' as const}}>Yes — move to planning</button>
                  <button onClick={()=>setWishlistSyncModal(null)} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'11px 16px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left' as const}}>Keep it on wishlist for now</button>
                </>
              ):(
                <>
                  <button onClick={async()=>{await supabase.from('home_projects').delete().eq('id',wishlistSyncModal.projectId);setWishlistSyncModal(null)}} style={{background:'#1E3A2F',color:'#F8F4EE',border:'none',padding:'11px 16px',borderRadius:'10px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left' as const}}>Remove — no longer planning this</button>
                  <button onClick={async()=>{await supabase.from('home_projects').update({status:'wishlist'}).eq('id',wishlistSyncModal.projectId);setWishlistSyncModal(null)}} style={{background:'none',border:'1px solid rgba(30,58,47,0.2)',color:'#1E3A2F',padding:'11px 16px',borderRadius:'10px',fontSize:'13px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",textAlign:'left' as const}}>Keep it — still thinking about it eventually</button>
                </>
              )}
              <button onClick={()=>setWishlistSyncModal(null)} style={{background:'none',border:'none',color:'#8A8A82',padding:'8px',fontSize:'12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* WISHLIST TOAST */}
      {wishlistToast&&(
        <div style={{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',zIndex:2000,background:'#1E3A2F',color:'#F8F4EE',borderRadius:'12px',padding:'12px 18px',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 4px 24px rgba(0,0,0,0.18)',fontFamily:"'DM Sans', sans-serif",minWidth:'280px',maxWidth:'90vw'}}>
          <span style={{fontSize:'16px'}}>✓</span>
          <span style={{fontSize:'13px',flex:1}}>{wishlistToast} replacement added to your wishlist</span>
          <button onClick={()=>{setActiveTab('projects');setWishlistToast(null)}} style={{background:'rgba(248,244,238,0.15)',border:'none',color:'#F8F4EE',fontSize:'12px',fontWeight:500,padding:'5px 10px',borderRadius:'7px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",whiteSpace:'nowrap' as const}}>View →</button>
        </div>
      )}
    </main>
  )
}
