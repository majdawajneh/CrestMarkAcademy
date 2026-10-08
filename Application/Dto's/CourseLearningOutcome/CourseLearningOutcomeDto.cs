using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto_s.CourseLearningOutcome
{
    public class CourseLearningOutcomeDto
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string Outcome { get; set; } = string.Empty;

        public int OrderIndex { get; set; }
    }
}
