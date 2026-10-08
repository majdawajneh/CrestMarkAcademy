namespace Application.Dto_s.Enrollment
{
    public class EnrollmentDto
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int CourseId { get; set; }

        public DateTime EnrolledAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}