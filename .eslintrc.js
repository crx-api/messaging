module.exports = {
    env: {
        browser: true,
        es2021: true
    },

    extends: [
        'standard'
    ],

    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },

    globals: {
        chrome: 'readonly'
    },

    rules: {
        indent: ['error', 4]
    }
}
