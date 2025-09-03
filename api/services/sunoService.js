// api/services/sunoService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE        = (process.env.SUNOAPI_ORG_BASE_URL || 'https://api.sunoapi.org/api/v1').replace(/\/$/, '');
const GEN_PATH    = process.env.SUNOAPI_ORG_GENERATE_PATH    || '/generate';
const INFO_PATH   = process.env.SUNOAPI_ORG_RECORDINFO_PATH  || '/generate/record-info';
const MODELS_PATH = process.env.SUNOAPI_ORG_MODELS_PATH      || '/models';
const API_KEY     = process.env.SUNOAPI_ORG_API_KEY;
const CALLBACK    = process.env.SUNOAPI_ORG_CALLBACK_URL || '';
const MODEL_ENV   = process.env.SUNOAPI_ORG_MODEL || 'V4_5';

function requireKey() {
  if (!API_KEY) {
    const e = new Error('SUNO_API_KEY_MISSING');
    e.httpStatus = 500;
    throw e;
  }
}

function authHeaders() {
  requireKey();
  return {
    Authorization: `Bearer ${API_KEY}`,
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  };
}

const http = axios.create({
  baseURL: BASE,
  timeout: 30000,
  validateStatus: () => true,
});

function providerErrorIfPresent(data) {
  // Some providers return HTTP 200 with an error payload: { code: 400, msg: "...", data: null }
  const code = typeof data?.code !== 'undefined' ? Number(data.code) : null;
  const hasEmbeddedError = (code && code !== 200) || data?.error || data?.errors;
  if (hasEmbeddedError) {
    const e = new Error(data?.msg || data?.error?.message || 'suno_provider_error');
    e.httpStatus = 502;
    e.details = data;
    throw e;
  }
}

function normalizeGenerateResponse(resData) {
  const jobId =
    resData?.jobId || resData?.taskId || resData?.id ||
    resData?.data?.jobId || resData?.data?.taskId || resData?.data?.id || null;

  const recordId =
    resData?.recordId || resData?.data?.recordId || null;

  const audioUrl =
    resData?.audioUrl || resData?.audio_url || resData?.url ||
    resData?.data?.audioUrl || resData?.data?.audio_url ||
    resData?.data?.audio?.url || (resData?.data?.files?.[0]?.url) || null;

  const status =
    resData?.status || resData?.state || resData?.jobStatus ||
    (audioUrl ? 'completed' : 'queued');

  return {
    status,
    audioUrl,
    metadata: { jobId, recordId, raw: resData },
  };
}

async function generateSong(payload = {}) {
  const url = `${GEN_PATH.startsWith('/') ? GEN_PATH : `/${GEN_PATH}`}`;

  const body = {
    prompt: payload.prompt || payload.story || 'SongCreator test',
    title: payload.title || payload.fullName || 'SongCreator',
    style: payload.songStyle || payload.style || undefined,
    mood: payload.mood || undefined,
    tempo: payload.tempo || undefined,
    duration: payload.duration || 30,
    instrumental: typeof payload.instrumental === 'boolean' ? payload.instrumental : false,
    language: payload.language || 'en',
    namesToInclude: payload.namesToInclude || undefined,
    model: payload.model || MODEL_ENV,
    customMode: false,
    callbackUrl: CALLBACK || undefined,
  };

  const res = await http.post(url, body, { headers: authHeaders() });

  if (res.status === 401 || res.status === 403) {
    const e = new Error('suno_auth_failed');
    e.httpStatus = 401;
    e.details = res.data;
    throw e;
  }
  if (res.status >= 400) {
    const e = new Error('suno_generate_failed');
    e.httpStatus = 502;
    e.details = { status: res.status, data: res.data };
    throw e;
  }
  providerErrorIfPresent(res.data);

  return normalizeGenerateResponse(res.data);
}

