// 阶段常量（前后端共用，单一数据源）
// electron 主进程与 renderer 均从此处获取，避免 electron 反向依赖 src/

// 项目阶段（3个：售前、进行中、关闭）— 不可自定义
export const DEFAULT_STAGES = [
  '售前', '进行中', '关闭'
]

// 文件分类阶段（10个）— 可自定义
export const FILE_CLASSIFICATION_STAGES = [
  '售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭'
]
