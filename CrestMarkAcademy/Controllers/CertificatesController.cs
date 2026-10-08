using Application.Dto_s.Certificate;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/certificates")]
    public class CertificatesController : ControllerBase
    {
        private readonly
            ICertificateService
            _certificateService;


        // =========================
        // Constructor
        // =========================

        public CertificatesController(
            ICertificateService certificateService)
        {
            _certificateService =
                certificateService;
        }


        // =========================
        // Get My Certificates
        // =========================

        [Authorize]
        [HttpGet("my")]
        public async Task<
            ActionResult<IEnumerable<CertificateDto>>>
            GetMyCertificates()
        {
            var userId =
                GetCurrentUserId();


            var certificates =
                await _certificateService
                    .GetMyCertificatesAsync(
                        userId
                    );


            return Ok(certificates);
        }


        // =========================
        // Verify Certificate
        // Public
        // =========================

        [AllowAnonymous]
        [HttpGet("verify/{certificateNumber}")]
        public async Task<
            ActionResult<CertificateDetailsDto>>
            VerifyCertificate(
                string certificateNumber)
        {
            var certificate =
                await _certificateService
                    .GetByCertificateNumberAsync(
                        certificateNumber
                    );


            if (certificate == null)
            {
                return NotFound(new
                {
                    Message =
                        "Certificate was not found."
                });
            }


            return Ok(certificate);
        }


        // =========================
        // Get Current User Id
        // =========================

        private int GetCurrentUserId()
        {
            var userIdClaim =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                userIdClaim,
                out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }


            return userId;
        }
    }
}