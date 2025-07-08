import { useEffect, useState } from "react";

export function useCountdown(initialCount = 60) {
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const start = () => {
    setCount(initialCount);
    setIsActive(true);
  };

  const stop = () => {
    setCount(0);
    setIsActive(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && count > 0) {
      interval = setInterval(() => {
        setCount((prevCount) => prevCount - 1);
      }, 1000);
    } else if (count === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, count]);

  return { count, start, stop, isActive };
}
