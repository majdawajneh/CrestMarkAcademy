
using Domain.Entities.Commerce;

namespace Application.Repositories.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdWithDetailsAsync(int id);

        Task<Order?> GetByOrderNumberWithDetailsAsync(
            string orderNumber);

        Task<IEnumerable<Order>> GetByUserIdWithDetailsAsync(
            int userId);

        Task<bool> OrderNumberExistsAsync(string orderNumber);

        Task<IEnumerable<Order>> GetAllWithDetailsAsync();

        // Prevent concurrent order creation for the same user.
        // Must be called inside an active database transaction.
        Task AcquireUserOrderCreationLockAsync(int userId);

        Task<Order> CancelPendingWithoutPaymentsAsync(
            int userId,
            int orderId);

    }
}
