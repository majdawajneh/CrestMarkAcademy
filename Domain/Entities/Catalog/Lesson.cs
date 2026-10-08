using Domain.Entities.Learning;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Catalog
{
    public class Lesson
    {
        public int Id { get; set; }

        public int CourseSectionId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string LessonType { get; set; } = "Video";

        public string? VideoUrl { get; set; }

        public string? AudioUrl { get; set; }

        public string? Content { get; set; }

        public int? DurationSeconds { get; set; }

        public int OrderIndex { get; set; }

        public bool IsPreview { get; set; } = false;

        public bool IsPublished { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }


        // Navigation Properties

        public CourseSection CourseSection { get; set; } = null!;

        public ICollection<LessonResource> LessonResources { get; set; } = new List<LessonResource>();
        public ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
    }
}
