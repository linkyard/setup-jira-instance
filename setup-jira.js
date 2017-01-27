const casper = require('casper').create();
casper.on('error', function (err) {
  console.log('An error occurred', err);
});


const logdir = casper.cli.args[0];
const config = casper.cli.args[1];
const settings = JSON.parse(config);

function assert(cond, message) {
  if (!cond) {
    casper.capture(logdir + '/error.png');
    console.log(message);
    casper.exit(1);
  }
}
function onTimeout(waitingFor) {
  return function () {
    casper.capture(logdir + '/error.png');
    const url = this.getCurrentUrl();
    console.log('Timeout occurred on page ' + url + ' while ' + waitingFor);
    casper.exit(1);
  }
}


if (!settings || !settings.url) {
  console.log('Missing settings');
  throw new Error('Missing settings');
}
console.log('Will connect to the JIRA instance running at ' + settings.url);

casper.start(settings.url);
casper.then(function () {
  const url = this.getCurrentUrl();
  if (url.match(/.*\/secure\/SetupMode!default\.jspa$/)) {
    setupDatabase();
  } else if (url.match(/.*\/secure\/SetupApplicationProperties!default\.jspa$/)) {
    setupApplicationProperties();
  } else if (url.match(/\/secure\/SetupAdminAccount!default\.jspa$/)) {
    setupAdminAccount();
  } else if (url.match(/\/secure\/Dashboard\.jspa$/)) {
    casper.capture(logdir + '/protocol-6-done.png');
    this.echo('This jira instance is already set up, did not change the configuration.')
  } else {
    assert(false, 'Invalid initial state of jira: ' + url);
  }
});

function setupDatabase() {
  casper.then(function () {
    assert(
      this.getCurrentUrl().match(/.*\/secure\/SetupMode!default\.jspa$/),
      'JIRA is already set up (' + this.getCurrentUrl() + ')');
    assert(
      this.exists('div[data-choice-value=classic]'),
      'Unexpected setup screen'
    );
    this.click('div[data-choice-value=classic]');
  });

  casper.then(function () {
    this.click('#jira-setup-mode-submit');
    this.waitForUrl(/\/secure\/SetupDatabase!default\.jspa$/, function () {
    }, onTimeout('DB Setup page'), 60000);
  });

  casper.then(function () {
    this.echo('Setting up the database...');
    this.click('#jira-setup-database-field-database-external');
    this.fillSelectors('form#jira-setup-database', {
      '#jira-setup-database-field-database-type-field': settings.db.type
    });
    this.fill('form#jira-setup-database', {
      'jdbcHostname': settings.db.host,
      'jdbcPort': settings.db.port,
      'jdbcDatabase': settings.db.database,
      'jdbcUsername': settings.db.user,
      'jdbcPassword': settings.db.password
    });
    this.click('#jira-setup-database-test-connection');
  });

  casper.then(function () {
    this.waitForSelectorTextChange('.jira-setup-global-messages', function () {
      this.capture(logdir + '/protocol-1-db.png');
      const text = this.fetchText('.jira-setup-global-messages');
      assert(
        text === 'The database connection test was successful.',
        'Could not connect to the database: ' + text);
      this.click('#jira-setup-database-submit');
    }, onTimeout('DB Connection Test'), 30000);
  });

  casper.then(function () {
    this.waitForUrl(/\/secure\/SetupApplicationProperties!default\.jspa$/, function () {
    }, onTimeout('Application properties page'), 120000);
  });

  setupApplicationProperties();
}

function setupApplicationProperties() {
  casper.then(function () {
    assert(
      this.getCurrentUrl().match(/.*\/secure\/SetupApplicationProperties!default\.jspa$/),
      'Wrong state to set application properties (' + this.getCurrentUrl() + ')');
    this.echo("Setting application properties...");
    if (settings.public) {
      this.click('#jira-setupwizard-mode-public');
    }
    this.fill('form#jira-setupwizard', {
      'title': settings.title
    });
    this.capture(logdir + '/protocol-2-application-props.png');
    this.click('#jira-setupwizard-submit');
  });
  casper.then(function () {
    this.waitForUrl(/\/secure\/SetupLicense!default\.jspa$/, function () {
    }, onTimeout('License page'), 20000);
  });

  applyLicense();
}

