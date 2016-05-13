/**
 * Module dependencies
 */

var ejs   = require('ejs');
var fs    = require('fs');
var path  = require('path');
var async = require('async');
var _     = require('lodash');

/**
 * Mailjet Hook
 *
 * Integration with relevant parts of the Mailjet API.
 *
 * For a full list of available email options see:
 * https://dev.mailjet.com/guides/
 *
 * @param  {App} sails
 * @return {Object}
 * @hook
 */

module.exports = function mailjet(sails) {

  var self;

  var compileTemplate = function (view, data, cb) {
    // Use Sails View Hook if available
    if (sails.hooks.views && sails.hooks.views.render) {
      var relPath = path.relative(sails.config.paths.views, view);
      sails.hooks.views.render(relPath, data, cb);
      return;
    }

    // No Sails View hook, fallback to ejs
    fs.readFile(view + '.ejs', function (err, source) {
      if (err) return cb(err);

      try {
        var compileFn = ejs.compile((source || "").toString(), {
          cache: true, filename: view
        });

        cb(null, compileFn(data));
      } catch (e) {
        return cb(e);
      }
    });
  };

  return {

    /**
     * Default configuration
     * @type {Object}
     */
    defaults: {
      __configKey__: {
        apiKey      : 'SOME_MAILJET_API_KEY',
        secretKey   : 'SOME_MAILJET_SECRET_KEY',
        templateDir : path.resolve(sails.config.appPath, 'views/mailjetTemplates')
      }
    },

    configure: function () {
      // Ensure we have the full path, relative to app directory
      sails.config[this.configKey].templateDir = path.resolve(sails.config.appPath, sails.config[this.configKey].templateDir);
    },

    /**
     * @param  {Function} cb
     */
    initialize: function (cb) {
      self = this;

      return cb();
    },

    /**
     * Send an email.
     * @param  {Sting}    template (a named template to render)
     * @param  {Object}   data (data to pass into the template)
     * @param  {Object}   options (email options including to, from, etc)
     * @param  {Function} cb
     */

    send: function (template, data, options, cb) {

      data = data || {};
      // Turn off layouts by default
      if (typeof data.layout === 'undefined') data.layout = false;

      var templateDir = sails.config[self.configKey].templateDir;
      var templatePath = path.join(templateDir, template);

      sails.log.verbose('EMAILING:', options);

      async.auto({

        // Grab the HTML version of the email template
        compileHtmlTemplate: function (next) {
          compileTemplate(templatePath + "/html", data, next);
        },

        // Grab the Text version of the email template
        compileTextTemplate: function (next) {
          compileTemplate(templatePath + "/text", data, function (err, html) {
            // Don't exit out if there is an error, we can generate plaintext
            // from the HTML version of the template.
            if (err) return next();
            next(null, html);
          });
        },

        // Send the email
        sendEmail: ['compileHtmlTemplate', 'compileTextTemplate', function (next, results) {

          var htmlEmail = results.compileHtmlTemplate;
          console.log(htmlEmail);
          var textEmail = '';

          if (results.compileTextTemplate) {
            textEmail.text = results.compileTextTemplate;
          } else {
            var htmlToText = require('html-to-text');

            var textEmail = htmlToText.fromString(htmlEmail, {
              wordwrap: 130
            });
            console.log(textEmail);
          }

          // `options`, e.g.
          // {
          //   fromEmail: "somebody@example.com",
          //   fromName: "John Doe",
          //   subject: "Hello World",
          //   recipients : [
          //     {
          //       "Email": "other@example.com"
          //     }
          //   ]
          // }

          var mailjet = require ('node-mailjet')
            .connect(sails.config[self.configKey].apiKey, sails.config[self.configKey].secretKey);

          var request = mailjet
            .post("send")
            .request({
              "FromEmail"  : options.fromEmail,
              "FromName"   : options.fromName,
              "Subject"    : options.subject,
              "Html-part"  : htmlEmail,
              "Text-part"  : textEmail,
              "Recipients" : options.recipients
            });

          request
            .on('success', function (response, body) {
              return (null, response, body);
            })
            .on('error', function (err, response) {
              return (err, response);
            });
        }]

      },

      // ASYNC callback
      function (err, results) {
        if (err) return cb(err);
        cb(null, results.sendEmail);
      });
    }

  };
};
