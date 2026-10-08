using Domain.Entities.Commerce;
using Domain.Entities.Engagement;
using Domain.Entities.Identity;
using Domain.Entities.Learning;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Catalog
{
    public class Course
    {
        public int Id { get; set; }

        public int CategoryId { get; set; }
        public int? InstructorId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;

        public string? ShortDescription { get; set; }
        public string Description { get; set; } = string.Empty;

        public string? ThumbnailUrl { get; set; }
        public string? PreviewVideoUrl { get; set; }

        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }

        public string Language { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft";

        public bool IsFeatured { get; set; } = false;
        public bool HasCertificate { get; set; } = false;

        public int? EstimatedDurationHours { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }

        public Category Category { get; set; } = null!;

        public User? Instructor { get; set; }

        public ICollection<CourseSection> CourseSections { get; set; } = new List<CourseSection>();

        public ICollection<CourseRequirement> Requirements { get; set; } = new List<CourseRequirement>();

        public ICollection<CourseLearningOutcome> LearningOutcomes { get; set; } = new List<CourseLearningOutcome>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<CouponCourse> CouponCourses { get; set; } = new List<CouponCourse>();


    }
}
