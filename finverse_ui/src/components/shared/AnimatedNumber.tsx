import React, { useState, useEffect, useRef } from 'react';
import { Typography, TypographyProps } from '@mui/material';

interface AnimatedNumberProps extends TypographyProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  animateOnUpdate?: boolean;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  formatValue,
  prefix = '',
  suffix = '',
  animateOnUpdate = true,
  ...typographyProps
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Format the display value with the provided formatter or default
  const formatDisplay = (val: number): string => {
    if (formatValue) {
      return formatValue(val);
    }
    return val.toLocaleString();
  };

  useEffect(() => {
    // Skip animation if disabled after initial render
    if (!animateOnUpdate && previousValueRef.current !== 0) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    // Start animation
    startTimeRef.current = null;
    const startValue = previousValueRef.current;
    const valueChange = value - startValue;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Ease out cubic function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + valueChange * easeProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        // Ensure final value is exactly the target value
        setDisplayValue(value);
        previousValueRef.current = value;
      }
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, animateOnUpdate]);

  return (
    <Typography {...typographyProps}>
      {prefix}{formatDisplay(displayValue)}{suffix}
    </Typography>
  );
};

export default AnimatedNumber;
