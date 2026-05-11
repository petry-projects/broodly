import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Button, ButtonText } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { useAuthStore } from '../store/auth-store';
import { updateDisplayName } from './account';

export function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await updateDisplayName(name);
      setSuccessMessage('Display name updated successfully');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 p-6" testID="settings-screen">
      <Text size="sm" className="mb-1">Display Name</Text>
      <TextInput
        testID="display-name-input"
        value={name}
        onChangeText={setName}
        className="border border-outline-200 p-3 rounded-lg text-base mb-4"
      />

      <Text size="sm" className="mb-1">Email</Text>
      <Text testID="email-display" size="md" className="text-typography-500 mb-4">
        {user?.email ?? ''}
      </Text>

      <Button
        testID="save-button"
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel="Save display name"
      >
        {saving ? (
          <ActivityIndicator testID="save-spinner" color="white" />
        ) : (
          <ButtonText>Save</ButtonText>
        )}
      </Button>

      {successMessage && (
        <Text testID="success-message" size="md" className="text-success-600 mt-3">
          {successMessage}
        </Text>
      )}

      {errorMessage && (
        <Text testID="error-message" size="md" className="text-error-600 mt-3">
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
