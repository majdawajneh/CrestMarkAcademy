using Domain.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Commerce
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "JOD";
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }

        // Navigation Properties

        public User User { get; set; } = null!;
        public int? CouponId { get; set; }
        public Coupon? Coupon { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
