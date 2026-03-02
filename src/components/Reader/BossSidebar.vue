<template>
  <aside class="fake-sidebar">
    <div class="fake-sidebar-inner">
       <div v-for="(item, i) in fakeSidebarTasks" :key="i" class="fake-item" :class="{ 'has-title': item.isTitle }">
          <template v-if="item.isTitle">
             <div class="fake-title">{{ item.text }}</div>
          </template>
          <template v-else>
             <div class="fake-dot"></div>
             <div class="fake-text">{{ item.text }}</div>
          </template>
       </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/appStore';

const store = useAppStore();

const fakeSidebarPoolIT = [
    "[TITLE] 最近任务", "更新 API 文档", "修复代码 Lint 错误", "与产品确认需求细节", "准备下周一的周报", 
    "[TITLE] 技术预研", "研究 Vue3 并行渲染逻辑", "Pinia 持久化方案对比", "Vite 编译速度优化", 
    "[TITLE] 项目管理", "检查 JIRA 进行中的任务", "回复邮件列表相关提问", "Code Review: PR #128", 
    "更新 README 部署指南", "重构核心逻辑层", "优化数据库索引", "清理无效依赖项", "编写单元测试用例",
    "同步测试环境数据", "处理客户反馈的 500 错误", "升级后端 Node 版本", "审查第三方包安全性",
    "[TITLE] 待办清单", "提交加班申请单", "报销出差交通费", "整理本地会议记录", "预定下周的会议室",
    "配置 CI/CD 自动部署", "压测大文件读取性能", "修复深色模式样式溢出", "同步 UI 组件库最新规范",
    "与运维确认带宽限额", "更新 API 错误代码表", "撰写系统迁移手册", "调整 Nginx 配置负载均衡",
    "[TITLE] 学习进度", "深入理解 JS 原型链", "Go 语言协程模型初步", "React 19 特兴跟踪",
    "准备内部分享议题", "优化前端首屏加载时间", "重构消息通知聚合服务", "增加日志脱敏处理逻辑",
    "[TITLE] 个人笔记", "记一次生产环境内存泄露", "多端适配关键点记录", "优化正则匹配效率感悟",
    "整理浏览器缓存策略", "检查 SSL 证书过期时间", "导出 Q3 度量报表", "同步内部 Wiki 变更",
    "排查 Redis 缓存命中率", "验证 K8s 服务发现配置", "调研大模型推理加速方案", "优化前端长列表渲染",
    "[TITLE] 其他杂项", "清理桌面多余截图", "格式化移动硬盘数据", "更新 GitHub 个人简介", "确认激活码生成逻辑",
    "处理前端防抖失效 Bug", "配置 Webpack 多态打包", "支持多语言 i18n 翻译", "整合第三方 Auth 服务",
    "移除旧版废弃代码片段", "优化图片资源的 WebP 转换", "验证移动端触控反馈", "调整弹窗组件层级 ID",
    "实现前端多会话持久化", "追踪内存快照中的泄露点", "编写业务异常处理机制", "同步 Git 远程仓库钩子",
    "修复 IE11 的最后一点兼容", "支持本地 TXT 编码自动识别", "封装跨域代理中间件", "重写路由鉴权拦截器",
    "更新依赖包的版本镜像地", "迁移 Sentry 到自建服务器", "调整 Logstash 过滤解析器", "编写 API 压力测试脚本",
    "检查 Docker Compose 网络", "优化 SQL 慢查询注入防御", "实现前端路由守卫逻辑", "封装统一的消息推送接口",
    "整理团队内部技术分享", "分析竞品功能实现原理", "支持前端文件分段上传", "优化多维表导出性能",
    "处理页面 FCP 性能瓶颈", "验证 GraphQL 的查询深度", "同步测试覆盖率到面板", "生成最新的 API Swagger",
    "配置 Prometheus 的告警阈值", "检查 CDN 的缓存穿透问题", "手动部署最新的演示环境"
];

const fakeSidebarPoolGeneral = [
    "[TITLE] 本周重点", "跟进重点客户续约进度", "确认 Q3 营销活动方案", "准备部门周会汇报材料", "汇总各地区销售数据",
    "[TITLE] 审批流程", "处理待生效的费用报销", "审批新员工转正申请", "核对本月供应商付款单", "查看请假审批记录",
    "[TITLE] 项目协同", "跨部门协作沟通群待回复", "安排新供应商线上对接会", "更新产品发布物料进度", "确认运营推广时间节点",
    "收集用户体验调研问卷", "整理客户投诉跟进工单", "跟进法务合同盖章流程", "跟进设计资源输出排期",
    "[TITLE] 知识库建设", "整理上季度复盘文档", "更新入职培训手册", "分享行业竞品分析报告", "归档历史项目资料",
    "编辑部门内部通讯录", "维护常见问题解答库 (FAQ)", "收集团队优秀案例分享", "起草内部操作规范草案",
    "[TITLE] 行政杂项", "预定下周五团队团建场地", "申办公用品采购清单", "协调外部访客接待流", "跟发会议纪要给参会人",
    "确认下月办公场地租赁事宜", "录入新入职员工信息", "排期下半年的消防安全演习", "核对月度考勤异常情况",
    "[TITLE] 个人成长", "阅读《从优秀到卓越》第三章", "学习最新行业合规政策", "预约英语口语陪练课程",
    "整理个人年度 OKR 进度", "准备内部演讲竞聘材料", "查看行业线上研讨会回放", "报名参加管理技能培训班",
    "[TITLE] 财务相关", "核对各项目组预算执行率", "催要待报销的增值税发票", "编制下阶段资金流水预测", "审核季度差旅费用汇总表",
    "对接银行账户信息变更", "整理审计所需文件底稿", "确认税务申报进度", "汇总个人所得税汇算清缴",
    "[TITLE] 其他杂事", "回复未读邮件 12 封", "清理系统桌面临时文件夹", "更新电脑密码及安全问题", "联系 IT 部门维修打印机",
    "预约体检时间", "领取节日福利礼包", "办理门禁卡权限延期", "更换办公室饮水机滤芯"
];

