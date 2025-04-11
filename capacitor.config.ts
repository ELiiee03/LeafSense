import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'LeafSense',
  webDir: 'dist',
  bundledWebRuntime: false,
  // server: {
  //   androidScheme: 'https'
  // },
  // capacitor.config.json
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // url: 'http://192.168.1.57:8100', // Direct URL to your dev machine
    cleartext: true,
    allowNavigation: ['*', 'localhost', '*.supabase.co']
  },

  plugins: {
    CapacitorSQLite: {
      // androidIsEncryption: true,
      // androidBiometric: {
      //   biometricAuth : false,
      //   biometricTitle : "Biometric login for capacitor sqlite",
      //   biometricSubTitle : "Log in using your biometric"
      // }
          iosDatabaseLocation: 'Library/CapacitorDatabase',
          androidDatabaseLocation: 'default'

    },
    Http: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true
    }
  }
};


export default config;
