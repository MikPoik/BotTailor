import {
  DEFAULT_ROUTE_METADATA,
  normalizeRoutePath,
  type RouteDefinition,
  type RouteMetadata,
} from "@shared/route-metadata";

const routeModules = import.meta.glob<RouteDefinition | undefined>(
  "../pages/**/*.tsx",
  { eager: true, import: "route" },
);

const routeRegistry = new Map<string, RouteDefinition>();

for (const [filePath, routeExport] of Object.entries(routeModules)) {
  if (!routeExport) {
    continue;
  }

  if (!routeExport.path) {
    if (import.meta.env.DEV) {
      console.warn(
        `[routes] Missing path in route export from ${filePath}. Ignoring this entry.`,
      );
    }
    continue;
  }

  const normalizedPath = normalizeRoutePath(routeExport.path);

  if (routeRegistry.has(normalizedPath) && import.meta.env.DEV) {
    console.warn(
      `[routes] Duplicate route registration for path ${normalizedPath} from ${filePath}.`,
    );
  }

  routeRegistry.set(normalizedPath, { ...routeExport, path: normalizedPath });
}

function getDefaultMetadata(): RouteMetadata {
  return routeRegistry.get("/")?.metadata || DEFAULT_ROUTE_METADATA;
}

export function getRouteDefinition(path: string): RouteDefinition | undefined {
  return routeRegistry.get(normalizeRoutePath(path));
}

export function getRouteMetadata(path: string): RouteMetadata {
  const definition = getRouteDefinition(path);
  return definition?.metadata || getDefaultMetadata();
}

export function shouldSSR(path: string): boolean {
  return Boolean(getRouteDefinition(path)?.ssr);
}

export function listRegisteredRoutes(): RouteDefinition[] {
  return Array.from(routeRegistry.values());
}
