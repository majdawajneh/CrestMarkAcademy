namespace Application.Dto_s.User
{
    public class AdminUserListDto
    {
        public int Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public bool EmailConfirmed { get; set; }

        public List<string> Roles { get; set; } = new();

        public DateTime CreatedAt { get; set; }
    }
}