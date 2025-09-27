"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  History,
  Clock,
  Save,
  RotateCcw,
  Trash2,
  Search,
  Download,
  Upload,
  FileText,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  GitCompare,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from "sonner";
import { historyManager, defaultHistoryManager } from '@/lib/history-manager';
import { useAppStore } from '@/stores/app-store';

const HistoryDialog = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    autoSaved: 'all',
    diagramType: '',
    renderMode: '',
    dateRange: { start: '', end: '' }
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [compareRecords, setCompareRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 保存对话框状态
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState('');

  // 加载历史记录
  const loadRecords = useCallback(() => {
    setIsLoading(true);
    try {
      const allRecords = historyManager.getAll();
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      const stats = historyManager.getStats();
      setStatistics(stats);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      toast.error('加载历史记录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 组件挂载时加载数据
  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen, loadRecords]);

  // 搜索和过滤
  useEffect(() => {
    const filtered = historyManager.search(searchQuery, filterOptions);
    setFilteredRecords(filtered);
  }, [searchQuery, filterOptions, records]);

  // 手动保存
  const handleManualSave = useCallback(async () => {
    if (!saveTitle.trim()) {
      toast.error('请输入标题');
      return;
    }

    try {
      const tags = saveTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const record = historyManager.save(saveTitle, saveDescription, tags);
      
      toast.success('保存成功');
      setSaveDialogOpen(false);
      setSaveTitle('');
      setSaveDescription('');
      setSaveTags('');
      loadRecords();
      
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    }
  }, [saveTitle, saveDescription, saveTags, loadRecords]);

  // 恢复记录
  const handleRestore = useCallback(async (recordId) => {
    try {
      const restored = historyManager.restore(recordId);
      toast.success(`已恢复到: ${restored.title}`);
      setIsOpen(false);
      loadRecords();
    } catch (error) {
      console.error('恢复失败:', error);
      toast.error('恢复失败');
    }
  }, [loadRecords]);

  // 删除记录
  const handleDelete = useCallback(async (recordId) => {
    if (!confirm('确定要删除这条历史记录吗？')) {
      return;
    }

    try {
      historyManager.delete(recordId);
      toast.success('删除成功');
      loadRecords();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  }, [loadRecords]);

  // 导出历史记录
  const handleExport = useCallback(async () => {
    try {
      const data = historyManager.export('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-mermaid-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  }, []);

  // 导入历史记录
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = historyManager.import(text);
      toast.success(`导入成功: ${result.imported} 条记录，跳过 ${result.skipped} 条`);
      loadRecords();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败');
    }
  }, [loadRecords]);

  // 切换比较模式
  const toggleCompare = useCallback((recordId) => {
    setCompareRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else if (prev.length < 2) {
        return [...prev, recordId];
      } else {
        // 替换第一个
        return [prev[1], recordId];
      }
    });
  }, []);

  // 渲染记录列表
  const renderRecordsList = () => (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索历史记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterOptions({
              autoSaved: 'all',
              diagramType: '',
              renderMode: '',
              dateRange: { start: '', end: '' }
            })}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* 过滤选项 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select
            value={filterOptions.autoSaved}
            onValueChange={(value) => setFilterOptions(prev => ({ ...prev, autoSaved: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="保存类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="true">自动保存</SelectItem>
              <SelectItem value="false">手动保存</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterOptions.diagramType}
            onValueChange={(value) => setFilterOptions(prev => ({ ...prev, diagramType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="图表类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部类型</SelectItem>
              <SelectItem value="auto">自动</SelectItem>
              <SelectItem value="flowchart">流程图</SelectItem>
              <SelectItem value="sequence">时序图</SelectItem>
              <SelectItem value="classDiagram">类图</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterOptions.renderMode}
            onValueChange={(value) => setFilterOptions(prev => ({ ...prev, renderMode: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="渲染模式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部模式</SelectItem>
              <SelectItem value="mermaid">Mermaid</SelectItem>
              <SelectItem value="excalidraw">Excalidraw</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="whitespace-nowrap"
          >
            <Save className="h-4 w-4 mr-1" />
            手动保存
          </Button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无历史记录</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className={`p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                compareRecords.includes(record.id) ? 'border-blue-300 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{record.title}</h4>
                    {record.autoSaved && (
                      <Badge variant="secondary" className="text-xs">自动</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {record.diagramType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {record.renderMode}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {record.getFormattedTime()}
                    </span>
                    <span>{record.getCodeLineCount()} 行</span>
                    {record.description && (
                      <span className="truncate max-w-48">{record.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecord(record)}
                    title="预览"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCompare(record.id)}
                    title="比较"
                    className={compareRecords.includes(record.id) ? 'text-blue-600' : ''}
                  >
                    <GitCompare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(record.id)}
                    title="恢复"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(record.id)}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 比较按钮 */}
      {compareRecords.length === 2 && (
        <Button
          onClick={() => {
            const comparison = historyManager.compare(compareRecords[0], compareRecords[1]);
            setSelectedRecord(comparison);
          }}
          className="w-full"
        >
          <GitCompare className="h-4 w-4 mr-2" />
          比较选中的记录
        </Button>
      )}
    </div>
  );

  // 渲染统计信息
  const renderStatistics = () => (
    <div className="space-y-6">
      {statistics ? (
        <>
          {/* 基础统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
              <div className="text-sm text-muted-foreground">总记录</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statistics.manual}</div>
              <div className="text-sm text-muted-foreground">手动保存</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{statistics.autoSaved}</div>
              <div className="text-sm text-muted-foreground">自动保存</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{statistics.totalCodeLines}</div>
              <div className="text-sm text-muted-foreground">总代码行</div>
            </div>
          </div>

          {/* 时间统计 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-semibold">{statistics.today}</div>
              <div className="text-sm text-muted-foreground">今日</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-semibold">{statistics.thisWeek}</div>
              <div className="text-sm text-muted-foreground">本周</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-semibold">{statistics.thisMonth}</div>
              <div className="text-sm text-muted-foreground">本月</div>
            </div>
          </div>

          {/* 最常用图表类型 */}
          <div className="space-y-3">
            <h4 className="font-medium">最常用图表类型</h4>
            <div className="space-y-2">
              {statistics.mostUsedTypes.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="capitalize">{item.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(item.count / statistics.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>暂无统计数据</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              历史记录管理
            </DialogTitle>
            <DialogDescription>
              查看、恢复和管理您的编辑历史
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="records">历史记录</TabsTrigger>
              <TabsTrigger value="statistics">统计信息</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
              {renderRecordsList()}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              {renderStatistics()}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    导出历史记录
                  </Button>
                  <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    导入历史记录
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Label>清理设置</Label>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm('确定要清理历史记录吗？这将删除30天前的自动保存记录。')) {
                        const result = historyManager.cleanup();
                        toast.success(`清理完成，删除了 ${result.removed} 条记录`);
                        loadRecords();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清理旧记录
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 手动保存对话框 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存当前版本</DialogTitle>
            <DialogDescription>
              为当前编辑状态创建一个命名版本
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="save-title">版本标题 *</Label>
              <Input
                id="save-title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="为这个版本输入一个标题..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-description">描述</Label>
              <Textarea
                id="save-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="描述这个版本的变更内容..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-tags">标签</Label>
              <Input
                id="save-tags"
                value={saveTags}
                onChange={(e) => setSaveTags(e.target.value)}
                placeholder="用逗号分隔标签，如：重要,完成,review"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleManualSave}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 记录预览对话框 */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedRecord.title}</DialogTitle>
              <DialogDescription>
                {selectedRecord.getFormattedTime()} • {selectedRecord.getCodeLineCount()} 行代码
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedRecord.description && (
                <div>
                  <Label>描述</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRecord.description}</p>
                </div>
              )}
              <div>
                <Label>Mermaid 代码</Label>
                <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-auto max-h-60">
                  {selectedRecord.mermaidCode}
                </pre>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  关闭
                </Button>
                <Button onClick={() => {
                  handleRestore(selectedRecord.id);
                  setSelectedRecord(null);
                }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  恢复此版本
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default HistoryDialog;