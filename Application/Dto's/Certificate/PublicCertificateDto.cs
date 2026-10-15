
namespace Application.Dto_s.Certificate
{
    public class PublicCertificateDto
    {
        public string CertificateNumber { get; set; }
            = string.Empty;

        public string StudentName { get; set; }
            = string.Empty;

        public string CourseTitle { get; set; }
            = string.Empty;

        public DateTime IssuedAt { get; set; }

        public DateTime? CourseCompletedAt { get; set; }
    }
}
