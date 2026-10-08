using Domain.Entities.Identity;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Identity__UserManagement_
{
    public class UserToken
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string TokenHash { get; set; } = string.Empty;

        public UserTokenPurpose Purpose { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public DateTime? UsedAt { get; set; }

        public bool IsUsed { get; set; } = false;


        // Navigation Property
        public User User { get; set; } = null!;
    }
}
