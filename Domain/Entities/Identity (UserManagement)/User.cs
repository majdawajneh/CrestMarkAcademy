using Domain.Entities.Catalog;
using Domain.Entities.Commerce;
using Domain.Entities.Engagement;
using Domain.Entities.Identity__UserManagement_;
using Domain.Entities.Learning;

namespace Domain.Entities.Identity
{
    public class User
    {
        public int Id { get; set; }

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public bool EmailConfirmed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public UserProfile? UserProfile { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
        public ICollection<Course> InstructorCourses { get; set; } = new List<Course>();
        public ICollection<UserToken> UserTokens { get; set; } = new List<UserToken>();

    }
}
