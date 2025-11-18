// import pdf from "pdf-parse";
// import type { ParsedTransaction } from "@/types";

// async function _extract_pdf_text(buffer: Buffer): Promise<string> {
//   const data = await pdf(buffer);
//   return data.text;
// }

// /**
//  * Extracts transaction data from tabular Encumbrance Certificate PDFs
//  * Table columns: Sr.No | Doc No | Dates | Nature | Executant (Seller) | Claimant (Buyer) | Page No
//  */
// export async function extract_transactions_from_pdf(
//   buffer: Buffer
// ): Promise<ParsedTransaction[]> {
//   console.log("\n========== PDF PARSING STARTED ==========");
//   const text = await _extract_pdf_text(buffer);

//   const lines = text.split("\n").map((line) => line.trim()).filter(line => line);
//   console.log(`📝 Total lines: ${lines.length}\n`);

//   const transactions: ParsedTransaction[] = [];

//   // Find table header line
//   let tableStartIndex = -1;
//   for (let i = 0; i < lines.length; i++) {
//     if (lines[i].includes("Document No") || lines[i].includes("Claimant") || lines[i].includes("Executant")) {
//       tableStartIndex = i + 1;
//       console.log(`📊 Table starts at line ${tableStartIndex}`);
//       break;
//     }
//   }

//   if (tableStartIndex === -1) {
//     console.warn("⚠️ Could not find table header");
//     return [];
//   }

//   // State machine for parsing table rows
//   // Columns: Sr.No → Doc No → Dates → Nature → Seller → Buyer → Page No
//   let currentTransaction: Partial<ParsedTransaction> = {};
//   let currentColumn: 'docNo' | 'dates' | 'nature' | 'seller' | 'buyer' | 'other' = 'other';
//   let skipUntilNextDoc = false;

//   for (let i = tableStartIndex; i < lines.length; i++) {
//     const line = lines[i];
    
//     // Skip empty lines
//     if (!line) continue;

//     // Document Number pattern (e.g., "200/2013") - ALWAYS starts a new transaction row
//     if (/^\d+\/\d{4}$/.test(line)) {
//       // Save previous transaction if valid
//       if (currentTransaction.documentNumber && (currentTransaction.buyerNameTamil || currentTransaction.sellerNameTamil)) {
//         transactions.push({ ...currentTransaction } as ParsedTransaction);
//         console.log(`✅ Transaction ${transactions.length}:`, currentTransaction);
//       }
      
//       // Start new transaction
//       currentTransaction = { documentNumber: line };
//       currentColumn = 'dates';
//       skipUntilNextDoc = false;
//       console.log(`\n🔹 New row: ${line}`);
//       continue;
//     }

//     // Skip if we're not in a transaction
//     if (!currentTransaction.documentNumber) continue;

//     // Column 3: Dates (right after document number)
//     if (currentColumn === 'dates') {
//       if (/\d{1,2}[-./]\d{1,2}[-./]\d{4}/.test(line)) {
//         if (!currentTransaction.registrationDate) {
//           currentTransaction.registrationDate = normalizeDate(line);
//           console.log(`   📅 Date: ${line}`);
//         } else if (!currentTransaction.executionDate) {
//           currentTransaction.executionDate = normalizeDate(line);
//         }
//         continue;
//       }
//       // Move to nature column when we see transaction type
//       if (/(Conveyance|Sale|Gift|Mortgage|Lease|Non Metro)/i.test(line)) {
//         currentColumn = 'nature';
//         console.log(`   📋 Nature detected`);
//         // Don't continue - process this line in nature column
//       }
//     }

//     // Column 4: Nature/Type (Conveyance, Sale, etc.)
//     if (currentColumn === 'nature' || /(Conveyance|Sale|Gift|Mortgage|Lease)/i.test(line)) {
//       if (/(Conveyance|Sale|Gift|Mortgage|Lease)/i.test(line)) {
//         currentColumn = 'seller';
//         console.log(`   📋 Moving to Seller column`);
//         continue;
//       }
//     }

//     // Column 5: Seller/Executant (எழுதிக்கொடுத்தவர்) - BEFORE Buyer
//     if (currentColumn === 'seller') {
//       // Skip column headers
//       if (line.includes("Executant") || line.includes("எழுதிக்கொடுத்தவர்") || line.includes("பெயர்(கள்)")) {
//         continue;
//       }
      
//       // Capture Tamil text as seller
//       if (/[\u0B80-\u0BFF]/.test(line) && !currentTransaction.sellerNameTamil) {
//         // Skip "Consideration Value" lines
//         if (!line.includes("Consideration") && !line.includes("Market Value") && !line.includes("ைகமாற்று")) {
//           currentTransaction.sellerNameTamil = cleanName(line);
//           currentColumn = 'buyer';
//           console.log(`   👤 Seller: ${line.substring(0, 30)}...`);
//           continue;
//         }
//       }
      
