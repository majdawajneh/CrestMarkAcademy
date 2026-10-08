using Application.Dto_s.Notification;

namespace Application.Services.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDto>>
            GetMyNotificationsAsync(
                int userId
            );

        Task<int>
            GetUnreadCountAsync(
                int userId
            );

        Task MarkAsReadAsync(
            int userId,
            int notificationId
        );

        Task MarkAllAsReadAsync(
            int userId
        );

        Task<NotificationDto>
            CreateAsync(
                int userId,
                string title,
                string message,
                string type
            );
    }
}