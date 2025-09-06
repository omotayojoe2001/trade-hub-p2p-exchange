// Banks API Service - Nigerian and International Banks
import { useToast } from "@/hooks/use-toast";

export interface Bank {
  id: string;
  name: string;
  code: string;
  country: string;
  logo?: string;
  ussd?: string;
}

// Nigerian Banks (CBN Licensed Banks)
export const nigerianBanks: Bank[] = [
  { id: "044", name: "Access Bank", code: "044", country: "NG", ussd: "*901#" },
  { id: "014", name: "Afribank Nigeria Plc", code: "014", country: "NG" },
  { id: "023", name: "Citibank Nigeria Limited", code: "023", country: "NG" },
  { id: "050", name: "Ecobank Nigeria Plc", code: "050", country: "NG", ussd: "*326#" },
  { id: "070", name: "Fidelity Bank", code: "070", country: "NG", ussd: "*770#" },
  { id: "011", name: "First Bank of Nigeria", code: "011", country: "NG", ussd: "*894#" },
  { id: "214", name: "First City Monument Bank", code: "214", country: "NG", ussd: "*329#" },
  { id: "058", name: "Guaranty Trust Bank", code: "058", country: "NG", ussd: "*737#" },
  { id: "030", name: "Heritage Bank", code: "030", country: "NG", ussd: "*745#" },
  { id: "301", name: "Jaiz Bank", code: "301", country: "NG", ussd: "*389#" },
  { id: "082", name: "Keystone Bank", code: "082", country: "NG", ussd: "*7111#" },
  { id: "526", name: "Parallex Bank", code: "526", country: "NG" },
  { id: "076", name: "Polaris Bank", code: "076", country: "NG", ussd: "*833#" },
  { id: "101", name: "Providus Bank", code: "101", country: "NG", ussd: "*737*6#" },
  { id: "221", name: "Stanbic IBTC Bank", code: "221", country: "NG", ussd: "*909#" },
  { id: "068", name: "Standard Chartered Bank", code: "068", country: "NG" },
  { id: "232", name: "Sterling Bank", code: "232", country: "NG", ussd: "*822#" },
  { id: "100", name: "SunTrust Bank", code: "100", country: "NG", ussd: "*5230#" },
  { id: "032", name: "Union Bank of Nigeria", code: "032", country: "NG", ussd: "*826#" },
  { id: "033", name: "United Bank For Africa", code: "033", country: "NG", ussd: "*919#" },
  { id: "215", name: "Unity Bank", code: "215", country: "NG", ussd: "*7799#" },
  { id: "035", name: "Wema Bank", code: "035", country: "NG", ussd: "*945#" },
  { id: "057", name: "Zenith Bank", code: "057", country: "NG", ussd: "*966#" },
  
  // Digital Banks
  { id: "50211", name: "Kuda Bank", code: "50211", country: "NG" },
  { id: "50515", name: "Moniepoint MFB", code: "50515", country: "NG" },
  { id: "50746", name: "Opay", code: "50746", country: "NG" },
  { id: "50739", name: "PalmPay", code: "50739", country: "NG" },
  { id: "999992", name: "Paystack-Titan", code: "999992", country: "NG" },
  { id: "999991", name: "Rubies MFB", code: "999991", country: "NG" },
];

