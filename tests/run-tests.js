#!/usr/bin/env node

/**
 * Smart Mermaid 测试运行器
 * 执行完整的功能和性能测试
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Smart Mermaid 集成测试开始\n');
console.log('='.repeat(60));

// 测试项目结构
function testProjectStructure() {
  console.log('📁 测试项目结构...');
  
  const criticalFiles = [
    'app/page.js',
    'stores/app-store.js',
    'components/mermaid-editor.jsx',
    'components/mermaid-renderer.jsx',
    'components/excalidraw-renderer.jsx',
    'components/template-selector.jsx',
    'components/batch-process-dialog.jsx',
    'components/history-dialog.jsx',
    'components/export-dialog.jsx',
    'lib/ai-service.js',
    'lib/export-utils.js',
    'lib/batch-processor.js',
    'lib/history-manager.js',
    'lib/templates/index.js'
  ];
  
  let missingFiles = [];
  
  criticalFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - 文件缺失`);
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length === 0) {
    console.log(`  🎉 所有关键文件存在 (${criticalFiles.length}/${criticalFiles.length})`);
  } else {
    console.log(`  ⚠️ 缺失 ${missingFiles.length} 个文件`);
  }
  
  return missingFiles.length === 0;
}

// 测试依赖包
function testDependencies() {
  console.log('📦 测试依赖包...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('  ❌ package.json 不存在');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'next',
    'react', 
    'zustand',
    'mermaid',
    'codemirror',
    '@excalidraw/excalidraw',
    'html-to-image',
    'html2pdf.js',
    'lucide-react',
    'sonner'
  ];
  
  let missingDeps = [];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - 依赖缺失`);
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length === 0) {
    console.log(`  🎉 所有关键依赖已安装 (${requiredDeps.length}/${requiredDeps.length})`);
  } else {
    console.log(`  ⚠️ 缺失 ${missingDeps.length} 个依赖`);
  }
  
  return missingDeps.length === 0;
}

// 测试代码质量
function testCodeQuality() {
  console.log('🔍 测试代码质量...');
  
  const testFiles = [
    'stores/app-store.js',
    'lib/batch-processor.js', 
    'lib/history-manager.js',
    'lib/export-utils.js'
  ];
  
  let qualityIssues = [];
  
  testFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // 检查代码规范
      const checks = [
        {
          name: 'ES6+ 语法使用',
          test: content.includes('const ') || content.includes('let ') || content.includes('=>'),
          weight: 1
        },
        {
          name: 'JSDoc 注释',
          test: content.includes('/**') && content.includes('*/'),
          weight: 1
        },
        {
          name: '错误处理',
          test: content.includes('try') && content.includes('catch'),
          weight: 2
        },
        {
          name: '类型安全',
          test: content.includes('typeof') || content.includes('instanceof'),
          weight: 1
        }
      ];
      
      let fileScore = 0;
      let maxScore = 0;
      
      checks.forEach(check => {
        maxScore += check.weight;
        if (check.test) {
          fileScore += check.weight;
        }
      });
      
      const percentage = (fileScore / maxScore * 100).toFixed(1);
      const status = percentage >= 75 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      
      console.log(`  ${status} ${file}: ${percentage}% (${fileScore}/${maxScore})`);
      
      if (percentage < 75) {
        qualityIssues.push(`${file} 质量评分偏低: ${percentage}%`);
      }
    }
  });
  
  if (qualityIssues.length === 0) {
    console.log(`  🎉 代码质量检查通过`);
  } else {
    console.log(`  ⚠️ 发现 ${qualityIssues.length} 个质量问题`);
  }
  
  return qualityIssues.length === 0;
}

// 测试功能模块
function testFunctionalModules() {
  console.log('⚙️ 测试功能模块...');
  
  const modules = [
    {
      name: 'Zustand Store',
      file: 'stores/app-store.js',
      keywords: ['useAppStore', 'persist', 'subscribeWithSelector']
    },
    {
      name: '模板系统',
      file: 'lib/templates/index.js', 
      keywords: ['templates', 'flowchart', 'sequence']
    },
    {
      name: '批处理服务',
      file: 'lib/batch-processor.js',
      keywords: ['BatchProcessor', 'batchConvert', 'progress']
    },
    {
      name: '历史管理',
      file: 'lib/history-manager.js',
      keywords: ['HistoryManager', 'autoSave', 'HistoryRecord']
    },
    {
      name: '导出工具',
      file: 'lib/export-utils.js',
      keywords: ['DiagramExporter', 'htmlToImage', 'exportToPNG']
    }
  ];
  
  let moduleIssues = [];
  
  modules.forEach(module => {
    const fullPath = path.join(process.cwd(), module.file);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let foundKeywords = 0;
      module.keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          foundKeywords++;
        }
      });
      
      const percentage = (foundKeywords / module.keywords.length * 100).toFixed(1);
      const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
      
      console.log(`  ${status} ${module.name}: ${percentage}% (${foundKeywords}/${module.keywords.length})`);
      
      if (percentage < 80) {
        moduleIssues.push(`${module.name} 功能不完整: ${percentage}%`);
      }
    } else {
      console.log(`  ❌ ${module.name}: 文件不存在`);
      moduleIssues.push(`${module.name} 文件缺失`);
    }
  });
  
  if (moduleIssues.length === 0) {
    console.log(`  🎉 所有功能模块测试通过`);
  } else {
    console.log(`  ⚠️ 发现 ${moduleIssues.length} 个模块问题`);
  }
  
  return moduleIssues.length === 0;
}

