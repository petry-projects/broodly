import './global.css';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from './components/ui/gluestack-ui-provider';
import { Button, ButtonText } from './components/ui/button';
import { Text } from './components/ui/text';
import { Heading } from './components/ui/heading';

function ColorSwatch({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <View className="flex-row items-center gap-2 mb-2">
      <View className={`w-10 h-10 rounded ${className}`} />
      <Text size="sm">{label}</Text>
    </View>
  );
}

function SmokeTestScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background-0"
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Typography smoke test */}
      <Heading size="3xl" className="mb-4">
        Broodly Design System
      </Heading>
      <Heading size="2xl" className="mb-2">
        Section Header (2xl)
      </Heading>
      <Heading size="xl" className="mb-2">
        Card Title (xl)
      </Heading>
      <Heading size="lg" className="mb-4">
        Subsection (lg)
      </Heading>

      <Text size="md" className="mb-2">
        Body copy at 16px — the field-use default size.
      </Text>
      <Text size="sm" className="mb-2">
        Secondary description at 14px.
      </Text>
      <Text size="xs" className="mb-6">
        Metadata / timestamp at 12px (minimum).
      </Text>

      {/* Button smoke test */}
      <Heading size="xl" className="mb-3">
        Button Variants
      </Heading>

      <View className="gap-3 mb-6">
        <Button action="primary" variant="solid" size="xl">
          <ButtonText>Start Inspection</ButtonText>
        </Button>

        <Button action="primary" variant="outline">
          <ButtonText>View My Apiaries</ButtonText>
        </Button>

        <Button action="secondary" variant="link">
          <ButtonText>Not now</ButtonText>
        </Button>

        <Button action="positive" variant="solid">
          <ButtonText>Did It</ButtonText>
        </Button>

        <Button action="negative" variant="solid">
          <ButtonText>Report Issue</ButtonText>
        </Button>
      </View>

      {/* Color token smoke test */}
      <Heading size="xl" className="mb-3">
        Color Tokens
      </Heading>

      <ColorSwatch label="primary-500 (Honey Amber)" className="bg-primary-500" />
      <ColorSwatch label="secondary-500 (Pollen Gold)" className="bg-secondary-500" />
      <ColorSwatch label="success-500 (Leaf Green)" className="bg-success-500" />
      <ColorSwatch label="warning-500 (Dark Amber)" className="bg-warning-500" />
      <ColorSwatch label="error-500 (Deep Rust Red)" className="bg-error-500" />
      <ColorSwatch label="info-500 (Sky Blue)" className="bg-info-500" />

      <View className="h-4" />
      <ColorSwatch label="background-50 (Warm Wax)" className="bg-background-50 border border-outline-200" />
      <ColorSwatch label="background-error" className="bg-background-error" />
      <ColorSwatch label="background-warning" className="bg-background-warning" />
      <ColorSwatch label="background-success" className="bg-background-success" />
      <ColorSwatch label="background-info" className="bg-background-info" />
      <ColorSwatch label="background-muted" className="bg-background-muted" />

      {/* Spacing smoke test */}
      <Heading size="xl" className="mt-4 mb-3">
        8px Spacing Scale
      </Heading>
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <View key={n} className="flex-row items-center mb-1">
          <View
            className={`bg-primary-500 h-4`}
            style={{ width: n * 8 }}
          />
          <Text size="xs" className="ml-2">
            {n} = {n * 8}px
          </Text>
        </View>
      ))}

      <StatusBar style="auto" />
    </ScrollView>
  );
}

export default function App() {
  return (
    <GluestackUIProvider mode="light">
      <SmokeTestScreen />
    </GluestackUIProvider>
  );
}
