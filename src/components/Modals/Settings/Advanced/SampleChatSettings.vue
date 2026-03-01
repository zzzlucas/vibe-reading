<template>
  <div class="advanced-sub-group">
    <div class="sub-group-title">
       <icon-material-symbols-history />
       <span>填充对话列表（左侧）</span>
    </div>
    <div class="setting-item no-border">
      <div class="setting-label">
        <div class="label-with-desc">
          <span>快速生成丰富的预设对话列表</span>
          <span class="desc-text">添加占位主题，让左侧记录看起来更充实</span>
        </div>
      </div>
      <div class="setting-control selector-group" style="flex-wrap: wrap; justify-content: flex-end; gap: 8px;">
        <button class="setting-btn" @click="openConfigModal('it')" :disabled="isAddingDummy" style="padding: 6px 10px; font-size: 13px;">
          {{ isAddingDummy ? '生成中...' : '+ IT研发类' }}
        </button>
        <button class="setting-btn" @click="openConfigModal('design')" :disabled="isAddingDummy" style="padding: 6px 10px; font-size: 13px;">
          {{ isAddingDummy ? '生成中...' : '+ 产品设计类' }}
        </button>
        <button class="setting-btn" @click="openConfigModal('general')" :disabled="isAddingDummy" style="padding: 6px 10px; font-size: 13px;">
          {{ isAddingDummy ? '生成中...' : '+ 职场通用类' }}
        </button>
        <button class="setting-btn danger-text" @click="deleteEmptyChats" style="padding: 6px 10px; font-size: 13px; border-color: rgba(234,67,53,0.2)">
          删除所有示例记录
        </button>
      </div>
    </div>

    <!-- 内部设置面板 (自定义 Modal) -->
    <div v-if="showConfigModal" class="config-modal-overlay">
      <div class="config-modal">
        <h3 class="config-title">内容设置</h3>
        
        <div class="config-row">
          <label>本次生成对话条数 (1-20)：</label>
          <input type="number" v-model.number="configCount" class="config-input" min="1" max="20" />
        </div>
        
        <div class="config-row">
          <label>对话内部轮数区间（在区间内随机取轮数）：</label>
          <div class="turns-range-row">
            <input type="number" v-model.number="configTurnsMin" class="config-input range-input" min="1" max="10" placeholder="最小" />
            <span class="range-sep">～</span>
            <input type="number" v-model.number="configTurnsMax" class="config-input range-input" min="1" max="10" placeholder="最大" />
          </div>
        </div>
        
        <div class="config-row" v-if="configType === 'it'">
          <label class="lang-label">技术领域 (影响标题与代码内容)：</label>
          <div class="checkbox-group">
            <label v-for="lang in itLanguages" :key="lang.value" class="check-label">
              <input type="checkbox" v-model="lang.checked" />
              <span>{{ lang.label }}</span>
            </label>
          </div>
        </div>
        
        <div class="config-row" v-if="configType === 'it'">
          <label class="lang-label">代码复杂度：</label>
          <div class="checkbox-group" style="grid-template-columns: repeat(3, 1fr);">
            <label v-for="level in complexityLevels" :key="level.value" class="check-label">
              <input type="radio" v-model="configComplexity" :value="level.value" />
              <span>{{ level.label }}</span>
            </label>
          </div>
        </div>
        
        <div class="config-actions">
          <button class="config-btn cancel" @click="showConfigModal = false">取消</button>
          <button class="config-btn confirm" @click="confirmGenerate" :disabled="isAddingDummy">
            {{ isAddingDummy ? '生成中...' : '确定生成' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/store/appStore';
import { ContentDB } from '@/utils/db';

const store = useAppStore();
const isAddingDummy = ref(false);

const showConfigModal = ref(false);
const configType = ref<'it' | 'general' | 'design'>('it');
const configCount = ref(10);
const configTurnsMin = ref(1);
const configTurnsMax = ref(5);
const configComplexity = ref<'low' | 'medium' | 'high'>('medium');

const complexityLevels = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' }
];

const itLanguages = ref([
  { label: 'JavaScript/Web', value: 'javascript', checked: true },
  { label: 'Go/后端', value: 'go', checked: true },
  { label: 'Rust/底层', value: 'rust', checked: false },
  { label: 'Python/AI', value: 'python', checked: false },
  { label: 'Java/架构', value: 'java', checked: false },
  { label: 'DevOps/运维', value: 'devops', checked: false },
  { label: '安全/加固', value: 'security', checked: false }
]);

const TITLES_BY_LANG: Record<string, string[]> = {
  javascript: [
    "Vue3 组件生命周期与 Composition API", "React 18 并发渲染机制解析", "Webpack 5 到 Vite 的迁移指南", 
    "Node.js 内存泄漏排查技巧", "TypeScript 泛型高级应用场景", "浏览器渲染原理与性能优化", 
    "Micro-frontend 微前端架构原理解析", "响应式系统底层原理解析：从 Proxy 到依赖收集", "现代前端脚手架工具链的工程化实践"
  ],
  go: [
    "Golang 协程与 Channel 通信机制", "基于 Go 的高并发网关架构设计", "K8s Operator 模式开发与 CRD 自定义资源管理",
    "Go 并发场景下的死锁检测与预警系统", "微服务架构下的分布式事务一致性设计", "Nginx 反向代理与负载均衡配置进阶"
  ],
  rust: [
    "Rust 所有权机制与内存安全深度剖析", "基于 Rust 的高性能中间件开发实战", "移动端 WebAssembly 高性能计算落地案例",
    "基于 eBPF 的内核态网络流量观测实践", "Rust 异步运行时 tokio 内部原理解析"
  ],
  python: [
    "大模型 RAG 架构下的知识库向量化检索调优", "深度学习模型在边缘侧的量化与压缩策略", "Python 异步生态 asyncio 源码浅析",
    "Pandas 在 GB 级日志处理中的性能瓶颈", "FastAPI 与 Django 的性能与架构选型对比"
  ],
  java: [
    "JVM 垃圾回收算法演进与 G1 调优", "Spring Boot 核心加载流程与 AOP 应用", "基于 Redis 的分布式锁高可用方案对比",
    "TCP/IP 协议栈与高并发 Netty 实践", "MySQL 索引优化与执行计划分析", "ElasticSearch 倒排索引与全文检索深度拆解",
    "Kafka 副本同步机制与性能吞吐调优", "RocketMQ 消息事务与高可用架构", "MyBatis 缓存机制与 SQL 注入防范"
  ],
  devops: [
    "Docker 容器化部署与镜像精简实践", "Kubernetes 集群资源调度与 HPA 自动扩缩容", "CI/CD 自动化流水线 Jenkins 与 GitLab CI 对比",
    "Terraform IaC 基础设施即代码演进过程", "Prometheus 与 Grafana 全链路监控体系构建", "Service Mesh 网格技术 Istio 核心原理解析"
  ],
  security: [
    "OWASP Top 10 漏洞防护与 Web 安全加固", "零信任架构下的身份验证与动态授权实践", "RSA 与 AES 混合加密算法在敏感数据中的应用",
    "SQL 注入与 XSS 攻击的攻防实战解析", "渗透测试 SOP 流程与合规审计报告撰写", "基于国密算法的身份鉴权体系设计"
  ]
};

const CODE_SNIPPETS_BY_LANG: Record<string, Record<'low'|'medium'|'high', string[]>> = {
  javascript: {
    low: [
      "```javascript\n// 简单的防抖函数实现\nfunction debounce(func, wait) {\n  let timeout;\n  return function(...args) {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func(...args), wait);\n  };\n}\n```"
    ],
    medium: [
      "```javascript\n// 高性能分布式缓存拦截器实现\nconst cacheInterceptor = async (key, fetcher) => {\n  const bloomFilter = await getBloomFilter();\n  if (!bloomFilter.has(key)) return null;\n\n  let data = await cache.get(key);\n  if (!data) {\n    const lock = await acquireLock(`lock:${key}`);\n    try {\n      data = await fetcher();\n      await cache.set(key, data, { ttl: 3600 });\n    } finally {\n      await lock.release();\n    }\n  }\n  return data;\n};\n```"
    ],
    high: [
       "```javascript\n// 基于 MessageChannel 的 React 并发调度模块简述\nconst channel = new MessageChannel();\nconst port = channel.port2;\nlet _workQueue = [];\n\nchannel.port1.onmessage = () => {\n  let deadline = performance.now() + 5;\n  while (_workQueue.length > 0 && performance.now() < deadline) {\n    const task = _workQueue.shift();\n    task();\n  }\n  if (_workQueue.length > 0) port.postMessage(null);\n};\nexport const scheduleTask = (task) => {\n  _workQueue.push(task);\n  port.postMessage(null);\n};\n```"
    ]
  },
  go: {
    low: [
       "```go\n// Go HTTP Server 基础监听\nfunc main() {\n    http.HandleFunc(\"/ping\", func(w http.ResponseWriter, r *http.Request) {\n        fmt.Fprintf(w, \"pong\")\n    })\n    log.Fatal(http.ListenAndServe(\":8080\", nil))\n}\n```"
    ],
    medium: [
      "```go\n// 基于协程池的高并发任务调度核心逻辑\nfunc (p *Pool) worker(id int) {\n    for task := range p.tasks {\n        atomic.AddInt64(&p.running, 1)\n        if err := task.Execute(); err != nil {\n            p.errLog.Printf(\"worker %d: %v\", id, err)\n        }\n        atomic.AddInt64(&p.running, -1)\n    }\n}\n```"
    ],
    high: [
        "```go\n// 无锁环形队列 (Ring Buffer) CAS 推入实现\nfunc (r *RingBuffer) Push(val interface{}) bool {\n    for {\n        tail := atomic.LoadUint64(&r.tail)\n        head := atomic.LoadUint64(&r.head)\n\n        if tail-head >= r.capacity {\n            return false // Queue is full\n        }\n        if atomic.CompareAndSwapUint64(&r.tail, tail, tail+1) {\n            r.buffer[tail%r.capacity] = val\n            return true\n        }\n    }\n}\n```"
    ]
  },
  devops: {
    low: ["```yaml\n# Kubernetes Deployment 基础定义\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx\n```"],
    medium: ["```hcl\n# Terraform 模块定义：AWS S3 Bucket\nresource \"aws_s3_bucket\" \"b\" {\n  bucket = \"my-tf-test-bucket\"\n  acl    = \"private\"\n  tags = {\n    Name        = \"My bucket\"\n    Environment = \"Dev\"\n  }\n}\n```"],
    high: ["```yaml\n# Istio VirtualService 与 DestinationRule 配置\napiVersion: networking.istio.io/v1alpha3\nkind: VirtualService\nmetadata:\n  name: reviews-route\nspec:\n  hosts:\n  - reviews\n  http:\n  - route:\n    - destination:\n        host: reviews\n        subset: v2\n      weight: 25\n    - destination:\n        host: reviews\n        subset: v1\n      weight: 75\n```"]
  },
  security: {
    low: ["```javascript\n// 简单 XSS 防御：HTML 转义\nfunction escapeHTML(str) {\n  return str.replace(/[&<>'\"/]/g, tag => ({\n    '&': '&amp;', '<': '&lt;', '>': '&gt;', \"'\": '&#39;', '\"': '&quot;', '/': '&#x2F;'\n  }[tag]));\n}\n```"],
    medium: ["```python\n# 基于 JWT 的身份验证中间件逻辑\nimport jwt\ndef authenticate_user(token):\n    try:\n        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])\n        return payload['user_id']\n    except jwt.ExpiredSignatureError:\n        return None\n```"],
    high: ["```rust\n// Rust 下的高性能哈希计算 (Argon2)\nuse argon2::{password_hash::{PasswordHasher, SaltString}, Argon2};\nfn hash_password(pwd: &str) -> String {\n    let salt = SaltString::generate(&mut OsRng);\n    let argon2 = Argon2::default();\n    argon2.hash_password(pwd.as_bytes(), &salt).unwrap().to_string()\n}\n```"]
  },
  rust: {
     low: [
       "```rust\n// Rust 读取文件内容并处理 Result\nuse std::fs::File;\nuse std::io::{self, Read};\n\nfn read_file_string(path: &str) -> io::Result<String> {\n    let mut file = File::open(path)?;\n    let mut contents = String::new();\n    file.read_to_string(&mut contents)?;\n    Ok(contents)\n}\n```"
     ],
     medium: [
       "```rust\n// Rust 零拷贝内存管理示例\nimpl MemoryPool {\n    pub fn allocate(&mut self, size: usize) -> Result<*mut u8, Error> {\n        if let Some(block) = self.find_free_block(size) {\n            block.mark_used();\n            Ok(block.as_ptr())\n        } else {\n            self.expand_and_allocate(size)\n        }\n    }\n}\n```"
     ],
     high: [
       "```rust\n// 基于 Tokio 底层 epoll 的自定义 Future 实现\nuse std::task::{Context, Poll};\nuse std::future::Future;\nuse std::pin::Pin;\n\nstruct AsyncIoOp { fd: i32 }\nimpl Future for AsyncIoOp {\n    type Output = Result<usize, std::io::Error>;\n    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {\n        match unsafe { libc::read(self.fd, buf, len) } {\n            -1 => if unsafe { *libc::__errno_location() } == libc::EAGAIN {\n                cx.waker().wake_by_ref();\n                Poll::Pending\n            } else {\n                Poll::Ready(Err(std::io::Error::last_os_error()))\n            },\n            n => Poll::Ready(Ok(n as usize))\n        }\n    }\n}\n```"
     ]
  },
  python: {
    low: [
       "```python\n# 列表推导式与基础字典排序\nrecords = [{'id': 1, 'score': 90}, {'id': 2, 'score': 85}, {'id': 3, 'score': 95}]\nsorted_records = sorted(records, key=lambda x: x['score'], reverse=True)\ntop_ids = [r['id'] for r in sorted_records[:2]]\n```"
    ],
    medium: [
      "```python\n# 异步协程池控制大规模请求并发量\nimport asyncio\n\nasync def bound_fetch(sem, url, session):\n    async with sem:\n        return await fetch(url, session)\n\nasync def gather_with_concurrency(n, *tasks):\n    semaphore = asyncio.Semaphore(n)\n    return await asyncio.gather(*(bound_fetch(semaphore, t, session) for t in tasks))\n```"
    ],
    high: [
       "```python\n# PyTorch 核心：自定义前向与后向传播算子 (Autograd Function)\nimport torch\nclass Exp(torch.autograd.Function):\n    @staticmethod\n    def forward(ctx, i):\n        result = i.exp()\n        ctx.save_for_backward(result)\n        return result\n\n    @staticmethod\n    def backward(ctx, grad_output):\n        result, = ctx.saved_tensors\n        return grad_output * result\n```"
    ]
  },
  java: {
    low: [
       "```java\n// Java Stream API 数据过滤与聚合\nList<String> validNames = users.stream()\n    .filter(u -> u.isActive() && u.getAge() > 18)\n    .map(User::getName)\n    .sorted()\n    .collect(Collectors.toList());\n```"
    ],
    medium: [
      "```java\n// AQS 锁核心调度逻辑实现\npublic final void acquireSharedInterruptibly(int arg) throws InterruptedException {\n    if (Thread.interrupted())\n        throw new InterruptedException();\n    if (tryAcquireShared(arg) < 0)\n        doAcquireSharedInterruptibly(arg);\n}\n```"
    ],
    high: [
       "```java\n// Netty 内存池分配器 (PooledByteBufAllocator) 核心结构简述\nprotected ByteBuf newDirectBuffer(int initialCapacity, int maxCapacity) {\n    PoolThreadCache cache = threadCache.get();\n    PoolArena<ByteBuffer> directArena = cache.directArena;\n\n    ByteBuf buf;\n    if (directArena != null) {\n        buf = directArena.allocate(cache, initialCapacity, maxCapacity);\n    } else {\n        buf = PlatformDependent.hasUnsafe() ? \n                UnsafeByteBufUtil.newUnsafeDirectByteBuf(alloc, initialCapacity, maxCapacity) : \n                new UnpooledDirectByteBuf(alloc, initialCapacity, maxCapacity);\n    }\n    return toLeakAwareBuffer(buf);\n}\n```"
    ]
  }
};

const DUMMY_TITLES_GENERAL = [
  "Q3 季度营销增长策划案初稿", "关于优化新员工入职流程的建议", "竞品分析报告：市场份额与用户画像", 
  "年度总结大会演讲 PPT 大纲", "如何撰写爆款公众号推文", "产品需求文档 (PRD) 模板分享", 
  "跨部门沟通协作技巧与难点", "客户留存率提升方案探讨", "商务谈判技巧与经典案例分析", 
  "周报日报自动生成提示词", "OKR 目标制定与关键结果对齐", "危机公关处理预案与声明",
  "ToB 获客渠道盘点与转化率", "Figma 设计稿切图与标注", "UI/UX 设计规范与用户体验",
  "跨平台协同开发文档同步机制", "企业级云原生成熟度评估模型", "敏捷开发 Scrum Master 每日站会指南",
  "基于 AI Agent 的知识库智能问答系统构建", "全球业务部署中的低延迟加速方案", "企业级私有化大模型微调数据合规方案"
];

const DUMMY_TITLES_DESIGN = [
  "移动端交互设计规范 v3.0", "关于提升 B 端系统操作效率的设计提案", "竞品 UI 设计风格演进分析", 
  "从视觉直觉到品牌调性的色彩心理学应用", "Figma 变量 (Variables) 在设计系统中的进阶用法", 
  "如何通过微动效提升用户的认知体验", "设计稿转代码 (Design to Code) 的自动化链路探索",
  "无障碍设计 (Accessibility) 的实施准则与 Checklists", "针对银发人群的适老化改造设计方案"
];

const DUMMY_CONTENT_TEMPLATES = [
  `针对您询问的关于 “{{title}}” 的问题，我已经整理了以下核心要点、深度技术解析及未来演进趋势：\n\n### 一、 核心概念与架构逻辑\n在现代工程实践中，深刻理解 “{{title}}” 的底层逻辑是构建稳定系统的基石。通常我们需要从以下三个关键维度进行拆解：\n\n1. **设计哲学（Design Philosophy）**：任何成熟的方案都有其特定的权衡。我们需要关注其在 CAP 定理中的偏移，以及对资源利用率和吞吐量的优先级考虑。\n2. **执行模型（Execution Model）**：深入分析其在内存分配、线程绑定以及 IO 复用方面的表现。现代高并发系统倾向于减少上下文切换的开销，采用无锁队列或协程模型来提升处理极限。\n3. **扩展性边界（Scalability Boundaries）**：在业务逻辑增长到原始设计的 10 倍甚至 100 倍时，我们需要识别潜在的单点故障和性能瓶颈。\n\n### 二、 常见挑战与工程规避方案\n在落地过程中，工程师经常容易在以下场景遇到由于复杂性带来的“隐形陷阱”：\n\n- **状态同步不一致**：多节点间的竞态条件（Race Condition）是导致脏数据的元凶。建议通过版本号控制（Optimistic Locking）或分布式共识算法来确保原子性。\n- **异常传递与熔断隔离**：当下游服务出现雪崩时，缺乏保护机制会导致全局资源耗尽。实现严格的断路器（Circuit Breaker）模式是保障韧性的关键。\n\n### 三、 进阶优化方案与生产建议\n当基础功能稳定后，为了进一步压榨性能红利，建议考虑以下方向：\n\n- **预处理与 JIT 思想**：对于高频访问的逻辑，可以通过静态编译或预热缓存来消除首次响应的延迟。\n- **自适应策略平衡**：根据实时的流量波动，动态调整线程池参数或流控策略。\n\n如果您需要针对某个具体生产环境的调优脚本或详细的失败案例复盘报告，请进一步详细描述您的场景。`,
  
  `关于 “{{title}}” 的深入业务探讨与多维分析：\n\n从目前的行业动态和工程趋势来看，这不仅是一个孤立的技术/业务点，更是一套需要全局协同的方法论体系。我们通常将其深度演进分为以下核心阶段：\n\n1. **初始探索与原型期（Foundational Phase）**：\n此阶段关注核心链路的打通，快速验证逻辑可行性。此时“代码的可读性”和“架构的灵活性”比极端的性能预优化更重要。避免在这个阶段引入过度的抽象。\n\n2. **快速增长与压力期（Scale-up Phase）**：\n随着规模的提升，原本被掩盖的副作用会集中爆发。此时需要引入高频读取的分布式缓存、读写分离以及敏感数据的切割。同时，完善的灰度发布流程是防止故障扩大的安全网。\n\n3. **成熟稳定与治理期（Governance Phase）**：\n进入精细化运营，关注成本审计与架构治理。通过减少冗余调用、压缩冷热数据存储以及优化关键路径的代码逻辑来降低整体 TCO。\n\n在此过程中，保持文档的实时动态更新（Living Docs）和跨部门的高效沟通是减少信息衰减的关键。希望这些深度的行业洞察能为您带来新的启发。`,
  
  `我已经为您检索并系统性地总结了 “{{title}}” 的实施路线图、风险矩阵与最佳实践指南：\n\n### 关键组件架构设计与分工逻辑\n一个健壮的实施方案通常由以下互补的模块构成，每个模块都有其明确的边界与职责：\n\n- **感知与采集层（Ingestion Layer）**: 负责多源数据的实时摄入、格式校验与初步清洗，是整个流程的“入口”。必须具备极高的容错性。\n- **处理引擎层（Processing Engine）**: 核心黑盒，基于预设算法/策略进行计算分析。它是将“原材料”转化为“有价值产出”的最关键环节。\n- **反馈与持久化层（Sink Layer）**: 提供直观的数据可视化、告警触发以及结果的可靠存储。确保每一条处理路径都有迹可循。\n\n### 核心风险评估与韧性增强策略\n在实施 “{{title}}” 过程中，我们识别了以下几个高等级风险点，并给出了对应的防御工事：\n\n| 风险点 | 影响程度 | 缓解措施 |\n| :--- | :--- | :--- |\n| **单点瓶颈（Bottleneck）** | 极高 | 引入自动伸缩机制与负载均衡算法，消除单节点的物理极限。 |\n| **级联故障（Cascading Failure）** | 高 | 实施全量的超时控制与隔离，防止局部错误污染全局环境。 |\n| **数据完整性漂移（Data Drift）** | 中 | 建立实时的校验流水线（Validation Pipeline），约束检查。 |\n\n### 总结与行动指南\n我们建议首先在小范围内启动试点（PoC），通过收集真实环境的反馈数据来迭代调整策略。不要试图一步到位地解决所有场景，而是采用“迭代演进”的方式逐步扩大覆盖面。`,

  `针对您刚才提出的关于 “{{title}}” 的深层考量，我从跨职能协同与生命周期管理的视角补充了以下专业见解：\n\n**1. 价值锚点与商业对齐**\n所有的技术选型最终都要锚定商业价值。我们需要明确 “{{title}}” 能在多大程度上降低运营成本或提升用户留存。建议通过定期的 Value Stream Mapping 来量化其产出。\n\n**2. 组织惯性与文化韧性**\n方案的成功 30% 靠工具，70% 靠组织文化的适配。在推进 “{{title}}” 时，团队需要从“被动响应”转变为“主动预测”，这需要一套完整的赋能计划和激励机制。\n\n**3. 全球化合规与长效治理**\n在跨地域部署时，数据隐私（如 GDPR/CCPA）及主权合规是不容触碰的底线。我们必须实现 “{{title}}” 的细粒度权限管控和审计日志闭环，确保系统在合规的前提下高效流转。\n\n您可以根据当前项目的具体优先级，选择其中的 1-2 个维度先行深钻。`
];

const DUMMY_IT_QUESTIONS = [
  "你能深入讲解一下 {{title}} 的核心架构和设计哲学吗？",
  "对于 {{title}}，在生产环境落地时有哪些常见的坑需要规避？",
  "我想了解一下 {{title}} 状态一致性和性能优化这块的进阶方案。",
  "如果我们要把 {{title}} 架构治理标准化，你有什么行动指南吗？",
  "请提供一个关于 {{title}} 的高可用部署架构图或者是逻辑拆解。",
  "针对 {{title}} 的并发瓶颈，有没有什么深度调优的实战经验分享？",
  "在微服务环境下，{{title}} 是如何处理分布式上下文追踪的？",
  "如果系统压力瞬间暴增 10 倍，{{title}} 的韧性架构该如何设计？"
];

const DUMMY_GENERAL_QUESTIONS = [
  "关于 {{title}}，我们需要在 Q3 规划中重点关注哪些里程碑？",
  "针对目前业务团队反馈的 {{title}} 痛点，你有什么具体的改进方案建议？",
  "如果我们要向上级汇报 {{title}} 的进展，该如何通过数据展现核心价值？",
  "我想建立一套关于 {{title}} 的跨部门协作标准流程，帮我列出 Checklist。",
  "请帮我分析一下 {{title}} 在目前市场环境下的关键竞争优势和潜在威胁。"
];

const DUMMY_DESIGN_QUESTIONS = [
  "你能基于目前的 {{title}} 方案，梳理一下核心的交互链路吗？",
  "对于 {{title}} 的视觉风格，如何确保其与品牌基因（Brand Identity）保持高度一致？",
  "在进行 {{title}} 的适老化或无障碍改造时，有哪些必须遵守的行业标准？",
  "请对比一下目前主流竞品在 {{title}} 这一功能模块上的设计差异点。",
  "如果我们要为 {{title}} 增加一组情感化交互设计，你有什么具体的创意方向建议？"
];

function openConfigModal(type: 'it' | 'general' | 'design') {
  configType.value = type;
  showConfigModal.value = true;
}

async function confirmGenerate() {
  if (configCount.value < 1 || configCount.value > 20) {
    store.showToast('生成条数需在 1-20 之间');
    return;
  }
  const minT = configTurnsMin.value;
  const maxT = configTurnsMax.value;
  if (minT < 1 || maxT > 10 || minT > maxT) {
    store.showToast('轮数区间不合法，请确认最小值 ≥1、最大值 ≤10 且最小值 ≤ 最大值');
    return;
  }

  const numToAdd = configCount.value;
  // turns will be randomized per dialog
  const type = configType.value;

  isAddingDummy.value = true;
  showConfigModal.value = false;

  try {
    let sourceArr: string[] = [];
    let codeSnippets: string[] = [];

    if (type === 'it') {
      const selectedLangs = itLanguages.value.filter(l => l.checked).map(l => l.value);
      if (selectedLangs.length === 0) {
        store.showToast('IT 研发类至少需要勾选一门语言');
        isAddingDummy.value = false;
        return;
      }
      for (const lang of selectedLangs) {
        if (TITLES_BY_LANG[lang]) sourceArr.push(...TITLES_BY_LANG[lang]);
        if (CODE_SNIPPETS_BY_LANG[lang] && CODE_SNIPPETS_BY_LANG[lang][configComplexity.value]) {
          codeSnippets.push(...CODE_SNIPPETS_BY_LANG[lang][configComplexity.value]);
        }
      }
    } else if (type === 'design') {
      sourceArr = [...DUMMY_TITLES_DESIGN];
    } else {
      sourceArr = [...DUMMY_TITLES_GENERAL];
    }
    
    const questionsArr = type === 'it' ? DUMMY_IT_QUESTIONS : (type === 'design' ? DUMMY_DESIGN_QUESTIONS : DUMMY_GENERAL_QUESTIONS);
    
    const shuffled = [...sourceArr].sort(() => 0.5 - Math.random());
    // Fallback if not enough titles
    while(shuffled.length < numToAdd) {
      shuffled.push(...sourceArr);
    }
    let selected = shuffled.slice(0, numToAdd);
    
    // 防重复：过滤掉已存在同名 displayName 的 dummy 对话
    const existingTitles = new Set(
      store.novels
        .filter(n => n.name.startsWith('dummy_'))
        .map(n => n.displayName)
    );
    const deduped = selected.filter(t => !existingTitles.has(t));
    if (deduped.length === 0) {
      store.showToast('所选标题已全部存在，没有新增内容');
      isAddingDummy.value = false;
      return;
    }
    if (deduped.length < selected.length) {
      store.showToast(`已跳过 ${selected.length - deduped.length} 个重复标题`);
    }
    selected = deduped;
    
    for (const title of selected) {
      const filename = `dummy_${Date.now()}_${Math.floor(Math.random()*1000)}.txt`;
      
      let fullContent = '';
      const turnQuestions = [...questionsArr].sort(() => 0.5 - Math.random());

      // Randomize turns within [minT, maxT] for each dialog
      const turns = Math.floor(Math.random() * (maxT - minT + 1)) + minT;
      for (let i = 0; i < turns; i++) {
        const template = DUMMY_CONTENT_TEMPLATES[Math.floor(Math.random() * DUMMY_CONTENT_TEMPLATES.length)];
        const questionTemplate = turnQuestions[i % turnQuestions.length];
        const question = questionTemplate.replace(/{{title}}/g, title);
        
        let response = template.replace(/{{title}}/g, title);
        
        if (type === 'it' && codeSnippets.length > 0 && Math.random() > 0.4) {
          const codeSnippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
          const insertMarkers = ['### 二、 常见挑战', '### 二、 代码实现示例', '### 核心风险评估', '2. **快速增长'];
          let inserted = false;
          
          for (const marker of insertMarkers) {
            if (response.includes(marker)) {
              response = response.replace(marker, `### 二、 代码实现示例\n\n${codeSnippet}\n\n${marker}`);
              inserted = true;
              break;
            }
          }
          
          if (!inserted) {
            response += `\n\n### 技术实现参考\n\n${codeSnippet}`;
          }
        }

        const roundContent = `[USER]: ${question}\n\n${response}`;
        fullContent += roundContent;
        
        if (i < turns - 1) {
          fullContent += "\n\n[PAGE_BREAK]\n\n";
        }
      }
      
      const newId = store.generateUid();
      const bytesLength = new Blob([fullContent]).size;
      await ContentDB.save(newId, fullContent, 'fake', filename);
      store.novels.unshift({
        id: newId,
        type: 'fake',
        name: filename,
        size: bytesLength,
        lastRead: Date.now() - Math.floor(Math.random()*10000000),
        currentPage: 0,
        displayName: title
      });
    }
    
    store._saveNovelsMeta();
    store.showToast(`成功添加了 ${numToAdd} 条示例对话 (${minT === maxT ? minT : minT + '~' + maxT} 轮/条随机)`);
  } catch(e) {
    store.showToast('生成对话失败');
  } finally {
    isAddingDummy.value = false;
  }
}

async function deleteEmptyChats() {
  const dummyNovels = store.novels.filter(n => n.type === 'fake');
  if (dummyNovels.length === 0) {
    store.showToast('没有找到可删除的示例记录');
    return;
  }

  const confirmed = await store.confirmDialog(`确定要删除所有 ${dummyNovels.length} 条生成的示例对话吗？`, '批量删除');
  if (confirmed) {
    for (const novel of dummyNovels) {
      await ContentDB.delete(novel.id);
    }
    store.novels = store.novels.filter(n => n.type !== 'fake');
    store._saveNovelsMeta();
    store.showToast(`已清空 ${dummyNovels.length} 条示例记录`);
    
    if (store.activeNovelIndex !== null) {
      const activeNovel = store.novels[store.activeNovelIndex];
      if (!activeNovel) {
        store.activeId = null;
      }
    }
  }
}
</script>

<style scoped>
.config-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}
.config-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 380px;
  max-width: 90%;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.config-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.config-row {
  margin-bottom: 16px;
}
.config-row label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.lang-label {
  margin-bottom: 12px;
}
.config-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
}
.config-input:focus {
  outline: none;
  border-color: var(--text-secondary);
}
.turns-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.range-input {
  flex: 1;
}
.range-sep {
  font-size: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}
.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.config-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}
.config-btn.cancel {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}
.config-btn.cancel:hover {
  background: var(--bg-primary);
}
.config-btn.confirm {
  background: var(--text-primary);
  color: var(--bg-primary);
}
.config-btn.confirm:hover {
  opacity: 0.9;
}
.config-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
