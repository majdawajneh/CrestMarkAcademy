using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Catalog
{
    public class CourseRequirement
    {
        public int Id { get; set;}
        public int CourseId { get; set; }
        public string Requirement { get; set; } = string.Empty;
        public int OrderIndex { get; set; }

        public Course Course { get; set; } = null!;
    }
}
