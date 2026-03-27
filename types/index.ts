// ─────────────────────────────────────────────
// PROPERTY ROLES
// ─────────────────────────────────────────────

export type PropertyRole = "owner" | "co-owner" | "property-manager" | "contractor";

export interface PropertyMember {
  userId: string;
  email: string;
  name: string;
  role: PropertyRole;
  addedAt: string;
  addedBy: string;
}

// ─────────────────────────────────────────────
// HOME SYSTEMS
// ─────────────────────────────────────────────

export type SystemTag =
  | "roof" | "siding" | "gutters" | "windows" | "entry-doors"
  | "sliding-doors" | "hvac" | "water-heater" | "plumbing"
  | "electrical" | "foundation" | "deck" | "appliances"
  | "general" | "exterior" | "interior";

export interface KnownIssue {
  id: string;
  description: string;
  flaggedAt: string;
  severity: "low" | "medium" | "high";
  resolvedAt?: string;
}

export interface MaintenanceLog {
  taskType: string;
  completedAt: string;
  completedBy?: string;
  notes?: string;
}

export interface HomeSystem {
  id: SystemTag;
  label: string;
  material?: string;
  installYear?: number;
  lastReplacedYear?: number;
  ageYears?: number;
  lastServiceDate?: string;
  maintenanceLogs?: MaintenanceLog[];
  knownIssues?: KnownIssue[];
  consideringReplacing?: boolean;
  notes?: string;
  filterSize?: string;
  filterLastChanged?: string;
  tankSize?: number;
  fuelType?: "gas" | "electric" | "propane";
  lastFlushDate?: string;
  lastAnodeRodCheck?: string;
  lastCleaningDate?: string;
  lastTestDate?: string;
  hasBatteryBackup?: boolean;
  lastSweepDate?: string;
  lastSealDate?: string;
  photos?: string[];
}

// ─────────────────────────────────────────────
// HOME PROFILE
// ─────────────────────────────────────────────

export type HomeGoal = "standard" | "sell-prep" | "new-homeowner";

export interface StormEvent {
  id: string;
  date: string;
  type: "hail" | "wind" | "tornado" | "flood";
  hailSize?: number;
  windGust?: number;
  isHardHail?: boolean;
  meshConfirmed?: boolean;
  inspectionTriggered?: boolean;
  inspectionCompletedAt?: string;
}

export interface HomeProfile {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  yearBuilt?: number;
  squareFootage?: number;
  goal: HomeGoal;
  members: PropertyMember[];
  systems: Partial<Record<SystemTag, HomeSystem>>;
  stormEvents?: StormEvent[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────

export type TaskType = "smart" | "manual";
export type TaskStatus = "active" | "snoozed" | "completed" | "verified" | "dismissed";
export type TaskUrgency = "high" | "medium" | "low";
export type ResolutionPath = "log" | "checklist" | "contractor" | "acknowledge" | "report";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface WorkLogEntry {
  id: string;
  addedBy: string;
  addedByRole: PropertyRole;
  addedAt: string;
  notes?: string;
  status: "owner-noted" | "contractor-submitted" | "owner-verified";
  photos?: string[];
}

export interface ContractorShare {
  token: string;
  contractorUserId?: string;
  contractorEmail?: string;
  contractorName?: string;
  expiresAt: string;
  permissions: ("view" | "complete" | "upload-photos")[];
  accessedAt?: string;
}

export interface Task {
  id: string;
  homeId: string;
  type: TaskType;
  title: string;
  description: string;
  systemTag: SystemTag;
  urgency: TaskUrgency;
  status: TaskStatus;
  resolutionPath: ResolutionPath;
  checklistItems?: ChecklistItem[];
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  contractorShare?: ContractorShare;
  workLog?: WorkLogEntry[];
  dueDate?: string;
  snoozeUntil?: string;
  guideLink?: string;
  actionLabel?: string;
  triggeredBy?: "age" | "interval" | "storm" | "signal";
  triggerData?: Record<string, unknown>;
  completedAt?: string;
  completedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartTaskResult {
  displayed: Task[];
  all: Task[];
  lastCalculatedAt: string;
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export type NotificationType =
  | "task-assigned" | "task-completed" | "task-verified"
  | "contractor-submitted" | "storm-event" | "system-alert";

export interface Notification {
  id: string;
  homeId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  relatedTaskId?: string;
  relatedSystemTag?: SystemTag;
  createdAt: string;
  readAt?: string;
}

// ─────────────────────────────────────────────
// HOME REPORT
// ─────────────────────────────────────────────

export interface ReportSystemSummary {
  systemTag: SystemTag;
  label: string;
  material?: string;
  ageYears?: number;
  installYear?: number;
  conditionStatus: "good" | "monitor" | "action-needed" | "unknown";
  lastServiceDate?: string;
  maintenanceCount: number;
  knownIssues: KnownIssue[];
  resolvedTasks: Task[];
}

export interface HomeReport {
  id: string;
  homeId: string;
  generatedAt: string;
  shareToken: string;
  shareExpiresAt?: string;
  home: Pick<HomeProfile, "address" | "city" | "state" | "zip" | "yearBuilt" | "squareFootage">;
  systems: ReportSystemSummary[];
  stormEvents: StormEvent[];
  totalMaintenanceLogs: number;
  totalResolvedTasks: number;
  generatedBy: string;
}

// ─────────────────────────────────────────────
// GUIDES
// ─────────────────────────────────────────────

export type GuideSlug =
  | "roof" | "siding" | "gutters" | "windows"
  | "entry-doors" | "sliding-doors" | "hvac" | "water-heater";

export interface GuideSection {
  id: string;
  title: string;
  anchor: string;
}

export interface GuideMeta {
  slug: GuideSlug;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  readTime: string;
  lastUpdated: string;
  sections: GuideSection[];
  relatedGuides: GuideSlug[];
  clusterArticles?: ClusterArticleStub[];
}

export interface ClusterArticleStub {
  slug: string;
  title: string;
  targetKeyword: string;
  parentGuide: GuideSlug;
  status: "stub" | "draft" | "published";
  description: string;
}

export interface ContentRequest {
  id: string;
  question: string;
  email?: string;
  relatedGuide?: GuideSlug;
  submittedAt: string;
  status: "new" | "planned" | "published";
  publishedArticleSlug?: string;
}
