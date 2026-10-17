
using Application.Repositories.Interfaces;
using Domain.Entities.Commerce;
using Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System.Data;

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

        // ========================================
        // Get Order By ID With Details
        // ========================================

        public async Task<Order?> GetByIdWithDetailsAsync(
            int id)
        {
            return await _dbContext.Orders
                .Include(o => o.User)
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        // ========================================
        // Get Order By Number
        // ========================================

        public async Task<Order?> GetByOrderNumberWithDetailsAsync(
            string orderNumber)
        {
            return await _dbContext.Orders
                .Include(o => o.User)
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(
                    o => o.OrderNumber == orderNumber);
        }

        // ========================================
        // Get User Orders
        // ========================================

        public async Task<IEnumerable<Order>>
            GetByUserIdWithDetailsAsync(int userId)
        {
            return await _dbContext.Orders
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        // ========================================
        // Check Order Number
        // ========================================

        public async Task<bool> OrderNumberExistsAsync(
            string orderNumber)
        {
            return await _dbContext.Orders
                .AnyAsync(
                    o => o.OrderNumber == orderNumber);
        }

        // ========================================
        // Get All Orders
        // ========================================

        public async Task<IEnumerable<Order>>
            GetAllWithDetailsAsync()
        {
            return await _dbContext.Orders
                .Include(o => o.User)
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        // ========================================
        // Prevent Concurrent Order Creation
        // ========================================

        public async Task AcquireUserOrderCreationLockAsync(
            int userId)
        {
            if (userId <= 0)
            {
                throw new ArgumentException(
                    "Invalid user ID.");
            }

            var resource = $"CrestMark:OrderCreate:User:{userId}";

            await _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
                DECLARE @lockResult INT;

                EXEC @lockResult = sys.sp_getapplock
                    @Resource = {resource},
                    @LockMode = 'Exclusive',
                    @LockOwner = 'Transaction',
                    @LockTimeout = 15000;

                IF (@lockResult < 0)
                BEGIN
                    THROW 51000,
                        'Could not reserve order creation. Please try again.',
                        1;
                END
            ");
        }

        // ========================================
        // Cancel Pending Order
        // Only If No Payment Attempts Exist
        // ========================================

        public async Task<Order> CancelPendingWithoutPaymentsAsync(
            int userId,
            int orderId)
        {
            if (userId <= 0 || orderId <= 0)
            {
                throw new ArgumentException(
                    "Invalid user or order ID.");
            }

            // Serializable isolation prevents a concurrent
            // payment creation from bypassing the checks.
            await using var transaction =
                await _dbContext.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            // Load the order only if it belongs to this user.
            var order = await _dbContext.Orders
                .AsNoTracking()
                .AsSplitQuery()
                .Include(o => o.Coupon)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o =>
                    o.Id == orderId &&
                    o.UserId == userId);

            if (order == null)
            {
                throw new KeyNotFoundException(
                    "Order was not found.");
            }

            // Repeated cancellation is safe.
            if (string.Equals(
                    order.Status,
                    "Cancelled",
                    StringComparison.OrdinalIgnoreCase))
            {
                await transaction.CommitAsync();
                return order;
            }

            // Never cancel paid or otherwise closed orders.
            if (!string.Equals(
                    order.Status,
                    "Pending",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only pending orders can be cancelled.");
            }

            // Conservatively block cancellation after
            // ANY payment attempt has been recorded.
            if (order.Payments.Any())
            {
                throw new InvalidOperationException(
                    "This order has a payment attempt and cannot " +
                    "be cancelled automatically. Please contact support.");
            }

            // Atomic conditional update:
            // the order must still be Pending,
            // and no payment records may exist.
            var affectedRows = await _dbContext.Orders
                .Where(o =>
                    o.Id == orderId &&
                    o.UserId == userId &&
                    o.Status == "Pending" &&
                    !o.Payments.Any())
                .ExecuteUpdateAsync(setters =>
                    setters.SetProperty(
                        o => o.Status,
                        "Cancelled"));

            if (affectedRows != 1)
            {
                throw new InvalidOperationException(
                    "Order status changed. Please refresh and try again.");
            }

            await transaction.CommitAsync();

            // The update bypasses EF change tracking.
            // Synchronize the detached object returned to the service.
            order.Status = "Cancelled";

            return order;
        }

    }
}
