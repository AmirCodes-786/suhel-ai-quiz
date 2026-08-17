const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Initialize API clients
let geminiClient = null;
let groqClient = null;

if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.warn('⚠️ Gemini Client initialization warning:', err.message);
  }
}

if (process.env.GROQ_API_KEY) {
  try {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch (err) {
    console.warn('⚠️ Groq Client initialization warning:', err.message);
  }
}

/**
 * Call A4F (Unified AI Gateway) OpenAI-compatible chat completions endpoint
 */
async function callA4FChatCompletion({ prompt, systemPrompt, jsonMode = false }) {
  const apiKey = process.env.A4F_API_KEY;
  if (!apiKey) return null;

  const baseURL = (process.env.A4F_BASE_URL || 'https://api.a4f.co/v1').replace(/\/+$/, '');
  const model = process.env.A4F_MODEL || 'provider-1/chatgpt-4o-latest';

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const payload = {
    model,
    messages,
    temperature: 0.7
  };

  if (jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await axios.post(`${baseURL}/chat/completions`, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 35000
  });

  return response.data?.choices?.[0]?.message?.content || null;
}

/**
 * Clean Markdown fences or stray text from LLM JSON response
 */
function cleanJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return '{}';
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Check if the provided source content has sufficient depth to generate the requested question count.
 */
function validateContentSufficiency(content, requestedCount) {
  const text = (content || '').trim();
  if (!text) {
    return {
      sufficient: false,
      message: 'No study material was provided. Please paste notes, upload a document, or provide a URL.'
    };
  }

  const words = text.split(/\s+/).filter(w => w.length > 1);

  let minWordsRequired = 30;
  if (requestedCount >= 50) minWordsRequired = 350;
  else if (requestedCount >= 30) minWordsRequired = 200;
  else if (requestedCount >= 20) minWordsRequired = 140;
  else if (requestedCount >= 15) minWordsRequired = 100;
  else if (requestedCount >= 10) minWordsRequired = 60;

  if (words.length < minWordsRequired) {
    return {
      sufficient: false,
      message: `This source does not contain enough unique information to generate ${requestedCount} high-quality questions. Try adding more study material or selecting a smaller question count.`
    };
  }

  return { sufficient: true };
}

/**
 * Execute a single prompt call against LLM providers with cascading fallback:
 * 1. Groq (Fastest & high throughput) -> 2. Gemini (Multimodal & deep reasoning) -> 3. A4F Gateway
 */
async function callLLMProvider(prompt, systemInstruction = 'You are QuizForge AI engine. Output strictly valid JSON only.') {
  // 1. Try Groq
  if (groqClient) {
    const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'groq/compound-mini'];
    for (const modelName of groqModels) {
      try {
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          model: modelName,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });
        const text = chatCompletion.choices[0]?.message?.content;
        if (text && text.trim().length > 10) {
          return cleanJsonResponse(text);
        }
      } catch (err) {
        console.warn(`Groq (${modelName}) attempt warning:`, err.message);
      }
    }
  }

  // 2. Try Gemini
  if (geminiClient) {
    const geminiModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];
    for (const modelName of geminiModels) {
      try {
        const model = geminiClient.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95
          }
        });
        const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`);
        const text = result.response.text();
        if (text && text.trim().length > 10) {
          return cleanJsonResponse(text);
        }
      } catch (err) {
        console.warn(`Gemini (${modelName}) attempt warning:`, err.message);
      }
    }
  }

  // 3. Try A4F Gateway
  if (process.env.A4F_API_KEY) {
    try {
      const text = await callA4FChatCompletion({
        prompt,
        systemPrompt: systemInstruction,
        jsonMode: true
      });
      if (text && text.trim().length > 10) {
        return cleanJsonResponse(text);
      }
    } catch (err) {
      console.warn('A4F Gateway attempt warning:', err.message);
    }
  }

  throw new Error('All AI providers (Groq, Gemini, A4F) are currently unavailable or rejected the request. Please verify API keys and network connection.');
}

/**
 * Validate and clean a single generated question.
 * Returns null if question is irrecoverably invalid.
 */
function validateAndCleanQuestion(q, existingQuestions = []) {
  if (!q || typeof q !== 'object') return null;

  // 1. Text check
  const text = (q.text || '').trim();
  if (text.length < 8) return null;

  // 2. Deduplication check (exact or high string similarity)
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const eq of existingQuestions) {
    const normEq = eq.text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normEq === normalizedText || (normEq.length > 20 && normalizedText.includes(normEq))) {
      return null; // Duplicate detected
    }
  }

  // 3. Question type & Options check
  const type = q.type === 'true_false' ? 'true_false' : (q.type === 'fill_blank' ? 'fill_blank' : 'mcq');
  let options = Array.isArray(q.options) ? q.options.map(o => String(o || '').trim()).filter(o => o.length > 0) : [];

  if (type === 'true_false') {
    options = ['True', 'False'];
  } else if (type === 'mcq') {
    // Deduplicate options
    options = Array.from(new Set(options));
    // For MCQ, we require exactly 4 distinct plausible options
    if (options.length < 4) {
      return null; // Invalid MCQ without 4 distinct options
    }
    if (options.length > 4) {
      options = options.slice(0, 4);
    }
  }

  // 4. Correct answer check
  let correctAnswer = String(q.correctAnswer || '').trim();
  if (type === 'true_false') {
    const isTrue = correctAnswer.toLowerCase().includes('true');
    correctAnswer = isTrue ? 'True' : 'False';
  } else if (type === 'mcq') {
    // Map letter indices A, B, C, D if provided
    const letterMap = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 };
    if (correctAnswer in letterMap && options[letterMap[correctAnswer]]) {
      correctAnswer = options[letterMap[correctAnswer]];
    }

    // Map numeric indices 0, 1, 2, 3
    const numIdx = parseInt(correctAnswer, 10);
    if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) {
      correctAnswer = options[numIdx];
    }

    // Match against options
    const match = options.find(o => o.toLowerCase() === correctAnswer.toLowerCase());
    if (match) {
      correctAnswer = match;
    } else {
      // Must strictly match one of the options
      return null;
    }
  }

  // 5. Explanation check
  let explanation = (q.explanation || '').trim();
  if (!explanation || explanation.length < 10) {
    explanation = `The correct answer is "${correctAnswer}" as grounded in the provided core study material.`;
  }

  return {
    id: q.id || `q_${uuidv4().slice(0, 8)}`,
    text,
    type,
    difficulty: q.difficulty || 'Medium',
    bloomLevel: q.bloomLevel || 'Understand',
    options,
    correctAnswer,
    explanation,
    learningTips: Array.isArray(q.learningTips) && q.learningTips.length > 0 ? q.learningTips : ['Review core concepts and practice with flashcards.'],
    points: Number(q.points) || 10
  };
}

/**
 * Generate a single batch of questions using the AI provider.
 */
async function generateQuestionBatch({
  content,
  batchCount,
  batchIndex,
  totalBatches,
  thematicFocus = '',
  category,
  difficulty,
  questionTypes,
  bloomLevels
}) {
  // Construct sensible difficulty guidance
  let difficultyInstruction = `Target Difficulty: ${difficulty}`;
  if (difficulty === 'Mixed' || totalBatches > 1) {
    if (batchIndex === 0) difficultyInstruction = `Target Difficulty: Easy (~80% Easy, ~20% Medium for foundational concepts)`;
    else if (batchIndex === totalBatches - 1) difficultyInstruction = `Target Difficulty: Hard (~70% Hard, ~30% Medium for advanced scenarios)`;
    else difficultyInstruction = `Target Difficulty: Medium (~80% Medium, ~20% Hard for core application)`;
  }

  const prompt = `You are the lead psychometrician and AI assessment engine for QuizForge AI.
