import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { Heading } from '../../../components/ui/heading';

export default function ApiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-background-0 items-center justify-center p-6">
      <Heading size="2xl" className="mb-2">
        Apiary Detail
      </Heading>
      <Text size="md" className="text-typography-500">
        Apiary {id} — coming soon
      </Text>
    </View>
  );
}
