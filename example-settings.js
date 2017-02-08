module.exports = {
  url: 'https://jsd.test.linkyard.ch/',
  title: 'linkyard Test instance',
  externalLogin: null,
  public: false,
  trialLicense: {
    user: 'atlassian-trials@linkyard.ch',
    password: 'secret',
    organization: 'linkyard'
  },
  license: 'asdasf323q...',
  admin: {
    displayName: 'Administrator',
    email: 'admin@domain.com',
    user: 'admin',
    password: 'secret'
  },
  db: {
    type: 'PostgreSQL',
    host: 'postgres',
    port: '5432',
    database: 'postgres',
    user: 'postgres',
    password: 'secret'
  },
  mail: {
    from: 'admin@domain.com',
    prefix: '[TEST]',
    host: 'smtp-relay.gmail.com',
    port: 465,
    secure: true,
    user: '',
    password: ''
  }
};
