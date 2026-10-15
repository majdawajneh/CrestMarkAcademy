
using Application.Dto_s.Enrollment;

namespace Application.Services.Interfaces
{
    public interface IEnrollmentService
    {
        Task<EnrollmentDto?>
            GetByIdAsync(int id);

        Task<EnrollmentDto?>
            GetByUserAndCourseAsync(
                int userId,
                int courseId
            );

        Task<IEnumerable<MyCourseDto>>
            GetMyCoursesAsync(int userId);

        Task<EnrollmentDto>
            EnrollUserAsync(
                int userId,
                int courseId
            );

        Task<EnrollmentDto>
            CancelAsync(int id);

        Task<EnrollmentDto>
            ReactivateAsync(int id);

        Task<bool>
            HasActiveEnrollmentAsync(
                int userId,
                int courseId
            );

        // Get the last lesson opened by this student
        // in the specified course.
        Task<int?>
            GetLastAccessedLessonAsync(
                int userId,
                int courseId
            );

        // Save the lesson explicitly selected by
        // the student after validating access.
        Task SetLastAccessedLessonAsync(
            int userId,
            int courseId,
            int lessonId
        );

        Task<List<EnrollmentDto>> GetAllForAdminAsync();

        Task<List<EnrollmentDto>> GetByUserIdForAdminAsync(int userId);
    }
}
