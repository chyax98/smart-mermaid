"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  Settings,
  Play,
  Pause,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Layers,
  RefreshCw
} from 'lucide-react';
import { toast } from "sonner";
import { batchProcess, BATCH_STATUS, BATCH_TYPES } from '@/lib/batch-processor';
import { templates } from '@/lib/templates';

const BatchProcessDialog = ({ children, isOpen, onClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // 如果有外部控制，使用外部状态；否则使用内部状态
  const dialogIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsOpen = onClose !== undefined ? onClose : setInternalIsOpen;
  const [activeTab, setActiveTab] = useState('convert');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskResults, setTaskResults] = useState(null);
  
  // 转换任务状态
  const [textItems, setTextItems] = useState([]);
  const [convertModel, setConvertModel] = useState('gpt-4');
  
  // 导出任务状态
  const [exportDiagrams, setExportDiagrams] = useState([]);
  const [exportFormats, setExportFormats] = useState(['png']);
  const [exportQuality, setExportQuality] = useState('standard');
  
  // 模板任务状态
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateParameters, setTemplateParameters] = useState([]);
  
  const fileInputRef = useRef(null);
  const taskPollingRef = useRef(null);

  // 文件上传处理
  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    const newItems = [];

    for (const file of files) {
      try {
        const text = await file.text();
        newItems.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          text: text.substring(0, 10000), // 限制文本长度
          type: 'auto'
        });
      } catch (error) {
        toast.error(`读取文件失败: ${file.name}`);
      }
    }

    setTextItems(prev => [...prev, ...newItems]);
    toast.success(`成功添加 ${newItems.length} 个文件`);
  }, []);

  // 添加文本项
  const addTextItem = useCallback(() => {
    const newItem = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `文本 ${textItems.length + 1}`,
      text: '',
      type: 'auto'
    };
    setTextItems(prev => [...prev, newItem]);
  }, [textItems.length]);

  // 删除文本项
  const removeTextItem = useCallback((id) => {
    setTextItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // 更新文本项
  const updateTextItem = useCallback((id, field, value) => {
    setTextItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  // 批量转换
  const handleBatchConvert = useCallback(async () => {
    if (textItems.length === 0) {
      toast.error('请至少添加一个文本项');
      return;
    }

    setIsProcessing(true);
    setTaskResults(null);

    try {
      const results = await batchProcess.convert(textItems, {
        model: convertModel
      });

      setTaskResults({
        type: 'convert',
        results,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        total: results.length
      });

      toast.success(`批量转换完成: ${results.filter(r => r.success).length}/${results.length} 成功`);

    } catch (error) {
      console.error('批量转换失败:', error);
      toast.error(`批量转换失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [textItems, convertModel]);

  // 批量导出
  const handleBatchExport = useCallback(async () => {
    if (exportDiagrams.length === 0) {
      toast.error('请至少添加一个图表');
      return;
    }

    setIsProcessing(true);
    setTaskResults(null);

    try {
      const results = await batchProcess.export(exportDiagrams, exportFormats, {
        quality: exportQuality
      });

      setTaskResults({
        type: 'export',
        results,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        total: results.length
      });

      toast.success(`批量导出完成: ${results.filter(r => r.success).length}/${results.length} 成功`);

    } catch (error) {
      console.error('批量导出失败:', error);
      toast.error(`批量导出失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [exportDiagrams, exportFormats, exportQuality]);

  // 批量应用模板
  const handleBatchTemplate = useCallback(async () => {
    if (!selectedTemplate || templateParameters.length === 0) {
      toast.error('请选择模板并添加参数');
      return;
    }

    setIsProcessing(true);
    setTaskResults(null);

    try {
      const results = await batchProcess.applyTemplate(selectedTemplate, templateParameters);

      setTaskResults({
        type: 'template',
        results,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        total: results.length
      });

      toast.success(`批量应用模板完成: ${results.filter(r => r.success).length}/${results.length} 成功`);

    } catch (error) {
      console.error('批量应用模板失败:', error);
      toast.error(`批量应用模板失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTemplate, templateParameters]);

  // 渲染转换标签页
  const renderConvertTab = () => (
    <div className="space-y-6">
      {/* 文本输入区域 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>文本内容</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              上传文件
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addTextItem}
            >
              添加文本
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 文本项列表 */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {textItems.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Input
                  value={item.name}
                  onChange={(e) => updateTextItem(item.id, 'name', e.target.value)}
                  className="flex-1 mr-2"
                  placeholder="项目名称"
                />
                <Select
                  value={item.type}
                  onValueChange={(value) => updateTextItem(item.id, 'type', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动</SelectItem>
                    <SelectItem value="flowchart">流程图</SelectItem>
                    <SelectItem value="sequence">时序图</SelectItem>
                    <SelectItem value="classDiagram">类图</SelectItem>
                    <SelectItem value="gantt">甘特图</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTextItem(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={item.text}
                onChange={(e) => updateTextItem(item.id, 'text', e.target.value)}
                placeholder="输入要转换的文本内容..."
                rows={3}
              />
            </div>
          ))}
        </div>

        {textItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无文本项，点击上方按钮添加</p>
          </div>
        )}
      </div>

      {/* 转换设置 */}
      <div className="space-y-2">
        <Label>AI模型</Label>
        <Select value={convertModel} onValueChange={setConvertModel}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4">GPT-4 (推荐)</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 执行按钮 */}
      <Button
        onClick={handleBatchConvert}
        disabled={isProcessing || textItems.length === 0}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            转换中... ({textItems.length} 项)
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            开始批量转换 ({textItems.length} 项)
          </>
        )}
      </Button>
    </div>
  );

  // 渲染结果显示
  const renderResults = () => {
    if (!taskResults) return null;

    return (
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">处理结果</h4>
          <div className="flex gap-2">
            <Badge variant="success">{taskResults.success} 成功</Badge>
            <Badge variant="destructive">{taskResults.failed} 失败</Badge>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {taskResults.results.map((result, index) => (
            <div
              key={result.id || index}
              className={`p-3 rounded border ${
                result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{result.name || `项目 ${index + 1}`}</span>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              {result.error && (
                <p className="text-sm text-red-600 mt-1">{result.error}</p>
              )}
              {result.output && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer">查看结果</summary>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                    {result.output.substring(0, 200)}...
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            批处理工具
          </DialogTitle>
          <DialogDescription>
            批量处理多个文本、图表导出和模板应用
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="convert">批量转换</TabsTrigger>
            <TabsTrigger value="export">批量导出</TabsTrigger>
            <TabsTrigger value="template">模板应用</TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="space-y-4">
            {renderConvertTab()}
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>批量导出功能正在开发中...</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>模板应用功能正在开发中...</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {renderResults()}
      </DialogContent>
    </Dialog>
  );
};

export default BatchProcessDialog;