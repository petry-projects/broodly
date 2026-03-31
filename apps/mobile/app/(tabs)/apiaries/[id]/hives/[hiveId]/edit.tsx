import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../../../../components/ui/heading';
import { Text } from '../../../../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../../../../components/ui/button';
import { useHive, useUpdateHive } from '../../../../../../src/features/hive/hooks/use-hives';
import { HiveType } from '@broodly/graphql-types';
import { ICON_COLORS } from '../../../../../../src/theme/colors';

const HIVE_TYPES: Array<{ value: HiveType; label: string; icon: string }> = [
  { value: HiveType.Langstroth, label: 'Langstroth', icon: 'cube-outline' },
  { value: HiveType.TopBar, label: 'Top Bar', icon: 'reorder-three-outline' },
  { value: HiveType.Warre, label: 'Warré', icon: 'layers-outline' },
  { value: HiveType.Other, label: 'Other', icon: 'ellipse-outline' },
];

export default function EditHiveScreen() {
  const router = useRouter();
  const { hiveId } = useLocalSearchParams<{ hiveId: string }>();
  const { data: hive, isLoading } = useHive(hiveId!);
  const updateHive = useUpdateHive();
  const [name, setName] = useState('');
  const [type, setType] = useState<HiveType | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hive) {
      setName(hive.name);
      setType(hive.type as HiveType);
      setNotes(hive.notes);
    }
  }, [hive]);

  async function handleSave() {
    if (!name.trim() || !type) return;
    setError(null);
    try {
      await updateHive.mutateAsync({
        id: hiveId!,
        input: { name: name.trim(), type, notes: notes.trim() },
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hive.');
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background-0 justify-center items-center">
        <Text size="md" className="text-typography-500">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background-0" contentContainerClassName="px-6 pt-8 pb-12">
      <Heading size="2xl" className="mb-6">Edit Hive</Heading>

      <Text size="sm" className="text-typography-600 mb-1 font-medium">Name *</Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-4"
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
            accessibilityLabel={ht.label}
            testID={`type-${ht.value}`}
          >
            <Ionicons name={ht.icon as 'cube-outline'} size={20} color={ICON_COLORS.muted} />
            <Text size="md" className="font-medium">{ht.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text size="sm" className="text-typography-600 mb-1 font-medium">Notes</Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-6"
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
        onPress={handleSave}
        disabled={!name.trim() || !type || updateHive.isPending}
        accessibilityLabel="Save changes"
        testID="save-btn"
      >
        {updateHive.isPending ? <ButtonSpinner /> : <ButtonText>Save Changes</ButtonText>}
      </Button>
    </ScrollView>
  );
}
