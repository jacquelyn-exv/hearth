// Cost vs. Value historical data — 2019-2025 national averages
// Source: Remodeling Cost vs. Value Report (costvsvalue.com)
// © Zonda Media. Used under editorial citation guidelines.
// Full license request pending with Zonda Media.
// Internal reference only until license granted.

export type CVVEntry = {
  project: string
  category: string
  jobCost: number
  resaleValue: number
  costRecouped: number
}

export type CVVYear = { year: number; data: CVVEntry[] }

// Material price context per year — sourced from NAHB, BLS PPI, industry reports
// Used for editorial annotation on charts
export const MATERIAL_NOTES: Record<number, { headline: string; detail: string }> = {
  2019: {
    headline: 'Pre-pandemic baseline',
    detail: 'Stable material costs across all categories. Competitive labor market. Shingles ~$70/sq, lumber at historic norms.',
  },
  2020: {
    headline: 'Supply chain disruption begins',
    detail: 'Lumber up ~30% by year-end. COVID shutdowns created demand surge with constrained supply. Garage door and window lead times extended.',
  },
  2021: {
    headline: 'Peak material inflation',
    detail: 'Lumber surged 300%+. Steel mill products up 90%. Shingle prices rose 15–20% YoY. Labor shortages hit roofing and siding hardest.',
  },
  2022: {
    headline: 'Costs plateau at elevated levels',
    detail: 'Shingles 50%+ above 2019. Wood/metal doors and windows up 49–59% from Jan 2020. Concrete rose 10%+. Labor costs up ~30% from pre-COVID.',
  },
  2023: {
    headline: 'Materials begin cooling',
    detail: 'Lumber fell 31%, steel -16%. Shingles stabilized but remained 40%+ above 2019. Concrete still rising +11%. Overall building materials inflation slowed to 1.3%.',
  },
  2024: {
    headline: 'Broad stabilization',
    detail: 'Lumber near pre-pandemic levels. Shingles stabilized. Window/door wholesale prices still 49–59% above 2020. Labor remains elevated.',
  },
  2025: {
    headline: 'New pressure from tariffs',
    detail: 'Shingle manufacturers raised prices 6–10% in early 2025. Tariff pressure on steel and aluminum. Triple-pane glass demand driving window costs higher.',
  },
}

export const CVV_2019: CVVEntry[] = [
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 3611, resaleValue: 3520, costRecouped: 98 },
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 8907, resaleValue: 8449, costRecouped: 95 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 22507, resaleValue: 18123, costRecouped: 81 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 16036, resaleValue: 12119, costRecouped: 76 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 13333, resaleValue: 10083, costRecouped: 76 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 1826, resaleValue: 1368, costRecouped: 75 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 16802, resaleValue: 12332, costRecouped: 73 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 8994, resaleValue: 6469, costRecouped: 72 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 20526, resaleValue: 14530, costRecouped: 71 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 19150, resaleValue: 13232, costRecouped: 69 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 22636, resaleValue: 15427, costRecouped: 68 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 20420, resaleValue: 13717, costRecouped: 67 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 33374, resaleValue: 20868, costRecouped: 63 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 66196, resaleValue: 41133, costRecouped: 62 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 38600, resaleValue: 23526, costRecouped: 61 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 47427, resaleValue: 28726, costRecouped: 61 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 64743, resaleValue: 38952, costRecouped: 60 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 131510, resaleValue: 78524, costRecouped: 60 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 130986, resaleValue: 77785, costRecouped: 59 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 87704, resaleValue: 51000, costRecouped: 58 },
  { project: 'Primary Suite Addition (Upscale)', category: 'addition', jobCost: 271470, resaleValue: 136820, costRecouped: 50 },
]

export const CVV_2020: CVVEntry[] = [
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 9357, resaleValue: 8943, costRecouped: 96 },
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 3695, resaleValue: 3491, costRecouped: 95 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 17008, resaleValue: 13195, costRecouped: 78 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 23452, resaleValue: 18206, costRecouped: 78 },
  { project: 'Siding Replacement (Vinyl)', category: 'exterior', jobCost: 14359, resaleValue: 10731, costRecouped: 75 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 17641, resaleValue: 12761, costRecouped: 72 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 14360, resaleValue: 10355, costRecouped: 72 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 21495, resaleValue: 14804, costRecouped: 69 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 1881, resaleValue: 1294, costRecouped: 69 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 19856, resaleValue: 13257, costRecouped: 67 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 24700, resaleValue: 16287, costRecouped: 66 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 21377, resaleValue: 13688, costRecouped: 64 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 34643, resaleValue: 21463, costRecouped: 62 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 40318, resaleValue: 24682, costRecouped: 61 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 68490, resaleValue: 40127, costRecouped: 59 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 136739, resaleValue: 80029, costRecouped: 59 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 67106, resaleValue: 37995, costRecouped: 57 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 91287, resaleValue: 49961, costRecouped: 55 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 49598, resaleValue: 26807, costRecouped: 54 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 135547, resaleValue: 72993, costRecouped: 54 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 9254, resaleValue: 4930, costRecouped: 53 },
  { project: 'Primary Suite Addition (Upscale)', category: 'addition', jobCost: 282062, resaleValue: 145486, costRecouped: 52 },
]

