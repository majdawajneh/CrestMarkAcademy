using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities.Commerce
{
    public class Payment
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public string PaymentProvider { get; set; } = string.Empty;

        public string? TransactionId { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "JOD";

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PaidAt { get; set; }

        public DateTime? FailedAt { get; set; }


        // Navigation Property

        public Order Order { get; set; } = null!;
    }
}
