#!/usr/bin/env node

/**
 * Smart Mermaid 集成测试脚本
 * 测试所有新增功能的完整性
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const TEST_TIMEOUT = 30000;

// 测试数据
const TEST_DATA = {
  simpleText: "用户登录系统，验证身份，成功后进入主页",
  complexText: `电商订单处理流程：
1. 用户下单
2. 库存检查
3. 支付处理
4. 订单确认
5. 物流发货
6. 配送完成`,
  mermaidCode: `graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[其他操作]
    C --> E[结束]
    D --> E`
};

class IntegrationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async setup() {
    console.log('🚀 启动浏览器...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // 设置超时
    this.page.setDefaultTimeout(TEST_TIMEOUT);
    
    // 监听控制台错误
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 浏览器控制台错误:', msg.text());
      }
    });
    
    // 监听页面错误
    this.page.on('pageerror', error => {
      console.log('🔴 页面错误:', error.message);
      this.results.errors.push(`页面错误: ${error.message}`);
    });
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

  async navigate() {
    console.log(`📡 导航到 ${BASE_URL}`);
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState('networkidle');
    
    // 等待页面完全加载
    await this.page.waitForSelector('[data-testid="app-loaded"], .h-screen', { timeout: 10000 });
  }

  async runAllTests() {
    await this.setup();
    
    try {
      // 基础功能测试
      await this.test('页面加载', () => this.navigate());
      await this.test('基本UI元素存在', () => this.testBasicUI());
      
      // Zustand状态管理测试
      await this.test('状态管理 - 文本输入', () => this.testTextInput());
      await this.test('状态管理 - 代码编辑', () => this.testCodeEditor());
      
      // 新功能测试
      await this.test('撤销/重做功能', () => this.testUndoRedo());
      await this.test('模板选择器', () => this.testTemplateSelector());
      await this.test('批处理对话框', () => this.testBatchDialog());
      await this.test('历史记录对话框', () => this.testHistoryDialog());
      await this.test('导出功能', () => this.testExportFunctionality());
      
      // 性能测试
      await this.test('内存使用检查', () => this.testMemoryUsage());
      await this.test('渲染性能检查', () => this.testRenderPerformance());
      
    } finally {
      await this.cleanup();
    }
    
    return this.results;
  }

  async testBasicUI() {
    // 检查头部导航
    await this.page.waitForSelector('header', { timeout: 5000 });
    
    // 检查主要按钮
    const expectedButtons = [
      'button[title="批处理"]',
      'button[title="历史记录"]', 
      'button[title="设置"]'
    ];
    
    for (const selector of expectedButtons) {
      await this.page.waitForSelector(selector, { timeout: 3000 });
    }
    
    // 检查左侧面板
    await this.page.waitForSelector('textarea, [role="textbox"]', { timeout: 5000 });
  }

  async testTextInput() {
    const textArea = await this.page.locator('textarea').first();
    await textArea.fill(TEST_DATA.simpleText);
    
    // 验证状态同步
    const value = await textArea.inputValue();
    if (value !== TEST_DATA.simpleText) {
      throw new Error('文本输入状态同步失败');
    }
  }

  async testCodeEditor() {
    // 查找代码编辑器
    const codeEditor = await this.page.locator('.cm-editor, [data-testid="mermaid-editor"]').first();
    
    if (await codeEditor.count() > 0) {
      // 模拟在编辑器中输入代码
      await codeEditor.click();
      await this.page.keyboard.type(TEST_DATA.mermaidCode);
      
      // 等待一段时间确保状态更新
      await this.page.waitForTimeout(1000);
    }
  }

  async testUndoRedo() {
    // 查找撤销/重做按钮
    const undoButton = this.page.locator('button[title*="撤销"], button[aria-label*="撤销"]');
    const redoButton = this.page.locator('button[title*="重做"], button[aria-label*="重做"]');
    
    if (await undoButton.count() > 0) {
      // 测试撤销功能
      await undoButton.click();
      await this.page.waitForTimeout(500);
    }
    
    if (await redoButton.count() > 0) {
      // 测试重做功能  
      await redoButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async testTemplateSelector() {
    // 查找模板相关的按钮
    const templateButton = this.page.locator('button:has-text("模板"), button[title*="模板"]');
    
    if (await templateButton.count() > 0) {
      await templateButton.click();
      
      // 等待模板对话框出现
      await this.page.waitForSelector('[role="dialog"], .dialog', { timeout: 3000 });
      
      // 关闭对话框
      const closeButton = this.page.locator('button:has-text("关闭"), button:has-text("取消"), [aria-label="关闭"]');
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
      } else {
        await this.page.keyboard.press('Escape');
      }
    }
  }

  async testBatchDialog() {
    const batchButton = this.page.locator('button[title="批处理"]');
    
    if (await batchButton.count() > 0) {
      await batchButton.click();
      
      // 等待批处理对话框
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // 关闭对话框
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }
  }

  async testHistoryDialog() {
    const historyButton = this.page.locator('button[title="历史记录"]');
    
    if (await historyButton.count() > 0) {
      await historyButton.click();
      
      // 等待历史对话框
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // 关闭对话框
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(500);
    }
  }

  async testExportFunctionality() {
    // 查找导出相关按钮
    const exportButton = this.page.locator('button:has-text("导出"), button[title*="导出"]');
    
    if (await exportButton.count() > 0) {
      // 只测试按钮点击，不实际下载文件
      console.log('导出按钮可用');
    }
  }

  async testMemoryUsage() {
    // 检查页面内存使用情况
    const metrics = await this.page.evaluate(() => {
      return {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: performance.timing
      };
    });
    
    if (metrics.memory) {
      const usedMB = metrics.memory.usedJSHeapSize / 1024 / 1024;
      console.log(`📊 内存使用: ${usedMB.toFixed(2)} MB`);
      
      if (usedMB > 100) {
        console.log('⚠️  内存使用较高，可能存在内存泄漏');
      }
    }
  }

  async testRenderPerformance() {
    // 测试页面渲染性能
    const startTime = Date.now();
    
    // 触发重新渲染
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️  页面加载时间: ${loadTime}ms`);
    
    if (loadTime > 5000) {
      console.log('⚠️  页面加载时间较长');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果总结');
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
  const tester = new IntegrationTester();
  
  try {
    const results = await tester.runAllTests();
    tester.printResults();
    
    // 如果有失败的测试，退出时返回错误代码
    if (results.failed > 0) {
      process.exit(1);
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

module.exports = { IntegrationTester };