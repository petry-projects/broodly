import React, { useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heading } from '../../../components/ui/heading';
import { Text } from '../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../components/ui/button';
import { useCreateApiary, useApiaries } from '../../../src/features/apiary/hooks/use-apiaries';

const MAX_APIARIES = 5;

export default function CreateApiaryScreen() {
  const router = useRouter();
  const { data: apiaries } = useApiaries();
  const createApiary = useCreateApiary();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const atLimit = (apiaries?.length ?? 0) >= MAX_APIARIES;

  async function handleSubmit() {
    if (!name.trim() || !region.trim()) return;
    if (atLimit) {
      setError(`You can have up to ${MAX_APIARIES} apiaries. Please remove one before adding another.`);
      return;
    }
    setError(null);
    try {
      await createApiary.mutateAsync({
        name: name.trim(),
        region: region.trim(),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create apiary. Please try again.');
    }
  }

  return (
    <ScrollView className="flex-1 bg-background-0" contentContainerClassName="px-6 pt-8 pb-12">
      <Heading size="2xl" className="mb-6">
        Add Apiary
      </Heading>

      {atLimit && (
        <View className="bg-background-warning rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-warning-700">
            You have reached the maximum of {MAX_APIARIES} apiaries.
          </Text>
        </View>
      )}

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Name *
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-4"
        placeholder="e.g., Backyard, Mountain Apiary"
        value={name}
        onChangeText={(t) => setName(t.slice(0, 50))}
        accessibilityLabel="Apiary name"
        testID="name-input"
      />

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Region *
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-4"
        placeholder="e.g., Pacific Northwest, London"
        value={region}
        onChangeText={setRegion}
        accessibilityLabel="Region"
        testID="region-input"
      />

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Notes
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-6"
        placeholder="Optional notes about this location"
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
        disabled={!name.trim() || !region.trim() || createApiary.isPending || atLimit}
        accessibilityLabel="Create apiary"
        testID="create-btn"
      >
        {createApiary.isPending ? <ButtonSpinner /> : <ButtonText>Create Apiary</ButtonText>}
      </Button>
    </ScrollView>
  );
}
