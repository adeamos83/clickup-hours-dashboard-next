/**
 * Transform raw ClickUp tasks into the view model used by the client tracker UI.
 * Groups tasks into client-friendly buckets and computes a progress summary.
 */

import type { RawClickUpTask, RawClickUpAssignee } from './clickup';
import type {
  TrackerAssignee,
  TrackerBucket,
  TrackerData,
  TrackerListSummary,
  TrackerTask,
} from './types';
import type { TrackerClient } from './clients';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Map a ClickUp status to a client-friendly bucket.
 * ClickUp `status.type` is the standard signal:
 *   - 'open'   → To Do
 *   - 'closed' → Done
 *   - 'custom' → In Progress (default) or Review (if status name suggests it)
 * The bucket label is what clients see; the raw status name stays visible on the card.
 */
export function bucketForStatus(statusName: string | null, statusType: string | null): TrackerBucket {
  const type = (statusType || '').toLowerCase();
  if (type === 'closed' || type === 'done') return 'done';
  if (type === 'open') return 'todo';

  const name = (statusName || '').toLowerCase();
  if (
    name.includes('review') ||
    name.includes('qa') ||
    name.includes('approval') ||
    name.includes('pending') ||
    name.includes('client')
  ) {
    return 'review';
  }
  return 'in_progress';
}

function normalizeAssignee(a: RawClickUpAssignee): TrackerAssignee {
  return {
    id: String(a.id),
    username: a.username || 'Unknown',
    email: a.email,
    initials: a.initials,
    profilePicture: a.profilePicture ?? null,
    color: a.color,
  };
}

function mapTask(t: RawClickUpTask, allTasks: RawClickUpTask[]): TrackerTask {
  const statusName = t.status?.status ?? null;
  const statusType = t.status?.type ?? null;
  const bucket = bucketForStatus(statusName, statusType);

  const subtasks = allTasks.filter((s) => s.parent === t.id);
  const subtaskIds = subtasks.map((s) => s.id);

  const subtaskProgress =
    subtasks.length > 0
      ? {
          total: subtasks.length,
          done: subtasks.filter((s) => (s.status?.type || '').toLowerCase() === 'closed').length,
        }
      : null;

  const description =
    (t.text_content && t.text_content.trim()) ||
    (t.description && t.description.trim()) ||
    null;

  return {
    id: t.id,
    name: t.name,
    description,
    url: t.url || `https://app.clickup.com/t/${t.id}`,
    listId: t.list?.id ?? null,
    listName: t.list?.name ?? null,
    status: {
      status: statusName || 'unknown',
      color: t.status?.color || '#9ca3af',
      type: statusType || 'custom',
    },
    bucket,
    priority: t.priority
      ? {
          priority: t.priority.priority || 'normal',
          color: t.priority.color || '#9ca3af',
        }
      : null,
    assignees: (t.assignees || []).map(normalizeAssignee),
    dueDate: parseNumber(t.due_date),
    startDate: parseNumber(t.start_date),
    parentId: t.parent ?? null,
    subtaskIds,
    subtaskProgress,
    dateCreated: parseNumber(t.date_created),
    dateUpdated: parseNumber(t.date_updated),
    dateClosed: parseNumber(t.date_closed),
  };
}

function parseNumber(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function buildTrackerData(
  client: TrackerClient,
  rawTasks: RawClickUpTask[],
  lastSynced: Date | null,
): TrackerData {
  const tasks = rawTasks.map((t) => mapTask(t, rawTasks));

  // Summary excludes subtasks — we count top-level tasks only for progress to avoid
  // inflating numbers with tiny checklist items.
  const topLevel = tasks.filter((t) => !t.parentId);
  const completed = topLevel.filter((t) => t.bucket === 'done').length;
  const total = topLevel.length;

  const now = Date.now();
  const dueSoonCutoff = now + 7 * ONE_DAY_MS;
  const dueSoon = topLevel.filter(
    (t) => t.bucket !== 'done' && t.dueDate && t.dueDate >= now && t.dueDate <= dueSoonCutoff,
  ).length;
  const overdue = topLevel.filter(
    (t) => t.bucket !== 'done' && t.dueDate && t.dueDate < now,
  ).length;

  const buckets = {
    todo: topLevel.filter((t) => t.bucket === 'todo').length,
    in_progress: topLevel.filter((t) => t.bucket === 'in_progress').length,
    review: topLevel.filter((t) => t.bucket === 'review').length,
    done: topLevel.filter((t) => t.bucket === 'done').length,
  };

  // Per-list summary (uses top-level tasks only)
  const listMap = new Map<string, TrackerListSummary>();
  for (const t of topLevel) {
    if (!t.listId) continue;
    const existing = listMap.get(t.listId);
    if (existing) {
      existing.total += 1;
      if (t.bucket === 'done') existing.done += 1;
    } else {
      listMap.set(t.listId, {
        id: t.listId,
        name: t.listName || 'Untitled List',
        total: 1,
        done: t.bucket === 'done' ? 1 : 0,
      });
    }
  }
  const lists = Array.from(listMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return {
    client: { slug: client.slug, name: client.name, description: client.description },
    summary: {
      totalTasks: total,
      completedTasks: completed,
      progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      dueSoon,
      overdue,
      buckets,
      lists,
    },
    tasks,
    lastSynced: lastSynced ? lastSynced.toISOString() : null,
  };
}