async function checkSongStatus({ jobId, recordId }) {
  const url = `${INFO_PATH.startsWith('/') ? INFO_PATH : `/${INFO_PATH}`}`;
  const params = {};
  if (recordId) params.id = recordId;
  if (jobId) params.jobId = jobId;

  const res = await http.get(url, { headers: authHeaders(), params, timeout: 20000 });

  if (res.status === 401 || res.status === 403) {
    const e = new Error('suno_auth_failed');
    e.httpStatus = 401;
    e.details = res.data;
    throw e;
  }
  if (res.status >= 400) {
    const e = new Error('suno_recordinfo_failed');
    e.httpStatus = 502;
    e.details = { status: res.status, data: res.data };
    throw e;
  }
  providerErrorIfPresent(res.data);

  const data = res.data;

  const audioUrl =
    data?.audioUrl || data?.audio_url || data?.url ||
    data?.data?.audioUrl || data?.data?.audio_url ||
    data?.data?.audio?.url || (data?.data?.files?.[0]?.url) || null;

  const status =
    data?.status || data?.state || data?.jobStatus ||
    (audioUrl ? 'completed' : (data?.queued ? 'queued' : 'processing'));

  const progress = typeof data?.progress === 'number'
    ? data.progress
    : (status === 'completed' ? 100 : status === 'queued' ? 0 : 50);

  const discoveredRecordId =
    data?.recordId || data?.data?.recordId || recordId || null;

  return {
    status,
    progress,
    audioUrl,
    estimatedTime: data?.etaSeconds ?? data?.estimatedTime ?? null,
    startedAt: data?.startedAt || null,
    recordId: discoveredRecordId,
  };
}

async function getModels() {
  const url = `${MODELS_PATH.startsWith('/') ? MODELS_PATH : `/${MODELS_PATH}`}`;
  const res = await http.get(url, { headers: authHeaders(), timeout: 15000 });
  if (res.status >= 400) {
    return [{ id: 'default', name: 'Default Model', provider: 'sunoapi_org' }];
  }
  providerErrorIfPresent(res.data);
  return res.data;
}

async function downloadAudioFile(fileUrl, songId, baseName = 'song') {
  if (!fileUrl) throw new Error('downloadAudioFile: missing fileUrl');

  const dir = path.join(__dirname, '..', 'uploads', 'audio');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const safeBase = String(baseName).replace(/[^\w.-]+/g, '_').slice(0, 40);
  const filename = `${safeBase}_${songId}.mp3`;
  const filePath = path.join(dir, filename);

  const resp = await axios.get(fileUrl, { responseType: 'stream' });
  const writer = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    resp.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const size = fs.statSync(filePath).size;
  return { filename, path: filePath, size };
}

/**
 * Start asynchronous song generation process
 * This function handles the generation flow and updates the record accordingly
 */
