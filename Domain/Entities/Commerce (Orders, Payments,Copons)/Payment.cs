
using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities.Commerce
{
    public class Payment
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        public string PaymentProvider { get; set; } = string.Empty;

        // PayTabs transaction reference created
        // when the checkout session starts.
        [MaxLength(128)]
        public string? GatewayTransactionReference { get; set; }

        [MaxLength(32)]
        public string CheckoutStatus { get; set; } = "NotStarted";

        public DateTime? CheckoutStartedAt { get; set; }

        // Confirmed transaction reference
        // after successful payment.
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
