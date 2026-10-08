using Application.Dto_s.CourseRequirement;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICourseRequirementService
    {
        Task<IEnumerable<CourseRequirementDto>>GetByCourseIdAsync(int courseId);

        Task<CourseRequirementDto?>GetByIdAsync(int id);

        Task<CourseRequirementDto>CreateAsync(int courseId,CreateCourseRequirementDto dto);

        Task<CourseRequirementDto>UpdateAsync(int courseId,int id,UpdateCourseRequirementDto dto);

        Task DeleteAsync(int courseId,int id);
    }
}
