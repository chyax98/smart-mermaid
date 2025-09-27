"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, 
  ZoomOut, 
  Minimize,
  Move,
  MoreHorizontal
} from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import { convertToExcalidrawElements, exportToBlob } from "@excalidraw/excalidraw";
import ExportDialog from "@/components/export-dialog";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

function ExcalidrawRenderer({ mermaidCode, onErrorChange }) {
  const [excalidrawElements, setExcalidrawElements] = useState([]);
  const [excalidrawFiles, setExcalidrawFiles] = useState({});
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const excalidrawContainerRef = useRef(null);

  // 监听全局事件
  useEffect(() => {
    const handleResetView = () => {
      if (excalidrawAPI) {
        excalidrawAPI.resetScene();
        if (mermaidCode && mermaidCode.trim()) {
          // 重新渲染当前内容
          renderMermaidContent();
        }
      }
    };

    const handleToggleFullscreen = () => {
      setIsFullscreen(prev => !prev);
    };

    window.addEventListener('resetView', handleResetView);
    window.addEventListener('toggleFullscreen', handleToggleFullscreen);

    return () => {
      window.removeEventListener('resetView', handleResetView);
      window.removeEventListener('toggleFullscreen', handleToggleFullscreen);
    };
  }, [excalidrawAPI, mermaidCode]);

  // Mermaid 内容渲染函数
  const renderMermaidContent = useCallback(async () => {
    if (!mermaidCode || !mermaidCode.trim()) {
      setExcalidrawElements([]);
      setExcalidrawFiles({});
      setRenderError(null);
      if (onErrorChange) {
        onErrorChange(null, false);
      }
      return;
    }

    setIsRendering(true);
    setRenderError(null);

    try {
      const { elements, files } = await parseMermaidToExcalidraw(mermaidCode, {
        fontSize: 16
      });

      const excalidrawElements = convertToExcalidrawElements(elements);
      setExcalidrawElements(excalidrawElements);
      setExcalidrawFiles(files || {});

      // 通知父组件没有错误
      if (onErrorChange) {
        onErrorChange(null, false);
      }
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      const errorMsg = `${error.message}`;
      setRenderError(errorMsg);
      toast.error("图表渲染失败，请检查 Mermaid 代码语法");

      // 通知父组件有错误，与 mermaid-renderer 保持一致
      if (onErrorChange) {
        onErrorChange(errorMsg, true);
      }
    } finally {
      setIsRendering(false);
    }
  }, [excalidrawAPI, mermaidCode, onErrorChange]);

  useEffect(() => {
    renderMermaidContent();
  }, [renderMermaidContent]);

  // 缩放功能
  const handleZoomIn = () => {
    if (excalidrawAPI) {
      excalidrawAPI.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (excalidrawAPI) {
      excalidrawAPI.zoomOut();
    }
  };

  const handleZoomReset = () => {
    if (excalidrawAPI) {
      excalidrawAPI.resetZoom();
      if (excalidrawElements.length > 0) {
        excalidrawAPI.scrollToContent(excalidrawElements, {
          fitToContent: true,
        });
      }
    }
  };

  // 适应窗口大小
  const handleFitToScreen = () => {
    if (excalidrawAPI && excalidrawElements.length > 0) {
      excalidrawAPI.scrollToContent(excalidrawElements, {
        fitToContent: true,
      });
    }
  };

  // 创建临时Canvas元素用于导出
  const createExportCanvas = useCallback(async () => {
    if (!excalidrawAPI || excalidrawElements.length === 0) {
      return null;
    }

    try {
      // 使用 Excalidraw 的导出功能创建图像数据
      const appState = excalidrawAPI.getAppState();
      const blob = await exportToBlob({
        elements: excalidrawElements,
        appState: {
          ...appState,
          exportBackground: true,
          exportScale: 2 // 高分辨率导出
        },
        files: excalidrawFiles,
        mimeType: "image/png",
        quality: 1,
      });

      // 创建一个临时 canvas 和 img 元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.src = URL.createObjectURL(blob);
      });
    } catch (error) {
      console.error('Export canvas creation error:', error);
      return null;
    }
  }, [excalidrawAPI, excalidrawElements, excalidrawFiles]);

  // 获取用于导出的元素 - 创建包含Excalidraw内容的临时元素
  const getExportElement = useCallback(async () => {
    const canvas = await createExportCanvas();
    if (!canvas) return null;

    // 创建一个包含canvas的临时div元素
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.appendChild(canvas);
    
    // 临时添加到文档中
    document.body.appendChild(tempDiv);
    
    // 清理函数
    const cleanup = () => {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
    };

    // 设置清理超时
    setTimeout(cleanup, 5000);
    
    return tempDiv;
  }, [createExportCanvas]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'} flex flex-col`}>
      {/* 控制栏 - 固定高度 */}
      <div className="h-12 flex justify-between items-center px-2 flex-shrink-0">
        <h3 className="text-sm font-medium">Excalidraw 图表</h3>
        <div className="flex gap-2">
          {/* 缩放控制 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-7 w-7 p-0"
            title="放大"
            disabled={!excalidrawAPI}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-7 w-7 p-0"
            title="缩小"
            disabled={!excalidrawAPI}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomReset}
            className="h-7 w-7 p-0"
            title="重置缩放"
            disabled={!excalidrawAPI}
          >
            <Minimize className="h-3.5 w-3.5" />
          </Button>

          {/* 适应窗口 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFitToScreen}
            className="h-7 gap-1 text-xs px-2"
            title="适应窗口"
            disabled={!excalidrawAPI || excalidrawElements.length === 0}
          >
            <Move className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">适应</span>
          </Button>

          {/* 增强的导出功能 */}
          <ExportDialog
            exportElement={getExportElement}
            filename="excalidraw-diagram"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={!excalidrawAPI || excalidrawElements.length === 0 || isRendering}
              className="h-7 gap-1 text-xs px-2"
              title="导出图表 - 支持多种格式"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">导出</span>
            </Button>
          </ExportDialog>
        </div>
      </div>

      {/* Excalidraw 画布区域 */}
      <div 
        ref={excalidrawContainerRef}
        className="flex-1 relative"
      >
        {isRendering && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">渲染图表中...</p>
            </div>
          </div>
        )}

        {renderError && !isRendering && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="max-w-md text-center p-4">
              <p className="text-sm text-destructive mb-4">{renderError}</p>
              <p className="text-xs text-muted-foreground">
                请检查Mermaid语法是否正确，或尝试使用AI修复功能
              </p>
            </div>
          </div>
        )}

        {!isRendering && !renderError && !mermaidCode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                在左侧输入Mermaid代码或使用AI生成图表
              </p>
            </div>
          </div>
        )}

        <Excalidraw
          ref={(api) => setExcalidrawAPI(api)}
          initialData={{
            elements: excalidrawElements,
            files: excalidrawFiles,
            appState: {
              viewBackgroundColor: "#ffffff",
              gridSize: null,
              theme: "light"
            }
          }}
          onChange={(elements, appState, files) => {
            // 可以在这里处理元素变化
          }}
        />
      </div>
    </div>
  );
}

export default React.memo(ExcalidrawRenderer);