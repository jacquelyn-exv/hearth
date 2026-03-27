import GuideLayout from "../_components/GuideLayout";
import { LifespanTable, FailureTimeline, RedFlagChecklist, ContractorQuestions, StatRow, SectionHeader, ProseSection } from "../_components/GuideComponents";

const SECTIONS = [
  { id: "s1", title: "Materials & types", anchor: "materials" },
  { id: "s2", title: "Components", anchor: "components" },
  { id: "s3", title: "Failure timeline", anchor: "failure-timeline" },
  { id: "s4", title: "Inspection", anchor: "inspection" },
  { id: "s5", title: "Who to call", anchor: "who-to-call" },
];

export default function EntryDoorsGuidePage() {
  return (
    <GuideLayout title="The Homeowner's Guide to Entry Doors" subtitle="Door materials, security ratings, weatherstripping that actually works, and what fails first on a door most homeowners never inspect." icon="🚪" readTime="11 min" lastUpdated="2025-01-01" sections={SECTIONS} relatedGuides={[{ slug: "windows", title: "Windows", icon: "🪟" }, { slug: "sliding-doors", title: "Sliding doors", icon: "🚪" }]}>
      <StatRow stats={[{ stat: "34%", label: "Of break-ins", context: "Through front door — mostly lock failures" }, { stat: "15 yrs", label: "Weatherstripping lifespan", context: "In typical residential use" }, { stat: "$2K", label: "Average entry door replacement", context: "Fiberglass, including installation" }, { stat: "30%", label: "Of drafts in typical homes", context: "From door weatherstripping gaps" }]} />
      <SectionHeader id="materials" icon="🚪" title="Materials & Types" />
      <ProseSection>
        <h3>Steel doors</h3>
        <p>The most common entry door in residential construction. Steel doors have an insulated foam core and are significantly more secure and energy-efficient than solid wood. Vulnerabilities: the bottom rail and door face are susceptible to rust when the finish is compromised. Scratches and chips should be touched up promptly.</p>
        <h3>Fiberglass doors</h3>
        <p>The performance leader for residential entry doors. Fiberglass doesn't rust, doesn't warp, doesn't conduct heat, and can be textured to look like wood grain. It's significantly more expensive than steel but outperforms it in energy efficiency, durability, and maintenance requirements.</p>
        <h3>Wood doors</h3>
        <p>Excellent insulator and beautiful, but requires maintenance. Solid wood doors swell in humidity and shrink in dry conditions. In direct sun exposure, an unprotected wood door can deteriorate rapidly.</p>
      </ProseSection>
      <LifespanTable title="Entry door lifespan by material" rows={[
        { material: "Steel door (maintained finish)", lifespan: "20–30 years", quality: "better" },
        { material: "Fiberglass door", lifespan: "30–50 years", quality: "best" },
        { material: "Solid wood (maintained)", lifespan: "30–50+ years", quality: "best" },
        { material: "Weatherstripping (compression foam)", lifespan: "5–10 years", quality: "good" },
        { material: "Weatherstripping (Q-lon bulb)", lifespan: "15–20 years", quality: "better" },
        { material: "Threshold seal", lifespan: "10–20 years", quality: "good" },
        { material: "Deadbolt hardware", lifespan: "20–30 years", quality: "better" },
      ]} />
      <SectionHeader id="components" icon="🔧" title="Key Components" />
      <ProseSection>
        <h3>Weatherstripping</h3>
        <p>The single most maintenance-intensive component of any door system. Foam compression strips compress permanently and stop sealing within 5-10 years. Q-lon bulb-style weatherstripping is significantly more durable. The paper test works for doors exactly as it does for windows: close the door on a piece of paper at various points. If it slides freely, the weatherstripping is no longer sealing.</p>
        <h3>Hardware and locks</h3>
        <p>A quality Grade 1 ANSI-rated deadbolt has a 1-inch throw. The strike plate matters: standard 2-screw strike plates are easily kicked in. A heavy-gauge strike plate with 3-inch screws reaching the door frame studs is significantly more secure. Most residential burglaries involving doors are kick-in attacks, not lock picking.</p>
      </ProseSection>
      <SectionHeader id="failure-timeline" icon="⏱️" title="Failure Timeline" />
      <FailureTimeline stages={[
        { age: "0–5 yrs", label: "New door", color: "green", description: "Annual weatherstripping inspection. Lubricate hinges, lockset, and deadbolt. Confirm threshold seal with paper test." },
        { age: "5–15 yrs", label: "Weatherstripping phase", color: "amber", description: "Foam weatherstripping typically needs replacement in this window. Test seal at all four sides and replace any failed sections." },
        { age: "15–25 yrs", label: "Threshold and hardware", color: "orange", description: "Threshold seal degradation. Check for moisture at sill. Hardware may begin to feel stiff." },
        { age: "25+ yrs", label: "System evaluation", color: "red", description: "Evaluate full door system replacement. Frame condition, threshold integrity, and weatherstripping should all be assessed together." },
      ]} />
      <SectionHeader id="inspection" icon="🔍" title="Inspection" />
      <ProseSection>
        <p>An annual door inspection takes about 5 minutes per door. Close the door and do the paper test at the latch side, hinge side, and top. Press on wood at the threshold and sill area — any softness indicates moisture. Check exterior caulk at all door trim joints. Operate the deadbolt fully — it should throw smoothly without force.</p>
      </ProseSection>
      <RedFlagChecklist flags={[
        { flag: "Paper slides freely around closed door — weatherstripping failed", severity: "watch" },
        { flag: "Soft or spongy wood at threshold when pressed — rot", severity: "urgent" },
        { flag: "Rust on bottom rail or door face", severity: "watch" },
        { flag: "Door that sticks or requires force to close — hinge area or frame issue", severity: "watch" },
        { flag: "Deadbolt that's stiff or difficult to throw fully", severity: "watch" },
        { flag: "Visible daylight at corners of frame when door is closed", severity: "urgent" },
      ]} />
      <SectionHeader id="who-to-call" icon="📞" title="Who to Call" />
      <ContractorQuestions questions={[
        { question: "Is this a door slab replacement or a full frame replacement?", whyItMatters: "If the frame or threshold area has moisture damage, a slab-only replacement leaves the problem in place." },
        { question: "What ANSI grade is the hardware, and what strike plate are you using?", whyItMatters: "ANSI Grade 1 is the standard for security. A heavy strike plate with 3-inch screws is the most cost-effective security upgrade on any entry door." },
      ]} />
    </GuideLayout>
  );
}
