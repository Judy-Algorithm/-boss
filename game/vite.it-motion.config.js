import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({build:{outDir:'dist-it-motion',rollupOptions:{input:fileURLToPath(new URL('./it-motion.html',import.meta.url))}}});
