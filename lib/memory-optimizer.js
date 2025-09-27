/**
 * 内存优化工具模块
 * 用于监控和限制应用内存使用
 */

// 内存使用限制配置
export const MEMORY_LIMITS = {
  MAX_HISTORY_SIZE: 20,          // 减少历史记录大小从50到20
  MAX_MERMAID_CODE_SIZE: 100000, // 限制Mermaid代码最大100KB
  MAX_INPUT_TEXT_SIZE: 50000,    // 限制输入文本最大50KB
  CLEANUP_INTERVAL: 60000,       // 每分钟清理一次
  MAX_RENDER_CACHE: 5,           // 最多缓存5个渲染结果
};

/**
 * 内存使用监控器
 */
class MemoryMonitor {
  constructor() {
    this.isSupported = typeof performance !== 'undefined' && 
                       typeof performance.memory !== 'undefined';
    this.lastCleanup = Date.now();
    this.renderCache = new Map();
  }

  /**
   * 获取当前内存使用情况
   */
  getMemoryUsage() {
    if (!this.isSupported) {
      return null;
    }

    const memory = performance.memory;
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }

  /**
   * 检查是否需要触发内存清理
   */
  shouldCleanup() {
    const usage = this.getMemoryUsage();
    if (!usage) return false;

    // 如果内存使用超过70%，触发清理
    if (usage.percentage > 70) {
      return true;
    }

    // 定期清理
    const now = Date.now();
    if (now - this.lastCleanup > MEMORY_LIMITS.CLEANUP_INTERVAL) {
      this.lastCleanup = now;
      return true;
    }

    return false;
  }

  /**
   * 清理渲染缓存
   */
  cleanupRenderCache() {
    if (this.renderCache.size > MEMORY_LIMITS.MAX_RENDER_CACHE) {
      // 删除最旧的缓存项
      const entriesToDelete = this.renderCache.size - MEMORY_LIMITS.MAX_RENDER_CACHE;
      const keys = Array.from(this.renderCache.keys());
      for (let i = 0; i < entriesToDelete; i++) {
        this.renderCache.delete(keys[i]);
      }
    }
  }

  /**
   * 缓存渲染结果
   */
  cacheRender(key, value) {
    // 先清理旧缓存
    this.cleanupRenderCache();
    this.renderCache.set(key, value);
  }

  /**
   * 获取缓存的渲染结果
   */
  getCachedRender(key) {
    return this.renderCache.get(key);
  }

  /**
   * 手动触发垃圾回收（如果可用）
   */
  forceGC() {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }
}

// 创建单例实例
export const memoryMonitor = new MemoryMonitor();

/**
 * 文本大小限制器
 */
export function limitTextSize(text, maxSize = MEMORY_LIMITS.MAX_INPUT_TEXT_SIZE) {
  if (!text) return text;
  
  if (text.length > maxSize) {
    console.warn(`Text size (${text.length}) exceeds limit (${maxSize}), truncating...`);
    return text.substring(0, maxSize);
  }
  
  return text;
}

/**
 * 历史记录清理器
 */
export function cleanupHistory(records, maxSize = MEMORY_LIMITS.MAX_HISTORY_SIZE) {
  if (records.length <= maxSize) {
    return records;
  }
  
  // 保留最新的记录
  return records.slice(-maxSize);
}

/**
 * Mermaid DOM清理器
 */
export function cleanupMermaidDOM() {
  // 清理所有游离的mermaid元素
  const strayElements = document.querySelectorAll('[id^="dmermaid-"], [id^="mermaid-"]');
  let cleaned = 0;
  
  strayElements.forEach(element => {
    // 检查元素是否在任何容器中
    const isInContainer = element.closest('[data-mermaid-container]');
    if (!isInContainer && element.parentNode) {
      element.parentNode.removeChild(element);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} stray Mermaid elements`);
  }
  
  // 清理SVG定义
  const svgDefs = document.querySelectorAll('body > svg[aria-hidden="true"]');
  svgDefs.forEach(svg => {
    if (svg.parentNode) {
      svg.parentNode.removeChild(svg);
    }
  });
}

/**
 * 内存优化Hook
 */
export function useMemoryOptimization() {
  if (typeof window === 'undefined') {
    return { shouldCleanup: false, memoryUsage: null };
  }

  const shouldCleanup = memoryMonitor.shouldCleanup();
  const memoryUsage = memoryMonitor.getMemoryUsage();

  if (shouldCleanup) {
    // 触发清理
    cleanupMermaidDOM();
    memoryMonitor.forceGC();
  }

  return { shouldCleanup, memoryUsage };
}

/**
 * 防抖函数（优化频繁调用）
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数（限制调用频率）
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}