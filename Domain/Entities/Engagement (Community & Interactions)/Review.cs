using Domain.Entities.Catalog;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Engagement
{
    public class Review
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int CourseId { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }


        // Navigation Properties

        public User User { get; set; } = null!;

        public Course Course { get; set; } = null!;
    }
}
