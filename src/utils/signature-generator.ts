import { SignatureDoc } from '../types'

// 签字文件模板库
const SIGNATURE_TEMPLATES: Record<string, { name: string; category: string }[]> = {
  // A档（50万以上）必选文件
  A: [
    { name: '合同原件', category: '售前' },
    { name: '补充协议', category: '售前' },
    { name: '开工报告', category: '启动' },
    { name: '需求规格说明书确认单', category: '需求' },
    { name: '业务蓝图确认单', category: '方案' },
    { name: '开发需求设计确认单', category: '方案' },
    { name: '开发完成确认单', category: '构建' },
    { name: '测试用例确认单', category: '测试' },
    { name: '测试报告确认单', category: '测试' },
    { name: '上线确认单', category: '上线' },
    { name: '验收确认单', category: '验收' },
    { name: '项目结项报告', category: '关闭' },
    { name: '培训确认单', category: '验收' },
    { name: '运维交接确认单', category: '转客户成功' },
    { name: '质量评估表', category: '验收' },
    { name: '客户满意度调查表', category: '关闭' },
    { name: '付款申请单-首付款', category: '售前' },
    { name: '付款申请单-进度款', category: '上线' },
    { name: '付款申请单-尾款', category: '验收' },
  ],
  // B档（10-50万）必选文件
  B: [
    { name: '合同原件', category: '售前' },
    { name: '需求规格说明书确认单', category: '需求' },
    { name: '业务蓝图确认单', category: '方案' },
    { name: '开发需求设计确认单', category: '方案' },
    { name: '开发完成确认单', category: '构建' },
    { name: '上线确认单', category: '上线' },
    { name: '验收确认单', category: '验收' },
    { name: '付款申请单', category: '验收' },
  ],
  // C档（<10万）必选文件
  C: [
    { name: '合同原件', category: '售前' },
    { name: '需求确认单', category: '需求' },
    { name: '上线确认单', category: '上线' },
    { name: '验收确认单', category: '验收' },
    { name: '付款申请单', category: '验收' },
  ],
}

// 开发相关文件（需要根据是否有开发内容过滤）
const DEVELOPMENT_FILES = ['开发需求设计确认单', '开发完成确认单']

/**
 * 根据项目金额确定档位
 */
function getTier(contractAmount: number): 'A' | 'B' | 'C' {
  if (contractAmount >= 500000) return 'A'
  if (contractAmount >= 100000) return 'B'
  return 'C'
}

/**
 * 检查合同是否包含开发内容
 */
function hasDevelopmentContent(contractItems: { name: string; amount: number }[]): boolean {
  if (!contractItems || contractItems.length === 0) return false
  return contractItems.some(item =>
    item.name.includes('开发') || item.name.includes('开发服务')
  )
}

/**
 * 根据项目信息生成签字文件清单
 */
export function generateSignatureDocs(
  contractAmount: number,
  contractItems?: { name: string; amount: number }[]
): SignatureDoc[] {
  const tier = getTier(contractAmount)
  const templates = SIGNATURE_TEMPLATES[tier]
  const hasDev = hasDevelopmentContent(contractItems || [])

  const docs: SignatureDoc[] = templates
    .filter(template => {
      // 如果没有开发内容，过滤掉开发相关文件
      if (!hasDev && DEVELOPMENT_FILES.includes(template.name)) {
        return false
      }
      return true
    })
    .map((template, index) => ({
      id: `sig-${tier}-${index + 1}`,
      name: template.name,
      required: true,
      status: 'unsigned' as const,
      source: 'auto' as const,
      category: template.category,
    }))

  return docs
}

/**
 * 根据文件名匹配已上传的签字文件
 */
export function matchSignatureDocs(
  signatureDocs: SignatureDoc[],
  uploadedFiles: { id: string; filename: string; has_signature: boolean; signature_status: string }[]
): SignatureDoc[] {
  return signatureDocs.map(doc => {
    // 查找匹配的已上传文件
    const matchedFile = uploadedFiles.find(file => {
      const filename = file.filename.toLowerCase()
      const docName = doc.name.toLowerCase()
      // 简单匹配：文件名包含签字文件名称的关键部分
      return filename.includes(docName) ||
             docName.includes(filename.replace(/\.(pdf|docx?|xlsx?)$/, ''))
    })

    if (matchedFile) {
      return {
        ...doc,
        fileId: matchedFile.id,
        status: matchedFile.signature_status === 'signed' ? 'signed' : 'unsigned',
      }
    }

    return doc
  })
}

/**
 * 获取档位说明
 */
export function getTierDescription(contractAmount: number): string {
  const tier = getTier(contractAmount)
  const descriptions = {
    A: '50万以上',
    B: '10-50万',
    C: '10万以下',
  }
  return descriptions[tier]
}
