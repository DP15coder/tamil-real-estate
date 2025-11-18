import pdf from "pdf-parse";
import type { ParsedTransaction } from "@/types";

/**
 """
 Parses a PDF file and extracts text content.
 
 Args:
     buffer: PDF file buffer
     
 Returns:
     Extracted text content from the PDF
 """
 */
export async function _extract_pdf_text(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

/**
 """
 Extracts transaction data from parsed PDF text.
 Handles Tamil text and structured table data.
 
 Args:
     text: Raw text extracted from PDF
     
 Returns:
     Array of parsed transactions
 """
 */
export async function extract_transactions_from_pdf(
  buffer: Buffer
): Promise<ParsedTransaction[]> {
  const text = await _extract_pdf_text(buffer);
  
  const transactions: ParsedTransaction[] = [];
  const lines = text.split("\n").map((line) => line.trim());
  
  let currentTransaction: Partial<ParsedTransaction> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line) continue;
    
    // Pattern matching for various fields
    // Document number patterns
    if (_contains_tamil_pattern(line, ["எண்", "வ.எண்"])) {
      const docNum = _extract_number_after_pattern(line, ["எண்", "வ.எண்"]);
      if (docNum) currentTransaction.documentNumber = docNum;
    }
    
    // Survey number patterns
    if (_contains_tamil_pattern(line, ["சர்வே", "எண்"])) {
      const surveyNum = _extract_survey_number(line);
      if (surveyNum) currentTransaction.surveyNumber = surveyNum;
    }
    
    // Date patterns (DD-MM-YYYY or DD.MM.YYYY)
    const dateMatch = line.match(/(\d{1,2}[-./]\d{1,2}[-./]\d{4})/);
    if (dateMatch) {
      if (!currentTransaction.registrationDate) {
        currentTransaction.registrationDate = _normalize_date(dateMatch[1]);
      } else if (!currentTransaction.executionDate) {
        currentTransaction.executionDate = _normalize_date(dateMatch[1]);
      }
    }
    
    // District/Village/Taluk patterns
    if (_contains_tamil_pattern(line, ["மாவட்டம்"])) {
      currentTransaction.district = _extract_tamil_word_after(line, "மாவட்டம்");
    }
    
    if (_contains_tamil_pattern(line, ["கிராமம்"])) {
      currentTransaction.village = _extract_tamil_word_after(line, "கிராமம்");
    }
    
    if (_contains_tamil_pattern(line, ["தாலுக்கா"])) {
      currentTransaction.taluk = _extract_tamil_word_after(line, "தாலுக்கா");
    }
    
    // Buyer/Seller name patterns (வாங்கியவர் - buyer, விற்றவர் - seller)
    if (_contains_tamil_pattern(line, ["வாங்கியவர்", "வாங்குபவர்"])) {
      const nextLine = lines[i + 1] || "";
      currentTransaction.buyerNameTamil = _extract_name(nextLine);
    }
    
    if (_contains_tamil_pattern(line, ["விற்றவர்", "விற்பவர்"])) {
      const nextLine = lines[i + 1] || "";
      currentTransaction.sellerNameTamil = _extract_name(nextLine);
    }
    
    // Property value patterns (ரூ., Rs.)
    if (line.match(/ரூ\.?\s*[\d,]+/) || line.match(/Rs\.?\s*[\d,]+/)) {
      const valueMatch = line.match(/[\d,]+/);
      if (valueMatch) {
        currentTransaction.propertyValue = valueMatch[0].replace(/,/g, "");
      }
    }
    
    // Property description - capture Tamil text blocks
    if (_is_property_description_line(line)) {
      currentTransaction.propertyDescriptionTamil =
        (currentTransaction.propertyDescriptionTamil || "") + " " + line;
    }
    
    // Transaction boundary detection (new transaction starts)
    if (_is_transaction_boundary(line, i, lines)) {
      if (Object.keys(currentTransaction).length > 0) {
        transactions.push(currentTransaction as ParsedTransaction);
        currentTransaction = {};
      }
    }
  }
  
  // Add the last transaction
  if (Object.keys(currentTransaction).length > 0) {
    transactions.push(currentTransaction as ParsedTransaction);
  }
  
  return transactions;
}

function _contains_tamil_pattern(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function _extract_number_after_pattern(
  text: string,
  patterns: string[]
): string | null {
  for (const pattern of patterns) {
    const index = text.indexOf(pattern);
    if (index !== -1) {
      const afterPattern = text.substring(index + pattern.length);
      const numMatch = afterPattern.match(/[\d/]+/);
      return numMatch ? numMatch[0] : null;
    }
  }
  return null;
}

function _extract_survey_number(text: string): string | null {
  const match = text.match(/(\d+[-/]\d+|\d+)/);
  return match ? match[0] : null;
}

function _normalize_date(dateStr: string): string {
  const parts = dateStr.split(/[-./]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

function _extract_tamil_word_after(text: string, marker: string): string {
  const index = text.indexOf(marker);
  if (index !== -1) {
    const afterMarker = text.substring(index + marker.length).trim();
    const words = afterMarker.split(/\s+/);
    return words[0] || "";
  }
  return "";
}

function _extract_name(text: string): string {
  return text.trim().replace(/^\d+\.\s*/, "");
}

function _is_property_description_line(line: string): boolean {
  const tamilCharsCount = (line.match(/[\u0B80-\u0BFF]/g) || []).length;
  return tamilCharsCount > 10 && !line.match(/\d{1,2}[-./]\d{1,2}[-./]\d{4}/);
}

function _is_transaction_boundary(
  line: string,
  index: number,
  allLines: string[]
): boolean {
  // New transaction typically starts with a serial number
  const isSerialNumber = /^\d+\s*$/.test(line);
  const nextLineHasDate =
    index + 1 < allLines.length &&
    allLines[index + 1].match(/\d{1,2}[-./]\d{1,2}[-./]\d{4}/);
  
  return isSerialNumber && Boolean(nextLineHasDate);
}

