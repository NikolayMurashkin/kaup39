module.exports = {
  ci: {
    collect: {
      startServerCommand: 'NEXT_DIST_DIR=.next-production yarn start -p 3202',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 120000,
      url: ['http://localhost:3202/'],
      numberOfRuns: 3,
    },
    assert: {
      aggregationMethod: 'pessimistic',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
