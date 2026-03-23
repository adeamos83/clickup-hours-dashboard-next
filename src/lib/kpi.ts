/**
 * KPI Engine — Salary scoping, capacity forecasting, position planning, billable availability.
 * Designed for cost analysis and workforce planning decisions.
 */

import { classifyTask } from './classify';
import {
  HOURS_PER_MONTH,
  HOURS_PER_YEAR,
  EMPLOYEES,
  USER_ID_TO_NAME,
  getHourlyCost,
} from './config';
import type { ClickUpEntry, RetainerLookup, KPIData } from './types';

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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Main KPI processor.
 */
export function processKPIs(
  entries: ClickUpEntry[],
  startDate: string,
  endDate: string,
  retainerLookup: RetainerLookup,
): KPIData {
  const monthSpan = calcMonthSpan(startDate, endDate);
  const availableHoursPerPerson = HOURS_PER_MONTH * monthSpan;

  // Accumulate per-employee data
  const empData: Record<string, { totalMs: number; clientMs: number; internalMs: number; clients: Record<string, number> }> = {};
  const clientTotals: Record<string, { totalMs: number; employees: Record<string, number> }> = {};

  for (const entry of entries) {
    const userId = entry.user?.id?.toString();
    const empName = userId ? (USER_ID_TO_NAME[userId] || entry.user?.username || 'Unknown') : (entry.user?.username || 'Unknown');
    const duration = parseInt(entry.duration as string, 10) || 0;
    const classification = classifyTask(entry.task);

    if (!empData[empName]) {
      empData[empName] = { totalMs: 0, clientMs: 0, internalMs: 0, clients: {} };
    }
    empData[empName].totalMs += duration;

    if (classification.type === 'client') {
      const clientName = classification.clientName!;
      empData[empName].clientMs += duration;
      empData[empName].clients[clientName] =
        (empData[empName].clients[clientName] || 0) + duration;

      if (!clientTotals[clientName]) {
        clientTotals[clientName] = { totalMs: 0, employees: {} };
      }
      clientTotals[clientName].totalMs += duration;
      clientTotals[clientName].employees[empName] =
        (clientTotals[clientName].employees[empName] || 0) + duration;
    } else {
      empData[empName].internalMs += duration;
    }
  }

  // Calculate revenue generated per employee (based on client retainers proportionally)
  const clientRevenue: Record<string, number> = {};
  for (const [clientName] of Object.entries(clientTotals)) {
    const retainer = retainerLookup(clientName);
    clientRevenue[clientName] = retainer ? retainer.retainerRevenue * monthSpan : 0;
  }

  // === SALARY SCOPING ===
  const salaryScoping = Object.entries(EMPLOYEES)
    .filter(([name, emp]) => emp.clickUpId || empData[name])
    .map(([name, emp]) => {
      const data = empData[name] || { totalMs: 0, clientMs: 0, internalMs: 0, clients: {} };
      const totalHours = msToHours(data.totalMs);
      const clientHours = msToHours(data.clientMs);
      const internalHours = msToHours(data.internalMs);

      const annualSalary = emp.annualSalary || 0;
      const monthlySalary = annualSalary / 12;
      const periodCost = monthlySalary * monthSpan;
      const hourlyCost = annualSalary / HOURS_PER_YEAR;
      const fullyLoadedCost = periodCost * 1.3; // 30% benefits/taxes overhead

      // Revenue attribution: proportional share of each client's retainer revenue
      let revenueGenerated = 0;
      for (const [clientName, ms] of Object.entries(data.clients)) {
        const clientTotal = clientTotals[clientName]?.totalMs || 1;
        const share = ms / clientTotal;
        revenueGenerated += (clientRevenue[clientName] || 0) * share;
      }

      const roi = periodCost > 0 ? round2(((revenueGenerated - periodCost) / periodCost) * 100) : 0;
      const revenuePerHour = clientHours > 0 ? round2(revenueGenerated / clientHours) : 0;
      const costPerBillableHour = clientHours > 0 ? round2(periodCost / clientHours) : null;
      const salaryToRevenueRatio = revenueGenerated > 0 ? round2(periodCost / revenueGenerated) : null;

      return {
        name,
        role: emp.role,
        department: emp.department,
        type: emp.type,
        isClientBillable: emp.isClientBillable,
        annualSalary,
        periodCost: round2(periodCost),
        fullyLoadedCost: round2(fullyLoadedCost),
        hourlyCost: round2(hourlyCost),
        totalHours,
        clientHours,
        internalHours,
        revenueGenerated: round2(revenueGenerated),
        roi,
        revenuePerHour,
        costPerBillableHour,
        salaryToRevenueRatio,
        utilizationRate: availableHoursPerPerson > 0
          ? round2((clientHours / availableHoursPerPerson) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  // === CAPACITY PLANNING ===
  const capacityPlanning = Object.entries(EMPLOYEES)
    .filter(([, emp]) => emp.isClientBillable)
    .map(([name, emp]) => {
      const data = empData[name] || { totalMs: 0, clientMs: 0, internalMs: 0 };
      const totalHoursWorked = msToHours(data.totalMs);
      const clientHours = msToHours(data.clientMs);
      const internalHours = msToHours(data.internalMs);

      const totalCapacity = availableHoursPerPerson;
      const availableHours = round2(Math.max(totalCapacity - totalHoursWorked, 0));
      const billableAvailable = round2(Math.max(totalCapacity - clientHours, 0));
      const capacityUsedPct = round2((totalHoursWorked / totalCapacity) * 100);
      const billableCapacityUsedPct = round2((clientHours / totalCapacity) * 100);

      // Projected next month (annualized rate from current period)
      const monthlyClientRate = clientHours / monthSpan;
      const monthlyTotalRate = totalHoursWorked / monthSpan;
      const projectedNextMonthClient = round2(monthlyClientRate);
      const projectedNextMonthTotal = round2(monthlyTotalRate);
      const projectedUtilization = round2((monthlyClientRate / HOURS_PER_MONTH) * 100);

      return {
        name,
        role: emp.role,
        department: emp.department,
        totalCapacity: round2(totalCapacity),
        totalHoursWorked,
        clientHours,
        internalHours,
        availableHours,
        billableAvailable,
        capacityUsedPct,
        billableCapacityUsedPct,
        projectedNextMonthClient,
        projectedNextMonthTotal,
        projectedUtilization,
        status: capacityUsedPct > 95 ? 'at-capacity'
          : capacityUsedPct > 80 ? 'high-load'
          : capacityUsedPct < 40 ? 'underutilized'
          : 'healthy',
      };
    })
    .sort((a, b) => b.capacityUsedPct - a.capacityUsedPct);

  // === POSITION FORECASTING ===
  // Analyzes each department for hiring needs based on utilization thresholds
  const deptAccum: Record<string, {
    members: string[];
    totalClientHours: number;
    totalCapacity: number;
    totalRevenue: number;
    totalCost: number;
  }> = {};

  for (const emp of salaryScoping) {
    if (!emp.isClientBillable) continue;
    const dept = emp.department;
    if (!deptAccum[dept]) {
      deptAccum[dept] = {
        members: [],
        totalClientHours: 0,
        totalCapacity: 0,
        totalRevenue: 0,
        totalCost: 0,
      };
    }
    deptAccum[dept].members.push(emp.name);
    deptAccum[dept].totalClientHours += emp.clientHours;
    deptAccum[dept].totalCapacity += availableHoursPerPerson;
    deptAccum[dept].totalRevenue += emp.revenueGenerated;
    deptAccum[dept].totalCost += emp.periodCost;
  }

  const TARGET_UTILIZATION = 75; // ideal utilization %
  const OVERLOAD_THRESHOLD = 85; // above this = need more people

  const positionForecast = Object.entries(deptAccum).map(([dept, data]) => {
    const headcount = data.members.length;
    const currentUtil = data.totalCapacity > 0
      ? round2((data.totalClientHours / data.totalCapacity) * 100)
      : 0;

    // How many people needed at target utilization to handle current workload
    const hoursAtTarget = (TARGET_UTILIZATION / 100) * HOURS_PER_MONTH;
    const neededHeadcount = hoursAtTarget > 0
      ? Math.ceil((data.totalClientHours / monthSpan) / hoursAtTarget)
      : 0;
    const gap = neededHeadcount - headcount;

    // Average salary for this dept
    const deptEmployees = Object.entries(EMPLOYEES)
      .filter(([, e]) => e.department === dept && e.isClientBillable);
    const avgSalary = deptEmployees.length > 0
      ? round2(deptEmployees.reduce((s, [, e]) => s + e.annualSalary, 0) / deptEmployees.length)
      : 0;

    const costPerNewHire = round2(avgSalary * 1.3); // fully loaded
    const additionalCostAnnual = gap > 0 ? round2(gap * costPerNewHire) : 0;

    // Revenue per head
    const revenuePerHead = headcount > 0 ? round2(data.totalRevenue / headcount) : 0;

    return {
      department: dept,
      currentHeadcount: headcount,
      currentUtilization: currentUtil,
      recommendedHeadcount: Math.max(neededHeadcount, headcount),
      hiringGap: Math.max(gap, 0),
      status: currentUtil > OVERLOAD_THRESHOLD ? 'needs-hire'
        : currentUtil > TARGET_UTILIZATION ? 'monitor'
        : currentUtil < 40 ? 'overstaffed'
        : 'balanced',
      avgSalary,
      costPerNewHire,
      additionalCostAnnual,
      revenuePerHead,
      members: data.members,
    };
  }).sort((a, b) => b.currentUtilization - a.currentUtilization);

  // === BILLABLE HOURS AVAILABILITY ===
  // How many hours are available to sell to customers
  const totalBillableCapacity = capacityPlanning.reduce((s, e) => s + e.totalCapacity, 0);
  const totalBillableUsed = capacityPlanning.reduce((s, e) => s + e.clientHours, 0);
  const totalBillableAvailable = round2(totalBillableCapacity - totalBillableUsed);

  // Monthly billable hours by team
  const monthlyBillableRate = totalBillableUsed / monthSpan;
  const monthlyCapacity = totalBillableCapacity / monthSpan;

  // === CLIENT VALUE ANALYSIS ===
  const clientValueAnalysis = Object.entries(clientTotals)
    .map(([name, data]) => {
      const actualHours = msToHours(data.totalMs);
      const retainer = retainerLookup(name);
      const revenue = retainer ? retainer.retainerRevenue * monthSpan : 0;
      const budgetHours = retainer ? retainer.retainerHours * monthSpan : null;

      let totalCost = 0;
      for (const [empName, ms] of Object.entries(data.employees)) {
        totalCost += msToHours(ms) * getHourlyCost(empName);
      }

      const profit = revenue - totalCost;
      const margin = revenue > 0 ? round2((profit / revenue) * 100) : null;
      const revenuePerHour = actualHours > 0 ? round2(revenue / actualHours) : 0;
      const costPerHour = actualHours > 0 ? round2(totalCost / actualHours) : 0;

      return {
        name,
        actualHours,
        budgetHours: budgetHours !== null ? round2(budgetHours) : null,
        revenue: round2(revenue),
        totalCost: round2(totalCost),
        profit: round2(profit),
        margin,
        revenuePerHour,
        costPerHour,
        employeeCount: Object.keys(data.employees).length,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // === SUMMARY KPIs ===
  const billableEmployees = salaryScoping.filter(e => e.isClientBillable);
  const totalRevenue = billableEmployees.reduce((s, e) => s + e.revenueGenerated, 0);
  const totalLaborCost = salaryScoping.reduce((s, e) => s + e.periodCost, 0);
  const totalFullyLoaded = salaryScoping.reduce((s, e) => s + e.fullyLoadedCost, 0);
  const totalProfit = totalRevenue - totalLaborCost;
  const avgRevenuePerEmployee = billableEmployees.length > 0
    ? round2(totalRevenue / billableEmployees.length) : 0;
  const avgCostPerBillableHour = totalBillableUsed > 0
    ? round2(totalLaborCost / totalBillableUsed) : 0;
  const overallSalaryToRevenueRatio = totalRevenue > 0
    ? round2(totalLaborCost / totalRevenue) : null;
  const teamUtilization = totalBillableCapacity > 0
    ? round2((totalBillableUsed / totalBillableCapacity) * 100) : 0;
  const profitMargin = totalRevenue > 0
    ? round2((totalProfit / totalRevenue) * 100) : null;

  // Departments needing hires
  const hiringNeeded = positionForecast.filter(d => d.status === 'needs-hire').length;

  // Annualized projections
  const annualizedRevenue = round2((totalRevenue / monthSpan) * 12);
  const annualizedCost = round2((totalLaborCost / monthSpan) * 12);
  const annualizedProfit = round2(annualizedRevenue - annualizedCost);

  return {
    period: {
      start: startDate,
      end: endDate,
      monthSpan: round2(monthSpan),
    },
    summary: {
      totalRevenue: round2(totalRevenue),
      totalLaborCost: round2(totalLaborCost),
      totalFullyLoadedCost: round2(totalFullyLoaded),
      totalProfit: round2(totalProfit),
      profitMargin,
      avgRevenuePerEmployee,
      avgCostPerBillableHour,
      overallSalaryToRevenueRatio,
      teamUtilization,
      totalBillableCapacity: round2(totalBillableCapacity),
      totalBillableUsed: round2(totalBillableUsed),
      totalBillableAvailable,
      monthlyBillableRate: round2(monthlyBillableRate),
      monthlyCapacity: round2(monthlyCapacity),
      billableEmployeeCount: billableEmployees.length,
      totalEmployeeCount: salaryScoping.length,
      hiringNeeded,
      annualizedRevenue,
      annualizedCost,
      annualizedProfit,
    },
    salaryScoping,
    capacityPlanning,
    positionForecast,
    clientValueAnalysis,
  };
}
