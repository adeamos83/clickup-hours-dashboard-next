/**
 * Types for the Client Tracker feature — a client-facing view of ClickUp tasks
 * for a given folder (one folder per client).
 */

export interface TrackerAssignee {
  id: string;
  username: string;
  email?: string;
  initials?: string;
  profilePicture?: string | null;
  color?: string;
}

export interface TrackerStatus {
  status: string;
  color: string;
  type: string; // 'open' | 'custom' | 'closed' | 'done'
}

export interface TrackerPriority {
  priority: string; // 'urgent' | 'high' | 'normal' | 'low'
  color: string;
}

export interface TrackerTask {
  id: string;
  name: string;
  description: string | null;
  url: string;
  listId: string | null;
  listName: string | null;
  status: TrackerStatus;
  bucket: TrackerBucket;
  priority: TrackerPriority | null;
  assignees: TrackerAssignee[];
  dueDate: number | null;
  startDate: number | null;
  parentId: string | null;
  subtaskIds: string[];
  subtaskProgress: { total: number; done: number } | null;
  dateCreated: number | null;
  dateUpdated: number | null;
  dateClosed: number | null;
}

export type TrackerBucket = 'todo' | 'in_progress' | 'review' | 'done';

export interface TrackerComment {
  id: string;
  author: string;
  authorEmail?: string;
  text: string;
  date: number;
}

export interface TrackerListSummary {
  id: string;
  name: string;
  total: number;
  done: number;
}

export interface TrackerSummary {
  totalTasks: number;
  completedTasks: number;
  progressPct: number;
  dueSoon: number; // tasks due in the next 7 days, not yet done
  overdue: number; // tasks past due and not yet done
  buckets: Record<TrackerBucket, number>;
  lists: TrackerListSummary[];
}

export interface TrackerData {
  client: { slug: string; name: string; description: string | null };
  summary: TrackerSummary;
  tasks: TrackerTask[];
  lastSynced: string | null;
}
