using Application.Dto_s.Payment;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Commerce;

namespace Application.Services
{
    public class AdminPaymentService
        : IAdminPaymentService
    {
        private readonly IPaymentRepository
            _paymentRepository;


        public AdminPaymentService(
            IPaymentRepository paymentRepository)
        {
            _paymentRepository =
                paymentRepository;
        }


        public async Task<
            IEnumerable<AdminPaymentDto>>
            GetAllAsync()
        {
            var payments =
                await _paymentRepository
                    .GetAllWithDetailsAsync();


            return payments
                .Select(MapToDto)
                .ToList();
        }


        public async Task<AdminPaymentDto>
            GetByIdAsync(
                int id)
        {
            var payment =
                await _paymentRepository
                    .GetByIdWithOrderAsync(
                        id
                    );


            if (payment == null)
            {
                throw new KeyNotFoundException(
                    "Payment was not found."
                );
            }


            return MapToDto(
                payment
            );
        }


        private static AdminPaymentDto
            MapToDto(
                Payment payment)
        {
            return new AdminPaymentDto
            {
                Id =
                    payment.Id,

                OrderId =
                    payment.OrderId,

                OrderNumber =
                    payment.Order
                        .OrderNumber,

                UserId =
                    payment.Order
                        .UserId,

                UserEmail =
                    payment.Order.User?
                        .Email
                    ?? string.Empty,

                PaymentProvider =
                    payment.PaymentProvider,

                TransactionId =
                    payment.TransactionId,

                Amount =
                    payment.Amount,

                Currency =
                    payment.Currency,

                Status =
                    payment.Status,

                CreatedAt =
                    payment.CreatedAt,

                PaidAt =
                    payment.PaidAt,

                FailedAt =
                    payment.FailedAt
            };
        }
    }
}