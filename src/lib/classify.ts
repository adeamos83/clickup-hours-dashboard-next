/**
 * Classify a ClickUp task as either client work or internal (GPS) work.
 *
 * In the ClickUp workspace, client work lives in folders named after the client
 * (e.g., "Green Energy of San Antonio", "Car Wash Advisory").
 * Internal GPS work lives in folders like "Daily Ops", "Team Meetings", "HR", etc.
 *
 * Classification priority: folder name > list name > space name.
 */

import type { Classification } from './types';

interface TaskLike {
  folder?: { id?: string; name?: string };
  list?: { id?: string; name?: string };
  space?: { id?: string; name?: string };
}

/**
 * Check if a folder name represents internal GPS work.
 * Returns the internal category name, or null if it's client work.
 */
function matchInternalFolder(folderLower: string): string | null {
  // Exact folder name matches
  const exactMap: Record<string, string> = {
    'hidden': 'GPS Internal',
    'daily ops': 'Operations',
    'ongoing maintenance': 'Internal Maintenance',
    'team meetings': 'Meetings',
    'training': 'Training',
    'payroll': 'Payroll',
    'hr': 'HR',
  };
  if (exactMap[folderLower]) return exactMap[folderLower];

  // Partial matches (folder name contains these phrases)
  if (folderLower.includes('dept standards')) return 'Dept Standards';
  if (folderLower.includes('team development') || folderLower.includes('kpi')) return 'Team Development';
  if (folderLower.includes('performance project')) return 'Performance';
  if (folderLower.includes('company performance')) return 'Performance';
  if (folderLower.includes('archive')) return 'Archive';

  // "Geek *" folders are internal GPS work
  if (folderLower.startsWith('geek time off')) return 'Time Off';
  if (folderLower.startsWith('geek onboarding')) return 'Onboarding';
  if (folderLower.startsWith('geek powered')) return 'GPS Internal';
  if (folderLower.startsWith('geek ')) return 'GPS Internal';

  return null;
}

/**
 * Check if a list name indicates internal work (fallback when folder is ambiguous).
 */
function matchInternalList(listLower: string): boolean {
  const patterns = [
    'internal', 'administrative', 'accounting', 'payroll',
    'submitted request', 'pto', 'time off', 'ooo',
  ];
  for (const p of patterns) {
    if (listLower.includes(p)) return true;
  }
  return false;
}

export function classifyTask(task: TaskLike | null | undefined): Classification {
  if (!task) {
    return { type: 'internal', category: 'Uncategorized' };
  }

  const folderName = task.folder?.name || '';
  const listName = task.list?.name || '';
  const spaceName = task.space?.name || '';
  const folderLower = folderName.toLowerCase().trim();
  const listLower = listName.toLowerCase().trim();

  // 1. Check folder name against internal patterns
  if (folderLower) {
    const internalCategory = matchInternalFolder(folderLower);
    if (internalCategory) {
      return { type: 'internal', category: internalCategory };
    }

    // Folder exists and is not internal -> it's a client name
    return { type: 'client', clientName: folderName };
  }

  // 2. No folder — check list name for internal indicators
  if (listLower && matchInternalList(listLower)) {
    return { type: 'internal', category: 'GPS Internal' };
  }

  // 3. Fall back to list name as client
  if (listName && listName !== 'hidden') {
    return { type: 'client', clientName: listName };
  }

  // 4. Fall back to space name
  if (spaceName && spaceName !== 'hidden') {
    return { type: 'client', clientName: spaceName };
  }

  return { type: 'internal', category: 'Uncategorized' };
}
