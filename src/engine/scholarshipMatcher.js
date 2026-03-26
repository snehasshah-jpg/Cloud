import { SCHOLARSHIPS } from '../data/scholarships';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Score a single scholarship against a student profile.
 * Returns match percentage and list of met/unmet criteria.
 */
function scoreScholarship(profile, scholarship) {
  const e = scholarship.eligibility;
  const criteria = [];

  // GPA
  if (e.minGPA !== null) {
    const met = profile.gpa !== null && profile.gpa >= e.minGPA;
    criteria.push({ name: `Min GPA ${e.minGPA}`, met, critical: true });
  }

  // SAT
  if (e.minSAT !== null) {
    const met = profile.sat !== null && profile.sat >= e.minSAT;
    criteria.push({ name: `Min SAT ${e.minSAT}`, met, critical: true });
  }

  // ACT
  if (e.minACT !== null) {
    const met = profile.act !== null && profile.act >= e.minACT;
    criteria.push({ name: `Min ACT ${e.minACT}`, met, critical: false });
  }

  // First-gen
  if (e.requiresFirstGen) {
    criteria.push({ name: 'First-generation student', met: !!profile.firstGen, critical: true });
  }

  // URM
  if (e.requiresURM) {
    criteria.push({ name: 'Underrepresented minority', met: !!profile.urm, critical: true });
  }

  // Gender
  if (e.gender !== 'any') {
    const met = profile.gender === e.gender || profile.gender === 'prefer_not';
    criteria.push({ name: `${e.gender === 'female' ? 'Women' : 'Men'} only`, met, critical: true });
  }

  // Income cap
  if (e.maxIncome !== null) {
    const met = profile.householdIncome !== null && profile.householdIncome <= e.maxIncome;
    criteria.push({ name: `Income ≤ $${e.maxIncome.toLocaleString()}`, met, critical: false });
  }

  // Major / field
  if (e.majors && !e.majors.includes('any')) {
    const studentMajor = profile.selectedField || (profile.recommendedFields[0]?.id);
    const met = studentMajor && e.majors.includes(studentMajor);
    criteria.push({ name: `Field: ${e.majors.join(' or ')}`, met: !!met, critical: false });
  }

  // STEM
  if (e.requiresSTEM) {
    const stemFields = ['computer_science', 'engineering', 'biology_science', 'environmental', 'medicine_health'];
    const studentField = profile.selectedField || (profile.recommendedFields[0]?.id);
    const met = profile.recommendedFields.some((f) => stemFields.includes(f.id)) ||
      stemFields.includes(studentField);
    criteria.push({ name: 'STEM field', met, critical: false });
  }

  // HBCU
  if (e.requiresHBCU) {
    criteria.push({ name: 'Planning to attend HBCU', met: !!profile.interestedInHBCU, critical: true });
  }

  // Citizenship
  if (e.citizenship && !e.citizenship.includes('any')) {
    const met = e.citizenship.includes(profile.citizenship);
    criteria.push({ name: 'Citizenship requirement', met, critical: true });
  }

  // State
  if (e.states && !e.states.includes('any')) {
    const met = profile.state && e.states.includes(profile.state);
    criteria.push({ name: `Resident of ${e.states.join(', ')}`, met: !!met, critical: true });
  }

  // Service hours
  if (e.minServiceHours !== null) {
    const met = profile.serviceHours >= e.minServiceHours;
    criteria.push({ name: `${e.minServiceHours}+ service hours`, met, critical: false });
  }

  // Leadership
  if (e.requiresLeadership) {
    const met = profile.hasLeadershipRole || (profile.serviceHours > 20);
    criteria.push({ name: 'Leadership role/experience', met, critical: false });
  }

  const totalCriteria = criteria.length;
  if (totalCriteria === 0) return { matchPct: 100, criteria: [], tier: 'green' };

  // Check if any critical criterion fails → auto-GRAY
  const criticalFail = criteria.some((c) => c.critical && !c.met);
  if (criticalFail) {
    const metCount = criteria.filter((c) => c.met).length;
    const pct = Math.round((metCount / totalCriteria) * 100);
    return { matchPct: Math.min(pct, 20), criteria, tier: 'gray' };
  }

  const metCount = criteria.filter((c) => c.met).length;
  const matchPct = Math.round((metCount / totalCriteria) * 100);

  let tier;
  if (matchPct >= 75) tier = 'green';
  else if (matchPct >= 50) tier = 'yellow';
  else if (matchPct >= 25) tier = 'blue';
  else tier = 'gray';

  return { matchPct, criteria, tier };
}

/**
 * Calculate days until deadline (negative = past deadline)
 */
function daysUntilDeadline(deadlineStr) {
  try {
    return differenceInDays(parseISO(deadlineStr), new Date());
  } catch {
    return 999;
  }
}

/**
 * Generate coach message for a scholarship match.
 */
function generateCoachMessage(scholarship, tier, matchPct, criteria) {
  const unmet = criteria.filter((c) => !c.met).map((c) => c.name);
  const met = criteria.filter((c) => c.met).map((c) => c.name);

  if (tier === 'green') {
    return `You hit all (or nearly all) the criteria for ${scholarship.name}. Apply immediately — you're competitive.`;
  } else if (tier === 'yellow') {
    const misses = unmet.length > 0 ? ` You're missing: ${unmet.slice(0, 2).join(', ')}.` : '';
    return `You're close — ${matchPct}% match.${misses} Worth applying if you have time.`;
  } else if (tier === 'blue') {
    return `You're a long shot here (${matchPct}% match), but if you're genuinely passionate about this scholarship, apply. Some scholarships surprise.`;
  } else {
    return `You don't meet the core requirements for ${scholarship.name}. Skip it and focus your energy on your green and yellow matches.`;
  }
}

/**
 * Match all scholarships against student profile and return ranked results.
 */
export function matchScholarships(profile) {
  const results = SCHOLARSHIPS.map((scholarship) => {
    const { matchPct, criteria, tier } = scoreScholarship(profile, scholarship);
    const days = daysUntilDeadline(scholarship.deadline);
    const coachMessage = generateCoachMessage(scholarship, tier, matchPct, criteria);

    return {
      ...scholarship,
      matchPct,
      criteria,
      tier,
      daysUntilDeadline: days,
      coachMessage,
      deadlineUrgency: days < 0 ? 'past' : days <= 7 ? 'urgent' : days <= 30 ? 'soon' : 'later',
    };
  });

  // Sort: tier order → deadline urgency → amount → effort
  const tierOrder = { green: 0, yellow: 1, blue: 2, gray: 3 };

  const sorted = results
    .filter((r) => r.daysUntilDeadline >= 0) // filter out past deadlines
    .sort((a, b) => {
      // 1. Tier
      if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
      // 2. Deadline (closer first, but not negative)
      const urgencyOrder = { urgent: 0, soon: 1, later: 2 };
      if (urgencyOrder[a.deadlineUrgency] !== urgencyOrder[b.deadlineUrgency]) {
        return urgencyOrder[a.deadlineUrgency] - urgencyOrder[b.deadlineUrgency];
      }
      // 3. Amount (higher first)
      if (b.amount !== a.amount) return b.amount - a.amount;
      // 4. Effort (easier first)
      return a.effort - b.effort;
    });

  return {
    green: sorted.filter((s) => s.tier === 'green'),
    yellow: sorted.filter((s) => s.tier === 'yellow'),
    blue: sorted.filter((s) => s.tier === 'blue'),
    gray: sorted.filter((s) => s.tier === 'gray'),
    all: sorted,
  };
}
