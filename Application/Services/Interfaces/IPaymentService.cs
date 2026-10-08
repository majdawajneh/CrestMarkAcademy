using Application.Dto_s.Payment;

namespace Application.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentDto> CreateAsync(
            int userId,
            int orderId,
            CreatePaymentDto dto
        );

        Task<IEnumerable<PaymentDto>>
            GetByOrderAsync(
                int userId,
                int orderId
            );

        Task<PaymentDto>
            MarkAsPaidAsync(
                int paymentId,
                CompletePaymentDto dto
            );

        Task<PaymentDto>
            MarkAsFailedAsync(
                int paymentId
            );
    }
}