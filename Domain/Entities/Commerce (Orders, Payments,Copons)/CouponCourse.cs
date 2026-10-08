using Domain.Entities.Catalog;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Commerce
{
    public class CouponCourse
    {
        public int CouponId { get; set; }

        public int CourseId { get; set; }


        // Navigation Properties

        public Coupon Coupon { get; set; } = null!;

        public Course Course { get; set; } = null!;
    }
}
