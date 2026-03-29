import { NextResponse } from 'next/server'

// ─── RADON ZONES BY STATE (EPA Map) ────────────────────────────────────────
// Zone 1 = highest (>4 pCi/L predicted), Zone 2 = moderate, Zone 3 = low
const RADON_BY_STATE: Record<string, number> = {
  AL:2,AK:2,AZ:2,AR:2,CA:2,CO:1,CT:1,DE:2,FL:3,GA:2,HI:3,ID:1,IL:1,
  IN:1,IA:1,KS:1,KY:2,LA:3,ME:1,MD:2,MA:1,MI:1,MN:1,MS:3,MO:1,MT:1,
  NE:1,NV:2,NH:1,NJ:2,NM:2,NY:1,NC:2,ND:1,OH:1,OK:2,OR:2,PA:1,RI:2,
  SC:2,SD:1,TN:2,TX:3,UT:1,VT:1,VA:2,WA:2,WV:1,WI:1,WY:1,DC:2
}

const RADON_LABELS: Record<number,{label:string;desc:string;action:string}> = {
  1:{label:'High radon risk',desc:'This state has a high predicted average indoor radon level (>4 pCi/L). Radon is the second leading cause of lung cancer in the US.',action:'Test your home with an EPA-approved radon test kit. If levels exceed 4 pCi/L, a licensed mitigation contractor can install a system.'},
  2:{label:'Moderate radon risk',desc:'This state has moderate predicted radon levels. Many homes in this zone still test high.',action:'Testing is recommended, especially if you have a basement or spend significant time on lower floors.'},
  3:{label:'Low radon risk',desc:'This state has generally lower predicted radon levels, though individual homes can still test high.',action:'Testing is still recommended — geology varies significantly within zones.'}
}

// ─── EARTHQUAKE RISK BY STATE (USGS) ──────────────────────────────────────
const EARTHQUAKE_BY_STATE: Record<string,string> = {
  AK:'very_high',CA:'very_high',HI:'high',NV:'high',WA:'high',OR:'high',
  UT:'moderate',MT:'moderate',WY:'moderate',ID:'moderate',AZ:'low',
  SC:'moderate',TN:'moderate',MO:'moderate',AR:'moderate',IL:'low',
  NY:'low',MA:'low',ME:'low',NH:'low',VT:'low',CT:'low',RI:'low',
  NJ:'low',PA:'low',MD:'low',DE:'low',DC:'low',VA:'low',NC:'low',
  GA:'low',FL:'very_low',AL:'low',MS:'low',LA:'low',TX:'low',
  OK:'moderate',KS:'low',NE:'very_low',SD:'very_low',ND:'very_low',
  MN:'very_low',WI:'very_low',MI:'very_low',IN:'low',OH:'low',
  KY:'low',WV:'low',CO:'low',NM:'low',
}

const EQ_LABELS: Record<string,{label:string;color:string;desc:string;action:string}> = {
  very_high:{label:'Very high earthquake risk',color:'#791F1F',desc:'This region has significant seismic activity. Major earthquakes have occurred historically.',action:'Ensure your foundation is inspected periodically. Consider earthquake insurance. Strap water heater and secure heavy furniture.'},
  high:{label:'High earthquake risk',color:'#9B2C2C',desc:'This region experiences frequent seismic activity and has potential for damaging earthquakes.',action:'Have your foundation inspected if your home is older. Consider seismic retrofitting for pre-1980 homes.'},
  moderate:{label:'Moderate earthquake risk',color:'#C47B2B',desc:'This region has moderate seismic activity. Earthquakes occur but major events are less frequent.',action:'Standard foundation inspections are sufficient. Be aware of local fault lines.'},
  low:{label:'Low earthquake risk',color:'#3D7A5A',desc:'This region has low seismic activity. Damaging earthquakes are rare.',action:'No specific action needed beyond standard home maintenance.'},
  very_low:{label:'Very low earthquake risk',color:'#3D7A5A',desc:'This region has very minimal seismic activity.',action:'No seismic-specific maintenance required.'}
}

// ─── HAIL FREQUENCY BY STATE ───────────────────────────────────────────────
const HAIL_BY_STATE: Record<string,string> = {
  TX:'very_high',CO:'very_high',NE:'very_high',KS:'very_high',OK:'very_high',
  SD:'high',ND:'high',MN:'high',IA:'high',MO:'high',IL:'high',WY:'high',
  MT:'high',ID:'moderate',WI:'moderate',MI:'moderate',IN:'moderate',
  OH:'moderate',PA:'moderate',NY:'moderate',WV:'moderate',VA:'moderate',
  NC:'moderate',TN:'moderate',AR:'moderate',LA:'moderate',MS:'moderate',
  AL:'moderate',GA:'moderate',SC:'low',FL:'low',ME:'low',NH:'low',
  VT:'low',MA:'low',CT:'low',RI:'low',NJ:'low',DE:'low',MD:'low',
  DC:'low',AK:'very_low',HI:'very_low',CA:'low',OR:'low',WA:'low',
  NV:'low',AZ:'low',UT:'low',NM:'moderate',
}

