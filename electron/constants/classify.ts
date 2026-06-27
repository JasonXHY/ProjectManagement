export const FILENAME_HINTS: Record<string, { category: string; subcategory: string }> = {
  '蓝图': { category: '方案', subcategory: '蓝图' },
  '业务蓝图': { category: '方案', subcategory: '蓝图' },
  '开发规格': { category: '方案', subcategory: '开发规格说明书' },
  '技术规格': { category: '方案', subcategory: '开发规格说明书' },
  '接口文档': { category: '方案', subcategory: '开发规格说明书' },
  '操作手册': { category: '上线', subcategory: '操作手册' },
  '用户手册': { category: '上线', subcategory: '操作手册' },
  '测试报告': { category: '测试', subcategory: '测试报告' },
  '测试用例': { category: '测试', subcategory: '测试报告' },
  'SOW': { category: '售前', subcategory: '销售方案' },
  '工作说明书': { category: '售前', subcategory: '销售方案' },
  '实施工作': { category: '售前', subcategory: '销售方案' },
  '物料': { category: '构建', subcategory: '开发文档' },
  'BOM': { category: '构建', subcategory: '开发文档' },
  '数据收集': { category: '构建', subcategory: '开发文档' },
  '环境': { category: '上线', subcategory: '部署文档' },
  '访问信息': { category: '上线', subcategory: '部署文档' },
  '部署': { category: '上线', subcategory: '部署文档' },
  '结算': { category: '方案', subcategory: '开发规格说明书' },
  '差异处理': { category: '方案', subcategory: '开发规格说明书' },
}

export function matchFilenameHints(filename: string): { category: string; subcategory: string } | null {
  const name = filename.toLowerCase()
  for (const [keyword, hint] of Object.entries(FILENAME_HINTS)) {
    if (name.includes(keyword.toLowerCase())) {
      return hint
    }
  }
  return null
}
