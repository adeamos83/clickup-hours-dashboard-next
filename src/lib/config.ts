/**
 * Centralized configuration for employee data, client retainers, and constants.
 * Single source of truth — replaces hardcoded values scattered across api.js and process.js.
 */

import type { Employee, ClientRetainer } from './types';

export const HOURS_PER_MONTH = 160;
export const HOURS_PER_YEAR = 2080; // 52 weeks * 40 hours

export const EMPLOYEES: Record<string, Employee> = {
  'Sol Carcamo': {
    clickUpId: '81347640',
    role: 'Graphic Designer',
    department: 'Design',
    type: 'contractor',
    annualSalary: 50700,
    isClientBillable: true,
  },
  'Pablo Martinez': {
    clickUpId: '81569918',
    role: 'Web Designer',
    department: 'Design',
    type: 'contractor',
    annualSalary: 60000,
    isClientBillable: true,
  },
  'Emily Sims': {
    clickUpId: '87368576',
    role: 'Web Designer',
    department: 'Design',
    type: 'employee',
    annualSalary: 93750,
    isClientBillable: true,
  },
  'Shasta Erickson': {
    clickUpId: '26167755',
    role: 'Account Manager',
    department: 'Account Management',
    type: 'employee',
    annualSalary: 110000,
    isClientBillable: true,
  },
  'Elizabeth Ortiz': {
    clickUpId: '26174296',
    role: 'Account Manager',
    department: 'Account Management',
    type: 'employee',
    annualSalary: 100000,
    isClientBillable: true,
  },
  'Nick Pool': {
    clickUpId: '26276141',
    role: 'SEO Specialist',
    department: 'SEO',
    type: 'employee',
    annualSalary: 100000,
    isClientBillable: true,
  },
  'Mandy Trotti': {
    clickUpId: '75429290',
    role: 'SEO Specialist',
    department: 'SEO',
    type: 'employee',
    annualSalary: 54600,
    isClientBillable: true,
  },
  'Guillermo Ortiz': {
    clickUpId: '26167819',
    role: 'Sales & Paid Media',
    department: 'PPC',
    type: 'employee',
    annualSalary: 0,
    isClientBillable: true,
  },
  'Mark Joseph Casalla': {
    clickUpId: '63003626',
    role: 'Admin',
    department: 'Operations',
    type: 'contractor',
    annualSalary: 24000,
    isClientBillable: true,
  },
  'Charles Mburu': {
    clickUpId: '81565920',
    role: 'Admin',
    department: 'Operations',
    type: 'contractor',
    annualSalary: 24000,
    isClientBillable: true,
  },
  "D'Andre Ealy": {
    clickUpId: '87380847',
    role: 'Founder',
    department: 'Leadership',
    type: 'founder',
    annualSalary: 75000,
    isClientBillable: false,
  },
  'Ade Amos': {
    clickUpId: null,
    role: 'Founder',
    department: 'Leadership',
    type: 'founder',
    annualSalary: 75000,
    isClientBillable: false,
  },
};

// Derived lookups
export const USER_ID_TO_NAME: Record<string, string> = {};
export const EMPLOYEE_IDS: Record<string, string> = {};

for (const [name, emp] of Object.entries(EMPLOYEES)) {
  if (emp.clickUpId) {
    USER_ID_TO_NAME[emp.clickUpId] = name;
    EMPLOYEE_IDS[name] = emp.clickUpId;
  }
}

export const DEPARTMENTS: string[] = [...new Set(Object.values(EMPLOYEES).map((e) => e.department))];

