using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto_s.CourseSection
{
    public class CourseSectionDto
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int OrderIndex { get; set; }
    }
}
