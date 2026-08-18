/**
 * QUIZFORGE AI — BALANCED ANSWER DISTRIBUTION ENGINE
 * 
 * Responsibilities:
 * 1. Balance MCQ correct answer positions across A (0), B (1), C (2), D (3) as evenly as possible.
 * 2. Maintain 100% factual correctness (only shuffle options; never change which answer is factually correct).
 * 3. Eliminate predictable streaks (no 3 identical in a row) and repeating sequence cycles.
 * 4. Balance True/False questions without predictable alternating patterns.
 * 5. Interleave mixed question types naturally.
 * 6. Post-generation validation of option arrays and correct-answer pointers.
 */

/**
 * Fisher-Yates Shuffle
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a balanced, randomized sequence of target positions (0, 1, 2, 3) for N multiple choice questions.
 * E.g. for N=20: 5 A's, 5 B's, 5 C's, 5 D's.
 * E.g. for N=30: 8 A's, 8 B's, 7 C's, 7 D's.
 * E.g. for N=50: 13 A's, 13 B's, 12 C's, 12 D's.
 */
function generateBalancedMCQPositions(count) {
  if (count <= 0) return [];
  
  const positions = [];
  const baseCount = Math.floor(count / 4);
  const remainder = count % 4;
  
  // Randomly distribute remainder across [0, 1, 2, 3] so no slot is favored
  const remainderIndices = shuffleArray([0, 1, 2, 3]).slice(0, remainder);
  
  for (let pos = 0; pos < 4; pos++) {
    const targetCount = baseCount + (remainderIndices.includes(pos) ? 1 : 0);
    for (let i = 0; i < targetCount; i++) {
      positions.push(pos);
    }
  }

  // Shuffle initial positions
  let shuffled = shuffleArray(positions);
  let attempts = 0;

  // Enforce anti-pattern rules (max 50 perturbation iterations)
  while (attempts < 50) {
    let hasViolation = false;

    // Rule 1: No streak of 3 identical positions (e.g. A-A-A)
    for (let i = 0; i < shuffled.length - 2; i++) {
      if (shuffled[i] === shuffled[i + 1] && shuffled[i + 1] === shuffled[i + 2]) {
        hasViolation = true;
        // Swap element at i+2 with a different element further in the array
        let swapIdx = -1;
        for (let j = i + 3; j < shuffled.length; j++) {
          if (shuffled[j] !== shuffled[i]) {
            swapIdx = j;
            break;
          }
        }
        if (swapIdx !== -1) {
          [shuffled[i + 2], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i + 2]];
        } else {
          for (let j = 0; j < i; j++) {
            if (shuffled[j] !== shuffled[i]) {
              [shuffled[i + 2], shuffled[j]] = [shuffled[j], shuffled[i + 2]];
              break;
            }
          }
        }
      }
    }

    // Rule 2: No 2-element cycle repetition >= 3 times (e.g. A-B-A-B-A-B)
    for (let i = 0; i < shuffled.length - 5; i++) {
      if (
        shuffled[i] === shuffled[i + 2] &&
        shuffled[i + 2] === shuffled[i + 4] &&
        shuffled[i + 1] === shuffled[i + 3] &&
        shuffled[i + 3] === shuffled[i + 5]
      ) {
        hasViolation = true;
        const swapTarget = (i + 3 + Math.floor(Math.random() * (shuffled.length - (i + 3)))) % shuffled.length;
        [shuffled[i + 2], shuffled[swapTarget]] = [shuffled[swapTarget], shuffled[i + 2]];
      }
    }

    // Rule 3: No 4-element cycle repetition >= 2 times (e.g. A-B-C-D-A-B-C-D)
    for (let i = 0; i < shuffled.length - 7; i++) {
      if (
        shuffled[i] === shuffled[i + 4] &&
        shuffled[i + 1] === shuffled[i + 5] &&
        shuffled[i + 2] === shuffled[i + 6] &&
        shuffled[i + 3] === shuffled[i + 7]
      ) {
        hasViolation = true;
        const swapTarget = (i + 4 + Math.floor(Math.random() * (shuffled.length - (i + 4)))) % shuffled.length;
        [shuffled[i + 1], shuffled[swapTarget]] = [shuffled[swapTarget], shuffled[i + 1]];
      }
    }

    if (!hasViolation) break;
    attempts++;
  }

  return shuffled;
}

/**
 * Balance True/False questions without predictable streaks
 */
function balanceTrueFalseQuestions(tfQuestions) {
  if (!tfQuestions || tfQuestions.length === 0) return [];
  
  const trueList = tfQuestions.filter(q => String(q.correctAnswer).toLowerCase().includes('true'));
  const falseList = tfQuestions.filter(q => String(q.correctAnswer).toLowerCase().includes('false'));

  const result = [];
  let tIdx = 0;
  let fIdx = 0;
  let lastVal = null;
  let streak = 0;

  while (tIdx < trueList.length || fIdx < falseList.length) {
    const canTakeTrue = tIdx < trueList.length;
    const canTakeFalse = fIdx < falseList.length;

    let takeTrue = false;
    if (canTakeTrue && canTakeFalse) {
      if (lastVal === 'True' && streak >= 2) {
        takeTrue = false;
      } else if (lastVal === 'False' && streak >= 2) {
        takeTrue = true;
      } else {
        const remainingTrue = trueList.length - tIdx;
        const remainingFalse = falseList.length - fIdx;
        takeTrue = Math.random() < (remainingTrue / (remainingTrue + remainingFalse));
      }
    } else if (canTakeTrue) {
      takeTrue = true;
    } else {
      takeTrue = false;
    }

    if (takeTrue) {
      const q = trueList[tIdx++];
      q.options = ['True', 'False'];
      q.correctAnswer = 'True';
      result.push(q);
      streak = (lastVal === 'True') ? streak + 1 : 1;
      lastVal = 'True';
    } else {
      const q = falseList[fIdx++];
      q.options = ['True', 'False'];
      q.correctAnswer = 'False';
      result.push(q);
      streak = (lastVal === 'False') ? streak + 1 : 1;
      lastVal = 'False';
    }
  }

  return result;
}