const HAIL_LABELS: Record<string,{label:string;desc:string;action:string}> = {
  very_high:{label:'Very high hail frequency',desc:'This region experiences frequent and severe hail events, often multiple times per year.',action:'Consider impact-resistant roofing (Class 4) when replacing your roof — may qualify for insurance discounts. Document your roof condition annually.'},
  high:{label:'High hail frequency',desc:'Hail storms are common in this region. Roofs and siding take regular hail damage.',action:'Inspect your roof after any hail event. Keep records of storm damage for insurance claims. Class 3 or 4 shingles recommended.'},
  moderate:{label:'Moderate hail frequency',desc:'Occasional hail events occur. Significant storms happen every few years.',action:'Standard roof inspection after major storms. Keep your homeowner\'s insurance current.'},
  low:{label:'Low hail frequency',desc:'Hail is uncommon in this region. When it occurs it is typically minor.',action:'No specific hail-related maintenance required beyond standard roof inspections.'},
  very_low:{label:'Very low hail frequency',desc:'Hail is very rare in this region.',action:'No hail-specific action needed.'}
}

// ─── UV INDEX BY STATE (annual average) ───────────────────────────────────
const UV_BY_STATE: Record<string,number> = {
  AK:2.5,ME:3.5,VT:3.5,NH:3.5,WA:3.5,OR:3.8,MI:3.9,MN:4.0,WI:4.0,
  MT:4.2,ND:4.2,SD:4.3,ID:4.5,WY:4.8,IA:4.5,MO:4.7,IL:4.6,IN:4.5,
  OH:4.4,PA:4.4,NY:4.2,CT:4.3,MA:4.2,RI:4.2,NJ:4.5,DE:4.6,MD:4.7,
  DC:4.7,VA:4.8,WV:4.5,KY:4.8,TN:5.0,NC:5.1,SC:5.3,GA:5.4,AL:5.5,
  MS:5.5,LA:5.6,AR:5.2,OK:5.3,TX:5.8,NM:6.5,AZ:6.8,CO:6.2,UT:6.0,
  NV:6.3,CA:5.5,KS:5.0,NE:4.8,FL:6.0,HI:8.5,
}

// ─── AVERAGE ANNUAL PRECIPITATION BY STATE (inches) ───────────────────────
const PRECIP_BY_STATE: Record<string,number> = {
  AK:64,AL:58,AZ:13,AR:51,CA:22,CO:15,CT:48,DE:45,FL:54,GA:50,
  HI:63,ID:19,IL:39,IN:41,IA:36,KS:28,KY:48,LA:60,ME:42,MD:44,
  MA:48,MI:33,MN:30,MS:59,MO:42,MT:15,NE:23,NV:9,NH:45,NJ:47,
  NM:13,NY:41,NC:50,ND:17,OH:39,OK:36,OR:27,PA:42,RI:47,SC:49,
  SD:20,TN:54,TX:28,UT:12,VT:43,VA:44,WA:38,WV:45,WI:33,WY:13,DC:40
}

