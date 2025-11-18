import { pgTable, serial, varchar, text, date, decimal, timestamp } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  surveyNumber: varchar("survey_number", { length: 255 }),
  district: varchar("district", { length: 255 }),
  documentNumber: varchar("document_number", { length: 255 }),
  registrationDate: date("registration_date"),
  executionDate: date("execution_date"),
  buyerNameTamil: text("buyer_name_tamil"),
  buyerNameEnglish: text("buyer_name_english"),
  sellerNameTamil: text("seller_name_tamil"),
  sellerNameEnglish: text("seller_name_english"),
  houseNumber: varchar("house_number", { length: 255 }),
  propertyDescriptionTamil: text("property_description_tamil"),
  propertyDescriptionEnglish: text("property_description_english"),
  propertyValue: decimal("property_value", { precision: 15, scale: 2 }),
  village: varchar("village", { length: 255 }),
  taluk: varchar("taluk", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  pdfSource: varchar("pdf_source", { length: 255 }),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

