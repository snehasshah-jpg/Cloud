import { COLLEGES } from '../data/colleges';

/**
 * Determine reach/target/safety tier for a college based on student profile.
 */
function categorizeCollege(profile, college) {
  const gpa = profile.gpa;
  const sat = profile.sat;
  const act = profile.act;

  if (!gpa) return null; // Can't categorize without GPA

  // GPA-based tier
  let gpaScore = 0;
  if (gpa >= college.gpa75) gpaScore = 2;      // above 75th percentile = safety
  else if (gpa >= college.gpa25) gpaScore = 1;  // 25-75th = target
  else gpaScore = 0;                             // below 25th = reach

  // Test score adjustment (if student has scores)
  let testScore = null;
  if (sat && college.sat25 && college.sat75) {
    if (sat >= college.sat75) testScore = 2;
    else if (sat >= college.sat25) testScore = 1;
    else testScore = 0;
  } else if (act && college.act25 && college.act75) {
    if (act >= college.act75) testScore = 2;
    else if (act >= college.act25) testScore = 1;
    else testScore = 0;
  }

  // Combine scores (GPA weighted more heavily)
  let combinedScore;
  if (testScore !== null) {
    combinedScore = (gpaScore * 2 + testScore) / 3;
  } else {
    combinedScore = gpaScore;
  }

  // Classify
  if (combinedScore >= 1.5) return 'safety';
  if (combinedScore >= 0.7) return 'target';
  return 'reach';
}

/**
 * Calculate fit score (0-100) for a college based on student preferences.
 */
function calculateFitScore(profile, college) {
  let score = 0;
  let total = 0;

  // Location preference
  if (profile.locationPref && profile.locationPref.length > 0 && !profile.locationPref.includes('any')) {
    total += 20;
    if (profile.locationPref.includes(college.region)) score += 20;
  }

  // Setting preference (urban/suburban/rural)
  if (profile.settingPref && profile.settingPref !== 'any') {
    total += 15;
    if (college.setting === profile.settingPref) score += 15;
  }

  // Size preference
  if (profile.sizePref && profile.sizePref !== 'any') {
    total += 15;
    if (college.size === profile.sizePref) score += 15;
  }

  // Major/field match
  const studentField = profile.selectedField || (profile.recommendedFields?.[0]?.id);
  if (studentField && college.topMajors) {
    total += 25;
    if (college.topMajors.includes(studentField)) score += 25;
  }

  // Research importance
  if (profile.researchImportance >= 7) {
    total += 15;
    if (college.researchOpportunities >= 8) score += 15;
    else if (college.researchOpportunities >= 6) score += 8;
  }

  // Co-op importance
  if (profile.coopImportance >= 7) {
    total += 10;
    if (college.coopProgram) score += 10;
  }

  // HBCU interest
  if (profile.interestedInHBCU && college.isHBCU) {
    score += 20;
    total += 20;
  }

  if (total === 0) return 75; // No preferences set → neutral score
  return Math.round((score / total) * 100);
}

/**
 * Estimate merit aid for a student at a given college.
 */
function estimateMeritAid(profile, college) {
  if (!college.meritAidAvg) return null;
  if (!profile.gpa) return null;

  // Students above 75th percentile GPA get ~max merit
  if (profile.gpa >= college.gpa75) {
    return Math.round(college.meritAidAvg * 1.2);
  }
  // Students in middle get average
  if (profile.gpa >= college.gpa25) {
    return college.meritAidAvg;
  }
  // Below 25th = less merit likely
  return Math.round(college.meritAidAvg * 0.6);
}

/**
 * Match and generate college list for a student.
 * Returns { reach, target, safety } with 12-15 total schools.
 */
export function matchColleges(profile) {
  if (!profile.gpa) return { reach: [], target: [], safety: [], all: [] };

  const results = COLLEGES.map((college) => {
    const academicTier = categorizeCollege(profile, college);
    if (!academicTier) return null;

    const fitScore = calculateFitScore(profile, college);
    const estimatedAid = estimateMeritAid(profile, college);
    const estimatedNetCost = estimatedAid
      ? college.coa - estimatedAid
      : college.avgNetCost || college.coa;

    // Filter out financially unviable schools (if family is loan-averse)
    const familyMax = profile.familyContribution || 0;
    const affordable = !profile.loanAverse || estimatedNetCost <= familyMax + 30000;

    return {
      ...college,
      academicTier,
      fitScore,
      estimatedAid,
      estimatedNetCost,
      affordable,
      overallScore: fitScore + (academicTier === 'target' ? 20 : academicTier === 'safety' ? 10 : 5),
    };
  }).filter(Boolean);

  // Sort by overall score within each tier
  const sorted = results.sort((a, b) => b.overallScore - a.overallScore);

  // Select best colleges per tier (limit total to ~15)
  const reaches = sorted.filter((c) => c.academicTier === 'reach').slice(0, 3);
  const targets = sorted.filter((c) => c.academicTier === 'target').slice(0, 6);
  const safeties = sorted.filter((c) => c.academicTier === 'safety').slice(0, 4);

  return {
    reach: reaches,
    target: targets,
    safety: safeties,
    all: [...reaches, ...targets, ...safeties],
  };
}
