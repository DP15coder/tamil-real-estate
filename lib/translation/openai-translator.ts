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
    if (rows.length === 0) return [];
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing for translation");

    // Provide compact JSON to model
    const inputJson = JSON.stringify(rows);
    const prompt = `You are a translation assistant. Given a JSON array of Tamil Encumbrance Certificate transaction objects (keys are schema-defined), return the SAME JSON array with all Tamil textual content translated to English. Preserve keys, ordering, nulls, numeric strings and date strings EXACTLY. Only translate human Tamil text in fields: executant, claimant, transactionType, houseNumber, propertyDescription. If a field is null keep it null. Do NOT modify surveyNumber/documentNumber/documentYear if they look like identifiers. Output ONLY the JSON array.`;

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

    const raw = completion.choices[0].message.content?.trim() || "";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch (e) { throw new Error("Translator returned invalid JSON: " + (e as Error).message); }
    let arr: any[] = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.data) ? parsed.data : []);
    if (!Array.isArray(arr) || arr.length !== rows.length) throw new Error("Translator output array size mismatch");
    if (!validate(arr)) throw new Error("Translated output failed schema validation: " + ajv.errorsText(validate.errors));
    return arr as TranslatedTransaction[];
}