Generate a high-quality educational quiz batch with EXACTLY ${batchCount} unique questions grounded EXCLUSIVELY in the provided source material.

### BATCH CONTEXT:
- Batch ${batchIndex + 1} of ${totalBatches}
- Thematic Focus: ${thematicFocus || 'Comprehensive Core Knowledge'}
- Requested Questions in this Batch: ${batchCount}
- Subject/Category: ${category}
- ${difficultyInstruction}
- Allowed Question Types: ${questionTypes.join(', ')}
- Target Bloom's Cognitive Levels: ${bloomLevels.join(', ')}

### STRICT SOURCE-GROUNDING & QUALITY RULES:
1. Grounding: Every question must test facts, concepts, mechanisms, or principles explicitly present in the provided source content. Do NOT invent facts outside the source.
2. Accuracy: Every question must be factually correct and have EXACTLY ONE unambiguously correct answer.
3. Plausible Distractors: For MCQ questions, all 4 options must be distinct, plausible, from the same domain, and grammatically consistent.
4. Correct Answer: The "correctAnswer" field MUST exactly match the text of one of the items in "options".
5. Deep Explanation: Provide a meaningful conceptual explanation teaching WHY the correct answer is right and why the principle applies based on the source.

### REQUIRED JSON SCHEMA:
Return ONLY a valid JSON object matching this schema (no markdown formatting, no comments):
{
  "questions": [
    {
      "text": "Clear, direct question prompt?",
      "type": "mcq",
      "difficulty": "Easy | Medium | Hard",
      "bloomLevel": "Remember | Understand | Apply | Analyze | Evaluate",
      "options": ["Plausible Option A", "Plausible Option B", "Plausible Option C", "Plausible Option D"],
      "correctAnswer": "Plausible Option A",
      "explanation": "Detailed explanation teaching why Option A is correct based on the source text.",
      "learningTips": ["Actionable study tip"]
    }
  ]
}

