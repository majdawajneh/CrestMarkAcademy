namespace Application.Dto_s.Certificate
{
    public class CertificateDto
    {
        public int Id { get; set; }

        public int EnrollmentId { get; set; }

        public string CertificateNumber { get; set; } = string.Empty;

        public string? CertificateUrl { get; set; }

        public DateTime IssuedAt { get; set; }
    }
}