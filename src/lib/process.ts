/**
 * Process raw ClickUp time entries into chart-ready data.
 */

import { USER_ID_TO_NAME, EMPLOYEES, HOURS_PER_MONTH, getHourlyCost, getMonthlyCost } from './config';
import { classifyTask } from './classify';
import type { ClickUpEntry, DashboardData, RetainerLookup } from './types';

function msToHours(ms: number): number {
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
}

function calcMonthSpan(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24) + 1;
  return Math.max(diffDays / 30.44, 0.01);
}

/**
 * Process raw ClickUp time entries into chart-ready data.
 */
export function processEntries(entries: ClickUpEntry[], startDate: string, endDate: string): DashboardData {
  const employeeMap: Record<string, number> = {};      // name -> totalMs
  const clientMap: Record<string, number> = {};        // clientName -> totalMs
  const internalMap: Record<string, number> = {};      // category -> totalMs
  const empClientMap: Record<string, number> = {};     // "emp|||client" -> totalMs
  const taskMap: Record<string, { name: string; client: string; totalMs: number; employees: Set<string> }> = {};
  const dailyMap: Record<string, number> = {};         // "YYYY-MM-DD" -> totalMs

  for (const entry of entries) {
    const userId = entry.user?.id?.toString();
    const empName = userId ? (USER_ID_TO_NAME[userId] || entry.user?.username || 'Unknown') : (entry.user?.username || 'Unknown');
    const duration = parseInt(entry.duration as string, 10) || 0;

    // Employee totals
    employeeMap[empName] = (employeeMap[empName] || 0) + duration;

    // Classification
    const classification = classifyTask(entry.task);
    const label = classification.type === 'client'
      ? classification.clientName!
      : classification.category!;

    if (classification.type === 'client') {
      clientMap[label] = (clientMap[label] || 0) + duration;
    } else {
      internalMap[label] = (internalMap[label] || 0) + duration;
    }

    // Employee x Client
    const empClientKey = `${empName}|||${label}`;
    empClientMap[empClientKey] = (empClientMap[empClientKey] || 0) + duration;

    // Task aggregation
    const taskId = entry.task?.id || 'no-task';
    const taskName = entry.task?.name || entry.description || 'Untitled';
    if (!taskMap[taskId]) {
      taskMap[taskId] = {
        name: taskName,
        client: label,
        totalMs: 0,
        employees: new Set(),
      };
    }
    taskMap[taskId].totalMs += duration;
    taskMap[taskId].employees.add(empName);

    // Daily trend
    const startMs = parseInt(entry.start, 10);
    if (startMs) {
      const date = new Date(startMs).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + duration;
    }
  }

  // Build sorted arrays
  const employees = Object.entries(employeeMap)
    .map(([name, ms]) => ({
      name,
      totalHours: msToHours(ms),
      isPayroll: EMPLOYEES[name]?.type === 'employee' || EMPLOYEES[name]?.type === 'founder',
    }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const clients = Object.entries(clientMap)
    .map(([name, ms]) => ({ name, totalHours: msToHours(ms) }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const internalCategories = Object.entries(internalMap)
    .map(([name, ms]) => ({ name, totalHours: msToHours(ms) }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const employeeByClient = Object.entries(empClientMap)
    .map(([key, ms]) => {
      const [employee, client] = key.split('|||');
      return { employee, client, hours: msToHours(ms) };
    })
    .sort((a, b) => b.hours - a.hours);

  const topTasks = Object.values(taskMap)
    .map((t) => ({
      name: t.name,
      client: t.client,
      totalHours: msToHours(t.totalMs),
      employees: [...t.employees],
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 15);

  // Fill in all dates in range for daily trend
  const dailyTrend: { date: string; hours: number }[] = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyTrend.push({
      date: dateStr,
      hours: msToHours(dailyMap[dateStr] || 0),
    });
  }

  const totalClientMs = Object.values(clientMap).reduce((a, b) => a + b, 0);
  const totalInternalMs = Object.values(internalMap).reduce((a, b) => a + b, 0);

  return {
    period: { start: startDate, end: endDate },
    employees,
    clients,
    internalCategories,
    employeeByClient,
    topTasks,
    dailyTrend,
    summary: {
      totalHours: msToHours(totalClientMs + totalInternalMs),
      totalEntries: entries.length,
      clientHours: msToHours(totalClientMs),
      internalHours: msToHours(totalInternalMs),
      employeesActive: employees.length,
    },
  };
}

/**
 * Process entries filtered to a single employee.
 * Separates client work from internal GPS work.
 */
export function processEmployeeDetail(
  entries: ClickUpEntry[],
  employeeName: string,
  startDate: string,
  endDate: string,
) {
  const clientMap: Record<string, number> = {};      // clientName -> ms
  const internalMap: Record<string, number> = {};    // category -> ms
  const taskMap: Record<string, { name: string; client: string; totalMs: number; isInternal: boolean }> = {};
  const dailyMap: Record<string, number> = {};       // date -> ms
  let totalMs = 0;
  let clientMs = 0;
  let internalMs = 0;

  for (const entry of entries) {
    const userId = entry.user?.id?.toString();
    const empName = userId ? (USER_ID_TO_NAME[userId] || entry.user?.username || 'Unknown') : (entry.user?.username || 'Unknown');
    if (empName !== employeeName) continue;

    const duration = parseInt(entry.duration as string, 10) || 0;
    totalMs += duration;

    const classification = classifyTask(entry.task);

    if (classification.type === 'client') {
      clientMap[classification.clientName!] = (clientMap[classification.clientName!] || 0) + duration;
      clientMs += duration;
    } else {
      internalMap[classification.category!] = (internalMap[classification.category!] || 0) + duration;
      internalMs += duration;
    }

    const label = classification.type === 'client'
      ? classification.clientName!
      : classification.category!;

    const taskId = entry.task?.id || 'no-task';
    const taskName = entry.task?.name || entry.description || 'Untitled';
    if (!taskMap[taskId]) {
      taskMap[taskId] = { name: taskName, client: label, totalMs: 0, isInternal: classification.type === 'internal' };
    }
    taskMap[taskId].totalMs += duration;

    const startMs = parseInt(entry.start, 10);
    if (startMs) {
      const date = new Date(startMs).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + duration;
    }
  }

  const clients = Object.entries(clientMap)
    .map(([name, ms]) => ({ name, totalHours: msToHours(ms) }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const internalCategories = Object.entries(internalMap)
    .map(([name, ms]) => ({ name, totalHours: msToHours(ms) }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const topTasks = Object.values(taskMap)
    .map((t) => ({ name: t.name, client: t.client, totalHours: msToHours(t.totalMs), isInternal: t.isInternal }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 10);

  const dailyTrend: { date: string; hours: number }[] = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyTrend.push({ date: dateStr, hours: msToHours(dailyMap[dateStr] || 0) });
  }

  // Utilization metrics
  const empConfig = EMPLOYEES[employeeName];
  const monthSpan = calcMonthSpan(startDate, endDate);
  const availableHours = HOURS_PER_MONTH * monthSpan;
  const clientHoursVal = msToHours(clientMs);
  const utilizationRate = availableHours > 0
    ? Math.round((clientHoursVal / availableHours) * 1000) / 10
    : 0;

  return {
    employee: employeeName,
    period: { start: startDate, end: endDate },
    totalHours: msToHours(totalMs),
    clientHours: clientHoursVal,
    internalHours: msToHours(internalMs),
    clients,
    internalCategories,
    topTasks,
    dailyTrend,
    utilization: {
      rate: utilizationRate,
      availableHours: Math.round(availableHours * 100) / 100,
      hourlyCost: empConfig ? Math.round(getHourlyCost(employeeName) * 100) / 100 : null,
      effectiveHourlyCost: clientHoursVal > 0
        ? Math.round((getMonthlyCost(employeeName) * monthSpan / clientHoursVal) * 100) / 100
        : null,
      department: empConfig?.department || 'Unknown',
      role: empConfig?.role || 'Unknown',
      type: empConfig?.type || 'unknown',
    },
  };
}

/**
 * Process entries filtered to a single client.
 */
export function processClientDetail(
  entries: ClickUpEntry[],
  clientName: string,
  startDate: string,
  endDate: string,
  retainerLookup: RetainerLookup,
) {
  const employeeMap: Record<string, number> = {};  // empName -> ms
  const taskMap: Record<string, { name: string; totalMs: number; employees: Set<string> }> = {};
  const dailyMap: Record<string, number> = {};     // date -> ms
  let totalMs = 0;

  for (const entry of entries) {
    const classification = classifyTask(entry.task);
    const label = classification.type === 'client'
      ? classification.clientName!
      : classification.category!;
    if (label !== clientName) continue;

    const userId = entry.user?.id?.toString();
    const empName = userId ? (USER_ID_TO_NAME[userId] || entry.user?.username || 'Unknown') : (entry.user?.username || 'Unknown');
    const duration = parseInt(entry.duration as string, 10) || 0;
    totalMs += duration;

    employeeMap[empName] = (employeeMap[empName] || 0) + duration;

    const taskId = entry.task?.id || 'no-task';
    const taskName = entry.task?.name || entry.description || 'Untitled';
    if (!taskMap[taskId]) {
      taskMap[taskId] = { name: taskName, totalMs: 0, employees: new Set() };
    }
    taskMap[taskId].totalMs += duration;
    taskMap[taskId].employees.add(empName);

    const startMs = parseInt(entry.start, 10);
    if (startMs) {
      const date = new Date(startMs).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + duration;
    }
  }

  const employees = Object.entries(employeeMap)
    .map(([name, ms]) => ({ name, totalHours: msToHours(ms) }))
    .sort((a, b) => b.totalHours - a.totalHours);

  const topTasks = Object.values(taskMap)
    .map((t) => ({
      name: t.name,
      totalHours: msToHours(t.totalMs),
      employees: [...t.employees],
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 15);

  const dailyTrend: { date: string; hours: number }[] = [];
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyTrend.push({ date: dateStr, hours: msToHours(dailyMap[dateStr] || 0) });
  }

  // Budget and cost metrics
  const retainer = retainerLookup(clientName);
  const monthSpan = calcMonthSpan(startDate, endDate);
  const totalHoursVal = msToHours(totalMs);
  let totalCost = 0;
  for (const [empName, ms] of Object.entries(employeeMap)) {
    totalCost += msToHours(ms) * getHourlyCost(empName);
  }

  const budgetHours = retainer ? retainer.retainerHours * monthSpan : null;
  const retainerRevenue = retainer ? retainer.retainerRevenue * monthSpan : null;

  return {
    client: clientName,
    period: { start: startDate, end: endDate },
    totalHours: totalHoursVal,
    employees,
    topTasks,
    dailyTrend,
    budget: retainer ? {
      budgetHours: Math.round(budgetHours! * 100) / 100,
      budgetUsedPct: budgetHours! > 0
        ? Math.round((totalHoursVal / budgetHours!) * 1000) / 10
        : null,
      hoursRemaining: Math.round((budgetHours! - totalHoursVal) * 100) / 100,
      retainerRevenue: Math.round(retainerRevenue! * 100) / 100,
    } : null,
    cost: {
      totalCost: Math.round(totalCost * 100) / 100,
      profit: retainerRevenue !== null
        ? Math.round((retainerRevenue - totalCost) * 100) / 100
        : null,
      margin: retainerRevenue && retainerRevenue > 0
        ? Math.round(((retainerRevenue - totalCost) / retainerRevenue) * 1000) / 10
        : null,
    },
  };
}
