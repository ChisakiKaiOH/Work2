// Monetization abstraction — section 24. No real payment SDK is wired up in
// this build (and no real money changes hands anywhere in the code: "credits"
// and "tokens" are entirely virtual, see MONETIZATION.md). This interface is
// what a future store integration (Google Play Billing, etc.) would implement.

export type ProductId =
  | 'remove_ads'
  | 'token_pack_small'
  | 'token_pack_medium'
  | 'token_pack_large'
  | 'starter_pack'
  | 'premium_pack';

export interface StoreProduct {
  id: ProductId;
  name: string;
  description: string;
  priceLabel: string; // display-only placeholder, e.g. "€4.99"
  tokens?: number;
  grantsCar?: boolean;
}

export const STORE_PRODUCTS: StoreProduct[] = [
  { id: 'remove_ads', name: 'Remove Ads', description: 'Rimuove tutta la pubblicità opzionale.', priceLabel: '€3.99' },
  { id: 'token_pack_small', name: 'Token Pack S', description: '100 token.', priceLabel: '€1.99', tokens: 100 },
  { id: 'token_pack_medium', name: 'Token Pack M', description: '550 token (+10% bonus).', priceLabel: '€8.99', tokens: 550 },
  { id: 'token_pack_large', name: 'Token Pack L', description: '1200 token (+20% bonus).', priceLabel: '€17.99', tokens: 1200 },
  { id: 'starter_pack', name: 'Starter Pack', description: 'Crediti, token e un\'auto Rare garantita.', priceLabel: '€4.99', tokens: 200, grantsCar: true },
  { id: 'premium_pack', name: 'Premium Pack', description: 'Il pacchetto più ricco, per chi vuole accelerare.', priceLabel: '€9.99', tokens: 500, grantsCar: true },
];

export interface PurchaseResult {
  success: boolean;
  productId: ProductId;
}

export interface MonetizationService {
  getProducts(): StoreProduct[];
  purchase(productId: ProductId): Promise<PurchaseResult>;
}

/**
 * Mock store — no real transaction occurs. Every purchase screen must still
 * work and be testable without a store SDK or network access; swapping in
 * Play Billing later only touches this file.
 */
export class MockMonetizationService implements MonetizationService {
  getProducts(): StoreProduct[] {
    return STORE_PRODUCTS;
  }
  async purchase(productId: ProductId): Promise<PurchaseResult> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: true, productId };
  }
}

export const monetizationService: MonetizationService = new MockMonetizationService();
