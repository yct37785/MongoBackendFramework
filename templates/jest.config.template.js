const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ['<rootDir>/jest/jest.setup.ts'],
  roots: ["<rootDir>"], // explicitly tells Jest to only look inside <rootDir>/
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/*.test.ts"], // runs any *.test.ts found
  moduleFileExtensions: ["ts", "js", "json", "node"], // default extensions

  // coverage settings
  // collectCoverage: true,
  // collectCoverageFrom: [
  //   "src/**/*.ts",          // include all TypeScript source files
  //   "!**/*.test.ts",        // exclude test files
  //   "!**/node_modules/**",  // exclude node_modules
  //   "!**/index.ts",         // optionally exclude entry points
  // ],
  // coverageDirectory: "coverage", // output folder
};