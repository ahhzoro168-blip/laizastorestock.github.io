import { ShoeProduct, SaleOrder, PurchaseOrder, SeasonalTrend } from '../types';

export const MEN_SIZES = [40, 41, 42, 43, 44] as const;
export const WOMEN_SIZES = [36, 37, 38, 39, 40] as const;
export const ALL_COLORS = ['Black', 'White', 'Navy', 'Beige', 'ខ្មៅ', 'ស'] as const;

export const CAMBODIA_PROVINCES = [
  'Siem Reap',
  'Battambang',
  'Preah Sihanouk',
  'Kampot',
  'Kandal',
  'Takeo',
  'Kampong Cham',
  'Banteay Meanchey',
  'Pursat',
  'Kampong Chhnang',
  'Preah Vihear',
  'Svay Rieng',
  'Kampong Speu',
  'Kratie',
  'Mondulkiri',
  'Ratanakiri',
  'Koh Kong'
] as const;

export const PHNOM_PENH_DISTRICTS = [
  'Chamkar Mon',
  'Daun Penh',
  'Toul Kork',
  'Prampir Meakkakra',
  'Sen Sok',
  'Meanchey',
  'Chroy Changvar',
  'Boeng Keng Kang',
  'Chbar Ampov',
  'Russey Keo',
  'Por Senchey',
  'Kamboul'
] as const;

// Clean production initial data (no sample or demo products)
export const INITIAL_PRODUCTS: ShoeProduct[] = [];

// Clean initial sales orders (no sample orders)
export const INITIAL_ORDERS: SaleOrder[] = [];

// Clean initial purchase orders (no sample purchase orders)
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const SEASONAL_INSIGHTS: SeasonalTrend[] = [
  {
    seasonName: 'Khmer New Year & Peak Travel Rush',
    months: 'March - April',
    description: 'Annual travel surge where families visit ancestral home provinces and Angkor Sangkran in Siem Reap. Strongest consumer preference for comfortable walking sneakers and stylish platform shoes.',
    demandFactor: 1.65,
    bestSellingCategories: ['Sneakers', 'Casual & Lifestyle'],
    recommendedColors: ['White', 'Beige', 'ស'],
    topSizeMen: [41, 42, 43],
    topSizeWomen: [37, 38],
    advice: 'Boost stock in Size 41/42 (Men) and Size 37/38 (Women) in White & Beige ahead of Khmer New Year surge.'
  },
  {
    seasonName: 'Monsoon & Rainy Season Phase',
    months: 'May - October',
    description: 'High precipitation across Phnom Penh and provinces. Shifts customer preference toward stain-resistant dark colors (Black, Navy), water-repellent leather, and grip soles with deep rubber grooves.',
    demandFactor: 1.15,
    bestSellingCategories: ['Sneakers', 'Boots & Outdoor', 'Formal & Loafers'],
    recommendedColors: ['Black', 'Navy', 'ខ្មៅ'],
    topSizeMen: [42, 43],
    topSizeWomen: [38, 39],
    advice: 'Prioritize Black & Navy variants. Ensure sole rubber compound has enhanced wet-traction rating.'
  },
  {
    seasonName: 'Wedding, Gala & Pchum Ben Season',
    months: 'October - December',
    description: 'Cambodian wedding season begins alongside religious festivities. Massive surge in formal loafers, polished calfskin shoes, and smart casual footwear for banquets and celebrations.',
    demandFactor: 1.45,
    bestSellingCategories: ['Formal & Loafers', 'Sneakers'],
    recommendedColors: ['Black', 'Navy', 'Beige', 'ខ្មៅ'],
    topSizeMen: [40, 41, 42],
    topSizeWomen: [36, 37, 38],
    advice: 'Keep minimum safety stock of 15 pairs per size in formal shoe models.'
  },
  {
    seasonName: 'Dry Cool Season & Urban Lifestyle',
    months: 'January - February',
    description: 'Pleasant cool outdoor weather. High retail shopping foot traffic in malls, Riverside, and cafe hopping. Balanced demand across light and dark tones.',
    demandFactor: 1.30,
    bestSellingCategories: ['Sneakers', 'Running & Athletic'],
    recommendedColors: ['Beige', 'White', 'Black', 'Navy', 'ស', 'ខ្មៅ'],
    topSizeMen: [41, 42],
    topSizeWomen: [37, 38],
    advice: 'Bundle promotions for dual-pair purchases (Men + Women sets).'
  }
];
