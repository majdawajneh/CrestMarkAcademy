namespace Application.Dto_s.Payment
{
    public class AdminPaymentDto
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public int UserId { get; set; }

        public string UserEmail { get; set; } = string.Empty;

        public string PaymentProvider { get; set; } = string.Empty;

        public string? TransactionId { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? PaidAt { get; set; }

        public DateTime? FailedAt { get; set; }
    }
}