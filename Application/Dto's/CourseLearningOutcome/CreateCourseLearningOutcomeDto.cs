using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.Dto_s.CourseLearningOutcome
{
    public class CreateCourseLearningOutcomeDto
    {
        [Required]
        [StringLength(500, MinimumLength = 2)]
        public string Outcome { get; set; } = string.Empty;


        [Range(0, int.MaxValue)]
        public int OrderIndex { get; set; }
    }
}
