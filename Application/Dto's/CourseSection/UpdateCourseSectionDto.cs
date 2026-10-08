using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.CourseSection
{
    public class UpdateCourseSectionDto
    {
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Title { get; set; } = string.Empty;


        [StringLength(1000)]
        public string? Description { get; set; }


        [Range(0, int.MaxValue)]
        public int OrderIndex { get; set; }
    }
}
