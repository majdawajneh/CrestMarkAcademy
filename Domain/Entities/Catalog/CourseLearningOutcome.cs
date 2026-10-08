using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Catalog
{
    public class CourseLearningOutcome
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string Outcome { get; set; } = string.Empty;
        public int OrderIndex { get; set; }

        public Course Course { get; set; } = null!;
    }
}
