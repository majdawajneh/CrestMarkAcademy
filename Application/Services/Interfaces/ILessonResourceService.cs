using Application.Dto_s.LessonResource;

namespace Application.Services.Interfaces
{
    public interface ILessonResourceService
    {
        Task<IEnumerable<LessonResourceDto>>
            GetByLessonIdAsync(int lessonId);

        Task<LessonResourceDto?>
            GetByIdAsync(int id);

        Task<LessonResourceDto>
            CreateAsync(
                int lessonId,
                CreateLessonResourceDto dto
            );

        Task<LessonResourceDto>
            UpdateAsync(
                int lessonId,
                int id,
                UpdateLessonResourceDto dto
            );

        Task DeleteAsync(
            int lessonId,
            int id
        );
    }
}