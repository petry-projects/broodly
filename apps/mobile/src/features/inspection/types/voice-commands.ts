/**
 * Voice command types for multi-hive inspection navigation.
 *
 * These patterns define how beekeepers navigate between hives
 * using voice during a continuous inspection session.
 */

export type VoiceCommandType =
  | 'next_hive'
  | 'previous_hive'
  | 'go_to_hive'
  | 'which_hive'
  | 'done_with_hive'
  | 'end_session'
  | 'unknown';

export interface VoiceCommandPattern {
  type: VoiceCommandType;
  /** Regex patterns that match this command in transcribed speech */
  patterns: RegExp[];
  /** Human-readable description for TTS confirmation */
  description: string;
}

export interface ParsedVoiceCommand {
  type: VoiceCommandType;
  /** For go_to_hive, the target hive identifier (name or number) */
  targetHive?: string;
  /** Raw transcription that was parsed */
  rawTranscription: string;
  /** Confidence score from speech recognition (0-1) */
  confidence: number;
}

/**
 * Defined command patterns for hive navigation.
 * Order matters: more specific patterns should come first.
 */
export const HIVE_NAVIGATION_PATTERNS: VoiceCommandPattern[] = [
  {
    type: 'go_to_hive',
    patterns: [
      /(?:go\s+to|move\s+to|switch\s+to|jump\s+to)\s+hive\s+(.+)/i,
      /hive\s+(\d+|[a-z]+)/i,
    ],
    description: 'Navigate to a specific hive',
  },
  {
    type: 'next_hive',
    patterns: [
      /next\s+hive/i,
      /move\s+(?:on|forward)/i,
      /advance/i,
    ],
    description: 'Move to the next hive in the sequence',
  },
  {
    type: 'previous_hive',
    patterns: [
      /(?:previous|prior|last)\s+hive/i,
      /go\s+back/i,
      /move\s+back/i,
    ],
    description: 'Go back to the previous hive',
  },
  {
    type: 'which_hive',
    patterns: [
      /which\s+hive/i,
      /(?:what|where)\s+(?:hive|am\s+i)/i,
      /current\s+hive/i,
    ],
    description: 'Announce the current hive',
  },
  {
    type: 'done_with_hive',
    patterns: [
      /done\s+(?:with\s+)?(?:this\s+)?hive/i,
      /finish(?:ed)?\s+(?:this\s+)?hive/i,
      /complete(?:d)?\s+(?:this\s+)?hive/i,
    ],
    description: 'Mark the current hive as done and move on',
  },
  {
    type: 'end_session',
    patterns: [
      /end\s+(?:the\s+)?(?:inspection|session)/i,
      /(?:stop|finish|done\s+with)\s+(?:the\s+)?(?:inspection|session)/i,
      /all\s+done/i,
      /wrap\s+(?:it\s+)?up/i,
    ],
    description: 'End the entire inspection session',
  },
];

/**
 * Parse a voice transcription into a structured command.
 * Returns 'unknown' type if no pattern matches.
 */
export function parseVoiceCommand(
  transcription: string,
  confidence: number,
): ParsedVoiceCommand {
  const trimmed = transcription.trim();

  for (const commandPattern of HIVE_NAVIGATION_PATTERNS) {
    for (const pattern of commandPattern.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const result: ParsedVoiceCommand = {
          type: commandPattern.type,
          rawTranscription: trimmed,
          confidence,
        };

        if (commandPattern.type === 'go_to_hive' && match[1]) {
          result.targetHive = match[1].trim();
        }

        return result;
      }
    }
  }

  return {
    type: 'unknown',
    rawTranscription: trimmed,
    confidence,
  };
}
