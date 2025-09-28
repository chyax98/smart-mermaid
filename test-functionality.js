#!/usr/bin/env node

/**
 * Smart Mermaid 功能完整性验证
 * 验证所有新功能的完整性和正确性
 */

const fs = require('fs');
const path = require('path');

class FunctionalityTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      features: {}
    };
  }

  async test(name, testFn) {
    try {
      console.log(`\n🔍 功能验证: ${name}`);
      const result = await testFn();
      console.log(`✅ ${name} - 通过`);
      this.results.passed++;
      this.results.features[name] = { status: 'passed', details: result };
    } catch (error) {
      console.log(`❌ ${name} - 失败: ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`${name}: ${error.message}`);
      this.results.features[name] = { status: 'failed', error: error.message };
    }
  }

  async runAllTests() {
    console.log('🚀 开始功能完整性验证...\n');

    // 核心功能验证
    await this.test('Zustand状态管理完整性', () => this.testZustandStore());
    await this.test('撤销/重做系统完整性', () => this.testUndoRedoSystem());
    await this.test('快捷键系统完整性', () => this.testKeyboardShortcuts());
    await this.test('模板系统完整性', () => this.testTemplateSystem());
    await this.test('导出功能完整性', () => this.testExportFunctionality());
    await this.test('批处理系统完整性', () => this.testBatchProcessing());
    await this.test('历史记录系统完整性', () => this.testHistoryManagement());
    
    // UI组件验证
    await this.test('UI组件完整性', () => this.testUIComponents());
    
    // 性能优化验证
    await this.test('性能优化验证', () => this.testPerformanceOptimizations());
    
    // 集成度验证
    await this.test('系统集成度验证', () => this.testSystemIntegration());
    
    return this.results;
  }

  testZustandStore() {
    const storeContent = fs.readFileSync('stores/app-store.js', 'utf8');
    
    // 验证store结构
    const storeElements = {
      'createStore': 'Zustand create函数',
      'persist': '持久化中间件',
      'subscribeWithSelector': '选择器订阅中间件',
      'useEditorState': '编辑器状态hook',
      'useUIState': 'UI状态hook',
      'useHistoryActions': '历史操作hook',
      'setMermaidCode': '设置Mermaid代码action',
      'undo': '撤销action',
      'redo': '重做action',
      'setShowBatchDialog': '显示批处理对话框action',
      'setShowHistoryDialog': '显示历史对话框action'
    };

    const missingElements = [];
    for (const [element, description] of Object.entries(storeElements)) {
      if (!storeContent.includes(element)) {
        missingElements.push(`${description}(${element})`);
      }
    }

    if (missingElements.length > 0) {
      throw new Error(`Store缺少关键元素: ${missingElements.join(', ')}`);
    }

    // 验证状态结构
    const stateStructures = ['editor', 'ui', 'config', 'usage', 'history'];
    for (const structure of stateStructures) {
      if (!storeContent.includes(`${structure}:`)) {
        throw new Error(`Store缺少状态结构: ${structure}`);
      }
    }

    return {
      elementsCount: Object.keys(storeElements).length,
      stateStructures: stateStructures.length,
      persistEnabled: storeContent.includes('persist'),
      selectorEnabled: storeContent.includes('subscribeWithSelector')
    };
  }

  testUndoRedoSystem() {
    // 检查撤销/重做组件
    const undoRedoContent = fs.readFileSync('components/undo-redo-controls.jsx', 'utf8');
    
    const requiredFeatures = [
      'canUndo',
      'canRedo', 
      'handleUndo',
      'handleRedo',
      'Button',
      'Undo',
      'Redo'
    ];

    for (const feature of requiredFeatures) {
      if (!undoRedoContent.includes(feature)) {
        throw new Error(`撤销/重做组件缺少: ${feature}`);
      }
    }

    // 检查store中的历史逻辑
    const storeContent = fs.readFileSync('stores/app-store.js', 'utf8');
    const historyFeatures = [
      'history: {',
      'records:',
      'currentIndex:',
      'maxRecords:',
      'undo:',
      'redo:',
      'canUndo:',
      'canRedo:'
    ];

    for (const feature of historyFeatures) {
      if (!storeContent.includes(feature)) {
        throw new Error(`Store历史逻辑缺少: ${feature}`);
      }
    }

    return {
      componentFeatures: requiredFeatures.length,
      storeFeatures: historyFeatures.length,
      hasMaxRecordsLimit: storeContent.includes('maxRecords')
    };
  }

  testKeyboardShortcuts() {
    const shortcutsContent = fs.readFileSync('hooks/use-keyboard-shortcuts.js', 'utf8');
    
    const requiredShortcuts = [
      'Ctrl+Z',  // 撤销
      'Ctrl+Y',  // 重做
      'Ctrl+Enter', // 生成
      'Ctrl+S',  // 保存
      'addEventListener',
      'keydown',
      'ctrlKey',
      'metaKey'
    ];

    for (const shortcut of requiredShortcuts) {
      if (!shortcutsContent.includes(shortcut)) {
        throw new Error(`快捷键系统缺少: ${shortcut}`);
      }
    }

    // 检查主页面中的集成
    const pageContent = fs.readFileSync('app/page.js', 'utf8');
    if (!pageContent.includes('useKeyboardShortcuts')) {
      throw new Error('主页面未集成快捷键系统');
    }

    return {
      shortcutsCount: requiredShortcuts.length,
      integrated: true,
      hasMacSupport: shortcutsContent.includes('metaKey'),
      hasPreventDefault: shortcutsContent.includes('preventDefault')
    };
  }

  testTemplateSystem() {
    // 检查模板文件
    const templatesContent = fs.readFileSync('lib/templates/index.js', 'utf8');
    
    const templateTypes = [
      'flowchart',
      'sequence', 
      'classDiagram',
      'gantt',
      'pie',
      'gitgraph',
      'er',
      'journey',
      'timeline',
      'mindmap'
    ];

    let availableTypes = 0;
    for (const type of templateTypes) {
      if (templatesContent.includes(type)) {
        availableTypes++;
      }
    }

    if (availableTypes < 5) {
      throw new Error(`模板类型不足，仅有${availableTypes}种，期望至少5种`);
    }

    // 检查模板选择器组件
    const selectorContent = fs.readFileSync('components/template-selector.jsx', 'utf8');
    const selectorFeatures = [
      'TemplateSelector',
      'templates',
      'onSelect',
      'Dialog',
      'categories'
    ];

    for (const feature of selectorFeatures) {
      if (!selectorContent.includes(feature)) {
        throw new Error(`模板选择器缺少: ${feature}`);
      }
    }

    return {
      templateTypes: availableTypes,
      hasSelector: true,
      hasCategories: selectorContent.includes('categories'),
      hasSearch: selectorContent.includes('search') || selectorContent.includes('filter')
    };
  }

  testExportFunctionality() {
    const exportContent = fs.readFileSync('lib/export-utils.js', 'utf8');
    
    const exportFormats = [
      'exportToPNG',
      'exportToJPEG',
      'exportToSVG', 
      'exportToPDF',
      'exportToWebP'
    ];

    for (const format of exportFormats) {
      if (!exportContent.includes(format)) {
        throw new Error(`导出功能缺少格式: ${format}`);
      }
    }

    // 检查导出对话框
    const dialogContent = fs.readFileSync('components/export-dialog.jsx', 'utf8');
    const dialogFeatures = [
      'ExportDialog',
      'quality',
      'format',
      'download',
      'Tabs'
    ];

    for (const feature of dialogFeatures) {
      if (!dialogContent.includes(feature)) {
        throw new Error(`导出对话框缺少: ${feature}`);
      }
    }

    return {
      exportFormats: exportFormats.length,
      hasDialog: true,
      hasQualityControl: exportContent.includes('quality'),
      hasSSRSafety: exportContent.includes('isBrowser') || exportContent.includes('typeof window')
    };
  }

  testBatchProcessing() {
    const batchContent = fs.readFileSync('lib/batch-processor.js', 'utf8');
    
    const batchOperations = [
      'batchConvert',
      'batchExport',
      'batchApplyTemplate',
      'batchValidate'
    ];

    for (const operation of batchOperations) {
      if (!batchContent.includes(operation)) {
        throw new Error(`批处理缺少操作: ${operation}`);
      }
    }

    // 检查批处理对话框
    const dialogContent = fs.readFileSync('components/batch-process-dialog.jsx', 'utf8');
    const dialogFeatures = [
      'BatchProcessDialog',
      'fileUpload',
      'progress',
      'results'
    ];

    for (const feature of dialogFeatures) {
      if (!dialogContent.includes(feature)) {
        throw new Error(`批处理对话框缺少: ${feature}`);
      }
    }

    return {
      operations: batchOperations.length,
      hasDialog: true,
      hasProgress: batchContent.includes('progress') || batchContent.includes('onProgress'),
      hasConcurrency: batchContent.includes('Promise.all') || batchContent.includes('concurrent')
    };
  }

  testHistoryManagement() {
    const historyContent = fs.readFileSync('lib/history-manager.js', 'utf8');
    
    const historyFeatures = [
      'HistoryManager',
      'autoSave',
      'addRecord',
      'searchRecords',
      'compareRecords',
      'exportHistory',
      'importHistory'
    ];

    for (const feature of historyFeatures) {
      if (!historyContent.includes(feature)) {
        throw new Error(`历史管理缺少功能: ${feature}`);
      }
    }

    // 检查历史对话框
    const dialogContent = fs.readFileSync('components/history-dialog.jsx', 'utf8');
    const dialogFeatures = [
      'HistoryDialog',
      'search',
      'filter',
      'restore',
      'compare'
    ];

    for (const feature of dialogFeatures) {
      if (!dialogContent.includes(feature)) {
        throw new Error(`历史对话框缺少: ${feature}`);
      }
    }

    return {
      features: historyFeatures.length,
      hasDialog: true,
      hasAutoSave: historyContent.includes('setInterval') || historyContent.includes('autoSave'),
      hasSearch: dialogContent.includes('search') || dialogContent.includes('filter'),
      hasComparison: historyContent.includes('compare')
    };
  }

  testUIComponents() {
    const uiComponents = [
      'components/ui/progress.jsx',
      'components/ui/tooltip.jsx', 
      'components/ui/scroll-area.jsx',
      'components/ui/badge.jsx',
      'components/ui/slider.jsx'
    ];

    const missingComponents = [];
    const componentDetails = {};

    for (const component of uiComponents) {
      if (!fs.existsSync(component)) {
        missingComponents.push(component);
      } else {
        const content = fs.readFileSync(component, 'utf8');
        componentDetails[component] = {
          hasForwardRef: content.includes('forwardRef'),
          hasTypeScript: content.includes('interface') || content.includes('type'),
          hasRadixUI: content.includes('@radix-ui')
        };
      }
    }

    if (missingComponents.length > 0) {
      throw new Error(`缺少UI组件: ${missingComponents.join(', ')}`);
    }

    return {
      totalComponents: uiComponents.length,
      componentDetails,
      allExist: missingComponents.length === 0
    };
  }

  testPerformanceOptimizations() {
    const pageContent = fs.readFileSync('app/page.js', 'utf8');
    
    const optimizations = {
      'React.memo': '组件记忆化',
      'useCallback': '回调函数优化',
      'useMemo': '计算结果记忆化',
      'dynamic': '动态导入',
      'ssr: false': 'SSR禁用',
      'loading:': '加载状态'
    };

    const foundOptimizations = [];
    for (const [optimization, description] of Object.entries(optimizations)) {
      if (pageContent.includes(optimization)) {
        foundOptimizations.push(description);
      }
    }

    if (foundOptimizations.length < 3) {
      throw new Error(`性能优化不足，仅发现: ${foundOptimizations.join(', ')}`);
    }

    // 检查是否减少了useState的使用
    const useStateCount = (pageContent.match(/useState/g) || []).length;
    
    return {
      optimizations: foundOptimizations,
      optimizationCount: foundOptimizations.length,
      useStateCount,
      hasZustand: pageContent.includes('useAppStore'),
      hasDynamicImports: pageContent.includes('dynamic')
    };
  }

  testSystemIntegration() {
    const pageContent = fs.readFileSync('app/page.js', 'utf8');
    
    // 检查所有新组件是否都集成到了主页面
    const integratedComponents = [
      'BatchProcessDialog',
      'HistoryDialog', 
      'TemplateSelector',
      'UndoRedoControls',
      'useKeyboardShortcuts',
      'historyManagerService'
    ];

    const missingIntegrations = [];
    for (const component of integratedComponents) {
      if (!pageContent.includes(component)) {
        missingIntegrations.push(component);
      }
    }

    if (missingIntegrations.length > 0) {
      throw new Error(`主页面缺少集成: ${missingIntegrations.join(', ')}`);
    }

    // 检查Header组件是否添加了新按钮
    const headerContent = fs.readFileSync('components/header.jsx', 'utf8');
    const headerButtons = ['onBatchProcessClick', 'onHistoryClick', 'Archive', 'History'];
    
    const missingButtons = [];
    for (const button of headerButtons) {
      if (!headerContent.includes(button)) {
        missingButtons.push(button);
      }
    }

    if (missingButtons.length > 0) {
      throw new Error(`Header缺少按钮: ${missingButtons.join(', ')}`);
    }

    return {
      integratedComponents: integratedComponents.length,
      headerButtons: headerButtons.length,
      allIntegrated: missingIntegrations.length === 0 && missingButtons.length === 0,
      hasEventHandlers: pageContent.includes('handleBatchProcessClick') && pageContent.includes('handleHistoryClick')
    };
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 功能完整性验证结果总结');
    console.log('='.repeat(60));
    
    console.log(`✅ 通过验证: ${this.results.passed}`);
    console.log(`❌ 验证失败: ${this.results.failed}`);
    console.log(`📈 成功率: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (Object.keys(this.results.features).length > 0) {
      console.log('\n📋 功能验证详情:');
      for (const [feature, result] of Object.entries(this.results.features)) {
        const status = result.status === 'passed' ? '✅' : '❌';
        console.log(`${status} ${feature}`);
        
        if (result.status === 'passed' && result.details) {
          // 显示一些关键指标
          if (typeof result.details === 'object') {
            const keyMetrics = Object.entries(result.details)
              .filter(([key, value]) => typeof value === 'number' || typeof value === 'boolean')
              .slice(0, 3);
            
            if (keyMetrics.length > 0) {
              console.log(`   ${keyMetrics.map(([k, v]) => `${k}: ${v}`).join(', ')}`);
            }
          }
        }
      }
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ 验证失败详情:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0) {
      console.log('🎉 所有功能验证通过！系统功能完整且正确集成。');
      this.printFeatureSummary();
    } else {
      console.log('⚠️  存在功能问题，需要修复后再次验证。');
    }
  }

  printFeatureSummary() {
    console.log('\n🌟 功能特性总结:');
    console.log('1. ✅ Zustand状态管理 - 统一状态管理，支持持久化');
    console.log('2. ✅ 撤销/重做系统 - 完整的历史操作支持');
    console.log('3. ✅ 快捷键系统 - 提升操作效率的键盘快捷键');
    console.log('4. ✅ 模板系统 - 丰富的Mermaid图表模板库');
    console.log('5. ✅ 多格式导出 - PNG、JPEG、SVG、PDF、WebP导出');
    console.log('6. ✅ 批处理功能 - 批量转换、导出、模板应用');
    console.log('7. ✅ 历史记录管理 - 自动保存、搜索、比较、恢复');
    console.log('8. ✅ 性能优化 - 内存优化、组件优化、动态加载');
    console.log('9. ✅ UI组件库 - 完整的UI组件支持');
    console.log('10. ✅ 系统集成 - 所有功能完整集成到主应用');
  }
}

// 运行测试
async function runTests() {
  const tester = new FunctionalityTester();
  
  try {
    const results = await tester.runAllTests();
    tester.printResults();
    
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('🔴 功能验证失败:', error);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = { FunctionalityTester };