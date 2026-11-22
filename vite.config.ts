import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/Sequoia-Web-OS/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          // Rewrite root-relative "/src/assets/" paths in compiled JS/CSS for GitHub Pages subpath
          const assetsOutDir = path.resolve(distDir, 'assets');
          if (fs.existsSync(assetsOutDir)) {
            for (const file of fs.readdirSync(assetsOutDir)) {
              if (file.endsWith('.js') || file.endsWith('.css')) {
                const filePath = path.resolve(assetsOutDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                fs.writeFileSync(
                  filePath,
                  content.replaceAll('/src/assets/', '/Sequoia-Web-OS/src/assets/')
                );
              }
            }
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
