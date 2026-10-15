
using Application.Dto_s.Certificate;

namespace Application.Services.Interfaces
{
    public interface ICertificatePdfService
    {
        byte[] GenerateCertificate(
            CertificateDetailsDto certificate
        );
    }
}
