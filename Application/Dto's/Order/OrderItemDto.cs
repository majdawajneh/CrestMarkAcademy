namespace Application.Dto_s.Order
{
    public class OrderItemDto
    {
        public int Id { get; set; }

        public int CourseId { get; set; }

        public string CourseTitle { get; set; } = string.Empty;

        public decimal UnitPrice { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal FinalPrice { get; set; }
    }
}