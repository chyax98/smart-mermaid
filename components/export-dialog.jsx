"use client";

import React, { useState, useRef } from 'react';
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Image as ImageIcon,
  FileText,
  Palette,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from "sonner";
import { 
  DiagramExporter, 
  EXPORT_FORMATS, 
  EXPORT_PRESETS,
  exportDiagram 
} from '@/lib/export-utils';

const ExportDialog = ({ children, exportElement, filename = "mermaid-diagram" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMATS.PNG);
  const [selectedPreset, setSelectedPreset] = useState('STANDARD');
  const [customConfig, setCustomConfig] = useState({
    quality: 0.9,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    width: null,
    height: null
  });
  const [useCustomSettings, setUseCustomSettings] = useState(false);
  const abortControllerRef = useRef(null);

  // 获取最终导出配置
  const getFinalConfig = () => {
    if (useCustomSettings) {
      return {
        ...customConfig,
        width: customConfig.width || undefined,
        height: customConfig.height || undefined
      };
    }
    return EXPORT_PRESETS[selectedPreset];
  };

  // 单个格式导出
  const handleSingleExport = async (format) => {
    if (!exportElement) {
      toast.error("未找到可导出的内容");
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      abortControllerRef.current = new AbortController();
      const config = getFinalConfig();
      
      let result;
      const finalFilename = `${filename}.${format}`;
      
      switch (format) {
        case EXPORT_FORMATS.PNG:
          result = await exportDiagram.toPNG(exportElement, config);
          break;
        case EXPORT_FORMATS.JPEG:
          result = await exportDiagram.toJPEG(exportElement, config);
          break;
        case EXPORT_FORMATS.SVG:
          result = await exportDiagram.toSVG(exportElement, config);
          break;
        case EXPORT_FORMATS.PDF:
          result = await exportDiagram.toPDF(exportElement, config);
          break;
        case EXPORT_FORMATS.WEBP:
          result = await exportDiagram.toWebP(exportElement, config);
          break;
        default:
          throw new Error(`不支持的格式: ${format}`);
      }

      setExportResult({ success: true, format, filename: finalFilename });
      toast.success(`${format.toUpperCase()} 导出成功`);
      
    } catch (error) {
      console.error('导出失败:', error);
      setExportResult({ success: false, error: error.message });
      toast.error(`导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  // 批量导出
  const handleBatchExport = async () => {
    if (!exportElement) {
      toast.error("未找到可导出的内容");
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const formats = [EXPORT_FORMATS.PNG, EXPORT_FORMATS.SVG, EXPORT_FORMATS.PDF];
      const config = getFinalConfig();
      
      toast.info("开始批量导出，请稍候...");
      
      const { results, errors } = await exportDiagram.multiple(exportElement, formats, config);
      
      const successCount = Object.keys(results).length;
      const errorCount = Object.keys(errors).length;
      
      if (successCount > 0) {
        toast.success(`批量导出完成: ${successCount} 个文件成功, ${errorCount} 个失败`);
        setExportResult({ 
          success: true, 
          batch: true, 
          results, 
          errors,
          summary: `${successCount}/${successCount + errorCount} 成功`
        });
      } else {
        toast.error("批量导出失败");
        setExportResult({ success: false, errors });
      }
      
    } catch (error) {
      console.error('批量导出失败:', error);
      setExportResult({ success: false, error: error.message });
      toast.error(`批量导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 取消导出
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExporting(false);
      toast.info("导出已取消");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            导出图表
          </DialogTitle>
          <DialogDescription>
            选择导出格式和质量设置，支持多种格式的高质量导出
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">单个导出</TabsTrigger>
            <TabsTrigger value="batch">批量导出</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            {/* 格式选择 */}
            <div className="space-y-2">
              <Label htmlFor="format">导出格式</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="选择导出格式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EXPORT_FORMATS.PNG}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>PNG</span>
                      <Badge variant="secondary">推荐</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value={EXPORT_FORMATS.JPEG}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>JPEG</span>
                      <Badge variant="outline">压缩</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value={EXPORT_FORMATS.SVG}>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <span>SVG</span>
                      <Badge variant="outline">矢量</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value={EXPORT_FORMATS.PDF}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>PDF</span>
                      <Badge variant="outline">文档</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value={EXPORT_FORMATS.WEBP}>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>WebP</span>
                      <Badge variant="outline">现代</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 预设配置 */}
            <div className="space-y-2">
              <Label>质量预设</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedPreset} onValueChange={setSelectedPreset} disabled={useCustomSettings}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择质量预设" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH_QUALITY">
                      <div className="space-y-1">
                        <div className="font-medium">高质量</div>
                        <div className="text-xs text-muted-foreground">适合打印</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="STANDARD">
                      <div className="space-y-1">
                        <div className="font-medium">标准</div>
                        <div className="text-xs text-muted-foreground">平衡质量与大小</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPRESSED">
                      <div className="space-y-1">
                        <div className="font-medium">压缩</div>
                        <div className="text-xs text-muted-foreground">文件大小优先</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="TRANSPARENT">
                      <div className="space-y-1">
                        <div className="font-medium">透明背景</div>
                        <div className="text-xs text-muted-foreground">PNG 专用</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="UHD_4K">
                      <div className="space-y-1">
                        <div className="font-medium">4K 高清</div>
                        <div className="text-xs text-muted-foreground">3840x2160</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">
                      <div className="space-y-1">
                        <div className="font-medium">社交媒体</div>
                        <div className="text-xs text-muted-foreground">1200x630</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="custom-settings"
                    checked={useCustomSettings}
                    onCheckedChange={setUseCustomSettings}
                  />
                  <Label htmlFor="custom-settings" className="text-sm">
                    自定义
                  </Label>
                </div>
              </div>
            </div>

            {/* 自定义设置 */}
            {useCustomSettings && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">自定义设置</span>
                </div>
                
                {/* 质量设置 */}
                <div className="space-y-2">
                  <Label>质量: {Math.round(customConfig.quality * 100)}%</Label>
                  <Slider
                    value={[customConfig.quality]}
                    onValueChange={([value]) => setCustomConfig(prev => ({ ...prev, quality: value }))}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* 像素比例 */}
                <div className="space-y-2">
                  <Label>像素比例: {customConfig.pixelRatio}x</Label>
                  <Slider
                    value={[customConfig.pixelRatio]}
                    onValueChange={([value]) => setCustomConfig(prev => ({ ...prev, pixelRatio: value }))}
                    max={4}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* 背景色 */}
                <div className="space-y-2">
                  <Label htmlFor="bg-color">背景颜色</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="bg-color"
                      type="color"
                      value={customConfig.backgroundColor || '#ffffff'}
                      onChange={(e) => setCustomConfig(prev => ({ 
                        ...prev, 
                        backgroundColor: e.target.value 
                      }))}
                      className="w-12 h-8 rounded border"
                    />
                    <span className="text-sm text-muted-foreground">
                      {customConfig.backgroundColor || '透明'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 导出结果 */}
            {exportResult && (
              <div className={`p-4 rounded-lg ${
                exportResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              } border`}>
                <div className="flex items-center gap-2">
                  {exportResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    exportResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {exportResult.success ? '导出成功' : '导出失败'}
                  </span>
                </div>
                {exportResult.success && exportResult.filename && (
                  <p className="text-sm text-green-700 mt-1">
                    文件: {exportResult.filename}
                  </p>
                )}
                {exportResult.error && (
                  <p className="text-sm text-red-700 mt-1">
                    错误: {exportResult.error}
                  </p>
                )}
              </div>
            )}

            {/* 导出按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleSingleExport(selectedFormat)}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    导出 {selectedFormat.toUpperCase()}
                  </>
                )}
              </Button>
              
              {isExporting && (
                <Button
                  variant="outline"
                  onClick={handleCancelExport}
                >
                  取消
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">批量导出格式</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Badge variant="secondary">PNG (高质量)</Badge>
                  <Badge variant="secondary">SVG (矢量)</Badge>
                  <Badge variant="secondary">PDF (文档)</Badge>
                </div>
              </div>

              {/* 批量导出结果 */}
              {exportResult?.batch && (
                <div className="p-4 rounded-lg bg-blue-50 border-blue-200 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">批量导出完成</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    成功导出: {Object.keys(exportResult.results || {}).length} 个文件
                  </p>
                  {Object.keys(exportResult.errors || {}).length > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      失败: {Object.keys(exportResult.errors).length} 个文件
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleBatchExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    批量导出中...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    批量导出 (PNG + SVG + PDF)
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;