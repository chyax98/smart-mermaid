"use client";

import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check, Wand2, RotateCw } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { autoFixMermaidCode, toggleMermaidDirection } from "@/lib/mermaid-fixer";
import { toast } from "sonner";

// 懒加载CodeMirror编辑器
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="border rounded-md p-3 h-full bg-muted/50 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    )
  }
);

// 懒加载Mermaid语言支持
const loadMermaidExtensions = async () => {
  const [{ mermaid }, { oneDark }] = await Promise.all([
    import('codemirror-lang-mermaid'),
    import('@codemirror/theme-one-dark')
  ]);
  return [mermaid(), oneDark];
};

// 流式内容显示组件 - 使用memo优化
const StreamingDisplay = memo(function StreamingDisplay({ content, isStreaming, isFixing }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center h-6">
        <h3 className="text-sm font-medium">实时生成</h3>
        {isStreaming && (
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="animate-pulse mr-1 h-2 w-2 rounded-full bg-green-500"></div>
            {isFixing ? "正在修复..." : "正在生成..."}
          </div>
        )}
      </div>
      <div
        ref={contentRef}
        className="border rounded-md p-3 h-24 overflow-y-auto font-mono text-sm bg-muted/50"
      >
        {content || "等待生成..."}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较逻辑，只在内容或状态变化时重新渲染
  return prevProps.content === nextProps.content &&
         prevProps.isStreaming === nextProps.isStreaming &&
         prevProps.isFixing === nextProps.isFixing;
});

// 主编辑器组件 - 使用memo和优化
export const MermaidEditor = memo(function MermaidEditor({ 
  code, 
  onChange, 
  streamingContent, 
  isStreaming, 
  errorMessage, 
  hasError, 
  onStreamChunk 
}) {
  const [copied, setCopied] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixingContent, setFixingContent] = useState("");
  const [extensions, setExtensions] = useState([]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);

  // 加载CodeMirror扩展
  useEffect(() => {
    loadMermaidExtensions().then(exts => {
      setExtensions(exts);
      setExtensionsLoaded(true);
    });
  }, []);

  // 使用useCallback缓存回调函数
  const handleChange = useCallback((value) => {
    onChange(value);
  }, [onChange]);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } else {
      toast.error("复制失败");
    }
  }, [code]);

  const handleAutoFix = useCallback(async () => {
    if (!code) {
      toast.error("没有代码可以修复");
      return;
    }

    setIsFixing(true);
    setFixingContent("");

    try {
      const handleFixChunk = (chunk) => {
        setFixingContent(prev => prev + chunk);
        if (onStreamChunk) {
          onStreamChunk(chunk);
        }
      };

      const result = await autoFixMermaidCode(code, errorMessage, handleFixChunk);

      if (result.error) {
        toast.error(result.error);
        if (result.fixedCode !== code) {
          onChange(result.fixedCode);
          toast.info("已应用基础修复");
        }
      } else {
        if (result.fixedCode !== code) {
          onChange(result.fixedCode);
          toast.success("AI修复完成");
        } else {
          toast.info("代码看起来没有问题");
        }
      }
    } catch (error) {
      console.error("修复失败:", error);
      toast.error("修复失败，请稍后重试");
    } finally {
      setIsFixing(false);
      setTimeout(() => {
        setFixingContent("");
      }, 1000);
    }
  }, [code, errorMessage, onChange, onStreamChunk]);

  const handleToggleDirection = useCallback(() => {
    if (!code) {
      toast.error("没有代码可以切换方向");
      return;
    }

    const toggledCode = toggleMermaidDirection(code);
    if (toggledCode !== code) {
      onChange(toggledCode);
      toast.success("图表方向已切换");
    } else {
      toast.info("未检测到可切换的方向");
    }
  }, [code, onChange]);

  // 使用useMemo缓存编辑器配置
  const editorConfig = useMemo(() => ({
    theme: "dark",
    height: "100%",
    basicSetup: {
      foldGutter: false,
      dropCursor: false,
      allowMultipleSelections: false,
      indentOnInput: true,
      bracketMatching: true,
      closeBrackets: true,
      autocompletion: true,
      rectangularSelection: false,
      highlightSelectionMatches: false,
      searchKeymap: false,
    }
  }), []);

  // 决定显示哪个内容
  const displayContent = isFixing ? fixingContent : streamingContent;
  const showStreaming = isStreaming || isFixing;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {showStreaming && displayContent && (
        <StreamingDisplay
          content={displayContent}
          isStreaming={showStreaming}
          isFixing={isFixing}
        />
      )}
      
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center h-8">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Mermaid 代码</h3>
            {hasError && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                有语法错误
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAutoFix}
              disabled={!code || isFixing}
              className="h-8 px-2"
              title="AI智能修复"
            >
              {isFixing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleDirection}
              disabled={!code}
              className="h-8 px-2"
              title="切换方向"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              disabled={!code}
              className="h-8 px-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-hidden border rounded-md">
          {extensionsLoaded ? (
            <CodeMirror
              value={code}
              onChange={handleChange}
              extensions={extensions}
              {...editorConfig}
            />
          ) : (
            <Textarea
              value={code}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="在此输入或编辑 Mermaid 代码..."
              className="h-full resize-none font-mono text-sm border-0"
            />
          )}
        </div>

        {errorMessage && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 智能比较，避免不必要的重渲染
  return prevProps.code === nextProps.code &&
         prevProps.streamingContent === nextProps.streamingContent &&
         prevProps.isStreaming === nextProps.isStreaming &&
         prevProps.errorMessage === nextProps.errorMessage &&
         prevProps.hasError === nextProps.hasError;
});

export default MermaidEditor;