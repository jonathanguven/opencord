import {
  defaultPermissionSet,
  type Permission,
  type PermissionSet,
} from "./domain";

export type RoleLike = {
  position: number;
  permissions: PermissionSet;
};

export const mergePermissionSets = (roles: RoleLike[]): PermissionSet => {
  const ordered = [...roles].sort((left, right) => left.position - right.position);
  const merged = defaultPermissionSet();

  for (const role of ordered) {
    for (const [permission, enabled] of Object.entries(role.permissions) as [
      Permission,
      boolean,
    ][]) {
      if (enabled) {
        merged[permission] = true;
      }
    }
  }

  return merged;
};

export const hasPermission = (
  permissions: PermissionSet,
  permission: Permission,
): boolean => permissions.admin || permissions[permission];

export const normalizePairKey = (left: string, right: string) =>
  [left, right].sort().join("::");
