namespace Application.Dto_s.Certificate
{
    public class CertificateDetailsDto
    {
        public int Id { get; set; }

        public int EnrollmentId { get; set; }


        public string CertificateNumber { get; set; } = string.Empty;

        public string? CertificateUrl { get; set; }


        public DateTime IssuedAt { get; set; }


        public int CourseId { get; set; }

        public string CourseTitle { get; set; } = string.Empty;


        public int UserId { get; set; }

        public string StudentName { get; set; } = string.Empty;


        public DateTime? CourseCompletedAt { get; set; }
    }
}