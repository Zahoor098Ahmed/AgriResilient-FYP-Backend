import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Produces a strict language directive for the AI prompt. Urdu and Sindhi
 * both need to be pinned to the Pakistani register/script specifically —
 * general-purpose LLMs otherwise drift toward Indian Hindustani-Urdu
 * vocabulary (or Devanagari-influenced Sindhi), and Sindhi output in
 * particular tends to collapse into Urdu grammar/vocabulary just spelled
 * with a few Sindhi letters, since the two languages share a script and
 * much vocabulary.
 */
const getLanguageInstruction = (language) => {
  if (language === 'ur') {
    return `Respond ENTIRELY in authentic PAKISTANI URDU, written in Urdu (Nastaliq) script only.
Use everyday vocabulary exactly as spoken by farmers and used in official agricultural documents in Pakistan (Punjab, Sindh, KPK, Balochistan).
Do NOT use Hindi, Devanagari script, or Indian/Hindustani-Urdu vocabulary. Avoid Sanskrit-derived words common in Indian Urdu media; use standard Pakistani Urdu terms instead (e.g. "فیصد" not "پرسینٹ"/"प्रतिशत", "کسان" not "किसान", "پانی" not "जल", "کھاد" not "खाद").`;
  }
  if (language === 'sd') {
    return `Respond ENTIRELY in PURE, STANDARD SINDHI exactly as spoken and written in Sindh, Pakistan — the register used in Sindhi newspapers, textbooks, and government documents (NOT the Devanagari script used for Sindhi in India, and NOT Urdu).
Sindhi is a DIFFERENT language from Urdu, not just Urdu in different letters — do NOT write Urdu vocabulary or grammar and merely spell it with Sindhi letters.
Use correct Sindhi grammar/postpositions (e.g. "۾" not Urdu "میں", "تي" not Urdu "پر/پہ", "کان" not Urdu "سے", "جو/جي/جا" not Urdu "کا/کی/کے", "ڪريو" not Urdu "کریں", "آهي" not Urdu "ہے", "هوندي" not Urdu "ہوگی").
Match the exact vocabulary and sentence style of these genuine Sindhi examples:
- "زمين کي 2-3 ڀيرا هر هلايو ۽ پاڻي جي هڪجهڙائي لاءِ ليزر ليولنگ استعمال ڪريو."
- "ٻجن کي ڦڦوند ڪش دوا سان علاج ڪريو. ڊرل مشين ذريعي في ايڪڙ 50 ڪلو ٻج استعمال ڪريو."
- "ڪڻڪ کي 4-5 ڀيرا پاڻي جي ضرورت هوندي آهي. 22-25 ڏينهن تي پهريون 'ڪور' پاڻي سڀ کان اهم آهي."`;
  }
  return 'Respond ENTIRELY in clear, simple English.';
};

const parseJsonFromText = (text) => {
  const jsonMatch = text?.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};

// Whitelist, not blacklist: only Basic Latin (digits, PKR, punctuation,
// brand names) and Arabic-script blocks (Urdu/Sindhi) are allowed. Urdu and
// Sindhi are low-resource enough that LLMs occasionally leak fragments of
// totally unrelated scripts into the output — Devanagari, Bengali, Chinese,
// even Thai have all shown up in testing. Enumerating every possible script
// to blacklist is a losing game; whitelisting the only two scripts this
// output should ever contain is far more robust.
const ALLOWED_CHARS_REGEX = /^[ -~؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\s]*$/;

// Sindhi and Urdu share the Perso-Arabic script but not grammar — Urdu's
// possessive/plural markers "کا"/"کی"/"کے" don't exist in standard written
// Sindhi (which uses "جو"/"جي"/"جا"). Their presence as standalone words is
// a strong, cheap signal that the model wrote Urdu and merely used Sindhi
// letters here and there, rather than genuine Sindhi.
const URDU_MARKER_REGEX = /(^|\s)(کا|کی|کے|ہے|ہیں|ہوگی|ہوگا|میں|سے|پر|پہ|کریں|کرتے|تھا|تھی)(?=\s|$|[،۔,.])/;

const isScriptClean = (data, language) => {
  if (language !== 'ur' && language !== 'sd') return true;
  const text = JSON.stringify(data);
  if (!ALLOWED_CHARS_REGEX.test(text)) return false;
  if (language === 'sd' && URDU_MARKER_REGEX.test(text)) return false;
  return true;
};

