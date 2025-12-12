import { useEffect, useRef, useState } from 'react';

export default function useRetry(limit: number, delay: number) {
  const [count, setCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLimitExceeded = count >= limit;
  const isRetrying = count > 0 && !isLimitExceeded;

  const schedule = (fn: () => Promise<void>) => {
    if (isLimitExceeded) return;

    setCount((prev) => {
      const next = prev + 1;
      if (next > limit) return prev;

      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        fn();
      }, delay);

      return next;
    });
  };

  const reset = () => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCount(0);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    count,
    isLimitExceeded,
    isRetrying,
    schedule,
    reset,
  };
}
