// New extraction interface aligned with system.txt schema (camelCase keys)
// All fields are nullable strings; subdivisionNumber intentionally excluded.
export interface ExtractedTransaction {
  surveyNumber: string | null;
  documentNumber: string | null;
  documentYear: string | null;
  registrationDate: string | null;
  executionDate: string | null;
  transactionType: string | null;
  executant: string | null; // Tamil sellers combined
  claimant: string | null; // Tamil buyers combined
  houseNumber: string | null;
  propertyDescription: string | null;
  propertyValue: string | null;
}

// After translation we still keep same shape (English text where applicable)
export type TranslatedTransaction = ExtractedTransaction;

// Mapping of camelCase to snake_case DB columns
export const TRANSACTION_DB_COLUMN_MAP: Record<keyof ExtractedTransaction, string> = {
  surveyNumber: "survey_number",
  documentNumber: "document_number",
  documentYear: "document_year",
  registrationDate: "registration_date",
  executionDate: "execution_date",
  transactionType: "transaction_type",
  executant: "executant",
  claimant: "claimant",
  houseNumber: "house_number",
  propertyDescription: "property_description",
  propertyValue: "property_value"
};

export interface User {
  username: string;
  password: string;
}

