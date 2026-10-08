using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Payment
{
    public class CreatePaymentDto
    {
        [Required]
        [StringLength(50)]
        public string PaymentProvider { get; set; } = string.Empty;
    }
}