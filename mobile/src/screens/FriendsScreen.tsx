import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { IncomingFriendRequest, Profile } from '../types/domain';
import { styles } from './styles';

type Props = {
  friendUsername: string;
  friends: Profile[];
  incomingRequests: IncomingFriendRequest[];
  friendError: string;
  friendStatus: string;
  onFriendUsernameChange: (value: string) => void;
  onSendFriendRequest: () => void;
  onRefreshFriends: () => void;
  onAcceptRequest: (friendshipId: string) => void;
  onOpenDirectChat: (friendUserId: string) => void;
};

export function FriendsScreen(props: Props) {
  const {
    friendUsername,
    friends,
    incomingRequests,
    friendError,
    friendStatus,
    onFriendUsernameChange,
    onSendFriendRequest,
    onRefreshFriends,
    onAcceptRequest,
    onOpenDirectChat,
  } = props;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.label}>Send Request by Username</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={friendUsername}
        onChangeText={onFriendUsernameChange}
        placeholder="username"
        placeholderTextColor="#8b949e"
      />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={onSendFriendRequest}>
          <Text style={styles.buttonText}>Send Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onRefreshFriends}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {!!friendStatus && <Text style={styles.muted}>{friendStatus}</Text>}
      {!!friendError && <Text style={styles.error}>{friendError}</Text>}

      <Text style={styles.title}>Incoming Requests</Text>
      {incomingRequests.map((request) => (
        <View key={request.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {request.from.displayName} (@{request.from.username})
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => onAcceptRequest(request.id)}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      ))}
      {incomingRequests.length === 0 && <Text style={styles.muted}>No incoming requests.</Text>}

      <Text style={styles.title}>Your Friends</Text>
      {friends.map((friend) => (
        <View key={friend.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {friend.displayName} (@{friend.username})
          </Text>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => onOpenDirectChat(friend.id)}>
            <Text style={styles.buttonText}>Open Chat</Text>
          </TouchableOpacity>
        </View>
      ))}
      {friends.length === 0 && <Text style={styles.muted}>No accepted friends yet.</Text>}
    </ScrollView>
  );
}
