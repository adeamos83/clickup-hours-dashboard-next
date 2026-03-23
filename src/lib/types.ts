export interface Employee {
  clickUpId: string | null;
  role: string;
  department: string;
  type: 'employee' | 'contractor' | 'founder';
  annualSalary: number;
  isClientBillable: boolean;
}

export interface ClickUpEntry {
  id: string;
  task: {
    id?: string;
    name?: string;
    folder?: { id?: string; name?: string };
    list?: { id?: string; name?: string };
    space?: { id?: string; name?: string };
    status?: { status?: string };
  };
  user: { id: string | number; username?: string };
  start: string;
  end: string;
  duration: string | number;
  description?: string;
}

export interface Classification {
  type: 'client' | 'internal';
  clientName?: string;
  category?: string;
}

export interface ClientRetainer {
  retainerHours: number;
  retainerRevenue: number;
  isOverridden?: boolean;
}

export type RetainerLookup = (name: string) => ClientRetainer | null;

export interface DashboardSummary {
  totalHours: number;
  clientHours: number;
  internalHours: number;
  employeesActive: number;
  totalEntries: number;
  previousPeriod?: {
    totalHours: number;
    clientHours: number;
    internalHours: number;
    employeesActive: number;
    totalEntries: number;
  };
}

export interface DashboardData {
  period: { start: string; end: string };
  employees: { name: string; totalHours: number; isPayroll: boolean }[];
  clients: { name: string; totalHours: number }[];
  internalCategories: { name: string; totalHours: number }[];
  employeeByClient: { employee: string; client: string; hours: number }[];
  topTasks: { name: string; client: string; totalHours: number; employees: string[] }[];
  dailyTrend: { date: string; hours: number }[];
  summary: DashboardSummary;
  _fromCache?: boolean;
}

export interface EmployeeUtilization {
  name: string;
  role: string;
  department: string;
  type: string;
  isClientBillable: boolean;
  totalHours: number;
  clientHours: number;
  internalHours: number;
  availableHours: number;
  utilizationRate: number;
  hourlyCost: number;
  totalCost: number;
  effectiveHourlyCost: number | null;
}

export interface ClientUtilization {
  name: string;
  actualHours: number;
  budgetHours: number | null;
  budgetUsedPct: number | null;
  hoursRemaining: number | null;
  retainerRevenue: number | null;
  totalCost: number;
  profit: number | null;
  margin: number | null;
  status: string;
  isOverridden: boolean;
  employeeBreakdown: { name: string; hours: number; cost: number; department: string }[];
}

export interface DepartmentBreakdown {
  department: string;
  totalHours: number;
  clientHours: number;
  internalHours: number;
  headcount: number;
  availableHours: number;
  utilizationRate: number;
  totalCost: number;
  avgCostPerHour: number;
  members: string[];
}

export interface UtilizationData {
  period: { start: string; end: string; monthSpan: number };
  summary: {
    overallUtilization: number;
    totalLaborCost: number;
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number | null;
    overBudgetClients: number;
    atRiskClients: number;
    billableEmployees: number;
    avgUtilization: number;
  };
  employeeUtilization: EmployeeUtilization[];
  clientUtilization: ClientUtilization[];
  departmentBreakdown: DepartmentBreakdown[];
}

export interface SalaryScoping {
  name: string;
  role: string;
  department: string;
  type: string;
  isClientBillable: boolean;
  annualSalary: number;
  periodCost: number;
  fullyLoadedCost: number;
  hourlyCost: number;
  totalHours: number;
  clientHours: number;
  internalHours: number;
  revenueGenerated: number;
  roi: number;
  revenuePerHour: number;
  costPerBillableHour: number | null;
  salaryToRevenueRatio: number | null;
  utilizationRate: number;
}

export interface CapacityPlanning {
  name: string;
  role: string;
  department: string;
  totalCapacity: number;
  totalHoursWorked: number;
  clientHours: number;
  internalHours: number;
  availableHours: number;
  billableAvailable: number;
  capacityUsedPct: number;
  billableCapacityUsedPct: number;
  projectedNextMonthClient: number;
  projectedNextMonthTotal: number;
  projectedUtilization: number;
  status: string;
}

export interface PositionForecast {
  department: string;
  currentHeadcount: number;
  currentUtilization: number;
  recommendedHeadcount: number;
  hiringGap: number;
  status: string;
  avgSalary: number;
  costPerNewHire: number;
  additionalCostAnnual: number;
  revenuePerHead: number;
  members: string[];
}

export interface ClientValue {
  name: string;
  actualHours: number;
  budgetHours: number | null;
  revenue: number;
  totalCost: number;
  profit: number;
  margin: number | null;
  revenuePerHour: number;
  costPerHour: number;
  employeeCount: number;
}

export interface KPIData {
  period: { start: string; end: string; monthSpan: number };
  summary: {
    totalRevenue: number;
    totalLaborCost: number;
    totalFullyLoadedCost: number;
    totalProfit: number;
    profitMargin: number | null;
    avgRevenuePerEmployee: number;
    avgCostPerBillableHour: number;
    overallSalaryToRevenueRatio: number | null;
    teamUtilization: number;
    totalBillableCapacity: number;
    totalBillableUsed: number;
    totalBillableAvailable: number;
    monthlyBillableRate: number;
    monthlyCapacity: number;
    billableEmployeeCount: number;
    totalEmployeeCount: number;
    hiringNeeded: number;
    annualizedRevenue: number;
    annualizedCost: number;
    annualizedProfit: number;
  };
  salaryScoping: SalaryScoping[];
  capacityPlanning: CapacityPlanning[];
  positionForecast: PositionForecast[];
  clientValueAnalysis: ClientValue[];
}

export interface SyncStatus {
  totalCachedEntries: number;
  totalCachedTasks: number;
  lastSync: { completedAt: string } | null;
  isSyncing: boolean;
}
