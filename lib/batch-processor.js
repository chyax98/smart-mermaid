/**
 * 批处理服务
 * 支持多文件批量处理、批量导出、批量模板应用
 */

import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { exportDiagram } from '@/lib/export-utils';
import { templates } from '@/lib/templates';

/**
 * 批处理任务状态
 */
export const BATCH_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * 批处理任务类型
 */
export const BATCH_TYPES = {
  CONVERT: 'convert',        // 文本转Mermaid
  EXPORT: 'export',          // 批量导出
  TEMPLATE: 'template',      // 批量应用模板
  VALIDATION: 'validation'   // 批量验证
};

/**
 * 批处理任务项
 */
class BatchTask {
  constructor(id, type, data, options = {}) {
    this.id = id;
    this.type = type;
    this.data = data;
    this.options = options;
    this.status = BATCH_STATUS.PENDING;
    this.result = null;
    this.error = null;
    this.progress = 0;
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.status = BATCH_STATUS.PROCESSING;
    this.startTime = Date.now();
  }

  complete(result) {
    this.status = BATCH_STATUS.COMPLETED;
    this.result = result;
    this.progress = 100;
    this.endTime = Date.now();
  }

  fail(error) {
    this.status = BATCH_STATUS.FAILED;
    this.error = error;
    this.endTime = Date.now();
  }

  cancel() {
    this.status = BATCH_STATUS.CANCELLED;
    this.endTime = Date.now();
  }
}

/**
 * 批处理服务类
 */
export class BatchProcessor {
  constructor() {
    this.tasks = new Map();
    this.activeJobs = new Map();
    this.maxConcurrent = 3; // 最大并发任务数
    this.abortControllers = new Map();
  }

  /**
   * 添加批处理任务
   */
  addTask(type, data, options = {}) {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = new BatchTask(id, type, data, options);
    this.tasks.set(id, task);
    return id;
  }