//       // English names (for seller)
//       if (!currentTransaction.sellerNameTamil && /^[A-Za-z\s.&(),]+$/.test(line) && line.length > 3) {
//         if (!line.includes("Consideration") && !line.includes("Market")) {
//           currentTransaction.sellerNameTamil = cleanName(line);
//           currentColumn = 'buyer';
//           console.log(`   👤 Seller (EN): ${line}`);
//           continue;
//         }
//       }
//     }

//     // Column 6: Buyer/Claimant (எழுதி வாங்கியவர்) - AFTER Seller
//     if (currentColumn === 'buyer') {
//       // Skip column headers
//       if (line.includes("Claimant") || line.includes("வாங்கியவர்") || line.includes("பெயர்(கள்)")) {
//         continue;
//       }
      
//       // Check if we've moved to Page/Volume column (Vol.No)
//       if (line.includes("Vol.No") || /^PR Number/.test(line)) {
//         currentColumn = 'other';
//         skipUntilNextDoc = true;
//         continue;
//       }
      
//       // English names (for buyer)
//       if (!currentTransaction.buyerNameTamil && /^[A-Za-z\s.&(),]+$/.test(line) && line.length > 3) {
//         currentTransaction.buyerNameTamil = cleanName(line);
//         currentColumn = 'other';
//         skipUntilNextDoc = true;
//         console.log(`   👤 Buyer (EN): ${line}`);
//         continue;
//       }
      
//       // If we see page numbers or other metadata, we're done with buyer column
//       if (/^\d+$/.test(line) && line.length <= 4) {
//         currentColumn = 'other';
//         skipUntilNextDoc = true;
//       }
//     }

//     // Extract property value if present (anywhere in the row)
//     if (/ரூ|Rs\.?\s*[\d,]+/.test(line) && !currentTransaction.propertyValue) {
//       const match = line.match(/[\d,]+/);
//       if (match && match[0].length >= 4) { // At least 4 digits for valid amount
//         currentTransaction.propertyValue = match[0].replace(/,/g, "");
//         console.log(`   💰 Value: ${match[0]}`);
//       }
//     }

//     // Extract survey number if present
//     if (/Survey No|சர்வே எண்|எண்[:.]?\s*\d+/.test(line) && !currentTransaction.surveyNumber) {
//       const match = line.match(/\d+[-/]?\d*/);
//       if (match) {
//         currentTransaction.surveyNumber = match[0];
//       }
//     }
//   }

//   // Save last transaction if valid
//   if (currentTransaction.documentNumber && (currentTransaction.buyerNameTamil || currentTransaction.sellerNameTamil)) {
//     transactions.push(currentTransaction as ParsedTransaction);
//     console.log(`✅ Transaction ${transactions.length}:`, currentTransaction);
//   }

//   console.log(`\n✅ Total transactions extracted: ${transactions.length}`);
//   console.log("========== PDF PARSING COMPLETED ==========\n");

//   return transactions;
// }

// function normalizeDate(dateStr: string): string {
//   const parts = dateStr.split(/[-./]/);
//   if (parts.length === 3) {
//     const [day, month, year] = parts;
//     return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
//   }
//   return dateStr;
// }

// function cleanName(text: string): string {
//   return text.trim()
//     .replace(/^\d+\.\s*/, "") // Remove leading numbers
//     .replace(/^[:\s-]+/, ""); // Remove leading punctuation
// }






















// // import pdf from "pdf-parse";
// // import type { ParsedTransaction } from "@/types";

// // /**
// //  * Parses a PDF file and extracts text content.
// //  */
// // async function _extract_pdf_text(buffer: Buffer): Promise<string> {
// //   const data = await pdf(buffer);
// //   return data.text;
// // }

// // /**
// //  * Extracts transaction data from tabular Tamil land record PDFs
// //  * Key fix: Recognizes table structure and groups related data correctly
// //  */
// // export async function extract_transactions_from_pdf(
// //   buffer: Buffer
// // ): Promise<ParsedTransaction[]> {
// //   console.log("\n========== PDF PARSING STARTED ==========");
// //   const text = await _extract_pdf_text(buffer);
  
// //   const lines = text.split("\n").map((line) => line.trim()).filter(line => line);
// //   console.log(`📝 Total lines: ${lines.length}\n`);
  
// //   const transactions: ParsedTransaction[] = [];
  
// //   // Find table start (usually after headers like "Serial No", "Document No", etc.)
// //   let tableStartIndex = -1;
// //   for (let i = 0; i < lines.length; i++) {
// //     if (lines[i].includes("Document No") || lines[i].includes("வ.எண்")) {
// //       tableStartIndex = i + 1;
// //       console.log(`📊 Table starts at line ${tableStartIndex}`);
// //       break;
// //     }
// //   }
  
// //   if (tableStartIndex === -1) {
// //     console.warn("⚠️ Could not find table header");
// //     return [];
// //   }
  
