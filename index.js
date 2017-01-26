const spawn = require('child_process').spawn;

// const exampleSettings = {
//   url: 'https://jsd.test.linkyard.ch/',
//   title: 'linkyard Test instance',
//   public: false,
//   trialLicense: {
//     user: 'atlassian-trials@linkyard.ch',
//     password: 'secret',
//     organization: 'linkyard'
//   },
//   license: 'asdasf323q...',
//   admin: {
//     displayName: 'Administrator',
//     email: 'admin@domain.com',
//     user: 'admin',
//     password: 'secret'
//   },
//   db: {
//     type: 'PostgreSQL',
//     host: 'postgres',
//     port: '5432',
//     database: 'postgres',
//     user: 'postgres',
//     password: 'secret'
//   },
//   mail: {
//     from: 'admin@domain.com',
//     prefix: '[TEST]',
//     host: 'smtp-relay.gmail.com',
//     port: 465,
//     secure: true,
//     user: '',
//     password: ''
//   }
// };

function settingsFromEnv() {
  const settings = {};
  settings.url = process.env['JIRA_URL'];
  settings.title = process.env['JIRA_TITLE'];
  settings.public = process.env['PUBLIC_SIGNUP'] === 'true';

  settings.license = process.env['LICENSE'];
  settings.trialLicense = {};
  settings.trialLicense.user = process.env['ATLASSIAN_USER'];
  settings.trialLicense.password = process.env['ATLASSIAN_PASSWORD'];
  settings.trialLicense.organization = process.env['ATLASSIAN_ORG'];

  settings.admin = {};
  settings.admin.displayName = process.env['ADMIN_DISPLAYNAME'] || 'Administrator';
  settings.admin.email = process.env['ADMIN_EMAIL'];
  settings.admin.user = process.env['ADMIN_USER'] || 'admin';
  settings.admin.password = process.env['ADMIN_PASSWORD'];

  settings.db = {};
  settings.db.type = process.env['DB_TYPE'] || 'PostgreSQL';
  settings.db.host = process.env['DB_HOST'];
  settings.db.port = process.env['DB_PORT'] || 5432;
  settings.db.database = process.env['DB_DATABASE'] || 'postgres';
  settings.db.user = process.env['DB_USER'] || 'postgres';
  settings.db.password = process.env['DB_PASSWORD'];

  if (process.env['MAIL_HOST']) {
    settings.mail = {};
    settings.mail.from = process.env['MAIL_FROM'] || settings.admin.email;
    settings.mail.prefix = process.env['MAIL_PREFIX'] || '[JIRA]';
    settings.mail.host = process.env['MAIL_HOST'];
    settings.mail.port = process.env['MAIL_PORT'] || 465;
    settings.mail.secure = process.env['MAIL_SECURE'] !== 'false' || true;
    settings.mail.user = process.env['MAIL_USER'] || '';
    settings.mail.password = process.env['MAIL_PASSWORD'] || '';
  }
  return settings;
}


const settings = settingsFromEnv();

const casper = spawn('node_modules/casperjs/bin/casperjs', [
  // '--log-level=debug', '--verbose',
  'setup-jira.js', JSON.stringify(settings)]);

casper.stdout.pipe(process.stdout);
casper.stderr.pipe(process.stderr);

casper.on('close', function (code) {
  process.exit(code);
});
