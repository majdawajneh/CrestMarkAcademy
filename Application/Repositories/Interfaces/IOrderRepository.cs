using Domain.Entities.Commerce;

namespace Application.Repositories.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdWithDetailsAsync(int id);

        Task<Order?> GetByOrderNumberWithDetailsAsync(string orderNumber);

        Task<IEnumerable<Order>> GetByUserIdWithDetailsAsync(int userId);

        Task<bool> OrderNumberExistsAsync(string orderNumber);

        Task<IEnumerable<Order>>GetAllWithDetailsAsync();
    }
}