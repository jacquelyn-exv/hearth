import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, Callout, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Materials & types", anchor: "materials" },
  { id: "s2", title: "System components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Inspection", anchor: "inspection" },
  { id: "s5", title: "Who to call", anchor: "who-to-call" },
];

export default function RoofGuidePage() {
  return (
    <GuideLayout title="The Complete Homeowner's Guide to Roofing" subtitle="Materials, lifespan, failure patterns, what to inspect yourself, and how to find a roofer who won't upsell you." icon="🏠" readTime="18 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "gutters", title: "Gutters & drainage", icon: "🌧️" }, { slug: "siding", title: "Siding", icon: "🪵" }]}>
      <StatRow stats={[{ stat: "25%", label: "Of home sales", context: "Delayed by roof issues found at inspection" }, { stat: "$9K", label: "Average roof replacement", context: "1,700 sq ft home, architectural shingles" }, { stat: "15 yrs", label: "When problems start", context: "Most asphalt roofs, regardless of warranty" }, { stat: "40%", label: "Of insurance claims", context: "Are roof-related — mostly preventable" }]} />
      <SectionHeader id="materials" icon="🏠" title="Materials & Types" subtitle="The material your roof is made of determines everything: cost, lifespan, maintenance requirements, and what failure looks like." />
      <ProseSection>
        <p>Most American homes have asphalt shingles. Asphalt balances cost, performance, and ease of installation in a way no other material has matched at scale. But within asphalt alone there are significant differences the roofing industry does a poor job of communicating.</p>
        <h3>Asphalt Shingles</h3>
        <p>3-tab shingles are the entry-level option and largely obsolete on new construction. They're flat, uniform, and thinner than architectural shingles, making them more vulnerable to wind uplift. If your home was built before 2000, there's a reasonable chance you have 3-tab shingles. They carry 20-25 year warranties but most begin failing at 15-18 years in real-world conditions.</p>
        <p>Architectural (dimensional) shingles are the current standard. They have a layered appearance, are heavier, and perform meaningfully better in wind events. 30-year warranties are common but the practical lifespan is 22-28 years in most climates.</p>
        <p>Premium designer shingles including impact-resistant Class 4 products carry 40-50 year warranties and offer real durability advantages in hail-prone areas. They often qualify for insurance discounts that partially offset the higher upfront cost.</p>
      </ProseSection>
      <LifespanTable title="Roofing material lifespan by type" rows={[
        { material: "3-tab asphalt", lifespan: "15–20 years", notes: "Mostly obsolete on new builds", quality: "good" },
        { material: "Architectural asphalt", lifespan: "22–28 years", notes: "Current standard", quality: "better" },
        { material: "Class 4 impact-resistant asphalt", lifespan: "30–40 years", notes: "May reduce insurance premium", quality: "best" },
        { material: "Metal standing seam", lifespan: "40–70 years", notes: "Excellent in snow and hail", quality: "best" },
        { material: "Metal panel (exposed fastener)", lifespan: "25–40 years", notes: "Fasteners need periodic inspection", quality: "better" },
        { material: "Wood shake", lifespan: "20–30 years", notes: "Requires more maintenance", quality: "good" },
        { material: "Concrete tile", lifespan: "40–50 years", notes: "Heavy — verify structure can support", quality: "best" },
        { material: "Clay tile", lifespan: "50–100 years", notes: "Individual tiles break; underlayment still ages", quality: "best" },
        { material: "TPO / EPDM (flat)", lifespan: "15–25 years", notes: "Seams are the failure point", quality: "good" },
        { material: "Slate (natural)", lifespan: "75–150 years", notes: "Flashing and fasteners fail first", quality: "best" },
      ]} />
      <Callout variant="money" label="The warranty vs. lifespan gap">Roofing warranties are marketing documents, not performance guarantees. A 30-year warranty covers manufacturer defects — not weathering, installation errors, or the fact that your attic runs at 160°F in summer. Most asphalt roofs in hot climates begin showing real degradation 5-7 years before their warranty expires. Plan replacement around actual condition, not the number on the box.</Callout>
      <SectionHeader id="components" icon="🔧" title="System Components" subtitle="A roof is not just shingles. Every component has its own failure mode and lifespan." />
      <ProseSection>
        <h3>Underlayment</h3>
        <p>Underlayment is the waterproof barrier between your decking and shingles. Synthetic underlayments have largely replaced felt because they're lighter, stronger, and perform better when wet. Self-adhered membranes (ice-and-water shield) are used at all vulnerable locations: eaves, valleys, skylights, chimneys. If your roofer proposes no ice-and-water shield anywhere on your roof, that is a red flag.</p>
        <h3>Flashing</h3>
        <p>Flashing is thin metal installed at every joint where the roof meets a vertical surface. Step flashing at walls and dormers. Counterflashing at chimneys. Pipe boots at plumbing penetrations. Kick-out flashing at the base of walls where they meet rooflines. Flashing failures are responsible for the majority of residential roof leaks and are the most commonly botched element on re-roofs done by inexperienced contractors.</p>
        <h3>Ventilation</h3>
        <p>Attic ventilation is a roofing durability issue. An overheated attic accelerates shingle degradation from the underside. Ice dams in cold climates are almost always a ventilation problem. The standard is 1 square foot of net free ventilation for every 150 square feet of attic floor, split equally between intake and exhaust.</p>
      </ProseSection>
      <Callout variant="warning" label="The pipe boot problem">Pipe boots — the rubber collars around plumbing vent pipes — are the single most common source of roof leaks in homes over 10 years old. The neoprene rubber dries out and cracks. The repair is under $200 in most markets. The damage from ignoring it can be extensive. Check yours from the ground every year.</Callout>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" subtitle="What happens to a roof over time — and when you need to start paying attention." />
      <FailureTimeline title="Asphalt shingle roof failure progression" stages={[
        { age: "0–7 yrs", label: "New roof period", color: "green", description: "Low maintenance. Occasional inspection to confirm installation quality. Verify all flashing is properly sealed. Log your install date and material." },
        { age: "8–14 yrs", label: "Early monitoring", color: "amber", description: "Annual inspections begin. Granule loss starts but is not yet significant. Check pipe boots and flashing annually. Look for any lifted tab corners." },
        { age: "15–18 yrs", label: "Active wear phase", color: "orange", description: "This is when problems start. Granule loss accelerates. Shingles begin to curl or cup at edges. Pipe boots likely degraded. Start getting condition assessments." },
        { age: "19–22 yrs", label: "High risk", color: "red", description: "Meaningful risk of interior water intrusion during significant rain events. Replacement planning should be active. Get 2-3 contractor assessments." },
        { age: "22+ yrs", label: "Past service life", color: "red", description: "If you haven't replaced by now, you're running on borrowed time. Budget for replacement immediately." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Inspection" subtitle="What to look for from the ground, when to get on the roof, and what a professional inspection should cover." />
      <ProseSection>
        <p>You don't need to climb on your roof to do a useful inspection. A good pair of binoculars from the ground will reveal the majority of problems. Walk the full perimeter. Look at each roof plane separately.</p>
        <h3>Ground-level inspection</h3>
        <p>Look for: missing or displaced shingles, shingles that are visibly curled or cupped at edges, granule accumulation at downspout discharge points, any visible daylight through ridge areas, sagging anywhere on the roof plane, and pipe boots — look for dark rubber collars and check whether they appear intact.</p>
        <h3>Attic check</h3>
        <p>An attic inspection on a sunny day can reveal problems invisible from outside. Look for daylight coming through the decking. Look for staining on decking or rafters. Press on decking at any stained areas — soft spots indicate rot.</p>
      </ProseSection>
      <RedFlagChecklist title="Red flags that require immediate attention" flags={[
        { flag: "Water staining on interior ceilings — active or historical", severity: "urgent" },
        { flag: "Daylight visible through attic decking", severity: "emergency" },
        { flag: "Soft spots when pressing on attic decking — indicates rot", severity: "urgent" },
        { flag: "Shingles missing across multiple areas of the roof", severity: "urgent" },
        { flag: "Heavy granule accumulation in gutters — sign of accelerating wear", severity: "watch" },
        { flag: "Chimney flashing separating from the masonry", severity: "urgent" },
        { flag: "Sagging anywhere in the roof plane", severity: "emergency" },
        { flag: "Moss or significant algae growth — retains moisture", severity: "watch" },
        { flag: "Multiple pipe boots cracked or missing rubber collars", severity: "urgent" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Who to Call" subtitle="How to find a qualified roofer, what the process looks like, and how to avoid the most common contractor scams." />
      <ProseSection>
        <p>The roofing industry has more fly-by-night operators than almost any other trade. After major hail events, storm chasers flood into affected areas and are gone before you discover their work was substandard. Protecting yourself starts with understanding the vetting process.</p>
        <h3>Licensing and insurance</h3>
        <p>Most states require roofing contractors to be licensed. Verify the license number against your state's contractor database. Require a certificate of insurance naming you as an additional insured, showing both general liability (at least $1 million) and workers' compensation.</p>
        <h3>The inspection-to-quote process</h3>
        <p>A legitimate inspection should take at least 45 minutes. The inspector should access the attic. They should photograph every area of concern. The written estimate should itemize material costs, labor, disposal, underlayment type, flashing materials, and warranty terms.</p>
      </ProseSection>
      <ContractorQuestions title="Questions to ask any roofer before signing" questions={[
        { question: "Will you be replacing all the flashing, or reusing the existing flashing?", whyItMatters: "Reusing old flashing on a new roof is a common corner-cut that can cause leaks within a few years. New flashing should be standard on any full re-roof." },
        { question: "What underlayment are you using and where is ice-and-water shield going?", whyItMatters: "Synthetic underlayment performs better than felt. Ice-and-water shield should be used at all eaves, valleys, and penetrations." },
        { question: "Who does the actual installation — your employees or subcontractors?", whyItMatters: "Many roofing companies subcontract to crews they don't directly supervise. Ask who is responsible if the work has a problem." },
        { question: "Can you give me the name and contact for two jobs in my area from the last two years?", whyItMatters: "Local references you can verify and visit are the most reliable quality signal available to you." },
        { question: "What's the warranty — and is it from the manufacturer or from you?", whyItMatters: "Manufacturer warranties cover material defects. Workmanship warranties come from the contractor. You want both clearly spelled out in writing." },
      ]} />
    </GuideLayout>
  );
}
