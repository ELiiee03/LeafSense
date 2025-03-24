import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Leafify',
  webDir: 'dist',
  bundledWebRuntime: false,
  // server: {
  //   androidScheme: 'https'
  // },
  // capacitor.config.json
  server: {
    androidScheme: 'https',
    url: 'http://192.168.26.173:8100', // Direct URL to your dev machine
    cleartext: true
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
    
  }
};


export default config;
