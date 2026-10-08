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


        // =========================
        // Constructor
        // =========================

        public OrdersController(
            IOrderService orderService)
        {
            _orderService = orderService;
        }


        // =========================
        // Create Order
        // =========================

        [HttpPost]
        public async Task<ActionResult<OrderDto>>
            Create(CreateOrderDto dto)
        {
            var userId =
                GetCurrentUserId();


            var order =
                await _orderService
                    .CreateAsync(
                        userId,
                        dto
                    );


            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = order.Id
                },
                order
            );
        }


        // =========================
        // Get My Orders
        // =========================

        [HttpGet("my")]
        public async Task<
            ActionResult<IEnumerable<OrderDto>>>
            GetMyOrders()
        {
            var userId =
                GetCurrentUserId();


            var orders =
                await _orderService
                    .GetMyOrdersAsync(
                        userId
                    );


            return Ok(orders);
        }


        // =========================
        // Get My Order By Id
        // =========================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<OrderDto>>
            GetById(int id)
        {
            var userId =
                GetCurrentUserId();


            var order =
                await _orderService
                    .GetMyOrderByIdAsync(
                        userId,
                        id
                    );


            return Ok(order);
        }


        // =========================
        // Get Current User Id
        // =========================

        private int GetCurrentUserId()
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                    userIdValue,
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