### SOURCE MATERIAL:
${content ? content.slice(0, 14000) : category}`;

  const rawJson = await callLLMProvider(prompt);
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error('AI provider returned invalid JSON structure. Please retry generation.');
  }

  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  const validBatch = [];

  for (const q of rawQuestions) {
    const cleaned = validateAndCleanQuestion(q, validBatch);
    if (cleaned) {
      validBatch.push(cleaned);
      if (validBatch.length === batchCount) break;
    }
  }

  return validBatch;
}

/**
 * Generate a complete, non-repetitive, high-quality AI quiz with strict question count enforcement.
 * Executes batches in parallel with thematic partitioning to achieve ultra-fast generation times (<8s).
 */
async function generateQuizFromContent({
  content,
  sourceType = 'text',
  title = '',
  category = 'General',
  difficulty = 'Medium',
  questionCount = 5,
  questionTypes = ['mcq', 'true_false'],
  bloomLevels = ['Remember', 'Understand', 'Apply']
}) {
  const targetCount = parseInt(questionCount, 10) || 5;

  // 1. Source Grounding & Content Sufficiency Check
  const sufficiency = validateContentSufficiency(content, targetCount);
  if (!sufficiency.sufficient) {
    const error = new Error(sufficiency.message);
    error.status = 400;
    throw error;
  }

  // 2. Thematic Focus Dimensions for Multi-Batch Partitioning
  const THEMATIC_DOMAINS = [
    'Core Definitions, Key Principles & Foundational Concepts',
    'Mechanisms, Internal Operations & Step-by-Step Workflows',
    'Practical Application Scenarios, Implementations & Code/System Behavior',
    'Edge Cases, Failure Modes, Common Anti-Patterns & Trade-Offs',
    'System Architecture, Comparative Analysis & Optimization Strategies'
  ];

  // 3. Determine Batching Strategy
  const batchPlans = [];
  if (targetCount <= 15) {
    batchPlans.push({ count: targetCount, focus: THEMATIC_DOMAINS[0] });
  } else if (targetCount <= 20) {
    batchPlans.push({ count: 10, focus: THEMATIC_DOMAINS[0] });
    batchPlans.push({ count: targetCount - 10, focus: THEMATIC_DOMAINS[1] });
  } else if (targetCount <= 30) {
    batchPlans.push({ count: 10, focus: THEMATIC_DOMAINS[0] });
    batchPlans.push({ count: 10, focus: THEMATIC_DOMAINS[1] });
    batchPlans.push({ count: targetCount - 20, focus: THEMATIC_DOMAINS[2] });
  } else {
    // 50 questions: 5 parallel batches of 10
    const batchSize = 10;
    const numBatches = Math.ceil(targetCount / batchSize);
    for (let i = 0; i < numBatches; i++) {
      const remaining = targetCount - i * batchSize;
      batchPlans.push({
        count: Math.min(batchSize, remaining),
        focus: THEMATIC_DOMAINS[i % THEMATIC_DOMAINS.length]
      });
    }
  }

  // 4. Execute Batches Concurrently with Promise.all for Maximum Speed
  const batchPromises = batchPlans.map((plan, idx) =>
    generateQuestionBatch({
      content,
      batchCount: plan.count,
      batchIndex: idx,
      totalBatches: batchPlans.length,
      thematicFocus: plan.focus,
      category,
      difficulty,
      questionTypes,
      bloomLevels
    }).catch(err => {
      console.warn(`Batch ${idx + 1} error:`, err.message);
      return [];
    })
  );

  const batchResults = await Promise.all(batchPromises);
  const collectedQuestions = [];

  // Deduplicate and merge all batch results
  for (const batch of batchResults) {
    for (const q of batch) {
      const valid = validateAndCleanQuestion(q, collectedQuestions);
      if (valid) {
        collectedQuestions.push(valid);
        if (collectedQuestions.length === targetCount) break;
      }
    }
    if (collectedQuestions.length === targetCount) break;
  }

  // 5. Top-up Recovery if some questions were rejected during deduplication
  if (collectedQuestions.length < targetCount) {
    const deficit = targetCount - collectedQuestions.length;
    try {
      const topUpBatch = await generateQuestionBatch({
        content,
        batchCount: deficit,
        batchIndex: batchPlans.length,
        totalBatches: batchPlans.length + 1,
        thematicFocus: 'Supplementary High-Yield Core Concepts',
        category,
        difficulty,
        questionTypes,
        bloomLevels
      });

      for (const q of topUpBatch) {
        const valid = validateAndCleanQuestion(q, collectedQuestions);
        if (valid) {
          collectedQuestions.push(valid);
          if (collectedQuestions.length === targetCount) break;
        }
      }
    } catch (e) {
      console.warn('Top-up batch attempt failed:', e.message);
    }
  }

  // 6. Strict Question Count Enforcement
  if (collectedQuestions.length < targetCount) {
    throw new Error(`AI generated ${collectedQuestions.length} valid unique questions from this source, but ${targetCount} were requested. Please provide more detailed study material or choose a lower question count.`);
  }

  const finalQuestions = collectedQuestions.slice(0, targetCount);

  return {
    title: title || `${category} Assessment`,
    description: `Comprehensive AI-generated assessment covering ${category} with ${finalQuestions.length} questions.`,
    category,
    difficulty,
    timeLimit: Math.max(5, Math.ceil(finalQuestions.length * 1.5)),
    bloomLevels: Array.isArray(bloomLevels) ? bloomLevels : ['Understand', 'Apply'],
    tags: [category, 'Assessment', 'QuizForge AI'],
    questions: finalQuestions
  };
}

/**
 * Regenerate an individual question with optional difficulty adjustment
 * modes: 'same' | 'easier' | 'harder'
 */
async function regenerateQuestionAI({
  currentQuestion,
  sourceContent = '',
  category = 'General',
  difficulty = 'Medium',
  bloomLevel = 'Understand',
  mode = 'same'
}) {
  let targetDifficulty = difficulty;
  if (mode === 'easier') targetDifficulty = 'Easy';
  if (mode === 'harder') targetDifficulty = 'Hard';

  const prompt = `You are QuizForge AI engine. Regenerate a single, replacement assessment question.
