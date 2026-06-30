import { useState, useMemo, useEffect } from 'react'
import { Modal, InputNumber, Select, Button, Divider, Progress, message } from 'antd'
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons'
import { calculateProfit, INTERNAL_UNIT_PRICES } from './ProfitCalculator'
import { formatAmount, formatPercent } from '../../utils/format'
import { parseMetadata } from '../../utils/metadata'

interface ProfitCalculatorModalProps {
  open: boolean
  onClose: () => void
  projectId?: number
  onSaved?: (project: any) => void
}

interface Member {
  id: number
  role: string
  level: string
  days: number
}

let nextId = 1

const defaultMember: Member = { id: nextId++, role: '实施顾问', level: 'C2-1', days: 1 }

const roleOptions = Object.keys(INTERNAL_UNIT_PRICES).map(role => ({
  label: role,
  value: role,
}))

function getLevelOptions(role: string) {
  const levels = INTERNAL_UNIT_PRICES[role] || {}
  return Object.entries(levels).map(([lv, price]) => ({
    label: `${lv} (¥${price})`,
    value: lv,
  }))
}

export default function ProfitCalculatorModal({ open, onClose, projectId, onSaved }: ProfitCalculatorModalProps) {
  const [contractAmount, setContractAmount] = useState<number>(0)
  const [members, setMembers] = useState<Member[]>([{ ...defaultMember }])
  const [externalDays, setExternalDays] = useState<number>(0)
  const [externalUnitPrice, setExternalUnitPrice] = useState<number>(1200)
  const [internalTravel, setInternalTravel] = useState<number>(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [externalTravel, _setExternalTravel] = useState<number>(0)

  // Load saved evaluation data when modal opens
  useEffect(() => {
    if (open && projectId) {
      window.api.project.get(projectId).then(result => {
        if (result.success && result.data) {
          const meta = parseMetadata(result.data?.metadata ?? null)
          const evaluation = meta.evaluation as Record<string, unknown> | undefined
          if (evaluation) {
            const savedAmount = (evaluation.contractAmount as number) || (meta.contract_amount as number) || 0
            if (savedAmount > 0) setContractAmount(savedAmount)

            const savedMembers = evaluation.members as Array<{ role: string; level: string; days: number }> | undefined
            if (savedMembers && savedMembers.length > 0) {
              setMembers(savedMembers.map((m, i) => ({ id: i + 1, ...m })))
            }

            const savedExternalDays = (evaluation.externalDays as number) || 0
            const savedExternalUnitPrice = (evaluation.externalUnitPrice as number) || 1200
            const savedInternalTravel = (evaluation.internalTravel as number) || 0
            const savedExternalTravel = (evaluation.externalTravel as number) || 0

            setExternalDays(savedExternalDays)
            setExternalUnitPrice(savedExternalUnitPrice)
            setInternalTravel(savedInternalTravel)
            _setExternalTravel(savedExternalTravel)
          }
        }
      })
    }
  }, [open, projectId])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setContractAmount(0)
      setMembers([{ id: 1, role: '实施顾问', level: 'C2-1', days: 1 }])
      setExternalDays(0)
      setExternalUnitPrice(1200)
      setInternalTravel(0)
      _setExternalTravel(0)
    }
  }, [open])

  const result = useMemo(() => {
    let internalDays = 0
    let weightedInternalUnitPrice = 0
    for (const m of members) {
      const price = INTERNAL_UNIT_PRICES[m.role]?.[m.level] || 0
      internalDays += m.days
      weightedInternalUnitPrice += m.days * price
    }
    if (internalDays > 0) {
      weightedInternalUnitPrice = weightedInternalUnitPrice / internalDays
    }
    return calculateProfit({
      contractAmount,
      internalDays,
      externalDays,
      internalUnitPrice: weightedInternalUnitPrice,
      externalUnitPrice,
      internalTravel,
      externalTravel,
    })
  }, [contractAmount, members, externalDays, externalUnitPrice, internalTravel, externalTravel])

  const totalInternalDays = members.reduce((s, m) => s + m.days, 0)
  const totalInternalCost = members.reduce((s, m) => s + m.days * (INTERNAL_UNIT_PRICES[m.role]?.[m.level] || 0), 0) + internalTravel

  const updateMember = (id: number, patch: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }

  const addMember = () => {
    if (members.length >= 10) {
      message.warning('最多添加10名成员')
      return
    }
    setMembers(prev => [...prev, { id: nextId++, role: '实施顾问', level: 'C2-1', days: 1 }])
  }

  const removeMember = (id: number) => {
    if (members.length <= 1) return
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleCopy = () => {
    const lines: string[] = [
      '=== 利润测算结果 ===',
      `合同总额: ${formatAmount(contractAmount)}`,
      '',
      '--- 成本明细 ---',
      `内部人工: ${formatAmount(totalInternalCost - internalTravel)}`,
      `内部差旅: ${formatAmount(internalTravel)}`,
      `内部合计: ${formatAmount(result.internalTotalCost)}`,
      `外部人工: ${formatAmount(result.externalPersonDayCost)}`,
      `外部差旅: ${formatAmount(externalTravel)}`,
      `外部合计: ${formatAmount(result.externalTotalCost)}`,
      `总成本: ${formatAmount(result.totalCost)}`,
      '',
      '--- 利润率 ---',
      `内部利润率: ${formatPercent(result.internalProfitRate)}`,
      `外包利润率: ${formatPercent(result.externalProfitRate)}`,
      `整体利润率: ${formatPercent(result.overallProfitRate)}`,
    ]
    if (result.isInternalRedLine || result.isExternalRedLine) {
      lines.push('')
      lines.push('⚠️ 触发低利润红线')
    }
    window.api.clipboard.writeText(lines.join('\n'))
    message.success('已复制到剪贴板')
  }

  const redLineStatus = (rate: number, isRedLine: boolean, threshold: number): 'ok' | 'warning' | 'error' => {
    if (isRedLine) return 'error'
    if (rate < threshold + 0.05) return 'warning'
    return 'ok'
  }

  const saveToProject = async () => {
    if (!projectId) return
    try {
      const evaluation = {
        members: members.map(({ id, ...rest }) => rest),
        contractAmount,
        externalDays,
        externalUnitPrice,
        internalTravel,
        externalTravel,
        result,
        calculatedAt: new Date().toISOString(),
      }
      const projectResult = await window.api.project.get(projectId)
      const existingMeta = parseMetadata(projectResult.data?.metadata ?? null)
      const mergedMeta = {
        ...existingMeta,
        evaluation,
        contract_amount: contractAmount,
        cost_estimate: result.totalCost,
        profit_rate: result.overallProfitRate,
        person_days: totalInternalDays,
      }
      await window.api.project.update(projectId, { metadata: JSON.stringify(mergedMeta) })

      const updatedResult = await window.api.project.get(projectId)
      if (updatedResult.success && updatedResult.data && onSaved) {
        onSaved(updatedResult.data)
      }
    } catch {
      message.error('保存利润测算失败')
    }
  }

  return (
    <Modal
      title="利润测算"
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>复制结果</Button>
          {projectId && <Button type="primary" onClick={saveToProject}>保存</Button>}
          <Button onClick={onClose}>关闭</Button>
        </div>
      }
    >
      {/* Contract amount */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          合同总额（元）
        </label>
        <InputNumber
          style={{ width: '100%' }}
          value={contractAmount || undefined}
          onChange={v => setContractAmount(v || 0)}
          placeholder="输入合同总额"
          min={0}
          step={1000}
        />
      </div>

      <Divider style={{ margin: '12px 0' }}>成员配置</Divider>

      {/* Member table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {members.map(m => {
          const unitPrice = INTERNAL_UNIT_PRICES[m.role]?.[m.level] || 0
          const cost = m.days * unitPrice
          return (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '140px 120px 80px 80px 80px 32px', gap: 8, alignItems: 'center' }}>
              <Select
                value={m.role}
                onChange={role => updateMember(m.id, { role, level: Object.keys(INTERNAL_UNIT_PRICES[role] || {})[0] || '' })}
                options={roleOptions}
                size="small"
              />
              <Select
                value={m.level}
                onChange={level => updateMember(m.id, { level })}
                options={getLevelOptions(m.role)}
                size="small"
              />
              <InputNumber
                value={m.days}
                onChange={v => updateMember(m.id, { days: v || 0 })}
                min={0}
                size="small"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>¥{unitPrice}</span>
              <span style={{ fontSize: 12, fontWeight: 500, textAlign: 'right' }}>{formatAmount(cost)}</span>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeMember(m.id)}
                disabled={members.length <= 1}
                style={{ color: members.length <= 1 ? undefined : 'var(--color-error)' }}
              />
            </div>
          )
        })}
      </div>
      <Button type="dashed" block icon={<PlusOutlined />} onClick={addMember} disabled={members.length >= 10} style={{ marginBottom: 16 }}>
        添加成员
      </Button>

      {/* Travel costs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>内部差旅（元）</label>
          <InputNumber style={{ width: '100%' }} value={internalTravel || undefined} onChange={v => setInternalTravel(v || 0)} min={0} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>外部差旅（元）</label>
          <InputNumber style={{ width: '100%' }} value={externalTravel || undefined} onChange={v => _setExternalTravel(v || 0)} min={0} placeholder="0" />
        </div>
      </div>

      {/* 外包资源 */}
      <Divider style={{ margin: '12px 0' }}>外包资源</Divider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>人天（天）</label>
          <InputNumber style={{ width: '100%' }} value={externalDays || undefined} onChange={v => setExternalDays(v || 0)} min={0} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>外包单价（元/天）</label>
          <InputNumber style={{ width: '100%' }} value={externalUnitPrice} onChange={v => setExternalUnitPrice(v || 1200)} min={0} />
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }}>测算结果</Divider>

      {/* Cost breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <CostItem label="内部人工" value={totalInternalCost - internalTravel} />
        <CostItem label="内部差旅" value={internalTravel} />
        <CostItem label="内部合计" value={result.internalTotalCost} bold />
        <CostItem label="外部人工" value={result.externalPersonDayCost} />
        <CostItem label="外部差旅" value={externalTravel} />
        <CostItem label="外部合计" value={result.externalTotalCost} bold />
        <CostItem label="总成本" value={result.totalCost} bold highlight />
      </div>

      {/* Profit rates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <ProfitRateCard label="内部利润率" rate={result.internalProfitRate} status={redLineStatus(result.internalProfitRate, result.isInternalRedLine, 0)} />
        <ProfitRateCard label="外包利润率" rate={result.externalProfitRate} status={redLineStatus(result.externalProfitRate, result.isExternalRedLine, 0.4)} />
        <ProfitRateCard label="整体利润率" rate={result.overallProfitRate} status={result.overallProfitRate >= 0.4 ? 'ok' : result.overallProfitRate >= 0.3 ? 'warning' : 'error'} />
      </div>

      {/* Red-line warning */}
      {(result.isInternalRedLine || result.isExternalRedLine) && (
        <div style={{ padding: '10px 12px', background: '#FEE2E2', borderRadius: 6, color: '#991B1B', fontSize: 13 }}>
          ⚠️ 触发低利润红线：{result.isInternalRedLine && '内部利润率 < 0%'}{result.isInternalRedLine && result.isExternalRedLine && '，'}{result.isExternalRedLine && '外包利润率 < 40%'}
        </div>
      )}
    </Modal>
  )
}

function CostItem({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <div style={{
      padding: '8px 12px',
      background: highlight ? '#FFF1F0' : 'var(--bg-secondary, #f5f5f5)',
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary, #999)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: highlight ? 16 : 14, fontWeight: bold ? 600 : 400, color: highlight ? '#cf1322' : undefined }}>
        {formatAmount(value)}
      </div>
    </div>
  )
}

function ProfitRateCard({ label, rate, status }: { label: string; rate: number; status: 'ok' | 'warning' | 'error' }) {
  const colorMap = { ok: '#52c41a', warning: '#faad14', error: '#ff4d4f' }
  const color = colorMap[status]
  return (
    <div style={{ padding: '8px 12px', background: 'var(--bg-secondary, #f5f5f5)', borderRadius: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary, #999)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color, marginBottom: 4 }}>{formatPercent(rate)}</div>
      <Progress
        percent={Math.min(Math.max(rate * 100, 0), 100)}
        showInfo={false}
        strokeColor={color}
        railColor="#e8e8e8"
        size="small"
      />
    </div>
  )
}
