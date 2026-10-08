using Application.Dto_s.Order;

namespace Application.Services.Interfaces
{
    public interface IAdminOrderService
    {
        Task<IEnumerable<AdminOrderDto>>
            GetAllAsync();

        Task<AdminOrderDto>
            GetByIdAsync(
                int id
            );

        Task CancelAsync(
            int id
        );
    }
}