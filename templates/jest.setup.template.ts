import dotenv from 'dotenv';
dotenv.config({ path: '.env', quiet: true });

// test mode
process.env.NODE_ENV = 'test';