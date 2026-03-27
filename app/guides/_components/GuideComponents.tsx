interface LifespanRow {
  material: string;
  lifespan: string;
  notes?: string;
  quality?: "good" | "better" | "best";
}

export function LifespanTable({ title, rows }: { title?: string; rows: LifespanRow[] }) {
  const qualityColors = { good: "text-amber-600", better: "text-green-600", best: "text-emerald-700" };
  return (
    <div className="my-8 rounded-2xl border border-stone-200 overflow-hidden bg-white">
      {title && <div className="px-5 py-4 border-b border-stone-100 bg-stone-50"><p className="font-semibold text-stone-900 text-sm">{title}</p></div>}
      <div className="divide-y divide-stone-100">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors">
            <div className="flex-1">
              <span className="font-medium text-stone-800 text-sm">{row.material}</span>
              {row.notes && <span className="text-stone-400 text-xs ml-2">{row.notes}</span>}
            </div>
            <div className="flex items-center gap-3">
              {row.quality && <span className={`text-xs font-medium capitalize ${qualityColors[row.quality]}`}>{row.quality}</span>}
              <span className="font-bold text-stone-900 text-sm tabular-nums">{row.lifespan}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimelineStage {
  age: string;
  label: string;
  description: string;
  color: "green" | "amber" | "orange" | "red";
}

export function FailureTimeline({ title, stages }: { title?: string; stages: TimelineStage[] }) {
  const colorMap = {
    green: { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50 border-green-200" },
    amber: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    orange: { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    red: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50 border-red-200" },
  };
  return (
    <div className="my-8">
      {title && <h4 className="font-semibold text-stone-900 mb-4 text-sm uppercase tracking-wide">{title}</h4>}
      <div className="relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-stone-200 hidden sm:block" />
        <div className="space-y-4">
          {stages.map((stage, i) => {
            const c = colorMap[stage.color];
            return (
              <div key={i} className="flex gap-4 items-start relative">
                <div className={`w-12 h-12 rounded-full ${c.dot} flex items-center justify-center flex-shrink-0 z-10 shadow-sm`}>
                  <span className="text-white font-bold text-xs text-center leading-tight px-1">{stage.age}</span>
                </div>
                <div className={`flex-1 rounded-xl border p-4 ${c.bg}`}>
                  <p className={`font-semibold text-sm ${c.text}`}>{stage.label}</p>
                  <p className="text-stone-600 text-sm mt-1 leading-relaxed">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface RedFlag {
  flag: string;
  severity?: "watch" | "urgent" | "emergency";
}

export function RedFlagChecklist({ title, flags }: { title?: string; flags: RedFlag[] }) {
  const severityConfig = {
    watch: { icon: "👁", color: "text-amber-600" },
    urgent: { icon: "⚠️", color: "text-orange-700" },
    emergency: { icon: "🚨", color: "text-red-700" },
  };
  return (
    <div className="my-8 rounded-2xl border border-red-100 bg-red-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
        <span>🚩</span>
        <p className="font-semibold text-red-900 text-sm">{title || "Red flags to watch for"}</p>
      </div>
      <div className="divide-y divide-red-100">
        {flags.map((flag, i) => {
          const s = flag.severity ? severityConfig[flag.severity] : null;
          return (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <span className="text-red-400 mt-0.5 flex-shrink-0">{s ? s.icon : "•"}</span>
              <span className={`text-sm leading-relaxed ${s ? s.color : "text-red-800"}`}>{flag.flag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ContractorQuestion {
  question: string;
  whyItMatters: string;
}

export function ContractorQuestions({ title, questions }: { title?: string; questions: ContractorQuestion[] }) {
  return (
    <div className="my-8">
      <div className="flex items-center gap-2 mb-4">
        <span>🔨</span>
        <h4 className="font-semibold text-stone-900">{title || "Questions to ask your contractor"}</h4>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="font-medium text-stone-900 text-sm mb-1">"{q.question}"</p>
            <p className="text-stone-500 text-xs leading-relaxed">{q.whyItMatters}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type CalloutVariant = "tip" | "warning" | "insight" | "money";

const CALLOUT_CONFIG: Record<CalloutVariant, { icon: string; bg: string; border: string; title: string; text: string }> = {
  tip: { icon: "💡", bg: "bg-blue-50", border: "border-blue-200", title: "text-blue-900", text: "text-blue-800" },
  warning: { icon: "⚠️", bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-900", text: "text-amber-800" },
  insight: { icon: "🔍", bg: "bg-stone-50", border: "border-stone-200", title: "text-stone-900", text: "text-stone-700" },
  money: { icon: "💰", bg: "bg-green-50", border: "border-green-200", title: "text-green-900", text: "text-green-800" },
};

export function Callout({ variant = "tip", label, children }: { variant?: CalloutVariant; label?: string; children: React.ReactNode }) {
  const c = CALLOUT_CONFIG[variant];
  return (
    <div className={`my-6 rounded-xl border ${c.border} ${c.bg} px-5 py-4 flex gap-3`}>
      <span className="flex-shrink-0 text-lg">{c.icon}</span>
      <div>
        {label && <p className={`font-semibold text-sm mb-1 ${c.title}`}>{label}</p>}
        <div className={`text-sm leading-relaxed ${c.text}`}>{children}</div>
      </div>
    </div>
  );
}

interface StatCardProps { stat: string; label: string; context?: string; }

export function StatRow({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className={`my-8 grid gap-4 ${stats.length === 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-3xl font-bold text-stone-900">{s.stat}</p>
          <p className="text-sm font-medium text-stone-700 mt-1">{s.label}</p>
          {s.context && <p className="text-xs text-stone-400 mt-0.5">{s.context}</p>}
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ id, icon, title, subtitle }: { id: string; icon?: string; title: string; subtitle?: string }) {
  return (
    <div id={id} className="pt-12 pb-4 border-b border-stone-200 mb-6 scroll-mt-20">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
      </div>
      {subtitle && <p className="text-stone-500 text-base leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export function ProseSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-stone-700 text-base leading-relaxed space-y-4 [&>p]:text-stone-700 [&>h3]:font-semibold [&>h3]:text-stone-900 [&>h3]:text-lg [&>h3]:mt-6 [&>h3]:mb-2">
      {children}
    </div>
  );
}