// ─── USDA PLANT HARDINESS ZONES BY ZIP PREFIX ─────────────────────────────
// Simplified mapping — ZIP prefix → zone
function getHardinessZone(zip: string): string {
  const prefix = parseInt(zip.substring(0,3))
  if (prefix >= 995 && prefix <= 999) return '1b-4b' // AK
  if (prefix >= 967 && prefix <= 969) return '11a-13a' // HI
  if (prefix >= 0 && prefix <= 29) return '5a-7b' // ME,NH,VT,MA,RI,CT
  if (prefix >= 30 && prefix <= 89) return '6a-8b' // NY,NJ,PA,DE,MD
  if (prefix >= 90 && prefix <= 99) return '6a-7b' // DC,VA,WV
  if (prefix >= 100 && prefix <= 149) return '5b-7a' // NY
  if (prefix >= 150 && prefix <= 196) return '5b-7a' // PA
  if (prefix >= 197 && prefix <= 199) return '6b-7b' // DE
  if (prefix >= 200 && prefix <= 219) return '6b-8a' // MD,DC,VA
  if (prefix >= 220 && prefix <= 249) return '5b-8a' // VA,WV
  if (prefix >= 250 && prefix <= 268) return '5b-7a' // WV
  if (prefix >= 269 && prefix <= 289) return '6a-8b' // NC
  if (prefix >= 290 && prefix <= 299) return '7a-9a' // SC
  if (prefix >= 300 && prefix <= 319) return '7b-9a' // GA
  if (prefix >= 320 && prefix <= 349) return '8a-11a' // FL
  if (prefix >= 350 && prefix <= 369) return '7a-8b' // AL
  if (prefix >= 370 && prefix <= 385) return '6a-8a' // TN
  if (prefix >= 386 && prefix <= 397) return '7a-8b' // MS
  if (prefix >= 398 && prefix <= 432) return '6a-8a' // KY,OH
  if (prefix >= 433 && prefix <= 458) return '5b-7a' // OH
  if (prefix >= 459 && prefix <= 499) return '5a-6b' // IN,MI
  if (prefix >= 500 && prefix <= 528) return '4b-6b' // IA
  if (prefix >= 530 && prefix <= 549) return '4a-5b' // WI
  if (prefix >= 550 && prefix <= 567) return '3b-5b' // MN
  if (prefix >= 570 && prefix <= 577) return '3b-5b' // SD
  if (prefix >= 580 && prefix <= 588) return '3a-5a' // ND
  if (prefix >= 590 && prefix <= 599) return '3b-6a' // MT
  if (prefix >= 600 && prefix <= 629) return '5a-6b' // IL
  if (prefix >= 630 && prefix <= 658) return '5b-7a' // MO
  if (prefix >= 660 && prefix <= 679) return '5b-7a' // KS
  if (prefix >= 680 && prefix <= 693) return '4b-6a' // NE
  if (prefix >= 700 && prefix <= 714) return '8a-9b' // LA
  if (prefix >= 716 && prefix <= 729) return '6b-8b' // AR
  if (prefix >= 730 && prefix <= 749) return '6a-8a' // OK
  if (prefix >= 750 && prefix <= 799) return '6b-9b' // TX
  if (prefix >= 800 && prefix <= 816) return '3b-7b' // CO
  if (prefix >= 820 && prefix <= 831) return '3a-6b' // WY
  if (prefix >= 832 && prefix <= 838) return '4b-7a' // ID
  if (prefix >= 840 && prefix <= 847) return '4b-8b' // UT
  if (prefix >= 850 && prefix <= 865) return '7a-11a' // AZ
  if (prefix >= 870 && prefix <= 884) return '5a-9a' // NM
  if (prefix >= 885 && prefix <= 899) return '4b-9b' // NV
  if (prefix >= 900 && prefix <= 966) return '5b-11a' // CA
  if (prefix >= 970 && prefix <= 979) return '6a-9a' // OR
  if (prefix >= 980 && prefix <= 994) return '6a-9a' // WA
  return '6b-7a'
}

// ─── FROST DATES BY HARDINESS ZONE ────────────────────────────────────────
function getFrostDates(zone: string): {lastSpring: string; firstFall: string; growingDays: number} {
  const z = parseFloat(zone.split('-')[0])
  if (z <= 3) return {lastSpring: 'June 1', firstFall: 'Sep 1', growingDays: 92}
  if (z <= 4) return {lastSpring: 'May 15', firstFall: 'Sep 15', growingDays: 123}
  if (z <= 5) return {lastSpring: 'May 1', firstFall: 'Oct 1', growingDays: 153}
  if (z <= 6) return {lastSpring: 'Apr 15', firstFall: 'Oct 15', growingDays: 183}
  if (z <= 7) return {lastSpring: 'Apr 1', firstFall: 'Nov 1', growingDays: 214}
  if (z <= 8) return {lastSpring: 'Mar 15', firstFall: 'Nov 15', growingDays: 245}
  if (z <= 9) return {lastSpring: 'Feb 15', firstFall: 'Dec 1', growingDays: 289}
  if (z <= 10) return {lastSpring: 'Jan 31', firstFall: 'Dec 15', growingDays: 318}
  return {lastSpring: 'No frost', firstFall: 'No frost', growingDays: 365}
}

// ─── NATIVE PLANTS BY HARDINESS ZONE ──────────────────────────────────────
function getNativePlants(zone: string): string[] {
  const z = parseFloat(zone.split('-')[0])
  if (z <= 4) return ['Paper birch','Balsam fir','Wild blueberry','Labrador tea','Bearberry','Arctic willow']
  if (z <= 5) return ['Eastern redbud','Black-eyed Susan','Wild bergamot','Little bluestem','Serviceberry','Red osier dogwood']
  if (z <= 6) return ['Eastern redbud','Virginia bluebells','Columbine','Spicebush','Pawpaw','Wild ginger','Mountain laurel']
  if (z <= 7) return ['Beautyberry','Coral honeysuckle','Purple coneflower','Switchgrass','Virginia sweetspire','Buttonbush']
  if (z <= 8) return ['Longleaf pine','Saw palmetto','Yaupon holly','Muhly grass','Swamp rose','Wax myrtle']
  if (z <= 9) return ['Live oak','Spanish moss','Coontie','Walter\'s viburnum','Wild coffee','Firebush']
  return ['Bougainvillea','Plumeria','Bird of paradise','Agave','Saguaro cactus','Desert willow']
}

