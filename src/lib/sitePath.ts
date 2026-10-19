export function stripBasePath(path: string, base = import.meta.env.BASE_URL): string {
  const prefix = base.replace(/\/+$/, "");
  if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) {
    return path.slice(prefix.length) || "/";
  }
  return path;
}

export function sitePath(path: string, base = import.meta.env.BASE_URL): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const prefix = base.replace(/\/+$/, "");
  return `${prefix}${stripBasePath(path, base)}`;
}
