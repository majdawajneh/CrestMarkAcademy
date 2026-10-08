using Application.Dto_s.CourseSection;

namespace Application.Services.Interfaces
{
    public interface ICourseSectionService
    {
        Task<IEnumerable<CourseSectionDto>>
            GetByCourseIdAsync(int courseId);

        Task<CourseSectionDto?>
            GetByIdAsync(int id);

        Task<CourseSectionDto>
            CreateAsync(
                int courseId,
                CreateCourseSectionDto dto
            );

        Task<CourseSectionDto>
            UpdateAsync(
                int courseId,
                int id,
                UpdateCourseSectionDto dto
            );

        Task DeleteAsync(
            int courseId,
            int id
        );
    }
}