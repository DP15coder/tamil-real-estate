/**
 """
 Translation service for Tamil to English conversion.
 Uses Google Translate API if available, falls back to simple transliteration.
 """
 */

interface TranslationResult {
  originalText: string;
  translatedText: string;
  language: string;
}

const TAMIL_TO_ENGLISH_COMMON: Record<string, string> = {
  // Common words
  மாவட்டம்: "District",
  கிராமம்: "Village",
  தாலுக்கா: "Taluk",
  வாங்கியவர்: "Buyer",
  விற்றவர்: "Seller",
  சர்வே: "Survey",
  எண்: "No",
  "வ.எண்": "S.No",
  ரூ: "Rs",
  // Districts
  சென்னை: "Chennai",
  திருவள்ளூர்: "Thiruvallur",
  காஞ்சிபுரம்: "Kanchipuram",
  விழுப்புரம்: "Villupuram",
  // Common property terms
  மனை: "House site",
  நிலம்: "Land",
  வீடு: "House",
  கட்டிடம்: "Building",
};

/**
 """
 Translates Tamil text to English.
 
 Args:
     text: Tamil text to translate
     
 Returns:
     Translated English text
 """
 */
export async function translate_tamil_to_english(text: string): Promise<string> {
  if (!text || text.trim() === "") {
    return "";
  }
  
  console.log(`\n🔤 Translating: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
  
  // Try Google Translate API if key is available
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      console.log("   → Using Google Translate API");
      const result = await _translate_with_google(text);
      console.log(`   ✅ Result: "${result}"`);
      return result;
    } catch (error) {
      console.error("   ❌ Google Translate failed, falling back to MyMemory:", error);
    }
  }
  
  // Try MyMemory free API
  try {
    console.log("   → Using MyMemory API");
    const result = await _translate_with_mymemory(text);
    console.log(`   ✅ Result: "${result}"`);
    return result;
  } catch (error) {
    console.error("   ❌ MyMemory Translate failed, falling back to manual:", error);
  }
  
  // Fallback to manual translation
  console.log("   → Using Manual Translation");
  const result = _translate_manually(text);
  console.log(`   ✅ Result: "${result}"`);
  return result;
}

/**
 """
 Translates text using Google Translate API.
 
 Args:
     text: Text to translate
     
 Returns:
     Translated text
 """
 */
async function _translate_with_google(text: string): Promise<string> {
  const { Translate } = await import("@google-cloud/translate").then(m => m.v2);
  const translate = new Translate({
    key: process.env.GOOGLE_TRANSLATE_API_KEY,
  });
  
  const [translation] = await translate.translate(text, "en");
  return translation;
}

/**
 """
 Translates text using MyMemory free API.
 Free API with 10,000 characters/day limit.
 
 Args:
     text: Text to translate from Tamil to English
     
 Returns:
     Translated text
 """
 */
async function _translate_with_mymemory(text: string): Promise<string> {
  const encodedText = encodeURIComponent(text);
  const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ta|en`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`MyMemory API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory API error: ${data.responseDetails}`);
  }
  
  return data.responseData.translatedText || text;
}

/**
 """
 Manual translation using dictionary mapping and transliteration.
 
 Args:
     text: Tamil text to translate
     
 Returns:
     Translated/transliterated text
 """
 */
function _translate_manually(text: string): string {
  let result = text;
  
  // Replace known words
  for (const [tamil, english] of Object.entries(TAMIL_TO_ENGLISH_COMMON)) {
    result = result.replace(new RegExp(tamil, "g"), english);
  }
  
  // Transliterate remaining Tamil characters
  result = _transliterate_tamil(result);
  
  return result.trim();
}

/**
 """
 Transliterates Tamil script to Latin script.
 Basic phonetic conversion for names and unknown words.
 
 Args:
     text: Text containing Tamil characters
     
 Returns:
     Transliterated text
 """
 */
function _transliterate_tamil(text: string): string {
  const tamilToLatin: Record<string, string> = {
    // Vowels
    அ: "a",
    ஆ: "aa",
    இ: "i",
    ஈ: "ee",
    உ: "u",
    ஊ: "oo",
    எ: "e",
    ஏ: "ae",
    ஐ: "ai",
    ஒ: "o",
    ஓ: "oa",
    ஔ: "au",
    // Consonants
    க: "ka",
    ங: "nga",
    ச: "cha",
    ஞ: "nja",
    ட: "ta",
    ண: "na",
    த: "tha",
    ந: "na",
    ப: "pa",
    ம: "ma",
    ய: "ya",
    ர: "ra",
    ல: "la",
    வ: "va",
    ழ: "zha",
    ள: "la",
    ற: "ra",
    ன: "na",
  };
  
  let result = text;
  for (const [tamil, latin] of Object.entries(tamilToLatin)) {
    result = result.replace(new RegExp(tamil, "g"), latin);
  }
  
  return result;
}

/**
 """
 Batch translates multiple texts efficiently.
 
 Args:
     texts: Array of Tamil texts to translate
     
 Returns:
     Array of translated texts
 """
 */
export async function batch_translate(texts: string[]): Promise<string[]> {
  const results = await Promise.all(
    texts.map((text) => translate_tamil_to_english(text))
  );
  return results;
}

/**
 """
 Translates transaction object fields from Tamil to English.
 
 Args:
     transaction: Transaction object with Tamil fields
     
 Returns:
     Transaction object with both Tamil and English fields
 """
 */
export async function translate_transaction_fields(transaction: any): Promise<any> {
  console.log("\n========== TRANSLATION STARTED ==========");
  console.log("Original Transaction:", JSON.stringify(transaction, null, 2));
  
  const fieldsToTranslate = [
    { tamil: "buyerNameTamil", english: "buyerNameEnglish" },
    { tamil: "sellerNameTamil", english: "sellerNameEnglish" },
    {
      tamil: "propertyDescriptionTamil",
      english: "propertyDescriptionEnglish",
    },
  ];
  
  const translatedTransaction = { ...transaction };
  
  for (const field of fieldsToTranslate) {
    if (transaction[field.tamil]) {
      console.log(`\n📝 Translating field: ${field.tamil} → ${field.english}`);
      translatedTransaction[field.english] = await translate_tamil_to_english(
        transaction[field.tamil]
      );
    } else {
      console.log(`⚠️  Field ${field.tamil} is empty/missing`);
    }
  }
  
  console.log("\nTranslated Transaction:", JSON.stringify(translatedTransaction, null, 2));
  console.log("========== TRANSLATION COMPLETED ==========\n");
  
  return translatedTransaction;
}

