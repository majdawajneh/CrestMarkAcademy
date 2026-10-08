using Application.Dto_s.Payment;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Commerce;
using Domain.Entities.Engagement;
using Domain.Entities.Learning;
using System.Transactions;

namespace Application.Services
{
    public class PaymentService
        : IPaymentService
    {
        private readonly IGenericRepository<Payment>
            _paymentRepo;

        private readonly IPaymentRepository
            _paymentDetailsRepo;

        private readonly IOrderRepository
            _orderDetailsRepo;

        private readonly IGenericRepository<Order>
            _orderRepo;

        private readonly IGenericRepository<Coupon>
            _couponRepo;

        private readonly IEnrollmentRepository
            _enrollmentDetailsRepo;

        private readonly IGenericRepository<Enrollment>
            _enrollmentRepo;

        private readonly IGenericRepository<Notification>
            _notificationRepo;


        public PaymentService(
            IGenericRepository<Payment> paymentRepo,
            IPaymentRepository paymentDetailsRepo,
            IOrderRepository orderDetailsRepo,
            IGenericRepository<Order> orderRepo,
            IGenericRepository<Coupon> couponRepo,
            IEnrollmentRepository enrollmentDetailsRepo,
            IGenericRepository<Enrollment> enrollmentRepo,
            IGenericRepository<Notification> notificationRepo)
        {
            _paymentRepo =
                paymentRepo;

            _paymentDetailsRepo =
                paymentDetailsRepo;

            _orderDetailsRepo =
                orderDetailsRepo;

            _orderRepo =
                orderRepo;

            _couponRepo =
                couponRepo;

            _enrollmentDetailsRepo =
                enrollmentDetailsRepo;

            _enrollmentRepo =
                enrollmentRepo;

            _notificationRepo =
                notificationRepo;
        }


        // =========================
        // Create Payment
        // =========================

        public async Task<PaymentDto>
            CreateAsync(
                int userId,
                int orderId,
                CreatePaymentDto dto)
        {
            Payment? createdPaymentEntity =
                null;


            using (
                var transactionScope =
                    CreateSerializableTransactionScope()
            )
            {
                // =========================
                // Get Order
                // =========================

                var order =
                    await _orderDetailsRepo
                        .GetByIdWithDetailsAsync(
                            orderId
                        );


                if (order == null ||
                    order.UserId != userId)
                {
                    throw new KeyNotFoundException(
                        "Order was not found."
                    );
                }


                // =========================
                // Validate Order
                // =========================

                if (!string.Equals(
                        order.Status,
                        "Pending",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "Only pending orders can be paid."
                    );
                }


                // =========================
                // Validate Provider
                // =========================

                if (string.IsNullOrWhiteSpace(
                        dto.PaymentProvider))
                {
                    throw new ArgumentException(
                        "Payment provider is required."
                    );
                }


                var paymentProvider =
                    dto.PaymentProvider
                        .Trim();


                // =========================
                // Existing Pending Payment
                // =========================

                var existingPayment =
                    await _paymentDetailsRepo
                        .GetPendingByOrderIdAsync(
                            orderId
                        );


                if (existingPayment != null)
                {
                    transactionScope.Complete();


                    return MapToDto(
                        existingPayment
                    );
                }


                // =========================
                // Create Payment
                // =========================

                var payment =
                    new Payment
                    {
                        OrderId =
                            order.Id,

                        PaymentProvider =
                            paymentProvider,

                        Amount =
                            order.TotalAmount,

                        Currency =
                            order.Currency,

                        Status =
                            "Pending",

                        CreatedAt =
                            DateTime.UtcNow
                    };


                await _paymentRepo
                    .AddAsync(
                        payment
                    );


                await _paymentRepo
                    .SaveChangesAsync();


                createdPaymentEntity =
                    payment;


                transactionScope.Complete();
            }


            // =========================
            // Reload Payment
            // =========================

            if (createdPaymentEntity == null)
            {
                throw new InvalidOperationException(
                    "Payment could not be created."
                );
            }


            var createdPayment =
                await _paymentDetailsRepo
                    .GetByIdWithOrderAsync(
                        createdPaymentEntity.Id
                    );


            if (createdPayment == null)
            {
                throw new InvalidOperationException(
                    "Payment was created but could not be loaded."
                );
            }


            return MapToDto(
                createdPayment
            );
        }


        // =========================
        // Get Payments By Order
        // =========================

        public async Task<IEnumerable<PaymentDto>>
            GetByOrderAsync(
                int userId,
                int orderId)
        {
            var order =
                await _orderDetailsRepo
                    .GetByIdWithDetailsAsync(
                        orderId
                    );


            if (order == null ||
                order.UserId != userId)
            {
                throw new KeyNotFoundException(
                    "Order was not found."
                );
            }


            var payments =
                await _paymentDetailsRepo
                    .GetByOrderIdAsync(
                        orderId
                    );


            return payments
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Mark Payment As Paid
        // =========================

        public async Task<PaymentDto>
            MarkAsPaidAsync(
                int paymentId,
                CompletePaymentDto dto)
        {
            var transactionId =
                dto.TransactionId?
                    .Trim();


            if (string.IsNullOrWhiteSpace(
                    transactionId))
            {
                throw new ArgumentException(
                    "Transaction id is required."
                );
            }


            using (
                var transactionScope =
                    CreateSerializableTransactionScope()
            )
            {
                // =========================
                // Get Payment
                // =========================

                var payment =
                    await _paymentDetailsRepo
                        .GetByIdWithOrderAsync(
                            paymentId
                        );


                if (payment == null)
                {
                    throw new KeyNotFoundException(
                        "Payment was not found."
                    );
                }


                // =========================
                // Idempotent Paid
                // =========================

                if (string.Equals(
                        payment.Status,
                        "Paid",
                        StringComparison.OrdinalIgnoreCase))
                {
                    transactionScope.Complete();


                    return MapToDto(
                        payment
                    );
                }


                // =========================
                // Validate Status
                // =========================

                if (!string.Equals(
                        payment.Status,
                        "Pending",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "Only pending payments can be completed."
                    );
                }


                // =========================
                // Transaction Id Unique
                // =========================

                var transactionExists =
                    await _paymentDetailsRepo
                        .TransactionIdExistsAsync(
                            transactionId
                        );


                if (transactionExists)
                {
                    throw new InvalidOperationException(
                        "Transaction id already exists."
                    );
                }


                var order =
                    payment.Order;


                // =========================
                // Validate Order
                // =========================

                if (!string.Equals(
                        order.Status,
                        "Pending",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "Order is not pending."
                    );
                }


                var now =
                    DateTime.UtcNow;


                // =========================
                // Coupon Validation
                // =========================

                if (order.Coupon != null)
                {
                    if (!order.Coupon.IsActive)
                    {
                        throw new InvalidOperationException(
                            "The coupon used by this order is no longer active."
                        );
                    }


                    if (order.Coupon.UsageLimit.HasValue &&
                        order.Coupon.UsedCount >=
                        order.Coupon.UsageLimit.Value)
                    {
                        throw new InvalidOperationException(
                            "Coupon usage limit has been reached."
                        );
                    }


                    order.Coupon.UsedCount++;


                    _couponRepo.Update(
                        order.Coupon
                    );
                }


                // =========================
                // Payment Success
                // =========================

                payment.TransactionId =
                    transactionId;

                payment.Status =
                    "Paid";

                payment.PaidAt =
                    now;

                payment.FailedAt =
                    null;


                // =========================
                // Order Success
                // =========================

                order.Status =
                    "Paid";

                order.PaidAt =
                    now;


                // =========================
                // Automatic Enrollments
                // =========================

                foreach (
                    var item
                    in order.OrderItems)
                {
                    var enrollment =
                        await _enrollmentDetailsRepo
                            .GetByUserAndCourseAsync(
                                order.UserId,
                                item.CourseId
                            );


                    // =========================
                    // New Enrollment
                    // =========================

                    if (enrollment == null)
                    {
                        await _enrollmentRepo
                            .AddAsync(
                                new Enrollment
                                {
                                    UserId =
                                        order.UserId,

                                    CourseId =
                                        item.CourseId,

                                    Status =
                                        "Active",

                                    EnrolledAt =
                                        now,

                                    CompletedAt =
                                        null
                                }
                            );


                        continue;
                    }


                    // =========================
                    // Reactivate Cancelled
                    // =========================

                    if (string.Equals(
                            enrollment.Status,
                            "Cancelled",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        enrollment.Status =
                            "Active";

                        enrollment.EnrolledAt =
                            now;

                        enrollment.CompletedAt =
                            null;


                        _enrollmentRepo.Update(
                            enrollment
                        );
                    }


                    // Active / Completed:
                    // don't create another enrollment.
                }


                // =========================
                // Payment Notification
                // =========================

                // IMPORTANT:
                // this is outside the enrollment loop.
                // One successful payment =
                // one notification.

                await _notificationRepo
                    .AddAsync(
                        new Notification
                        {
                            UserId =
                                order.UserId,

                            Title =
                                "Payment Successful",

                            Message =
                                $"Your payment for order {order.OrderNumber} was completed successfully. Your courses are now available.",

                            Type =
                                "Payment",

                            IsRead =
                                false,

                            CreatedAt =
                                now
                        }
                    );


                // =========================
                // Update Entities
                // =========================

                _paymentRepo.Update(
                    payment
                );


                _orderRepo.Update(
                    order
                );


                // =========================
                // Save Everything Together
                // =========================

                await _paymentRepo
                    .SaveChangesAsync();


                transactionScope.Complete();
            }


            // =========================
            // Reload After Commit
            // =========================

            var updatedPayment =
                await _paymentDetailsRepo
                    .GetByIdWithOrderAsync(
                        paymentId
                    );


            if (updatedPayment == null)
            {
                throw new InvalidOperationException(
                    "Payment was completed but could not be loaded."
                );
            }


            return MapToDto(
                updatedPayment
            );
        }


        // =========================
        // Mark Payment As Failed
        // =========================

        public async Task<PaymentDto>
            MarkAsFailedAsync(
                int paymentId)
        {
            using (
                var transactionScope =
                    CreateSerializableTransactionScope()
            )
            {
                // =========================
                // Get Payment
                // =========================

                var payment =
                    await _paymentDetailsRepo
                        .GetByIdWithOrderAsync(
                            paymentId
                        );


                if (payment == null)
                {
                    throw new KeyNotFoundException(
                        "Payment was not found."
                    );
                }


                // =========================
                // Cannot Fail Paid Payment
                // =========================

                if (string.Equals(
                        payment.Status,
                        "Paid",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "A paid payment cannot be marked as failed."
                    );
                }


                // =========================
                // Idempotent Failed
                // =========================

                if (string.Equals(
                        payment.Status,
                        "Failed",
                        StringComparison.OrdinalIgnoreCase))
                {
                    transactionScope.Complete();


                    return MapToDto(
                        payment
                    );
                }


                // =========================
                // Only Pending Can Fail
                // =========================

                if (!string.Equals(
                        payment.Status,
                        "Pending",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        "Only pending payments can be marked as failed."
                    );
                }


                var now =
                    DateTime.UtcNow;


                // =========================
                // Payment Failed
                // =========================

                payment.Status =
                    "Failed";

                payment.FailedAt =
                    now;

                payment.PaidAt =
                    null;


                // =========================
                // Failure Notification
                // =========================

                await _notificationRepo
                    .AddAsync(
                        new Notification
                        {
                            UserId =
                                payment.Order.UserId,

                            Title =
                                "Payment Failed",

                            Message =
                                $"The payment attempt for order {payment.Order.OrderNumber} was not completed. You can try again.",

                            Type =
                                "Payment",

                            IsRead =
                                false,

                            CreatedAt =
                                now
                        }
                    );


                _paymentRepo.Update(
                    payment
                );


                // Payment + Notification
                // saved together.

                await _paymentRepo
                    .SaveChangesAsync();


                transactionScope.Complete();
            }


            // =========================
            // Reload After Commit
            // =========================

            var updatedPayment =
                await _paymentDetailsRepo
                    .GetByIdWithOrderAsync(
                        paymentId
                    );


            if (updatedPayment == null)
            {
                throw new InvalidOperationException(
                    "Payment was updated but could not be loaded."
                );
            }


            return MapToDto(
                updatedPayment
            );
        }


        // =========================
        // Serializable Transaction
        // =========================

        private static TransactionScope
            CreateSerializableTransactionScope()
        {
            var transactionOptions =
                new TransactionOptions
                {
                    IsolationLevel =
                        IsolationLevel.Serializable,

                    Timeout =
                        TransactionManager
                            .DefaultTimeout
                };


            return new TransactionScope(
                TransactionScopeOption.Required,
                transactionOptions,
                TransactionScopeAsyncFlowOption.Enabled
            );
        }


        // =========================
        // Mapping
        // =========================

        private static PaymentDto
            MapToDto(
                Payment payment)
        {
            return new PaymentDto
            {
                Id =
                    payment.Id,

                OrderId =
                    payment.OrderId,

                OrderNumber =
                    payment.Order?
                        .OrderNumber
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