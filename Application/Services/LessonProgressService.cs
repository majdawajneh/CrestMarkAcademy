using Application.Dto_s.LessonProgress;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Catalog;
using Domain.Entities.Learning;


namespace Application.Services
{
    public class LessonProgressService
        : ILessonProgressService
    {
        private const string ActiveStatus =
            "Active";

        private const string CompletedStatus =
            "Completed";


        private readonly
            IGenericRepository<LessonProgress>
            _progressRepo;

        private readonly
            IGenericRepository<Enrollment>
            _enrollmentRepo;

        private readonly
            IEnrollmentRepository
            _enrollmentDetailsRepo;

        private readonly
            ILessonProgressRepository
            _progressDetailsRepo;

        private readonly ICertificateService _certificateService;


        // =========================
        // Constructor
        // =========================

        public LessonProgressService(
            IGenericRepository<LessonProgress> progressRepo,
            IGenericRepository<Enrollment> enrollmentRepo,
            IEnrollmentRepository enrollmentDetailsRepo,
            ILessonProgressRepository progressDetailsRepo,
            ICertificateService certificateService)
        {
            _progressRepo = progressRepo;
            _enrollmentRepo = enrollmentRepo;
            _enrollmentDetailsRepo = enrollmentDetailsRepo;
            _progressDetailsRepo = progressDetailsRepo;
            _certificateService = certificateService;
        }


        // =========================
        // Get Lesson Progress
        // =========================

        public async Task<LessonProgressDto?>
            GetLessonProgressAsync(
                int userId,
                int lessonId)
        {
            var lesson =
                await GetPublishedLessonAsync(
                    lessonId
                );


            var courseId =
                lesson.CourseSection.CourseId;


            var enrollment =
                await GetAccessibleEnrollmentAsync(
                    userId,
                    courseId
                );


            var progress =
                await _progressRepo
                    .FirstOrDefaultAsync(
                        p =>
                            p.EnrollmentId
                                == enrollment.Id
                            &&
                            p.LessonId
                                == lessonId
                    );


            if (progress == null)
            {
                return null;
            }


            return MapToDto(progress);
        }


        // =========================
        // Update Lesson Progress
        // Create Or Update
        // =========================

        public async Task<LessonProgressDto>
            UpdateProgressAsync(
                int userId,
                int lessonId,
                UpdateLessonProgressDto dto)
        {
            var lesson =
                await GetPublishedLessonAsync(
                    lessonId
                );


            var courseId =
                lesson.CourseSection.CourseId;


            var enrollment =
                await GetAccessibleEnrollmentAsync(
                    userId,
                    courseId
                );


            var lastPosition =
                ValidateAndNormalizePosition(
                    lesson,
                    dto.LastPositionSeconds
                );


            var progress =
                await _progressRepo
                    .FirstOrDefaultAsync(
                        p =>
                            p.EnrollmentId
                                == enrollment.Id
                            &&
                            p.LessonId
                                == lessonId
                    );


            // =========================
            // First Time
            // Create Progress
            // =========================

            if (progress == null)
            {
                progress =
                    new LessonProgress
                    {
                        EnrollmentId =
                            enrollment.Id,

                        LessonId =
                            lessonId,

                        LastPositionSeconds =
                            lastPosition,

                        IsCompleted =
                            dto.IsCompleted,

                        CompletedAt =
                            dto.IsCompleted
                                ? DateTime.UtcNow
                                : null,

                        UpdatedAt =
                            DateTime.UtcNow
                    };


                await _progressRepo
                    .AddAsync(progress);
            }

            // =========================
            // Existing Progress
            // Update
            // =========================

            else
            {
                progress.LastPositionSeconds =
                    lastPosition;


                /*
                 * Once a lesson is completed,
                 * we do not accidentally
                 * mark it incomplete again.
                 */

                if (!progress.IsCompleted &&
                    dto.IsCompleted)
                {
                    progress.IsCompleted =
                        true;

                    progress.CompletedAt =
                        DateTime.UtcNow;
                }


                progress.UpdatedAt =
                    DateTime.UtcNow;


                _progressRepo.Update(progress);
            }


            await _progressRepo
                .SaveChangesAsync();


            // Recalculate Course Progress
            // and complete Enrollment if needed.

            await UpdateEnrollmentCompletionAsync(
                enrollment
            );


            return MapToDto(progress);
        }


        // =========================
        // Get Course Progress
        // =========================

        public async Task<CourseProgressDto>
            GetCourseProgressAsync(
                int userId,
                int courseId)
        {
            var enrollment =
                await GetAccessibleEnrollmentAsync(
                    userId,
                    courseId
                );


            return await CalculateCourseProgressAsync(
                enrollment
            );
        }


        // =========================
        // Get Published Lesson
        // + Section + Course
        // =========================

        private async Task<Lesson>
            GetPublishedLessonAsync(
                int lessonId)
        {
            var lesson =
                await _progressDetailsRepo
                    .GetLessonWithCourseAsync(
                        lessonId
                    );


            if (lesson == null)
            {
                throw new KeyNotFoundException(
                    "Lesson was not found."
                );
            }


            if (!lesson.IsPublished)
            {
                throw new InvalidOperationException(
                    "Progress cannot be updated for an unpublished lesson."
                );
            }


            return lesson;
        }


        // =========================
        // Get Enrollment
        // User Must Have Access
        // =========================

        private async Task<Enrollment>
            GetAccessibleEnrollmentAsync(
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
                throw new UnauthorizedAccessException(
                    "You are not enrolled in this course."
                );
            }


            if (enrollment.Status != ActiveStatus &&
                enrollment.Status != CompletedStatus)
            {
                throw new UnauthorizedAccessException(
                    "You do not have access to this course."
                );
            }


            return enrollment;
        }


