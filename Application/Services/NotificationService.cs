using Application.Dto_s.Notification;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Engagement;
using Domain.Entities.Identity;

namespace Application.Services
{
    public class NotificationService
        : INotificationService
    {
        private readonly
            IGenericRepository<Notification>
            _notificationRepo;

        private readonly
            IGenericRepository<User>
            _userRepo;


        public NotificationService(
            IGenericRepository<Notification> notificationRepo,
            IGenericRepository<User> userRepo)
        {
            _notificationRepo =
                notificationRepo;

            _userRepo =
                userRepo;
        }


        // =========================
        // Get My Notifications
        // =========================

        public async Task<
            IEnumerable<NotificationDto>>
            GetMyNotificationsAsync(
                int userId)
        {
            var notifications =
                await _notificationRepo
                    .FindAsync(
                        n =>
                            n.UserId ==
                            userId
                    );


            return notifications
                .OrderByDescending(
                    n => n.CreatedAt
                )
                .Select(MapToDto)
                .ToList();
        }


        // =========================
        // Unread Count
        // =========================

        public async Task<int>
            GetUnreadCountAsync(
                int userId)
        {
            var notifications =
                await _notificationRepo
                    .FindAsync(
                        n =>
                            n.UserId ==
                            userId
                            &&
                            !n.IsRead
                    );


            return notifications.Count();
        }


        // =========================
        // Mark As Read
        // =========================

        public async Task MarkAsReadAsync(
            int userId,
            int notificationId)
        {
            var notification =
                await _notificationRepo
                    .GetByIdAsync(
                        notificationId
                    );


            if (notification == null ||
                notification.UserId != userId)
            {
                throw new KeyNotFoundException(
                    "Notification was not found."
                );
            }


            if (notification.IsRead)
            {
                return;
            }


            notification.IsRead =
                true;

            notification.ReadAt =
                DateTime.UtcNow;


            _notificationRepo.Update(
                notification
            );


            await _notificationRepo
                .SaveChangesAsync();
        }


        // =========================
        // Mark All As Read
        // =========================

        public async Task
            MarkAllAsReadAsync(
                int userId)
        {
            var notifications =
                (
                    await _notificationRepo
                        .FindAsync(
                            n =>
                                n.UserId ==
                                userId
                                &&
                                !n.IsRead
                        )
                )
                .ToList();


            if (notifications.Count == 0)
            {
                return;
            }


            var now =
                DateTime.UtcNow;


            foreach (var notification
                     in notifications)
            {
                notification.IsRead =
                    true;

                notification.ReadAt =
                    now;


                _notificationRepo.Update(
                    notification
                );
            }


            await _notificationRepo
                .SaveChangesAsync();
        }


        // =========================
        // Create Notification
        // =========================

        public async Task<NotificationDto>
            CreateAsync(
                int userId,
                string title,
                string message,
                string type)
        {
            var userExists =
                await _userRepo
                    .ExistsAsync(
                        u =>
                            u.Id ==
                            userId
                    );


            if (!userExists)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }


            if (string.IsNullOrWhiteSpace(
                    title))
            {
                throw new ArgumentException(
                    "Notification title is required."
                );
            }


            if (string.IsNullOrWhiteSpace(
                    message))
            {
                throw new ArgumentException(
                    "Notification message is required."
                );
            }


            if (string.IsNullOrWhiteSpace(
                    type))
            {
                type = "General";
            }


            var notification =
                new Notification
                {
                    UserId =
                        userId,

                    Title =
                        title.Trim(),

                    Message =
                        message.Trim(),

                    Type =
                        type.Trim(),

                    IsRead =
                        false,

                    CreatedAt =
                        DateTime.UtcNow
                };


            await _notificationRepo
                .AddAsync(
                    notification
                );


            await _notificationRepo
                .SaveChangesAsync();


            return MapToDto(
                notification
            );
        }


        private static NotificationDto
            MapToDto(
                Notification notification)
        {
            return new NotificationDto
            {
                Id =
                    notification.Id,

                Title =
                    notification.Title,

                Message =
                    notification.Message,

                Type =
                    notification.Type,

                IsRead =
                    notification.IsRead,

                CreatedAt =
                    notification.CreatedAt,

                ReadAt =
                    notification.ReadAt
            };
        }
    }
}