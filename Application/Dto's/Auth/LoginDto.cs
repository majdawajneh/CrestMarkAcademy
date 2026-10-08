using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.Auth
{
    public class LoginDto
    {
        [Required]
        [StringLength(150)]
        public string Identifier { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string Password { get; set; } = string.Empty;
    }
}
