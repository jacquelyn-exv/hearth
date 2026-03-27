"use client";

import type { HomeReport, ReportSystemSummary } from "../../types";

const CONDITION_CONFIG = {
  good: { label: "Good", color: "text-green-700", bg: "bg-green-50", ring: "ring-green-200", dot: "bg-green-500" },
  monitor: { label: "Monitor", color: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", dot: "bg-amber-400" },
  "action-needed": { label: "Action needed", color: "text-red-700", bg: "bg-red-50", ring: "ring-red-200", dot: "bg-red-500" },
  unknown: { label: "Not recorded", color: "text-stone-500", bg: "bg-stone-50", ring: "ring-stone-200", dot: "bg-stone-300" },
};

const SYSTEM_ICONS: Record<string, string> = {
  roof: "🏠", siding: "🪵", gutters: "🌧️", windows: "🪟",
  "entry-doors": "🚪", "sliding-doors": "🚪", hvac: "❄️",
  "water-heater": "🔥", plumbing: "🔧", electrical: "⚡",
  foundation: "🏗️", deck: "🌿", appliances: "🧊", general: "🏡",
};

function SystemCard({ system }: { system: ReportSystemSummary }) {
  const cond = CONDITION_CONFIG[system.conditionStatus];
  const icon = SYSTEM_ICONS[system.systemTag] || "🏠";
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-stone-900">{system.label}</h3>
            {system.material && <p className="text-xs text-stone-500 mt-0.5 capitalize">{system.material.replace(/-/g, " ")}</p>}
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${cond.bg} ${cond.color} ${cond.ring} flex-shrink-0`}>{cond.label}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-stone-900">{system.ageYears !== undefined ? system.ageYears : "—"}</p>
          <p className="text-xs text-stone-500 mt-0.5">Years old</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-stone-900">{system.maintenanceCount}</p>
          <p className="text-xs text-stone-500 mt-0.5">Service records</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-stone-900">{system.resolvedTasks.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Tasks resolved</p>
        </div>
      </div>
      {system.lastServiceDate && <p className="text-xs text-stone-500 mb-3">Last serviced: {new Date(system.lastServiceDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>}
      {system.knownIssues.length > 0 && (
        <div className="space-y-1.5">
          {system.knownIssues.map((issue) => (
            <div key={issue.id} className="flex items-start gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
              <div>
                <p className="text-red-700">{issue.description}</p>
                {issue.resolvedAt && <p className="text-red-400 mt-0.5">Resolved {new Date(issue.resolvedAt).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {system.resolvedTasks.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Completed work</p>
          {system.resolvedTasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-start gap-2 text-xs">
              <span className="text-green-500 mt-0.5">✓</span>
              <div>
                <span className="text-stone-700">{task.title}</span>
                {task.completedAt && <span className="text-stone-400 ml-1.5">{new Date(task.completedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
              </div>
            </div>
          ))}
          {system.resolvedTasks.length > 3 && <p className="text-xs text-stone-400 pl-4">+{system.resolvedTasks.length - 3} more</p>}
        </div>
      )}
    </div>
  );
}

export default function HomeReportView({ report, isPrintMode = false }: { report: HomeReport; isPrintMode?: boolean }) {
  const shareUrl = `https://homehearth.app/report/${report.shareToken}`;
  const conditionSummary = {
    good: report.systems.filter((s) => s.conditionStatus === "good").length,
    monitor: report.systems.filter((s) => s.conditionStatus === "monitor").length,
    action: report.systems.filter((s) => s.conditionStatus === "action-needed").length,
  };

  return (
    <div className={`min-h-screen bg-stone-50 ${isPrintMode ? "print:bg-white" : ""}`}>
      <div className="bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏡</span>
                <span className="text-amber-400 font-semibold text-lg">Hearth</span>
                <span className="text-stone-500 text-sm ml-1">Home Report</span>
              </div>
              <h1 className="text-2xl font-bold leading-tight">{report.home.address}</h1>
              <p className="text-stone-400 mt-1">{report.home.city}, {report.home.state} {report.home.zip}</p>
              <p className="text-stone-500 text-sm mt-2">Report generated {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {report.home.yearBuilt && (
                <div>
                  <p className="text-3xl font-bold">{new Date().getFullYear() - report.home.yearBuilt}</p>
                  <p className="text-stone-400 text-sm">Year old home</p>
                  <p className="text-stone-500 text-xs mt-0.5">Built {report.home.yearBuilt}</p>
                </div>
              )}
              {report.home.squareFootage && <p className="text-stone-400 text-sm mt-2">{report.home.squareFootage.toLocaleString()} sq ft</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-stone-800">
            <div><p className="text-2xl font-bold text-white">{report.systems.length}</p><p className="text-stone-400 text-xs mt-0.5">Systems tracked</p></div>
            <div><p className="text-2xl font-bold text-green-400">{conditionSummary.good}</p><p className="text-stone-400 text-xs mt-0.5">In good condition</p></div>
            <div><p className="text-2xl font-bold text-white">{report.totalMaintenanceLogs}</p><p className="text-stone-400 text-xs mt-0.5">Service records</p></div>
            <div><p className="text-2xl font-bold text-white">{report.totalResolvedTasks}</p><p className="text-stone-400 text-xs mt-0.5">Tasks completed</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">System overview</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Good condition", count: conditionSummary.good, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
              { label: "Monitoring", count: conditionSummary.monitor, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
              { label: "Action needed", count: conditionSummary.action, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4 text-center`}>
                <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
                <p className={`text-sm ${item.color} mt-1`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">System details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {report.systems.map((system) => <SystemCard key={system.systemTag} system={system} />)}
          </div>
        </div>

        {report.stormEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Storm events</h2>
            <div className="space-y-2">
              {report.stormEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⛈️</span>
                  <div>
                    <p className="font-medium text-stone-900 capitalize">{event.type} event — {new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {event.type === "hail" && event.hailSize && `${event.hailSize}" hail`}
                      {event.type === "wind" && event.windGust && `${event.windGust} mph gusts`}
                      {event.inspectionCompletedAt ? ` · Inspected ${new Date(event.inspectionCompletedAt).toLocaleDateString()}` : " · Inspection not recorded"}
                    </p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${event.inspectionCompletedAt ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>
                    {event.inspectionCompletedAt ? "Inspected" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isPrintMode && (
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-stone-900 mb-1">Share this report</h3>
                <p className="text-sm text-stone-500 mb-3">Send to buyers, insurance adjusters, or contractors. No login required.</p>
                <div className="flex gap-2">
                  <input type="text" value={shareUrl} readOnly className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 text-stone-700" />
                  <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition-colors">Copy link</button>
                </div>
              </div>
              <button onClick={() => window.print()} className="flex-shrink-0 px-4 py-2 border border-stone-200 text-stone-700 rounded-lg text-sm hover:bg-stone-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Export PDF
              </button>
            </div>
          </div>
        )}

        {!isPrintMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-sm text-amber-900 font-medium mb-1">This report was generated by Hearth</p>
            <p className="text-xs text-amber-700 mb-4">Track your home's systems, get smart maintenance reminders, and build a verified history — free.</p>
            <a href="https://homehearth.app" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">Create your free Hearth account</a>
          </div>
        )}
      </div>
    </div>
  );
}
