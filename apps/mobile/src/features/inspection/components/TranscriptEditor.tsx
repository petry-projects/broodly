import React, { useState, useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Text } from '../../../../components/ui/text';
import { Heading } from '../../../../components/ui/heading';
import { Button, ButtonText } from '../../../../components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { ICON_COLORS } from '../../../theme/colors';
import { LOW_CONFIDENCE_THRESHOLD } from '../../../store/evening-review-store';

export interface TranscriptEditorProps {
  /** Unique observation ID */
  observationId: string;
  /** The observation type label */
  observationLabel: string;
  /** Original voice transcription */
  originalTranscription: string;
  /** Current value (may already be edited) */
  currentValue: string;
  /** Confidence score from speech recognition (0-1) */
  confidence?: number;
  /** Whether this observation has been edited before */
  isEdited: boolean;
  /** Called when the user saves changes */
  onSave: (observationId: string, newValue: string) => void;
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'High confidence';
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) return 'Medium confidence';
  return 'Low confidence';
}

function getConfidenceColorClass(confidence: number): string {
  if (confidence >= 0.9) return 'text-success-600';
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) return 'text-warning-600';
  return 'text-error-600';
}

function getConfidenceBgClass(confidence: number): string {
  if (confidence >= 0.9) return 'bg-background-success';
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) return 'bg-background-warning';
  return 'bg-background-error';
}

export function TranscriptEditor({
  observationId,
  observationLabel,
  originalTranscription,
  currentValue,
  confidence,
  isEdited,
  onSave,
}: TranscriptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(currentValue);
  const isLowConfidence =
    confidence !== undefined && confidence < LOW_CONFIDENCE_THRESHOLD;

  const handleStartEdit = useCallback(() => {
    setEditedValue(currentValue);
    setIsEditing(true);
  }, [currentValue]);

  const handleSave = useCallback(() => {
    onSave(observationId, editedValue);
    setIsEditing(false);
  }, [observationId, editedValue, onSave]);

  const handleCancel = useCallback(() => {
    setEditedValue(currentValue);
    setIsEditing(false);
  }, [currentValue]);

  return (
    <View
      className={`rounded-xl border p-4 mb-3 ${
        isLowConfidence
          ? 'border-warning-400 bg-background-warning'
          : 'border-outline-200 bg-background-0'
      }`}
      accessibilityRole="none"
      accessibilityLabel={`${observationLabel} transcription${isLowConfidence ? ', low confidence, review recommended' : ''}`}
      testID={`transcript-editor-${observationId}`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2">
        <Heading size="sm" className="text-typography-800 flex-1">
          {observationLabel}
        </Heading>
        {isEdited && (
          <View className="bg-info-100 px-2 py-0.5 rounded ml-2">
            <Text size="xs" className="text-info-700">
              Edited
            </Text>
          </View>
        )}
      </View>

      {/* Confidence indicator */}
      {confidence !== undefined && (
        <View
          className={`flex-row items-center gap-1 mb-2 px-2 py-1 rounded-md self-start ${getConfidenceBgClass(confidence)}`}
        >
          <Ionicons
            name={
              confidence >= 0.9
                ? 'checkmark-circle'
                : confidence >= LOW_CONFIDENCE_THRESHOLD
                  ? 'alert-circle'
                  : 'warning'
            }
            size={14}
            color={
              confidence >= 0.9
                ? ICON_COLORS.success
                : confidence >= LOW_CONFIDENCE_THRESHOLD
                  ? ICON_COLORS.warning
                  : ICON_COLORS.error
            }
          />
          <Text
            size="xs"
            className={getConfidenceColorClass(confidence)}
          >
            {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
          </Text>
        </View>
      )}

      {/* Original transcription (shown when editing or when different from current) */}
      {isEditing && originalTranscription !== currentValue && (
        <View className="mb-2">
          <Text size="xs" className="text-typography-400 mb-1">
            Original:
          </Text>
          <Text size="sm" className="text-typography-500 italic">
            {originalTranscription}
          </Text>
        </View>
      )}

      {/* Value display or edit field */}
      {isEditing ? (
        <View>
          <TextInput
            className="border border-outline-300 rounded-lg p-3 text-typography-800 min-h-[48px] bg-background-0"
            value={editedValue}
            onChangeText={setEditedValue}
            multiline
            autoFocus
            accessibilityLabel={`Edit transcription for ${observationLabel}`}
            testID={`transcript-input-${observationId}`}
          />
          <View className="flex-row justify-end gap-2 mt-2">
            <Button
              action="secondary"
              variant="outline"
              onPress={handleCancel}
              accessibilityLabel="Cancel editing"
              testID={`transcript-cancel-${observationId}`}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="primary"
              variant="solid"
              onPress={handleSave}
              accessibilityLabel={`Save changes to ${observationLabel}`}
              testID={`transcript-save-${observationId}`}
            >
              <ButtonText>Save</ButtonText>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-row items-start">
          <Text size="md" className="text-typography-800 flex-1">
            {currentValue}
          </Text>
          <Pressable
            onPress={handleStartEdit}
            className="ml-2 min-w-[48px] min-h-[48px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Edit ${observationLabel} transcription`}
            testID={`transcript-edit-btn-${observationId}`}
          >
            <Ionicons name="pencil" size={20} color={ICON_COLORS.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
