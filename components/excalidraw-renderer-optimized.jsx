"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { memoryMonitor, debounce } from "@/lib/memory-optimizer";

// 组件使用React.memo优化
export const ExcalidrawRenderer = memo(function ExcalidrawRenderer({ 
  mermaidCode, 
  onErrorChange 
}) {
  const [Excalidraw, setExcalidraw] = useState(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elements, setElements] = useState([]);
  const containerRef = useRef(null);
  const mermaidInstanceRef = useRef(null);

  // 加载Excalidraw库
  useEffect(() => {
    let mounted = true;
    
    const loadExcalidraw = async () => {
      try {
        const module = await import("@excalidraw/excalidraw");
        if (mounted) {
          setExcalidraw(() => module.Excalidraw);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load Excalidraw:', err);
        if (mounted) {
          setError('加载Excalidraw失败');
          setIsLoading(false);
        }
      }
    };

    loadExcalidraw();

    return () => {
      mounted = false;
    };
  }, []);

  // 转换Mermaid到Excalidraw的核心函数
  const convertMermaidToExcalidraw = useCallback(async (code) => {
    if (!code) {
      setElements([]);
      setError(null);
      if (onErrorChange) {
        onErrorChange(null, false);
      }
      return;
    }

    try {
      // 检查缓存
      const cacheKey = `excalidraw-${code.substring(0, 100)}`;
      const cached = memoryMonitor.getCachedRender(cacheKey);
      if (cached && cached.elements) {
        setElements(cached.elements);
        setError(null);
        if (onErrorChange) {
          onErrorChange(null, false);
        }
        return;
      }

      // 延迟加载mermaid
      if (!mermaidInstanceRef.current) {
        const mermaidModule = await import("mermaid");
        mermaidInstanceRef.current = mermaidModule.default;
        
        mermaidInstanceRef.current.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });
      }

      const mermaid = mermaidInstanceRef.current;

      // 验证Mermaid语法
      try {
        await mermaid.parse(code);
      } catch (parseError) {
        const errorMsg = 'Mermaid语法错误: ' + parseError.message;
        setError(errorMsg);
        if (onErrorChange) {
          onErrorChange(errorMsg, true);
        }
        return;
      }

      // 渲染为SVG
      const id = `temp-mermaid-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);

      // 转换SVG为Excalidraw元素
      const parsedElements = await parseSVGToExcalidraw(svg);
      
      // 缓存结果
      memoryMonitor.cacheRender(cacheKey, { 
        elements: parsedElements,
        timestamp: Date.now() 
      });

      setElements(parsedElements);
      setError(null);
      if (onErrorChange) {
        onErrorChange(null, false);
      }

      // 清理临时DOM元素
      const tempElement = document.getElementById(id);
      if (tempElement) {
        tempElement.remove();
      }
    } catch (err) {
      console.error('Conversion error:', err);
      const errorMsg = '转换为手绘风格时出错: ' + err.message;
      setError(errorMsg);
      if (onErrorChange) {
        onErrorChange(errorMsg, true);
      }
    }
  }, [onErrorChange]);

  // SVG解析为Excalidraw元素
  const parseSVGToExcalidraw = async (svgString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('Invalid SVG');
    }

    const elements = [];
    const viewBox = svgElement.getAttribute('viewBox');
    const [, , width, height] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 800, 600];

    // 解析所有路径和形状
    const paths = doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text');
    
    paths.forEach((element, index) => {
      const elementType = element.tagName.toLowerCase();
      const baseElement = {
        id: `element-${Date.now()}-${index}`,
        type: 'rectangle',
        x: index * 10,
        y: index * 10,
        width: 100,
        height: 50,
        angle: 0,
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'hachure',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: 100,
        seed: Math.floor(Math.random() * 2000000000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 2000000000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
      };

      // 根据不同元素类型设置属性
      if (elementType === 'rect') {
        baseElement.type = 'rectangle';
        baseElement.x = parseFloat(element.getAttribute('x') || 0);
        baseElement.y = parseFloat(element.getAttribute('y') || 0);
        baseElement.width = parseFloat(element.getAttribute('width') || 100);
        baseElement.height = parseFloat(element.getAttribute('height') || 50);
      } else if (elementType === 'circle' || elementType === 'ellipse') {
        baseElement.type = 'ellipse';
        const cx = parseFloat(element.getAttribute('cx') || 0);
        const cy = parseFloat(element.getAttribute('cy') || 0);
        const rx = parseFloat(element.getAttribute('rx') || element.getAttribute('r') || 50);
        const ry = parseFloat(element.getAttribute('ry') || element.getAttribute('r') || 50);
        baseElement.x = cx - rx;
        baseElement.y = cy - ry;
        baseElement.width = rx * 2;
        baseElement.height = ry * 2;
      } else if (elementType === 'text') {
        baseElement.type = 'text';
        baseElement.text = element.textContent || '';
        baseElement.fontSize = 20;
        baseElement.fontFamily = 1;
        baseElement.textAlign = 'center';
        baseElement.verticalAlign = 'middle';
        baseElement.x = parseFloat(element.getAttribute('x') || 0);
        baseElement.y = parseFloat(element.getAttribute('y') || 0);
        baseElement.width = baseElement.text.length * 10;
        baseElement.height = 25;
      } else if (elementType === 'path' || elementType === 'line' || elementType === 'polyline') {
        baseElement.type = 'line';
        
        // 简化路径处理
        const points = [];
        if (elementType === 'line') {
          points.push([
            parseFloat(element.getAttribute('x1') || 0),
            parseFloat(element.getAttribute('y1') || 0)
          ]);
          points.push([
            parseFloat(element.getAttribute('x2') || 0),
            parseFloat(element.getAttribute('y2') || 0)
          ]);
        }
        
        baseElement.points = points;
        baseElement.lastCommittedPoint = points[points.length - 1];
      }

      // 应用样式
      const fill = element.getAttribute('fill');
      const stroke = element.getAttribute('stroke');
      if (fill && fill !== 'none') {
        baseElement.backgroundColor = fill;
      }
      if (stroke && stroke !== 'none') {
        baseElement.strokeColor = stroke;
      }

      elements.push(baseElement);
    });

    return elements;
  };

  // 使用防抖优化转换调用
  const debouncedConvert = useCallback(
    debounce(convertMermaidToExcalidraw, 500),
    [convertMermaidToExcalidraw]
  );

  // 监听代码变化
  useEffect(() => {
    debouncedConvert(mermaidCode);
  }, [mermaidCode, debouncedConvert]);

  // 下载功能
  const handleExport = useCallback(async () => {
    if (!excalidrawAPI) {
      toast.error("Excalidraw未就绪");
      return;
    }

    try {
      const blob = await excalidrawAPI.exportToBlob({
        mimeType: 'image/png',
        quality: 0.95,
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `excalidraw-diagram-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("图表已下载");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("导出失败");
    }
  }, [excalidrawAPI]);

  // 刷新功能
  const handleRefresh = useCallback(() => {
    convertMermaidToExcalidraw(mermaidCode);
  }, [mermaidCode, convertMermaidToExcalidraw]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/10 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载Excalidraw...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/10 rounded-lg">
        <div className="max-w-md text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">
            请检查Mermaid语法或尝试刷新
          </p>
        </div>
      </div>
    );
  }

  if (!Excalidraw) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/10 rounded-lg">
        <p className="text-sm text-muted-foreground">Excalidraw组件未加载</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full rounded-lg border bg-card">
      {/* 工具栏 */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          title="刷新转换"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          disabled={!excalidrawAPI}
          title="导出为PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Excalidraw容器 */}
      <div className="h-full w-full">
        {!mermaidCode ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              在左侧输入Mermaid代码或使用AI生成图表
            </p>
          </div>
        ) : (
          <Excalidraw
            initialData={{
              elements: elements,
              appState: {
                viewBackgroundColor: '#ffffff',
                currentItemFontFamily: 1,
                gridSize: null,
              },
            }}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            theme="light"
            langCode="zh-CN"
            renderTopRightUI={() => null}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                toggleTheme: false,
              },
            }}
          />
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  return prevProps.mermaidCode === nextProps.mermaidCode;
});

export default ExcalidrawRenderer;