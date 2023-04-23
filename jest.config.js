/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['src/tests/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)']
};