// Client retainer data — keyed by ClickUp folder name (output of classifyTask)
// Extracted from Master Client List.xlsx tab "Client Retainer Hours"
// retainerHours = monthly budget hours, retainerRevenue = monthly retainer $
export const CLIENT_RETAINERS: Record<string, ClientRetainer> = {
  'Allgood Electric': { retainerHours: 4, retainerRevenue: 1000 },
  'Ameda': { retainerHours: 20, retainerRevenue: 5000 },
  'Austin Van & Storage': { retainerHours: 0, retainerRevenue: 2000 },
  'Biomotion': { retainerHours: 5, retainerRevenue: 1200 },
  'Blinds Brothers': { retainerHours: 18, retainerRevenue: 2750 },
  'Blue Tree Health': { retainerHours: 12, retainerRevenue: 2500 },
  'Cloud Roofing': { retainerHours: 12, retainerRevenue: 3000 },
  'Car Wash Advisory': { retainerHours: 34.5, retainerRevenue: 6000 },
  'Cold is on the Right Plumbing & Air': { retainerHours: 14, retainerRevenue: 3500 },
  'Desert Shade': { retainerHours: 10, retainerRevenue: 2000 },
  'Fox Granite': { retainerHours: 8, retainerRevenue: 2000 },
  'Fuse Architecture': { retainerHours: 8, retainerRevenue: 2000 },
  'Greater Austin Pain Center': { retainerHours: 20, retainerRevenue: 4000 },
  'Green Energy of San Antonio': { retainerHours: 13, retainerRevenue: 3250 },
  'Hartley Window Coverings': { retainerHours: 14, retainerRevenue: 3500 },
  'International Biomedical': { retainerHours: 20, retainerRevenue: 5000 },
  "Jason's Water Florida": { retainerHours: 4, retainerRevenue: 1000 },
  "Jason's Water Softeners": { retainerHours: 14, retainerRevenue: 3500 },
  'Lakeway Cosmetic Dentistry': { retainerHours: 8, retainerRevenue: 2000 },
  'Louis Laves-Webb': { retainerHours: 8, retainerRevenue: 2000 },
  'Miller, Ross and Goldman': { retainerHours: 18, retainerRevenue: 3500 },
  'Northside Collision Paint & Body Inc.': { retainerHours: 20, retainerRevenue: 3500 },
  'Nutronics Labs': { retainerHours: 20, retainerRevenue: 2000 },
  'Patriot Water System': { retainerHours: 10, retainerRevenue: 1500 },
  'Pauly Presley Realty': { retainerHours: 4, retainerRevenue: 1000 },
  'Peak Performance Health and Wellness': { retainerHours: 10, retainerRevenue: 1500 },
  'Premium Cabinets Austin': { retainerHours: 10, retainerRevenue: 2000 },
  'Primetime PDR': { retainerHours: 2, retainerRevenue: 350 },
  'Serview Home Pros': { retainerHours: 14, retainerRevenue: 3500 },
  'Sierra Integrative': { retainerHours: 12, retainerRevenue: 3000 },
  'Southwestern Home Products': { retainerHours: 48, retainerRevenue: 1500 },
  "Stan's AC": { retainerHours: 19, retainerRevenue: 4775 },
  'TC Tech Systems': { retainerHours: 8, retainerRevenue: 2000 },
  'Team Enoch': { retainerHours: 47.75, retainerRevenue: 2500 }, // was 4775 in XLSX — likely decimal error
  'Texas Rolling Shutters': { retainerHours: 16, retainerRevenue: 5000 },
  'Trinidad Vision Cataract & Laser Eye Institute': { retainerHours: 8, retainerRevenue: 2000 },
  'Tucson Rolling Shutters': { retainerHours: 29, retainerRevenue: 9350 },
  'Wagner Mechanical': { retainerHours: 18, retainerRevenue: 4525 },
  'W.E.T. Inc.': { retainerHours: 8, retainerRevenue: 1950 },
  'Valued Foundation Repair LLC': { retainerHours: 10, retainerRevenue: 2000 },
  'Ferguson Plastic Surgery & Aesthetics': { retainerHours: 12, retainerRevenue: 3000 },
  'Houston Smart Screen': { retainerHours: 12, retainerRevenue: 2500 },
  'Altus Commercial Receivables': { retainerHours: 25, retainerRevenue: 18500 },
};

// Maps ClickUp folder names to CLIENT_RETAINERS keys where they differ.
// Populated from client name audit comparing SQLite cache folder names vs XLSX names.
export const CLIENT_NAME_MAP: Record<string, string> = {
  'BioMotion': 'Biomotion',
  'Fuse - Hourly': 'Fuse Architecture',
  'Houston Smart Screens': 'Houston Smart Screen',
  'International Bio': 'International Biomedical',
  'Miller Ross and Goldman': 'Miller, Ross and Goldman',
  'Prime Time PDR': 'Primetime PDR',
  'Tucson Rolling Shutters and Screens': 'Tucson Rolling Shutters',
  'Phoenix Rolling Shutters (Tucson Rolling) ': 'Tucson Rolling Shutters',
  'WET': 'W.E.T. Inc.',
};

export function resolveClientName(name: string): string {
  return CLIENT_NAME_MAP[name] || name;
}

export function getDefaultRetainer(clientName: string): ClientRetainer | null {
  const canonical = resolveClientName(clientName);
  const lookupName = CLIENT_RETAINERS[clientName] ? clientName : canonical;
  return CLIENT_RETAINERS[lookupName] || null;
}

export function getHourlyCost(employeeName: string): number {
  const emp = EMPLOYEES[employeeName];
  if (!emp) return 0;
  return emp.annualSalary / HOURS_PER_YEAR;
}

export function getMonthlyCost(employeeName: string): number {
  const emp = EMPLOYEES[employeeName];
  if (!emp) return 0;
  return emp.annualSalary / 12;
}
