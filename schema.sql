-- Tamil Real Estate Transactions Database Schema

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  survey_number VARCHAR(255),
  district VARCHAR(255),
  document_number VARCHAR(255),
  registration_date DATE,
  execution_date DATE,
  buyer_name_tamil TEXT,
  buyer_name_english TEXT,
  seller_name_tamil TEXT,
  seller_name_english TEXT,
  house_number VARCHAR(255),
  property_description_tamil TEXT,
  property_description_english TEXT,
  property_value DECIMAL(15, 2),
  village VARCHAR(255),
  taluk VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_source VARCHAR(255)
);

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_buyer_name ON transactions(buyer_name_english);
CREATE INDEX IF NOT EXISTS idx_seller_name ON transactions(seller_name_english);
CREATE INDEX IF NOT EXISTS idx_survey_number ON transactions(survey_number);
CREATE INDEX IF NOT EXISTS idx_document_number ON transactions(document_number);
CREATE INDEX IF NOT EXISTS idx_registration_date ON transactions(registration_date);
CREATE INDEX IF NOT EXISTS idx_house_number ON transactions(house_number);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE transactions IS 'Stores Tamil real estate transaction data extracted from PDFs';
COMMENT ON COLUMN transactions.survey_number IS 'Survey number of the property';
COMMENT ON COLUMN transactions.document_number IS 'Official document number from registration';
COMMENT ON COLUMN transactions.buyer_name_tamil IS 'Buyer name in Tamil script';
COMMENT ON COLUMN transactions.buyer_name_english IS 'Buyer name translated to English';
COMMENT ON COLUMN transactions.seller_name_tamil IS 'Seller name in Tamil script';
COMMENT ON COLUMN transactions.seller_name_english IS 'Seller name translated to English';
COMMENT ON COLUMN transactions.property_description_tamil IS 'Property description in Tamil';
COMMENT ON COLUMN transactions.property_description_english IS 'Property description translated to English';
COMMENT ON COLUMN transactions.pdf_source IS 'Original PDF filename';

