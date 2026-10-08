namespace Application.Dto_s.Enrollment
{
    public class MyCourseDto
    {
        public int EnrollmentId { get; set; }

        public int CourseId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;

        public string? ThumbnailUrl { get; set; }


        public string EnrollmentStatus { get; set; } = string.Empty;

        public DateTime EnrolledAt { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}