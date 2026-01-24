/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                module: 'CommonJS'
            }
        }],
        '^.+\\.svelte$': ['svelte-jester']
    },
    moduleFileExtensions: ['js', 'ts', 'svelte'],
    testMatch: [
        "**/tests/**/*Test.ts",
        "**/tests/**/*.test.ts"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(svelte)/)"
    ],
    resolver: undefined
};
