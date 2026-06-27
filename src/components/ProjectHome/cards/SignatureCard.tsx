import { useState, useMemo } from 'react'
import { Project, FileRecord, SignatureDoc } from '../../../types'
import { generateSignatureDocs, matchSignatureDocs } from '../../../utils/signature-generator'
import SignatureDetailModal from '../SignatureDetailModal'
import { parseMetadata } from '../../../utils/metadata'

interface Props { project: Project; allFiles: FileRecord[] }

export default function SignatureCard({ project, allFiles }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  // 从metadata中获取已保存的签字文件列表
  const savedDocs = useMemo(() => {
    const meta = parseMetadata(project.metadata)
    return (meta.signature_docs as SignatureDoc[]) || []
  }, [project.metadata])

  // 获取合同信息用于生成签字文件清单
  const contractInfo = useMemo(() => {
    const meta = parseMetadata(project.metadata)
    return {
      amount: (meta.contract_amount as number) || 0,
      items: (meta.contract_items as Array<{ name: string; amount: number }>) || [],
    }
  }, [project.metadata])

  // 合并已保存的和自动生成的签字文件
  const signatureDocs = useMemo(() => {
    if (savedDocs.length > 0) {
      // 如果已有保存的数据，匹配已上传的文件
      return matchSignatureDocs(savedDocs, allFiles)
    }
    // 否则根据合同信息生成
    const generated = generateSignatureDocs(contractInfo.amount, contractInfo.items)
    return matchSignatureDocs(generated, allFiles)
  }, [savedDocs, contractInfo, allFiles])

  // 统计签字状态
  const signed = signatureDocs.filter(d => d.status === 'signed').length
  const total = signatureDocs.length || 1
  const percent = Math.round((signed / total) * 100)

  // 获取档位说明
  const tierDescription = contractInfo.amount >= 500000 ? '50万以上' :
                          contractInfo.amount >= 100000 ? '10-50万' : '10万以下'

  return (
    <>
      <div className="feature-card">
        <div className="fc-header">
          <div className="fc-title-row">
            <div className="fc-icon" style={{background:'#D1FAE5',color:'#10B981'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </div>
            <span className="fc-title">签字追踪</span>
          </div>
          <button className="fc-action" onClick={() => setModalOpen(true)}>查看全部 →</button>
        </div>
        <div className="fc-body">
          <div className="sig-stats-row">
            <div className="sig-bar-wrap"><div className="sig-bar" style={{width:`${percent}%`}} /></div>
            <span className="sig-stat"><strong className="green">{signed}</strong> 已签</span>
            <span className="sig-stat"><strong className="red">{total - signed}</strong> 待签</span>
          </div>
          {signatureDocs.slice(0, 2).map(doc => (
            <div key={doc.id} className="sig-file">
              <span className="sig-file-name">{doc.name}</span>
              <span className={`sig-tag ${doc.status}`}>
                {doc.status === 'signed' ? '已签字' : '待签字'}
              </span>
            </div>
          ))}
          <div style={{fontSize:'11px',color:'var(--text-placeholder)',marginTop:'6px'}}>
            规则：{tierDescription}{contractInfo.items.some((i: any) => i.name.includes('开发')) ? ' · 含开发内容' : ''}
          </div>
        </div>
      </div>

      <SignatureDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        docs={signatureDocs}
      />
    </>
  )
}
