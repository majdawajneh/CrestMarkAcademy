using Application.Dto_s.Order;

namespace Application.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateAsync(
            int userId,
            CreateOrderDto dto
        );

        Task<IEnumerable<OrderDto>>
            GetMyOrdersAsync(int userId);

        Task<OrderDto>
            GetMyOrderByIdAsync(
                int userId,
                int orderId
            );
    }
}