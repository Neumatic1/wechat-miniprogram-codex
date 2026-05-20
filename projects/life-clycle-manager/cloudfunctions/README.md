# Cloud Functions

## `lifeCycleSync`

Deploy this cloud function from WeChat DevTools before testing login and sync:

1. Open the Cloud panel and create/select a cloud environment.
2. Right-click `cloudfunctions/lifeCycleSync`.
3. Choose `Upload and Deploy: Cloud Install Dependencies`.

The function stores each user's synced data in the `lifeCycleProfiles` collection using the current WeChat account `OPENID` as the document id.

Feedback submitted from the mini program is stored in the `lifeCycleFeedbacks` collection, and uploaded screenshots are saved under the cloud storage directory `life-cycle-feedbacks/`.

## Feedback Email Notification

Feedback email notification uses QQ SMTP.

Set these environment variables for the `lifeCycleSync` cloud function before deploying if you want mail alerts:

1. `FEEDBACK_SMTP_USER`
   Usually your QQ mailbox address. If omitted, it falls back to `1808438939@qq.com`.
2. `FEEDBACK_SMTP_PASS`
   Your QQ mailbox SMTP authorization code. Do not use the QQ account login password directly.
3. `FEEDBACK_NOTIFY_EMAIL`
   Optional recipient address. If omitted, it falls back to `1808438939@qq.com`.

If mail configuration is missing or sending fails, feedback is still saved to `lifeCycleFeedbacks`; only the email alert is skipped.
