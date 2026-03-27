import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Materials & types", anchor: "materials" },
  { id: "s2", title: "System components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Inspection", anchor: "inspection" },
  { id: "s5", title: "Who to call", anchor: "who-to-call" },
];

export default function GuttersGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to Gutters, Fascia & Soffits" subtitle="How your drainage system works, what fails first, and why blocked gutters are one of the most common causes of foundation damage." icon="🌧️" readTime="12 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "roof", title: "Roof", icon: "🏠" }, { slug: "siding", title: "Siding", icon: "🪵" }]}>
      <StatRow stats={[{ stat: "#1", label: "Cause of basement flooding", context: "Improper gutter drainage" }, { stat: "$3K+", label: "Average fascia rot repair", context: "When gutters overflow into wood" }, { stat: "2x/yr", label: "Minimum cleaning frequency", context: "Spring and fall for most climates" }, { stat: "6\"", label: "Minimum discharge distance", context: "Downspouts from foundation" }]} />
      <SectionHeader id="materials" icon="🌧️" title="Materials & Types" />
      <ProseSection>
        <h3>Aluminum gutters</h3>
        <p>The standard in most of the country. Seamless aluminum gutters are formed on-site from a roll of aluminum stock — each run is a single piece with no joints except at corners and downspout outlets. No joints means no seam failures. They come in 0.027" (standard) and 0.032" (heavy duty) thickness. Lifespan is 20-30 years.</p>
        <h3>K-style vs. half-round</h3>
        <p>K-style gutters hold more water than half-round gutters of the same width and are better suited to high-rainfall areas. Half-round is the traditional profile, easier to clean, and less prone to debris accumulation but has lower capacity.</p>
      </ProseSection>
      <LifespanTable title="Gutter system lifespan by material" rows={[
        { material: "Aluminum (seamless)", lifespan: "20–30 years", quality: "better" },
        { material: "Galvanized steel", lifespan: "10–15 years", notes: "Prone to rust at joints", quality: "good" },
        { material: "Copper", lifespan: "50+ years", notes: "Requires soldered joints", quality: "best" },
        { material: "Vinyl (PVC)", lifespan: "10–20 years", notes: "Becomes brittle in cold climates", quality: "good" },
        { material: "Fascia board (pine)", lifespan: "15–25 years", notes: "Fails faster if gutters overflow", quality: "good" },
        { material: "Fascia (PVC or composite)", lifespan: "30–50 years", quality: "best" },
      ]} />
      <SectionHeader id="components" icon="🔧" title="System Components" />
      <ProseSection>
        <h3>Fascia and soffit</h3>
        <p>The fascia board is the vertical board at the roof edge that the gutters attach to. The soffit is the horizontal surface under the roof overhang. Both are vulnerable to moisture — fascia boards rot when gutters overflow or don't drain properly. Pressing on the fascia board in multiple locations is a simple way to check for rot without getting on a ladder.</p>
        <h3>Downspouts and extensions</h3>
        <p>Downspouts should discharge at least 6 inches from the foundation — ideally much more. Splash blocks alone are usually insufficient. Every downspout that discharges at the foundation is a slow-motion foundation problem.</p>
      </ProseSection>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–5 yrs", label: "New system", color: "green", description: "Clean twice yearly. Confirm all downspouts discharge away from foundation. Check that gutters are properly pitched toward outlets." },
        { age: "5–15 yrs", label: "Maintenance phase", color: "amber", description: "Joint sealant in sectional gutters begins failing. Inspect and reseal any leaking joints. Press fascia in multiple locations annually." },
        { age: "15–20 yrs", label: "Watch phase", color: "orange", description: "Hangers can pull from fascia. Sections may separate or sag. Fascia rot is possible if maintenance has lapsed." },
        { age: "20+ yrs", label: "Replacement window", color: "red", description: "Evaluate full system replacement. If fascia is compromised, replace it at the same time as gutters." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Inspection & Cleaning" />
      <ProseSection>
        <p>Clean gutters in late fall after the last leaves have fallen, and again in late spring. The spring cleaning should include flushing all downspouts and confirming flow through the full system.</p>
      </ProseSection>
      <RedFlagChecklist flags={[
        { flag: "Water dripping behind gutter during rain — gutter pulling from fascia", severity: "urgent" },
        { flag: "Soft or springy fascia board when pressed — rot", severity: "urgent" },
        { flag: "Paint peeling on siding directly below a gutter run", severity: "watch" },
        { flag: "Downspouts discharging at or near foundation", severity: "watch" },
        { flag: "Gutter sections visibly sagging or pulling apart at joints", severity: "urgent" },
        { flag: "Staining on foundation wall or wet basement after rain events", severity: "urgent" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Who to Call" />
      <ContractorQuestions questions={[
        { question: "Are you replacing the fascia boards, or just the gutters?", whyItMatters: "New gutters on rotten fascia is a short-term fix. The fascia should be inspected and replaced where compromised before new gutters go on." },
        { question: "What gauge aluminum are you using?", whyItMatters: "0.032\" is meaningfully more durable than 0.027\" for minimal additional cost. If they can't answer this, they're using the cheapest option." },
        { question: "How will the downspouts discharge, and how far from the foundation?", whyItMatters: "The gutter itself is only as useful as where the water goes when it leaves the downspout." },
      ]} />
    </GuideLayout>
  );
}