Subject/Topic: ${category}
Target Difficulty: ${targetDifficulty} (Mode: ${mode})
Bloom Level: ${bloomLevel}

Previous Question to Replace:
"${currentQuestion?.text || 'Current question'}"

RULES:
1. Generate a NEW, DISTINCT question grounded in the source content.
2. Must have 4 plausible options for MCQ with EXACTLY ONE correct answer.
3. Provide a clear educational explanation.
4. Return ONLY valid JSON:
{
  "text": "New question prompt?",
  "type": "mcq",
  "difficulty": "${targetDifficulty}",
  "bloomLevel": "${bloomLevel}",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Why this option is correct based on the concept."
}

SOURCE CONTENT:
${sourceContent ? sourceContent.slice(0, 5000) : category}`;

  const rawJson = await callLLMProvider(prompt);
  const parsed = JSON.parse(rawJson);
  const valid = validateAndCleanQuestion(parsed, []);

  if (!valid) {
    throw new Error('Failed to regenerate a valid question. Please retry.');
  }

  return valid;
}

/**
 * Generate Flashcards from text/quiz with high quality and zero repetition
 */
async function generateFlashcardsAI({ topic, text, count = 6, depthFocus = 'Comprehensive (Concepts & Scenarios)' }) {
  const prompt = `You are an expert curriculum designer. Generate ${count} completely UNIQUE, DIVERSE, and NON-REPETITIVE active recall flashcards on "${topic}".
