# sails-hook-mailjet

Email hook for [Sails JS](http://sailsjs.org), using [Mailjet](https://dev.mailjet.com/guides). This was built based on a fork of [sails-hook-email](https://github.com/balderdashy/sails-hook-email).

*Note: This requires Sails v0.10.6+.*

### Installation

`npm install sails-hook-mailjet`

### Usage

`sails.hooks.mailjet.send(template, data, options, cb)`

Parameter      | Type                | Details
-------------- | ------------------- |:---------------------------------
template       | ((string))          | Relative path from `templateDir` (see "Configuration" below) to a folder containing email templates.
data           | ((object))          | Data to use to replace template tokens
options        | ((object))          | Email sending options (see [Mailjet](https://dev.mailjet.com/guides))
cb             | ((function))        | Callback to be run after the email sends (or if an error occurs).

### Configuration

By default, configuration lives in `sails.config.mailjet`.  The configuration key (`mailjet`) can be changed by setting `sails.config.hooks['sails-hook-mailjet'].configKey`.

Parameter      | Type                | Details
-------------- | ------------------- |:---------------------------------
apiKey | ((string)) | Your Mailjet API Key
secretKey | ((string)) | Your Mailjet Secret Key
templateDir | ((string)) | Path to view templates relative to `sails.config.appPath` (defaults to `views/mailjetTemplates`)

### Templates

Templates are generated using your configured Sails [View Engine](http://sailsjs.org/#!/documentation/concepts/Views/ViewEngines.html), allowing for multiple template engines and layouts.  If Sails Views are disabled, will fallback to EJS templates. To define a new email template, create a new folder with the template name inside your `mailjetTemplates` directory, and add an **html.ejs** file inside the folder (substituting .ejs for your template engine).  You may also add an optional `text.ejs` file; if none is provided, we will attempt to create a text version of the email based on the html version.

### Example

Given the following **html.ejs** file contained in the folder **views/mailjetTemplates/testEmail**:

```
<p>Dear <%=recipientName%>,</p>
<br/>
<p><em>Thank you</em> for being a friend.</p>
<p>Love,<br/><%=senderName%></p>
```

executing the following command:

```
sails.hooks.mailjet.send(
  "testEmail",
  {
    recipientName: "Joe",
    senderName: "Sue"
  },
  {
    fromEmail: "somebody@example.com",
    fromName: "John Doe",
    subject: "Hello World",
    recipients : [
      {
        "Email": "other@example.com"
      }
    ]
  },
  function(err) {console.log(err || "It worked!");}
)
```

will result in the following email being sent to `joe@example.com`

> Dear Joe,
>
> *Thank you* for being a friend.
>
> Love,
>
> Sue

with an error being printed to the console if one occurred, otherwise "It worked!".
