using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services
{
    public class EmailSettings
    {
        public string Host { get; set; } = string.Empty;

        public int Port { get; set; }

        public string FromName { get; set; } = string.Empty;

        public string FromEmail { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}
