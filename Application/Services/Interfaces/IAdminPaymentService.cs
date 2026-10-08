using Application.Dto_s.Payment;

namespace Application.Services.Interfaces
{
    public interface IAdminPaymentService
    {
        Task<IEnumerable<AdminPaymentDto>>
            GetAllAsync();

        Task<AdminPaymentDto>
            GetByIdAsync(
                int id
            );
    }
}