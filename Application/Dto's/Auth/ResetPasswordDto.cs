using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.Auth
{
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;


        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string NewPassword { get; set; } = string.Empty;


        [Required]
        [Compare(
            nameof(NewPassword),
            ErrorMessage = "Passwords do not match."
        )]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
