using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.CourseRequirement
{
    public class UpdateCourseRequirementDto
    {
        [Required]
        [StringLength(500, MinimumLength = 2)]
        public string Requirement { get; set; } = string.Empty;


        [Range(0, int.MaxValue)]
        public int OrderIndex { get; set; }
    }
}