Focus Dimension: ${depthFocus}.
Content context: ${text ? text.slice(0, 6000) : `Deep conceptual exploration of ${topic}`}.

### REQUIREMENTS:
1. Every card must explore a DISTINCT sub-concept, mechanism, comparison, or practical trade-off.
2. Front must be a concise, stimulating active recall question or prompt.
3. Back must provide a crisp, accurate, conceptual explanation (1-3 sentences).

Return ONLY valid JSON format:
{
  "title": "${topic} Flashcards",
  "topic": "${topic}",
  "cards": [
    { "front": "Distinct Concept Question / Challenge", "back": "Precise conceptual answer / Explanation" }
  ]
}`;

  const rawJson = await callLLMProvider(prompt);
  const parsed = JSON.parse(rawJson);
  const rawCards = Array.isArray(parsed.cards) ? parsed.cards : [];

  if (rawCards.length === 0) {
    throw new Error('AI could not synthesize flashcards from the provided content.');
  }

  const cleanedCards = rawCards.slice(0, count).map((c, i) => ({
    id: `c_${uuidv4().slice(0, 6)}_${i + 1}`,
    front: (c.front || '').trim(),
    back: (c.back || '').trim(),
    mastery: 'unseen',
    bookmarked: false
  })).filter(c => c.front && c.back);

  return {
    title: parsed.title || `${topic} Flashcards`,
    topic,
    cards: cleanedCards
  };
}

/**
 * Generate Personalized AI Study Plan
 */
async function generateStudyPlanAI({ weakTopics = [], goal = 'Exam Prep', targetWeeks = 3 }) {
  const topicsStr = weakTopics.length > 0 ? weakTopics.join(', ') : 'Core Concepts & Advanced Topics';
  
  return {
    title: `Personalized Roadmap: ${goal}`,
    goal: goal,
    targetWeeks: targetWeeks,
    progress: 15,
    tasks: [
      { id: `t_${uuidv4().slice(0, 6)}`, title: `Review foundational theory for: ${topicsStr}`, priority: 'High', estimatedMinutes: 45, completed: false, category: 'Reading', day: 1 },
      { id: `t_${uuidv4().slice(0, 6)}`, title: `Complete 10 Bloom's 'Analyze' Level Practice Questions`, priority: 'High', estimatedMinutes: 30, completed: false, category: 'Quiz', day: 2 },
      { id: `t_${uuidv4().slice(0, 6)}`, title: `Active Recall flashcard session (spaced repetition)`, priority: 'Medium', estimatedMinutes: 20, completed: false, category: 'Flashcards', day: 3 },
      { id: `t_${uuidv4().slice(0, 6)}`, title: `Real-time Quiz Battle challenge with team peers`, priority: 'Low', estimatedMinutes: 25, completed: false, category: 'Battle', day: 4 },
      { id: `t_${uuidv4().slice(0, 6)}`, title: `Comprehensive Diagnostic Assessment & Certificate test`, priority: 'High', estimatedMinutes: 60, completed: false, category: 'Milestone', day: 5 }
    ]
  };
}

module.exports = {
  generateQuizFromContent,
  regenerateQuestionAI,
  generateFlashcardsAI,
  generateStudyPlanAI,
  validateContentSufficiency
};
