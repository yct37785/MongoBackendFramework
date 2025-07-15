const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

// override env vars
process.env.ACCESS_TOKEN_EXPIRES_IN_S = '5';
process.env.REFRESH_TOKEN_EXPIRES_IN_S = '10';