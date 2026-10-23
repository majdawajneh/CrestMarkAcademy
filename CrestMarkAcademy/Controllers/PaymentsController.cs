
using Application.Dto_s.Payment;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IConfiguration _config;

        public PaymentsController(
            IPaymentService paymentService,
            IConfiguration configuration)
        {
            _paymentService = paymentService;
            _config = configuration;
        }

        // =========================
        // Create Payment
        // =========================

        [HttpPost("orders/{orderId:int}")]
        public async Task<ActionResult<PaymentDto>> Create(
            int orderId,
            [FromBody] CreatePaymentDto dto)
        {
            // Online checkout must be enabled explicitly.
            if (!_config.GetValue<bool>("PayTabs:Enabled"))
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "Online payments are temporarily unavailable."
                    }
                );
            }

            if (dto == null)
            {
                return BadRequest(new
                {
                    message = "Payment details are required."
                });
            }

            // Only PayTabs is supported.
            if (!string.Equals(
                dto.PaymentProvider,
                "PayTabs",
                StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message =
                        "Only PayTabs is supported for online checkout."
                });
            }

            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            dto.PaymentProvider = "PayTabs";

            var payment = await _paymentService.CreateAsync(
                userId,
                orderId,
                dto
            );

            return Ok(payment);
        }

        // =========================
        // Get Payments By Order
        // =========================

        [HttpGet("orders/{orderId:int}")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetByOrder(
            int orderId)
        {
            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var payments = await _paymentService.GetByOrderAsync(
                userId,
                orderId
            );

            return Ok(payments);
        }
    }
}
