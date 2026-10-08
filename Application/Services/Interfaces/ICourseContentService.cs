using Application.Dto_s.CourseContent;

namespace Application.Services.Interfaces
{
    public interface ICourseContentService
    {
        Task<CourseContentDto?>GetCourseContentAsync(string slug,int? userId);
    }
}