async function startGeneration(record) {
  try {
    console.log('[START_GENERATION] Starting generation for record:', record.id);
    
    // Prioritize user-selected language from form, fallback to detected language
    const detectedFromText = detectLanguage(record.story || record.prompt || '');
    // Always prioritize the user-selected language from the form
    const userLanguage = record.language || 'tr'; // Default to Turkish if not specified
    
    console.log('[START_GENERATION] Record language from form:', record.language);
    console.log('[START_GENERATION] Story text:', record.story?.substring(0, 100) + '...');
    console.log('[START_GENERATION] Detected language from text:', detectedFromText);
    console.log('[START_GENERATION] Final user language:', userLanguage);
    
    // If user explicitly selected a language in the form, use that
    if (record.language && record.language !== 'en') {
      console.log('[START_GENERATION] Using user-selected language from form:', record.language);
    } else if (detectedFromText && detectedFromText !== 'en') {
      console.log('[START_GENERATION] Using detected language from text:', detectedFromText);
    } else {
      console.log('[START_GENERATION] Defaulting to English');
    }
    
    // Build the prompt for exact lyrics mode
    const prompt = buildExactLyricsPrompt(record, userLanguage);
    console.log('[START_GENERATION] Generated prompt:', prompt.substring(0, 200) + '...');
    console.log('[START_GENERATION] Exact lyrics mode:', record.exactLyrics);
    console.log('[START_GENERATION] Instrumental mode:', record.instrumental);
    console.log('[START_GENERATION] Final language used:', userLanguage);

    // Use the musicProvider instead of the old sunoService
    const musicProvider = require('./musicProvider');
    console.log('[START_GENERATION] Calling musicProvider.generateSong with:', {
      prompt: prompt.substring(0, 100) + '...',
      duration: record.duration || 30,
      style: record.songStyle || 'pop',
      mood: record.mood || 'happy',
      debugSmall: false,
      instrumental: record.instrumental || false
    });
    
    const songResult = await musicProvider.generateSong(
      prompt,
      record.duration || 30,
      record.songStyle || 'pop',
      record.mood || 'happy',
      false, // debugSmall
      record.instrumental || false, // instrumental mode
      userLanguage // language parameter
    );

    console.log('[START_GENERATION] Song generation initiated:', songResult);

    // Update the record with the job ID and status
    const requestStore = require('../lib/requestStore');
    const updateData = {
      status: 'queued',
      updatedAt: new Date().toISOString(),
      detectedLanguage: userLanguage,
      instrumental: record.instrumental || false
    };

    console.log('[START_GENERATION] Analyzing provider response for IDs...');
    console.log('[START_GENERATION] Raw songResult:', JSON.stringify(songResult, null, 2));

    // Extract jobId and recordId from the provider response
    if (songResult.jobId) {
      updateData.providerJobId = songResult.jobId;
      console.log('[START_GENERATION] ✅ Found jobId:', songResult.jobId);
    } else {
      console.log('[START_GENERATION] ❌ No jobId found in songResult');
    }

    if (songResult.recordId) {
      updateData.providerRecordId = songResult.recordId;
      console.log('[START_GENERATION] ✅ Found recordId:', songResult.recordId);
    } else {
      console.log('[START_GENERATION] ❌ No recordId found in songResult');
    }

    // If the provider response has a different structure, try to extract from metadata
    if (!updateData.providerJobId && songResult.metadata?.jobId) {
      updateData.providerJobId = songResult.metadata.jobId;
      console.log('[START_GENERATION] ✅ Found jobId in metadata:', songResult.metadata.jobId);
    }

    if (!updateData.providerRecordId && songResult.metadata?.recordId) {
      updateData.providerRecordId = songResult.metadata.recordId;
      console.log('[START_GENERATION] ✅ Found recordId in metadata:', songResult.metadata.recordId);
    }

    // Try to find any ID-like fields
    if (!updateData.providerRecordId) {
      const possibleRecordIds = [
        songResult.id,
        songResult.record_id,
        songResult.recordId,
        songResult.data?.id,
        songResult.data?.recordId,
        songResult.data?.record_id
      ].filter(Boolean);
      
      if (possibleRecordIds.length > 0) {
        updateData.providerRecordId = possibleRecordIds[0];
        console.log('[START_GENERATION] 🔍 Found possible recordId from other fields:', possibleRecordIds[0]);
      }
    }

    await requestStore.update(record.id, updateData);
    await requestStore.saveNow();

    console.log('[START_GENERATION] Record updated successfully for:', record.id);
    console.log('[START_GENERATION] Final update data:', updateData);
    
    return songResult;
  } catch (error) {
    console.error('[START_GENERATION] Error starting generation for record:', record.id, error);
    
    // Update record with error status
    try {
      const requestStore = require('../lib/requestStore');
      await requestStore.update(record.id, {
        status: 'failed',
        error: error.message,
        updatedAt: new Date().toISOString()
      });
      await requestStore.saveNow();
    } catch (updateError) {
      console.error('[START_GENERATION] Failed to update record with error status:', updateError);
    }
    
    throw error;
  }
}

/**
 * Detect language from text input
 * @param {string} text - Input text to analyze
 * @returns {string} - Detected language code
 */
