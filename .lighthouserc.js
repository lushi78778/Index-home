module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'started server on',
      numberOfRuns: 1,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/blog',
        'http://localhost:3000/projects',
        'http://localhost:3000/search',
      ],
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1366, height: 768, deviceScaleFactor: 1, disabled: false },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
  'categories:seo': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
