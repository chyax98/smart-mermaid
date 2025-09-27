"use client";

import { useState, useCallback, memo, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  Sparkles, 
  Copy, 
  Check,
  FileText,
  Shuffle
} from "lucide-react";
import { 
  templates, 
  getTemplateCategories, 
  searchTemplates,
  getRandomTemplate 
} from "@/lib/templates";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";

/**
 * 模板选择器组件
 * 提供模板浏览、搜索和应用功能
 */
export const TemplateSelector = memo(function TemplateSelector({ 
  isOpen, 
  onClose 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("flowchart");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // 从store获取操作
  const setMermaidCode = useAppStore((state) => state.setMermaidCode);
  const setInputText = useAppStore((state) => state.setInputText);
  
  // 获取类别列表
  const categories = useMemo(() => getTemplateCategories(), []);
  
  // 获取搜索结果或当前类别的模板
  const displayTemplates = useMemo(() => {
    if (searchQuery) {
      return searchTemplates(searchQuery);
    }
    return templates[selectedCategory] || [];
  }, [searchQuery, selectedCategory]);
  
  // 应用模板
  const handleApplyTemplate = useCallback((template) => {
    setMermaidCode(template.code);
    setInputText(`使用${template.name}模板`);
    toast.success(`已应用模板: ${template.name}`);
    onClose();
  }, [setMermaidCode, setInputText, onClose]);
  
  // 复制模板代码
  const handleCopyTemplate = useCallback(async (template) => {
    const success = await copyToClipboard(template.code);
    if (success) {
      setCopied(true);
      toast.success("模板代码已复制");
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);
  
  // 预览模板
  const handlePreviewTemplate = useCallback((template) => {
    setSelectedTemplate(template);
  }, []);
  
  // 随机选择模板
  const handleRandomTemplate = useCallback(() => {
    const randomTemplate = getRandomTemplate();
    setSelectedCategory(randomTemplate.category);
    setSelectedTemplate(randomTemplate);
    toast.info(`随机选择: ${randomTemplate.name}`);
  }, []);
  
  // 清空搜索
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Mermaid 模板库
          </DialogTitle>
          <DialogDescription>
            选择一个模板开始创建图表，或搜索特定类型的模板
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* 搜索栏和工具按钮 */}
          <div className="px-6 py-4 border-b flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板..."
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  ✕
                </Button>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRandomTemplate}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>随机选择模板</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* 主内容区 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 左侧：类别和模板列表 */}
            <div className="w-2/3 border-r flex flex-col">
              {!searchQuery && (
                <Tabs 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                  className="flex-1 flex flex-col"
                >
                  <TabsList className="w-full justify-start px-6 h-auto flex-wrap">
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                        <Badge variant="secondary" className="ml-2">
                          {category.count}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <ScrollArea className="flex-1 px-6">
                    <div className="grid gap-3 py-4">
                      {displayTemplates.map((template) => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-colors hover:bg-accent ${
                            selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{template.icon}</span>
                                <CardTitle className="text-base">
                                  {template.name}
                                </CardTitle>
                              </div>
                              <div className="flex gap-1">
                                {template.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <CardDescription className="text-sm mt-1">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </Tabs>
              )}
              
              {/* 搜索结果 */}
              {searchQuery && (
                <ScrollArea className="flex-1 px-6">
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      找到 {displayTemplates.length} 个结果
                    </p>
                    <div className="grid gap-3">
                      {displayTemplates.map((template) => (
                        <Card
                          key={`${template.category}-${template.id}`}
                          className={`cursor-pointer transition-colors hover:bg-accent ${
                            selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{template.icon}</span>
                                <div>
                                  <CardTitle className="text-base">
                                    {template.name}
                                  </CardTitle>
                                  <Badge variant="secondary" className="mt-1">
                                    {template.categoryName}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {template.tags.slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <CardDescription className="text-sm mt-1">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* 右侧：预览区 */}
            <div className="w-1/3 flex flex-col">
              {selectedTemplate ? (
                <>
                  <div className="px-6 py-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {selectedTemplate.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 px-6 py-4">
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      <code>{selectedTemplate.code}</code>
                    </pre>
                  </ScrollArea>
                  
                  <div className="px-6 py-4 border-t flex gap-2">
                    <Button
                      onClick={() => handleApplyTemplate(selectedTemplate)}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      应用模板
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyTemplate(selectedTemplate)}
                          >
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>复制代码</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center px-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      选择一个模板查看预览
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default TemplateSelector;