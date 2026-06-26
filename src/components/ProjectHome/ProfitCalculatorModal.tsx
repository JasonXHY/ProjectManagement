import { useState } from 'react'
import { Modal, Input, Select, Button, Divider } from 'antd'
import { calculateProfit, INTERNAL_UNIT_PRICES, ProfitResult } from './ProfitCalculator'

interface ProfitCalculatorModalProps {
  open: boolean
  onClose: () => void
  projectId?: number
}

const roleOptions = Object.keys(INTERNAL_UNIT_PRICES).map(role => ({
  label: role,
  value: role,
}))

const levelOptions: Record<string, { label: string; value: string }[]> = {
  '实施顾问': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '开发工程师': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '项目经理': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '测试工程师': [
    { label: 'C1-1 (¥1270)', value: 'C1-1' },
    { label: 'C1-2 (¥1440)', value: 'C1-2' },
    { label: 'C2-1 (¥1560)', value: 'C2-1' },
    { label: 'C2-2 (¥1970)', value: 'C2-2' },
    { label: 'C3-1 (¥2550)', value: 'C3-1' },
    { label: 'C3-2 (¥3030)', value: 'C3-2' },
    { label: 'C4-1 (¥3940)', value: 'C4-1' },
  ],
  '运维工程师': [
    { label: '服务1-1 (¥1060)', value: '服务1-1' },
    { label: '服务1-2 (¥1200)', value: '服务1-2' },
  ],
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString()}`
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

export default function ProfitCalculatorModal({ open, onClose, projectId }: ProfitCalculatorModalProps) {
  const [contractAmount, setContractAmount] = useState<number>(0)
  const [internalDays, setInternalDays] = useState<number>(0)
  const [externalDays, setExternalDays] = useState<number>(0)
  const [role, setRole] = useState<string>('实施顾问')
  const [level, setLevel] = useState<string>('C2-1')
  const [externalUnitPrice, setExternalUnitPrice] = useState<number>(1200)
  const [internalTravel, setInternalTravel] = useState<number>(0)
  const [externalTravel, setExternalTravel] = useState<number>(0)
  const [result, setResult] = useState<ProfitResult | null>(null)

  const internalUnitPrice = INTERNAL_UNIT_PRICES[role]?.[level] || 1560

  const handleCalculate = async () => {
    const calcResult = calculateProfit({
      contractAmount,
      internalDays,
      externalDays,
      internalUnitPrice,
      externalUnitPrice,
      internalTravel,
      externalTravel,
    })
    setResult(calcResult)

    if (projectId) {
      try {
        const evaluation = {
          contractAmount,
          internalDays,
          externalDays,
          internalUnitPrice,
          externalUnitPrice,
          internalTravel,
          externalTravel,
          result: calcResult,
          calculatedAt: new Date().toISOString(),
        }
        const totalCost = calcResult.totalCost
        const totalPersonDays = internalDays + externalDays
        await window.api.project.update(projectId, {
          metadata: JSON.stringify({
            evaluation,
            contract_amount: contractAmount,
            cost_estimate: totalCost,
            profit_rate: calcResult.internalProfitRate,
            person_days: totalPersonDays,
          }),
        })
      } catch (err) {
        console.error('[利润测算] 保存失败:', err)
      }
    }
  }

  return (
    <Modal
      title="利润测算"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            合同总额（元）
          </label>
          <Input
            type="number"
            value={contractAmount || ''}
            onChange={e => setContractAmount(Number(e.target.value) || 0)}
            placeholder="输入合同总额"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            内部人天
          </label>
          <Input
            type="number"
            value={internalDays || ''}
            onChange={e => setInternalDays(Number(e.target.value) || 0)}
            placeholder="输入内部人天"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            外包人天
          </label>
          <Input
            type="number"
            value={externalDays || ''}
            onChange={e => setExternalDays(Number(e.target.value) || 0)}
            placeholder="输入外包人天"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            外包单价（元/天）
          </label>
          <Input
            type="number"
            value={externalUnitPrice}
            onChange={e => setExternalUnitPrice(Number(e.target.value) || 1200)}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            内部角色
          </label>
          <Select
            value={role}
            onChange={setRole}
            options={roleOptions}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            职级
          </label>
          <Select
            value={level}
            onChange={setLevel}
            options={levelOptions[role] || []}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            内部差旅（元）
          </label>
          <Input
            type="number"
            value={internalTravel || ''}
            onChange={e => setInternalTravel(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            外部差旅（元）
          </label>
          <Input
            type="number"
            value={externalTravel || ''}
            onChange={e => setExternalTravel(Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Button type="primary" onClick={handleCalculate}>
          测算
        </Button>
      </div>

      {result && (
        <>
          <Divider>测算结果</Divider>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginBottom: '4px' }}>总成本</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatAmount(result.totalCost)}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginBottom: '4px' }}>整体利润率</div>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: result.overallProfitRate >= 0.4 ? 'var(--color-success)' : 'var(--color-error)',
              }}>
                {formatPercent(result.overallProfitRate)}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginBottom: '4px' }}>内部利润率</div>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: result.isInternalRedLine ? 'var(--color-error)' : 'var(--color-success)',
              }}>
                {formatPercent(result.internalProfitRate)}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginBottom: '4px' }}>外包利润率</div>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: result.isExternalRedLine ? 'var(--color-error)' : 'var(--color-success)',
              }}>
                {formatPercent(result.externalProfitRate)}
              </div>
            </div>
          </div>

          {(result.isInternalRedLine || result.isExternalRedLine) && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#FEE2E2',
              borderRadius: '8px',
              color: '#991B1B',
            }}>
              ⚠️ 触发低利润红线：{result.isInternalRedLine && '内部利润率 < 0%'}{result.isInternalRedLine && result.isExternalRedLine && '，'}{result.isExternalRedLine && '外包利润率 < 40%'}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