        // =========================
        // Validate Video Position
        // =========================

        private static int
            ValidateAndNormalizePosition(
                Lesson lesson,
                int positionSeconds)
        {
            if (positionSeconds < 0)
            {
                throw new ArgumentException(
                    "Lesson position cannot be negative."
                );
            }


            /*
             * Text lessons do not normally
             * have a duration.
             */

            if (!lesson.DurationSeconds.HasValue)
            {
                return positionSeconds;
            }


            var duration =
                lesson.DurationSeconds.Value;


            /*
             * Never save a position beyond
             * the actual lesson duration.
             */

            if (positionSeconds > duration)
            {
                return duration;
            }


            return positionSeconds;
        }


        // =========================
        // Calculate Course Progress
        // =========================

        private async Task<CourseProgressDto>
            CalculateCourseProgressAsync(
                Enrollment enrollment)
        {
            var totalLessons =
                await _progressDetailsRepo
                    .GetPublishedLessonsCountAsync(
                        enrollment.CourseId
                    );


            var completedLessons =
                await _progressDetailsRepo
                    .GetCompletedLessonsCountAsync(
                        enrollment.Id,
                        enrollment.CourseId
                    );


            /*
             * Defensive check in case
             * inconsistent data ever exists.
             */

            if (completedLessons > totalLessons)
            {
                completedLessons =
                    totalLessons;
            }


            double percentage = 0;


            if (totalLessons > 0)
            {
                percentage =
                    (double)completedLessons
                    / totalLessons
                    * 100;
            }


            percentage =
                Math.Round(
                    percentage,
                    2
                );


            var isCourseCompleted =
                totalLessons > 0 &&
                completedLessons == totalLessons;


            return new CourseProgressDto
            {
                CourseId =
                    enrollment.CourseId,

                EnrollmentId =
                    enrollment.Id,

                TotalLessons =
                    totalLessons,

                CompletedLessons =
                    completedLessons,

                ProgressPercentage =
                    percentage,

                IsCourseCompleted =
                    isCourseCompleted
            };
        }


        // =========================
        // Complete Enrollment
        // If Course = 100%
        // =========================

        private async Task
            UpdateEnrollmentCompletionAsync(
                Enrollment enrollment)
        {
            var courseProgress =
                await CalculateCourseProgressAsync(
                    enrollment
                );


            if (!courseProgress.IsCourseCompleted)
            {
                return;
            }


            // =========================
            // Complete Enrollment
            // =========================

            if (enrollment.Status !=
                CompletedStatus)
            {
                var trackedEnrollment =
                    await _enrollmentRepo
                        .GetByIdAsync(
                            enrollment.Id
                        );


                if (trackedEnrollment == null)
                {
                    throw new KeyNotFoundException(
                        "Enrollment was not found."
                    );
                }


                trackedEnrollment.Status =
                    CompletedStatus;

                trackedEnrollment.CompletedAt ??=
                    DateTime.UtcNow;


                _enrollmentRepo.Update(
                    trackedEnrollment
                );


                await _enrollmentRepo
                    .SaveChangesAsync();
            }


            // =========================
            // Issue Certificate
            // If Course Supports It
            // =========================

            if (enrollment.Course.HasCertificate)
            {
                await _certificateService
                    .IssueCertificateAsync(
                        enrollment.Id
                    );
            }
        }


        // =========================
        // Mapping
        // =========================

        private static LessonProgressDto
            MapToDto(
                LessonProgress progress)
        {
            return new LessonProgressDto
            {
                Id =
                    progress.Id,

                EnrollmentId =
                    progress.EnrollmentId,

                LessonId =
                    progress.LessonId,

                IsCompleted =
                    progress.IsCompleted,

                CompletedAt =
                    progress.CompletedAt,

                LastPositionSeconds =
                    progress.LastPositionSeconds,

                UpdatedAt =
                    progress.UpdatedAt
            };
        }
    }
}