function detectLanguage(text) {
  if (!text) return 'unknown';
  
  // Enhanced Turkish detection
  const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
  const turkishWords = /\b(ve|bir|için|bu|ile|var|olan|değil|gibi|kadar|da|de|ki|mi|mu|mü|mı|daha|çok|tüm|her|hiç|bütün|kendi|onun|onlar|bizim|sizin|şu|o|ben|sen|biz|siz|ama|fakat|ancak|sadece|yani|çünkü|eğer|nasıl|neden|nerede|ne|kim|hangi|kaç|şey|zaman|yer|kişi|insan|hayat|dünya|ülke|şehir|ev|okul|iş|para|saat|gün|yıl|ay|hafta|sabah|akşam|gece|bugün|yarın|dün|şimdi|sonra|önce|aşk|sevgi|mutlu|üzgün|güzel|kötü|büyük|küçük|yeni|eski|iyi|doğru|yanlış|siyah|beyaz|kırmızı|mavi|yeşil|sarı|anne|baba|kardeş|arkadaş|aile|çocuk|kadın|erkek|kız|oğlan|yaşlı|genç|öğrenci|öğretmen|doktor|hemşire|polis|asker|işçi|memur|başkan|yemek|su|ekmek|et|sebze|meyve|çay|kahve|süt|şeker|tuz|yağ|pirinç|makarna|tavuk|balık|peynir|yoğurt|elma|armut|üzüm|portakal|limon|domates|salatalık|soğan|patates|havuç|araba|otobüs|tren|uçak|gemi|bisiklet|yol|köprü|bina|dağ|deniz|göl|nehir|ağaç|çiçek|hayvan|köpek|kedi|kuş|at|inek|koyun|keçi|tavşan|fare|aslan|kaplan|fil|maymun|kitap|gazete|dergi|televizyon|radyo|telefon|bilgisayar|internet|müzik|film|oyun|spor|futbol|basketbol|voleybol|tenis|yüzme|koşu|dans|resim|fotoğraf|seyahat|tatil|alışveriş|market|mağaza|restoran|hastane|eczane|banka|postane|hotel|müze|sinema|tiyatro|konsol|park|bahçe|plaj|orman|çöl|kar|yağmur|güneş|yıldız|bulut|rüzgar|sıcak|soğuk|ilkbahar|yaz|sonbahar|kış|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|merhaba|türkçe|konuşuyorum|test|metnidir)\b/gi;
  
  const russianChars = /[а-яёА-ЯЁ]/;
  const arabicChars = /[ء-ي]/;
  const persianChars = /[آ-ی]/;
  const chineseChars = /[\u4e00-\u9fff]/;
  const japaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanChars = /[\uac00-\ud7af]/;
  const dutchChars = /\b(het|de|een|van|en|in|op|te|voor|met|zijn|dat|niet|aan|ook|als|naar|maar|om|hier|zo|dan|wat|nu|al|bij|na|wel|of|uit|kan|nog|geen|ja|er|maar|omdat|dit|zoals|jij|zij|wij|ons|mijn|zijn|haar|hun|dit|dat|deze|die|mijn|jouw|zijn|haar|ons|jullie|hun|ik|je|hij|zij|we|jullie|ze|mijn|jouw|zijn|haar|ons|hun|dit|dat|deze|die|wie|wat|waar|wanneer|waarom|hoeveel|veel|weinig|groot|klein|nieuw|oud|goed|slecht|mooi|lelijk|blij|verdrietig|liefde|geluk|vriendschap|familie|moeder|vader|broer|zus|kind|vrouw|man|meisje|jongen|baby|opa|oma|huis|auto|fiets|trein|bus|vliegtuig|boot|weg|straat|brug|gebouw|berg|zee|meer|rivier|boom|bloem|dier|hond|kat|vogel|vis|paard|koe|schaap|geit|konijn|muis|leeuw|tijger|olifant|aap|boek|krant|tijdschrift|televisie|radio|telefoon|computer|internet|muziek|film|spel|sport|voetbal|basketbal|volleybal|tennis|zwemmen|rennen|dansen|schilderen|fotografie|reizen|vakantie|winkelen|supermarkt|winkel|restaurant|ziekenhuis|apotheek|bank|postkantoor|hotel|museum|bioscoop|theater|concert|park|tuin|strand|bos|woestijn|sneeuw|regen|zon|maan|ster|wolk|wind|warm|koud|lente|zomer|herfst|winter|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\b/gi;
  
  // Check for Turkish first (chars or common words)
  if (turkishChars.test(text) || turkishWords.test(text)) {
    console.log('[LANGUAGE_DETECTION] Turkish detected from text');
    return 'tr';
  }
  
  // Check for English words to avoid false positives
  const englishWords = /\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use|hello|speaking|test|text|this|is|am)\b/gi;
  if (englishWords.test(text) && !turkishChars.test(text)) {
    console.log('[LANGUAGE_DETECTION] English detected from text');
    return 'en';
  }
  if (russianChars.test(text)) return 'ru';
  if (arabicChars.test(text)) return 'ar';
  if (persianChars.test(text)) return 'fa';
  if (chineseChars.test(text)) return 'zh';
  if (japaneseChars.test(text)) return 'ja';
  if (koreanChars.test(text)) return 'ko';
  if (dutchChars.test(text)) return 'nl';
  
  // Default to English if no specific characters detected
  console.log('[LANGUAGE_DETECTION] No specific language detected, defaulting to English');
  return 'en';
}