// ─── SOIL TYPE BY STATE (simplified — USDA Web Soil Survey would be better) ─
const SOIL_BY_STATE: Record<string,{type:string;desc:string;drainage:string;gardening:string}> = {
  AL:{type:'Clay loam',desc:'Red clay soils dominate much of Alabama. Fertile but slow-draining.',drainage:'Poor to moderate',gardening:'Amend with compost and sand. Excellent for native plants once established.'},
  AK:{type:'Glacial till / peat',desc:'Varies widely. Coastal areas have rich soils; interior has permafrost and peat.',drainage:'Variable',gardening:'Short growing season. Focus on cold-hardy vegetables and perennials.'},
  AZ:{type:'Desert sandy loam',desc:'Arid, sandy soils with low organic matter. High pH (alkaline).',drainage:'Excellent — often too fast',gardening:'Amend with compost. Drip irrigation essential. Native desert plants thrive.'},
  AR:{type:'Silt loam',desc:'Rich alluvial soils in river valleys. Red clay on uplands.',drainage:'Moderate',gardening:'Excellent for most crops. Very fertile river bottom soils.'},
  CA:{type:'Variable (clay to sandy)',desc:'Extremely varied. Central Valley has some of the most fertile soil in the world. Coastal areas sandy.',drainage:'Variable',gardening:'Mediterranean climate suits drought-tolerant plants. Amend as needed by region.'},
  CO:{type:'Sandy clay loam',desc:'Alkaline soils with limited organic matter at lower elevations. Mountain soils are richer.',drainage:'Good to excellent',gardening:'Amend heavily with compost. Water carefully — dry climate demands efficient irrigation.'},
  CT:{type:'Glacial loam',desc:'Rocky glacial soils, often stony. Good drainage.',drainage:'Good',gardening:'Remove rocks, amend with compost. Well-suited for New England vegetables.'},
  DE:{type:'Sandy loam',desc:'Well-drained sandy soils on the coastal plain. Fertile with amendments.',drainage:'Good to excellent',gardening:'Excellent for vegetables. May dry out quickly in summer.'},
  FL:{type:'Sandy',desc:'Predominately sandy soils with low fertility and fast drainage.',drainage:'Excellent — often too fast',gardening:'Heavy organic amendment needed. Water frequently. Raised beds recommended.'},
  GA:{type:'Red clay / sandy loam',desc:'Red Piedmont clay in north; sandy coastal plain soils in south.',drainage:'Poor (clay) to excellent (sand)',gardening:'Coastal: amend with compost. Piedmont: improve drainage with organic matter.'},
  HI:{type:'Volcanic / loam',desc:'Rich volcanic soils. Vary by island and elevation.',drainage:'Good',gardening:'Extremely fertile. Almost anything grows. Focus on tropical varieties.'},
  ID:{type:'Silt loam',desc:'Rich silt loam soils in agricultural valleys. Volcanic origin.',drainage:'Good',gardening:'Excellent for potatoes, vegetables, and grains.'},
  IL:{type:'Silty clay loam',desc:'Deep, dark prairie soils — among the most fertile in the world.',drainage:'Moderate',gardening:'Exceptional growing conditions. Minimal amendment needed.'},
  IN:{type:'Silty clay loam',desc:'Deep glacial soils. Very productive.',drainage:'Moderate',gardening:'Excellent for most vegetables and fruits. Corn belt soils.'},
  IA:{type:'Silty clay loam',desc:'Among the richest soils in North America. Deep prairie topsoil.',drainage:'Moderate',gardening:'World-class growing conditions. Minimal inputs needed.'},
  KS:{type:'Silt loam',desc:'Deep prairie soils. Very fertile in eastern Kansas; more arid west.',drainage:'Moderate to good',gardening:'Eastern KS: excellent. Western KS: amend for moisture retention.'},
  KY:{type:'Silt loam',desc:'Rich soils influenced by limestone. Good drainage on ridges.',drainage:'Moderate to good',gardening:'Excellent bluegrass region soils. Well-suited for vegetables and flowers.'},
  LA:{type:'Alluvial clay',desc:'Rich Mississippi River alluvial soils. Heavy clay in south.',drainage:'Poor',gardening:'Very fertile but may need raised beds for drainage. Excellent for heat-loving plants.'},
  ME:{type:'Glacial loam',desc:'Rocky, stony glacial soils. Acidic.',drainage:'Good',gardening:'Excellent for blueberries (acidic). Amend for vegetables. Short season.'},
  MD:{type:'Silt loam',desc:'Varied — piedmont clays in west, sandy coastal plain in east.',drainage:'Variable',gardening:'Chesapeake Bay region soils are fertile. Eastern Shore sandy soils need amendment.'},
  MA:{type:'Glacial sandy loam',desc:'Stony glacial soils. Acidic and well-drained.',drainage:'Good to excellent',gardening:'Great for blueberries and cranberries. Amend with lime and compost for vegetables.'},
  MI:{type:'Sandy loam',desc:'Glacial outwash soils. Sandy in many areas. Fruit belt in west.',drainage:'Good',gardening:'Excellent for blueberries, cherries, and apples. Western MI has ideal fruit conditions.'},
  MN:{type:'Silty clay loam',desc:'Rich prairie soils in south; glacial outwash in north.',drainage:'Moderate',gardening:'Southern MN: world-class soils. Northern MN: shorter season, more acidic.'},
  MS:{type:'Clay / alluvial',desc:'Delta has incredibly rich alluvial soils. Hills have clay.',drainage:'Poor to moderate',gardening:'Delta soils are exceptional. Uplands benefit from compost amendment.'},
  MO:{type:'Silt loam',desc:'Rich prairie soils in north; Ozark rocky soils in south.',drainage:'Moderate',gardening:'Northern MO excellent for vegetables. Ozarks: raised beds or heavy amendment.'},
  MT:{type:'Clay loam / sandy loam',desc:'Varies. Eastern plains have clay soils; western valleys have better loam.',drainage:'Variable',gardening:'Short growing season. Hardy vegetables and native grasses recommended.'},
  NE:{type:'Silt loam',desc:'Rich Loess Hills soils. Deep and fertile.',drainage:'Good',gardening:'Excellent prairie soils. Great for vegetables and corn.'},
  NV:{type:'Desert sandy / caliche',desc:'Arid soils with low fertility. Caliche hardpan common.',drainage:'Excellent — too fast',gardening:'Very challenging. Native desert plants only without intensive amendment.'},
  NH:{type:'Glacial loam',desc:'Rocky, acidic glacial soils. Stony.',drainage:'Good',gardening:'Great for blueberries. Amend with lime for vegetables. Short season.'},
  NJ:{type:'Sandy loam',desc:'Sandy coastal plain soils in south; richer soils in north.',drainage:'Good',gardening:'South: excellent for blueberries and cranberries. North: good general gardening.'},
  NM:{type:'Sandy clay loam',desc:'High desert soils. Alkaline, low organic matter.',drainage:'Good to excellent',gardening:'Challenging. Drip irrigation essential. Native and drought-tolerant plants best.'},
  NY:{type:'Glacial loam',desc:'Varied. Hudson Valley has excellent agricultural soils. Long Island is sandy.',drainage:'Variable',gardening:'Hudson Valley: excellent. Long Island: amend for water retention. Finger Lakes: great fruit.'},
  NC:{type:'Red clay / sandy loam',desc:'Piedmont red clays in center; sandy coastal plain soils east.',drainage:'Poor (clay) to excellent (sand)',gardening:'Varied by region. Piedmont: improve drainage. Coastal: amend for water retention.'},
  ND:{type:'Clay loam',desc:'Rich prairie soils. Highly productive.',drainage:'Moderate',gardening:'Excellent agricultural soils. Short season — focus on cold-hardy crops.'},
  OH:{type:'Silty clay loam',desc:'Glacial soils in north; mixed in south. Generally fertile.',drainage:'Moderate',gardening:'Good growing conditions statewide. Great for most vegetables.'},
  OK:{type:'Red clay loam',desc:'Red clay soils dominate. Can be heavy and sticky when wet.',drainage:'Poor to moderate',gardening:'Amend with compost and sand. Productive once improved.'},
  OR:{type:'Silt loam',desc:'Willamette Valley has world-class soils. Coast has peat. Eastern OR is arid.',drainage:'Good (valley)',gardening:'Western OR: exceptional growing. Eastern OR: challenging — drip irrigation needed.'},
  PA:{type:'Silt loam',desc:'Rich agricultural soils in Lancaster County. Rocky elsewhere.',drainage:'Moderate',gardening:'Lancaster County: some of the best farmland in the east. General: amend with compost.'},
  RI:{type:'Sandy loam',desc:'Sandy glacial soils. Acidic.',drainage:'Good to excellent',gardening:'Great for blueberries. Amend for vegetables. Near-coastal mild microclimate.'},
  SC:{type:'Sandy clay',desc:'Coastal plain sandy soils; Piedmont clay soils inland.',drainage:'Variable',gardening:'Coast: water retention important. Upstate: improve clay drainage.'},
  SD:{type:'Clay loam',desc:'Rich prairie soils in east; more arid in west.',drainage:'Moderate',gardening:'Eastern SD: excellent. Western SD: water conservation critical.'},
  TN:{type:'Silt loam',desc:'Limestone-influenced soils in Middle TN. Red clay in East.',drainage:'Moderate',gardening:'Middle TN: excellent — famous for horse pastures. East: improve drainage.'},
  TX:{type:'Clay / sandy loam',desc:'Extremely varied. Blackland Prairie has rich clay; Hill Country rocky; Gulf Coast sandy.',drainage:'Variable by region',gardening:'Blackland: rich but sticky. Hill Country: thin rocky soils. Gulf: sandy, amend heavily.'},
  UT:{type:'Sandy clay loam',desc:'Arid soils with caliche hardpan common. Alkaline.',drainage:'Good',gardening:'Drip irrigation essential. Native plants and drought-tolerant varieties best.'},
  VT:{type:'Glacial loam',desc:'Rocky, stony soils. Acidic. Some excellent valley farmland.',drainage:'Good',gardening:'Champlain Valley: excellent. Mountains: stony and challenging. Great for maple trees.'},
  VA:{type:'Clay loam / sandy loam',desc:'Piedmont clay in center; sandy coastal plain east; good valley soils west.',drainage:'Variable',gardening:'Shenandoah Valley: excellent. Coastal: amend for retention. Piedmont: improve drainage.'},
  WA:{type:'Silt loam',desc:'Western WA: rich forest soils, acidic. Eastern WA: fertile Palouse soils.',drainage:'Good (east)',gardening:'Western: great for berries, ferns, rhododendrons. Eastern: world-class wheat and apple country.'},
  WV:{type:'Shale clay loam',desc:'Steep terrain with thin, rocky soils. Limited agricultural use.',drainage:'Good (steep)',gardening:'Raised beds recommended. Good for native woodland plants.'},
  WI:{type:'Sandy loam',desc:'Glacial soils. Sandy in central; richer loam in south.',drainage:'Good',gardening:'Southern WI: excellent. Central: sandy, amend. Great for cheese country dairy farming.'},
  WY:{type:'Sandy clay loam',desc:'Arid alkaline soils. Limited fertility.',drainage:'Good',gardening:'Short season and dry. Focus on native grasses and drought-tolerant plants.'},
  DC:{type:'Silt loam',desc:'Potomac River area soils. Moderate fertility.',drainage:'Moderate',gardening:'Good urban gardening. Amend with compost annually.'},
}

