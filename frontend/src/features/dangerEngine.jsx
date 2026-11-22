// Rule-based danger sign detection engine
// Uses predefined patterns based on public health guidelines

// Danger sign patterns mapped to their categories
const DANGER_SIGN_PATTERNS = {
  // Pregnancy-related danger signs
  bleedingDuringPregnancy: {
    patterns: [
      /bleeding/i,
      /blood.*pregnant/i,
      /vaginal.*bleeding/i,
      /hemorrhage/i,
    ],
    category: 'pregnancy',
    severity: 'urgent',
    message: 'Contact PHC immediately - bleeding during pregnancy requires medical evaluation',
  },
  highFeverPregnancy: {
    patterns: [
      /high fever/i,
      /fever.*pregnant/i,
      /temperature.*38/i,
      /severe fever/i,
    ],
    category: 'pregnancy',
    severity: 'urgent',
    message: 'High fever during pregnancy - consult PHC for evaluation',
  },
  // Newborn-related danger signs
  high feverNewborn: {
    patterns: [
      /high fever/i,
      /fever.*baby/i,
      /fever.*newborn/i,
      /temperature.*newborn/i,
      /38.*celsius/i,
      /fever.*infant/i,
    ],
    category: 'newborn',
    severity: 'urgent',
    message: 'High fever in newborn - URGENT: Contact PHC immediately, could indicate sepsis',
  },
  difficultyBreathingNewborn: {
    patterns: [
      /difficulty.*breathing/i,
      /breathing.*problem/i,
      /gasping/i,
      /wheezing/i,
      /shortness of breath/i,
    ],
    category: 'newborn',
    severity: 'urgent',
    message: 'Difficulty breathing in newborn - URGENT: Refer to PHC immediately',
  },
  newbornNotFeeding: {
    patterns: [
      /not feeding/i,
      /not sucking/i,
      /refusing feeds/i,
      /baby not taking/i,
    ],
    category: 'newborn',
    severity: 'moderate',
    message: 'Newborn not feeding properly - consult ASHA supervisor',
  },
  lethargyNewborn: {
    patterns: [
      /lethargic/i,
      /too sleepy/i,
      /not responsive/i,
      /unusually quiet/i,
    ],
    category: 'newborn',
    severity: 'urgent',
    message: 'Lethargic newborn - URGENT: Refer to PHC immediately',
  },
  bleedingNewborn: {
    patterns: [
      /bleeding.*newborn/i,
      /navel.*bleeding/i,
      /cord.*bleeding/i,
    ],
    category: 'newborn',
    severity: 'urgent',
    message: 'Bleeding from umbilical cord - URGENT: Contact PHC immediately',
  },
  // General danger signs
  severeAbdominalPain: {
    patterns: [
      /severe.*abdominal.*pain/i,
      /severe.*stomach.*pain/i,
      /abdominal.*cramping/i,
    ],
    category: 'general',
    severity: 'urgent',
    message: 'Severe abdominal pain - consult PHC for evaluation',
  },
  difficultyBreathing: {
    patterns: [
      /difficulty.*breathing/i,
      /cannot.*breathe/i,
      /shortness of breath/i,
    ],
    category: 'general',
    severity: 'urgent',
    message: 'Difficulty breathing - URGENT: Seek immediate medical attention',
  },
  heavyBleeding: {
    patterns: [
      /heavy.*bleeding/i,
      /significant.*bleeding/i,
      /hemorrhage/i,
    ],
    category: 'general',
    severity: 'urgent',
    message: 'Heavy bleeding - URGENT: Contact PHC or emergency services',
  },
};

// Detect danger signs in transcript
export const detectDangerSigns = (transcript: string) => {
  const detected: Array<{
    sign: string;
    category: string;
    severity: string;
    message: string;
    triggeredPatterns: string[];
  }> = [];

  // Check each danger sign pattern
  for (const [signName, config] of Object.entries(DANGER_SIGN_PATTERNS)) {
    const matches = config.patterns.some(pattern => pattern.test(transcript));
    if (matches) {
      detected.push({
        sign: signName.replace(/([A-Z])/g, ' $1').trim(),
        category: config.category,
        severity: config.severity,
        message: config.message,
        triggeredPatterns: config.patterns.filter(p => p.test(transcript)).map(p => p.source),
      });
    }
  }

  // Remove duplicates (same category, keep highest severity)
  const severityOrder = { urgent: 3, moderate: 2, mild: 1 };
  const uniqueByCategory = detected.filter((item, index, self) =>
    index === self.findIndex((t) => t.category === item.category)
  );

  // Sort by severity (urgent first)
  uniqueByCategory.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return uniqueByCategory;
};

// Get danger sign alert for UI display
export const getDangerSignAlert = (transcript: string) => {
  const results = detectDangerSigns(transcript);
  if (results.length === 0) return null;
  
  const mostUrgent = results[0];
  return {
    id: `alert-${Date.now()}`,
    sign: mostUrgent.sign,
    category: mostUrgent.category,
    severity: mostUrgent.severity,
    message: mostUrgent.message,
    triggeredBy: mostUrgent.triggeredPatterns[0],
  };
};

export default detectDangerSigns;