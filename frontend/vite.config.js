import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
	  plugins: [react(), svgr()],
	  esbuild: {
	    drop: ['console', 'debugger'],
	  },
	  build: {
	    minify: 'esbuild',
	    rollupOptions: {
	      output: {
	        manualChunks: {
	          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          charts: ['recharts'],
          forms: ['react-hook-form', 'formik', 'yup'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
	  server: {
	    hmr: false,
	    proxy: {
	      '/admin': {
	        target: 'http://localhost:5000',
	        changeOrigin: true,
	        secure: false,
	        ws: false,
	        bypass: (req) => {
	          const accept = req.headers.accept ?? ''
	          const fetchDest = req.headers['sec-fetch-dest']

	          // Let React Router handle browser navigations like /admin, /admin-login, /admin/dashboard, etc.
	          // Keep proxying XHR/fetch calls (typically accept: application/json or */*).
	          if (
	            req.method === 'GET' &&
	            (fetchDest === 'document' || accept.includes('text/html'))
	          ) {
	            return '/index.html'
	          }
	        },
	      },
	      '/companies': {
	        target: 'http://localhost:5000',
	        changeOrigin: true,
        secure: false,
        ws: false,
      }
    }
  }
})
