import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/daily-spending-tracker/', // 👈 This is required for GitHub Pages!
  plugins: [react()],
});
