using Application.Dto_s.Certificate;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;


namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/certificates")]
    public class CertificatesController : ControllerBase
    {
        private readonly
            ICertificateService
            _certificateService;


        private readonly ICertificatePdfService _certificatePdfService;


        // =========================
        // Constructor
        // =========================

        public CertificatesController(
            ICertificateService certificateService,
            ICertificatePdfService certificatePdfService)
        {
            _certificateService =
                certificateService;

            _certificatePdfService =
                certificatePdfService;
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




        // =====================================
        // Get My Certificate By ID
        // =====================================

        [Authorize]
        [HttpGet("my/{id:int}")]
        public async Task<ActionResult<CertificateDetailsDto>>
            GetMyCertificateById(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    Message = "Invalid certificate ID."
                });
            }

            var userId = GetCurrentUserId();

            var certificate = await _certificateService
                .GetMyCertificateByIdAsync(userId, id);

            if (certificate == null)
            {
                return NotFound(new
                {
                    Message = "Certificate was not found."
                });
            }

            return Ok(certificate);
        }



        // =====================================
        // Download My Certificate As PDF
        // =====================================

        [Authorize]
        [HttpGet("my/{id:int}/download")]
        public async Task<IActionResult> DownloadMyCertificate(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    Message = "Invalid certificate ID."
                });
            }

            var userId = GetCurrentUserId();

            // Verify certificate ownership before generating PDF.
            var certificate = await _certificateService
                .GetMyCertificateByIdAsync(userId, id);

            if (certificate == null)
            {
                return NotFound(new
                {
                    Message = "Certificate was not found."
                });
            }

            var pdfBytes = _certificatePdfService
                .GenerateCertificate(certificate);

            var fileName =
                $"CrestMark-Certificate-{certificate.CertificateNumber}.pdf";

            Response.Headers.CacheControl = "private, no-store";

            return File(
                pdfBytes,
                "application/pdf",
                fileName
            );
        }



        // =========================
        // Verify Certificate
        // Public
        // =========================

        [AllowAnonymous]
        [EnableRateLimiting("certificate-verification")]
        [HttpGet("verify/{certificateNumber}")]
        public async Task<ActionResult<PublicCertificateDto>>
            VerifyCertificate(string certificateNumber)
        {
            var certificate = await _certificateService
                .GetByCertificateNumberAsync(certificateNumber);

            if (certificate == null)
            {
                return NotFound(new
                {
                    Message = "Certificate was not found."
                });
            }

            var result = new PublicCertificateDto
            {
                CertificateNumber = certificate.CertificateNumber,
                StudentName = certificate.StudentName,
                CourseTitle = certificate.CourseTitle,
                IssuedAt = certificate.IssuedAt,
                CourseCompletedAt = certificate.CourseCompletedAt
            };

            return Ok(result);
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