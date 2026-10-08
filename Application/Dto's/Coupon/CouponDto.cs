namespace Application.Dto_s.Coupon
{
    public class CouponDto
    {
        public int Id { get; set; }

        public string Code { get; set; } = string.Empty;

        public string DiscountType { get; set; } = string.Empty;

        public decimal DiscountValue { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int? UsageLimit { get; set; }

        public int UsedCount { get; set; }

        public bool IsActive { get; set; }

        public bool IsGlobal { get; set; }

        public List<int> CourseIds { get; set; } = new();
    }
}