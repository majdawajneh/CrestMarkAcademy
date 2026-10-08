using System.ComponentModel.DataAnnotations;

namespace Application.Dto_s.Notification
{
    public class CreateNotificationDto
    {
        [Range(1, int.MaxValue)]
        public int UserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = "General";
    }
}