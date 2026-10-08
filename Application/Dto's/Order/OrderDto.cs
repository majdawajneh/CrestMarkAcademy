namespace Application.Dto_s.Order
{
    public class OrderDto
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public int UserId { get; set; }

        public decimal Subtotal { get; set; }

        public decimal DiscountAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public string Currency { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string? CouponCode { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? PaidAt { get; set; }

        public List<OrderItemDto> Items { get; set; } = new();
    }
}