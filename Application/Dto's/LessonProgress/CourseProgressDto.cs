namespace Application.Dto_s.LessonProgress
{
    public class CourseProgressDto
    {
        public int CourseId { get; set; }

        public int EnrollmentId { get; set; }


        public int TotalLessons { get; set; }

        public int CompletedLessons { get; set; }


        public double ProgressPercentage { get; set; }


        public bool IsCourseCompleted { get; set; }
    }
}