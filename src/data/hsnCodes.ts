export interface HsnSacItem {
  code: string;
  type: "HSN (Goods)" | "SAC (Services)";
  description: string;
  category: string;
  gstRate: number; // 0, 0.25, 1.5, 3, 5, 12, 18, 28
  cessRate?: number; // e.g. for luxury cars, tobacco
  complianceNote?: string;
}

export const POPULAR_HSN_SAC_CODES: HsnSacItem[] = [
  // IT & Professional Services (SAC)
  {
    code: "998314",
    type: "SAC (Services)",
    description: "IT Software Development & Cloud Application Services",
    category: "Information Technology",
    gstRate: 18,
    complianceNote: "Eligible for full ITC. Export of services zero-rated with LUT.",
  },
  {
    code: "998313",
    type: "SAC (Services)",
    description: "IT Consulting, Infrastructure & Technical Support",
    category: "Information Technology",
    gstRate: 18,
    complianceNote: "Subject to Section 194J TDS (2% for tech fees).",
  },
  {
    code: "998231",
    type: "SAC (Services)",
    description: "Accounting, Auditing & Bookkeeping Services",
    category: "Professional Services",
    gstRate: 18,
    complianceNote: "Section 194J TDS at 10% on professional fees.",
  },
  {
    code: "998232",
    type: "SAC (Services)",
    description: "Tax Consultancy, GST & Income Tax Advisory",
    category: "Professional Services",
    gstRate: 18,
    complianceNote: "Full ITC eligible for registered commercial enterprises.",
  },
  {
    code: "998222",
    type: "SAC (Services)",
    description: "Legal Advisory, Representation & Documentation",
    category: "Professional Services",
    gstRate: 18,
    complianceNote: "Services by Advocate/Law Firm are under Reverse Charge (RCM) for business recipients.",
  },
  {
    code: "997212",
    type: "SAC (Services)",
    description: "Commercial Real Estate Renting & Office Leasing",
    category: "Rent & Real Estate",
    gstRate: 18,
    complianceNote: "TDS u/s 194I applies if annual rent exceeds ₹2,40,000.",
  },
  {
    code: "996331",
    type: "SAC (Services)",
    description: "Restaurant & Food Service (Standalone / Non-AC/AC)",
    category: "Hospitality & Dining",
    gstRate: 5,
    complianceNote: "Standard rate is 5% WITHOUT Input Tax Credit (ITC).",
  },
  {
    code: "996311",
    type: "SAC (Services)",
    description: "Hotel Accommodation (Tariff ₹1,000 to ₹7,500/day)",
    category: "Hospitality & Dining",
    gstRate: 12,
    complianceNote: "Above ₹7,500/day attracts 18% GST with ITC.",
  },
  {
    code: "996412",
    type: "SAC (Services)",
    description: "Passenger Cab Aggregator / Local Transportation",
    category: "Logistics & Transport",
    gstRate: 5,
    complianceNote: "5% without ITC under e-commerce operator section 9(5).",
  },
  {
    code: "996511",
    type: "SAC (Services)",
    description: "Goods Transport Agency (GTA) Freight Services",
    category: "Logistics & Transport",
    gstRate: 5,
    complianceNote: "5% under RCM (paid by recipient) or 12% forward charge with ITC.",
  },
  {
    code: "998413",
    type: "SAC (Services)",
    description: "Internet Bandwidth, Telecom & Data Transmission",
    category: "Information Technology",
    gstRate: 18,
    complianceNote: "Full business ITC claimable on tax invoice.",
  },
  {
    code: "998713",
    type: "SAC (Services)",
    description: "Machinery, Hardware & Equipment AMC Maintenance",
    category: "Maintenance & Repairs",
    gstRate: 18,
    complianceNote: "Contractual services covered under TDS Section 194C.",
  },
  {
    code: "999210",
    type: "SAC (Services)",
    description: "Education Services (Recognized Schools & Universities)",
    category: "Education & Health",
    gstRate: 0,
    complianceNote: "Exempt from GST under Notification No. 12/2017-CT(R).",
  },
  {
    code: "999312",
    type: "SAC (Services)",
    description: "Healthcare Services by Hospital / Doctor Clinic",
    category: "Education & Health",
    gstRate: 0,
    complianceNote: "Exempt from GST. Non-clinical cosmetic procedures attract 18%.",
  },

  // Electronics & Hardware (HSN Goods)
  {
    code: "8471",
    type: "HSN (Goods)",
    description: "Laptops, Desktops, Servers & Processing Units",
    category: "Computers & Electronics",
    gstRate: 18,
    complianceNote: "Capital asset eligible for 100% ITC under Ind AS 16 / Sec 16 CGST.",
  },
  {
    code: "8517",
    type: "HSN (Goods)",
    description: "Smartphones & Telecommunication Apparatus",
    category: "Computers & Electronics",
    gstRate: 18,
    complianceNote: "Full ITC eligible if used for business furtherance.",
  },
  {
    code: "8443",
    type: "HSN (Goods)",
    description: "Printers, Multifunction Copiers & Cartridges",
    category: "Computers & Electronics",
    gstRate: 18,
    complianceNote: "Eligible for ITC under capital goods or office consumable.",
  },
  {
    code: "8528",
    type: "HSN (Goods)",
    description: "Monitors, Projectors & Digital Display Screens (<=32 inch)",
    category: "Computers & Electronics",
    gstRate: 18,
    complianceNote: "Screens > 32 inches attract 28% GST.",
  },

  // Office & General Consumables
  {
    code: "4820",
    type: "HSN (Goods)",
    description: "Registers, Notebooks, Paper Stationery & Registers",
    category: "Office & Stationery",
    gstRate: 12,
    complianceNote: "Routine revenue expense under Ind AS 1.",
  },
  {
    code: "4901",
    type: "HSN (Goods)",
    description: "Printed Books, Textbooks, Journals & Magazines",
    category: "Office & Stationery",
    gstRate: 0,
    complianceNote: "Exempt from GST across all states.",
  },
  {
    code: "9403",
    type: "HSN (Goods)",
    description: "Office Furniture, Desks, Chairs & Metal Cabinets",
    category: "Furniture & Fixtures",
    gstRate: 18,
    complianceNote: "Capital asset with depreciation under Section 32 Income Tax.",
  },

  // Pharma & Healthcare Goods
  {
    code: "3004",
    type: "HSN (Goods)",
    description: "Formulated Medicaments, Allopathic & Ayurvedic Medicines",
    category: "Pharmaceuticals",
    gstRate: 12,
    complianceNote: "Standard pharmaceutical rate across formulations.",
  },

  // Textiles & Apparel
  {
    code: "6109",
    type: "HSN (Goods)",
    description: "Apparel, Readymade Garments & T-shirts (Sale Value <= ₹1,000)",
    category: "Textiles & Apparel",
    gstRate: 5,
    complianceNote: "Garments with sale value exceeding ₹1,000 attract 12% GST.",
  },
  {
    code: "6203",
    type: "HSN (Goods)",
    description: "Readymade Suits, Blazers, Formal Trousers (> ₹1,000)",
    category: "Textiles & Apparel",
    gstRate: 12,
    complianceNote: "Inverted tax structure refund provisions under Section 54(3).",
  },
  {
    code: "6403",
    type: "HSN (Goods)",
    description: "Footwear with leather/rubber sole (> ₹1,000)",
    category: "Footwear",
    gstRate: 18,
    complianceNote: "Footwear under ₹1,000 attracts 12% GST.",
  },

  // Food & Agricultural Essentials
  {
    code: "0401",
    type: "HSN (Goods)",
    description: "Fresh Milk, Fresh Paneer & Curd (Unbranded / Loose)",
    category: "Food & Groceries",
    gstRate: 0,
    complianceNote: "Nil rated. Pre-packaged branded dairy attracts 5%.",
  },
  {
    code: "0406",
    type: "HSN (Goods)",
    description: "Branded Cheese, Paneer & Dairy Spreads",
    category: "Food & Groceries",
    gstRate: 5,
    complianceNote: "Pre-packaged & labeled dairy products.",
  },
  {
    code: "0902",
    type: "HSN (Goods)",
    description: "Tea & Tea Leaves (Processed / Packaged)",
    category: "Food & Groceries",
    gstRate: 5,
    complianceNote: "Standard agro-processing commodity rate.",
  },
  {
    code: "1905",
    type: "HSN (Goods)",
    description: "Biscuits, Cakes, Pastries & Bakery Products",
    category: "Food & Groceries",
    gstRate: 18,
    complianceNote: "Plain unbranded bread is 0%; sweet biscuits/pastries are 18%.",
  },

  // Industrial & Metals
  {
    code: "7204",
    type: "HSN (Goods)",
    description: "Iron & Steel Waste Scrap, Melting Scrap",
    category: "Metals & Minerals",
    gstRate: 18,
    complianceNote: "Subject to Section 194Q TDS and mandatory e-invoicing if turnover > ₹5 Cr.",
  },
  {
    code: "2710",
    type: "HSN (Goods)",
    description: "Industrial Lubricating Oils, Greases & Base Oils",
    category: "Petroleum & Chemicals",
    gstRate: 18,
    complianceNote: "Non-fuel petroleum oils are under GST (motor spirit/diesel are outside GST).",
  },

  // Precious Metals & High Value
  {
    code: "7113",
    type: "HSN (Goods)",
    description: "Articles of Gold, Silver Jewellery & Precious Ornaments",
    category: "Precious Metals",
    gstRate: 3,
    complianceNote: "Special precious metals GST rate of 3%. Making charges attract 5%.",
  },
  {
    code: "7102",
    type: "HSN (Goods)",
    description: "Diamonds (Cut & Polished)",
    category: "Precious Metals",
    gstRate: 1.5,
    complianceNote: "Special rate: Rough diamonds are 0.25%, cut & polished are 1.5%.",
  },

  // High Slab & Luxury (28% + Cess)
  {
    code: "8703",
    type: "HSN (Goods)",
    description: "Motor Cars & Passenger Vehicles",
    category: "Automobiles",
    gstRate: 28,
    cessRate: 15,
    complianceNote: "Blocked ITC under Section 17(5) unless used for driving school or transport business.",
  },
  {
    code: "8711",
    type: "HSN (Goods)",
    description: "Motorcycles & Two-Wheelers (> 350cc)",
    category: "Automobiles",
    gstRate: 28,
    cessRate: 3,
    complianceNote: "Blocked ITC under Section 17(5) for general business use.",
  },
  {
    code: "2202",
    type: "HSN (Goods)",
    description: "Aerated Waters & Caffeinated Beverages",
    category: "Beverages",
    gstRate: 28,
    cessRate: 12,
    complianceNote: "Subject to 28% GST + Compensation Cess.",
  },
];

export const STANDARD_GST_SLABS = [
  { rate: 0, label: "0% (Exempt / Nil Rated)" },
  { rate: 0.25, label: "0.25% (Rough Diamonds / Gemstones)" },
  { rate: 1.5, label: "1.5% (Polished Diamonds)" },
  { rate: 3, label: "3% (Gold & Precious Jewellery)" },
  { rate: 5, label: "5% (Merit Goods & Transport)" },
  { rate: 12, label: "12% (Processed Goods & Standard)" },
  { rate: 18, label: "18% (Standard Rate - Most Services & Goods)" },
  { rate: 28, label: "28% (Luxury & Sin Goods)" },
];
