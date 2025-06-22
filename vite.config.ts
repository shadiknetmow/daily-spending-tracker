import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify('AIzaSyBNguCv7piM8s2QSie8Tltg0qBFniY9nLs'),
        'process.env.GEMINI_API_KEY': JSON.stringify('AIzaSyBNguCv7piM8s2QSie8Tltg0qBFniY9nLs')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
