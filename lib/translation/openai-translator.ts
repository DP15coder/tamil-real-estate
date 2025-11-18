import Ajv from "ajv";
import type { ExtractedTransaction, TranslatedTransaction } from "@/types";
import { generate } from "@/lib/llm";
import { extractJson } from "../utils";


const ajv = new Ajv({ allErrors: true });
const schema = {
    type: "array",
    items: {
        type: "object",
        required: [
            "surveyNumber", "documentNumber", "documentYear", "registrationDate", "executionDate", "transactionType", "executant", "claimant", "houseNumber", "propertyDescription", "propertyValue"
        ],
        additionalProperties: false,
        properties: Object.fromEntries([
            "surveyNumber", "documentNumber", "documentYear", "registrationDate", "executionDate", "transactionType", "executant", "claimant", "houseNumber", "propertyDescription", "propertyValue"
        ].map(k => [k, { type: ["string", "null"] }]))
    }
};
const validate = ajv.compile(schema as any);

function buildSystemPrompt(single: ExtractedTransaction) {
    return `You are a precise Tamil to English translation assistant for Encumbrance Certificate transactions. Translate ONLY Tamil human-readable text in these fields: executant, claimant, transactionType, houseNumber, propertyDescription. Keep other fields EXACTLY unchanged: surveyNumber, documentNumber, documentYear, registrationDate, executionDate, propertyValue. Preserve nulls, strings (including numeric/date strings) verbatim if not one of the translatable fields. Return ONLY a JSON object of identical shape with the translated fields.`;
}

// Helper: parse & normalize a model response for one row
function parseSingleRow(raw: string, original: ExtractedTransaction, index: number): TranslatedTransaction {
    raw = raw.trim();
    // let parsed: any;
    const parsed: any = extractJson(raw)

    const requiredKeys = [
        "surveyNumber", "documentNumber", "documentYear", "registrationDate", "executionDate", "transactionType", "executant", "claimant", "houseNumber", "propertyDescription", "propertyValue"
    ] as const;
    for (const k of requiredKeys) {
        if (!(k in parsed)) {
            // If translation omitted a non-translated field, reinsert original
            parsed[k] = (original as any)[k] ?? null;
        }
    }
    return parsed as TranslatedTransaction;
}

// Translate a single row using generate()
async function translateRow(row: ExtractedTransaction, index: number, total: number): Promise<TranslatedTransaction> {
    console.log(`🔄 Translating row ${index + 1}/${total}`);
    const system = buildSystemPrompt(row);
    const userContent = JSON.stringify(row);
    const response = await generate([
        { role: "system", content: system },
        { role: "user", content: userContent }
    ]);

    console.log(`📝 Row ${index + 1} response (first 200 chars): ${response.substring(0, 200)}`);
    return parseSingleRow(response, row, index);
}

export async function translate_extracted_transactions(rows: ExtractedTransaction[]): Promise<TranslatedTransaction[]> {
    console.log("\n========== 🌐 TRANSLATION STARTED ==========");
    console.log(`📝 Translating ${rows.length} transactions individually...`);
    if (rows.length === 0) return [];

    // Parallel translation preserving order (Promise.all keeps order of input array)
    const translated = await Promise.all(rows.map((r, i) => translateRow(r, i, rows.length)));

    // Validate whole array shape after translations
    if (!validate(translated)) {
        throw new Error("Translated output failed schema validation: " + ajv.errorsText(validate.errors));
    }

    console.log("✅ All rows validated successfully");
    console.log("========== 🌐 TRANSLATION COMPLETED ==========\n");
    return translated;
}