using Application.Dto_s.CourseLearningOutcome;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICourseLearningOutcomeService
    {
        Task<IEnumerable<CourseLearningOutcomeDto>>GetByCourseIdAsync(int courseId);

        Task<CourseLearningOutcomeDto?>GetByIdAsync(int id);

        Task<CourseLearningOutcomeDto>CreateAsync(int courseId,CreateCourseLearningOutcomeDto dto);

        Task<CourseLearningOutcomeDto>UpdateAsync(int courseId,int id,UpdateCourseLearningOutcomeDto dto);

        Task DeleteAsync(int courseId,int id);
    }
}
