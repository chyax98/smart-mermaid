/**
 * Mermaid图表模板库
 * 包含常用的各类图表模板
 */

export const templates = {
  flowchart: [
    {
      id: 'basic-flow',
      name: '基础流程图',
      icon: '📊',
      description: '简单的判断流程',
      tags: ['基础', '判断', '流程'],
      code: `graph TD
    A[开始] --> B{判断条件}
    B -->|条件1| C[操作1]
    B -->|条件2| D[操作2]
    C --> E[结束]
    D --> E`
    },
    {
      id: 'complex-flow',
      name: '复杂流程图',
      icon: '🔀',
      description: '包含多个判断和循环的流程',
      tags: ['复杂', '循环', '多分支'],
      code: `graph TB
    Start([开始]) --> Input[/输入数据/]
    Input --> Process[处理数据]
    Process --> Decision{数据有效?}
    Decision -->|是| Save[(保存到数据库)]
    Decision -->|否| Error[显示错误]
    Save --> Next{继续处理?}
    Next -->|是| Input
    Next -->|否| End([结束])
    Error --> End`
    },
    {
      id: 'swimlane-flow',
      name: '泳道流程图',
      icon: '🏊',
      description: '多角色协作流程',
      tags: ['协作', '角色', '泳道'],
      code: `graph TD
    subgraph 用户
        A[提交申请] --> B[等待审批]
    end
    subgraph 管理员
        C[接收申请] --> D{审核}
        D -->|批准| E[发送通知]
        D -->|拒绝| F[返回修改]
    end
    subgraph 系统
        G[记录日志] --> H[更新状态]
    end
    A --> C
    E --> B
    F --> B
    D --> G
    E --> H`
    }
  ],
  
  sequence: [
    {
      id: 'basic-seq',
      name: '基础时序图',
      icon: '📝',
      description: '简单的请求响应',
      tags: ['基础', '请求', '响应'],
      code: `sequenceDiagram
    participant U as 用户
    participant S as 服务器
    participant D as 数据库
    
    U->>S: 发送请求
    S->>D: 查询数据
    D-->>S: 返回结果
    S-->>U: 返回响应`
    },
    {
      id: 'auth-seq',
      name: '认证流程',
      icon: '🔐',
      description: '用户登录认证流程',
      tags: ['认证', '登录', '安全'],
      code: `sequenceDiagram
    participant U as 用户
    participant C as 客户端
    participant S as 认证服务器
    participant R as 资源服务器
    
    U->>C: 输入用户名密码
    C->>S: 发送认证请求
    alt 认证成功
        S-->>C: 返回Token
        C->>R: 携带Token请求资源
        R-->>C: 返回资源
        C-->>U: 显示内容
    else 认证失败
        S-->>C: 返回错误
        C-->>U: 显示错误信息
    end`
    },
    {
      id: 'async-seq',
      name: '异步调用',
      icon: '⚡',
      description: '异步消息处理流程',
      tags: ['异步', '消息队列', '并发'],
      code: `sequenceDiagram
    participant C as 客户端
    participant S as 服务器
    participant Q as 消息队列
    participant W as 工作进程
    
    C->>S: 提交任务
    S->>Q: 推送任务到队列
    S-->>C: 返回任务ID
    
    Note over Q,W: 异步处理
    
    Q->>W: 分配任务
    W->>W: 处理任务
    W->>S: 更新任务状态
    
    C->>S: 查询任务状态
    S-->>C: 返回处理结果`
    }
  ],
  
  classDiagram: [
    {
      id: 'basic-class',
      name: '基础类图',
      icon: '📦',
      description: '简单的继承关系',
      tags: ['基础', '继承', 'OOP'],
      code: `classDiagram
    class Animal {
        +String name
        +int age
        +eat() void
        +sleep() void
    }
    
    class Dog {
        +String breed
        +bark() void
    }
    
    class Cat {
        +String color
        +meow() void
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`
    },
    {
      id: 'design-pattern',
      name: '设计模式',
      icon: '🎨',
      description: '观察者模式示例',
      tags: ['设计模式', '观察者', '高级'],
      code: `classDiagram
    class Subject {
        <<interface>>
        +attach(Observer)
        +detach(Observer)
        +notify()
    }
    
    class ConcreteSubject {
        -state: String
        -observers: List~Observer~
        +getState() String
        +setState(String)
    }
    
    class Observer {
        <<interface>>
        +update()
    }
    
    class ConcreteObserver {
        -subject: Subject
        -observerState: String
        +update()
    }
    
    Subject <|.. ConcreteSubject
    Observer <|.. ConcreteObserver
    ConcreteSubject o-- Observer : notifies
    ConcreteObserver --> ConcreteSubject : observes`
    },
    {
      id: 'mvc-pattern',
      name: 'MVC架构',
      icon: '🏗️',
      description: 'MVC设计模式',
      tags: ['MVC', '架构', 'Web'],
      code: `classDiagram
    class Model {
        -data: Object
        +getData() Object
        +setData(Object)
        +validate() boolean
    }
    
    class View {
        -template: String
        +render(Model)
        +display()
    }
    
    class Controller {
        -model: Model
        -view: View
        +handleRequest()
        +updateModel()
        +updateView()
    }
    
    Controller --> Model : updates
    Controller --> View : updates
    View --> Model : reads
    
    class User {
        +interact()
    }
    
    User --> Controller : uses`
    }
  ],
  
  stateDiagram: [
    {
      id: 'basic-state',
      name: '基础状态图',
      icon: '🔄',
      description: '简单状态转换',
      tags: ['基础', '状态', '转换'],
      code: `stateDiagram-v2
    [*] --> 空闲
    空闲 --> 工作中 : 开始工作
    工作中 --> 暂停 : 暂停
    暂停 --> 工作中 : 继续
    工作中 --> 完成 : 完成工作
    完成 --> [*]`
    },
    {
      id: 'order-state',
      name: '订单状态',
      icon: '📋',
      description: '电商订单状态流转',
      tags: ['电商', '订单', '业务'],
      code: `stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付 : 支付成功
    待支付 --> 已取消 : 取消订单
    待支付 --> 已取消 : 支付超时
    
    已支付 --> 待发货 : 确认订单
    待发货 --> 已发货 : 发货
    已发货 --> 已签收 : 确认收货
    已签收 --> 已完成 : 评价
    
    已签收 --> 退货中 : 申请退货
    退货中 --> 已退货 : 退货成功
    退货中 --> 已签收 : 退货失败
    
    已取消 --> [*]
    已完成 --> [*]
    已退货 --> [*]`
    }
  ],
  
  gantt: [
    {
      id: 'project-gantt',
      name: '项目甘特图',
      icon: '📅',
      description: '项目进度计划',
      tags: ['项目', '计划', '进度'],
      code: `gantt
    title 项目开发计划
    dateFormat YYYY-MM-DD
    section 需求分析
    需求调研           :a1, 2024-01-01, 7d
    需求文档编写       :a2, after a1, 5d
    需求评审           :a3, after a2, 2d
    
    section 设计
    概要设计           :b1, after a3, 5d
    详细设计           :b2, after b1, 7d
    设计评审           :b3, after b2, 2d
    
    section 开发
    前端开发           :c1, after b3, 15d
    后端开发           :c2, after b3, 15d
    接口联调           :c3, after c1, 5d
    
    section 测试
    单元测试           :d1, after c2, 5d
    集成测试           :d2, after c3, 5d
    用户测试           :d3, after d2, 3d
    
    section 部署
    部署准备           :e1, after d3, 2d
    生产部署           :e2, after e1, 1d
    监控调优           :e3, after e2, 3d`
    }
  ],
  
  pie: [
    {
      id: 'basic-pie',
      name: '饼图',
      icon: '🥧',
      description: '数据分布图',
      tags: ['统计', '分布', '占比'],
      code: `pie title 技术栈使用占比
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "Go" : 10
    "其他" : 10`
    }
  ],
  
  erDiagram: [
    {
      id: 'basic-er',
      name: 'ER图',
      icon: '🗄️',
      description: '数据库实体关系',
      tags: ['数据库', 'ER', '关系'],
      code: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    
    USER {
        int id PK
        string username
        string email
        datetime created_at
    }
    
    ORDER {
        int id PK
        int user_id FK
        datetime order_date
        string status
        decimal total_amount
    }
    
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
    
    PRODUCT {
        int id PK
        string name
        string description
        decimal price
        int stock_quantity
    }`
    }
  ],
  
  journey: [
    {
      id: 'user-journey',
      name: '用户旅程',
      icon: '🚶',
      description: '用户体验流程',
      tags: ['用户体验', 'UX', '旅程'],
      code: `journey
    title 用户购物旅程
    section 发现阶段
      浏览首页: 5: 用户
      搜索商品: 4: 用户
      查看推荐: 5: 用户
    section 评估阶段
      查看详情: 4: 用户
      阅读评价: 3: 用户
      比较价格: 3: 用户
    section 购买阶段
      加入购物车: 5: 用户
      填写地址: 3: 用户
      支付订单: 4: 用户
    section 售后阶段
      收到商品: 5: 用户
      确认收货: 5: 用户
      评价商品: 4: 用户`
    }
  ],
  
  gitGraph: [
    {
      id: 'git-flow',
      name: 'Git流程',
      icon: '🌿',
      description: 'Git分支管理',
      tags: ['Git', '版本控制', '分支'],
      code: `gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout develop
    merge feature
    checkout main
    merge develop
    commit`
    }
  ]
};

/**
 * 获取所有模板类别
 */
export function getTemplateCategories() {
  return Object.keys(templates).map(key => ({
    id: key,
    name: getCategoryName(key),
    icon: getCategoryIcon(key),
    count: templates[key].length
  }));
}

/**
 * 获取类别名称
 */
function getCategoryName(category) {
  const names = {
    flowchart: '流程图',
    sequence: '时序图',
    classDiagram: '类图',
    stateDiagram: '状态图',
    gantt: '甘特图',
    pie: '饼图',
    erDiagram: 'ER图',
    journey: '用户旅程',
    gitGraph: 'Git图'
  };
  return names[category] || category;
}

/**
 * 获取类别图标
 */
function getCategoryIcon(category) {
  const icons = {
    flowchart: '📊',
    sequence: '📝',
    classDiagram: '📦',
    stateDiagram: '🔄',
    gantt: '📅',
    pie: '🥧',
    erDiagram: '🗄️',
    journey: '🚶',
    gitGraph: '🌿'
  };
  return icons[category] || '📊';
}

/**
 * 搜索模板
 */
export function searchTemplates(query) {
  if (!query) return [];
  
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  Object.keys(templates).forEach(category => {
    templates[category].forEach(template => {
      if (
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          ...template,
          category,
          categoryName: getCategoryName(category)
        });
      }
    });
  });
  
  return results;
}

/**
 * 获取模板详情
 */
export function getTemplate(category, id) {
  if (!templates[category]) return null;
  return templates[category].find(t => t.id === id);
}

/**
 * 获取随机模板
 */
export function getRandomTemplate() {
  const categories = Object.keys(templates);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const categoryTemplates = templates[randomCategory];
  const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  
  return {
    ...randomTemplate,
    category: randomCategory,
    categoryName: getCategoryName(randomCategory)
  };
}