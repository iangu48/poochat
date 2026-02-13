import type { RefObject } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { TextInput as TextInputHandle } from 'react-native';
import { styles } from './styles';

type AuthMethod = 'phone' | 'email';

type Props = {
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  authPhone: string;
  setAuthPhone: (value: string) => void;
  authOtp: string;
  setAuthOtp: (value: string) => void;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authOtpCooldownSec: number;
  authVerifyingOtp: boolean;
  authStatus: string;
  authError: string;
  otpInputRef: RefObject<TextInputHandle | null>;
  onSendPhoneOtp: () => void;
  onVerifyPhoneOtp: () => void;
  onAuth: (mode: 'sign-in' | 'sign-up') => void;
};

export function AuthScreen(props: Props) {
  const {
    authMethod,
    setAuthMethod,
    authPhone,
    setAuthPhone,
    authOtp,
    setAuthOtp,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authOtpCooldownSec,
    authVerifyingOtp,
    authStatus,
    authError,
    otpInputRef,
    onSendPhoneOtp,
    onVerifyPhoneOtp,
    onAuth,
  } = props;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Poochat</Text>
      <Text style={styles.muted}>Sign in with phone (recommended) or email.</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={authMethod === 'phone' ? styles.button : styles.buttonSecondary}
          onPress={() => setAuthMethod('phone')}
        >
          <Text style={styles.buttonText}>Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={authMethod === 'email' ? styles.button : styles.buttonSecondary}
          onPress={() => setAuthMethod('email')}
        >
          <Text style={styles.buttonText}>Email</Text>
        </TouchableOpacity>
      </View>

      {authMethod === 'phone' && (
        <>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="+15551234567"
            placeholderTextColor="#8b949e"
            value={authPhone}
            onChangeText={setAuthPhone}
          />
          <TouchableOpacity
            style={[styles.button, authOtpCooldownSec > 0 && styles.buttonDisabled]}
            onPress={onSendPhoneOtp}
            disabled={authOtpCooldownSec > 0}
          >
            <Text style={styles.buttonText}>
              {authOtpCooldownSec > 0 ? `Send Again In ${authOtpCooldownSec}s` : 'Send SMS Code'}
            </Text>
          </TouchableOpacity>
          <TextInput
            ref={otpInputRef}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="SMS code"
            placeholderTextColor="#8b949e"
            value={authOtp}
            onChangeText={setAuthOtp}
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.buttonSecondary, authVerifyingOtp && styles.buttonDisabled]}
            onPress={onVerifyPhoneOtp}
            disabled={authVerifyingOtp}
          >
            <Text style={styles.buttonText}>{authVerifyingOtp ? 'Verifying...' : 'Verify Code'}</Text>
          </TouchableOpacity>
        </>
      )}

      {authMethod === 'email' && (
        <>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#8b949e"
            value={authEmail}
            onChangeText={setAuthEmail}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#8b949e"
            value={authPassword}
            onChangeText={setAuthPassword}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={() => onAuth('sign-in')}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => onAuth('sign-up')}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!!authStatus && <Text style={styles.muted}>{authStatus}</Text>}
      {!!authError && <Text style={styles.error}>{authError}</Text>}
    </View>
  );
}
