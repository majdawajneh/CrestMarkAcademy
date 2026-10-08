using Domain.Entities.Catalog;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Learning
{
    public class LessonProgress
    {
        public int Id { get; set; }

        public int EnrollmentId { get; set; }

        public int LessonId { get; set; }

        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedAt { get; set; }

        public int LastPositionSeconds { get; set; } = 0;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        // Navigation Properties

        public Enrollment Enrollment { get; set; } = null!;

        public Lesson Lesson { get; set; } = null!;
    }
}
