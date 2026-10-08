using Application.Dto_s.CourseContent;
using Application.Repositories.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities.Learning;


namespace Application.Services
{
    public class CourseContentService
        : ICourseContentService
    {
        private readonly
            ICourseRepository
            _courseRepository;

        private readonly
            IGenericRepository<Enrollment>
            _enrollmentRepository;


        // =========================
        // Constructor
        // =========================

        public CourseContentService(
            ICourseRepository courseRepository,
            IGenericRepository<Enrollment> enrollmentRepository)
        {
            _courseRepository = courseRepository;
            _enrollmentRepository = enrollmentRepository;
        }


        // =========================
        // Get Course Content
        // =========================

        public async Task<CourseContentDto?>
            GetCourseContentAsync(
                string slug,
                int? userId)
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                return null;
            }


            var normalizedSlug =
                slug.Trim()
                    .ToLowerInvariant();


            // Get published course
            // with Sections + Lessons

            var course =
                await _courseRepository
                    .GetPublishedContentBySlugAsync(
                        normalizedSlug
                    );


            if (course == null)
            {
                return null;
            }


            // =========================
            // Check Enrollment
            // =========================

            var isEnrolled = false;


            if (userId.HasValue)
            {
                isEnrolled =
                    await _enrollmentRepository
                        .ExistsAsync(
                            e =>
                                e.UserId == userId.Value &&
                                e.CourseId == course.Id &&
                                (
                                    e.Status == "Active" ||
                                    e.Status == "Completed"
                                )
                        );
            }


            // =========================
            // Map Content
            // =========================

            var sections =
                course.CourseSections
                    .OrderBy(s => s.OrderIndex)
                    .Select(section =>
                        new CourseContentSectionDto
                        {
                            Id =
                                section.Id,

                            Title =
                                section.Title,

                            Description =
                                section.Description,

                            OrderIndex =
                                section.OrderIndex,

                            Lessons =
                                section.Lessons
                                    .Where(l =>
                                        l.IsPublished
                                    )
                                    .OrderBy(l =>
                                        l.OrderIndex
                                    )
                                    .Select(lesson =>
                                    {
                                        var canAccess =
                                            isEnrolled ||
                                            lesson.IsPreview;


                                        return new CourseContentLessonDto
                                        {
                                            Id =
                                                lesson.Id,

                                            Title =
                                                lesson.Title,

                                            Description =
                                                lesson.Description,

                                            LessonType =
                                                lesson.LessonType,

                                            DurationSeconds =
                                                lesson.DurationSeconds,

                                            OrderIndex =
                                                lesson.OrderIndex,

                                            IsPreview =
                                                lesson.IsPreview,

                                            IsLocked =
                                                !canAccess,


                                            VideoUrl =
                                                canAccess
                                                    ? lesson.VideoUrl
                                                    : null,

                                            AudioUrl =
                                                canAccess
                                                    ? lesson.AudioUrl
                                                    : null,

                                            Content =
                                                canAccess
                                                    ? lesson.Content
                                                    : null
                                        };
                                    })
                                    .ToList()
                        })
                    .ToList();


            return new CourseContentDto
            {
                CourseId =
                    course.Id,

                Title =
                    course.Title,

                Slug =
                    course.Slug,

                IsEnrolled =
                    isEnrolled,

                Sections =
                    sections
            };
        }
    }
}