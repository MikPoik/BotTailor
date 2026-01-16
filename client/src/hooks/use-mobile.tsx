import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );
  const prevValue = React.useRef<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      const newValue = window.innerWidth < MOBILE_BREAKPOINT;
      if (prevValue.current !== newValue) {
        prevValue.current = newValue;
      }
      setIsMobile(newValue);
    };
    mql.addEventListener("change", onChange);
    const initialValue = window.innerWidth < MOBILE_BREAKPOINT;
    prevValue.current = initialValue;
    setIsMobile(initialValue);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