  /**
   * 批量文本转换为Mermaid
   */
  async batchConvert(textItems, options = {}) {
    const taskId = this.addTask(BATCH_TYPES.CONVERT, textItems, options);
    const task = this.tasks.get(taskId);
    
    try {
      task.start();
      const results = [];
      const total = textItems.length;

      for (let i = 0; i < textItems.length; i++) {
        if (task.status === BATCH_STATUS.CANCELLED) break;

        const item = textItems[i];
        try {
          // 调用AI服务进行转换
          const response = await fetch('/api/generate-mermaid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputText: item.text,
              diagramType: item.type || 'auto',
              model: options.model || 'gpt-4',
              streaming: false
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          results.push({
            id: item.id,
            input: item.text,
            output: data.mermaidCode,
            success: true
          });

        } catch (error) {
          results.push({
            id: item.id,
            input: item.text,
            error: error.message,
            success: false
          });
        }

        // 更新进度
        task.progress = Math.round(((i + 1) / total) * 100);
      }

      task.complete(results);
      return results;

    } catch (error) {
      task.fail(error.message);
      throw error;
    }
  }

  /**
   * 批量导出
   */
  async batchExport(diagrams, formats, options = {}) {
    const taskId = this.addTask(BATCH_TYPES.EXPORT, diagrams, { formats, ...options });
    const task = this.tasks.get(taskId);

    try {
      task.start();
      const results = [];
      const total = diagrams.length;

      for (let i = 0; i < diagrams.length; i++) {
        if (task.status === BATCH_STATUS.CANCELLED) break;

        const diagram = diagrams[i];
        try {
          // 创建临时渲染元素
          const tempElement = await this.createTempElement(diagram.code);
          
          const exportResults = {};
          const exportErrors = {};

          // 导出每种格式
          for (const format of formats) {
            try {
              const result = await this.exportSingleFormat(tempElement, format, {
                filename: `${diagram.name || 'diagram'}-${i + 1}`,
                ...options
              });
              exportResults[format] = result;
            } catch (error) {
              exportErrors[format] = error.message;
            }
          }

          // 清理临时元素
          this.cleanupTempElement(tempElement);

          results.push({
            id: diagram.id,
            name: diagram.name,
            results: exportResults,
            errors: exportErrors,
            success: Object.keys(exportResults).length > 0
          });

        } catch (error) {
          results.push({
            id: diagram.id,
            name: diagram.name,
            error: error.message,
            success: false
          });
        }

        // 更新进度
        task.progress = Math.round(((i + 1) / total) * 100);
      }

      task.complete(results);
      return results;

    } catch (error) {
      task.fail(error.message);
      throw error;
    }
  }

  /**
   * 批量应用模板
   */
  async batchApplyTemplate(templateId, parameters, options = {}) {
    const taskId = this.addTask(BATCH_TYPES.TEMPLATE, { templateId, parameters }, options);
    const task = this.tasks.get(taskId);

    try {
      task.start();
      
      // 查找模板
      const template = this.findTemplate(templateId);
      if (!template) {
        throw new Error(`模板未找到: ${templateId}`);
      }

      const results = [];
      const total = parameters.length;

      for (let i = 0; i < parameters.length; i++) {
        if (task.status === BATCH_STATUS.CANCELLED) break;

        const params = parameters[i];
        try {
          // 应用模板参数
          const code = this.applyTemplateParameters(template.code, params);
          
          results.push({
            id: params.id,
            name: params.name || `图表-${i + 1}`,
            code: code,
            template: templateId,
            success: true
          });

        } catch (error) {
          results.push({
            id: params.id,
            error: error.message,
            success: false
          });
        }

        // 更新进度
        task.progress = Math.round(((i + 1) / total) * 100);
      }

      task.complete(results);
      return results;

    } catch (error) {
      task.fail(error.message);
      throw error;
    }
  }

  /**
   * 批量验证Mermaid代码
   */
  async batchValidate(codes, options = {}) {
    const taskId = this.addTask(BATCH_TYPES.VALIDATION, codes, options);
    const task = this.tasks.get(taskId);

    try {
      task.start();
      const results = [];
      const total = codes.length;

      // 动态导入mermaid（如果在浏览器环境中）
      const mermaid = typeof window !== 'undefined' 
        ? (await import('mermaid')).default 
        : null;

      for (let i = 0; i < codes.length; i++) {
        if (task.status === BATCH_STATUS.CANCELLED) break;

        const item = codes[i];
        try {
          if (mermaid) {
            // 验证语法
            await mermaid.parse(item.code);
          }
          
          results.push({
            id: item.id,
            code: item.code,
            valid: true,
            success: true
          });

        } catch (error) {
          results.push({
            id: item.id,
            code: item.code,
            valid: false,
            error: error.message,
            success: true // 验证完成，即使结果是无效
          });
        }

        // 更新进度
        task.progress = Math.round(((i + 1) / total) * 100);
      }

      task.complete(results);
      return results;

    } catch (error) {
      task.fail(error.message);
      throw error;
    }
  }

  /**
   * 取消批处理任务
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.status === BATCH_STATUS.PROCESSING) {
      task.cancel();
      
      // 取消相关的网络请求
      const abortController = this.abortControllers.get(taskId);
      if (abortController) {
        abortController.abort();
        this.abortControllers.delete(taskId);
      }
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * 清理已完成的任务
   */
  clearCompletedTasks() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === BATCH_STATUS.COMPLETED || 
          task.status === BATCH_STATUS.FAILED ||
          task.status === BATCH_STATUS.CANCELLED) {
        this.tasks.delete(id);
      }
    }
  }

  // 私有辅助方法

  /**
   * 查找模板
   */
  findTemplate(templateId) {
    for (const category of Object.values(templates)) {
      const template = category.find(t => t.id === templateId);
      if (template) return template;
    }
    return null;
  }

  /**
   * 应用模板参数
   */
  applyTemplateParameters(templateCode, parameters) {
    let code = templateCode;
    
    // 简单的参数替换
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`;
      code = code.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return code;
  }

  /**
   * 创建临时渲染元素
   */
  async createTempElement(mermaidCode) {
    if (typeof window === 'undefined') {
      throw new Error('导出功能需要浏览器环境');
    }

    // 创建临时容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.background = 'white';
    container.style.padding = '20px';
    
    document.body.appendChild(container);

    // 动态导入并渲染mermaid
    const mermaid = (await import('mermaid')).default;
    
    // 初始化mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    // 生成唯一ID
    const id = `temp-mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 渲染图表
    const { svg } = await mermaid.render(id, mermaidCode);
    container.innerHTML = svg;

    return container;
  }

  /**
   * 清理临时元素
   */
  cleanupTempElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * 导出单一格式
   */
  async exportSingleFormat(element, format, options = {}) {
    switch (format.toLowerCase()) {
      case 'png':
        return await exportDiagram.toPNG(element, options);
      case 'jpeg':
        return await exportDiagram.toJPEG(element, options);
      case 'svg':
        return await exportDiagram.toSVG(element, options);
      case 'pdf':
        return await exportDiagram.toPDF(element, options);
      case 'webp':
        return await exportDiagram.toWebP(element, options);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }
}

// 创建默认批处理器实例
export const defaultBatchProcessor = new BatchProcessor();

// 便捷函数
export const batchProcess = {
  convert: (textItems, options) => defaultBatchProcessor.batchConvert(textItems, options),
  export: (diagrams, formats, options) => defaultBatchProcessor.batchExport(diagrams, formats, options),
  applyTemplate: (templateId, parameters, options) => defaultBatchProcessor.batchApplyTemplate(templateId, parameters, options),
  validate: (codes, options) => defaultBatchProcessor.batchValidate(codes, options),
  cancel: (taskId) => defaultBatchProcessor.cancelTask(taskId),
  getStatus: (taskId) => defaultBatchProcessor.getTaskStatus(taskId),
  getAllTasks: () => defaultBatchProcessor.getAllTasks(),
  clearCompleted: () => defaultBatchProcessor.clearCompletedTasks()
};