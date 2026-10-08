namespace Application.Dto_s.LessonProgress
{
    public class LessonProgressDto
    {
        public int Id { get; set; }

        public int EnrollmentId { get; set; }

        public int LessonId { get; set; }


        public bool IsCompleted { get; set; }

        public DateTime? CompletedAt { get; set; }


        public int LastPositionSeconds { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}