"use client";

import { useState, useEffect } from 'react';

/**
 * 水合安全包装器 - 确保服务端和客户端渲染一致
 * 专门用于解决 Next.js 15 + React 19 的水合错误
 */
export default function HydrationSafeWrapper({ children, fallback = null }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 清理浏览器扩展可能注入的属性（如 ColorZilla）
    const cleanupBrowserExtensions = () => {
      const elements = document.querySelectorAll('[cz-shortcut-listen]');
      elements.forEach(el => el.removeAttribute('cz-shortcut-listen'));
    };

    // 使用 MutationObserver 防止扩展重新注入属性
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'cz-shortcut-listen') {
          mutation.target.removeAttribute('cz-shortcut-listen');
        }
      });
    });

    // 监听整个文档的属性变化
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['cz-shortcut-listen']
    });

    cleanupBrowserExtensions();
    setIsHydrated(true);

    return () => observer.disconnect();
  }, []);

  // 服务端渲染或未水合时显示回退内容
  if (!isHydrated) {
    return fallback;
  }

  return children;
}