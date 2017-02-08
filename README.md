Setup JIRA Instance
===================

Automatically configure a new JIRA instance with database, license and mail. This is useful
for fully automated deployments such as inside a Kubernetes cluster.

To deploy jira itself please use the [great images by cptactionhank](https://hub.docker.com/r/cptactionhank/atlassian-jira/).

Usage:
`docker run -e <...> linkyard/setup-jira-instance`

Where the environment variables are:
* `JIRA_URL`: URL of the JIRA instance (eg `https://jira.mydomain.com/`)
* `JIRA_TITLE`: Name of the JIRA instance
* `EXTERNAL_LOGIN`: URL of the external login provider. Used to not fail if redirected to this on the start page after the configuration is done. (optional)
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



Example kubernetes job definition

    apiVersion: batch/v1
    kind: Job
    metadata:
      name: setup-jira
    spec:
      template:
        metadata:
          name: setup-jira
        spec:
          restartPolicy: OnFailure
          containers:
          - name: setup-jira
            image: linkyard/setup-jira-instance:latest
            imagePullPolicy: Always
            env:
            - name: JIRA_URL
              value: https://my-jira-instance.com
            - name: JIRA_TITLE
              value: The name that my jira instance should have
            - name: ATLASSIAN_USER
              value: myaccount@email.com
            - name: ATLASSIAN_PASSWORD
              value: secret
            - name: ATLASSIAN_ORG
              value: My Company
            - name: PUBLIC_SIGNUP
              value: "false"
            - name: ADMIN_USER
              valueFrom:
                secretKeyRef:
                  name: jira-secret
                  key: adminUser
            - name: ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: jira-secret
                  key: adminPassword
            - name: ADMIN_EMAIL
              value: admin@mycompany.com
            - name: DB_TYPE
              value: PostgreSQL
            - name: DB_HOST
              value: postgres
            - name: DB_POST
              value: "5432"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: MAIL_PREFIX
              value "[JIRA]"
            - name: MAIL_HOST
              value: smtp-relay.gmail.com
            - name: MAIL_PORT
              value: "465"

Enjoy!