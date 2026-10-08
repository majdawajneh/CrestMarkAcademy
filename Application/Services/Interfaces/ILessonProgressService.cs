using Application.Dto_s.LessonProgress;

namespace Application.Services.Interfaces
{
    public interface ILessonProgressService
    {
        // =========================
        // Get Lesson Progress
        // =========================

        Task<LessonProgressDto?>
            GetLessonProgressAsync(
                int userId,
                int lessonId
            );


        // =========================
        // Update Lesson Progress
        // =========================

        Task<LessonProgressDto>
            UpdateProgressAsync(
                int userId,
                int lessonId,
                UpdateLessonProgressDto dto
            );


        // =========================
        // Get Course Progress
        // =========================

        Task<CourseProgressDto>
            GetCourseProgressAsync(
                int userId,
                int courseId
            );
    }
}