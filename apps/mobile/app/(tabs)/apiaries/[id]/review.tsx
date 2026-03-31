import React, { useCallback } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../../components/ui/heading';
import { Text } from '../../../../components/ui/text';
import { Button, ButtonText } from '../../../../components/ui/button';
import { useEveningReviewStore } from '../../../../src/store/evening-review-store';
import { TranscriptEditor } from '../../../../src/features/inspection/components/TranscriptEditor';
import { ICON_COLORS } from '../../../../src/theme/colors';
import type { ReviewableHive } from '../../../../src/store/evening-review-store';
import type { Observation } from '../../../../src/features/inspection/types';

function HiveReviewSection({
  hive,
  onUpdateObservation,
  onMarkReviewed,
}: {
  hive: ReviewableHive;
  onUpdateObservation: (
    hiveId: string,
    observationId: string,
    newValue: string,
  ) => void;
  onMarkReviewed: (hiveId: string) => void;
}) {
  const isReviewed = hive.reviewStatus === 'reviewed';

  const handleSave = useCallback(
    (observationId: string, newValue: string) => {
      onUpdateObservation(hive.hiveId, observationId, newValue);
    },
    [hive.hiveId, onUpdateObservation],
  );

  return (
    <View
      className="mb-6"
      accessibilityRole="none"
      accessibilityLabel={`${hive.hiveName} review section, ${hive.observations.length} observations, ${isReviewed ? 'reviewed' : 'pending review'}`}
      testID={`hive-review-${hive.hiveId}`}
    >
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <Heading size="lg" className="text-typography-800">
            {hive.hiveName}
          </Heading>
          {isReviewed && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={ICON_COLORS.success}
            />
          )}
        </View>
        <View
          className={`px-2 py-1 rounded-md ${
            isReviewed ? 'bg-success-100' : 'bg-warning-100'
          }`}
        >
          <Text
            size="xs"
            className={`font-medium ${isReviewed ? 'text-success-700' : 'text-warning-700'}`}
          >
            {isReviewed ? 'Reviewed' : 'Pending'}
          </Text>
        </View>
      </View>

      {hive.observations.length === 0 ? (
        <Text size="md" className="text-typography-400 italic mb-3">
          No observations recorded for this hive.
        </Text>
      ) : (
        hive.observations.map((obs: Observation) => (
          <TranscriptEditor
            key={obs.id}
            observationId={obs.id}
            observationLabel={obs.observationType.replace(/_/g, ' ')}
            originalTranscription={obs.voiceTranscription ?? obs.value}
            currentValue={obs.value}
            confidence={obs.voiceConfidence}
            isEdited={hive.editedObservationIds.includes(obs.id)}
            onSave={handleSave}
          />
        ))
      )}

      {!isReviewed && hive.observations.length > 0 && (
        <Button
          action="positive"
          variant="solid"
          size="xl"
          onPress={() => onMarkReviewed(hive.hiveId)}
          accessibilityLabel={`Mark ${hive.hiveName} as reviewed`}
          testID={`mark-reviewed-${hive.hiveId}`}
        >
          <ButtonText>Mark as Reviewed</ButtonText>
        </Button>
      )}
    </View>
  );
}

export default function EveningReviewScreen() {
  const router = useRouter();
  const { id: apiaryId } = useLocalSearchParams<{ id: string }>();
  const review = useEveningReviewStore((s) => s.review);
  const updateObservation = useEveningReviewStore((s) => s.updateObservation);
  const markHiveReviewed = useEveningReviewStore((s) => s.markHiveReviewed);
  const completeReview = useEveningReviewStore((s) => s.completeReview);
  const getReviewProgress = useEveningReviewStore((s) => s.getReviewProgress);

  const handleUpdateObservation = useCallback(
    (hiveId: string, observationId: string, newValue: string) => {
      updateObservation(hiveId, observationId, { value: newValue });
    },
    [updateObservation],
  );

  const handleCompleteReview = useCallback(() => {
    completeReview();
    router.back();
  }, [completeReview, router]);

  if (!review || review.apiaryId !== apiaryId) {
    return (
      <View className="flex-1 bg-background-50 justify-center items-center px-4">
        <Ionicons name="clipboard-outline" size={48} color={ICON_COLORS.muted} />
        <Heading size="xl" className="text-typography-800 mt-4 text-center">
          No Session to Review
        </Heading>
        <Text size="md" className="text-typography-500 mt-2 text-center">
          Complete an inspection session first, then come back here to review
          your observations at home.
        </Text>
        <Button
          action="primary"
          variant="outline"
          size="xl"
          className="mt-6"
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          testID="review-go-back"
        >
          <ButtonText>Go Back</ButtonText>
        </Button>
      </View>
    );
  }

  const progress = getReviewProgress();
  const isComplete = review.completedAt !== null;

  return (
    <View className="flex-1 bg-background-50">
      <FlatList
        data={review.hives}
        keyExtractor={(item) => item.hiveId}
        contentContainerClassName="px-4 pt-4 pb-8"
        ListHeaderComponent={
          <View className="mb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center gap-1 mb-3 min-h-[48px]"
              accessibilityRole="button"
              accessibilityLabel="Go back"
              testID="review-back-btn"
            >
              <Ionicons name="arrow-back" size={20} color={ICON_COLORS.primary} />
              <Text size="sm" className="text-primary-500">
                Back to Apiary
              </Text>
            </Pressable>

            <Heading size="2xl" className="text-typography-800 mb-1">
              Evening Review
            </Heading>
            <Text size="md" className="text-typography-500 mb-3">
              {review.apiaryName} — {review.hives.length}{' '}
              {review.hives.length === 1 ? 'hive' : 'hives'} inspected
            </Text>

            {/* Progress bar */}
            <View className="bg-outline-200 rounded-full h-2 mb-2">
              <View
                className="bg-primary-500 rounded-full h-2"
                style={{ width: `${progress.percentage}%` }}
              />
            </View>
            <Text size="sm" className="text-typography-400 mb-4">
              {progress.reviewed} of {progress.total} hives reviewed
            </Text>

            {isComplete && (
              <View className="bg-background-success border border-success-300 rounded-xl p-4 mb-4 flex-row items-center gap-3">
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={ICON_COLORS.success}
                />
                <Text size="md" className="text-success-700 flex-1">
                  Review complete. All observations have been verified.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <HiveReviewSection
            hive={item}
            onUpdateObservation={handleUpdateObservation}
            onMarkReviewed={markHiveReviewed}
          />
        )}
        ListFooterComponent={
          !isComplete && progress.reviewed === progress.total && progress.total > 0 ? (
            <Button
              action="primary"
              variant="solid"
              size="xl"
              onPress={handleCompleteReview}
              accessibilityLabel="Complete evening review"
              testID="complete-review-btn"
            >
              <ButtonText>Complete Review</ButtonText>
            </Button>
          ) : null
        }
      />
    </View>
  );
}
