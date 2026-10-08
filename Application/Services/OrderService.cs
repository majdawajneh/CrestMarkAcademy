using Application.Dto_s.Order;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Commerce;
using Domain.Entities.Identity;
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


        // =========================
        // Constructor
        // =========================

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


        // =========================
        // Create Order
        // =========================

        public async Task<OrderDto>
            CreateAsync(
                int userId,
                CreateOrderDto dto)
        {
            // =========================
            // Validate User
            // =========================

            var user =
                await _userRepo
                    .GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }


            // =========================
            // Validate Courses
            // =========================

            if (dto.CourseIds == null ||
                dto.CourseIds.Count == 0)
            {
                throw new ArgumentException(
                    "At least one course is required."
                );
            }


            if (dto.CourseIds.Any(id => id <= 0))
            {
                throw new ArgumentException(
                    "Invalid course id."
                );
            }


            var distinctCourseIds =
                dto.CourseIds
                    .Distinct()
                    .ToList();


            if (distinctCourseIds.Count !=
                dto.CourseIds.Count)
            {
                throw new InvalidOperationException(
                    "The same course cannot be added more than once."
                );
            }


            var courses =
                new List<Course>();


            foreach (var courseId
                     in distinctCourseIds)
            {
                var course =
                    await _courseRepo
                        .GetByIdAsync(courseId);


                if (course == null)
                {
                    throw new KeyNotFoundException(
                        $"Course with id {courseId} was not found."
                    );
                }


                if (!string.Equals(
                        course.Status,
                        "Published",
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        $"Course '{course.Title}' is not available for purchase."
                    );
                }


                // =========================
                // Check Existing Enrollment
                // =========================

                var enrollment =
                    await _enrollmentRepo
                        .GetByUserAndCourseAsync(
                            userId,
                            courseId
                        );


                if (enrollment != null &&
                    (
                        string.Equals(
                            enrollment.Status,
                            "Active",
                            StringComparison.OrdinalIgnoreCase
                        )
                        ||
                        string.Equals(
                            enrollment.Status,
                            "Completed",
                            StringComparison.OrdinalIgnoreCase
                        )
                    ))
                {
                    throw new InvalidOperationException(
                        $"You are already enrolled in '{course.Title}'."
                    );
                }


                courses.Add(course);
            }


            // =========================
            // Create Order Items
            // Before Coupon
            // =========================

            var orderItems =
                new List<OrderItem>();


            foreach (var course in courses)
            {
                decimal unitPrice =
                    course.DiscountPrice
                    ?? course.Price;


                if (unitPrice < 0)
                {
                    throw new InvalidOperationException(
                        $"Course '{course.Title}' has an invalid price."
                    );
                }


                var item =
                    new OrderItem
                    {
                        CourseId = course.Id,

                        CourseTitle =
                            course.Title,

                        UnitPrice =
                            RoundMoney(unitPrice),

                        DiscountAmount = 0,

                        FinalPrice =
                            RoundMoney(unitPrice)
                    };


                orderItems.Add(item);
            }


            // =========================
            // Coupon
            // =========================

            Coupon? coupon = null;


            if (!string.IsNullOrWhiteSpace(
                    dto.CouponCode))
            {
                coupon =
                    await GetValidCouponAsync(
                        dto.CouponCode
                    );


                await ApplyCouponAsync(
                    coupon,
                    orderItems
                );
            }


            // =========================
            // Calculate Totals
            // =========================

            decimal subtotal =
                RoundMoney(
                    orderItems.Sum(
                        i => i.UnitPrice
                    )
                );


            decimal discountAmount =
                RoundMoney(
                    orderItems.Sum(
                        i => i.DiscountAmount
                    )
                );


            decimal totalAmount =
                RoundMoney(
                    orderItems.Sum(
                        i => i.FinalPrice
                    )
                );


            if (totalAmount < 0)
            {
                totalAmount = 0;
            }


            // =========================
            // Generate Order Number
            // =========================

            var orderNumber =
                await GenerateOrderNumberAsync();


            // =========================
            // Create Order
            // =========================

            var order =
                new OrderEntity
                {
                    UserId = userId,

                    OrderNumber =
                        orderNumber,

                    Subtotal =
                        subtotal,

                    DiscountAmount =
                        discountAmount,

                    TotalAmount =
                        totalAmount,

                    Currency = "JOD",

                    Status = "Pending",

                    CreatedAt =
                        DateTime.UtcNow,

                    CouponId =
                        coupon?.Id,

                    OrderItems =
                        orderItems
                };


            await _orderRepo
                .AddAsync(order);


            await _orderRepo
                .SaveChangesAsync();


            // =========================
            // Reload Details
            // =========================

            var createdOrder =
                await _orderDetailsRepo
                    .GetByIdWithDetailsAsync(
                        order.Id
                    );


            if (createdOrder == null)
            {
                throw new InvalidOperationException(
                    "Order was created but could not be loaded."
                );
            }


            return MapToDto(createdOrder);
        }


        // =========================
        // Get My Orders
        // =========================

        public async Task<IEnumerable<OrderDto>>
            GetMyOrdersAsync(int userId)
        {
            var orders =
                await _orderDetailsRepo
                    .GetByUserIdWithDetailsAsync(
                        userId
                    );


            return orders
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Get My Order By Id
        // =========================

        public async Task<OrderDto>
            GetMyOrderByIdAsync(
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


            return MapToDto(order);
        }


        // =========================
        // Get And Validate Coupon
        // =========================

        private async Task<Coupon>
            GetValidCouponAsync(
                string couponCode)
        {
            var code =
                couponCode.Trim();


            var coupon =
                await _couponRepo
                    .FirstOrDefaultAsync(
                        c => c.Code == code
                    );


            if (coupon == null)
            {
                throw new InvalidOperationException(
                    "Coupon code is invalid."
                );
            }


            if (!coupon.IsActive)
            {
                throw new InvalidOperationException(
                    "Coupon is not active."
                );
            }


            var now =
                DateTime.UtcNow;


            if (now < coupon.StartDate)
            {
                throw new InvalidOperationException(
                    "Coupon is not active yet."
                );
            }


            if (now > coupon.EndDate)
            {
                throw new InvalidOperationException(
                    "Coupon has expired."
                );
            }


            if (coupon.UsageLimit.HasValue &&
                coupon.UsedCount >=
                coupon.UsageLimit.Value)
            {
                throw new InvalidOperationException(
                    "Coupon usage limit has been reached."
                );
            }


            if (coupon.DiscountValue <= 0)
            {
                throw new InvalidOperationException(
                    "Coupon discount value is invalid."
                );
            }


            if (string.Equals(
                    coupon.DiscountType,
                    "Percentage",
                    StringComparison.OrdinalIgnoreCase))
            {
                if (coupon.DiscountValue > 100)
                {
                    throw new InvalidOperationException(
                        "Percentage coupon cannot exceed 100%."
                    );
                }
            }
            else if (!string.Equals(
                         coupon.DiscountType,
                         "Fixed",
                         StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Coupon discount type is invalid."
                );
            }


            return coupon;
        }


        // =========================
        // Apply Coupon
        // =========================

        private async Task ApplyCouponAsync(
            Coupon coupon,
            List<OrderItem> orderItems)
        {
            var couponCourses =
                (
                    await _couponCourseRepo
                        .FindAsync(
                            cc =>
                                cc.CouponId ==
                                coupon.Id
                        )
                )
                .ToList();


            // If CouponCourse is empty:
            // Coupon applies to all courses.

            bool isGlobalCoupon =
                couponCourses.Count == 0;


            var allowedCourseIds =
                couponCourses
                    .Select(
                        cc => cc.CourseId
                    )
                    .ToHashSet();


            var eligibleItems =
                orderItems
                    .Where(
                        item =>
                            isGlobalCoupon
                            ||
                            allowedCourseIds.Contains(
                                item.CourseId
                            )
                    )
                    .ToList();


            if (eligibleItems.Count == 0)
            {
                throw new InvalidOperationException(
                    "This coupon does not apply to the selected courses."
                );
            }


            // =========================
            // Percentage Coupon
            // =========================

            if (string.Equals(
                    coupon.DiscountType,
                    "Percentage",
                    StringComparison.OrdinalIgnoreCase))
            {
                foreach (var item
                         in eligibleItems)
                {
                    var discount =
                        RoundMoney(
                            item.UnitPrice
                            *
                            coupon.DiscountValue
                            /
                            100m
                        );


                    discount =
                        Math.Min(
                            discount,
                            item.UnitPrice
                        );


                    item.DiscountAmount =
                        discount;


                    item.FinalPrice =
                        RoundMoney(
                            item.UnitPrice
                            -
                            discount
                        );
                }


                return;
            }


            // =========================
            // Fixed Coupon
            // =========================

            decimal eligibleSubtotal =
                RoundMoney(
                    eligibleItems.Sum(
                        i => i.UnitPrice
                    )
                );


            if (eligibleSubtotal <= 0)
            {
                throw new InvalidOperationException(
                    "Coupon cannot be applied to these courses."
                );
            }


            decimal totalFixedDiscount =
                Math.Min(
                    coupon.DiscountValue,
                    eligibleSubtotal
                );


            totalFixedDiscount =
                RoundMoney(
                    totalFixedDiscount
                );


            decimal remainingDiscount =
                totalFixedDiscount;


            for (int i = 0;
                 i < eligibleItems.Count;
                 i++)
            {
                var item =
                    eligibleItems[i];


                decimal itemDiscount;


                // Last item gets remaining cents
                // to avoid rounding difference.

                if (i ==
                    eligibleItems.Count - 1)
                {
                    itemDiscount =
                        remainingDiscount;
                }
                else
                {
                    itemDiscount =
                        RoundMoney(
                            totalFixedDiscount
                            *
                            item.UnitPrice
                            /
                            eligibleSubtotal
                        );


                    itemDiscount =
                        Math.Min(
                            itemDiscount,
                            remainingDiscount
                        );
                }


                itemDiscount =
                    Math.Min(
                        itemDiscount,
                        item.UnitPrice
                    );


                item.DiscountAmount =
                    itemDiscount;


                item.FinalPrice =
                    RoundMoney(
                        item.UnitPrice
                        -
                        itemDiscount
                    );


                remainingDiscount =
                    RoundMoney(
                        remainingDiscount
                        -
                        itemDiscount
                    );
            }
        }


        // =========================
        // Generate Order Number
        // =========================

        private async Task<string>
            GenerateOrderNumberAsync()
        {
            for (int attempt = 0;
                 attempt < 10;
                 attempt++)
            {
                var randomPart =
                    Guid.NewGuid()
                        .ToString("N")
                        .Substring(0, 8)
                        .ToUpperInvariant();


                var orderNumber =
                    $"CMA-ORD-{DateTime.UtcNow.Year}-{randomPart}";


                var exists =
                    await _orderDetailsRepo
                        .OrderNumberExistsAsync(
                            orderNumber
                        );


                if (!exists)
                {
                    return orderNumber;
                }
            }


            throw new InvalidOperationException(
                "Could not generate a unique order number."
            );
        }


        // =========================
        // Map Order
        // =========================

        private static OrderDto MapToDto(
            OrderEntity order)
        {
            return new OrderDto
            {
                Id = order.Id,

                OrderNumber =
                    order.OrderNumber,

                UserId =
                    order.UserId,

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


        // =========================
        // Money Rounding
        // =========================

        private static decimal RoundMoney(
            decimal value)
        {
            return Math.Round(
                value,
                2,
                MidpointRounding.AwayFromZero
            );
        }
    }
}