using Application.Dto_s.Certificate;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/certificates")]
    [Authorize(Roles = "Admin")]
    public class AdminCertificatesController : ControllerBase
    {
        private readonly
            ICertificateService
            _certificateService;


        public AdminCertificatesController(
            ICertificateService certificateService)
        {
            _certificateService =
                certificateService;
        }


        // =========================
        // Issue Certificate
        // Manually
        // =========================

        [HttpPost(
            "enrollments/{enrollmentId:int}/issue")]
        public async Task<
            ActionResult<CertificateDetailsDto>>
            Issue(
                int enrollmentId)
        {
            var certificate =
                await _certificateService
                    .IssueCertificateAsync(
                        enrollmentId
                    );


            return Ok(certificate);
        }
    }
}