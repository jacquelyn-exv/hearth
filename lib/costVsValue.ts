// Cost vs. Value data — 2025 National Averages
// Source: JLC Online / Remodeling Cost vs. Value Report 2025
// Structure supports regional data — add region key when available

export type CostVsValueEntry = {
  project: string
  category: string
  jobCost: number
  resaleValue: number
  costRecouped: number // percentage
  region?: string // 'national' for now, add regional later
}

export const COST_VS_VALUE_2025: CostVsValueEntry[] = [
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 4672, resaleValue: 12507, costRecouped: 268 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 2435, resaleValue: 5270, costRecouped: 216 },
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 11702, resaleValue: 24328, costRecouped: 208 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 21485, resaleValue: 24420, costRecouped: 114 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 28458, resaleValue: 32141, costRecouped: 113 },
  { project: 'Siding Replacement (Vinyl)', category: 'exterior', jobCost: 17950, resaleValue: 17313, costRecouped: 97 },
  { project: 'Backup Power Generator', category: 'systems', jobCost: 13534, resaleValue: 12902, costRecouped: 95 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 18263, resaleValue: 17323, costRecouped: 95 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 25096, resaleValue: 22199, costRecouped: 89 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 11754, resaleValue: 9959, costRecouped: 85 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 26138, resaleValue: 20915, costRecouped: 80 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 22073, resaleValue: 16657, costRecouped: 76 },
  { project: 'HVAC Conversion (Electrification)', category: 'systems', jobCost: 19484, resaleValue: 14053, costRecouped: 72 },
  { project: 'Basement Remodel', category: 'interior', jobCost: 52012, resaleValue: 36905, costRecouped: 71 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 26781, resaleValue: 18764, costRecouped: 70 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 31871, resaleValue: 21501, costRecouped: 68 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 42183, resaleValue: 25812, costRecouped: 61 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 60645, resaleValue: 32347, costRecouped: 53 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 82793, resaleValue: 42130, costRecouped: 51 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 51865, resaleValue: 25972, costRecouped: 50 },
  { project: 'Backyard Patio', category: 'outdoor', jobCost: 51454, resaleValue: 23672, costRecouped: 46 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 81612, resaleValue: 34000, costRecouped: 42 },
  { project: 'Accessory Dwelling Unit', category: 'addition', jobCost: 166406, resaleValue: 68656, costRecouped: 41 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 111255, resaleValue: 40526, costRecouped: 36 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 164104, resaleValue: 58561, costRecouped: 36 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 170517, resaleValue: 55097, costRecouped: 32 },
  { project: 'Solar Power Installation', category: 'systems', jobCost: 55937, resaleValue: 16625, costRecouped: 30 },
  { project: 'Primary Suite Addition (Upscale)', category: 'addition', jobCost: 351613, resaleValue: 63136, costRecouped: 18 },
]

export const CVV_CATEGORIES = [
  { key: 'exterior', label: 'Exterior' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'bathroom', label: 'Bathroom' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'systems', label: 'Systems' },
  { key: 'interior', label: 'Interior' },
  { key: 'addition', label: 'Additions' },
]

// Map project names to dashboard project categories for matching
export const CVV_PROJECT_MATCH: Record<string, string[]> = {
  'garage': ['Garage Door Replacement'],
  'entry door': ['Entry Door Replacement (Steel)', 'Grand Entrance (Fiberglass)'],
  'stone': ['Manufactured Stone Veneer'],
  'siding': ['Siding Replacement (Fiber-Cement)', 'Siding Replacement (Vinyl)'],
  'kitchen': ['Minor Kitchen Remodel (Midrange)', 'Major Kitchen Remodel (Midrange)', 'Major Kitchen Remodel (Upscale)'],
  'generator': ['Backup Power Generator'],
  'deck': ['Deck Addition (Wood)', 'Deck Addition (Composite)'],
  'bath': ['Bath Remodel (Midrange)', 'Bath Remodel (Universal Design)', 'Bath Remodel (Upscale)'],
  'window': ['Window Replacement (Vinyl)', 'Window Replacement (Wood)'],
  'hvac': ['HVAC Conversion (Electrification)'],
  'basement': ['Basement Remodel'],
  'roof': ['Roofing Replacement (Asphalt Shingles)', 'Roofing Replacement (Metal)'],
  'patio': ['Backyard Patio'],
  'adu': ['Accessory Dwelling Unit'],
  'solar': ['Solar Power Installation'],
  'suite': ['Primary Suite Addition (Midrange)', 'Primary Suite Addition (Upscale)'],
}
