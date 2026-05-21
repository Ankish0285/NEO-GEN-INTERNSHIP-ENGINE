import React, { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const parseValue = (str) => {
  const match = String(str).match(/^([\d,.]+)(.*)$/);
  if (!match) return { num: 0, suffix: str, decimals: 0 };
  const numStr = match[1].replace(/,/g, '');
  const suffix = match[2] || '';
  const decimals = (numStr.split('.')[1] || '').length;
  return { num: parseFloat(numStr) || 0, suffix, decimals };
};

const AnimatedCounter = ({ value, duration = 1.8, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const { num, suffix, decimals } = parseValue(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(eased * num);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, num, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.floor(display).toLocaleString('en-IN');

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
