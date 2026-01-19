import { useLayoutEffect, useState } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that only renders children on the client side.
 * Useful for avoiding hydration mismatches with dynamic data like auth state.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  // If we're rendering on the server, return children so marketing/public
  // pages are fully server-rendered (useEffect/useLayoutEffect never run on server).
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return <>{children}</>;
  }

  // During client hydration we must output the same markup as the server
  // to avoid hydration mismatches. Detect if the root contains SSR content
  // and use that as the initial "mounted" state so we render children
  // instead of the fallback during hydration.
  const rootHasSSR = typeof window !== 'undefined' ?
    document.getElementById('root')?.innerHTML.trim() !== '' : false;

  const [hasMounted, setHasMounted] = useState(rootHasSSR);

  useLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
