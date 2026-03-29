import React, { useState } from 'react';
import { View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../components/ui/heading';
import { Text } from '../../../components/ui/text';
import {
  useDashboardSummary,
  type DashboardApiary,
} from '../../../src/features/dashboard/hooks/use-dashboard';
import {
  HEALTH_BADGE_CONFIG,
  type HealthStatus,
} from '../../../src/features/apiary/utils/health-status';

const STATUS_ORDER: HealthStatus[] = ['healthy', 'attention', 'warning', 'critical'];

function SummaryBar({
  totalApiaries,
  totalHives,
  statusCounts,
  activeFilter,
  onFilterTap,
}: {
  totalApiaries: number;
  totalHives: number;
  statusCounts: Record<HealthStatus, number>;
  activeFilter: HealthStatus | null;
  onFilterTap: (status: HealthStatus) => void;
}) {
  return (
    <View
      className="bg-background-0 rounded-xl border border-outline-200 p-4 mb-4"
      accessibilityLabel={`Dashboard summary: ${totalApiaries} apiaries, ${totalHives} hives, ${statusCounts.critical} critical, ${statusCounts.warning} warning`}
    >
      <View className="flex-row gap-6 mb-3">
        <View>
          <Text size="xs" className="text-typography-400">Apiaries</Text>
          <Heading size="xl">{totalApiaries}</Heading>
        </View>
        <View>
          <Text size="xs" className="text-typography-400">Hives</Text>
          <Heading size="xl">{totalHives}</Heading>
        </View>
      </View>
      <View className="flex-row gap-2">
        {STATUS_ORDER.map((status) => {
          const config = HEALTH_BADGE_CONFIG[status];
          const count = statusCounts[status];
          const isActive = activeFilter === status;
          const bgClass =
            config.action === 'success' ? 'bg-success-100'
            : config.action === 'error' ? 'bg-error-100'
            : 'bg-warning-100';
          const textClass =
            config.action === 'success' ? 'text-success-700'
            : config.action === 'error' ? 'text-error-700'
            : 'text-warning-700';

          return (
            <Pressable
              key={status}
              className={`flex-row items-center gap-1 px-2 py-1 rounded-md min-h-[32px] ${bgClass} ${
                isActive ? 'border-2 border-primary-500' : ''
              }`}
              onPress={() => onFilterTap(status)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${config.label}: ${count} apiaries`}
              accessibilityState={{ selected: isActive }}
              testID={`filter-${status}`}
            >
              <Ionicons name={config.icon as 'checkmark-circle'} size={14} />
              <Text size="xs" className={`font-medium ${textClass}`}>
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ApiaryRow({ item, onPress }: { item: DashboardApiary; onPress: () => void }) {
  const config = HEALTH_BADGE_CONFIG[item.overallHealth];
  const bgClass =
    config.action === 'success' ? 'bg-success-100'
    : config.action === 'error' ? 'bg-error-100'
    : 'bg-warning-100';
  const textClass =
    config.action === 'success' ? 'text-success-700'
    : config.action === 'error' ? 'text-error-700'
    : 'text-warning-700';

  return (
    <Pressable
      className="bg-background-0 rounded-xl border border-outline-200 p-4 mb-3 min-h-[48px]"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.apiary.name}, ${config.label}, ${item.apiary.hives.length} hives`}
      testID={`dashboard-apiary-${item.apiary.id}`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Heading size="md">{item.apiary.name}</Heading>
          <Text size="sm" className="text-typography-500">{item.apiary.region}</Text>
        </View>
        <View className={`px-2 py-1 rounded-md ${bgClass}`}>
          <Text size="xs" className={`font-medium ${textClass}`}>{config.label}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3 mt-2">
        <Text size="sm" className="text-typography-500">
          {item.apiary.hives.length} {item.apiary.hives.length === 1 ? 'hive' : 'hives'}
        </Text>
        {item.hivesNeedingAttention > 0 && (
          <Text size="sm" className="text-warning-600">
            {item.hivesNeedingAttention} need attention
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { data: summary, isLoading, refetch, isRefetching } = useDashboardSummary();
  const [filter, setFilter] = useState<HealthStatus | null>(null);

  function handleFilterTap(status: HealthStatus) {
    setFilter((prev) => (prev === status ? null : status));
  }

  if (isLoading || !summary) {
    return (
      <View className="flex-1 bg-background-50 justify-center items-center">
        <Text size="md" className="text-typography-500">Loading dashboard...</Text>
      </View>
    );
  }

  const filteredApiaries = filter
    ? summary.apiaries.filter((a) => a.overallHealth === filter)
    : summary.apiaries;

  return (
    <View className="flex-1 bg-background-50">
      <FlatList
        data={filteredApiaries}
        keyExtractor={(item) => item.apiary.id}
        contentContainerClassName="px-4 pt-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View>
            <Heading size="2xl" className="mb-4">Operations</Heading>
            <SummaryBar
              totalApiaries={summary.totalApiaries}
              totalHives={summary.totalHives}
              statusCounts={summary.statusCounts}
              activeFilter={filter}
              onFilterTap={handleFilterTap}
            />
          </View>
        }
        renderItem={({ item }) => (
          <ApiaryRow
            item={item}
            onPress={() => router.push(`/(tabs)/apiaries/${item.apiary.id}`)}
          />
        )}
        ListEmptyComponent={
          filter ? (
            <View className="items-center py-8">
              <Text size="md" className="text-typography-400">
                No apiaries with {HEALTH_BADGE_CONFIG[filter].label.toLowerCase()} status
              </Text>
            </View>
          ) : (
            <View className="items-center py-8">
              <Text size="md" className="text-typography-400">No apiaries yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}
