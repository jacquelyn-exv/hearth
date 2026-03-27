import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, Callout, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Materials & types", anchor: "materials" },
  { id: "s2", title: "System components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Inspection", anchor: "inspection" },
  { id: "s5", title: "Who to call", anchor: "who-to-call" },
];

export default function SidingGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to Siding" subtitle="Every material, what fails and why, what to inspect yourself, and how to catch water intrusion before it becomes a remediation project." icon="🪵" readTime="15 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "roof", title: "Roof", icon: "🏠" }, { slug: "gutters", title: "Gutters", icon: "🌧️" }]}>
      <StatRow stats={[{ stat: "90%", label: "Of siding failures", context: "Start at transitions and penetrations, not field panels" }, { stat: "$12K", label: "Average full re-side", context: "1,500 sq ft home, fiber cement" }, { stat: "6\"", label: "Minimum clearance", context: "Between siding bottom and grade or mulch" }, { stat: "5 yrs", label: "Paint recoat interval", context: "Fiber cement — the #1 maintenance item" }]} />
      <SectionHeader id="materials" icon="🪵" title="Materials & Types" />
      <ProseSection>
        <h3>Vinyl siding</h3>
        <p>The most common siding material in American residential construction. Vinyl is durable, inexpensive, and requires almost no maintenance. The main failure modes are impact damage, UV fading over time, and buckling when installed with insufficient expansion gaps.</p>
        <h3>Fiber cement</h3>
        <p>Cement, sand, and cellulose fiber compressed into planks or panels. Highly fire-resistant and impervious to insects and rot when properly maintained. The key word is maintained — fiber cement must be painted. Unpainted or failing-paint fiber cement absorbs moisture and deteriorates. The painting interval is typically every 5-7 years.</p>
        <h3>Engineered wood</h3>
        <p>Strand-based wood composite with resin binders. More vulnerable than fiber cement to moisture intrusion at cut edges and field-drilled penetrations — these must be properly primed and sealed at installation.</p>
      </ProseSection>
      <LifespanTable title="Siding material lifespan" rows={[
        { material: "Vinyl", lifespan: "20–40 years", notes: "Fades and becomes brittle in UV over time", quality: "good" },
        { material: "Fiber cement (painted/maintained)", lifespan: "30–50 years", quality: "best" },
        { material: "Fiber cement (paint neglected)", lifespan: "10–20 years", notes: "Moisture damage at unpainted edges", quality: "good" },
        { material: "Engineered wood (maintained)", lifespan: "20–30 years", quality: "better" },
        { material: "Cedar (maintained)", lifespan: "30–50+ years", quality: "best" },
        { material: "Traditional stucco", lifespan: "50–100 years", notes: "Cracks must be sealed promptly", quality: "best" },
        { material: "Brick veneer", lifespan: "50–100 years", notes: "Mortar joints repoint at 25–30 yrs", quality: "best" },
      ]} />
      <SectionHeader id="components" icon="🔧" title="System Components" />
      <ProseSection>
        <h3>Water-resistive barrier (WRB)</h3>
        <p>Behind every siding material is a water-resistive barrier. The WRB is the true line of defense against bulk water intrusion. When siding is replaced, the WRB should be inspected and replaced in any areas where it's damaged or degraded.</p>
        <h3>Clearances</h3>
        <p>Every siding material requires a gap between the bottom edge of the siding and grade, mulch, or any horizontal surface. The minimum is typically 6 inches from grade and 2 inches from horizontal surfaces like decks. This clearance prevents wicking of moisture and direct soil contact.</p>
      </ProseSection>
      <Callout variant="warning" label="The invisible failure problem">Most siding failures begin at penetrations, transitions, and flashing — not in the field panels. The damage develops behind the siding, in the wall cavity, for months or years before becoming visible. Annual walkarounds that focus on caulk condition at all penetrations are your best early warning system.</Callout>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–5 yrs", label: "New siding", color: "green", description: "Annual inspection of caulk at all joints and penetrations. Confirm clearances are maintained as landscaping matures." },
        { age: "5–10 yrs", label: "Caulk maintenance phase", color: "amber", description: "Caulk begins failing at window and door perimeters. Annual inspection and re-caulking at any failed joints is essential." },
        { age: "10–20 yrs", label: "Material-specific wear", color: "amber", description: "Fiber cement approaching first repaint. Vinyl may show UV fading. Engineered wood bottom edges beginning to show stress." },
        { age: "20–30 yrs", label: "Active evaluation", color: "orange", description: "Most siding materials in this range need careful assessment." },
        { age: "30+ yrs", label: "Replacement evaluation", color: "red", description: "A full re-side is the opportunity to upgrade the WRB and flashing system — doing it right once is far better than patching." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Inspection" />
      <ProseSection>
        <p>A proper annual siding inspection is a slow, deliberate walk around the full perimeter, looking at each elevation carefully. Bring a screwdriver or probe to press on any suspicious areas. The inspection should take 20-30 minutes for a typical home.</p>
      </ProseSection>
      <RedFlagChecklist flags={[
        { flag: "Soft or spongy wall surface when pressed — moisture in wall cavity", severity: "emergency" },
        { flag: "Paint bubbling on fiber cement — moisture in the boards", severity: "urgent" },
        { flag: "Failed caulk at window perimeter, especially at sill corners", severity: "urgent" },
        { flag: "Missing kick-out flashing where roof meets a sidewall", severity: "urgent" },
        { flag: "Siding bottom edge contacting grade, mulch, or deck surface", severity: "watch" },
        { flag: "Swollen or delaminating bottom edges on engineered wood boards", severity: "urgent" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Who to Call" />
      <ContractorQuestions questions={[
        { question: "What WRB are you installing and how are you integrating it at windows and doors?", whyItMatters: "WRB integration at openings is where most installation failures occur. A contractor who can explain their sequencing knows what they're doing." },
        { question: "Are you replacing the flashing at windows and doors, or reusing the existing?", whyItMatters: "Reusing old flashing during a re-side is a common corner-cut. If the flashing is more than 15 years old, it should be replaced." },
      ]} />
    </GuideLayout>
  );
}
