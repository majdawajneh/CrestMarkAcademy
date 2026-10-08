using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.Course
{
    public class CreateCourseDto
    {
        [Required]
        public int CategoryId { get; set; }


        public int? InstructorId { get; set; }


        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Title { get; set; } = string.Empty;


        [StringLength(500)]
        public string? ShortDescription { get; set; }


        [Required]
        public string Description { get; set; } = string.Empty;


        [StringLength(500)]
        public string? ThumbnailUrl { get; set; }


        [StringLength(500)]
        public string? PreviewVideoUrl { get; set; }


        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }


        [Range(0, double.MaxValue)]
        public decimal? DiscountPrice { get; set; }


        [Required]
        [StringLength(50)]
        public string Language { get; set; } = string.Empty;


        [Required]
        [StringLength(50)]
        public string Level { get; set; } = string.Empty;


        public bool IsFeatured { get; set; } = false;


        public bool HasCertificate { get; set; } = false;


        [Range(0, int.MaxValue)]
        public int? EstimatedDurationHours { get; set; }
    }
}
