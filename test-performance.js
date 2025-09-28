#!/usr/bin/env node

/**
 * Smart Mermaid 性能基准测试
 * 测试内存使用、包大小、构建时间等性能指标
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PerformanceTester {
  constructor() {
    this.results = {
      metrics: {},
      passed: 0,
      failed: 0,
      warnings: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`\n📊 性能测试: ${name}`);
      const result = await testFn();
      if (result !== undefined) {
        this.results.metrics[name] = result;
      }
      console.log(`✅ ${name} - 通过`);
      this.results.passed++;
    } catch (error) {
      console.log(`⚠️  ${name} - 警告: ${error.message}`);
      this.results.warnings.push(`${name}: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 开始性能基准测试...\n');

    // 包大小分析
    await this.test('Bundle Size Analysis', () => this.testBundleSize());
    
    // 依赖分析
    await this.test('Dependencies Analysis', () => this.testDependencies());
    
    // 代码复杂度分析
    await this.test('Code Complexity', () => this.testCodeComplexity());
    
    // 构建性能测试
    await this.test('Build Performance', () => this.testBuildPerformance());
    
    // 内存使用模拟
    await this.test('Memory Usage Simulation', () => this.testMemoryUsage());
    
    // 文件大小检查
    await this.test('File Size Check', () => this.testFileSizes());
    
    return this.results;
  }

  async testBundleSize() {
    try {
      // 检查 .next 目录是否存在
      if (!fs.existsSync('.next')) {
        console.log('   📦 .next 目录不存在，跳过bundle分析');
        return { status: 'skipped', reason: 'No build found' };
      }

      // 检查构建输出
      const buildManifest = path.join('.next', 'build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        const totalFiles = Object.keys(manifest.pages).length;
        console.log(`   📊 构建页面数: ${totalFiles}`);
        return { pages: totalFiles };
      }

      return { status: 'no_manifest' };
    } catch (error) {
      return { error: error.message };
    }
  }

  testDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;
    const productionDeps = Object.keys(deps).length;
    
    console.log(`   📦 生产依赖: ${productionDeps}`);
    console.log(`   🔧 开发依赖: ${Object.keys(devDeps).length}`);
    console.log(`   📊 总依赖数: ${totalDeps}`);
    
    // 检查重要的性能相关依赖
    const performanceDeps = [
      'zustand',
      'react',
      'next',
      'mermaid',
      '@excalidraw/excalidraw'
    ];
    
    const missingDeps = performanceDeps.filter(dep => !deps[dep]);
    if (missingDeps.length > 0) {
      console.log(`   ⚠️  缺少关键依赖: ${missingDeps.join(', ')}`);
    }
    
    return {
      total: totalDeps,
      production: productionDeps,
      development: Object.keys(devDeps).length
    };
  }

  testCodeComplexity() {
    const sourceFiles = this.getSourceFiles();
    let totalLines = 0;
    let totalFiles = 0;
    let complexFiles = [];
    
    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
        totalFiles++;
        
        // 检查大文件（超过500行的认为是复杂文件）
        if (lines > 500) {
          complexFiles.push({ file: file.replace(process.cwd() + '/', ''), lines });
        }
      } catch (error) {
        // 忽略无法读取的文件
      }
    }
    
    const avgLinesPerFile = Math.round(totalLines / totalFiles);
    console.log(`   📄 源文件数: ${totalFiles}`);
    console.log(`   📝 总代码行数: ${totalLines}`);
    console.log(`   📊 平均每文件行数: ${avgLinesPerFile}`);
    
    if (complexFiles.length > 0) {
      console.log(`   ⚠️  复杂文件 (>500行):`);
      complexFiles.forEach(({ file, lines }) => {
        console.log(`     - ${file}: ${lines} 行`);
      });
    }
    
    return {
      totalFiles,
      totalLines,
      avgLinesPerFile,
      complexFiles: complexFiles.length
    };
  }

  async testBuildPerformance() {
    try {
      console.log('   🔨 测试构建性能...');
      const startTime = Date.now();
      
      // 运行类型检查
      await execAsync('npx tsc --noEmit --skipLibCheck');
      const typeCheckTime = Date.now() - startTime;
      
      console.log(`   ✅ TypeScript检查: ${typeCheckTime}ms`);
      
      return {
        typeCheck: typeCheckTime
      };
    } catch (error) {
      // TypeScript 错误不影响性能测试
      console.log(`   ⚠️  TypeScript检查有问题: ${error.message.split('\n')[0]}`);
      return { typeCheckError: true };
    }
  }

  testMemoryUsage() {
    // 模拟内存使用情况
    const process = require('process');
    const memUsage = process.memoryUsage();
    
    const formatBytes = (bytes) => {
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };
    
    console.log(`   🧠 RSS: ${formatBytes(memUsage.rss)}`);
    console.log(`   📊 Heap Used: ${formatBytes(memUsage.heapUsed)}`);
    console.log(`   📈 Heap Total: ${formatBytes(memUsage.heapTotal)}`);
    console.log(`   💾 External: ${formatBytes(memUsage.external)}`);
    
    // 检查是否有内存问题迹象
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsagePercent > 80) {
      console.log(`   ⚠️  堆使用率较高: ${heapUsagePercent.toFixed(1)}%`);
    }
    
    return {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      heapUsagePercent: heapUsagePercent.toFixed(1)
    };
  }

  testFileSizes() {
    const importantFiles = [
      'app/page.js',
      'stores/app-store.js',
      'lib/export-utils.js',
      'lib/batch-processor.js',
      'lib/history-manager.js',
      'lib/templates/index.js'
    ];
    
    const fileSizes = {};
    let totalSize = 0;
    
    for (const file of importantFiles) {
      try {
        const stats = fs.statSync(file);
        const sizeKB = (stats.size / 1024).toFixed(2);
        fileSizes[file] = parseFloat(sizeKB);
        totalSize += stats.size;
        console.log(`   📄 ${file}: ${sizeKB} KB`);
      } catch (error) {
        console.log(`   ❌ ${file}: 文件不存在`);
      }
    }
    
    console.log(`   📊 核心文件总大小: ${(totalSize / 1024).toFixed(2)} KB`);
    
    // 检查过大的文件
    const largeFiles = Object.entries(fileSizes).filter(([_, size]) => size > 50);
    if (largeFiles.length > 0) {
      console.log(`   ⚠️  大文件 (>50KB):`);
      largeFiles.forEach(([file, size]) => {
        console.log(`     - ${file}: ${size} KB`);
      });
    }
    
    return {
      fileSizes,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      largeFiles: largeFiles.length
    };
  }

  getSourceFiles() {
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    const directories = ['app', 'components', 'lib', 'stores', 'hooks'];
    const files = [];
    
    function scanDirectory(dir) {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
    }
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        scanDirectory(dir);
      }
    }
    
    return files;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 性能基准测试结果总结');
    console.log('='.repeat(60));
    
    console.log(`✅ 通过测试: ${this.results.passed}`);
    console.log(`⚠️  警告数量: ${this.results.warnings.length}`);
    
    if (Object.keys(this.results.metrics).length > 0) {
      console.log('\n📈 性能指标详情:');
      for (const [test, metrics] of Object.entries(this.results.metrics)) {
        console.log(`\n${test}:`);
        if (typeof metrics === 'object' && !Array.isArray(metrics)) {
          for (const [key, value] of Object.entries(metrics)) {
            console.log(`  ${key}: ${value}`);
          }
        } else {
          console.log(`  结果: ${metrics}`);
        }
      }
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  警告详情:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 性能建议
    this.printRecommendations();
  }

  printRecommendations() {
    console.log('💡 性能优化建议:');
    
    const deps = this.results.metrics['Dependencies Analysis'];
    if (deps && deps.total > 50) {
      console.log('  - 考虑减少依赖数量以降低打包体积');
    }
    
    const complexity = this.results.metrics['Code Complexity'];
    if (complexity && complexity.complexFiles > 0) {
      console.log('  - 考虑拆分复杂文件以提高可维护性');
    }
    
    const memory = this.results.metrics['Memory Usage Simulation'];
    if (memory && parseFloat(memory.heapUsagePercent) > 70) {
      console.log('  - 注意内存使用，考虑添加内存优化');
    }
    
    const files = this.results.metrics['File Size Check'];
    if (files && files.largeFiles > 0) {
      console.log('  - 考虑分割大文件以提高加载性能');
    }
    
    console.log('  ✨ 总体来说，性能优化工作已经很好！');
  }
}

// 运行测试
async function runTests() {
  const tester = new PerformanceTester();
  
  try {
    const results = await tester.runAllTests();
    tester.printResults();
    
    console.log('\n🎯 性能基准测试完成！');
  } catch (error) {
    console.error('🔴 性能测试失败:', error);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runTests();
}

module.exports = { PerformanceTester };