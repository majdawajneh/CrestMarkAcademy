
using Application.Dto_s.Order;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/orders")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(
            IOrderService orderService)
        {
            _orderService = orderService;
        }

        // ========================================
        // Create Order
        // ========================================

        [HttpPost]
        public async Task<ActionResult<OrderDto>> Create(
            CreateOrderDto dto)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var order = await _orderService.CreateAsync(
                userId,
                dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                order);
        }

        // ========================================
        // Get My Orders
        // ========================================

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<OrderDto>>>
            GetMyOrders()
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var orders = await _orderService
                .GetMyOrdersAsync(userId);

            return Ok(orders);
        }

        // ========================================
        // Get My Order By ID
        // ========================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<OrderDto>> GetById(
            int id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            var order = await _orderService
                .GetMyOrderByIdAsync(userId, id);

            return Ok(order);
        }

        // ========================================
        // Cancel My Pending Order
        // ========================================

        [HttpPost("{id:int}/cancel")]
        public async Task<ActionResult<OrderDto>> Cancel(
            int id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized();
            }

            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid order ID."
                });
            }

            try
            {
                var order = await _orderService
                    .CancelPendingAsync(userId, id);

                return Ok(order);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new
                {
                    message = "Order was not found."
                });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new
                {
                    message = ex.Message
                });
            }
        }

        // ========================================
        // Current User
        // ========================================

        private bool TryGetCurrentUserId(out int userId)
        {
            var value = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            return int.TryParse(value, out userId)
                && userId > 0;
        }
    }
}