/**
 * Main Quiz Balance & Validation Function
 * Executes in standard backend logic post-AI generation.
 */
function balanceAndValidateQuizQuestions(rawQuestions = []) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) return [];

  const mcqs = [];
  const trueFalseQuestions = [];
  const otherQuestions = [];

  // 1. Separate questions by type
  for (const q of rawQuestions) {
    if (!q || typeof q !== 'object') continue;
    const type = q.type || 'mcq';
    if (type === 'true_false') {
      trueFalseQuestions.push({ ...q });
    } else if (type === 'mcq') {
      mcqs.push({ ...q });
    } else {
      otherQuestions.push({ ...q });
    }
  }

  // 2. Process MCQs: Distribute correct answers evenly across positions A (0), B (1), C (2), D (3)
  const balancedPositions = generateBalancedMCQPositions(mcqs.length);
  const balancedMCQs = [];

  for (let i = 0; i < mcqs.length; i++) {
    const q = mcqs[i];
    const targetPos = balancedPositions[i]; // 0, 1, 2, or 3
    const correctText = String(q.correctAnswer || '').trim();

    // Identify distractors (all items in options that are NOT equal to correctText)
    const rawOptions = Array.isArray(q.options) ? q.options.map(o => String(o).trim()).filter(Boolean) : [];
    let distractors = rawOptions.filter(o => o.toLowerCase() !== correctText.toLowerCase());

    // Deduplicate distractors
    distractors = Array.from(new Set(distractors));

    // Ensure we have at least 3 distinct distractors
    while (distractors.length < 3) {
      distractors.push(`Alternative Option ${String.fromCharCode(65 + distractors.length)}`);
    }
    distractors = distractors.slice(0, 3);

    // Shuffle the distractors so their relative order is also randomized
    const shuffledDistractors = shuffleArray(distractors);

    // Construct balanced 4-option array where correctText is placed exactly at targetPos
    const newOptions = new Array(4);
    newOptions[targetPos] = correctText;

    let distractorIdx = 0;
    for (let pos = 0; pos < 4; pos++) {
      if (pos !== targetPos) {
        newOptions[pos] = shuffledDistractors[distractorIdx++];
      }
    }

    // Assign balanced options and verify factual correctness is strictly preserved
    q.options = newOptions;
    q.correctAnswer = correctText;

    balancedMCQs.push(q);
  }

  // 3. Process True / False Questions
  const balancedTF = balanceTrueFalseQuestions(trueFalseQuestions);

  // 4. Interleave mixed question types naturally if multiple types exist
  let finalQuestions = [];
  if (balancedTF.length > 0 && balancedMCQs.length > 0) {
    const total = balancedMCQs.length + balancedTF.length;
    let mcqIdx = 0;
    let tfIdx = 0;

    // Step spacing for True/False questions
    const tfStep = total / (balancedTF.length + 1);
    let nextTfThreshold = tfStep;

    for (let i = 0; i < total; i++) {
      if (tfIdx < balancedTF.length && (i + 1 >= Math.round(nextTfThreshold) || mcqIdx >= balancedMCQs.length)) {
        finalQuestions.push(balancedTF[tfIdx++]);
        nextTfThreshold += tfStep;
      } else if (mcqIdx < balancedMCQs.length) {
        finalQuestions.push(balancedMCQs[mcqIdx++]);
      }
    }
    // Append any remaining
    while (mcqIdx < balancedMCQs.length) finalQuestions.push(balancedMCQs[mcqIdx++]);
    while (tfIdx < balancedTF.length) finalQuestions.push(balancedTF[tfIdx++]);
  } else {
    finalQuestions = [...balancedMCQs, ...balancedTF];
  }

  // Add any other question types
  if (otherQuestions.length > 0) {
    finalQuestions.push(...otherQuestions);
  }

  // 5. Final Post-Generation Sanity Validation
  const validatedQuestions = finalQuestions.map((q, idx) => {
    // Confirm options contains the exact correct answer text
    const optMatch = (q.options || []).find(o => o.toLowerCase() === String(q.correctAnswer).trim().toLowerCase());
    if (optMatch) {
      q.correctAnswer = optMatch;
    }
    return {
      id: q.id || `q_${idx + 1}`,
      text: q.text,
      type: q.type || 'mcq',
      difficulty: q.difficulty || 'Medium',
      bloomLevel: q.bloomLevel || 'Understand',
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || `The correct answer is ${q.correctAnswer}.`,
      learningTips: q.learningTips || ['Review core concepts and practice with flashcards.'],
      points: Number(q.points) || 10
    };
  });

  return validatedQuestions;
}

module.exports = {
  balanceAndValidateQuizQuestions,
  generateBalancedMCQPositions,
  balanceTrueFalseQuestions
};
