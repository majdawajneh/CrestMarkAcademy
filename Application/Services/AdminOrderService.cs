using Application.Dto_s.Order;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Commerce;
using Domain.Entities.Engagement;

namespace Application.Services
{
    public class AdminOrderService
        : IAdminOrderService
    {
        private readonly IOrderRepository
            _orderDetailsRepo;

        private readonly IGenericRepository<Order>
            _orderRepo;

        private readonly IGenericRepository<Payment>
            _paymentRepo;

        private readonly IGenericRepository<Notification>
            _notificationRepo;


        public AdminOrderService(
            IOrderRepository orderDetailsRepo,
            IGenericRepository<Order> orderRepo,
            IGenericRepository<Payment> paymentRepo,
            IGenericRepository<Notification> notificationRepo)
        {
            _orderDetailsRepo =
                orderDetailsRepo;

            _orderRepo =
                orderRepo;

            _paymentRepo =
                paymentRepo;

            _notificationRepo =
                notificationRepo;
        }


        // =========================
        // Get All
        // =========================

        public async Task<
            IEnumerable<AdminOrderDto>>
            GetAllAsync()
        {
            var orders =
                await _orderDetailsRepo
                    .GetAllWithDetailsAsync();


            return orders
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get By Id
        // =========================

        public async Task<AdminOrderDto>
            GetByIdAsync(
                int id)
        {
            var order =
                await _orderDetailsRepo
                    .GetByIdWithDetailsAsync(
                        id
                    );


            if (order == null)
            {
                throw new KeyNotFoundException(
                    "Order was not found."
                );
            }


            return MapToDto(
                order
            );
        }


        // =========================
        // Cancel Order
        // =========================

        public async Task CancelAsync(
            int id)
        {
            // =========================
            // Get Order
            // =========================

            var order =
                await _orderDetailsRepo
                    .GetByIdWithDetailsAsync(
                        id
                    );


            if (order == null)
            {
                throw new KeyNotFoundException(
                    "Order was not found."
                );
            }


            // =========================
            // Paid Order Protection
            // =========================

            if (string.Equals(
                    order.Status,
                    "Paid",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Paid orders cannot be cancelled."
                );
            }


            // Extra protection in case
            // Order status and Payment status
            // somehow become inconsistent.

            var hasPaidPayment =
                order.Payments.Any(
                    payment =>
                        string.Equals(
                            payment.Status,
                            "Paid",
                            StringComparison.OrdinalIgnoreCase
                        )
                );


            if (hasPaidPayment)
            {
                throw new InvalidOperationException(
                    "Orders with a completed payment cannot be cancelled."
                );
            }


            // =========================
            // Idempotent
            // =========================

            if (string.Equals(
                    order.Status,
                    "Cancelled",
                    StringComparison.OrdinalIgnoreCase))
            {
                return;
            }


            var now =
                DateTime.UtcNow;


            // =========================
            // Cancel Order
            // =========================

            order.Status =
                "Cancelled";


            // =========================
            // Close Pending Payments
            // =========================

            var pendingPayments =
                order.Payments
                    .Where(
                        payment =>
                            string.Equals(
                                payment.Status,
                                "Pending",
                                StringComparison.OrdinalIgnoreCase
                            )
                    )
                    .ToList();


            foreach (var payment
                     in pendingPayments)
            {
                payment.Status =
                    "Failed";

                payment.FailedAt =
                    now;

                payment.PaidAt =
                    null;


                _paymentRepo.Update(
                    payment
                );
            }


            // =========================
            // Cancellation Notification
            // =========================

            await _notificationRepo
                .AddAsync(
                    new Notification
                    {
                        UserId =
                            order.UserId,

                        Title =
                            "Order Cancelled",

                        Message =
                            $"Your order {order.OrderNumber} has been cancelled.",

                        Type =
                            "Order",

                        IsRead =
                            false,

                        CreatedAt =
                            now
                    }
                );


            // =========================
            // Update Order
            // =========================

            _orderRepo.Update(
                order
            );


            // =========================
            // Save Everything Together
            // =========================

            // Order
            // + Pending Payments
            // + Notification
            //
            // all use the same scoped DbContext.

            await _orderRepo
                .SaveChangesAsync();
        }


        // =========================
        // Mapping
        // =========================

        private static AdminOrderDto
            MapToDto(
                Order order)
        {
            return new AdminOrderDto
            {
                Id =
                    order.Id,

                OrderNumber =
                    order.OrderNumber,

                UserId =
                    order.UserId,

                UserName =
                    $"{order.User.FirstName} {order.User.LastName}"
                        .Trim(),

                UserEmail =
                    order.User.Email,

                Subtotal =
                    order.Subtotal,

                DiscountAmount =
                    order.DiscountAmount,

                TotalAmount =
                    order.TotalAmount,

                Currency =
                    order.Currency,

                Status =
                    order.Status,

                CouponCode =
                    order.Coupon?.Code,

                CreatedAt =
                    order.CreatedAt,

                PaidAt =
                    order.PaidAt,

                Items =
                    order.OrderItems
                        .Select(
                            item =>
                                new OrderItemDto
                                {
                                    Id =
                                        item.Id,

                                    CourseId =
                                        item.CourseId,

                                    CourseTitle =
                                        item.CourseTitle,

                                    UnitPrice =
                                        item.UnitPrice,

                                    DiscountAmount =
                                        item.DiscountAmount,

                                    FinalPrice =
                                        item.FinalPrice
                                }
                        )
                        .ToList()
            };
        }
    }
}