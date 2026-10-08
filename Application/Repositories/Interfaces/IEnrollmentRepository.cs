using Domain.Entities.Learning;

namespace Application.Repositories.Interfaces
{
    public interface IEnrollmentRepository
    {
        Task<Enrollment?>
            GetByIdWithCourseAsync(int id);


        Task<Enrollment?>
            GetByUserAndCourseAsync(
                int userId,
                int courseId
            );


        Task<IEnumerable<Enrollment>>
            GetByUserIdWithCoursesAsync(
                int userId
            );
    }
}