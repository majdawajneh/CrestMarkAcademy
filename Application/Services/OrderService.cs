
using Application.Dto_s.Order;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Commerce;
using Domain.Entities.Identity;
using System.Transactions;
using System;
using System.Collections.Generic;
using System.Linq;

using OrderEntity = Domain.Entities.Commerce.Order;

namespace Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IGenericRepository<OrderEntity> _orderRepo;
        private readonly IOrderRepository _orderDetailsRepo;
        private readonly IGenericRepository<User> _userRepo;
        private readonly IGenericRepository<Course> _courseRepo;
        private readonly IEnrollmentRepository _enrollmentRepo;
        private readonly IGenericRepository<Coupon> _couponRepo;
        private readonly IGenericRepository<CouponCourse> _couponCourseRepo;

        public OrderService(
            IGenericRepository<OrderEntity> orderRepo,
            IOrderRepository orderDetailsRepo,
            IGenericRepository<User> userRepo,
            IGenericRepository<Course> courseRepo,
            IEnrollmentRepository enrollmentRepo,
            IGenericRepository<Coupon> couponRepo,
            IGenericRepository<CouponCourse> couponCourseRepo)
        {
            _orderRepo = orderRepo;
            _orderDetailsRepo = orderDetailsRepo;
            _userRepo = userRepo;
            _courseRepo = courseRepo;
            _enrollmentRepo = enrollmentRepo;
            _couponRepo = couponRepo;
            _couponCourseRepo = couponCourseRepo;
        }

        private const string AcademyCurrency = "USD";

        // =========================
        // Create Order
        // =========================


        public async Task<OrderDto> CreateAsync(
            int userId,
            CreateOrderDto dto)
        {
            const string orderCurrency = "USD";

            // ========================================
            // Validate Request
            // ========================================

            if (dto == null ||
                dto.CourseIds == null ||
                dto.CourseIds.Count == 0)
            {
                throw new ArgumentException(
                    "At least one course is required.");
            }

            if (dto.CourseIds.Any(id => id <= 0))
            {
                throw new ArgumentException(
                    "Invalid course ID.");
            }

            var distinctCourseIds = dto.CourseIds
                .Distinct()
                .ToList();

            if (distinctCourseIds.Count != dto.CourseIds.Count)
            {
                throw new InvalidOperationException(
                    "The same course cannot be added more than once.");
            }

            // ========================================
            // Begin Atomic Order Creation
            // ========================================

            var transactionOptions = new TransactionOptions
            {
                IsolationLevel = IsolationLevel.ReadCommitted,
                Timeout = TimeSpan.FromSeconds(60)
            };

            using var transaction = new TransactionScope(
                TransactionScopeOption.Required,
                transactionOptions,
                TransactionScopeAsyncFlowOption.Enabled
            );

            // Only one order creation for this user can
            // proceed at a time.
            await _orderDetailsRepo
                .AcquireUserOrderCreationLockAsync(userId);

            // ========================================
            // Validate User
            // ========================================

            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found.");
            }

            // ========================================
            // Validate Courses And Enrollments
            // ========================================

            var courses = new List<Course>();

            foreach (var courseId in distinctCourseIds)
            {
                var course = await _courseRepo
                    .GetByIdAsync(courseId);

                if (course == null)
                {
                    throw new KeyNotFoundException(
                        $"Course with ID {courseId} was not found.");
                }

                if (!string.Equals(
                        course.Status,
                        "Published",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        $"Course '{course.Title}' is not available for purchase.");
                }

                var enrollment = await _enrollmentRepo
                    .GetByUserAndCourseAsync(
                        userId,
                        courseId);

                if (enrollment != null &&
                    (
                        string.Equals(
                            enrollment.Status,
                            "Active",
                            StringComparison.OrdinalIgnoreCase)
                        ||
                        string.Equals(
                            enrollment.Status,
                            "Completed",
                            StringComparison.OrdinalIgnoreCase)
                    ))
                {
                    throw new InvalidOperationException(
                        $"You are already enrolled in '{course.Title}'.");
                }

                courses.Add(course);
            }

            // ========================================
            // Load Existing Orders
            // ========================================

            var existingOrders = (
                await _orderDetailsRepo
                    .GetByUserIdWithDetailsAsync(userId)
            ).ToList();

            var selectedCourseIds = distinctCourseIds.ToHashSet();

            // ========================================
            // Prevent Repurchasing Paid Courses
            // ========================================

            var existingPaidOrder = existingOrders
                .FirstOrDefault(order =>
                    string.Equals(
                        order.Status,
                        "Paid",
                        StringComparison.OrdinalIgnoreCase)
                    &&
                    order.OrderItems.Any(item =>
                        selectedCourseIds.Contains(item.CourseId))
                );

            if (existingPaidOrder != null)
            {
                throw new InvalidOperationException(
                    "One or more selected courses have already been purchased. " +
                    $"Existing order: {existingPaidOrder.OrderNumber}.");
            }

            // ========================================
            // Check Existing Pending USD Orders
            // ========================================

            var requestedCouponCode =
                dto.CouponCode?.Trim() ?? string.Empty;

            foreach (var existingOrder in existingOrders)
            {
                if (!string.Equals(
                        existingOrder.Status,
                        "Pending",
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                // Never reuse legacy JOD orders as USD.
                if (!string.Equals(
                        existingOrder.Currency,
                        orderCurrency,
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var existingCourseIds = existingOrder.OrderItems
                    .Select(item => item.CourseId)
                    .ToList();

                // Ignore unrelated pending orders.
                var overlaps = existingCourseIds.Any(
                    id => selectedCourseIds.Contains(id));

                if (!overlaps)
                {
                    continue;
                }

                // ====================================
                // Compare Courses
                // ====================================

                var sameCourses =
                    existingCourseIds.Count == distinctCourseIds.Count
                    &&
                    existingCourseIds
                        .ToHashSet()
                        .SetEquals(selectedCourseIds);

                // ====================================
                // Compare Coupon
                // ====================================

                var existingCouponCode =
                    existingOrder.Coupon?.Code?.Trim()
                    ?? string.Empty;

                var sameCoupon = string.Equals(
                    existingCouponCode,
                    requestedCouponCode,
                    StringComparison.OrdinalIgnoreCase
                );

                // ====================================
                // Reuse Identical Pending Order
                // ====================================

                if (sameCourses && sameCoupon)
                {
                    transaction.Complete();

                    return MapToDto(existingOrder);
                }

                // ====================================
                // Reject Conflicting Pending Order
                // ====================================

                throw new InvalidOperationException(
                    "You already have a pending USD order " +
                    "containing one or more selected courses. " +
                    $"Order: {existingOrder.OrderNumber}. " +
                    "Please review your existing order before creating another.");
            }

            // ========================================
            // Create Order Items
            // ========================================

            var orderItems = new List<OrderItem>();

            var discountedCourseIds = new HashSet<int>();

            foreach (var course in courses)
            {
                decimal unitPrice =
                    course.DiscountPrice ?? course.Price;

                if (unitPrice < 0)
                {
                    throw new InvalidOperationException(
                        $"Course '{course.Title}' has an invalid price.");
                }

                // An existing course discount cannot
                // be combined with an additional coupon.
                if (course.DiscountPrice.HasValue &&
                    course.DiscountPrice.Value < course.Price)
                {
                    discountedCourseIds.Add(course.Id);
                }

                var roundedPrice = RoundMoney(unitPrice);

                var item = new OrderItem
                {
                    CourseId = course.Id,
                    CourseTitle = course.Title,
                    UnitPrice = roundedPrice,
                    DiscountAmount = 0,
                    FinalPrice = roundedPrice
                };

                orderItems.Add(item);
            }

            // ========================================
            // Validate And Apply Coupon
            // ========================================

            Coupon? coupon = null;

            if (!string.IsNullOrWhiteSpace(dto.CouponCode))
            {
                coupon = await GetValidCouponAsync(
                    dto.CouponCode);

                await ApplyCouponAsync(
                    coupon,
                    orderItems,
                    discountedCourseIds);
            }

            // ========================================
            // Calculate Totals
            // ========================================

            decimal subtotal = RoundMoney(
                orderItems.Sum(item => item.UnitPrice));

            decimal discountAmount = RoundMoney(
                orderItems.Sum(item => item.DiscountAmount));

            decimal totalAmount = RoundMoney(
                orderItems.Sum(item => item.FinalPrice));

            if (totalAmount < 0)
            {
                totalAmount = 0;
            }

            // ========================================
            // Generate Order Number
            // ========================================

            var orderNumber =
                await GenerateOrderNumberAsync();

            // ========================================
            // Create Order
            // ========================================

            var order = new OrderEntity
            {
                UserId = userId,
                OrderNumber = orderNumber,

                Subtotal = subtotal,
                DiscountAmount = discountAmount,
                TotalAmount = totalAmount,

                Currency = orderCurrency,
                Status = "Pending",

                CreatedAt = DateTime.UtcNow,
                CouponId = coupon?.Id,

                OrderItems = orderItems
            };

            // ========================================
            // Save Order
            // ========================================

            await _orderRepo.AddAsync(order);
            await _orderRepo.SaveChangesAsync();

            // ========================================
            // Reload Order Details
            // ========================================

            var createdOrder = await _orderDetailsRepo
                .GetByIdWithDetailsAsync(order.Id);

            if (createdOrder == null)
            {
                throw new InvalidOperationException(
                    "Order was created but could not be loaded.");
            }

            var result = MapToDto(createdOrder);

            // ========================================
            // Commit Transaction
            // ========================================

            transaction.Complete();

            return result;
        }

        // ========================================
        // Cancel My Pending Order
        // ========================================

        public async Task<OrderDto> CancelPendingAsync(
            int userId,
            int orderId)
        {
            var cancelledOrder = await _orderDetailsRepo
                .CancelPendingWithoutPaymentsAsync(
                    userId,
                    orderId);

            return MapToDto(cancelledOrder);
        }


        // =========================
        // Get My Orders
        // =========================

        public async Task<IEnumerable<OrderDto>> GetMyOrdersAsync(
            int userId)
        {
            var orders = await _orderDetailsRepo
                .GetByUserIdWithDetailsAsync(userId);

            return orders
                .Select(MapToDto)
                .ToList();
        }

        // =========================
        // Get My Order By ID
        // =========================

        public async Task<OrderDto> GetMyOrderByIdAsync(
            int userId,
            int orderId)
        {
            var order = await _orderDetailsRepo
                .GetByIdWithDetailsAsync(orderId);

            if (order == null || order.UserId != userId)
            {
                throw new KeyNotFoundException(
                    "Order was not found.");
            }

            return MapToDto(order);
        }

        // =========================
        // Get And Validate Coupon
        // =========================

        private async Task<Coupon> GetValidCouponAsync(
            string couponCode)
        {
            var code = couponCode.Trim();

            var coupon = await _couponRepo
                .FirstOrDefaultAsync(c => c.Code == code);

            if (coupon == null)
            {
                throw new InvalidOperationException(
                    "Coupon code is invalid.");
            }

            if (!coupon.IsActive)
            {
                throw new InvalidOperationException(
                    "Coupon is not active.");
            }

            var now = DateTime.UtcNow;

            if (now < coupon.StartDate)
            {
                throw new InvalidOperationException(
                    "Coupon is not active yet.");
            }

            if (now > coupon.EndDate)
            {
                throw new InvalidOperationException(
                    "Coupon has expired.");
            }

            if (coupon.UsageLimit.HasValue &&
                coupon.UsedCount >= coupon.UsageLimit.Value)
            {
                throw new InvalidOperationException(
                    "Coupon usage limit has been reached.");
            }

            if (coupon.DiscountValue <= 0)
            {
                throw new InvalidOperationException(
                    "Coupon discount value is invalid.");
            }

            // Percentage Coupon Validation
            if (string.Equals(
                coupon.DiscountType,
                "Percentage",
                StringComparison.OrdinalIgnoreCase))
            {
                if (coupon.DiscountValue > 100)
                {
                    throw new InvalidOperationException(
                        "Percentage coupon cannot exceed 100%.");
                }
            }
            // Fixed Coupon Validation
            else if (!string.Equals(
                coupon.DiscountType,
                "Fixed",
                StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Coupon discount type is invalid.");
            }

            return coupon;
        }

        // =========================
        // Apply Coupon
        // =========================

        private async Task ApplyCouponAsync(
            Coupon coupon,
            List<OrderItem> orderItems,
            HashSet<int> discountedCourseIds)
        {
            var couponCourses = (
                await _couponCourseRepo.FindAsync(
                    cc => cc.CouponId == coupon.Id)
            ).ToList();

            // No CouponCourse records means
            // the coupon applies to all courses.
            bool isGlobalCoupon = couponCourses.Count == 0;

            var allowedCourseIds = couponCourses
                .Select(cc => cc.CourseId)
                .ToHashSet();

            // =========================
            // Find Eligible Courses
            // =========================

            var eligibleItems = orderItems
                .Where(item =>
                    // Do not stack discounts.
                    !discountedCourseIds.Contains(item.CourseId)
                    &&
                    // Respect coupon course restrictions.
                    (
                        isGlobalCoupon ||
                        allowedCourseIds.Contains(item.CourseId)
                    )
                )
                .ToList();

            if (eligibleItems.Count == 0)
            {
                throw new InvalidOperationException(
                    "This coupon cannot be applied because no eligible " +
                    "full-price courses were selected.");
            }

            // =========================
            // Percentage Coupon
            // =========================

            if (string.Equals(
                coupon.DiscountType,
                "Percentage",
                StringComparison.OrdinalIgnoreCase))
            {
                foreach (var item in eligibleItems)
                {
                    var discount = RoundMoney(
                        item.UnitPrice
                        *
                        coupon.DiscountValue
                        /
                        100m);

                    // Never discount more than the price.
                    discount = Math.Min(
                        discount,
                        item.UnitPrice);

                    item.DiscountAmount = discount;

                    item.FinalPrice = RoundMoney(
                        item.UnitPrice - discount);
                }

                return;
            }

            // =========================
            // Fixed Coupon
            // =========================

            decimal eligibleSubtotal = RoundMoney(
                eligibleItems.Sum(i => i.UnitPrice));

            if (eligibleSubtotal <= 0)
            {
                throw new InvalidOperationException(
                    "Coupon cannot be applied to these courses.");
            }

            // Never exceed the eligible subtotal.
            decimal totalFixedDiscount = RoundMoney(
                Math.Min(
                    coupon.DiscountValue,
                    eligibleSubtotal));

            decimal remainingDiscount = totalFixedDiscount;

            // Distribute fixed discount proportionally.
            for (int i = 0; i < eligibleItems.Count; i++)
            {
                var item = eligibleItems[i];

                decimal itemDiscount;

                // Last eligible item gets remaining cents
                // to avoid rounding differences.
                if (i == eligibleItems.Count - 1)
                {
                    itemDiscount = remainingDiscount;
                }
                else
                {
                    itemDiscount = RoundMoney(
                        totalFixedDiscount
                        *
                        item.UnitPrice
                        /
                        eligibleSubtotal);

                    itemDiscount = Math.Min(
                        itemDiscount,
                        remainingDiscount);
                }

                // Do not exceed the item's unit price.
                itemDiscount = Math.Min(
                    itemDiscount,
                    item.UnitPrice);

                item.DiscountAmount = itemDiscount;

                item.FinalPrice = RoundMoney(
                    item.UnitPrice - itemDiscount);

                remainingDiscount = RoundMoney(
                    remainingDiscount - itemDiscount);
            }
        }

        // =========================
        // Generate Unique Order Number
        // =========================

        private async Task<string> GenerateOrderNumberAsync()
        {
            for (int attempt = 0; attempt < 10; attempt++)
            {
                var randomPart = Guid.NewGuid()
                    .ToString("N")
                    .Substring(0, 8)
                    .ToUpperInvariant();

                var orderNumber =
                    $"CMA-ORD-{DateTime.UtcNow.Year}-{randomPart}";

                var exists = await _orderDetailsRepo
                    .OrderNumberExistsAsync(orderNumber);

                if (!exists)
                {
                    return orderNumber;
                }
            }

            throw new InvalidOperationException(
                "Could not generate a unique order number.");
        }

        // =========================
        // Map Order Entity To DTO
        // =========================

        private static OrderDto MapToDto(OrderEntity order)
        {
            return new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                UserId = order.UserId,
                Subtotal = order.Subtotal,
                DiscountAmount = order.DiscountAmount,
                TotalAmount = order.TotalAmount,
                Currency = order.Currency,
                Status = order.Status,
                CouponCode = order.Coupon?.Code,
                CreatedAt = order.CreatedAt,
                PaidAt = order.PaidAt,

                Items = order.OrderItems
                    .Select(item => new OrderItemDto
                    {
                        Id = item.Id,
                        CourseId = item.CourseId,
                        CourseTitle = item.CourseTitle,
                        UnitPrice = item.UnitPrice,
                        DiscountAmount = item.DiscountAmount,
                        FinalPrice = item.FinalPrice
                    })
                    .ToList()
            };
        }

        // =========================
        // Money Rounding
        // =========================

        private static decimal RoundMoney(decimal value)
        {
            return Math.Round(
                value,
                2,
                MidpointRounding.AwayFromZero);
        }
    }
}
