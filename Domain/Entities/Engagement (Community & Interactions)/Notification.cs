using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Engagement
{
    public class Notification
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }


        // Navigation Property

        public User User { get; set; } = null!;
    }
}