/**
 * Calls Groq's vision-capable model with an image + text prompt.
 */
const callGroqVision = async (promptText, base64Image, mimeType = 'image/jpeg') => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
        ]
      }],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const err = new Error(`Groq API error: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

/**
 * Calls Groq's fast text model for text-only prompts (e.g. crop advisory,
 * translation). JSON mode is opt-out since it's the common case, but plain
 * numbered-list translation prompts need it off — Groq's JSON mode forces
 * the model to wrap/restructure output as an object, which corrupts a
 * plain "1. ...\n2. ..." list.
 */
const callGroqText = async (promptText, { jsonMode = true, temperature = 0.9 } = {}) => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      messages: [{ role: 'user', content: promptText }],
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    })
  });

  if (!response.ok) {
    const err = new Error(`Groq API error: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
};

// High-quality local fallback data for Pakistani crops (from land preparation to harvesting)
const LOCAL_ADVISORY_DATABASE = {
  'wheat': {
    "crop": "Wheat (Gandum)",
    "best_sowing_date": "Nov 1st to Nov 20th",
    "ur": {
      "crop": "گندم (Gandum)",
      "best_sowing_date": "1 نومبر سے 20 نومبر",
      "recommendations": [
        {
          "category": "زمین کی تیاری",
          "title": "ہل چلانا اور لیزر لیولنگ",
          "description": "زمین کو 2-3 بار ہل چلائیں اور پانی کی یکساں تقسیم کے لیے لیزر لیولنگ کا استعمال کریں۔",
          "schedule": ["گہرا ہل چلانا", "لیزر لیولنگ", "ڈسک ہیروئنگ"]
        },
        {
          "category": "بیجائی کے مراحل",
          "title": "بیج کا علاج اور بیجائی",
          "description": "بیجوں کو پھپھوندی کش دوا سے علاج کریں۔ ڈرل مشین کے ذریعے فی ایکڑ 50 کلو بیج استعمال کریں۔",
          "schedule": ["بیج کا علاج", "ڈرل بیجائی", "گہرائی: 2-3 انچ"]
        },
        {
          "category": "آبپاشی",
          "title": "اہم مراحل",
          "description": "گندم کو 4-5 بار پانی کی ضرورت ہوتی ہے۔ 22-25 دن پر پہلا 'کور' پانی سب سے اہم ہے۔",
          "schedule": ["کور پانی (22-25 دن)", "ٹلرنگ اسٹیج (45 دن)", "بوٹنگ اسٹیج (85 دن)", "دانہ بھرنے کا مرحلہ (110 دن)"]
        },
        {
          "category": "کھاد",
          "title": "ڈی اے پی اور یوریا کا انتظام",
          "description": "بیجائی کے وقت ڈی اے پی کے 2 تھیلے استعمال کریں۔ یوریا کو آبپاشی کے ساتھ تقسیم شدہ خوراکوں میں استعمال کریں۔",
          "schedule": ["بیجائی پر 2 تھیلے ڈی اے پی", "پہلی یوریا خوراک (کور پانی)", "دوسری یوریا خوراک (دوسرا پانی)"]
        },
        {
          "category": "کٹائی",
          "title": "کٹائی کا بہترین وقت",
          "description": "کٹائی اس وقت کریں جب دانے سخت ہوں اور نمی 12 فیصد سے کم ہو (اپریل-مئی)۔",
          "schedule": ["نمی کی جانچ", "کمبائن ہارویسٹنگ", "خشک جگہ پر ذخیرہ"]
        }
      ]
    },
    "sd": {
      "crop": "ڪڻڪ (Gandum)",
      "best_sowing_date": "1 نومبر کان 20 نومبر",
      "recommendations": [
        {
          "category": "زمين جي تياري",
          "title": "هر هلائڻ ۽ ليزر ليولنگ",
          "description": "زمين کي 2-3 ڀيرا هر هلايو ۽ پاڻي جي هڪجهڙائي لاءِ ليزر ليولنگ استعمال ڪريو.",
          "schedule": ["گهرون هر هلائڻ", "ليزر ليولنگ", "ڊسڪ هيرو"]
        },
        {
          "category": "پوکي جا مرحلا",
          "title": "ٻج جي علاج ۽ پوکي",
          "description": "ٻجن کي ڦڦوند ڪش دوا سان علاج ڪريو. ڊرل مشين ذريعي في ايڪڙ 50 ڪلو ٻج استعمال ڪريو.",
          "schedule": ["ٻج جو علاج", "ڊرل پوکي", "گهرائي: 2-3 انچ"]
        },
        {
          "category": "آبپاشي",
          "title": "اهم مرحلا",
          "description": "ڪڻڪ کي 4-5 ڀيرا پاڻي جي ضرورت هوندي آهي. 22-25 ڏينهن تي پهريون 'ڪور' پاڻي سڀ کان اهم آهي.",
          "schedule": ["ڪور پاڻي (22-25 ڏينهن)", "ٽلرنگ اسٽيج (45 ڏينهن)", "بوٽنگ اسٽيج (85 ڏينهن)", "دانو ڀرڻ جو مرحلو (110 ڏينهن)"]
        },
        {
          "category": "ڀاڻ",
          "title": "ڊي اي پي ۽ يوريا جو انتظام",
          "description": "پوکي وقت ڊي اي پي جا 2 ٿيلهو استعمال ڪريو. يوريا کي آبپاشي سان گڏ حصن ۾ استعمال ڪريو.",
          "schedule": ["پوکي تي 2 ٿيلهو ڊي اي پي", "پهريون يوريا جو دوز (ڪور پاڻي)", "ٻيو يوريا جو دوز (ٻيو پاڻي)"]
        },
        {
          "category": "لڻڻ",
          "title": "لڻڻ جو بهترين وقت",
          "description": "لڻڻ ان وقت ڪريو جڏهن دانا سخت هجن ۽ نمي 12 سيڪڙو کان گهٽ هجي (اپريل-مئي).",
          "schedule": ["نمي جي چڪاس", "ڪمبائن هارويسٽنگ", "خشڪ جاءِ تي ذخيرو"]
        }
      ]
    },
    "recommendations": [
      {
        "category": "Land Preparation",
        "title": "Plowing & Laser Leveling",
        "description": "Plow the land 2-3 times and use laser leveling for uniform water distribution.",
        "schedule": ["Deep Plowing", "Laser Leveling", "Disc Harrowing"]
      },
      {
        "category": "Sowing Steps",
        "title": "Seed Treatment & Sowing",
        "description": "Treat seeds with fungicide. Use 50kg seed per acre with a drill machine.",
        "schedule": ["Seed Treatment", "Drill Sowing", "Depth: 2-3 inches"]
      },
      {
        "category": "Irrigation",
        "title": "Critical Stages",
        "description": "Wheat needs 4-5 irrigations. The first 'Kor' watering at 22-25 days is most critical.",
        "schedule": ["Kor Watering (22-25 days)", "Tillering Stage (45 days)", "Booting Stage (85 days)", "Grain Filling (110 days)"]
      },
      {
        "category": "Fertilizer",
        "title": "DAP & Urea Management",
        "description": "Apply 2 bags of DAP at sowing. Use Urea in split doses with irrigation.",
        "schedule": ["2 Bags DAP at Sowing", "1st Urea dose (Kor watering)", "2nd Urea dose (2nd watering)"]
      },
      {
        "category": "Harvesting",
        "title": "Optimal Harvest Timing",
        "description": "Harvest when grains are hard and moisture is below 12% (April-May).",
        "schedule": ["Moisture check", "Combine harvesting", "Storage in dry place"]
      }
    ]
  },
  'rice': {
    "crop": "Rice (Basmati/IRRI)",
    "best_sowing_date": "June 1st to June 20th (Nursery)",
    "ur": {
      "crop": "چاول (Basmati/IRRI)",
      "best_sowing_date": "1 جون سے 20 جون (نرسری)",
      "recommendations": [
        {
          "category": "زمین کی تیاری",
          "title": "کدو (Puddling)",
          "description": "پانی کھڑا کر کے زمین کو ہموار کریں (کدو کریں) تاکہ پانی کا رساؤ روکا جا سکے۔",
          "schedule": ["لیزر لیولنگ", "ابتدائی پانی", "کدو کرنا (2-3 بار)"]
        },
        {
          "category": "نرسری اور منتقلی",
          "title": "نرسری کا انتظام",
          "description": "25-30 دن پرانی پنیری منتقل کریں۔ فی سوراخ 2-3 پودے لگائیں۔",
          "schedule": ["نرسری کی کاشت", "منتقلی (30 دن)", "پودوں کی کثافت کی جانچ"]
        },
        {
          "category": "آبپاشی",
          "title": "پانی کی سطح کا انتظام",
          "description": "پہلے 30 دن پانی کھڑا رکھیں، پھر وقفے وقفے سے پانی دیں۔",
          "schedule": ["منتقلی کا سیلاب", "2-3 انچ پانی برقرار رکھیں", "کٹائی سے پہلے خشک کرنے کا مرحلہ"]
        },
        {
          "category": "کھاد",
          "title": "زنک اور نائٹروجن کی خوراک",
          "description": "بنیادی ڈی اے پی کے ساتھ زنک سلفیٹ 33% (12 کلو فی ایکڑ) استعمال کریں۔",
          "schedule": ["بنیادی ڈی اے پی", "10 دن پر زنک", "یوریا کی تقسیم شدہ خوراکیں"]
        },
        {
          "category": "کٹائی",
          "title": "بروقت کٹائی",
          "description": "کٹائی اس وقت کریں جب 90 فیصد سٹے سنہری ہو جائیں (اکتوبر-نومبر)۔",
          "schedule": ["کٹائی", "گہائی", "صفائی"]
        }
      ]
    },
    "sd": {
      "crop": "چانور (Basmati/IRRI)",
      "best_sowing_date": "1 جون کان 20 جون (نرسري)",
      "recommendations": [
        {
          "category": "زمين جي تياري",
          "title": "ڪدو (Puddling)",
          "description": "پاڻي بيهاري زمين کي هموار ڪريو (ڪدو ڪريو) ته جيئن پاڻي جو زيان روڪي سگهجي.",
          "schedule": ["ليزر ليولنگ", "شروعاتي پاڻي", "ڪدو ڪرڻ (2-3 ڀيرا)"]
        },
        {
          "category": "نرسري ۽ منتقلي",
          "title": "نرسري جو انتظام",
          "description": "25-30 ڏينهن پراڻي پنيري منتقل ڪريو. في سوراخ 2-3 ٻوٽا لڳايو.",
          "schedule": ["نرسري جي پوک", "منتقلي (30 ڏينهن)", "ٻوٽن جي گهٽتائي جي چڪاس"]
        },
        {
          "category": "آبپاشي",
          "title": "پاڻي جي سطح جو انتظام",
          "description": "پهرين 30 ڏينهن پاڻي بيهاريو، پوءِ وقفي وقفي سان پاڻي ڏيو.",
          "schedule": ["منتقلي جو سيلاب", "2-3 انچ پاڻي برقرار رکو", "لڻڻ کان اڳ خشڪ ڪرڻ جو مرحلو"]
        },
        {
          "category": "ڀاڻ",
          "title": "زنڪ ۽ نائيٽروجن جو دوز",
          "description": "ڊي اي پي سان گڏ زنڪ سلفيٽ 33% (12 ڪلو في ايڪڙ) استعمال ڪريو.",
          "schedule": ["ڊي اي پي", "10 ڏينهن تي زنڪ", "يوريا جا حصا"]
        },
        {
          "category": "لڻڻ",
          "title": "بر وقت لڻڻ",
          "description": "لڻڻ ان وقت ڪريو جڏهن 90 سيڪڙو سنگ سونهري ٿي وڃن (آڪٽوبر-نومبر).",
          "schedule": ["لڻڻ", "گاهي", "صفائي"]
        }
      ]
    },
    "recommendations": [
      {
        "category": "Land Preparation",
        "title": "Puddling (Kaddu)",
        "description": "Plow the land while flooded (Puddling) to prevent water seepage.",
        "schedule": ["Laser Leveling", "Initial Watering", "Puddling (2-3 times)"]
      },
      {
        "category": "Nursery & Transplanting",
        "title": "Nursery Management",
        "description": "Transplant 25-30 day old seedlings. Use 2-3 plants per hill.",
        "schedule": ["Nursery sowing", "Transplanting (30 days)", "Plant density check"]
      },
      {
        "category": "Irrigation",
        "title": "Water Level Management",
        "description": "Keep water standing for the first 30 days, then apply periodically.",
        "schedule": ["Transplanting flood", "Maintain 2-3 inches water", "Drying stage before harvest"]
      },
      {
        "category": "Fertilizer",
        "title": "Zinc & Nitrogen Dosing",
        "description": "Apply Zinc Sulphate 33% (12kg/acre) along with basal DAP.",
        "schedule": ["Basal DAP", "Zinc at 10 days", "Urea split doses"]
      },
      {
        "category": "Harvesting",
        "title": "Timely Harvesting",
        "description": "Harvest when 90% of the panicles turn golden (Oct-Nov).",
        "schedule": ["Harvesting", "Threshing", "Winnowing"]
      }
    ]
  }
};

