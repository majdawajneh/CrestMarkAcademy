using Application.Dto_s.Notification;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrestMarkAcademy.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController
        : ControllerBase
    {
        private readonly INotificationService
            _notificationService;


        public NotificationsController(
            INotificationService notificationService)
        {
            _notificationService =
                notificationService;
        }


        [HttpGet]
        public async Task<
            ActionResult<IEnumerable<NotificationDto>>>
            GetMyNotifications()
        {
            var userId =
                GetCurrentUserId();


            var notifications =
                await _notificationService
                    .GetMyNotificationsAsync(
                        userId
                    );


            return Ok(notifications);
        }


        [HttpGet("unread-count")]
        public async Task<IActionResult>
            GetUnreadCount()
        {
            var userId =
                GetCurrentUserId();


            var count =
                await _notificationService
                    .GetUnreadCountAsync(
                        userId
                    );


            return Ok(new
            {
                UnreadCount = count
            });
        }


        [HttpPatch("{id:int}/read")]
        public async Task<IActionResult>
            MarkAsRead(
                int id)
        {
            var userId =
                GetCurrentUserId();


            await _notificationService
                .MarkAsReadAsync(
                    userId,
                    id
                );


            return NoContent();
        }


        [HttpPatch("read-all")]
        public async Task<IActionResult>
            MarkAllAsRead()
        {
            var userId =
                GetCurrentUserId();


            await _notificationService
                .MarkAllAsReadAsync(
                    userId
                );


            return NoContent();
        }


        private int GetCurrentUserId()
        {
            var value =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );


            if (!int.TryParse(
                    value,
                    out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid user token."
                );
            }


            return userId;
        }
    }
}