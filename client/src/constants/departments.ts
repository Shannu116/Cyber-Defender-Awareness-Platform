// Centralized department list for validation across the application
export const DEPARTMENTS = [
  'Operations',
  'Finance & Accounting',
  'Human Resources',
  'Sales & Marketing',
  'Customer Support',
  'Legal & Compliance',
  'IT & Engineering',
  'Executive & Management',
  'General Staff'
] as const;

export type Department = typeof DEPARTMENTS[number];

export function isValidDepartment(dept: string): dept is Department {
  return (DEPARTMENTS as readonly string[]).includes(dept.trim());
}
