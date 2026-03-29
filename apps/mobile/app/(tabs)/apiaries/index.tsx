import React from 'react';
import { View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../components/ui/heading';
import { Text } from '../../../components/ui/text';
import { Button, ButtonText } from '../../../components/ui/button';
import { useApiaries } from '../../../src/features/apiary/hooks/use-apiaries';
import {
  deriveApiaryHealth,
  HEALTH_BADGE_CONFIG,
  type HealthStatus,
} from '../../../src/features/apiary/utils/health-status';
import type { Apiary, HiveStatus } from '@broodly/graphql-types';
import { ICON_COLORS } from '../../../src/theme/colors';

function StatusBadge({ status }: { status: HealthStatus }) {
  const config = HEALTH_BADGE_CONFIG[status];
  const bgClass =
    config.action === 'success'
      ? 'bg-success-100'
      : config.action === 'error'
        ? 'bg-error-100'
        : config.variant === 'outline'
          ? 'bg-background-0 border border-warning-500'
          : 'bg-warning-100';
  const textClass =
    config.action === 'success'
      ? 'text-success-700'
      : config.action === 'error'
        ? 'text-error-700'
        : 'text-warning-700';

  return (
    <View className={`px-2 py-1 rounded-md ${bgClass}`}>
      <Text size="xs" className={`font-medium ${textClass}`}>
        {config.label}
      </Text>
    </View>
  );
}

function ApiaryCard({ apiary, onPress }: { apiary: Apiary; onPress: () => void }) {
  const hiveStatuses = apiary.hives.map((h) => h.status as HiveStatus);
  const health = deriveApiaryHealth(hiveStatuses);
  const hiveCount = apiary.hives.length;

  return (
    <Pressable
      className="bg-background-0 rounded-xl border border-outline-200 p-4 mb-3 shadow-sm min-h-[48px]"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${apiary.name}, ${health} status, ${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
      testID={`apiary-card-${apiary.id}`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          <Heading size="lg">{apiary.name}</Heading>
          <Text size="sm" className="text-typography-500">{apiary.region}</Text>
        </View>
        <StatusBadge status={health} />
      </View>
      <View className="flex-row items-center gap-1">
        <Ionicons name="cube-outline" size={14} color={ICON_COLORS.muted} />
        <Text size="sm" className="text-typography-500">
          {hiveCount} {hiveCount === 1 ? 'hive' : 'hives'}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="flex-1 justify-center items-center p-8">
      <Ionicons name="leaf-outline" size={48} color={ICON_COLORS.muted} />
      <Heading size="xl" className="mt-4 mb-2 text-center">
        No apiaries yet
      </Heading>
      <Text size="md" className="text-typography-500 text-center mb-6">
        Add your first apiary to start tracking your hives
      </Text>
      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={onAdd}
        accessibilityLabel="Add your first apiary"
        testID="add-apiary-btn"
      >
        <ButtonText>Add Apiary</ButtonText>
      </Button>
    </View>
  );
}

export default function ApiariesScreen() {
  const router = useRouter();
  const { data: apiaries, isLoading, refetch, isRefetching } = useApiaries();

  function handleAddApiary() {
    router.push('/(tabs)/apiaries/new');
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background-0 justify-center items-center">
        <Text size="md" className="text-typography-500">Loading apiaries...</Text>
      </View>
    );
  }

  if (!apiaries || apiaries.length === 0) {
    return (
      <View className="flex-1 bg-background-0">
        <EmptyState onAdd={handleAddApiary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-50">
      <FlatList
        data={apiaries}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-4 pb-8"
        renderItem={({ item }) => (
          <ApiaryCard
            apiary={item}
            onPress={() => router.push(`/(tabs)/apiaries/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View className="flex-row justify-between items-center mb-4">
            <Heading size="2xl">My Apiaries</Heading>
            <Button
              action="primary"
              variant="outline"
              onPress={handleAddApiary}
              accessibilityLabel="Add apiary"
              testID="add-apiary-btn"
            >
              <ButtonText>Add</ButtonText>
            </Button>
          </View>
        }
      />
    </View>
  );
}
