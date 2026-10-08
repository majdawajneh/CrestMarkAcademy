using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto_s.CourseRequirement
{
    public class CourseRequirementDto
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string Requirement { get; set; } = string.Empty;

        public int OrderIndex { get; set; }
    }
}
