
using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Profile
{
    public class UpdateInstructorProfileDto
    {
        [StringLength(150)]
        public string? ProfessionalTitle { get; set; }

        [StringLength(1000)]
        public string? Bio { get; set; }

        [StringLength(1000)]
        public string? Expertise { get; set; }

        [StringLength(3000)]
        public string? Experience { get; set; }

        [StringLength(500)]
        [Url]
        public string? LinkedInUrl { get; set; }

        [StringLength(500)]
        [Url]
        public string? GitHubUrl { get; set; }

        [StringLength(500)]
        [Url]
        public string? WebsiteUrl { get; set; }

        [StringLength(500)]
        [Url]
        public string? YouTubeUrl { get; set; }
    }
}
