import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { get_current_user } from "@/lib/auth";
import { extract_transactions_from_pdf } from "@/lib/pdf/gemini-parser";
import { translate_transaction_fields } from "@/lib/translation/translator";
import { db } from "@/lib/db/client";
import { transactions } from "@/lib/db/schema";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

/**
 """
 Handles PDF file upload, parsing, translation, and storage.
 """
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await get_current_user();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }
    
    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save file
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);
    
    // Extract transactions from PDF
    const parsedTransactions = await extract_transactions_from_pdf(buffer);
    
    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found in PDF" },
        { status: 400 }
      );
    }
    
    // Filter out incomplete transactions
    // Must have: documentNumber AND (buyerNameTamil OR sellerNameTamil)
    const validTransactions = parsedTransactions.filter(t => {
      const hasDocNumber = t.documentNumber && t.documentNumber.trim() !== "";
      const hasBuyer = t.buyerNameTamil && t.buyerNameTamil.trim() !== "";
      const hasSeller = t.sellerNameTamil && t.sellerNameTamil.trim() !== "";
      return hasDocNumber && (hasBuyer || hasSeller);
    });
    
    console.log(`\n📊 Filtered: ${parsedTransactions.length} → ${validTransactions.length} valid transactions\n`);
    
    if (validTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in PDF" },
        { status: 400 }
      );
    }
    
    // Translate and save transactions
    const savedTransactions = [];
    
    for (const transaction of validTransactions) {
      // Translate Tamil fields to English
      const translatedTransaction = await translate_transaction_fields(transaction);
      
      // Clean up data before insertion
      const cleanedData: any = {
        ...translatedTransaction,
        pdfSource: filename,
        // Convert empty strings to null for numeric fields
        propertyValue: translatedTransaction.propertyValue && translatedTransaction.propertyValue.trim() !== "" 
          ? translatedTransaction.propertyValue 
          : null,
      };
      
      // Insert into database
      const [saved] = await db
        .insert(transactions)
        .values(cleanedData)
        .returning();
      
      savedTransactions.push(saved);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${savedTransactions.length} transaction(s)`,
      count: savedTransactions.length,
      transactions: savedTransactions,
    });
  } catch (error) {
    console.error("Upload error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An error occurred during upload" },
      { status: 500 }
    );
  }
}

