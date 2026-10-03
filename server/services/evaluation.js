/**
 * Pure evaluation and grading service for Cyber Defender challenges.
 * Used identically across full quiz submissions, session completions, and practice runs.
 */

export function getCyberLevel(score) {
  if (score >= 850) return 'Cyber Champion';
  if (score >= 700) return 'Cyber Defender';
  if (score >= 400) return 'Security Aware';
  return 'Needs Practice';
}

export function generateRecommendations(categoryBreakdown) {
  const recommendations = [];

  const phishingPct = categoryBreakdown['Phishing Detection']?.percentage ?? 100;
  const socialEngPct = categoryBreakdown['Social Engineering']?.percentage ?? 100;
  const passwordPct = categoryBreakdown['Password Safety']?.percentage ?? 100;
  const incidentPct = categoryBreakdown['Incident Response']?.percentage ?? 100;
  const remotePct = categoryBreakdown['Remote Work Safety']?.percentage ?? 100;

  if (phishingPct >= 80) {
    recommendations.push('You demonstrated strong alertness spotting deceptive sender domains and phishing cues.');
  } else {
    recommendations.push('Double-check sender email addresses and inspect links before clicking on urgent account alerts.');
  }

  if (socialEngPct < 80) {
    recommendations.push('Remember: unexpected urgency is a primary social engineering tactic. Always pause and verify out-of-band.');
  } else {
    recommendations.push('Great intuition recognizing impersonation attempts and manufactured urgency.');
  }

  if (incidentPct < 80) {
    recommendations.push('Accidents happen to anyone. Quick reporting reduces impact significantly—never hesitate to report.');
  } else {
    recommendations.push('Prompt reporting is the cornerstone of effective security. Keep up the proactive defense posture!');
  }

  if (passwordPct < 80) {
    recommendations.push('Focus on longer passphrases rather than short complex passwords for higher resilience.');
  }

  if (remotePct < 80) {
    recommendations.push('Always activate your company VPN when working remotely from public coffee shops or airports.');
  }

  return recommendations.slice(0, 3);
}

/**
 * Grades an array of user answer submissions against official questions.
 * Preserves 100% exact scoring and bonus rules.
 */
export function gradeAnswers(questions, answers = []) {
  const questionsMap = new Map(questions.map(q => [q.id, q]));

  let totalScore = 0;
  let totalMaxScore = 0;

  const categoryTotals = {
    'Phishing Detection': { score: 0, maxScore: 0 },
    'Social Engineering': { score: 0, maxScore: 0 },
    'Password Safety': { score: 0, maxScore: 0 },
    'Incident Response': { score: 0, maxScore: 0 },
    'Remote Work Safety': { score: 0, maxScore: 0 }
  };

  const evaluatedAnswers = answers.map(ans => {
    const q = questionsMap.get(ans.questionId);
    let isCorrect = false;
    let scoreAwarded = 0;
    let bonusAwarded = 0;

    const maxQuestionScore = (q?.points || 100) + (q?.bonusPoints || 0);

    if (q) {
      if (q.questionType === 'hotspot') {
        const selected = Array.isArray(ans.userResponse) ? ans.userResponse : [];
        const required = q.details?.hotspots || [];
        const correctCount = selected.filter(id => 
          required.some(h => h.id === id && h.isVulnerability)
        ).length;

        if (correctCount >= 3) {
          isCorrect = true;
          scoreAwarded = q.points;
          if (correctCount === required.length && q.bonusPoints > 0) {
            bonusAwarded = q.bonusPoints;
          }
        } else if (correctCount > 0) {
          scoreAwarded = Math.round((correctCount / required.length) * q.points);
        }
      } else if (q.questionType === 'classification') {
        const classifications = ans.userResponse || {};
        const messages = q.details?.messages || [];
        let matches = 0;
        messages.forEach(m => {
          if (classifications[m.id] === m.correctClassification) matches++;
        });
        if (matches === messages.length) {
          isCorrect = true;
          scoreAwarded = q.points;
          bonusAwarded = q.bonusPoints || 0;
        } else {
          scoreAwarded = Math.round((matches / (messages.length || 1)) * q.points);
          if (matches >= 3) isCorrect = true;
        }
      } else if (q.questionType === 'drag_drop') {
        const buckets = ans.userResponse || { stronger: [], weaker: [] };
        const passwords = q.details?.passwords || [];
        let matches = 0;
        passwords.forEach(p => {
          if (p.correctCategory === 'stronger' && buckets.stronger?.includes(p.id)) matches++;
          if (p.correctCategory === 'weaker' && buckets.weaker?.includes(p.id)) matches++;
        });
        if (matches === passwords.length) {
          isCorrect = true;
          scoreAwarded = q.points;
          bonusAwarded = q.bonusPoints || 0;
        } else {
          scoreAwarded = Math.round((matches / (passwords.length || 1)) * q.points);
          if (matches >= 4) isCorrect = true;
        }
      } else if (typeof ans.userResponse === 'object' && ans.userResponse !== null && 'isCorrect' in ans.userResponse) {
        isCorrect = Boolean(ans.userResponse.isCorrect);
        scoreAwarded = typeof ans.userResponse.scoreAwarded === 'number' ? ans.userResponse.scoreAwarded : (isCorrect ? (q?.points || 100) : 0);
        bonusAwarded = typeof ans.userResponse.bonusAwarded === 'number' ? ans.userResponse.bonusAwarded : 0;
      } else {
        const selectedOptionId = ans.userResponse;
        const correctOpt = q.options?.find(o => o.isCorrect);
        if (correctOpt && selectedOptionId === correctOpt.id) {
          isCorrect = true;
          scoreAwarded = q.points;
        }
      }
    }

    const totalEarned = scoreAwarded + bonusAwarded;
    totalScore += totalEarned;
    totalMaxScore += maxQuestionScore;

    const categoryKey = ans.category || q?.category;
    if (categoryKey && categoryTotals[categoryKey]) {
      categoryTotals[categoryKey].score += totalEarned;
      categoryTotals[categoryKey].maxScore += maxQuestionScore;
    }

    return {
      questionId: ans.questionId,
      questionTitle: ans.questionTitle || q?.title || 'Challenge',
      category: categoryKey || 'Phishing Detection',
      isCorrect,
      scoreAwarded,
      bonusAwarded,
      userResponse: ans.userResponse,
      timeSpentSeconds: ans.timeSpentSeconds || 0
    };
  });

  const categoryBreakdown = {};
  Object.entries(categoryTotals).forEach(([cat, data]) => {
    const percentage = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 100;
    categoryBreakdown[cat] = {
      score: data.score,
      maxScore: data.maxScore > 0 ? data.maxScore : 100,
      percentage
    };
  });

  const finalPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const finalLevel = getCyberLevel(totalScore);
  const recommendations = generateRecommendations(categoryBreakdown);

  return {
    totalScore,
    totalMaxScore: totalMaxScore > 0 ? totalMaxScore : 1000,
    finalPercentage,
    finalLevel,
    evaluatedAnswers,
    categoryBreakdown,
    recommendations
  };
}