/**
 * Build exact lyrics prompt with language locking
 * @param {Object} record - Song record data
 * @param {string} language - Detected language code
 * @returns {string} - Formatted prompt for exact lyrics
 */
function buildExactLyricsPrompt(record, language) {
  const isInstrumental = record.instrumental || false;
  const useExactLyrics = record.exactLyrics || false;
  
  if (isInstrumental) {
    // Instrumental mode - ignore lyrics, focus on style/mood/tempo
    return `Create an instrumental ${record.songStyle || 'pop'} song. ` +
           `Style: ${record.songStyle || 'pop'}. ` +
           `Mood: ${record.mood || 'neutral'}. ` +
           `Tempo: ${record.tempo || 'Medium (80-120 BPM)'}. ` +
           `Duration: ${record.duration || 30} seconds. ` +
           `NO VOCALS - instrumental only.`;
  }
  
  if (useExactLyrics) {
    // Exact lyrics mode - use user's text verbatim
    const userText = record.story || record.prompt || '';
    const languageNames = {
      'tr': 'Turkish',
      'ru': 'Russian', 
      'ar': 'Arabic',
      'fa': 'Persian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'en': 'English',
      'nl': 'Dutch'
    };
    
    const languageName = languageNames[language] || 'the input language';
    
    let strongLanguageInstruction = `CRITICAL LANGUAGE LOCK: Must sing ONLY in ${languageName}. NO TRANSLATION. NO ENGLISH DRIFT. NO ENGLISH WORDS.`;
    if (language === 'tr') {
      strongLanguageInstruction = `CRITICAL TURKISH LANGUAGE LOCK: Şarkı SADECE Türkçe olmalı. İngilizce kelime KULLANMA. Tüm şarkı Türkçe sözlerle söylenmeli. Hiçbir İngilizce kelime olmamalı. Bu kesin bir gereklilik.`;
    } else if (language === 'nl') {
      strongLanguageInstruction = `CRITICAL DUTCH LANGUAGE LOCK: Het lied moet ALLEEN in het Nederlands zijn. GEEN Engelse woorden gebruiken. Het hele lied moet in Nederlandse teksten worden gezongen. Geen Engelse woorden toegestaan. Dit is een strikte vereiste.`;
    } else if (language === 'ru') {
      strongLanguageInstruction = `CRITICAL RUSSIAN LANGUAGE LOCK: Песня должна быть ТОЛЬКО на русском языке. НЕ использовать английские слова. Вся песня должна быть на русском языке. Никаких английских слов не допускается. Это строгое требование.`;
    } else if (language === 'ar') {
      strongLanguageInstruction = `CRITICAL ARABIC LANGUAGE LOCK: يجب أن تكون الأغنية باللغة العربية فقط. لا تستخدم الكلمات الإنجليزية. يجب أن تكون الأغنية بأكملها باللغة العربية. لا يُسمح بأي كلمات إنجليزية. هذا متطلب صارم.`;
    } else if (language === 'fa') {
      strongLanguageInstruction = `CRITICAL PERSIAN LANGUAGE LOCK: آهنگ باید فقط به فارسی باشد. از کلمات انگلیسی استفاده نکنید. کل آهنگ باید به فارسی باشد. هیچ کلمه انگلیسی مجاز نیست. این یک الزام سختگیرانه است.`;
    } else if (language === 'zh') {
      strongLanguageInstruction = `CRITICAL CHINESE LANGUAGE LOCK: 歌曲必须只用中文演唱。不要使用英语单词。整首歌必须用中文演唱。不允许任何英语单词。这是一个严格的要求。`;
    } else if (language === 'ja') {
      strongLanguageInstruction = `CRITICAL JAPANESE LANGUAGE LOCK: 歌は日本語でのみ歌われる必要があります。英語の単語を使用しないでください。歌全体は日本語で歌われる必要があります。英語の単語は許可されません。これは厳格な要件です。`;
    } else if (language === 'ko') {
      strongLanguageInstruction = `CRITICAL KOREAN LANGUAGE LOCK: 노래는 한국어로만 불러야 합니다. 영어 단어를 사용하지 마세요. 전체 노래는 한국어로 불러야 합니다. 영어 단어는 허용되지 않습니다. 이것은 엄격한 요구사항입니다.`;
    }
    
    return `Create a ${record.songStyle || 'pop'} song with EXACT lyrics. ` +
           `Style: ${record.songStyle || 'pop'}. ` +
           `Mood: ${record.mood || 'neutral'}. ` +
           `Tempo: ${record.tempo || 'Medium (80-120 BPM)'}. ` +
           `Duration: ${record.duration || 30} seconds. ` +
           `${strongLanguageInstruction} ` +
           `EXACT LYRICS TO SING: "${userText}"`;
  }
  
  // Free-form mode (default) - traditional prompt generation
  const languageNames = {
    'tr': 'Turkish',
    'ru': 'Russian', 
    'ar': 'Arabic',
    'fa': 'Persian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'en': 'English',
    'nl': 'Dutch'
  };
  
  const languageName = languageNames[language] || 'English';
  
  // Very strong language instructions for non-English languages
  let languageInstruction = `Sing in ${languageName}.`;
  if (language === 'tr') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Turkish language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Turkish. Use Turkish lyrics, Turkish words, Turkish phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'nl') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Dutch language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Dutch. Use Dutch lyrics, Dutch words, Dutch phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'ru') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Russian language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Russian. Use Russian lyrics, Russian words, Russian phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'ar') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Arabic language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Arabic. Use Arabic lyrics, Arabic words, Arabic phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'fa') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Persian language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Persian. Use Persian lyrics, Persian words, Persian phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'zh') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Chinese language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Chinese. Use Chinese lyrics, Chinese words, Chinese phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'ja') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Japanese language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Japanese. Use Japanese lyrics, Japanese words, Japanese phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language === 'ko') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in Korean language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in Korean. Use Korean lyrics, Korean words, Korean phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  } else if (language !== 'en') {
    languageInstruction = `CRITICAL LANGUAGE REQUIREMENT: The song MUST be sung ENTIRELY in ${languageName} language. NO English words allowed. NO English phrases. NO English lyrics. The entire song from start to finish must be in ${languageName}. Use ${languageName} lyrics, ${languageName} words, ${languageName} phrases throughout. This is a strict requirement - the song cannot contain any English.`;
  }
  
  // For Turkish, add even more explicit instructions at the beginning
  let basePrompt = `Create a ${record.songStyle || 'pop'} song for ${record.specialOccasion || 'an event'}. ` +
         `Mood: ${record.mood || 'neutral'}. Tempo: ${record.tempo || 'Medium (80-120 BPM)'}. ` +
         `${languageInstruction} ` +
         `Include names: ${record.namesToInclude || 'N/A'}. Story: ${record.story || 'N/A'}.`;
  
  // For Turkish, add a very explicit instruction at the very beginning
  if (language === 'tr') {
    basePrompt = `TURKISH SONG REQUIREMENT: This song MUST be sung ENTIRELY in Turkish language. NO English words. NO English phrases. NO English lyrics. The entire song from start to finish must be in Turkish. Use Turkish lyrics, Turkish words, Turkish phrases throughout. This is a strict requirement - the song cannot contain any English. ` + basePrompt;
    
    // Add additional Turkish-specific instructions
    basePrompt += ` IMPORTANT: The song lyrics must be in Turkish language only. Do not use any English words or phrases. The entire song should be sung in Turkish from beginning to end.`;
  }
  
  return basePrompt;
}

module.exports = {
  generateSong,
  checkSongStatus,
  getModels,
  downloadAudioFile,
  startGeneration,
  detectLanguage, // Export for testing
  buildExactLyricsPrompt, // Export for testing
};
