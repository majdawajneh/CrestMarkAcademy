using Application.Dto_s.Order;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/orders")]
    [Authorize(Roles = "Admin")]
    public class AdminOrdersController
        : ControllerBase
    {
        private readonly IAdminOrderService
            _adminOrderService;


        public AdminOrdersController(
            IAdminOrderService adminOrderService)
        {
            _adminOrderService =
                adminOrderService;
        }


        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<AdminOrderDto>>>
            GetAll()
        {
            var orders =
                await _adminOrderService
                    .GetAllAsync();


            return Ok(orders);
        }


        [HttpGet("{id:int}")]
        public async Task<ActionResult<AdminOrderDto>>
            GetById(
                int id)
        {
            var order =
                await _adminOrderService
                    .GetByIdAsync(
                        id
                    );


            return Ok(order);
        }


        [HttpPatch("{id:int}/cancel")]
        public async Task<IActionResult>
            Cancel(
                int id)
        {
            await _adminOrderService
                .CancelAsync(
                    id
                );


            return NoContent();
        }
    }
}