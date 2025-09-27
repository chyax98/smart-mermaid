module.exports = {
  apps: [{
    name: 'smart-mermaid',
    script: 'npm',
    args: 'start',
    cwd: '/root/smart-mermaid',
    max_memory_restart: '800M',  // 内存超过800MB自动重启
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // 保持现有域名配置
      HOSTNAME: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Node.js 内存选项
    node_args: '--max-old-space-size=768',  // 限制Node.js堆内存为768MB
    
    // 日志配置
    log_file: '/root/smart-mermaid/logs/combined.log',
    out_file: '/root/smart-mermaid/logs/out.log',
    error_file: '/root/smart-mermaid/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    
    // 监控配置
    min_uptime: '10s',
    max_restarts: 5,
    
    // 性能优化
    exec_mode: 'fork',
    kill_timeout: 1600
  }]
}