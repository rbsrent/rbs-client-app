const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Patches react-native-yamap android/build.gradle to remove jcenter()
// which was removed in Gradle 9+
module.exports = function withYamapFix(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const candidates = [
        path.join(config.modRequest.projectRoot, 'node_modules', 'react-native-yamap', 'android', 'build.gradle'),
      ];

      // pnpm stores under .pnpm — find via glob-like search
      const pnpmBase = path.join(config.modRequest.projectRoot, 'node_modules', '.pnpm');
      if (fs.existsSync(pnpmBase)) {
        const entries = fs.readdirSync(pnpmBase);
        for (const entry of entries) {
          if (entry.startsWith('react-native-yamap@')) {
            candidates.push(
              path.join(pnpmBase, entry, 'node_modules', 'react-native-yamap', 'android', 'build.gradle'),
            );
          }
        }
      }

      for (const gradlePath of candidates) {
        if (fs.existsSync(gradlePath)) {
          let content = fs.readFileSync(gradlePath, 'utf8');
          if (content.includes('jcenter()')) {
            content = content.replace(/jcenter\(\)/g, '// jcenter() removed');
            fs.writeFileSync(gradlePath, content);
          }
        }
      }

      return config;
    },
  ]);
};
