"use client";

import { useState } from "react";
import type { Task, PropertyRole, ChecklistItem } from "../../types";

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  currentUserRole: PropertyRole;
  members: { userId: string; name: string; role: PropertyRole }[];
  onAssign: (taskId: string, userId: string) => void;
  onComplete: (taskId: string, items?: ChecklistItem[]) => void;
  onSnooze: (taskId: string, days: number) => void;
  onDismiss: (taskId: string, reason: string) => void;
  onAddNote: (taskId: string, note: string) => void;
  onShareContractor: (taskId: string) => void;
}

const URGENCY_CONFIG = {
  high: { label: "Urgent", dot: "bg-red-500", border: "border-l-red-500", badge: "bg-red-50 text-red-700 ring-red-200" },
  medium: { label: "This season", dot: "bg-amber-400", border: "border-l-amber-400", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  low: { label: "On your radar", dot: "bg-stone-300", border: "border-l-stone-300", badge: "bg-stone-50 text-stone-600 ring-stone-200" },
};

const SYSTEM_ICONS: Record<string, string> = {
  roof: "🏠", siding: "🪵", gutters: "🌧️", windows: "🪟",
  "entry-doors": "🚪", "sliding-doors": "🚪", hvac: "❄️",
  "water-heater": "🔥", plumbing: "🔧", electrical: "⚡",
  foundation: "🏗️", deck: "🌿", appliances: "🧊", general: "🏡", exterior: "🌤️",
};

export default function TaskCard({ task, currentUserId, currentUserRole, members, onAssign, onComplete, onSnooze, onDismiss, onShareContractor, onAddNote }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklistItems || []);
  const [showAssign, setShowAssign] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  const config = URGENCY_CONFIG[task.urgency];
  const icon = SYSTEM_ICONS[task.systemTag] || "🏠";
  const canEdit = currentUserRole === "owner" || currentUserRole === "co-owner";
  const allChecked = checklist.length > 0 && checklist.every((i) => i.completed);

  function toggleItem(id: string) {
    if (!canEdit && task.assignedTo !== currentUserId) return;
    setChecklist((prev) => prev.map((item) => item.id === id
      ? { ...item, completed: !item.completed, completedAt: new Date().toISOString(), completedBy: currentUserId }
      : item));
  }

  return (
    <div className={`bg-white rounded-xl border border-stone-200 border-l-4 ${config.border} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ${config.badge}`}>{config.label}</span>
              {task.type === "manual" && <span className="text-xs font-medium px-2 py-0.5 rounded-full ring-1 bg-blue-50 text-blue-700 ring-blue-200">Manual</span>}
              {task.assignedTo && task.assignedTo !== currentUserId && (
                <span className="text-xs text-stone-500">Assigned to {members.find((m) => m.userId === task.assignedTo)?.name || "contractor"}</span>
              )}
            </div>
            <h3 className="font-semibold text-stone-900 leading-snug">{task.title}</h3>
            <p className="text-sm text-stone-600 mt-1 leading-relaxed">{task.description}</p>
          </div>
          <button className="text-stone-400 flex-shrink-0 ml-2 mt-1">
            <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100">
          {checklist.length > 0 && (
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Service checklist</p>
              {checklist.map((item) => (
                <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input type="checkbox" checked={item.completed} onChange={() => toggleItem(item.id)} className="sr-only" />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${item.completed ? "bg-amber-500 border-amber-500" : "border-stone-300 group-hover:border-amber-400"}`}>
                      {item.completed && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10.28 1.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-8a1 1 0 10-1.414-1.414z" /></svg>}
                    </div>
                  </div>
                  <span className={`text-sm leading-relaxed ${item.completed ? "line-through text-stone-400" : "text-stone-700"}`}>{item.label}</span>
                </label>
              ))}
              {allChecked && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium">All items complete — ready to log?</p>
                </div>
              )}
            </div>
          )}

          {task.workLog && task.workLog.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Work log</p>
              {task.workLog.map((entry) => (
                <div key={entry.id} className="text-sm bg-stone-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.status === "owner-verified" ? "bg-green-100 text-green-700" : entry.status === "contractor-submitted" ? "bg-blue-100 text-blue-700" : "bg-stone-200 text-stone-600"}`}>
                      {entry.status === "owner-verified" ? "Verified" : entry.status === "contractor-submitted" ? "Contractor submitted" : "Note"}
                    </span>
                    <span className="text-stone-400 text-xs">{new Date(entry.addedAt).toLocaleDateString()}</span>
                  </div>
                  {entry.notes && <p className="text-stone-700">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {canEdit && showNote && (
            <div className="px-4 pb-4">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note to this task..." className="w-full text-sm border border-stone-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" rows={2} />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { onAddNote(task.id, note); setNote(""); setShowNote(false); }} className="text-sm bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700">Save note</button>
                <button onClick={() => setShowNote(false)} className="text-sm text-stone-500 px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}

          {canEdit && showAssign && (
            <div className="px-4 pb-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Assign to</p>
              <div className="space-y-1">
                {members.map((m) => (
                  <button key={m.userId} onClick={() => { onAssign(task.id, m.userId); setShowAssign(false); }} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="text-xs text-stone-400 capitalize">{m.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {canEdit && showDismiss && (
            <div className="px-4 pb-4">
              <textarea value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} placeholder="Why are you dismissing this task? (optional)" className="w-full text-sm border border-stone-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" rows={2} />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { onDismiss(task.id, dismissReason); setShowDismiss(false); }} className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Dismiss task</button>
                <button onClick={() => setShowDismiss(false)} className="text-sm text-stone-500 px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}

          {task.guideLink && (
            <div className="px-4 pb-2">
              <a href={task.guideLink} className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Read the guide
              </a>
            </div>
          )}

          <div className="px-4 py-3 border-t border-stone-100 flex flex-wrap gap-2">
            {canEdit && <button onClick={() => onComplete(task.id, checklist.length > 0 ? checklist : undefined)} className="text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">{task.actionLabel || "Mark complete"}</button>}
            {canEdit && <button onClick={() => onSnooze(task.id, 30)} className="text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-lg transition-colors">Snooze 30 days</button>}
            {canEdit && <button onClick={() => setShowAssign((v) => !v)} className="text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-lg transition-colors">Assign</button>}
            {canEdit && <button onClick={() => onShareContractor(task.id)} className="text-sm text-stone-600 border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-lg transition-colors">Share with contractor</button>}
            {canEdit && <button onClick={() => setShowNote((v) => !v)} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-2 transition-colors">+ Note</button>}
            {canEdit && <button onClick={() => setShowDismiss((v) => !v)} className="text-sm text-stone-400 hover:text-red-500 px-2 py-2 transition-colors ml-auto">Dismiss</button>}
          </div>
        </div>
      )}
    </div>
  );
}
