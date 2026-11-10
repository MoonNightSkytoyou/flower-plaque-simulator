export const BASE_LEDGER = Object.freeze({
  contract: { basePrice: 48000, approvedChangeFees: 0, discounts: 0, refunds: 0, depositReceived: 24000, finalPaymentReceived: 0 },
  directCosts: { materials: 12800, externalLabour: 7900, logistics: 4900, other: 0 },
  masterLabour: { hours: 88, reasonableHourlyRate: 120, actualPayTaken: 0 },
  overhead: { monthlyFixedCost: 23500, monthlyWorkshopHours: 240, orderWorkshopHours: 72 },
  cash: { openingWorkingCapital: 18000 },
});

export const cloneLedger = (ledger = BASE_LEDGER) => structuredClone(ledger);
export const calculateRevenue = (l) => l.contract.basePrice + l.contract.approvedChangeFees - l.contract.discounts - l.contract.refunds;
export const calculateDirectCosts = (l) => l.directCosts.materials + l.directCosts.externalLabour + l.directCosts.logistics + l.directCosts.other;
export const calculateMasterLabourCost = (l) => l.masterLabour.hours * l.masterLabour.reasonableHourlyRate;
export const calculateAllocatedOverhead = (l) => l.overhead.monthlyWorkshopHours <= 0 ? 0 : l.overhead.monthlyFixedCost / l.overhead.monthlyWorkshopHours * l.overhead.orderWorkshopHours;
export const calculateOperatingSurplus = (l) => calculateRevenue(l) - calculateDirectCosts(l);
export const calculateEconomicProfit = (l) => calculateOperatingSurplus(l) - calculateMasterLabourCost(l) - calculateAllocatedOverhead(l);
export const calculateEconomicProfitMargin = (l) => calculateRevenue(l) === 0 ? 0 : calculateEconomicProfit(l) / calculateRevenue(l);
export const calculateAvailableCash = (l) => l.cash.openingWorkingCapital + l.contract.depositReceived + l.contract.finalPaymentReceived - calculateDirectCosts(l) - l.masterLabour.actualPayTaken;
export const calculateAccountsReceivable = (l) => Math.max(0, calculateRevenue(l) - l.contract.depositReceived - l.contract.finalPaymentReceived);
export const calculateEffectiveHourlyPay = (l) => l.masterLabour.hours === 0 ? 0 : l.masterLabour.actualPayTaken / l.masterLabour.hours;

export function calculateAnnualProjection(ledger, annualOrders = 12) {
  const revenue = calculateRevenue(ledger) * annualOrders;
  const directCosts = calculateDirectCosts(ledger) * annualOrders;
  const masterLabourCost = calculateMasterLabourCost(ledger) * annualOrders;
  const fixedCosts = ledger.overhead.monthlyFixedCost * 12;
  return { annualOrders, revenue, directCosts, masterLabourCost, fixedCosts, economicProfit: revenue - directCosts - masterLabourCost - fixedCosts };
}

export function calculateBreakEvenOrders(ledger) {
  const contributionPerOrder = calculateRevenue(ledger) - calculateDirectCosts(ledger) - calculateMasterLabourCost(ledger);
  const annualFixedCosts = ledger.overhead.monthlyFixedCost * 12;
  return { contributionPerOrder, annualFixedCosts, orders: contributionPerOrder > 0 ? Math.ceil(annualFixedCosts / contributionPerOrder) : null };
}

export function calculateSummary(ledger) {
  return {
    revenue: calculateRevenue(ledger), directCosts: calculateDirectCosts(ledger),
    operatingSurplus: calculateOperatingSurplus(ledger), masterLabourCost: calculateMasterLabourCost(ledger),
    allocatedOverhead: calculateAllocatedOverhead(ledger), economicProfit: calculateEconomicProfit(ledger),
    economicProfitMargin: calculateEconomicProfitMargin(ledger), availableCash: calculateAvailableCash(ledger),
    accountsReceivable: calculateAccountsReceivable(ledger), effectiveHourlyPay: calculateEffectiveHourlyPay(ledger),
  };
}

export function assertAccountingIdentity(ledger) {
  const s = calculateSummary(ledger);
  return Math.abs(s.revenue - (s.directCosts + s.masterLabourCost + s.allocatedOverhead + s.economicProfit)) < .001;
}
