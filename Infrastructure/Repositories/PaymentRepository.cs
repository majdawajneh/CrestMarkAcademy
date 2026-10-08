using Application.Repositories.Interfaces;
using Domain.Entities.Commerce;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PaymentRepository
        : IPaymentRepository
    {
        private readonly CrestMark_DbContext
            _dbContext;


        public PaymentRepository(
            CrestMark_DbContext dbContext)
        {
            _dbContext = dbContext;
        }


        // =========================
        // Get Payment By Id
        // =========================

        public async Task<Payment?>
            GetByIdWithOrderAsync(
                int id)
        {
            return await _dbContext.Payments

                .Include(p => p.Order)
                    .ThenInclude(o => o.User)

                .Include(p => p.Order)
                    .ThenInclude(o => o.OrderItems)

                .Include(p => p.Order)
                    .ThenInclude(o => o.Coupon)

                .FirstOrDefaultAsync(
                    p => p.Id == id
                );
        }


        // =========================
        // Get Order Payments
        // =========================

        public async Task<IEnumerable<Payment>>
            GetByOrderIdAsync(
                int orderId)
        {
            return await _dbContext.Payments

                .Include(p => p.Order)

                .Where(
                    p => p.OrderId == orderId
                )

                .OrderByDescending(
                    p => p.CreatedAt
                )

                .ToListAsync();
        }


        // =========================
        // Get Pending Payment
        // =========================

        public async Task<Payment?>
            GetPendingByOrderIdAsync(
                int orderId)
        {
            return await _dbContext.Payments

                .Include(p => p.Order)

                .FirstOrDefaultAsync(
                    p =>
                        p.OrderId == orderId
                        &&
                        p.Status == "Pending"
                );
        }


        // =========================
        // Transaction Exists
        // =========================

        public async Task<bool>
            TransactionIdExistsAsync(
                string transactionId)
        {
            return await _dbContext.Payments
                .AnyAsync(
                    p =>
                        p.TransactionId ==
                        transactionId
                );
        }

        public async Task<IEnumerable<Payment>>GetAllWithDetailsAsync()
        {
            return await _dbContext.Payments

                .Include(p => p.Order)
                    .ThenInclude(o => o.User)

                .OrderByDescending(
                    p => p.CreatedAt
                )

                .ToListAsync();
        }
    }
}