export const CVV_2021: CVVEntry[] = [
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 3907, resaleValue: 3663, costRecouped: 94 },
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 10386, resaleValue: 9571, costRecouped: 92 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 26214, resaleValue: 18927, costRecouped: 72 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 19626, resaleValue: 13618, costRecouped: 69 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 19385, resaleValue: 13297, costRecouped: 69 },
  { project: 'Siding Replacement (Vinyl)', category: 'exterior', jobCost: 16576, resaleValue: 11315, costRecouped: 68 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 23219, resaleValue: 15644, costRecouped: 67 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 16766, resaleValue: 11038, costRecouped: 66 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 2082, resaleValue: 1353, costRecouped: 65 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 22426, resaleValue: 14169, costRecouped: 63 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 10044, resaleValue: 6116, costRecouped: 61 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 28256, resaleValue: 17147, costRecouped: 61 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 24424, resaleValue: 14671, costRecouped: 60 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 38813, resaleValue: 22475, costRecouped: 58 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 75571, resaleValue: 43364, costRecouped: 57 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 46031, resaleValue: 25816, costRecouped: 56 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 75692, resaleValue: 41473, costRecouped: 55 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 156741, resaleValue: 85672, costRecouped: 55 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 149079, resaleValue: 80284, costRecouped: 54 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 56946, resaleValue: 30237, costRecouped: 53 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 103613, resaleValue: 54701, costRecouped: 53 },
]

export const CVV_2022: CVVEntry[] = [
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 4041, resaleValue: 3769, costRecouped: 93 },
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 11066, resaleValue: 10109, costRecouped: 91 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 28279, resaleValue: 20125, costRecouped: 71 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 22093, resaleValue: 15090, costRecouped: 68 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 20482, resaleValue: 13822, costRecouped: 68 },
  { project: 'Siding Replacement (Vinyl)', category: 'exterior', jobCost: 18662, resaleValue: 12541, costRecouped: 67 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 24388, resaleValue: 16160, costRecouped: 66 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 19248, resaleValue: 12464, costRecouped: 65 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 2206, resaleValue: 1409, costRecouped: 64 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 24677, resaleValue: 15315, costRecouped: 62 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 10556, resaleValue: 6305, costRecouped: 60 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 31535, resaleValue: 18780, costRecouped: 60 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 27164, resaleValue: 15990, costRecouped: 59 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 42105, resaleValue: 23869, costRecouped: 57 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 80809, resaleValue: 45370, costRecouped: 56 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 51436, resaleValue: 28196, costRecouped: 55 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 82882, resaleValue: 44363, costRecouped: 54 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 175473, resaleValue: 93762, costRecouped: 53 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 158015, resaleValue: 83025, costRecouped: 53 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 63986, resaleValue: 33160, costRecouped: 52 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 114773, resaleValue: 59136, costRecouped: 52 },
  { project: 'Primary Suite Addition (Upscale)', category: 'addition', jobCost: 356945, resaleValue: 165359, costRecouped: 46 },
]

export const CVV_2023: CVVEntry[] = [
  { project: 'HVAC Conversion (Electrification)', category: 'systems', jobCost: 17747, resaleValue: 18366, costRecouped: 104 },
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 4302, resaleValue: 4418, costRecouped: 103 },
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 10925, resaleValue: 11177, costRecouped: 102 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 2214, resaleValue: 2235, costRecouped: 101 },
  { project: 'Siding Replacement (Vinyl)', category: 'exterior', jobCost: 16348, resaleValue: 15485, costRecouped: 95 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 19361, resaleValue: 17129, costRecouped: 89 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 26790, resaleValue: 22963, costRecouped: 86 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 20091, resaleValue: 13766, costRecouped: 69 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 24606, resaleValue: 16413, costRecouped: 67 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 24376, resaleValue: 14912, costRecouped: 61 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 29136, resaleValue: 17807, costRecouped: 61 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 10823, resaleValue: 5457, costRecouped: 50 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 17051, resaleValue: 8553, costRecouped: 50 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 47414, resaleValue: 23163, costRecouped: 49 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 39710, resaleValue: 18270, costRecouped: 46 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 77939, resaleValue: 32574, costRecouped: 42 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 23430, resaleValue: 9325, costRecouped: 40 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 76827, resaleValue: 28203, costRecouped: 37 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 154483, resaleValue: 48913, costRecouped: 32 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 57090, resaleValue: 17237, costRecouped: 30 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 157855, resaleValue: 47343, costRecouped: 30 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 104733, resaleValue: 27830, costRecouped: 27 },
  { project: 'Primary Suite Addition (Upscale)', category: 'addition', jobCost: 325504, resaleValue: 73875, costRecouped: 23 },
]

