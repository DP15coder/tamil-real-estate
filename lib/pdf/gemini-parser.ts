import OpenAI from "openai";
import pdf from "pdf-parse";
import type { ParsedTransaction } from "@/types";

/**
 * Uses OpenAI GPT to intelligently parse Tamil Encumbrance Certificate PDFs
 * Much better than manual regex parsing!
 */

async function _extract_pdf_text(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

export async function extract_transactions_from_pdf(
  buffer: Buffer
): Promise<ParsedTransaction[]> {
  console.log("\n========== 🤖 OpenAI GPT PDF PARSING STARTED ==========");

  // Check if OpenAI API key is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  No OPENAI_API_KEY found, falling back to basic extraction");
    return fallback_parser(buffer);
  }

  try {
    // Extract text from PDF
    const text = await _extract_pdf_text(buffer);
    console.log(`📄 Extracted ${text.length} characters from PDF`);

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });

    // Create structured prompt for GPT
    const prompt = `You are an AI assistant that extracts transaction data from Tamil Encumbrance Certificate PDFs.

The PDF contains a table with these columns in order:
1. Sr. No. (Serial Number)
2. Document No. & Year (e.g., "200/2013")
3. Dates (Execution/Registration dates)
4. Nature (Transaction type like "Conveyance", "Sale")
5. Name of Executant(s) - SELLER (எழுதிக்கொடுத்தவர்) - may have multiple names
6. Name of Claimant(s) - BUYER (எழுதி வாங்கியவர்) - may have multiple names
7. Vol.No & Page No.

CRITICAL RULES:
- Column 5 (Executant/எழுதிக்கொடுத்தவர்) is the SELLER - capture ALL names from this column
- Column 6 (Claimant/வாங்கியவர்) is the BUYER - capture ALL names from this column
- If a person has multiple names listed (like "1. name1 (details) 2. name2"), include ALL of them in ONE string
- Names with brackets like "(முதல்வர்)" or "(தனக்காகவும்)" should be kept with the person's name
- Keep seller and buyer separate - don't mix them up

Extract each table row as a JSON object with these fields:
- documentNumber: string (e.g., "200/2013")
- registrationDate: string (format: YYYY-MM-DD, convert DD-MM-YYYY to YYYY-MM-DD)
- executionDate: string (format: YYYY-MM-DD) 
- sellerNameTamil: string (ALL seller names from Executant column, space-separated)
- buyerNameTamil: string (ALL buyer names from Claimant column, space-separated)
- propertyValue: string (numeric value without commas, or empty string if not found)
- surveyNumber: string (survey/plot number if mentioned)

Return ONLY a valid JSON array of transaction objects. No markdown code blocks, no explanations, just the JSON array.

Here is the PDF text:

${text.substring(0, 100000)}
`;

    console.log("🤖 Sending to OpenAI GPT...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini - faster and cheaper, great for structured tasks
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction assistant. Return only valid JSON arrays without any markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent, accurate extraction
      response_format: { type: "json_object" } // Ensure JSON response
    });

    const responseText = completion.choices[0].message.content || "{}";
    console.log("✅ Got response from OpenAI GPT");
    console.log(`📝 Response length: ${responseText.length} characters`);

    // Parse the JSON response
    let transactions: ParsedTransaction[] = [];
    
    try {
      // Try to extract JSON from response
      const parsed = JSON.parse(responseText);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        transactions = parsed;
      } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
        transactions = parsed.transactions;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        transactions = parsed.data;
      } else {
        console.warn("⚠️  Unexpected response format:", Object.keys(parsed));
        // Try to find an array in the response
        const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
        if (arrayKey) {
          transactions = parsed[arrayKey];
        }
      }
      
      console.log(`✅ Parsed ${transactions.length} transactions from GPT`);
      
      // Log first transaction as sample
      if (transactions.length > 0) {
        console.log("📋 Sample transaction:", JSON.stringify(transactions[0], null, 2));
      }
      
    } catch (error) {
      console.error("❌ Failed to parse GPT response as JSON:", error);
      console.log("Response was:", responseText.substring(0, 500));
      throw new Error("Failed to parse GPT response");
    }

    console.log("========== 🤖 OpenAI GPT PARSING COMPLETED ==========\n");
    return transactions;

  } catch (error) {
    console.error("❌ OpenAI GPT parsing failed:", error);
    console.log("⚠️  Falling back to basic parser");
    return fallback_parser(buffer);
  }
}

/**
 * Fallback parser using basic regex (used when OpenAI API is not available)
 */
async function fallback_parser(buffer: Buffer): Promise<ParsedTransaction[]> {
  console.log("📝 Using fallback regex parser");
  const text = await _extract_pdf_text(buffer);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const transactions: ParsedTransaction[] = [];
  let current: Partial<ParsedTransaction> = {};

  for (const line of lines) {
    // Document number starts new transaction
    if (/^\d+\/\d{4}$/.test(line)) {
      if (current.documentNumber) {
        transactions.push(current as ParsedTransaction);
      }
      current = { documentNumber: line };
    }
    // Extract dates
    else if (/\d{1,2}[-./]\d{1,2}[-./]\d{4}/.test(line)) {
      const date = normalizeDate(line);
      if (!current.registrationDate) current.registrationDate = date;
      else if (!current.executionDate) current.executionDate = date;
    }
    // Extract Tamil names
    else if (/[\u0B80-\u0BFF]+/.test(line) && line.length > 5) {
      if (!current.sellerNameTamil && !line.includes("Consideration")) {
        current.sellerNameTamil = line;
      } else if (!current.buyerNameTamil && !line.includes("Consideration")) {
        current.buyerNameTamil = line;
      }
    }
  }

  if (current.documentNumber) {
    transactions.push(current as ParsedTransaction);
  }

  console.log(`✅ Fallback parser extracted ${transactions.length} transactions`);
  return transactions;
}

function normalizeDate(dateStr: string): string {
  const parts = dateStr.split(/[-./]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}
