using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Identity
{
    public class UserProfile
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string? ProfileImageUrl { get; set; }

        public string? Bio { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Country { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public User User { get; set; } = null!;
    }
}
