import pdf from "pdf-parse";
import { readFileSync } from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { ExtractedTransaction } from "@/types";
import { generate } from "../llm";
import { extractJson } from "../utils";


// JSON Schema for validation
const transactionSchema = {
    type: "object",
    additionalProperties: false,
    required: [
        "surveyNumber",
        "documentNumber",
        "documentYear",
        "registrationDate",
        "executionDate",
        "transactionType",
        "executant",
        "claimant",
        "houseNumber",
        "propertyDescription",
        "propertyValue"
    ],
    properties: {
        surveyNumber: { type: ["string", "null"] },
        documentNumber: { type: ["string", "null"] },
        documentYear: { type: ["string", "null"] },
        registrationDate: { type: ["string", "null"] },
        executionDate: { type: ["string", "null"] },
        transactionType: { type: ["string", "null"] },
        executant: { type: ["string", "null"] },
        claimant: { type: ["string", "null"] },
        houseNumber: { type: ["string", "null"] },
        propertyDescription: { type: ["string", "null"] },
        propertyValue: { type: ["string", "null"] }
    }
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateTransaction = ajv.compile(transactionSchema as any);
const validateTransactionArray = ajv.compile({
    type: "array",
    items: transactionSchema
} as any);


async function _extract_pdf_text(buffer: Buffer): Promise<string> {
    const data = await pdf(buffer);
    return data.text;
}

export async function extract_transactions_from_pdf(buffer: Buffer): Promise<ExtractedTransaction[]> {
    console.log("\n========== 🚀 LLM EXTRACTION STARTED ==========");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY missing: extraction cannot proceed (no fallback)");
    }

    const pdfText = await _extract_pdf_text(buffer);
    console.log(`📄 PDF text length: ${pdfText.length}`);

    const systemPath = path.join(process.cwd(), "lib", "pdf", "system.txt");
    const systemInstructions = readFileSync(systemPath, "utf8");

    const userContent = `$Here is the PDF content:\n################\n${pdfText.substring(0, 120000)}\n################`;
    // Use the shared generate function to obtain the raw JSON string
    const raw = await generate([
        { role: "system", content: systemInstructions },
        { role: "user", content: userContent }
    ]);

    const parsed: any[] = extractJson(raw);

    // Expect top-level array due to json_schema response format
    if (!Array.isArray(parsed)) {
        throw new Error("LLM response was not a top-level JSON array as expected");
    }

    if (!validateTransactionArray(parsed)) {
        throw new Error("Extraction JSON schema validation failed: " + ajv.errorsText(validateTransactionArray.errors));
    }

    const casted = parsed as ExtractedTransaction[];
    console.log(`✅ Extracted ${casted.length} transaction rows`);
    console.log("========== ✅ LLM EXTRACTION COMPLETED ==========");
    return casted;
}

