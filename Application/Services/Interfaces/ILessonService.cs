using Application.Dto_s.Lesson;

namespace Application.Services.Interfaces
{
    public interface ILessonService
    {
        Task<IEnumerable<LessonDto>>
            GetBySectionIdAsync(int sectionId);

        Task<LessonDto?>
            GetByIdAsync(int id);

        Task<LessonDto>
            CreateAsync(
                int sectionId,
                CreateLessonDto dto
            );

        Task<LessonDto>
            UpdateAsync(
                int sectionId,
                int id,
                UpdateLessonDto dto
            );

        Task DeleteAsync(
            int sectionId,
            int id
        );
    }
}