const fakeSidebarPoolDesign = [
    "[TITLE] 设计周报", "完成 3.0 版本 UI 规范初稿", "整理图标库 SVG 规范", "确认移动端适配切图", "回复前端关于间距的疑问",
    "[TITLE] 灵感采集", "收集竞品最新微动效方案", "整理 Dribbble 优秀深色模式案例", "分析 Apple 官网字体层级",
    "[TITLE] 协作文档", "在 Figma 中回复开发标注提议", "更新 PRD 中的交互原型图", "参加下午 2 点的需求评审会",
    "导出 Q4 季度视觉资产", "重构设计系统的颜色变量", "校对 Android 端点击热区", "清理本地 Figma 回收站",
    "[TITLE] 待办清单", "提交 Adobe CC 续费申请", "整理手绘草图到知识库", "预定远程设计同步会", "导出给外包商的任务说明书",
    "校对官网无障碍阅读方案", "整理字体商用授权清单", "起草新产品的品牌视觉方案", "调整弹窗组件的阴影参数",
    "[TITLE] 交互演进", "测试原型在真机上的流程度", "梳理新用户注册流失节点", "优化加载状态的骨骼屏设计",
    "更新全局空状态插画库", "修复 iOS 端导航栏背景模糊", "调整全局圆角由 8px 到 12px", "同步图标组件到研发分支",
    "[TITLE] 竞品分析", "分析飞书 7.0 布局策略", "拆解 Discord 侧边栏交互 logic", "总结 Notion 块编辑器的 UX 核心",
    "整理常见的报错反馈设计模式", "调研沉浸式阅读的翻页动效", "对比国内外金融 App 首页布局", "追踪最新的 Lottie 动画实现方案",
    "[TITLE] 个人成长", "阅读《设计心理学 2》", "学习 Blender 基础建模技巧", "预约周六的线下设计沙龙",
    "整理个人作品集更新记录", "回顾本月设计走查出的重灾区", "查看行业最新的无障碍准则", "报名参加 UI 动效高级特训班"
];

const fakeSidebarTasks = computed(() => {
    let rawItems: string[] = [];
    if (store.settings.fakeSidebarMode === 'custom' && store.settings.fakeSidebarContent) {
        rawItems = store.settings.fakeSidebarContent.split('\n').map(l => l.trim()).filter(l => l);
    } else {
        const novelInfo = (store.activeNovelIndex !== null ? store.novels[store.activeNovelIndex] : null) || { id: 'default' };
        const seedValue = novelInfo.id + (store.fakeSidebarRefreshSeed * 1000);
        const rand = (i: number) => {
            let h = 0;
            const str = seedValue + i;
            for (let j = 0; j < str.length; j++) {
              h = ((h << 5) - h) + str.charCodeAt(j);
              h |= 0;
            }
            const x = Math.sin(h) * 10000;
            return x - Math.floor(x);
        };
        
        let poolToUse = fakeSidebarPoolIT;
        if (store.settings.fakeSidebarMode === 'random_general') poolToUse = fakeSidebarPoolGeneral;
        else if (store.settings.fakeSidebarMode === 'random_design') poolToUse = fakeSidebarPoolDesign;
        
        const shuffled = [...poolToUse].sort((a, b) => rand(poolToUse.indexOf(a)) - 0.5);
        
        let count = store.settings.fakeSidebarItemCount || 15;
        if (store.settings.fakeSidebarAutoAdjustCount) {
            const extra = Math.floor(store.totalPages * 1.5);
            count = Math.min(50, count + extra);
        }
        
        rawItems = shuffled.slice(0, count);
    }

    return rawItems.map(item => ({
        isTitle: item.startsWith('[TITLE] '),
        text: item.replace('[TITLE] ', '')
    }));
});
</script>

<style scoped lang="less">
.fake-sidebar {
  width: 220px;
  border-left: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  user-select: none;
}

.fake-sidebar-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fake-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  
  &.has-title {
    margin-top: 12px;
    margin-bottom: 4px;
    
    &:first-of-type {
      margin-top: 0;
    }
  }
}

.fake-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fake-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--border-color);
  flex-shrink: 0;
}

.fake-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
