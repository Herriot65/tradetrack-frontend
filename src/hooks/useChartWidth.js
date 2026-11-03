import { useEffect, useRef, useState } from "react";

export function useChartWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width || 1000));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
