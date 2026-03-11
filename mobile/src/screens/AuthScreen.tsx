import type { RefObject } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TextInput as TextInputHandle } from 'react-native';
import { styles } from './styles';
import { getThemePalette, type ThemeMode } from '../theme';

type AuthMethod = 'phone' | 'email';

type Props = {
  themeMode: ThemeMode;
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
  authSubmitting: boolean;
  authSendingOtp: boolean;
  authStatus: string;
  authError: string;
  otpInputRef: RefObject<TextInputHandle | null>;
  onSendPhoneOtp: () => void;
  onVerifyPhoneOtp: () => void;
  onAuth: (mode: 'sign-in' | 'sign-up') => void;
};

export function AuthScreen(props: Props) {
  const {
    themeMode,
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
    authSubmitting,
    authSendingOtp,
    authStatus,
    authError,
    otpInputRef,
    onSendPhoneOtp,
    onVerifyPhoneOtp,
    onAuth,
  } = props;
  const colors = getThemePalette(themeMode);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Poochat</Text>
      <Text style={[styles.muted, { color: colors.mutedText }]}>Sign in with phone (recommended) or email.</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[authMethod === 'phone' ? styles.button : styles.buttonSecondary, authSubmitting && styles.buttonDisabled]}
          onPress={() => setAuthMethod('phone')}
          disabled={authSubmitting}
        >
          <View style={styles.buttonContentRow}>
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.buttonText}>Phone</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[authMethod === 'email' ? styles.button : styles.buttonSecondary, authSubmitting && styles.buttonDisabled]}
          onPress={() => setAuthMethod('email')}
          disabled={authSubmitting}
        >
          <View style={styles.buttonContentRow}>
            <Ionicons name="mail" size={16} color="#fff" />
            <Text style={styles.buttonText}>Email</Text>
          </View>
        </TouchableOpacity>
      </View>

      {authMethod === 'phone' && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            keyboardType="phone-pad"
            placeholder="+15551234567"
            placeholderTextColor={colors.mutedText}
            value={authPhone}
            onChangeText={setAuthPhone}
          />
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, borderColor: colors.primaryBorder, borderWidth: 1 },
              (authOtpCooldownSec > 0 || authSendingOtp) && styles.buttonDisabled,
            ]}
            onPress={onSendPhoneOtp}
            disabled={authOtpCooldownSec > 0 || authSendingOtp}
          >
            <View style={styles.buttonContentRow}>
              {authSendingOtp ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="paper-plane" size={16} color="#fff" />}
              <Text style={styles.buttonText}>
                {authSendingOtp
                  ? 'Sending...'
                  : authOtpCooldownSec > 0
                    ? `Send Again In ${authOtpCooldownSec}s`
                    : 'Send SMS Code'}
              </Text>
            </View>
          </TouchableOpacity>
          <TextInput
            ref={otpInputRef}
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            keyboardType="number-pad"
            placeholder="SMS code"
            placeholderTextColor={colors.mutedText}
            value={authOtp}
            onChangeText={setAuthOtp}
            maxLength={6}
          />
          <TouchableOpacity
            style={[
              styles.buttonSecondary,
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              authVerifyingOtp && styles.buttonDisabled,
            ]}
            onPress={onVerifyPhoneOtp}
            disabled={authVerifyingOtp}
          >
            <View style={styles.buttonContentRow}>
              {authVerifyingOtp ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-circle" size={16} color="#fff" />}
              <Text style={styles.buttonText}>{authVerifyingOtp ? 'Verifying...' : 'Verify Code'}</Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {authMethod === 'email' && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.mutedText}
            value={authEmail}
            onChangeText={setAuthEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.mutedText}
            value={authPassword}
            onChangeText={setAuthPassword}
          />
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary, borderColor: colors.primaryBorder, borderWidth: 1 },
                authSubmitting && styles.buttonDisabled,
              ]}
              onPress={() => onAuth('sign-in')}
              disabled={authSubmitting}
            >
              <View style={styles.buttonContentRow}>
                {authSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="log-in-outline" size={16} color="#fff" />}
                <Text style={styles.buttonText}>{authSubmitting ? 'Signing In...' : 'Sign In'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.buttonSecondary,
                { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                authSubmitting && styles.buttonDisabled,
              ]}
              onPress={() => onAuth('sign-up')}
              disabled={authSubmitting}
            >
              <View style={styles.buttonContentRow}>
                {authSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="person-add" size={16} color="#fff" />}
                <Text style={styles.buttonText}>{authSubmitting ? 'Creating...' : 'Sign Up'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!!authStatus && <Text style={[styles.muted, { color: colors.mutedText }]}>{authStatus}</Text>}
      {!!authError && <Text style={styles.error}>{authError}</Text>}
    </View>
  );
}
