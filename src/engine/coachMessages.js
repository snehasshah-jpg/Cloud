/**
 * Template-based coach message generator.
 * Returns personalized messages based on student profile state.
 */

export function generateCoachMessages(profile, tracker, matchedScholarships, matchedColleges) {
  const messages = [];

  // 1. Welcome / first-gen message
  if (profile.firstGen) {
    messages.push({
      id: 'firstgen',
      type: 'opportunity',
      title: 'Being First-Gen Is a Strength',
      body: `I see you're a first-generation college student. That's a strength — not a weakness. Many scholarships specifically support first-gen students: QuestBridge, Dell Scholars, and Posse are designed for people exactly like you. We'll target those heavily.`,
      action: 'View First-Gen Scholarships',
      actionFilter: 'firstgen',
      priority: 1,
    });
  }

  // 2. URM message
  if (profile.urm) {
    const bigOnes = ['Gates Scholarship', 'Ron Brown Scholar', 'HSF', 'UNCF'];
    messages.push({
      id: 'urm',
      type: 'opportunity',
      title: 'Scholarships Built for You',
      body: `Your background opens doors to some of the most powerful scholarships in the country — including full-ride programs. The Gates Scholarship, Ron Brown Scholar Program, and HSF are worth serious time. These are transformative, not just helpful.`,
      action: 'See Your Best Matches',
      priority: 2,
    });
  }

  // 3. GPA-based academic message
  if (profile.gpa) {
    if (profile.gpa >= 3.8) {
      messages.push({
        id: 'gpa_high',
        type: 'strength',
        title: 'Your GPA Opens Serious Doors',
        body: `A ${profile.gpa} GPA puts you in the competitive range for merit scholarships and selective schools. You should be targeting at least 2–3 full-ride scholarship programs (QuestBridge, Cameron Impact, Jack Kent Cooke). Don't undersell yourself.`,
        priority: 3,
      });
    } else if (profile.gpa >= 3.3) {
      messages.push({
        id: 'gpa_mid',
        type: 'info',
        title: 'You\'re Competitive — Here\'s the Play',
        body: `Your GPA (${profile.gpa}) is solid for many scholarships, but you'll be on the edge for the most selective programs. Focus your energy on scholarships where you're a clear match (Green tier). A few Yellow-tier shots are fine too — don't skip them.`,
        priority: 4,
      });
    } else if (profile.gpa < 3.0) {
      messages.push({
        id: 'gpa_low',
        type: 'honest',
        title: 'Here\'s the Real Talk on Merit Aid',
        body: `Your GPA (${profile.gpa}) puts most merit scholarships out of reach — but not all of them. Focus on need-based scholarships, local/community awards, and no-essay draws (Niche, Sallie Mae). Your story matters more than your GPA in holistic reviews. And: even a 0.2 GPA bump opens more doors.`,
        priority: 3,
      });
    }
  }

  // 4. Deadline urgency message
  const urgentScholarships = matchedScholarships?.green?.filter(
    (s) => s.daysUntilDeadline <= 14
  ) || [];
  if (urgentScholarships.length > 0) {
    const names = urgentScholarships.slice(0, 2).map((s) => s.name).join(' and ');
    messages.push({
      id: 'urgent_deadlines',
      type: 'urgent',
      title: `⏰ ${urgentScholarships.length} Deadline${urgentScholarships.length > 1 ? 's' : ''} This Week`,
      body: `You have strong matches with deadlines coming up fast: ${names}. These are Green-tier — you're competitive. Don't let them slip. Set aside time today.`,
      action: 'View Urgent Deadlines',
      priority: 0,
    });
  }

  // 5. Scholarship volume message
  const greenCount = matchedScholarships?.green?.length || 0;
  const yellowCount = matchedScholarships?.yellow?.length || 0;
  if (greenCount > 0) {
    messages.push({
      id: 'scholarship_strategy',
      type: 'strategy',
      title: 'Your Scholarship Game Plan',
      body: `You have ${greenCount} Green-tier matches (apply first) and ${yellowCount} Yellow-tier options. Realistically, apply to all your Green scholarships plus 3–5 Yellow ones. More applications = better odds. Don't just aim for the biggest ones — a few $2-5K scholarships add up fast.`,
      priority: 5,
    });
  }

  // 6. HBCU message
  if (profile.interestedInHBCU) {
    messages.push({
      id: 'hbcu',
      type: 'opportunity',
      title: 'HBCU-Specific Scholarships',
      body: `You're interested in HBCUs — great choice. FOSSI ($40K), TMCF, UNCF, Apple HBCU Scholars, and McDonald's HBCU Scholars are all specifically for students like you. These are often less competitive than general scholarships and specifically designed to fund your HBCU experience.`,
      action: 'View HBCU Scholarships',
      priority: 2,
    });
  }

  // 7. School list quality message
  const savedCount = Object.keys(tracker?.colleges || {}).length;
  if (savedCount === 0) {
    messages.push({
      id: 'no_schools',
      type: 'action',
      title: 'Build Your College List First',
      body: 'You haven\'t saved any colleges yet. Your college list is the foundation of everything else — financial aid strategy, essay targets, visit planning. Start there. Aim for 10–15 schools: 2-3 reaches, 5-6 targets, 3-4 safeties.',
      action: 'View College Matches',
      priority: 1,
    });
  } else if (savedCount >= 8 && savedCount <= 15) {
    messages.push({
      id: 'good_list',
      type: 'strength',
      title: 'Solid School List',
      body: `${savedCount} schools saved. That's a good range. Make sure you have a mix of reaches, targets, and safeties — and that at least 2 safeties are schools you'd genuinely be happy attending. Don't put schools on your list just to have a backup.`,
      priority: 6,
    });
  }

  // 8. Financial reality check
  if (profile.loanAverse && profile.familyContribution < 20000) {
    messages.push({
      id: 'financial_reality',
      type: 'honest',
      title: 'Financial Aid Is Your Priority',
      body: `You've told me you want to avoid loans and your family can contribute ${profile.familyContribution ? `$${profile.familyContribution.toLocaleString()}` : 'a limited amount'}. That means we need to be strategic: target schools that meet full financial need (need-blind Ivies, QuestBridge schools) OR schools where you'll likely earn significant merit aid. Don't apply to schools where the net cost would require heavy loans unless it's your absolute top choice.`,
      priority: 2,
    });
  }

  // Sort by priority (0 = highest)
  return messages.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate a single contextual coach tip for dashboard display.
 */
export function getDashboardTip(profile, tracker, matchedScholarships) {
  const urgentCount = matchedScholarships?.green?.filter(
    (s) => s.daysUntilDeadline <= 7
  ).length || 0;

  if (urgentCount > 0) {
    return `You have ${urgentCount} Green-tier scholarship${urgentCount > 1 ? 's' : ''} due this week. Apply now.`;
  }

  const savedScholarships = Object.keys(tracker?.scholarships || {}).length;
  if (savedScholarships === 0) {
    return 'Save your first scholarship and start tracking your applications.';
  }

  if (!profile.gpa) {
    return 'Complete your academic profile to get personalized matches.';
  }

  const greenCount = matchedScholarships?.green?.length || 0;
  if (greenCount > 0) {
    return `You have ${greenCount} strong scholarship matches. Start with the earliest deadlines.`;
  }

  return 'Keep your profile updated — better data means better matches.';
}
