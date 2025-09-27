"use client";

import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo, Redo, RotateCcw } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * 撤销/重做控制组件
 * 提供撤销、重做和清空历史记录功能
 */
export const UndoRedoControls = memo(function UndoRedoControls() {
  // 从store获取操作和状态
  const { undo, redo, clearHistory, canUndo, canRedo } = useAppStore((state) => ({
    undo: state.undo,
    redo: state.redo,
    clearHistory: state.clearHistory,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  }));

  const history = useAppStore((state) => state.history);

  // 处理撤销
  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
    }
  }, [undo, canUndo]);

  // 处理重做
  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo();
    }
  }, [redo, canRedo]);

  // 处理清空历史
  const handleClearHistory = useCallback(() => {
    if (window.confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      clearHistory();
    }
  }, [clearHistory]);

  // 获取历史记录信息
  const getHistoryInfo = () => {
    const total = history.records.length;
    const current = history.currentIndex + 1;
    return `${current}/${total}`;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50">
        {/* 撤销按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo()}
              className="h-8 w-8"
              aria-label="撤销"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>撤销 (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        {/* 重做按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={!canRedo()}
              className="h-8 w-8"
              aria-label="重做"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>重做 (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>

        {/* 历史记录信息 */}
        <div className="px-2 text-xs text-muted-foreground">
          {getHistoryInfo()}
        </div>

        {/* 清空历史按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              disabled={history.records.length === 0}
              className="h-8 w-8"
              aria-label="清空历史"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>清空历史记录</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

export default UndoRedoControls;