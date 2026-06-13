import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sitelog.app',
  appName: 'SiteLog',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
