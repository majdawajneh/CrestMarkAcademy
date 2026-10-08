using Application.Dto_s.Course;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseListDto>>GetAllForAdminAsync();

        Task<IEnumerable<CourseListDto>>GetPublishedAsync();

        Task<CourseDto?>GetByIdAsync(int id);

        Task<CourseDto?>GetBySlugAsync(string slug);

        Task<CourseDto>CreateAsync(CreateCourseDto dto);

        Task<CourseDto>UpdateAsync(int id,UpdateCourseDto dto);

        Task<CourseDto>PublishAsync(int id);

        Task<CourseDto>UnpublishAsync(int id);

        Task<CourseDto>ArchiveAsync(int id);

        Task<CourseDto>RestoreToDraftAsync(int id);
    }
}
