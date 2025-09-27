"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, PanelLeftClose, PanelLeftOpen, Monitor, FileImage, RotateCcw, Maximize, RotateCw, FileText, Layers, History } from "lucide-react";
import { Header } from "@/components/header";
import { UndoRedoControls } from "@/components/undo-redo-controls";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { SettingsDialog } from "@/components/settings-dialog";
import { TemplateSelector } from "@/components/template-selector";
import { BatchProcessDialog } from "@/components/batch-process-dialog";
import { HistoryDialog } from "@/components/history-dialog";
import { historyManagerService } from "@/lib/history-manager";
import { TextInput } from "@/components/text-input";
import { FileUpload } from "@/components/file-upload";
import { DiagramTypeSelector } from "@/components/diagram-type-selector";
import { ModelSelector } from "@/components/model-selector";
import { MermaidEditor } from "@/components/mermaid-editor";
// 动态导入RendererWrapper组件以优化性能
const RendererWrapper = dynamic(
  () => import("@/components/renderer-wrapper"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载渲染器...</p>
        </div>
      </div>
    )
  }
);
import { generateMermaidFromText } from "@/lib/ai-service";
import { isWithinCharLimit } from "@/lib/utils";
import { isPasswordVerified, hasCustomAIConfig, hasUnlimitedAccess } from "@/lib/config-service";
import { autoFixMermaidCode, toggleMermaidDirection } from "@/lib/mermaid-fixer";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

// Import Zustand store and hooks
import { 
  useAppStore, 
  useEditorState, 
  useUIState, 
  useConfigState, 
  useUsageState,
  useEditorActions,
  useUIActions,
  useHistoryActions
} from "@/stores/app-store";
import { useHydration } from "@/hooks/use-store";


const usageLimit = parseInt(process.env.NEXT_PUBLIC_DAILY_USAGE_LIMIT || "5");
const maxChars = parseInt(process.env.NEXT_PUBLIC_MAX_CHARS || "20000");

// Usage tracking functions
const checkUsageLimit = () => {
  const today = new Date().toISOString().split('T')[0];
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  const todayUsage = usageData[today] || 0;
  return todayUsage < usageLimit;
};

const incrementUsage = () => {
  const today = new Date().toISOString().split('T')[0];
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  
  if (!usageData[today]) {
    usageData[today] = 0;
  }
  
  usageData[today] += 1;
  localStorage.setItem('usageData', JSON.stringify(usageData));
};

const getRemainingUsage = () => {
  const today = new Date().toISOString().split('T')[0];
  const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
  const todayUsage = usageData[today] || 0;
  return Math.max(0, usageLimit - todayUsage);
};

