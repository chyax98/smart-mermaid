/**
 * 增强的导出工具库
 * 支持多种格式导出：PNG、JPEG、SVG、PDF、WebP
 * 提供高质量导出配置和自定义选项
 * 支持服务端渲染（SSR）环境
 */

// 导出格式常量
export const EXPORT_FORMATS = {
  PNG: 'png',
  JPEG: 'jpeg',
  SVG: 'svg',
  PDF: 'pdf',
  WEBP: 'webp'
};

// 默认导出配置
export const DEFAULT_EXPORT_CONFIG = {
  quality: 1,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  width: 1920,
  height: 1080,
  cacheBust: true,
  style: {
    transform: 'scale(1)',
    transformOrigin: 'top left'
  }
};

// PDF 导出配置
export const PDF_CONFIG = {
  margin: 1,
  filename: 'mermaid-diagram.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { 
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  },
  jsPDF: { 
    unit: 'in', 
    format: 'letter', 
    orientation: 'portrait' 
  }
};

// 检查是否在浏览器环境中
const isBrowser = () => typeof window !== 'undefined';

// 延迟加载导出库
async function loadExportLibraries() {
  if (!isBrowser()) {
    throw new Error('导出功能仅在浏览器环境中可用');
  }

  const [htmlToImageModule, html2pdfModule] = await Promise.all([
    import('html-to-image'),
    import('html2pdf.js')
  ]);

  return {
    htmlToImage: htmlToImageModule,
    html2pdf: html2pdfModule.default
  };
}

/**
 * 导出工具类
 */
export class DiagramExporter {
  constructor(options = {}) {
    this.config = { ...DEFAULT_EXPORT_CONFIG, ...options };
    this.libraries = null;
  }

  /**
   * 确保导出库已加载
   */
  async ensureLibrariesLoaded() {
    if (!this.libraries) {
      this.libraries = await loadExportLibraries();
    }
    return this.libraries;
  }

