// Three types of users that can be in a world
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

// Helps TypeScript understand what a "Role" is
export type Role = (typeof ROLES)[keyof typeof ROLES];

// Quick check to see if a user is allowed to edit or manage the world
export function canManageWorld(role: string | null | undefined): boolean {
  // If they are an OWNER or an ADMIN, they can manage the world. Otherwise, they can't.
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}
