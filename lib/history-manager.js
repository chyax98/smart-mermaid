/**
 * 历史记录管理服务
 * 提供自动保存、版本对比、一键恢复等功能
 */

import { useAppStore } from '@/stores/app-store';

/**
 * 历史记录项
 */
export class HistoryRecord {
  constructor(data) {
    this.id = data.id || `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = data.timestamp || Date.now();
    this.title = data.title || `版本 ${new Date().toLocaleString()}`;
    this.description = data.description || '';
    this.mermaidCode = data.mermaidCode || '';
    this.inputText = data.inputText || '';
    this.diagramType = data.diagramType || 'auto';
    this.renderMode = data.renderMode || 'excalidraw';
    this.metadata = data.metadata || {};
    this.tags = data.tags || [];
    this.version = data.version || '1.0.0';
    this.parentId = data.parentId || null; // 用于版本分支
    this.autoSaved = data.autoSaved || false;
  }

  /**
   * 转换为JSON
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      title: this.title,
      description: this.description,
      mermaidCode: this.mermaidCode,
      inputText: this.inputText,
      diagramType: this.diagramType,
      renderMode: this.renderMode,
      metadata: this.metadata,
      tags: this.tags,
      version: this.version,
      parentId: this.parentId,
      autoSaved: this.autoSaved
    };
  }

  /**
   * 从JSON创建
   */
  static fromJSON(json) {
    return new HistoryRecord(json);
  }

  /**
   * 获取格式化的时间
   */
  getFormattedTime() {
    return new Date(this.timestamp).toLocaleString('zh-CN');
  }

  /**
   * 获取简短标题
   */
  getShortTitle() {
    return this.title.length > 30 ? this.title.substring(0, 30) + '...' : this.title;
  }

  /**
   * 计算代码行数
   */
  getCodeLineCount() {
    return this.mermaidCode.split('\n').filter(line => line.trim()).length;
  }

  /**
   * 计算代码复杂度（简单指标）
   */
  getComplexity() {
    const lines = this.getCodeLineCount();
    const arrows = (this.mermaidCode.match(/-->/g) || []).length;
    const nodes = (this.mermaidCode.match(/\[.*?\]/g) || []).length;
    return lines + arrows + nodes;
  }
}

/**
 * 历史记录管理器
 */
export class HistoryManager {
  constructor() {
    this.storageKey = 'smart-mermaid-history';
    this.maxRecords = 100; // 最大记录数
    this.autoSaveInterval = 30000; // 30秒自动保存
    this.autoSaveTimer = null;
    this.records = new Map();
    this.loadFromStorage();
  }

  /**
   * 初始化自动保存
   */
  initAutoSave() {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      this.autoSave();
    }, this.autoSaveInterval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 自动保存当前状态
   */
  autoSave() {
    try {
      const store = useAppStore.getState();
      const { editor, ui } = store;
      
      // 只有在有内容时才自动保存
      if (!editor.mermaidCode && !editor.inputText) {
        return;
      }

      // 检查是否与最近的记录相同
      const lastRecord = this.getLatestRecord();
      if (lastRecord && 
          lastRecord.mermaidCode === editor.mermaidCode &&
          lastRecord.inputText === editor.inputText) {
        return; // 无变化，不保存
      }

      const record = new HistoryRecord({
        title: `自动保存 ${new Date().toLocaleTimeString()}`,
        mermaidCode: editor.mermaidCode,
        inputText: editor.inputText,
        diagramType: editor.diagramType,
        renderMode: ui.renderMode,
        autoSaved: true,
        metadata: {
          autoSave: true,
          editorState: {
            hasError: !!editor.error,
            codeLength: editor.mermaidCode.length,
            inputLength: editor.inputText.length
          }
        }
      });

      this.addRecord(record);
      console.log('自动保存完成:', record.title);

    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  /**
   * 手动保存
   */
  manualSave(title, description = '', tags = []) {
    try {
      const store = useAppStore.getState();
      const { editor, ui } = store;

      const record = new HistoryRecord({
        title: title || `手动保存 ${new Date().toLocaleString()}`,
        description,
        mermaidCode: editor.mermaidCode,
        inputText: editor.inputText,
        diagramType: editor.diagramType,
        renderMode: ui.renderMode,
        tags,
        autoSaved: false,
        metadata: {
          manual: true,
          saveTime: Date.now()
        }
      });

      this.addRecord(record);
      return record;

    } catch (error) {
      console.error('手动保存失败:', error);
      throw error;
    }
  }

  /**
   * 添加历史记录
   */
  addRecord(record) {
    this.records.set(record.id, record);
    
    // 限制记录数量
    if (this.records.size > this.maxRecords) {
      this.removeOldestRecord();
    }
    
    this.saveToStorage();
  }

  /**
   * 删除最旧的记录
   */
  removeOldestRecord() {
    let oldestId = null;
    let oldestTime = Date.now();
    
    for (const [id, record] of this.records.entries()) {
      if (record.timestamp < oldestTime) {
        oldestTime = record.timestamp;
        oldestId = id;
      }
    }
    
    if (oldestId) {
      this.records.delete(oldestId);
    }
  }

  /**
   * 获取所有记录
   */
  getAllRecords() {
    return Array.from(this.records.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取最新记录
   */
  getLatestRecord() {
    const records = this.getAllRecords();
    return records.length > 0 ? records[0] : null;
  }

  /**
   * 根据ID获取记录
   */
  getRecord(id) {
    return this.records.get(id);
  }

  /**
   * 删除记录
   */
  deleteRecord(id) {
    const deleted = this.records.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 恢复历史记录
   */
  restoreRecord(id) {
    const record = this.getRecord(id);
    if (!record) {
      throw new Error(`历史记录未找到: ${id}`);
    }

    try {
      const store = useAppStore.getState();
      
      // 更新状态
      store.setMermaidCode(record.mermaidCode);
      store.setInputText(record.inputText);
      store.setDiagramType(record.diagramType);
      store.setRenderMode(record.renderMode);
      
      // 创建恢复记录
      const restoreRecord = new HistoryRecord({
        title: `恢复到: ${record.title}`,
        description: `从 ${record.getFormattedTime()} 的版本恢复`,
        mermaidCode: record.mermaidCode,
        inputText: record.inputText,
        diagramType: record.diagramType,
        renderMode: record.renderMode,
        parentId: record.id,
        metadata: {
          restored: true,
          originalId: record.id,
          originalTime: record.timestamp
        }
      });
      
      this.addRecord(restoreRecord);
      return restoreRecord;

    } catch (error) {
      console.error('恢复历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 搜索记录
   */
  searchRecords(query, filters = {}) {
    const records = this.getAllRecords();
    const normalizedQuery = query.toLowerCase();
    
    return records.filter(record => {
      // 文本搜索
      const matchesQuery = !query || 
        record.title.toLowerCase().includes(normalizedQuery) ||
        record.description.toLowerCase().includes(normalizedQuery) ||
        record.mermaidCode.toLowerCase().includes(normalizedQuery) ||
        record.inputText.toLowerCase().includes(normalizedQuery);
      
      // 过滤器
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        switch (key) {
          case 'autoSaved':
            return record.autoSaved === value;
          case 'diagramType':
            return !value || record.diagramType === value;
          case 'renderMode':
            return !value || record.renderMode === value;
          case 'dateRange':
            if (value.start && record.timestamp < new Date(value.start).getTime()) return false;
            if (value.end && record.timestamp > new Date(value.end).getTime()) return false;
            return true;
          case 'tags':
            return !value.length || value.some(tag => record.tags.includes(tag));
          default:
            return true;
        }
      });
      
      return matchesQuery && matchesFilters;
    });
  }

  /**
   * 对比两个记录
   */
  compareRecords(id1, id2) {
    const record1 = this.getRecord(id1);
    const record2 = this.getRecord(id2);
    
    if (!record1 || !record2) {
      throw new Error('记录未找到');
    }
    
    return {
      record1,
      record2,
      differences: {
        title: record1.title !== record2.title,
        mermaidCode: record1.mermaidCode !== record2.mermaidCode,
        inputText: record1.inputText !== record2.inputText,
        diagramType: record1.diagramType !== record2.diagramType,
        renderMode: record1.renderMode !== record2.renderMode,
        timeDiff: Math.abs(record1.timestamp - record2.timestamp),
        sizeDiff: {
          code: record1.mermaidCode.length - record2.mermaidCode.length,
          input: record1.inputText.length - record2.inputText.length
        }
      }
    };
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const records = this.getAllRecords();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    
    return {
      total: records.length,
      autoSaved: records.filter(r => r.autoSaved).length,
      manual: records.filter(r => !r.autoSaved).length,
      today: records.filter(r => now - r.timestamp < oneDay).length,
      thisWeek: records.filter(r => now - r.timestamp < oneWeek).length,
      thisMonth: records.filter(r => now - r.timestamp < oneMonth).length,
      averageComplexity: records.length > 0 
        ? Math.round(records.reduce((sum, r) => sum + r.getComplexity(), 0) / records.length)
        : 0,
      totalCodeLines: records.reduce((sum, r) => sum + r.getCodeLineCount(), 0),
      mostUsedTypes: this.getMostUsedDiagramTypes(records),
      oldestRecord: records.length > 0 ? records[records.length - 1] : null,
      newestRecord: records.length > 0 ? records[0] : null
    };
  }

  /**
   * 获取最常用的图表类型
   */
  getMostUsedDiagramTypes(records) {
    const types = {};
    records.forEach(record => {
      types[record.diagramType] = (types[record.diagramType] || 0) + 1;
    });
    
    return Object.entries(types)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * 导出历史记录
   */
  exportHistory(format = 'json') {
    const records = this.getAllRecords();
    const data = {
      exportTime: Date.now(),
      version: '1.0.0',
      total: records.length,
      records: records.map(r => r.toJSON())
    };
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.exportToCSV(records);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 导出为CSV格式
   */
  exportToCSV(records) {
    const headers = ['ID', '标题', '时间', '类型', '渲染模式', '代码行数', '是否自动保存'];
    const rows = records.map(record => [
      record.id,
      record.title,
      record.getFormattedTime(),
      record.diagramType,
      record.renderMode,
      record.getCodeLineCount(),
      record.autoSaved ? '是' : '否'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * 导入历史记录
   */
  importHistory(data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!parsed.records || !Array.isArray(parsed.records)) {
        throw new Error('无效的历史记录格式');
      }
      
      let imported = 0;
      let skipped = 0;
      
      parsed.records.forEach(recordData => {
        try {
          const record = HistoryRecord.fromJSON(recordData);
          
          // 检查是否已存在
          if (!this.records.has(record.id)) {
            this.records.set(record.id, record);
            imported++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.warn('跳过无效记录:', recordData, error);
          skipped++;
        }
      });
      
      this.saveToStorage();
      
      return { imported, skipped, total: parsed.records.length };
      
    } catch (error) {
      console.error('导入历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 清理历史记录
   */
  cleanup(options = {}) {
    const {
      olderThan = 30 * 24 * 60 * 60 * 1000, // 30天
      keepAutoSaved = false,
      keepManual = true,
      maxRecords = this.maxRecords
    } = options;
    
    const now = Date.now();
    const records = this.getAllRecords();
    let removed = 0;
    
    for (const record of records) {
      const shouldRemove = 
        (now - record.timestamp > olderThan) ||
        (records.length - removed > maxRecords) ||
        (!keepAutoSaved && record.autoSaved) ||
        (!keepManual && !record.autoSaved);
      
      if (shouldRemove) {
        this.records.delete(record.id);
        removed++;
      }
    }
    
    if (removed > 0) {
      this.saveToStorage();
    }
    
    return { removed, remaining: this.records.size };
  }

  /**
   * 保存到本地存储
   */
  saveToStorage() {
    try {
      // SSR安全检查
      if (typeof window === 'undefined') return;
      
      const data = {
        version: '1.0.0',
        timestamp: Date.now(),
        records: Array.from(this.records.values()).map(r => r.toJSON())
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage() {
    try {
      // SSR安全检查
      if (typeof window === 'undefined') return;
      
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      
      const data = JSON.parse(stored);
      if (!data.records) return;
      
      this.records.clear();
      data.records.forEach(recordData => {
        try {
          const record = HistoryRecord.fromJSON(recordData);
          this.records.set(record.id, record);
        } catch (error) {
          console.warn('跳过无效的历史记录:', recordData);
        }
      });
      
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }
}

// 创建默认历史管理器实例
export const defaultHistoryManager = new HistoryManager();

// 兼容性导出（主要用于 app/page.js 导入）
export const historyManagerService = defaultHistoryManager;

// 便捷函数
export const historyManager = {
  save: (title, description, tags) => defaultHistoryManager.manualSave(title, description, tags),
  restore: (id) => defaultHistoryManager.restoreRecord(id),
  delete: (id) => defaultHistoryManager.deleteRecord(id),
  getAll: () => defaultHistoryManager.getAllRecords(),
  getById: (id) => defaultHistoryManager.getRecord(id),
  search: (query, filters) => defaultHistoryManager.searchRecords(query, filters),
  compare: (id1, id2) => defaultHistoryManager.compareRecords(id1, id2),
  getStats: () => defaultHistoryManager.getStatistics(),
  export: (format) => defaultHistoryManager.exportHistory(format),
  import: (data) => defaultHistoryManager.importHistory(data),
  cleanup: (options) => defaultHistoryManager.cleanup(options),
  initAutoSave: () => defaultHistoryManager.initAutoSave(),
  stopAutoSave: () => defaultHistoryManager.stopAutoSave()
};