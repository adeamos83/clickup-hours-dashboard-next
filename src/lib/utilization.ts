/**
 * Utilization, cost analysis, and department breakdown processing.
 * Takes the same entries array as processEntries and computes utilization metrics.
 */

import { classifyTask } from './classify';
import {
  HOURS_PER_MONTH,
  EMPLOYEES,
  USER_ID_TO_NAME,
  getHourlyCost,
  getMonthlyCost,
} from './config';
import type { ClickUpEntry, RetainerLookup, UtilizationData } from './types';

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
 * Main utilization processor.
 */
export function processUtilization(
  entries: ClickUpEntry[],
  startDate: string,
  endDate: string,
  retainerLookup: RetainerLookup,
): UtilizationData {
  const monthSpan = calcMonthSpan(startDate, endDate);

  // Accumulators
  const empTotals: Record<string, { totalMs: number; clientMs: number; internalMs: number; clients: Record<string, number> }> = {};
  const clientTotals: Record<string, { totalMs: number; employees: Record<string, number> }> = {};

  for (const entry of entries) {
    const userId = entry.user?.id?.toString();
    const empName = userId ? (USER_ID_TO_NAME[userId] || entry.user?.username || 'Unknown') : (entry.user?.username || 'Unknown');
    const duration = parseInt(entry.duration as string, 10) || 0;
    const classification = classifyTask(entry.task);

    if (!empTotals[empName]) {
      empTotals[empName] = { totalMs: 0, clientMs: 0, internalMs: 0, clients: {} };
    }
    empTotals[empName].totalMs += duration;

    if (classification.type === 'client') {
      const clientName = classification.clientName!;
      empTotals[empName].clientMs += duration;
      empTotals[empName].clients[clientName] =
        (empTotals[empName].clients[clientName] || 0) + duration;

      if (!clientTotals[clientName]) {
        clientTotals[clientName] = { totalMs: 0, employees: {} };
      }
      clientTotals[clientName].totalMs += duration;
      clientTotals[clientName].employees[empName] =
        (clientTotals[clientName].employees[empName] || 0) + duration;
    } else {
      empTotals[empName].internalMs += duration;
    }
  }

  // Employee Utilization
  const availableHours = HOURS_PER_MONTH * monthSpan;

  const employeeUtilization = Object.entries(empTotals)
    .map(([name, data]) => {
      const empConfig = EMPLOYEES[name];
      const totalHours = msToHours(data.totalMs);
      const clientHours = msToHours(data.clientMs);
      const internalHours = msToHours(data.internalMs);
      const monthlyCost = empConfig ? getMonthlyCost(name) * monthSpan : 0;
      const utilizationRate = availableHours > 0
        ? Math.round((clientHours / availableHours) * 1000) / 10
        : 0;
      const effectiveHourlyCost = clientHours > 0
        ? Math.round((monthlyCost / clientHours) * 100) / 100
        : null;

      return {
        name,
        role: empConfig?.role || 'Unknown',
        department: empConfig?.department || 'Unknown',
        type: empConfig?.type || 'unknown',
        isClientBillable: empConfig?.isClientBillable ?? true,
        totalHours,
        clientHours,
        internalHours,
        availableHours: Math.round(availableHours * 100) / 100,
        utilizationRate,
        hourlyCost: empConfig ? Math.round(getHourlyCost(name) * 100) / 100 : 0,
        totalCost: Math.round(monthlyCost * 100) / 100,
        effectiveHourlyCost,
      };
    })
    .sort((a, b) => b.utilizationRate - a.utilizationRate);

  // Client Utilization
  const clientUtilization = Object.entries(clientTotals)
    .map(([name, data]) => {
      const retainer = retainerLookup(name);
      const actualHours = msToHours(data.totalMs);
      const budgetHours = retainer ? retainer.retainerHours * monthSpan : null;
      const retainerRevenue = retainer ? retainer.retainerRevenue * monthSpan : null;

      let totalCost = 0;
      const employeeBreakdown = Object.entries(data.employees)
        .map(([empName, ms]) => {
          const hours = msToHours(ms);
          const cost = hours * getHourlyCost(empName);
          totalCost += cost;
          return {
            name: empName,
            hours,
            cost: Math.round(cost * 100) / 100,
            department: EMPLOYEES[empName]?.department || 'Unknown',
          };
        })
        .sort((a, b) => b.hours - a.hours);

      const budgetUsedPct = budgetHours && budgetHours > 0
        ? Math.round((actualHours / budgetHours) * 1000) / 10
        : null;
      const hoursRemaining = budgetHours !== null
        ? Math.round((budgetHours - actualHours) * 100) / 100
        : null;
      const profit = retainerRevenue !== null
        ? Math.round((retainerRevenue - totalCost) * 100) / 100
        : null;
      const margin = retainerRevenue && retainerRevenue > 0
        ? Math.round((profit! / retainerRevenue) * 1000) / 10
        : null;

      let status = 'no-budget';
      if (budgetUsedPct !== null) {
        status = budgetUsedPct > 100 ? 'over-budget' : budgetUsedPct > 80 ? 'at-risk' : 'on-track';
      }

      if (!retainer) {
        console.log(`  [utilization] No retainer data for client: "${name}"`);
      }

      return {
        name,
        actualHours,
        budgetHours: budgetHours !== null ? Math.round(budgetHours * 100) / 100 : null,
        budgetUsedPct,
        hoursRemaining,
        retainerRevenue: retainerRevenue !== null ? Math.round(retainerRevenue * 100) / 100 : null,
        totalCost: Math.round(totalCost * 100) / 100,
        profit,
        margin,
        status,
        isOverridden: retainer ? retainer.isOverridden === true : false,
        employeeBreakdown,
      };
    })
    .sort((a, b) => b.actualHours - a.actualHours);

  // Department Breakdown
  const deptAccum: Record<string, {
    totalHours: number;
    clientHours: number;
    internalHours: number;
    headcount: Set<string>;
    totalCost: number;
  }> = {};

  for (const emp of employeeUtilization) {
    const dept = emp.department;
    if (!deptAccum[dept]) {
      deptAccum[dept] = {
        totalHours: 0, clientHours: 0, internalHours: 0,
        headcount: new Set(), totalCost: 0,
      };
    }
    deptAccum[dept].totalHours += emp.totalHours;
    deptAccum[dept].clientHours += emp.clientHours;
    deptAccum[dept].internalHours += emp.internalHours;
    deptAccum[dept].headcount.add(emp.name);
    deptAccum[dept].totalCost += emp.totalCost;
  }

  const departmentBreakdown = Object.entries(deptAccum)
    .map(([dept, data]) => {
      const headcount = data.headcount.size;
      const deptAvailable = headcount * availableHours;
      const utilizationRate = deptAvailable > 0
        ? Math.round((data.clientHours / deptAvailable) * 1000) / 10
        : 0;

      return {
        department: dept,
        totalHours: Math.round(data.totalHours * 100) / 100,
        clientHours: Math.round(data.clientHours * 100) / 100,
        internalHours: Math.round(data.internalHours * 100) / 100,
        headcount,
        availableHours: Math.round(deptAvailable * 100) / 100,
        utilizationRate,
        totalCost: Math.round(data.totalCost * 100) / 100,
        avgCostPerHour: data.totalHours > 0
          ? Math.round((data.totalCost / data.totalHours) * 100) / 100
          : 0,
        members: [...data.headcount],
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  // Summary
  const billableEmps = employeeUtilization.filter((e) => e.isClientBillable);
  const totalClientHours = billableEmps.reduce((s, e) => s + e.clientHours, 0);
  const totalAvailable = billableEmps.length * availableHours;
  const overallUtilization = totalAvailable > 0
    ? Math.round((totalClientHours / totalAvailable) * 1000) / 10
    : 0;

  const totalLaborCost = employeeUtilization.reduce((s, e) => s + e.totalCost, 0);
  const totalRevenue = clientUtilization.reduce((s, c) => s + (c.retainerRevenue || 0), 0);
  const totalProfit = totalRevenue - totalLaborCost;

  const overBudgetClients = clientUtilization.filter((c) => c.status === 'over-budget').length;
  const atRiskClients = clientUtilization.filter((c) => c.status === 'at-risk').length;

  return {
    period: { start: startDate, end: endDate, monthSpan: Math.round(monthSpan * 100) / 100 },
    summary: {
      overallUtilization,
      totalLaborCost: Math.round(totalLaborCost * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: totalRevenue > 0
        ? Math.round((totalProfit / totalRevenue) * 1000) / 10
        : null,
      overBudgetClients,
      atRiskClients,
      billableEmployees: billableEmps.length,
      avgUtilization: billableEmps.length > 0
        ? Math.round(billableEmps.reduce((s, e) => s + e.utilizationRate, 0) / billableEmps.length * 10) / 10
        : 0,
    },
    employeeUtilization,
    clientUtilization,
    departmentBreakdown,
  };
}
