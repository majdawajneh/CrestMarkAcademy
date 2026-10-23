
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/paytabs")]
    public sealed class PayTabsController : ControllerBase
    {
        private readonly PayTabsService _gateway;
        private readonly IConfiguration _config;
        private readonly ILogger<PayTabsController> _logger;

        public PayTabsController(
            PayTabsService gateway,
            IConfiguration config,
            ILogger<PayTabsController> logger)
        {
            _gateway = gateway;
            _config = config;
            _logger = logger;
        }

        // =========================
        // Start Checkout
        // =========================

        [HttpPost("orders/{orderId:int}/checkout")]
        [Authorize]
        public async Task<IActionResult> Checkout(
            int orderId,
            CancellationToken ct)
        {
            if (!_config.GetValue<bool>("PayTabs:Enabled"))
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "Online payments are temporarily unavailable."
                    });
            }

            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var url = await _gateway.StartAsync(
                userId,
                orderId,
                ct);

            return Ok(new
            {
                redirectUrl = url
            });
        }

        // =========================
        // PayTabs Callback
        // =========================

        [HttpPost("callback")]
        [AllowAnonymous]
        [RequestSizeLimit(32768)]
        public async Task<IActionResult> Callback(
            CancellationToken ct)
        {
            try
            {
                // 1. Get Server Key

                var serverKey = _config[
                    "PayTabs:ServerKey"];

                if (string.IsNullOrWhiteSpace(serverKey))
                {
                    _logger.LogError(
                        "PayTabs ServerKey is not configured.");

                    return StatusCode(503);
                }

                // 2. Read Signature

                var signature = Request.Headers[
                    "Signature"].ToString().Trim();

                if (string.IsNullOrWhiteSpace(signature))
                {
                    return StatusCode(
                        StatusCodes.Status403Forbidden);
                }

                // 3. Read Raw Body

                const int maxBodySize = 32768;

                if (Request.ContentLength > maxBodySize)
                {
                    return StatusCode(413);
                }

                using var buffer = new MemoryStream();

                var chunk = new byte[8192];

                int bytesRead;

                while ((bytesRead =
                    await Request.Body.ReadAsync(
                        chunk.AsMemory(),
                        ct)) > 0)
                {
                    if (buffer.Length + bytesRead > maxBodySize)
                    {
                        return StatusCode(413);
                    }

                    buffer.Write(
                        chunk,
                        0,
                        bytesRead);
                }

                var bodyBytes = buffer.ToArray();

                // 4. Verify HMAC Signature

                if (!VerifySignature(
                    bodyBytes,
                    signature,
                    serverKey))
                {
                    _logger.LogWarning(
                        "Rejected PayTabs callback: invalid signature.");

                    return StatusCode(
                        StatusCodes.Status403Forbidden);
                }

                // 5. Parse Verified JSON

                using var payload =
                    JsonDocument.Parse(bodyBytes);

                if (payload.RootElement.ValueKind !=
                    JsonValueKind.Object)
                {
                    return BadRequest();
                }

                if (!payload.RootElement.TryGetProperty(
                    "tran_ref",
                    out var reference) ||
                    reference.ValueKind != JsonValueKind.String)
                {
                    return BadRequest();
                }

                var transactionReference =
                    reference.GetString();

                if (string.IsNullOrWhiteSpace(
                    transactionReference))
                {
                    return BadRequest();
                }

                // 6. Verify With PayTabs API

                var processed = await _gateway.ConfirmAsync(
                    transactionReference,
                    ct);

                if (!processed)
                {
                    return BadRequest(new
                    {
                        message =
                            "Payment status could not be finalized."
                    });
                }

                // 7. Callback Processed

                return Ok(new
                {
                    received = true
                });
            }
            catch (JsonException)
            {
                return BadRequest();
            }
            catch (OperationCanceledException)
                when (ct.IsCancellationRequested)
            {
                return StatusCode(503);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "PayTabs callback processing failed.");

                return StatusCode(
                    503,
                    new
                    {
                        message =
                            "Payment confirmation temporarily unavailable."
                    });
            }
        }

        // =========================
        // Admin Payment Reconciliation
        // =========================

        [HttpPost("admin/payments/{paymentId:int}/reconcile")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reconcile(
            int paymentId,
            CancellationToken ct)
        {
            if (paymentId <= 0)
            {
                return BadRequest();
            }

            try
            {
                var result = await _gateway.ReconcileAsync(
                    paymentId,
                    ct);

                return Ok(new
                {
                    paymentId,
                    result
                });
            }
            catch (OperationCanceledException)
                when (ct.IsCancellationRequested)
            {
                return StatusCode(503);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "PayTabs reconciliation failed for payment {PaymentId}",
                    paymentId);

                return StatusCode(
                    503,
                    new
                    {
                        message =
                            "Payment reconciliation unavailable."
                    });
            }
        }

        // =========================
        // Verify HMAC-SHA256
        // =========================

        private static bool VerifySignature(
            byte[] body,
            string signature,
            string serverKey)
        {
            if (signature.Length != 64)
            {
                return false;
            }

            byte[] receivedSignature;

            try
            {
                receivedSignature =
                    Convert.FromHexString(signature);
            }
            catch (FormatException)
            {
                return false;
            }

            var keyBytes =
                Encoding.UTF8.GetBytes(serverKey);

            using var hmac = new HMACSHA256(
                keyBytes);

            var expectedSignature =
                hmac.ComputeHash(body);

            return CryptographicOperations.FixedTimeEquals(
                expectedSignature,
                receivedSignature);
        }
    }
}
