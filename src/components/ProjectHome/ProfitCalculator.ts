export const INTERNAL_UNIT_PRICES: Record<string, Record<string, number>> = {
  '实施顾问': { 'C1-1': 1270, 'C1-2': 1440, 'C2-1': 1560, 'C2-2': 1970, 'C3-1': 2550, 'C3-2': 3030, 'C4-1': 3940 },
  '开发工程师': { 'C1-1': 1270, 'C1-2': 1440, 'C2-1': 1560, 'C2-2': 1970, 'C3-1': 2550, 'C3-2': 3030, 'C4-1': 3940 },
  '项目经理': { 'C1-1': 1270, 'C1-2': 1440, 'C2-1': 1560, 'C2-2': 1970, 'C3-1': 2550, 'C3-2': 3030, 'C4-1': 3940 },
  '测试工程师': { 'C1-1': 1270, 'C1-2': 1440, 'C2-1': 1560, 'C2-2': 1970, 'C3-1': 2550, 'C3-2': 3030, 'C4-1': 3940 },
  '运维工程师': { '服务1-1': 1060, '服务1-2': 1200 },
}

export interface ProfitInput {
  contractAmount: number
  internalDays: number
  externalDays: number
  internalUnitPrice: number
  externalUnitPrice: number
  internalTravel: number
  externalTravel: number
}

export interface ProfitResult {
  internalPersonDayCost: number
  internalTotalCost: number
  externalPersonDayCost: number
  externalTotalCost: number
  totalCost: number
  internalWorkloadRatio: number
  externalWorkloadRatio: number
  internalAllocatedContract: number
  externalAllocatedContract: number
  internalProfitRate: number
  externalProfitRate: number
  overallProfitRate: number
  internalProfit: number
  externalProfit: number
  overallProfit: number
  isInternalRedLine: boolean
  isExternalRedLine: boolean
}

export function calculateProfit(input: ProfitInput): ProfitResult {
  const {
    contractAmount,
    internalDays,
    externalDays,
    internalUnitPrice,
    externalUnitPrice,
    internalTravel,
    externalTravel,
  } = input

  const internalPersonDayCost = internalDays * internalUnitPrice
  const internalTotalCost = internalPersonDayCost + internalTravel

  const externalPersonDayCost = externalDays * externalUnitPrice
  const externalTotalCost = externalPersonDayCost + externalTravel

  const totalCost = internalTotalCost + externalTotalCost

  const totalDays = internalDays + externalDays
  const internalWorkloadRatio = totalDays > 0 ? internalDays / totalDays : 0
  const externalWorkloadRatio = totalDays > 0 ? externalDays / totalDays : 0

  const internalAllocatedContract = contractAmount * internalWorkloadRatio
  const externalAllocatedContract = contractAmount * externalWorkloadRatio

  const internalProfitRate = internalAllocatedContract > 0
    ? (internalAllocatedContract - internalTotalCost) / internalAllocatedContract
    : 0
  const externalProfitRate = externalAllocatedContract > 0
    ? (externalAllocatedContract - externalTotalCost) / externalAllocatedContract
    : 0
  const overallProfitRate = contractAmount > 0
    ? (contractAmount - totalCost) / contractAmount
    : 0

  const internalProfit = internalAllocatedContract - internalTotalCost
  const externalProfit = externalAllocatedContract - externalTotalCost
  const overallProfit = contractAmount - totalCost

  const isInternalRedLine = internalProfitRate < 0
  const isExternalRedLine = externalProfitRate < 0.4

  return {
    internalPersonDayCost,
    internalTotalCost,
    externalPersonDayCost,
    externalTotalCost,
    totalCost,
    internalWorkloadRatio,
    externalWorkloadRatio,
    internalAllocatedContract,
    externalAllocatedContract,
    internalProfitRate,
    externalProfitRate,
    overallProfitRate,
    internalProfit,
    externalProfit,
    overallProfit,
    isInternalRedLine,
    isExternalRedLine,
  }
}
