using Domain.Entities.Catalog;
using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Learning
{
    public class Enrollment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int CourseId { get; set; }
        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = "Active";


        // Navigation Properties

        public User User { get; set; } = null!;
        public Course Course { get; set; } = null!;
        public ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
        public Certificate? Certificate { get; set; }
    }
}
