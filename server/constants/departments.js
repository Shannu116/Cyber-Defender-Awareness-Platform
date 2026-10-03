// Centralized department list for validation across server and client
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
];

export function isValidDepartment(dept) {
  return typeof dept === 'string' && DEPARTMENTS.includes(dept.trim());
}
