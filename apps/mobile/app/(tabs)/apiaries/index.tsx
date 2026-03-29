import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Heading } from '../../../components/ui/heading';

export default function ApiariesScreen() {
  return (
    <View className="flex-1 bg-background-0 items-center justify-center p-6">
      <Heading size="2xl" className="mb-2">
        Apiaries
      </Heading>
      <Text size="md" className="text-typography-500">
        Apiary list — coming soon
      </Text>
    </View>
  );
}
