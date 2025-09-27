"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Minimize,
  Move
} from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import { memoryMonitor, cleanupMermaidDOM, debounce } from "@/lib/memory-optimizer";

// 组件使用React.memo优化
export const MermaidRenderer = React.memo(function MermaidRenderer({ 
  mermaidCode, 
  onChange, 
  onErrorChange 
}) {
  const mermaidRef = useRef(null);
  const containerRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const mermaidInstanceRef = useRef(null);

  // 清理函数
  const cleanup = useCallback(() => {
    cleanupMermaidDOM();
    
    // 检查内存使用情况
    const memoryUsage = memoryMonitor.getMemoryUsage();
    if (memoryUsage && memoryUsage.percentage > 80) {
      console.warn(`High memory usage: ${memoryUsage.percentage}%`);
      memoryMonitor.forceGC();
    }
  }, []);

  // 渲染Mermaid图表的核心函数
  const renderMermaidInternal = useCallback(async (code) => {
    if (!code || !mermaidRef.current) {
      setIsLoading(false);
      setError(null);
      if (onErrorChange) {
        onErrorChange(null, false);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 检查缓存
      const cacheKey = code.substring(0, 100);
      const cached = memoryMonitor.getCachedRender(cacheKey);
      if (cached && cached.svg && mermaidRef.current) {
        mermaidRef.current.innerHTML = cached.svg;
        mermaidRef.current.setAttribute('data-mermaid-container', 'true');
        setIsLoading(false);
        return;
      }

      // 延迟加载mermaid
      if (!mermaidInstanceRef.current) {
        const mermaidModule = await import("mermaid");
        mermaidInstanceRef.current = mermaidModule.default;
        
        // 初始化配置
        mermaidInstanceRef.current.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          },
          sequence: {
            useMaxWidth: true,
            wrap: true
          },
          gantt: {
            useMaxWidth: true
          }
        });
      }

      const mermaid = mermaidInstanceRef.current;

      // 验证语法
      try {
        await mermaid.parse(code);
      } catch (parseError) {
        const errorMsg = 'Mermaid语法错误: ' + parseError.message;
        setError(errorMsg);
        setIsLoading(false);
        if (onErrorChange) {
          onErrorChange(errorMsg, true);
        }
        return;
      }

      // 清理旧内容
      cleanup();
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
        mermaidRef.current.setAttribute('data-mermaid-container', 'true');
      }

      // 生成唯一ID
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 渲染图表
      const { svg } = await mermaid.render(id, code);
      
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = svg;
        
        // 缓存结果
        memoryMonitor.cacheRender(cacheKey, { 
          svg: svg,
          timestamp: Date.now() 
        });
        
        setIsLoading(false);
        if (onErrorChange) {
          onErrorChange(null, false);
        }
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      const errorMsg = '渲染Mermaid图表时出错: ' + err.message;
      setError(errorMsg);
      setIsLoading(false);
      if (onErrorChange) {
        onErrorChange(errorMsg, true);
      }
    }
  }, [cleanup, onErrorChange]);

  // 使用防抖优化渲染调用
  const debouncedRender = useMemo(
    () => debounce(renderMermaidInternal, 300),
    [renderMermaidInternal]
  );

  // 监听代码变化
  useEffect(() => {
    debouncedRender(mermaidCode);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      cleanup();
    };
  }, [mermaidCode, debouncedRender, cleanup]);

  // 下载功能
  const handleDownload = useCallback(async () => {
    if (!mermaidRef.current) return;
    
    try {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (!svgElement) {
        toast.error("没有找到图表");
        return;
      }

      // 创建canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 获取SVG尺寸
      const svgRect = svgElement.getBoundingClientRect();
      const scaleFactor = 2; // 提高分辨率
      
      canvas.width = svgRect.width * scaleFactor;
      canvas.height = svgRect.height * scaleFactor;
      
      // 设置白色背景
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 转换SVG为图片
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      const blob = new Blob([svgString], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        // 下载图片
        canvas.toBlob((blob) => {
          const link = document.createElement('a');
          link.download = `mermaid-diagram-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          toast.success("图表已下载");
        }, 'image/png');
      };
      
      img.src = url;
    } catch (err) {
      console.error('Download error:', err);
      toast.error("下载失败");
    }
  }, []);

  // 缩放功能
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // 拖拽功能
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0 && e.shiftKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
      e.preventDefault();
    }
  }, [translate]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setTranslate({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 渲染UI
  return (
    <div className="relative h-full w-full rounded-lg border bg-card">
      {/* 工具栏 */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          title="放大 (最大 300%)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          title="缩小 (最小 50%)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetZoom}
          title="重置视图"
        >
          <Minimize className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          disabled={!mermaidCode || error}
          title="下载为PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* 缩放和拖拽提示 */}
      {zoom !== 1 && (
        <div className="absolute top-4 left-4 z-10 text-sm text-muted-foreground bg-background/80 px-2 py-1 rounded">
          缩放: {Math.round(zoom * 100)}% | 按住Shift+拖动移动
        </div>
      )}

      {/* 渲染区域 */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-auto p-8"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">渲染图表中...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <p className="text-xs text-muted-foreground">
                请检查Mermaid语法是否正确，或尝试使用AI修复功能
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && !mermaidCode && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                在左侧输入Mermaid代码或使用AI生成图表
              </p>
            </div>
          </div>
        )}

        {/* Mermaid容器 */}
        <div
          ref={mermaidRef}
          className="mermaid-container"
          style={{
            transform: `scale(${zoom}) translate(${translate.x / zoom}px, ${translate.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s',
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          data-mermaid-container="true"
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  return prevProps.mermaidCode === nextProps.mermaidCode;
});

// 添加React导入
import React from 'react';