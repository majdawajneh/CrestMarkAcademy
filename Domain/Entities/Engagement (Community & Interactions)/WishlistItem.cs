using Domain.Entities.Catalog;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Engagement
{
    public class WishlistItem
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int CourseId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        // Navigation Properties

        public User User { get; set; } = null!;

        public Course Course { get; set; } = null!;
    }
}
