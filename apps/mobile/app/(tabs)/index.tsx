import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/ui/text';
import { Heading } from '../../components/ui/heading';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background-0 items-center justify-center p-6">
      <Heading size="2xl" className="mb-2">
        Home
      </Heading>
      <Text size="md" className="text-typography-500">
        Happy Context Homepage — coming soon
      </Text>
    </View>
  );
}
