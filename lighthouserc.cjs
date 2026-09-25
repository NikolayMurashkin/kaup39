module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3202/',
        'http://localhost:3202/?v=nobelow',
        'http://localhost:3203/?v=cv',
        'http://localhost:3203/?v=nobelow',
      ],
      numberOfRuns: 3,
    },
    assert: {
      aggregationMethod: 'pessimistic',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
