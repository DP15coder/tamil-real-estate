export interface Transaction {
  id: number;
  surveyNumber: string | null;
  district: string | null;
  documentNumber: string | null;
  registrationDate: string | null;
  executionDate: string | null;
  buyerNameTamil: string | null;
  buyerNameEnglish: string | null;
  sellerNameTamil: string | null;
  sellerNameEnglish: string | null;
  houseNumber: string | null;
  propertyDescriptionTamil: string | null;
  propertyDescriptionEnglish: string | null;
  propertyValue: string | null;
  village: string | null;
  taluk: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  pdfSource: string | null;
}

export interface TransactionFilter {
  buyerName?: string;
  sellerName?: string;
  surveyNumber?: string;
  documentNumber?: string;
  houseNumber?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
}

export interface ParsedTransaction {
  surveyNumber?: string;
  district?: string;
  documentNumber?: string;
  registrationDate?: string;
  executionDate?: string;
  buyerNameTamil?: string;
  sellerNameTamil?: string;
  houseNumber?: string;
  propertyDescriptionTamil?: string;
  propertyValue?: string;
  village?: string;
  taluk?: string;
}

export interface User {
  username: string;
  password: string;
}

