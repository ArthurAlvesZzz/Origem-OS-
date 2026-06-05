export interface DigitalMenuConfig {
  id: string;
  tenantId: string;
  slug: string;
  publicName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  whatsapp?: string | null;
  isOpen: boolean;
  closedMessage?: string | null;
  allowOrdersOutsideHours: boolean;
  acceptsPickup: boolean;
  acceptsDelivery: boolean;
  deliveryFee: number;
  minimumOrder: number;
  estimatedPrepMinutes: number;
  estimatedDeliveryMinutes: number;
  paymentMethodsJson: string[] | string | null;
  openingHoursJson?: any;
  deliveryZonesJson?: any;
  platformFeeType: string;
  platformFeeValue: number;
  paymentProvider?: string;
  pixKeyManual?: string | null;
}

export interface DigitalMenuCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  order: number;
  active: boolean;
  items?: DigitalMenuItem[];
}

export interface DigitalMenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  productId?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  active: boolean;
  featured: boolean;
  preparationMinutes?: number | null;
  stockLinked: boolean;
  modifierGroups?: DigitalMenuModifierGroup[];
}

export interface DigitalMenuModifierGroup {
  id: string;
  tenantId: string;
  itemId: string;
  name: string;
  description?: string | null;
  minSelections: number;
  maxSelections: number;
  active: boolean;
  order: number;
  options?: DigitalMenuModifierOption[];
}

export interface DigitalMenuModifierOption {
  id: string;
  tenantId: string;
  groupId: string;
  name: string;
  price: number;
  active: boolean;
  order: number;
}

export interface DigitalMenuOrderPayload {
  customerName: string;
  customerPhone?: string;
  customerDocument?: string;
  deliveryMethod: 'pickup' | 'delivery';
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  paymentMethod: string;
  notes?: string;
  deliveryZone?: string;
  items: {
    itemId: string; // DigitalMenuItem ID
    qty: number;
    notes?: string;
    modifiers?: { id: string; name: string; price: number; groupId: string }[];
  }[];
}
