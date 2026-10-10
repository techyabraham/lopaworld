/** A delivery quote is descriptive; Medusa remains the source of the charged amount. */
export type DeliveryAddress = {
  country_code: string;
  province?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

export type DeliveryRate = {
  id: string;
  name: string;
  amount: number;
  currency_code: string;
  estimated_delivery?: string;
  shipping_option_id: string;
};

export type ShipmentInput = {
  order_id: string;
  shipping_option_id: string;
  address: DeliveryAddress;
};

export type Shipment = {
  provider_reference: string;
  tracking_url?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'unknown';
};

/** Implemented by a future courier integration. It intentionally has no remote side effects today. */
export interface DeliveryProvider {
  getRates(address: DeliveryAddress, configuration: unknown): Promise<DeliveryRate[]>;
  createShipment(input: ShipmentInput): Promise<Shipment>;
  track(providerReference: string): Promise<Shipment>;
  cancel(providerReference: string): Promise<Shipment>;
}

/** No rates are returned until an owner-approved rule table exists. */
export class RuleBasedDeliveryProvider implements DeliveryProvider {
  async getRates(address: DeliveryAddress, configuration: unknown): Promise<DeliveryRate[]> {
    if (address.country_code.toLowerCase() !== 'ng' || !Array.isArray(configuration)) return [];
    const rules = configuration as Array<Record<string, unknown>>;
    return rules.flatMap((rule) => {
      const cities = Array.isArray(rule.cities) ? rule.cities : [];
      const states = Array.isArray(rule.states) ? rule.states : [];
      const cityMatches = cities.some((value) => typeof value === 'string' && value.toLowerCase() === address.city?.toLowerCase());
      const stateMatches = states.some((value) => typeof value === 'string' && value.toLowerCase() === address.province?.toLowerCase());
      if (!cityMatches && !stateMatches) return [];
      if (typeof rule.shipping_option_id !== 'string' || typeof rule.name !== 'string' ||
          typeof rule.amount !== 'number' || !Number.isFinite(rule.amount) || rule.amount < 0) return [];
      const currencyCode = typeof rule.currency_code === 'string' ? rule.currency_code.toLowerCase() : 'ngn';
      if (currencyCode !== 'ngn') return [];
      return [{
        id: typeof rule.id === 'string' ? rule.id : rule.shipping_option_id,
        name: rule.name,
        amount: rule.amount,
        currency_code: currencyCode,
        ...(typeof rule.estimated_delivery === 'string' ? { estimated_delivery: rule.estimated_delivery } : {}),
        shipping_option_id: rule.shipping_option_id,
      }];
    });
  }

  async createShipment(_input: ShipmentInput): Promise<Shipment> {
    throw new Error('Courier provider integration is not configured.');
  }

  async track(_providerReference: string): Promise<Shipment> {
    throw new Error('Courier tracking is not configured.');
  }

  async cancel(_providerReference: string): Promise<Shipment> {
    throw new Error('Courier cancellation is not configured.');
  }
}
