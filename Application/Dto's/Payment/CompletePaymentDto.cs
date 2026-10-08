using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Payment
{
    public class CompletePaymentDto
    {
        [Required]
        [StringLength(200)]
        public string TransactionId { get; set; } = string.Empty;
    }
}