using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Identity
{
    public class RefreshToken
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }
        public bool IsRevoked { get; set; } = false;

        public User User { get; set; } = null!;

    }
}