function applyLicense() {
  casper.then(function () {
    assert(
      this.getCurrentUrl().match(/.*\/secure\/SetupLicense!default\.jspa$/),
      'Wrong state to add license (' + this.getCurrentUrl() + ')');

    if (settings.license) {
      this.echo('Setting up provided license...');
      this.fill('form#importLicenseForm', {
        'licenseKey': settings.license
      }, true);
      this.capture(logdir + '/protocol-3-license.png');
    } else if (settings.trialLicense) {
      this.echo("Generating trial license...");
      this.click('#generate-mac-license');
      this.waitForUrl(/^https:\/\/id.atlassian.com/, function () {
        //login
        this.fill('form#form-login', {
          username: settings.trialLicense.user
        });
        this.click('#login-submit');
        this.waitUntilVisible('#password', function () {
          this.fill('form#form-login', {
            password: settings.trialLicense.password
          });
          this.click('#login-submit');
          this.waitForUrl(/^https:\/\/my.atlassian.com\/license\/evaluation/, function () {
            this.fill('form[action="/license/evaluation"]', {
              orgname: settings.trialLicense.organization
            });
            if (this.exists('#sixmontheval')) {
              this.click('#sixmontheval');
            }
            if (this.exists('label[for="jira"]')) {
              this.click('label[for="jira"]');
            }
            if (this.exists('label[for="jira-core"]')) {
              this.click('label[for="jira-core"]');
            }
            if (this.exists('label[for="jira-servicedesk"]')) {
              this.click('label[for="jira-servicedesk"]');
            }
            if (this.exists('label[for="jira-software"]')) {
              this.click('label[for="jira-software"]');
            }
            this.capture(logdir + '/protocol-3-request-trial-license.png');
            this.click('#generate-license');
            this.waitForUrl(/^https:\/\/my.atlassian.com\/products\/index/, function () {
              this.echo("Applying trial license...");
              this.clickLabel('Yes');
              this.waitForUrl(/\/secure\/SetupLicense!default\.jspa$/, function () {
                this.capture(logdir + '/protocol-3-license.png');
                const license = this.fetchText('#licenseKey');
                this.echo('Generated trial license key: ' + license);
                this.click('input[type="submit"]');
              }, onTimeout('Setup License Page (apply trial)'), 120000);
            });
          }, onTimeout('Atlassian License page'), 20000);
        });
      }, onTimeout('Atlassian Login page'), 10000);
    } else {
      assert(false, 'Neither license nor trialLicense is set.');
    }
  });
  casper.then(function () {
    this.waitForUrl(/\/secure\/SetupAdminAccount!default\.jspa$/, function () {
    }, onTimeout('Setup Admin Account page'), 200000);
  });

  setupAdminAccount();
}

function setupAdminAccount() {
  casper.then(function () {
    assert(
      this.getCurrentUrl().match(/.*\/secure\/SetupAdminAccount!default\.jspa$/),
      'Wrong state to add license (' + this.getCurrentUrl() + ')');

    const title = this.fetchText('.form-body h2').trim();
    if (title === 'Set up email notifications') {
      this.echo('Admin account is already set up. Skipping.');
      return setupMail();
    }

    this.echo('Setting up the admin account...');
    this.fill('#jira-setupwizard', {
      fullname: settings.admin.displayName,
      email: settings.admin.email,
      username: settings.admin.user,
      password: settings.admin.password,
      confirm: settings.admin.password
    });
    this.capture(logdir + '/protocol-4-admin.png');
    this.click('input[type="submit"]');

    this.waitForSelector('#jira-setupwizard-email-notifications-enabled', function () {
      setupMail();
    }, onTimeout('Setup Mail page'), 30000);
  });
}

function setupMail() {
  casper.then(function () {
    this.echo('Setting up the mail...');

    if (settings.mail) {
      this.click('#jira-setupwizard-email-notifications-enabled');
      this.fill('#jira-setupwizard', {
        from: settings.mail.from,
        prefix: settings.mail.prefix,
        serverName: settings.mail.host,
        port: settings.mail.port,
        protocol: settings.mail.secure ? 'smtps' : 'smtp',
        tlsRequired: settings.mail.secure,
        username: settings.mail.user,
        password: settings.mail.password
      });
      this.click('#jira-setupwizard-test-mailserver-connection');
      this.waitForSelectorTextChange('#test-connection-messages', function () {
        this.capture(logdir + '/protocol-5-mail.png');
        const text = this.fetchText('#test-connection-messages').trim();
        assert(
          text.indexOf('The connection was successful.') === 0,
          'Could not connect to the mail server: ' + text);
        this.click('#jira-setupwizard-submit');
      }, onTimeout('Test Mail Server connection'), 30000);
    } else {
      this.click('#jira-setupwizard-submit');
    }
  });
  casper.then(function () {
    this.waitForUrl(/\/secure\/(WelcomeToJIRA|Dashboard)\.jspa$/, function () {
      this.capture(logdir + '/protocol-6-done.png');
      this.echo('JIRA is now set up and ready to use.');
    }, onTimeout('Welcome to JIRA page'), 120000);
  });
}

casper.run();
