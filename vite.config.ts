import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    // Increase header size limit to prevent 431 errors
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // Increase max header size
    maxHeaderSize: 32768, // 32KB
    // Additional server options to handle large requests
    hmr: {
      port: 24678,
    },
    // Increase request timeout
    timeout: 30000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only chunk large vendor libraries to avoid over-chunking
          if (id.includes('node_modules')) {
            // Only chunk the largest libraries
            if (id.includes('@mantine/core') || id.includes('@mantine/hooks') || id.includes('@mantine/notifications')) {
              return 'vendor-mantine'
            }
            if (id.includes('@codemirror/merge') || id.includes('@codemirror/state') || id.includes('@codemirror/view')) {
              return 'vendor-editor'
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'vendor-markdown'
            }
            // Let smaller libraries stay in the main bundle
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning threshold
  },
  optimizeDeps: {
    /**
     * Include dependencies here if they throw CJS<>ESM errors.
     * For example, for the following error:
     *
     * > ReferenceError: module is not defined
     * >   at /Users/.../node_modules/example-dep/index.js:1:1
     *
     * Include 'example-dep' in the array below.
     * @see https://vitejs.dev/config/dep-optimization-options
     */
    include: ['fast-deep-equal', '@mantine/notifications', 'react-markdown', 'react-textarea-autosize', '@mantine/tiptap', '@codemirror/merge'],
  },
})
