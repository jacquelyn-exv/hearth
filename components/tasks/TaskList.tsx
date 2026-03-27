"use client";

import { useState } from "react";
import type { Task, PropertyRole, SmartTaskResult, SystemTag, TaskUrgency, ChecklistItem } from "../../types";
import TaskCard from "./TaskCard";

interface TaskListProps {
  result: SmartTaskResult;
  currentUserId: string;
  currentUserRole: PropertyRole;
  members: { userId: string; name: string; role: PropertyRole }[];
  onTaskUpdate: (updated: Task) => void;
  onCreateManual: (task: Partial<Task>) => void;
}

const SYSTEM_OPTIONS: { value: SystemTag; label: string }[] = [
  { value: "roof", label: "Roof" },
  { value: "siding", label: "Siding" },
  { value: "gutters", label: "Gutters" },
  { value: "windows", label: "Windows" },
  { value: "entry-doors", label: "Entry Doors" },
  { value: "sliding-doors", label: "Sliding Doors" },
  { value: "hvac", label: "HVAC" },
  { value: "water-heater", label: "Water Heater" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "deck", label: "Deck" },
  { value: "appliances", label: "Appliances" },
  { value: "general", label: "General" },
];

export default function TaskList({ result, currentUserId, currentUserRole, members, onTaskUpdate, onCreateManual }: TaskListProps) {
  const [showAll, setShowAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContractorModal, setShowContractorModal] = useState<string | null>(null);
  const [contractorEmail, setContractorEmail] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [shareMethod, setShareMethod] = useState<"email" | "link">("link");
  const [generatedLink, setGeneratedLink] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", systemTag: "general" as SystemTag, urgency: "medium" as TaskUrgency, dueDate: "", assignedTo: "" });

  const canEdit = currentUserRole === "owner" || currentUserRole === "co-owner";
  const displayed = showAll ? result.all : result.displayed;
  const hiddenCount = result.all.length - result.displayed.length;

  function handleAssign(taskId: string, userId: string) {
    const task = result.all.find((t) => t.id === taskId);
    if (!task) return;
    onTaskUpdate({ ...task, assignedTo: userId, assignedBy: currentUserId, assignedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  function handleComplete(taskId: string, items?: ChecklistItem[]) {
    const task = result.all.find((t) => t.id === taskId);
    if (!task) return;
    onTaskUpdate({ ...task, status: "completed", checklistItems: items || task.checklistItems, completedAt: new Date().toISOString(), completedBy: currentUserId, updatedAt: new Date().toISOString() });
  }

  function handleSnooze(taskId: string, days: number) {
    const task = result.all.find((t) => t.id === taskId);
    if (!task) return;
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + days);
    onTaskUpdate({ ...task, status: "snoozed", snoozeUntil: snoozeUntil.toISOString(), updatedAt: new Date().toISOString() });
  }

  function handleDismiss(taskId: string, reason: string) {
    const task = result.all.find((t) => t.id === taskId);
    if (!task) return;
    onTaskUpdate({ ...task, status: "dismissed", dismissedAt: new Date().toISOString(), dismissedBy: currentUserId, dismissReason: reason, updatedAt: new Date().toISOString() });
  }

  function handleAddNote(taskId: string, note: string) {
    const task = result.all.find((t) => t.id === taskId);
    if (!task) return;
    onTaskUpdate({ ...task, workLog: [...(task.workLog || []), { id: `log-${Date.now()}`, addedBy: currentUserId, addedByRole: currentUserRole, addedAt: new Date().toISOString(), notes: note, status: "owner-noted" }], updatedAt: new Date().toISOString() });
  }

  function handleShareContractor(taskId: string) {
    setShowContractorModal(taskId);
    const token = Math.random().toString(36).substring(2, 15);
    setGeneratedLink(`https://homehearth.app/contractor/${token}`);
  }

  function handleCreateManual() {
    if (!newTask.title.trim()) return;
    onCreateManual({ ...newTask, type: "manual", status: "active", resolutionPath: "acknowledge", assignedTo: newTask.assignedTo || undefined, dueDate: newTask.dueDate || undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setNewTask({ title: "", description: "", systemTag: "general", urgency: "medium", dueDate: "", assignedTo: "" });
    setShowCreateModal(false);
  }

  const urgencyCounts = {
    high: result.all.filter((t) => t.urgency === "high").length,
    medium: result.all.filter((t) => t.urgency === "medium").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-stone-900">Your tasks</h2>
          <div className="flex items-center gap-2">
            {urgencyCounts.high > 0 && <span className="text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5 rounded-full">{urgencyCounts.high} urgent</span>}
            {urgencyCounts.medium > 0 && <span className="text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 rounded-full">{urgencyCounts.medium} this season</span>}
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowCreateModal(true)} className="text-sm bg-stone-800 hover:bg-stone-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add task
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayed.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium text-stone-600">No active tasks</p>
            <p className="text-sm mt-1">Your home is in good shape — check back as seasons change.</p>
          </div>
        )}
        {displayed.map((task) => (
          <TaskCard key={task.id} task={task} currentUserId={currentUserId} currentUserRole={currentUserRole} members={members}
            onAssign={handleAssign} onComplete={handleComplete} onSnooze={handleSnooze} onDismiss={handleDismiss} onAddNote={handleAddNote} onShareContractor={handleShareContractor} />
        ))}
      </div>

      {!showAll && hiddenCount > 0 && (
        <button onClick={() => setShowAll(true)} className="mt-4 w-full text-sm text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-300 rounded-xl py-3 transition-colors">
          Show {hiddenCount} more task{hiddenCount !== 1 ? "s" : ""}
        </button>
      )}
      {showAll && result.all.length > result.displayed.length && (
        <button onClick={() => setShowAll(false)} className="mt-4 w-full text-sm text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-300 rounded-xl py-3 transition-colors">Show less</button>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-stone-100">
              <h3 className="font-semibold text-stone-900 text-lg">New task</h3>
              <p className="text-sm text-stone-500 mt-1">Add a custom task to your home's list.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1.5">Title *</label>
                <input type="text" value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Call roofer about north flashing" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1.5">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} placeholder="More context about this task..." className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">System</label>
                  <select value={newTask.systemTag} onChange={(e) => setNewTask((p) => ({ ...p, systemTag: e.target.value as SystemTag }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                    {SYSTEM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Urgency</label>
                  <select value={newTask.urgency} onChange={(e) => setNewTask((p) => ({ ...p, urgency: e.target.value as TaskUrgency }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                    <option value="high">Urgent</option>
                    <option value="medium">This season</option>
                    <option value="low">On your radar</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Due date (optional)</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Assign to</label>
                  <select value={newTask.assignedTo} onChange={(e) => setNewTask((p) => ({ ...p, assignedTo: e.target.value }))} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-stone-100 flex gap-3">
              <button onClick={handleCreateManual} disabled={!newTask.title.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors">Create task</button>
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showContractorModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-stone-100">
              <h3 className="font-semibold text-stone-900 text-lg">Share with contractor</h3>
              <p className="text-sm text-stone-500 mt-1">The contractor sees the task and checklist only. They can mark complete and add notes. You verify the work.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setShareMethod("link")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${shareMethod === "link" ? "bg-stone-800 text-white border-stone-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>Shareable link</button>
                <button onClick={() => setShareMethod("email")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${shareMethod === "email" ? "bg-stone-800 text-white border-stone-800" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>Invite by email</button>
              </div>
              {shareMethod === "link" && (
                <div>
                  <p className="text-sm text-stone-600 mb-3">Share this link with any contractor — no Hearth account required. Expires in 30 days.</p>
                  <div className="flex gap-2">
                    <input type="text" value={generatedLink} readOnly className="flex-1 border border-stone-200 rounded-lg px-3 py-2.5 text-sm bg-stone-50 text-stone-700" />
                    <button onClick={() => navigator.clipboard.writeText(generatedLink)} className="px-4 py-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700">Copy</button>
                  </div>
                </div>
              )}
              {shareMethod === "email" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Contractor name</label>
                    <input type="text" value={contractorName} onChange={(e) => setContractorName(e.target.value)} placeholder="e.g. Mike's Roofing" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1.5">Contractor email</label>
                    <input type="email" value={contractorEmail} onChange={(e) => setContractorEmail(e.target.value)} placeholder="contractor@example.com" className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-stone-100">
              <button onClick={() => { setShowContractorModal(null); setContractorEmail(""); setContractorName(""); }} className="px-4 py-2.5 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