// //   // Parse table rows
// //   let currentTransaction: Partial<ParsedTransaction> = {};
// //   let expectingData = {
// //     docNumber: false,
// //     date: false,
// //     survey: false,
// //     buyer: false,
// //     seller: false,
// //     value: false
// //   };
  
// //   for (let i = tableStartIndex; i < lines.length; i++) {
// //     const line = lines[i];

// //     // Check if this is a new row (starts with doc number pattern like "200/2013")
// //     const isNewRow = /^\d+\/\d{4}$/.test(line);

// //     if (isNewRow && Object.keys(currentTransaction).length > 0) {
// //       // Save previous transaction if it has essential data
// //       if (currentTransaction.documentNumber) {
// //         transactions.push({ ...currentTransaction } as ParsedTransaction);
// //         console.log(`✅ Transaction ${transactions.length}:`, currentTransaction);
// //       }
// //       currentTransaction = {};
// //       expectingData = {
// //         docNumber: false,
// //         date: false,
// //         survey: false,
// //         buyer: false,
// //         seller: false,
// //         value: false
// //       };
// //     }
    
// //     // Document number (e.g., "200/2013")
// //     if (/^\d+\/\d{4}$/.test(line)) {
// //       currentTransaction.documentNumber = line;
// //       expectingData.date = true;
// //       continue;
// //     }
    
// //     // Date (DD-MM-YYYY or DD.MM.YYYY)
// //     if (expectingData.date && /\d{1,2}[-./]\d{1,2}[-./]\d{4}/.test(line)) {
// //       if (!currentTransaction.registrationDate) {
// //         currentTransaction.registrationDate = normalizeDate(line);
// //       } else if (!currentTransaction.executionDate) {
// //         currentTransaction.executionDate = normalizeDate(line);
// //       }
// //       continue;
// //     }
    
// //     // Survey number (just numbers or number/number)
// //     if (/^\d+[-/]?\d*$/.test(line) && !currentTransaction.surveyNumber) {
// //       currentTransaction.surveyNumber = line;
// //       continue;
// //     }
    
// //     // Transaction type keywords
// //     if (/(Conveyance|Sale|Gift|Mortgage|Lease)/i.test(line)) {
// //       expectingData.buyer = true;
// //       continue;
// //     }
    
// //     // Buyer name (Tamil text after transaction type)
// //     if (expectingData.buyer && /[\u0B80-\u0BFF]/.test(line) && !currentTransaction.buyerNameTamil) {
// //       currentTransaction.buyerNameTamil = cleanName(line);
// //       expectingData.buyer = false;
// //       expectingData.seller = true;
// //       continue;
// //     }
    
// //     // Seller name (Tamil text after buyer)
// //     // Skip field labels like "Consideration Value"
// //     if (expectingData.seller && /[\u0B80-\u0BFF]/.test(line) && !currentTransaction.sellerNameTamil && 
// //         !line.includes("Consideration Value") && !line.includes("Market Value")) {
// //       currentTransaction.sellerNameTamil = cleanName(line);
// //       expectingData.seller = false;
// //       expectingData.value = true;
// //       continue;
// //     }
    
// //     // Property value (numbers with Rs. or ரூ.)
// //     if ((expectingData.value || /ரூ|Rs/.test(line)) && /[\d,]+/.test(line)) {
// //       const match = line.match(/[\d,]+/);
// //       if (match) {
// //         currentTransaction.propertyValue = match[0].replace(/,/g, "");
// //         expectingData.value = false;
// //       }
// //       continue;
// //     }
    
// //     // Check for buyer/seller markers in line
// //     if (/எழுதி\s*வாங்கியவர்|வாங்குபவர்|Claimant/i.test(line)) {
// //       expectingData.buyer = true;
// //     }
// //     if (/எழுதிக்.*கொடுத்தவர்|விற்றவர்|Executant/i.test(line)) {
// //       expectingData.seller = true;
// //     }
// //   }
  
// //   // Add last transaction if it has essential data
// //   if (Object.keys(currentTransaction).length > 0 && currentTransaction.documentNumber) {
// //     transactions.push(currentTransaction as ParsedTransaction);
// //     console.log(`✅ Transaction ${transactions.length}:`, currentTransaction);
// //   }
  
// //   console.log(`\n✅ Total transactions extracted: ${transactions.length}`);
// //   console.log("========== PDF PARSING COMPLETED ==========\n");
  
// //   return transactions;
// // }

// // function normalizeDate(dateStr: string): string {
// //   const parts = dateStr.split(/[-./]/);
// //   if (parts.length === 3) {
// //     const [day, month, year] = parts;
// //     return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
// //   }
// //   return dateStr;
// // }

// // function cleanName(text: string): string {
// //   return text.trim()
// //     .replace(/^\d+\.\s*/, "") // Remove leading numbers
// //     .replace(/^[:\s-]+/, ""); // Remove leading punctuation
// // }




