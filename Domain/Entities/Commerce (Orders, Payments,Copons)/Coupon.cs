using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Commerce
{
    public class Coupon
    {
        public int Id { get; set; }

        public string Code { get; set; } = string.Empty;

        public string DiscountType { get; set; } = "Percentage";

        public decimal DiscountValue { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int? UsageLimit { get; set; }

        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;


        // Navigation Properties

        public ICollection<CouponCourse> CouponCourses { get; set; } = new List<CouponCourse>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
