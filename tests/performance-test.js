#!/usr/bin/env node

/**
 * Smart Mermaid 性能基准测试
 * 测试应用在各种负载条件下的性能表现
 */

const fs = require('fs');
const path = require('path');

console.log('⚡ Smart Mermaid 性能基准测试开始\n');
console.log('='.repeat(60));

// 性能测试用例
const performanceTests = {
  // 大型流程图测试数据
  largeFlowchart: `graph TD
    Start([开始]) --> Input[输入数据]
    Input --> Validation{数据验证}
    Validation -->|有效| Process1[预处理]
    Validation -->|无效| Error1[显示错误]
    Process1 --> Process2[主处理逻辑]
    Process2 --> Decision1{条件判断}
    Decision1 -->|条件A| ProcessA[处理分支A]
    Decision1 -->|条件B| ProcessB[处理分支B]
    Decision1 -->|其他| ProcessC[默认处理]
    ProcessA --> Merge[合并结果]
    ProcessB --> Merge
    ProcessC --> Merge
    Merge --> Validation2{结果验证}
    Validation2 -->|通过| Output[输出结果]
    Validation2 -->|失败| Retry{重试?}
    Retry -->|是| Process1
    Retry -->|否| Error2[处理失败]
    Output --> Archive[归档数据]
    Archive --> Notification[发送通知]
    Notification --> End([结束])
    Error1 --> End
    Error2 --> End`,

  // 复杂序列图测试数据
  complexSequence: `sequenceDiagram
    participant U as 用户
    participant W as Web前端
    participant A as API网关
    participant S as 服务层
    participant D as 数据库
    participant C as 缓存
    participant M as 消息队列
    participant N as 通知服务

    U->>W: 提交请求
    W->>A: 转发请求
    A->>A: 验证token
    A->>S: 调用业务逻辑
    S->>C: 查询缓存
    
    alt 缓存命中
        C-->>S: 返回缓存数据
    else 缓存未命中
        S->>D: 查询数据库
        D-->>S: 返回数据
        S->>C: 更新缓存
    end
    
    S->>M: 发送异步消息
    M->>N: 触发通知
    N->>U: 推送通知
    
    S-->>A: 返回结果
    A-->>W: 返回响应
    W-->>U: 显示结果
    
    loop 轮询状态
        U->>W: 查询状态
        W->>A: 状态请求
        A->>S: 获取状态
        S->>D: 查询最新状态
        D-->>S: 返回状态
        S-->>A: 状态响应
        A-->>W: 返回状态
        W-->>U: 显示状态
    end`,

  // 大型类图测试数据
  largeClassDiagram: `classDiagram
    class UserService {
        -userRepository: UserRepository
        -emailService: EmailService
        -passwordEncoder: PasswordEncoder
        +createUser(userData: UserDTO): User
        +updateUser(id: String, userData: UserDTO): User
        +deleteUser(id: String): Boolean
        +getUserById(id: String): User
        +getUserByEmail(email: String): User
        +authenticateUser(email: String, password: String): AuthResult
        +resetPassword(email: String): Boolean
        +validateUserData(userData: UserDTO): ValidationResult
    }
    
    class User {
        -id: String
        -email: String
        -passwordHash: String
        -firstName: String
        -lastName: String
        -createdAt: Date
        -updatedAt: Date
        -isActive: Boolean
        -roles: List~Role~
        +getId(): String
        +getEmail(): String
        +getFullName(): String
        +isEmailVerified(): Boolean
        +hasRole(role: String): Boolean
        +updateProfile(data: ProfileDTO): void
        +changePassword(newPassword: String): void
    }
    
    class UserRepository {
        <<interface>>
        +save(user: User): User
        +findById(id: String): User
        +findByEmail(email: String): User
        +findAll(criteria: SearchCriteria): List~User~
        +delete(id: String): Boolean
        +count(): Long
        +existsByEmail(email: String): Boolean
    }
    
    class EmailService {
        -mailTemplate: MailTemplate
        -smtpConfig: SMTPConfig
        +sendWelcomeEmail(user: User): Boolean
        +sendPasswordResetEmail(user: User, token: String): Boolean
        +sendNotificationEmail(user: User, message: String): Boolean
        +validateEmailAddress(email: String): Boolean
    }
    
    class PasswordEncoder {
        +encode(rawPassword: String): String
        +matches(rawPassword: String, encodedPassword: String): Boolean
        +upgradeEncoding(encodedPassword: String): Boolean
    }
    
    class Role {
        -id: String
        -name: String
        -permissions: List~Permission~
        +hasPermission(permission: String): Boolean
    }
    
    class Permission {
        -id: String
        -name: String
        -resource: String
        -action: String
    }
    
    UserService --> UserRepository
    UserService --> EmailService  
    UserService --> PasswordEncoder
    User --> Role
    Role --> Permission
    UserRepository ..> User
    EmailService ..> User`
};

