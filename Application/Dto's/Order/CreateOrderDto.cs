using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Order
{
    public class CreateOrderDto
    {
        [Required]
        [MinLength(1)]
        public List<int> CourseIds { get; set; } = new();

        [MaxLength(100)]
        public string? CouponCode { get; set; }
    }
}