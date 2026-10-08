using Domain.Entities.Commerce;

namespace Application.Repositories.Interfaces
{
    public interface IPaymentRepository
    {
        Task<Payment?> GetByIdWithOrderAsync(
            int id
        );

        Task<IEnumerable<Payment>>
            GetByOrderIdAsync(
                int orderId
            );

        Task<Payment?>
            GetPendingByOrderIdAsync(
                int orderId
            );

        Task<bool>
            TransactionIdExistsAsync(
                string transactionId
            );

        Task<IEnumerable<Payment>>GetAllWithDetailsAsync();
    }
}