using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Coupon
{
    public class UpdateCouponDto
    {
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public string DiscountType { get; set; } = "Percentage";

        [Range(0.01, double.MaxValue)]
        public decimal DiscountValue { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue)]
        public int? UsageLimit { get; set; }

        public bool IsActive { get; set; }

        public List<int> CourseIds { get; set; } = new();
    }
}