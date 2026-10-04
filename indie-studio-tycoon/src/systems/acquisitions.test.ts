import { describe, expect, it } from "vitest";
import { createRivalCompany } from "./companies";
import { makeOffer, resolveAcquisition } from "./acquisitions";

describe("acquisitions (M&A)", () => {
  it("a hostile takeover costs more than a friendly full acquisition", () => {
    const target = createRivalCompany(1);
    const full = makeOffer(target, "full");
    const hostile = makeOffer(target, "hostile");
    expect(hostile.price).toBeGreaterThan(full.price);
    expect(full.absorbsCompany).toBe(true);
    expect(hostile.absorbsCompany).toBe(true);
  });

  it("partnership/investment offers are cheaper and do not absorb the company", () => {
    const target = createRivalCompany(1);
    const partnership = makeOffer(target, "partnership");
    const full = makeOffer(target, "full");
    expect(partnership.absorbsCompany).toBe(false);
    expect(partnership.price).toBeLessThan(full.price);
  });

  it("resolving a full acquisition with 'close' yields less value than 'integrate'", () => {
    const target = { ...createRivalCompany(1), ipIds: ["ip1", "ip2"], employeeCount: 50 };
    const offer = makeOffer(target, "full");
    const closed = resolveAcquisition(offer, target, "close");
    const integrated = resolveAcquisition(offer, target, "integrate");
    expect(closed.ipsTransferred).toHaveLength(0);
    expect(integrated.ipsTransferred).toHaveLength(2);
    expect(integrated.companyValueGain).toBeGreaterThan(closed.companyValueGain);
  });

  it("replacing management causes a morale shock, keeping it does not", () => {
    const target = createRivalCompany(1);
    const offer = makeOffer(target, "full");
    const replaced = resolveAcquisition(offer, target, "replaceManagement");
    const kept = resolveAcquisition(offer, target, "keepManagement");
    expect(replaced.moraleShock).toBeLessThan(0);
    expect(kept.moraleShock).toBeGreaterThanOrEqual(0);
  });

  it("a struggling company (negative capital) sells at a discount", () => {
    const healthy = { ...createRivalCompany(1), capital: 100_000, companyValue: 1_000_000 };
    const struggling = { ...healthy, capital: -50_000 };
    const healthyOffer = makeOffer(healthy, "full");
    const strugglingOffer = makeOffer(struggling, "full");
    expect(strugglingOffer.price).toBeLessThan(healthyOffer.price);
  });
});
