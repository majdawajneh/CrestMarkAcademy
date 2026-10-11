
using Application.Dto_s.Payment;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/payments")]
    [Authorize(Roles = "Admin")]
    public class AdminPaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IAdminPaymentService _adminPaymentService;
        private readonly IWebHostEnvironment _environment;

        public AdminPaymentsController(
            IPaymentService paymentService,
            IAdminPaymentService adminPaymentService,
            IWebHostEnvironment environment)
        {
            _paymentService = paymentService;
            _adminPaymentService = adminPaymentService;
            _environment = environment;
        }

        // Manual payment confirmation - Development only
        [HttpPatch("{id:int}/success")]
        public async Task<ActionResult<PaymentDto>> MarkAsPaid(
            int id,
            CompletePaymentDto dto)
        {
            if (!_environment.IsDevelopment())
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        Message = "Manual payment confirmation is disabled."
                    }
                );
            }

            var payment = await _paymentService.MarkAsPaidAsync(
                id,
                dto
            );

            return Ok(payment);
        }

        // Mark payment as failed
        [HttpPatch("{id:int}/failed")]
        public async Task<ActionResult<PaymentDto>> MarkAsFailed(
            int id)
        {
            var payment = await _paymentService.MarkAsFailedAsync(id);

            return Ok(payment);
        }

        // Get all payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminPaymentDto>>> GetAll()
        {
            var payments = await _adminPaymentService.GetAllAsync();

            return Ok(payments);
        }

        // Get payment by ID
        [HttpGet("{id:int}")]
        public async Task<ActionResult<AdminPaymentDto>> GetById(
            int id)
        {
            var payment = await _adminPaymentService.GetByIdAsync(id);

            return Ok(payment);
        }
    }
}
