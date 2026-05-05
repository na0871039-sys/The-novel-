import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  {
    files: ['**/*.rules'],
    plugins: {
      'firebase-rules': firebaseRulesPlugin
    },
    languageOptions: {
      parser: firebaseRulesPlugin.parsers.firestore // Use the correct parser if available, or just common rules
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules
    }
  }
];
