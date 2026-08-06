//file path: app/api/generate-quote/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

import { checkRateLimit, getEnvLimit } from '../../../lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const limit = getEnvLimit('RATE_LIMIT_AI_QUOTES', 15);
    const { isRateLimited } = checkRateLimit(request, limit, 60 * 1000);
    if (isRateLimited) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { occasion, language, isForSelf, subcategory, targetName, years, age, occasionName, previousQuotes = [], timestamp } = body;

    console.log('📥 AI Request received:', { occasion, language, subcategory, timestamp });

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return NextResponse.json({
        error: 'Gemini API key not configured',
        quote: getFallbackQuote(occasion, subcategory, language, isForSelf),
        fallback: true
      }, { status: 500 });
    }

    let prompt = '';
    const lang = language === 'hindi' ? 'Hindi (Devanagari script)' : 'English';

    const avoidInstruction = previousQuotes.length > 0
      ? `\n\nIMPORTANT: Generate a UNIQUE quote. Do NOT repeat or closely resemble these previous quotes:\n${previousQuotes.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n\nGenerate something completely different with different words, tone, and structure.`
      : '';

    // TASK 10: Separate AI prompts for "For Yourself" vs "For Others"
    if (isForSelf) {
      // "For Yourself" AI prompts - introspective, personal, prayer-like tone
      if (occasion === 'BIRTHDAY') {
        const ageNum = age || years || '';
        if (language === 'hindi') {
          prompt = `${ageNum ? `${ageNum}वाँ ` : ''}जन्मदिन पर खुद के लिए 1-2 पंक्तियाँ लिखें जो हिंदी (देवनागरी) में हों। व्यक्ति अपने बारे में लिख रहा है। संदेश में: आज ${ageNum ? `${ageNum}वाँ` : ''} जन्मदिन है, भगवान से पिछली गलतियों की क्षमा मांगें, आगे अच्छा करने का संकल्प लें और जीवन में अच्छाई की कामना करें। केवल संदेश लिखें, कोई शीर्षक या नंबर नहीं।${avoidInstruction}`;
        } else {
          prompt = `Write exactly 1-2 lines in English for someone writing about themselves on their${ageNum ? ` ${ageNum}th` : ''} birthday. The tone is personal and prayerful. The message should: mention it is their${ageNum ? ` ${ageNum}th` : ''} birthday today, ask God for forgiveness for past mistakes, express commitment to doing better, and pray for good things ahead. Only the message, no title or numbering.${avoidInstruction}`;
        }
      } else if (occasion === 'RELATIONSHIP') {
        if (language === 'hindi') {
          prompt = `रिलेशनशिप एनिवर्सरी पर खुद के लिए 1-2 पंक्तियाँ हिंदी (देवनागरी) में लिखें। व्यक्ति अपने और अपने साथी के बारे में लिख रहा है। संदेश में: भगवान का धन्यवाद इतने अच्छे साथी के लिए, रिश्ता हमेशा अच्छा रहे की कामना और साथ में सुखी जीवन की प्रार्थना। केवल संदेश लिखें।${avoidInstruction}`;
        } else {
          prompt = `Write exactly 1-2 lines in English for someone writing about themselves and their partner on their relationship anniversary. The tone is personal and grateful. The message should: thank God for such a wonderful partner, pray that their relationship continues to be wonderful, and wish for a happy and peaceful life together. Only the message, no title.${avoidInstruction}`;
        }
      } else if (occasion === 'MARRIAGE') {
        if (language === 'hindi') {
          prompt = `शादी की सालगिरह पर खुद के लिए 1-2 पंक्तियाँ हिंदी (देवनागरी) में लिखें। व्यक्ति अपने और अपने जीवनसाथी के बारे में लिख रहा है। संदेश में: भगवान का धन्यवाद इतने अच्छे जीवनसाथी के लिए, विवाह हमेशा सुखी रहे की कामना और आनंदमय जीवन की प्रार्थना। केवल संदेश लिखें।${avoidInstruction}`;
        } else {
          prompt = `Write exactly 1-2 lines in English for someone writing about themselves and their spouse on their marriage anniversary. The tone is personal and grateful. The message should: thank God for such a wonderful life partner, pray that their marriage continues to be wonderful, and wish for a happy and blissful life together. Only the message, no title.${avoidInstruction}`;
        }
      } else if (subcategory === 'JYANTI') {
        prompt = `Write exactly 2 lines tribute for Jayanti in ${lang}. Use placeholder [Naam] for the person's name. Reverential tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'DIVAS') {
        prompt = `Write exactly 2 lines message for special day in ${lang}. Use placeholder [Divas ka Naam]. Awareness tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'FESTIVALS') {
        prompt = `Write exactly 2 lines festival greeting in ${lang}. Use placeholder [Festival Name]. Celebratory tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'MARRIAGE_DATE_FIX') {
        prompt = `Write exactly 2 lines wedding date announcement in ${lang}. Use [Name 1], [Name 2], [Date]. First-person: "We are announcing our wedding". Formal tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'NEW_MEMBERS') {
        prompt = `Write exactly 2 lines new family member announcement in ${lang}. Use [Date], [Time], [Father Name], [Mother Name]. First-person: "Welcoming to our family". Joyful tone. No extra text.${avoidInstruction}`;
      }
    } else {
      // "For Others" prompts - unchanged existing prompts
      if (occasion === 'BIRTHDAY') {
        prompt = `Write exactly 2 lines birthday wish in ${lang}. Use placeholder [Name]. Third-person tone. No extra text, no numbering.${avoidInstruction}`;
      } else if (occasion === 'MARRIAGE' || occasion === 'RELATIONSHIP') {
        const type = occasion === 'MARRIAGE' ? 'marriage anniversary' : 'relationship anniversary';
        prompt = `Write exactly 2 lines ${type} wish in ${lang}. Use [Name] for the person and [Years] for years. Congratulating a couple. No extra text, no numbering.${avoidInstruction}`;
      } else if (subcategory === 'JYANTI') {
        prompt = `Write exactly 2 lines tribute for Jayanti in ${lang}. Use placeholder [Naam] for the person's name. Reverential tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'DIVAS') {
        prompt = `Write exactly 2 lines message for special day in ${lang}. Use placeholder [Divas ka Naam]. Awareness tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'FESTIVALS') {
        prompt = `Write exactly 2 lines festival greeting in ${lang}. Use placeholder [Festival Name]. Celebratory tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'MARRIAGE_DATE_FIX') {
        prompt = `Write exactly 2 lines wedding date announcement in ${lang}. Use [Name 1], [Name 2], [Date]. Third-person: congratulating the couple. Formal tone. No extra text.${avoidInstruction}`;
      } else if (subcategory === 'NEW_MEMBERS') {
        prompt = `Write exactly 2 lines new family member announcement in ${lang}. Use [Date], [Time], [Father Name], [Mother Name]. Third-person: congratulating the family. Joyful tone. No extra text.${avoidInstruction}`;
      }
    }

    console.log('📝 Sending prompt to Gemini with timestamp:', timestamp);

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });

    console.log('✅ Gemini response received');

    let quote = response.text?.trim() || '';

    if (!quote) {
      console.log('⚠️ Empty response, using fallback');
      return NextResponse.json({
        quote: getFallbackQuote(occasion, subcategory, language, isForSelf),
        fallback: true
      });
    }

    quote = quote
      .replace(/^["']|["']$/g, '')
      .replace(/^\d+\.\s*/gm, '')
      .replace(/^[-•]\s*/gm, '')
      .trim();

    const lines = quote.split('\n').filter((l: string) => l.trim());
    if (lines.length > 2) {
      quote = lines.slice(0, 2).join('\n');
    }

    console.log('✨ Final cleaned quote:', quote);

    return NextResponse.json({ quote, fallback: false });

  } catch (error: any) {
    console.error('💥 Server error:', error?.message || error);

    try {
      const reqBody = await request.json();
      return NextResponse.json({
        quote: getFallbackQuote(reqBody.occasion, reqBody.subcategory, reqBody.language, reqBody.isForSelf),
        fallback: true,
      });
    } catch {
      return NextResponse.json({
        quote: getFallbackQuote('', '', 'english'),
        fallback: true,
      });
    }
  }
}

function getFallbackQuote(occasion: string, subcategory: string, language: string, isForSelf?: boolean): string {
  const isHindi = language === 'hindi';

  // TASK 10: "For Yourself" fallback quotes
  if (isForSelf) {
    if (occasion === 'BIRTHDAY') {
      return isHindi
        ? 'आज मेरा जन्मदिन है। हे प्रभु, मेरी गलतियों को माफ करें और आगे मुझे अच्छे मार्ग पर चलने की शक्ति दें।'
        : 'Today is my birthday. Dear God, please forgive my mistakes and give me the strength to walk on the right path.';
    }
    if (occasion === 'RELATIONSHIP') {
      return isHindi
        ? 'आज हमारी रिलेशनशिप एनिवर्सरी है। हे भगवान, इतने अच्छे साथी के लिए धन्यवाद, हमारा रिश्ता सदा प्रेम से भरा रहे।'
        : 'Today is our relationship anniversary. Thank you, God, for such a wonderful partner — may our bond always be filled with love.';
    }
    if (occasion === 'MARRIAGE') {
      return isHindi
        ? 'आज हमारी विवाह वर्षगांठ है। हे ईश्वर, इतने अच्छे जीवनसाथी के लिए धन्यवाद, हमारा वैवाहिक जीवन सदा सुखी रहे।'
        : 'Today is our wedding anniversary. Thank you, God, for such a wonderful life partner — may our marriage always remain happy.';
    }
  }

  if (occasion === 'BIRTHDAY') {
    return isHindi
      ? '[Name] को जन्मदिन की हार्दिक शुभकामनाएं।\nआपका जीवन खुशियों से भरा रहे।'
      : 'Warmest birthday wishes to [Name].\nMay your life be filled with happiness.';
  }

  if (occasion === 'MARRIAGE' || occasion === 'RELATIONSHIP') {
    return isHindi
      ? '[Name] को [Years] वर्षों की यात्रा पर बधाई।\nयह प्यार हमेशा बना रहे।'
      : 'Congratulations to [Name] on [Years] years together.\nMay this love last forever.';
  }

  if (subcategory === 'JYANTI') {
    return isHindi
      ? '[Naam] की जयंती पर उनके आदर्शों को नमन।\nउनका जीवन हमारे लिए प्रेरणा है।'
      : 'Salutations to [Naam] on their Jayanti.\nTheir life is an inspiration for us.';
  }

  if (subcategory === 'DIVAS') {
    return isHindi
      ? '[Divas ka Naam] पर जागरूकता का संदेश।\nआइए इसे सार्थक बनाएं।'
      : 'Awareness message on [Divas ka Naam].\nLet us make it meaningful.';
  }

  if (subcategory === 'FESTIVALS') {
    return isHindi
      ? '[Festival Name] की हार्दिक शुभकामनाएं।\nयह त्योहार खुशियां लाए।'
      : 'Heartfelt wishes on [Festival Name].\nMay this festival bring joy.';
  }

  if (subcategory === 'MARRIAGE_DATE_FIX') {
    return isHindi
      ? '[Name 1] और [Name 2] के विवाह की तिथि [Date] निश्चित हुई।\nहार्दिक शुभकामनाएं।'
      : 'Wedding date of [Name 1] and [Name 2] fixed on [Date].\nBest wishes.';
  }

  if (subcategory === 'NEW_MEMBERS') {
    return isHindi
      ? '[Date] को [Time] पर एक नए सदस्य का स्वागत।\nपरिवार को बधाई।'
      : 'Welcoming a new member on [Date] at [Time].\nCongratulations to the family.';
  }

  return isHindi
    ? 'इस खास अवसर पर ढेर सारी शुभकामनाएं।\nखुशियां हमेशा बनी रहें।'
    : 'Warmest wishes on this special occasion.\nMay happiness always remain.';
}

// sync
