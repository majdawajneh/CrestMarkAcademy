using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto_s.Auth
{
    public class RegisterResponseDto
    {
        public int UserId { get; set; }

        public string Email { get; set; } = string.Empty;

        public bool EmailSent { get; set; }

        public string Message { get; set; } = string.Empty;
    }
}
