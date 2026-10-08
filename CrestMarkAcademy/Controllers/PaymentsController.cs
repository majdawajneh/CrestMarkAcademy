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
    public class PaymentsController
        : ControllerBase
    {
        private readonly IPaymentService
            _paymentService;


        public PaymentsController(
            IPaymentService paymentService)
        {
            _paymentService =
                paymentService;
        }


        // =========================
        // Create Payment
        // =========================

        [HttpPost("orders/{orderId:int}")]
        public async Task<ActionResult<PaymentDto>>
            Create(
                int orderId,
                CreatePaymentDto dto)
        {
            var userId =
                GetCurrentUserId();


            var payment =
                await _paymentService
                    .CreateAsync(
                        userId,
                        orderId,
                        dto
                    );


            return Ok(payment);
        }


        // =========================
        // Get Order Payments
        // =========================

        [HttpGet("orders/{orderId:int}")]
        public async Task<
            ActionResult<IEnumerable<PaymentDto>>>
            GetByOrder(
                int orderId)
        {
            var userId =
                GetCurrentUserId();


            var payments =
                await _paymentService
                    .GetByOrderAsync(
                        userId,
                        orderId
                    );


            return Ok(payments);
        }


        // =========================
        // Current User
        // =========================

        private int GetCurrentUserId()
        {
            var value =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                    value,
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