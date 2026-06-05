export interface PlatformBillingProvider {
  createCustomer(tenant: any): Promise<string>;
  createSubscription(tenant: any, plan: any): Promise<{ subscriptionId: string, url?: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  getSubscriptionStatus(subscriptionId: string): Promise<any>;
  generatePortalUrl(customerId: string): Promise<string | null>;
}

export class ManualBillingProvider implements PlatformBillingProvider {
  async createCustomer(tenant: any) {
    return 'manual_cust_' + tenant.id;
  }
  async createSubscription(tenant: any, plan: any) {
    return { subscriptionId: 'manual_sub_' + tenant.id, url: 'manual_none' };
  }
  async cancelSubscription(subscriptionId: string) {
    // done
  }
  async getSubscriptionStatus(subscriptionId: string) {
    return { status: 'active' };
  }
  async generatePortalUrl(customerId: string) {
    return null;
  }
}

// In the future this could load stripe, asaas, etc. based on env.
export function getBillingProvider(): PlatformBillingProvider {
  return new ManualBillingProvider();
}
