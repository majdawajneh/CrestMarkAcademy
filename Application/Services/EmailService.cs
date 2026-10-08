using Application.Services.Interfaces;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;


        public EmailService(
            IOptions<EmailSettings> options)
        {
            _settings = options.Value;
        }


        public async Task SendEmailAsync(
            string toEmail,
            string subject,
            string htmlBody)
        {
            var email = new MimeMessage();


            email.From.Add(
                new MailboxAddress(
                    _settings.FromName,
                    _settings.FromEmail
                )
            );


            email.To.Add(
                MailboxAddress.Parse(
                    toEmail
                )
            );


            email.Subject = subject;


            email.Body =
                new BodyBuilder
                {
                    HtmlBody = htmlBody
                }
                .ToMessageBody();


            using var smtp = new MailKit.Net.Smtp.SmtpClient();


            await smtp.ConnectAsync(
                _settings.Host,
                _settings.Port,
                SecureSocketOptions.StartTls
            );


            await smtp.AuthenticateAsync(
                _settings.Username,
                _settings.Password
            );


            await smtp.SendAsync(email);

            await smtp.DisconnectAsync(true);
        }
    }
}
