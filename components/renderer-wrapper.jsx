"use client";

import { memo, useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// 懒加载优化版Mermaid渲染器
const MermaidRenderer = dynamic(
  () => import("./mermaid-renderer-optimized").then(mod => ({ default: mod.MermaidRenderer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载Mermaid渲染器...</p>
        </div>
      </div>
    ),
  }
);

// 懒加载Excalidraw渲染器
const ExcalidrawRenderer = dynamic(
  () => import("./excalidraw-renderer"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载Excalidraw渲染器...</p>
        </div>
      </div>
    ),
  }
);

/**
 * 优化的渲染器包装组件
 * 特性：
 * - 单一渲染器激活模式（避免同时渲染两个）
 * - 渲染结果缓存
 * - 智能预加载
 * - 防抖处理
 */
export const RendererWrapper = memo(function RendererWrapper({
  renderMode,
  mermaidCode,
  onChange,
  onErrorChange,
}) {
  const [activeRenderer, setActiveRenderer] = useState(renderMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedRenderers, setPreloadedRenderers] = useState(new Set());

  // 渲染模式切换时的过渡处理
  useEffect(() => {
    if (renderMode !== activeRenderer) {
      setIsTransitioning(true);
      // 添加短暂延迟以显示过渡动画
      const timer = setTimeout(() => {
        setActiveRenderer(renderMode);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [renderMode, activeRenderer]);

  // 预加载未激活的渲染器（用户可能会切换）
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      if (renderMode === "mermaid" && !preloadedRenderers.has("excalidraw")) {
        // 预加载Excalidraw
        import("./excalidraw-renderer").then(() => {
          setPreloadedRenderers(prev => new Set(prev).add("excalidraw"));
        });
      } else if (renderMode === "excalidraw" && !preloadedRenderers.has("mermaid")) {
        // 预加载Mermaid
        import("./mermaid-renderer-optimized").then(() => {
          setPreloadedRenderers(prev => new Set(prev).add("mermaid"));
        });
      }
    }, 2000); // 2秒后预加载，避免影响初始加载

    return () => clearTimeout(preloadTimer);
  }, [renderMode, preloadedRenderers]);

  // 缓存渲染器props
  const rendererProps = useMemo(() => ({
    mermaidCode,
    onChange,
    onErrorChange,
  }), [mermaidCode, onChange, onErrorChange]);

  // 如果正在过渡，显示过渡效果
  if (isTransitioning) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">
        <p className="text-sm text-muted-foreground">切换渲染模式...</p>
      </div>
    );
  }

  // 根据激活的渲染器显示对应组件
  return (
    <div className="h-full w-full">
      {activeRenderer === "excalidraw" ? (
        <ExcalidrawRenderer {...rendererProps} />
      ) : (
        <MermaidRenderer {...rendererProps} />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较逻辑，避免不必要的重渲染
  return prevProps.renderMode === nextProps.renderMode &&
         prevProps.mermaidCode === nextProps.mermaidCode;
});

export default RendererWrapper;