import type { HomeProfile, HomeSystem, SystemTag, HomeGoal, StormEvent } from '@/types'

const SYSTEM_TYPE_MAP: Record<string, SystemTag> = {
  roof: 'roof',
  siding: 'siding',
  gutters: 'gutters',
  windows: 'windows',
  entry_door: 'entry-doors',
  sliding_door: 'sliding-doors',
  hvac: 'hvac',
  water_heater: 'water-heater',
  deck: 'deck',
  appliances: 'appliances',
  refrigerator: 'appliances',
  dishwasher: 'appliances',
  chimney: 'general',
  sump_pump: 'general',
  driveway: 'general',
  fencing: 'general',
  landscaping: 'general',
}

function toISODate(val: string | null | undefined): string | undefined {
  if (!val) return undefined
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return undefined
    return d.toISOString()
  } catch {
    return undefined
  }
}

function mapGoal(goals: string[]): HomeGoal {
  if (goals.includes('new_owner')) return 'new-homeowner'
  if (goals.includes('protect_value')) return 'sell-prep'
  return 'standard'
}

export function adaptHomeProfile(
  home: any,
  systems: any[],
  userGoals: string[],
  stormHistory: any[]
): HomeProfile {
  const systemsMap: Partial<Record<SystemTag, HomeSystem>> = {}

  for (const sys of systems) {
    if (sys.not_applicable) continue
    const tag = SYSTEM_TYPE_MAP[sys.system_type]
    if (!tag) continue
    const effectiveYear = sys.replacement_year || sys.install_year
    const ageYears = effectiveYear ? new Date().getFullYear() - parseInt(effectiveYear) : undefined
    const knownIssues = sys.known_issues
      ? [{ id: 'ki-' + sys.id, description: sys.known_issues, flaggedAt: sys.updated_at || new Date().toISOString(), severity: 'medium' as const }]
      : []

    const mapped: HomeSystem = {
      id: tag,
      label: sys.system_type.replace(/_/g, ' '),
      material: sys.material || undefined,
      installYear: sys.install_year ? parseInt(sys.install_year) : undefined,
      lastReplacedYear: sys.replacement_year ? parseInt(sys.replacement_year) : undefined,
      ageYears,
      lastServiceDate: toISODate(sys.last_professional_service || sys.last_inspection),
      knownIssues,
      consideringReplacing: sys.considering_replacing || false,
      notes: sys.notes || undefined,
      filterSize: sys.filter_size || undefined,
      filterLastChanged: toISODate(sys.last_filter_replacement),
      tankSize: sys.tank_size_gallons || undefined,
      fuelType: sys.fuel_source?.toLowerCase() as 'gas' | 'electric' | 'propane' | undefined,
      lastFlushDate: toISODate(sys.last_flush),
      lastAnodeRodCheck: toISODate(sys.last_anode_rod_inspection),
      lastCleaningDate: toISODate(sys.last_cleaning),
      lastTestDate: toISODate(sys.last_test),
      hasBatteryBackup: sys.has_battery_backup || false,
      lastSweepDate: toISODate(sys.last_sweep),
      lastSealDate: toISODate(sys.last_seal_stain),
    }

    if (!systemsMap[tag]) systemsMap[tag] = mapped
  }

  const stormEvents: StormEvent[] = stormHistory
    .filter((s: any) => s.event_date)
    .slice(0, 10)
    .map((s: any) => ({
      id: s.id,
      date: s.event_date,
      type: s.event_type?.includes('hail') ? 'hail' as const :
            s.event_type?.includes('tornado') ? 'tornado' as const : 'wind' as const,
      hailSize: s.hail_size || undefined,
      windGust: s.max_windspeed || undefined,
      isHardHail: (s.hail_size || 0) >= 1,
      inspectionCompletedAt: s.inspected_at || undefined,
    }))

  return {
    id: home.id,
    address: home.address || '',
    city: home.city || '',
    state: home.state || '',
    zip: home.zip || '',
    yearBuilt: home.year_built || undefined,
    goal: mapGoal(userGoals),
    members: [],
    systems: systemsMap,
    stormEvents,
    createdAt: home.created_at || new Date().toISOString(),
    updatedAt: home.updated_at || new Date().toISOString(),
  }
}
