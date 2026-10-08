namespace Application.Dto_s.User
{
    public class AdminUserDetailsDto
    {
        public int Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public bool EmailConfirmed { get; set; }

        public List<string> Roles { get; set; } = new();

        public string? ProfileImageUrl { get; set; }

        public string? Bio { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Country { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}