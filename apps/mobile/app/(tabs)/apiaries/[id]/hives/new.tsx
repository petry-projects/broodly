import React, { useState } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../../../components/ui/heading';
import { Text } from '../../../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../../../components/ui/button';
import { useCreateHive } from '../../../../../src/features/hive/hooks/use-hives';
import { HiveType } from '@broodly/graphql-types';
import { ICON_COLORS } from '../../../../../src/theme/colors';

const HIVE_TYPES: Array<{ value: HiveType; label: string; icon: string; description: string }> = [
  { value: HiveType.Langstroth, label: 'Langstroth', icon: 'cube-outline', description: 'Most common, stackable boxes' },
  { value: HiveType.TopBar, label: 'Top Bar', icon: 'reorder-three-outline', description: 'Horizontal bar hive' },
  { value: HiveType.Warre, label: 'Warré', icon: 'layers-outline', description: 'Vertical, minimal intervention' },
  { value: HiveType.Other, label: 'Other', icon: 'ellipse-outline', description: 'Custom or alternative design' },
];

export default function CreateHiveScreen() {
  const router = useRouter();
  const { id: apiaryId } = useLocalSearchParams<{ id: string }>();
  const createHive = useCreateHive();
  const [name, setName] = useState('');
  const [type, setType] = useState<HiveType | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim() || !type) return;
    setError(null);
    try {
      await createHive.mutateAsync({
        apiaryId: apiaryId!,
        name: name.trim(),
        type,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hive.');
    }
  }

  return (
    <ScrollView className="flex-1 bg-background-0" contentContainerClassName="px-6 pt-8 pb-12">
      <Heading size="2xl" className="mb-6">Add Hive</Heading>

      <Text size="sm" className="text-typography-600 mb-1 font-medium">Name *</Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-4"
        placeholder="e.g., Hive 1, Queen Bee"
        value={name}
        onChangeText={(t) => setName(t.slice(0, 50))}
        accessibilityLabel="Hive name"
        testID="name-input"
      />

      <Text size="sm" className="text-typography-600 mb-2 font-medium">Type *</Text>
      <View className="gap-2 mb-4">
        {HIVE_TYPES.map((ht) => (
          <Pressable
            key={ht.value}
            className={`flex-row items-center gap-3 p-3 rounded-xl border-2 min-h-[48px] ${
              type === ht.value ? 'border-primary-500 bg-primary-50' : 'border-outline-200'
            }`}
            onPress={() => setType(ht.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: type === ht.value }}
            accessibilityLabel={`${ht.label}: ${ht.description}`}
            testID={`type-${ht.value}`}
          >
            <Ionicons name={ht.icon as 'cube-outline'} size={20} color={ICON_COLORS.muted} />
            <View>
              <Text size="md" className="font-medium">{ht.label}</Text>
              <Text size="xs" className="text-typography-400">{ht.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text size="sm" className="text-typography-600 mb-1 font-medium">Notes</Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-6"
        placeholder="Optional notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        accessibilityLabel="Notes"
        testID="notes-input"
      />

      {error && (
        <View className="bg-background-error rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-error-600">{error}</Text>
        </View>
      )}

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleSubmit}
        disabled={!name.trim() || !type || createHive.isPending}
        accessibilityLabel="Create hive"
        testID="create-btn"
      >
        {createHive.isPending ? <ButtonSpinner /> : <ButtonText>Create Hive</ButtonText>}
      </Button>
    </ScrollView>
  );
}
