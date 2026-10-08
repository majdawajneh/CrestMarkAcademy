using Application.Dto_s.Notification;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrestMarkAcademy.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/notifications")]
    [Authorize(Roles = "Admin")]
    public class AdminNotificationsController
        : ControllerBase
    {
        private readonly INotificationService
            _notificationService;


        public AdminNotificationsController(
            INotificationService notificationService)
        {
            _notificationService =
                notificationService;
        }


        [HttpPost]
        public async Task<ActionResult<NotificationDto>>
            Create(
                CreateNotificationDto dto)
        {
            var notification =
                await _notificationService
                    .CreateAsync(
                        dto.UserId,
                        dto.Title,
                        dto.Message,
                        dto.Type
                    );


            return Ok(notification);
        }
    }
}