
using System;

namespace Domain.Entities.Identity
{
    public class UserProfile
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        // General profile
        public string? ProfileImageUrl { get; set; }

        public string? Bio { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Country { get; set; }

        public DateTime? DateOfBirth { get; set; }

        // Instructor professional profile
        public string? ProfessionalTitle { get; set; }

        public string? Expertise { get; set; }

        public string? Experience { get; set; }

        // Instructor social links
        public string? LinkedInUrl { get; set; }

        public string? GitHubUrl { get; set; }

        public string? WebsiteUrl { get; set; }

        public string? YouTubeUrl { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
