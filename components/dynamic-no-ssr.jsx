"use client";

import dynamic from 'next/dynamic';

/**
 * 动态加载组件，完全禁用 SSR
 * 用于解决复杂组件的水合不匹配问题
 */

// 批处理对话框 - 完全客户端渲染
export const BatchProcessDialogNoSSR = dynamic(
  () => import('./batch-process-dialog'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-4 w-4 bg-muted rounded" />
  }
);

// 历史记录对话框 - 完全客户端渲染
export const HistoryDialogNoSSR = dynamic(
  () => import('./history-dialog'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-4 w-4 bg-muted rounded" />
  }
);

// 设置对话框 - 完全客户端渲染
export const SettingsDialogNoSSR = dynamic(
  () => import('./settings-dialog'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-4 w-4 bg-muted rounded" />
  }
);

// Mermaid 渲染器 - 完全客户端渲染
export const MermaidRendererNoSSR = dynamic(
  () => import('./mermaid-renderer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
);


// CodeMirror 编辑器 - 完全客户端渲染
export const MermaidEditorNoSSR = dynamic(
  () => import('./mermaid-editor'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-64 bg-muted/20 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">加载编辑器...</span>
      </div>
    )
  }
);