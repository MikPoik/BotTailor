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
  let routeDefinition: RouteDefinition;

  if (!routeExport) {
    // Create default route definition for pages without route export
    const pathFromFile = filePath
      .replace("../pages/", "/")
      .replace(/\.tsx$/, "")
      .replace(/\/index$/, "")
      .replace(/\[([^\]]+)\]/g, ":$1"); // Convert [param] to :param

    routeDefinition = {
      path: pathFromFile === "" ? "/" : pathFromFile,
      ssr: false, // Default to client-side rendering
    };

    if (import.meta.env.DEV) {
      console.warn(
        `[routes] No route export found in ${filePath}. Using default route definition with ssr: false.`,
      );
    }
  } else {
    if (!routeExport.path) {
      if (import.meta.env.DEV) {
        console.warn(
          `[routes] Missing path in route export from ${filePath}. Ignoring this entry.`,
        );
      }
      continue;
    }
    routeDefinition = routeExport;
  }

  const normalizedPath = normalizeRoutePath(routeDefinition.path);

  if (routeRegistry.has(normalizedPath) && import.meta.env.DEV) {
    console.warn(
      `[routes] Duplicate route registration for path ${normalizedPath} from ${filePath}.`,
    );
  }

  routeRegistry.set(normalizedPath, { ...routeDefinition, path: normalizedPath });
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