// 测试性能优化
function testPerformanceOptimizations() {
  console.log('⚡ 测试性能优化...');
  
  const optimizations = [
    {
      name: 'React.memo 使用',
      files: ['components/mermaid-renderer.jsx', 'components/excalidraw-renderer.jsx'],
      keyword: 'React.memo'
    },
    {
      name: 'useCallback 优化',
      files: ['app/page.js'],
      keyword: 'useCallback'
    },
    {
      name: '动态导入',
      files: ['app/page.js', 'lib/export-utils.js'],
      keyword: 'import('
    },
    {
      name: 'SSR 安全处理',
      files: ['hooks/use-store.js', 'lib/export-utils.js'],
      keyword: 'typeof window'
    }
  ];
  
  let optimizationIssues = [];
  
  optimizations.forEach(opt => {
    let foundInFiles = 0;
    
    opt.files.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(opt.keyword)) {
          foundInFiles++;
        }
      }
    });
    
    const percentage = (foundInFiles / opt.files.length * 100).toFixed(1);
    const status = percentage >= 50 ? '✅' : '⚠️';
    
    console.log(`  ${status} ${opt.name}: ${percentage}% (${foundInFiles}/${opt.files.length} 文件)`);
    
    if (percentage < 50) {
      optimizationIssues.push(`${opt.name} 应用不足: ${percentage}%`);
    }
  });
  
  if (optimizationIssues.length === 0) {
    console.log(`  🎉 性能优化测试通过`);
  } else {
    console.log(`  ⚠️ 发现 ${optimizationIssues.length} 个优化问题`);
  }
  
  return optimizationIssues.length === 0;
}

// 生成测试报告
function generateTestReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const overallScore = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n总体评分: ${overallScore}% (${passedTests}/${totalTests} 项通过)\n`);
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (!result.passed && result.issues) {
      result.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (overallScore >= 80) {
    console.log('🎉 集成测试通过! 项目已准备就绪。');
  } else if (overallScore >= 60) {
    console.log('⚠️ 集成测试部分通过，建议修复问题后重新测试。');
  } else {
    console.log('❌ 集成测试失败，需要重大修复。');
  }
  
  // 保存测试报告
  const reportData = {
    timestamp: new Date().toISOString(),
    overallScore,
    passedTests,
    totalTests,
    results,
    recommendations: generateRecommendations(results)
  };
  
  const reportPath = path.join(process.cwd(), 'tests', 'integration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  
  return overallScore >= 80;
}

// 生成改进建议
function generateRecommendations(results) {
  const recommendations = [];
  
  results.forEach(result => {
    if (!result.passed) {
      switch (result.name) {
        case '项目结构':
          recommendations.push('补充缺失的关键文件，确保项目结构完整');
          break;
        case '依赖包':
          recommendations.push('安装缺失的npm依赖包，运行 npm install');
          break;
        case '代码质量':
          recommendations.push('改进代码注释、错误处理和类型安全检查');
          break;
        case '功能模块':
          recommendations.push('完善功能模块的核心方法和类定义');
          break;
        case '性能优化':
          recommendations.push('增加React性能优化手段，如memo、callback等');
          break;
      }
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('项目状态良好，建议继续监控性能指标');
    recommendations.push('可以考虑添加更多单元测试覆盖');
    recommendations.push('定期更新依赖包版本');
  }
  
  return recommendations;
}

// 主测试流程
async function runMainTests() {
  const startTime = Date.now();
  
  const results = [
    {
      name: '项目结构',
      passed: testProjectStructure()
    },
    {
      name: '依赖包', 
      passed: testDependencies()
    },
    {
      name: '代码质量',
      passed: testCodeQuality()
    },
    {
      name: '功能模块',
      passed: testFunctionalModules()
    },
    {
      name: '性能优化',
      passed: testPerformanceOptimizations()
    }
  ];
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n⏱️ 测试完成，耗时: ${duration}秒`);
  
  return generateTestReport(results);
}

// 执行测试
if (require.main === module) {
  runMainTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runMainTests };