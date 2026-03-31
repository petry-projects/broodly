import React, { useState } from 'react';
import { View, TextInput, FlatList, Alert } from 'react-native';
import { Heading } from '../../../components/ui/heading';
import { Text } from '../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../components/ui/button';
import {
  useCollaborators,
  useInviteCollaborator,
  useRevokeCollaborator,
  useAccessAuditLog,
} from '../../../src/features/collaborator/hooks/use-collaborators';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CollaboratorsScreen() {
  const { data: collaborators, isLoading } = useCollaborators();
  const { data: auditLog } = useAccessAuditLog();
  const invite = useInviteCollaborator();
  const revoke = useRevokeCollaborator();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleInvite() {
    if (!isValidEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);
    try {
      await invite.mutateAsync(email.trim());
      setEmail('');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to invite collaborator.');
    }
  }

  function handleRevoke(collaboratorId: string, collaboratorEmail: string) {
    Alert.alert(
      'Revoke Access',
      `Remove ${collaboratorEmail}'s access to your apiaries? You can re-invite them later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => revoke.mutateAsync(collaboratorId),
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
    <FlatList
      className="flex-1 bg-background-0"
      contentContainerClassName="px-6 pt-8 pb-12"
      data={collaborators ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View className="mb-6">
          <Heading size="2xl" className="mb-2">Collaborators</Heading>
          <Text size="md" className="text-typography-500 mb-6">
            Invite others to view your apiaries with read-only access.
          </Text>

          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Collaborator email"
              testID="email-input"
            />
            <Button
              action="primary"
              variant="solid"
              onPress={handleInvite}
              disabled={!email.trim() || invite.isPending}
              accessibilityLabel="Send invitation"
              testID="invite-btn"
            >
              {invite.isPending ? <ButtonSpinner /> : <ButtonText>Invite</ButtonText>}
            </Button>
          </View>
          {emailError && (
            <Text size="sm" className="text-error-600 mb-4" testID="email-error">{emailError}</Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View className="flex-row justify-between items-center py-3 border-b border-outline-100">
          <View className="flex-1">
            <Text size="md">{item.email}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View
                className={`px-2 py-0.5 rounded ${
                  item.status === 'accepted' ? 'bg-success-100' : 'bg-info-100'
                }`}
              >
                <Text
                  size="xs"
                  className={
                    item.status === 'accepted' ? 'text-success-700' : 'text-info-700'
                  }
                >
                  {item.status === 'accepted' ? 'Active' : 'Pending'}
                </Text>
              </View>
              <Text size="xs" className="text-typography-400">Read-only</Text>
            </View>
          </View>
          <Button
            action="negative"
            variant="outline"
            onPress={() => handleRevoke(item.id, item.email)}
            disabled={revoke.isPending}
            accessibilityLabel={`Revoke access for ${item.email}`}
            testID={`revoke-${item.id}`}
          >
            <ButtonText>Revoke</ButtonText>
          </Button>
        </View>
      )}
      ListEmptyComponent={
        <View className="items-center py-8">
          <Text size="md" className="text-typography-400 text-center">
            No collaborators yet. Invite someone to share read-only access to your apiaries.
          </Text>
        </View>
      }
      ListFooterComponent={
        auditLog && auditLog.length > 0 ? (
          <View className="mt-8">
            <Heading size="lg" className="mb-3">Access History</Heading>
            {auditLog.map((entry) => (
              <View key={entry.id} className="flex-row justify-between py-2 border-b border-outline-50">
                <Text size="sm" className="text-typography-600">
                  {entry.eventType.replace(/_/g, ' ')} — {entry.targetEmail}
                </Text>
                <Text size="xs" className="text-typography-400">
                  {new Date(entry.occurredAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      }
    />
  );
}
