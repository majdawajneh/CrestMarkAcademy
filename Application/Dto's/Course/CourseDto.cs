using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto_s.Course
{
    public class CourseDto
    {
        public int Id { get; set; }


        public int CategoryId { get; set; }

        public string CategoryName { get; set; } = string.Empty;


        public int? InstructorId { get; set; }

        public string? InstructorName { get; set; }


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

        public string Status { get; set; } = string.Empty;


        public bool IsFeatured { get; set; }

        public bool HasCertificate { get; set; }


        public int? EstimatedDurationHours { get; set; }


        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public DateTime? PublishedAt { get; set; }
    }
}