export const CVV_2024: CVVEntry[] = [
  { project: 'Garage Door Replacement', category: 'exterior', jobCost: 4513, resaleValue: 8751, costRecouped: 194 },
  { project: 'Entry Door Replacement (Steel)', category: 'exterior', jobCost: 2355, resaleValue: 4430, costRecouped: 188 },
  { project: 'Manufactured Stone Veneer', category: 'exterior', jobCost: 11287, resaleValue: 17291, costRecouped: 153 },
  { project: 'Grand Entrance (Fiberglass)', category: 'exterior', jobCost: 11353, resaleValue: 11054, costRecouped: 97 },
  { project: 'Minor Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 27492, resaleValue: 26406, costRecouped: 96 },
  { project: 'Siding Replacement (Fiber-Cement)', category: 'exterior', jobCost: 20619, resaleValue: 18230, costRecouped: 88 },
  { project: 'Deck Addition (Wood)', category: 'outdoor', jobCost: 17615, resaleValue: 14596, costRecouped: 83 },
  { project: 'Siding Replacement (Vinyl)', category: 'exterior', jobCost: 17410, resaleValue: 13957, costRecouped: 80 },
  { project: 'Bath Remodel (Midrange)', category: 'bathroom', jobCost: 25251, resaleValue: 18613, costRecouped: 74 },
  { project: 'Deck Addition (Composite)', category: 'outdoor', jobCost: 24206, resaleValue: 16498, costRecouped: 68 },
  { project: 'Window Replacement (Vinyl)', category: 'exterior', jobCost: 21264, resaleValue: 14270, costRecouped: 67 },
  { project: 'HVAC Conversion (Electrification)', category: 'systems', jobCost: 18800, resaleValue: 12422, costRecouped: 66 },
  { project: 'Window Replacement (Wood)', category: 'exterior', jobCost: 25799, resaleValue: 16222, costRecouped: 63 },
  { project: 'Roofing Replacement (Asphalt Shingles)', category: 'exterior', jobCost: 30680, resaleValue: 17461, costRecouped: 57 },
  { project: 'Major Kitchen Remodel (Midrange)', category: 'kitchen', jobCost: 79982, resaleValue: 39587, costRecouped: 50 },
  { project: 'Bath Remodel (Universal Design)', category: 'bathroom', jobCost: 40750, resaleValue: 20148, costRecouped: 49 },
  { project: 'Roofing Replacement (Metal)', category: 'exterior', jobCost: 49928, resaleValue: 24034, costRecouped: 48 },
  { project: 'Bath Remodel (Upscale)', category: 'bathroom', jobCost: 78840, resaleValue: 35591, costRecouped: 45 },
  { project: 'Major Kitchen Remodel (Upscale)', category: 'kitchen', jobCost: 158530, resaleValue: 60176, costRecouped: 38 },
  { project: 'Primary Suite Addition (Midrange)', category: 'addition', jobCost: 164649, resaleValue: 58484, costRecouped: 36 },
  { project: 'Bathroom Addition (Midrange)', category: 'bathroom', jobCost: 58586, resaleValue: 20334, costRecouped: 35 },
  { project: 'Bathroom Addition (Upscale)', category: 'bathroom', jobCost: 107477, resaleValue: 34997, costRecouped: 33 },
  { project: 'Primary Suite Addition (Upscale)', category: 'addition', jobCost: 339513, resaleValue: 81042, costRecouped: 24 },
]

export const CVV_2025: CVVEntry[] = [
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

export const CVV_ALL_YEARS: CVVYear[] = [
  { year: 2019, data: CVV_2019 },
  { year: 2020, data: CVV_2020 },
  { year: 2021, data: CVV_2021 },
  { year: 2022, data: CVV_2022 },
  { year: 2023, data: CVV_2023 },
  { year: 2024, data: CVV_2024 },
  { year: 2025, data: CVV_2025 },
]

// Projects present in enough years to show meaningful trends
export const CVV_TREND_PROJECTS = [
  'Garage Door Replacement',
  'Roofing Replacement (Asphalt Shingles)',
  'Window Replacement (Vinyl)',
  'Siding Replacement (Fiber-Cement)',
  'Grand Entrance (Fiberglass)',
  'Bath Remodel (Midrange)',
  'Minor Kitchen Remodel (Midrange)',
  'Deck Addition (Wood)',
  'Entry Door Replacement (Steel)',
  'Siding Replacement (Vinyl)',
]

export function getProjectTrend(project: string) {
  return CVV_ALL_YEARS.map(yr => {
    const entry = yr.data.find(d => d.project === project)
    return entry ? { year: yr.year, jobCost: entry.jobCost, resaleValue: entry.resaleValue, costRecouped: entry.costRecouped } : null
  }).filter(Boolean)
}