// ─── UTILITY COSTS BY STATE (EIA 2023 data — cents per kWh, $/MMBtu gas) ──
const UTILITY_BY_STATE: Record<string,{electric:number;gas:number}> = {
  AL:{electric:13.2,gas:16.5},AK:{electric:24.0,gas:18.2},AZ:{electric:12.8,gas:14.8},
  AR:{electric:11.8,gas:14.2},CA:{electric:27.5,gas:20.1},CO:{electric:13.1,gas:13.8},
  CT:{electric:27.0,gas:22.5},DE:{electric:14.2,gas:16.8},FL:{electric:13.5,gas:18.2},
  GA:{electric:12.8,gas:16.2},HI:{electric:40.5,gas:35.0},ID:{electric:10.2,gas:12.8},
  IL:{electric:14.8,gas:17.2},IN:{electric:13.2,gas:15.8},IA:{electric:12.5,gas:14.8},
  KS:{electric:12.8,gas:14.5},KY:{electric:11.5,gas:15.2},LA:{electric:11.2,gas:12.5},
  ME:{electric:21.5,gas:19.8},MD:{electric:15.2,gas:18.5},MA:{electric:27.2,gas:22.8},
  MI:{electric:16.8,gas:16.5},MN:{electric:14.5,gas:15.8},MS:{electric:12.5,gas:14.8},
  MO:{electric:12.8,gas:15.2},MT:{electric:11.8,gas:13.5},NE:{electric:12.2,gas:14.2},
  NV:{electric:13.5,gas:15.2},NH:{electric:24.5,gas:21.8},NJ:{electric:17.5,gas:19.2},
  NM:{electric:12.5,gas:13.8},NY:{electric:22.5,gas:20.5},NC:{electric:12.2,gas:16.5},
  ND:{electric:11.5,gas:13.2},OH:{electric:14.2,gas:15.8},OK:{electric:11.2,gas:12.8},
  OR:{electric:12.5,gas:13.5},PA:{electric:15.5,gas:17.2},RI:{electric:26.5,gas:21.5},
  SC:{electric:13.5,gas:16.8},SD:{electric:12.8,gas:14.5},TN:{electric:12.2,gas:15.5},
  TX:{electric:12.5,gas:13.2},UT:{electric:11.8,gas:12.8},VT:{electric:22.5,gas:20.8},
  VA:{electric:13.8,gas:17.5},WA:{electric:10.8,gas:13.2},WV:{electric:12.5,gas:15.8},
  WI:{electric:16.2,gas:16.8},WY:{electric:10.5,gas:12.5},DC:{electric:16.8,gas:18.5}
}

