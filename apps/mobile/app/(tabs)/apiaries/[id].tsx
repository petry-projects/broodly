import React from 'react';
import { View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../components/ui/heading';
import { Text } from '../../../components/ui/text';
import { Button, ButtonText } from '../../../components/ui/button';
import { useApiary } from '../../../src/features/apiary/hooks/use-apiaries';
import {
  deriveHiveHealth,
  deriveApiaryHealth,
  HEALTH_BADGE_CONFIG,
  type HealthStatus,
} from '../../../src/features/apiary/utils/health-status';
import type { Hive, HiveStatus } from '@broodly/graphql-types';

const HIVE_TYPE_ICONS: Record<string, string> = {
  LANGSTROTH: 'cube-outline',
  TOP_BAR: 'reorder-three-outline',
  WARRE: 'layers-outline',
  OTHER: 'ellipse-outline',
};

function StatusBadge({ status }: { status: HealthStatus }) {
  const config = HEALTH_BADGE_CONFIG[status];
  const bgClass =
    config.action === 'success' ? 'bg-success-100'
    : config.action === 'error' ? 'bg-error-100'
    : config.variant === 'outline' ? 'bg-background-0 border border-warning-500'
    : 'bg-warning-100';
  const textClass =
    config.action === 'success' ? 'text-success-700'
    : config.action === 'error' ? 'text-error-700'
    : 'text-warning-700';

  return (
    <View className={`px-2 py-1 rounded-md ${bgClass}`}>
      <Text size="xs" className={`font-medium ${textClass}`}>{config.label}</Text>
    </View>
  );
}

function HiveCard({ hive, onPress }: { hive: Hive; onPress: () => void }) {
  const health = deriveHiveHealth(hive.status as HiveStatus);
  const typeIcon = HIVE_TYPE_ICONS[hive.type] ?? 'ellipse-outline';

  return (
    <Pressable
      className="bg-background-0 rounded-xl border border-outline-200 p-4 mb-3 shadow-sm min-h-[48px]"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${hive.name}, ${health} status, ${hive.type.toLowerCase()} hive`}
      testID={`hive-card-${hive.id}`}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2 flex-1 mr-3">
          <Ionicons name={typeIcon as 'cube-outline'} size={18} color="rgb(107, 114, 128)" />
          <View>
            <Heading size="md">{hive.name}</Heading>
            <Text size="xs" className="text-typography-400">{hive.type.replace('_', ' ')}</Text>
          </View>
        </View>
        <StatusBadge status={health} />
      </View>
    </Pressable>
  );
}

export default function ApiaryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: apiary, isLoading, refetch, isRefetching } = useApiary(id!);

  if (isLoading || !apiary) {
    return (
      <View className="flex-1 bg-background-0 justify-center items-center">
        <Text size="md" className="text-typography-500">Loading...</Text>
      </View>
    );
  }

  const hiveStatuses = apiary.hives.map((h) => h.status as HiveStatus);
  const overallHealth = deriveApiaryHealth(hiveStatuses);

  return (
    <View className="flex-1 bg-background-50">
      <FlatList
        data={apiary.hives}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <Text size="sm" className="text-typography-400 mb-2">
              My Apiaries {'>'} {apiary.name}
            </Text>

            <View className="bg-background-0 rounded-xl border border-outline-200 p-4 mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Heading size="2xl">{apiary.name}</Heading>
                  <Text size="sm" className="text-typography-500">{apiary.region}</Text>
                </View>
                <StatusBadge status={overallHealth} />
              </View>
              <View className="flex-row items-center gap-4 mt-2">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="cube-outline" size={14} color="rgb(107, 114, 128)" />
                  <Text size="sm" className="text-typography-500">
                    {apiary.hives.length} {apiary.hives.length === 1 ? 'hive' : 'hives'}
                  </Text>
                </View>
                <Button
                  action="primary"
                  variant="outline"
                  onPress={() => router.push(`/(tabs)/apiaries/${id}/edit`)}
                  accessibilityLabel="Edit apiary"
                  testID="edit-apiary-btn"
                >
                  <ButtonText>Edit</ButtonText>
                </Button>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Heading size="lg">Hives</Heading>
              <Button
                action="primary"
                variant="outline"
                onPress={() => router.push(`/(tabs)/apiaries/${id}/hives/new`)}
                accessibilityLabel="Add hive"
                testID="add-hive-btn"
              >
                <ButtonText>Add Hive</ButtonText>
              </Button>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <HiveCard
            hive={item}
            onPress={() => router.push(`/(tabs)/apiaries/${id}/hives/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text size="md" className="text-typography-400 mb-4">No hives yet</Text>
            <Button
              action="primary"
              variant="solid"
              size="xl"
              onPress={() => router.push(`/(tabs)/apiaries/${id}/hives/new`)}
              accessibilityLabel="Add your first hive"
              testID="add-first-hive-btn"
            >
              <ButtonText>Add First Hive</ButtonText>
            </Button>
          </View>
        }
      />
    </View>
  );
}
