import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, Callout, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "System types", anchor: "materials" },
  { id: "s2", title: "Components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Maintenance", anchor: "inspection" },
  { id: "s5", title: "Repair vs. replace", anchor: "who-to-call" },
];

export default function HVACGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to HVAC" subtitle="How your heating and cooling system works, when it fails, how to maintain it, and when to repair vs. replace." icon="❄️" readTime="14 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "water-heater", title: "Water heater", icon: "🔥" }]}>
      <StatRow stats={[{ stat: "$5K", label: "Average AC replacement", context: "Split system, 2.5 ton" }, { stat: "$300", label: "Annual tune-up cost", context: "vs. $3,000+ emergency repair" }, { stat: "15 yrs", label: "HVAC enters high-wear phase", context: "Compressor and heat exchanger risk" }, { stat: "47%", label: "Of home energy use", context: "Is heating and cooling" }]} />
      <SectionHeader id="materials" icon="❄️" title="System Types" subtitle="Most homes have one of three configurations. Knowing yours is the foundation of understanding maintenance." />
      <ProseSection>
        <h3>Split systems</h3>
        <p>The most common configuration in American homes. A split system has two units — an outdoor condenser/compressor and an indoor air handler with the evaporator coil. Most split systems provide both heating (via heat pump or gas furnace) and cooling.</p>
        <h3>Heat pumps</h3>
        <p>A heat pump is a split system that can move heat in both directions — extracting heat from outside air in winter to heat the home, and running in reverse in summer to cool. In cold climates they're often paired with a gas furnace backup — this is called a dual-fuel system.</p>
        <h3>Ductless mini-splits</h3>
        <p>An outdoor unit connects to one or more indoor air handlers mounted on walls or ceilings, with no duct system. They're highly efficient and allow zone control, but each air handler requires individual maintenance.</p>
      </ProseSection>
      <LifespanTable title="HVAC component lifespans" rows={[
        { material: "Central AC (split system)", lifespan: "15–20 years", quality: "good" },
        { material: "Gas furnace", lifespan: "15–25 years", notes: "Heat exchanger is the critical component", quality: "better" },
        { material: "Heat pump", lifespan: "12–17 years", notes: "Works harder than AC in both seasons", quality: "good" },
        { material: "Ductless mini-split", lifespan: "15–20 years", quality: "better" },
        { material: "Ductwork (sealed metal)", lifespan: "25–50 years", notes: "Connections fail before metal", quality: "best" },
        { material: "Flexible duct", lifespan: "15–25 years", notes: "Tears and disconnects in attics", quality: "good" },
      ]} />
      <SectionHeader id="components" icon="🔧" title="Key Components" subtitle="Every component has its own failure mode — knowing them helps you have better conversations with technicians." />
      <ProseSection>
        <h3>Compressor</h3>
        <p>The compressor is the heart of the cooling system and the most expensive component to replace. A failed compressor in an older system often makes replacement more cost-effective than repair.</p>
        <h3>Capacitors and contactors</h3>
        <p>Capacitors start the compressor and fan motors. Contactors are the switches that control power flow. Both are high-failure components — and both are inexpensive parts that cause expensive symptoms when they fail. Replacement is typically $150-$400.</p>
        <h3>Refrigerant</h3>
        <p>Your system should not need refrigerant added under normal operation. Refrigerant doesn't get used up — it circulates in a closed loop. If a technician says you're low on refrigerant, that means you have a leak. Adding refrigerant without finding and fixing the leak is a waste of money.</p>
        <h3>Condensate drain</h3>
        <p>The evaporator coil removes humidity from the air, and that water drains through a condensate line. Algae and mold grow in this line and block it. Pouring a cup of diluted bleach down the drain line once a year prevents this.</p>
      </ProseSection>
      <Callout variant="warning" label="The 5,000 rule">Multiply the age of your system by the repair cost. If the result exceeds $5,000, replacement is almost always the better financial decision. A $400 capacitor on a 6-year-old system: replace the part. A $1,200 coil on a 14-year-old system: consider replacement. An $1,800 compressor on a 16-year-old system: replace the system.</Callout>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–5 yrs", label: "New system", color: "green", description: "Change filter every 90 days. Register warranty. No major maintenance needed." },
        { age: "5–10 yrs", label: "Mid life", color: "green", description: "Annual tune-ups become important. Capacitors and contactors can start wearing. Confirm drain line is clear every season." },
        { age: "11–15 yrs", label: "Watch phase", color: "amber", description: "Refrigerant leaks become more common. Compressor efficiency begins declining. Keep service records current." },
        { age: "15–18 yrs", label: "High wear", color: "orange", description: "Apply the 5,000 rule to every repair estimate. Compressor failure risk is real. Begin budgeting for replacement." },
        { age: "18+ yrs", label: "End of life", color: "red", description: "Replace proactively before an emergency failure in peak summer or winter." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Maintenance & Tune-Ups" />
      <ProseSection>
        <p>Annual tune-ups are the single most cost-effective maintenance action for HVAC systems. A good tune-up takes 60-90 minutes and covers everything in the system, not just a filter check.</p>
        <h3>Filter maintenance</h3>
        <p>This is the most important thing you can do yourself. A clogged filter restricts airflow, which makes the system work harder, which increases wear on every component. Check your filter every 30 days. Replace when visibly dirty — usually every 60-90 days for 1" filters.</p>
      </ProseSection>
      <RedFlagChecklist title="Signs your HVAC needs immediate attention" flags={[
        { flag: "System running constantly but not reaching set temperature", severity: "urgent" },
        { flag: "Ice on the outdoor unit or refrigerant lines", severity: "urgent" },
        { flag: "Burning smell or electrical smell from vents or unit", severity: "emergency" },
        { flag: "Unusual sounds: grinding, screeching, or repeated clicking at startup", severity: "urgent" },
        { flag: "Water puddling near the indoor unit or overflow pan wet", severity: "watch" },
        { flag: "CO detector alarm in the home — could be furnace-related", severity: "emergency" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Repair vs. Replace" />
      <ContractorQuestions questions={[
        { question: "Is this a refrigerant leak, and if so, where is it?", whyItMatters: "Adding refrigerant without finding the leak is not a repair — it's a temporary fix. Any leak should be located and repaired." },
        { question: "What is the SEER rating of the replacement unit you're recommending?", whyItMatters: "Higher SEER units cost more upfront but less to operate. Current minimum is 14 SEER; 16+ is worth considering if you run the system heavily." },
        { question: "Can I see the heat exchanger issue you're describing?", whyItMatters: "Heat exchanger cracks are real but the claim is occasionally used dishonestly. A legitimate technician can show you the crack in person or via camera." },
      ]} />
    </GuideLayout>
  );
}
