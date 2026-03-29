import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    <View style={{ flex: 1, padding: 24 }} testID="settings-screen">
      <Text style={{ fontSize: 14, marginBottom: 4 }}>Display Name</Text>
      <TextInput
        testID="display-name-input"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 16 }}
      />

      <Text style={{ fontSize: 14, marginBottom: 4 }}>Email</Text>
      <Text testID="email-display" style={{ fontSize: 16, color: '#6B7280', marginBottom: 16 }}>
        {user?.email ?? ''}
      </Text>

      <TouchableOpacity
        testID="save-button"
        onPress={handleSave}
        disabled={saving}
        accessibilityState={{ disabled: saving }}
        accessibilityRole="button"
        accessibilityLabel="Save display name"
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4880F', borderRadius: 8 }}
      >
        {saving ? (
          <ActivityIndicator testID="save-spinner" color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
        )}
      </TouchableOpacity>

      {successMessage && (
        <Text testID="success-message" style={{ color: '#2D7A3A', marginTop: 12 }}>
          {successMessage}
        </Text>
      )}

      {errorMessage && (
        <Text testID="error-message" style={{ color: '#A63D2F', marginTop: 12 }}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
}
