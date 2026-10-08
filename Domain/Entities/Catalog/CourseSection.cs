using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Catalog
{
    public class CourseSection
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int OrderIndex { get; set; }


        // Navigation Properties

        public Course Course { get; set; } = null!;

        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}
