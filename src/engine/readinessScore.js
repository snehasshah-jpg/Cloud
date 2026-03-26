/**
 * Calculate overall application readiness score (0-100).
 * Five categories, each contributing up to 20 points.
 */
export function calculateReadinessScore(profile, tracker, matchedColleges) {
  const categories = {
    academic: scoreAcademic(profile, matchedColleges),
    essays: scoreEssays(tracker),
    schoolList: scoreSchoolList(matchedColleges, tracker),
    demonstratedInterest: scoreDemonstratedInterest(tracker),
    financialStrategy: scoreFinancialStrategy(profile, tracker),
  };

  const total = Object.values(categories).reduce((sum, s) => sum + s.score, 0);

  return {
    total,
    categories,
    level: total >= 80 ? 'green' : total >= 60 ? 'yellow' : 'red',
  };
}

function scoreAcademic(profile, matchedColleges) {
  if (!profile.gpa) return { score: 0, max: 20, label: 'Academic Readiness', detail: 'Complete your profile to see your academic readiness score.' };

  const targets = matchedColleges?.target || [];
  if (targets.length === 0) return { score: 10, max: 20, label: 'Academic Readiness', detail: 'Generate your college list to see how your academics compare.' };

  // Count how many target schools you're in the middle 50% for
  const competitiveCount = targets.filter((c) => profile.gpa >= c.gpa25).length;
  const ratio = competitiveCount / targets.length;

  const score = Math.round(ratio * 20);
  return {
    score,
    max: 20,
    label: 'Academic Readiness',
    detail: score >= 16
      ? `You're academically competitive at ${competitiveCount} of your ${targets.length} target schools.`
      : `You're below the 25th percentile GPA at some target schools. Consider adding a few more safety schools.`,
  };
}

function scoreEssays(tracker) {
  const colleges = Object.values(tracker.colleges || {});
  const withEssay = colleges.filter((c) => c.essayDone).length;
  const total = colleges.length;

  if (total === 0) return { score: 0, max: 25, label: 'Essays & Applications', detail: 'Save colleges to your list and start tracking your essays.' };

  const ratio = withEssay / total;
  const score = Math.round(ratio * 25);

  return {
    score,
    max: 25,
    label: 'Essays & Applications',
    detail: withEssay === total
      ? 'Your essays are done! Great work.'
      : `${withEssay} of ${total} college essays complete. Keep pushing.`,
  };
}

function scoreSchoolList(matchedColleges, tracker) {
  const saved = Object.keys(tracker.colleges || {}).length;
  const reaches = matchedColleges?.reach?.length || 0;
  const targets = matchedColleges?.target?.length || 0;
  const safeties = matchedColleges?.safety?.length || 0;

  let score = 0;
  if (saved >= 8) score += 10;
  else if (saved >= 5) score += 5;

  if (reaches >= 1) score += 3;
  if (targets >= 3) score += 4;
  if (safeties >= 2) score += 3;

  return {
    score: Math.min(score, 20),
    max: 20,
    label: 'School List Quality',
    detail: saved === 0
      ? 'Build your college list to improve this score.'
      : `${saved} schools saved. ${reaches > 0 ? '✓' : '✗'} Reaches. ${targets >= 3 ? '✓' : '✗'} Targets. ${safeties >= 2 ? '✓' : '✗'} Safeties.`,
  };
}

function scoreDemonstratedInterest(tracker) {
  const colleges = Object.values(tracker.colleges || {});
  const visited = colleges.filter((c) => c.visited).length;

  let score = 0;
  if (visited >= 3) score = 15;
  else if (visited >= 1) score = 8;

  return {
    score,
    max: 15,
    label: 'Demonstrated Interest',
    detail: visited === 0
      ? 'Log college visits or virtual tours to improve this score.'
      : `${visited} college visit${visited > 1 ? 's' : ''} logged. Great!`,
  };
}

function scoreFinancialStrategy(profile, tracker) {
  const scholarships = Object.values(tracker.scholarships || {});
  const submitted = scholarships.filter((s) => s.status === 'submitted' || s.status === 'awarded').length;

  let score = 0;
  if (submitted >= 5) score = 20;
  else if (submitted >= 3) score = 12;
  else if (submitted >= 1) score = 6;

  return {
    score,
    max: 20,
    label: 'Financial Strategy',
    detail: submitted === 0
      ? 'Apply to scholarships to improve your financial readiness score.'
      : `${submitted} scholarship application${submitted > 1 ? 's' : ''} submitted. Keep going — aim for 10+.`,
  };
}

/**
 * Generate coach narrative based on readiness level.
 */
export function generateReadinessNarrative(score, profile) {
  if (score.total >= 80) {
    return "You're in great shape. Your academics, essays, and school list are solid. Scholarship applications are on track. You've got this — keep pushing.";
  } else if (score.total >= 60) {
    const weakest = Object.entries(score.categories)
      .sort((a, b) => (a[1].score / a[1].max) - (b[1].score / b[1].max))[0];
    return `You're on track, but there are gaps. Your biggest area to improve: ${weakest[1].label}. ${weakest[1].detail}`;
  } else {
    return `Let's have a real conversation. Your readiness score (${score.total}/100) needs work. Focus on: building your school list, starting essays, and applying to scholarships. There's time — but let's move.`;
  }
}
