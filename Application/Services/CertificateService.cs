using Application.Dto_s.Certificate;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Engagement;
using Domain.Entities.Learning;

namespace Application.Services
{
    public class CertificateService
        : ICertificateService
    {
        private const string CompletedStatus =
            "Completed";


        private readonly
            IGenericRepository<Certificate>
            _certificateRepo;

        private readonly
            IGenericRepository<Enrollment>
            _enrollmentRepo;

        private readonly
            ICertificateRepository
            _certificateDetailsRepo;

        private readonly
            IEnrollmentRepository
            _enrollmentDetailsRepo;

        private readonly
            IGenericRepository<Notification>
            _notificationRepo;


        // =========================
        // Constructor
        // =========================

        public CertificateService(
            IGenericRepository<Certificate> certificateRepo,
            IGenericRepository<Enrollment> enrollmentRepo,
            ICertificateRepository certificateDetailsRepo,
            IEnrollmentRepository enrollmentDetailsRepo,
            IGenericRepository<Notification> notificationRepo)
        {
            _certificateRepo =
                certificateRepo;

            _enrollmentRepo =
                enrollmentRepo;

            _certificateDetailsRepo =
                certificateDetailsRepo;

            _enrollmentDetailsRepo =
                enrollmentDetailsRepo;

            _notificationRepo =
                notificationRepo;
        }


        // =========================
        // Get Certificate By Id
        // =========================

        public async Task<CertificateDetailsDto?>
            GetByIdAsync(
                int id)
        {
            var certificate =
                await _certificateDetailsRepo
                    .GetByIdWithDetailsAsync(
                        id
                    );


            if (certificate == null)
            {
                return null;
            }


            return MapToDetailsDto(
                certificate
            );
        }


        // =========================
        // Get Certificate
        // By Certificate Number
        // =========================

        public async Task<CertificateDetailsDto?>
            GetByCertificateNumberAsync(
                string certificateNumber)
        {
            if (string.IsNullOrWhiteSpace(
                    certificateNumber))
            {
                return null;
            }


            var normalizedNumber =
                certificateNumber
                    .Trim()
                    .ToUpperInvariant();


            var certificate =
                await _certificateDetailsRepo
                    .GetByCertificateNumberWithDetailsAsync(
                        normalizedNumber
                    );


            if (certificate == null)
            {
                return null;
            }


            return MapToDetailsDto(
                certificate
            );
        }


        // =========================
        // Get My Certificates
        // =========================

        public async Task<IEnumerable<CertificateDto>>
            GetMyCertificatesAsync(
                int userId)
        {
            var certificates =
                await _certificateDetailsRepo
                    .GetByUserIdWithDetailsAsync(
                        userId
                    );


            return certificates
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Issue Certificate
        // =========================

        public async Task<CertificateDetailsDto>
            IssueCertificateAsync(
                int enrollmentId)
        {
            // =========================
            // Already Issued?
            // =========================

            var existingCertificate =
                await _certificateDetailsRepo
                    .GetByEnrollmentIdWithDetailsAsync(
                        enrollmentId
                    );


            if (existingCertificate != null)
            {
                return MapToDetailsDto(
                    existingCertificate
                );
            }


            // =========================
            // Get Enrollment
            // =========================

            var enrollment =
                await _enrollmentDetailsRepo
                    .GetByIdWithCourseAsync(
                        enrollmentId
                    );


            if (enrollment == null)
            {
                throw new KeyNotFoundException(
                    "Enrollment was not found."
                );
            }


            // =========================
            // Validate Completion
            // =========================

            if (!string.Equals(
                    enrollment.Status,
                    CompletedStatus,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "The course must be completed before a certificate can be issued."
                );
            }


            if (!enrollment.CompletedAt.HasValue)
            {
                throw new InvalidOperationException(
                    "The enrollment does not have a completion date."
                );
            }


            // =========================
            // Course Supports Certificate?
            // =========================

            if (!enrollment.Course.HasCertificate)
            {
                throw new InvalidOperationException(
                    "This course does not provide a certificate."
                );
            }


            // =========================
            // Generate Certificate Number
            // =========================

            var certificateNumber =
                await GenerateUniqueCertificateNumberAsync();


            var now =
                DateTime.UtcNow;


            // =========================
            // Create Certificate
            // =========================

            var certificate =
                new Certificate
                {
                    EnrollmentId =
                        enrollment.Id,

                    CertificateNumber =
                        certificateNumber,

                    CertificateUrl =
                        null,

                    IssuedAt =
                        now
                };


            await _certificateRepo
                .AddAsync(
                    certificate
                );


            // =========================
            // Certificate Notification
            // =========================

            await _notificationRepo
                .AddAsync(
                    new Notification
                    {
                        UserId =
                            enrollment.UserId,

                        Title =
                            "Certificate Issued",

                        Message =
                            $"Congratulations! Your certificate for {enrollment.Course.Title} has been issued.",

                        Type =
                            "Certificate",

                        IsRead =
                            false,

                        CreatedAt =
                            now
                    }
                );


            // Certificate + Notification
            // are saved together.

            await _certificateRepo
                .SaveChangesAsync();


            // =========================
            // Reload With Full Details
            // =========================

            var createdCertificate =
                await _certificateDetailsRepo
                    .GetByIdWithDetailsAsync(
                        certificate.Id
                    );


            if (createdCertificate == null)
            {
                throw new InvalidOperationException(
                    "Certificate was created but could not be loaded."
                );
            }


            return MapToDetailsDto(
                createdCertificate
            );
        }


        // =========================
        // Generate Unique
        // Certificate Number
        // =========================

        private async Task<string>
            GenerateUniqueCertificateNumberAsync()
        {
            for (var attempt = 0;
                 attempt < 10;
                 attempt++)
            {
                var randomPart =
                    Guid.NewGuid()
                        .ToString("N")
                        .Substring(0, 8)
                        .ToUpperInvariant();


                var certificateNumber =
                    $"CMA-{DateTime.UtcNow.Year}-{randomPart}";


                var exists =
                    await _certificateDetailsRepo
                        .CertificateNumberExistsAsync(
                            certificateNumber
                        );


                if (!exists)
                {
                    return certificateNumber;
                }
            }


            throw new InvalidOperationException(
                "Unable to generate a unique certificate number."
            );
        }


        // =========================
        // Map To CertificateDto
        // =========================

        private static CertificateDto
            MapToDto(
                Certificate certificate)
        {
            return new CertificateDto
            {
                Id =
                    certificate.Id,

                EnrollmentId =
                    certificate.EnrollmentId,

                CertificateNumber =
                    certificate.CertificateNumber,

                CertificateUrl =
                    certificate.CertificateUrl,

                IssuedAt =
                    certificate.IssuedAt
            };
        }


        // =========================
        // Map To Details DTO
        // =========================

        private static CertificateDetailsDto
            MapToDetailsDto(
                Certificate certificate)
        {
            var user =
                certificate.Enrollment.User;

            var course =
                certificate.Enrollment.Course;


            var studentName =
                $"{user.FirstName} {user.LastName}"
                    .Trim();


            if (string.IsNullOrWhiteSpace(
                    studentName))
            {
                studentName =
                    user.Username;
            }


            return new CertificateDetailsDto
            {
                Id =
                    certificate.Id,

                EnrollmentId =
                    certificate.EnrollmentId,

                CertificateNumber =
                    certificate.CertificateNumber,

                CertificateUrl =
                    certificate.CertificateUrl,

                IssuedAt =
                    certificate.IssuedAt,


                CourseId =
                    course.Id,

                CourseTitle =
                    course.Title,


                UserId =
                    user.Id,

                StudentName =
                    studentName,


                CourseCompletedAt =
                    certificate.Enrollment.CompletedAt
            };
        }
    }
}