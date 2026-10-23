using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Auth
{
    public class AcceptInstructorInvitationDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        [MaxLength(128)]
        public string Password { get; set; } = string.Empty;
    }
}