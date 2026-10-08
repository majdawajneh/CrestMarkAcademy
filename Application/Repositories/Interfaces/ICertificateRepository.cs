using Domain.Entities.Learning;

namespace Application.Repositories.Interfaces
{
    public interface ICertificateRepository
    {
        Task<Certificate?>
            GetByIdWithDetailsAsync(int id);


        Task<Certificate?>
            GetByEnrollmentIdWithDetailsAsync(
                int enrollmentId
            );


        Task<Certificate?>
            GetByCertificateNumberWithDetailsAsync(
                string certificateNumber
            );


        Task<IEnumerable<Certificate>>
            GetByUserIdWithDetailsAsync(
                int userId
            );


        Task<bool>
            CertificateNumberExistsAsync(
                string certificateNumber
            );
    }
}