  /**
   * 获取元素的实际尺寸
   */
  getElementDimensions(element) {
    if (!isBrowser()) {
      return { width: 800, height: 600, actualWidth: 800, actualHeight: 600 };
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return {
      width: rect.width,
      height: rect.height,
      actualWidth: parseInt(style.width) || rect.width,
      actualHeight: parseInt(style.height) || rect.height
    };
  }

  /**
   * 准备导出元素
   */
  prepareElement(element, config = {}) {
    const dimensions = this.getElementDimensions(element);
    const exportConfig = { ...this.config, ...config };
    
    // 计算最佳尺寸
    const aspectRatio = dimensions.width / dimensions.height;
    let { width, height } = exportConfig;
    
    if (width && !height) {
      height = width / aspectRatio;
    } else if (height && !width) {
      width = height * aspectRatio;
    } else if (!width && !height) {
      width = Math.max(dimensions.width, 800);
      height = Math.max(dimensions.height, 600);
    }

    return {
      ...exportConfig,
      width: Math.round(width),
      height: Math.round(height),
      pixelRatio: exportConfig.pixelRatio || 2
    };
  }

  /**
   * 导出为 PNG 格式
   */
  async exportToPNG(element, config = {}) {
    try {
      const { htmlToImage } = await this.ensureLibrariesLoaded();
      const exportConfig = this.prepareElement(element, config);
      
      const dataUrl = await htmlToImage.toPng(element, {
        quality: exportConfig.quality,
        pixelRatio: exportConfig.pixelRatio,
        backgroundColor: exportConfig.backgroundColor,
        width: exportConfig.width,
        height: exportConfig.height,
        cacheBust: exportConfig.cacheBust,
        style: exportConfig.style,
        filter: (node) => {
          // 过滤掉不需要的元素
          if (node.tagName === 'BUTTON') return false;
          if (node.classList?.contains('export-ignore')) return false;
          return true;
        }
      });

      return this.downloadDataUrl(dataUrl, 'mermaid-diagram.png');
    } catch (error) {
      console.error('PNG导出失败:', error);
      throw new Error(`PNG导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为 JPEG 格式
   */
  async exportToJPEG(element, config = {}) {
    try {
      const { htmlToImage } = await this.ensureLibrariesLoaded();
      const exportConfig = this.prepareElement(element, {
        backgroundColor: '#ffffff', // JPEG需要背景色
        quality: 0.95,
        ...config
      });

      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: exportConfig.quality,
        pixelRatio: exportConfig.pixelRatio,
        backgroundColor: exportConfig.backgroundColor,
        width: exportConfig.width,
        height: exportConfig.height,
        cacheBust: exportConfig.cacheBust,
        style: exportConfig.style,
        filter: (node) => {
          if (node.tagName === 'BUTTON') return false;
          if (node.classList?.contains('export-ignore')) return false;
          return true;
        }
      });

      return this.downloadDataUrl(dataUrl, 'mermaid-diagram.jpg');
    } catch (error) {
      console.error('JPEG导出失败:', error);
      throw new Error(`JPEG导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为 SVG 格式（矢量图）
   */
  async exportToSVG(element, config = {}) {
    try {
      const { htmlToImage } = await this.ensureLibrariesLoaded();
      const exportConfig = this.prepareElement(element, config);

      const dataUrl = await htmlToImage.toSvg(element, {
        backgroundColor: exportConfig.backgroundColor,
        width: exportConfig.width,
        height: exportConfig.height,
        cacheBust: exportConfig.cacheBust,
        style: exportConfig.style,
        filter: (node) => {
          if (node.tagName === 'BUTTON') return false;
          if (node.classList?.contains('export-ignore')) return false;
          return true;
        }
      });

      return this.downloadDataUrl(dataUrl, 'mermaid-diagram.svg');
    } catch (error) {
      console.error('SVG导出失败:', error);
      throw new Error(`SVG导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为 WebP 格式
   */
  async exportToWebP(element, config = {}) {
    try {
      const { htmlToImage } = await this.ensureLibrariesLoaded();
      
      // 先生成 Canvas
      const canvas = await htmlToImage.toCanvas(element, {
        quality: config.quality || 0.95,
        pixelRatio: config.pixelRatio || 2,
        backgroundColor: config.backgroundColor || this.config.backgroundColor,
        width: config.width,
        height: config.height,
        cacheBust: config.cacheBust !== false,
        style: config.style || this.config.style,
        filter: (node) => {
          if (node.tagName === 'BUTTON') return false;
          if (node.classList?.contains('export-ignore')) return false;
          return true;
        }
      });

      // 转换为 WebP
      const dataUrl = canvas.toDataURL('image/webp', config.quality || 0.95);
      return this.downloadDataUrl(dataUrl, 'mermaid-diagram.webp');
    } catch (error) {
      console.error('WebP导出失败:', error);
      throw new Error(`WebP导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为 PDF 格式
   */
  async exportToPDF(element, config = {}) {
    try {
      const { html2pdf } = await this.ensureLibrariesLoaded();
      const pdfConfig = { ...PDF_CONFIG, ...config };
      
      // 创建 PDF 实例
      const pdf = html2pdf()
        .from(element)
        .set(pdfConfig);

      // 生成并下载 PDF
      return pdf.save();
    } catch (error) {
      console.error('PDF导出失败:', error);
      throw new Error(`PDF导出失败: ${error.message}`);
    }
  }

  /**
   * 导出为 Blob 对象（用于上传或进一步处理）
   */
  async exportToBlob(element, format, config = {}) {
    try {
      const { htmlToImage } = await this.ensureLibrariesLoaded();
      const exportConfig = this.prepareElement(element, config);
      let blob;

      switch (format.toLowerCase()) {
        case EXPORT_FORMATS.PNG:
          blob = await htmlToImage.toBlob(element, {
            quality: exportConfig.quality,
            pixelRatio: exportConfig.pixelRatio,
            backgroundColor: exportConfig.backgroundColor,
            width: exportConfig.width,
            height: exportConfig.height,
            cacheBust: exportConfig.cacheBust,
            style: exportConfig.style
          });
          break;

        case EXPORT_FORMATS.JPEG:
          blob = await htmlToImage.toBlob(element, {
            quality: exportConfig.quality,
            pixelRatio: exportConfig.pixelRatio,
            backgroundColor: exportConfig.backgroundColor || '#ffffff',
            width: exportConfig.width,
            height: exportConfig.height,
            cacheBust: exportConfig.cacheBust,
            style: exportConfig.style,
            type: 'image/jpeg'
          });
          break;

        case EXPORT_FORMATS.WEBP:
          const canvas = await htmlToImage.toCanvas(element, {
            quality: exportConfig.quality,
            pixelRatio: exportConfig.pixelRatio,
            backgroundColor: exportConfig.backgroundColor,
            width: exportConfig.width,
            height: exportConfig.height
          });
          
          return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/webp', exportConfig.quality);
          });

        default:
          throw new Error(`不支持的格式: ${format}`);
      }

      return blob;
    } catch (error) {
      console.error('Blob导出失败:', error);
      throw new Error(`Blob导出失败: ${error.message}`);
    }
  }

  /**
   * 批量导出多种格式
   */
  async exportMultipleFormats(element, formats = [], config = {}) {
    const results = {};
    const errors = {};

    for (const format of formats) {
      try {
        switch (format.toLowerCase()) {
          case EXPORT_FORMATS.PNG:
            results[format] = await this.exportToPNG(element, config);
            break;
          case EXPORT_FORMATS.JPEG:
            results[format] = await this.exportToJPEG(element, config);
            break;
          case EXPORT_FORMATS.SVG:
            results[format] = await this.exportToSVG(element, config);
            break;
          case EXPORT_FORMATS.PDF:
            results[format] = await this.exportToPDF(element, config);
            break;
          case EXPORT_FORMATS.WEBP:
            results[format] = await this.exportToWebP(element, config);
            break;
          default:
            errors[format] = `不支持的格式: ${format}`;
        }
      } catch (error) {
        errors[format] = error.message;
      }
    }

    return { results, errors };
  }

  /**
   * 下载 Data URL
   */
  downloadDataUrl(dataUrl, filename) {
    if (!isBrowser()) {
      throw new Error('下载功能仅在浏览器环境中可用');
    }

    try {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, filename };
    } catch (error) {
      console.error('下载失败:', error);
      throw new Error(`下载失败: ${error.message}`);
    }
  }

  /**
   * 获取支持的导出格式
   */
  static getSupportedFormats() {
    return Object.values(EXPORT_FORMATS);
  }

  /**
   * 检查浏览器支持
   */
  static checkBrowserSupport() {
    if (!isBrowser()) {
      return { 
        canvas: false, 
        webp: false, 
        pdf: false,
        error: '需要浏览器环境' 
      };
    }

    const support = {
      canvas: !!document.createElement('canvas').getContext,
      webp: false,
      pdf: true // html2pdf.js 总是支持
    };

    // 检查 WebP 支持
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    support.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    return support;
  }
}

/**
 * 预设导出配置
 */
export const EXPORT_PRESETS = {
  // 高质量导出（适合打印）
  HIGH_QUALITY: {
    quality: 1,
    pixelRatio: 3,
    backgroundColor: '#ffffff'
  },
  
  // 标准质量（适合网络分享）
  STANDARD: {
    quality: 0.9,
    pixelRatio: 2,
    backgroundColor: '#ffffff'
  },
  
  // 压缩模式（文件大小优先）
  COMPRESSED: {
    quality: 0.7,
    pixelRatio: 1,
    backgroundColor: '#ffffff'
  },
  
  // 透明背景（PNG 专用）
  TRANSPARENT: {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: null
  },
  
  // 4K 高清
  UHD_4K: {
    quality: 1,
    pixelRatio: 2,
    width: 3840,
    height: 2160,
    backgroundColor: '#ffffff'
  },
  
  // 社交媒体分享
  SOCIAL_MEDIA: {
    quality: 0.9,
    pixelRatio: 2,
    width: 1200,
    height: 630,
    backgroundColor: '#ffffff'
  }
};

// 创建默认导出器实例
export const defaultExporter = new DiagramExporter();

// 便捷函数
export const exportDiagram = {
  toPNG: (element, config) => defaultExporter.exportToPNG(element, config),
  toJPEG: (element, config) => defaultExporter.exportToJPEG(element, config),
  toSVG: (element, config) => defaultExporter.exportToSVG(element, config),
  toPDF: (element, config) => defaultExporter.exportToPDF(element, config),
  toWebP: (element, config) => defaultExporter.exportToWebP(element, config),
  toBlob: (element, format, config) => defaultExporter.exportToBlob(element, format, config),
  multiple: (element, formats, config) => defaultExporter.exportMultipleFormats(element, formats, config)
};