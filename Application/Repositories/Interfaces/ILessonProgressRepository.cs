using Domain.Entities.Catalog;

namespace Application.Repositories.Interfaces
{
    public interface ILessonProgressRepository
    {
        Task<Lesson?>
            GetLessonWithCourseAsync(
                int lessonId
            );


        Task<int>
            GetPublishedLessonsCountAsync(
                int courseId
            );


        Task<int>
            GetCompletedLessonsCountAsync(
                int enrollmentId,
                int courseId
            );
    }
}