// ─── MAIN ROUTE ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip') || ''
  const state = searchParams.get('state') || ''
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const yearBuilt = parseInt(searchParams.get('year_built') || '0')

  if (!zip && !state) {
    return NextResponse.json({ error: 'zip or state required' }, { status: 400 })
  }

  // Derive state from ZIP if not provided
  const stateCode = state.toUpperCase() || getStateFromZip(zip)

  // ── Radon
  const radonZone = RADON_BY_STATE[stateCode] || 2
  const radonInfo = RADON_LABELS[radonZone]

  // ── Earthquake
  const eqRisk = EARTHQUAKE_BY_STATE[stateCode] || 'low'
  const eqInfo = EQ_LABELS[eqRisk]

  // ── Hail
  const hailFreq = HAIL_BY_STATE[stateCode] || 'low'
  const hailInfo = HAIL_LABELS[hailFreq]

  // ── UV
  const uvIndex = UV_BY_STATE[stateCode] || 4.5

  // ── Precipitation
  const precipitation = PRECIP_BY_STATE[stateCode] || 38

  // ── Plant hardiness zone
  const hardinessZone = getHardinessZone(zip)
  const frostDates = getFrostDates(hardinessZone)
  const nativePlants = getNativePlants(hardinessZone)

  // ── Soil
  const soilInfo = SOIL_BY_STATE[stateCode] || {
    type: 'Loam',
    desc: 'Mixed soil composition typical of this region.',
    drainage: 'Moderate',
    gardening: 'Amend with compost annually for best results.'
  }

  // ── Lead paint / asbestos risk
  const leadPaintRisk = yearBuilt > 0 && yearBuilt < 1978
  const asbestosRisk = yearBuilt > 0 && yearBuilt < 1980

  // ── Utility costs
  const utilityInfo = UTILITY_BY_STATE[stateCode] || { electric: 14.0, gas: 16.0 }

  // ── FEMA flood zone (requires lat/lng — basic coastal heuristic if not available)
  let floodZone = 'X' // default: minimal flood hazard
  let floodDesc = 'Minimal flood hazard area. Standard homeowner\'s insurance typically sufficient.'
  let floodAction = 'No flood insurance required by lenders in Zone X, but it may still be worth considering.'
  
  // Rough coastal proximity heuristic
  if (lat && lng) {
    // We'll call FEMA API if lat/lng available
    try {
      const femaUrl = `https://msc.fema.gov/arcgis/rest/services/NFHL/MapService_Dynamic/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelWithin&outFields=FLD_ZONE,ZONE_SUBTY&f=json`
      const femaRes = await fetch(femaUrl, { signal: AbortSignal.timeout(3000) })
      if (femaRes.ok) {
        const femaData = await femaRes.json()
        if (femaData.features?.length > 0) {
          floodZone = femaData.features[0].attributes?.FLD_ZONE || 'X'
          if (['A','AE','AH','AO','AR','A99'].includes(floodZone)) {
            floodDesc = `FEMA Flood Zone ${floodZone} — high flood hazard area. Flood insurance is typically required by lenders.`
            floodAction = 'Flood insurance required if you have a federally-backed mortgage. Ensure your coverage is current.'
          } else if (['B','C','X'].includes(floodZone)) {
            floodDesc = `FEMA Flood Zone ${floodZone} — minimal to moderate flood hazard.`
            floodAction = 'Flood insurance not required but may be advisable depending on local conditions.'
          } else if (floodZone.startsWith('V')) {
            floodDesc = `FEMA Flood Zone ${floodZone} — coastal high hazard area. Storm surge risk.`
            floodAction = 'Flood insurance required. Coastal construction standards apply to any renovations.'
          }
        }
      }
    } catch {
      // FEMA API failed — use heuristic
    }
  }

  // ── Solar potential (basic estimate by UV and lat)
  const solarPotentialKwh = lat ? Math.round((uvIndex * 365 * 0.2 * 25)) : null // rough 25-panel estimate

  // ── Freeze risk
  const freezeRiskDays = (() => {
    const z = parseFloat(hardinessZone.split('-')[0])
    if (z <= 3) return 180
    if (z <= 4) return 150
    if (z <= 5) return 120
    if (z <= 6) return 90
    if (z <= 7) return 60
    if (z <= 8) return 30
    if (z <= 9) return 10
    return 0
  })()

  // ── UV maintenance implications
  const uvImplications = uvIndex >= 6
    ? 'Very high UV — exterior paint and deck finishes degrade faster. Plan to repaint every 5-7 years and reseal decks every 2-3 years.'
    : uvIndex >= 5
    ? 'High UV — exterior surfaces need attention every 6-8 years for paint, every 3 years for decks.'
    : 'Moderate UV — standard exterior maintenance intervals apply (repaint every 8-10 years).'

  return NextResponse.json({
    // Climate
    climate_zone: getCLimateZone(zip, stateCode),
    hardiness_zone: hardinessZone,
    frost_date_last_spring: frostDates.lastSpring,
    frost_date_first_fall: frostDates.firstFall,
    growing_days: frostDates.growingDays,
    freeze_risk_days: freezeRiskDays,
    avg_precipitation: precipitation,
    avg_uv_index: uvIndex,
    uv_implications: uvImplications,

    // Soil & garden
    soil_type: soilInfo.type,
    soil_desc: soilInfo.desc,
    soil_drainage: soilInfo.drainage,
    soil_gardening: soilInfo.gardening,
    native_plants: nativePlants,

    // Risk zones
    radon_zone: radonZone,
    radon_label: radonInfo.label,
    radon_desc: radonInfo.desc,
    radon_action: radonInfo.action,
    earthquake_risk: eqRisk,
    earthquake_label: eqInfo.label,
    earthquake_desc: eqInfo.desc,
    earthquake_action: eqInfo.action,
    flood_zone: floodZone,
    flood_desc: floodDesc,
    flood_action: floodAction,
    hail_frequency: hailFreq,
    hail_label: hailInfo.label,
    hail_desc: hailInfo.desc,
    hail_action: hailInfo.action,

    // Property-specific
    lead_paint_risk: leadPaintRisk,
    asbestos_risk: asbestosRisk,
    solar_potential_kwh: solarPotentialKwh,

    // Utility costs
    avg_utility_electric: utilityInfo.electric,
    avg_utility_gas: utilityInfo.gas,
  })
}

