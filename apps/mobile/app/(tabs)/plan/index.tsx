import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Heading } from '../../../components/ui/heading';

export default function PlanScreen() {
  return (
    <View className="flex-1 bg-background-0 items-center justify-center p-6">
      <Heading size="2xl" className="mb-2">
        Plan
      </Heading>
      <Text size="md" className="text-typography-500">
        Seasonal planning — coming soon
      </Text>
    </View>
  );
}
