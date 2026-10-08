using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Learning
{
    public class Certificate
    {
        public int Id { get; set; }

        public int EnrollmentId { get; set; }

        public string CertificateNumber { get; set; } = string.Empty;

        public string? CertificateUrl { get; set; }

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;


        // Navigation Property

        public Enrollment Enrollment { get; set; } = null!;
    }
}
