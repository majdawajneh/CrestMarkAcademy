using Application.Dto_s.Enrollment;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Engagement;
using Domain.Entities.Identity;
using Domain.Entities.Learning;

namespace Application.Services
{
    public class EnrollmentService
        : IEnrollmentService
    {
        private const string ActiveStatus =
            "Active";

        private const string CancelledStatus =
            "Cancelled";

        private const string CompletedStatus =
            "Completed";


        private readonly
            IGenericRepository<Enrollment>
            _enrollmentRepo;

        private readonly
            IEnrollmentRepository
            _enrollmentDetailsRepo;

        private readonly
            IGenericRepository<User>
            _userRepo;

        private readonly
            IGenericRepository<Course>
            _courseRepo;

        private readonly
            IGenericRepository<Notification>
            _notificationRepo;


        // =========================
        // Constructor
        // =========================

        public EnrollmentService(
            IGenericRepository<Enrollment> enrollmentRepo,
            IEnrollmentRepository enrollmentDetailsRepo,
            IGenericRepository<User> userRepo,
            IGenericRepository<Course> courseRepo,
            IGenericRepository<Notification> notificationRepo)
        {
            _enrollmentRepo =
                enrollmentRepo;

            _enrollmentDetailsRepo =
                enrollmentDetailsRepo;

            _userRepo =
                userRepo;

            _courseRepo =
                courseRepo;

            _notificationRepo =
                notificationRepo;
        }


        // =========================
        // Get Enrollment By Id
        // =========================

        public async Task<EnrollmentDto?>
            GetByIdAsync(
                int id)
        {
            var enrollment =
                await _enrollmentDetailsRepo
                    .GetByIdWithCourseAsync(
                        id
                    );


            if (enrollment == null)
            {
                return null;
            }


            return MapToDto(
                enrollment
            );
        }


        // =========================
        // Get Enrollment
        // By User + Course
        // =========================

        public async Task<EnrollmentDto?>
            GetByUserAndCourseAsync(
                int userId,
                int courseId)
        {
            var enrollment =
                await _enrollmentDetailsRepo
                    .GetByUserAndCourseAsync(
                        userId,
                        courseId
                    );


            if (enrollment == null)
            {
                return null;
            }


            return MapToDto(
                enrollment
            );
        }


        // =========================
        // Get My Courses
        // =========================

        public async Task<IEnumerable<MyCourseDto>>
            GetMyCoursesAsync(
                int userId)
        {
            await ValidateUserAsync(
                userId
            );


            var enrollments =
                await _enrollmentDetailsRepo
                    .GetByUserIdWithCoursesAsync(
                        userId
                    );


            return enrollments
                .Where(
                    e =>
                        string.Equals(
                            e.Status,
                            ActiveStatus,
                            StringComparison.OrdinalIgnoreCase
                        )
                        ||
                        string.Equals(
                            e.Status,
                            CompletedStatus,
                            StringComparison.OrdinalIgnoreCase
                        )
                )
                .Select(
                    MapToMyCourseDto
                )
                .ToList();
        }


        // =========================
        // Enroll User
        // =========================

        public async Task<EnrollmentDto>
            EnrollUserAsync(
                int userId,
                int courseId)
        {
            await ValidateUserAsync(
                userId
            );


            var course =
                await ValidateCourseForEnrollmentAsync(
                    courseId
                );


            // =========================
            // Prevent Duplicate
            // =========================

            var existingEnrollment =
                await _enrollmentDetailsRepo
                    .GetByUserAndCourseAsync(
                        userId,
                        courseId
                    );


            if (existingEnrollment != null)
            {
                throw new InvalidOperationException(
                    "User is already enrolled in this course. If the enrollment is cancelled, reactivate it instead."
                );
            }


            var now =
                DateTime.UtcNow;


            var enrollment =
                new Enrollment
                {
                    UserId =
                        userId,

                    CourseId =
                        courseId,

                    EnrolledAt =
                        now,

                    CompletedAt =
                        null,

                    Status =
                        ActiveStatus
                };


            await _enrollmentRepo
                .AddAsync(
                    enrollment
                );


            // =========================
            // Enrollment Notification
            // =========================

            await _notificationRepo
                .AddAsync(
                    new Notification
                    {
                        UserId =
                            userId,

                        Title =
                            "Course Enrollment",

                        Message =
                            $"You have been enrolled in {course.Title}.",

                        Type =
                            "Enrollment",

                        IsRead =
                            false,

                        CreatedAt =
                            now
                    }
                );


            // Enrollment + Notification
            // are saved together.

            await _enrollmentRepo
                .SaveChangesAsync();


            return MapToDto(
                enrollment
            );
        }


        // =========================
        // Cancel Enrollment
        // =========================

        public async Task<EnrollmentDto>
            CancelAsync(
                int id)
        {
            var enrollment =
                await _enrollmentRepo
                    .GetByIdAsync(
                        id
                    );


            if (enrollment == null)
            {
                throw new KeyNotFoundException(
                    "Enrollment was not found."
                );
            }


            // Idempotent:
            // don't create duplicate
            // cancellation notifications.

            if (string.Equals(
                    enrollment.Status,
                    CancelledStatus,
                    StringComparison.OrdinalIgnoreCase))
            {
                return MapToDto(
                    enrollment
                );
            }


            var now =
                DateTime.UtcNow;


            enrollment.Status =
                CancelledStatus;


            // =========================
            // Cancellation Notification
            // =========================

            await _notificationRepo
                .AddAsync(
                    new Notification
                    {
                        UserId =
                            enrollment.UserId,

                        Title =
                            "Enrollment Cancelled",

                        Message =
                            "Your course enrollment has been cancelled.",

                        Type =
                            "Enrollment",

                        IsRead =
                            false,

                        CreatedAt =
                            now
                    }
                );


            _enrollmentRepo.Update(
                enrollment
            );


            await _enrollmentRepo
                .SaveChangesAsync();


            return MapToDto(
                enrollment
            );
        }


        // =========================
        // Reactivate Enrollment
        // =========================

        public async Task<EnrollmentDto>
            ReactivateAsync(
                int id)
        {
            var enrollment =
                await _enrollmentRepo
                    .GetByIdAsync(
                        id
                    );


            if (enrollment == null)
            {
                throw new KeyNotFoundException(
                    "Enrollment was not found."
                );
            }


            // Idempotent:
            // don't create duplicate
            // reactivation notifications.

            if (string.Equals(
                    enrollment.Status,
                    ActiveStatus,
                    StringComparison.OrdinalIgnoreCase))
            {
                return MapToDto(
                    enrollment
                );
            }


            if (!string.Equals(
                    enrollment.Status,
                    CancelledStatus,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only cancelled enrollments can be reactivated."
                );
            }


            await ValidateUserAsync(
                enrollment.UserId
            );


            var course =
                await ValidateCourseForEnrollmentAsync(
                    enrollment.CourseId
                );


            var now =
                DateTime.UtcNow;


            enrollment.Status =
                ActiveStatus;

            enrollment.EnrolledAt =
                now;

            enrollment.CompletedAt =
                null;


            // =========================
            // Reactivation Notification
            // =========================

            await _notificationRepo
                .AddAsync(
                    new Notification
                    {
                        UserId =
                            enrollment.UserId,

                        Title =
                            "Enrollment Reactivated",

                        Message =
                            $"Your enrollment in {course.Title} has been reactivated.",

                        Type =
                            "Enrollment",

                        IsRead =
                            false,

                        CreatedAt =
                            now
                    }
                );


            _enrollmentRepo.Update(
                enrollment
            );


            await _enrollmentRepo
                .SaveChangesAsync();


            return MapToDto(
                enrollment
            );
        }


        // =========================
        // Check Active Enrollment
        // =========================

        public async Task<bool>
            HasActiveEnrollmentAsync(
                int userId,
                int courseId)
        {
            return await _enrollmentRepo
                .ExistsAsync(
                    e =>
                        e.UserId == userId &&
                        e.CourseId == courseId &&
                        e.Status == ActiveStatus
                );
        }


        // =========================
        // Validate User
        // =========================

        private async Task
            ValidateUserAsync(
                int userId)
        {
            var user =
                await _userRepo
                    .GetByIdAsync(
                        userId
                    );


            if (user == null)
            {
                throw new KeyNotFoundException(
                    "User was not found."
                );
            }


            if (!user.IsActive)
            {
                throw new InvalidOperationException(
                    "User account is inactive."
                );
            }
        }


        // =========================
        // Validate Course
        // =========================

        private async Task<Course>
            ValidateCourseForEnrollmentAsync(
                int courseId)
        {
            var course =
                await _courseRepo
                    .GetByIdAsync(
                        courseId
                    );


            if (course == null)
            {
                throw new KeyNotFoundException(
                    "Course was not found."
                );
            }


            if (!string.Equals(
                    course.Status,
                    "Published",
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Only published courses can accept enrollments."
                );
            }


            return course;
        }


        // =========================
        // Map To EnrollmentDto
        // =========================

        private static EnrollmentDto
            MapToDto(
                Enrollment enrollment)
        {
            return new EnrollmentDto
            {
                Id =
                    enrollment.Id,

                UserId =
                    enrollment.UserId,

                CourseId =
                    enrollment.CourseId,

                EnrolledAt =
                    enrollment.EnrolledAt,

                CompletedAt =
                    enrollment.CompletedAt,

                Status =
                    enrollment.Status
            };
        }


        // =========================
        // Map To MyCourseDto
        // =========================

        private static MyCourseDto
            MapToMyCourseDto(
                Enrollment enrollment)
        {
            return new MyCourseDto
            {
                EnrollmentId =
                    enrollment.Id,

                CourseId =
                    enrollment.CourseId,

                Title =
                    enrollment.Course.Title,

                Slug =
                    enrollment.Course.Slug,

                ThumbnailUrl =
                    enrollment.Course.ThumbnailUrl,

                EnrollmentStatus =
                    enrollment.Status,

                EnrolledAt =
                    enrollment.EnrolledAt,

                CompletedAt =
                    enrollment.CompletedAt
            };
        }
    }
}