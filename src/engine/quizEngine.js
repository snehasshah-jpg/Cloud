import { FIELDS, QUIZ_QUESTIONS } from '../data/majors';

/**
 * Calculate field recommendations from quiz answers.
 * @param {Object} answers - { [questionId]: selectedOptionIndex }
 * @returns Array of top field recommendations with confidence scores
 */
export function calculateFieldRecommendations(answers) {
  const fieldScores = {};

  // Initialize all field scores to 0
  FIELDS.forEach((field) => {
    fieldScores[field.id] = 0;
  });

  // Accumulate scores from each answer
  const allQuestions = [
    ...QUIZ_QUESTIONS.passion,
    ...QUIZ_QUESTIONS.strengths,
    ...QUIZ_QUESTIONS.interests,
    ...QUIZ_QUESTIONS.learning,
  ];

  allQuestions.forEach((question) => {
    const selectedIndex = answers[question.id];
    if (selectedIndex === undefined || selectedIndex === null) return;

    const selectedOption = question.options[selectedIndex];
    if (!selectedOption || !selectedOption.scores) return;

    Object.entries(selectedOption.scores).forEach(([fieldId, score]) => {
      if (fieldScores[fieldId] !== undefined) {
        fieldScores[fieldId] += score;
      }
    });
  });

  // Find maximum score for normalization
  const maxScore = Math.max(...Object.values(fieldScores), 1);

  // Convert to sorted array with confidence percentages
  const recommendations = FIELDS.map((field) => ({
    ...field,
    rawScore: fieldScores[field.id] || 0,
    confidence: Math.round((fieldScores[field.id] / maxScore) * 100),
  }))
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 6)
    .filter((f) => f.rawScore > 0);

  // Ensure top field is always 92%+ if there's a clear winner
  if (recommendations.length > 0 && recommendations[0].confidence < 85) {
    const topScore = recommendations[0].rawScore;
    return recommendations.map((f, i) => ({
      ...f,
      confidence: i === 0 ? Math.max(f.confidence, 85) : f.confidence,
    }));
  }

  return recommendations;
}

/**
 * Get total question count for progress tracking
 */
export function getTotalQuestionCount() {
  return (
    QUIZ_QUESTIONS.passion.length +
    QUIZ_QUESTIONS.strengths.length +
    QUIZ_QUESTIONS.interests.length +
    QUIZ_QUESTIONS.learning.length
  );
}

/**
 * Get completion percentage for a set of answers
 */
export function getQuizProgress(answers) {
  const total = getTotalQuestionCount();
  const answered = Object.keys(answers).length;
  return Math.round((answered / total) * 100);
}
