/**
 * 键盘快捷键Hook
 * 提供统一的快捷键管理
 */

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

// 快捷键配置
const SHORTCUTS = {
  // 编辑操作
  "ctrl+z": { action: "undo", description: "撤销" },
  "cmd+z": { action: "undo", description: "撤销" },
  "ctrl+y": { action: "redo", description: "重做" },
  "cmd+y": { action: "redo", description: "重做" },
  "ctrl+shift+z": { action: "redo", description: "重做" },
  "cmd+shift+z": { action: "redo", description: "重做" },
  
  // 文件操作
  "ctrl+s": { action: "save", description: "保存" },
  "cmd+s": { action: "save", description: "保存" },
  "ctrl+shift+s": { action: "export", description: "导出" },
  "cmd+shift+s": { action: "export", description: "导出" },
  
  // 生成操作
  "ctrl+enter": { action: "generate", description: "生成图表" },
  "cmd+enter": { action: "generate", description: "生成图表" },
  "ctrl+shift+enter": { action: "fix", description: "AI修复" },
  "cmd+shift+enter": { action: "fix", description: "AI修复" },
  
  // 视图操作
  "ctrl+1": { action: "togglePanel", description: "切换面板" },
  "cmd+1": { action: "togglePanel", description: "切换面板" },
  "ctrl+2": { action: "toggleRenderMode", description: "切换渲染模式" },
  "cmd+2": { action: "toggleRenderMode", description: "切换渲染模式" },
  
  // 帮助
  "ctrl+/": { action: "showHelp", description: "显示快捷键帮助" },
  "cmd+/": { action: "showHelp", description: "显示快捷键帮助" },
};

export function useKeyboardShortcuts(options = {}) {
  const {
    onGenerate,
    onFix,
    onExport,
    onSave,
    enabled = true,
  } = options;

  // 从store获取操作
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    toggleLeftPanel,
    toggleRenderMode,
    setMermaidCode,
  } = useAppStore((state) => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    toggleLeftPanel: state.toggleLeftPanel,
    toggleRenderMode: state.toggleRenderMode,
    setMermaidCode: state.setMermaidCode,
  }));

  // 显示快捷键帮助
  const showShortcutHelp = useCallback(() => {
    const helpText = Object.entries(SHORTCUTS)
      .filter(([key]) => !key.includes("cmd") || navigator.platform.includes("Mac"))
      .filter(([key]) => !key.includes("ctrl") || !navigator.platform.includes("Mac"))
      .map(([key, { description }]) => {
        const displayKey = key
          .replace("ctrl", "Ctrl")
          .replace("cmd", "⌘")
          .replace("shift", "Shift")
          .replace("enter", "Enter")
          .replace(/\+/g, " + ");
        return `${displayKey}: ${description}`;
      })
      .join("\n");
    
    toast.info("键盘快捷键", {
      description: <pre className="text-xs">{helpText}</pre>,
      duration: 5000,
    });
  }, []);

  // 执行快捷键动作
  const executeAction = useCallback((action) => {
    switch (action) {
      case "undo":
        if (canUndo()) {
          undo();
          toast.success("已撤销");
        }
        break;
      
      case "redo":
        if (canRedo()) {
          redo();
          toast.success("已重做");
        }
        break;
      
      case "save":
        if (onSave) {
          onSave();
        } else {
          // 默认保存到localStorage
          const mermaidCode = useAppStore.getState().editor.mermaidCode;
          if (mermaidCode) {
            localStorage.setItem("mermaid-autosave", mermaidCode);
            localStorage.setItem("mermaid-autosave-time", new Date().toISOString());
            toast.success("已保存到浏览器");
          }
        }
        break;
      
      case "export":
        if (onExport) {
          onExport();
        }
        break;
      
      case "generate":
        if (onGenerate) {
          onGenerate();
        }
        break;
      
      case "fix":
        if (onFix) {
          onFix();
        }
        break;
      
      case "togglePanel":
        toggleLeftPanel();
        break;
      
      case "toggleRenderMode":
        toggleRenderMode();
        toast.info(useAppStore.getState().ui.renderMode === "excalidraw" ? "切换到Mermaid模式" : "切换到手绘模式");
        break;
      
      case "showHelp":
        showShortcutHelp();
        break;
      
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    toggleLeftPanel,
    toggleRenderMode,
    onGenerate,
    onFix,
    onExport,
    onSave,
    showShortcutHelp,
  ]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // 忽略在输入框中的快捷键（除了特定的组合键）
    const isInInput = ["INPUT", "TEXTAREA"].includes(event.target.tagName);
    const isModified = event.ctrlKey || event.metaKey;
    
    if (isInInput && !isModified) {
      return;
    }
    
    // 构建快捷键字符串
    const parts = [];
    if (event.ctrlKey) parts.push("ctrl");
    if (event.metaKey) parts.push("cmd");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");
    
    // 添加键名
    let key = event.key.toLowerCase();
    if (key === " ") key = "space";
    if (key === "arrowup") key = "up";
    if (key === "arrowdown") key = "down";
    if (key === "arrowleft") key = "left";
    if (key === "arrowright") key = "right";
    
    parts.push(key);
    
    const shortcut = parts.join("+");
    
    // 查找匹配的快捷键
    const shortcutConfig = SHORTCUTS[shortcut];
    if (shortcutConfig) {
      event.preventDefault();
      executeAction(shortcutConfig.action);
    }
  }, [enabled, executeAction]);

  // 注册事件监听器
  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // 加载自动保存
  useEffect(() => {
    const autosave = localStorage.getItem("mermaid-autosave");
    const autosaveTime = localStorage.getItem("mermaid-autosave-time");
    
    if (autosave && autosaveTime) {
      const time = new Date(autosaveTime);
      const now = new Date();
      const hoursDiff = (now - time) / (1000 * 60 * 60);
      
      // 如果自动保存在24小时内
      if (hoursDiff < 24) {
        toast.info("检测到自动保存", {
          description: `上次保存时间: ${time.toLocaleString()}`,
          action: {
            label: "恢复",
            onClick: () => {
              setMermaidCode(autosave);
              toast.success("已恢复自动保存");
            },
          },
          duration: 10000,
        });
      }
    }
  }, [setMermaidCode]);

  return {
    showShortcutHelp,
  };
}