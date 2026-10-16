
using Domain.Entities.Learning;

namespace Application.Repositories.Interfaces
{
    public interface ICertificateRepository
    {
        // Get all certificates with student and course details
        Task<IEnumerable<Certificate>> GetAllWithDetailsAsync();

        // Get certificate by ID
        Task<Certificate?> GetByIdWithDetailsAsync(int id);

        // Get certificate by enrollment
        Task<Certificate?> GetByEnrollmentIdWithDetailsAsync(
            int enrollmentId);

        // Get certificate by certificate number
        Task<Certificate?> GetByCertificateNumberWithDetailsAsync(
            string certificateNumber);

        // Get certificates belonging to one student
        Task<IEnumerable<Certificate>> GetByUserIdWithDetailsAsync(
            int userId);

        // Check certificate number uniqueness
        Task<bool> CertificateNumberExistsAsync(
            string certificateNumber);
    }
}
