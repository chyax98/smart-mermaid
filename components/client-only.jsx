"use client";

import { useState, useEffect } from 'react';

/**
 * 完全客户端渲染组件
 * 用于彻底解决 React 19 hydration 错误
 */
export default function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