// International Banks by Country
export const internationalBanks: Record<string, Bank[]> = {
  US: [
    { id: "us_001", name: "JPMorgan Chase", code: "CHASUS33", country: "US" },
    { id: "us_002", name: "Bank of America", code: "BOFAUS3N", country: "US" },
    { id: "us_003", name: "Wells Fargo", code: "WFBIUS6S", country: "US" },
    { id: "us_004", name: "Citibank", code: "CITIUS33", country: "US" },
    { id: "us_005", name: "Goldman Sachs Bank", code: "GSSBUSNY", country: "US" },
  ],
  GB: [
    { id: "gb_001", name: "Barclays", code: "BARCGB22", country: "GB" },
    { id: "gb_002", name: "HSBC", code: "HBUKGB4B", country: "GB" },
    { id: "gb_003", name: "Lloyds Bank", code: "LOYDGB21", country: "GB" },
    { id: "gb_004", name: "NatWest", code: "NWBKGB2L", country: "GB" },
    { id: "gb_005", name: "Santander UK", code: "ABBYGB2L", country: "GB" },
  ],
  CA: [
    { id: "ca_001", name: "Royal Bank of Canada", code: "ROYCCAT2", country: "CA" },
    { id: "ca_002", name: "Toronto-Dominion Bank", code: "TDOMCATTTOR", country: "CA" },
    { id: "ca_003", name: "Bank of Nova Scotia", code: "NOSCCATT", country: "CA" },
    { id: "ca_004", name: "Bank of Montreal", code: "BOFMCAM2", country: "CA" },
    { id: "ca_005", name: "Canadian Imperial Bank", code: "CIBCCATT", country: "CA" },
  ],
  KE: [
    { id: "ke_001", name: "Kenya Commercial Bank", code: "01", country: "KE" },
    { id: "ke_002", name: "Equity Bank", code: "68", country: "KE" },
    { id: "ke_003", name: "Cooperative Bank", code: "01", country: "KE" },
    { id: "ke_004", name: "Standard Chartered Kenya", code: "02", country: "KE" },
    { id: "ke_005", name: "Barclays Bank Kenya", code: "03", country: "KE" },
  ],
  ZA: [
    { id: "za_001", name: "Standard Bank", code: "051001", country: "ZA" },
    { id: "za_002", name: "ABSA Bank", code: "632005", country: "ZA" },
    { id: "za_003", name: "FirstRand Bank", code: "250655", country: "ZA" },
    { id: "za_004", name: "Nedbank", code: "198765", country: "ZA" },
    { id: "za_005", name: "Capitec Bank", code: "470010", country: "ZA" },
  ],
  GH: [
    { id: "gh_001", name: "Ghana Commercial Bank", code: "030100", country: "GH" },
    { id: "gh_002", name: "Ecobank Ghana", code: "130100", country: "GH" },
    { id: "gh_003", name: "Standard Chartered Ghana", code: "020100", country: "GH" },
    { id: "gh_004", name: "Zenith Bank Ghana", code: "120100", country: "GH" },
    { id: "gh_005", name: "Access Bank Ghana", code: "280100", country: "GH" },
  ]
};

// Get user's country from IP or user profile
export const getUserCountry = async (): Promise<string> => {
  try {
    // Try to get from user profile first
    const userCountry = localStorage.getItem('user-country');
    if (userCountry) return userCountry;

    // Fallback to IP geolocation
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const country = data.country_code || 'NG'; // Default to Nigeria
    
    // Store for future use
    localStorage.setItem('user-country', country);
    return country;
  } catch (error) {
    console.error('Error getting user country:', error);
    return 'NG'; // Default to Nigeria
  }
};

// Get banks based on user's country
export const getBanksByCountry = async (country?: string): Promise<Bank[]> => {
  const userCountry = country || await getUserCountry();
  
  if (userCountry === 'NG') {
    return nigerianBanks;
  }
  
  return internationalBanks[userCountry] || internationalBanks['US']; // Default to US banks
};

// Get all banks (for admin or comprehensive search)
export const getAllBanks = (): Bank[] => {
  const allBanks = [...nigerianBanks];
  Object.values(internationalBanks).forEach(countryBanks => {
    allBanks.push(...countryBanks);
  });
  return allBanks;
};

// Search banks by name
export const searchBanks = async (query: string, country?: string): Promise<Bank[]> => {
  const banks = await getBanksByCountry(country);
  return banks.filter(bank => 
    bank.name.toLowerCase().includes(query.toLowerCase()) ||
    bank.code.toLowerCase().includes(query.toLowerCase())
  );
};

// Validate account number format by country
export const validateAccountNumber = (accountNumber: string, country: string): boolean => {
  switch (country) {
    case 'NG':
      return /^\d{10}$/.test(accountNumber); // Nigerian accounts are 10 digits
    case 'US':
      return /^\d{8,17}$/.test(accountNumber); // US accounts are 8-17 digits
    case 'GB':
      return /^\d{8}$/.test(accountNumber); // UK accounts are 8 digits
    case 'CA':
      return /^\d{7,12}$/.test(accountNumber); // Canadian accounts are 7-12 digits
    default:
      return /^\d{8,20}$/.test(accountNumber); // Generic validation
  }
};

// Account name verification (mock - in production use bank APIs)
export const verifyAccountName = async (
  accountNumber: string, 
  bankCode: string, 
  country: string = 'NG'
): Promise<{ success: boolean; accountName?: string; error?: string }> => {
  try {
    // Mock verification - in production, use actual bank APIs
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random success/failure for demo
    const isValid = Math.random() > 0.2;
    
    if (isValid) {
      const mockNames = [
        'Account Holder',
        'Bank Customer', 
        'Account Owner',
        'Valid Account',
        'Verified User',
        'Bank User'
      ];
      
      return {
        success: true,
        accountName: mockNames[Math.floor(Math.random() * mockNames.length)]
      };
    } else {
      return {
        success: false,
        error: 'Account number not found or invalid'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Unable to verify account. Please try again.'
    };
  }
};

export default {
  nigerianBanks,
  internationalBanks,
  getUserCountry,
  getBanksByCountry,
  getAllBanks,
  searchBanks,
  validateAccountNumber,
  verifyAccountName
};