// Simple in-memory cache for advisories
const advisoryCache = new Map();

/**
 * Utility function to handle retries with exponential backoff for Gemini API
 */
const callWithRetry = async (fn, maxRetries = 2) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Check if it's a rate limit error (429) or quota error
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        // Fast retry: 1s, 2s
        const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
        console.warn(`[Gemini Quota] Rate limit hit. Retrying in ${(delay/1000).toFixed(1)}s (Attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const normalizeDetection = (aiData) => ({
  detected: aiData.detected || "Waste Item",
  recyclables: aiData.recyclables || [],
  nearbyCenters: aiData.nearbyCenters || [],
  confidence: aiData.confidence || 0.95
});

const buildDetectPromptEn = (userLocation) => {
  const locationText = userLocation ? userLocation : 'Pakistan';
  return `
        You are the "AgriResilient AI Expert" for Pakistan.
        Analyze this image and identify the SPECIFIC object (waste or crop residue) — be as precise as
        possible about what it actually is (e.g. "Wheat Straw", "Cotton Stalks", "Onion Peels"), not a
        generic category. Respond in English.

        STRICT RULES:
        1. REAL PKR DATA: Provide current market prices in Pakistan (e.g., 500 PKR, 1200 PKR/40kg).
        2. LOCAL MARKETS: The user is located in/near "${locationText}". Recommend REAL mandis, recycling
           centers, or buyers actually near that specific location, not generic far-away cities — only
           mention a different city if it's a genuinely relevant regional hub for this item.
        3. CROP USE: Always prioritize how to use it for "Fasil" (Crops) as fertilizer or feed.
        4. NEARBY CENTERS: List 3 REAL, specific places (mandis, scrap dealers, recycling centers,
           fertilizer/feed buyers) that plausibly exist near "${locationText}" for selling this exact
           item. Use genuine local place names for that area, not generic invented business names like
           "Eco Recyclers Inc".

        OUTPUT FORMAT (Strict JSON only):
        {
          "detected": "Exact Item Name",
          "confidence": 0.99,
          "recyclables": [
            {
              "itemType": "Specific Use",
              "potential": "High/Medium",
              "value": "Price in PKR (e.g. 600-800 PKR per unit)",
              "description": "Practical step-by-step for a Pakistani farmer, naming a real nearby market/center"
            }
          ],
          "nearbyCenters": [
            { "name": "Real specific place/market name near ${locationText}", "type": "Mandi / Scrap Dealer / Recycling Center / Feed Buyer" }
          ]
        }
      `;
};

/**
 * Runs image detection in English only. English is the language these
 * vision models are most reliable and specific in, so this is the "ground
 * truth" detection result regardless of what language the user wants —
 * translation happens as a separate step (see translateDetection below).
 */
const detectObjectRaw = async (imageBuffer, mimeType, userLocation) => {
  const base64Image = imageBuffer.toString('base64');
  const prompt = buildDetectPromptEn(userLocation);

  if (GROQ_API_KEY) {
    try {
      const text = await callWithRetry(() => callGroqVision(prompt, base64Image, mimeType), 1);
      const aiData = parseJsonFromText(text);
      if (aiData) return normalizeDetection(aiData);
    } catch (error) {
      console.error('Groq vision detection failed, trying Gemini...', error.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.4, topP: 0.8, topK: 40 }
      });
      const imageParts = [{ inlineData: { data: base64Image, mimeType } }];
      const result = await callWithRetry(() => model.generateContent([prompt, ...imageParts]), 1);
      const response = await result.response;
      const text = response.text();
      const aiData = parseJsonFromText(text);
      if (aiData) return normalizeDetection(aiData);
    } catch (error) {
      console.error('Gemini vision detection also failed.', error.message);
    }
  }

  return null;
};

// Flattens the fields that actually need translating into a plain ordered
// list, and rebuilds the object from a translated list of the same length.
// Sending/receiving plain numbered text (instead of round-tripping JSON)
// means the model can't corrupt the schema by translating keys, dropping
// fields, or nesting things differently — it only ever has to hand back
// text in the same order it received it.
const flattenForTranslation = (data) => {
  const strings = [data.detected];
  for (const item of data.recyclables || []) {
    strings.push(item.itemType, item.potential, item.value, item.description);
  }
  for (const center of data.nearbyCenters || []) {
    strings.push(center.name, center.type);
  }
  return strings;
};

const rebuildFromTranslation = (data, translatedStrings) => {
  let i = 0;
  const detected = translatedStrings[i++];
  const recyclables = (data.recyclables || []).map((item) => ({
    ...item,
    itemType: translatedStrings[i++],
    potential: translatedStrings[i++],
    value: translatedStrings[i++],
    description: translatedStrings[i++],
  }));
  const nearbyCenters = (data.nearbyCenters || []).map((center) => ({
    ...center,
    name: translatedStrings[i++],
    type: translatedStrings[i++],
  }));
  return { detected, recyclables, nearbyCenters, confidence: data.confidence };
};

const parseNumberedList = (text) => {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const items = [];
  for (const line of lines) {
    const match = line.match(/^\d+[.)]\s*(.+)$/);
    if (match) items.push(match[1].trim());
  }
  return items;
};

/**
 * Translates an already-detected English result into Urdu/Sindhi. Kept as
 * a separate text-only step because translating known text is a much more
 * reliable task for these models than doing image understanding AND
 * generation in a low-resource language at once.
 */
const translateDetection = async (data, language) => {
  const strings = flattenForTranslation(data);
  const prompt = `
    Translate each numbered line below into the target language. Keep any PKR price numbers as digits,
    translating only the surrounding words. Return ONLY a numbered list with the exact same numbers,
    one translated line per number, in the same order — no extra commentary, no explanations, no headers.

    ${getLanguageInstruction(language)}

    TEXT TO TRANSLATE:
    ${strings.map((s, i) => `${i + 1}. ${s}`).join('\n')}
  `;

  const tryParse = (text) => {
    const translated = parseNumberedList(text);
    return translated.length === strings.length && isScriptClean(translated, language) ? translated : null;
  };

  if (GROQ_API_KEY) {
    // Try Groq up to 3 times — quality for low-resource languages like
    // Sindhi varies call to call, so a later attempt often succeeds where
    // an earlier one produced Urdu-contaminated text. Cheaper and faster
    // than waiting on Gemini, which frequently has no quota available.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const text = await callWithRetry(() => callGroqText(prompt, { jsonMode: false, temperature: 0.4 }), 1);
        const translated = tryParse(text);
        if (translated) return rebuildFromTranslation(data, translated);
      } catch (error) {
        console.error(`Groq translation attempt ${attempt + 1} failed.`, error.message);
      }
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.3 } });
      const result = await callWithRetry(() => model.generateContent(prompt), 1);
      const response = await result.response;
      const text = response.text();
      const translated = tryParse(text);
      if (translated) return rebuildFromTranslation(data, translated);
    } catch (error) {
      console.error('Gemini translation also failed.', error.message);
    }
  }

  return null;
};

/**
 * Real AI detection service: detects the specific item in English first
 * (most reliable), then translates that result into the requested
 * language. Only drops to the generic curated fallback if detection itself
 * fails on both providers — a failed translation instead falls back to the
 * accurate English result rather than losing the specific item entirely.
 */
export const detectObject = async (imageBuffer, language = 'en', mimeType = 'image/jpeg', userLocation = null) => {
  const englishResult = await detectObjectRaw(imageBuffer, mimeType, userLocation);

  if (!englishResult) {
    return getDetectFallback(language);
  }

  if (language === 'en') {
    return englishResult;
  }

  const translated = await translateDetection(englishResult, language);
  return translated || englishResult;
};

const getDetectFallback = (language) => {
  // High-quality expert fallback for common Pakistani items
  const fallbacks = {
    'ur': {
      detected: "زرعی / عام فضلہ",
      recyclables: [
        {
          "itemType": "نامیاتی کھاد",
          "potential": "زیادہ",
          "value": "500-750 روپے فی بیگ",
          "description": "گندم اور گنے کے کھیتوں کے لیے بہترین۔ اعلیٰ غذائیت والی نامیاتی کھاد بنانے کے لیے 40 دن تک جانوروں کے گوبر کے ساتھ ملائیں۔"
        },
        {
          "itemType": "جانوروں کی خوراک (ونڈا)",
          "potential": "زیادہ",
          "value": "1100-1400 روپے فی 40 کلو",
          "description": "بھینسوں اور گایوں کے لیے غذائیت سے بھرپور ونڈا بنانے کے لیے پیس کر شیرہ کے ساتھ ملائیں۔ مقامی منڈیوں میں بہت زیادہ مانگ ہے۔"
        },
        {
          "itemType": "مقامی ری سائیکلنگ سینٹر",
          "potential": "درمیانہ",
          "value": "40-80 روپے فی کلو",
          "description": "فوری نقد رقم کے لیے فیصل آباد یا گوجرانوالہ جیسے شہروں میں قریب ترین ری سائیکلنگ ہب کو فروخت کریں۔"
        }
      ]
    },
    'sd': {
      detected: "زرعي / عام فضلو",
      recyclables: [
        {
          "itemType": "نامياتي ڀاڻ",
          "potential": "وڌيڪ",
          "value": "500-750 رپيا في ٻورو",
          "description": "ڪڻڪ ۽ ڪمند جي ٻنين لاءِ بهترين. اعليٰ غذائيت واري نامياتي ڀاڻ بڻائڻ لاءِ 40 ڏينهن تائين جانورن جي ڇيڻي سان ملايو."
        },
        {
          "itemType": "جانورن جي خوراڪ (ونڊو)",
          "potential": "وڌيڪ",
          "value": "1100-1400 رپيا في 40 ڪلو",
          "description": "مينهن ۽ ڳئون لاءِ غذائيت سان ڀرپور ونڊو بڻائڻ لاءِ پيھي شيري سان ملايو. مقامي منڊين ۾ تمام گهڻي گهرج آهي."
        },
        {
          "itemType": "مقامي ري سائيڪلنگ سينٽر",
          "potential": "وچولي",
          "value": "40-80 رپيا في ڪلو",
          "description": "فوري روڪ رقم لاءِ فيصل آباد يا گوجرانوالا جهڙن شهرن ۾ ويجھي ري سائيڪلنگ حب کي وڪرو ڪريو."
        }
      ]
    },
    'en': {
      detected: "Agricultural/General Waste",
      recyclables: [
        {
          "itemType": "Organic Fertilizer (Khad)",
          "potential": "High",
          "value": "500-750 PKR per bag",
          "description": "Best for wheat and sugarcane fields. Mix with animal manure for 40 days to create high-nutrient organic khad."
        },
        {
          "itemType": "Animal Feed (Wanda)",
          "potential": "High",
          "value": "1100-1400 PKR per 40kg",
          "description": "Grind and mix with molasses to create nutritious wanda for buffaloes and cows. Very high demand in local mandis."
        },
        {
          "itemType": "Local Recycling Center",
          "potential": "Medium",
          "value": "40-80 PKR per kg",
          "description": "Sell to nearest recycling hub in cities like Faisalabad or Gujranwala for immediate cash."
        }
      ]
    }
  };

  return {
    ...fallbacks[language] || fallbacks['en'],
    // No real location data backs this generic fallback, so we deliberately
    // don't invent nearby center names here — the frontend hides that
    // section rather than show fabricated places.
    nearbyCenters: [],
    confidence: 0.90
  };
};

/**
 * AI Crop Advisory service using Google Gemini
 */
export const getCropAdvisory = async (cropType, userLocation, language = 'en') => {
  const cacheKey = `${cropType}-${userLocation || 'Pakistan'}-${language}`;
  if (advisoryCache.has(cacheKey)) {
    const cached = advisoryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3600000) return cached.data;
  }

  const langName = language === 'ur' ? 'Urdu' : language === 'sd' ? 'Sindhi' : 'English';

  const prompt = `
         You are the Chief Agricultural Advisor for AgriResilient Pakistan.
         Provide a COMPLETE end-to-end advisory for "${cropType}" in "${userLocation || 'Pakistan'}".
         The advisory MUST cover the entire cycle: from Land Preparation (Hal chalana) to Harvesting (Katai).

         LANGUAGE REQUIREMENT: ${getLanguageInstruction(language)}

         STRICT RULES:
         1. SOWING WINDOW: Mention the exact best dates/month to sow the crop.
         2. STEP-BY-STEP:
            - Land Preparation (Laser leveling, Plowing).
            - Sowing (Seed rate, depth, method).
            - Irrigation (Exact stages and frequency).
            - Fertilizer (Urea, DAP, Zinc, Potash - exact bags/acre and timing).
            - Harvesting (Signs of maturity and timing).
         3. LOCAL CONTEXT: Use local Pakistani farming context.

         OUTPUT FORMAT (JSON):
         {
           "crop": "${cropType}",
           "best_sowing_date": "Date Range in ${langName}",
           "recommendations": [
             {
               "category": "Category Name in ${langName}",
               "title": "Title in ${langName}",
               "description": "Advice description in ${langName}",
               "schedule": ["Step 1 in ${langName}", "Step 2 in ${langName}"]
             }
           ]
         }
       `;

  // 1. Try Groq (fastest, tried first)
  if (GROQ_API_KEY) {
    try {
      const text = await callWithRetry(() => callGroqText(prompt), 1);
      const advisoryData = parseJsonFromText(text);
      if (advisoryData && isScriptClean(advisoryData, language)) {
        advisoryCache.set(cacheKey, { timestamp: Date.now(), data: advisoryData });
        return advisoryData;
      }
    } catch (error) {
      console.error('Groq advisory failed, trying Gemini...', error.message);
    }
  }

  // 2. Try Gemini, then fallback to local expert DB
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { temperature: 0.9 }
      });

      const result = await callWithRetry(() => model.generateContent(prompt), 1);
      const response = await result.response;
      const text = response.text();
      const advisoryData = parseJsonFromText(text);

      if (advisoryData && isScriptClean(advisoryData, language)) {
        advisoryCache.set(cacheKey, { timestamp: Date.now(), data: advisoryData });
        return advisoryData;
      }
    } catch (error) {
      console.error(`Gemini advisory also failed, using expert database fallback.`);
    }
  }

  // FAST FALLBACK: Use local expert database results
  const cropKey = cropType.toLowerCase();
  if (LOCAL_ADVISORY_DATABASE[cropKey]) {
    console.log("Returning local expert database results for " + cropType + " in " + language);
    // Return language specific version if available
    if (language !== 'en' && LOCAL_ADVISORY_DATABASE[cropKey][language]) {
      return LOCAL_ADVISORY_DATABASE[cropKey][language];
    }
    return LOCAL_ADVISORY_DATABASE[cropKey];
  }

  // Generic fallback if crop not in database
  const genericAdvisory = {
    'ur': {
      "crop": cropType,
      "recommendations": [
        {
          "category": "آبپاشی",
          "title": "پانی کا انتظام",
          "description": "اس بات کو یقینی بنائیں کہ آپ کا کھیت اچھی طرح سے ہموار ہے۔ پھول آنے کے مرحلے کے دوران پانی کی کمی سے بچیں۔",
          "schedule": ["مٹی کی نمی کی جانچ", "لیزر لیولنگ", "نہر کے پانی کی ٹائمنگ"]
        },
        {
          "category": "کھاد",
          "title": "غذائی اجزاء کا توازن",
          "description": "بیجائی کے وقت فی ایکڑ ڈی اے پی کا 1 تھیلہ استعمال کریں۔ فصل کی ضرورت کے مطابق یوریا استعمال کریں۔",
          "schedule": ["بنیادی ڈی اے پی", "پہلے پانی کے ساتھ یوریا"]
        }
      ]
    },
    'sd': {
      "crop": cropType,
      "recommendations": [
        {
          "category": "آبپاشي",
          "title": "پاڻي جو انتظام",
          "description": "پڪ ڪريو ته توهان جي ٻني چڱي طرح هموار آهي. گلن جي مرحلي دوران پاڻي جي کوٽ کان پاسو ڪريو.",
          "schedule": ["مٽي جي نمي جي چڪاس", "ليزر ليولنگ", "نهر جي پاڻي جي ٽائمنگ"]
        },
        {
          "category": "ڀاڻ",
          "title": "غذائي اجزاء جو توازن",
          "description": "پوکي وقت في ايڪڙ ڊي اي پي جو 1 ٿيلهو استعمال ڪريو. فصل جي ضرورت مطابق يوريا استعمال ڪريو.",
          "schedule": ["ڊي اي پي", "پهرين پاڻي سان يوريا"]
        }
      ]
    },
    'en': {
      "crop": cropType,
      "recommendations": [
        {
          "category": "Irrigation",
          "title": "Water Management",
          "description": "Ensure your field is well-leveled. Avoid water stress during flowering stage.",
          "schedule": ["Soil moisture check", "Laser leveling", "Canal water timing"]
        },
        {
          "category": "Fertilizer",
          "title": "Nutrient Balance",
          "description": "Use 1 bag of DAP per acre at sowing. Top dress with Urea as per crop requirement.",
          "schedule": ["Basal DAP", "Urea with first watering"]
        }
      ]
    }
  };

  return genericAdvisory[language] || genericAdvisory['en'];
};






