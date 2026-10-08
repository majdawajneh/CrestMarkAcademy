using Application.Dto_s.Payment;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/payments")]
    [Authorize(Roles = "Admin")]
    public class AdminPaymentsController
        : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IAdminPaymentService _adminPaymentService;


        public AdminPaymentsController(
            IPaymentService paymentService,
            IAdminPaymentService adminPaymentService)
        {
            _paymentService =
                paymentService;
            _adminPaymentService =
                adminPaymentService;
        }


        // =========================
        // Payment Success
        // =========================

        [HttpPatch("{id:int}/success")]
        public async Task<ActionResult<PaymentDto>>
            MarkAsPaid(
                int id,
                CompletePaymentDto dto)
        {
            var payment =
                await _paymentService
                    .MarkAsPaidAsync(
                        id,
                        dto
                    );


            return Ok(payment);
        }


        // =========================
        // Payment Failed
        // =========================

        [HttpPatch("{id:int}/failed")]
        public async Task<ActionResult<PaymentDto>>
            MarkAsFailed(
                int id)
        {
            var payment =
                await _paymentService
                    .MarkAsFailedAsync(
                        id
                    );


            return Ok(payment);
        }


        [HttpGet]
        public async Task<
    ActionResult<IEnumerable<AdminPaymentDto>>>
    GetAll()
        {
            var payments =
                await _adminPaymentService
                    .GetAllAsync();


            return Ok(payments);
        }


        [HttpGet("{id:int}")]
        public async Task<ActionResult<AdminPaymentDto>>
            GetById(
                int id)
        {
            var payment =
                await _adminPaymentService
                    .GetByIdAsync(
                        id
                    );


            return Ok(payment);
        }
    }
}