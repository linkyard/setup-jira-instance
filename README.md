Setup JIRA Instance
===================

Automatically configure a new JIRA instance with database, license and mail.

Usage:
`docker run -e <...> linkyard/setup-jira-instance`

Where the environment variables are:
* `JIRA_URL`: URL of the JIRA instance (eg `https://jira.mydomain.com/`)
* `JIRA_TITLE`: Name of the JIRA instance
* `PUBLIC_SIGNUP`: Set to `true` to enable public signups
* `LICENSE`: License key (optional)
* `ATLASSIAN_USER`: Atlassian account name. Used to fetch a trial license.
* `ATLASSIAN_PASSWORD`: Password for the Atlassian account. 
* `ATLASSIAN_ORG`: Organization used for the trial license (eg `mycompany`).
* `ADMIN_DISPLAYNAME`: Display Name of the JIRA admin. Defaults to `Administrator`.
* `ADMIN_EMAIL`: EMail address of the JIRA admin
* `ADMIN_USER`: Username for the JIRA administrator (will be created). Defaults to `admin`.
* `ADMIN_PASSWORD`: Password for the JIRA administrator.
* `DB_TYPE`: Type of the database. Defaults to `PostgreSQL`.
* `DB_HOST`: Hostname of the database server.
* `DB_PORT`: Port of the database server. Defaults to `5432`.
* `DB_DATABASE`: Name of the database. Defaults to `postgres`
* `DB_USER`:  Username for the database. Defaults to `postgres`..
* `DB_PASSWORD`: Password for the database user.
* `MAIL_FROM`: Sender for the mails. Defaults to `${ADMIN_EMAIL}`.
* `MAIL_PREFIX`: Prefix for the subject of the mails. Defaults to `[JIRA]`.
* `MAIL_HOST`: Mail host to use for outgoing emails.
* `MAIL_PORT`: Port of the mail server. Defaults to `465` 
* `MAIL_SECURE`: Use secure (TLS) mail. Defaults to `true'.
* `MAIL_USER`: User for the authentication with the mail server (optional)
* `MAIL_PASSWORD`: Password for the authentication with the mail server (optional)