export default function Home() {
  // 检查是否已完成hydration
  const hydrated = useHydration();
  
  // 使用Zustand store
  const editor = useEditorState();
  const ui = useUIState();
  const config = useConfigState();
  const usage = useUsageState();
  
  // Actions
  const {
    setInputText,
    setMermaidCode,
    setDiagramType,
    setStreamingContent,
    setIsStreaming,
    setError,
  } = useEditorActions();
  
  const {
    toggleLeftPanel,
    toggleRenderMode,
    setIsGenerating,
    setIsFixing,
    setShowSettingsDialog,
    setShowLimitDialog,
    setShowTemplateDialog,
    setShowBatchDialog,
    setShowHistoryDialog,
  } = useUIActions();
  
  const { undo, redo, canUndo, canRedo } = useHistoryActions();
  
  // Store actions
  const setPasswordVerified = useAppStore((state) => state.setPasswordVerified);
  const setRemainingUsage = useAppStore((state) => state.setRemainingUsage);
  const setAIConfig = useAppStore((state) => state.setAIConfig);

  useEffect(() => {
    if (!hydrated) return;
    
    // Update remaining usage count on component mount
    setRemainingUsage(getRemainingUsage());
    // Check password verification status
    setPasswordVerified(isPasswordVerified());
    // Check custom AI config status
    const hasConfig = hasCustomAIConfig();
    if (hasConfig) {
      const storedConfig = localStorage.getItem('aiConfig');
      if (storedConfig) {
        setAIConfig(JSON.parse(storedConfig));
      }
    }
    
    // 初始化历史管理器自动保存
    historyManagerService.initAutoSave();
    
    // 在组件卸载时清理自动保存定时器
    return () => {
      historyManagerService.stopAutoSave();
    };
  }, [hydrated, setRemainingUsage, setPasswordVerified, setAIConfig]);

  const handleTextChange = useCallback((text) => {
    setInputText(text);
  }, [setInputText]);

  const handleFileTextExtracted = useCallback((text) => {
    setInputText(text);
  }, [setInputText]);

  const handleDiagramTypeChange = useCallback((type) => {
    setDiagramType(type);
  }, [setDiagramType]);

  const handleMermaidCodeChange = useCallback((code) => {
    setMermaidCode(code);
  }, [setMermaidCode]);

  const handleStreamChunk = useCallback((chunk) => {
    setStreamingContent((editor.streamingContent || '') + chunk);
  }, [setStreamingContent, editor.streamingContent]);

  const handleSettingsClick = useCallback(() => {
    setShowSettingsDialog(true);
  }, [setShowSettingsDialog]);

  const handlePasswordVerified = useCallback((verified) => {
    setPasswordVerified(verified);
  }, [setPasswordVerified]);

  const handleConfigUpdated = useCallback(() => {
    // 重新检查自定义配置状态
    const hasConfig = hasCustomAIConfig();
    if (hasConfig) {
      const storedConfig = localStorage.getItem('aiConfig');
      if (storedConfig) {
        setAIConfig(JSON.parse(storedConfig));
      }
    }
  }, [setAIConfig]);

  // 处理错误状态变化
  const handleErrorChange = useCallback((error, hasErr) => {
    setError(error, hasErr);
  }, [setError]);

  // 使用useCallback优化ModelSelector的回调
  const handleModelChange = useCallback((modelId) => {
    console.log('Selected model:', modelId);
    useAppStore.getState().setSelectedModel(modelId);
  }, []);

  // 自动修复Mermaid代码
  const handleAutoFixMermaid = useCallback(async () => {
    if (!editor.mermaidCode) {
      toast.error("没有代码可以修复");
      return;
    }

    setIsFixing(true);
    setStreamingContent(""); // 清空流式内容，准备显示修复内容

    try {
      // 流式修复回调函数
      const handleFixChunk = (chunk) => {
        setStreamingContent((prev) => (prev || '') + chunk);
      };

      // 传递错误信息给AI修复函数
      const result = await autoFixMermaidCode(editor.mermaidCode, editor.errorMessage, handleFixChunk);

      if (result.error) {
        toast.error(result.error);
        // 如果有基础修复的代码，仍然应用它
        if (result.fixedCode !== editor.mermaidCode) {
          setMermaidCode(result.fixedCode);
          toast.info("已应用基础修复");
        }
      } else {
        if (result.fixedCode !== editor.mermaidCode) {
          setMermaidCode(result.fixedCode);
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
      // 修复完成后清空流式内容
      setTimeout(() => {
        setStreamingContent("");
      }, 1000);
    }
  }, [editor.mermaidCode, editor.errorMessage, setIsFixing, setStreamingContent, setMermaidCode]);

  // 切换图表方向
  const handleToggleMermaidDirection = useCallback(() => {
    if (!editor.mermaidCode) {
      toast.error("没有代码可以切换方向");
      return;
    }

    const toggledCode = toggleMermaidDirection(editor.mermaidCode);
    if (toggledCode !== editor.mermaidCode) {
      setMermaidCode(toggledCode);
      toast.success("图表方向已切换");
    } else {
      toast.info("未检测到可切换的方向");
    }
  }, [editor.mermaidCode, setMermaidCode]);

  const handleGenerateClick = useCallback(async () => {
    if (!editor.inputText?.trim()) {
      toast.error("请输入文本内容");
      return;
    }

    if (!isWithinCharLimit(editor.inputText, maxChars)) {
      toast.error(`文本超过${maxChars}字符限制`);
      return;
    }

    // 检查是否有无限量权限（密码验证通过或有自定义AI配置）
    const hasUnlimited = hasUnlimitedAccess();
    
    // 如果没有无限量权限，则检查使用限制（但不增加使用量）
    if (!hasUnlimited) {
      if (!checkUsageLimit()) {
        setShowLimitDialog(true);
        return;
      }
    }

    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const { mermaidCode: generatedCode, error } = await generateMermaidFromText(
        editor.inputText,
        editor.diagramType,
        handleStreamChunk
      );

      if (error) {
        toast.error(error);
        return;
      }

      if (!generatedCode) {
        toast.error("生成图表失败，请重试");
        return;
      }

      // 只有在API调用成功后才增加使用量
      if (!hasUnlimited) {
        incrementUsage();
        setRemainingUsage(getRemainingUsage());
      }

      setMermaidCode(generatedCode);
      toast.success("图表生成成功");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("生成图表时发生错误");
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  }, [
    editor.inputText, 
    editor.diagramType,
    setIsGenerating, 
    setIsStreaming, 
    setStreamingContent, 
    setMermaidCode, 
    setShowLimitDialog,
    setRemainingUsage,
    handleStreamChunk
  ]);

  // 使用快捷键Hook（需要在所有函数定义之后）
  const { showShortcutHelp } = useKeyboardShortcuts({
    onGenerate: handleGenerateClick,
    onFix: handleAutoFixMermaid,
    enabled: hydrated,
  });

  // 如果还没有hydrate，返回loading状态
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        remainingUsage={usage.remainingUsage}
        usageLimit={usageLimit}
        onSettingsClick={handleSettingsClick}
        isPasswordVerified={config.passwordVerified}
        hasCustomConfig={config.hasCustomConfig}
      />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4 md:p-6">
          <div 
            className={`h-full grid gap-4 md:gap-6 transition-all duration-300 ${
              ui.isLeftPanelCollapsed ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {/* 左侧面板 */}
            <div className={`${
              ui.isLeftPanelCollapsed ? 'hidden md:hidden' : 'col-span-1'
            } flex flex-col h-full overflow-hidden`}>
              
              <Tabs defaultValue="manual" className="flex flex-col h-full">
                {/* 固定高度的顶部控制栏 */}
                <div className="h-auto md:h-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 flex-shrink-0 pb-2 md:pb-0">
                  <TabsList className="h-9 w-full md:w-auto">
                    <TabsTrigger value="manual" className="flex-1 md:flex-none">手动输入</TabsTrigger>
                    <TabsTrigger value="file" className="flex-1 md:flex-none">文件上传</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <ModelSelector onModelChange={handleModelChange} />
                    <div className="flex-1 md:flex-none min-w-0">
                      <DiagramTypeSelector 
                        value={editor.diagramType} 
                        onChange={handleDiagramTypeChange} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* 主内容区域 */}
                <div className="flex-1 flex flex-col overflow-hidden mt-2 md:mt-4">
                  {/* 输入区域 - 固定高度 */}
                  <div className="h-40 md:h-56 flex-shrink-0">
                    <TabsContent value="manual" className="h-full mt-0">
                      <TextInput 
                        value={editor.inputText} 
                        onChange={handleTextChange} 
                        maxChars={maxChars}
                      />
                    </TabsContent>
                    <TabsContent value="file" className="h-full mt-0">
                      <FileUpload onTextExtracted={handleFileTextExtracted} />
                    </TabsContent>
                  </div>

                  {/* 生成按钮 - 固定高度 */}
                  <div className="h-16 flex items-center flex-shrink-0">
                    <Button 
                      onClick={handleGenerateClick} 
                      disabled={ui.isGenerating || !editor.inputText?.trim() || !isWithinCharLimit(editor.inputText, maxChars)}
                      className="w-full h-10"
                    >
                      {ui.isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                          生成中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          生成图表
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* 编辑器区域 - 占用剩余空间 */}
                  <div className="flex-1 min-h-0">
                    <MermaidEditor
                      code={editor.mermaidCode}
                      onChange={handleMermaidCodeChange}
                      streamingContent={editor.streamingContent}
                      isStreaming={editor.isStreaming}
                      errorMessage={editor.errorMessage}
                      hasError={editor.hasError}
                      onStreamChunk={handleStreamChunk}
                    />
                  </div>
                </div>
              </Tabs>
            </div>
            
            {/* 右侧面板 */}
            <div className={`${
              ui.isLeftPanelCollapsed ? 'col-span-1' : 'col-span-1 md:col-span-2'
            } flex flex-col h-full overflow-hidden`}>
              {/* 控制按钮栏 - 固定高度 */}
              <div className="h-12 flex justify-between items-center flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLeftPanel}
                  className="h-9"
                >
                  {ui.isLeftPanelCollapsed ? (
                    <>
                      <PanelLeftOpen className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">显示编辑面板</span>
                    </>
                  ) : (
                    <>
                      <PanelLeftClose className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">隐藏编辑面板</span>
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  {/* 撤销/重做控制 */}
                  <UndoRedoControls />
                  
                  {/* 分隔线 */}
                  <div className="w-px h-6 bg-border" />
                  
                  {/* 模板按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateDialog(true)}
                    className="h-9"
                    title="选择模板"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">模板</span>
                  </Button>
                  
                  {/* 批处理按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBatchDialog(true)}
                    className="h-9"
                    title="批量处理"
                  >
                    <Layers className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">批处理</span>
                  </Button>
                  
                  {/* 历史记录按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistoryDialog(true)}
                    className="h-9"
                    title="历史记录"
                  >
                    <History className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">历史</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFixMermaid}
                    disabled={!editor.mermaidCode || ui.isFixing || !editor.hasError}
                    className="h-9"
                    title={editor.hasError ? "使用AI智能修复代码问题" : "当前代码没有错误，无需修复"}
                  >
                    {ui.isFixing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span className="hidden lg:inline ml-2">修复中...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        <span className="hidden lg:inline ml-2">AI修复</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMermaidDirection}
                    disabled={!editor.mermaidCode}
                    className="h-9"
                    title="切换图表方向 (横向/纵向)"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span className="hidden lg:inline ml-2">切换方向</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRenderMode}
                    className="h-9"
                  >
                    {ui.renderMode === "excalidraw" ? (
                      <>
                        <FileImage className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Mermaid</span>
                      </>
                    ) : (
                      <>
                        <Monitor className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Excalidraw</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('resetView'));
                    }}
                    className="h-9"
                    title="重置视图"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('toggleFullscreen'));
                    }}
                    className="h-9"
                    title="全屏显示"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 渲染器区域 - 占用剩余空间 */}
              <div className="flex-1 min-h-0 mt-4" style={{ minHeight: '600px' }}>
                <RendererWrapper
                  renderMode={ui.renderMode}
                  mermaidCode={editor.mermaidCode}
                  onChange={handleMermaidCodeChange}
                  onErrorChange={handleErrorChange}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="h-12 border-t flex items-center justify-center flex-shrink-0">
        <div className="text-center text-sm text-muted-foreground">
          AI 驱动的文本转 Mermaid 图表 Web 应用 &copy; {new Date().getFullYear()}
        </div>
      </footer>

      {/* Settings Dialog */}
      <SettingsDialog 
        open={ui.showSettingsDialog} 
        onOpenChange={setShowSettingsDialog}
        onPasswordVerified={handlePasswordVerified}
        onConfigUpdated={handleConfigUpdated}
      />

      {/* Template Selector Dialog */}
      <TemplateSelector 
        isOpen={ui.showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
      />

      {/* Batch Process Dialog */}
      <BatchProcessDialog 
        isOpen={ui.showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
      />

      {/* History Dialog */}
      <HistoryDialog 
        isOpen={ui.showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
      />
      
      {/* Usage Limit Dialog */}
      <Dialog open={ui.showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>使用次数已达上限</DialogTitle>
            <DialogDescription>
              <div className="py-4">
                <p className="mb-2">您今日的使用次数已达上限 ({usageLimit}次/天)</p>
                <p className="mb-4">如需更多使用次数，您可以：</p>
                <ul className="list-disc list-inside space-y-2 text-sm mb-4">
                  <li>在设置中配置您自己的AI服务密钥</li>
                  <li>等待明天重置使用次数</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="secondary" onClick={() => setShowLimitDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}