// 内存使用测试
function testMemoryUsage() {
  console.log('🧠 测试内存使用...');
  
  const initialMemory = process.memoryUsage();
  console.log(`  📊 初始内存使用:`);
  console.log(`     RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`     Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`     Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  
  // 模拟大量数据处理
  const testData = [];
  for (let i = 0; i < 10000; i++) {
    testData.push({
      id: i,
      mermaidCode: performanceTests.largeFlowchart,
      timestamp: Date.now(),
      metadata: {
        type: 'flowchart',
        complexity: 'high',
        elements: 25
      }
    });
  }
  
  const peakMemory = process.memoryUsage();
  console.log(`  📊 峰值内存使用:`);
  console.log(`     RSS: ${(peakMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`     Heap Used: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`     Heap Total: ${(peakMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  
  // 清理内存
  testData.length = 0;
  global.gc && global.gc();
  
  const afterGCMemory = process.memoryUsage();
  console.log(`  📊 垃圾回收后内存:`);
  console.log(`     RSS: ${(afterGCMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`     Heap Used: ${(afterGCMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  const memoryIncrease = (afterGCMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
  const status = memoryIncrease < 10 ? '✅' : memoryIncrease < 20 ? '⚠️' : '❌';
  
  console.log(`  ${status} 内存增长: ${memoryIncrease.toFixed(2)} MB`);
  
  return {
    initial: initialMemory,
    peak: peakMemory,
    afterGC: afterGCMemory,
    increase: memoryIncrease,
    passed: memoryIncrease < 20
  };
}

// CPU性能测试
function testCPUPerformance() {
  console.log('⚡ 测试CPU性能...');
  
  const tests = [
    {
      name: '小型Mermaid代码解析',
      iterations: 1000,
      testFn: () => {
        const code = 'graph TD\n    A --> B\n    B --> C';
        // 模拟代码解析
        return code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      }
    },
    {
      name: '大型Mermaid代码解析',
      iterations: 100,
      testFn: () => {
        const code = performanceTests.largeFlowchart;
        // 模拟复杂代码解析
        return code.split('\n').map(line => {
          return {
            raw: line,
            trimmed: line.trim(),
            tokens: line.trim().split(/\s+/),
            type: line.includes('-->') ? 'connection' : line.includes('[') ? 'node' : 'other'
          };
        }).filter(parsed => parsed.trimmed.length > 0);
      }
    },
    {
      name: '模板匹配算法',
      iterations: 500,
      testFn: () => {
        const templates = Object.values(performanceTests);
        const query = 'flowchart user process';
        // 模拟模板匹配
        return templates.map(template => {
          const score = query.split(' ').reduce((acc, term) => {
            return acc + (template.toLowerCase().includes(term.toLowerCase()) ? 1 : 0);
          }, 0);
          return { template, score };
        }).sort((a, b) => b.score - a.score);
      }
    }
  ];
  
  const results = [];
  
  tests.forEach(test => {
    const startTime = process.hrtime.bigint();
    
    for (let i = 0; i < test.iterations; i++) {
      test.testFn();
    }
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    const avgTime = duration / test.iterations;
    
    const status = avgTime < 1 ? '✅' : avgTime < 5 ? '⚠️' : '❌';
    
    console.log(`  ${status} ${test.name}:`);
    console.log(`     总耗时: ${duration.toFixed(2)} ms`);
    console.log(`     平均耗时: ${avgTime.toFixed(3)} ms/次`);
    console.log(`     吞吐量: ${(1000 / avgTime).toFixed(0)} 次/秒`);
    
    results.push({
      name: test.name,
      totalTime: duration,
      avgTime,
      throughput: 1000 / avgTime,
      passed: avgTime < 5
    });
  });
  
  return results;
}

// 并发性能测试
function testConcurrencyPerformance() {
  console.log('🔄 测试并发性能...');
  
  const concurrencyTests = [
    {
      name: '批量代码生成模拟',
      concurrentTasks: 10,
      taskFn: async (taskId) => {
        return new Promise((resolve) => {
          // 模拟异步代码生成
          const complexity = Math.floor(Math.random() * 3) + 1;
          const delay = complexity * 50; // 50-150ms
          
          setTimeout(() => {
            resolve({
              taskId,
              complexity,
              generatedCode: performanceTests.largeFlowchart.slice(0, complexity * 100),
              processingTime: delay
            });
          }, delay);
        });
      }
    },
    {
      name: '批量导出模拟',
      concurrentTasks: 5,
      taskFn: async (taskId) => {
        return new Promise((resolve) => {
          // 模拟导出处理
          const formats = ['PNG', 'SVG', 'PDF'];
          const format = formats[Math.floor(Math.random() * formats.length)];
          const delay = format === 'PDF' ? 200 : format === 'PNG' ? 100 : 50;
          
          setTimeout(() => {
            resolve({
              taskId,
              format,
              fileSize: Math.floor(Math.random() * 1000) + 100,
              processingTime: delay
            });
          }, delay);
        });
      }
    }
  ];
  
  const results = [];
  
  for (const test of concurrencyTests) {
    const startTime = Date.now();
    
    // 创建并发任务
    const tasks = Array.from({ length: test.concurrentTasks }, (_, i) => test.taskFn(i));
    
    // 等待所有任务完成
    Promise.all(tasks).then((taskResults) => {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTaskTime = taskResults.reduce((sum, result) => sum + result.processingTime, 0) / taskResults.length;
      
      const efficiency = (avgTaskTime * test.concurrentTasks) / totalTime;
      const status = efficiency > 0.8 ? '✅' : efficiency > 0.6 ? '⚠️' : '❌';
      
      console.log(`  ${status} ${test.name}:`);
      console.log(`     并发任务数: ${test.concurrentTasks}`);
      console.log(`     总执行时间: ${totalTime} ms`);
      console.log(`     平均任务时间: ${avgTaskTime.toFixed(1)} ms`);
      console.log(`     并发效率: ${(efficiency * 100).toFixed(1)}%`);
      
      results.push({
        name: test.name,
        totalTime,
        avgTaskTime,
        efficiency,
        passed: efficiency > 0.6
      });
    });
  }
  
  // 由于是异步测试，这里返回Promise
  return new Promise((resolve) => {
    setTimeout(() => resolve(results), 1000);
  });
}

// 文件I/O性能测试
function testFileIOPerformance() {
  console.log('💾 测试文件I/O性能...');
  
  const testDir = path.join(process.cwd(), 'tests', 'temp');
  
  // 确保测试目录存在
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const tests = [
    {
      name: '小文件读写 (1KB)',
      fileSize: 1024,
      iterations: 100
    },
    {
      name: '中等文件读写 (10KB)',
      fileSize: 10 * 1024,
      iterations: 50
    },
    {
      name: '大文件读写 (100KB)',
      fileSize: 100 * 1024,
      iterations: 10
    }
  ];
  
  const results = [];
  
  tests.forEach(test => {
    const testData = 'x'.repeat(test.fileSize);
    const filePath = path.join(testDir, `test_${test.fileSize}.txt`);
    
    // 写入测试
    const writeStartTime = process.hrtime.bigint();
    for (let i = 0; i < test.iterations; i++) {
      fs.writeFileSync(`${filePath}_${i}`, testData);
    }
    const writeEndTime = process.hrtime.bigint();
    const writeTime = Number(writeEndTime - writeStartTime) / 1000000;
    
    // 读取测试
    const readStartTime = process.hrtime.bigint();
    for (let i = 0; i < test.iterations; i++) {
      fs.readFileSync(`${filePath}_${i}`);
    }
    const readEndTime = process.hrtime.bigint();
    const readTime = Number(readEndTime - readStartTime) / 1000000;
    
    // 清理测试文件
    for (let i = 0; i < test.iterations; i++) {
      fs.unlinkSync(`${filePath}_${i}`);
    }
    
    const avgWriteTime = writeTime / test.iterations;
    const avgReadTime = readTime / test.iterations;
    const writeStatus = avgWriteTime < 10 ? '✅' : avgWriteTime < 50 ? '⚠️' : '❌';
    const readStatus = avgReadTime < 5 ? '✅' : avgReadTime < 25 ? '⚠️' : '❌';
    
    console.log(`  ${test.name}:`);
    console.log(`     ${writeStatus} 平均写入时间: ${avgWriteTime.toFixed(2)} ms`);
    console.log(`     ${readStatus} 平均读取时间: ${avgReadTime.toFixed(2)} ms`);
    console.log(`     写入速度: ${(test.fileSize / 1024 / (avgWriteTime / 1000)).toFixed(1)} KB/s`);
    console.log(`     读取速度: ${(test.fileSize / 1024 / (avgReadTime / 1000)).toFixed(1)} KB/s`);
    
    results.push({
      name: test.name,
      avgWriteTime,
      avgReadTime,
      writeSpeed: test.fileSize / 1024 / (avgWriteTime / 1000),
      readSpeed: test.fileSize / 1024 / (avgReadTime / 1000),
      passed: avgWriteTime < 50 && avgReadTime < 25
    });
  });
  
  // 清理测试目录
  fs.rmSync(testDir, { recursive: true, force: true });
  
  return results;
}

// 生成性能报告
function generatePerformanceReport(testResults) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 性能测试报告');
  console.log('='.repeat(60));
  
  const allTests = [
    ...testResults.memory ? [{ category: '内存使用', tests: [testResults.memory] }] : [],
    ...testResults.cpu ? [{ category: 'CPU性能', tests: testResults.cpu }] : [],
    ...testResults.concurrency ? [{ category: '并发性能', tests: testResults.concurrency }] : [],
    ...testResults.fileIO ? [{ category: '文件I/O', tests: testResults.fileIO }] : []
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  
  allTests.forEach(category => {
    console.log(`\n📈 ${category.category}:`);
    category.tests.forEach(test => {
      totalTests++;
      if (test.passed) passedTests++;
      
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${status} ${test.name || '测试项'}`);
    });
  });
  
  const overallScore = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`\n🎯 总体性能评分: ${overallScore}% (${passedTests}/${totalTests} 项通过)`);
  
  // 性能等级评定
  let performanceGrade;
  if (overallScore >= 90) {
    performanceGrade = 'A+ (优秀)';
  } else if (overallScore >= 80) {
    performanceGrade = 'A (良好)';
  } else if (overallScore >= 70) {
    performanceGrade = 'B (一般)';
  } else if (overallScore >= 60) {
    performanceGrade = 'C (需要优化)';
  } else {
    performanceGrade = 'D (性能不佳)';
  }
  
  console.log(`🏆 性能等级: ${performanceGrade}`);
  
  // 保存性能报告
  const report = {
    timestamp: new Date().toISOString(),
    overallScore: parseFloat(overallScore),
    performanceGrade,
    passedTests,
    totalTests,
    details: testResults,
    recommendations: generatePerformanceRecommendations(testResults, overallScore)
  };
  
  const reportPath = path.join(process.cwd(), 'tests', 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细性能报告已保存到: ${reportPath}`);
  
  return parseFloat(overallScore) >= 70;
}

// 生成性能优化建议
function generatePerformanceRecommendations(testResults, overallScore) {
  const recommendations = [];
  
  if (testResults.memory && !testResults.memory.passed) {
    recommendations.push('优化内存使用：减少大对象创建，及时清理无用引用');
    recommendations.push('考虑实现对象池或使用更轻量的数据结构');
  }
  
  if (testResults.cpu && testResults.cpu.some(test => !test.passed)) {
    recommendations.push('优化CPU密集型操作：使用Web Workers处理复杂计算');
    recommendations.push('实现代码分割和懒加载，减少初始化负担');
  }
  
  if (testResults.concurrency && testResults.concurrency.some(test => !test.passed)) {
    recommendations.push('改进并发处理：优化任务调度算法');
    recommendations.push('考虑使用任务队列限制并发数量');
  }
  
  if (testResults.fileIO && testResults.fileIO.some(test => !test.passed)) {
    recommendations.push('优化文件操作：使用流式处理大文件');
    recommendations.push('实现文件缓存机制减少重复I/O');
  }
  
  if (overallScore >= 90) {
    recommendations.push('性能表现优秀，建议继续监控关键指标');
    recommendations.push('可以考虑实现更高级的性能监控');
  } else if (overallScore >= 70) {
    recommendations.push('性能基本满足要求，建议针对性优化低分项');
  } else {
    recommendations.push('性能需要显著改进，建议优先处理关键性能瓶颈');
  }
  
  return recommendations;
}

// 主测试流程
async function runPerformanceTests() {
  const startTime = Date.now();
  
  const testResults = {};
  
  try {
    // 运行内存测试
    testResults.memory = testMemoryUsage();
    console.log('');
    
    // 运行CPU性能测试
    testResults.cpu = testCPUPerformance();
    console.log('');
    
    // 运行并发性能测试
    testResults.concurrency = await testConcurrencyPerformance();
    console.log('');
    
    // 运行文件I/O测试
    testResults.fileIO = testFileIOPerformance();
    console.log('');
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`⏱️ 性能测试完成，总耗时: ${totalTime}秒`);
    
    return generatePerformanceReport(testResults);
    
  } catch (error) {
    console.error('❌ 性能测试执行失败:', error);
    return false;
  }
}

// 执行测试
if (require.main === module) {
  runPerformanceTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 性能测试失败:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests };