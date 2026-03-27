import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, Callout, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Materials & types", anchor: "materials" },
  { id: "s2", title: "Components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Inspection", anchor: "inspection" },
  { id: "s5", title: "Who to call", anchor: "who-to-call" },
];

export default function SlidingDoorsGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to Sliding Glass Doors" subtitle="Track systems, roller maintenance, weatherstripping, and the security details most homeowners miss." icon="🚪" readTime="10 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "entry-doors", title: "Entry doors", icon: "🚪" }, { slug: "windows", title: "Windows", icon: "🪟" }]}>
      <StatRow stats={[{ stat: "#1", label: "Cause of sliding door failure", context: "Track debris and roller neglect" }, { stat: "$800", label: "Roller and track replacement", context: "Average cost, single door unit" }, { stat: "$3K+", label: "Full door replacement", context: "Quality aluminum or fiberglass unit" }, { stat: "15 min", label: "Annual maintenance time", context: "That prevents most failure modes" }]} />
      <SectionHeader id="materials" icon="🚪" title="Materials & Types" />
      <ProseSection>
        <h3>Aluminum frame sliding doors</h3>
        <p>The most common type. Aluminum is strong, lightweight, and corrosion-resistant — the frame itself rarely fails. The weak points are the rollers, track, weatherstripping, and the lock mechanism. Thermally broken aluminum performs significantly better in cold climates by preventing condensation on the interior frame surface.</p>
        <h3>Vinyl frame sliding doors</h3>
        <p>More common in recent construction. Better thermal performance than aluminum but less rigid. Vinyl frames don't corrode and maintain their seal geometry better in climates with significant temperature swings.</p>
      </ProseSection>
      <LifespanTable title="Sliding door component lifespans" rows={[
        { material: "Aluminum frame", lifespan: "30–50 years", notes: "Frame rarely fails; hardware does", quality: "best" },
        { material: "Vinyl frame", lifespan: "20–30 years", quality: "better" },
        { material: "Rollers (steel)", lifespan: "10–20 years", notes: "Debris and lack of lubrication reduces this", quality: "better" },
        { material: "Rollers (nylon)", lifespan: "5–15 years", notes: "Quieter but less durable", quality: "good" },
        { material: "Pile weatherstripping", lifespan: "10–20 years", quality: "good" },
        { material: "Lock mechanism", lifespan: "15–25 years", quality: "better" },
        { material: "Insulated glass unit (IGU)", lifespan: "15–25 years", notes: "Same seal failure risk as windows", quality: "good" },
      ]} />
      <SectionHeader id="components" icon="🔧" title="Key Components" />
      <ProseSection>
        <h3>Rollers</h3>
        <p>Rollers are the wheels the sliding panel rides on. Debris in the track grinds against the roller surface, reducing diameter and causing the door to drop. A door that's difficult to slide or feels heavy is almost always a roller problem. Roller replacement is inexpensive ($50-$150 in parts) and can be done by a handy homeowner.</p>
        <h3>Security: anti-lift pins</h3>
        <p>This is the most overlooked aspect of sliding door maintenance. Sliding doors are vulnerable to being lifted out of the track from the exterior — a technique that bypasses the lock entirely. Anti-lift pins are screws installed in the upper track that prevent the door from being lifted. These should be present and intact in every sliding door.</p>
        <h3>Pile weatherstripping</h3>
        <p>The brush-like strips at the vertical edges of the door. When pile weatherstripping is compressed or missing, the door loses its thermal seal and can whistle in wind. Replacement pile comes in rolls and can be installed in 20 minutes with basic tools.</p>
      </ProseSection>
      <Callout variant="tip" label="The easiest maintenance call you'll make">Most sliding door problems are solved by three things: cleaning the track, adjusting the roller height (there's an adjustment screw at the bottom of the panel face), and replacing the pile weatherstripping. Total parts cost is typically under $30. Do this before you call anyone for service.</Callout>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–5 yrs", label: "New door", color: "green", description: "Annual track cleaning and lubrication. Confirm anti-lift pins are installed. Test lock engagement at all points." },
        { age: "5–15 yrs", label: "Maintenance phase", color: "amber", description: "Pile weatherstripping begins to compress. Rollers may need height adjustment. Continue annual track cleaning." },
        { age: "15–20 yrs", label: "Component replacement", color: "orange", description: "Roller replacement likely needed. Pile weatherstripping replacement. Lock mechanism may stiffen." },
        { age: "20+ yrs", label: "System evaluation", color: "red", description: "Evaluate full door replacement, especially if the frame has been damaged or the IGU has failed." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Inspection" />
      <ProseSection>
        <p>Annual inspection covers: sliding feel (should roll smoothly with light effort), track cleanliness, weep hole condition, pile weatherstripping contact along the full height of the panel, lock engagement, anti-lift pin presence, and caulk at all exterior perimeter joints. The full inspection takes under 10 minutes.</p>
      </ProseSection>
      <RedFlagChecklist flags={[
        { flag: "Door difficult to slide or requiring significant force — rollers or track", severity: "watch" },
        { flag: "Door that can be lifted out of the track from outside — missing anti-lift pins", severity: "urgent" },
        { flag: "Lock that doesn't engage fully or feels loose — security risk", severity: "urgent" },
        { flag: "Visible standing water in track after rain — blocked weep holes", severity: "watch" },
        { flag: "Fogging between glass panes — IGU seal failure", severity: "watch" },
        { flag: "Whistling or air infiltration when door is closed — pile weatherstripping", severity: "watch" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Who to Call" />
      <ContractorQuestions questions={[
        { question: "Are you replacing the rollers, or the full track and roller system?", whyItMatters: "If the track is damaged or deeply grooved, roller replacement alone won't solve the sliding problem — the track needs replacement or restoration too." },
        { question: "What is the U-factor on the replacement door you're recommending?", whyItMatters: "Sliding doors are a significant thermal weak point. Ask for the NFRC label data before agreeing to a product." },
      ]} />
    </GuideLayout>
  );
}
