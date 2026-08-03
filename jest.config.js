module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/cloud', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js',
    '**/*.test.ts',
    '**/*.test.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tarojs/taro$': '<rootDir>/__mocks__/taro.ts',
    '^@tarojs/components$': '<rootDir>/__mocks__/components.ts',
    '\\.(scss|sass|css)$': '<rootDir>/__mocks__/styleMock.js'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        target: 'es2017',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        strict: false,
        noImplicitAny: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        paths: {
          '@/*': ['./src/*']
        },
        baseUrl: '.'
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!@tarojs)'
  ]
}
