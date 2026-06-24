import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const BG = { uri: 'https://raw.githubusercontent.com/bior-m16/Pawell/main/UGC%20Hub%20Background.png' };
type Role = 'business' | 'creator';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role,
        email,
      });
    }
    setLoading(false);
    Alert.alert(
      'Account created',
      'Check your email to confirm your account, then sign in.',
      [{ text: 'OK', onPress: () => router.replace('/login') }]
    );
  }

  return (
    <ImageBackground source={BG} style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join UGC Hub as a business or creator</Text>
            </View>

            <View style={styles.roleSection}>
              <Text style={styles.label}>I am a…</Text>
              <View style={styles.rolePicker}>
                {(['creator', 'business'] as Role[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleOption, role === r && styles.roleOptionActive]}
                    onPress={() => setRole(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextActive]}>
                      {r === 'creator' ? '🎬 Creator' : '🏢 Business'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.roleHint}>
                {role === 'creator'
                  ? 'Apply to campaigns and earn from your content.'
                  : 'Post campaigns and find the right creators.'}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane Smith"
                  placeholderTextColor="#bbb"
                  value={fullName}
                  onChangeText={setFullName}
                  autoComplete="name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#bbb"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.push('/login')} style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.footerLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.18 },
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.78)' },
  flex: { flex: 1 },
  inner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, gap: 28 },
  header: { gap: 6 },
  title: { fontSize: 28, fontWeight: '800', color: '#000' },
  subtitle: { fontSize: 15, color: '#666' },
  roleSection: { gap: 10 },
  rolePicker: { flexDirection: 'row', gap: 10 },
  roleOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#eee',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  roleOptionActive: { borderColor: '#000', backgroundColor: '#000' },
  roleOptionText: { fontSize: 14, fontWeight: '600', color: '#555' },
  roleOptionTextActive: { color: '#fff' },
  roleHint: { fontSize: 12, color: '#888', lineHeight: 18 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  primaryBtn: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14, color: '#555' },
  footerLink: { color: '#000', fontWeight: '700' },
});
