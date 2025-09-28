#!/usr/bin/env node

/**
 * Smart Mermaid 基础集成测试
 * 不需要浏览器环境的基础功能测试
 */

const fs = require('fs');
const path = require('path');

class BasicTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`\n📋 测试: ${name}`);
      await testFn();
      console.log(`✅ ${name} - 通过`);
      this.results.passed++;
    } catch (error) {
      console.log(`❌ ${name} - 失败: ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`${name}: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 开始基础集成测试...\n');

    // 文件结构测试
    await this.test('项目文件结构完整性', () => this.testFileStructure());
    
    // 组件导入测试
    await this.test('组件导入依赖检查', () => this.testComponentImports());
    
    // Store状态管理测试
    await this.test('Zustand Store基础功能', () => this.testStoreBasics());
    
    // 配置文件测试
    await this.test('配置文件正确性', () => this.testConfigFiles());
    
    // 新功能模块测试
    await this.test('批处理服务模块', () => this.testBatchProcessor());
    await this.test('历史管理服务模块', () => this.testHistoryManager());
    await this.test('导出工具模块', () => this.testExportUtils());
    
    return this.results;
  }

  testFileStructure() {
    const requiredFiles = [
      // Core files
      'app/page.js',
      'stores/app-store.js',
      
      // New components
      'components/batch-process-dialog.jsx',
      'components/history-dialog.jsx',
      'components/export-dialog.jsx',
      'components/template-selector.jsx',
      'components/undo-redo-controls.jsx',
      
      // New services
      'lib/batch-processor.js',
      'lib/history-manager.js',
      'lib/export-utils.js',
      
      // Templates
      'lib/templates/index.js',
      
      // Hooks
      'hooks/use-keyboard-shortcuts.js',
      'hooks/use-store.js',
      
      // UI components
      'components/ui/progress.jsx',
      'components/ui/tooltip.jsx',
      'components/ui/scroll-area.jsx',
      'components/ui/badge.jsx',
      'components/ui/slider.jsx'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`缺少必需文件: ${file}`);
      }
    }

    console.log(`   ✓ 所有 ${requiredFiles.length} 个必需文件都存在`);
  }

  testComponentImports() {
    // 测试主页面组件的导入
    const pageContent = fs.readFileSync('app/page.js', 'utf8');
    
    const requiredImports = [
      'BatchProcessDialog',
      'HistoryDialog',
      'TemplateSelector',
      'useAppStore',
      'useKeyboardShortcuts',
      'historyManagerService'
    ];

    for (const importName of requiredImports) {
      if (!pageContent.includes(importName)) {
        throw new Error(`主页面缺少导入: ${importName}`);
      }
    }

    console.log(`   ✓ 所有 ${requiredImports.length} 个关键导入都存在`);
  }

  testStoreBasics() {
    // 测试 Store 文件语法正确性
    const storeContent = fs.readFileSync('stores/app-store.js', 'utf8');
    
    const requiredStoreElements = [
      'useAppStore',
      'useEditorState',
      'useUIState',
      'useHistoryActions',
      'setShowBatchDialog',
      'setShowHistoryDialog',
      'undo',
      'redo'
    ];

    for (const element of requiredStoreElements) {
      if (!storeContent.includes(element)) {
        throw new Error(`Store缺少元素: ${element}`);
      }
    }

    console.log(`   ✓ Zustand Store 包含所有 ${requiredStoreElements.length} 个必需元素`);
  }

  testConfigFiles() {
    // 测试 package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = [
      'zustand',
      'html-to-image', 
      'html2pdf.js',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slider',
      '@radix-ui/react-progress'
    ];

    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies?.[dep]) {
        throw new Error(`package.json缺少依赖: ${dep}`);
      }
    }

    console.log(`   ✓ package.json 包含所有 ${requiredDeps.length} 个必需依赖`);
  }

  testBatchProcessor() {
    const batchContent = fs.readFileSync('lib/batch-processor.js', 'utf8');
    
    const requiredMethods = [
      'class BatchProcessor',
      'batchConvert',
      'batchExport',
      'batchApplyTemplate',
      'batchValidate'
    ];

    for (const method of requiredMethods) {
      if (!batchContent.includes(method)) {
        throw new Error(`BatchProcessor缺少方法: ${method}`);
      }
    }

    console.log(`   ✓ BatchProcessor 包含所有 ${requiredMethods.length} 个核心方法`);
  }

  testHistoryManager() {
    const historyContent = fs.readFileSync('lib/history-manager.js', 'utf8');
    
    const requiredMethods = [
      'class HistoryManager',
      'autoSave',
      'addRecord',
      'searchRecords',
      'compareRecords',
      'exportHistory',
      'importHistory'
    ];

    for (const method of requiredMethods) {
      if (!historyContent.includes(method)) {
        throw new Error(`HistoryManager缺少方法: ${method}`);
      }
    }

    console.log(`   ✓ HistoryManager 包含所有 ${requiredMethods.length} 个核心方法`);
  }

  testExportUtils() {
    const exportContent = fs.readFileSync('lib/export-utils.js', 'utf8');
    
    const requiredMethods = [
      'class DiagramExporter',
      'exportToPNG',
      'exportToJPEG', 
      'exportToSVG',
      'exportToPDF',
      'exportToWebP'
    ];

    for (const method of requiredMethods) {
      if (!exportContent.includes(method)) {
        throw new Error(`DiagramExporter缺少方法: ${method}`);
      }
    }

    console.log(`   ✓ DiagramExporter 包含所有 ${requiredMethods.length} 个导出方法`);
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 基础测试结果总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`📈 成功率: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🔍 错误详情:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// 运行测试
async function runTests() {
  const tester = new BasicTester();
  
  try {
    const results = await tester.runAllTests();
    tester.printResults();
    
    // 如果有失败的测试，退出时返回错误代码
    if (results.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 所有基础测试通过！');
    }
  } catch (error) {
    console.error('🔴 测试运行失败:', error);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = { BasicTester };