import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, Callout, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Materials & glazing", anchor: "materials" },
  { id: "s2", title: "Performance ratings", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Inspection", anchor: "inspection" },
  { id: "s5", title: "Replacement guide", anchor: "who-to-call" },
];

export default function WindowsGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to Windows" subtitle="Frame materials, glazing performance, failure modes, and what the ratings on the sticker actually mean." icon="🪟" readTime="13 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "entry-doors", title: "Entry doors", icon: "🚪" }, { slug: "siding", title: "Siding", icon: "🪵" }]}>
      <StatRow stats={[{ stat: "25%", label: "Of home heat loss", context: "Through windows and doors" }, { stat: "20 yrs", label: "Insulated glass unit lifespan", context: "Before seal failure becomes common" }, { stat: "$700", label: "Average window replacement", context: "Per window, installed" }, { stat: "3x", label: "Energy improvement", context: "Single-pane to triple-pane upgrade" }]} />
      <SectionHeader id="materials" icon="🪟" title="Frame Materials & Glazing" />
      <ProseSection>
        <h3>Vinyl (PVC) frames</h3>
        <p>The dominant frame material in new construction. Vinyl is a good insulator, doesn't rot, doesn't require painting, and is cost-effective. Quality varies enormously — cheap vinyl windows flex under thermal stress, causing seal failure. Look for multi-chamber designs in the frame cross-section.</p>
        <h3>Fiberglass frames</h3>
        <p>Superior to vinyl in almost every performance measure — more stable, better insulator, stronger, and longer-lived. They cost 30-50% more than vinyl. Worth it for windows in high-sun, high-temperature-swing locations.</p>
        <h3>Double vs. triple pane glazing</h3>
        <p>Double-pane insulated glass units (IGUs) are the standard. The space between panes is filled with argon or krypton gas. Triple-pane adds a third pane and second gas-filled space. In cold climates (Zone 5+), triple-pane is worth the premium.</p>
      </ProseSection>
      <LifespanTable title="Window frame and component lifespan" rows={[
        { material: "Vinyl frame (quality)", lifespan: "20–30 years", quality: "better" },
        { material: "Vinyl frame (economy)", lifespan: "10–20 years", notes: "Prone to warping and seal failure", quality: "good" },
        { material: "Fiberglass frame", lifespan: "30–50 years", quality: "best" },
        { material: "Wood frame (maintained)", lifespan: "30–50+ years", quality: "best" },
        { material: "Insulated glass unit (IGU) seal", lifespan: "15–25 years", notes: "Failure appears as fogging between panes", quality: "good" },
        { material: "Weatherstripping", lifespan: "5–15 years", notes: "Inspect and replace as needed", quality: "good" },
      ]} />
      <SectionHeader id="components" icon="📊" title="Performance Ratings" />
      <ProseSection>
        <h3>U-factor</h3>
        <p>U-factor measures how much heat flows through the window. Lower is better — a window with U-0.20 insulates twice as well as one with U-0.40. In cold climates, look for U-0.25 or lower.</p>
        <h3>Solar Heat Gain Coefficient (SHGC)</h3>
        <p>SHGC measures how much solar heat the window lets in. Lower SHGC is better for air conditioning-dominant climates. Higher SHGC is better for heating-dominant climates where you want passive solar gain in winter.</p>
      </ProseSection>
      <Callout variant="insight" label="The fogging window problem">Fogging or condensation between the panes means the gas seal has failed. The IGU has lost its insulating value. You don't always have to replace the whole window — in many cases the IGU can be replaced in the existing frame for significantly less than full window replacement.</Callout>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–10 yrs", label: "New window period", color: "green", description: "Annual inspection of weatherstripping and operation. Lubricate hardware. Inspect exterior caulk." },
        { age: "10–20 yrs", label: "Watch phase", color: "amber", description: "IGU seal failure begins, especially south and west facing units with high solar exposure. Weatherstripping degrades." },
        { age: "20–25 yrs", label: "Active evaluation", color: "orange", description: "Expect seal failures. Check for fogging in all panes. Evaluate whether IGU replacement or full window replacement makes more sense." },
        { age: "25+ yrs", label: "Full replacement window", color: "red", description: "Most vinyl windows in this age range have significant seal failure or frame degradation." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Inspection" />
      <ProseSection>
        <p>The paper test is the most useful quick check. Close a window on a piece of paper. Try to pull the paper out. If it slides freely, the weatherstripping is no longer sealing. Check each window pane for fogging in bright daylight or with a flashlight held at an angle.</p>
      </ProseSection>
      <RedFlagChecklist flags={[
        { flag: "Fogging or haze visible between panes — seal failure", severity: "watch" },
        { flag: "Condensation on interior glass surface in cold weather — poor insulation", severity: "watch" },
        { flag: "Visible daylight around frame when closed", severity: "urgent" },
        { flag: "Soft or rotted wood at sill — moisture intrusion", severity: "urgent" },
        { flag: "Failed caulk at exterior frame perimeter", severity: "watch" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Replacement Guide" />
      <ContractorQuestions questions={[
        { question: "What is the U-factor and SHGC on the windows you're recommending?", whyItMatters: "Any serious window contractor should be able to answer this immediately. If they can't, they're selling on price rather than performance." },
        { question: "Can the IGU be replaced in my existing frames, or do I need full replacement?", whyItMatters: "IGU-only replacement is significantly less expensive and is a viable option for good-condition frames with failed glass seals." },
        { question: "Is this a full-frame replacement or a pocket insert?", whyItMatters: "Pocket inserts fit into the existing frame — faster and less expensive but may reduce glass area. Full-frame is better if the existing frame is damaged." },
      ]} />
    </GuideLayout>
  );
}
