import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heading } from '../../../../../../components/ui/heading';
import { Text } from '../../../../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../../../../components/ui/button';
import { useHive, useDeleteHive } from '../../../../../../src/features/hive/hooks/use-hives';
import { deriveHiveHealth, HEALTH_BADGE_CONFIG } from '../../../../../../src/features/apiary/utils/health-status';
import type { HiveStatus } from '@broodly/graphql-types';

export default function HiveDetailScreen() {
  const router = useRouter();
  const { id: apiaryId, hiveId } = useLocalSearchParams<{ id: string; hiveId: string }>();
  const { data: hive, isLoading } = useHive(hiveId!);
  const deleteHive = useDeleteHive();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    Alert.alert(
      'Delete Hive',
      'This will permanently delete this hive and all its inspection records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHive.mutateAsync(hiveId!);
              router.back();
            } catch (err) {
              setDeleteError(err instanceof Error ? err.message : 'Failed to delete hive.');
            }
          },
        },
      ],
    );
  }

  if (isLoading || !hive) {
    return (
      <View className="flex-1 bg-background-0 justify-center items-center">
        <Text size="md" className="text-typography-500">Loading...</Text>
      </View>
    );
  }

  const health = deriveHiveHealth(hive.status as HiveStatus);
  const config = HEALTH_BADGE_CONFIG[health];

  return (
    <View className="flex-1 bg-background-0 px-6 pt-8">
      <Text size="sm" className="text-typography-400 mb-4">
        My Apiaries {'>'} Apiary {'>'} {hive.name}
      </Text>

      <Heading size="2xl" className="mb-1">{hive.name}</Heading>
      <Text size="md" className="text-typography-500 mb-4">
        {hive.type.replace('_', ' ')} — {config.label}
      </Text>

      {hive.notes && (
        <View className="bg-background-50 rounded-xl p-4 mb-6">
          <Text size="sm" className="text-typography-600">{hive.notes}</Text>
        </View>
      )}

      {deleteError && (
        <View className="bg-background-error rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-error-600">{deleteError}</Text>
        </View>
      )}

      <View className="gap-3">
        <Button
          action="primary"
          variant="outline"
          size="xl"
          onPress={() => router.push(`/(tabs)/apiaries/${apiaryId}/hives/${hiveId}/edit`)}
          accessibilityLabel="Edit hive"
          testID="edit-hive-btn"
        >
          <ButtonText>Edit Hive</ButtonText>
        </Button>

        <Button
          action="negative"
          variant="solid"
          size="xl"
          onPress={handleDelete}
          disabled={deleteHive.isPending}
          accessibilityLabel="Delete this hive"
          testID="delete-hive-btn"
        >
          {deleteHive.isPending ? <ButtonSpinner /> : <ButtonText>Delete Hive</ButtonText>}
        </Button>
      </View>
    </View>
  );
}
