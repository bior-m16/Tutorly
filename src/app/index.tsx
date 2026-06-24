import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';

const BG = { uri: 'https://raw.githubusercontent.com/bior-m16/Pawell/main/UGC%20Hub%20Background.png' };

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={BG} style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>UGC</Text>
          </View>
          <Text style={styles.appName}>UGC Hub</Text>
          <Text style={styles.tagline}>
            Connect brands with creators.{'\n'}Create. Collab. Grow.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing you agree to our Terms &amp; Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.18 },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.78)',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  secondaryBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  legal: { textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 4 },
});
