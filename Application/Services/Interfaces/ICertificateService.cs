
using Application.Dto_s.Certificate;

namespace Application.Services.Interfaces
{
    public interface ICertificateService
    {
        // =========================
        // Admin: Get All Certificates
        // =========================

        Task<IEnumerable<CertificateDetailsDto>>
            GetAllAsync();

        // =========================
        // Get Certificate By ID
        // =========================

        Task<CertificateDetailsDto?>
            GetByIdAsync(int id);

        // =========================
        // Get Student Certificate By ID
        // =========================

        Task<CertificateDetailsDto?>
            GetMyCertificateByIdAsync(
                int userId,
                int certificateId);

        // =========================
        // Get Certificate By Number
        // =========================

        Task<CertificateDetailsDto?>
            GetByCertificateNumberAsync(
                string certificateNumber);

        // =========================
        // Get My Certificates
        // =========================

        Task<IEnumerable<CertificateDto>>
            GetMyCertificatesAsync(int userId);

        // =========================
        // Issue Certificate
        // =========================

        Task<CertificateDetailsDto>
            IssueCertificateAsync(int enrollmentId);
    }
}
