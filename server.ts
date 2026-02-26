import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import app from './server/src/app';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Serve admin app on /admin
    app.get('/admin*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const templatePath = path.resolve(__dirname, 'admin/index.html');
        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use('/admin', express.static(path.join(__dirname, 'dist/admin')));
    app.use(express.static(path.join(__dirname, 'dist/client')));
    
    app.get('/admin*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/admin/index.html'));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/client/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
