import OpenAI from "openai";
import Ajv from "ajv";
import type { ExtractedTransaction, TranslatedTransaction } from "@/types";

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

export async function translate_extracted_transactions(rows: ExtractedTransaction[]): Promise<TranslatedTransaction[]> {
    console.log("\n========== 🌐 TRANSLATION STARTED ==========");
    console.log(`📝 Translating ${rows.length} transactions...`);
    
    if (rows.length === 0) return [];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing for translation");

    // Provide compact JSON to model
    const inputJson = JSON.stringify(rows);
    console.log(`📄 Input JSON length: ${inputJson.length} characters`);
    
    const prompt = `You are a translation assistant. Given a JSON array of Tamil Encumbrance Certificate transaction objects (keys are schema-defined), return the SAME JSON array with all Tamil textual content translated to English. Preserve keys, ordering, nulls, numeric strings and date strings EXACTLY. Only translate human Tamil text in fields: executant, claimant, transactionType, houseNumber, propertyDescription. If a field is null keep it null. Do NOT modify surveyNumber/documentNumber/documentYear if they look like identifiers. Output ONLY the JSON array.`;

    console.log("🤖 Calling OpenAI for translation...");
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: inputJson }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
    });

    console.log("✅ Translation API call completed");
    const raw = completion.choices[0].message.content?.trim() || "";
    console.log("📝 Translation response (first 500 chars):", raw.substring(0, 500));
    
    let parsed: any;
    try { 
        parsed = JSON.parse(raw); 
    } catch (e) { 
        throw new Error("Translator returned invalid JSON: " + (e as Error).message); 
    }
    
    // Extract array from various possible response formats
    let arr: any[] = [];
    if (Array.isArray(parsed)) {
        arr = parsed;
    } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
        arr = parsed.transactions;
    } else if (parsed.data && Array.isArray(parsed.data)) {
        arr = parsed.data;
    } else {
        // Try to find any array in the object
        const keys = Object.keys(parsed);
        for (const key of keys) {
            if (Array.isArray(parsed[key])) {
                arr = parsed[key];
                break;
            }
        }
    }
    
    console.log(`📊 Translation: Input ${rows.length} rows, Output ${arr.length} rows`);
    
    if (!Array.isArray(arr)) {
        throw new Error("Translator output is not an array. Keys: " + Object.keys(parsed).join(", "));
    }
    
    if (arr.length !== rows.length) {
        console.warn(`⚠️ Array size mismatch: Expected ${rows.length}, got ${arr.length}`);
        console.log("Input sample:", JSON.stringify(rows[0], null, 2));
        console.log("Output sample:", JSON.stringify(arr[0], null, 2));
        throw new Error(`Translator output array size mismatch: expected ${rows.length}, got ${arr.length}`);
    }
    
    if (!validate(arr)) {
        throw new Error("Translated output failed schema validation: " + ajv.errorsText(validate.errors));
    }
    
    console.log("✅ Translation validation passed");
    console.log("========== 🌐 TRANSLATION COMPLETED ==========\n");
    return arr as TranslatedTransaction[];
}