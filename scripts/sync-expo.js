const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));

const version = pkg.version;
const [major, minor, patch] = version.split('.').map((n) => parseInt(n || 0, 10));
const code = major * 10000 + minor * 100 + patch; // 1.2.3 -> 10203

app.expo = app.expo || {};
app.expo.version = version;
app.expo.android = { ...(app.expo.android || {}), versionCode: code };
app.expo.ios = { ...(app.expo.ios || {}), buildNumber: String(code) };

fs.writeFileSync('app.json', JSON.stringify(app, null, 2));
console.log('Synced Expo to', version, 'code', code);
