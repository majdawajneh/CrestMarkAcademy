using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto_s.Course
{
    public class CourseListDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;


        public string? ShortDescription { get; set; }

        public string? ThumbnailUrl { get; set; }


        public decimal Price { get; set; }

        public decimal? DiscountPrice { get; set; }


        public string Language { get; set; } = string.Empty;

        public string Level { get; set; } = string.Empty;


        public string CategoryName { get; set; } = string.Empty;

        public string? InstructorName { get; set; }


        public bool IsFeatured { get; set; }


        public int ReviewsCount { get; set; }

        public int EnrollmentCount { get; set; }
    }
}
