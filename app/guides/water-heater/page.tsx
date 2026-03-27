import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, Callout, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Types", anchor: "materials" },
  { id: "s2", title: "Components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Maintenance", anchor: "inspection" },
  { id: "s5", title: "Repair vs. replace", anchor: "who-to-call" },
];

export default function WaterHeaterGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to Water Heaters" subtitle="Types, lifespans, maintenance that actually matters, and how to replace before an emergency forces your hand." icon="🔥" readTime="12 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "hvac", title: "HVAC", icon: "❄️" }]}>
      <StatRow stats={[{ stat: "$4K+", label: "Average water damage claim", context: "From tank failure — a preventable event" }, { stat: "8 yrs", label: "When to start monitoring", context: "Most tank units, all fuel types" }, { stat: "12 yrs", label: "Typical end of life", context: "For tank water heaters in average use" }, { stat: "$1,200", label: "Average replacement cost", context: "40-gal gas unit installed" }]} />
      <SectionHeader id="materials" icon="🔥" title="Types" subtitle="Tank vs. tankless is the biggest decision. Here's what actually matters." />
      <ProseSection>
        <h3>Traditional tank water heaters</h3>
        <p>The most common type in American homes. A tank holds 30-80 gallons at a constant temperature, ready on demand. They're less expensive to install and easier to maintain than tankless units. Gas tank heaters are more efficient than electric and recover faster after heavy use.</p>
        <h3>Tankless (on-demand) heaters</h3>
        <p>Heat water only when needed, eliminating standby loss. They're typically 20-40% more efficient. The upfront cost is higher ($2,500-$5,000 installed vs. $900-$1,800 for a tank unit). Lifespan is 20+ years with proper maintenance.</p>
        <h3>Heat pump water heaters</h3>
        <p>Electric units that move heat from ambient air rather than generating it directly. They're 2-3x more efficient than standard electric tank heaters and often qualify for significant federal tax credits.</p>
      </ProseSection>
      <LifespanTable title="Water heater lifespan by type" rows={[
        { material: "Gas tank (standard)", lifespan: "8–12 years", quality: "good" },
        { material: "Electric tank (standard)", lifespan: "10–15 years", quality: "good" },
        { material: "Gas tankless", lifespan: "20+ years", notes: "Requires annual descaling in hard water", quality: "best" },
        { material: "Electric tankless", lifespan: "20+ years", quality: "best" },
        { material: "Heat pump water heater", lifespan: "13–15 years", quality: "better" },
      ]} />
      <SectionHeader id="components" icon="🔧" title="Key Components" />
      <ProseSection>
        <h3>Anode rod</h3>
        <p>The anode rod is a sacrificial metal rod that attracts corrosive elements in the water, protecting the tank lining. When depleted, the tank itself begins to corrode. Replacing the anode rod ($20-$50 part) every 3-5 years dramatically extends tank life. Most homeowners have never heard of it.</p>
        <h3>TPR valve</h3>
        <p>The temperature and pressure relief valve is a safety device that opens if tank pressure or temperature exceeds safe limits. It should be tested annually by lifting the lever briefly and confirming water flows out and stops when released.</p>
        <h3>Expansion tank</h3>
        <p>If your home has a closed water system, you likely need an expansion tank. Signs your expansion tank has failed: press the Schrader valve — if water comes out instead of air, the bladder has failed.</p>
      </ProseSection>
      <Callout variant="warning" label="Don't wait for failure">Water heater tank failures are rarely dramatic. They usually manifest as a slow seep from a corroded tank bottom — often pooling under the unit for days before anyone notices. By then, flooring, subfloor, and drywall are damaged. If your tank is over 10 years old, inspect the base monthly. Any moisture is a replacement signal.</Callout>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–5 yrs", label: "New unit", color: "green", description: "Register warranty. Confirm anode rod was installed. Test TPR valve. Log install date in Hearth." },
        { age: "5–8 yrs", label: "Mid life", color: "green", description: "Annual flush recommended. Inspect anode rod — replace if needed. Confirm expansion tank bladder is intact." },
        { age: "8–10 yrs", label: "Monitor", color: "amber", description: "Check base of unit monthly for any moisture. Flush annually without fail. Start researching replacement options." },
        { age: "10–12 yrs", label: "Plan replacement", color: "orange", description: "Most tanks fail in this window. Budget for replacement. Consider upgrading to tankless or heat pump." },
        { age: "12+ yrs", label: "Replace proactively", color: "red", description: "Every additional month increases risk of catastrophic failure and water damage. Replace on your schedule." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Maintenance" />
      <ProseSection>
        <p>Annual maintenance for a tank water heater takes about 30-45 minutes and covers: flushing sediment from the tank, testing the TPR valve, inspecting the anode rod, checking all connections for moisture or corrosion, and confirming the thermostat is set correctly (120°F is the standard).</p>
      </ProseSection>
      <RedFlagChecklist flags={[
        { flag: "Any moisture at the base of the tank", severity: "urgent" },
        { flag: "Rust-colored hot water at fixtures", severity: "urgent" },
        { flag: "Banging or rumbling sounds during heating cycle — severe sediment buildup", severity: "watch" },
        { flag: "TPR valve that has never been tested or appears corroded", severity: "urgent" },
        { flag: "Unit over 12 years old with no recent inspection", severity: "watch" },
        { flag: "CO detector alarm near a gas water heater", severity: "emergency" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Repair vs. Replace" />
      <ContractorQuestions questions={[
        { question: "Is this a repair that makes financial sense given the unit's age?", whyItMatters: "Most repairs on units over 8 years old don't make financial sense when compared to the cost of the water damage a failure would cause." },
        { question: "Are there rebates available for upgrading to a heat pump water heater?", whyItMatters: "Federal tax credits and utility rebates can offset 30-50% of the upgrade cost for qualifying heat pump units. Ask before you decide." },
      ]} />
    </GuideLayout>
  );
}
