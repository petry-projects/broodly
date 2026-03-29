import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heading } from '../../../../components/ui/heading';
import { Text } from '../../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../../components/ui/button';
import {
  useApiary,
  useUpdateApiary,
  useDeleteApiary,
} from '../../../../src/features/apiary/hooks/use-apiaries';

export default function EditApiaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: apiary, isLoading } = useApiary(id!);
  const updateApiary = useUpdateApiary();
  const deleteApiary = useDeleteApiary();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiary) {
      setName(apiary.name);
      setRegion(apiary.region);
    }
  }, [apiary]);

  async function handleSave() {
    if (!name.trim() || !region.trim()) return;
    setError(null);
    try {
      await updateApiary.mutateAsync({
        id: id!,
        input: { name: name.trim(), region: region.trim() },
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update apiary.');
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Apiary',
      'This will permanently delete this apiary and all its hives. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApiary.mutateAsync(id!);
              router.replace('/(tabs)/apiaries');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete apiary.');
            }
          },
        },
      ],
    );
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
      <Heading size="2xl" className="mb-6">
        Edit Apiary
      </Heading>

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Name *
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-4"
        value={name}
        onChangeText={(t) => setName(t.slice(0, 50))}
        accessibilityLabel="Apiary name"
        testID="name-input"
      />

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Region *
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-6"
        value={region}
        onChangeText={setRegion}
        accessibilityLabel="Region"
        testID="region-input"
      />

      {error && (
        <View className="bg-background-error rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-error-600">{error}</Text>
        </View>
      )}

      <View className="gap-3">
        <Button
          action="primary"
          variant="solid"
          size="xl"
          onPress={handleSave}
          disabled={!name.trim() || !region.trim() || updateApiary.isPending}
          accessibilityLabel="Save changes"
          testID="save-btn"
        >
          {updateApiary.isPending ? <ButtonSpinner /> : <ButtonText>Save Changes</ButtonText>}
        </Button>

        <Button
          action="negative"
          variant="solid"
          size="xl"
          onPress={handleDelete}
          disabled={deleteApiary.isPending}
          accessibilityLabel="Delete this apiary"
          testID="delete-btn"
        >
          {deleteApiary.isPending ? <ButtonSpinner /> : <ButtonText>Delete Apiary</ButtonText>}
        </Button>
      </View>
    </ScrollView>
  );
}
