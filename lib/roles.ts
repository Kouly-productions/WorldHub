// The three roles a user can have in a world.

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Quick check used in a lot of places, so making it a shared function makes sense
export function canManageWorld(role: string | null | undefined): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}
