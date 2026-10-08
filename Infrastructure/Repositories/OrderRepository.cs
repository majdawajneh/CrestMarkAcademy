using Application.Repositories.Interfaces;
using Domain.Entities.Commerce;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly CrestMark_DbContext _dbContext;

        public OrderRepository(
            CrestMark_DbContext dbContext)
        {
            _dbContext = dbContext;
        }


        // =========================
        // Get Order By Id
        // With Details
        // =========================

        public async Task<Order?>
            GetByIdWithDetailsAsync(int id)
        {
            return await _dbContext.Orders

            .Include(o => o.User)

            .Include(o => o.Coupon)

            .Include(o => o.OrderItems)

            .Include(o => o.Payments)

            .FirstOrDefaultAsync(
                o => o.Id == id
            );
        }


        // =========================
        // Get Order By Number
        // =========================

        public async Task<Order?>
            GetByOrderNumberWithDetailsAsync(
                string orderNumber)
        {
            return await _dbContext.Orders
                .Include(o => o.User)
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(
                    o => o.OrderNumber == orderNumber
                );
        }


        // =========================
        // Get User Orders
        // =========================

        public async Task<IEnumerable<Order>>
            GetByUserIdWithDetailsAsync(
                int userId)
        {
            return await _dbContext.Orders
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .Where(o => o.UserId == userId)
                .OrderByDescending(
                    o => o.CreatedAt
                )
                .ToListAsync();
        }


        // =========================
        // Check Order Number
        // =========================

        public async Task<bool>
            OrderNumberExistsAsync(
                string orderNumber)
        {
            return await _dbContext.Orders
                .AnyAsync(
                    o => o.OrderNumber == orderNumber
                );
        }

        public async Task<IEnumerable<Order>>GetAllWithDetailsAsync()
        {
            return await _dbContext.Orders

                .Include(o => o.User)

                .Include(o => o.Coupon)

                .Include(o => o.OrderItems)

                .Include(o => o.Payments)

                .OrderByDescending(
                    o => o.CreatedAt
                )

                .ToListAsync();
        }
    }
}