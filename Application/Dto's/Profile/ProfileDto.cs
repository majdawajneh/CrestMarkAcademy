
namespace Application.Dto_s.Profile
{
    public class ProfileDto
    {
        public int UserId { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public bool EmailConfirmed { get; set; }

        public string? ProfileImageUrl { get; set; }

        public string? Bio { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Country { get; set; }

        public DateTime? DateOfBirth { get; set; }

        // Instructor professional information
        public string? ProfessionalTitle { get; set; }

        public string? Expertise { get; set; }

        public string? Experience { get; set; }

        public string? LinkedInUrl { get; set; }

        public string? GitHubUrl { get; set; }

        public string? WebsiteUrl { get; set; }

        public string? YouTubeUrl { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
