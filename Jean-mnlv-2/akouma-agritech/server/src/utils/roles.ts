export function isAdmin(role: string | undefined): boolean {
  return role === 'admin';
}

export function isSupervisor(role: string | undefined): boolean {
  return role === 'supervisor' || role === 'admin';
}


