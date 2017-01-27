const spawn = require('child_process').spawn;
const mkdirp = require('mkdirp');
const request = require('request');
const createWriteStream = require('fs').createWriteStream;
const retry = require('retry');

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

var settings;
if (process.argv && process.argv[2]) {
  settings = require('./' + process.argv[2]);
} else {
  settings = settingsFromEnv();
}


const logDir = process.cwd() + '/logs/' + new Date().toISOString();
mkdirp.sync(logDir);
const log = createWriteStream(logDir + '/log.txt', {flags: 'a'});

function waitForJiraStart(cont, error) {
  const operation = retry.operation({
    retries: 100,
    factor: 2,
    minTimeout: 500,
    maxTimeout: 3 * 1000,
    randomize: false
  });

  operation.attempt(function () {
    request({
      followAllRedirects: true,
      url: settings.url,
      timeout: 2000
    }, function (err, response, body) {
      const failure = err || response.statusCode !== 200
      if (operation.retry(failure)) {
        console.log('Jira not ready yet (error: ' + err + ', status:' + (response && response.statusCode) + '), retrying..');
        return;
      }
      if (failure) {
        console.log('Could not connect to JIRA: error: ' + err + ', status:' + (response && response.statusCode));
        return error();
      }
      cont();
    });
  })
}

waitForJiraStart(function () {
  const casper = spawn(__dirname + '/node_modules/casperjs/bin/casperjs', [
    '--log-level=debug', '--verbose',
    'setup-jira.js',
    logDir, JSON.stringify(settings)]);

  casper.stdout.pipe(process.stdout);
  casper.stdout.pipe(log);
  casper.stderr.pipe(process.stderr);
  casper.stderr.pipe(log);

  casper.on('close', function (code) {
    log.close();
    process.exit(code);
  });
}, function () {
  log.write('Could not connect to jira at ' + settings.url);
  log.close();
  process.exit(2);
});
