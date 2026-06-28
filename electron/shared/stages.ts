// 阶段常量（前后端共用，单一数据源）
// electron 主进程与 renderer 均从此处获取，避免 electron 反向依赖 src/

// 项目阶段（3个：售前、进行中、关闭）— 不可自定义
export const DEFAULT_STAGES = [
  '售前', '进行中', '关闭'
]

/** 文件分类阶段定义：每个阶段含若干子分类（依据业务需求 v3.1 §1.1） */
export interface StageDef {
  name: string
  subcategories: string[]
}

/**
 * 文件分类阶段 + 子分类（单一数据源）
 * 子分类按文档用途划分，严格对照业务需求 v3.1 §1.1 子分类表。
 * 验收阶段区分文件状态：待签 vs 已签。
 */
export const STAGE_DEFINITIONS: StageDef[] = [
  { name: '售前', subcategories: ['销售方案', '报价单', '合同原件', '客户沟通', '成本评估', 'POC材料'] },
  { name: '启动', subcategories: ['项目章程', '团队组建', '启动会议'] },
  { name: '需求', subcategories: ['需求文档', '会议纪要', '需求变更', '客户材料', '项目计划'] },
  { name: '方案', subcategories: ['开发规格说明书', '蓝图', '方案汇报材料', '会议纪要'] },
  { name: '构建', subcategories: ['开发文档', '接口文档', '配置文档'] },
  { name: '测试', subcategories: ['测试用例', '测试报告', '测试数据', '会议纪要'] },
  { name: '上线', subcategories: ['上线切换方案', '部署文档', '操作手册', '签字材料', '初始化材料', '问题清单', '会议纪要'] },
  { name: '验收', subcategories: ['验收材料待签', '验收签字件已签', '验收报告', '项目总结'] },
  { name: '转客户成功', subcategories: ['交接文档', '培训资料', 'FAQ'] },
  { name: '关闭', subcategories: ['项目归档', '复盘总结'] },
]

// 文件分类阶段（10个）— 派生自 STAGE_DEFINITIONS，保持向后兼容
export const FILE_CLASSIFICATION_STAGES = STAGE_DEFINITIONS.map((s) => s.name)

/** 返回指定文件分类阶段的子分类列表；未知阶段返回空数组 */
export function getSubcategories(stageName: string): string[] {
  return STAGE_DEFINITIONS.find((s) => s.name === stageName)?.subcategories ?? []
}

// 阶段推进触发规则（AI阶段判断替代关键词匹配）
export const STAGE_PROGRESSION_RULES = {
  '售前→进行中': {
    from: '售前',
    to: '进行中',
    stages: ['进行中'],
  },
  '进行中→关闭': {
    from: '进行中',
    to: '关闭',
    stages: ['关闭'],
    // 只有这些子分类的文件才触发关闭阶段推进
    triggerSubcategories: ['验收报告', '项目总结', '项目归档', '复盘总结'],
  },
}

/** 检查文件是否触发阶段推进（基于AI识别的文件阶段） */
export function checkStageProgression(
  projectStage: string,
  fileStage: string,
  fileSubcategory?: string | null
): { shouldProgress: boolean; targetStage: string; detectedType: string } | null {
  if (!fileStage) return null

  for (const [, rule] of Object.entries(STAGE_PROGRESSION_RULES)) {
    if (projectStage === rule.from && rule.stages.includes(fileStage)) {
      // 如果规则定义了触发子分类，检查文件子分类是否匹配
      if ('triggerSubcategories' in rule && rule.triggerSubcategories) {
        if (!fileSubcategory || !rule.triggerSubcategories.includes(fileSubcategory)) {
          continue
        }
      }
      return {
        shouldProgress: true,
        targetStage: rule.to,
        detectedType: fileStage,
      }
    }
  }
  return null
}
