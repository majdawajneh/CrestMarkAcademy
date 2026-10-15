using Application.Dto_s.Certificate;

namespace Application.Services.Interfaces
{
    public interface ICertificateService
    {
        Task<CertificateDetailsDto?>
            GetByIdAsync(int id);


        Task<CertificateDetailsDto?>GetMyCertificateByIdAsync(int userId,int certificateId);



        Task<CertificateDetailsDto?>
            GetByCertificateNumberAsync(
                string certificateNumber
            );


        Task<IEnumerable<CertificateDto>>
            GetMyCertificatesAsync(
                int userId
            );


        Task<CertificateDetailsDto>
            IssueCertificateAsync(
                int enrollmentId
            );
    }
}