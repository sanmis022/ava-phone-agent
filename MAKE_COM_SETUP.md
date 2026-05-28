# make.com Configuration for Ava Phone Agent

## Setting Up the Webhook Receiver

### Step 1: Create HTTP Webhook Module in make.com

1. Create a new scenario in make.com
2. Add an **HTTP** webhook trigger
3. Select **Webhooks** > **Custom webhook**
4. Give it a name: `Ava Phone Agent`
5. Copy the webhook URL that generates
6. Add it to your `.env` as `MAKE_WEBHOOK_URL`

### Step 2: Configure Email Module

After the webhook, add an **Email** module:

**Module: Send an email**

Set the fields like this:

| Field | Value |
|-------|-------|
| **To** | `{{1.email}}` (from webhook body) |
| **Subject** | `New inquiry from {{1.name}}` |
| **Text body** | See template below |

### Step 3: Email Template

For the email text body, use:

```
Hello Team,

New contact inquiry received:

Name: {{1.name}}
Email: {{1.email}}
Inquiry: {{1.reason}}
Received: {{1.timestamp}}

Please follow up with this lead.

Best regards,
Ava Phone Agent
```

## JSON Format Received

Your make.com webhook will receive this JSON:

```json
{
  "name": "John Smith",
  "email": "john.smith@company.com",
  "reason": "Interested in pricing for your premium plan",
  "timestamp": "2024-01-15T14:30:45.123Z"
}
```

## Advanced: Store in Google Sheets

If you want to log all inquiries, add a **Google Sheets** module after email:

1. Connect your Google account
2. Select spreadsheet and sheet
3. Map the fields:
   - Column A: `{{1.name}}`
   - Column B: `{{1.email}}`
   - Column C: `{{1.reason}}`
   - Column D: `{{1.timestamp}}`

## Advanced: Send to CRM

To send to your CRM instead of email:

1. Replace the Email module with your CRM's module (Salesforce, HubSpot, etc.)
2. Map the fields to your CRM contact fields
3. The data structure is the same

## Testing

1. Click "Test" in your make.com scenario
2. Call your Twilio number
3. Complete the conversation (name ? email ? reason)
4. Check make.com logs to see the webhook hit
5. Verify email was sent

## Troubleshooting

**Webhook not receiving data?**
- Check that `MAKE_WEBHOOK_URL` is correctly set in `.env`
- Verify the webhook URL hasn't expired
- Check OpenAI console logs for tool execution

**Email not sending?**
- Verify Email module credentials are correct
- Check make.com execution logs
- Make sure recipient email format is valid

**Wrong data in email?**
- Use `{{1.field_name}}` to reference webhook JSON fields
- Check the exact field names match (case-sensitive)
