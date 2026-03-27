import type {
  HomeProfile, HomeSystem, Task, SmartTaskResult,
  SystemTag, TaskUrgency, ChecklistItem, StormEvent,
} from "../types";

function monthsSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function currentMonth(): number { return new Date().getMonth() + 1; }
function isFallSeason(): boolean { const m = currentMonth(); return m >= 9 && m <= 11; }
function isSpring(): boolean { const m = currentMonth(); return m >= 3 && m <= 5; }
function makeId(system: SystemTag, type: string): string { return `smart-${system}-${type}`; }

function makeChecklist(items: string[]): ChecklistItem[] {
  return items.map((label, i) => ({ id: `item-${i}`, label, completed: false }));
}

function makeTask(partial: Omit<Task, "homeId" | "type" | "status" | "createdAt" | "updatedAt">): Omit<Task, "homeId"> {
  return { ...partial, type: "smart", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

const ANNUAL_SERVICE_TASKS: Partial<Record<SystemTag, {
  title: string;
  description: (system: HomeSystem) => string;
  checklist: string[];
  guideLink: string;
  actionLabel: string;
}>> = {
  hvac: {
    title: "HVAC annual tune-up",
    description: (s) => `Your HVAC ${s.lastServiceDate ? `hasn't been serviced in ${monthsSince(s.lastServiceDate)} months` : "has no recorded service history"}. A full tune-up now costs a fraction of an emergency repair mid-season.`,
    checklist: [
      "Replace air filter (size: check your unit label)",
      "Clean condenser coils on outdoor unit",
      "Check refrigerant charge",
      "Test capacitors and contactors",
      "Clear condensate drain line",
      "Measure supply air temperature and airflow",
      "Inspect flue and venting (gas units)",
      "Test heat exchanger for cracks (gas furnaces)",
      "Lubricate moving parts",
      "Confirm thermostat is calibrated",
    ],
    guideLink: "/guides/hvac#maintenance",
    actionLabel: "Schedule tune-up",
  },
  "water-heater": {
    title: "Water heater annual service",
    description: (s) => `Annual maintenance extends tank life significantly. ${s.lastFlushDate ? `Last flushed ${monthsSince(s.lastFlushDate)} months ago.` : "No flush date on record."}`,
    checklist: [
      "Flush tank to remove sediment",
      "Test TPR (temperature and pressure relief) valve",
      "Inspect anode rod — replace if less than 50% remaining",
      "Check all connections for moisture or corrosion",
      "Confirm thermostat set to 120°F",
      "Inspect expansion tank bladder (press Schrader valve — air only, not water)",
      "Check flue pipe connections are intact (gas units)",
    ],
    guideLink: "/guides/water-heater#maintenance",
    actionLabel: "Log service",
  },
  gutters: {
    title: "Gutter system service",
    description: (s) => `${s.lastCleaningDate ? `Gutters last cleaned ${monthsSince(s.lastCleaningDate)} months ago.` : "No gutter cleaning date on record."} Blocked gutters are one of the most common causes of foundation damage and fascia rot.`,
    checklist: [
      "Clean all gutter channels — remove debris, leaves, granules",
      "Clear all downspout outlets",
      "Flush with water and confirm drainage slope",
      "Check and reseal any leaking joints or end caps",
      "Press on fascia board in multiple locations — check for soft spots",
      "Confirm all hangers are secure",
      "Check all downspout discharge points — extend if within 6 inches of foundation",
      "Clear all soffit vents",
    ],
    guideLink: "/guides/gutters#maintenance",
    actionLabel: "Log cleaning",
  },
  "entry-doors": {
    title: "Entry door annual service",
    description: () => "Door weatherstripping, threshold seals, and hardware all degrade on a predictable schedule. Catching them early avoids drafts, moisture intrusion, and emergency lockout situations.",
    checklist: [
      "Perform paper test at threshold — paper should not slide freely",
      "Check weatherstripping for gaps, compression damage, or hardening",
      "Lubricate all hinges, lockset, and deadbolt",
      "Test deadbolt throw — should engage smoothly without force",
      "Inspect exterior caulk at all trim joints",
      "Check bottom rail of door for finish failure or rust (steel doors)",
      "Inspect frame at threshold area — press for soft spots",
      "Adjust threshold height if seal is uneven",
    ],
    guideLink: "/guides/entry-doors#inspection",
    actionLabel: "Log inspection",
  },
  "sliding-doors": {
    title: "Sliding door annual service",
    description: () => "Track debris is the single biggest cause of sliding door failure. Annual service keeps rollers, weatherstripping, and the locking system performing correctly.",
    checklist: [
      "Clean bottom track thoroughly — remove all debris",
      "Clear weep holes in sill",
      "Inspect and adjust roller height",
      "Check pile weatherstripping for wear",
      "Lubricate lock mechanism and rollers",
      "Confirm anti-lift pins are in place in head track",
      "Inspect all exterior perimeter caulk",
      "Test lock engagement at all points",
    ],
    guideLink: "/guides/sliding-doors#inspection",
    actionLabel: "Log service",
  },
  roof: {
    title: "Roof seasonal inspection",
    description: (s) => `A systematic inspection ${isSpring() ? "after winter" : "before winter"} catches problems while they are still minor repairs. ${s.ageYears && s.ageYears >= 15 ? `Your roof is ${s.ageYears} years old — regular inspection is essential at this age.` : ""}`,
    checklist: [
      "Ground inspection — walk full perimeter, check all roof planes",
      "Check gutters for granule accumulation",
      "Inspect all visible pipe boots for cracking or gaps",
      "Check chimney flashing for separation",
      "Look for missing, curling, or cupped shingles",
      "Inspect ridge cap condition",
      "Attic check — look for staining, daylight, or moisture on decking",
      "Check soffit vents are clear",
    ],
    guideLink: "/guides/roof#inspection",
    actionLabel: "Log inspection",
  },
  siding: {
    title: "Siding annual inspection",
    description: () => "Most siding failures develop slowly and are invisible until water has already entered the wall. An annual walkthrough catches caulk failure, clearance violations, and early moisture indicators.",
    checklist: [
      "Walk full perimeter — check all elevations",
      "Press bottom edge of fiber cement or engineered wood boards",
      "Inspect all caulk at windows, doors, trim joints, and penetrations",
      "Check clearance at base of wall — should not contact soil or mulch",
      "Inspect all kick-out flashing locations",
      "Check weep holes on masonry or EIFS systems",
      "Look for any buckling or shifted panels (vinyl)",
      "Check paint condition on all elevations (fiber cement and wood)",
    ],
    guideLink: "/guides/siding#inspection",
    actionLabel: "Log inspection",
  },
};

function checkAnnualService(system: HomeSystem, tag: SystemTag, homeId: string, lastDateField: keyof HomeSystem, intervalMonths: number): Task | null {
  const def = ANNUAL_SERVICE_TASKS[tag];
  if (!def) return null;
  const lastDate = system[lastDateField] as string | undefined;
  const overdue = lastDate ? monthsSince(lastDate) >= intervalMonths : true;
  if (!overdue) return null;
  const urgency: TaskUrgency = !lastDate || monthsSince(lastDate) >= intervalMonths * 1.5 ? "high" : "medium";
  return { ...makeTask({ id: makeId(tag, "annual-service"), systemTag: tag, urgency, title: def.title, description: def.description(system), resolutionPath: "checklist", checklistItems: makeChecklist(def.checklist), triggeredBy: "interval", triggerData: { lastDate, intervalMonths }, guideLink: def.guideLink, actionLabel: def.actionLabel }), homeId } as Task;
}

function checkRoofAge(system: HomeSystem, homeId: string): Task | null {
  const age = system.ageYears;
  if (!age) return null;
  const material = system.material || "asphalt-architectural";
  const thresholds: Record<string, { monitor: number; replace: number }> = {
    "asphalt-3tab": { monitor: 15, replace: 20 },
    "asphalt-architectural": { monitor: 20, replace: 28 },
    "asphalt-premium": { monitor: 30, replace: 40 },
    metal: { monitor: 35, replace: 55 },
    tile: { monitor: 30, replace: 50 },
    wood: { monitor: 20, replace: 30 },
    tpo: { monitor: 15, replace: 22 },
    default: { monitor: 18, replace: 25 },
  };
  const t = thresholds[material] || thresholds.default;
  if (age >= t.replace) {
    return { ...makeTask({ id: makeId("roof", "age-replace"), systemTag: "roof", urgency: "high", title: "Roof replacement planning", description: `Your ${material.replace(/-/g, " ")} roof is ${age} years old — past its expected service life of ${t.replace} years. Get a professional assessment and start budgeting now.`, resolutionPath: "contractor", triggeredBy: "age", triggerData: { age, material, threshold: t.replace }, guideLink: "/guides/roof#failure-timeline", actionLabel: "Get inspection" }), homeId } as Task;
  }
  if (age >= t.monitor) {
    return { ...makeTask({ id: makeId("roof", "age-monitor"), systemTag: "roof", urgency: "medium", title: "Roof entering monitoring phase", description: `Your ${material.replace(/-/g, " ")} roof is ${age} years old. Proactive inspections now save significantly versus discovering failures after interior damage.`, resolutionPath: "checklist", checklistItems: makeChecklist(ANNUAL_SERVICE_TASKS.roof?.checklist || []), triggeredBy: "age", triggerData: { age, material, threshold: t.monitor }, guideLink: "/guides/roof#inspection", actionLabel: "Inspect roof" }), homeId } as Task;
  }
  return null;
}

function checkHVACAge(system: HomeSystem, homeId: string): Task | null {
  const age = system.ageYears;
  if (!age || age < 12) return null;
  if (age >= 17) {
    return { ...makeTask({ id: makeId("hvac", "age-replace"), systemTag: "hvac", urgency: "high", title: "HVAC replacement evaluation", description: `Your HVAC system is ${age} years old. At this age, the risk of major component failure is high and repair costs often exceed replacement value.`, resolutionPath: "contractor", triggeredBy: "age", guideLink: "/guides/hvac#repair-vs-replace", actionLabel: "Get assessment" }), homeId } as Task;
  }
  return { ...makeTask({ id: makeId("hvac", "age-monitor"), systemTag: "hvac", urgency: "medium", title: "HVAC entering high-wear years", description: `Your HVAC system is ${age} years old. Major components begin to wear significantly in this window. Keep service records current.`, resolutionPath: "acknowledge", triggeredBy: "age", guideLink: "/guides/hvac#failure-timeline", actionLabel: "Learn more" }), homeId } as Task;
}

function checkWaterHeaterAge(system: HomeSystem, homeId: string): Task | null {
  const age = system.ageYears;
  if (!age) return null;
  if (age >= 12) {
    return { ...makeTask({ id: makeId("water-heater", "age-replace"), systemTag: "water-heater", urgency: "high", title: "Water heater proactive replacement", description: `Your water heater is ${age} years old — past the typical 8 to 12 year service life. Replace on your schedule, not an emergency timeline.`, resolutionPath: "contractor", triggeredBy: "age", guideLink: "/guides/water-heater#repair-vs-replace", actionLabel: "Get replacement quotes" }), homeId } as Task;
  }
  if (age >= 8) {
    return { ...makeTask({ id: makeId("water-heater", "age-monitor"), systemTag: "water-heater", urgency: "medium", title: "Water heater approaching end of life", description: `Your water heater is ${age} years old. Most tank units fail between 8 and 12 years. Start budgeting for replacement.`, resolutionPath: "acknowledge", triggeredBy: "age", guideLink: "/guides/water-heater#failure-timeline", actionLabel: "Plan ahead" }), homeId } as Task;
  }
  return null;
}

function checkStormEvents(stormEvents: StormEvent[], homeId: string): Task | null {
  if (!stormEvents?.length) return null;
  const qualifying = stormEvents.filter((e) => {
    if (e.inspectionCompletedAt) return false;
    if (daysSince(e.date) > 90) return false;
    if (e.type === "hail") return e.isHardHail && (e.hailSize || 0) >= 1;
    if (e.type === "wind") return (e.windGust || 0) >= 45;
    return e.type === "tornado";
  });
  if (!qualifying.length) return null;
  const worst = qualifying.sort((a, b) => {
    const score = (e: StormEvent) => { if (e.type === "tornado") return 100; if (e.type === "hail") return (e.hailSize || 0) * 10; return (e.windGust || 0) / 10; };
    return score(b) - score(a);
  })[0];
  const isHail = worst.type === "hail";
  const checklist = isHail
    ? ["Check gutters for dents along top lip", "Look for granule accumulation in gutters and at downspouts", "Inspect AC unit fins for dents", "Check aluminum flashing and downspouts for impact marks", "Document all findings with dated photos"]
    : ["Check for missing or shifted siding panels", "Inspect gutters — look for sections that have pulled from fascia", "Check trees for hanging or cracked limbs", "Walk roof perimeter — check for missing shingles from ground", "Document findings with dated photos"];
  return { ...makeTask({ id: makeId("general", `storm-${worst.id}`), systemTag: "exterior", urgency: "high", title: "Post-storm inspection needed", description: `${isHail ? `${worst.hailSize}" hail was reported near your home on ${new Date(worst.date).toLocaleDateString()}.` : `Wind gusts of ${worst.windGust} mph hit your area on ${new Date(worst.date).toLocaleDateString()}.`} Document your home's condition now.`, resolutionPath: "checklist", checklistItems: makeChecklist(checklist), triggeredBy: "storm", triggerData: { stormId: worst.id, type: worst.type }, guideLink: isHail ? "/guides/roof#storm-inspection" : "/guides/gutters#storm-inspection", actionLabel: "Start inspection" }), homeId } as Task;
}

function checkKnownIssues(system: HomeSystem, tag: SystemTag, homeId: string): Task | null {
  const activeIssues = system.knownIssues?.filter((i) => !i.resolvedAt);
  if (!activeIssues?.length) return null;
  const highest = activeIssues.sort((a, b) => { const s = { high: 3, medium: 2, low: 1 }; return s[b.severity] - s[a.severity]; })[0];
  return { ...makeTask({ id: makeId(tag, `known-issue-${highest.id}`), systemTag: tag, urgency: "high", title: `Known issue: ${tag.replace(/-/g, " ")}`, description: `${highest.description}${activeIssues.length > 1 ? ` (${activeIssues.length - 1} other issue${activeIssues.length > 2 ? "s" : ""} also flagged)` : ""} Address known issues before they compound.`, resolutionPath: "contractor", triggeredBy: "signal", triggerData: { issueId: highest.id, severity: highest.severity }, actionLabel: "Address issue" }), homeId } as Task;
}

function checkConsideringReplacing(system: HomeSystem, tag: SystemTag, homeId: string): Task | null {
  if (!system.consideringReplacing) return null;
  const guideMap: Partial<Record<SystemTag, string>> = { roof: "/guides/roof#who-to-call", siding: "/guides/siding#who-to-call", hvac: "/guides/hvac#who-to-call", windows: "/guides/windows#who-to-call", "water-heater": "/guides/water-heater#who-to-call", gutters: "/guides/gutters#who-to-call" };
  return { ...makeTask({ id: makeId(tag, "considering-replacing"), systemTag: tag, urgency: "medium", title: `Get quotes: ${tag.replace(/-/g, " ")} replacement`, description: `You've flagged your ${tag.replace(/-/g, " ")} as something you're considering replacing. Getting 2 to 3 bids now gives you time to vet contractors properly.`, resolutionPath: "contractor", triggeredBy: "signal", guideLink: guideMap[tag], actionLabel: "Find contractors" }), homeId } as Task;
}

function getNewHomeownerTasks(homeId: string): Task[] {
  return [
    { ...makeTask({ id: makeId("general", "locate-shutoffs"), systemTag: "general", urgency: "high", title: "Locate your main water shutoff", description: "Every homeowner needs to know this before they need it. A burst pipe gives you seconds, not minutes.", resolutionPath: "checklist", checklistItems: makeChecklist(["Find main water shutoff (basement, crawl space, or utility room near meter)", "Confirm valve turns and operates", "Find individual fixture shutoffs under sinks and behind toilets", "Find water heater shutoff on cold supply line", "Log locations in your Hearth dashboard"]), actionLabel: "Log locations" }), homeId } as Task,
    { ...makeTask({ id: makeId("general", "change-locks"), systemTag: "general", urgency: "high", title: "Change all exterior locks", description: "You don't know how many copies of the previous owner's keys exist. Do this in the first 30 days.", resolutionPath: "acknowledge", actionLabel: "Mark done" }), homeId } as Task,
    { ...makeTask({ id: makeId("general", "locate-panel"), systemTag: "general", urgency: "high", title: "Label your electrical panel", description: "An unlabeled panel is a problem at the worst possible moment. Spend 30 minutes now.", resolutionPath: "checklist", checklistItems: makeChecklist(["Locate electrical panel", "Label each breaker with what it controls", "Note any double-pole breakers or GFCI breakers", "Confirm main shutoff location"]), actionLabel: "Mark done" }), homeId } as Task,
    { ...makeTask({ id: makeId("general", "smoke-detectors"), systemTag: "general", urgency: "high", title: "Test all smoke and CO detectors", description: "Replace batteries in all detectors. Add CO detectors near any gas appliances or sleeping areas if not present.", resolutionPath: "checklist", checklistItems: makeChecklist(["Test every smoke detector", "Test every CO detector", "Replace batteries in all units", "Note any that need replacement (over 10 years old)", "Confirm CO detector present near furnace and in sleeping areas"]), actionLabel: "Log check" }), homeId } as Task,
  ];
}

function applyGoalAwareness(tasks: Task[], goal: HomeProfile["goal"]): Task[] {
  return tasks.map((task) => {
    if (goal === "sell-prep") {
      const urgency: typeof task.urgency = task.urgency === "low" ? "medium" : task.urgency;
      return { ...task, urgency, description: task.description + " Buyers and their inspectors will evaluate this — address it before listing to protect your asking price." };
    }
    return task;
  });
}

function deduplicateTasks(tasks: Task[]): Task[] {
  const seen = new Map<SystemTag, Set<TaskUrgency>>();
  const result: Task[] = [];
  const signals = tasks.filter((t) => t.triggeredBy === "signal");
  const others = tasks.filter((t) => t.triggeredBy !== "signal");
  for (const task of signals) {
    result.push(task);
    if (!seen.has(task.systemTag)) seen.set(task.systemTag, new Set());
    seen.get(task.systemTag)!.add(task.urgency);
  }
  for (const task of others) {
    const systemSeen = seen.get(task.systemTag);
    if (systemSeen?.has(task.urgency)) continue;
    if (!seen.has(task.systemTag)) seen.set(task.systemTag, new Set());
    seen.get(task.systemTag)!.add(task.urgency);
    result.push(task);
  }
  return result;
}

function rotateLow(tasks: Task[]): Task[] {
  if (tasks.length <= 2) return tasks;
  const seed = new Date().getDate();
  const offset = seed % tasks.length;
  return [...tasks.slice(offset), ...tasks.slice(0, offset)];
}

export function getSmartTasks(home: HomeProfile): SmartTaskResult {
  const { systems, stormEvents, goal } = home;
  const allTasks: Task[] = [];

  if (goal === "new-homeowner") allTasks.push(...getNewHomeownerTasks(home.id));

  if (stormEvents?.length) {
    const stormTask = checkStormEvents(stormEvents, home.id);
    if (stormTask) allTasks.push(stormTask);
  }

  for (const [tag, system] of Object.entries(systems) as [SystemTag, HomeSystem][]) {
    if (!system) continue;
    const knownIssueTask = checkKnownIssues(system, tag, home.id);
    if (knownIssueTask) allTasks.push(knownIssueTask);
    const replacingTask = checkConsideringReplacing(system, tag, home.id);
    if (replacingTask) allTasks.push(replacingTask);

    const serviceIntervals: Partial<Record<SystemTag, { field: keyof HomeSystem; months: number }>> = {
      hvac: { field: "lastServiceDate", months: 12 },
      "water-heater": { field: "lastFlushDate", months: 12 },
      gutters: { field: "lastCleaningDate", months: 6 },
      roof: { field: "lastServiceDate", months: 12 },
      siding: { field: "lastServiceDate", months: 12 },
      "entry-doors": { field: "lastServiceDate", months: 12 },
      "sliding-doors": { field: "lastServiceDate", months: 12 },
    };

    const interval = serviceIntervals[tag];
    if (interval) {
      const t = checkAnnualService(system, tag, home.id, interval.field, interval.months);
      if (t) allTasks.push(t);
    }

    if (tag === "roof") { const t = checkRoofAge(system, home.id); if (t) allTasks.push(t); }
    if (tag === "hvac") { const t = checkHVACAge(system, home.id); if (t) allTasks.push(t); }
    if (tag === "water-heater") { const t = checkWaterHeaterAge(system, home.id); if (t) allTasks.push(t); }
  }

  const goalAdjusted = applyGoalAwareness(allTasks, goal);
  const deduped = deduplicateTasks(goalAdjusted);
  const urgencyScore = { high: 3, medium: 2, low: 1 };
  const sorted = deduped.sort((a, b) => urgencyScore[b.urgency] - urgencyScore[a.urgency]);
  const high = sorted.filter((t) => t.urgency === "high");
  const medium = sorted.filter((t) => t.urgency === "medium");
  const low = rotateLow(sorted.filter((t) => t.urgency === "low"));
  const all = [...high, ...medium, ...low];

  return { displayed: all.slice(0, 6), all, lastCalculatedAt: new Date().toISOString() };
}
