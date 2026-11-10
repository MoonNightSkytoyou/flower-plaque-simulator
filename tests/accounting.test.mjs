import test from "node:test";
import assert from "node:assert/strict";
import { BASE_LEDGER, assertAccountingIdentity, calculateAnnualProjection, calculateBreakEvenOrders, calculateSummary, cloneLedger } from "../src/accounting.js";
import { orders, screens } from "../src/gameData.js";

test("canonical order reconciles to HK$4,790", () => {
  const summary = calculateSummary(BASE_LEDGER);
  assert.equal(summary.revenue, 48000);
  assert.equal(summary.directCosts, 25600);
  assert.equal(summary.masterLabourCost, 10560);
  assert.equal(summary.allocatedOverhead, 7050);
  assert.equal(summary.economicProfit, 4790);
  assert.equal(summary.availableCash, 16400);
  assert.equal(summary.accountsReceivable, 24000);
  assert.ok(assertAccountingIdentity(BASE_LEDGER));
  assert.deepEqual(calculateAnnualProjection(BASE_LEDGER), { annualOrders: 12, revenue: 576000, directCosts: 307200, masterLabourCost: 126720, fixedCosts: 282000, economicProfit: -139920 });
  assert.deepEqual(calculateBreakEvenOrders(BASE_LEDGER), { contributionPerOrder: 11840, annualFixedCosts: 282000, orders: 24 });
});

test("every decision preserves the accounting identity", () => {
  for (const screen of screens) {
    for (const { effects } of screen.options) {
      const ledger = cloneLedger();
      if (effects.basePrice !== undefined) {
        ledger.contract.basePrice = effects.basePrice;
        ledger.contract.depositReceived = effects.basePrice * 0.5;
      }
      ledger.contract.approvedChangeFees += effects.changeFees ?? 0;
      ledger.directCosts.materials += effects.materials ?? 0;
      ledger.directCosts.externalLabour += effects.externalLabour ?? 0;
      ledger.directCosts.logistics += effects.logistics ?? 0;
      ledger.masterLabour.hours += effects.masterHours ?? 0;
      ledger.overhead.orderWorkshopHours += effects.workshopHours ?? 0;
      assert.ok(assertAccountingIdentity(ledger));
    }
  }
});

test("all three order baselines preserve the accounting identity", () => {
  for (const order of orders) {
    const ledger = cloneLedger();
    ledger.contract.basePrice = order.price;
    ledger.contract.depositReceived = order.price * 0.5;
    ledger.directCosts.materials = order.materials;
    ledger.directCosts.externalLabour = order.externalLabour;
    ledger.directCosts.logistics = order.logistics;
    ledger.masterLabour.hours = order.masterHours;
    ledger.overhead.orderWorkshopHours = order.workshopHours;
    assert.ok(assertAccountingIdentity(ledger));
    assert.equal(calculateSummary(ledger).accountsReceivable, order.price * 0.5);
  }
});
