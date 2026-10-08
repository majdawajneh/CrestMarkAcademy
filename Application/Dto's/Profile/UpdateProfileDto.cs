using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Profile
{
    public class UpdateProfileDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? ProfileImageUrl { get; set; }

        [StringLength(1000)]
        public string? Bio { get; set; }

        [StringLength(30)]
        public string? PhoneNumber { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        public DateTime? DateOfBirth { get; set; }
    }
}