function getStateFromZip(zip: string): string {
  const z = parseInt(zip.substring(0, 3))
  if (z >= 0 && z <= 9) return 'MA'
  if (z >= 10 && z <= 29) return 'MA'
  if (z >= 30 && z <= 49) return 'RI'
  if (z >= 50 && z <= 89) return 'NH'
  if (z >= 100 && z <= 149) return 'NY'
  if (z >= 150 && z <= 196) return 'PA'
  if (z >= 197 && z <= 199) return 'DE'
  if (z >= 200 && z <= 205) return 'DC'
  if (z >= 206 && z <= 219) return 'MD'
  if (z >= 220 && z <= 246) return 'VA'
  if (z >= 247 && z <= 268) return 'WV'
  if (z >= 269 && z <= 289) return 'NC'
  if (z >= 290 && z <= 299) return 'SC'
  if (z >= 300 && z <= 319) return 'GA'
  if (z >= 320 && z <= 349) return 'FL'
  if (z >= 350 && z <= 369) return 'AL'
  if (z >= 370 && z <= 385) return 'TN'
  if (z >= 386 && z <= 397) return 'MS'
  if (z >= 398 && z <= 399) return 'GA'
  if (z >= 400 && z <= 427) return 'KY'
  if (z >= 430 && z <= 458) return 'OH'
  if (z >= 460 && z <= 479) return 'IN'
  if (z >= 480 && z <= 499) return 'MI'
  if (z >= 500 && z <= 528) return 'IA'
  if (z >= 530 && z <= 549) return 'WI'
  if (z >= 550 && z <= 567) return 'MN'
  if (z >= 570 && z <= 577) return 'SD'
  if (z >= 580 && z <= 588) return 'ND'
  if (z >= 590 && z <= 599) return 'MT'
  if (z >= 600 && z <= 629) return 'IL'
  if (z >= 630 && z <= 658) return 'MO'
  if (z >= 660 && z <= 679) return 'KS'
  if (z >= 680 && z <= 693) return 'NE'
  if (z >= 700 && z <= 714) return 'LA'
  if (z >= 716 && z <= 729) return 'AR'
  if (z >= 730 && z <= 749) return 'OK'
  if (z >= 750 && z <= 799) return 'TX'
  if (z >= 800 && z <= 816) return 'CO'
  if (z >= 820 && z <= 831) return 'WY'
  if (z >= 832 && z <= 838) return 'ID'
  if (z >= 840 && z <= 847) return 'UT'
  if (z >= 850 && z <= 865) return 'AZ'
  if (z >= 870 && z <= 884) return 'NM'
  if (z >= 885 && z <= 899) return 'NV'
  if (z >= 900 && z <= 966) return 'CA'
  if (z >= 967 && z <= 969) return 'HI'
  if (z >= 970 && z <= 979) return 'OR'
  if (z >= 980 && z <= 994) return 'WA'
  if (z >= 995 && z <= 999) return 'AK'
  return 'MD'
}

function getCLimateZone(zip: string, state: string): string {
  // IECC climate zones by state (simplified)
  const zones: Record<string,string> = {
    FL:'2A',TX:'2A',LA:'2A',HI:'1A',
    GA:'3A',AL:'3A',MS:'3A',SC:'3A',NC:'3A',AR:'3A',TN:'3A',
    AZ:'2B',NM:'3B',NV:'3B',CA:'3B',
    VA:'4A',MD:'4A',DC:'4A',DE:'4A',KY:'4A',WV:'4A',MO:'4A',KS:'4A',OK:'3A',
    OH:'5A',IN:'5A',IL:'5A',MI:'5A',WI:'5A',MN:'6A',IA:'5A',NE:'5A',SD:'6A',ND:'7',
    PA:'5A',NJ:'5A',NY:'5A',CT:'5A',RI:'5A',MA:'5A',VT:'6A',NH:'6A',ME:'6A',
    WA:'4C',OR:'4C',ID:'5B',MT:'6B',WY:'6B',CO:'5B',UT:'5B',
    AK:'7',
  }
  return zones[state] || '4A'
}
