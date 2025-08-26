import '../../templates/jest.setup.template';

// override env vars only for framework tests
process.env.ACCESS_TOKEN_EXPIRES_IN_S = '5';
process.env.REFRESH_TOKEN_EXPIRES_IN_S = '10';