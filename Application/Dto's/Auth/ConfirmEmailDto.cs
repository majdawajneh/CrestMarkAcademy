using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.Auth
{
    public class ConfirmEmailDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
