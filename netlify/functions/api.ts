import serverless from 'serverless-http';
import app from '../../server/src/app.ts';

console.log('API Function starting...');

export const handler = serverless(app);
