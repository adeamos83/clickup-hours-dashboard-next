/**
 * ClickUp API calls specific to the Client Tracker:
 * - Fetch all lists in a folder
 * - Fetch all tasks in a list (paginated, including subtasks and closed)
 * - Fetch comments for a task
 * - Post a comment to a task
 */

import { fetchWithRetry } from '../clickup';

const API_BASE = 'https://api.clickup.com/api/v2';

export interface RawClickUpList {
  id: string;
  name: string;
  task_count?: number | null;
  archived?: boolean;
}

export interface RawClickUpAssignee {
  id: number | string;
  username?: string;
  email?: string;
  color?: string;
  initials?: string;
  profilePicture?: string | null;
}

export interface RawClickUpStatus {
  status?: string;
  color?: string;
  type?: string;
  orderindex?: number;
}

export interface RawClickUpTask {
  id: string;
  name: string;
  text_content?: string | null;
  description?: string | null;
  status?: RawClickUpStatus;
  date_created?: string | null;
  date_updated?: string | null;
  date_closed?: string | null;
  date_done?: string | null;
  archived?: boolean;
  assignees?: RawClickUpAssignee[];
  priority?: { priority?: string; color?: string } | null;
  due_date?: string | null;
  start_date?: string | null;
  parent?: string | null;
  url?: string;
  list?: { id?: string; name?: string };
  folder?: { id?: string; name?: string };
  space?: { id?: string };
}

export interface RawClickUpComment {
  id: string;
  comment_text?: string;
  comment?: { text: string }[];
  user?: { id: number; username: string; email: string; profilePicture?: string | null };
  date?: string;
  resolved?: boolean;
}

export async function fetchListsInFolder(
  token: string,
  folderId: string,
): Promise<RawClickUpList[]> {
  const params = new URLSearchParams({ archived: 'false' });
  const data = await fetchWithRetry<{ lists: RawClickUpList[] }>(
    `${API_BASE}/folder/${folderId}/list?${params.toString()}`,
    { method: 'GET', headers: { Authorization: token } },
  );
  return data.lists || [];
}

export async function fetchTasksInList(
  token: string,
  listId: string,
): Promise<RawClickUpTask[]> {
  const all: RawClickUpTask[] = [];
  let page = 0;

  while (true) {
    const params = new URLSearchParams({
      archived: 'false',
      page: String(page),
      include_closed: 'true',
      subtasks: 'true',
    });

    const data = await fetchWithRetry<{ tasks: RawClickUpTask[]; last_page?: boolean }>(
      `${API_BASE}/list/${listId}/task?${params.toString()}`,
      { method: 'GET', headers: { Authorization: token } },
    );

    const tasks = data.tasks || [];
    all.push(...tasks);

    // ClickUp paginates at 100/page; stop when we get fewer or last_page flag set
    if (tasks.length < 100 || data.last_page === true) break;
    page++;
  }

  return all;
}

export async function fetchTaskComments(
  token: string,
  taskId: string,
): Promise<RawClickUpComment[]> {
  const data = await fetchWithRetry<{ comments: RawClickUpComment[] }>(
    `${API_BASE}/task/${taskId}/comment`,
    { method: 'GET', headers: { Authorization: token } },
  );
  return data.comments || [];
}

export async function postTaskComment(
  token: string,
  taskId: string,
  commentText: string,
): Promise<{ id: string; hist_id?: string }> {
  const data = await fetchWithRetry<{ id: string; hist_id?: string }>(
    `${API_BASE}/task/${taskId}/comment`,
    {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment_text: commentText,
        notify_all: true,
      }),
    },
  );
  return data;
}
