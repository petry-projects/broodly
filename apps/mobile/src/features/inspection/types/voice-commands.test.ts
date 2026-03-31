import { parseVoiceCommand } from './voice-commands';
import type { VoiceCommandType } from './voice-commands';

describe('parseVoiceCommand', () => {
  const HIGH_CONFIDENCE = 0.95;

  describe('next_hive commands', () => {
    it.each([
      'next hive',
      'Next Hive',
      'move on',
      'move forward',
      'advance',
    ])('parses "%s" as next_hive', (input) => {
      const result = parseVoiceCommand(input, HIGH_CONFIDENCE);
      expect(result.type).toBe('next_hive');
      expect(result.confidence).toBe(HIGH_CONFIDENCE);
    });
  });

  describe('previous_hive commands', () => {
    it.each([
      'previous hive',
      'prior hive',
      'last hive',
      'go back',
      'move back',
    ])('parses "%s" as previous_hive', (input) => {
      const result = parseVoiceCommand(input, HIGH_CONFIDENCE);
      expect(result.type).toBe('previous_hive');
    });
  });

  describe('go_to_hive commands', () => {
    it('parses "go to hive 3" with target', () => {
      const result = parseVoiceCommand('go to hive 3', HIGH_CONFIDENCE);
      expect(result.type).toBe('go_to_hive');
      expect(result.targetHive).toBe('3');
    });

    it('parses "move to hive Alpha" with target', () => {
      const result = parseVoiceCommand('move to hive Alpha', HIGH_CONFIDENCE);
      expect(result.type).toBe('go_to_hive');
      expect(result.targetHive).toBe('Alpha');
    });

    it('parses "switch to hive 7"', () => {
      const result = parseVoiceCommand('switch to hive 7', HIGH_CONFIDENCE);
      expect(result.type).toBe('go_to_hive');
      expect(result.targetHive).toBe('7');
    });

    it('parses "hive 4" as go_to_hive', () => {
      const result = parseVoiceCommand('hive 4', HIGH_CONFIDENCE);
      expect(result.type).toBe('go_to_hive');
      expect(result.targetHive).toBe('4');
    });
  });

  describe('which_hive commands', () => {
    it.each([
      'which hive',
      'what hive',
      'where am i',
      'current hive',
    ])('parses "%s" as which_hive', (input) => {
      const result = parseVoiceCommand(input, HIGH_CONFIDENCE);
      expect(result.type).toBe('which_hive');
    });
  });

  describe('done_with_hive commands', () => {
    it.each([
      'done with this hive',
      'done with hive',
      'done hive',
      'finished this hive',
      'completed this hive',
    ])('parses "%s" as done_with_hive', (input) => {
      const result = parseVoiceCommand(input, HIGH_CONFIDENCE);
      expect(result.type).toBe('done_with_hive');
    });
  });

  describe('end_session commands', () => {
    it.each([
      'end the inspection',
      'end session',
      'stop the inspection',
      'finish session',
      'all done',
      'wrap it up',
      'wrap up',
    ])('parses "%s" as end_session', (input) => {
      const result = parseVoiceCommand(input, HIGH_CONFIDENCE);
      expect(result.type).toBe('end_session');
    });
  });

  describe('unknown commands', () => {
    it('returns unknown for unrecognized input', () => {
      const result = parseVoiceCommand(
        'the bees look healthy today',
        HIGH_CONFIDENCE,
      );
      expect(result.type).toBe('unknown');
      expect(result.rawTranscription).toBe('the bees look healthy today');
    });

    it('returns unknown for empty input', () => {
      const result = parseVoiceCommand('', 0);
      expect(result.type).toBe('unknown');
    });
  });

  it('preserves raw transcription and confidence', () => {
    const result = parseVoiceCommand('  next hive  ', 0.82);
    expect(result.rawTranscription).toBe('next hive');
    expect(result.confidence).toBe(0.82);
  });
});
